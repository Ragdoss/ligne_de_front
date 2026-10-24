// Bilan de l'optimisation des decks (tools/deck-evolve.ts), avec l'IA forte des deux côtés.
// 1. Progrès : pour chaque faction, son meilleur deck optimisé et son meilleur deck de l'échelle affrontent les mêmes
//    adversaires (les 5 meilleurs decks de l'échelle des autres factions), sur les mêmes parties.
// 2. Finale entre factions : les 5 meilleurs decks optimisés de chaque faction s'affrontent (factions différentes,
//    chaque paire deux fois, chacun commence une fois).
// Usage : npx tsx tools/evo-finale.ts [parties par deck pour le progrès=60]  → reports/decks-optimises.md
import { readFileSync, writeFileSync } from 'node:fs';
import { chooseActionV3, DEFAULT_WEIGHTS, STRONG_AI } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction } from '../src/engine/types';
import { cardName } from '../src/i18n/log.fr';

const N = Number(process.argv[2] ?? 60);
const F: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];
const LABEL: Record<string, string> = { empire: 'Empire', elfe: 'Elfes', demons: 'Démons', nomades: 'Nomades' };
type D = { faction: Faction; deck: string[] };
const evo = (f: Faction) => (JSON.parse(readFileSync(`reports/evo-${f}.json`, 'utf8')) as { gen: number; pop: { deck: string[]; wins: number; games: number }[] });
const ladder = (f: Faction) => (JSON.parse(readFileSync(`reports/echelle-${f}.json`, 'utf8')) as { top: { deck: string[] }[] }).top.map(t => t.deck);

function play(a: D, b: D, seed: string): 'A' | 'B' {
  let s = createGame({ seed, A: { faction: a.faction, deck: a.deck }, B: { faction: b.faction, deck: b.deck } });
  for (let k = 0; k < 5000 && !s.over && s.turn <= 80; k++) {
    const r = applyAction(s, chooseActionV3(s, DEFAULT_WEIGHTS, undefined, STRONG_AI)); if (!r.ok) throw new Error(r.error); s = r.state;
  }
  return (s.over ? s.over.winner === 'A' : s.players.A.points <= s.players.B.points) ? 'A' : 'B';
}
function vsGauntlet(d: D, opps: D[], tag: string): number {
  let w = 0;
  for (let k = 0; k < N; k++) {
    const o = opps[k % opps.length]!;
    const side = k % 2 === 0 ? 'A' : 'B';
    const r = side === 'A' ? play(d, o, `${tag}-${k}`) : play(o, d, `${tag}-${k}`);
    if (r === side) w++;
  }
  return w / N;
}
const pct = (x: number) => `${Math.round(100 * x)} %`;
const t0 = Date.now();
const lines = ['# Decks optimisés', ''];
lines.push(`Optimisation par mutations et sélection (tools/deck-evolve.ts), IA forte (v3) des deux côtés. Générations : ${F.map(f => `${LABEL[f]} ${evo(f).gen}`).join(', ')}.`, '');

// 1. Progrès
lines.push('## Progrès par rapport à l’échelle', '', `Contre les 5 meilleurs decks de l’échelle des autres factions, ${N} parties chacun, mêmes parties pour les deux decks.`, '',
  '| Faction | Meilleur deck de l’échelle | Meilleur deck optimisé |', '|---|---|---|');
for (const f of F) {
  const opps: D[] = F.filter(x => x !== f).flatMap(x => ladder(x).slice(0, 5).map(deck => ({ faction: x, deck })));
  const old = vsGauntlet({ faction: f, deck: ladder(f)[0]! }, opps, `prog-${f}`);
  const neu = vsGauntlet({ faction: f, deck: evo(f).pop[0]!.deck }, opps, `prog-${f}`);
  lines.push(`| ${LABEL[f]} | ${pct(old)} | **${pct(neu)}** |`);
  process.stdout.write(`progrès ${f} : ${pct(old)} → ${pct(neu)} (${Math.round((Date.now() - t0) / 1000)} s)\n`);
}

// 2. Finale entre factions
const champs: D[] = F.flatMap(f => evo(f).pop.slice(0, 5).map(p => ({ faction: f, deck: p.deck })));
const win: Record<string, Record<string, number>> = {}, games: Record<string, Record<string, number>> = {};
for (let i = 0; i < champs.length; i++) for (let j = i + 1; j < champs.length; j++) {
  const a = champs[i]!, b = champs[j]!;
  if (a.faction === b.faction) continue;
  for (const g of [0, 1]) {
    const [x, y] = g ? [b, a] : [a, b];
    const w = play(x, y, `fin-${i}-${j}-${g}`) === 'A' ? x : y;
    const l = w === x ? y : x;
    (win[w.faction] ??= {})[l.faction] = (win[w.faction]![l.faction] ?? 0) + 1;
    for (const [p, q] of [[x, y], [y, x]] as const) (games[p.faction] ??= {})[q.faction] = (games[p.faction]![q.faction] ?? 0) + 1;
  }
}
lines.push('', '## Finale entre les decks optimisés', '', '5 meilleurs decks optimisés par faction, chaque paire de factions différentes jouée deux fois.', '',
  '| Faction | Taux |', '|---|---|');
for (const f of F) {
  const w = F.reduce((t, x) => t + (win[f]?.[x] ?? 0), 0), g = F.reduce((t, x) => t + (games[f]?.[x] ?? 0), 0);
  lines.push(`| ${LABEL[f]} | ${pct(w / g)} |`);
}
lines.push('', `| Ligne contre colonne | ${F.map(f => LABEL[f]).join(' | ')} |`, `|---|${F.map(() => '---').join('|')}|`);
for (const f of F) lines.push(`| ${LABEL[f]} | ${F.map(x => (x === f ? '—' : pct((win[f]?.[x] ?? 0) / (games[f]?.[x] ?? 1)))).join(' | ')} |`);

// 3. Listes
lines.push('', '## Meilleur deck optimisé de chaque faction', '');
for (const f of F) {
  const d = evo(f).pop[0]!.deck;
  const n: Record<string, number> = {};
  for (const id of d) n[id] = (n[id] ?? 0) + 1;
  const ids = Object.keys(n).sort((a, b) => CARDS[a]!.niveau - CARDS[b]!.niveau || cardName(a).localeCompare(cardName(b)));
  lines.push(`**${LABEL[f]}** : ${ids.map(id => `${n[id]} ${cardName(id)}`).join(', ')}.`, '');
  // Changements par rapport au meilleur deck de l'échelle
  const o: Record<string, number> = {};
  for (const id of ladder(f)[0]!) o[id] = (o[id] ?? 0) + 1;
  const plus = Object.keys(n).filter(id => (n[id] ?? 0) > (o[id] ?? 0)).map(id => `+${n[id]! - (o[id] ?? 0)} ${cardName(id)}`);
  const minus = Object.keys(o).filter(id => (o[id] ?? 0) > (n[id] ?? 0)).map(id => `−${o[id]! - (n[id] ?? 0)} ${cardName(id)}`);
  lines.push(`Par rapport au meilleur deck de l’échelle : ${[...plus, ...minus].join(', ') || 'identique'}.`, '');
}
// Cartes les plus présentes dans les 10 decks optimisés de chaque faction
lines.push('## Cartes les plus jouées par les decks optimisés', '');
for (const f of F) {
  const n: Record<string, number> = {};
  for (const p of evo(f).pop) for (const id of p.deck) n[id] = (n[id] ?? 0) + 1;
  const top = Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id, k]) => `${cardName(id)} (${(k / evo(f).pop.length).toFixed(1)})`);
  lines.push(`**${LABEL[f]}** (exemplaires par deck en moyenne) : ${top.join(', ')}.`, '');
}
writeFileSync('reports/decks-optimises.md', lines.join('\n') + '\n');
console.log(`reports/decks-optimises.md (${Math.round((Date.now() - t0) / 1000)} s)`);
