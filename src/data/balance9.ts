// Équilibrage 9 — opération exorcisme (25/10/2026), décidé par Nathan après l'optimisation des decks
// (reports/decks-optimises.md : Démons 71 % en finale entre decks optimisés).
import type { CardDef } from '../engine/types';

export const BALANCE_9: Record<string, Partial<CardDef>> = {
  pacte_sang: { cout: 1 },                      // était coût 0
  legion_morvak: { cout: 2 },                   // était coût 0 (garde l'effet d'arrivée du régiment sacrifié)
  bourreau_abime: { atkPerBrokenOnBoard: 5 },   // était +10 ATK par régiment au Moral brisé
  gargouille_sentinelle: { cout: 4 },           // était coût 3
  gargouille_cendres: { arm: 10 },              // était 15 ARM
};
