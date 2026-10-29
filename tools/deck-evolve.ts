// Optimisation des decks par petites améliorations successives (au lieu du seul tirage au hasard).
// Pour chaque faction, une population de decks (au départ : les 10 qualifiés de l'échelle) évolue génération après génération :
// - mutations : 2 à 4 cartes échangées (même tranche de niveau : 1-3 ou 4-5), en tirant de préférence les cartes que le
//   rapport d'impact juge bonnes et en retirant de préférence les mauvaises ;
// - croisements : la moitié d'un bon deck complétée par un autre ;
// - sélection : chaque deck joue contre une série d'adversaires (les meilleurs decks actuels des autres factions), sur les
//   mêmes parties (mêmes graines) pour tous, et on garde les meilleurs.
// Plusieurs processus peuvent tourner en même temps (une ou deux factions chacun) : ils s'échangent leurs champions
// par les fichiers reports/evo-<faction>.json.
// Usage : npx tsx tools/deck-evolve.ts <factions séparées par des virgules> [générations=20] [parties par deck=40] [ia=v2|v3]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chooseAction, chooseActionV3, DEFAULT_WEIGHTS, type AiOptions } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { applyAction, createGame } from '../src/engine/game';
import { nextRandom, seedFrom } from '../src/engine/rng';
import type { Faction } from '../src/engine/types';
import { CARD_TEXT_FR } from '../src/i18n/cards.fr';
import { COLLECTIBLE } from '../src/profile/profile';

const FACTIONS: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];
const mine = (process.argv[2] ?? 'empire').split(',') as Faction[];
const GENS = Number(process.argv[3] ?? 20);
const N = Number(process.argv[4] ?? 40);
const AI = process.argv[5] ?? 'v2';
const V3: AiOptions = JSON.parse(process.env.AI_OPTS ?? '{"followUp":3}');
// Variantes : EVO_MAX='{"carte":1,…}' limite le nombre d'exemplaires de certaines cartes ;
// EVO_TAG=xxx écrit la population dans reports/evo-<faction>-xxx.json (la population officielle n'est pas touchée).
const MAXC: Record<string, number> = JSON.parse(process.env.EVO_MAX ?? '{}');
const TAG = process.env.EVO_TAG ? `-${process.env.EVO_TAG}` : '';
const maxOf = (id: string) => MAXC[id] ?? 3;
const POP = 10, PARENTS = 5, CHILDREN = 3, CROSS = 3, GAUNTLET = 4;

let rng = seedFrom(`evo-${mine.join('-')}-${Date.now()}`);
const rnd = () => { const r = nextRandom(rng); rng = r.state; return r.value; };
const pickW = <T>(list: T[], w: (x: T) => number): T => {
  const tot = list.reduce((t, x) => t + w(x), 0);
  let r = rnd() * tot;
  for (const x of list) { r -= w(x); if (r <= 0) return x; }
  return list[list.length - 1]!;
};

// Impact des cartes (reports/impact-toutes-cartes.md) : écart en points par faction.
const impact: Record<string, Record<string, number>> = {};
const LABEL: Record<string, Faction> = { Empire: 'empire', Elfes: 'elfe', Démons: 'demons', Nomades: 'nomades' };
const nameToId: Record<string, string> = {};
{
  for (const id of Object.keys(CARDS)) nameToId[CARD_TEXT_FR[id]?.name ?? id] = id;
  if (existsSync('reports/impact-toutes-cartes.md')) {
    for (const m of readFileSync('reports/impact-toutes-cartes.md', 'utf8').matchAll(/^\| \d+ \| (.+?) \| (\S+) \| \d \| \d+ % \| \d+ % \| ([+-]?\d+) \|/gm)) {
      const id = nameToId[m[1]!], f = LABEL[m[2]!];
      if (id && f) (impact[f] ??= {})[id] = Number(m[3]);
    }
  }
}
const inFaction = (id: string, f: Faction) => {
  const c = CARDS[id]!;
  return c.faction === f || c.faction === 'neutre' || ((c.factions as string[] | undefined) ?? []).includes(f);
};
const pools: Record<string, { low: string[]; high: string[] }> = {};
for (const f of FACTIONS) {
  const p = COLLECTIBLE.filter(id => inFaction(id, f));
  pools[f] = { low: p.filter(id => CARDS[id]!.niveau <= 3), high: p.filter(id => CARDS[id]!.niveau >= 4) };
}
const score = (f: Faction, id: string) => Math.exp((impact[f]?.[id] ?? 0) / 5);
const lvl1Regs = (d: string[]) => d.filter(id => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === 1).length;
const count = (d: string[], id: string) => d.filter(x => x === id).length;
const valid = (d: string[]) => d.length === 45 && d.filter(id => CARDS[id]!.niveau <= 3).length === 30 && lvl1Regs(d) >= 5 && d.every(id => count(d, id) <= maxOf(id));

function mutate(f: Faction, deck: string[]): string[] {
  for (let tries = 0; tries < 50; tries++) {
    const d = deck.slice();
    const k = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < k; i++) {
      const idx = d.indexOf(pickW(d, id => 1 / score(f, id)));
      const band = CARDS[d[idx]!]!.niveau <= 3 ? pools[f]!.low : pools[f]!.high;
      const add = pickW(band.filter(id => count(d, id) < maxOf(id) && id !== d[idx]), id => score(f, id));
      d[idx] = add;
    }
    if (valid(d)) return d;
  }
  return deck.slice();
}
function cross(f: Faction, a: string[], b: string[]): string[] {
  for (let tries = 0; tries < 50; tries++) {
    const take = (band: (id: string) => boolean, n: number) => {
      const fromA = a.filter(band).filter(() => rnd() < 0.5);
      const out: string[] = [];
      for (const id of fromA) if (out.length < n && count(out, id) < maxOf(id)) out.push(id);
      for (const id of b.filter(band)) { if (out.length >= n) break; if (count(out, id) < Math.min(count(b, id), maxOf(id))) out.push(id); }
      const pool = band(pools[f]!.low[0]!) ? pools[f]!.low : pools[f]!.high;
      while (out.length < n) { const id = pickW(pool.filter(x => count(out, x) < maxOf(x)), x => score(f, x)); out.push(id); }
      return out;
    };
    const d = [...take(id => CARDS[id]!.niveau <= 3, 30), ...take(id => CARDS[id]!.niveau >= 4, 15)];
    if (valid(d)) return d;
  }
  return mutate(f, a);
}

function play(a: { faction: Faction; deck: string[] }, b: { faction: Faction; deck: string[] }, seed: string): 'A' | 'B' {
  let s = createGame({ seed, A: { faction: a.faction, deck: a.deck }, B: { faction: b.faction, deck: b.deck } });
  for (let k = 0; k < 5000 && !s.over && s.turn <= 80; k++) {
    const act = AI === 'v3' ? chooseActionV3(s, DEFAULT_WEIGHTS, undefined, V3) : chooseAction(s);
    const r = applyAction(s, act); if (!r.ok) throw new Error(r.error); s = r.state;
  }
  return (s.over ? s.over.winner === 'A' : s.players.A.points <= s.players.B.points) ? 'A' : 'B';
}

interface Deck { deck: string[]; wins: number; games: number; born: number }
interface EvoFile { faction: Faction; gen: number; pop: Deck[]; history: { gen: number; best: number; mean: number }[] }
const file = (f: Faction, own = false) => `reports/evo-${f}${own && mine.includes(f) ? TAG : ''}.json`;
const load = (f: Faction, own = false): EvoFile | null => (existsSync(file(f, own)) ? JSON.parse(readFileSync(file(f, own), 'utf8')) as EvoFile : null);
const ladderTop = (f: Faction) => (JSON.parse(readFileSync(`reports/echelle-${f}.json`, 'utf8')) as { top: { deck: string[] }[] }).top.map(t => t.deck);

/** Adversaires : les meilleurs decks actuels des autres factions (population en cours, sinon échelle). */
function gauntlet(f: Faction): { faction: Faction; deck: string[] }[] {
  return FACTIONS.filter(x => x !== f).flatMap(x => {
    const e = load(x);
    const list = e ? e.pop.slice(0, GAUNTLET).map(d => d.deck) : ladderTop(x).slice(0, GAUNTLET);
    return list.map(deck => ({ faction: x, deck }));
  });
}

/** Ramène un deck sous les limites d'exemplaires : les copies en trop sont remplacées (même tranche de niveau). */
function clip(f: Faction, deck: string[]): string[] {
  const d = deck.slice();
  for (let i = 0; i < d.length; i++) {
    if (count(d, d[i]!) <= maxOf(d[i]!)) continue;
    const band = CARDS[d[i]!]!.niveau <= 3 ? pools[f]!.low : pools[f]!.high;
    d[i] = pickW(band.filter(id => count(d, id) < maxOf(id)), id => score(f, id));
  }
  return valid(d) ? d : mutate(f, d);
}
const state: Record<string, EvoFile> = {};
for (const f of mine) {
  const base = load(f, true) ?? load(f) ?? { faction: f, gen: 0, pop: ladderTop(f).slice(0, POP).map(deck => ({ deck, wins: 0, games: 0, born: 0 })), history: [] };
  if (TAG && !load(f, true)) base.pop = base.pop.map(d => ({ ...d, deck: clip(f, d.deck) }));
  state[f] = base;
}

for (let g = 0; g < GENS; g++) {
  for (const f of mine) {
    const st = state[f]!;
    const gen = st.gen + 1;
    const parents = st.pop.slice(0, PARENTS);
    const kids: Deck[] = [];
    for (const p of parents) for (let c = 0; c < CHILDREN; c++) kids.push({ deck: mutate(f, p.deck), wins: 0, games: 0, born: gen });
    for (let c = 0; c < CROSS; c++) {
      const a = parents[Math.floor(rnd() * parents.length)]!, b = parents[Math.floor(rnd() * parents.length)]!;
      kids.push({ deck: cross(f, a.deck, b.deck), wins: 0, games: 0, born: gen });
    }
    const all = [...st.pop.map(d => ({ ...d, wins: 0, games: 0 })), ...kids];
    const opps = gauntlet(f);
    const t0 = Date.now();
    for (const d of all) {
      for (let k = 0; k < N; k++) {
        const o = opps[k % opps.length]!;
        const side = k % 2 === 0 ? 'A' : 'B';
        const seed = `evo-${f}-${gen}-${k}`; // mêmes parties pour tous les decks de la génération
        const w = side === 'A' ? play({ faction: f, deck: d.deck }, o, seed) : play(o, { faction: f, deck: d.deck }, seed);
        if (w === side) d.wins++;
        d.games++;
      }
    }
    all.sort((x, y) => y.wins - x.wins || x.born - y.born);
    st.pop = all.slice(0, POP);
    st.gen = gen;
    const mean = st.pop.reduce((t, d) => t + d.wins / d.games, 0) / st.pop.length;
    st.history.push({ gen, best: st.pop[0]!.wins / st.pop[0]!.games, mean });
    writeFileSync(file(f, true), JSON.stringify(st, null, 1));
    console.log(`${f} génération ${gen} : meilleur ${Math.round(100 * st.pop[0]!.wins / N)} %, moyenne ${Math.round(100 * mean)} %, nouveaux dans le top ${st.pop.filter(d => d.born === gen).length} (${Math.round((Date.now() - t0) / 1000)} s)`);
  }
}
