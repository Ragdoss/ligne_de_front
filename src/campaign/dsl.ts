// Petits raccourcis pour écrire les scénarios : « recrue_imp*4 » = 4 Recrues Impériales.
import type { DialogLine } from '../engine/types';

export const cards = (...specs: string[]): string[] =>
  specs.flatMap(s => { const [id, n] = s.split('*'); return Array<string>(Number(n ?? 1)).fill(id!); });

/** Dialogue : ['Qui', 'texte'] ou 'narration'. */
export const say = (...lines: (string | [string, string])[]): DialogLine[] =>
  lines.map(l => (typeof l === 'string' ? { who: '', text: l } : { who: l[0], text: l[1] }));

/** Aucune limite (lassitude sans défaite, règle « aucun régiment » désactivée…). */
export const NO_LIMIT = 1e9;
