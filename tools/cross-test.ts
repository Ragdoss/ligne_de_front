// Fait jouer des decks d'une faction (champions de plusieurs populations) contre les 5 meilleurs decks de chaque
// autre faction, sur les mêmes parties pour tous. Usage :
//   npx tsx tools/cross-test.ts <faction> <parties par paire> <fichier evo>[,<fichier evo>…] [shard nShards]
// Sortie : une ligne JSON par partie { deck, opp, win }.
import { readFileSync } from 'node:fs';
import { chooseActionV3, DEFAULT_WEIGHTS, STRONG_AI } from '../src/ai/heuristic';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction } from '../src/engine/types';

const me = process.argv[2] as Faction;
const N = Number(process.argv[3] ?? 8);
const files = (process.argv[4] ?? `reports/evo-${me}.json`).split(',');
const [shard, nShards] = [Number(process.argv[5] ?? 0), Number(process.argv[6] ?? 1)];
const F: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];
const top = (file: string, n: number) => (JSON.parse(readFileSync(file, 'utf8')) as { pop: { deck: string[] }[] }).pop.slice(0, n).map(p => p.deck);
const mine = files.map(f => ({ name: f, deck: top(f, 1)[0]! }));
const ONLY = process.env.XT_OPP?.split(',');
const opps = F.filter(f => f !== me && (!ONLY || ONLY.includes(f))).flatMap(f => top(`reports/evo-${f}.json`, 5).map((deck, i) => ({ faction: f, i, deck })));
let k = 0;
for (const o of opps) for (let g = 0; g < N; g++) for (const m of mine) {
  if (k++ % nShards !== shard) continue;
  const meA = g % 2 === 0;
  const A = meA ? { faction: me, deck: m.deck } : { faction: o.faction, deck: o.deck };
  const B = meA ? { faction: o.faction, deck: o.deck } : { faction: me, deck: m.deck };
  let s = createGame({ seed: `x-${o.faction}-${o.i}-${g}`, A, B });
  for (let t = 0; t < 5000 && !s.over && s.turn <= 80; t++) { const r = applyAction(s, chooseActionV3(s, DEFAULT_WEIGHTS, undefined, STRONG_AI)); if (!r.ok) throw new Error(r.error); s = r.state; }
  const wA = s.over ? s.over.winner === 'A' : s.players.A.points <= s.players.B.points;
  console.log(JSON.stringify({ deck: m.name, opp: o.faction, win: wA === meA, reason: s.over?.reason ?? 'timeout' }));
}
