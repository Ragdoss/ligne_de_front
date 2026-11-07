// Écrit src/roguelite/act2decks.ts à partir des meilleurs decks trouvés par tools/act2-evolve.ts (reports/act2-*.json).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const LABEL: Record<string, string> = {
  empire: 'Légion trompée', elfe: 'Chasseurs égarés', demons: 'Cercle corrompu', nomades: 'Tribu dévoyée',
  'empire+elfe': 'Coalition de la frontière (Empire et Elfes)', 'empire+demons': 'Légion du Pacte (Empire et Démons)',
  'empire+nomades': 'Caravane impériale (Empire et Nomades)', 'elfe+demons': 'Forêt souillée (Elfes et Démons)',
  'elfe+nomades': 'Oasis sylvestre (Elfes et Nomades)', 'demons+nomades': 'Marchands d’âmes (Démons et Nomades)',
};
const rows = readdirSync('reports').filter(f => /^act2-.*\.json$/.test(f)).map(f => JSON.parse(readFileSync(`reports/${f}`, 'utf8')) as { key: string; generation: number; best: { deck: string[]; rate: number }[] });
rows.sort((a, b) => Object.keys(LABEL).indexOf(a.key) - Object.keys(LABEL).indexOf(b.key));
const out = [
  '// Decks adverses de l\'acte 2 du roguelite (généré par tools/act2-export.ts, ne pas modifier à la main).',
  '// Optimisés par tools/act2-evolve.ts pour commencer au niveau 2 (main de départ : 3 régiments de niveau 2), défaite à 25 de lassitude.',
  'import type { Faction } from \'../engine/types\';',
  '',
  'export interface Act2Deck { key: string; label: string; factions: Faction[]; cards: string[]; rate: number }',
  'export const ACT2_DECKS: Act2Deck[] = [',
  ...rows.map(r => `  { key: '${r.key}', label: '${(LABEL[r.key] ?? r.key).replace(/'/g, '’')}', factions: ${JSON.stringify(r.key.split('+'))}, rate: ${Math.round(100 * r.best[0]!.rate)}, cards: ${JSON.stringify(r.best[0]!.deck)} },`),
  '];',
  '',
];
writeFileSync('src/roguelite/act2decks.ts', out.join('\n'));
console.log(rows.map(r => `${r.key} : ${Math.round(100 * r.best[0]!.rate)} % (génération ${r.generation})`).join('\n'));
