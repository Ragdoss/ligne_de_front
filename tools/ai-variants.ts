// Compare deux IA (v2 et une variante v3) sur les 40 decks qualifiés : chaque paire de decks est jouée deux fois,
// chaque IA jouant chaque deck une fois. Usage : npx tsx tools/ai-variants.ts <paires> '<options JSON>' ['<poids JSON>']
import { readFileSync } from 'node:fs';
import { chooseAction, chooseActionV3, DEFAULT_WEIGHTS, type AiOptions, type AiWeights } from '../src/ai/heuristic';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction, PlayerId } from '../src/engine/types';

const N = Number(process.argv[2] ?? 40);
const opts: AiOptions = JSON.parse(process.argv[3] ?? '{}');
const W: AiWeights = { ...DEFAULT_WEIGHTS, ...JSON.parse(process.argv[4] ?? '{}') };
const base = process.argv[5] ? JSON.parse(process.argv[5]) as AiOptions : null; // adversaire : v3 avec ces options (sinon v2)
const decks = (['empire', 'elfe', 'demons', 'nomades'] as Faction[]).flatMap(f => (JSON.parse(readFileSync(`reports/echelle-${f}.json`, 'utf8')) as { top: { faction: Faction; deck: string[] }[] }).top);
let wins = 0, games = 0, tNew = 0, tOld = 0;
const t0 = Date.now();
for (let k = 0; k < N; k++) {
  const x = decks[(k * 7) % decks.length]!, y = decks[(k * 13 + 5) % decks.length]!;
  for (const side of ['A', 'B'] as PlayerId[]) {
    let s = createGame({ seed: `var-${k}-${side}`, A: { faction: x.faction, deck: x.deck }, B: { faction: y.faction, deck: y.deck } });
    for (let n = 0; n < 5000 && !s.over && s.turn <= 80; n++) {
      const mine = s.active === side || (s.pending[0] && s.pending[0].player === side);
      const t = Date.now();
      const a = mine ? chooseActionV3(s, W, undefined, opts) : base ? chooseActionV3(s, DEFAULT_WEIGHTS, undefined, base) : chooseAction(s);
      if (mine) tNew += Date.now() - t; else tOld += Date.now() - t;
      const r = applyAction(s, a); if (!r.ok) throw new Error(r.error); s = r.state;
    }
    const winA = s.over ? s.over.winner === 'A' : s.players.A.points <= s.players.B.points;
    if ((winA ? 'A' : 'B') === side) wins++;
    games++;
  }
}
console.log(`${JSON.stringify(opts)} ${process.argv[4] ?? ''} : ${wins}/${games} (${Math.round((100 * wins) / games)} %) ; temps IA ${Math.round(tNew / 1000)} s contre ${Math.round(tOld / 1000)} s ; total ${Math.round((Date.now() - t0) / 1000)} s`);
