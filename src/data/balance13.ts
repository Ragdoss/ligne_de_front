// Équilibrage 13 — les Nomades (18/11/2026), décidé par Nathan : renforcer leur jeu hors usure (main adverse et Basilics).
// Constat (tournoi des 10 decks du mode normal, reports/normal-league.md) : Nomades 44 %, Empire + Nomades 34 % ;
// 75 à 90 % de leurs victoires viennent du deck vide adverse, et 30 de leurs 52 cartes ne sont dans aucun deck optimisé.
// Reine des Basilics : nouvel effet d'arrivée dans le moteur (play.ts, choix « reineBasilics »).
import type { CardDef } from '../engine/types';

export const BALANCE_13: Record<string, Partial<CardDef>> = {
  ranconnement: { cout: 0 },              // 2 → 0
  frappez_ravitaillement: { cout: 1 },    // 3 → 1
  basilics_desert: { niveau: 4 },         // 5 → 4
  basilic_necropole: { niveau: 4 },       // 5 → 4
  reine_basilics: { atk: 35 },            // 30 → 35
};
