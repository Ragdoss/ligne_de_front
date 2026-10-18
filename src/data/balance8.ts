// Équilibrage 8 (18/10/2026) : +1 Moral pour tous les régiments (décision de Nathan après les tests à +1 et +2,
// reports/echelle-finale-moral-plus-1.md). Le Moral tue moins (41 % → 29 % des destructions), l'Endurance devient
// la première cause de mort, sans bouleverser l'équilibre des factions.
import type { CardDef } from '../engine/types';

export const MORAL_BONUS = 1;

/** Cartes de scénario et jetons fixes : inchangés (les scénarios de campagne ne bougent pas). */
const UNCHANGED = new Set(['convoi', 'garnison', 'palissade_regiment', 'dragonnet_infernal', 'puits_sel_amar', 'source_corrompue',
  'portail_infernal', 'gardienne_nid', 'chariot_oeufs', 'oeuf_rituel', 'legionnaire_desert', 'garde_capitale']);

/** Applique le bonus de Moral à tous les régiments du catalogue (appelé une fois, après les autres équilibrages). */
export function applyBalance8(cards: Record<string, CardDef>): void {
  for (const c of Object.values(cards)) if (c.cardType === 'Regiment' && !UNCHANGED.has(c.id)) c.mor = (c.mor ?? 0) + MORAL_BONUS;
}
