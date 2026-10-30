// Équilibrage 12 — l'Empire (30/10/2026) : « la ligne tient ». Viser un cycle Empire > Elfes > Démons > Nomades > Empire.
// Validé par Nathan.
import type { CardDef } from '../engine/types';

export const BALANCE_12: Record<string, Partial<CardDef>> = {
  capitaine_garde: { untargetableByEnemyTactics: true },            // porteur intouchable par les Tactiques adverses
  lanciers_rempart: { tauntsDistance: true },                       // les régiments adverses à Distance doivent l'attaquer
  formation_carre: { squareArm: 20, squareGuardArm: 10 },           // +20 ARM aux porteurs de Leader ; cibles des Tactiques adverses +10 ARM
  chevalier_prov: { cout: 4 },
  charge_imp: { targetRule: 'empire-allie', lancierAtk: 10 },       // tout régiment Empire ; un Lancier gagne aussi +10 ATK
  arbaletrier_imp: { atk: 30, end: 40 },                            // 25/30 → 30/40
  dragon_imp: { atk: 45, ini: 25 },                                 // 35 ATK / 15 INI → 45 / 25
};
