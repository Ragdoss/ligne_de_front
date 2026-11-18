// Fait jouer un deck (fichier JSON { faction, cards }) contre les 10 decks du mode normal (src/data/optimizedNormal.ts),
// N parties chacun (chacun commence à tour de rôle), IA forte des deux côtés.
// Usage : npx tsx tools/deck-vs-normal.ts <deck.json> [parties=24] [shard=0] [nShards=1]  → une ligne JSON par partie
import { readFileSync } from 'node:fs';
import { chooseActionV3, STRONG_AI } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { NORMAL_DECKS } from '../src/data/optimizedNormal';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction, GameState } from '../src/engine/types';

const me = JSON.parse(readFileSync(process.argv[2]!, 'utf8')) as { id?: string; faction: Faction; cards: string[] };
const N = Number(process.argv[3] ?? 24), SHARD = Number(process.argv[4] ?? 0), NS = Number(process.argv[5] ?? 1);
const low = me.cards.filter(id => CARDS[id]!.niveau <= 3).length;
if (me.cards.length !== 45 || low !== 30) throw new Error(`deck invalide : ${me.cards.length} cartes, ${low} de niveau 1-3`);
const id = me.id ?? 'essai';
let job = 0;
for (const o of NORMAL_DECKS) {
  for (let g = 0; g < N; g++) {
    if (job++ % NS !== SHARD) continue;
    const meFirst = g % 2 === 0;
    const A = { faction: me.faction, deck: me.cards }, B = { faction: o.faction, deck: o.cards };
    let s: GameState = createGame({ seed: `vs-${o.id}-${g}`, first: 'A', A: meFirst ? A : B, B: meFirst ? B : A });
    for (let k = 0; k < 5000 && !s.over && s.turn <= 80; k++) {
      const r = applyAction(s, chooseActionV3(s, undefined, undefined, STRONG_AI));
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    const w = s.over ? s.over.winner : (s.players.A.points <= s.players.B.points ? 'A' : 'B');
    const winner = (w === 'A') === meFirst ? id : o.id;
    console.log(JSON.stringify({ a: id, b: o.id, g, first: meFirst ? id : o.id, winner, reason: s.over?.reason ?? 'tours', turn: s.turn }));
  }
}
