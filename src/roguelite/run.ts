// Mode roguelite — prototype de l'acte 1 (03/11/2026), d'après le document « Campagne 5 et mode roguelite » de Nathan.
// Une run : le champion Augustus (Empire), 8 nœuds puis le boss. Après chaque nœud, 1 à 3 options pour le suivant
// (combat, mini-boss, événement, marchand). La lassitude est en partie gardée d'un combat à l'autre (points de vie de la run),
// les cartes peuvent être améliorées ou abîmées définitivement (exemplaire par exemplaire), et l'Essence divine, l'Expérience
// et les Offrandes se gardent entre les runs (méta). Pas encore : Étendards, actes 2-3, achats de méta-progression.
import { COLLECTIBLE } from '../profile/profile';
import { CARDS } from '../data/cards';
import { registerTitanCards } from '../data/titans';
import { CARD_TEXT_FR } from '../i18n/cards.fr';
import { nextRandom, seedFrom } from '../engine/rng';
import type { CardDef, Faction, GameState, RunMod } from '../engine/types';
import type { GameSetup } from '../engine/game';
import { CAMPAIGN_EASE, scenarioGameSetup } from '../campaign/campaign';
import { SCENARIOS } from '../campaign/campaigns';
import { COURONNE_SCENARIOS } from '../campaign/couronne';
import type { CampaignScenario } from '../campaign/types';
import { keyFor } from '../profile/store';

// ---------- Constantes ----------
/** Seuils de défaite par lassitude, par acte (le joueur et ses adversaires de combat). */
export const ACT_LASSITUDE = [16, 25, 50] as const;
/** Amélioration « Lassitude » : seuil de défaite au plus 20 / 30 / 60. */
const LASSITUDE_UPG_CAP = [4, 5, 10] as const;
export const NODES_PER_ACT = 8;
/** Part de la lassitude de fin de combat gardée (avant Régénération). */
export const KEEP_SHARE = 0.5;
const NEVER = 999;
/** Decks adverses de l'acte 1 : les premiers scénarios des campagnes, déjà réglés contre des decks de départ. */
const ACT1_DECKS = ['d1', 'd2', 'e1', 'e2', 'n1', 'n2', 's1', 'cd4'];
const MINIBOSS_DECKS = ['d3', 's2', 'cn5'];
const BOSS_DECKS = ['e2', 's2', 'n3'];

export const PRICES = { carte: 30, carteHaute: 45, retirer: 25, lassitude: 20, ameliorer: 35 } as const;
export const LASSITUDE_SHOP = 5;

// ---------- Types ----------
/** Exemplaire de la run : `mods` = améliorations (camp, entraînement, marché…), `curse` = malus des Titans. */
export interface RunCard { uid: number; id: string; mods: RunMod; curse?: RunMod }
export type RewardKind = 'or' | 'essence' | 'xp' | 'offrandes' | 'amelioration';
export type NodeOption =
  | { kind: 'combat'; reward: RewardKind; deck: string }
  | { kind: 'miniboss'; deck: string }
  | { kind: 'event'; id: EventId }
  | { kind: 'marche' }
  | { kind: 'boss'; deck: string };
export type EventId = 'camp' | 'entrainement';
export type CardPurpose = 'retirer' | 'ameliorer' | 'humain' | 'elfe' | 'garde';
/** Étapes à résoudre avant de choisir le nœud suivant. */
export type Step =
  | { kind: 'resume'; title: string; lines: string[] }
  | { kind: 'volontaires'; round: number }
  | { kind: 'promotion' }
  | { kind: 'cartes'; purpose: CardPurpose; n: number; optional: boolean }
  | { kind: 'evenement'; id: EventId; second?: boolean }
  | { kind: 'marche'; bought: number[] };
export interface MarketOffer { kind: 'carte' | 'retirer' | 'lassitude' | 'ameliorer'; cardId?: string; price: number }
export interface RunState {
  version: 1;
  id: string;
  seed: string;
  champion: 'augustus';
  act: number;
  /** Nœuds terminés dans l'acte (0 à 8 ; 8 = place au boss). */
  node: number;
  deck: RunCard[];
  nextUid: number;
  lassitude: number;
  gold: number;
  /** Gagnés pendant cette run (versés à la méta à la fin). */
  essence: number;
  xp: number;
  eventsSeen: EventId[];
  eventThisAct: boolean;
  miniBossOffers: number;
  miniBossDone: boolean;
  options: NodeOption[];
  /** Améliorations achetées entre les runs, figées au début de la run. */
  upg: Record<string, number>;
  /** Incorruptible : relances restantes après une défaite. */
  revives: number;
  current: NodeOption | null;
  steps: Step[];
  over: null | { won: boolean; text: string };
  /** Incorruptible : le combat en cours est à rejouer après le résumé. */
  relaunch?: boolean;
}
export interface RunMeta {
  essence: number;
  xp: number;
  offrandes: number;
  /** Offrandes faites à chaque événement (toutes runs confondues). */
  offeredAt: Partial<Record<EventId, number>>;
  unlocks: string[];
  /** Améliorations achetées (niveau par amélioration). */
  upg: Record<string, number>;
  runs: number;
  wins: number;
}

// ---------- Hasard reproductible ----------
function rng(key: string) {
  let st = seedFrom(key);
  return () => { const r = nextRandom(st); st = r.state; return r.value; };
}
const pickOne = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;

// ---------- Exemplaires de cartes ----------
export const baseOf = (id: string): string => id.split('~')[0]!;
export const variantId = (rc: RunCard): string => `${rc.id}~${rc.uid}`;
const STATS = ['atk', 'end', 'arm', 'ini', 'mor'] as const;
const BONUSES = ['bonusAtk', 'bonusArm', 'bonusIni', 'bonusMor', 'bonusEnd'] as const;
/** Valeur après malus et bonus : jamais sous 25 % de l'originale. */
const floored = (base: number, delta: number) => Math.max(Math.round(base * 0.25), Math.round(base + delta));

/** Définition de carte d'un exemplaire, malus et améliorations compris. */
export function variantDef(rc: RunCard, upg: Record<string, number> = {}): CardDef {
  const b = CARDS[rc.id]!;
  const d: CardDef = { ...b, id: variantId(rc) };
  const m: RunMod = { ...rc.mods };
  for (const [k, v] of Object.entries(rc.curse ?? {}) as [keyof RunMod, number][]) m[k] = (m[k] ?? 0) + v;
  // Améliorations d'Augustus (Expérience), appliquées à chaque combat par-dessus l'exemplaire.
  const add = (k: keyof RunMod, v: number) => { if (v) m[k] = (m[k] ?? 0) + v; };
  const lvl = (id: string) => upg[id] ?? 0;
  if (b.cardType === 'Regiment') {
    if (rc.uid <= AUGUSTUS_DECK.length && lvl('armee_elue')) for (const k of STATS) { const v = (b[k] as number | undefined) ?? 0; add(k, Math.round(v * 0.1 * lvl('armee_elue'))); }
    if (b.types?.includes('Monté') && lvl('magister_equitum')) add('atk', Math.round(((b.atk as number) ?? 0) * 0.2 * lvl('magister_equitum')));
    if (b.niveau >= 4 && lvl('praefectus')) add('cout', -1);
  }
  if (b.cardType === 'Leader') {
    if (lvl('generalissime')) add('bonusPct', 20 * lvl('generalissime'));
    if (lvl('imperator')) add('cout', -1);
  }
  if (b.cardType === 'Tactique' && lvl('genie')) {
    const g = lvl('genie');
    add('cout', -((b.cout >= 2 ? 1 : 0) + (g >= 2 && b.cout === 1 ? 1 : 0) + (g >= 3 && b.cout >= 3 ? 1 : 0)));
  }
  for (const k of STATS) if (m[k] && typeof b[k] === 'number') (d as unknown as Record<string, number>)[k] = floored(b[k] as number, m[k]!);
  if (m.cout) d.cout = Math.max(0, Math.min(b.cout + 2, b.cout + m.cout));
  if (m.bonusPct) for (const k of BONUSES) { const v = b[k] as number | undefined; if (v) (d as unknown as Record<string, number>)[k] = floored(v, (v * m.bonusPct) / 100); }
  return d;
}
/** Enregistre les cartes du mode et les exemplaires d'une run (à faire avant d'afficher ou de jouer la run). */
export function registerRun(run: RunState): void {
  registerTitanCards(CARD_TEXT_FR);
  for (const rc of run.deck) {
    CARDS[variantId(rc)] = variantDef(rc, run.upg ?? {});
    CARD_TEXT_FR[variantId(rc)] = CARD_TEXT_FR[rc.id] ?? { name: rc.id, desc: '' };
  }
}
export const isTouched = (rc: RunCard) => Object.values(rc.curse ?? {}).some(v => (v ?? 0) !== 0);
export const isImproved = (rc: RunCard) => Object.values(rc.mods).some(v => (v ?? 0) !== 0);
export const deckIds = (run: RunState) => run.deck.map(variantId);

// ---------- Création ----------
/** Deck de départ d'Augustus : le deck Empire de la campagne 5 (22 cartes). */
export const AUGUSTUS_DECK: string[] = COURONNE_SCENARIOS.cc1!.A.deckList!.slice();

export function newRun(seed = String(Date.now()), meta: RunMeta = newMeta()): RunState {
  const run: RunState = {
    version: 1, id: `run-${seed}`, seed, champion: 'augustus', act: 1, node: 0,
    deck: AUGUSTUS_DECK.map((id, i) => ({ uid: i + 1, id, mods: {} })), nextUid: AUGUSTUS_DECK.length + 1,
    lassitude: 0, gold: 20, essence: 0, xp: 0, eventsSeen: [], eventThisAct: false, miniBossOffers: 0, miniBossDone: false,
    options: [], upg: { ...meta.upg }, revives: meta.upg.incorruptible ?? 0, current: null, steps: [], over: null,
  };
  run.options = optionsFor(run);
  registerRun(run);
  return run;
}
export const defeatAt = (run: Pick<RunState, 'act'> & { upg?: Record<string, number> }) =>
  ACT_LASSITUDE[run.act - 1]! + Math.min(run.upg?.lassitude ?? 0, LASSITUDE_UPG_CAP[run.act - 1]!);
/** Régénération (en points de pourcentage retirés de la part gardée). */
export const regenOf = (run: RunState) => 5 * (run.upg?.regeneration ?? 0);

// ---------- Options du nœud suivant ----------
const REWARDS: RewardKind[] = ['or', 'or', 'essence', 'xp', 'offrandes', 'amelioration'];
const EVENTS: EventId[] = ['camp', 'entrainement'];

/** Options proposées pour le nœud suivant (déterministes pour une run donnée). */
export function optionsFor(run: RunState): NodeOption[] {
  const n = run.node + 1;
  const r = rng(`${run.seed}|${run.act}|${n}|options`);
  const combat = (): NodeOption => ({ kind: 'combat', reward: pickOne(r, REWARDS), deck: pickOne(r, ACT1_DECKS) });
  if (n > NODES_PER_ACT) return [{ kind: 'boss', deck: pickOne(r, BOSS_DECKS) }];
  const out: NodeOption[] = [];
  // Mini-boss : proposé à partir du 4e nœud tant qu'il n'est pas fait ; la 3e fois, il est la seule option.
  if (!run.miniBossDone && n >= 4) {
    if (run.miniBossOffers >= 2) return [{ kind: 'miniboss', deck: pickOne(r, MINIBOSS_DECKS) }];
    out.push({ kind: 'miniboss', deck: pickOne(r, MINIBOSS_DECKS) });
  }
  if (n === 7) { // le marchand, toujours ; parfois un autre choix
    out.unshift({ kind: 'marche' });
    if (out.length < 2 && r() < 0.6) out.push(combat());
    return out;
  }
  const size = Math.max(out.length, r() < 0.2 ? 1 : r() < 0.5 ? 2 : 3);
  const events = EVENTS.filter(e => !run.eventsSeen.includes(e));
  while (out.length < size) {
    const x = r();
    if (x < 0.25 && !run.eventThisAct && events.length && !out.some(o => o.kind === 'event')) out.push({ kind: 'event', id: pickOne(r, events) });
    else if (x < 0.35 && n >= 2 && !out.some(o => o.kind === 'marche')) out.push({ kind: 'marche' });
    else out.push(combat());
  }
  return out;
}

/** Le joueur choisit l'option `i` : un combat se joue (current), sinon ses étapes s'ouvrent. */
export function chooseOption(run: RunState, meta: RunMeta, i: number): RunState {
  const next = structuredClone(run);
  const o = next.options[i]!;
  if (next.options.some(x => x.kind === 'miniboss')) next.miniBossOffers++;
  next.current = o;
  if (o.kind === 'event') { next.eventsSeen.push(o.id); next.eventThisAct = true; next.steps = [{ kind: 'evenement', id: o.id }]; }
  if (o.kind === 'marche') next.steps = [{ kind: 'marche', bought: [] }];
  void meta;
  return next;
}

// ---------- Combats ----------
const NO_EASE = { ...CAMPAIGN_EASE, startResource: 0, lassitudeMul: 1, vitalEnd: 1, vitalMor: 0, vitalArm: 0, extraCards: 0 };
const TITAN_OF: Partial<Record<Faction, string>> = { demons: 'titan_demon_ronge', elfe: 'titan_archere' };

/** Deck adverse : celui du scénario, avec des cartes touchées par les Titans à la place de deux cartes. */
function enemyDeck(run: RunState, scId: string): { faction: Faction; deck: string[]; label: string } {
  const sc = SCENARIOS[scId]!;
  const r = rng(`${run.seed}|${run.act}|${run.node}|deck`);
  const deck = sc.B.deckList!.slice();
  const add = [TITAN_OF[sc.B.faction], 'titan_echo'].filter(Boolean) as string[];
  for (const t of add) deck.splice(Math.floor(r() * deck.length), 1, t);
  return { faction: sc.B.faction, deck, label: sc.B.label };
}

/** Le combat d'un nœud, sous la forme d'un scénario (règles affichées dans la bulle) et de la partie du moteur. */
export function fight(run: RunState, o: NodeOption, seed: string | number): { sc: CampaignScenario; setup: GameSetup } {
  registerRun(run);
  const kind = o.kind as 'combat' | 'miniboss' | 'boss';
  const e = enemyDeck(run, (o as { deck: string }).deck);
  const lim = defeatAt(run), enemyLim = ACT_LASSITUDE[run.act - 1]!; // l'amélioration Lassitude ne vaut que pour le joueur
  const base: CampaignScenario = {
    id: `rl-${kind}`, title: '', deckRules: { min: 0, text: '' }, intro: [], events: [],
    A: { faction: 'empire', label: 'Armée d’Augustus', ai: false },
    B: { faction: e.faction, label: e.label, deckList: e.deck, ai: true },
    defeatLassitude: { A: lim, B: enemyLim },
  };
  let sc: CampaignScenario;
  if (kind === 'combat') {
    sc = { ...base, title: `Acte ${run.act} — Combat`, deckRules: { min: 0, text: `Bats l’adversaire avant d’atteindre ${lim} de lassitude. Tu commences à ${run.lassitude}.` },
      intro: [{ who: '', text: `Une armée trompée par les Titans te barre la route : ${e.label}.` }] };
  } else if (kind === 'miniboss') {
    sc = { ...base, title: `Acte ${run.act} — Mini-boss : l’Essence de la réalité`,
      deckRules: { min: 0, text: 'Ton Essence de la réalité (arrière) use définitivement tes régiments chaque fois qu’elle est attaquée. L’adversaire commence.' },
      intro: [{ who: '', text: 'Un Titan est proche : vous sentez l’essence même de la réalité en train d’être modifiée.' }],
      A: { ...base.A, start: { arriere: { '1': 'essence_realite' } } },
      B: { ...base.B, start: { avant: { '1': 'mercenaire_stagiaire', '2': 'mercenaire_stagiaire' } } } };
  } else {
    sc = { ...base, title: `Acte ${run.act} — Boss : le Titan du Glissement`, layout: { avant: 6, arriere: 5 },
      deckRules: { min: 0, text: 'Détruis le Titan du Glissement. Au début de chacun de ses tours, tes régiments glissent d’une case vers la droite ; ceux qui sortent sont détruits. « Lutter contre le mouvement » t’en protège pour un tour.' },
      intro: [{ who: '', text: 'Vous sentez le sol se transformer sous vos pas. Il prend vie et vous entraîne vers un précipice !' }],
      B: { ...base.B, start: { arriere: { '0': 'titan_glissement' } } },
      mustSurvive: { B: 'titan_glissement' }, emptyDeckDefeat: { B: false }, defeatLassitude: { A: lim, B: NEVER } };
  }
  const setup = scenarioGameSetup(sc, deckIds(run), seed, 0, NO_EASE);
  const mob = run.upg?.mobilisation_initiale ?? 0;
  setup.scenario = { ...setup.scenario!, startLassitude: { A: run.lassitude }, ...(mob ? { startResource: { A: mob } } : {}),
    ...(kind === 'boss' ? { glissement: { victim: 'A' as const, tactic: 'lutter_mouvement' } } : {}) };
  // Qui commence : au hasard (reproductible), sauf règle du scénario : l'adversaire au mini-boss, le joueur contre le boss.
  setup.first = kind === 'miniboss' ? 'B' : kind === 'boss' ? 'A' : (rng(`${run.seed}|${run.act}|${run.node}|first|${seed}`)() < 0.5 ? 'A' : 'B');
  return { sc, setup };
}

/** Lassitude gardée après un combat : le maximum entre 50 % de la lassitude de fin et celle du départ. */
export const keptLassitude = (start: number, end: number, regenPct = 0) => Math.max(start, Math.round(end * (KEEP_SHARE - regenPct / 100)));

/** Après la partie du nœud en cours : malus définitifs, lassitude gardée, récompenses (ou fin de la run). */
export function afterFight(run: RunState, g: GameState): RunState {
  const next = structuredClone(run);
  const o = next.current!;
  // Malus définitifs infligés pendant la partie aux exemplaires du joueur.
  for (const [cid, mod] of Object.entries(g.runMods ?? {})) {
    const rc = next.deck.find(c => variantId(c) === cid);
    if (!rc) continue;
    rc.curse ??= {};
    for (const [k, v] of Object.entries(mod) as [keyof RunMod, number][]) rc.curse[k] = (rc.curse[k] ?? 0) + v;
  }
  const end = g.players.A.points;
  if (g.over?.winner !== 'A' && next.revives > 0) {
    // Incorruptible : on relance le combat avec la moitié de la lassitude maximale de l'acte (moins avec Parangon).
    next.revives--;
    next.lassitude = Math.round(defeatAt(next) * Math.max(0, 0.5 - 0.05 * (next.upg.parangon ?? 0)));
    next.steps = [{ kind: 'resume', title: 'Incorruptible', lines: [`L’armée d’Augustus refuse la défaite : le combat recommence, à ${next.lassitude} de lassitude. Relances restantes : ${next.revives}.`] }];
    next.relaunch = true;
    return next;
  }
  if (g.over?.winner !== 'A') {
    next.over = { won: false, text: `L’armée d’Augustus est tombée au nœud ${next.node + 1} de l’acte ${next.act}.` };
    next.steps = [];
    return next;
  }
  const regen = regenOf(next);
  const kept = keptLassitude(next.lassitude, end, regen);
  const lines = [`Lassitude : ${end} en fin de combat, tu en gardes ${kept} (maximum entre ${regen ? `${50 - regen} %` : 'la moitié'} et ton départ à ${next.lassitude}).`];
  next.lassitude = kept;
  const steps: Step[] = [];
  if (o.kind === 'boss') {
    next.xp += 10; next.essence += 5;
    next.over = { won: true, text: 'Le Titan du Glissement s’effondre. L’acte 1 est gagné : c’est la fin du prototype.' };
    lines.push('+10 Expérience, +5 Essence divine.');
    next.steps = [{ kind: 'resume', title: 'Le Titan est vaincu !', lines }];
    return next;
  }
  if (o.kind === 'combat') {
    let gold = 10;
    if (o.reward === 'or') gold += 15;
    if (o.reward === 'essence') { next.essence += 3; lines.push('+3 Essence divine.'); }
    next.xp += o.reward === 'xp' ? 3 : 1; lines.push(o.reward === 'xp' ? '+3 Expérience.' : '+1 Expérience.');
    if (o.reward === 'offrandes') lines.push('+1 Offrande.');
    next.gold += gold; lines.unshift(`+${gold} or.`);
    steps.push({ kind: 'volontaires', round: 0 }, { kind: 'volontaires', round: 1 });
    if (o.reward === 'amelioration') steps.push({ kind: 'cartes', purpose: 'ameliorer', n: 1, optional: true });
  } else if (o.kind === 'miniboss') {
    next.miniBossDone = true;
    next.gold += 25; next.essence += 5; next.xp += 3;
    lines.unshift('+25 or, +5 Essence divine, +3 Expérience.');
    steps.push({ kind: 'volontaires', round: 0 }, { kind: 'volontaires', round: 1 }, { kind: 'promotion' }, { kind: 'cartes', purpose: 'ameliorer', n: 1, optional: true });
  }
  next.steps = [{ kind: 'resume', title: 'Victoire !', lines }, ...steps];
  return next;
}
/** Offrandes gagnées par ce nœud (versées à la méta par l'écran). */
export const offrandesWon = (o: NodeOption | null) => (o?.kind === 'combat' && o.reward === 'offrandes' ? 1 : 0);

// ---------- Étapes ----------
const inEmpire = (id: string) => ['empire', 'neutre'].includes(CARDS[id]!.faction) || ((CARDS[id]!.factions as string[] | undefined) ?? []).includes('empire');
/** Volontaires : 3 cartes Empire ou neutres, niveau 3 au plus à l'acte 1. */
export function volunteers(run: RunState, round: number): string[] {
  const r = rng(`${run.seed}|${run.act}|${run.node}|vol|${round}`);
  const pool = COLLECTIBLE.filter(id => inEmpire(id) && CARDS[id]!.niveau <= run.act + 2);
  const out: string[] = [];
  while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]!);
  return out;
}
/** Promotion : une carte du deck contre une de niveau +1 ou +2, du même type. */
export function promotions(run: RunState): { uid: number; to: string }[] {
  const r = rng(`${run.seed}|${run.act}|${run.node}|promo`);
  const from = run.deck.filter(c => CARDS[c.id]!.niveau <= 4);
  const out: { uid: number; to: string }[] = [];
  for (let k = 0; k < 20 && out.length < 3 && from.length; k++) {
    const c = from.splice(Math.floor(r() * from.length), 1)[0]!;
    const b = CARDS[c.id]!;
    const targets = COLLECTIBLE.filter(id => inEmpire(id) && CARDS[id]!.cardType === b.cardType && CARDS[id]!.niveau > b.niveau && CARDS[id]!.niveau <= b.niveau + 2);
    if (targets.length) out.push({ uid: c.uid, to: pickOne(r, targets) });
  }
  return out;
}
export function addCard(run: RunState, id: string): void { run.deck.push({ uid: run.nextUid++, id, mods: {} }); }
export function removeCard(run: RunState, uid: number): void { run.deck = run.deck.filter(c => c.uid !== uid); }

/** Amélioration : retire d'abord les malus des Titans ; sinon renforce l'exemplaire. */
export function canImprove(rc: RunCard): boolean {
  const b = CARDS[rc.id]!;
  return isTouched(rc) || b.cardType !== 'Tactique' || b.cout + (rc.mods.cout ?? 0) > 0;
}
export function improve(rc: RunCard): string {
  if (isTouched(rc)) {
    delete rc.curse;
    return 'les malus des Titans sont effacés';
  }
  const b = CARDS[rc.id]!;
  if (b.cardType === 'Regiment') {
    for (const k of ['atk', 'end', 'arm', 'mor'] as const) { const v = (b[k] as number | undefined) ?? 0; if (v > 0) rc.mods[k] = (rc.mods[k] ?? 0) + Math.max(1, Math.round(v * 0.1)); }
    return '+10 % ATK, END, ARM et Moral';
  }
  if (b.cardType === 'Leader') { rc.mods.bonusPct = (rc.mods.bonusPct ?? 0) + 20; return '+20 % à ses bonus'; }
  rc.mods.cout = (rc.mods.cout ?? 0) - 1;
  return 'coûte 1 de moins';
}

/** Applique un choix de cartes (`uids`) pour l'usage demandé. Retourne le texte du résultat. */
export function applyCards(run: RunState, purpose: CardPurpose, uids: number[]): string[] {
  const out: string[] = [];
  for (const uid of uids) {
    const rc = run.deck.find(c => c.uid === uid);
    if (!rc) continue;
    const name = CARD_TEXT_FR[rc.id]?.name ?? rc.id;
    if (purpose === 'retirer' || purpose === 'garde') { removeCard(run, uid); out.push(`${name} quitte ton deck.`); }
    if (purpose === 'ameliorer') out.push(`${name} : ${improve(rc)}.`);
    if (purpose === 'humain') { rc.mods.arm = (rc.mods.arm ?? 0) + 5; rc.mods.mor = (rc.mods.mor ?? 0) + 2; out.push(`${name} : +5 ARM, +2 Moral.`); }
    if (purpose === 'elfe') { rc.mods.ini = (rc.mods.ini ?? 0) + 10; rc.mods.cout = (rc.mods.cout ?? 0) - 1; out.push(`${name} : coûte 1 de moins, +10 INI.`); }
  }
  return out;
}
/** Cartes du deck utilisables pour un usage. */
export function eligible(run: RunState, purpose: CardPurpose): RunCard[] {
  return run.deck.filter(c => {
    const b = CARDS[c.id]!;
    if (purpose === 'garde' || purpose === 'humain') return b.cardType === 'Regiment';
    if (purpose === 'elfe') return b.cardType === 'Regiment';
    if (purpose === 'ameliorer') return canImprove(c);
    return true;
  });
}

// ---------- Marché ----------
/** 5 offres tirées parmi : une carte, retirer une carte, baisser la lassitude, améliorer une carte (répétitions possibles). */
export function marketOffers(run: RunState): MarketOffer[] {
  const r = rng(`${run.seed}|${run.act}|${run.node}|marche`);
  const vol = volunteers({ ...run, node: run.node + 100 }, 0).concat(volunteers({ ...run, node: run.node + 100 }, 1));
  const out: MarketOffer[] = [];
  for (let i = 0; i < 5; i++) {
    const k = pickOne(r, ['carte', 'carte', 'retirer', 'lassitude', 'ameliorer'] as const);
    if (k === 'carte') { const id = vol[i % vol.length]!; out.push({ kind: 'carte', cardId: id, price: CARDS[id]!.niveau >= 3 ? PRICES.carteHaute : PRICES.carte }); }
    else out.push({ kind: k, price: PRICES[k] });
  }
  return out;
}

// ---------- Événements ----------
export interface EventChoice { id: string; label: string; disabled?: string }
export const EVENT_TEXT: Record<EventId, { title: string; text: string }> = {
  camp: { title: 'Le camp abandonné', text: 'Une armée a monté un camp ici, mais aucune trace de ce qui a pu lui arriver.' },
  entrainement: { title: 'L’entraînement', text: 'Un régiment coalisé d’Elfes et d’Humains s’entraîne ; les meneurs de chaque peuple proposent de vous aider.' },
};
export function eventChoices(run: RunState, meta: RunMeta, id: EventId, second = false): EventChoice[] {
  const off = meta.offeredAt[id] ?? 0;
  const noOffer = meta.offrandes < 1 ? 'Il te faut une Offrande' : undefined;
  if (id === 'camp') return [
    { id: 'repos', label: `Profiter du camp pour se reposer : lassitude −${5 + 5 * off}` },
    { id: 'offrande', label: `Faire une Offrande (−1 Offrande) : débloque la Régénération${meta.unlocks.includes('regeneration') ? ' (déjà débloquée)' : ''}`, disabled: noOffer },
    { id: 'garde', label: 'Laisser des régiments surveiller le camp : retire jusqu’à 2 régiments de ton deck' },
  ];
  const n = 1 + Math.floor(off / 3);
  const out: EventChoice[] = [
    { id: 'humain', label: `Humain : ${n} régiment(s) gagne(nt) +5 ARM et +2 Moral` },
    { id: 'elfe', label: `Elfe : ${n} régiment(s) coûte(nt) 1 de moins et gagne(nt) +10 INI` },
  ];
  if (!second) {
    out.push({ id: 'offrande', label: 'Faire une Offrande et faire un 2e choix', disabled: off >= 6 ? 'Déjà 6 Offrandes faites ici' : noOffer });
    if (off >= 6 && !meta.unlocks.includes('champion:elfe')) out.push({ id: 'champion', label: 'Débloquer le champion Elfe' });
  }
  void run;
  return out;
}
/** Applique un choix d'événement ; ajoute les étapes qui en découlent. Retourne les lignes du résumé. */
export function resolveEvent(run: RunState, meta: RunMeta, id: EventId, choice: string): string[] {
  const off = meta.offeredAt[id] ?? 0;
  if (id === 'camp') {
    if (choice === 'repos') { const d = Math.min(run.lassitude, 5 + 5 * off); run.lassitude -= d; return [`Tu te reposes : lassitude −${d}.`]; }
    if (choice === 'offrande') { meta.offrandes--; meta.offeredAt.camp = off + 1; if (!meta.unlocks.includes('regeneration')) meta.unlocks.push('regeneration'); return ['Ton Offrande est acceptée : la Régénération est débloquée.']; }
    run.steps.unshift({ kind: 'cartes', purpose: 'garde', n: 2, optional: true });
    return [];
  }
  const n = 1 + Math.floor(off / 3);
  if (choice === 'humain' || choice === 'elfe') { run.steps.unshift({ kind: 'cartes', purpose: choice, n, optional: false }); return []; }
  if (choice === 'offrande') { meta.offrandes--; meta.offeredAt.entrainement = off + 1; run.steps.unshift({ kind: 'evenement', id, second: true }); return ['Ton Offrande est acceptée : tu peux faire un 2e choix.']; }
  if (choice === 'champion') { meta.unlocks.push('champion:elfe'); return ['Le champion Elfe est débloqué.']; }
  return [];
}

// ---------- Avancer ----------
/** Toutes les étapes du nœud sont faites : nœud suivant. */
export function nextNode(run: RunState): RunState {
  const next = structuredClone(run);
  next.node++;
  next.current = null;
  next.steps = [];
  next.options = optionsFor(next);
  return next;
}

// ---------- Méta et sauvegarde ----------
export const newMeta = (): RunMeta => ({ essence: 0, xp: 0, offrandes: 0, offeredAt: {}, unlocks: [], upg: {}, runs: 0, wins: 0 });
const RUN_KEY = 'ligneDeFront.jeu.roguelite.run.v1';
const META_KEY = 'ligneDeFront.jeu.roguelite.meta.v1';
export function loadRun(): RunState | null {
  try { const raw = localStorage.getItem(keyFor(RUN_KEY)); const r = raw ? (JSON.parse(raw) as RunState) : null; if (r?.version === 1) { registerRun(r); return r; } } catch { /* rien */ }
  return null;
}
export function saveRun(run: RunState | null): void {
  try { if (run) localStorage.setItem(keyFor(RUN_KEY), JSON.stringify(run)); else localStorage.removeItem(keyFor(RUN_KEY)); } catch { /* stockage indisponible */ }
}
export function loadMeta(): RunMeta {
  try { const raw = localStorage.getItem(keyFor(META_KEY)); if (raw) return { ...newMeta(), ...(JSON.parse(raw) as RunMeta) }; } catch { /* rien */ }
  return newMeta();
}
export function saveMeta(m: RunMeta): void { try { localStorage.setItem(keyFor(META_KEY), JSON.stringify(m)); } catch { /* rien */ } }
/** Fin de run : l'Essence divine et l'Expérience gagnées rejoignent la méta. */
export function closeRun(meta: RunMeta, run: RunState): RunMeta {
  return { ...meta, essence: meta.essence + run.essence, xp: meta.xp + run.xp, runs: meta.runs + 1, wins: meta.wins + (run.over?.won ? 1 : 0) };
}

// ---------- Améliorations entre les runs ----------
export interface Upgrade {
  id: string;
  currency: 'essence' | 'xp';
  name: string;
  desc: string;
  max: number;
  /** Prix du niveau suivant (lvl = niveau déjà acheté). */
  cost: (lvl: number) => number;
  /** Déblocage nécessaire (méta), et comment l'obtenir. */
  unlock?: { key: string; text: string };
}
/** Essence divine : améliorations des matchs ; Expérience : améliorations d'Augustus (document, 03/11/2026). */
export const UPGRADES: Upgrade[] = [
  { id: 'lassitude', currency: 'essence', name: 'Lassitude', desc: 'Seuil de défaite +1 par niveau (au plus 20 à l’acte 1, 30 à l’acte 2, 60 à l’acte 3).', max: 10, cost: l => 3 + l },
  { id: 'regeneration', currency: 'essence', name: 'Régénération', desc: 'Après un combat, tu gardes 5 % de lassitude de moins par niveau (jamais sous ton départ).', max: 5, cost: l => 4 + 2 * l,
    unlock: { key: 'regeneration', text: 'Fais une Offrande au camp abandonné' } },
  { id: 'mobilisation_initiale', currency: 'essence', name: 'Mobilisation initiale', desc: '+1 ressource au début de chaque combat par niveau.', max: 3, cost: l => [6, 12, 20][l]!,
    unlock: { key: 'mobilisation_initiale', text: 'Se débloque à un événement de l’acte 3 (pas encore dans le prototype)' } },
  { id: 'incorruptible', currency: 'essence', name: 'Incorruptible', desc: 'Après une défaite, le combat recommence avec 50 % de la lassitude maximale de l’acte. Une relance par niveau et par run.', max: 3, cost: l => [12, 18, 25][l]! },
  { id: 'parangon', currency: 'essence', name: 'Parangon', desc: 'Une relance d’Incorruptible part avec 5 % de lassitude de moins par niveau.', max: 5, cost: l => 3 + l },
  { id: 'armee_elue', currency: 'xp', name: 'Armée élue', desc: 'Les régiments du deck de départ gagnent +10 % à leurs 5 stats par niveau.', max: 5, cost: l => 5 + 3 * l },
  { id: 'genie', currency: 'xp', name: 'Génie du champ de bataille', desc: 'Niveau 1 : les Tactiques à 2+ coûtent 1 de moins. Niveau 2 : celles à 1 aussi. Niveau 3 : celles à 3+ encore 1 de moins.', max: 3, cost: l => [6, 10, 14][l]! },
  { id: 'generalissime', currency: 'xp', name: 'Généralissime', desc: 'Les bonus de tes Leaders augmentent de 20 % par niveau.', max: 5, cost: l => 5 + 3 * l },
  { id: 'imperator', currency: 'xp', name: 'Imperator', desc: 'Tes Leaders coûtent 1 de moins.', max: 1, cost: () => 10 },
  { id: 'magister_equitum', currency: 'xp', name: 'Magister Equitum', desc: 'Tes régiments Montés gagnent +20 % d’ATK par niveau.', max: 5, cost: l => 4 + 2 * l },
  { id: 'praefectus', currency: 'xp', name: 'Praefectus Praetorio', desc: 'Tes régiments de niveau 4 et 5 coûtent 1 de moins.', max: 1, cost: () => 10 },
];
export const upgradeLevel = (meta: RunMeta, id: string) => meta.upg?.[id] ?? 0;
/** Pourquoi une amélioration ne s'achète pas (null = achetable). */
export function cannotBuy(meta: RunMeta, u: Upgrade): string | null {
  const lvl = upgradeLevel(meta, u.id);
  if (lvl >= u.max) return 'Niveau maximum';
  if (u.unlock && !meta.unlocks.includes(u.unlock.key)) return u.unlock.text;
  if (meta[u.currency] < u.cost(lvl)) return u.currency === 'essence' ? 'Pas assez d’Essence divine' : 'Pas assez d’Expérience';
  return null;
}
export function buyUpgrade(meta: RunMeta, id: string): RunMeta {
  const u = UPGRADES.find(x => x.id === id)!;
  if (cannotBuy(meta, u)) return meta;
  const lvl = upgradeLevel(meta, id);
  return { ...meta, [u.currency]: meta[u.currency] - u.cost(lvl), upg: { ...meta.upg, [id]: lvl + 1 } };
}
