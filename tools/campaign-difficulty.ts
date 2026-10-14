// Difficulté des scénarios : l'ordinateur joue l'Empire avec le pool de campagne attendu à chaque étape
// (récompenses prises par défaut), contre l'ordinateur elfe avec ses règles de scénario.
// Usage : npm run difficulty -- [parties par scénario, défaut 200] [--patch balance/fichier.json]
import { mkdirSync, writeFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { addToPool, newCampaign, removeFromPool, scenarioAiFilter, scenarioGameSetup } from '../src/campaign/campaign';
import { CAMPAIGN_ORDER, SCENARIOS } from '../src/campaign/scenarios';
import { patchFromArgs } from '../src/data/patch';
import { applyAction, createGame } from '../src/engine/game';
import { cardName } from '../src/i18n/log.fr';

const { args, patch, changes } = patchFromArgs(process.argv.slice(2));
const N = Number(args[0] ?? 200);

// Pool à chaque étape : récompenses acceptées, et pour les choix les premières options proposées.
const pools: string[][] = [];
const c = newCampaign();
for (const id of CAMPAIGN_ORDER) {
  pools.push(c.pool.slice());
  const rw = SCENARIOS[id]!.reward;
  if (!rw) continue;
  for (const step of rw.order ?? ['exchange', 'gifts', 'picks']) {
    if (step === 'gifts') rw.gifts?.forEach(g => addToPool(c, g));
    if (step === 'exchange' && rw.exchange) for (let k = 0; k < rw.exchange.count; k++) if (removeFromPool(c, rw.exchange.from)) addToPool(c, rw.exchange.to);
    if (step === 'picks' && rw.picks) rw.picks.options.slice(0, rw.picks.count).forEach(o => addToPool(c, o));
  }
}

const lines = ['# Difficulté des scénarios de campagne', ''];
if (patch) lines.push(`Modifications testées (\`${patch}\`) :`, '', ...changes.map(x => `- ${x}`), '');
lines.push(`${N} parties par scénario. L'Empire est joué par l'ordinateur avec tout son pool de campagne ; l'ordinateur joue moins bien qu'un humain : ces taux sont une borne basse.`, '',
  '| Scénario | Pool (cartes) | Réussite | Tours (moy.) | Défaites les plus fréquentes |', '|---|---|---|---|---|');
const REASONS: Record<string, string> = { lassitude: 'lassitude', noRegiment: 'plus de régiment', emptyDeck: 'pioche vide', vitalDestroyed: 'régiment vital détruit', convoyArrived: 'convoi passé', blocage: 'partie bloquée' };
const t0 = Date.now();
CAMPAIGN_ORDER.forEach((id, k) => {
  const sc = SCENARIOS[id]!;
  const filter = scenarioAiFilter(sc);
  let wins = 0, turns = 0;
  const losses: Record<string, number> = {};
  for (let g = 0; g < N; g++) {
    let s = createGame(scenarioGameSetup(sc, pools[k]!, `${id}-${g}`));
    for (let n = 0; n < 6000 && !s.over && s.turn <= 80; n++) {
      const r = applyAction(s, chooseAction(s, undefined, s.active === 'B' ? filter : undefined));
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    turns += s.turn;
    if (s.over?.winner === 'A') wins++;
    else { const why = s.over ? (s.over.winner === 'B' ? s.over.reason : s.over.reason) : 'blocage'; losses[why] = (losses[why] ?? 0) + 1; }
  }
  const top = Object.entries(losses).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([r, n]) => `${REASONS[r] ?? r} (${Math.round((100 * n) / N)} %)`).join(', ');
  lines.push(`| ${sc.title} | ${pools[k]!.length} | **${Math.round((100 * wins) / N)} %** | ${(turns / N).toFixed(1)} | ${top || '—'} |`);
  process.stdout.write(`${sc.title} : ${Math.round((100 * wins) / N)} % (${Math.round((Date.now() - t0) / 1000)} s)\n`);
});
lines.push('', '## Pools utilisés', '', ...CAMPAIGN_ORDER.map((id, k) => {
  const n: Record<string, number> = {};
  for (const x of pools[k]!) n[x] = (n[x] ?? 0) + 1;
  return `- **${SCENARIOS[id]!.title}** : ${Object.entries(n).map(([x, m]) => `${m}× ${cardName(x)}`).join(', ')}`;
}));
mkdirSync('reports', { recursive: true });
const file = `reports/difficulte-scenarios${patch ? `-${patch.replace(/^.*\//, '').replace(/\.json$/, '')}` : ''}.md`;
writeFileSync(file, lines.join('\n') + '\n');
console.log(`Rapport : ${file}`);
