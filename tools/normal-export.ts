// Écrit src/data/optimizedNormal.ts à partir des résultats de tools/normal-evolve.ts (reports/normal-<clé>.json) :
// le meilleur deck de chaque faction et de chaque binôme. Usage : npx tsx tools/normal-export.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const KEYS = ['empire', 'elfe', 'demons', 'nomades', 'empire+elfe', 'empire+demons', 'empire+nomades', 'elfe+demons', 'elfe+nomades', 'demons+nomades'];
const NAME: Record<string, string> = { empire: 'Empire', elfe: 'Elfes', demons: 'Démons', nomades: 'Nomades' };
const rows: string[] = [];
const bilan: string[] = [];
for (const key of KEYS) {
  const file = `reports/normal-${key.replace('+', '-')}.json`;
  if (!existsSync(file)) { console.warn(`manquant : ${file}`); continue; }
  const r = JSON.parse(readFileSync(file, 'utf8')) as { faction: string; generation: number; best: { deck: string[]; rate: number; games: number }[] };
  const label = key.split('+').map(f => NAME[f]).join(' + ');
  rows.push(`  { id: '${key.replace('+', '-')}', faction: '${r.faction}', label: '${label}', cards: ${JSON.stringify(r.best[0]!.deck)} },`);
  bilan.push(`${label} : ${Math.round(100 * r.best[0]!.rate)} % sur ${r.best[0]!.games} parties (génération ${r.generation})`);
}
writeFileSync('src/data/optimizedNormal.ts', `// Decks du mode normal contre l'ordinateur (18/11/2026) : le meilleur deck de chaque faction et de chaque binôme,
// optimisé pour l'IA forte contre les 12 decks optimisés du 25/10 (tools/normal-evolve.ts, export : tools/normal-export.ts).
${bilan.map(b => `// - ${b}`).join('\n')}
import type { OptimizedDeck } from './optimized';

export const NORMAL_DECKS: OptimizedDeck[] = [
${rows.join('\n')}
];
`);
console.log(bilan.join('\n'));
