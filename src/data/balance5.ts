// Équilibrage 5 (17/10/2026) : refonte des cartes Elfes les plus faibles, validée par Nathan.
// Valeurs appliquées par-dessus le catalogue (src/data/cards.ts) ; les textes sont dans src/i18n.
import type { CardDef } from '../engine/types';

export const BALANCE_5: Record<string, Partial<CardDef>> = {
  dryade_corrompue: { atk: 10, end: 40, healsBecomeLassitude: undefined, healsAlsoLowerLassitude: 20 },
  eveil_elementaire: { cout: 1, communionTokens: 2 },
  elem_eveil_regiment: { atk: 15, end: 40, arm: 5, ini: 5, mor: 4 },
  serenite_foret: { drawAfter: 1 },
  floraison: { cout: 1 },
  rite_purification: { cout: 1 },
  chant_vent: { bonusAtk: 10, bonusIni: 20 },
  veilleuse_sources: { lassitudePerHealStep: 10 },
  dryades_guerisseuses: { healsMostInjuredEachTurn: 15, healMorWithHeal: 1 },
  pretresse_saisons: { bonusAtk: 5, communionBonus: { atk: 10, ini: 10 }, communionMorOnAttach: 2 },
  vision: { typesRequired: [], typesRequiredAny: ['Elfe', 'Élémentaux'] },
};
