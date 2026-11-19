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
// Decks ajoutés après coup (nouvelles générations, decks toutes factions), gardés à côté des précédents : reports/normal-added.json.
if (existsSync('reports/normal-added.json')) {
  const added = JSON.parse(readFileSync('reports/normal-added.json', 'utf8')) as { id: string; faction: string; label: string; cards: string[]; note: string }[];
  for (const d of added) {
    rows.push(`  { id: '${d.id}', faction: '${d.faction}', label: '${d.label.replace(/'/g, "\\'")}', cards: ${JSON.stringify(d.cards)} },`);
    bilan.push(`${d.label} : ${d.note}`);
  }
}
writeFileSync('src/data/optimizedNormal.ts', `// Decks du mode normal contre l'ordinateur (18/11/2026) : le meilleur deck de chaque faction et de chaque binôme,
// optimisé pour l'IA forte (tools/normal-evolve.ts, export : tools/normal-export.ts) ; chaque deck retenu d'après les tournois
// entre decks (reports/normal-league.md). Taux ci-dessous : contre les adversaires de son optimisation (12 decks du 25/10, ou decks du mode normal).
${bilan.map(b => `// - ${b}`).join('\n')}
import type { OptimizedDeck } from './optimized';

export const NORMAL_DECKS: OptimizedDeck[] = [
${rows.join('\n')}
];
`);
console.log(bilan.join('\n'));
