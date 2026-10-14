import { Ctx } from '../src/engine/ctx';
import { applyAction, createGame } from '../src/engine/game';
import type { Action, GameConfig, GameEvent, GameState, PlayerId, Unit, Zone } from '../src/engine/types';

/** Partie de test : decks de 30 Recrues (prévisibles), plateau vide, mains vidées sauf demande. */
export function blankGame(config: Partial<GameConfig> = {}, deck: string[] = Array(30).fill('recrue_imp')): GameState {
  const s = createGame({ seed: 'test', A: { faction: 'empire', deck }, B: { faction: 'elfe', deck }, config });
  s.players.A.hand = [];
  s.players.B.hand = [];
  return s;
}

export function place(s: GameState, p: PlayerId, zone: Zone, idx: number, cardId: string, over: Partial<Unit> = {}): Unit {
  const ctx = new Ctx(s);
  const u = Object.assign(ctx.makeUnit(cardId, p), { justDeployed: false }, over);
  ctx.setAt({ player: p, zone, idx }, u);
  return u;
}

export function give(s: GameState, p: PlayerId, cardId: string, opts: { generated?: boolean; levelFree?: boolean } = {}): number {
  const uid = s.nextUid++;
  s.players[p].hand.push({ uid, cardId, ...opts });
  return uid;
}

/** Applique une action et échoue si elle est refusée. */
export function act(s: GameState, a: Action): { state: GameState; events: GameEvent[] } {
  const r = applyAction(s, a);
  if (!r.ok) throw new Error(`Action refusée : ${r.error} (${JSON.stringify(a)})`);
  return { state: r.state, events: r.events };
}

export function unitAt(s: GameState, p: PlayerId, zone: 'avant' | 'arriere', idx: number): Unit | null {
  return s.players[p].board[zone][idx] ?? null;
}
