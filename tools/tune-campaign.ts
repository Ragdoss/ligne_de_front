// Règle la difficulté de chaque scénario : ressources de départ et seuil de lassitude du joueur, pour que l'ordinateur
// jouant le camp du joueur (avec le pool de campagne attendu, choix de récompense = premières options) gagne 50 à 60 %.
// Usage : npx tsx tools/tune-campaign.ts [parties par essai, défaut 60] [campagne : empire|demons|elfes|nomades|all]
// Écrit le résultat dans reports/reglage-campagne-<campagne>.json (à reporter dans src/campaign/ease.ts).
import { writeFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { addToPool, CAMPAIGN_EASE, newCampaign, removeFromPool, scenarioAiFilter, scenarioGameSetup } from '../src/campaign/campaign';
import { CAMPAIGNS, SCENARIOS } from '../src/campaign/campaigns';
import { applyAction, createGame } from '../src/engine/game';

const N = Number(process.argv[2] ?? 60);
const which = process.argv[3] ?? 'all';
const camps = CAMPAIGNS.filter(d => which === 'all' || d.id === which);

/** Échelle de difficulté, du plus dur au plus facile : [ressources en plus, multiplicateur du seuil de lassitude]. */
const LADDER: [number, number][] = [
  [0, 0.6], [0, 0.8], [0, 1], [0, 1.25], [1, 1.25], [1, 1.5], [2, 1.5], [2, 1.75], [3, 1.75], [3, 2], [4, 2], [4, 2.5], [5, 3], [6, 4],
];

function rate(id: string, pool: string[], [r, l]: [number, number], n: number, salt: string): number {
  const sc = SCENARIOS[id]!;
  const filter = scenarioAiFilter(sc);
  let wins = 0;
  for (let g = 0; g < n; g++) {
    let s = createGame(scenarioGameSetup(sc, pool, `${id}-${salt}-${g}`, 0, { ...CAMPAIGN_EASE, startResource: r, lassitudeMul: l }));
    for (let k = 0; k < 6000 && !s.over && s.turn <= 80; k++) {
      const res = applyAction(s, chooseAction(s, undefined, s.active === 'B' ? filter : undefined));
      if (!res.ok) throw new Error(res.error);
      s = res.state;
    }
    if (s.over?.winner === 'A') wins++;
  }
  return wins / n;
}

const out: Record<string, { startResource: number; lassitudeMul: number; rate: number }> = {};
for (const def of camps) {
  const c = newCampaign(def.id);
  for (const id of def.order) {
    const pool = c.pool.slice();
    // Recherche dichotomique sur l'échelle, puis vérification sur 2N parties.
    let lo = 0, hi = LADDER.length - 1, best = 5, bestRate = -1;
    const tried = new Map<number, number>();
    const at = (i: number) => { if (!tried.has(i)) tried.set(i, rate(id, pool, LADDER[i]!, N, `t${i}`)); return tried.get(i)!; };
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const p = at(mid);
      if (Math.abs(p - 0.55) < Math.abs(bestRate - 0.55)) { best = mid; bestRate = p; }
      if (p >= 0.5 && p <= 0.6) break;
      if (p > 0.6) hi = mid - 1; else lo = mid + 1;
    }
    const check = rate(id, pool, LADDER[best]!, 2 * N, 'v');
    out[id] = { startResource: LADDER[best]![0], lassitudeMul: LADDER[best]![1], rate: Math.round(100 * check) };
    console.log(`${SCENARIOS[id]!.title} : +${LADDER[best]![0]} ressource(s), lassitude ×${LADDER[best]![1]} → ${Math.round(100 * check)} % (essais : ${[...tried].map(([i, p]) => `${i}:${Math.round(100 * p)}%`).join(' ')})`);
    // Pool du scénario suivant : récompenses acceptées, premières options pour les choix.
    const rw = SCENARIOS[id]!.reward;
    if (rw) for (const step of rw.order ?? ['exchange', 'gifts', 'picks']) {
      if (step === 'gifts') rw.gifts?.forEach(g => addToPool(c, g));
      if (step === 'exchange' && rw.exchange) for (let k = 0; k < rw.exchange.count; k++) if (removeFromPool(c, rw.exchange.from)) addToPool(c, rw.exchange.to);
      if (step === 'picks' && rw.picks) rw.picks.options.slice(0, rw.picks.count).forEach(o => addToPool(c, o));
    }
  }
}
writeFileSync(`reports/reglage-campagne-${which}.json`, JSON.stringify(out, null, 2) + '\n');
