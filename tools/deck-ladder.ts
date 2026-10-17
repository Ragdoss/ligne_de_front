// Échelle de decks : les meilleurs decks d'une faction battent-ils les meilleurs des autres ?
// 1. Qualifications (par faction) : 200 decks aléatoires mono-faction ; chacun joue 20 parties contre des decks de sa faction.
//    Les 30 premiers rejouent 20 parties entre eux, et les 10 meilleurs de cette seconde manche sont qualifiés.
// 2. Finale : les 40 qualifiés s'affrontent, uniquement entre factions différentes (2 parties par paire, chacun commence une fois).
// Usage :
//   npx tsx tools/deck-ladder.ts qualif <faction> [decks=200] [parties=20]   → reports/echelle-<faction>.json
//   npx tsx tools/deck-ladder.ts finale                                      → reports/echelle-finale.md
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { applyAction, createGame } from '../src/engine/game';
import { nextRandom, seedFrom } from '../src/engine/rng';
import type { Faction } from '../src/engine/types';
import { cardName } from '../src/i18n/log.fr';
import { COLLECTIBLE } from '../src/profile/profile';

const F: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];
const LABEL: Record<string, string> = { empire: 'Empire', elfe: 'Elfes', demons: 'Démons', nomades: 'Nomades' };
const [mode, arg1, arg2, arg3] = process.argv.slice(2);

interface Entry { id: string; faction: Faction; deck: string[]; w1: number; g1: number; w2: number; g2: number }

let rng = seedFrom(`echelle-${arg1 ?? 'finale'}`);
const rand = (n: number) => { const r = nextRandom(rng); rng = r.state; return Math.floor(r.value * n); };
const inFaction = (id: string, f: Faction) => {
  const c = CARDS[id]!;
  return c.faction === f || c.faction === 'neutre' || ((c.factions as string[] | undefined) ?? []).includes(f);
};
function randomDeck(f: Faction): string[] {
  const pool = COLLECTIBLE.filter(id => inFaction(id, f));
  const low = pool.filter(id => CARDS[id]!.niveau <= 3), high = pool.filter(id => CARDS[id]!.niveau >= 4);
  for (;;) {
    const d: string[] = [];
    const pick = (p: string[], k: number) => { for (let got = 0; got < k;) { const id = p[rand(p.length)]!; if (d.filter(x => x === id).length >= 3) continue; d.push(id); got++; } };
    pick(low, 30); pick(high, 15);
    if (d.filter(id => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === 1).length >= 5) return d;
  }
}
/** Une partie complète IA contre IA ; renvoie le gagnant (au-delà de 80 tours : la plus faible lassitude). */
function play(a: Entry, b: Entry, seed: string): { winner: Entry; reason: string; turns: number } {
  let s = createGame({ seed, A: { faction: a.faction, deck: a.deck }, B: { faction: b.faction, deck: b.deck } });
  for (let k = 0; k < 5000 && !s.over && s.turn <= 80; k++) { const r = applyAction(s, chooseAction(s)); if (!r.ok) throw new Error(r.error); s = r.state; }
  const winA = s.over ? s.over.winner === 'A' : s.players.A.points <= s.players.B.points;
  return { winner: winA ? a : b, reason: s.over?.reason ?? 'tours', turns: s.turn };
}
/** Chaque deck de la liste joue `games` parties contre des adversaires tirés au hasard dans la même liste (moitié en commençant). */
function round(list: Entry[], games: number, tag: string, field: 'w1' | 'w2', count: 'g1' | 'g2'): void {
  const t0 = Date.now();
  for (let k = 0; k < list.length * games / 2; k++) {
    // Appariement : le deck qui a le moins joué, contre un adversaire au hasard.
    const a = list.reduce((m, e) => (e[count] < m[count] ? e : m), list[0]!);
    let b = list[rand(list.length)]!;
    while (b === a) b = list[rand(list.length)]!;
    const [x, y] = a[count] % 2 ? [b, a] : [a, b];
    const r = play(x, y, `${tag}-${k}`);
    r.winner[field]++; a[count]++; b[count]++;
    if ((k + 1) % 200 === 0) process.stdout.write(`${tag} : ${k + 1}/${list.length * games / 2} parties (${Math.round((Date.now() - t0) / 1000)} s)\n`);
  }
}

if (mode === 'qualif') {
  const f = arg1 as Faction;
  const N = Number(arg2 ?? 200), G = Number(arg3 ?? 20);
  const entries: Entry[] = Array.from({ length: N }, (_, i) => ({ id: `${f}-${i + 1}`, faction: f, deck: randomDeck(f), w1: 0, g1: 0, w2: 0, g2: 0 }));
  round(entries, G, `${f}-manche1`, 'w1', 'g1');
  const top30 = [...entries].sort((p, q) => q.w1 / q.g1 - p.w1 / p.g1).slice(0, 30);
  round(top30, G, `${f}-manche2`, 'w2', 'g2');
  const ranked = [...top30].sort((p, q) => (q.w2 / q.g2 - p.w2 / p.g2) || (q.w1 / q.g1 - p.w1 / p.g1));
  mkdirSync('reports', { recursive: true });
  writeFileSync(`reports/echelle-${f}.json`, JSON.stringify({ faction: f, decks: N, games: G, top: ranked.slice(0, 10), all: entries.map(e => ({ id: e.id, w1: e.w1, g1: e.g1 })) }, null, 1));
  console.log(`${LABEL[f]} : qualifiés ${ranked.slice(0, 10).map(e => `${e.id} (${e.w2}/${e.g2})`).join(', ')}`);
} else if (mode === 'finale') {
  const quals: Entry[] = F.flatMap(f => (JSON.parse(readFileSync(`reports/echelle-${f}.json`, 'utf8')) as { top: Entry[] }).top);
  const stats = new Map<string, { w: number; g: number }>(quals.map(e => [e.id, { w: 0, g: 0 }]));
  const vs: Record<string, number> = {};
  const reasons: Record<string, number> = {};
  const t0 = Date.now();
  let n = 0;
  for (let i = 0; i < quals.length; i++) for (let j = i + 1; j < quals.length; j++) {
    const a = quals[i]!, b = quals[j]!;
    if (a.faction === b.faction) continue;
    for (const [x, y] of [[a, b], [b, a]] as const) {
      const r = play(x, y, `finale-${x.id}-${y.id}`);
      const l = r.winner === x ? y : x;
      stats.get(r.winner.id)!.w++; stats.get(r.winner.id)!.g++; stats.get(l.id)!.g++;
      vs[`${r.winner.faction}>${l.faction}`] = (vs[`${r.winner.faction}>${l.faction}`] ?? 0) + 1;
      reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
      if (++n % 200 === 0) process.stdout.write(`finale : ${n} parties (${Math.round((Date.now() - t0) / 1000)} s)\n`);
    }
  }
  const pct = (x: number, y: number) => `${Math.round((100 * x) / Math.max(1, y))} %`;
  const byF = (f: Faction) => quals.filter(e => e.faction === f).reduce((acc, e) => ({ w: acc.w + stats.get(e.id)!.w, g: acc.g + stats.get(e.id)!.g }), { w: 0, g: 0 });
  const ranked = [...quals].sort((p, q) => stats.get(q.id)!.w / stats.get(q.id)!.g - stats.get(p.id)!.w / stats.get(p.id)!.g);
  const qualifRate = (f: Faction) => {
    const j = JSON.parse(readFileSync(`reports/echelle-${f}.json`, 'utf8')) as { decks: number; games: number };
    return `${j.decks} decks, ${j.games} parties chacun`;
  };
  const composition = (e: Entry) => {
    const c: Record<string, number> = {};
    for (const id of e.deck) c[id] = (c[id] ?? 0) + 1;
    return Object.entries(c).sort((x, y) => CARDS[x[0]]!.niveau - CARDS[y[0]]!.niveau).map(([id, k]) => `${k} ${cardName(id)}`).join(', ');
  };
  const lines = [
    '# Échelle de decks : les meilleurs decks de chaque faction face à ceux des autres', '',
    `Qualifications : par faction, ${qualifRate('empire')} contre des decks de leur faction ; les 30 premiers rejouent ${''}20 parties entre eux ; les 10 meilleurs de cette seconde manche sont qualifiés.`,
    `Finale : ${n} parties entre les 40 qualifiés, uniquement entre factions différentes (2 parties par paire, chacun commence une fois) ; ${Math.round((Date.now() - t0) / 1000)} s. IA v2 des deux côtés.`, '',
    '## Résultat par faction (finale)', '', '| Faction | Victoires | Taux |', '|---|---|---|',
    ...F.map(f => { const x = byF(f); return `| ${LABEL[f]} | ${x.w} / ${x.g} | ${pct(x.w, x.g)} |`; }), '',
    '| Ligne contre colonne | ' + F.map(f => LABEL[f]).join(' | ') + ' |', '|---|' + F.map(() => '---').join('|') + '|',
    ...F.map(a => `| ${LABEL[a]} | ` + F.map(b => (a === b ? '—' : pct(vs[`${a}>${b}`] ?? 0, (vs[`${a}>${b}`] ?? 0) + (vs[`${b}>${a}`] ?? 0)))).join(' | ') + ' |'), '',
    'Fins de partie : ' + Object.entries(reasons).map(([k, v]) => `${k} ${pct(v, n)}`).join(', ') + '.', '',
    '## Classement des 40 qualifiés', '', '| # | Deck | Faction | Finale | Qualifications (manche 2) |', '|---|---|---|---|---|',
    ...ranked.map((e, i) => `| ${i + 1} | ${e.id} | ${LABEL[e.faction]} | ${stats.get(e.id)!.w} / ${stats.get(e.id)!.g} (${pct(stats.get(e.id)!.w, stats.get(e.id)!.g)}) | ${e.w2} / ${e.g2} |`), '',
    '## Meilleur deck de chaque faction', '',
    ...F.flatMap(f => { const e = ranked.find(x => x.faction === f)!; return [`**${LABEL[f]} — ${e.id}** (${pct(stats.get(e.id)!.w, stats.get(e.id)!.g)} en finale) : ${composition(e)}.`, '']; }),
  ];
  writeFileSync('reports/echelle-finale.md', lines.join('\n') + '\n');
  console.log(lines.slice(0, 22).join('\n'));
}
