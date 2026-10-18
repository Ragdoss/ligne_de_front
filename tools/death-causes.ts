// Causes de destruction des régiments (END, Moral, les deux, effet) sur des parties entre les 40 qualifiés de l'échelle.
// Usage : npx tsx tools/death-causes.ts [parties=300] [--patch balance/x.json]
import { readFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { patchFromArgs } from '../src/data/patch';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction } from '../src/engine/types';

const { args, patch } = patchFromArgs(process.argv.slice(2));
const N = Number(args[0] ?? 300);
const decks = (['empire', 'elfe', 'demons', 'nomades'] as Faction[]).flatMap(f => (JSON.parse(readFileSync(`reports/echelle-${f}.json`, 'utf8')) as { top: { faction: Faction; deck: string[] }[] }).top);
const causes: Record<string, number> = {};
for (let k = 0; k < N; k++) {
  const x = decks[(k * 7) % 40]!, y = decks[(k * 13 + 5) % 40]!;
  let s = createGame({ seed: `morts-${k}`, A: { faction: x.faction, deck: x.deck }, B: { faction: y.faction, deck: y.deck } });
  for (let n = 0; n < 5000 && !s.over && s.turn <= 80; n++) {
    const r = applyAction(s, chooseAction(s)); if (!r.ok) throw new Error(r.error); s = r.state;
    for (const e of r.events) if (e.type === 'destroyed' && e.lassitude > 0) causes[e.cause] = (causes[e.cause] ?? 0) + 1;
  }
}
const total = Object.values(causes).reduce((a, b) => a + b, 0);
console.log(`${patch ?? 'règles actuelles'} : ${total} régiments détruits sur ${N} parties (${(total / N).toFixed(1)} par partie)`);
for (const [k, v] of Object.entries(causes).sort((a, b) => b[1] - a[1])) console.log(`  ${k} : ${v} (${Math.round((100 * v) / total)} %)`);
