// Decks adverses de l'acte 3 du roguelite (21/11/2026, demandé par Nathan) : les 6 paires et les 4 trios de factions.
// Conditions de l'acte 3 pour le deck optimisé (joué par l'ordinateur normal, comme en run) : il commence au niveau 3, sa main
// de départ garantit 1 régiment de niveau 2 et 2 de niveau 3, il perd à 50 de lassitude.
// Adversaires d'évaluation : les decks optimisés du menu (3 par faction), qui commencent à 16 de lassitude (niveau 4) et
// perdent à 50 — à peu près l'armée d'un joueur qui arrive à l'acte 3.
// Évolution : population de 8 decks de 45 cartes (en partie tirés des decks du mode normal qui tiennent dans les factions),
// mutations (4 cartes), croisements, sélection sur les mêmes parties.
// Usage : npx tsx tools/act3-evolve.ts <clés séparées par des virgules, ex. empire+elfe,empire+elfe+demons> [générations=6] [parties=16]
// Variable d'environnement : A3_DIR = dossier des résultats (reports par défaut), un fichier act3-<clé>.json par clé.
import { writeFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { OPTIMIZED_DECKS } from '../src/data/optimized';
import { NORMAL_DECKS } from '../src/data/optimizedNormal';
import { applyAction, createGame } from '../src/engine/game';
import { nextRandom, seedFrom } from '../src/engine/rng';
import type { Faction, GameState } from '../src/engine/types';
import { COLLECTIBLE } from '../src/profile/profile';

const KEYS = (process.argv[2] ?? 'empire+elfe').split(',');
const GENS = Number(process.argv[3] ?? 6);
const N = Number(process.argv[4] ?? 16);
const DIR = process.env.A3_DIR ?? 'reports';
const SIZE = 45, POP = 8, KEEP = 4, MIN_HIGH = 10, MAX_HIGH = 20, MIN_L2 = 3, MIN_L3 = 5;

let rs = seedFrom(`act3-${KEYS.join('-')}`);
const rnd = () => { const r = nextRandom(rs); rs = r.state; return r.value; };
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)]!;

const factionsOf = (key: string) => key.split('+') as Faction[];
const inKey = (id: string, fs: Faction[]) => {
  const c = CARDS[id]!;
  return c.faction === 'neutre' || fs.includes(c.faction) || ((c.factions as string[] | undefined) ?? []).some(f => fs.includes(f as Faction));
};
const count = (d: string[], id: string) => d.filter(x => x === id).length;
const regs = (d: string[], lvl: number) => d.filter(id => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === lvl).length;
const high = (d: string[]) => d.filter(id => CARDS[id]!.niveau >= 4).length;
const valid = (d: string[]) => d.length === SIZE && regs(d, 2) >= MIN_L2 && regs(d, 3) >= MIN_L3 && high(d) >= MIN_HIGH && high(d) <= MAX_HIGH
  && d.every(id => count(d, id) <= 3);

/** Répare un deck : complète ou retire des cartes au hasard jusqu'à ce qu'il soit valide. */
function repair(pool: string[], d0: string[]): string[] | null {
  for (let t = 0; t < 300; t++) {
    const d = d0.filter(id => pool.includes(id));
    while (d.length > SIZE) d.splice(Math.floor(rnd() * d.length), 1);
    const need = (pred: (id: string) => boolean, n: number) => {
      const xs = pool.filter(pred);
      for (let k = 0; k < 50 && d.filter(pred).length < n; k++) {
        const id = pick(xs);
        if (count(d, id) >= 3) continue;
        if (d.length >= SIZE) d.splice(d.findIndex(x => !pred(x) && CARDS[x]!.niveau < 4) >>> 0, 1);
        d.push(id);
      }
    };
    need(id => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === 2, MIN_L2);
    need(id => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === 3, MIN_L3);
    need(id => CARDS[id]!.niveau >= 4, MIN_HIGH);
    while (d.length < SIZE) { const id = pick(pool); if (count(d, id) < 3 && (CARDS[id]!.niveau < 4 || high(d) < MAX_HIGH)) d.push(id); }
    if (valid(d)) return d.sort();
  }
  return null;
}
function randomDeck(pool: string[]): string[] {
  for (let t = 0; t < 50; t++) { const d = repair(pool, []); if (d) return d; }
  throw new Error('deck impossible');
}
function mutate(pool: string[], d0: string[]): string[] {
  for (let t = 0; t < 200; t++) {
    const d = d0.slice();
    for (let k = 0; k < 4; k++) { d.splice(Math.floor(rnd() * d.length), 1); d.push(pick(pool)); }
    if (valid(d)) return d.sort();
  }
  return d0;
}
function cross(pool: string[], a: string[], b: string[]): string[] {
  for (let t = 0; t < 50; t++) {
    const half = a.slice().sort(() => rnd() - 0.5).slice(0, Math.floor(SIZE / 2));
    const rest = b.slice().sort(() => rnd() - 0.5);
    const d = half.slice();
    for (const id of rest) if (d.length < SIZE && count(d, id) < 3) d.push(id);
    if (valid(d)) return d.sort();
  }
  return mutate(pool, a);
}

/** Une partie : le deck d'acte 3 (B) contre un deck optimisé (A). */
function play(key: string, deck: string[], opp: (typeof OPTIMIZED_DECKS)[number], seed: string, first: 'A' | 'B'): boolean {
  let s: GameState = createGame({
    seed, first,
    A: { faction: opp.faction, deck: opp.cards },
    B: { faction: factionsOf(key)[0]!, deck, startRegimentLevels: [2, 3, 3] },
    config: { defeatLassitude: { A: 50, B: 50 } },
    scenario: { events: [], startLevel: { B: 3 }, startLassitude: { A: 16 } },
  });
  for (let n = 0; n < 6000 && !s.over && s.turn <= 70; n++) {
    const r = applyAction(s, chooseAction(s));
    if (!r.ok) return false;
    s = r.state;
  }
  return s.over ? s.over.winner === 'B' : s.players.B.points < s.players.A.points;
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
  // Départ : les decks du mode normal qui tiennent dans ces factions (réparés), puis des decks au hasard.
  const seeds = NORMAL_DECKS.filter(d => d.cards.every(id => inKey(id, fs))).map(d => repair(pool, d.cards)).filter((d): d is string[] => !!d);
  let pop = [...seeds.slice(0, POP - 2), ...Array.from({ length: Math.max(2, POP - seeds.length) }, () => randomDeck(pool))].slice(0, POP);
  let best: { deck: string[]; rate: number }[] = [];
  const t0 = Date.now();
  console.log(`${key} : ${seeds.length} deck(s) du mode normal au départ`);
  for (let gen = 0; gen < GENS; gen++) {
    const children = [...pop.slice(0, KEEP).map(d => mutate(pool, d)), ...pop.slice(0, KEEP).map(d => mutate(pool, d)), cross(pool, pop[0]!, pop[1]!), cross(pool, pop[1]!, pop[2]!)];
    const all = [...pop, ...children];
    const scored = all.map(d => ({ deck: d, rate: fitness(key, d, gen) })).sort((a, b) => b.rate - a.rate);
    pop = scored.slice(0, KEEP).map(x => x.deck).concat(Array.from({ length: POP - KEEP }, () => mutate(pool, pick(scored.slice(0, KEEP)).deck)));
    best = scored.slice(0, 3);
    console.log(`${key} génération ${gen + 1} : meilleur ${Math.round(100 * best[0]!.rate)} %, moyenne du top ${Math.round((100 * best.reduce((n, x) => n + x.rate, 0)) / best.length)} % (${Math.round((Date.now() - t0) / 1000)} s)`);
    writeFileSync(`${DIR}/act3-${key.replace(/\+/g, '-')}.json`, JSON.stringify({ key, generation: gen + 1, best }, null, 1) + '\n');
  }
}
