// Règle la difficulté de chaque scénario pour les trois modes de campagne : ressources de départ en plus et seuil de
// défaite par lassitude du joueur, pour que l'ordinateur jouant le camp du joueur (pool de campagne attendu, choix de
// récompense = premières options) gagne : Histoire 70-80 %, Guerrier 50-60 %, Héros 20-30 %.
// Le régiment à protéger (s'il y en a un) fait aussi partie du réglage.
// Usage : npx tsx tools/tune-campaign.ts [parties par essai, défaut 60] [campagne : empire|demons|elfes|nomades|all]
// Écrit reports/reglage-campagne-<campagne>.json (à reporter dans src/campaign/ease.ts).
import { writeFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { addToPool, CAMPAIGN_EASE, newCampaign, removeFromPool, scenarioAiFilter, scenarioGameSetup } from '../src/campaign/campaign';
import { CAMPAIGNS, SCENARIOS } from '../src/campaign/campaigns';
import { applyAction, createGame } from '../src/engine/game';

const N = Number(process.argv[2] ?? 60);
const which = process.argv[3] ?? 'all';
const camps = CAMPAIGNS.filter(d => which === 'all' || d.id === which);

/**
 * Échelle de difficulté, du plus dur au plus facile : [ressources en plus, multiplicateur du seuil de lassitude,
 * END ×… et Moral +… du régiment à protéger (seulement dans les scénarios qui en ont un)].
 */
const LADDER: [number, number, number, number][] = [
  [0, 0.4, 1, 0], [0, 0.5, 1, 0], [0, 0.6, 1, 0], [0, 0.8, 1, 1], [0, 1, 1.25, 1], [0, 1.25, 1.5, 2], [1, 1.25, 1.5, 2], [1, 1.5, 1.5, 2],
  [2, 1.5, 1.75, 2], [2, 1.75, 1.75, 3], [3, 1.75, 2, 3], [3, 2, 2, 3], [4, 2, 2.5, 4], [4, 2.5, 3, 4], [5, 3, 3, 5], [6, 4, 4, 6], [8, 6, 5, 8],
];
const TARGETS = { histoire: [0.7, 0.8], guerrier: [0.5, 0.6], heros: [0.2, 0.3] } as const;

function rate(id: string, pool: string[], [r, l, ve, vm]: [number, number, number, number], n: number, salt: string): number {
  const sc = SCENARIOS[id]!;
  const filter = scenarioAiFilter(sc);
  let wins = 0;
  for (let g = 0; g < n; g++) {
    let s = createGame(scenarioGameSetup(sc, pool, `${id}-${salt}-${g}`, 0, { ...CAMPAIGN_EASE, startResource: r, lassitudeMul: l, vitalEnd: ve, vitalMor: vm }));
    for (let k = 0; k < 6000 && !s.over && s.turn <= 80; k++) {
      const res = applyAction(s, chooseAction(s, undefined, s.active === 'B' ? filter : undefined));
      if (!res.ok) throw new Error(res.error);
      s = res.state;
    }
    if (s.over?.winner === 'A') wins++;
  }
  return wins / n;
}

type Pick = { startResource: number; lassitudeMul: number; vitalEnd?: number; vitalMor?: number; rate: number };
const out: Record<string, Record<string, Pick>> = {};
for (const def of camps) {
  const c = newCampaign(def.id);
  for (const id of def.order) {
    const pool = c.pool.slice();
    const tried = new Map<number, number>();
    const at = (i: number) => { if (!tried.has(i)) tried.set(i, rate(id, pool, LADDER[i]!, N, `t${i}`)); return tried.get(i)!; };
    out[id] = {};
    const notes: string[] = [];
    for (const [mode, [a, b]] of Object.entries(TARGETS)) {
      const mid0 = (a + b) / 2;
      let lo = 0, hi = LADDER.length - 1, best = -1;
      const score = (i: number) => Math.abs(at(i) - mid0);
      while (lo <= hi) {
        const m = (lo + hi) >> 1;
        const p = at(m);
        if (best < 0 || score(m) < score(best)) best = m;
        if (p >= a && p <= b) break;
        if (p > b) hi = m - 1; else lo = m + 1;
      }
      // Vérification sur 2N parties ; si on sort de la cible, un cran dans le bon sens (2 fois au plus).
      let v = rate(id, pool, LADDER[best]!, 2 * N, `v${best}`);
      for (let k = 0; k < 2 && (v < a || v > b); k++) {
        const next = v > b ? best - 1 : best + 1;
        if (next < 0 || next >= LADDER.length) break;
        const v2 = rate(id, pool, LADDER[next]!, 2 * N, `v${next}`);
        if (Math.abs(v2 - mid0) >= Math.abs(v - mid0)) break;
        best = next; v = v2;
      }
      const [r, l, ve, vm] = LADDER[best]!;
      const vital = !!SCENARIOS[id]!.mustSurvive?.A;
      out[id][mode] = { startResource: r, lassitudeMul: l, ...(vital ? { vitalEnd: ve, vitalMor: vm } : {}), rate: Math.round(100 * v) };
      notes.push(`${mode} +${r} ×${l}${vital ? ` vital END×${ve} +${vm} MOR` : ''} → ${Math.round(100 * v)} %`);
    }
    console.log(`${SCENARIOS[id]!.title} : ${notes.join(' ; ')}  (essais : ${[...tried].sort((x, y) => x[0] - y[0]).map(([i, p]) => `${i}:${Math.round(100 * p)}`).join(' ')})`);
    writeFileSync(`reports/reglage-campagne-${which}.json`, JSON.stringify(out, null, 2) + '\n');
    // Pool du scénario suivant : récompenses acceptées, premières options pour les choix.
    const rw = SCENARIOS[id]!.reward;
    if (rw) for (const step of rw.order ?? ['exchange', 'gifts', 'picks']) {
      if (step === 'gifts') rw.gifts?.forEach(g => addToPool(c, g));
      if (step === 'exchange' && rw.exchange) for (let k = 0; k < rw.exchange.count; k++) if (removeFromPool(c, rw.exchange.from)) addToPool(c, rw.exchange.to);
      if (step === 'picks' && rw.picks) rw.picks.options.slice(0, rw.picks.count).forEach(o => addToPool(c, o));
    }
  }
}
