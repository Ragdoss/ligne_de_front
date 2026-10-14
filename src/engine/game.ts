// API publique du moteur : créer une partie, appliquer une action, lister les actions légales.

import { Ctx, card } from './ctx';
import { activateChoices, resolveChoice } from './choices';
import { cardCost, playCard, targetCount, unplayableReason, validFirstTarget, validSecondTarget } from './play';
import { seedFrom } from './rng';
import { endTurn } from './turn';
import type { Action, ActionResult, Faction, GameConfig, GameEvent, GameState, PlayerId, PlayerState, SlotRef } from './types';

export const DEFAULT_LEVEL_THRESHOLDS = [0, 4, 9, 16, 25];

export function defaultConfig(over: Partial<GameConfig> = {}): GameConfig {
  return {
    layout: { avant: 4, arriere: 3 },
    levelThresholds: { A: DEFAULT_LEVEL_THRESHOLDS, B: DEFAULT_LEVEL_THRESHOLDS },
    defeatLassitude: { A: 50, B: 50 },
    moralCheck: true,
    moralCheckLassitude: null,
    endTurnLassitude: { A: 0, B: 0 },
    noRegimentDefeatFromTurn: { A: 1, B: 1 },
    mustSurvive: {},
    handLimit: 10,
    startingHand: 5,
    ...over,
  };
}

export interface PlayerSetup { faction: Faction; deck: string[] }
export interface GameSetup {
  seed: string | number;
  A: PlayerSetup;
  B: PlayerSetup;
  config?: Partial<GameConfig>;
}

function newPlayer(ctx: Ctx, id: PlayerId, setup: PlayerSetup): PlayerState {
  for (const cid of setup.deck) card(cid); // vérifie que toutes les cartes existent
  const L = ctx.s.config.layout;
  const main = ctx.shuffle(setup.deck.filter(c => card(c).niveau < 4));
  const reserve = ctx.shuffle(setup.deck.filter(c => card(c).niveau >= 4));
  const pl: PlayerState = {
    id, faction: setup.faction, resource: 1, level: 1, points: 0,
    deck: main, reserve, hand: [], discard: [], healAcc: 0,
    board: { avant: Array(L.avant).fill(null), arriere: Array(L.arriere).fill(null), isole: null },
  };
  // Main de départ : 3 régiments de niveau 1 garantis, puis complétée jusqu'à la taille de départ.
  const isLvl1Regiment = (c: string) => card(c).cardType === 'Regiment' && card(c).niveau === 1;
  for (let i = 0, got = 0; i < pl.deck.length && got < 3;) {
    if (isLvl1Regiment(pl.deck[i]!)) { pl.hand.push({ uid: ctx.uid(), cardId: pl.deck.splice(i, 1)[0]! }); got++; }
    else i++;
  }
  while (pl.hand.length < ctx.s.config.startingHand && pl.deck.length) pl.hand.push({ uid: ctx.uid(), cardId: pl.deck.shift()! });
  return pl;
}

export function createGame(setup: GameSetup): GameState {
  const config = defaultConfig(setup.config);
  const s: GameState = {
    config, active: 'A', turn: 1, nextUid: 1, rng: seedFrom(setup.seed), pending: [], over: null,
    players: {} as GameState['players'],
  };
  const ctx = new Ctx(s);
  s.players.A = newPlayer(ctx, 'A', setup.A);
  s.players.B = newPlayer(ctx, 'B', setup.B);
  return s;
}

export function applyAction(state: GameState, action: Action): ActionResult {
  if (state.over) return { ok: false, error: 'gameOver' };
  const s = structuredClone(state);
  const ctx = new Ctx(s);
  let err: string | null = null;
  if (s.pending.length && action.type !== 'choose') return { ok: false, error: 'choicePending' };
  switch (action.type) {
    case 'choose': err = resolveChoice(ctx, action.option); break;
    case 'endTurn': endTurn(ctx); break;
    case 'play': err = playCard(ctx, s.active, action.handUid, action.target, action.target2); break;
  }
  if (err) return { ok: false, error: err };
  activateChoices(ctx);
  return { ok: true, state: s, events: ctx.events };
}

/** Coût actuel d'une carte en main du joueur actif (pour l'affichage). */
/** Joueur qui doit agir maintenant (le joueur actif, ou celui qui doit faire un choix en attente). */
export function actingPlayer(state: GameState): PlayerId {
  return state.pending[0]?.player ?? state.active;
}

export function costOf(state: GameState, p: PlayerId, handUid: number): number {
  const ctx = new Ctx(state);
  const h = state.players[p].hand.find(x => x.uid === handUid);
  return h ? cardCost(ctx, p, h) : 0;
}

/** Actions possibles pour une carte précise de la main du joueur actif (vide si elle n'est pas jouable). */
export function playsForHandCard(state: GameState, handUid: number): Action[] {
  if (state.over || state.pending.length) return [];
  const ctx = new Ctx(state);
  const p = state.active;
  const h = state.players[p].hand.find(x => x.uid === handUid);
  if (!h || unplayableReason(ctx, p, h)) return [];
  const c = card(h.cardId);
  const n = targetCount(c);
  if (n === 0) return [{ type: 'play', handUid }];
  const out: Action[] = [];
  const slotsBoth: SlotRef[] = [...ctx.allSlots('A'), ...ctx.allSlots('B')];
  for (const t of slotsBoth) {
    if (!validFirstTarget(ctx, p, c, t)) continue;
    if (n === 1) { out.push({ type: 'play', handUid, target: t }); continue; }
    for (const t2 of slotsBoth) if (validSecondTarget(ctx, c, t, t2)) out.push({ type: 'play', handUid, target: t, target2: t2 });
  }
  return out;
}

/** Raison pour laquelle une carte de la main du joueur actif n'est pas jouable (null = jouable). */
export function whyUnplayable(state: GameState, handUid: number): string | null {
  const h = state.players[state.active].hand.find(x => x.uid === handUid);
  if (!h) return 'notInHand';
  const r = unplayableReason(new Ctx(state), state.active, h);
  if (r) return r;
  return playsForHandCard(state, handUid).length ? null : 'noTarget';
}

/** Toutes les actions légales du joueur qui doit agir. */
export function legalActions(state: GameState): Action[] {
  if (state.over) return [];
  const head = state.pending[0];
  if (head) return (head.options ?? []).map((_, i) => ({ type: 'choose', option: i }));
  const out: Action[] = [];
  const seen = new Set<string>();
  for (const h of state.players[state.active].hand) {
    // Les exemplaires identiques (même carte, même réduction) donnent les mêmes actions.
    const key = `${h.cardId}|${h.levelFree ? 1 : 0}|${h.discount ?? 0}|${h.freeCopy ? 1 : 0}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(...playsForHandCard(state, h.uid));
  }
  out.push({ type: 'endTurn' });
  return out;
}

export type { Action, GameEvent, GameState };
