// Mode puzzle : une situation de jeu fixée et un objectif à atteindre en un seul tour.
import type { Faction } from '../engine/types';

/** Un régiment posé au départ : identifiant de carte, ou détails (blessures, Leader…). */
export type PuzzleCell = string | {
  card: string;
  /** Endurance et Moral actuels (par défaut : au maximum). */
  end?: number;
  mor?: number;
  /** Leader déjà attaché. */
  leader?: string;
  /** Vient d'être posé : frappe à moitié de son ATK à ce combat (par défaut : non, il est prêt). */
  fresh?: boolean;
};

export interface PuzzleSide {
  faction: Faction;
  /** Niveau (1 à 5), ressource disponible ce tour, lassitude actuelle, limite de lassitude (défaite). */
  level?: number;
  resource?: number;
  lassitude?: number;
  limit?: number;
  /** Cartes en main (joueur seulement). */
  hand?: string[];
  /** Plateau : rangée avant (4 cases), arrière (3 cases), isolé ; null = case vide. */
  avant?: (PuzzleCell | null)[];
  arriere?: (PuzzleCell | null)[];
  isole?: PuzzleCell | null;
  /** Pioche, du dessus vers le dessous (par défaut : des Recrues, sans importance). */
  deck?: string[];
}

export type PuzzleGoal =
  /** Gagner la partie avant la fin de ton tour (combat de fin de tour compris). */
  | { type: 'win' }
  /** Détruire le régiment adverse posé à cet emplacement, numéroté comme à l'écran à partir de 1 (ex. « avant.1 » = première
   *  case avant à gauche, « arriere.2 », « isole.1 »), combat de fin de tour compris. */
  | { type: 'destroy'; slot: string };

export interface Puzzle {
  id: string;
  title: string;
  /** 1 facile, 2 moyen, 3 difficile. */
  difficulty: 1 | 2 | 3;
  /** Présentation de la situation (affichée au début). */
  intro: string;
  goal: PuzzleGoal;
  /** Toi (tu joues ce tour), l'adversaire (il ne joue pas). */
  A: PuzzleSide;
  B: PuzzleSide;
}
