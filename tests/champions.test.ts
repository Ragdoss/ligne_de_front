// Pools de champions : 3 decks par faction, tirés au hasard.
import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/data/cards';
import { CHAMPION_POOLS, pickChampion, TEST_DECKS } from '../src/data/champions';

describe('Pools de champions', () => {
  it('4 decks de 45 cartes existantes par faction', () => {
    for (const f of ['empire', 'elfe', 'demons', 'nomades'] as const) {
      const pool = CHAMPION_POOLS[f]!;
      expect(pool).toHaveLength(4);
      for (const d of pool) { expect(d.cards).toHaveLength(45); for (const id of d.cards) expect(CARDS[id], id).toBeTruthy(); }
    }
  });
  it('le deck usure test est le nomades-59', () => {
    expect(TEST_DECKS.usure!.cards).toEqual(CHAMPION_POOLS.nomades!.find(d => d.id === 'nomades-59')!.cards);
  });
  it('le tirage choisit dans le pool', () => {
    expect(pickChampion('empire', () => 0)!.id).toBe(CHAMPION_POOLS.empire![0]!.id);
    expect(pickChampion('empire', () => 0.99)!.id).toBe(CHAMPION_POOLS.empire![3]!.id);
  });
});

describe('Joueur qui commence', () => {
  it('B peut commencer : le tour avance quand A finit le sien', async () => {
    const { createGame, applyAction } = await import('../src/engine/game');
    const deck = Array(30).fill('recrue_imp');
    let s = createGame({ seed: 'first', first: 'B', A: { faction: 'empire', deck }, B: { faction: 'empire', deck }, config: { noRegimentDefeatFromTurn: { A: 999, B: 999 } } });
    expect(s.active).toBe('B');
    s = (applyAction(s, { type: 'endTurn' }) as { state: typeof s }).state;
    expect(s.active).toBe('A');
    expect(s.turn).toBe(1);
    s = (applyAction(s, { type: 'endTurn' }) as { state: typeof s }).state;
    expect(s.active).toBe('B');
    expect(s.turn).toBe(2);
  });
});
