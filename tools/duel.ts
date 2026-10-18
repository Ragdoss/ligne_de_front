// Duel entre deux decks des rapports d'échelle : N parties, chacun commence une fois sur deux.
// Usage : npx tsx tools/duel.ts <rapport A> <deck A> <rapport B> <deck B> [parties=200]
import { readFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction } from '../src/engine/types';

const [fa, ia, fb, ib, n] = process.argv.slice(2);
const get = (file: string, id: string) => (JSON.parse(readFileSync(file, 'utf8')) as { top: { id: string; faction: Faction; deck: string[] }[] }).top.find(e => e.id === id)!;
const A = get(fa!, ia!), B = get(fb!, ib!);
const G = Number(n ?? 200);
let wa = 0;
const reasons: Record<string, number> = {};
for (let g = 0; g < G; g++) {
  const aFirst = g % 2 === 0;
  const P = aFirst ? { A: A, B: B } : { A: B, B: A };
  let s = createGame({ seed: `duel-${g}`, A: { faction: P.A.faction, deck: P.A.deck }, B: { faction: P.B.faction, deck: P.B.deck } });
  for (let k = 0; k < 5000 && !s.over && s.turn <= 80; k++) { const r = applyAction(s, chooseAction(s)); if (!r.ok) throw new Error(r.error); s = r.state; }
  const winA = s.over ? s.over.winner === 'A' : s.players.A.points <= s.players.B.points;
  const aWon = aFirst ? winA : !winA;
  if (aWon) wa++;
  const key = `${aWon ? A.id : B.id}-${s.over?.reason ?? 'tours'}`;
  reasons[key] = (reasons[key] ?? 0) + 1;
}
console.log(`${A.id} contre ${B.id} : ${wa}/${G} (${Math.round((100 * wa) / G)} %) pour ${A.id}`);
console.log(Object.entries(reasons).map(([k, v]) => `${k} ${v}`).join(', '));
