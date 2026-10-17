// Poids des cartes d'une faction contre les autres : des decks aléatoires de la faction affrontent les decks qualifiés
// des autres factions (reports/echelle-*.json). Pour chaque carte : taux de victoire des decks qui la jouent
// (pondéré par le nombre d'exemplaires) comparé à celui des decks qui ne la jouent pas.
// Usage : npx tsx tools/faction-card-impact.ts <faction> [decks=400] [parties par deck=4] [graine] [--patch balance/x.json]
//         → reports/impact-<faction>[-graine].json (à fusionner avec --merge)
//         npx tsx tools/faction-card-impact.ts merge <faction> <fichier1> <fichier2>…   → reports/impact-<faction>.md
import { readFileSync, writeFileSync } from 'node:fs';
import { chooseAction } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { patchFromArgs } from '../src/data/patch';
import { applyAction, createGame } from '../src/engine/game';
import { nextRandom, seedFrom } from '../src/engine/rng';
import type { Faction } from '../src/engine/types';
import { cardName } from '../src/i18n/log.fr';
import { COLLECTIBLE } from '../src/profile/profile';

const { args } = patchFromArgs(process.argv.slice(2));
const F: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];
type Rec = { deck: string[]; w: number; g: number; reasons: Record<string, number> };

if (args[0] === 'merge') {
  const f = args[1] as Faction;
  const recs: Rec[] = args.slice(2).flatMap(p => (JSON.parse(readFileSync(p, 'utf8')) as { recs: Rec[] }).recs);
  const all = recs.reduce((a, r) => ({ w: a.w + r.w, g: a.g + r.g }), { w: 0, g: 0 });
  const reasons: Record<string, number> = {};
  for (const r of recs) for (const [k, v] of Object.entries(r.reasons)) reasons[k] = (reasons[k] ?? 0) + v;
  const ids = [...new Set(recs.flatMap(r => r.deck))];
  const rows = ids.map(id => {
    let wi = 0, gi = 0, wo = 0, go = 0, copies = 0;
    for (const r of recs) {
      const k = r.deck.filter(x => x === id).length;
      if (k) { wi += r.w * k; gi += r.g * k; copies += k; } else { wo += r.w; go += r.g; }
    }
    return { id, with: wi / Math.max(1, gi), without: wo / Math.max(1, go), delta: wi / Math.max(1, gi) - wo / Math.max(1, go), copies };
  }).filter(r => r.copies >= 30).sort((a, b) => b.delta - a.delta);
  const pct = (x: number) => `${Math.round(100 * x)} %`;
  const lines = [
    `# Poids des cartes ${f} contre les autres factions`, '',
    `${recs.length} decks aléatoires, ${all.g} parties contre les 30 decks qualifiés des autres factions ; taux de victoire global ${pct(all.w / all.g)}.`,
    'Fins de partie (toutes) : ' + Object.entries(reasons).map(([k, v]) => `${k} ${pct(v / all.g)}`).join(', ') + '.', '',
    '| # | Carte | Niv. | Avec | Sans | Écart | Exemplaires |', '|---|---|---|---|---|---|---|',
    ...rows.map((r, i) => `| ${i + 1} | ${cardName(r.id)} | ${CARDS[r.id]!.niveau} | ${pct(r.with)} | ${pct(r.without)} | ${r.delta >= 0 ? '+' : ''}${Math.round(100 * r.delta)} | ${r.copies} |`),
  ];
  writeFileSync(`reports/impact-${f}.md`, lines.join('\n') + '\n');
  console.log(lines.slice(0, 30).join('\n'));
} else {
  const f = args[0] as Faction;
  const N = Number(args[1] ?? 400), G = Number(args[2] ?? 4), seed = args[3] ?? 'impact';
  let rng = seedFrom(`${seed}-${f}`);
  const rand = (n: number) => { const r = nextRandom(rng); rng = r.state; return Math.floor(r.value * n); };
  const inF = (id: string) => { const c = CARDS[id]!; return c.faction === f || c.faction === 'neutre' || ((c.factions as string[] | undefined) ?? []).includes(f); };
  const pool = COLLECTIBLE.filter(inF);
  const low = pool.filter(id => CARDS[id]!.niveau <= 3), high = pool.filter(id => CARDS[id]!.niveau >= 4);
  const randomDeck = (): string[] => {
    for (;;) {
      const d: string[] = [];
      const pick = (p: string[], k: number) => { for (let got = 0; got < k;) { const id = p[rand(p.length)]!; if (d.filter(x => x === id).length >= 3) continue; d.push(id); got++; } };
      pick(low, 30); pick(high, 15);
      if (d.filter(id => CARDS[id]!.cardType === 'Regiment' && CARDS[id]!.niveau === 1).length >= 5) return d;
    }
  };
  const opps = F.filter(x => x !== f).flatMap(x => (JSON.parse(readFileSync(`reports/echelle-${x}.json`, 'utf8')) as { top: { faction: Faction; deck: string[] }[] }).top);
  const recs: Rec[] = [];
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const rec: Rec = { deck: randomDeck(), w: 0, g: 0, reasons: {} };
    for (let k = 0; k < G; k++) {
      const o = opps[rand(opps.length)]!;
      const meFirst = k % 2 === 0;
      const A = meFirst ? { faction: f, deck: rec.deck } : { faction: o.faction, deck: o.deck };
      const B = meFirst ? { faction: o.faction, deck: o.deck } : { faction: f, deck: rec.deck };
      let s = createGame({ seed: `${seed}-${i}-${k}`, A, B });
      for (let n = 0; n < 5000 && !s.over && s.turn <= 80; n++) { const r = applyAction(s, chooseAction(s)); if (!r.ok) throw new Error(r.error); s = r.state; }
      const me = meFirst ? 'A' : 'B';
      const win = s.over ? s.over.winner === me : s.players[me].points <= s.players[me === 'A' ? 'B' : 'A'].points;
      rec.g++; if (win) rec.w++;
      const why = `${win ? 'victoire' : 'défaite'}-${s.over?.reason ?? 'tours'}`;
      rec.reasons[why] = (rec.reasons[why] ?? 0) + 1;
    }
    recs.push(rec);
    if ((i + 1) % 50 === 0) process.stdout.write(`${f} : ${i + 1}/${N} decks (${Math.round((Date.now() - t0) / 1000)} s)\n`);
  }
  writeFileSync(`reports/impact-${f}-${seed}.json`, JSON.stringify({ faction: f, recs }));
}
