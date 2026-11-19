// Decks du mode normal contre l'ordinateur (18/11/2026) : un par faction et un par binôme de factions (10 en tout),
// optimisés pour l'IA forte (celle du mode « contre l'ordinateur »), aux règles normales (45 cartes : 30 de niveau 1-3,
// 15 de niveau 4-5, au moins 4 régiments de niveau 1, 3 exemplaires au plus — Unique limite le jeu, pas le deck).
// Un binôme garde au moins 10 cartes de chacune de ses deux factions (sinon il redevient un deck d'une seule faction).
// Évaluation : chaque deck joue contre les 12 decks optimisés du 25/10 (les deux côtés commencent tour à tour), mêmes parties
// pour tous les decks d'une génération ; les survivants rejouent à chaque génération et leurs résultats s'additionnent.
// Population de départ : le deck déjà retenu pour la clé, les decks optimisés de la faction (ou un croisement de ceux des deux factions pour un binôme).
// Usage : npx tsx tools/normal-evolve.ts <clés, ex. empire,elfe+demons> [générations=6] [parties=24]
// Variables d'environnement : NE_OPP=normal (adversaires : les 10 decks de src/data/optimizedNormal.ts au lieu des 12 du 25/10),
// NE_BAN=id,id… (cartes interdites), NE_TAG=x (résultat dans reports/normal-<clé>-x.json), NE_SEED=deck.json (deck de départ en plus),
// NE_OUT=dossier (où écrire les résultats, reports par défaut), NE_FOCUS=id,id… ou NE_FOCUS=balance14 (une mutation sur deux tire ses cartes parmi celles-ci, pour les faire essayer).
import { readFileSync, writeFileSync } from 'node:fs';
import { chooseActionV3, STRONG_AI } from '../src/ai/heuristic';
import { BALANCE_14 } from '../src/data/balance14';
import { CARDS } from '../src/data/cards';
import { OPTIMIZED_DECKS } from '../src/data/optimized';
import { NORMAL_DECKS } from '../src/data/optimizedNormal';
import { applyAction, createGame } from '../src/engine/game';
import { nextRandom, seedFrom } from '../src/engine/rng';
import type { Faction, GameState } from '../src/engine/types';
import { COLLECTIBLE } from '../src/profile/profile';

const KEYS = (process.argv[2] ?? 'empire').split(',');
const GENS = Number(process.argv[3] ?? 6);
const N = Number(process.argv[4] ?? 24);
const KEEP = 5, MUT = 6, CROSS = 3, MIN_EACH = 10;
const BAN = new Set((process.env.NE_BAN ?? '').split(',').filter(Boolean));
const FOCUS = new Set(process.env.NE_FOCUS === 'balance14' ? Object.keys(BALANCE_14) : (process.env.NE_FOCUS ?? '').split(',').filter(Boolean));
const TAG = process.env.NE_TAG ? `-${process.env.NE_TAG}` : '';
const OPPS: { faction: Faction; cards: string[]; id?: string }[] = process.env.NE_OPP === 'normal' ? NORMAL_DECKS : OPTIMIZED_DECKS;
const EXTRA_SEED = process.env.NE_SEED ? (JSON.parse(readFileSync(process.env.NE_SEED, 'utf8')) as { cards: string[] }).cards : null;

let rs = seedFrom(`normal-${KEYS.join('-')}`);
const rnd = () => { const r = nextRandom(rs); rs = r.state; return r.value; };
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)]!;
const shuffle = <T,>(xs: T[]) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [a[i], a[k]] = [a[k]!, a[i]!]; } return a; };

const factionsOf = (key: string) => key.split('+') as Faction[];
const of = (id: string, f: Faction) => CARDS[id]!.faction === f || ((CARDS[id]!.factions as string[] | undefined) ?? []).includes(f);
const inKey = (id: string, fs: Faction[]) => !BAN.has(id) && (CARDS[id]!.faction === 'neutre' || fs.some(f => of(id, f)));
const low = (id: string) => CARDS[id]!.niveau <= 3;
const maxOf = (_id: string) => 3; // Unique : un seul en jeu à la fois, mais jusqu'à 3 exemplaires dans le deck
const count = (d: string[], id: string) => d.filter(x => x === id).length;
const lvl1Regs = (d: string[]) => d.filter(id => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === 1).length;
function valid(d: string[], fs: Faction[]): boolean {
  if (d.length !== 45 || d.filter(low).length !== 30 || lvl1Regs(d) < 4) return false;
  if (!d.every(id => inKey(id, fs) && count(d, id) <= maxOf(id))) return false;
  return fs.length === 1 || fs.every(f => d.filter(id => of(id, f)).length >= MIN_EACH);
}
const mainFaction = (d: string[], fs: Faction[]) => fs.slice().sort((a, b) => d.filter(id => of(id, b)).length - d.filter(id => of(id, a)).length)[0]!;

function mutate(pool: string[], fs: Faction[], d0: string[]): string[] {
  for (let t = 0; t < 200; t++) {
    const d = d0.slice();
    const k = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < k; i++) {
      const idx = Math.floor(rnd() * d.length);
      const band = pool.filter(id => low(id) === low(d[idx]!) && id !== d[idx] && count(d, id) < maxOf(id));
      const focus = FOCUS.size && rnd() < 0.5 ? band.filter(id => FOCUS.has(id)) : [];
      d[idx] = pick(focus.length ? focus : band);
    }
    if (valid(d, fs)) return d.sort();
  }
  return d0.slice();
}
function cross(pool: string[], fs: Faction[], a: string[], b: string[]): string[] {
  for (let t = 0; t < 200; t++) {
    const take = (band: (id: string) => boolean, n: number) => {
      const out: string[] = [];
      for (const id of [...shuffle(a.filter(band)).slice(0, Math.ceil(n / 2)), ...shuffle(b.filter(band))]) {
        if (out.length < n && inKey(id, fs) && count(out, id) < maxOf(id)) out.push(id);
      }
      while (out.length < n) { const id = pick(pool.filter(x => band(x) && count(out, x) < maxOf(x))); out.push(id); }
      return out;
    };
    const d = [...take(low, 30), ...take(id => !low(id), 15)];
    if (valid(d, fs)) return d.sort();
  }
  return mutate(pool, fs, a);
}

/** Une partie, IA forte des deux côtés : true si le deck évalué (joueur `side`) gagne. */
function play(deck: string[], f: Faction, opp: (typeof OPPS)[number], seed: string, side: 'A' | 'B'): boolean {
  const me = { faction: f, deck }, them = { faction: opp.faction, deck: opp.cards };
  let s: GameState = createGame({ seed, first: 'A', A: side === 'A' ? me : them, B: side === 'A' ? them : me });
  for (let k = 0; k < 5000 && !s.over && s.turn <= 80; k++) {
    const r = applyAction(s, chooseActionV3(s, undefined, undefined, STRONG_AI));
    if (!r.ok) throw new Error(r.error);
    s = r.state;
  }
  const winner = s.over ? s.over.winner : (s.players.A.points <= s.players.B.points ? 'A' : 'B');
  return winner === side;
}

interface Deck { deck: string[]; wins: number; games: number }
for (const key of KEYS) {
  const fs = factionsOf(key);
  const pool = COLLECTIBLE.filter(id => inKey(id, fs));
  const seeds = OPTIMIZED_DECKS.filter(o => fs.includes(o.faction)).map(o => o.cards.filter(id => inKey(id, fs)));
  // Départ : decks optimisés (mono) ou croisements des decks des deux factions (binôme), complétés au besoin.
  const start: string[][] = [];
  // Le deck déjà retenu pour cette clé (src/data/optimizedNormal.ts) fait partie du départ.
  const prev = NORMAL_DECKS.find(d => d.id === key.replace('+', '-'));
  if (prev && valid(prev.cards, fs)) start.push(prev.cards.slice().sort());
  else if (prev) start.push(cross(pool, fs, prev.cards, prev.cards));
  if (EXTRA_SEED) start.push(valid(EXTRA_SEED, fs) ? EXTRA_SEED.slice().sort() : cross(pool, fs, EXTRA_SEED, EXTRA_SEED));
  if (fs.length === 1) for (const d of seeds) start.push(valid(d, fs) ? d.slice().sort() : cross(pool, fs, d, d));
  const A = seeds.filter((_, i) => OPTIMIZED_DECKS.filter(o => fs.includes(o.faction))[i]!.faction === fs[0]);
  const B = seeds.filter((_, i) => OPTIMIZED_DECKS.filter(o => fs.includes(o.faction))[i]!.faction === fs[fs.length - 1]);
  while (start.length < KEEP + 3) start.push(fs.length === 1 ? mutate(pool, fs, pick(start)) : cross(pool, fs, pick(A), pick(B)));
  let pop: Deck[] = start.map(deck => ({ deck, wins: 0, games: 0 }));
  const t0 = Date.now();
  for (let gen = 0; gen < GENS; gen++) {
    if (gen > 0) {
      const parents = pop.slice(0, KEEP);
      const kids = [
        ...Array.from({ length: MUT }, (_, i) => mutate(pool, fs, parents[i % parents.length]!.deck)),
        ...Array.from({ length: CROSS }, (_, i) => cross(pool, fs, parents[i % parents.length]!.deck, parents[(i + 1) % parents.length]!.deck)),
      ];
      pop = [...parents, ...kids.map(deck => ({ deck, wins: 0, games: 0 }))];
    }
    for (const d of pop) {
      const f = mainFaction(d.deck, fs);
      for (let g = 0; g < N; g++) {
        const opp = OPPS[g % OPPS.length]!;
        if (play(d.deck, f, opp, `${key}-${gen}-${g}`, Math.floor(g / OPPS.length) % 2 ? 'B' : 'A')) d.wins++;
        d.games++;
      }
    }
    pop.sort((a, b) => b.wins / b.games - a.wins / a.games);
    const top = pop.slice(0, 3);
    console.log(`${key} génération ${gen + 1}/${GENS} : meilleur ${Math.round((100 * top[0]!.wins) / top[0]!.games)} % (${top[0]!.games} parties), top 3 ${top.map(x => Math.round((100 * x.wins) / x.games)).join('/')} % — ${Math.round((Date.now() - t0) / 1000)} s`);
    writeFileSync(`${process.env.NE_OUT ?? 'reports'}/normal-${key.replace('+', '-')}${TAG}.json`, JSON.stringify({ key, opp: process.env.NE_OPP === 'normal' ? 'normal' : '25/10', ban: [...BAN], faction: mainFaction(top[0]!.deck, fs), generation: gen + 1, best: top.map(x => ({ deck: x.deck, rate: x.wins / x.games, games: x.games })) }, null, 1) + '\n');
  }
}
