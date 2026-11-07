// Decks adverses de l'acte 2 du roguelite (07/11/2026) : un par faction et un par paire de factions (10 en tout).
// Conditions de l'acte 2 pour le deck optimisé (joué par l'ordinateur normal, comme en run) : il commence au niveau 2, sa main
// de départ garantit 3 régiments de niveau 2 (au lieu de 3 de niveau 1), il perd à 25 de lassitude.
// Adversaires d'évaluation : les decks optimisés du menu (3 par faction), qui commencent à 8 de lassitude (niveau 2) et perdent
// à 25 — à peu près l'armée d'un joueur au milieu d'une run.
// Évolution : population de 8 decks de 30 cartes, mutations (3 cartes), croisements, sélection sur les mêmes parties.
// Usage : npx tsx tools/act2-evolve.ts <clés séparées par des virgules, ex. empire,elfe+demons> [générations=6] [parties=16]
import { writeFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { OPTIMIZED_DECKS } from '../src/data/optimized';
import { applyAction, createGame } from '../src/engine/game';
import { nextRandom, seedFrom } from '../src/engine/rng';
import type { Faction, GameState } from '../src/engine/types';
import { COLLECTIBLE } from '../src/profile/profile';

const KEYS = (process.argv[2] ?? 'empire').split(',');
const GENS = Number(process.argv[3] ?? 6);
const N = Number(process.argv[4] ?? 16);
const SIZE = 30, POP = 8, KEEP = 4, MAX_HIGH = 6, MIN_L2 = 6;

let rs = seedFrom(`act2-${KEYS.join('-')}`);
const rnd = () => { const r = nextRandom(rs); rs = r.state; return r.value; };
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)]!;

const factionsOf = (key: string) => key.split('+') as Faction[];
const inKey = (id: string, fs: Faction[]) => {
  const c = CARDS[id]!;
  return c.faction === 'neutre' || fs.includes(c.faction) || ((c.factions as string[] | undefined) ?? []).some(f => fs.includes(f as Faction));
};
const count = (d: string[], id: string) => d.filter(x => x === id).length;
const l2Regs = (d: string[]) => d.filter(id => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === 2).length;
const high = (d: string[]) => d.filter(id => CARDS[id]!.niveau >= 4).length;
const valid = (d: string[]) => d.length === SIZE && l2Regs(d) >= MIN_L2 && high(d) <= MAX_HIGH && d.every(id => count(d, id) <= (CARDS[id]!.unique ? 1 : 3));

function randomDeck(pool: string[]): string[] {
  for (let t = 0; t < 500; t++) {
    const d: string[] = [];
    const l2 = pool.filter(id => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === 2);
    while (l2Regs(d) < MIN_L2 + 2) { const id = pick(l2); if (count(d, id) < 3) d.push(id); }
    while (d.length < SIZE) { const id = pick(pool); if (count(d, id) < (CARDS[id]!.unique ? 1 : 3) && (CARDS[id]!.niveau < 4 || high(d) < MAX_HIGH)) d.push(id); }
    if (valid(d)) return d.sort();
  }
  throw new Error('deck impossible');
}
function mutate(pool: string[], d0: string[]): string[] {
  for (let t = 0; t < 200; t++) {
    const d = d0.slice();
    for (let k = 0; k < 3; k++) { d.splice(Math.floor(rnd() * d.length), 1); d.push(pick(pool)); }
    if (valid(d)) return d.sort();
  }
  return d0;
}
function cross(pool: string[], a: string[], b: string[]): string[] {
  for (let t = 0; t < 50; t++) {
    const half = a.slice().sort(() => rnd() - 0.5).slice(0, SIZE / 2);
    const rest = b.slice().sort(() => rnd() - 0.5);
    const d = half.slice();
    for (const id of rest) if (d.length < SIZE && count(d, id) < 3) d.push(id);
    if (valid(d)) return d.sort();
  }
  return mutate(pool, a);
}

/** Une partie : le deck d'acte 2 (B) contre un deck optimisé (A). */
function play(key: string, deck: string[], opp: (typeof OPTIMIZED_DECKS)[number], seed: string, first: 'A' | 'B'): boolean {
  let s: GameState = createGame({
    seed, first,
    A: { faction: opp.faction, deck: opp.cards },
    B: { faction: factionsOf(key)[0]!, deck, startRegimentLevel: 2 },
    config: { defeatLassitude: { A: 25, B: 25 } },
    scenario: { events: [], startLevel: { B: 2 }, startLassitude: { A: 8 } },
  });
  for (let n = 0; n < 5000 && !s.over && s.turn <= 50; n++) {
    const r = applyAction(s, chooseAction(s));
    if (!r.ok) return false;
    s = r.state;
  }
  return s.over?.winner === 'B';
}
function fitness(key: string, deck: string[], gen: number): number {
  let w = 0;
  for (let g = 0; g < N; g++) {
    const opp = OPTIMIZED_DECKS[(g * 5 + gen) % OPTIMIZED_DECKS.length]!;
    if (play(key, deck, opp, `${key}-${gen}-${g}`, g % 2 ? 'A' : 'B')) w++;
  }
  return w / N;
}

for (const key of KEYS) {
  const fs = factionsOf(key);
  const pool = COLLECTIBLE.filter(id => inKey(id, fs));
  let pop = Array.from({ length: POP }, () => randomDeck(pool));
  let best: { deck: string[]; rate: number }[] = [];
  const t0 = Date.now();
  for (let gen = 0; gen < GENS; gen++) {
    const children = [...pop.slice(0, KEEP).map(d => mutate(pool, d)), ...pop.slice(0, KEEP).map(d => mutate(pool, d)), cross(pool, pop[0]!, pop[1]!), cross(pool, pop[1]!, pop[2]!)];
    const all = [...pop, ...children];
    const scored = all.map(d => ({ deck: d, rate: fitness(key, d, gen) })).sort((a, b) => b.rate - a.rate);
    pop = scored.slice(0, KEEP).map(x => x.deck).concat(Array.from({ length: POP - KEEP }, () => randomDeck(pool)));
    best = scored.slice(0, 3);
    console.log(`${key} génération ${gen + 1} : meilleur ${Math.round(100 * best[0]!.rate)} %, moyenne du top ${Math.round((100 * best.reduce((n, x) => n + x.rate, 0)) / best.length)} % (${Math.round((Date.now() - t0) / 1000)} s)`);
    writeFileSync(`reports/act2-${key.replace('+', '-')}.json`, JSON.stringify({ key, generation: gen + 1, best }, null, 1) + '\n');
  }
}
