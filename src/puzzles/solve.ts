// Solveur : essaie toutes les suites de coups du tour (le moteur est déterministe) et renvoie les solutions.
// Sert à vérifier les puzzles (tests, tools/puzzle-check.ts) et à donner un indice en jeu.
// Seules les solutions minimales sont gardées : dès que finir le tour gagne, on n'essaie pas d'autres cartes en plus.
// Pour rester rapide : deux cartes identiques jouées sur la même cible ne sont essayées qu'une fois, et deux positions
// identiques (mêmes cartes, mêmes régiments, peu importe l'ordre dans lequel on y est arrivé) ne sont explorées qu'une fois.
import { applyAction, legalActions } from '../engine/game';
import type { Action, GameState, Unit } from '../engine/types';
import { buildPuzzle, puzzleStatus } from './build';
import type { Puzzle } from './types';

export interface SolveResult { solutions: Action[][]; explored: number; complete: boolean }

const unitKey = (u: Unit | null) => {
  if (!u) return null;
  const { uid: _u, ...rest } = u as Unit & Record<string, unknown>;
  return rest;
};
/** Position sans les numéros internes (uid) : deux suites de coups qui mènent au même endroit donnent la même clé. */
export function positionKey(s: GameState): string {
  const pl = (p: 'A' | 'B') => {
    const x = s.players[p];
    return {
      ...x,
      hand: x.hand.map(h => h.cardId + (h.generated ? '*' : '')).sort(),
      discard: [...x.discard].sort(),
      board: { avant: x.board.avant.map(unitKey), arriere: x.board.arriere.map(unitKey), isole: unitKey(x.board.isole) },
    };
  };
  return JSON.stringify([pl('A'), pl('B'), s.pending.map(c => [c.kind, c.options?.map(o => o.label ?? o.cardId)]), s.over, s.active, s.turn]);
}

/** Empreinte 53 bits d'une chaîne (cyrb53) : garder des nombres plutôt que des positions entières économise la mémoire. */
function hash(str: string): number {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Coups distincts : une seule copie d'une même carte sur une même cible. */
function distinctActions(s: GameState): Action[] {
  const seen = new Set<string>();
  return legalActions(s).filter(a => {
    if (a.type !== 'play') return true;
    const h = s.players[s.active].hand.find(x => x.uid === a.handUid);
    const k = `${h?.cardId}|${h?.generated ? 1 : 0}|${JSON.stringify(a.target ?? null)}|${JSON.stringify(a.target2 ?? null)}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Cherche depuis une position quelconque d'un puzzle (indice en jeu) ou depuis le début. */
export function solveFrom(pz: Puzzle, state: GameState, targetUid: number | null, opts: { maxSolutions?: number; maxNodes?: number } = {}): SolveResult {
  const maxSolutions = opts.maxSolutions ?? 50, maxNodes = opts.maxNodes ?? 300_000;
  const solutions: Action[][] = [];
  const seen = new Set<number>();
  let explored = 0, complete = true;
  const dfs = (s: GameState, path: Action[]) => {
    if (solutions.length >= maxSolutions) return;
    if (++explored > maxNodes) { complete = false; return; }
    const st = puzzleStatus(pz, s, targetUid);
    if (st === 'won') { solutions.push(path); return; }
    if (st === 'lost') return;
    const k = hash(positionKey(s));
    if (seen.has(k)) return;
    seen.add(k);
    // Finir le tour d'abord : si ça gagne, inutile d'essayer de jouer d'autres cartes avant (solutions minimales).
    if (!s.pending.length) {
      const end = applyAction(s, { type: 'endTurn' });
      if (end.ok && puzzleStatus(pz, end.state, targetUid) === 'won') { solutions.push([...path, { type: 'endTurn' }]); return; }
    }
    for (const a of distinctActions(s)) {
      if (a.type === 'endTurn') continue; // déjà essayé
      const r = applyAction(s, a);
      if (r.ok) dfs(r.state, [...path, a]);
      if (solutions.length >= maxSolutions || !complete) return;
    }
  };
  dfs(state, []);
  return { solutions, explored, complete };
}

/** Rejoue une suite de coups depuis le début du puzzle : gagne-t-elle ? */
export function checkSolution(pz: Puzzle, actions: Action[]): boolean {
  const { state, targetUid } = buildPuzzle(pz);
  let s = state;
  for (const a of actions) {
    if (puzzleStatus(pz, s, targetUid)) return false;
    const r = applyAction(s, a);
    if (!r.ok) return false;
    s = r.state;
  }
  return puzzleStatus(pz, s, targetUid) === 'won';
}

export function solvePuzzle(pz: Puzzle, opts: { maxSolutions?: number; maxNodes?: number } = {}): SolveResult {
  const { state, targetUid } = buildPuzzle(pz);
  return solveFrom(pz, state, targetUid, opts);
}
