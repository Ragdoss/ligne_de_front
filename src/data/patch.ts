// Modifications d'équilibrage testées sans toucher au catalogue : un fichier JSON { carte: { champ: valeur } }.
import { readFileSync } from 'node:fs';
import { CARDS } from './cards';

/** Applique un fichier de modifications au catalogue (en mémoire). Retourne la liste lisible des changements. */
export function applyPatchFile(file: string): string[] {
  const patch = JSON.parse(readFileSync(file, 'utf8')) as Record<string, Record<string, unknown>>;
  const changes: string[] = [];
  for (const [id, fields] of Object.entries(patch)) {
    if (id.startsWith('_')) continue;
    const c = CARDS[id];
    if (!c) throw new Error(`Carte inconnue dans ${file} : ${id}`);
    for (const [k, v] of Object.entries(fields)) {
      changes.push(`${id}.${k} : ${JSON.stringify(c[k] ?? null)} → ${JSON.stringify(v)}`);
      (c as Record<string, unknown>)[k] = v;
    }
  }
  return changes;
}

/** Lit « --patch fichier » dans les arguments ; renvoie les autres arguments et le nom du patch (ou null). */
export function patchFromArgs(argv: string[]): { args: string[]; patch: string | null; changes: string[] } {
  const i = argv.indexOf('--patch');
  if (i === -1) return { args: argv, patch: null, changes: [] };
  const file = argv[i + 1];
  if (!file) throw new Error('--patch demande un fichier');
  const changes = applyPatchFile(file);
  return { args: [...argv.slice(0, i), ...argv.slice(i + 2)], patch: file, changes };
}
