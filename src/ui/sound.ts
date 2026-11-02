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
// Un candidat « couches-<camp> » est une musique en 5 couches (<camp>-piste1…5.ogg, voir docs/SONS.md) : on joue autant
// de couches que le niveau du joueur (setMusicLevel).
interface Request { id: number; keys: string[] }
interface Playing { key: string; setVolume: (v: number) => void; stop: () => void }
let requests: Request[] = [];
let nextId = 1;
let current: Playing | null = null;
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

// ---- Musique par couches (WebAudio) ----
// Chaque fichier contient 1 s de raccord avant et après la boucle : la boucle se fait au milieu du fichier, sans accroc.
const LAYERS = 5, LAYER_PAD = 1;
/** Niveau sonore naturel (dB) de la musique cumulée à chaque niveau, et niveau visé : les niveaux bas ne sont pas trop faibles. */
const LAYER_NATURAL_DB: Record<string, number[]> = {
  empire: [-28.8, -25.8, -22.6, -20.8, -18.0], elfes: [-28.6, -25.1, -22.6, -20.9, -18.1],
  demons: [-29.3, -25.2, -23.3, -20.9, -18.0], nomades: [-30.1, -27.4, -24.8, -23.7, -19.1],
};
const LAYER_TARGET_DB = [-26, -24.5, -23, -21.5, -19];
const layerNames = (name: string) => Array.from({ length: LAYERS }, (_, i) => `${name}-piste${i + 1}`);
const hasLayers = (name: string) => layerNames(name).every(n => MUSIC[n]);
const isLayered = (key: string) => key.startsWith('couches-');
const available = (key: string) => (isLayered(key) ? hasLayers(key.slice(8)) : !!MUSIC[key]);

let musicLevel = 1;
let layerCtx: AudioContext | null = null;
const layerBuffers = new Map<string, Promise<AudioBuffer[]>>();
let layerGains: GainNode[] = [];
let layerName = '';

/** Niveau du joueur (1 à 5) : nombre de couches jouées. */
export function setMusicLevel(level: number): void {
  const l = Math.max(1, Math.min(LAYERS, Math.round(level) || 1));
  if (l === musicLevel) return;
  musicLevel = l;
  applyLayerGains(0.8);
}
function applyLayerGains(seconds: number): void {
  if (!layerCtx || !layerGains.length) return;
  const nat = LAYER_NATURAL_DB[layerName]?.[musicLevel - 1] ?? LAYER_TARGET_DB[musicLevel - 1]!;
  const comp = 10 ** ((LAYER_TARGET_DB[musicLevel - 1]! - nat) / 20);
  layerGains.forEach((g, i) => g.gain.setTargetAtTime(i < musicLevel ? comp : 0, layerCtx!.currentTime, seconds / 3));
}
function loadLayers(ctx: AudioContext, name: string): Promise<AudioBuffer[]> {
  let p = layerBuffers.get(name);
  if (!p) {
    p = Promise.all(layerNames(name).map(async n => ctx.decodeAudioData(await (await fetch(MUSIC[n]![0]!)).arrayBuffer())));
    p.catch(() => layerBuffers.delete(name));
    layerBuffers.set(name, p);
  }
  return p;
}
function startLayers(key: string, name: string): Playing {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  layerCtx ??= new Ctor();
  const ctx = layerCtx;
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  let srcs: AudioBufferSourceNode[] = [], stopped = false;
  const me: Playing = {
    key,
    setVolume: v => master.gain.setTargetAtTime(v, ctx.currentTime, 0.15),
    stop: () => {
      stopped = true;
      master.gain.setTargetAtTime(0, ctx.currentTime, FADE_MS / 3000);
      setTimeout(() => { srcs.forEach(s => { try { s.stop(); } catch { /* déjà arrêtée */ } }); master.disconnect(); }, FADE_MS + 300);
    },
  };
  void (async () => {
    try {
      if (ctx.state === 'suspended') await ctx.resume();
      const bufs = await loadLayers(ctx, name);
      if (stopped) return;
      const dur = bufs[0]!.duration - 2 * LAYER_PAD, t0 = ctx.currentTime + 0.1;
      layerName = name;
      layerGains = bufs.map(() => { const g = ctx.createGain(); g.gain.value = 0; g.connect(master); return g; });
      srcs = bufs.map((b, i) => {
        const s = ctx.createBufferSource();
        s.buffer = b; s.loop = true; s.loopStart = LAYER_PAD; s.loopEnd = LAYER_PAD + dur;
        s.connect(layerGains[i]!); s.start(t0, LAYER_PAD); return s;
      });
      applyLayerGains(0.01);
      master.gain.setTargetAtTime(musicVolume, ctx.currentTime, FADE_MS / 3000);
    } catch { /* lecture impossible : le jeu reste silencieux */ }
  })();
  return me;
}

function wanted(): string | null {
  for (let i = requests.length - 1; i >= 0; i--) {
    const k = requests[i]!.keys.find(available);
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
function startFile(key: string): Playing {
  const list = MUSIC[key]!;
  const el = new Audio(list[Math.floor(Math.random() * list.length)]!);
  el.loop = true;
  el.volume = 0;
  el.play().then(() => fade(el, musicVolume)).catch(() => { /* lecture refusée : on réessaiera au prochain changement */ });
  return { key, setVolume: v => { el.volume = v; }, stop: () => fade(el, 0, () => el.pause()) };
}
function refreshMusic(): void {
  if (typeof Audio === 'undefined') return;
  const key = muted || musicVolume <= 0 || !unlocked ? null : wanted();
  if (current?.key === key) return;
  if (current) { current.stop(); current = null; }
  if (!key) return;
  current = isLayered(key) ? startLayers(key, key.slice(8)) : startFile(key);
}
function applyMusicVolume(): void {
  if (muted || musicVolume <= 0) { refreshMusic(); return; }
  if (current) current.setVolume(musicVolume); else refreshMusic();
}
