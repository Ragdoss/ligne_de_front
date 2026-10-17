// Classement des cartes : chaque partie oppose deux decks aléatoires tout neufs (45 cartes, toutes factions).
// Pour chaque carte : taux de victoire des decks qui la contiennent, comparé à celui des decks qui ne l'ont pas.
// Usage : npm run ranking -- [nombre de parties, défaut 6000] [graine]

import { mkdirSync, writeFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { applyAction, createGame } from '../src/engine/game';
import { nextRandom, seedFrom } from '../src/engine/rng';
import { cardName } from '../src/i18n/log.fr';
import { patchFromArgs } from '../src/data/patch';
import { COLLECTIBLE } from '../src/profile/profile';
import { WAVE1_IDS } from '../src/data/wave1';

// Option « --patch balance/fichier.json » : modifications d'équilibrage appliquées avant la simulation.
const { args: ARGS, patch: PATCH, changes: PATCH_CHANGES } = patchFromArgs(process.argv.slice(2));

const GAMES = Number(ARGS[0] ?? 6000);
const SEED = ARGS[1] ?? 'classement';
const MAX_COPIES = 3;
const MAX_TURNS = 80;
const EXCLUDED = new Set(['convoi', 'garnison', 'halte_convoi', 'palissade_regiment', 'elem_eveil_regiment', 'soin_simple']);
const POOL = COLLECTIBLE.map(id => CARDS[id]!).filter(c => !EXCLUDED.has(c.id)); // cartes de collection seulement
const LOW = POOL.filter(c => c.niveau <= 3).map(c => c.id);
const HIGH = POOL.filter(c => c.niveau >= 4).map(c => c.id);
const FACTION: Record<string, string> = { empire: 'Empire', elfe: 'Elfes', demons: 'Démons', nomades: 'Nomades', neutre: 'Neutre' };

let rng = seedFrom(SEED);
const rand = (n: number) => { const r = nextRandom(rng); rng = r.state; return Math.floor(r.value * n); };
function randomDeck(): string[] {
  for (;;) {
    const deck: string[] = [];
    const pick = (pool: string[], count: number) => {
      for (let got = 0; got < count;) {
        const id = pool[rand(pool.length)]!;
        if (deck.filter(x => x === id).length >= MAX_COPIES) continue;
        deck.push(id); got++;
      }
    };
    pick(LOW, 30); pick(HIGH, 15);
    if (deck.filter(id => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === 1).length >= 6) return deck;
  }
}

// Par carte : présences dans un deck (et victoires), et parties où elle a vraiment été jouée (et victoires).
const inDeck = new Map<string, { n: number; w: number }>();
const played = new Map<string, { n: number; w: number }>();
let decided = 0;
const t0 = Date.now();
for (let g = 0; g < GAMES; g++) {
  const decks = { A: randomDeck(), B: randomDeck() };
  let s = createGame({ seed: `${SEED}-${g}`, A: { faction: 'neutre', deck: decks.A }, B: { faction: 'neutre', deck: decks.B } });
  const playedBy = { A: new Set<string>(), B: new Set<string>() };
  for (let k = 0; k < 5000 && !s.over && s.turn <= MAX_TURNS; k++) {
    const r = applyAction(s, chooseAction(s));
    if (!r.ok) throw new Error(r.error);
    for (const e of r.events) if (e.type === 'cardPlayed') playedBy[e.player].add(e.cardId);
    s = r.state;
  }
  if (!s.over) continue; // partie bloquée : ignorée
  decided++;
  for (const p of ['A', 'B'] as const) {
    const won = s.over.winner === p ? 1 : 0;
    for (const id of new Set(decks[p])) { const x = inDeck.get(id) ?? { n: 0, w: 0 }; x.n++; x.w += won; inDeck.set(id, x); }
    for (const id of playedBy[p]) { const x = played.get(id) ?? { n: 0, w: 0 }; x.n++; x.w += won; played.set(id, x); }
  }
  if ((g + 1) % 500 === 0) process.stdout.write(`${g + 1}/${GAMES} parties (${Math.round((Date.now() - t0) / 1000)} s)\n`);
}

// Écart = victoires avec la carte − victoires sans la carte (sur l'ensemble des decks). Marge ≈ intervalle à 95 %.
const totalDecks = decided * 2;
const rows = [...inDeck.entries()].map(([id, x]) => {
  const withRate = x.w / x.n;
  const without = { n: totalDecks - x.n, w: decided - x.w }; // chaque partie terminée a exactement 1 vainqueur
  const withoutRate = without.w / without.n;
  const margin = 1.96 * Math.sqrt(withRate * (1 - withRate) / x.n + withoutRate * (1 - withoutRate) / without.n);
  const pl = played.get(id);
  return { id, faction: CARDS[id]!.faction, niveau: CARDS[id]!.niveau, cout: CARDS[id]!.cout, type: CARDS[id]!.cardType, n: x.n, delta: withRate - withoutRate, margin, playedRate: pl ? pl.w / pl.n : NaN, playedN: pl?.n ?? 0 };
}).sort((a, b) => b.delta - a.delta);

const pts = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}`;
const pct = (v: number) => (Number.isNaN(v) ? '—' : `${Math.round(v * 100)} %`);
const TYPE: Record<string, string> = { Regiment: 'Régiment', Leader: 'Leader', Tactique: 'Tactique' };
const row = (r: typeof rows[number], rank: number) =>
  `| ${rank} | ${cardName(r.id)} | ${FACTION[r.faction]} | ${TYPE[r.type]} | ${r.niveau} | ${r.cout} | **${pts(r.delta)}** ± ${(r.margin * 100).toFixed(1)} | ${pct(r.playedRate)} |`;
const header = ['| # | Carte | Faction | Type | Niv. | Coût | Écart de victoire (points) | Victoires quand jouée |', '|---|---|---|---|---|---|---|---|'];
const empire = rows.filter(r => r.faction === 'empire');
const lines = [
  '# Classement des cartes', '', ...(PATCH ? [`Modifications testées (\`${PATCH}\`) :`, '', ...PATCH_CHANGES.map(c => `- ${c}`), ''] : []),
  `${decided} parties terminées entre decks aléatoires tout neufs (45 cartes : 30 de niveau 1-3, 15 de niveau 4-5, toutes factions), ${Math.round((Date.now() - t0) / 1000)} s.`, '',
  '**Écart de victoire** : taux de victoire des decks qui contiennent la carte, moins celui des decks qui ne la contiennent pas.',
  'Positif = la carte fait gagner. La marge (±) donne l\'incertitude : un écart plus petit que sa marge n\'est pas significatif.',
  '**Victoires quand jouée** : taux de victoire dans les parties où la carte a effectivement été posée (influencé par le fait qu\'on joue plus quand on gagne).', '',
  ...(['empire', 'elfe', 'demons', 'nomades', 'neutre'] as const).flatMap(f => [`## Cartes ${FACTION[f]}`, '', ...header, ...rows.filter(r => r.faction === f).map((r, k) => row(r, k + 1)), '']),
  '## Première vague (17/10/2026)', '', ...header, ...rows.filter(r => WAVE1_IDS.includes(r.id)).map((r, k) => row(r, k + 1)), '',
  '## Toutes les cartes', '', ...header, ...rows.map((r, k) => row(r, k + 1)), '',
  '_IA heuristique : une carte dont l\'effet est mal exploité par l\'IA peut sembler plus faible qu\'elle ne l\'est._',
];
mkdirSync('reports', { recursive: true });
const file = `reports/classement-cartes-${SEED}${PATCH ? `-${PATCH.replace(/^.*\//, "").replace(/\.json$/, "")}` : ""}.md`;
writeFileSync(file, lines.join('\n') + '\n');
console.log(lines.slice(0, 8).join('\n'));
console.log(`\nRapport complet : ${file}`);
