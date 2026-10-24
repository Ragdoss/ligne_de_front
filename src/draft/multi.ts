// Draft à plusieurs (jusqu'à 4 joueurs humains en ligne, complété par l'ordinateur).
// L'hôte tient l'état et l'envoie à tout le monde ; les invités envoient leurs choix. Logique pure et déterministe.
// Même déroulé que le draft solo : 6 paquets de 8 cartes, construction du deck, puis tournoi chacun contre chacun.
import {
  aiPick, buildAiDeck, newPack, PACKS, SCHEDULE, SEATS, simulateMatch, winsNeeded,
  type BestOf, type DraftState, type MatchResult,
} from './draft';

export interface MultiSeat { name: string; avatar: string; human: boolean }

export interface MultiDraft extends DraftState {
  multi: true;
  seats: MultiSeat[];
  /** Choix de la carte en cours pour chaque siège humain (index dans son paquet), null tant qu'il n'a pas choisi. */
  chosen: (number | null)[];
  /** Ronde du tournoi en cours (0 à 2). */
  mround: number;
  /** Matchs avec au moins un humain dans la ronde en cours : « a-b » → parties gagnées par a et par b. */
  scores: Record<string, [number, number]>;
}

const clone = <T>(x: T): T => structuredClone(x);
export const matchKey = (a: number, b: number) => `${a}-${b}`;

export function newMulti(seed: number, bestOf: BestOf, seats: MultiSeat[]): MultiDraft {
  const all = Array.from({ length: SEATS }, (_, i) => seats[i] ?? { name: '', avatar: '', human: false });
  const st: MultiDraft = {
    version: 1, seed, rng: seed | 0, phase: 'pick', round: 0, packs: [], picks: [[], [], [], []], decks: [null, null, null, null], results: [], bestOf,
    multi: true, seats: all, chosen: all.map(() => null), mround: 0, scores: {},
  };
  st.packs = Array.from({ length: SEATS }, () => newPack(st));
  return st;
}

const humanSeats = (st: MultiDraft) => st.seats.map((s, i) => (s.human ? i : -1)).filter(i => i >= 0);

/** Résout le tour de choix quand tous les humains ont choisi : les IA choisissent, puis les paquets tournent. */
function resolvePicks(st: MultiDraft): void {
  if (st.phase !== 'pick' || humanSeats(st).some(s => st.chosen[s] === null)) return;
  for (let s = 0; s < SEATS; s++) {
    if (st.seats[s]!.human) st.picks[s]!.push(st.packs[s]!.splice(st.chosen[s]!, 1)[0]!);
    else aiPick(st, s);
  }
  st.chosen = st.seats.map(() => null);
  if (st.packs[0]!.length === 0) {
    st.round++;
    if (st.round >= PACKS) {
      st.phase = 'build';
      for (let s = 0; s < SEATS; s++) if (!st.seats[s]!.human) st.decks[s] = buildAiDeck(st.picks[s]!);
      startTournamentIfReady(st);
    } else st.packs = Array.from({ length: SEATS }, () => newPack(st));
  } else {
    const left = st.round % 2 === 0; // paquets 1, 3, 5 à gauche ; 2, 4, 6 à droite
    st.packs = st.packs.map((_, s) => st.packs[(s + (left ? SEATS - 1 : 1)) % SEATS]!);
  }
}

/** Un humain garde la carte n° `index` de son paquet. */
export function choosePick(prev: MultiDraft, seat: number, index: number): MultiDraft {
  if (prev.phase !== 'pick' || !prev.seats[seat]?.human || prev.chosen[seat] !== null) return prev;
  if (index < 0 || index >= prev.packs[seat]!.length) return prev;
  const st = clone(prev);
  st.chosen[seat] = index;
  resolvePicks(st);
  return st;
}

function startTournamentIfReady(st: MultiDraft): void {
  if (st.phase !== 'build' || st.decks.some(d => !d)) return;
  st.phase = 'tournament';
  st.mround = 0;
  startRound(st);
}

/** Début de ronde : les matchs entre ordinateurs se jouent tout de suite. */
function startRound(st: MultiDraft): void {
  st.scores = {};
  for (const [a, b] of SCHEDULE[st.mround] ?? []) {
    if (!st.seats[a]!.human && !st.seats[b]!.human && !resultOf(st, a, b)) st.results.push(simulateMatch(st, a, b, st.mround));
  }
  endRoundIfDone(st);
}

const resultOf = (st: MultiDraft, a: number, b: number): MatchResult | undefined =>
  st.results.find(r => r.round === st.mround && ((r.a === a && r.b === b) || (r.a === b && r.b === a)));

function endRoundIfDone(st: MultiDraft): void {
  while (st.phase === 'tournament' && (SCHEDULE[st.mround] ?? []).every(([a, b]) => resultOf(st, a, b))) {
    st.mround++;
    if (st.mround >= SCHEDULE.length) { st.phase = 'done'; return; }
    startRound(st);
  }
}

/** Un humain valide son deck. */
export function submitDeck(prev: MultiDraft, seat: number, deck: string[]): MultiDraft {
  if (prev.phase !== 'build' || !prev.seats[seat]?.human || prev.decks[seat]) return prev;
  const st = clone(prev);
  st.decks[seat] = deck.slice();
  startTournamentIfReady(st);
  return st;
}

/** Peut-on modifier son deck ? Entre deux adversaires : pas pendant un match commencé (Bo3, Bo5). */
export function canChangeDeck(st: MultiDraft, seat: number): boolean {
  if (st.phase !== 'tournament' || !st.seats[seat]?.human) return false;
  const m = myMatch(st, seat);
  return !m || m.done || (m.score[0] === 0 && m.score[1] === 0);
}

/** Un humain modifie son deck entre deux adversaires (cartes draftées seulement : vérifié par l'interface). */
export function changeDeck(prev: MultiDraft, seat: number, deck: string[]): MultiDraft {
  if (prev.phase === 'build') return submitDeck(prev, seat, deck);
  if (!canChangeDeck(prev, seat)) return prev;
  const st = clone(prev);
  st.decks[seat] = deck.slice();
  return st;
}

/** Match de la ronde en cours pour un siège : sièges a < b dans l'ordre du calendrier, score actuel. */
export function myMatch(st: MultiDraft, seat: number): { a: number; b: number; opp: number; score: [number, number]; done: boolean } | null {
  if (st.phase !== 'tournament') return null;
  const pair = (SCHEDULE[st.mround] ?? []).find(([a, b]) => a === seat || b === seat);
  if (!pair) return null;
  const [a, b] = pair;
  return { a, b, opp: a === seat ? b : a, score: st.scores[matchKey(a, b)] ?? [0, 0], done: !!resultOf(st, a, b) };
}

/** Résultat d'une partie d'un match avec au moins un humain. */
export function recordGame(prev: MultiDraft, a: number, b: number, winner: number, turns: number): MultiDraft {
  if (prev.phase !== 'tournament' || resultOf(prev, a, b)) return prev;
  if (!(SCHEDULE[prev.mround] ?? []).some(([x, y]) => x === a && y === b)) return prev;
  const st = clone(prev);
  const k = matchKey(a, b);
  const sc: [number, number] = st.scores[k] ? [...st.scores[k]!] : [0, 0];
  sc[winner === a ? 0 : 1]++;
  st.scores[k] = sc;
  const need = winsNeeded(st.bestOf ?? 1);
  if (sc[0] >= need || sc[1] >= need) {
    st.results.push({ round: st.mround, a, b, winner: sc[0] > sc[1] ? a : b, turns, score: sc });
    endRoundIfDone(st);
  }
  return st;
}

/** Un joueur humain quitte la partie : l'ordinateur prend sa place (choix, deck, matchs). */
export function dropHuman(prev: MultiDraft, seat: number): MultiDraft {
  if (!prev.seats[seat]?.human) return prev;
  const st = clone(prev);
  st.seats[seat] = { ...st.seats[seat]!, human: false, name: `${st.seats[seat]!.name} (ordinateur)` };
  st.chosen[seat] = null;
  if (st.phase === 'pick') resolvePicks(st);
  if (st.phase === 'build') { if (!st.decks[seat]) st.decks[seat] = buildAiDeck(st.picks[seat]!); startTournamentIfReady(st); }
  if (st.phase === 'tournament') {
    for (const [a, b] of SCHEDULE[st.mround] ?? []) {
      if (!st.seats[a]!.human && !st.seats[b]!.human && !resultOf(st, a, b)) st.results.push(simulateMatch(st, a, b, st.mround));
    }
    endRoundIfDone(st);
  }
  return st;
}

/** Joueur qui commence une partie d'un match (côté A = siège a) : au hasard pour la première, puis en alternance. */
export function gameFirst(st: MultiDraft, a: number, b: number): 'A' | 'B' {
  const sc = st.scores[matchKey(a, b)] ?? [0, 0];
  let h = (st.seed | 0) ^ Math.imul(st.mround + 1, 0x9e3779b1) ^ Math.imul(a * 4 + b + 1, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h ^= h >>> 13;
  return ((h >>> 0) % 2 === 0) !== ((sc[0] + sc[1]) % 2 === 1) ? 'A' : 'B';
}

/** Identifiant d'une partie (graine du moteur et canal des actions en ligne). */
export const gameKey = (st: MultiDraft, a: number, b: number) => {
  const sc = st.scores[matchKey(a, b)] ?? [0, 0];
  return `md-${st.seed}-${st.mround}-${a}-${b}-${sc[0] + sc[1]}`;
};
