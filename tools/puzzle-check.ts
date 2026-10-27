// Vérifie les puzzles avec le solveur et liste leurs solutions (cartes jouées et cibles, sans tenir compte de l'ordre).
// Enregistre aussi la solution la plus courte de chaque puzzle dans src/puzzles/solutions.json (à pousser avec le puzzle).
// Usage : npx tsx tools/puzzle-check.ts [id du puzzle]
import { readFileSync, writeFileSync } from 'node:fs';
import { applyAction } from '../src/engine/game';
import type { GameState } from '../src/engine/types';
import { cardName } from '../src/i18n/log.fr';
import { buildPuzzle, puzzleStatus } from '../src/puzzles/build';
import { ALL_PUZZLES as PUZZLES } from '../src/puzzles/puzzles';
import { solvePuzzle } from '../src/puzzles/solve';

const only = process.argv[2];
const SAVE = 'src/puzzles/solutions.json';
const saved = JSON.parse(readFileSync(SAVE, 'utf8')) as Record<string, unknown>;
const where = (r?: { player: string; zone: string; idx: number }) => (r ? ` → ${r.player === 'A' ? 'toi' : 'adv.'} ${r.zone} ${r.idx + 1}` : '');
for (const pz of PUZZLES.filter(p => !only || p.id === only)) {
  const b = buildPuzzle(pz);
  const r0 = applyAction(b.state, { type: 'endTurn' });
  const r = solvePuzzle(pz, { maxSolutions: 300, maxNodes: 3_000_000 });
  const combos = new Map<string, number>();
  // Enregistre la solution la plus courte (rejouée par les tests, et pour les indices en jeu).
  const best = r.solutions.slice().sort((a, b2) => a.length - b2.length)[0];
  if (best) saved[pz.id] = best; else delete saved[pz.id];
  for (const sol of r.solutions) {
    let s: GameState = buildPuzzle(pz).state;
    const parts: string[] = [];
    for (const a of sol) {
      if (a.type === 'play') { const h = s.players.A.hand.find(x => x.uid === a.handUid)!; parts.push(`${cardName(h.cardId)}${where(a.target)}`); }
      if (a.type === 'choose') parts.push(`choix « ${s.pending[0]?.options?.[a.option]?.label ?? a.option} »`);
      const r2 = applyAction(s, a); if (!r2.ok) break; s = r2.state;
    }
    const k = parts.sort().join(' + ') || '(finir le tour)';
    combos.set(k, (combos.get(k) ?? 0) + 1);
  }
  const direct = r0.ok ? puzzleStatus(pz, r0.state, b.targetUid) : 'erreur';
  console.log(`\n${pz.id} — ${pz.title} (${'★'.repeat(pz.difficulty)})${pz.draft ? ' [brouillon]' : ''}`);
  console.log(`  Finir le tour sans rien jouer : ${direct === 'won' ? 'GAGNE (puzzle trop facile !)' : 'échoue'}`);
  console.log(r.solutions.length ? `  ${r.solutions.length}${r.complete ? '' : '+'} suites gagnantes, ${combos.size} combinaison(s) de cartes :` : r.complete ? '  AUCUNE SOLUTION (toutes les suites de coups ont été essayées)' : '  Aucune solution trouvée dans la limite de recherche');
  for (const [k, n] of combos) console.log(`   - ${k}  (${n} ordre${n > 1 ? 's' : ''})`);
}

writeFileSync(SAVE, JSON.stringify(saved, null, 1) + '\n');
console.log(`\nSolutions enregistrées dans ${SAVE}.`);
