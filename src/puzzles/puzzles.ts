// Les puzzles. Chaque puzzle : une situation fixée (plateaux, main, ressource, niveau, lassitude) et un objectif à
// atteindre avant la fin de ton tour ; l'adversaire ne joue pas. Le format est décrit dans ./types.ts et docs/PUZZLES.md.
// Un test (tests/puzzles.test.ts) vérifie avec le solveur que chaque puzzle a une solution et qu'il ne se résout pas
// en finissant simplement le tour.
import type { Puzzle } from './types';

export const PUZZLES: Puzzle[] = [
  {
    id: 'marque',
    title: 'La marque du chasseur',
    difficulty: 1,
    intro: 'Un chevalier blessé tient la ligne adverse. Tes archers visent d’habitude le Moral le plus bas… Détruis le Chevalier de Province ce tour-ci.',
    goal: { type: 'destroy', slot: 'avant.2' },
    A: {
      faction: 'elfe', level: 2, resource: 1,
      hand: ['marque_chasseur', 'volee_fleches', 'brise_matin'],
      arriere: [null, 'archer_bois', 'eclaireuse_fourres'],
    },
    B: {
      faction: 'empire', level: 3,
      avant: [{ card: 'mercenaires', mor: 3 }, null, { card: 'chevalier_prov', end: 45 }, null],
    },
  },
  {
    id: 'coup-de-grace',
    title: 'Le coup de grâce',
    difficulty: 2,
    intro: 'Les Pillards sont à bout : 15 de lassitude sur 18. Fais-leur perdre la partie avant la fin de ton tour… avec une seule ressource en poche.',
    goal: { type: 'win' },
    A: {
      faction: 'empire', level: 4, resource: 1,
      hand: ['lieutenant', 'cuirassiers_kragz', 'contrat_convoi', 'ralliement', 'a_couvert'],
      avant: [null, 'recrue_imp', null, null],
    },
    B: {
      faction: 'neutre', level: 2, lassitude: 15, limit: 18,
      avant: [null, { card: 'mercenaires', end: 20, mor: 4 }, null, { card: 'milice_village', end: 15 }],
    },
  },
  {
    id: 'derriere-les-lignes',
    title: 'Derrière les lignes',
    difficulty: 3,
    intro: 'Le Tréant millénaire soigne toute l’armée adverse depuis l’arrière, hors d’atteinte… pour l’instant. Détruis-le ce tour-ci.',
    goal: { type: 'destroy', slot: 'avant.1' },
    A: {
      faction: 'elfe', level: 3, resource: 1,
      hand: ['visez_faibles', 'volee_fleches', 'sang_seve', 'changement_tectonique', 'chant_seve', 'brise_matin','pousse_sylve','racines_protectrices'],
      avant: ['eclaireur_elfe', 'danseuses_lames', null, null],
    },
    B: {
      faction: 'elfe', level: 5,
      avant: [ { card: 'treant_millenaire', end: 50 }, 'elem_terre', null, null],
      arriere: [null,'lettree_conclave', null],
    },
  },
];
