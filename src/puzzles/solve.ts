// Solveur : essaie toutes les suites de coups du tour (le moteur est déterministe) et renvoie les solutions.
// Sert à vérifier les puzzles (tests) et à donner un indice en jeu.
import { applyAction, legalActions } from '../engine/game';
import type { Action, GameState } from '../engine/types';
import { buildPuzzle, puzzleStatus } from './build';
import type { Puzzle } from './types';

export interface SolveResult { solutions: Action[][]; explored: number; complete: boolean }

export function solvePuzzle(pz: Puzzle, opts: { maxSolutions?: number; maxNodes?: number } = {}): SolveResult {
  const { state, targetUid } = buildPuzzle(pz);
  const maxSolutions = opts.maxSolutions ?? 50, maxNodes = opts.maxNodes ?? 200_000;
  const solutions: Action[][] = [];
  const seen = new Set<string>();
  let explored = 0, complete = true;
  const key = (s: GameState) => JSON.stringify([s.players, s.pending, s.over]);
  const dfs = (s: GameState, path: Action[]) => {
    if (solutions.length >= maxSolutions) return;
    if (++explored > maxNodes) { complete = false; return; }
    const st = puzzleStatus(pz, s, targetUid);
    if (st === 'won') { solutions.push(path); return; }
    if (st === 'lost') return;
    const k = key(s);
    if (seen.has(k)) return;
    seen.add(k);
    for (const a of legalActions(s)) {
      const r = applyAction(s, a);
      if (r.ok) dfs(r.state, [...path, a]);
      if (solutions.length >= maxSolutions || !complete) return;
    }
  };
  dfs(state, []);
  return { solutions, explored, complete };
}
