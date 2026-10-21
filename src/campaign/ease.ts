// Modes de difficulté de la campagne (21/10/2026) et réglage par scénario : ressources en plus au départ et seuil de
// défaite par lassitude du joueur, et solidité du régiment à protéger. Calculé par tools/tune-campaign.ts pour que l'ordinateur jouant le camp du joueur gagne
// environ 75 % (Histoire), 55 % (Guerrier) ou 25 % (Héros) des parties. Le contenu des scénarios n'est pas modifié.

export type Difficulty = 'histoire' | 'guerrier' | 'heros';
export const DIFFICULTIES: Difficulty[] = ['histoire', 'guerrier', 'heros'];
export const DIFFICULTY_LABEL: Record<Difficulty, string> = { histoire: 'Histoire', guerrier: 'Guerrier', heros: 'Héros' };
export const DIFFICULTY_HINT: Record<Difficulty, string> = {
  histoire: 'Pour découvrir le jeu et l’histoire : les combats sont plus cléments.',
  guerrier: 'Le défi prévu : il faut bien jouer, sans être impitoyable.',
  heros: 'Pour les vétérans : peu de marge, chaque erreur se paie.',
};
export const DEFAULT_DIFFICULTY: Difficulty = 'guerrier';

export interface ScenarioEase {
  /** Ressources en plus au départ. */
  startResource: number;
  /** Seuil de défaite par lassitude du joueur, en multiple du seuil du scénario. */
  lassitudeMul: number;
  /** Régiment à protéger : END multipliée, Moral en plus (maximum et départ). */
  vitalEnd?: number;
  vitalMor?: number;
}
/** Réglage par défaut d'un mode (scénario non réglé). */
export const MODE_EASE: Record<Difficulty, ScenarioEase> = {
  histoire: { startResource: 2, lassitudeMul: 2, vitalEnd: 2, vitalMor: 3 },
  guerrier: { startResource: 1, lassitudeMul: 1.5, vitalEnd: 1.5, vitalMor: 2 },
  heros: { startResource: 0, lassitudeMul: 1, vitalEnd: 1, vitalMor: 0 },
};
/** Réglage par scénario et par mode. */
export const SCENARIO_EASE: Record<string, Partial<Record<Difficulty, ScenarioEase>>> = {};
