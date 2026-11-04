// Simulation du prototype roguelite : l'ordinateur joue Augustus d'un bout à l'autre de l'acte 1
// (première option à chaque nœud, premier volontaire, premières cartes proposées), pour vérifier que tout s'enchaîne
// et mesurer jusqu'où va une run. Usage : npx tsx tools/roguelite-sim.ts [runs, défaut 20]
import { chooseAction } from '../src/ai/heuristic';
import { applyAction, createGame } from '../src/engine/game';
import {
  addCard, afterFight, applyCards, chooseOption, eligible, eventChoices, fight, marketOffers, newMeta, newRun, nextNode, offrandesWon, promotions,
  removeCard, resolveEvent, volunteers, type RunState,
} from '../src/roguelite/run';

const N = Number(process.argv[2] ?? 20);
const reached: number[] = [];
const fightStats: Record<string, { w: number; n: number }> = {};
let wins = 0;
for (let k = 0; k < N; k++) {
  const meta = newMeta();
  let run: RunState = newRun(`sim-${k}`);
  for (let guard = 0; guard < 60 && !run.over; guard++) {
    if (!run.current) {
      // Préfère un combat ou le mini-boss (l'ordinateur n'a pas de stratégie de route).
      const i = Math.max(0, run.options.findIndex(o => o.kind !== 'marche' && o.kind !== 'event'));
      run = chooseOption(run, meta, (k + guard) % 3 === 0 ? 0 : i);
      const o = run.current!;
      if (o.kind === 'combat' || o.kind === 'miniboss' || o.kind === 'boss') {
        const { sc, setup } = fight(run, o, `${run.seed}-${run.node}`);
        let s = createGame(setup);
        for (let n = 0; n < 6000 && !s.over && s.turn <= 60; n++) {
          const r = applyAction(s, chooseAction(s));
          if (!r.ok) throw new Error(`${sc.id} : ${r.error}`);
          s = r.state;
        }
        if (!s.over) s.over = { winner: 'B', reason: 'blocage' };
        const key = o.kind === 'combat' ? `combat (nœud ${run.node + 1})` : o.kind;
        fightStats[key] ??= { w: 0, n: 0 };
        fightStats[key].n++; if (s.over.winner === 'A') fightStats[key].w++;
        meta.offrandes += offrandesWon(o);
        run = afterFight(run, s);
      }
    }
    // Étapes : choix automatiques.
    while (run.steps.length && !run.over) {
      const st = run.steps.shift()!;
      if (st.kind === 'volontaires') addCard(run, volunteers(run, st.round)[0]!);
      if (st.kind === 'etendard') run.etendards.push(st.choices[0]!);
      if (st.kind === 'promotion') { const p = promotions(run)[0]; if (p) { removeCard(run, p.uid); addCard(run, p.to); } }
      if (st.kind === 'cartes') applyCards(run, st.purpose, eligible(run, st.purpose).slice(0, st.purpose === 'garde' ? 0 : st.n).map(c => c.uid));
      if (st.kind === 'evenement') { const ch = eventChoices(run, meta, st.id, st.second).find(c => !c.disabled)!; resolveEvent(run, meta, st.id, ch.id); }
      if (st.kind === 'marche') {
        for (const o of marketOffers(run)) if (o.kind === 'lassitude' && run.gold >= o.price && run.lassitude > 0) { run.gold -= o.price; run.lassitude = Math.max(0, run.lassitude - 5); }
      }
    }
    if (!run.over) run = nextNode(run);
  }
  if (run.over?.won) wins++;
  reached.push(run.node + (run.over?.won ? 1 : 0));
  process.stdout.write(`run ${k} : ${run.over?.won ? 'GAGNÉE' : `perdue au nœud ${run.node + 1}`} (lassitude ${run.lassitude}, deck ${run.deck.length}, or ${run.gold})\n`);
}
console.log(`\nRuns gagnées : ${wins}/${N}. Nœud moyen atteint : ${(reached.reduce((a, b) => a + b, 0) / N).toFixed(1)}`);
for (const [k, v] of Object.entries(fightStats).sort()) console.log(`${k} : ${Math.round((100 * v.w) / v.n)} % (${v.n})`);
