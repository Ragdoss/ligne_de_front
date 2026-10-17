// Tournoi entre factions : decks aléatoires d'une seule faction (cartes de la faction, neutres et bicolores qui la contiennent),
// 45 cartes (30 de niveau 1-3, 15 de niveau 4-5). Chaque paire de factions s'affronte N fois, chacune commençant à tour de rôle.
// Usage : npx tsx tools/faction-tournament.ts [parties par paire, défaut 150] [graine]
import { mkdirSync, writeFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { applyAction, createGame } from '../src/engine/game';
import { nextRandom, seedFrom } from '../src/engine/rng';
import type { Faction } from '../src/engine/types';
import { COLLECTIBLE } from '../src/profile/profile';
import { WAVE1_IDS } from '../src/data/wave1';

const BASE_ONLY = process.argv.includes('--sans-vague1');
const ARGS = process.argv.slice(2).filter(a => !a.startsWith('--'));
const N = Number(ARGS[0] ?? 150);
const SEED = (ARGS[1] ?? 'factions') + (BASE_ONLY ? '-sans-vague1' : '');
const F: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];
const LABEL: Record<string, string> = { empire: 'Empire', elfe: 'Elfes', demons: 'Démons', nomades: 'Nomades' };
let rng = seedFrom(SEED);
const rand = (n: number) => { const r = nextRandom(rng); rng = r.state; return Math.floor(r.value * n); };
const inFaction = (id: string, f: Faction) => {
  const c = CARDS[id]!;
  return c.faction === f || c.faction === 'neutre' || ((c.factions as string[] | undefined) ?? []).includes(f);
};
function deck(f: Faction): string[] {
  const pool = COLLECTIBLE.filter(id => inFaction(id, f) && !(BASE_ONLY && WAVE1_IDS.includes(id)));
  const low = pool.filter(id => CARDS[id]!.niveau <= 3), high = pool.filter(id => CARDS[id]!.niveau >= 4);
  for (;;) {
    const d: string[] = [];
    const pick = (p: string[], k: number) => { for (let got = 0; got < k;) { const id = p[rand(p.length)]!; if (d.filter(x => x === id).length >= 3) continue; d.push(id); got++; } };
    pick(low, 30); pick(high, 15);
    if (d.filter(id => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === 1).length >= 5) return d;
  }
}
const wins: Record<string, number> = {}, games: Record<string, number> = {};
const reasons: Record<string, number> = {};
let turns = 0, decided = 0;
const t0 = Date.now();
for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) {
  const a = F[i]!, b = F[j]!;
  for (let g = 0; g < N; g++) {
    const [fa, fb] = g % 2 ? [b, a] : [a, b];
    let s = createGame({ seed: `${SEED}-${a}-${b}-${g}`, A: { faction: fa, deck: deck(fa) }, B: { faction: fb, deck: deck(fb) } });
    for (let k = 0; k < 5000 && !s.over && s.turn <= 80; k++) { const r = applyAction(s, chooseAction(s)); if (!r.ok) throw new Error(r.error); s = r.state; }
    if (!s.over) continue;
    decided++; turns += s.turn;
    reasons[s.over.reason] = (reasons[s.over.reason] ?? 0) + 1;
    const w = s.over.winner === 'A' ? fa : fb, l = w === fa ? fb : fa;
    wins[`${w}>${l}`] = (wins[`${w}>${l}`] ?? 0) + 1;
    for (const f of [fa, fb]) games[f] = (games[f] ?? 0) + 1;
    wins[w] = (wins[w] ?? 0) + 1;
  }
  process.stdout.write(`${LABEL[a]} – ${LABEL[b]} : ${wins[`${a}>${b}`] ?? 0} – ${wins[`${b}>${a}`] ?? 0} (${Math.round((Date.now() - t0) / 1000)} s)\n`);
}
const pct = (x: number, n: number) => `${Math.round((100 * x) / Math.max(1, n))} %`;
const lines = [
  '# Tournoi entre factions (decks aléatoires mono-faction)', '',
  `${decided} parties terminées, ${N} par paire de factions ; durée moyenne ${(turns / Math.max(1, decided)).toFixed(1)} tours ; ${Math.round((Date.now() - t0) / 1000)} s.`,
  `Decks : 45 cartes tirées au hasard parmi la faction, les neutres et les bicolores de la faction (${BASE_ONLY ? 'cartes de base seulement' : 'cartes de base + première vague'}). IA v2 des deux côtés.`, '',
  '| Faction | Victoires | Taux |', '|---|---|---|',
  ...F.map(f => `| ${LABEL[f]} | ${wins[f] ?? 0} / ${games[f] ?? 0} | ${pct(wins[f] ?? 0, games[f] ?? 0)} |`), '',
  '| Ligne contre colonne | ' + F.map(f => LABEL[f]).join(' | ') + ' |', '|---|' + F.map(() => '---').join('|') + '|',
  ...F.map(a => `| ${LABEL[a]} | ` + F.map(b => (a === b ? '—' : pct(wins[`${a}>${b}`] ?? 0, (wins[`${a}>${b}`] ?? 0) + (wins[`${b}>${a}`] ?? 0)))).join(' | ') + ' |'), '',
  'Fins de partie : ' + Object.entries(reasons).map(([k, v]) => `${k} ${pct(v, decided)}`).join(', ') + '.',
];
mkdirSync('reports', { recursive: true });
writeFileSync(`reports/tournoi-factions-${SEED}.md`, lines.join('\n') + '\n');
console.log(lines.join('\n'));
