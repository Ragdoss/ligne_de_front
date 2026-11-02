// Campagne : passage d'un scénario à une partie du moteur, pool de cartes, récompenses, sauvegarde.
import { CARDS } from '../data/cards';
import { nextRandom, seedFrom } from '../engine/rng';
import { COLLECTIBLE } from '../profile/profile';
import { keyFor } from '../profile/store';
import { DEFAULT_LEVEL_THRESHOLDS, type GameSetup } from '../engine/game';
import type { Action, DialogLine, Faction, FlagCond, GameState, PlayerId } from '../engine/types';
import { CAMPAIGN_BY_ID, SCENARIOS } from './campaigns';
import { DEFAULT_DIFFICULTY, DIFFICULTIES, MODE_EASE, SCENARIO_EASE, type Difficulty } from './ease';
import type { CampaignDef, CampaignScenario } from './types';

export interface CampaignSave {
  version: 1;
  /** Identifiant unique de cette partie de campagne (pour ne fusionner son pool qu'une fois dans la collection). */
  id: string;
  /** Campagne jouée (empire, demons, elfes, nomades). */
  campaign: string;
  /** Cartes possédées (avec répétitions). */
  pool: string[];
  /** Index du scénario en cours dans l'ordre de la campagne. */
  idx: number;
  /** Dernier deck choisi (carte → nombre), pour le proposer à nouveau. */
  deck: Record<string, number> | null;
  finished: boolean;
  /** Défaites par scénario (identifiant → nombre). */
  attempts: Record<string, number>;
  /** Aide choisie pour le prochain combat : ressources en plus au départ. */
  bonus: number;
  /** Mode de difficulté (modifiable au camp entre deux combats). */
  difficulty?: Difficulty;
  // ----- Campagnes à embranchements -----
  /** Drapeaux posés par les choix de dialogue et les victoires. */
  flags?: string[];
  /** Scénario en cours sur la carte (sinon : order[idx]). */
  node?: string;
  /** Scénarios principaux déjà gagnés, dans l'ordre. */
  path?: string[];
  /** Missions secondaires gagnées. */
  sidesDone?: string[];
  /** Mission secondaire en cours (non sauvegardée : un retour au camp l'abandonne). */
  side?: string;
}

// ---------- Drapeaux ----------
export const hasFlags = (c: Pick<CampaignSave, 'flags'>, cond?: FlagCond): boolean => {
  if (!cond) return true;
  const f = c.flags ?? [];
  return (cond.all ?? []).every(x => f.includes(x)) && !(cond.none ?? []).some(x => f.includes(x)) && (!cond.any?.length || cond.any.some(x => f.includes(x)));
};
export const withFlags = (c: CampaignSave, set: string[] | undefined): CampaignSave =>
  set?.length ? { ...c, flags: [...new Set([...(c.flags ?? []), ...set])] } : c;
/** Répliques visibles selon les drapeaux. */
export const linesFor = (c: Pick<CampaignSave, 'flags'>, lines: DialogLine[] | undefined): DialogLine[] => (lines ?? []).filter(l => hasFlags(c, l.if));

/** Une aide de +1 ressource de départ se débloque toutes les 2 défaites sur un même scénario (3 au plus). */
export const FAILS_PER_BONUS = 2;
export const MAX_BONUS = 3;
export const defeatsOn = (c: CampaignSave, id: string) => c.attempts[id] ?? 0;
export const bonusUnlocked = (c: CampaignSave, id: string) => Math.min(MAX_BONUS, Math.floor(defeatsOn(c, id) / FAILS_PER_BONUS));
export const bonusFor = (c: CampaignSave, id: string) => Math.max(0, Math.min(c.bonus, bonusUnlocked(c, id)));

export const campaignDef = (c: CampaignSave | string): CampaignDef => CAMPAIGN_BY_ID[typeof c === 'string' ? c : c.campaign] ?? CAMPAIGN_BY_ID.empire!;

export function newCampaign(campaign = 'empire'): CampaignSave {
  const def = campaignDef(campaign);
  const first = def.start ?? def.order[0]!;
  return { version: 1, id: `camp-${def.id}-${Date.now()}`, campaign: def.id, pool: def.scenarios[first]!.A.deckList!.slice(), idx: 0, deck: null, finished: false, attempts: {}, bonus: 0,
    ...(def.start ? { node: def.start, flags: [], path: [], sidesDone: [] } : {}) };
}
/** Scénario tel qu'il se joue avec les drapeaux de la partie : répliques, événements, deck adverse et récompense choisis. */
export function resolveScenario(c: Pick<CampaignSave, 'flags'>, sc: CampaignScenario): CampaignScenario {
  if (!sc.next && !sc.rewardVariants && !sc.B.deckVariants && !sc.side && !(c.flags?.length)) return sc;
  const deck = sc.B.deckVariants?.find(v => hasFlags(c, v.if))?.deckList;
  return {
    ...sc,
    intro: linesFor(c, sc.intro),
    victoryDialog: sc.victoryDialog && linesFor(c, sc.victoryDialog),
    events: sc.events.filter(e => hasFlags(c, e.if)).map(e => (e.dialog ? { ...e, dialog: linesFor(c, e.dialog) } : e)),
    B: deck ? { ...sc.B, deckList: deck } : sc.B,
    reward: sc.rewardVariants?.find(v => hasFlags(c, v.if))?.reward ?? sc.reward,
  };
}
export const currentScenario = (c: CampaignSave): CampaignScenario =>
  resolveScenario(c, SCENARIOS[c.side ?? c.node ?? campaignDef(c).order[c.idx]!]!);
/** Missions secondaires proposées au camp maintenant. */
export function availableSides(c: CampaignSave): CampaignScenario[] {
  const def = campaignDef(c);
  if (!def.sides || c.finished || !c.node) return [];
  return def.sides.filter(s => s.at.includes(c.node!) && !(c.sidesDone ?? []).includes(s.id) && hasFlags(c, s.if)).map(s => resolveScenario(c, SCENARIOS[s.id]!));
}
/** Après une victoire : la campagne suivante (carte à embranchements ou ligne droite), null = fin de la campagne. */
export function nextNode(c: CampaignSave): string | null {
  const def = campaignDef(c);
  if (!def.start) return c.idx >= def.order.length - 1 ? null : def.order[c.idx + 1]!;
  const sc = SCENARIOS[c.node!]!;
  return sc.next?.find(n => hasFlags(c, n.if))?.to ?? null;
}
/** Fin atteinte (campagne à embranchements) : la première dont la condition est remplie. */
export function endingOf(c: CampaignSave): { id?: string; title: string; text: string } {
  const def = campaignDef(c);
  const e = def.endings?.find(x => hasFlags(c, x.if));
  return e ?? { title: def.endTitle, text: def.endText };
}
/** Factions dont les cartes entrent dans les Volontaires : celle de la campagne, plus les alliées. */
export function draftFactions(c: CampaignSave): Faction[] {
  const def = campaignDef(c);
  const allies = Object.entries(def.allies ?? {}).filter(([flag]) => (c.flags ?? []).includes(flag)).map(([, f]) => f);
  return [def.faction, ...allies];
}

/** Construit la partie du moteur correspondant à un scénario, avec le deck choisi par le joueur. */
/**
 * Aide de campagne (20/10/2026) : la campagne sert de grand tutoriel, elle doit rester agréable.
 * Appliquée à tous les scénarios sans toucher à leur contenu : ressource et marge de lassitude en plus pour le joueur,
 * régiment vital du joueur plus solide (END ×1,5, +2 Moral). Pertes de Moral normales, ATK adverse inchangée.
 */
// Réglages propres à chaque scénario : voir ease.ts.
export const CAMPAIGN_EASE = { startResource: 1, lassitudeMul: 1.5, enemyAtk: 1, vitalEnd: 1.5, vitalMor: 2, vitalArm: 0, extraCards: 0 };

export type CampaignEase = typeof CAMPAIGN_EASE;
/** Aide d'un scénario dans un mode : réglage commun, avec ressources et lassitude propres au scénario (src/campaign/ease.ts). */
export const easeFor = (id: string, mode: Difficulty = DEFAULT_DIFFICULTY): CampaignEase =>
  ({ ...CAMPAIGN_EASE, ...MODE_EASE[mode], ...SCENARIO_EASE[id]?.[mode] });
export const difficultyOf = (c: CampaignSave): Difficulty => c.difficulty ?? DEFAULT_DIFFICULTY;

export function scenarioGameSetup(sc: CampaignScenario, playerDeck: string[], seed: string | number, bonus = 0, ease: CampaignEase = easeFor(sc.id)): GameSetup {
  const per = <T>(m: Partial<Record<PlayerId, T>> | undefined, def: T): Record<PlayerId, T> => ({ A: m?.A ?? def, B: m?.B ?? def });
  return {
    seed,
    A: { faction: sc.A.faction, deck: [...playerDeck, ...(sc.deckRules.forced ?? [])] },
    B: { faction: sc.B.faction, deck: sc.B.deckList! },
    config: {
      layout: sc.layout ?? { avant: 4, arriere: 3 },
      levelThresholds: per(sc.levelThresholds, DEFAULT_LEVEL_THRESHOLDS),
      defeatLassitude: (({ A, B }) => ({ A: Math.max(1, Math.round(A * ease.lassitudeMul)), B }))(per(sc.defeatLassitude, 50)),
      moralCheckLassitude: sc.moralCheckLassitude ?? null,
      endTurnLassitude: per(sc.endTurnLassitude, 0),
      noRegimentDefeatFromTurn: per(sc.noRegimentDefeatFromTurn, 1),
      mustSurvive: sc.mustSurvive ?? {},
      emptyDeckDefeat: sc.emptyDeckDefeat ?? true,
      winAtTurn: sc.winAtTurn,
      liberation: sc.liberation,
      noSacrifice: sc.noSacrifice,
    },
    scenario: {
      events: sc.events,
      convoy: sc.convoy,
      moralCheckLostResource: sc.moralCheckLostResource,
      start: { A: sc.A.start, B: sc.B.start },
      startHand: { A: sc.A.startHand, B: sc.B.startHand },
      startLevel: sc.startLevel,
      startOverrides: sc.startOverrides,
      weather: sc.weather,
      alarm: sc.alarm,
      startResource: bonus + ease.startResource ? { A: Math.max(0, bonus + ease.startResource) } : undefined,
      startDraw: ease.extraCards ? { A: ease.extraCards } : undefined,
      ease: { weak: 'B', atk: ease.enemyAtk, helped: 'A', vitalEnd: ease.vitalEnd, vitalMor: ease.vitalMor, vitalArm: ease.vitalArm },
    },
  };
}

/**
 * Règles propres à l'ordinateur dans un scénario : renvoie false pour une action interdite.
 * - aiNoRegimentsFromTurn : plus de régiment posé à partir d'un tour donné (scénario 1) ;
 * - Changement Tectonique n'est joué que pour amener un ennemi en face de Sylvain quand celui-ci n'a aucune cible (scénario 4).
 */
export function scenarioAiFilter(sc: CampaignScenario | null) {
  return (s: GameState, a: Action): boolean => {
    if (!sc || a.type !== 'play') return true;
    const p = s.active;
    const h = s.players[p].hand.find(x => x.uid === a.handUid);
    if (!h) return true;
    const c = CARDS[h.cardId]!;
    const from = sc.aiNoRegimentsFromTurn?.[p];
    if (from && s.turn >= from && c.cardType === 'Regiment') return false;
    // Alarme : pas de régiment avant que l'alarme soit donnée.
    if (s.scenario?.alarm?.pid === p && !s.scenario.alarmRaised && c.cardType === 'Regiment') return false;
    if (c.effect === 'tectonique' && sc.id === 's4') {
      const me = s.players[p].board, opp = s.players[p === 'A' ? 'B' : 'A'].board;
      const L = s.config.layout;
      const adjBack = (i: number) => [i - 1, i].filter(k => k >= 0 && k < L.arriere);
      for (let k = 0; k < me.avant.length; k++) {
        const u = me.avant[k];
        if (u?.cardId !== 'sylvain') continue;
        const inReach = !!opp.avant[k] || adjBack(k).some(j => opp.arriere[j]);
        if (!inReach && a.target2?.zone === 'avant' && a.target2.idx === k) return true;
      }
      return false;
    }
    return true;
  };
}

// ---------- Volontaires (récompense tirée au hasard, 01/11/2026) ----------
/** Récompense réelle d'un scénario : celle écrite dans le scénario, plus des volontaires à choisir (3 fois 1 carte parmi 3),
 *  de niveau croissant au fil de la campagne, pour que chaque partie de campagne fasse évoluer le deck différemment. */
export function rewardWithDraft(c: CampaignSave): CampaignScenario['reward'] {
  const sc = currentScenario(c);
  const base = sc.reward ?? {};
  if (base.draft || (!c.side && nextNode(c) === null)) return sc.reward;
  const order = [...(base.order ?? (['exchange', 'gifts', 'picks'] as const))];
  // Une fois sur deux : la Promotion (une carte du pool contre une de niveau supérieur).
  const promote = !c.side && c.idx % 2 === 1 && promoteOffers(c).length > 0;
  return { ...base, order: [...order, ...(promote ? ['promote' as const] : []), 'draft'], draft: { rounds: 3, size: 3, maxLevel: Math.min(5, c.idx + 2) } };
}
const inFactions = (id: string, fs: Faction[]) => {
  const d = CARDS[id]!;
  return d.faction === 'neutre' || fs.includes(d.faction) || ((d.factions as string[] | undefined) ?? []).some(f => fs.includes(f as Faction));
};
/** Promotion : jusqu'à 3 offres « une carte de niveau X du pool contre une de niveau X+1 ou X+2, du même type ». */
export function promoteOffers(c: CampaignSave): { from: string; to: string }[] {
  const fs = draftFactions(c);
  const owned = poolCounts(c.pool);
  let st = seedFrom(`${c.id}|${c.idx}|promotion`);
  const rnd = () => { const r = nextRandom(st); st = r.state; return r.value; };
  const froms = Object.keys(owned).filter(id => CARDS[id]!.niveau <= 4 && COLLECTIBLE.includes(id)).sort();
  const out: { from: string; to: string }[] = [];
  const used = new Set<string>();
  while (out.length < 3 && froms.length) {
    const from = froms.splice(Math.floor(rnd() * froms.length), 1)[0]!;
    const d = CARDS[from]!;
    const targets = COLLECTIBLE.filter(id => {
      const t = CARDS[id]!;
      return t.cardType === d.cardType && t.niveau > d.niveau && t.niveau <= d.niveau + 2 && inFactions(id, fs) && (owned[id] ?? 0) < 3 && !used.has(id);
    }).sort();
    if (!targets.length) continue;
    const to = targets[Math.floor(rnd() * targets.length)]!;
    used.add(to);
    out.push({ from, to });
  }
  return out;
}
/** Cartes proposées au tour `round` des volontaires : tirage déterministe (même partie, même scénario = mêmes cartes). */
export function draftOptions(c: CampaignSave, round: number, size: number, maxLevel: number): string[] {
  const fs = draftFactions(c);
  const owned = poolCounts(c.pool);
  const pool = COLLECTIBLE.filter(id => inFactions(id, fs) && CARDS[id]!.niveau <= maxLevel && (owned[id] ?? 0) < 3);
  // Les cartes de la faction d'abord : les neutres comptent pour moitié.
  const weight = (id: string) => (CARDS[id]!.faction === 'neutre' ? 1 : 2);
  let st = seedFrom(`${c.id}|${c.idx}|${round}`);
  const out: string[] = [];
  const left = pool.slice();
  while (out.length < size && left.length) {
    const tot = left.reduce((n, id) => n + weight(id), 0);
    const r = nextRandom(st); st = r.state;
    let x = r.value * tot, k = 0;
    while (k < left.length - 1 && (x -= weight(left[k]!)) > 0) k++;
    out.push(left.splice(k, 1)[0]!);
  }
  return out;
}

// ---------- Pool et deck ----------
export function poolCounts(pool: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of pool) out[id] = (out[id] ?? 0) + 1;
  return out;
}
export function addToPool(c: CampaignSave, id: string): void {
  c.pool.push(id);
  if (c.deck) c.deck[id] = (c.deck[id] ?? 0) + 1;
}
export function removeFromPool(c: CampaignSave, id: string): boolean {
  const k = c.pool.indexOf(id);
  if (k === -1) return false;
  c.pool.splice(k, 1);
  if (c.deck) {
    const left = c.pool.filter(x => x === id).length;
    if ((c.deck[id] ?? 0) > left) c.deck[id] = left;
  }
  return true;
}
/** Deck proposé par défaut : le dernier deck choisi (limité au pool), sinon tout le pool. */
export function defaultDeckSelection(c: CampaignSave): Record<string, number> {
  const counts = poolCounts(c.pool);
  const sel: Record<string, number> = {};
  for (const id of Object.keys(counts)) sel[id] = c.deck ? Math.min(c.deck[id] ?? 0, counts[id]!) : counts[id]!;
  return sel;
}
export const selectionToDeck = (sel: Record<string, number>) => Object.entries(sel).flatMap(([id, n]) => Array<string>(n).fill(id));

// ---------- Sauvegarde ----------
/** Une sauvegarde par campagne (la campagne Empire garde la clé historique). */
const keyOf = (campaign: string) => keyFor(campaign === 'empire' ? 'ligneDeFront.jeu.campagne.v1' : `ligneDeFront.jeu.campagne.${campaign}.v1`);
export function sanitize(raw: unknown): CampaignSave | null {
  const c = raw as Partial<CampaignSave> | null;
  if (!c || !Array.isArray(c.pool) || typeof c.idx !== 'number') return null;
  const def = campaignDef(typeof c.campaign === 'string' ? c.campaign : 'empire');
  return {
    version: 1,
    id: typeof c.id === 'string' ? c.id : `camp-${Date.now()}`,
    campaign: def.id,
    pool: c.pool.filter(id => typeof id === 'string' && CARDS[id]),
    idx: Math.max(0, Math.min(def.order.length - 1, c.idx | 0)),
    deck: c.deck && typeof c.deck === 'object' ? c.deck : null,
    // Campagne à embranchements : elle ne se termine qu'à un nœud sans suite. Répare les sauvegardes arrêtées par erreur
    // au choix de l'allié (bug du 01/11/2026 : le choix était perdu à la fermeture du dialogue) : le combat est à rejouer.
    finished: !!c.finished && !(def.start && typeof c.node === 'string' && SCENARIOS[c.node]?.next?.length),
    attempts: c.attempts && typeof c.attempts === 'object' ? Object.fromEntries(Object.entries(c.attempts).filter(([, v]) => typeof v === 'number')) : {},
    bonus: Math.max(0, Math.min(MAX_BONUS, Number(c.bonus) | 0)),
    difficulty: DIFFICULTIES.includes(c.difficulty as Difficulty) ? c.difficulty : DEFAULT_DIFFICULTY,
    ...(def.start ? {
      flags: Array.isArray(c.flags) ? c.flags.filter(x => typeof x === 'string') : [],
      node: typeof c.node === 'string' && SCENARIOS[c.node] ? c.node : def.start,
      path: Array.isArray(c.path) ? c.path.filter(x => typeof x === 'string') : [],
      sidesDone: Array.isArray(c.sidesDone) ? c.sidesDone.filter(x => typeof x === 'string') : [],
    } : {}),
  };
}
export function saveCampaign(c: CampaignSave): void {
  try { localStorage.setItem(keyOf(c.campaign), JSON.stringify(c)); } catch { /* stockage indisponible : la partie continue sans sauvegarde */ }
}
export function loadCampaign(campaign = 'empire'): CampaignSave | null {
  try { const raw = localStorage.getItem(keyOf(campaign)); return raw ? sanitize(JSON.parse(raw)) : null; } catch { return null; }
}
export function exportCode(c: CampaignSave): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(c))));
}
export function importCode(code: string): CampaignSave | null {
  try { return sanitize(JSON.parse(decodeURIComponent(escape(atob(code.trim()))))); } catch { return null; }
}
