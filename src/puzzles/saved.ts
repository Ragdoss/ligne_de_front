// Solutions enregistrées par tools/puzzle-check.ts (src/puzzles/solutions.json, fichier généré : ne pas l'écrire à la main).
// Elles évitent de refaire une longue recherche dans les tests et donnent des indices immédiats en jeu.
import type { Action } from '../engine/types';
import raw from './solutions.json';

export const SAVED_SOLUTIONS = raw as Record<string, Action[]>;
