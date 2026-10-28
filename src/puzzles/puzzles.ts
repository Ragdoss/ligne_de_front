// Les puzzles. Chaque puzzle : une situation fixée (plateaux, main, ressource, niveau, lassitude) et un objectif à
// atteindre avant la fin de ton tour ; l'adversaire ne joue pas. Le format est décrit dans ./types.ts et docs/PUZZLES.md.
// Un test (tests/puzzles.test.ts) vérifie avec le solveur que chaque puzzle a une solution et qu'il ne se résout pas
// en finissant simplement le tour.
import type { Puzzle } from './types';

export const ALL_PUZZLES: Puzzle[] = [
  {
    id: 'marque',
    title: 'La marque du chasseur',
    difficulty: 1,
    intro: 'Un chevalier blessé tient la ligne adverse. Tes archers visent d’habitude le Moral le plus bas… Détruis le Chevalier de Province ce tour-ci.',
    goal: { type: 'destroy', slot: 'avant.3' },
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
      faction: 'elfe', level: 3, resource: 3,
      hand: ['visez_faibles', 'volee_fleches', 'sang_seve', 'changement_tectonique', 'chant_seve', 'brise_matin','pousse_sylve','racines_protectrices'],
      avant: ['eclaireur_elfe', 'danseuses_lames', null, null],
    },
    B: {
      faction: 'elfe', level: 5,
      avant: [ { card: 'treant_millenaire', end: 50 }, 'elem_terre', null, null],
      arriere: [null,'lettree_conclave', null],
    },
  },
  {
    id: 'invocation_impossible',
    title: 'L’invocation impossible',
    difficulty: 4,
    intro: 'Notre seul espoir c’est de finir l’incantation de l’Archidémon afin qu’il renverse la maréchal impérial et son dragon',
    goal: { type: 'destroy', slot: 'avant.2' },
    A: {
      faction: 'demons', level: 5, resource: 2, lassitude: 38, limit: 50,
      hand: ['archidemon_origines', 'rituel_sang_noir', 'augure_abime', 'pacte_mineur', 'grimoire_interdit', 'banquet_infernal','tuteur_demoniaque','pacte_sang','pacte_sang','pacte_sang'],
      avant: [null, { card:'fanatiques', mor: 2} ,{ card:'fanatiques', mor: 1}, null],
      deck :['legion_morvak','dragon_infernal','mercenaire_stagiaire','pacte_sang','mercenaire_stagiaire','mercenaire_stagiaire','mercenaire_stagiaire','mercenaire_stagiaire','mercenaire_stagiaire','mercenaire_stagiaire']
    },
    B: {
      faction: 'empire', level: 5, lassitude: 25, limit: 50,
      avant: [ null,{ card: 'dragon_imp', leader : 'marechal_empire' }, null, null],
     },
  },
  {
    id: 'invocation_impossible2',
    title: 'L’invocation impossible 2',
    difficulty: 5,
    intro: 'Notre seul espoir c’est de ré-invoquer l’Archidémon afin qu’il renverse la maréchal impérial et son deuxième dragon !',
    goal: { type: 'destroy', slot: 'avant.2' },
    A: {
      faction: 'demons', level: 5, resource: 3, lassitude: 37, limit: 50,
      hand: ['archidemon_origines', 'rituel_sang_noir', 'augure_abime', 'pacte_mineur', 'grimoire_interdit', 'banquet_infernal','tuteur_demoniaque','pacte_sang','pacte_sang','pacte_sang'],
      avant: [null, { card:'fanatiques', mor: 2} ,{ card:'fanatiques', mor: 1}, null],
      deck :['pacte_sang','mercenaire_stagiaire','mercenaire_stagiaire','pacte_sang','mercenaire_stagiaire','mercenaire_stagiaire','mercenaire_stagiaire','mercenaire_stagiaire','mercenaire_stagiaire','mercenaire_stagiaire']
    },
    B: {
      faction: 'empire', level: 5, lassitude: 25, limit: 50,
      avant: [ null,{ card: 'dragon_imp', leader : 'marechal_empire' }, null, null],
     },
  },
  {
    id: 'charge-du-mirage',
    title: 'La charge des Elfes',
    difficulty: 2,
    intro: 'Le Lancier qui tient le flanc droit est blessé, mais tes cavaliers n’arrivent jamais a porter le coup de grâce… . Détruis le Lancier de l’Empire ce tour-ci.',
    goal: { type: 'destroy', slot: 'avant.4' },
    A: {
      faction: 'elfe',
      level: 3, // Chevaucheurs du mirage : carte de niveau 3
      resource: 4,
      hand: ['chevaucheurs_mirage', 'volee_fleches', 'chant_seve', 'cavalier_elfe', 'sentinelle_cimes', 'brise_matin', 'eclaireur_elfe', 'vent_porteur', 'ravitaillement'],
      avant: ['elem_terre', null, null, null],
      arriere: [null, null, null],
      deck: ['eclaireur_elfe', 'pousse_sylve', 'eclaireur_elfe', 'pousse_sylve', 'eclaireur_elfe', 'pousse_sylve', 'eclaireur_elfe', 'pousse_sylve'],
      isole: 'clerc_foret',
    },
    B: {
      faction: 'empire',
      level: 4,
      avant: ['recrue_imp', null, 'hallebardiers_ligne', { card: 'lancier_emp', end: 24 }],
      arriere: [null, 'arbaletrier_imp', null],
    },
  },
  {
    id: 'foi-du-fanatique',
    title: 'La foi du fanatique',
    difficulty: 2,
    intro: 'Le Cuirassier lourd écrase nos lignes. Nos Fanatiques ont besoin que leur suplication soient entendues !. Détruis le Cuirassier lourd ce tour-ci.',
    goal: { type: 'destroy', slot: 'avant.1' },
    A: {
      faction: 'demons',
      level: 5,
      resource: 9,
      lassitude: 30,
      hand: ['dragon_infernal', 'archidemon_origines', 'legion_morvak', 'pretre_sacrificiel', 'pacte_sang', 'pacte_mineur', 'augure_abime', 'cor_ralliement', 'rituel_sang_noir'],
      avant: ['fanatiques', null, 'mercenaire_stagiaire', null],
      deck: ['mercenaire_stagiaire', 'mercenaire_stagiaire', 'mercenaire_stagiaire', 'mercenaire_stagiaire', 'mercenaire_stagiaire', 'mercenaire_stagiaire', 'mercenaire_stagiaire', 'mercenaire_stagiaire'],
    },
    B: {
      faction: 'empire',
      level: 5,
      avant: [{ card: 'cuirassiers_lourds', mor: 10 }, null, null, 'forteresse'],
      arriere: [null, 'tambour_bataillon', {card:'imperatrice_octavia', leader : 'heraut_imperial'}],
    },
  },
  {
    id: 'cadet-promu',
    title: 'Pour l’empire !',
    difficulty: 3,
    intro: 'Le Lancier de l’Empire est au bord de la déroute, face à un Chevalier Templier blessé. La ligne ne doit pas tomber, l’impératrice serai en danger. Détruis le Chevalier Templier ce tour-ci.',
    goal: { type: 'destroy', slot: 'avant.2' },
    A: {
      faction: 'empire',
      level: 4,
      resource: 3,
      hand: ['cadets_academie', 'contrat_convoi', 'ralliement', 'assassinat', 'formation_carre', 'a_couvert', 'paysans', 'arbaletrier_imp', 'promotion'],
      avant: [null, { card: 'lancier_emp', mor: 1 }, null, null],
      arriere: [null, {card:'imperatrice_octavia', mor: 1, end: 4}, null],
    },
    B: { faction: 'empire', level: 5, avant: ['recrue_imp', { card: 'chevalier_templier', end: 7 }, null, null] },
  },
];

/** Puzzles jouables (sans les brouillons). */
export const PUZZLES: Puzzle[] = ALL_PUZZLES.filter(p => !p.draft);
