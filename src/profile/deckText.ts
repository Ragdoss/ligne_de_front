// Export et import d'un deck sous forme de texte, pour le partager (copier-coller).
// Export : une ligne par carte, « 3 Recrues impériales », triée par niveau puis par nom ; une première ligne « # nom du deck ».
// Import : ce même format (noms ou identifiants), l'ancien format du simulateur (identifiants entre guillemets),
// ou une simple liste d'identifiants séparés par des espaces ou des virgules.
import { CARDS } from '../data/cards';
import { CARD_TEXT_FR } from '../i18n/cards.fr';

const nameOf = (id: string) => CARD_TEXT_FR[id]?.name ?? id;
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
let byName: Record<string, string> | null = null;
const idFromName = (w: string): string | undefined => {
  if (CARDS[w.trim()]) return w.trim();
  byName ??= Object.fromEntries(Object.keys(CARDS).map(id => [norm(nameOf(id)), id]));
  return byName[norm(w)];
};

export function exportDeck(cards: string[], name?: string): string {
  const n: Record<string, number> = {};
  for (const id of cards) n[id] = (n[id] ?? 0) + 1;
  const ids = Object.keys(n).sort((a, b) => CARDS[a]!.niveau - CARDS[b]!.niveau || nameOf(a).localeCompare(nameOf(b)));
  return [...(name ? [`# ${name}`] : []), ...ids.map(id => `${n[id]} ${nameOf(id)}`)].join('\n');
}

export function parseDeck(text: string): { deck: string[]; unknown: string[]; name?: string } {
  const deck: string[] = [], unknown: string[] = [];
  const quoted = [...text.matchAll(/['"]([a-z0-9_]+)['"]/g)].map(m => m[1]!);
  if (quoted.length) { for (const w of quoted) (CARDS[w] ? deck : unknown).push(w); return { deck, unknown }; }
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const title = lines.find(l => l.startsWith('#'))?.replace(/^#+\s*/, '');
  const body = lines.filter(l => !l.startsWith('#'));
  // Format exporté : « 3 Nom de carte » (ou « 3x Nom », « Nom »), une carte par ligne.
  const counted = body.length > 0 && body.every(l => /^\d+\s*[x×]?\s+\S/.test(l) || idFromName(l));
  if (counted) {
    for (const l of body) {
      const m = /^(\d+)\s*[x×]?\s+(.+)$/.exec(l);
      const k = m ? Number(m[1]) : 1, id = idFromName(m ? m[2]! : l);
      if (id) for (let i = 0; i < k; i++) deck.push(id); else unknown.push(m ? m[2]! : l);
    }
    return { deck, unknown, name: title };
  }
  for (const w of body.join(' ').split(/[\s,;]+/).filter(Boolean)) (CARDS[w] ? deck : unknown).push(w);
  return { deck, unknown, name: title };
}
