// Tournoi des decks du mode normal (src/data/optimizedNormal.ts) : chaque paire de decks s'affronte N fois, chacun
// commençant à tour de rôle, IA forte des deux côtés. Option --patch balance/x.json : valeurs de cartes d'essai.
// Option --only <texte> : seulement les paires dont un des decks contient ce texte (ex. --only nomades).
// Variables d'environnement : NL_V2=tag (ajoute les decks reports/normal-<id>-<tag>.json sous l'id <id>-<tag>),
// NL_EXTRA=deck.json,deck.json (decks { id, faction, cards } en plus).
// Usage : npx tsx tools/normal-league.ts [parties par paire=20] [shard=0] [nShards=1] [--patch fichier] [--only texte]
//         → une ligne JSON par partie { a, b, g, first, winner, reason, turn } sur stdout
import { existsSync, readFileSync } from 'node:fs';
import { chooseActionV3, STRONG_AI } from '../src/ai/heuristic';
import { NORMAL_DECKS } from '../src/data/optimizedNormal';
import { patchFromArgs } from '../src/data/patch';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction, GameState } from '../src/engine/types';

const { args: rest } = patchFromArgs(process.argv.slice(2));
const oi = rest.indexOf('--only');
const ONLY = oi === -1 ? null : rest[oi + 1]!;
const args = oi === -1 ? rest : [...rest.slice(0, oi), ...rest.slice(oi + 2)];
const N = Number(args[0] ?? 20), SHARD = Number(args[1] ?? 0), NS = Number(args[2] ?? 1);
type D = { id: string; faction: Faction; cards: string[] };
const DECKS: D[] = [...NORMAL_DECKS];
const TAG = process.env.NL_V2;
if (TAG) for (const d of NORMAL_DECKS) {
  const f = `reports/normal-${d.id}-${TAG}.json`;
  if (!existsSync(f)) continue;
  const r = JSON.parse(readFileSync(f, 'utf8')) as { faction: Faction; best: { deck: string[] }[] };
  DECKS.push({ id: `${d.id}-${TAG}`, faction: r.faction, cards: r.best[0]!.deck });
}
for (const f of (process.env.NL_EXTRA ?? '').split(',').filter(Boolean)) DECKS.push(JSON.parse(readFileSync(f, 'utf8')) as D);
let job = 0;
for (let i = 0; i < DECKS.length; i++) {
  for (let j = i + 1; j < DECKS.length; j++) {
    for (let g = 0; g < N; g++) {
      const a = DECKS[i]!, b = DECKS[j]!;
      if (ONLY && !a.id.includes(ONLY) && !b.id.includes(ONLY)) continue;
      if (job++ % NS !== SHARD) continue;
      const aFirst = g % 2 === 0;
      const P = (d: D) => ({ faction: d.faction, deck: d.cards });
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
