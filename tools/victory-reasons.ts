// Types de victoire en finale (mêmes parties que balance-check) : raison, tour de fin, adversaire.
// Usage : npx tsx tools/victory-reasons.ts <shard> <nShards>   → JSON lignes sur stdout
import { readFileSync } from 'node:fs';
import { chooseActionV3, DEFAULT_WEIGHTS, STRONG_AI } from '../src/ai/heuristic';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction } from '../src/engine/types';

const [shard, n] = [Number(process.argv[2] ?? 0), Number(process.argv[3] ?? 1)];
const F: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];
type D = { faction: Faction; deck: string[] };
const champs: D[] = F.flatMap(f => (JSON.parse(readFileSync(`reports/evo-${f}.json`, 'utf8')) as { pop: { deck: string[] }[] }).pop.slice(0, 5).map(p => ({ faction: f, deck: p.deck })));
let k = 0;
for (let i = 0; i < champs.length; i++) for (let j = i + 1; j < champs.length; j++) {
  const a = champs[i]!, b = champs[j]!;
  if (a.faction === b.faction) continue;
  for (const g of [0, 1, 2, 3]) {
    if (k++ % n !== shard) continue;
    const [x, y] = g % 2 ? [b, a] : [a, b];
    let s = createGame({ seed: `bal-${i}-${j}-${g}`, A: { faction: x.faction, deck: x.deck }, B: { faction: y.faction, deck: y.deck } });
    for (let t = 0; t < 5000 && !s.over && s.turn <= 80; t++) { const r = applyAction(s, chooseActionV3(s, DEFAULT_WEIGHTS, undefined, STRONG_AI)); if (!r.ok) throw new Error(r.error); s = r.state; }
    const wA = s.over ? s.over.winner === 'A' : s.players.A.points <= s.players.B.points;
    const [w, l] = wA ? [x, y] : [y, x];
    const wp = wA ? 'A' : 'B', lp = wA ? 'B' : 'A';
    console.log(JSON.stringify({ winner: w.faction, loser: l.faction, reason: s.over?.reason ?? 'timeout', turn: s.turn,
      loserLass: s.players[lp].points, winnerLass: s.players[wp].points, loserDeck: s.players[lp].deck.length }));
  }
}
