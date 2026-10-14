// Campagne : passage d'un scénario à une partie du moteur, pool de cartes, récompenses, sauvegarde.
import { CARDS } from '../data/cards';
import { DEFAULT_LEVEL_THRESHOLDS, type GameSetup } from '../engine/game';
import type { Action, GameState, PlayerId } from '../engine/types';
import { CAMPAIGN_ORDER, SCENARIOS } from './scenarios';
import type { CampaignScenario } from './types';

export interface CampaignSave {
  version: 1;
  /** Identifiant unique de cette partie de campagne (pour ne fusionner son pool qu'une fois dans la collection). */
  id: string;
  /** Cartes possédées (avec répétitions). */
  pool: string[];
  /** Index du scénario en cours dans CAMPAIGN_ORDER. */
  idx: number;
  /** Dernier deck choisi (carte → nombre), pour le proposer à nouveau. */
  deck: Record<string, number> | null;
  finished: boolean;
}

export function newCampaign(): CampaignSave {
  return { version: 1, id: `camp-${Date.now()}`, pool: SCENARIOS.s1!.A.deckList!.slice(), idx: 0, deck: null, finished: false };
}
export const currentScenario = (c: CampaignSave): CampaignScenario => SCENARIOS[CAMPAIGN_ORDER[c.idx]!]!;

/** Construit la partie du moteur correspondant à un scénario, avec le deck choisi par le joueur. */
export function scenarioGameSetup(sc: CampaignScenario, playerDeck: string[], seed: string | number): GameSetup {
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
    },
    scenario: {
      events: sc.events,
      convoy: sc.convoy,
      moralCheckLostResource: sc.moralCheckLostResource,
      start: { A: sc.A.start, B: sc.B.start },
      startHand: { A: sc.A.startHand, B: sc.B.startHand },
      startLevel: sc.startLevel,
      startOverrides: sc.startOverrides,
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
const KEY = 'ligneDeFront.jeu.campagne.v1';
export function sanitize(raw: unknown): CampaignSave | null {
  const c = raw as Partial<CampaignSave> | null;
  if (!c || !Array.isArray(c.pool) || typeof c.idx !== 'number') return null;
  return {
    version: 1,
    id: typeof c.id === 'string' ? c.id : `camp-${Date.now()}`,
    pool: c.pool.filter(id => typeof id === 'string' && CARDS[id]),
    idx: Math.max(0, Math.min(CAMPAIGN_ORDER.length - 1, c.idx | 0)),
    deck: c.deck && typeof c.deck === 'object' ? c.deck : null,
    finished: !!c.finished,
  };
}
export function saveCampaign(c: CampaignSave): void {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* stockage indisponible : la partie continue sans sauvegarde */ }
}
export function loadCampaign(): CampaignSave | null {
  try { const raw = localStorage.getItem(KEY); return raw ? sanitize(JSON.parse(raw)) : null; } catch { return null; }
}
export function exportCode(c: CampaignSave): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(c))));
}
export function importCode(code: string): CampaignSave | null {
  try { return sanitize(JSON.parse(decodeURIComponent(escape(atob(code.trim()))))); } catch { return null; }
}
