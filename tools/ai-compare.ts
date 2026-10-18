// IA avec et sans un réglage : les 40 decks qualifiés de l'échelle s'affrontent, chaque paire jouée deux fois
// (chaque IA joue chaque deck une fois). Usage : npx tsx tools/ai-compare.ts [paires=60]
import { readFileSync } from 'node:fs';
import { chooseAction, DEFAULT_WEIGHTS, type AiWeights } from '../src/ai/heuristic';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction, PlayerId } from '../src/engine/types';

const N = Number(process.argv[2] ?? 60);
const OLD: AiWeights = { ...DEFAULT_WEIGHTS, deck: 0 };
const NEW: AiWeights = { ...DEFAULT_WEIGHTS, deck: Number(process.env.NEW_DECK ?? DEFAULT_WEIGHTS.deck) };
const decks = (['empire', 'elfe', 'demons', 'nomades'] as Faction[]).flatMap(f => (JSON.parse(readFileSync(`reports/echelle-${f}.json`, 'utf8')) as { top: { faction: Faction; deck: string[] }[] }).top);
let newWins = 0, games = 0;
for (let k = 0; k < N; k++) {
  const x = decks[(k * 7) % decks.length]!, y = decks[(k * 13 + 5) % decks.length]!;
  for (const newSide of ['A', 'B'] as PlayerId[]) {
    let s = createGame({ seed: `cmp-${k}-${newSide}`, A: { faction: x.faction, deck: x.deck }, B: { faction: y.faction, deck: y.deck } });
    for (let n = 0; n < 5000 && !s.over && s.turn <= 80; n++) {
      const w = s.active === newSide || (s.pending[0] && s.pending[0].player === newSide) ? NEW : OLD;
      const r = applyAction(s, chooseAction(s, w)); if (!r.ok) throw new Error(r.error); s = r.state;
    }
    const winA = s.over ? s.over.winner === 'A' : s.players.A.points <= s.players.B.points;
    if ((winA ? 'A' : 'B') === newSide) newWins++;
    games++;
  }
}
console.log(`IA avec le réglage d'usure : ${newWins}/${games} (${Math.round((100 * newWins) / games)} %) contre l'IA sans`);
