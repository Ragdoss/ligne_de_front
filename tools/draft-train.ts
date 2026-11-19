// Entraînement de l'IA du draft par des drafts entre IA (19/11/2026, demandé par Nathan).
// Quatre IA draftent (6 paquets de 8 cartes, comme le vrai draft), construisent leur deck, puis jouent chacune contre chacune
// (2 parties par paire, chacune commençant une fois, IA forte : celle que le joueur affronte en draft).
//   Phase A — notes des cartes : à chaque itération, les IA draftent avec beaucoup de hasard (pour essayer toutes les cartes),
//     puis la note de chaque carte devient l'écart de victoires des decks qui la jouent (en points), lissé avec la note précédente.
//     Notes de départ : l'impact mesuré par le test des decks aléatoires (rapports impact-*-eq14*), pour toutes les cartes.
//   Phase B — façon de drafter : plusieurs réglages (fidélité aux factions, cartes hors faction, construction du deck) se
//     rencontrent dans les mêmes drafts ; le meilleur est gardé.
//   Phase C — vérification : la nouvelle IA contre l'ancienne (notes et réglages actuels du jeu), deux sièges chacune.
// Usage : npx tsx tools/draft-train.ts [itérations A=8] [drafts par itération=96] [processus=2]
//         (interne) npx tsx tools/draft-train.ts worker <job.json> <sortie.json>
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chooseActionV3, STRONG_AI } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { BASICS, DECK_MIN, HIGH_ADVISED, LVL1_MIN, newPack, PACKS, SEATS } from '../src/draft/draft';
import { CARD_RATING } from '../src/draft/ratings';
import { applyAction, createGame } from '../src/engine/game';
import type { Faction, GameState } from '../src/engine/types';
import { COLLECTIBLE } from '../src/profile/profile';

export interface Policy {
  name: string;
  ratings: Record<string, number>;
  /** Bonus de choix pour la 1re faction, la 2e, et malus hors faction (après `commitAt` cartes). */
  main: number; second: number; off: number; commitAt: number;
  /** Bonus des niveaux 4-5 quand il en manque. */
  highBonus: number;
  /** Hasard ajouté à chaque note au moment du choix. */
  noise: number;
  /** Construction : « old » = celle du jeu (deux factions + neutre, complété), « best » = les 40 meilleures cartes. */
  build: 'old' | 'best';
  /** Construction « best » : une carte hors des deux factions entre dans le deck si sa note atteint ce seuil. */
  offKeep: number;
}

const facs = (id: string): string[] => { const c = CARDS[id]!; const f = c.factions as string[] | undefined; return f?.length ? f : [c.faction]; };
const rate = (p: Policy, id: string) => p.ratings[id] ?? CARDS[id]!.niveau * 0.5;
const isLvl1Reg = (id: string) => CARDS[id]!.niveau === 1 && CARDS[id]!.cardType === 'Regiment';

function topF(p: Policy, cards: string[]): string[] {
  const sum: Record<string, number> = {};
  for (const id of cards) for (const f of facs(id)) if (f !== 'neutre') sum[f] = (sum[f] ?? 0) + 2 + rate(p, id);
  return Object.keys(sum).sort((a, b) => sum[b]! - sum[a]!);
}

function pickScore(p: Policy, id: string, picks: string[], rnd: () => number): number {
  let s = rate(p, id) + rnd() * p.noise;
  if (picks.length >= p.commitAt) {
    const [f1, f2] = topF(p, picks);
    const fs = facs(id);
    if (fs.includes(f1!)) s += p.main; else if (f2 && fs.includes(f2)) s += p.second; else if (!fs.includes('neutre')) s += p.off;
  }
  const high = picks.filter(x => CARDS[x]!.niveau >= 4).length;
  if (CARDS[id]!.niveau >= 4 && picks.length >= 20 && high < HIGH_ADVISED) s += p.highBonus;
  return s;
}

export function buildDeck(p: Policy, picks: string[]): string[] {
  const [f1, f2] = topF(p, picks);
  const inMain = (id: string) => facs(id).some(f => f === f1 || f === f2 || f === 'neutre');
  let deck: string[];
  if (p.build === 'old') {
    deck = picks.filter(inMain);
    const rest = picks.filter(id => !inMain(id)).sort((a, b) => rate(p, b) - rate(p, a));
    for (const id of rest) { if (deck.length >= DECK_MIN) break; deck.push(id); }
  } else {
    const pool = picks.filter(id => inMain(id) || rate(p, id) >= p.offKeep).sort((a, b) => rate(p, b) - rate(p, a));
    const others = picks.filter(id => !pool.includes(id)).sort((a, b) => rate(p, b) - rate(p, a));
    deck = [];
    // Les régiments de niveau 1 obligatoires d'abord, puis assez de niveaux 4-5, puis les meilleures cartes.
    for (const id of pool.filter(isLvl1Reg)) if (deck.filter(isLvl1Reg).length < LVL1_MIN) deck.push(id);
    const take = (id: string, i: number, src: string[]) => { deck.push(id); src.splice(i, 1); };
    const left = pool.slice();
    for (const id of deck) left.splice(left.indexOf(id), 1);
    for (let i = 0; i < left.length && deck.filter(x => CARDS[x]!.niveau >= 4).length < HIGH_ADVISED;) {
      if (CARDS[left[i]!]!.niveau >= 4) take(left[i]!, i, left); else i++;
    }
    while (deck.length < DECK_MIN && left.length) take(left[0]!, 0, left);
    while (deck.length < DECK_MIN && others.length) take(others[0]!, 0, others);
  }
  const basic = BASICS[0]!;
  while (deck.filter(isLvl1Reg).length < LVL1_MIN || deck.length < DECK_MIN) deck.push(basic);
  return deck;
}

// ---------- Simulation d'un draft ----------
interface DraftJob { seed: number; seats: number[] }
interface DeckResult { policy: number; deck: string[]; wins: number; games: number }

function simulateDraft(policies: Policy[], job: DraftJob): DeckResult[] {
  const st = { rng: job.seed | 0 };
  const rnd = () => { st.rng = (st.rng + 0x6d2b79f5) | 0; let t = Math.imul(st.rng ^ (st.rng >>> 15), st.rng | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const picks: string[][] = [[], [], [], []];
  for (let round = 0; round < PACKS; round++) {
    let packs = Array.from({ length: SEATS }, () => newPack(st));
    while (packs[0]!.length) {
      for (let s = 0; s < SEATS; s++) {
        const p = policies[job.seats[s]!]!, pack = packs[s]!;
        let best = 0, bs = -Infinity;
        pack.forEach((id, i) => { const v = pickScore(p, id, picks[s]!, rnd); if (v > bs) { bs = v; best = i; } });
        picks[s]!.push(pack.splice(best, 1)[0]!);
      }
      const left = round % 2 === 0;
      packs = packs.map((_, s) => packs[(s + (left ? SEATS - 1 : 1)) % SEATS]!);
    }
  }
  const decks = picks.map((pk, s) => buildDeck(policies[job.seats[s]!]!, pk));
  const res: DeckResult[] = decks.map((deck, s) => ({ policy: job.seats[s]!, deck, wins: 0, games: 0 }));
  const faction = (s: number) => (topF(policies[job.seats[s]!]!, decks[s]!)[0] ?? 'empire') as Faction;
  for (let a = 0; a < SEATS; a++) for (let b = a + 1; b < SEATS; b++) for (let g = 0; g < 2; g++) {
    const [x, y] = g === 0 ? [a, b] : [b, a];
    let s: GameState = createGame({ seed: `dt-${job.seed}-${a}-${b}-${g}`, first: 'A', A: { faction: faction(x), deck: decks[x]! }, B: { faction: faction(y), deck: decks[y]! } });
    for (let k = 0; k < 5000 && !s.over && s.turn <= 80; k++) {
      const r = applyAction(s, chooseActionV3(s, undefined, undefined, STRONG_AI));
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    const w = s.over ? s.over.winner : (s.players.A.points <= s.players.B.points ? 'A' : 'B');
    res[w === 'A' ? x : y]!.wins++;
    res[a]!.games++; res[b]!.games++;
  }
  return res;
}

// ---------- Processus de travail ----------
if (process.argv[2] === 'worker') {
  const job = JSON.parse(readFileSync(process.argv[3]!, 'utf8')) as { policies: Policy[]; drafts: DraftJob[] };
  const out: DeckResult[] = [];
  for (const d of job.drafts) out.push(...simulateDraft(job.policies, d));
  writeFileSync(process.argv[4]!, JSON.stringify(out));
  process.exit(0);
}

// ---------- Coordination ----------
const ITER = Number(process.argv[2] ?? 8), DRAFTS = Number(process.argv[3] ?? 96), PROCS = Number(process.argv[4] ?? 2);
const DIR = process.env.DT_DIR ?? 'reports/draft-train';
if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
let seedCounter = 1;

async function run(policies: Policy[], drafts: DraftJob[], tag: string): Promise<DeckResult[]> {
  const parts = Array.from({ length: PROCS }, (_, i) => drafts.filter((_, k) => k % PROCS === i));
  const outs = await Promise.all(parts.map((ds, i) => new Promise<DeckResult[]>((ok, ko) => {
    const jf = `${DIR}/job-${tag}-${i}.json`, of = `${DIR}/out-${tag}-${i}.json`;
    writeFileSync(jf, JSON.stringify({ policies, drafts: ds }));
    const c = spawn(process.execPath, [...process.execArgv, process.argv[1]!, 'worker', jf, of], { stdio: 'inherit' });
    c.on('exit', code => (code === 0 ? ok(JSON.parse(readFileSync(of, 'utf8')) as DeckResult[]) : ko(new Error(`worker ${i} : ${code}`))));
  })));
  return outs.flat();
}

/** Écart de victoires (points) des decks qui jouent chaque carte, et nombre d'exemplaires vus. */
function impacts(results: DeckResult[]): Record<string, { d: number; n: number }> {
  const W = results.reduce((a, r) => a + r.wins, 0), G = results.reduce((a, r) => a + r.games, 0);
  const acc: Record<string, { w: number; g: number; n: number; dw: number; dg: number }> = {};
  for (const r of results) {
    const counts: Record<string, number> = {};
    for (const id of r.deck) counts[id] = (counts[id] ?? 0) + 1;
    for (const [id, k] of Object.entries(counts)) { const a = (acc[id] ??= { w: 0, g: 0, n: 0, dw: 0, dg: 0 }); a.w += r.wins * k; a.g += r.games * k; a.n += k; a.dw += r.wins; a.dg += r.games; }
  }
  const out: Record<string, { d: number; n: number }> = {};
  for (const [id, a] of Object.entries(acc)) {
    const wo = (W - a.dw) / Math.max(1, G - a.dg);
    out[id] = { d: 100 * (a.w / a.g - wo), n: a.n };
  }
  return out;
}

function priorRatings(): Record<string, number> {
  const files: Record<string, string> = { empire: 'eq14b', elfe: 'eq14', demons: 'eq14b', nomades: 'eq14b' };
  const sums: Record<string, number[]> = {};
  for (const [f, tag] of Object.entries(files)) {
    const recs = ['v3', 'v4'].flatMap(v => (JSON.parse(readFileSync(`reports/impact-${f}-${tag}-${v}.json`, 'utf8')) as { recs: { deck: string[]; w: number; g: number }[] }).recs);
    const res = recs.map(r => ({ policy: 0, deck: r.deck, wins: r.w, games: r.g }));
    for (const [id, x] of Object.entries(impacts(res))) if (x.n >= 30) (sums[id] ??= []).push(x.d);
  }
  const out: Record<string, number> = {};
  for (const id of COLLECTIBLE) out[id] = sums[id] ? Math.round(10 * sums[id]!.reduce((a, b) => a + b, 0) / sums[id]!.length) / 10 : CARDS[id]!.niveau * 0.5;
  return out;
}

const OLD: Policy = { name: 'ancienne', ratings: { ...CARD_RATING }, main: 3, second: 1.5, off: -2, commitAt: 6, highBonus: 2, noise: 1.5, build: 'old', offKeep: 999 };
const log = (s: string) => { console.log(s); writeFileSync(`${DIR}/log.txt`, (existsSync(`${DIR}/log.txt`) ? readFileSync(`${DIR}/log.txt`, 'utf8') : '') + s + '\n'); };
const winRate = (rs: DeckResult[], pol: number) => { const x = rs.filter(r => r.policy === pol); return x.reduce((a, r) => a + r.wins, 0) / Math.max(1, x.reduce((a, r) => a + r.games, 0)); };

async function main(): Promise<void> {
  const t0 = Date.now();
  const el = () => `${Math.round((Date.now() - t0) / 60000)} min`;
  // Phase A : notes des cartes.
  let ratings = priorRatings();
  const history: DeckResult[][] = [];
  for (let it = 0; it < ITER; it++) {
    const explore: Policy = { ...OLD, name: 'exploration', ratings, noise: 4, build: 'best', off: -1, offKeep: 3 };
    const drafts = Array.from({ length: DRAFTS }, () => ({ seed: seedCounter++ * 7919, seats: [0, 0, 0, 0] }));
    const rs = await run([explore], drafts, `A${it}`);
    history.push(rs);
    const recent = history.slice(-3).flat(); // les trois dernières itérations
    const imp = impacts(recent);
    const K = 60; // lissage : 60 exemplaires vus pèsent autant que la note précédente
    const next: Record<string, number> = {};
    for (const id of COLLECTIBLE) {
      const x = imp[id], prev = ratings[id] ?? 0;
      next[id] = x ? Math.round(10 * ((x.n * x.d + K * prev) / (x.n + K))) / 10 : prev;
    }
    const moved = COLLECTIBLE.reduce((a, id) => a + Math.abs(next[id]! - ratings[id]!), 0) / COLLECTIBLE.length;
    ratings = next;
    writeFileSync(`${DIR}/ratings-${it}.json`, JSON.stringify(ratings));
    const top = [...COLLECTIBLE].sort((a, b) => ratings[b]! - ratings[a]!).slice(0, 8);
    log(`A ${it + 1}/${ITER} (${el()}) : ${rs.length} decks, écart moyen des notes ${moved.toFixed(2)} ; en tête : ${top.map(id => `${id} ${ratings[id]}`).join(', ')}`);
  }
  // Phase B : façon de drafter.
  const base = { ...OLD, ratings };
  const variants: Policy[] = [
    { ...base, name: 'notes nouvelles, réglages anciens' },
    { ...base, name: 'deux factions, hors faction si note ≥ 4', build: 'best', off: -1, offKeep: 4 },
    { ...base, name: 'souple : hors faction si note ≥ 2', build: 'best', main: 2, second: 1, off: -0.5, offKeep: 2 },
    { ...base, name: 'libre : les meilleures cartes, sans faction', build: 'best', main: 0.5, second: 0.25, off: 0, offKeep: -999 },
  ];
  const rot = (k: number) => [0, 1, 2, 3].map(s => (s + k) % 4);
  const rsB = await run(variants, Array.from({ length: DRAFTS * 2 }, (_, k) => ({ seed: seedCounter++ * 7919, seats: rot(k) })), 'B');
  const ranked = variants.map((v, i) => ({ i, name: v.name, rate: winRate(rsB, i) })).sort((a, b) => b.rate - a.rate);
  log(`B (${el()}) : ${ranked.map(r => `${r.name} ${Math.round(100 * r.rate)} %`).join(' ; ')}`);
  const best = variants[ranked[0]!.i]!;
  // Phase C : nouvelle IA contre l'ancienne.
  const rsC = await run([best, OLD], Array.from({ length: DRAFTS * 2 }, (_, k) => ({ seed: seedCounter++ * 7919, seats: k % 2 ? [0, 1, 0, 1] : [1, 0, 1, 0] })), 'C');
  const newRate = winRate(rsC, 0);
  log(`C (${el()}) : nouvelle IA ${Math.round(100 * newRate)} % contre l'ancienne`);
  // Cartes hors des deux factions principales dans les decks de la nouvelle IA (phase C).
  const offCards: Record<string, number> = {};
  for (const r of rsC.filter(x => x.policy === 0)) {
    const [f1, f2] = topF(best, r.deck);
    for (const id of r.deck) if (!facs(id).some(f => f === f1 || f === f2 || f === 'neutre')) offCards[id] = (offCards[id] ?? 0) + 1;
  }
  writeFileSync(`${DIR}/result.json`, JSON.stringify({ best: { ...best, ratings: undefined }, ratings, phaseB: ranked, newVsOld: newRate, offCards, decksC: rsC.filter(x => x.policy === 0).length }, null, 1));
  log(`fini (${el()})`);
}
void main();
