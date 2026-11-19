// Équilibrage 14 (19/11/2026), décidé par Nathan à partir du tableur « Cartes à renforcer » : les cartes jamais retenues
// dans les 10 decks du mode normal et à impact négatif dans le test des decks aléatoires (reports/cartes-non-retenues.md).
// Les nouveaux effets sont dans le moteur (play.ts, choices.ts, turn.ts, combat.ts, ctx.ts) ; ici, les valeurs.
import type { CardDef } from '../engine/types';

export const BALANCE_14: Record<string, Partial<CardDef>> = {
  // --- Empire ---
  promotion: {},                                            // plus de Leader à défausser (moteur)
  dernier_carre: {},                                        // +15 ARM permanent (moteur)
  officier_releve: { cout: 0, relayMor: 1 },                // coût 1 → 0 ; +1 Moral au régiment qui le reçoit
  maximilien: { cout: 4 },                                  // 6 → 4
  heraut_imperial: { niveau: 4 },                           // 5 → 4
  // --- Elfes ---
  serenite_foret: { defeatLimitGain: 5 },                   // recule la limite de défaite au lieu de retirer de la lassitude
  soin_simple: { healAmount: 20, healMor: 1 },              // Clerc de la Forêt : 15 END → 20 END et 1 Moral
  gardienne_seuil: { cout: 3, healsFrontNeighborsBeforeCombat: { end: 10, mor: 1 } }, // coût 4 → 3, 5 → 10 END
  maitresse_initiative: { auraPrimeAtk: 10 },               // Prime +5 → +10 ATK
  brise_matin: { drawAfter: 1 },                            // + pioche 1 carte
  gardien_ecorce: { end: 65 },                              // 50 → 65 END
  chamane_foret: { bonusMor: 1, communionBonus: { atk: 10 } }, // +1 Moral ; Communion : +10 ATK
  druide_ancien: { niveau: 3, leaderAtkVsPrey: 10, leaderTargetsPrey: true }, // 4 → 3 ; +10 ATK contre la Proie, l'attaque en priorité
  premiere_lame: { end: 70 },                               // 50 → 70 END
  // --- Démons ---
  garde_asura: { end: 30, onSacrificedDraw: 2 },            // 20 → 30 END ; sacrifiée : pioche 2 (au lieu de 1)
  maitre_pactes: { bonusMor: 1, drawOnSacrifice: true },    // +1 Moral ; se déclenche aussi sur un sacrifice
  rancon_ames: {},                                          // +10 ATK par point, jusqu'à la fin de ton prochain tour (moteur)
  capacocha: { lassitudeOnOwnSacrifice: 2, handSacrificeTax: true }, // 1 → 2 lassitude ; arrivée : Sacrifice sur la main adverse
  pacte_mineur: {},                                         // une carte piochée coûte 1 de moins (moteur)
  pacte_succession: {},                                     // le Leader revient en main (moteur)
  rempart_chair: { offrande: 1 },                           // Offrande 2 → 1 ; +20 ARM et Moral protégé (moteur)
  voile_ombre: {},                                          // Mirage 1, Offrande 2 : Mirage 2 (moteur)
  veilleur_os: { sacrificeMinLevel: 2, atk: 15, end: 40 },  // Sacrifice 3+ → 2+ ; 10/30 → 15/40
  // --- Nomades ---
  colporteur: { atk: 5, onArrivalDraw: 1 },                 // 0 → 5 ATK ; pioche 1 à l'arrivée
  puits_empoisonne: { poisonsOpponentTurn: { mill: 1, handDiscard: 0, randomHandDiscard: 1 } }, // + une carte de la main au hasard
  maitre_caravane: { cout: 0, bonusIni: 10 },               // coût 1 → 0 ; +10 INI
  sentinelles_oasis: { auraNomadeArm: 10 },                 // +5 → +10 ARM
  dresseuse_basilics: {},                                   // le Basilic va en main (moteur)
  cheikh_ossements: { niveau: 3 },                          // 4 → 3
  oasis_cachee: { cout: 0 },                                // 1 → 0
  ranconnement: {},                                         // les deux : défausse et 2 ressources perdues (moteur)
  chasseur_reliques: {},                                    // l'ATK et l'ARM (moteur)
  tempete_lames: {},                                        // +10 ATK aux Nomades, +20 avec Mirage (moteur)
  volez_ravitaillement: { cout: 3 },                        // 4 → 3
  // --- Neutres ---
  forgeron_campagne: { mor: 6 },                            // 3 → 6 Moral ; le régiment est au choix (moteur)
  quartier_maitre: { leaderResourceFromThirdTurn: 2 },      // +2 ressources à partir de son 3e tour en jeu
  ralliement_urgence: { rallyBroken: 5 },                   // 3 → 5 Moral
  // --- Bi-factions ---
  dryade_corrompue: {},                                     // recule la limite de défaite au lieu de retirer de la lassitude (moteur)
  garde_frontiere_sylvestre: { cout: 2 },                   // 3 → 2
  bourreau_legion: { leaderOnSacrifice: { mor: 2, atk: 10, permanent: true } }, // +10 ATK permanent par sacrifice
  marchand_damnes: { discardAtRandom: true },               // l'adversaire défausse au hasard
};
