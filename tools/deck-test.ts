// Fait jouer des decks (fichiers texte au format exporté, ou JSON) contre les 5 meilleurs decks optimisés de chaque
// autre faction, IA forte des deux côtés, mêmes parties pour tous, et compare aux meilleurs decks optimisés.
// Usage : npx tsx tools/deck-test.ts <parties=60> <faction:fichier> [faction:fichier…]
import { readFileSync } from 'node:fs';
import { chooseActionV3, DEFAULT_WEIGHTS, STRONG_AI } from '../src/ai/heuristic';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction } from '../src/engine/types';
import { parseDeck } from '../src/profile/deckText';

const N = Number(process.argv[2] ?? 60);
const F: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];
type D = { faction: Faction; deck: string[]; label: string };
const evo = (f: Faction) => (JSON.parse(readFileSync(`reports/evo-${f}.json`, 'utf8')) as { pop: { deck: string[] }[] }).pop;
const read = (p: string) => (p.endsWith('.json') ? JSON.parse(readFileSync(p, 'utf8')) as string[] : parseDeck(readFileSync(p, 'utf8')).deck);
const tested: D[] = process.argv.slice(3).map(a => { const [f, p] = a.split(':') as [Faction, string]; return { faction: f, deck: read(p), label: p }; });
for (const f of ['elfe', 'demons'] as Faction[]) tested.push({ faction: f, deck: evo(f)[0]!.deck, label: `meilleur optimisé ${f}` });

function play(a: D, b: D, seed: string): 'A' | 'B' {
  let s = createGame({ seed, A: { faction: a.faction, deck: a.deck }, B: { faction: b.faction, deck: b.deck } });
  for (let k = 0; k < 5000 && !s.over && s.turn <= 80; k++) {
    const r = applyAction(s, chooseActionV3(s, DEFAULT_WEIGHTS, undefined, STRONG_AI)); if (!r.ok) throw new Error(r.error); s = r.state;
  }
  return (s.over ? s.over.winner === 'A' : s.players.A.points <= s.players.B.points) ? 'A' : 'B';
}
for (const d of tested) {
  const by: Record<string, [number, number]> = {};
  for (const of of F) {
    const opps = evo(of).slice(0, 5);
    for (let k = 0; k < N / 4; k++) {
      const o: D = { faction: of, deck: opps[k % opps.length]!.deck, label: '' };
      const side = k % 2 === 0 ? 'A' : 'B';
      const r = side === 'A' ? play(d, o, `dt-${of}-${k}`) : play(o, d, `dt-${of}-${k}`);
      const x = (by[of] ??= [0, 0]); if (r === side) x[0]++; x[1]++;
    }
  }
  const w = Object.values(by).reduce((t, x) => t + x[0], 0), g = Object.values(by).reduce((t, x) => t + x[1], 0);
  console.log(`${d.label} (${d.deck.length} cartes) : ${Math.round(100 * w / g)} %  | ${F.map(f => `${f} ${Math.round(100 * by[f]![0] / by[f]![1])}`).join(', ')}`);
}
