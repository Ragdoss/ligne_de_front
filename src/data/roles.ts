// Rôles ajoutés aux régiments (21/11/2026, décidé par Nathan). Les rôles sont des types de la carte : ils comptent
// pour les effets qui visent un type (Volée de Flèches pour les Archers, Charge décisive et Lanciers pour les Montés,
// Milice de village et Prêtre Sacrificiel pour les Humains…).
import type { CardDef } from '../engine/types';

export const ROLES_ADDED: Record<string, string[]> = {
  // --- Empire ---
  porte_drapeau_garde: ['Soldat'],
  porte_etendard: ['Soldat'],
  soldat_kragz: ['Soldat'],
  gardes_drapeau: ['Chevalier'],
  cuirassiers_lourds: ['Chevalier'],
  garde_imperiale: ['Soldat'],
  garde_frontiere_sylvestre: ['Humain'],
  // --- Elfes ---
  duelliste_sylvestre: ['Élite'],
  gardienne_lumiere: ['Archer'],
  lyra: ['Archer', 'Élite'],
  sentinelle_chene: ['Chevalier'],
  premiere_lame: ['Élite'],
  // --- Démons ---
  collecteur_ames: ['Magicien'],
  diablotins: ['Recrue'],
  bourreau_abime: ['Élite'],
  // --- Nomades ---
  chamelier: ['Monté'],
  eclaireuse_sables: ['Archer'],
  caravane_marchande: ['Monté'],
  danseurs_sable: ['Soldat'],
  marchand_ombres: ['Magicien'],
  sentinelles_oasis: ['Soldat'],
  saboteur_nomade: ['Élite'],
  jeune_nomade: ['Recrue'],
  voleurs_provisions: ['Recrue'],
  // --- Neutres : tous les régiments de niveau 1 sont des Recrues ; les mercenaires sont des Soldats ---
  ravitailleur: ['Recrue'],
  milice_village: ['Recrue'],
  sentinelle_route: ['Recrue'],
  mercenaire_stagiaire: ['Recrue'],
  mercenaires: ['Soldat'],
  ingenieurs_siege: ['Soldat'],
  veterans_louer: ['Soldat'],
};

/** Races en tête de la liste des types (avant la faction et les rôles). */
const RACES = ['Humain', 'Elfe', 'Démon', 'Basilic'];

export function applyRoles(cards: Record<string, CardDef>): void {
  for (const [id, add] of Object.entries(ROLES_ADDED)) {
    const c = cards[id];
    if (!c) throw new Error(`Rôles : carte inconnue ${id}`);
    const types = [...(c.types ?? [])];
    for (const t of add) {
      if (types.includes(t)) continue;
      if (RACES.includes(t)) {
        // Une race se place après les autres races de la carte.
        const at = types.findIndex(x => !RACES.includes(x));
        types.splice(at === -1 ? types.length : at, 0, t);
      } else types.push(t);
    }
    c.types = types;
  }
}
