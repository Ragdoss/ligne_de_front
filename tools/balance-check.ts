// Mesure d'un équilibrage : les 5 meilleurs decks optimisés de chaque faction s'affrontent (factions différentes,
// chaque paire deux fois), avec les valeurs actuelles puis avec d'anciennes valeurs (OLD, en mémoire), mêmes parties.
// Usage : npx tsx tools/balance-check.ts ['<json {id: {champ: ancienne valeur}}>']  (sans argument : valeurs actuelles)
import { readFileSync } from 'node:fs';
import { chooseActionV3, DEFAULT_WEIGHTS, STRONG_AI } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { applyAction, createGame } from '../src/engine/game';
import type { CardDef, Faction } from '../src/engine/types';

const OLD = JSON.parse(process.argv[2] ?? '{}') as Record<string, Partial<CardDef>>;
const F: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];
type D = { faction: Faction; deck: string[] };
const champs: D[] = F.flatMap(f => (JSON.parse(readFileSync(`reports/evo-${f}.json`, 'utf8')) as { pop: { deck: string[] }[] }).pop.slice(0, 5).map(p => ({ faction: f, deck: p.deck })));
function play(a: D, b: D, seed: string): 'A' | 'B' {
  let s = createGame({ seed, A: { faction: a.faction, deck: a.deck }, B: { faction: b.faction, deck: b.deck } });
  for (let k = 0; k < 5000 && !s.over && s.turn <= 80; k++) {
    const r = applyAction(s, chooseActionV3(s, DEFAULT_WEIGHTS, undefined, STRONG_AI)); if (!r.ok) throw new Error(r.error); s = r.state;
  }
  return (s.over ? s.over.winner === 'A' : s.players.A.points <= s.players.B.points) ? 'A' : 'B';
}
function tour(tag: string) {
  const win: Record<string, Record<string, number>> = {}, games: Record<string, Record<string, number>> = {};
  for (let i = 0; i < champs.length; i++) for (let j = i + 1; j < champs.length; j++) {
    const a = champs[i]!, b = champs[j]!;
    if (a.faction === b.faction) continue;
    for (const g of [0, 1, 2, 3]) {
      const [x, y] = g % 2 ? [b, a] : [a, b];
      const w = play(x, y, `bal-${i}-${j}-${g}`) === 'A' ? x : y, l = w === x ? y : x;
      (win[w.faction] ??= {})[l.faction] = (win[w.faction]![l.faction] ?? 0) + 1;
      for (const [p, q] of [[x, y], [y, x]] as const) (games[p.faction] ??= {})[q.faction] = (games[p.faction]![q.faction] ?? 0) + 1;
    }
  }
  console.log(`== ${tag}`);
  for (const f of F) {
    const w = F.reduce((t, x) => t + (win[f]?.[x] ?? 0), 0), g = F.reduce((t, x) => t + (games[f]?.[x] ?? 0), 0);
    console.log(`${f}: ${Math.round(100 * w / g)} %  | ${F.filter(x => x !== f).map(x => `${x} ${Math.round(100 * (win[f]?.[x] ?? 0) / (games[f]?.[x] ?? 1))}`).join(', ')}`);
  }
}
for (const [id, o] of Object.entries(OLD)) CARDS[id] = { ...CARDS[id]!, ...o } as CardDef;
tour(Object.keys(OLD).length ? 'avant (anciennes valeurs)' : 'après');
