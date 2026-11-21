// Difficulté des combats de l'acte 3 du roguelite (21/11/2026) : un deck optimisé du menu tient le rôle de l'armée du
// joueur (lassitude de départ 16, défaite à 50), l'ordinateur normal joue des deux côtés.
// Usage : npx tsx tools/act3-sim.ts [parties par deck joueur et par combat = 2]
import { chooseAction } from '../src/ai/heuristic';
import { OPTIMIZED_DECKS } from '../src/data/optimized';
import { applyAction, createGame } from '../src/engine/game';
import type { GameEvent, GameState } from '../src/engine/types';
import { ACT3_DECKS } from '../src/roguelite/act3decks';
import { fight, newRun, registerRun, type NodeOption, type RunState } from '../src/roguelite/run';

const N = Number(process.argv[2] ?? 2);
// Repère : le boss de l'acte 2 dans les mêmes conditions (lassitude 8, défaite à 25), avec « act2 » en 2e argument.
const ACT = process.argv[3] === 'act2' ? 2 : 3;
const fights2: { label: string; o: (k: number) => NodeOption }[] = [
  { label: 'Acte 2 : combat', o: k => ({ kind: 'combat', reward: 'or', deck: `a2:${['empire+elfe', 'elfe+demons', 'empire+demons', 'demons+nomades'][k % 4]}` }) },
  { label: 'Acte 2 : Titan de la Fracture', o: k => ({ kind: 'boss', titan: 'fracture', deck: `a2:${['empire+elfe', 'elfe+demons', 'empire+demons', 'demons+nomades'][k % 4]}` }) },
];
const fights3: { label: string; o: (k: number) => NodeOption }[] = [
  { label: 'Combat', o: k => ({ kind: 'combat', reward: 'or', deck: `a3:${ACT3_DECKS[k % ACT3_DECKS.length]!.key}` }) },
  { label: 'Titan du Reflet', o: k => ({ kind: 'miniboss', boss: 'reflet', deck: `a3:${ACT3_DECKS[k % ACT3_DECKS.length]!.key}` }) },
  { label: 'Titan de la Discorde', o: k => ({ kind: 'boss', titan: 'discorde', deck: `a3:${ACT3_DECKS[k % ACT3_DECKS.length]!.key}` }) },
];
for (const f of ACT === 2 ? fights2 : fights3) {
  let wins = 0, games = 0, turns = 0;
  const reasons: Record<string, number> = {}, fx: Record<string, number> = {};
  for (const [i, d] of OPTIMIZED_DECKS.entries()) {
    for (let g = 0; g < N; g++) {
      const k = i * N + g;
      const base = newRun(`sim-${k}`);
      const run: RunState = { ...base, act: ACT, lassitude: ACT === 2 ? 8 : 16, deck: d.cards.map((id, j) => ({ uid: j + 1, id, mods: {} })), nextUid: d.cards.length + 1, champion: d.faction === 'elfe' ? 'eldrin' : d.faction === 'nomades' ? 'sultan' : 'augustus' };
      registerRun(run);
      let s: GameState = createGame(fight(run, f.o(k), `sim-${k}`).setup);
      for (let n = 0; n < 8000 && !s.over && s.turn <= 70; n++) {
        const r = applyAction(s, chooseAction(s));
        if (!r.ok) throw new Error(`${f.label} : ${r.error}`);
        for (const e of r.events as GameEvent[]) if (e.type === 'effect' && ['controlUntilBroken', 'controlMind', 'controlKept', 'refletCopy', 'controlReturned'].includes(e.key)) fx[e.key] = (fx[e.key] ?? 0) + 1;
        s = r.state;
      }
      games++; turns += s.turn;
      if (s.over?.winner === 'A') wins++;
      const why = s.over ? `${s.over.winner === 'A' ? 'joueur' : 'Titan'} : ${s.over.reason}` : 'tours';
      reasons[why] = (reasons[why] ?? 0) + 1;
    }
  }
  console.log(`${f.label} : le joueur gagne ${Math.round((100 * wins) / games)} % (${games} parties, ${(turns / games).toFixed(1)} tours en moyenne)`);
  console.log(`  fins : ${Object.entries(reasons).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  console.log(`  effets (par partie) : ${Object.entries(fx).map(([k, v]) => `${k} ${(v / games).toFixed(1)}`).join(', ')}`);
}
