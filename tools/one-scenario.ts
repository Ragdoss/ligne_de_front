import { chooseAction } from '../src/ai/heuristic';
import { addToPool, newCampaign, removeFromPool, scenarioAiFilter, scenarioGameSetup } from '../src/campaign/campaign';
import { CAMPAIGNS, SCENARIOS } from '../src/campaign/campaigns';
import { applyAction, createGame } from '../src/engine/game';
const N = Number(process.argv[2] ?? 30);
const ids = process.argv.slice(3);
for (const def of CAMPAIGNS) {
  const c = newCampaign(def.id);
  for (const id of def.order) {
    const pool = c.pool.slice();
    if (ids.includes(id)) {
      const sc = SCENARIOS[id]!; const f = scenarioAiFilter(sc);
      let w = 0, t = 0, la = 0, lb = 0; const why: Record<string, number> = {};
      for (let g = 0; g < N; g++) {
        let s = createGame(scenarioGameSetup(sc, pool, `${id}-${g}`));
        for (let n = 0; n < 6000 && !s.over && s.turn <= 60; n++) { const r = applyAction(s, chooseAction(s, undefined, s.active === 'B' ? f : undefined)); if (!r.ok) throw new Error(r.error); s = r.state; }
        if (s.over?.winner === 'A') w++;
        const k = `${s.over?.winner ?? '-'}:${s.over?.reason ?? 'blocage'}`; why[k] = (why[k] ?? 0) + 1;
        t += s.turn; la += s.players.A.points; lb += s.players.B.points;
      }
      console.log(id, `${Math.round(100 * w / N)}%`, 'tours', (t / N).toFixed(1), 'lassA', (la / N).toFixed(0), 'lassB', (lb / N).toFixed(0), JSON.stringify(why), 'pool', pool.length);
    }
    const rw = SCENARIOS[id]!.reward; if (!rw) continue;
    for (const step of rw.order ?? ['exchange', 'gifts', 'picks']) {
      if (step === 'gifts') rw.gifts?.forEach(g => addToPool(c, g));
      if (step === 'exchange' && rw.exchange) for (let k = 0; k < rw.exchange.count; k++) if (removeFromPool(c, rw.exchange.from)) addToPool(c, rw.exchange.to);
      if (step === 'picks' && rw.picks) rw.picks.options.slice(0, rw.picks.count).forEach(o => addToPool(c, o));
    }
  }
}
