import { describe, expect, it } from 'vitest';
import { chooseAction, playOut } from '../src/ai/heuristic';
import { DEMO_DECKS } from '../src/data/decks';
import { actingPlayer, applyAction, createGame, legalActions } from '../src/engine/game';
import { nextRandom } from '../src/engine/rng';

describe('IA heuristique', () => {
  it('joue des parties complètes sans action refusée', () => {
    for (const [fa, fb] of [['empire', 'elfe'], ['demons', 'nomades'], ['nomades', 'empire']] as const) {
      const s = createGame({ seed: fa + fb, A: { faction: fa, deck: DEMO_DECKS[fa]! }, B: { faction: fb, deck: DEMO_DECKS[fb]! } });
      const r = playOut(s, { maxActions: 3000 });
      expect(r.state.over).not.toBeNull();
    }
  });
  it('bat largement un joueur qui joue au hasard', () => {
    let rng = 7;
    const rand = (n: number) => { const r = nextRandom(rng); rng = r.state; return Math.floor(r.value * n); };
    let aiWins = 0;
    const games = 20;
    for (let g = 0; g < games; g++) {
      const ai = g % 2 === 0 ? 'A' : 'B';
      const f = (['empire', 'elfe', 'demons', 'nomades'] as const)[g % 4]!;
      let s = createGame({ seed: `w${g}`, A: { faction: f, deck: DEMO_DECKS[f]! }, B: { faction: f, deck: DEMO_DECKS[f]! } });
      for (let n = 0; n < 3000 && !s.over; n++) {
        const acts = legalActions(s);
        const a = actingPlayer(s) === ai ? chooseAction(s) : acts[rand(acts.length)]!;
        const r = applyAction(s, a);
        if (!r.ok) throw new Error(r.error);
        s = r.state;
      }
      if (s.over?.winner === ai) aiWins++;
    }
    expect(aiWins).toBeGreaterThanOrEqual(17);
  });
});
