// Équilibrage 13 — les Nomades (18/11/2026) : Rançonnement, Frappez le ravitaillement, Basilics de niveau 4, Reine des Basilics.
import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/data/cards';
import { Ctx } from '../src/engine/ctx';
import { cardCost } from '../src/engine/play';
import type { GameState, PlayerId, Zone } from '../src/engine/types';
import { act, blankGame, give } from './helpers';

const quiet = () => blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
const slot = (player: PlayerId, zone: Zone, idx: number) => ({ player, zone, idx });
const ready = (s: GameState, res = 20) => { for (const p of ['A', 'B'] as const) { s.players[p].level = 5; s.players[p].resource = res; } return s; };
const choose = (s: GameState, pick: (o: { cardId?: string; skip?: boolean }) => boolean) => {
  const i = s.pending[0]!.options!.findIndex(pick);
  expect(i).toBeGreaterThanOrEqual(0);
  return act(s, { type: 'choose', option: i }).state;
};

describe('Équilibrage 13 — Nomades', () => {
  it('valeurs : Rançonnement 0, Frappez le ravitaillement 1, Basilics du Désert et de la nécropole niveau 4, Reine 35 ATK', () => {
    expect(CARDS.ranconnement!.cout).toBe(0);
    expect(CARDS.frappez_ravitaillement!.cout).toBe(1);
    expect(CARDS.basilics_desert!.niveau).toBe(4);
    expect(CARDS.basilic_necropole!.niveau).toBe(4);
    expect(CARDS.reine_basilics!.atk).toBe(35);
  });

  it('Reine des Basilics : reprend autant de Basilics qu’on veut, avec Minions et coût −1', () => {
    let s = ready(quiet());
    s.players.A.discard.push('basilics_desert', 'basilics_desert', 'basilics_oasis', 'jeune_nomade');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'reine_basilics'), target: slot('A', 'avant', 0) }).state;
    const opts = s.pending[0]!.options!;
    expect(opts.filter(o => o.cardId).map(o => o.cardId).sort()).toEqual(['basilics_desert', 'basilics_oasis']);
    expect(opts.some(o => o.skip)).toBe(true);
    s = choose(s, o => o.cardId === 'basilics_desert');
    s = choose(s, o => o.cardId === 'basilics_desert');
    s = choose(s, o => !!o.skip);
    expect(s.pending).toHaveLength(0);
    expect(s.players.A.discard.sort()).toEqual(['basilics_oasis', 'jeune_nomade']);
    const back = s.players.A.hand.filter(h => h.cardId === 'basilics_desert');
    expect(back).toHaveLength(2);
    expect(back.every(h => h.minion && h.discount === 1)).toBe(true);
    expect(cardCost(new Ctx(s), 'A', back[0]!)).toBe(CARDS.basilics_desert!.cout - 1);
    s = act(s, { type: 'play', handUid: back[0]!.uid, target: slot('A', 'avant', 1) }).state;
    expect(s.players.A.board.avant[1]!.keywords).toContain('Minions');
  });

  it('Reine des Basilics : le choix s’arrête seul quand la défausse n’a plus de Basilic', () => {
    let s = ready(quiet());
    s.players.A.discard.push('basilics_oasis');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'reine_basilics'), target: slot('A', 'avant', 0) }).state;
    s = choose(s, o => o.cardId === 'basilics_oasis');
    expect(s.pending).toHaveLength(0);
    expect(s.players.A.hand.some(h => h.cardId === 'basilics_oasis' && h.minion)).toBe(true);
  });
});
