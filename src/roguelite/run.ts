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
import { ELF_SCENARIOS } from '../campaign/elfes';
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

export const PRICES = { carte: 30, carteHaute: 45, retirer: 25, lassitude: 20, ameliorer: 35, etendard: 60 } as const;

// ---------- Étendards (reliques de la run) ----------
export interface Etendard { id: string; name: string; desc: string; risky?: boolean; champion?: ChampionId }
/** Premiers Étendards (document, 04/11/2026) : les neutres et celui de l'Empire ; ceux des autres champions viendront avec eux. */
export const ETENDARDS: Etendard[] = [
  { id: 'tambour', name: 'Tambour de guerre', desc: '+1 ressource au premier tour de chaque combat.' },
  { id: 'dechire', name: 'Étendard déchiré', desc: 'Tes régiments ont +1 Moral.' },
  { id: 'etat_major', name: 'Carte d’état-major', desc: 'Main de départ : 1 carte de plus.' },
  { id: 'sceau', name: 'Sceau impérial', desc: 'Empire. Le premier Leader que tu joues à chaque tour coûte 1 de moins.', champion: 'augustus' },
  { id: 'fleche', name: 'Flèche de chasse', desc: 'Elfes. Au début de chacun de tes tours, s’il n’y a pas de Proie, le régiment adverse au Moral le plus bas devient la Proie.', champion: 'eldrin' },
  { id: 'chasseur', name: 'Bannière du chasseur insatiable', desc: 'Elfes. Quand une Proie est détruite, un régiment adverse au hasard perd 10 END.', champion: 'eldrin' },
  { id: 'lame', name: 'Lame maudite', desc: '+5 ATK à tous tes régiments, mais +1 lassitude à chaque fin de ton tour.', risky: true },
];
export const etendardOf = (id: string) => ETENDARDS.find(e => e.id === id)!;
export const LASSITUDE_SHOP = 5;

// ---------- Champions ----------
export type ChampionId = 'augustus' | 'eldrin';
export interface Champion { id: ChampionId; name: string; faction: Faction; crest: string; deck: () => string[]; unlock?: string }
export const CHAMPIONS: Champion[] = [
  { id: 'augustus', name: 'Augustus, le Dernier Empereur', faction: 'empire', crest: 'A', deck: () => COURONNE_SCENARIOS.cc1!.A.deckList!.slice() },
  // Débloqué par 3 Offrandes à l'entraînement ; deck de départ de la campagne Elfe (04/11/2026).
  { id: 'eldrin', name: 'Eldrin, le premier Bourgeon', faction: 'elfe', crest: 'E', deck: () => ELF_SCENARIOS.e1!.A.deckList!.slice(), unlock: 'champion:elfe' },
];
export const championOf = (id: ChampionId | undefined) => CHAMPIONS.find(c => c.id === (id ?? 'augustus'))!;
export const shortName = (id: ChampionId | undefined) => championOf(id).name.split(',')[0]!;

// ---------- Types ----------
/** Exemplaire de la run : `mods` = améliorations (camp, entraînement, marché…), `curse` = malus des Titans. */
export interface RunCard { uid: number; id: string; mods: RunMod; curse?: RunMod }
export type RewardKind = 'or' | 'essence' | 'xp' | 'offrandes' | 'amelioration';
export type NodeOption =
  | { kind: 'combat'; reward: RewardKind; deck: string }
  | { kind: 'miniboss'; deck: string; boss?: MiniBossId }
  | { kind: 'event'; id: EventId }
  | { kind: 'marche' }
  | { kind: 'boss'; deck: string };
/** Mini-boss de l'acte 1 : l'Essence de la réalité ou les Fragments de réalité (le même pendant tout l'acte). */
export type MiniBossId = 'essence' | 'fragments' | 'fracture';
export type EventId = 'camp' | 'entrainement';
export type CardPurpose = 'retirer' | 'ameliorer' | 'humain' | 'elfe' | 'garde';
/** Étapes à résoudre avant de choisir le nœud suivant. */
export type Step =
  | { kind: 'resume'; title: string; lines: string[] }
  | { kind: 'volontaires'; round: number }
  | { kind: 'promotion' }
  | { kind: 'cartes'; purpose: CardPurpose; n: number; optional: boolean }
  | { kind: 'evenement'; id: EventId; second?: boolean }
  | { kind: 'marche'; bought: number[] }
  | { kind: 'etendard'; choices: string[] };
export interface MarketOffer { kind: 'carte' | 'retirer' | 'lassitude' | 'ameliorer' | 'etendard'; cardId?: string; etendard?: string; price: number }
export interface RunState {
  version: 1;
  id: string;
  seed: string;
  champion: ChampionId;
  /** Nombre de cartes du deck de départ (Armée élue : uid ≤ baseCount). */
  baseCount?: number;
  /** Le champion joué est le champion désigné : +1 Expérience à chaque combat gagné. */
  designated?: boolean;
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
  /** Étendards gagnés pendant la run. */
  etendards: string[];
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
  /** Champion désigné : seul lui gagne l'Expérience de base de chaque combat. */
  designated?: ChampionId;
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
    if (lvl('etd:dechire')) add('mor', 1);
    if (lvl('etd:lame')) add('atk', 5);
    if (rc.uid <= (upg._base ?? AUGUSTUS_DECK.length) && lvl('armee_elue')) for (const k of STATS) { const v = (b[k] as number | undefined) ?? 0; add(k, Math.round(v * 0.1 * lvl('armee_elue'))); }
    if (b.types?.includes('Élémentaux') && lvl('protecteur_foret')) { const p = 0.1 * lvl('protecteur_foret'); add('end', Math.round(((b.end as number) ?? 0) * p)); add('mor', Math.round(((b.mor as number) ?? 0) * p)); }
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
  if (rc.curse?.frag) (d as unknown as Record<string, number>).fragHits = rc.curse.frag;
  if (m.bonusPct) for (const k of BONUSES) { const v = b[k] as number | undefined; if (v) (d as unknown as Record<string, number>)[k] = floored(v, (v * m.bonusPct) / 100); }
  return d;
}
/** Enregistre les cartes du mode et les exemplaires d'une run (à faire avant d'afficher ou de jouer la run). */
export function registerRun(run: RunState): void {
  registerTitanCards(CARD_TEXT_FR);
  for (const rc of run.deck) {
    CARDS[variantId(rc)] = variantDef(rc, { ...(run.upg ?? {}), _base: run.baseCount ?? AUGUSTUS_DECK.length, ...Object.fromEntries((run.etendards ?? []).map(e => [`etd:${e}`, 1])) });
    CARD_TEXT_FR[variantId(rc)] = CARD_TEXT_FR[rc.id] ?? { name: rc.id, desc: '' };
  }
}
export const isTouched = (rc: RunCard) => Object.values(rc.curse ?? {}).some(v => (v ?? 0) !== 0);
export const isImproved = (rc: RunCard) => Object.values(rc.mods).some(v => (v ?? 0) !== 0);
export const deckIds = (run: RunState) => run.deck.map(variantId);

// ---------- Création ----------
/** Deck de départ d'Augustus : le deck Empire de la campagne 5 (22 cartes). */
export const AUGUSTUS_DECK: string[] = COURONNE_SCENARIOS.cc1!.A.deckList!.slice();

export function newRun(seed = String(Date.now()), meta: RunMeta = newMeta(), champion: ChampionId = 'augustus'): RunState {
  const deck = championOf(champion).deck();
  const run: RunState = {
    version: 1, id: `run-${seed}`, seed, champion, baseCount: deck.length, designated: (meta.designated ?? 'augustus') === champion, act: 1, node: 0,
    deck: deck.map((id, i) => ({ uid: i + 1, id, mods: {} })), nextUid: deck.length + 1,
    lassitude: 0, gold: 20, essence: 0, xp: 0, eventsSeen: [], eventThisAct: false, miniBossOffers: 0, miniBossDone: false,
    options: [], upg: runUpgrades(meta, champion), etendards: [], revives: meta.upg.incorruptible ?? 0, current: null, steps: [], over: null,
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

/** Le mini-boss de l'acte : tiré une fois pour l'acte (même mini-boss, même deck à chaque proposition). */
export function miniBossFor(run: RunState): NodeOption {
  const r = rng(`${run.seed}|${run.act}|miniboss`);
  const boss = pickOne(r, ['essence', 'fragments', 'fracture'] as const);
  return { kind: 'miniboss', boss, deck: pickOne(r, MINIBOSS_DECKS) };
}
/** Options proposées pour le nœud suivant (déterministes pour une run donnée). */
export function optionsFor(run: RunState): NodeOption[] {
  const n = run.node + 1;
  const r = rng(`${run.seed}|${run.act}|${n}|options`);
  const combat = (): NodeOption => ({ kind: 'combat', reward: pickOne(r, REWARDS), deck: pickOne(r, ACT1_DECKS) });
  if (n > NODES_PER_ACT) return [{ kind: 'boss', deck: pickOne(r, BOSS_DECKS) }];
  const out: NodeOption[] = [];
  // Mini-boss : proposé à partir du 4e nœud tant qu'il n'est pas fait ; la 3e fois, il est la seule option.
  if (!run.miniBossDone && n >= 4) {
    if (run.miniBossOffers >= 2) return [miniBossFor(run)];
    out.push(miniBossFor(run));
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
    A: { faction: championOf(run.champion).faction, label: `Armée d’${shortName(run.champion)}`, ai: false },
    B: { faction: e.faction, label: e.label, deckList: e.deck, ai: true },
    defeatLassitude: { A: lim, B: enemyLim },
  };
  let sc: CampaignScenario;
  if (kind === 'combat') {
    sc = { ...base, title: `Acte ${run.act} — Combat`, deckRules: { min: 0, text: `Bats l’adversaire avant d’atteindre ${lim} de lassitude. Tu commences à ${run.lassitude}.` },
      intro: [{ who: '', text: `Une armée trompée par les Titans te barre la route : ${e.label}.` }] };
  } else if (kind === 'miniboss' && (o as { boss?: MiniBossId }).boss === 'fragments') {
    sc = { ...base, title: `Acte ${run.act} — Mini-boss : les Fragments de réalité`,
      deckRules: { min: 0, text: 'Au début de chaque tour adverse, s’il a moins de 2 Fragments de réalité, un nouveau apparaît au hasard. Le régiment qui détruit un Fragment perd définitivement 1 ATK, 1 ARM et 1 INI (et 1 Moral à la 3e fois). Les victoires habituelles restent possibles.' },
      intro: [{ who: '', text: 'La réalité se fissure autour de vous : des éclats de monde flottent sur le champ de bataille, et chacun que l’on brise laisse une trace.' }] };
  } else if (kind === 'miniboss' && (o as { boss?: MiniBossId }).boss === 'fracture') {
    sc = { ...base, title: `Acte ${run.act} — Mini-boss : la Fracture de la réalité`, fracture: true,
      deckRules: { min: 0, text: 'Un de tes tours sur deux est fracturé (le premier, le troisième…) : chaque régiment que tu y déploies perd définitivement 10 % de ses stats, mais l’adversaire gagne 1 lassitude. Les autres tours sont stables.' },
      intro: [{ who: '', text: 'La réalité se déchire puis se recoud, au rythme d’un souffle immense. Chaque fois qu’elle se fend, ce qui passe à travers en sort diminué.' }] };
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
  const has = (e: string) => (run.etendards ?? []).includes(e);
  const mob = (run.upg?.mobilisation_initiale ?? 0) + (has('tambour') ? 1 : 0);
  if (has('lame')) setup.config = { ...setup.config, endTurnLassitude: { A: 1, B: 0 } };
  setup.scenario = { ...setup.scenario!, startLassitude: { A: run.lassitude }, ...(mob ? { startResource: { A: mob } } : {}),
    ...(has('etat_major') ? { startDraw: { A: 1 } } : {}), ...(has('sceau') ? { leaderSeal: { A: true } } : {}),
    ...(has('fleche') ? { huntArrow: { A: true } } : {}), ...(has('chasseur') ? { preyKillEnd: { A: 10 } } : {}),
    ...(run.upg?.inepuisable ? { tacticDrawEvery: { A: run.upg.inepuisable >= 2 ? 2 : 3 } } : {}),
    ...(kind === 'boss' ? { glissement: { victim: 'A' as const, tactic: 'lutter_mouvement' } } : {}),
    ...(kind === 'miniboss' && (o as { boss?: MiniBossId }).boss === 'fragments' ? { fragments: { pid: 'B' as const, cardId: 'fragment_realite', max: 2 } } : {}),
    ...(kind === 'miniboss' && (o as { boss?: MiniBossId }).boss === 'fracture' ? { fracture: { victim: 'A' as const } } : {}) };
  // Qui commence : au hasard (reproductible), sauf règle du scénario : l'adversaire au mini-boss, le joueur contre le boss.
  setup.first = kind === 'miniboss' && ((o as { boss?: MiniBossId }).boss ?? 'essence') === 'essence' ? 'B' : kind === 'boss' ? 'A' : (rng(`${run.seed}|${run.act}|${run.node}|first|${seed}`)() < 0.5 ? 'A' : 'B');
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
    next.steps = [{ kind: 'resume', title: 'Incorruptible', lines: [`L’armée d’${shortName(next.champion)} refuse la défaite : le combat recommence, à ${next.lassitude} de lassitude. Relances restantes : ${next.revives}.`] }];
    next.relaunch = true;
    return next;
  }
  if (g.over?.winner !== 'A') {
    next.over = { won: false, text: `L’armée d’${shortName(next.champion)} est tombée au nœud ${next.node + 1} de l’acte ${next.act}.` };
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
    let gold = 5;
    if (o.reward === 'or') gold += 30; // 04/11 : peu d'or par combat, beaucoup avec l'icône Or
    if (o.reward === 'essence') { next.essence += 3; lines.push('+3 Essence divine.'); }
    // Expérience : +2 avec l'icône ; +1 de base à chaque combat, seulement si l'on joue le champion désigné.
    if (o.reward === 'xp') { next.xp += 2; lines.push('+2 Expérience.'); }
    if (next.designated) { next.xp += 1; lines.push('+1 Expérience car tu joues le champion désigné.'); }
    if (o.reward === 'offrandes') lines.push('+1 Offrande.');
    next.gold += gold; lines.unshift(`+${gold} or.`);
    steps.push({ kind: 'volontaires', round: 0 }, { kind: 'volontaires', round: 1 });
    if (o.reward === 'amelioration') steps.push({ kind: 'cartes', purpose: 'ameliorer', n: 1, optional: true });
  } else if (o.kind === 'miniboss') {
    next.miniBossDone = true;
    next.gold += 25; next.essence += 5; next.xp += 3;
    lines.unshift('+25 or, +5 Essence divine, +3 Expérience.');
    const etd = etendardChoices(next, 3);
    if (etd.length) steps.push({ kind: 'etendard', choices: etd });
    steps.push({ kind: 'volontaires', round: 0 }, { kind: 'volontaires', round: 1 }, { kind: 'promotion' }, { kind: 'cartes', purpose: 'ameliorer', n: 1, optional: true });
  }
  next.steps = [{ kind: 'resume', title: 'Victoire !', lines }, ...steps];
  return next;
}
/** Expérience gagnée par un combat (réserve commune à tous les champions, versée tout de suite, 04/11/2026). */
export const xpWon = (before: RunState, after: RunState) => Math.max(0, after.xp - before.xp);
/** Offrandes gagnées par ce nœud (versées à la méta par l'écran). */
export const offrandesWon = (o: NodeOption | null) => (o?.kind === 'combat' && o.reward === 'offrandes' ? 1 : 0);

// ---------- Étapes ----------
const inFaction = (f: Faction) => (id: string) => ['neutre', f].includes(CARDS[id]!.faction) || ((CARDS[id]!.factions as string[] | undefined) ?? []).includes(f);
/** Volontaires : 3 cartes Empire ou neutres, niveau 3 au plus à l'acte 1. */
export function volunteers(run: RunState, round: number): string[] {
  const r = rng(`${run.seed}|${run.act}|${run.node}|vol|${round}`);
  const ok = inFaction(championOf(run.champion).faction);
  const pool = COLLECTIBLE.filter(id => ok(id) && CARDS[id]!.niveau <= run.act + 2);
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
    const targets = COLLECTIBLE.filter(id => inFaction(championOf(run.champion).faction)(id) && CARDS[id]!.cardType === b.cardType && CARDS[id]!.niveau > b.niveau && CARDS[id]!.niveau <= b.niveau + 2);
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

/** Étendards proposés (pas déjà possédés), tirage reproductible. */
export function etendardChoices(run: RunState, n: number): string[] {
  const r = rng(`${run.seed}|${run.act}|${run.node}|etendard`);
  const left = ETENDARDS.filter(e => !e.champion || e.champion === (run.champion ?? 'augustus')).map(e => e.id).filter(e => !(run.etendards ?? []).includes(e));
  const out: string[] = [];
  while (out.length < n && left.length) out.push(left.splice(Math.floor(r() * left.length), 1)[0]!);
  return out;
}

// ---------- Marché ----------
/** 5 offres tirées parmi : une carte, retirer une carte, baisser la lassitude, améliorer une carte (répétitions possibles). */
export function marketOffers(run: RunState): MarketOffer[] {
  const r = rng(`${run.seed}|${run.act}|${run.node}|marche`);
  const vol = volunteers({ ...run, node: run.node + 100 }, 0).concat(volunteers({ ...run, node: run.node + 100 }, 1));
  const out: MarketOffer[] = [];
  for (let i = 0; i < 5; i++) {
    const k = pickOne(r, ['carte', 'carte', 'retirer', 'lassitude', 'ameliorer'] as const);
    if (i === 4 && !out.some(o => o.kind === 'etendard') && r() < 0.5) { const e = etendardChoices(run, 1)[0]; if (e) { out.push({ kind: 'etendard', etendard: e, price: PRICES.etendard }); continue; } }
    if (k === 'carte') { const id = vol[i % vol.length]!; out.push({ kind: 'carte', cardId: id, price: CARDS[id]!.niveau >= 3 ? PRICES.carteHaute : PRICES.carte }); }
    else out.push({ kind: k, price: PRICES[k] });
  }
  return out;
}

// ---------- Événements ----------
export interface EventChoice { id: string; label: string; disabled?: string }
/** Offrandes à faire à l'entraînement pour débloquer le premier champion (04/11/2026 : 3 au lieu de 6). */
export const CHAMPION_OFFERINGS = 3;
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
    if (off >= CHAMPION_OFFERINGS && !meta.unlocks.includes('champion:elfe')) out.push({ id: 'champion', label: 'Débloquer Eldrin, le premier Bourgeon (champion Elfe)' });
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
  if (choice === 'champion') { meta.unlocks.push('champion:elfe'); return ['Eldrin, le premier Bourgeon, rejoint les champions des Dieux.']; }
  return [];
}

// ---------- Avancer ----------
/** Toutes les étapes du nœud sont faites : nœud suivant. */
export function nextNode(run: RunState): RunState {
  const next = structuredClone(run);
  next.node++;
  // Fontaine d'immortalité (Eldrin) : à chaque nœud, avant tout le reste, −1 lassitude par niveau.
  if (next.upg?.fontaine) next.lassitude = Math.max(0, next.lassitude - next.upg.fontaine);
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
  try {
    const raw = localStorage.getItem(keyFor(META_KEY));
    if (raw) {
      const m = { ...newMeta(), ...(JSON.parse(raw) as RunMeta) };
      // Avant Eldrin (04/11/2026), les améliorations d'Expérience étaient celles d'Augustus, sans préfixe.
      for (const u of UPGRADES) if (u.currency === 'xp' && m.upg[u.id] !== undefined) { m.upg[`augustus:${u.id}`] = m.upg[u.id]!; delete m.upg[u.id]; }
      return m;
    }
  } catch { /* rien */ }
  return newMeta();
}
export function saveMeta(m: RunMeta): void { try { localStorage.setItem(keyFor(META_KEY), JSON.stringify(m)); } catch { /* rien */ } }
/** Fin de run : l'Essence divine gagnée rejoint la méta (l'Expérience y est versée à la fin de chaque combat, voir xpWon). */
export function closeRun(meta: RunMeta, run: RunState): RunMeta {
  return { ...meta, essence: meta.essence + run.essence, runs: meta.runs + 1, wins: meta.wins + (run.over?.won ? 1 : 0), designated: nextDesignated(meta, run) };
}
/** Après chaque run, le champion désigné est tiré au hasard parmi les champions débloqués, en évitant celui qu'on vient
 *  de jouer quand c'est possible : le joueur est poussé à alterner (05/11/2026). */
export function nextDesignated(meta: RunMeta, run: RunState): ChampionId {
  const open = CHAMPIONS.filter(c => !c.unlock || meta.unlocks.includes(c.unlock)).map(c => c.id);
  const pool = open.length > 1 ? open.filter(c => c !== run.champion) : open;
  return pickOne(rng(`${run.seed}|designated`), pool);
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
  /** Améliorations d'Expérience : champions concernés (aucun = tous). */
  champions?: ChampionId[];
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
  { id: 'imperator', champions: ['augustus'], currency: 'xp', name: 'Imperator', desc: 'Tes Leaders coûtent 1 de moins.', max: 1, cost: () => 10 },
  { id: 'magister_equitum', champions: ['augustus'], currency: 'xp', name: 'Magister Equitum', desc: 'Tes régiments Montés gagnent +20 % d’ATK par niveau.', max: 5, cost: l => 4 + 2 * l },
  { id: 'praefectus', champions: ['augustus'], currency: 'xp', name: 'Praefectus Praetorio', desc: 'Tes régiments de niveau 4 et 5 coûtent 1 de moins.', max: 1, cost: () => 10 },
  { id: 'inepuisable', champions: ['eldrin'], currency: 'xp', name: 'Inépuisable', desc: 'Niveau 1 : toutes les 3 Tactiques jouées, pioche une carte. Niveau 2 : toutes les 2.', max: 2, cost: l => [8, 14][l]! },
  { id: 'protecteur_foret', champions: ['eldrin'], currency: 'xp', name: 'Protecteur de la forêt', desc: 'Tes régiments Élémentaux gagnent +10 % d’END et de Moral par niveau.', max: 5, cost: l => 4 + 2 * l },
  { id: 'fontaine', champions: ['eldrin'], currency: 'xp', name: 'Fontaine d’immortalité', desc: 'À chaque nœud, avant tout le reste, −1 lassitude par niveau.', max: 5, cost: l => 6 + 3 * l },
];
/** Clé d'enregistrement : les améliorations d'Expérience sont propres à chaque champion. */
export const upgradeKey = (u: Upgrade, champ: ChampionId) => (u.currency === 'xp' ? `${champ}:${u.id}` : u.id);
export const upgradeLevel = (meta: RunMeta, u: Upgrade | string, champ: ChampionId = 'augustus') => {
  const up = typeof u === 'string' ? UPGRADES.find(x => x.id === u)! : u;
  return meta.upg?.[upgradeKey(up, champ)] ?? 0;
};
export const upgradesFor = (champ: ChampionId) => UPGRADES.filter(u => u.currency === 'essence' || !u.champions || u.champions.includes(champ));
/** Niveaux d'amélioration valables pour une run de ce champion (clés sans préfixe). */
export function runUpgrades(meta: RunMeta, champ: ChampionId): Record<string, number> {
  const out: Record<string, number> = {};
  for (const u of upgradesFor(champ)) { const l = upgradeLevel(meta, u, champ); if (l) out[u.id] = l; }
  return out;
}
/** Pourquoi une amélioration ne s'achète pas (null = achetable). */
export function cannotBuy(meta: RunMeta, u: Upgrade, champ: ChampionId = 'augustus'): string | null {
  const lvl = upgradeLevel(meta, u, champ);
  if (lvl >= u.max) return 'Niveau maximum';
  if (u.unlock && !meta.unlocks.includes(u.unlock.key)) return u.unlock.text;
  if (meta[u.currency] < u.cost(lvl)) return u.currency === 'essence' ? 'Pas assez d’Essence divine' : 'Pas assez d’Expérience';
  return null;
}
export function buyUpgrade(meta: RunMeta, id: string, champ: ChampionId = 'augustus'): RunMeta {
  const u = UPGRADES.find(x => x.id === id)!;
  if (cannotBuy(meta, u, champ)) return meta;
  const lvl = upgradeLevel(meta, u, champ);
  return { ...meta, [u.currency]: meta[u.currency] - u.cost(lvl), upg: { ...meta.upg, [upgradeKey(u, champ)]: lvl + 1 } };
}
