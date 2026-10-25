// Équilibrage 10 — les Elfes (25/10/2026) : cartes Elfes au plus mauvais impact (reports/impact-toutes-cartes.md),
// remises à niveau. Validé par Nathan ; mesure dans le GDD.
import type { CardDef } from '../engine/types';

export const BALANCE_10: Record<string, Partial<CardDef>> = {
  rangers: { keywords: ['Distance'] },                 // n'est plus Lent
  serenite_foret: { lassitudeLoss: 5 },                // −5 lassitude (−10 avec un Élémentaux) au lieu de −3 / −6 ; pioche 2
  marque_chasseur: { markAtk: 10 },                    // + 10 ATK pour tes Distance contre la cible (en plus de 10 ARM ignorés)
  clerc_foret: { vieTours: 5 },                        // durée de vie 5 tours au lieu de 3
  soin_simple: { healAmount: 15 },                     // 15 END au lieu de 10
  choeur_saisons: { onArrivalDraw: 1, end: 40 },       // pioche 1 à l'arrivée, 40 END (30)
  ancien_canopee: { leaderGrowthEnd: 10 },             // +10 END par tour au lieu de +5
  elem_eau: { cout: 2, end: 30 },                      // coût 3 → 2, END 20 → 30
  sentinelle_cimes: { cout: 2 },                       // coût 3 → 2
};
