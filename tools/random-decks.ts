// Tournoi de decks aléatoires (toutes factions mélangées) : chaque deck affronte tous les autres,
// puis on compare le taux de victoire à la proportion de cartes Empire du deck.
// Usage : npm run decks -- [nombre de decks, défaut 12] [parties par paire, défaut 20] [graine]

import { mkdirSync, writeFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { applyAction, createGame } from '../src/engine/game';
import { nextRandom, seedFrom } from '../src/engine/rng';
import { cardName } from '../src/i18n/log.fr';
import { patchFromArgs } from '../src/data/patch';
import { COLLECTIBLE } from '../src/profile/profile';

// Option « --patch balance/fichier.json » : modifications d'équilibrage appliquées avant la simulation.
const { args: ARGS, patch: PATCH, changes: PATCH_CHANGES } = patchFromArgs(process.argv.slice(2));

const NDECKS = Number(ARGS[0] ?? 12);
const GAMES = Number(ARGS[1] ?? 20);
const SEED = ARGS[2] ?? 'decks';
const MAX_COPIES = 3;
const MAX_TURNS = 80;

// Cartes de scénario, jetons et cartes générées : jamais dans un deck.
const EXCLUDED = new Set(['convoi', 'garnison', 'halte_convoi', 'palissade_regiment', 'elem_eveil_regiment', 'soin_simple']);
const POOL = COLLECTIBLE.map(id => CARDS[id]!).filter(c => !EXCLUDED.has(c.id)); // cartes de collection seulement
const LOW = POOL.filter(c => c.niveau <= 3).map(c => c.id);
const HIGH = POOL.filter(c => c.niveau >= 4).map(c => c.id);

let rng = seedFrom(SEED);
const rand = (n: number) => { const r = nextRandom(rng); rng = r.state; return Math.floor(r.value * n); };

function pick(pool: string[], count: number, deck: string[]): void {
  for (let got = 0; got < count;) {
    const id = pool[rand(pool.length)]!;
    if (deck.filter(x => x === id).length >= MAX_COPIES) continue;
    deck.push(id);
    got++;
  }
}
const isLvl1Regiment = (id: string) => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === 1;

function randomDeck(): string[] {
  for (;;) {
    const deck: string[] = [];
    pick(LOW, 30, deck);
    pick(HIGH, 15, deck);
    // Il faut de quoi poser des régiments de niveau 1 au premier tour (main de départ : 3 garantis).
    if (deck.filter(isLvl1Regiment).length >= 6) return deck;
  }
}

const decks = Array.from({ length: NDECKS }, randomDeck);
const empireShare = (d: string[]) => d.filter(id => CARDS[id]!.faction === 'empire').length / d.length;
const stats = decks.map(() => ({ games: 0, wins: 0 }));

const t0 = Date.now();
for (let i = 0; i < NDECKS; i++) {
  for (let j = i + 1; j < NDECKS; j++) {
    for (let g = 0; g < GAMES; g++) {
      const [a, b] = g % 2 === 0 ? [i, j] : [j, i]; // chacun commence la moitié des parties
      let s = createGame({ seed: `${SEED}-${i}-${j}-${g}`, A: { faction: 'neutre', deck: decks[a]! }, B: { faction: 'neutre', deck: decks[b]! } });
      for (let k = 0; k < 5000 && !s.over && s.turn <= MAX_TURNS; k++) {
        const r = applyAction(s, chooseAction(s));
        if (!r.ok) throw new Error(r.error);
        s = r.state;
      }
      stats[a]!.games++; stats[b]!.games++;
      if (s.over?.winner === 'A') stats[a]!.wins++;
      if (s.over?.winner === 'B') stats[b]!.wins++;
    }
  }
  process.stdout.write(`deck ${i + 1}/${NDECKS} (${Math.round((Date.now() - t0) / 1000)} s)\n`);
}

// Corrélation (Pearson) entre part de cartes Empire et taux de victoire, et pente de la droite de tendance.
const ys = stats.map(s => s.wins / s.games);
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
function regress(xs: number[]): { corr: number; slope: number } {
  const mx = mean(xs), my = mean(ys);
  const cov = xs.reduce((n, x, k) => n + (x - mx) * (ys[k]! - my), 0);
  const vx = xs.reduce((n, x) => n + (x - mx) ** 2, 0), vy = ys.reduce((n, y) => n + (y - my) ** 2, 0);
  return { corr: cov / Math.sqrt(vx * vy), slope: cov / vx };
}
const xs = decks.map(empireShare);
const all = regress(xs);
const low = regress(decks.map(d => d.filter(id => CARDS[id]!.niveau <= 3 && CARDS[id]!.faction === 'empire').length / 30));
const high = regress(decks.map(d => d.filter(id => CARDS[id]!.niveau >= 4 && CARDS[id]!.faction === 'empire').length / 15));
const fmt = (r: { corr: number; slope: number }) => `corrélation **${r.corr.toFixed(2)}**, +10 points de cartes Empire ≈ ${r.slope >= 0 ? '+' : ''}${(r.slope * 10).toFixed(1)} points de victoire`;

const pct = (v: number) => `${Math.round(v * 100)} %`;
const factionMix = (d: string[]) => {
  const c: Record<string, number> = {};
  for (const id of d) c[CARDS[id]!.faction] = (c[CARDS[id]!.faction] ?? 0) + 1;
  return ['empire', 'elfe', 'demons', 'nomades', 'neutre'].map(f => c[f] ?? 0).join(' / ');
};
const order = decks.map((_, k) => k).sort((a, b) => ys[b]! - ys[a]!);
const lines = [
  '# Tournoi de decks aléatoires', '', ...(PATCH ? [`Modifications testées (\`${PATCH}\`) :`, '', ...PATCH_CHANGES.map(c => `- ${c}`), ''] : []),
  `${NDECKS} decks de 45 cartes (30 de niveau 1-3, 15 de niveau 4-5, ${MAX_COPIES} exemplaires maximum, toutes factions mélangées),`,
  `${GAMES} parties par paire (chacun commence la moitié du temps), ${stats.reduce((n, s) => n + s.games, 0) / 2} parties en ${Math.round((Date.now() - t0) / 1000)} s.`, '',
  '| Deck | Victoires | Cartes Empire | Empire / Elfes / Démons / Nomades / neutres |', '|---|---|---|---|',
  ...order.map(k => `| ${k + 1} | ${pct(ys[k]!)} | ${pct(xs[k]!)} | ${factionMix(decks[k]!)} |`), '',
  'Lien entre la part de cartes Empire et le taux de victoire (corrélation de -1 à 1 ; 0 = aucun lien) :', '',
  `- toutes les cartes : ${fmt(all)} ;`,
  `- cartes de niveau 1-3 seulement : ${fmt(low)} ;`,
  `- cartes de niveau 4-5 seulement : ${fmt(high)}.`, '',
  '## Composition des decks', '',
  ...decks.map((d, k) => `- **Deck ${k + 1}** (${pct(ys[k]!)}) : ${Object.entries(d.reduce<Record<string, number>>((m, id) => { m[id] = (m[id] ?? 0) + 1; return m; }, {})).map(([id, n]) => `${n}× ${cardName(id)}`).join(', ')}`),
];
mkdirSync('reports', { recursive: true });
const file = `reports/decks-aleatoires-${SEED}${PATCH ? `-${PATCH.replace(/^.*\//, "").replace(/\.json$/, "")}` : ""}.md`;
writeFileSync(file, lines.join('\n') + '\n');
console.log(lines.slice(0, NDECKS + 10).join('\n'));
console.log(`\nRapport complet : ${file}`);
