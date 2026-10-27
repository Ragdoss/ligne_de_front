import { describe, expect, it } from 'vitest';
import { applyAction } from '../src/engine/game';
import { buildPuzzle, puzzleStatus } from '../src/puzzles/build';
import { PUZZLES } from '../src/puzzles/puzzles';
import { solvePuzzle } from '../src/puzzles/solve';

describe('Puzzles', () => {
  for (const pz of PUZZLES) {
    it(`${pz.id} : a une solution, et finir le tour sans rien faire échoue`, () => {
      const b = buildPuzzle(pz);
      if (pz.goal.type === 'destroy') expect(b.targetUid, `aucun régiment adverse en ${pz.goal.slot}`).not.toBeNull();
      expect(puzzleStatus(pz, b.state, b.targetUid)).toBeNull();
      const r0 = applyAction(b.state, { type: 'endTurn' });
      expect(r0.ok && puzzleStatus(pz, r0.state, b.targetUid)).toBe('lost');
      expect(solvePuzzle(pz, { maxSolutions: 1 }).solutions.length).toBe(1);
    });
  }
  it('identifiants uniques', () => {
    expect(new Set(PUZZLES.map(p => p.id)).size).toBe(PUZZLES.length);
  });
});
