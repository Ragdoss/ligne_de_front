// Équilibrage 7 (17/10/2026) : cartes Elfes peu jouées et sans effet sur les victoires (reports/impact-elfe.md),
// remises à niveau. Mesure : reports/impact-elfe-eq7.md. Les Elfes seront réévalués après les 4 vagues de cartes.
import type { CardDef } from '../engine/types';

export const BALANCE_7: Record<string, Partial<CardDef>> = {
  serenite_foret: { drawAfter: 2 },
  rite_purification: { cout: 0 },
  danseuses_lames: { atk: 15, end: 30, atkPerTacticThisTurn: 10 },
  choeur_saisons: { cout: 3, drawEveryTactics: 2 },
  chamane_foret: { healOnAttach: 25, healEachTurn: 10 },
  elem_feu: { end: 30, mor: 5 },
  sylvain: { cout: 5, atk: 25 },
  volee_fleches: { cout: 1 },
  archer_bois: { end: 30 },
  marque_chasseur: { markPen: 10 },
};
