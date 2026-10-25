// Sons et musiques. Les fichiers se déposent dans src/ui/assets/sons/ (effets) et src/ui/assets/musiques/ (musiques) ;
// leur nom dit quand ils sont joués (liste et procédure : docs/SONS.md). Un fichier absent est simplement ignoré.
// Variantes : « attaque-1.ogg », « attaque-2.ogg »… sont tirées au hasard pour le son « attaque ».
import { card } from '../engine/ctx';
import type { GameEvent, PlayerId } from '../engine/types';

const SFX_FILES = import.meta.glob('./assets/sons/*.{ogg,mp3,wav,m4a}', { eager: true, import: 'default' }) as Record<string, string>;
const MUSIC_FILES = import.meta.glob('./assets/musiques/*.{ogg,mp3,m4a,wav}', { eager: true, import: 'default' }) as Record<string, string>;

/** nom du son (sans variante ni extension) → fichiers. */
function index(files: Record<string, string>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [path, url] of Object.entries(files)) {
    const name = path.split('/').pop()!.replace(/\.[a-z0-9]+$/i, '').toLowerCase();
    const key = name.replace(/-\d+$/, '');
    (out[key] ??= []).push(url);
  }
  return out;
}
const SFX = index(SFX_FILES);
const MUSIC = index(MUSIC_FILES);
export const hasSound = (key: string) => !!SFX[key.toLowerCase()];
export const hasMusic = (key: string) => !!MUSIC[key.toLowerCase()];

// ---------- Réglages ----------
let sfxVolume = 0.7, musicVolume = 0.4, muted = false;
export function setSoundOptions(o: { sfxVolume?: number; musicVolume?: number; muted?: boolean }): void {
  sfxVolume = o.sfxVolume ?? 0.7;
  musicVolume = o.musicVolume ?? 0.4;
  muted = !!o.muted;
  applyMusicVolume();
}

// Les navigateurs bloquent le son tant que le joueur n'a pas cliqué : on attend la première interaction.
let unlocked = false;
if (typeof window !== 'undefined') {
  const unlock = () => { unlocked = true; window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); refreshMusic(); };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  // Clic sur un bouton de l'interface (son « clic », s'il existe).
  window.addEventListener('click', e => { if ((e.target as HTMLElement | null)?.closest?.('button:not(:disabled)')) playSound('clic'); }, true);
}

// ---------- Effets sonores ----------
const lastPlayed = new Map<string, number>();
let playing = 0;
const MAX_AT_ONCE = 6;

/** Joue le premier son existant de la liste (ex. ['carte-dragon_infernal', 'deploiement']). Renvoie le son joué. */
export function playSound(keys: string | string[], gain = 1): string | null {
  if (muted || !unlocked || sfxVolume <= 0 || typeof Audio === 'undefined') return null;
  const key = (Array.isArray(keys) ? keys : [keys]).map(k => k.toLowerCase()).find(k => SFX[k]);
  if (!key) return null;
  const now = performance.now();
  if (now - (lastPlayed.get(key) ?? -1e9) < 70 || playing >= MAX_AT_ONCE) return null; // pas de mitraillage du même son
  lastPlayed.set(key, now);
  const list = SFX[key]!;
  const a = new Audio(list[Math.floor(Math.random() * list.length)]!);
  a.volume = Math.max(0, Math.min(1, sfxVolume * gain));
  playing++;
  const done = () => { playing = Math.max(0, playing - 1); a.onended = a.onerror = null; };
  a.onended = done; a.onerror = done;
  a.play().catch(done);
  return key;
}

/** Joue une suite de sons légèrement décalés (un seul exemplaire de chacun). */
export function playSounds(list: string[][], gap = 90): void {
  const seen = new Set<string>();
  let k = 0;
  for (const keys of list) {
    const id = keys.join('|');
    if (seen.has(id)) continue;
    seen.add(id);
    const delay = k++ * gap;
    if (delay) setTimeout(() => playSound(keys), delay); else playSound(keys);
  }
}

// ---------- Sons des événements de partie ----------
/** Sons d'une liste d'événements du moteur, dans l'ordre (chaque entrée : sons candidats, du plus précis au plus général).
 *  `me` : le joueur de cet écran (pour victoire / défaite), null en partie à deux sur le même écran. */
export function soundsFor(events: GameEvent[], me: PlayerId | null): string[][] {
  const out: string[][] = [];
  for (const e of events) {
    switch (e.type) {
      case 'cardPlayed': {
        const t = card(e.cardId).cardType;
        out.push([`carte-${e.cardId}`, t === 'Tactique' ? 'tactique' : t === 'Leader' ? 'leader' : 'deploiement']);
        break;
      }
      case 'deployed': out.push(['deploiement']); break;
      case 'attack': {
        const a = card(e.attackerCard);
        const dist = (a.keywords ?? []).includes('Distance');
        out.push([`attaque-${e.attackerCard}`, dist ? 'attaque-distance' : 'attaque', 'attaque']);
        out.push(e.damage > 0 ? ['impact'] : ['bloque', 'impact']);
        break;
      }
      case 'destroyed': out.push([`destruction-${e.cardId}`, e.cause === 'moral' ? 'fuite' : 'destruction', 'destruction']); break;
      case 'heal': out.push(['soin']); break;
      case 'moralLoss': out.push(['moral']); break;
      case 'stunned': out.push(['sonne']); break;
      case 'sacrificed': out.push(['sacrifice']); break;
      case 'lassitude': out.push(['lassitude']); break;
      case 'levelUp': out.push(['niveau']); break;
      case 'draw': out.push(['pioche']); break;
      case 'discarded': out.push(['defausse']); break;
      case 'leaderDestroyed': out.push(['destruction-leader', 'destruction']); break;
      case 'turnStart': out.push(['tour']); break;
      case 'combatStart': out.push(['combat']); break;
      case 'effect': out.push([`effet-${e.key}`]); break;
      case 'gameOver': out.push(me === null ? ['victoire'] : e.winner === me ? ['victoire'] : ['defaite']); break;
      default: break;
    }
  }
  return out;
}

// ---------- Musique ----------
// Chaque écran demande une musique (liste de candidats, du plus précis au plus général) ; la dernière demande active gagne.
// Changement de morceau en fondu ; un morceau boucle.
interface Request { id: number; keys: string[] }
let requests: Request[] = [];
let nextId = 1;
let current: { key: string; el: HTMLAudioElement } | null = null;
const FADE_MS = 900;

/** Demande une musique ; renvoie de quoi retirer la demande. */
export function requestMusic(keys: string[]): () => void {
  const r = { id: nextId++, keys: keys.map(k => k.toLowerCase()) };
  requests.push(r);
  scheduleRefresh();
  return () => { requests = requests.filter(x => x.id !== r.id); scheduleRefresh(); };
}
// Un changement d'écran retire une demande puis en ajoute une autre : on regroupe, pour ne pas couper un morceau
// qui continue sur le nouvel écran.
let refreshQueued = false;
function scheduleRefresh(): void {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(() => { refreshQueued = false; refreshMusic(); });
}

function wanted(): string | null {
  for (let i = requests.length - 1; i >= 0; i--) {
    const k = requests[i]!.keys.find(x => MUSIC[x]);
    if (k) return k;
  }
  return null;
}
function fade(el: HTMLAudioElement, to: number, then?: () => void): void {
  const from = el.volume, t0 = performance.now();
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / FADE_MS);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
    if (k < 1) requestAnimationFrame(step); else then?.();
  };
  requestAnimationFrame(step);
}
function refreshMusic(): void {
  if (typeof Audio === 'undefined') return;
  const key = muted || musicVolume <= 0 || !unlocked ? null : wanted();
  if (current?.key === key) return;
  if (current) { const old = current.el; fade(old, 0, () => old.pause()); current = null; }
  if (!key) return;
  const list = MUSIC[key]!;
  const el = new Audio(list[Math.floor(Math.random() * list.length)]!);
  el.loop = true;
  el.volume = 0;
  current = { key, el };
  el.play().then(() => fade(el, musicVolume)).catch(() => { /* lecture refusée : on réessaiera au prochain changement */ });
}
function applyMusicVolume(): void {
  if (muted || musicVolume <= 0) { refreshMusic(); return; }
  if (current) current.el.volume = musicVolume; else refreshMusic();
}
