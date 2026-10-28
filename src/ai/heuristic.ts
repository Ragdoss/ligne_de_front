// IA heuristique : pour chaque action possible, simule « jouer cette carte puis finir le tour »
// et garde celle qui laisse la meilleure position. Simple, sans règles codées en dur par carte :
// elle profite automatiquement de toute nouvelle carte ajoutée au moteur.

import { card, Ctx, opponentOf } from '../engine/ctx';
import { actingPlayer, applyAction, legalActions } from '../engine/game';
import type { Action, GameState, PlayerId, Unit } from '../engine/types';

export interface AiWeights {
  lassitude: number;  // valeur d'un point de lassitude (négatif pour soi)
  board: number;      // multiplicateur de la valeur des régiments en jeu
  moral: number;      // par point de Moral total d'avance
  hand: number;       // par carte en main
  resource: number;   // par ressource non dépensée
  /** Danger de la pioche qui s'amenuise (usure) : coût qui grandit quand il reste peu de cartes à piocher. */
  deck?: number;
}

export const DEFAULT_WEIGHTS: AiWeights = { lassitude: 9, board: 1, moral: 1.5, hand: 2, resource: 0.8, deck: 12 };

/** Seuil de pioche (pioche + réserve) en dessous duquel l'IA s'inquiète de l'usure. */
const DECK_SAFE = 12;

function unitValue(ctx: Ctx, u: Unit): number {
  const leader = u.leader ? 6 : 0;
  return ctx.effectiveAtk(u) * 0.6 + u.currentEnd * 0.15 + u.currentMor * 2 + ctx.effectiveArm(u) * 2 + leader
    + (card(u.cardId).generatesResourceEachTurn ?? 0) * 6 + (u.keywords.includes('GenerateurRessource') ? 6 : 0);
}

/** Valeur d'une position du point de vue de `p` (plus c'est haut, mieux c'est). */
export function evaluate(s: GameState, p: PlayerId, w: AiWeights = DEFAULT_WEIGHTS): number {
  if (s.over) return s.over.winner === p ? 1e6 : -1e6;
  const ctx = new Ctx(s);
  const q = opponentOf(p);
  const side = (x: PlayerId) => {
    const pl = s.players[x];
    const units = ctx.units(x);
    const board = units.reduce((n, u) => n + unitValue(ctx, u), 0);
    const moral = units.reduce((n, u) => n + (card(u.cardId).excludeFromMoralTotal ? 0 : u.currentMor), 0);
    // La lassitude coûte de plus en plus cher à l'approche de la défaite.
    const limit = s.config.defeatLassitude[x];
    const danger = Number.isFinite(limit) ? 1 + Math.max(0, pl.points - limit * 0.6) / 5 : 1;
    // Usure : chaque carte perdue coûte de plus en plus cher à mesure que la pioche se vide (0 au-dessus de DECK_SAFE).
    const left = pl.deck.length + pl.reserve.length;
    const thin = Math.max(0, DECK_SAFE - left);
    const decay = (w.deck ?? 0) * (thin * thin) / DECK_SAFE;
    // Proie : un régiment adverse désigné vaut un peu (les cartes Elfes en profitent), d'autant plus qu'il est gros.
    const prey = ctx.preyOf(x);
    const preyV = prey ? 4 + unitValue(ctx, prey) * 0.1 : 0;
    return preyV + board * w.board + moral * w.moral + pl.hand.length * w.hand + pl.resource * w.resource - pl.points * w.lassitude * danger - decay;
  };
  // Course contre l'usure : quand notre pioche fond, la lassitude infligée à l'adversaire compte davantage
  // (il faut finir la partie avant d'être vidé). Urgence de 0 (pioche ≥ 2 × DECK_SAFE) à 1 (pioche vide).
  const mine = s.players[p];
  const urgency = Math.max(0, 2 * DECK_SAFE - (mine.deck.length + mine.reserve.length)) / (2 * DECK_SAFE);
  const race = ((w.deck ?? 0) / 4) * urgency * w.lassitude * s.players[q].points;
  return side(p) - side(q) + race;
}

function key(a: Action): string { return JSON.stringify(a); }

/** Choisit l'action du joueur qui doit agir. */
/** Filtre optionnel : règles imposées à l'ordinateur par un scénario (false = action interdite). */
export type ActionFilter = (s: GameState, a: Action) => boolean;

/** Ancienne IA (référence pour les comparaisons) : voit l'état réel et ne regarde que la fin de son propre tour. */
export function chooseActionV1(s: GameState, w: AiWeights = DEFAULT_WEIGHTS, filter?: ActionFilter): Action {
  const me = actingPlayer(s);
  const acts = legalActions(s);
  if (acts.length === 1) return acts[0]!;

  // Choix en attente : on évalue le résultat de chaque option (en finissant le tour si c'est le nôtre,
  // pour voir l'effet sur le combat : régiment sonné, etc.).
  if (s.pending.length) {
    let best = acts[0]!, bestV = -Infinity;
    for (const a of acts) {
      const r = applyAction(s, a);
      if (!r.ok) continue;
      let v = evaluate(r.state, me, w);
      if (s.pending[0]!.kind === 'frondeurStun' && !r.state.pending.length && r.state.active === me && !r.state.over) {
        const e = applyAction(r.state, { type: 'endTurn' });
        if (e.ok) v = evaluate(e.state, me, w);
      }
      if (v > bestV) { bestV = v; best = a; }
    }
    return best;
  }

  // Finir le tour maintenant sert de référence ; une carte n'est jouée que si elle fait mieux.
  const afterTurn = (st: GameState): number => {
    // On résout les choix en attente avec l'IA elle-même avant de finir le tour.
    let cur = st;
    for (let guard = 0; cur.pending.length && guard < 10 && !cur.over; guard++) {
      const r = applyAction(cur, chooseActionV1(cur, w));
      if (!r.ok) break;
      cur = r.state;
    }
    if (cur.over) return evaluate(cur, me, w);
    const r = applyAction(cur, { type: 'endTurn' });
    return r.ok ? evaluate(r.state, me, w) : evaluate(cur, me, w);
  };
  let best: Action = { type: 'endTurn' };
  let bestV = afterTurn(s);
  const seen = new Set<string>();
  for (const a of acts) {
    if (a.type === 'endTurn') continue;
    if (filter && !filter(s, a)) continue;
    const k = key(a);
    if (seen.has(k)) continue;
    seen.add(k);
    const r = applyAction(s, a);
    if (!r.ok) continue;
    const v = afterTurn(r.state);
    if (v > bestV + 0.01) { bestV = v; best = a; }
  }
  return best;
}

/** Joue une partie complète IA contre IA. Retourne l'état final et le nombre d'actions. */
export function playOut(s: GameState, opts: { maxActions?: number; weights?: Partial<Record<PlayerId, AiWeights>> } = {}): { state: GameState; actions: number } {
  let cur = s;
  let n = 0;
  const max = opts.maxActions ?? 5000;
  while (!cur.over && n < max) {
    const w = opts.weights?.[actingPlayer(cur)] ?? DEFAULT_WEIGHTS;
    const a = chooseAction(cur, w);
    const r = applyAction(cur, a);
    if (!r.ok) throw new Error(`L'IA a choisi une action refusée : ${r.error} ${JSON.stringify(a)}`);
    cur = r.state;
    n++;
  }
  return { state: cur, actions: n };
}

// ---------------------------------------------------------------------------------------------
// IA v2 : plus forte, et sans tricher.
// 1. Pas d'information cachée : elle raisonne sur un « état supposé » où la main et la pioche adverses
//    sont remplacées par des cartes tirées au hasard parmi celles qu'elle ne voit pas, où sa propre pioche
//    est mélangée et où le hasard futur est inconnu.
// 2. Elle regarde plus loin : chaque coup est jugé après la fin de son tour ET après le combat de fin du
//    tour adverse (l'adversaire est supposé passer), ce qui lui fait mieux protéger ses régiments.

/** Petit générateur déterministe (pour que les simulations restent reproductibles). */
function mulberry(seed: number) {
  let a = seed | 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

/** État supposé du point de vue de `me` : rien de ce qu'il ne peut pas voir n'est conservé. */
export function determinize(s: GameState, me: PlayerId, rand: () => number): GameState {
  const b = structuredClone(s);
  const q = opponentOf(me);
  const opp = b.players[q];
  // Cartes adverses invisibles : sa main (hors cartes générées, connues) et sa pioche, redistribuées au hasard.
  const hidden = opp.hand.filter(h => !h.generated);
  const pool = shuffled([...hidden.map(h => h.cardId), ...opp.deck], rand);
  hidden.forEach((h, i) => { h.cardId = pool[i]!; h.discount = undefined; });
  opp.deck = pool.slice(hidden.length);
  opp.reserve = shuffled(opp.reserve, rand);
  // Sa propre pioche : il en connaît le contenu, pas l'ordre.
  b.players[me].deck = shuffled(b.players[me].deck, rand);
  b.players[me].reserve = shuffled(b.players[me].reserve, rand);
  // Le hasard à venir (cibles aléatoires, mélanges) est inconnu.
  b.rng = Math.floor(rand() * 2 ** 31);
  return b;
}

/** Après la fin de notre tour : l'adversaire est supposé ne rien jouer, on résout son combat de fin de tour. */
function afterOpponentPass(st: GameState, me: PlayerId, w: AiWeights): number {
  let cur = st;
  for (let guard = 0; cur.pending.length && guard < 10 && !cur.over; guard++) {
    const r = applyAction(cur, { type: 'choose', option: 0 });
    if (!r.ok) break;
    cur = r.state;
  }
  if (cur.over || cur.active === me) return evaluate(cur, me, w);
  const r = applyAction(cur, { type: 'endTurn' });
  return r.ok ? evaluate(r.state, me, w) : evaluate(cur, me, w);
}

/** Valeur d'une position après avoir fini notre tour : moyenne entre « juste après » et « après le combat adverse ». */
function valueAfterTurn(st: GameState, me: PlayerId, w: AiWeights): number {
  let cur = st;
  for (let guard = 0; cur.pending.length && guard < 10 && !cur.over; guard++) {
    if (actingPlayer(cur) !== me) break;
    const r = applyAction(cur, chooseActionV1(cur, w));
    if (!r.ok) break;
    cur = r.state;
  }
  if (cur.over) return evaluate(cur, me, w);
  const r = applyAction(cur, { type: 'endTurn' });
  if (!r.ok) return evaluate(cur, me, w);
  if (r.state.over) return evaluate(r.state, me, w);
  return 0.4 * evaluate(r.state, me, w) + 0.6 * afterOpponentPass(r.state, me, w);
}

export function chooseAction(s: GameState, w: AiWeights = DEFAULT_WEIGHTS, filter?: ActionFilter): Action {
  const me = actingPlayer(s);
  const acts = legalActions(s);
  if (acts.length === 1) return acts[0]!;
  const rand = mulberry((s.rng ^ (s.nextUid * 2654435761)) | 0);
  const b = determinize(s, me, rand);

  if (s.pending.length) {
    let best = acts[0]!, bestV = -Infinity;
    for (const a of acts) {
      const r = applyAction(b, a);
      if (!r.ok) continue;
      let v = evaluate(r.state, me, w);
      if (s.pending[0]!.kind === 'frondeurStun' && !r.state.pending.length && r.state.active === me && !r.state.over) v = valueAfterTurn(r.state, me, w);
      if (v > bestV) { bestV = v; best = a; }
    }
    return best;
  }

  if (s.active !== me) return chooseActionV1(s, w, filter);
  let best: Action = { type: 'endTurn' };
  let bestV = valueAfterTurn(b, me, w);
  const seen = new Set<string>();
  for (const a of acts) {
    if (a.type === 'endTurn') continue;
    if (filter && !filter(s, a)) continue;
    const k = key(a);
    if (seen.has(k)) continue;
    seen.add(k);
    const r = applyAction(b, a);
    if (!r.ok) continue;
    const v = valueAfterTurn(r.state, me, w);
    if (v > bestV + 0.01) { bestV = v; best = a; }
  }
  return best;
}

// ---------------------------------------------------------------------------------------------
// IA v3 (essais) : options pour regarder plus loin. Mêmes principes que la v2 (pas d'information cachée).
/** Réglage de l'IA forte (v3) : elle prévoit les 2 cartes suivantes de son tour. 57 % contre la v2 (500 parties, 24/10/2026). */
export const STRONG_AI: AiOptions = { followUp: 2 };

export interface AiOptions {
  /** Nombre d'états supposés (tirages des cartes cachées) moyennés. */
  samples?: number;
  /** Après le coup étudié, continuer à jouer ses cartes (glouton rapide, jusqu'à N actions) avant de finir le tour. */
  followUp?: number;
  /** Au tour adverse : l'adversaire joue lui aussi (glouton rapide, jusqu'à N actions) au lieu de passer. */
  oppReply?: number;
}

/** Joue jusqu'à `n` actions avec l'IA rapide (v1) pour le joueur `who` tant que c'est à lui ; s'arrête s'il veut finir le tour. */
function greedyPlay(st: GameState, who: PlayerId, n: number, w: AiWeights): GameState {
  let cur = st;
  for (let i = 0; i < n && !cur.over && actingPlayer(cur) === who; i++) {
    const a = chooseActionV1(cur, w);
    if (a.type === 'endTurn') break;
    const r = applyAction(cur, a);
    if (!r.ok) break;
    cur = r.state;
  }
  return cur;
}

function valueAfterTurnV3(st: GameState, me: PlayerId, w: AiWeights, o: AiOptions): number {
  let cur = st;
  for (let guard = 0; cur.pending.length && guard < 10 && !cur.over; guard++) {
    if (actingPlayer(cur) !== me) break;
    const r = applyAction(cur, chooseActionV1(cur, w));
    if (!r.ok) break;
    cur = r.state;
  }
  if (o.followUp) cur = greedyPlay(cur, me, o.followUp, w);
  if (cur.over) return evaluate(cur, me, w);
  const r = applyAction(cur, { type: 'endTurn' });
  if (!r.ok) return evaluate(cur, me, w);
  if (r.state.over) return evaluate(r.state, me, w);
  let opp = r.state;
  const q = opponentOf(me);
  for (let guard = 0; opp.pending.length && guard < 10 && !opp.over; guard++) {
    const x = applyAction(opp, { type: 'choose', option: 0 });
    if (!x.ok) break;
    opp = x.state;
  }
  if (o.oppReply && !opp.over && opp.active === q) opp = greedyPlay(opp, q, o.oppReply, w);
  let after: number;
  if (opp.over || opp.active === me) after = evaluate(opp, me, w);
  else {
    for (let guard = 0; opp.pending.length && guard < 10 && !opp.over; guard++) {
      const x = applyAction(opp, { type: 'choose', option: 0 });
      if (!x.ok) break;
      opp = x.state;
    }
    const e = opp.over ? null : applyAction(opp, { type: 'endTurn' });
    after = e && e.ok ? evaluate(e.state, me, w) : evaluate(opp, me, w);
  }
  return 0.4 * evaluate(r.state, me, w) + 0.6 * after;
}

export function chooseActionV3(s: GameState, w: AiWeights = DEFAULT_WEIGHTS, filter?: ActionFilter, o: AiOptions = {}): Action {
  const me = actingPlayer(s);
  const acts = legalActions(s);
  if (acts.length === 1) return acts[0]!;
  if (s.pending.length || s.active !== me) return chooseAction(s, w, filter);
  const rand = mulberry((s.rng ^ (s.nextUid * 2654435761)) | 0);
  const boards = Array.from({ length: Math.max(1, o.samples ?? 1) }, () => determinize(s, me, rand));
  const value = (a: Action | null) => {
    let t = 0;
    for (const b of boards) {
      if (!a) { t += valueAfterTurnV3(b, me, w, { ...o, followUp: 0 }); continue; } // finir le tour maintenant : plus aucune carte jouée
      const r = applyAction(b, a);
      t += r.ok ? valueAfterTurnV3(r.state, me, w, o) : -1e7;
    }
    return t / boards.length;
  };
  let best: Action = { type: 'endTurn' };
  let bestV = value(null);
  const seen = new Set<string>();
  for (const a of acts) {
    if (a.type === 'endTurn') continue;
    if (filter && !filter(s, a)) continue;
    const k = key(a);
    if (seen.has(k)) continue;
    seen.add(k);
    const v = value(a);
    if (v > bestV + 0.01) { bestV = v; best = a; }
  }
  return best;
}
