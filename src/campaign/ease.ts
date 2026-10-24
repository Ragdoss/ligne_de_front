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
  /** Cartes en main en plus au départ. */
  extraCards?: number;
}
/** Réglage par défaut d'un mode (scénario non réglé). */
export const MODE_EASE: Record<Difficulty, ScenarioEase> = {
  histoire: { startResource: 2, lassitudeMul: 2, vitalEnd: 2, vitalMor: 3, extraCards: 1 },
  guerrier: { startResource: 1, lassitudeMul: 1.5, vitalEnd: 1.5, vitalMor: 2 },
  heros: { startResource: 0, lassitudeMul: 1, vitalEnd: 1, vitalMor: 0 },
};
/** Réglage par scénario et par mode. */
/**
 * Réglage par scénario et par mode (21/10/2026, tools/tune-campaign.ts, 60 à 120 parties par essai ; commentaires : taux de
 * victoire de l'ordinateur jouant le joueur). Kragz, le Convoi, Sylvain, le Portail et la Tempête plafonnent vers 25-55 %
 * quelle que soit l'aide : l'ordinateur y joue mal (il ne protège pas le régiment vital, finit sa pioche) ; ils reçoivent
 * une aide progressive raisonnable plutôt que l'aide maximale.
 */
export const SCENARIO_EASE: Record<string, Partial<Record<Difficulty, ScenarioEase>>> = {
  d1: {
    heros: { startResource: 0, lassitudeMul: 0.5 }, /* IA 28 % */
    guerrier: { startResource: 0, lassitudeMul: 0.8 }, /* IA 57 % */
    histoire: { startResource: 2, lassitudeMul: 1.5 }, /* IA 62 % */
  },
  d2: {
    heros: { startResource: 0, lassitudeMul: 0.8, vitalEnd: 1, vitalMor: 1 }, /* IA 23 % */
    // Réglage de Nathan (23/10/2026) : Guerrier lassitude max 45 (60 − 15) et Chariot 40 END (70 − 30) ; Histoire Chariot 60 END, lassitude max 50.
    guerrier: { startResource: 2, lassitudeMul: 1.125, vitalEnd: 1, vitalMor: 2 },
    histoire: { startResource: 6, lassitudeMul: 1.25, vitalEnd: 1.5, vitalMor: 6 },
  },
  d3: {
    heros: { startResource: 0, lassitudeMul: 0.8 }, /* IA 13 % */
    guerrier: { startResource: 0, lassitudeMul: 1 }, /* IA 58 % */
    histoire: { startResource: 0, lassitudeMul: 1.25 }, /* IA 75 % */
  },
  d4: {
    heros: { startResource: 0, lassitudeMul: 0.5 }, /* IA 30 % */
    guerrier: { startResource: 0, lassitudeMul: 0.6 }, /* IA 55 % */
    histoire: { startResource: 0, lassitudeMul: 1 }, /* IA 73 % */
  },
  d5: {
    heros: { startResource: 0, lassitudeMul: 0.6, vitalEnd: 1, vitalMor: 0 }, /* IA 18 % */
    guerrier: { startResource: 0, lassitudeMul: 0.8, vitalEnd: 1, vitalMor: 1 }, /* IA 50 % */
    histoire: { startResource: 0, lassitudeMul: 1.25, vitalEnd: 1.5, vitalMor: 2 }, /* IA 73 % */
  },
  e1: {
    heros: { startResource: 0, lassitudeMul: 0.6 }, /* IA 29 % */
    guerrier: { startResource: 0, lassitudeMul: 0.8 }, /* IA 57 % */
    histoire: { startResource: 0, lassitudeMul: 1 }, /* IA 90 % */
  },
  e2: {
    heros: { startResource: 0, lassitudeMul: 0.6 }, /* IA 30 % */
    guerrier: { startResource: 0, lassitudeMul: 0.8 }, /* IA 42 % */
    histoire: { startResource: 0, lassitudeMul: 1 }, /* IA 75 % */
  },
  e3: {
    heros: { startResource: 0, lassitudeMul: 0.6 }, /* IA 8 % */
    guerrier: { startResource: 0, lassitudeMul: 0.8 }, /* IA 50 % */
    histoire: { startResource: 2, lassitudeMul: 1.5 }, /* IA 73 % */
  },
  e4: {
    heros: { startResource: 0, lassitudeMul: 0.8 }, /* IA 10 % */
    guerrier: { startResource: 0, lassitudeMul: 1.25 }, /* IA 53 % */
    histoire: { startResource: 3, lassitudeMul: 2 }, /* IA 55 % */
  },
  s1: {
    heros: { startResource: 0, lassitudeMul: 0.8 }, /* IA 28 % */
    guerrier: { startResource: 0, lassitudeMul: 1.25 }, /* IA 57 % */
    histoire: { startResource: 1, lassitudeMul: 1.25 }, /* IA 93 % */
  },
  s2: {
    heros: { startResource: 1, lassitudeMul: 1.5, vitalEnd: 1.5, vitalMor: 2 }, /* limité par l’IA */
    guerrier: { startResource: 3, lassitudeMul: 2, vitalEnd: 2, vitalMor: 3 }, /* limité par l’IA */
    histoire: { startResource: 5, lassitudeMul: 3, vitalEnd: 3, vitalMor: 5 }, /* limité par l’IA */
  },
  s3: {
    heros: { startResource: 1, lassitudeMul: 1.5, vitalEnd: 1.5, vitalMor: 2 }, /* limité par l’IA */
    guerrier: { startResource: 3, lassitudeMul: 2, vitalEnd: 2, vitalMor: 3 }, /* limité par l’IA */
    histoire: { startResource: 5, lassitudeMul: 3, vitalEnd: 3, vitalMor: 5 }, /* limité par l’IA */
  },
  s4: {
    heros: { startResource: 1, lassitudeMul: 1.5 }, /* limité par l’IA */
    guerrier: { startResource: 3, lassitudeMul: 1.75 }, /* IA 25 % */
    histoire: { startResource: 4, lassitudeMul: 2 }, /* IA 32 % */
  },
  n1: {
    heros: { startResource: 0, lassitudeMul: 0.6 }, /* IA 25 % */
    guerrier: { startResource: 0, lassitudeMul: 0.8 }, /* IA 63 % */
    histoire: { startResource: 0, lassitudeMul: 1 }, /* IA 90 % */
  },
  n2: {
    heros: { startResource: 0, lassitudeMul: 0.8, vitalEnd: 1, vitalMor: 1 }, /* IA 33 % */
    guerrier: { startResource: 0, lassitudeMul: 1, vitalEnd: 1.25, vitalMor: 1 }, /* IA 68 % */
    histoire: { startResource: 0, lassitudeMul: 1.25, vitalEnd: 1.5, vitalMor: 2 }, /* IA 80 % */
  },
  n3: {
    heros: { startResource: 0, lassitudeMul: 0.6 }, /* IA 21 % */
    guerrier: { startResource: 0, lassitudeMul: 1.25 }, /* IA 57 % */
    histoire: { startResource: 2, lassitudeMul: 1.5 }, /* IA 73 % */
  },
  n4: {
    heros: { startResource: 0, lassitudeMul: 0.6 }, /* IA 18 % */
    guerrier: { startResource: 0, lassitudeMul: 0.8 }, /* IA 46 % */
    histoire: { startResource: 1, lassitudeMul: 1.5 }, /* IA 45 % */
  },
  n5: {
    heros: { startResource: 0, lassitudeMul: 0.6 }, /* IA 18 % */
    guerrier: { startResource: 0, lassitudeMul: 0.7 }, /* IA 52 % */
    histoire: { startResource: 0, lassitudeMul: 0.8 }, /* IA 83 % */
  },
};
