// Duel d'IA : la nouvelle IA (v2) contre l'ancienne (v1), avec les decks de démonstration, chaque camp joué des deux côtés.
// Usage : npx tsx tools/ai-duel.ts [parties par match-up, défaut 10]
import { chooseAction, chooseActionV1, DEFAULT_WEIGHTS, type AiWeights } from '../src/ai/heuristic';
import { DEMO_DECKS } from '../src/data/decks';
import { actingPlayer, applyAction, createGame } from '../src/engine/game';
import type { Faction, PlayerId } from '../src/engine/types';

const N = Number(process.argv[2] ?? 10);
const W: AiWeights = { ...DEFAULT_WEIGHTS, ...JSON.parse(process.argv[3] ?? '{}') };
const F: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];
let v2 = 0, v1 = 0, draws = 0;
const t0 = Date.now();
for (const fa of F) for (const fb of F) for (let g = 0; g < N; g++) {
  const v2Side: PlayerId = g % 2 === 0 ? 'A' : 'B';
  let s = createGame({ seed: `duel-${fa}-${fb}-${g}`, A: { faction: fa, deck: DEMO_DECKS[fa]! }, B: { faction: fb, deck: DEMO_DECKS[fb]! } });
  for (let n = 0; n < 5000 && !s.over && s.turn <= 80; n++) {
    const a = actingPlayer(s) === v2Side ? chooseAction(s, W) : chooseActionV1(s);
    const r = applyAction(s, a);
    if (!r.ok) throw new Error(r.error);
    s = r.state;
  }
  if (!s.over) draws++; else if (s.over.winner === v2Side) v2++; else v1++;
}
const T = v1 + v2 + draws;
console.log(`IA v2 : ${v2}/${T} (${Math.round((100 * v2) / T)} %) — v1 : ${v1} — nuls ${draws} — ${Math.round((Date.now() - t0) / 1000)} s`);
