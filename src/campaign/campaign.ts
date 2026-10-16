// Campagne : passage d'un scénario à une partie du moteur, pool de cartes, récompenses, sauvegarde.
import { CARDS } from '../data/cards';
import { keyFor } from '../profile/store';
import { DEFAULT_LEVEL_THRESHOLDS, type GameSetup } from '../engine/game';
import type { Action, GameState, PlayerId } from '../engine/types';
import { CAMPAIGN_BY_ID, SCENARIOS } from './campaigns';
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
}

/** Une aide de +1 ressource de départ se débloque toutes les 3 défaites sur un même scénario (3 au plus). */
export const FAILS_PER_BONUS = 3;
export const MAX_BONUS = 3;
export const defeatsOn = (c: CampaignSave, id: string) => c.attempts[id] ?? 0;
export const bonusUnlocked = (c: CampaignSave, id: string) => Math.min(MAX_BONUS, Math.floor(defeatsOn(c, id) / FAILS_PER_BONUS));
export const bonusFor = (c: CampaignSave, id: string) => Math.max(0, Math.min(c.bonus, bonusUnlocked(c, id)));

export const campaignDef = (c: CampaignSave | string): CampaignDef => CAMPAIGN_BY_ID[typeof c === 'string' ? c : c.campaign] ?? CAMPAIGN_BY_ID.empire!;

export function newCampaign(campaign = 'empire'): CampaignSave {
  const def = campaignDef(campaign);
  return { version: 1, id: `camp-${def.id}-${Date.now()}`, campaign: def.id, pool: def.scenarios[def.order[0]!]!.A.deckList!.slice(), idx: 0, deck: null, finished: false, attempts: {}, bonus: 0 };
}
export const currentScenario = (c: CampaignSave): CampaignScenario => SCENARIOS[campaignDef(c).order[c.idx]!]!;

/** Construit la partie du moteur correspondant à un scénario, avec le deck choisi par le joueur. */
export function scenarioGameSetup(sc: CampaignScenario, playerDeck: string[], seed: string | number, bonus = 0): GameSetup {
  const per = <T>(m: Partial<Record<PlayerId, T>> | undefined, def: T): Record<PlayerId, T> => ({ A: m?.A ?? def, B: m?.B ?? def });
  return {
    seed,
    A: { faction: sc.A.faction, deck: [...playerDeck, ...(sc.deckRules.forced ?? [])] },
    B: { faction: sc.B.faction, deck: sc.B.deckList! },
    config: {
      layout: sc.layout ?? { avant: 4, arriere: 3 },
      levelThresholds: per(sc.levelThresholds, DEFAULT_LEVEL_THRESHOLDS),
      defeatLassitude: per(sc.defeatLassitude, 50),
      moralCheckLassitude: sc.moralCheckLassitude ?? null,
      endTurnLassitude: per(sc.endTurnLassitude, 0),
      noRegimentDefeatFromTurn: per(sc.noRegimentDefeatFromTurn, 1),
      mustSurvive: sc.mustSurvive ?? {},
      emptyDeckDefeat: sc.emptyDeckDefeat ?? true,
      winAtTurn: sc.winAtTurn,
      liberation: sc.liberation,
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
      startResource: bonus ? { A: bonus } : undefined,
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
    finished: !!c.finished,
    attempts: c.attempts && typeof c.attempts === 'object' ? Object.fromEntries(Object.entries(c.attempts).filter(([, v]) => typeof v === 'number')) : {},
    bonus: Math.max(0, Math.min(MAX_BONUS, Number(c.bonus) | 0)),
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
