#!/usr/bin/env python3
"""Synthèse des effets sonores de Ligne de Front : aucun échantillon, tout est calculé.

Usage :
    python3 tools/generer_sons.py                       # écrit dans src/ui/assets/sons/
    python3 tools/generer_sons.py --out /tmp/sons       # autre dossier
    python3 tools/generer_sons.py --only clic,impact    # seulement certains sons

Sortie : des .ogg mono (ffmpeg avec libvorbis requis), aux noms attendus par src/ui/sound.ts (docs/SONS.md).
Les variantes (`attaque-1.ogg`, `attaque-2.ogg`…) sont tirées au hasard par le jeu.
Palette : do mineur / mi bémol majeur ; timbres de bois, de métal, de cloche et de cuivre doux.
Les graines sont fixes : relancer le script redonne exactement les mêmes fichiers.
Pour changer un son, modifier sa fonction s_<nom> plus bas, ou son réglage de volume dans SONS.
"""
import argparse
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 44100
TARGET_RMS_DB = -20.0   # niveau de référence (RMS de la partie active) avant le réglage propre à chaque son
PEAK_CEIL_DB = -1.0     # aucun son ne dépasse ce pic

# ---------------------------------------------------------------- outils


NOTES = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}


def hz(note: str) -> float:
    """'Eb5' → fréquence en Hz."""
    midi = 12 * (int(note[-1]) + 1) + NOTES[note[:-1]]
    return 440.0 * 2 ** ((midi - 69) / 12)


def N(d: float) -> int:
    return int(round(d * SR))


def T(d: float) -> np.ndarray:
    return np.arange(N(d)) / SR


def unit(x: np.ndarray) -> np.ndarray:
    """Bruit ramené à un écart-type de 0,33 (pics autour de 1)."""
    s = np.std(x)
    return 0.33 * x / s if s > 0 else x


def _sos(kind, f, order):
    return signal.butter(order, f, kind, fs=SR, output='sos')


def bp(x, lo, hi, o=2):
    return signal.sosfilt(_sos('band', [lo, min(hi, SR * 0.45)], o), x)


def lp(x, f, o=2):
    return signal.sosfilt(_sos('low', min(f, SR * 0.45), o), x)


def hp(x, f, o=2):
    return signal.sosfilt(_sos('high', f, o), x)


def ad(d, a=0.002, dec=0.1):
    """Attaque courte puis décroissance exponentielle."""
    t = T(d)
    return np.minimum(1, t / max(a, 1e-5)) * np.exp(-t / dec)


def osc(f, shape='sine'):
    """Oscillateur à fréquence variable (f : tableau, une valeur par échantillon)."""
    ph = 2 * np.pi * np.cumsum(f) / SR
    if shape == 'saw':
        return signal.sawtooth(ph)
    if shape == 'tri':
        return signal.sawtooth(ph, 0.5)
    return np.sin(ph)


def tone(f, d, shape='sine'):
    return osc(np.full(N(d), float(f)), shape)


def sweep(f0, f1, d, tau):
    t = T(d)
    return f1 + (f0 - f1) * np.exp(-t / tau)


def mix(*parts):
    """parts : (début en s, signal, gain)."""
    end = max(N(s) + len(a) for s, a, g in parts)
    out = np.zeros(end)
    for s, a, g in parts:
        i = N(s)
        out[i:i + len(a)] += a * g
    return out


def reverb(x, r, rt=0.6, wet=0.5, damp=4500):
    """Petite salle : réponse impulsionnelle de bruit décroissant, d'énergie unitaire."""
    n = N(rt)
    t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-6.9 * t / rt)
    ir = lp(ir, damp, 1)
    k = N(0.01)
    ir[:k] *= np.linspace(0, 1, k)
    ir /= np.sqrt((ir ** 2).sum())
    y = signal.fftconvolve(x, ir)
    out = np.zeros(len(y))
    out[:len(x)] = x
    return out + wet * y


# ---------------------------------------------------------------- timbres

BELL = ((1, 1.0), (2.01, 0.3), (2.76, 0.45), (5.4, 0.22), (8.93, 0.1))


def bell(f, d, dec, r):
    """Cloche : partiels inharmoniques, les aigus s'éteignent plus vite."""
    t = T(d)
    out = np.zeros_like(t)
    for ratio, a in BELL:
        ff = f * ratio
        if ff > 15000:
            continue
        out += a * np.sin(2 * np.pi * ff * t + r.uniform(0, 2 * np.pi)) * np.exp(-t / (dec / (1 + 0.45 * (ratio - 1))))
    return 0.6 * out * np.minimum(1, t / 0.0008)


def pluck(f, d, dec, bright, r):
    """Corde pincée (harpe) : harmoniques qui s'éteignent d'autant plus vite qu'elles sont aiguës."""
    t = T(d)
    out = np.zeros_like(t)
    for k in range(1, 9):
        if f * k > 12000:
            break
        out += (bright ** (k - 1)) / k ** 0.7 * np.sin(2 * np.pi * f * k * t * (1 + 0.0004 * k * k) + r.uniform(0, 6.28)) \
            * np.exp(-t / (dec / (1 + 0.6 * (k - 1))))
    return 0.7 * out * np.minimum(1, t / 0.002)


def mallet(f, d, r):
    """Maillet sur lame de bois (marimba doux)."""
    t = T(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.22) \
        + 0.5 * np.sin(2 * np.pi * f * 3.99 * t) * np.exp(-t / 0.05) \
        + 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / 0.02)
    tick = unit(bp(r.standard_normal(len(t)), 1500, 5000)) * np.exp(-t / 0.004) * 0.5
    return (0.7 * x + tick) * np.minimum(1, t / 0.0008)


def brass(f, d, r, a=0.03, rel=0.12, bright=5.0):
    """Cuivre doux : trois dents de scie désaccordées, filtrées."""
    t = T(d)
    x = tone(f, d, 'saw') + tone(f * 1.005, d, 'saw') + tone(f * 0.995, d, 'saw')
    x = lp(x, min(f * bright, 5000), 2)
    e = np.minimum(1, t / a) * np.minimum(1, (d - t) / rel)
    return x * e * 0.3


def swish(d, lo, hi, r, a=1.5, b=1.5, tex=0.5):
    """Froissement de carte : bruit filtré, enveloppe asymétrique, texture de papier."""
    n = N(d)
    t = np.arange(n) / SR / d
    shape = (t ** a) * ((1 - t) ** b)
    shape /= shape.max()
    x = unit(bp(r.standard_normal(n), lo, hi))
    am = 1 + tex * unit(lp(r.standard_normal(n), 220, 1)) / 0.33
    return x * np.clip(am, 0, None) * shape * 1.5


def whoosh(d, lo, hi, r, direction=1, nb=4):
    """Souffle d'une arme qui passe : bandes de bruit dont le sommet se décale (montant ou descendant)."""
    t = T(d)
    edges = np.geomspace(lo, hi, nb + 1)
    out = np.zeros_like(t)
    w = d * 0.2
    for i in range(nb):
        k = i / (nb - 1) if nb > 1 else 0.5
        tp = d * ((0.28 + 0.42 * k) if direction > 0 else (0.70 - 0.42 * k))
        x = unit(bp(r.standard_normal(len(t)), edges[i], edges[i + 1]))
        out += x * np.exp(-((t - tp) / w) ** 2) * (1.0 - 0.45 * k)
    return out * 1.6


def thud(f0, f1, d, dec, r, click=0.5, tau=0.025):
    """Coup sourd : grave qui chute en hauteur + un peu de claquement."""
    t = T(d)
    f = f1 + (f0 - f1) * np.exp(-t / tau)
    body = (osc(f) + 0.4 * osc(2 * f) * np.exp(-t / (dec * 0.5)) + 0.15 * osc(3.1 * f) * np.exp(-t / (dec * 0.3))) * np.exp(-t / dec)
    body *= np.minimum(1, t / 0.001)
    nse = unit(bp(r.standard_normal(len(t)), 500, 2600)) * np.exp(-t / 0.008) * click * 0.55
    return 0.7 * body + nse


def clang(f, d, dec, r):
    """Choc métallique (armure, bouclier)."""
    t = T(d)
    out = np.zeros_like(t)
    for ratio, a in ((1, 1.0), (2.32, 0.7), (3.86, 0.5), (5.43, 0.35), (7.12, 0.22)):
        ff = f * ratio * (1 + r.uniform(-0.004, 0.004))
        if ff > 14000:
            continue
        out += a * np.sin(2 * np.pi * ff * t + r.uniform(0, 6.28)) * np.exp(-t / (dec / (1 + 0.35 * (ratio - 1))))
    tr = unit(hp(r.standard_normal(len(t)), 3000)) * np.exp(-t / 0.004) * 0.9
    return 0.35 * out + tr


def crackles(d, r, count, tau, lo=400, hi=2800):
    """Éclats de débris : petites bouffées de bruit, de moins en moins nombreuses."""
    out = np.zeros(N(d))
    for _ in range(count):
        tt = r.exponential(tau)
        i = N(tt)
        L = N(r.uniform(0.002, 0.01))
        if i + L >= len(out):
            continue
        b = unit(bp(r.standard_normal(L), lo * r.uniform(0.7, 1.4), hi * r.uniform(0.7, 1.2), 1)) * np.hanning(L)
        out[i:i + L] += b * 1.3 * r.uniform(0.2, 1.0) * np.exp(-tt / (tau * 1.5))
    return lp(out, 3500, 2)


def vtone(f, d, r, rate=5.5, depth=0.012):
    """Note triangle avec léger vibrato, adoucie."""
    t = T(d)
    x = osc(f * (1 + depth * np.sin(2 * np.pi * rate * t)), 'tri')
    return lp(x, 2200, 1) * ad(d, 0.012, d / 3)


# ---------------------------------------------------------------- les sons : s_<nom>(rng, variante) → signal


def s_clic(r, v):
    k = [1.0, 1.04, 0.96][v]
    d = 0.06
    tick = unit(bp(r.standard_normal(N(d)), 1800 * k, 5200 * k)) * ad(d, 0.0004, 0.006) * 1.2
    body = osc(sweep(900 * k, 520 * k, d, 0.012)) * ad(d, 0.0004, 0.014) * 0.5
    chime = bell(hz(['Eb6', 'G6', 'C6'][v]), 0.25, 0.07, r) * 0.3
    return mix((0, tick, 1), (0, body, 1), (0.004, chime, 1))


def s_deploiement(r, v):
    sw = swish(0.16, [1800, 2400, 1500][v], [6500, 7500, 5500][v], r, a=1.6, b=1.2)
    th = thud(150 * [1, 1.1, 0.92][v], 62, 0.4, 0.09, r, click=0.6)
    dust = unit(bp(r.standard_normal(N(0.2)), 300, 1200)) * ad(0.2, 0.001, 0.04) * 0.4
    return reverb(mix((0, sw, 0.5), (0.12, th, 1.0), (0.12, dust, 1)), r, 0.25, 0.3)


def s_tactique(r, v):
    notes = [['C6', 'Eb6', 'G6', 'C7'], ['Eb6', 'G6', 'Bb6', 'Eb7']][v]
    parts = [(0, swish(0.22, 2500, 9000, r, 1.2, 2.0), 0.45)]
    for i, nm in enumerate(notes):
        parts.append((0.07 + 0.055 * i, bell(hz(nm), 0.5, 0.16, r), 0.34 - 0.04 * i))
    return reverb(mix(*parts), r, 0.5, 0.6)


def s_leader(r, v):
    sw = swish(0.16, 1500, 5500, r, 1.6, 1.2)
    b1 = brass(hz('C4'), 0.42, r, a=0.02, rel=0.1)
    b2 = brass(hz('G4'), 0.6, r, a=0.02, rel=0.25)
    ch = bell(hz('G5'), 0.7, 0.2, r) * 0.25
    th = thud(130, 58, 0.35, 0.08, r)
    return reverb(mix((0, sw, 0.4), (0.1, th, 0.8), (0.14, b1, 0.8), (0.30, b2, 0.9), (0.30, ch, 1)), r, 0.5, 0.5)


def s_pioche(r, v):
    sw = swish(0.2, [2200, 1800, 2600][v], 8500, r, 1.4, 1.6)
    tap = thud(240 * [1, 0.93, 1.08][v], 130, 0.12, 0.025, r, click=0.4)
    return mix((0, sw, 0.7), (0.13, tap, 0.35))


def s_defausse(r, v):
    sw = swish(0.24, [1200, 1500][v], 5000, r, 0.9, 2.2)
    tap = thud(180, 100, 0.12, 0.03, r, click=0.3)
    return mix((0, sw, 0.6), (0.17, tap, 0.2))


def s_tour(r, v):
    n1 = mallet(hz('C5'), 0.5, r)
    n2 = mallet(hz('G5'), 0.7, r)
    return reverb(mix((0, n1, 0.8), (0.11, n2, 1.0)), r, 0.5, 0.5)


def s_combat(r, v):
    d1 = thud(115, 46, 0.7, 0.20, r, click=0.8, tau=0.04)
    d2 = thud(125, 50, 0.7, 0.20, r, click=0.8, tau=0.04)
    h = brass(hz('C3'), 1.1, r, a=0.28, rel=0.5, bright=7) + brass(hz('G3'), 1.1, r, a=0.30, rel=0.5, bright=7)
    return reverb(mix((0, d1, 1.0), (0.22, d2, 0.9), (0.1, h, 0.55)), r, 0.7, 0.5)


def s_attaque(r, v):
    d = [0.34, 0.30, 0.38][v]
    w = whoosh(d, [500, 600, 420][v], [6500, 7500, 6000][v], r, +1)
    shing = bell(hz(['G6', 'Bb6', 'D7'][v]), 0.22, 0.05, r) * 0.25
    return mix((0, w, 1), (0, shing, 1))


def s_attaque_distance(r, v):
    tw = pluck(hz(['G3', 'Eb3'][v]), 0.25, 0.09, 0.8, r)
    w = whoosh(0.28, 1800, 9000, r, -1, nb=3)
    return mix((0, tw, 0.9), (0.03, w, 0.7))


def s_impact(r, v):
    th = thud([135, 118, 152][v], 52, 0.4, 0.07, r, click=1.0, tau=0.02)
    crack = unit(bp(r.standard_normal(N(0.08)), 1200, 6000)) * ad(0.08, 0.0005, 0.012) * 1.4
    flesh = unit(lp(r.standard_normal(N(0.2)), 900)) * ad(0.2, 0.001, 0.05) * 1.0
    return mix((0, th, 1), (0, crack, 0.8), (0, flesh, 0.4))


def s_bloque(r, v):
    cl = clang([880, 1040][v], 0.6, 0.25, r)
    th = thud(160, 70, 0.2, 0.04, r, click=0.4)
    return mix((0, cl, 1), (0, th, 0.5))


def s_destruction(r, v):
    d = 1.0
    t = T(d)
    th = thud(150, 38, d, 0.28, r, click=0.9, tau=0.12)
    rum = unit(lp(r.standard_normal(N(d)), 420)) * np.exp(-t / 0.28) * (1 - np.exp(-t / 0.01)) * 3
    deb = crackles(d, r, [70, 90][v], 0.35)
    return mix((0, th, 0.9), (0, rum, 0.7), (0.05, deb, 0.5))


def s_fuite(r, v):
    parts = [(0.07 * i, pluck(hz(nm), 0.3, 0.1, 0.5, r), 0.7 - 0.1 * i) for i, nm in enumerate(['G4', 'Eb4', 'C4', 'G3'])]
    parts.append((0, whoosh(0.5, 300, 4000, r, -1, nb=3), 0.5))
    return mix(*parts)


def s_destruction_leader(r, v):
    base = s_destruction(r, 0)
    toll = bell(hz('C3'), 1.4, 0.55, r)
    return reverb(mix((0, base, 1.0), (0.05, toll, 0.5)), r, 0.8, 0.4)


def s_moral(r, v):
    t1 = vtone(hz('Eb5'), 0.3, r)
    t2 = vtone(hz('D5'), 0.45, r)
    th = thud(110, 60, 0.25, 0.05, r, click=0.2)
    return mix((0, t1, 0.6), (0.17, t2, 0.7), (0.17, th, 0.4))


def s_soin(r, v):
    parts = [(0.075 * i, pluck(hz(nm), 0.55, 0.25, 0.6, r), 0.55) for i, nm in enumerate(['C5', 'G5', 'C6', 'Eb6'])]
    parts.append((0.22, bell(hz('G6'), 0.6, 0.2, r), 0.2))
    return reverb(mix(*parts), r, 0.5, 0.6)


def s_sonne(r, v):
    d = 0.9
    t = T(d)
    f = hz('G6') * (1 + 0.015 * np.sin(2 * np.pi * 9 * t))
    f2 = hz('G6') * 1.012 * (1 + 0.015 * np.sin(2 * np.pi * 7 * t + 1))
    b1 = osc(f) * ad(d, 0.002, 0.25) * 0.5 + osc(f * 2.76) * ad(d, 0.002, 0.1) * 0.2
    b2 = osc(f2) * ad(d, 0.002, 0.25) * 0.4
    th = thud(200, 90, 0.2, 0.04, r, click=1.0)
    return mix((0, th, 0.8), (0.02, b1 + b2, 0.6))


def s_sacrifice(r, v):
    rev = bell(hz('C5'), 0.6, 0.35, r)[::-1]
    low = thud(100, 40, 0.7, 0.2, r, click=0.3, tau=0.05)
    drone = (tone(hz('C3'), 0.9, 'tri') + tone(hz('G3'), 0.9, 'tri') * 0.6) * ad(0.9, 0.05, 0.3) * 0.3
    return reverb(mix((0, rev, 0.5), (0.58, low, 1), (0.58, drone, 0.5)), r, 0.7, 0.5)


def s_lassitude(r, v):
    d = 0.9
    t = T(d)
    sigh = unit(bp(r.standard_normal(N(d)), 350, 1600)) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * 1.0
    glide = lp(osc(sweep(330, 196, d, 0.35), 'tri') * ad(d, 0.03, 0.4) * 0.35, 1200)
    return mix((0, sigh, 1), (0, glide, 1))


def s_niveau(r, v):
    notes = ['C5', 'Eb5', 'G5', 'Bb5', 'C6', 'Eb6']
    parts = []
    for i, nm in enumerate(notes):
        parts.append((0.065 * i, pluck(hz(nm), 0.5, 0.2, 0.6, r), 0.6))
        parts.append((0.065 * i, bell(hz(nm), 0.5, 0.15, r), 0.25))
    for nm in ['C6', 'G6', 'Eb7']:
        parts.append((0.42, bell(hz(nm), 0.7, 0.3, r), 0.3))
    return reverb(mix(*parts), r, 0.6, 0.7)


def s_victoire(r, v):
    parts = [(0, thud(115, 46, 0.7, 0.2, r, click=0.8, tau=0.04), 0.9)]
    for i, nm in enumerate(['Eb4', 'G4', 'Bb4']):
        parts.append((0.2 * i, brass(hz(nm), 0.3, r, a=0.02, rel=0.08), 0.9))
    for nm in ['Eb4', 'Bb4', 'Eb5', 'G5']:
        parts.append((0.62, brass(hz(nm), 1.2, r, a=0.04, rel=0.7), 0.6))
    parts.append((0.62, thud(115, 46, 0.7, 0.2, r, click=0.8, tau=0.04), 0.9))
    parts.append((0.65, bell(hz('Eb6'), 1.2, 0.5, r), 0.3))
    parts.append((0.65, bell(hz('Bb6'), 1.2, 0.4, r), 0.2))
    return reverb(mix(*parts), r, 0.9, 0.7)


def s_defaite(r, v):
    parts = []
    for i, nm in enumerate(['G4', 'Eb4', 'C4']):
        parts.append((0.32 * i, brass(hz(nm), 0.5, r, a=0.06, rel=0.25, bright=3), 0.9))
    for nm in ['C3', 'G3', 'Eb3']:
        parts.append((0.95, brass(hz(nm), 1.1, r, a=0.1, rel=0.7, bright=4), 0.7))
    parts.append((0.95, thud(95, 40, 0.9, 0.3, r, click=0.5, tau=0.06), 0.9))
    return reverb(mix(*parts), r, 0.9, 0.7)


# nom du fichier → (fonction, nombre de variantes, réglage de volume en dB, durée maximale en s)
SONS = {
    'clic': (s_clic, 3, -5, 0.4),
    'deploiement': (s_deploiement, 3, -1, 0.9),
    'tactique': (s_tactique, 2, -3, 1.2),
    'leader': (s_leader, 1, 0, 1.4),
    'pioche': (s_pioche, 3, -4, 0.5),
    'defausse': (s_defausse, 2, -6, 0.5),
    'tour': (s_tour, 1, -3, 1.2),
    'combat': (s_combat, 1, 0, 1.5),
    'attaque': (s_attaque, 3, -2, 0.7),
    'attaque-distance': (s_attaque_distance, 2, -3, 0.6),
    'impact': (s_impact, 3, 0, 0.7),
    'bloque': (s_bloque, 2, -1, 0.9),
    'destruction': (s_destruction, 2, 1, 1.5),
    'fuite': (s_fuite, 1, -3, 0.9),
    'destruction-leader': (s_destruction_leader, 1, 1, 1.5),
    'moral': (s_moral, 1, -3, 0.9),
    'soin': (s_soin, 1, -4, 1.2),
    'sonne': (s_sonne, 1, -4, 1.0),
    'sacrifice': (s_sacrifice, 1, -1, 1.5),
    'lassitude': (s_lassitude, 1, -5, 1.0),
    'niveau': (s_niveau, 1, -3, 1.5),
    'victoire': (s_victoire, 1, 0, 2.4),
    'defaite': (s_defaite, 1, 0, 2.4),
}

# ---------------------------------------------------------------- finition et écriture


def finish(x, off_db, maxdur):
    """Centre, rogne le silence final, fondu de sortie, niveau (RMS de la partie active) et plafond de pic."""
    x = np.nan_to_num(x)
    x = x - x.mean()
    x = hp(x, 30, 2)
    pk = np.abs(x).max()
    keep = np.where(np.abs(x) > pk * 10 ** (-42 / 20))[0]
    x = x[:keep[-1] + 1][:N(maxdur)].copy()
    fo = min(N(0.06), len(x) // 3)
    x[-fo:] *= 0.5 * (1 + np.cos(np.linspace(0, np.pi, fo)))
    fi = min(N(0.0015), len(x) // 4)
    x[:fi] *= np.linspace(0, 1, fi)
    pk = np.abs(x).max()
    act = np.abs(x) > 0.05 * pk
    rms = np.sqrt(np.mean(x[act] ** 2))
    g = 10 ** ((TARGET_RMS_DB + off_db) / 20) / rms
    g = min(g, 10 ** (PEAK_CEIL_DB / 20) / pk)
    return x * g


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', default='src/ui/assets/sons', help='dossier de sortie')
    ap.add_argument('--only', default='', help='liste de sons séparés par des virgules (ex. clic,impact)')
    ap.add_argument('--bitrate', default='80k')
    a = ap.parse_args()
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    only = {s.strip() for s in a.only.split(',') if s.strip()}
    unknown = only - set(SONS)
    if unknown:
        sys.exit(f'sons inconnus : {", ".join(sorted(unknown))}')
    print(f'{"fichier":28} {"durée":>6} {"pic dB":>7} {"rms dB":>7} {"Ko":>5}')
    with tempfile.TemporaryDirectory() as tmp:
        for name, (fn, nvar, off, maxd) in SONS.items():
            if only and name not in only:
                continue
            for v in range(nvar):
                fname = name if nvar == 1 else f'{name}-{v + 1}'
                r = np.random.default_rng(zlib.crc32(f'{name}-{v}'.encode()))
                x = finish(fn(r, v), off, maxd)
                wav = Path(tmp) / f'{fname}.wav'
                wavfile.write(wav, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))
                dst = out / f'{fname}.ogg'
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-ac', '1', '-c:a', 'libvorbis',
                                '-b:a', a.bitrate, str(dst)], check=True)
                act = np.abs(x) > 0.05 * np.abs(x).max()
                print(f'{fname + ".ogg":28} {len(x) / SR:5.2f}s {20 * np.log10(np.abs(x).max()):7.1f} '
                      f'{20 * np.log10(np.sqrt(np.mean(x[act] ** 2))):7.1f} {dst.stat().st_size / 1024:5.1f}')


if __name__ == '__main__':
    main()
