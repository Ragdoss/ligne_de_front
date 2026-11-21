// Écrit src/roguelite/act3decks.ts à partir des meilleurs decks trouvés par tools/act3-evolve.ts (act3-*.json).
// Usage : npx tsx tools/act3-export.ts [dossier des résultats = reports]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const DIR = process.argv[2] ?? 'reports';
const LABEL: Record<string, string> = {
  'empire+elfe': 'Alliance déchue (Empire et Elfes)', 'empire+demons': 'Légion damnée (Empire et Démons)',
  'empire+nomades': 'Convoi maudit (Empire et Nomades)', 'elfe+demons': 'Sylve corrompue (Elfes et Démons)',
  'elfe+nomades': 'Mirage sylvestre (Elfes et Nomades)', 'demons+nomades': 'Caravane des âmes (Démons et Nomades)',
  'empire+elfe+demons': 'Trinité brisée (Empire, Elfes et Démons)', 'empire+elfe+nomades': 'Coalition des vivants (Empire, Elfes et Nomades)',
  'empire+demons+nomades': 'Horde du Pacte (Empire, Démons et Nomades)', 'elfe+demons+nomades': 'Peuples égarés (Elfes, Démons et Nomades)',
};
const rows = readdirSync(DIR).filter(f => /^act3-.*\.json$/.test(f)).map(f => JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')) as { key: string; generation: number; best: { deck: string[]; rate: number }[] });
rows.sort((a, b) => Object.keys(LABEL).indexOf(a.key) - Object.keys(LABEL).indexOf(b.key));
const out = [
  '// Decks adverses de l\'acte 3 du roguelite (généré par tools/act3-export.ts, ne pas modifier à la main).',
  '// Optimisés par tools/act3-evolve.ts pour commencer au niveau 3 (main de départ : 1 régiment de niveau 2 et 2 de niveau 3),',
  '// défaite à 50 de lassitude ; 6 paires et 4 trios de factions, 45 cartes.',
  'import type { Act2Deck } from \'./act2decks\';',
  '',
  'export const ACT3_DECKS: Act2Deck[] = [',
  ...rows.map(r => `  { key: '${r.key}', label: '${(LABEL[r.key] ?? r.key).replace(/'/g, '’')}', factions: ${JSON.stringify(r.key.split('+'))}, rate: ${Math.round(100 * r.best[0]!.rate)}, cards: ${JSON.stringify(r.best[0]!.deck)} },`),
  '];',
  '',
];
writeFileSync('src/roguelite/act3decks.ts', out.join('\n'));
console.log(rows.map(r => `${r.key} : ${Math.round(100 * r.best[0]!.rate)} % (génération ${r.generation})`).join('\n'));
