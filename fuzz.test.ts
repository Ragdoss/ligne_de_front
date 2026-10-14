// Parties aléatoires complètes : le moteur ne doit jamais planter ni produire un état incohérent.
import { describe, expect, it } from 'vitest';
import { DEMO_DECKS } from '../src/data/decks';
import { Ctx } from '../src/engine/ctx';
import { applyAction, createGame, legalActions } from '../src/engine/game';
import { nextRandom } from '../src/engine/rng';
import type { Faction, GameState } from '../src/engine/types';

// Cartes dont le moteur gère déjà les effets (Démons et Nomades : prochaine étape ; cartes de scénario exclues).
const PORTED: Faction[] = ['empire', 'elfe'];

function checkInvariants(s: GameState): void {
  const ctx = new Ctx(s);
  const uids = new Set<number>();
  for (const p of ['A', 'B'] as const) {
    const pl = s.players[p];
    expect(pl.resource).toBeGreaterThanOrEqual(0);
    for (const u of ctx.units(p)) {
      expect(uids.has(u.uid)).toBe(false);
      uids.add(u.uid);
      expect(u.controller).toBe(p);
      expect(u.currentEnd).toBeGreaterThan(0);
      expect(u.currentEnd).toBeLessThanOrEqual(u.maxEnd);
      expect(u.currentMor).toBeGreaterThan(0);
      expect(u.currentMor).toBeLessThanOrEqual(u.maxMor);
    }
    for (const h of pl.hand) { expect(uids.has(h.uid)).toBe(false); uids.add(h.uid); }
  }
}

describe('Parties aléatoires', () => {
  it('200 parties Empire/Elfes jouées au hasard vont au bout sans erreur', () => {
    let rng = 12345;
    const rand = (n: number) => { const r = nextRandom(rng); rng = r.state; return Math.floor(r.value * n); };
    let finished = 0;
    for (let g = 0; g < 200; g++) {
      const fa = PORTED[g % 2]!, fb = PORTED[(g + 1) % 2]!;
      let s = createGame({ seed: g, A: { faction: fa, deck: DEMO_DECKS[fa]! }, B: { faction: fb, deck: DEMO_DECKS[fb]! } });
      for (let step = 0; step < 3000 && !s.over; step++) {
        const acts = legalActions(s);
        // On joue des cartes la plupart du temps, et on finit le tour parfois.
        const plays = acts.filter(a => a.type !== 'endTurn');
        const a = plays.length && rand(4) > 0 ? plays[rand(plays.length)]! : acts[acts.length - 1]!;
        const r = applyAction(s, a);
        if (!r.ok) throw new Error(`Action légale refusée : ${r.error} ${JSON.stringify(a)}`);
        s = r.state;
        checkInvariants(s);
      }
      if (s.over) finished++;
    }
    expect(finished).toBeGreaterThan(190);
  });
});
