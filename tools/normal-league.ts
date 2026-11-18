// Tournoi des decks du mode normal (src/data/optimizedNormal.ts) : chaque paire de decks s'affronte N fois, chacun
// commençant à tour de rôle, IA forte des deux côtés. Option --patch balance/x.json : valeurs de cartes d'essai.
// Option --only <texte> : seulement les paires dont un des decks contient ce texte (ex. --only nomades).
// Usage : npx tsx tools/normal-league.ts [parties par paire=20] [shard=0] [nShards=1] [--patch fichier] [--only texte]
//         → une ligne JSON par partie { a, b, g, first, winner, reason, turn } sur stdout
import { chooseActionV3, STRONG_AI } from '../src/ai/heuristic';
import { NORMAL_DECKS } from '../src/data/optimizedNormal';
import { patchFromArgs } from '../src/data/patch';
import { applyAction, createGame } from '../src/engine/game';
import type { GameState } from '../src/engine/types';

const { args: rest } = patchFromArgs(process.argv.slice(2));
const oi = rest.indexOf('--only');
const ONLY = oi === -1 ? null : rest[oi + 1]!;
const args = oi === -1 ? rest : [...rest.slice(0, oi), ...rest.slice(oi + 2)];
const N = Number(args[0] ?? 20), SHARD = Number(args[1] ?? 0), NS = Number(args[2] ?? 1);
let job = 0;
for (let i = 0; i < NORMAL_DECKS.length; i++) {
  for (let j = i + 1; j < NORMAL_DECKS.length; j++) {
    for (let g = 0; g < N; g++) {
      const a = NORMAL_DECKS[i]!, b = NORMAL_DECKS[j]!;
      if (ONLY && !a.id.includes(ONLY) && !b.id.includes(ONLY)) continue;
      if (job++ % NS !== SHARD) continue;
      const aFirst = g % 2 === 0;
      const P = (d: typeof a) => ({ faction: d.faction, deck: d.cards });
      let s: GameState = createGame({ seed: `league-${a.id}-${b.id}-${g}`, first: 'A', A: P(aFirst ? a : b), B: P(aFirst ? b : a) });
      for (let k = 0; k < 5000 && !s.over && s.turn <= 80; k++) {
        const r = applyAction(s, chooseActionV3(s, undefined, undefined, STRONG_AI));
        if (!r.ok) throw new Error(r.error);
        s = r.state;
      }
      const w = s.over ? s.over.winner : (s.players.A.points <= s.players.B.points ? 'A' : 'B');
      const winner = (w === 'A') === aFirst ? a.id : b.id;
      console.log(JSON.stringify({ a: a.id, b: b.id, g, first: aFirst ? a.id : b.id, winner, reason: s.over?.reason ?? 'tours', turn: s.turn }));
    }
  }
}
