// Simulations en masse : l'IA joue contre elle-même avec les decks de démonstration.
// Usage : npm run sim -- [parties par match-up, défaut 100] [graine]
// Produit un rapport Markdown dans reports/ et un résumé dans la console.

import { mkdirSync, writeFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { DEMO_DECKS } from '../src/data/decks';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction, PlayerId } from '../src/engine/types';
import { cardName } from '../src/i18n/log.fr';
import { patchFromArgs } from '../src/data/patch';

// Option « --patch balance/fichier.json » : modifications d'équilibrage appliquées avant la simulation.
const { args: ARGS, patch: PATCH, changes: PATCH_CHANGES } = patchFromArgs(process.argv.slice(2));

const FACTIONS: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];
const LABEL: Record<string, string> = { empire: 'Empire', elfe: 'Elfes', demons: 'Démons', nomades: 'Nomades' };
const N = Number(ARGS[0] ?? 100);
const SEED = ARGS[1] ?? 'sim';
const MAX_TURNS = 80;

interface Result { winner: PlayerId | null; reason: string; turns: number; first: Faction; second: Faction; played: Record<PlayerId, string[]> }

/** Partie IA contre IA, en collectant les cartes jouées par chaque joueur. */
function runGame(fa: Faction, fb: Faction, seed: string): Result {
  let cur = createGame({ seed, A: { faction: fa, deck: DEMO_DECKS[fa]! }, B: { faction: fb, deck: DEMO_DECKS[fb]! } });
  const played: Record<PlayerId, string[]> = { A: [], B: [] };
  // Au-delà de MAX_TURNS tours, la partie est considérée comme bloquée (aucun joueur ne peut progresser).
  for (let n = 0; n < 5000 && !cur.over && cur.turn <= MAX_TURNS; n++) {
    const r = applyAction(cur, chooseAction(cur));
    if (!r.ok) throw new Error(`Action refusée : ${r.error}`);
    for (const e of r.events) if (e.type === 'cardPlayed') played[e.player].push(e.cardId);
    cur = r.state;
  }
  return { winner: cur.over?.winner ?? null, reason: cur.over?.reason ?? 'blocage', turns: cur.turn, first: fa, second: fb, played };
}

const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)} %` : '—');

const t0 = Date.now();
const results: Result[] = [];
for (const fa of FACTIONS) {
  for (const fb of FACTIONS) {
    for (let i = 0; i < N; i++) results.push(runGame(fa, fb, `${SEED}-${fa}-${fb}-${i}`));
  }
  process.stdout.write(`${LABEL[fa]} terminé (${Math.round((Date.now() - t0) / 1000)} s)\n`);
}

// --- Agrégats ---
const byFaction = new Map<Faction, { games: number; wins: number }>();
for (const f of FACTIONS) byFaction.set(f, { games: 0, wins: 0 });
const matrix = new Map<string, { games: number; wins: number }>();
let firstWins = 0, decided = 0;
const reasons: Record<string, number> = {};
const cardStats = new Map<string, { plays: number; winPlays: number }>();
for (const r of results) {
  reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
  if (r.winner) { decided++; if (r.winner === 'A') firstWins++; }
  if (r.first !== r.second) {
    for (const [f, pid] of [[r.first, 'A'], [r.second, 'B']] as const) {
      const b = byFaction.get(f)!;
      b.games++;
      if (r.winner === pid) b.wins++;
    }
    const k = `${r.first}|${r.second}`;
    const m = matrix.get(k) ?? { games: 0, wins: 0 };
    m.games++;
    if (r.winner === 'A') m.wins++;
    matrix.set(k, m);
  }
  for (const pid of ['A', 'B'] as const) {
    for (const id of new Set(r.played[pid])) {
      const c = cardStats.get(id) ?? { plays: 0, winPlays: 0 };
      c.plays++;
      if (r.winner === pid) c.winPlays++;
      cardStats.set(id, c);
    }
  }
}

const lines: string[] = [];
lines.push(`# Rapport de simulation`, '', ...(PATCH ? [`Modifications testées (\`${PATCH}\`) :`, '', ...PATCH_CHANGES.map(c => `- ${c}`), ''] : []), `${results.length} parties IA contre IA (${N} par match-up, graine « ${SEED} »), ${Math.round((Date.now() - t0) / 1000)} s.`, '');
lines.push('## Taux de victoire par faction (hors miroirs)', '', '| Faction | Parties | Victoires |', '|---|---|---|');
for (const f of FACTIONS) { const b = byFaction.get(f)!; lines.push(`| ${LABEL[f]} | ${b.games} | ${pct(b.wins, b.games)} |`); }
lines.push('', '## Match-ups (victoires du joueur de la ligne, qui commence)', '', `| | ${FACTIONS.map(f => LABEL[f]).join(' | ')} |`, `|---|${FACTIONS.map(() => '---').join('|')}|`);
for (const fa of FACTIONS) {
  lines.push(`| **${LABEL[fa]}** | ${FACTIONS.map(fb => { if (fa === fb) return '—'; const m = matrix.get(`${fa}|${fb}`)!; return pct(m.wins, m.games); }).join(' | ')} |`);
}
const finished = results.filter(r => r.winner);
const avgTurns = finished.reduce((n, r) => n + r.turns, 0) / Math.max(1, finished.length);
lines.push('', '## Déroulement', '', `- Durée moyenne (parties terminées) : ${avgTurns.toFixed(1)} tours.`, `- Le premier joueur gagne ${pct(firstWins, decided)} des parties.`);
const REASON_FR: Record<string, string> = { lassitude: 'lassitude', noRegiment: 'plus de régiment', emptyDeck: 'pioche vide', vitalDestroyed: 'régiment vital détruit', blocage: `bloquée (plus de ${MAX_TURNS} tours)` };
lines.push(`- Fins de partie : ${Object.entries(reasons).map(([k, v]) => `${REASON_FR[k] ?? k} ${pct(v, results.length)}`).join(', ')}.`);
lines.push('', '## Cartes (parties où la carte a été jouée au moins une fois)', '', '| Carte | Jouée dans | Victoires quand jouée |', '|---|---|---|');
for (const [id, c] of [...cardStats.entries()].filter(([, c]) => c.plays >= 20).sort((a, b) => b[1].winPlays / b[1].plays - a[1].winPlays / a[1].plays)) {
  lines.push(`| ${cardName(id)} | ${c.plays} | ${pct(c.winPlays, c.plays)} |`);
}
lines.push('', '_Lecture : l\'IA est heuristique et les decks sont ceux de démonstration ; ces chiffres signalent des déséquilibres à examiner, ils ne les prouvent pas._');

mkdirSync('reports', { recursive: true });
const file = `reports/simulation-${SEED}${PATCH ? `-${PATCH.replace(/^.*\//, "").replace(/\.json$/, "")}` : ""}.md`;
writeFileSync(file, lines.join('\n') + '\n');
console.log(lines.slice(0, 20).join('\n'));
console.log(`\nRapport complet : ${file}`);
