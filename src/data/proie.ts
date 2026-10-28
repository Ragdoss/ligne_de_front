// Refonte des Elfes autour de la Proie (28/10/2026), validée par Nathan (document « Refonte des Elfes — la Proie »).
// La Proie : un régiment adverse désigné par un Elfe ; une seule à la fois, jusqu'à sa destruction (même déplacée).
// Pour son camp, une Tactique qui cible sa propre Proie coûte 1 de plus. Textes : src/i18n/proie.fr.ts.
import type { CardDef } from '../engine/types';

export const PROIE_CARDS: Record<string, CardDef> = {
  hallali: { id: 'hallali', cardType: 'Tactique', faction: 'elfe', niveau: 3, cout: 1, targetRule: 'none', effect: 'hallali' },
};

export const BALANCE_PROIE: Record<string, Partial<CardDef>> = {
  eclaireur_elfe: { preyOnArrival: 'facing' },            // désigne le régiment en face (arrivée, déplacement)
  eclaireuse_fourres: { preyOnArrival: 'lowestMor', alliesAtkVsPrey: 5 },     // désigne le Moral le plus bas (arrivée, déplacement)
  marque_chasseur: { designatesPrey: true },
  rangers: { preyOnAttack: true },                        // sa cible devient Proie (le bonus « si un Elfe l'achève » disparaît)
  chant_vent: { leaderPreyOnAttack: true },
  visez_faibles: { cout: 1, targetRule: 'ennemi-arriere-ou-proie' },
  racines_immobilisantes: { costVsPrey: 0 },
  changement_tectonique: { costVsPrey: 0 },
  brume_trompeuse: { preyMoralLoss: 2 },
  repositionnement: { preyFacingAtk: 10 },
  archer_bois: { bonusVsPrey: 10 },
  volee_fleches: { preyBonus: 10, echoCopy: 1 },                       // +10 ATK aux Archers, +20 contre la Proie
  sentinelle_cimes: { bonusVsBrokenAlsoPrey: true },
  traqueuse_sylvestre: { targetsPreyFirst: true },
  cavalier_elfe: { attacksPreyInFront: true },
  chant_traque: { volleyAtPrey: true },
  lyra: { tacticPingPreyFirst: true },
  seigneure_chasse: { preyDeathLassitude: 2, preyRetargetMaxEnd: true },
  druide_ancien: { preyKillHealEnd: 20, preyKillHealMor: 2 },
  elem_feu: { atk: 30 },
};
