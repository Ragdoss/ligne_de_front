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
}

export const DEFAULT_WEIGHTS: AiWeights = { lassitude: 9, board: 1, moral: 1.5, hand: 2, resource: 0.8 };

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
    return board * w.board + moral * w.moral + pl.hand.length * w.hand + pl.resource * w.resource - pl.points * w.lassitude * danger;
  };
  return side(p) - side(q);
}

function key(a: Action): string { return JSON.stringify(a); }

/** Choisit l'action du joueur qui doit agir. */
/** Filtre optionnel : règles imposées à l'ordinateur par un scénario (false = action interdite). */
export type ActionFilter = (s: GameState, a: Action) => boolean;

export function chooseAction(s: GameState, w: AiWeights = DEFAULT_WEIGHTS, filter?: ActionFilter): Action {
  const me = actingPlayer(s);
  const acts = legalActions(s);
  if (acts.length === 1) return acts[0]!;

  // Choix en attente : on évalue directement le résultat de chaque option.
  if (s.pending.length) {
    let best = acts[0]!, bestV = -Infinity;
    for (const a of acts) {
      const r = applyAction(s, a);
      if (!r.ok) continue;
      const v = evaluate(r.state, me, w);
      if (v > bestV) { bestV = v; best = a; }
    }
    return best;
  }

  // Finir le tour maintenant sert de référence ; une carte n'est jouée que si elle fait mieux.
  const afterTurn = (st: GameState): number => {
    // On résout les choix en attente avec l'IA elle-même avant de finir le tour.
    let cur = st;
    for (let guard = 0; cur.pending.length && guard < 10 && !cur.over; guard++) {
      const r = applyAction(cur, chooseAction(cur, w));
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
