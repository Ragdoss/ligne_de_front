// Intègre définitivement un fichier d'équilibrage dans le catalogue (src/data/cards.ts).
// Usage : npm run integrate -- balance/fichier.json
import { readFileSync, writeFileSync } from 'node:fs';
import { CARDS } from '../src/data/cards';
import { applyPatchFile } from '../src/data/patch';

const file = process.argv[2];
if (!file) throw new Error('Usage : npm run integrate -- balance/fichier.json');
const changes = applyPatchFile(file);
const path = 'src/data/cards.ts';
const src = readFileSync(path, 'utf8');
const head = src.slice(0, src.indexOf('export const CARDS'));
writeFileSync(path, `${head}export const CARDS: Record<string, CardDef> = ${JSON.stringify(CARDS, null, 2)} as Record<string, CardDef>;\n`);
console.log(`${changes.length} modification(s) intégrée(s) depuis ${file} :\n` + changes.map(c => `- ${c}`).join('\n'));
