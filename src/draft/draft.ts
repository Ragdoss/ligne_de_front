// Draft à 4 joueurs (toi + 3 IA) : 6 paquets de 8 cartes, on en garde une et on passe le reste au voisin.
// Chacun construit ensuite un deck avec ses cartes, puis tournoi « chacun contre chacun » (3 rondes, matchs en Bo1, Bo3 ou Bo5).
// Logique pure et déterministe (graine), sauvegardée telle quelle dans le profil actif.
import { chooseActionV1 } from '../ai/heuristic';
import { CARDS } from '../data/cards';
import { applyAction, createGame } from '../engine/game';
import type { Faction } from '../engine/types';
import { COLLECTIBLE } from '../profile/profile';
import { CARD_RATING } from './ratings';

export const SEATS = 4;
export const PACKS = 6;
export const PACK_SIZE = 8;
export const DECK_MIN = 40;
export const LVL1_MIN = 3;
/** Niveau 4-5 conseillé (avertissement seulement). */
export const HIGH_ADVISED = 8;
/** Régiment de base disponible à volonté pendant la construction (comme les terrains de base d'un draft). */
export const BASICS = ['mercenaire_stagiaire'];
/** Composition d'un paquet par niveau (8 cartes). */
const PACK_LEVELS: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 1, 5: 1 };
/** Format des matchs du tournoi : nombre de parties maximum (Bo1, Bo3, Bo5). */
export type BestOf = 1 | 3 | 5;
export const winsNeeded = (bo: BestOf) => Math.ceil(bo / 2);

export const AI_NAMES = ['Capitaine Ardan', 'Veilleuse Ilyss', 'Sœur Moraga'];
export const AI_AVATARS = ['empire.3', 'elfe.2', 'demons.1'];
/** Image d'un adversaire selon la faction principale de son deck. */
export const FACTION_AVATAR: Record<string, string> = { empire: 'empire.1', elfe: 'elfe.2', demons: 'demons.3', nomades: 'nomades.1', neutre: 'empire.3' };

export interface MatchResult { round: number; a: number; b: number; winner: number; turns: number; /** Parties gagnées par a et par b. */ score?: [number, number] }
export interface DraftState {
  version: 1;
  seed: number;
  /** État du générateur aléatoire (reprise exacte après rechargement). */
  rng: number;
  phase: 'pick' | 'build' | 'tournament' | 'done';
  round: number;
  /** Paquet actuellement devant chaque siège (0 = toi). */
  packs: string[][];
  picks: string[][];
  /** Decks construits (null tant que le joueur n'a pas validé le sien). */
  decks: (string[] | null)[];
  results: MatchResult[];
  /** Format des matchs (absent = Bo1, anciens drafts). */
  bestOf?: BestOf;
  /** Ton match en cours : parties gagnées par toi et par l'adversaire. */
  current?: [number, number];
}

// ---------- Hasard déterministe ----------
function next(st: { rng: number }): number {
  st.rng = (st.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(st.rng ^ (st.rng >>> 15), st.rng | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const POOL_BY_LEVEL: Record<number, string[]> = {};
for (const id of COLLECTIBLE) (POOL_BY_LEVEL[CARDS[id]!.niveau] ??= []).push(id);

function newPack(st: { rng: number }): string[] {
  const pack: string[] = [];
  for (const [lvl, n] of Object.entries(PACK_LEVELS)) {
    const pool = POOL_BY_LEVEL[Number(lvl)] ?? [];
    for (let i = 0; i < n; i++) {
      // Pas deux fois la même carte dans un paquet quand c'est possible.
      let id = pool[Math.floor(next(st) * pool.length)]!;
      for (let k = 0; k < 6 && pack.includes(id); k++) id = pool[Math.floor(next(st) * pool.length)]!;
      pack.push(id);
    }
  }
  return pack;
}

export function newDraft(seed = Date.now(), bestOf: BestOf = 1): DraftState {
  const st: DraftState = { version: 1, seed, rng: seed | 0, phase: 'pick', round: 0, packs: [], picks: [[], [], [], []], decks: [null, null, null, null], results: [], bestOf };
  st.packs = Array.from({ length: SEATS }, () => newPack(st));
  return st;
}

// ---------- IA de draft ----------
export const rating = (id: string) => CARD_RATING[id] ?? CARDS[id]!.niveau * 0.5;

/** Factions dominantes d'une pile de cartes (somme des notes, neutre exclu), de la plus forte à la plus faible. */
export function topFactions(cards: string[]): Faction[] {
  const sum: Partial<Record<Faction, number>> = {};
  for (const id of cards) { const f = CARDS[id]!.faction; if (f !== 'neutre') sum[f] = (sum[f] ?? 0) + 2 + rating(id); }
  return (Object.keys(sum) as Faction[]).sort((a, b) => sum[b]! - sum[a]!);
}

function aiScore(id: string, picks: string[], st: { rng: number }): number {
  const c = CARDS[id]!;
  let s = rating(id) + next(st) * 1.5;
  if (picks.length >= 6) {
    const [f1, f2] = topFactions(picks);
    if (c.faction === f1) s += 3; else if (c.faction === f2) s += 1.5; else if (c.faction !== 'neutre') s -= 2;
  }
  const high = picks.filter(x => CARDS[x]!.niveau >= 4).length;
  if (c.niveau >= 4 && picks.length >= 20 && high < HIGH_ADVISED) s += 2;
  return s;
}

function aiPick(st: DraftState, seat: number): void {
  const pack = st.packs[seat]!;
  let best = 0, bestScore = -Infinity;
  pack.forEach((id, i) => { const s = aiScore(id, st.picks[seat]!, st); if (s > bestScore) { bestScore = s; best = i; } });
  st.picks[seat]!.push(pack.splice(best, 1)[0]!);
}

/** Tu prends la carte n° `index` de ton paquet ; les IA choisissent, puis les paquets tournent. */
export function pickCard(prev: DraftState, index: number): DraftState {
  const st = structuredClone(prev);
  if (st.phase !== 'pick') return st;
  const mine = st.packs[0]!;
  if (index < 0 || index >= mine.length) return st;
  st.picks[0]!.push(mine.splice(index, 1)[0]!);
  for (let s = 1; s < SEATS; s++) aiPick(st, s);
  if (st.packs[0]!.length === 0) {
    st.round++;
    if (st.round >= PACKS) {
      st.phase = 'build';
      for (let s = 1; s < SEATS; s++) st.decks[s] = buildAiDeck(st.picks[s]!);
    } else st.packs = Array.from({ length: SEATS }, () => newPack(st));
  } else {
    // Rondes 1 et 3 : on passe à gauche ; ronde 2 : à droite.
    const left = st.round % 2 === 0;
    st.packs = st.packs.map((_, s) => st.packs[(s + (left ? SEATS - 1 : 1)) % SEATS]!);
  }
  return st;
}

// ---------- Decks ----------
export function deckFaction(deck: string[]): Faction {
  return topFactions(deck)[0] ?? 'empire';
}

export interface DraftDeckCheck { ok: boolean; problems: string[]; warnings: string[]; total: number; lvl1: number; high: number }
export function checkDraftDeck(deck: string[], picks: string[]): DraftDeckCheck {
  const problems: string[] = [], warnings: string[] = [];
  const have: Record<string, number> = {};
  for (const id of picks) have[id] = (have[id] ?? 0) + 1;
  const n: Record<string, number> = {};
  for (const id of deck) n[id] = (n[id] ?? 0) + 1;
  for (const [id, k] of Object.entries(n)) if (!BASICS.includes(id) && k > (have[id] ?? 0)) problems.push(`${id} : ${k} dans le deck, ${have[id] ?? 0} draftée(s)`);
  const lvl1 = deck.filter(id => CARDS[id]!.niveau === 1 && CARDS[id]!.cardType === 'Regiment').length;
  const high = deck.filter(id => CARDS[id]!.niveau >= 4).length;
  if (deck.length < DECK_MIN) problems.push(`Au moins ${DECK_MIN} cartes (${deck.length} actuellement)`);
  if (lvl1 < LVL1_MIN) problems.push(`Au moins ${LVL1_MIN} régiments de niveau 1 (${lvl1} actuellement)`);
  if (high < HIGH_ADVISED) warnings.push(`Peu de cartes de niveau 4-5 (${high}) : la fin de partie sera difficile`);
  return { ok: problems.length === 0, problems, warnings, total: deck.length, lvl1, high };
}

/** Deck de l'IA : ses deux factions principales + neutre, complété par ses meilleures autres cartes puis des régiments de base. */
export function buildAiDeck(picks: string[]): string[] {
  const [f1, f2] = topFactions(picks);
  const main = picks.filter(id => [f1, f2, 'neutre'].includes(CARDS[id]!.faction));
  const rest = picks.filter(id => ![f1, f2, 'neutre'].includes(CARDS[id]!.faction)).sort((a, b) => rating(b) - rating(a));
  const deck = main.slice();
  for (const id of rest) { if (deck.length >= DECK_MIN) break; deck.push(id); }
  return autoFillBasics(deck, f1);
}

/** Ajoute des régiments de base jusqu'aux minimums (régiments de niveau 1, taille du deck). */
export function autoFillBasics(deck: string[], faction?: Faction): string[] {
  const d = deck.slice();
  const basic = BASICS.find(id => CARDS[id]!.faction === faction) ?? BASICS[0]!;
  const lvl1 = () => d.filter(id => CARDS[id]!.niveau === 1 && CARDS[id]!.cardType === 'Regiment').length;
  while (lvl1() < LVL1_MIN || d.length < DECK_MIN) d.push(basic);
  return d;
}

// ---------- Tournoi ----------
/** Rondes du « chacun contre chacun » : [siège, siège] ; toi (0) joues un match par ronde. */
export const SCHEDULE: [number, number][][] = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];

export const currentRound = (st: DraftState) => st.results.filter(r => r.a === 0 || r.b === 0).length;

/** Une partie IA contre IA (IA rapide). Au-delà de 80 tours, la plus faible lassitude gagne. Renvoie le gagnant. */
function simulateGame(st: DraftState, a: number, b: number, seed: string): { winner: number; turns: number } {
  let s = createGame({ seed, A: { faction: deckFaction(st.decks[a]!), deck: st.decks[a]! }, B: { faction: deckFaction(st.decks[b]!), deck: st.decks[b]! } });
  for (let n = 0; n < 4000 && !s.over && s.turn <= 80; n++) {
    const r = applyAction(s, chooseActionV1(s));
    if (!r.ok) break;
    s = r.state;
  }
  const winA = s.over ? s.over.winner === 'A' : s.players.A.points <= s.players.B.points;
  return { winner: winA ? a : b, turns: s.turn };
}

/** Match IA contre IA au format du draft (chacun commence à tour de rôle). */
export function simulateMatch(st: DraftState, a: number, b: number, round: number): MatchResult {
  const need = winsNeeded(st.bestOf ?? 1);
  const score: [number, number] = [0, 0];
  let turns = 0;
  for (let g = 0; score[0] < need && score[1] < need; g++) {
    const [first, second] = g % 2 === 0 ? [a, b] : [b, a];
    const r = simulateGame(st, first, second, `draft-${st.seed}-${round}-${a}-${b}-${g}`);
    turns += r.turns;
    score[r.winner === a ? 0 : 1]++;
  }
  return { round, a, b, winner: score[0] > score[1] ? a : b, turns, score };
}

/** Enregistre une de tes parties. Quand ton match est décidé, joue l'autre match de la ronde ; le tournoi s'arrête après la 3e ronde. */
export function recordHumanGame(prev: DraftState, youWon: boolean, turns: number): DraftState {
  const st = structuredClone(prev);
  const round = currentRound(st);
  const pair = SCHEDULE[round];
  if (!pair) return st;
  const cur: [number, number] = st.current ? [...st.current] : [0, 0];
  cur[youWon ? 0 : 1]++;
  const need = winsNeeded(st.bestOf ?? 1);
  if (cur[0] < need && cur[1] < need) { st.current = cur; return st; }
  st.current = undefined;
  const [, opp] = pair[0]!;
  st.results.push({ round, a: 0, b: opp, winner: cur[0] > cur[1] ? 0 : opp, turns, score: cur });
  const [x, y] = pair[1]!;
  st.results.push(simulateMatch(st, x, y, round));
  if (round + 1 >= SCHEDULE.length) st.phase = 'done';
  return st;
}
/** Ancien nom (un match = une partie en Bo1). */
export const recordHumanMatch = recordHumanGame;

export interface Standing { seat: number; wins: number; losses: number }
export function standings(st: DraftState): Standing[] {
  const t: Standing[] = Array.from({ length: SEATS }, (_, seat) => ({ seat, wins: 0, losses: 0 }));
  for (const r of st.results) { t[r.winner]!.wins++; t[r.winner === r.a ? r.b : r.a]!.losses++; }
  return t.sort((p, q) => q.wins - p.wins || p.seat - q.seat);
}

export const nextOpponent = (st: DraftState): number | null => SCHEDULE[currentRound(st)]?.[0]?.[1] ?? null;
