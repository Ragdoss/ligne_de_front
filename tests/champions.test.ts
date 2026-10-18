// Pools de champions : 2 decks par faction, tirés au hasard.
import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/data/cards';
import { CHAMPION_POOLS, pickChampion } from '../src/data/champions';

describe('Pools de champions', () => {
  it('2 decks de 45 cartes existantes par faction', () => {
    for (const f of ['empire', 'elfe', 'demons', 'nomades'] as const) {
      const pool = CHAMPION_POOLS[f]!;
      expect(pool).toHaveLength(2);
      for (const d of pool) { expect(d.cards).toHaveLength(45); for (const id of d.cards) expect(CARDS[id], id).toBeTruthy(); }
    }
  });
  it('le tirage choisit dans le pool', () => {
    expect(pickChampion('empire', () => 0)!.id).toBe(CHAMPION_POOLS.empire![0]!.id);
    expect(pickChampion('empire', () => 0.99)!.id).toBe(CHAMPION_POOLS.empire![1]!.id);
  });
});
