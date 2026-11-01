// Campagne 5 — « La Couronne de cendres » (01/11/2026) : la première campagne à embranchements.
// Maximilien, le Prince héritier, est chassé de la capitale par le Hiérophante Morvak, qui tient la cour par l'emprise
// (Octavia « malade » est en fait sous son emprise) avec l'appui de Capacocha, qui veut la capitale entière en offrande.
// Acte 1 commun → choix de l'allié (Elfes, Nomades, ou le Cercle ancestral des Démons, avec l'Archidémon des Origines)
// → acte 2 propre à l'allié → acte 3 commun → 3 fins selon les drapeaux. 3 missions secondaires (Forteresse, le remède, la Légion).
// Proposé par Claude d'après le document de Nathan ; les portraits des nouveaux personnages sont laissés vides (Nathan les dessine).
import { cards, NO_LIMIT, say } from './dsl';
import type { CampaignDef, CampaignScenario, Reward } from './types';
import type { DialogLine, FlagCond } from '../engine/types';

const MAX = 'Maximilien';
const OCT = 'Impératrice Octavia';
const MOR = 'Hiérophante Morvak';
const CAPA = 'Capacocha';
const VARRO = 'Légat Varro';
const CMD = 'Commandant';
const CAP = 'Capitaine de la garde';
const SYL = 'Sylvain';
const LYRA = 'Éclaireuse Lyra';
const ZAHRA = 'Cheikha Zahra';
const ALM = 'Al-Mansur';
const ARCHI = 'Archidémon des Origines';
const FORT = 'Forteresse';
const ACO = 'Acolyte';

/** Réplique conditionnelle. */
const when = (cond: FlagCond, ...lines: DialogLine[]): DialogLine[] => lines.map(l => ({ ...l, if: cond }));
const ELFES: FlagCond = { all: ['allie:elfes'] }, NOMADES: FlagCond = { all: ['allie:nomades'] }, DEMONS: FlagCond = { all: ['allie:demons'] };

// ---------- Decks ----------
const START_POOL = cards('recrue_imp*2', 'ecuyers_garde*2', 'soldat_kragz*2', 'lancier_emp*2', 'lanciers_rempart*2', 'archer_imp*2', 'chevalier_prov',
  'gardes_drapeau', 'lieutenant*2', 'capitaine_garde', 'officier_releve', 'porte_drapeau_garde', 'ralliement', 'ordre_releve', 'ravitaillement');

const GARDE_EMPRISE = cards('recrue_imp*4', 'lancier_emp*3', 'soldat_kragz*3', 'archer_imp*2', 'chevalier_prov*2', 'capitaine_garde', 'ralliement*2',
  'murmure_abime*2', 'effroi_demoniaque*2', 'cultiste*3', 'lieutenant*2');
const POURSUITE = cards('recrue_imp*5', 'cavaliers_garde*2', 'lancier_emp*3', 'archer_imp*2', 'soldat_kragz*2', 'lieutenant*2',
  'ralliement*2', 'chevalier_prov', 'cultiste*3');
const ASSASSINS = cards('cultiste*4', 'chien_infernal*3', 'diablotins*3', 'esclave_guerrier*2', 'sorciere_pacte*2', 'effroi_demoniaque*2', 'murmure_abime*2',
  'voile_ombre', 'pacte_sang*2', 'gargouille_cendres*2', 'demon_akantha');
const GEOLIERS = cards('cultiste*4', 'gardien_chaines*2', 'chaines_abime*2', 'pacte_mineur*2', 'chien_infernal*3', 'diablotins*2', 'esclave_guerrier*3',
  'effroi_demoniaque*2', 'sorciere_pacte*2');
// Acte 2 — Elfes
const SOURCES_NOIRES = cards('cultiste*4', 'chien_infernal*3', 'demon_akantha*2', 'fanatiques*2', 'diablotins*3', 'effroi_demoniaque*2', 'pacte_sang*2',
  'source_corrompue', 'ceremonie_declin', 'gargouille_cendres*2', 'rancon_ames');
const FORET_CAPTIVE = cards('archer_bois*3', 'eclaireur_elfe*3', 'sentinelle_cimes*2', 'recrue_imp*3', 'lancier_emp*2', 'soldat_kragz*2', 'murmure_abime*2',
  'cultiste*3', 'effroi_demoniaque*2');
const COL_BRUMES = cards('chevaliers_ordre*2', 'cuirassiers_lourds', 'cavaliers_garde*2', 'lancier_emp*3', 'soldat_kragz*3', 'archer_imp*3', 'recrue_imp*4',
  'capitaine_garde*2', 'formation_carre', 'ralliement*2');
// Acte 2 — Nomades
const TRESOR = cards('recrue_imp*4', 'lancier_emp*3', 'archer_imp*3', 'soldat_kragz*3', 'lieutenant*2', 'capitaine_garde*2', 'formation_carre*2',
  'ralliement*2', 'porte_etendard', 'chevalier_prov', 'cultiste*2');
const PUITS_EMPOISONNE = cards('cultiste*4', 'chien_infernal*3', 'diablotins*3', 'esclave_guerrier*3', 'sorciere_pacte*2', 'effroi_demoniaque*2',
  'pacte_sang*2', 'murmure_abime*2', 'demon_akantha', 'gargouille_cendres*2');
const TEMPETE = cards('legionnaire_desert*4', 'archer_imp*4', 'arbaletrier_imp*2', 'lancier_emp*3', 'soldat_kragz*2', 'chevalier_prov*2',
  'lieutenant*2', 'capitaine_garde*2', 'ralliement*2', 'formation_carre', 'chevalier_templier');
// Acte 2 — Démons
const PATROUILLE_ELFE = cards('eclaireur_elfe*3', 'archer_bois*3', 'rangers*2', 'traqueuse_sylvestre*2', 'cavalier_elfe*2', 'elem_terre*2', 'marque_chasseur*2',
  'brume_trompeuse*2', 'bourgeonnement*2', 'sentinelle_cimes*2');
const SECTE = cards('cultiste*4', 'chien_infernal*3', 'diablotins*3', 'fanatiques*2', 'demon_akantha*2', 'effroi_demoniaque*3', 'murmure_abime*2',
  'pacte_survie', 'banquet_infernal', 'gargouille_cendres*2');
const NID_DU_DRAGON = cards('cultiste*4', 'diablotins*3', 'fanatiques*2', 'demon_akantha*2', 'effroi_demoniaque*2', 'dette_infernale*2', 'rancon_ames*2',
  'gardien_chaines*2', 'bourreau_abime*2', 'seigneur_tourments', 'pacte_sang*2');
// Acte 3
const CAPITALE = cards('soldat_kragz*3', 'chevalier_templier*2', 'lancier_emp*3', 'archer_imp*3', 'arbaletrier_imp*2', 'capitaine_garde*2', 'formation_carre*2',
  'murmure_abime*2', 'cultiste*3', 'effroi_demoniaque*2');
const TRONE = cards('cultiste*3', 'diablotins*3', 'demon_akantha*2', 'fanatiques*2', 'effroi_demoniaque*3', 'murmure_abime*2', 'rituel_sang_noir*2',
  'gardien_chaines*2', 'bourreau_abime*2', 'seigneur_tourments', 'pacte_sang*2', 'soldat_kragz*2');
// Missions secondaires
const SANCTUAIRE = cards('cultiste*4', 'chien_infernal*3', 'diablotins*3', 'esclave_guerrier*2', 'effroi_demoniaque*2', 'voile_ombre*2', 'sorciere_pacte*2',
  'murmure_abime*2', 'gargouille_cendres*2');
const LEGION_EGAREE = cards('soldat_kragz*3', 'lancier_emp*3', 'recrue_imp*4', 'archer_imp*3', 'chevalier_prov*2', 'lieutenant*2', 'capitaine_garde',
  'ralliement*2', 'murmure_abime*2', 'cultiste*2');

const ALLY_GIFTS: { if: FlagCond; reward: Reward }[] = [
  { if: ELFES, reward: { gifts: cards('lyra', 'archer_bois*2', 'eclaireur_elfe'), lines: { gifts: { who: SYL, text: 'Lyra et mes archers marcheront à tes côtés, Prince. La forêt n’oublie pas qui l’a défendue.' } } } },
  { if: NOMADES, reward: { gifts: cards('al_mansur', 'chamelier*2', 'jeune_nomade'), lines: { gifts: { who: ZAHRA, text: 'Al-Mansur et ses cavaliers sont à toi. Ne nous fais pas regretter d’avoir choisi un roi.' } } } },
  { if: DEMONS, reward: { gifts: cards('archidemon_origines', 'cultiste*2', 'sorciere_pacte'), lines: { gifts: { who: ARCHI, text: 'Je marcherai avec toi, petit prince. Le Cercle se souvient d’un temps où Morvak rampait à nos pieds.' } } } },
];

export const COURONNE_SCENARIOS: Record<string, CampaignScenario> = {
  // =============================== Acte 1 ===============================
  cc1: {
    id: 'cc1',
    title: 'La Couronne — 1. La nuit du coup d’État',
    deckRules: { min: 20, text: 'Minimum 20 cartes. Maximilien (avant) doit survivre jusqu’au début du tour 8. Les gardes sous l’emprise de Morvak reviennent à eux quand leur Moral se brise : ils changent de camp, et ceux libérés te rejoignent.' },
    intro: say(
      'Le palais impérial, au cœur de la nuit. Le conseil vient de s’achever quand l’Impératrice s’effondre sur son trône.',
      [OCT, 'Maximilien… les voix… elles ne se taisent plus…'],
      [MOR, 'Sa Majesté est souffrante. Gardes ! Le prince a empoisonné sa mère. Arrêtez-le.'],
      [CAP, 'Les gardes ont les yeux vides, mon prince. Ce ne sont plus nos hommes. Tenez jusqu’à l’aube, nous ouvrirons une issue.'],
      [MAX, 'Ne les tuez pas si vous pouvez l’éviter. Brisez leur volonté : c’est Morvak qui les tient.'],
    ),
    victoryDialog: [
      ...say(
        'L’aube se lève sur le palais. La poterne nord est ouverte, mais des cris montent derrière vous.',
        [CAP, 'C’est le Légat Varro. Il tient la porte seul pour couvrir notre fuite. Ils vont le prendre.'],
      ),
      { who: MAX, text: 'Je ne peux pas le laisser… mais chaque minute ici nous coûte la route.',
        choices: [
          { label: 'Retourner chercher Varro (la poursuite sera plus dure)', set: ['varro:sauve'] },
          { label: 'Fuir sans lui : la couronne d’abord', set: ['varro:perdu'] },
        ] },
      ...when({ all: ['varro:sauve'] }, { who: VARRO, text: 'Vous êtes revenu… Un prince qui revient pour un vieux soldat. Ma lame est à vous, Altesse.' }),
      ...when({ all: ['varro:perdu'] }, { who: '', text: 'Les portes se referment sur Varro. Le dernier regard qu’il vous lance n’est pas un reproche.' }),
    ],
    A: { faction: 'empire', label: 'Garde fidèle', deckList: START_POOL, ai: false, start: { avant: { '1': 'maximilien', '2': 'garde_capitale' } } },
    B: { faction: 'empire', label: 'Gardes sous l’emprise', deckList: GARDE_EMPRISE, ai: true, start: { avant: { '1': 'garde_capitale', '2': 'garde_capitale' } } },
    mustSurvive: { A: 'maximilien' },
    winAtTurn: { A: 8 },
    liberation: { pid: 'B', cardIds: ['lancier_emp', 'garde_capitale', 'recrue_imp', 'soldat_kragz'] },
    defeatLassitude: { A: 40, B: 45 },
    noRegimentDefeatFromTurn: { A: 2, B: NO_LIMIT },
    events: [
      { turn: 3, pid: 'B', dialog: say([MOR, 'Obéissez. Vous n’avez plus d’autre voix que la mienne.']) },
      { turn: 5, pid: 'B', resource: 2, spawn: [{ cardId: 'garde_capitale', zone: 'avant', idx: 0 }], dialog: say([MOR, 'D’autres gardes. Il y en aura toujours d’autres.']) },
    ],
    reward: {
      gifts: cards('maximilien'),
      lines: { gifts: { who: CAP, text: 'Désormais, c’est vous qui menez l’armée, Altesse. Maximilien rejoint ton pool de cartes.' } },
    },
    next: [{ to: 'cc2' }],
  },
  cc2: {
    id: 'cc2',
    title: 'La Couronne — 2. La route de l’exil',
    deckRules: { min: 20, text: 'Minimum 20 cartes. Escorte le convoi des fidèles (rang arrière) : il avance d’une case tous les deux tours et la victoire est à toi quand il quitte le terrain. S’il est détruit, c’est la défaite.' },
    intro: [
      ...say(
        'La route du nord serpente entre les collines. Derrière le convoi des fidèles, la poussière de la poursuite.',
        [CAP, 'La cavalerie de la garde. Ils ne nous laisseront pas atteindre la frontière.'],
        [MAX, 'Alors ils devront passer par nous.'],
      ),
      ...when({ all: ['varro:sauve'] }, { who: VARRO, text: 'Mes chevaliers fermeront la marche. J’ai une dette envers vous.' }),
    ],
    victoryDialog: say(
      'Le convoi franchit le vieux pont de pierre. Au loin, les murailles du fort de la frontière.',
      [CAP, 'Des messagers nous y attendent. Des Elfes, des Nomades… et autre chose. Quelque chose qui sent le soufre.'],
      [MAX, 'Nous écouterons tout le monde. Morvak, lui, n’écoute personne.'],
    ),
    A: { faction: 'empire', label: 'Convoi des fidèles', ai: false, start: { arriere: { '0': 'convoi' } } },
    B: { faction: 'empire', label: 'Cavalerie de poursuite', deckList: POURSUITE, ai: true, start: { avant: { '1': 'cavaliers_garde', '2': 'recrue_imp' } } },
    convoy: { cardId: 'convoi', pid: 'A', firstTurn: 2, every: 2 },
    mustSurvive: { A: 'convoi' },
    defeatLassitude: { A: 40, B: 45 },
    noRegimentDefeatFromTurn: { A: NO_LIMIT, B: NO_LIMIT },
    events: [
      { turn: 3, pid: 'A', if: { all: ['varro:sauve'] }, spawn: [{ cardId: 'chevalier_prov', zone: 'avant', idx: 3 }], dialog: say([VARRO, 'Chevaliers ! Pour le prince !']) },
      { turn: 3, pid: 'B', if: { all: ['varro:perdu'] }, resource: 2, spawn: [{ cardId: 'cavaliers_garde', zone: 'avant', idx: 0 }],
        dialog: say([MOR, 'Varro m’a tout dit, petit prince. Votre route, vos haltes, vos peurs.']) },
      { turn: 5, pid: 'B', spawn: [{ cardId: 'cavaliers_garde', zone: 'avant', idx: 3 }] },
    ],
    next: [{ to: 'cc3' }],
  },
  cc3: {
    id: 'cc3',
    title: 'La Couronne — 3. Le conseil des frontières',
    deckRules: { min: 20, text: 'Minimum 20 cartes. Les envoyés des trois peuples combattent à tes côtés (déjà en jeu). À la fin, tu choisiras ton allié : son peuple rejoindra tes Volontaires pour toute la suite.' },
    intro: say(
      'Le fort de la frontière. Trois envoyés attendent : Lyra pour les Royaumes elfiques, un cavalier de Cheikha Zahra, et un acolyte du Cercle ancestral.',
      [LYRA, 'Sylvain se souvient de la guerre que l’Empire nous a faite. Il veut savoir qui l’a voulue.'],
      [ACO, 'Le Cercle se souvient de Morvak quand il n’était qu’un novice. Il a volé ce qui ne lui appartenait pas.'],
      [MAX, 'Morvak a poussé l’Empire contre vous tous. Je…'],
      'Des cris. Des silhouettes encapuchonnées escaladent les remparts.',
      [CAP, 'Des assassins du culte ! Ils visent les envoyés !'],
    ),
    victoryDialog: [
      ...say(
        'Les assassins gisent dans la cour. Les trois envoyés ont combattu côte à côte, sans se regarder.',
        [LYRA, 'Sylvain t’offre sa forêt et ses archers, Prince. Mais il veut une paix signée, pas une promesse.'],
        [ALM, 'Le désert te prête ses lances. Zahra demande une seule chose : que plus jamais une Légion ne foule nos dunes.'],
        [ACO, 'Le Cercle ancestral t’offre l’Archidémon des Origines. Il n’y a pas de prix… pas encore.'],
      ),
      { who: MAX, text: 'Je ne peux pas suivre trois routes. Avec qui marchons-nous ?',
        choices: [
          { label: 'Les Elfes de Sylvain et Lyra', set: ['allie:elfes'] },
          { label: 'Les Nomades de Cheikha Zahra et Al-Mansur', set: ['allie:nomades'] },
          { label: 'Le Cercle ancestral et l’Archidémon des Origines', set: ['allie:demons'] },
        ] },
      ...when(ELFES, { who: LYRA, text: 'Alors suis-moi. Les sources de la forêt sont noires depuis des semaines : Morvak y a laissé sa marque.' }),
      ...when(NOMADES, { who: ALM, text: 'Alors en selle. Morvak paie ses mercenaires avec l’or du trésor impérial, et cet or traverse notre désert.' }),
      ...when(DEMONS, { who: ARCHI, text: 'Un choix courageux, ou désespéré. Les deux me conviennent.' }),
    ],
    A: { faction: 'empire', label: 'Le conseil des frontières', ai: false, start: { avant: { '0': 'eclaireur_elfe', '3': 'jeune_nomade' }, arriere: { '1': 'sorciere_pacte' } } },
    B: { faction: 'demons', label: 'Assassins du culte', deckList: ASSASSINS, ai: true, start: { avant: { '1': 'cultiste', '2': 'chien_infernal' } } },
    defeatLassitude: { A: 45, B: 40 },
    events: [
      { turn: 4, pid: 'B', resource: 2, spawn: [{ cardId: 'demon_akantha', zone: 'avant', idx: 2 }], dialog: say([ACO, 'Un démon d’Akantha ! Ils ont ouvert une brèche !']) },
    ],
    rewardVariants: ALLY_GIFTS,
    next: [{ if: ELFES, to: 'ce4' }, { if: NOMADES, to: 'cn4' }, { if: DEMONS, to: 'cd4' }],
  },
  // =============================== Acte 2 — Elfes ===============================
  ce4: {
    id: 'ce4',
    title: 'La Couronne — 4. Les sources noires',
    deckRules: { min: 25, text: 'Minimum 25 cartes. La nuit tombe aux tours 3-4, 7-8… : les Démons y gagnent +10 ATK ; le jour, les Elfes gagnent +15 INI.' },
    intro: say(
      'Les sources sacrées de la forêt suintent une eau noire. Des cultistes chantent autour d’une fontaine corrompue.',
      [SYL, 'Chaque nuit, la souillure s’étend. Chaque nuit, mes arbres oublient leur nom.'],
      [LYRA, 'Frappe pendant le jour, Prince. La nuit leur appartient.'],
    ),
    victoryDialog: say(
      'La source se trouble, puis s’éclaircit. Un murmure court dans les feuilles.',
      [SYL, 'Merci. Mais ce n’est qu’une source. Morvak a pris des nôtres : ils chassent pour lui, les yeux vides.'],
    ),
    A: { faction: 'empire', label: 'L’armée du prince', ai: false },
    B: { faction: 'demons', label: 'Cultistes des sources', deckList: SOURCES_NOIRES, ai: true, start: { avant: { '1': 'cultiste', '2': 'fanatiques' } } },
    weather: { kind: 'nuit', first: 3, every: 4, duration: 2 },
    defeatLassitude: { A: 45, B: 45 },
    events: [{ turn: 3, pid: 'B', dialog: say([MOR, 'Entends-tu la forêt, petit prince ? Elle chante pour moi maintenant.']) }],
    next: [{ to: 'ce5' }],
  },
  ce5: {
    id: 'ce5',
    title: 'La Couronne — 5. La forêt captive',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Les Elfes sous l’emprise reviennent à eux quand leur Moral se brise : ils changent de camp, et ceux libérés rejoignent ton pool.' },
    intro: say(
      'Au cœur de la forêt, des archers elfes montent la garde aux côtés de légionnaires. Leurs yeux sont vides.',
      [LYRA, 'Ce sont mes frères. Ne les tue pas, Prince. Brise ce qui les tient.'],
      [MAX, 'Nous ferons comme au palais. On ne gagne pas une guerre en tuant ceux qu’on veut sauver.'],
    ),
    victoryDialog: say(
      'Les archers libérés tombent à genoux, puis se relèvent un à un.',
      [SYL, 'La forêt te doit beaucoup. Il reste le col des brumes : la Légion de Morvak y passe pour rejoindre la capitale.'],
    ),
    A: { faction: 'empire', label: 'L’armée du prince', ai: false },
    B: { faction: 'empire', label: 'Chasseurs sous l’emprise', deckList: FORET_CAPTIVE, ai: true, start: { avant: { '1': 'eclaireur_elfe', '2': 'recrue_imp' }, arriere: { '1': 'archer_bois' } } },
    liberation: { pid: 'B', cardIds: ['archer_bois', 'eclaireur_elfe', 'sentinelle_cimes'] },
    defeatLassitude: { A: 50, B: 45 },
    events: [],
    next: [{ to: 'ce6' }],
  },
  ce6: {
    id: 'ce6',
    title: 'La Couronne — 6. Le col des brumes',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Tiens le col jusqu’au début du tour 10 : la Légion ne doit pas passer.' },
    intro: say(
      'Le col des brumes, seule route entre la forêt et la capitale. La Légion de Morvak arrive en colonnes serrées.',
      [SYL, 'Mes racines tiendront les rochers. À toi de tenir les hommes.'],
      [MAX, 'Ce sont des soldats de l’Empire. Mes soldats. Je les arrêterai, et je les ramènerai.'],
    ),
    victoryDialog: say(
      'La Légion recule dans la brume. Le col est à vous.',
      [SYL, 'La route de la capitale est ouverte. La forêt marchera avec toi jusqu’à ses portes.'],
    ),
    A: { faction: 'empire', label: 'L’armée du prince', ai: false },
    B: { faction: 'empire', label: 'Légion de Morvak', deckList: COL_BRUMES, ai: true, start: { avant: { '0': 'soldat_kragz', '1': 'chevaliers_ordre', '2': 'lancier_emp', '3': 'soldat_kragz' } } },
    winAtTurn: { A: 10 },
    defeatLassitude: { A: 45, B: 50 },
    events: [
      { turn: 3, pid: 'B', resource: 2 },
      { turn: 5, pid: 'B', resource: 3, spawn: [{ cardId: 'cuirassiers_lourds', zone: 'avant', idx: 0 }], dialog: say([CMD, 'Les cuirassiers en tête ! Ouvrez-moi ce col !']) },
    ],
    next: [{ to: 'cc7' }],
  },
  // =============================== Acte 2 — Nomades ===============================
  cn4: {
    id: 'cn4',
    title: 'La Couronne — 4. L’or de Morvak',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Terrain plus long (6/5). Détruis le convoi d’or (rang arrière adverse, il avance tous les deux tours) avant qu’il quitte le terrain. Tu ne perds pas si ta pioche est vide.' },
    layout: { avant: 6, arriere: 5 },
    intro: say(
      'Un convoi de chariots lourds traverse le grand erg, escorté par la Légion. Dans les coffres, le trésor impérial.',
      [ALM, 'Avec cet or, Morvak paie ses mercenaires. Sans lui, ils rentreront chez eux.'],
      [MAX, 'L’or de ma mère. Prenons-le.'],
    ),
    victoryDialog: say(
      'Les chariots versent dans le sable. L’or impérial roule entre les dunes.',
      [ZAHRA, 'Les tribus garderont la moitié. L’autre servira ta guerre. C’est le prix du désert.'],
      [ALM, 'Morvak se venge déjà : il empoisonne les puits du sud.'],
    ),
    A: { faction: 'empire', label: 'L’armée du prince', ai: false },
    B: { faction: 'empire', label: 'Convoi du trésor', deckList: TRESOR, ai: true,
      start: { avant: { '0': 'soldat_kragz', '1': 'lancier_emp', '2': 'legionnaire_desert' }, arriere: { '0': 'convoi', '1': 'archer_imp' } } },
    convoy: { cardId: 'convoi', pid: 'B', firstTurn: 2, every: 2 },
    startOverrides: { convoi: { mor: 25 } },
    mustSurvive: { B: 'convoi' },
    emptyDeckDefeat: { A: false },
    defeatLassitude: { A: 45, B: 50 },
    noRegimentDefeatFromTurn: { A: 2, B: NO_LIMIT },
    events: [],
    next: [{ to: 'cn5' }],
  },
  cn5: {
    id: 'cn5',
    title: 'La Couronne — 5. Le puits empoisonné',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Le Puits (rang arrière) est vital : il te rapporte 1 ressource par tour, mais s’il tombe, c’est la défaite. Tiens jusqu’au début du tour 9.' },
    intro: say(
      'Le dernier puits pur du sud. Des cultistes approchent avec des jarres de poison.',
      [ZAHRA, 'Si ce puits meurt, mon peuple meurt avec lui. Et ta guerre avec.'],
      [MAX, 'Personne ne touchera à cette eau.'],
    ),
    victoryDialog: say(
      'Les cultistes fuient dans les dunes. Le puits est sauf.',
      [ALM, 'Une dernière épreuve : la Légion se replie vers la capitale à travers la tempête. Si elle passe, elle tiendra les murailles.'],
    ),
    A: { faction: 'empire', label: 'L’armée du prince', ai: false, start: { arriere: { '1': 'puits_sel_amar' } } },
    B: { faction: 'demons', label: 'Empoisonneurs du culte', deckList: PUITS_EMPOISONNE, ai: true, start: { avant: { '1': 'cultiste', '2': 'chien_infernal' } } },
    mustSurvive: { A: 'puits_sel_amar' },
    winAtTurn: { A: 9 },
    emptyDeckDefeat: { A: false },
    defeatLassitude: { A: 45, B: 45 },
    noRegimentDefeatFromTurn: { A: NO_LIMIT, B: NO_LIMIT },
    events: [{ turn: 4, pid: 'B', resource: 2, spawn: [{ cardId: 'esclave_guerrier', zone: 'avant', idx: 0 }, { cardId: 'esclave_guerrier', zone: 'avant', idx: 3 }] }],
    next: [{ to: 'cn6' }],
  },
  cn6: {
    id: 'cn6',
    title: 'La Couronne — 6. La tempête',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Une tempête souffle aux tours 2, 5, 8… : les régiments non Nomades perdent Distance et 20 INI.' },
    intro: say(
      'Le vent se lève sur le grand erg. La Légion de Morvak tente de rejoindre la capitale avant la tempête.',
      [ALM, 'Le sable est notre allié. Frappe quand il vole.'],
    ),
    victoryDialog: say(
      'La Légion disparaît dans la tempête. Quand le vent tombe, la route de la capitale est libre.',
      [ZAHRA, 'Le désert a tenu parole. Tiens la tienne, Prince : plus jamais de Légion chez nous.'],
      [MAX, 'Tu as ma parole. Et bientôt, celle de l’Empire.'],
    ),
    A: { faction: 'empire', label: 'L’armée du prince', ai: false },
    B: { faction: 'empire', label: 'Légion de Morvak', deckList: TEMPETE, ai: true, start: { avant: { '1': 'legionnaire_desert', '2': 'legionnaire_desert' } } },
    weather: { kind: 'tempete', first: 2, every: 3, duration: 1 },
    emptyDeckDefeat: false,
    defeatLassitude: { A: 45, B: 50 },
    events: [],
    next: [{ to: 'cc7' }],
  },
  // =============================== Acte 2 — Démons (le Cercle ancestral) ===============================
  cd4: {
    id: 'cd4',
    title: 'La Couronne — 4. Le prix du pacte',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Le pacte a un prix : tu gagnes 1 lassitude à la fin de chacun de tes tours.' },
    intro: say(
      'Le campement du Cercle, dans les ruines d’un temple oublié. Des éclaireurs elfes ont suivi ta trace.',
      [ARCHI, 'Les Elfes chassent tout ce qui sent le soufre. Ce soir, cela te comprend.'],
      [MAX, 'Je ne veux pas de guerre avec Sylvain.'],
      [ARCHI, 'Lui en veut une avec toi. Le pacte a un prix, petit prince : chaque tour, ton armée s’use un peu plus.'],
    ),
    victoryDialog: say(
      'Les chasseurs elfes se replient. Un archer blessé crache au sol en passant.',
      [ARCHI, 'Tu as hésité à frapper. C’est touchant. Morvak, lui, n’hésitera pas.'],
      [ACO, 'Le culte prépare un rituel dans les catacombes. S’il s’achève, le dragon noir s’éveillera.'],
    ),
    A: { faction: 'empire', label: 'L’armée du prince', ai: false },
    B: { faction: 'elfe', label: 'Chasseurs de Sylvain', deckList: PATROUILLE_ELFE, ai: true, start: { avant: { '1': 'eclaireur_elfe' }, arriere: { '1': 'archer_bois' } } },
    endTurnLassitude: { A: 1 },
    defeatLassitude: { A: 50, B: 45 },
    events: [],
    next: [{ to: 'cd5' }],
  },
  cd5: {
    id: 'cd5',
    title: 'La Couronne — 5. Le rituel des catacombes',
    deckRules: { min: 25, text: 'Minimum 25 cartes. L’œuf rituel du Cercle (rang arrière) doit survivre jusqu’au début du tour 9 : il détourne le rituel de Morvak.' },
    intro: say(
      'Sous la capitale, les catacombes résonnent de chants. Le Cercle a apporté son propre œuf, pour détourner le rituel.',
      [ARCHI, 'Tant que notre œuf vit, leur rituel se nourrit de lui et non du dragon. Protège-le.'],
    ),
    victoryDialog: say(
      'Le rituel s’effondre. Mais au-dessus de vous, la terre tremble : le dragon noir s’est éveillé à moitié.',
      [ARCHI, 'Il est faible, et furieux. C’est maintenant ou jamais.'],
    ),
    A: { faction: 'empire', label: 'L’armée du prince', ai: false, start: { arriere: { '1': 'oeuf_rituel' } } },
    B: { faction: 'demons', label: 'Secte de Morvak', deckList: SECTE, ai: true, start: { avant: { '1': 'cultiste', '2': 'fanatiques' } } },
    mustSurvive: { A: 'oeuf_rituel' },
    winAtTurn: { A: 9 },
    defeatLassitude: { A: 45, B: 45 },
    noRegimentDefeatFromTurn: { A: NO_LIMIT, B: NO_LIMIT },
    events: [{ turn: 5, pid: 'B', resource: 3, spawn: [{ cardId: 'demon_akantha', zone: 'avant', idx: 0 }], dialog: say([MOR, 'Tu joues avec le feu du Cercle, petit prince. Il te brûlera.']) }],
    next: [{ to: 'cd6' }],
  },
  cd6: {
    id: 'cd6',
    title: 'La Couronne — 6. Le dragon noir',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Détruis le Dragon Infernal (rang avant adverse) pour gagner.' },
    intro: say(
      'Le dragon noir né des œufs volés s’arrache aux fondations de la capitale. Ses écailles fument encore.',
      [ARCHI, 'Morvak l’a fait naître. Moi, je peux le faire mourir. Mais c’est ton armée qui devra frapper.'],
    ),
    victoryDialog: say(
      'Le dragon s’effondre dans un fracas de pierre et de flammes.',
      [ARCHI, 'Voilà. La capitale est à ta portée. N’oublie pas qui t’y a conduit.'],
      [MAX, 'Je n’oublie rien. C’est bien ce qui m’inquiète.'],
    ),
    A: { faction: 'empire', label: 'L’armée du prince', ai: false },
    B: { faction: 'demons', label: 'Le nid du dragon', deckList: NID_DU_DRAGON, ai: true, start: { avant: { '0': 'gardien_chaines', '1': 'dragon_infernal', '2': 'bourreau_abime', '3': 'gardien_chaines' } } },
    mustSurvive: { B: 'dragon_infernal' },
    defeatLassitude: { A: 45, B: 50 },
    events: [],
    next: [{ to: 'cc7' }],
  },
  // =============================== Acte 3 ===============================
  cc7: {
    id: 'cc7',
    title: 'La Couronne — 7. Les portes de la capitale',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Les tours de garde (rang arrière adverse) sont très solides : perce la ligne avant pour les atteindre.' },
    intro: [
      ...say(
        'Les murailles de la capitale. Sur les remparts, des soldats aux yeux vides et les bannières de Morvak.',
        [CAP, 'Les portes sont scellées par la magie du culte. Il faudra un siège.'],
      ),
      ...when(ELFES, { who: SYL, text: 'Mes racines fissureront la pierre. Donne-moi du temps.' }),
      ...when(NOMADES, { who: ALM, text: 'Mes cavaliers frapperont dès qu’une brèche s’ouvrira.' }),
      ...when(DEMONS, { who: ARCHI, text: 'Ces portes m’ont repoussé il y a mille ans. Pas cette fois.' }),
      ...when({ all: ['varro:sauve'] }, { who: VARRO, text: 'Je connais une poterne. Laissez-moi trois tours.' }),
    ],
    victoryDialog: say(
      'Les portes cèdent. La ville s’ouvre devant vous, silencieuse.',
      [MAX, 'Le palais. Morvak est dans la salle du trône. Ma mère aussi.'],
    ),
    A: { faction: 'empire', label: 'L’armée du prince', ai: false },
    B: { faction: 'empire', label: 'Garnison de Morvak', deckList: CAPITALE, ai: true,
      start: { avant: { '0': 'chevalier_templier', '1': 'garde_capitale', '2': 'garde_capitale', '3': 'recrue_imp' }, arriere: { '0': 'garnison', '1': 'arbaletrier_imp', '2': 'garnison' } } },
    defeatLassitude: { A: 45, B: 50 },
    events: [
      { turn: 3, pid: 'A', if: { all: ['varro:sauve'] }, spawn: [{ cardId: 'chevalier_prov', zone: 'avant', idx: 0 }, { cardId: 'chevalier_prov', zone: 'avant', idx: 3 }],
        dialog: say([VARRO, 'La poterne est ouverte ! Chevaliers, à moi !']) },
      { turn: 4, pid: 'B', resource: 3, spawn: [{ cardId: 'soldat_kragz', zone: 'avant', idx: 1 }], dialog: say([MOR, 'Entrez, petit prince. Je vous attendais.']) },
    ],
    next: [{ to: 'cc8' }],
  },
  cc8: {
    id: 'cc8',
    title: 'La Couronne — 8. La salle du trône',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Abats le Hiérophante Morvak (rang arrière adverse, derrière sa garde) pour gagner. Capacocha l’insatiable le soutient.' },
    intro: [
      ...say(
        'La salle du trône. Octavia, immobile sur son trône, les yeux fixés sur rien. À ses côtés, Morvak. Derrière lui, une ombre immense : Capacocha.',
        [MOR, 'Votre mère ne m’a jamais aussi bien obéi qu’aujourd’hui, Altesse.'],
        [CAPA, 'Une capitale entière… Tant d’âmes. Livre-la-moi, Morvak, comme tu l’as promis.'],
        [MAX, 'Personne ne sera livré à personne. Pas ce soir.'],
      ),
      ...when({ all: ['octavia:remede'] }, { who: '', text: 'Dans ta besace, la fiole du sanctuaire de la Source. Il faudra atteindre Octavia.' }),
    ],
    victoryDialog: [
      ...say(
        'Morvak s’effondre. L’ombre de Capacocha se dissipe en hurlant. Dans la salle, les soldats clignent des yeux, comme au sortir d’un rêve.',
      ),
      ...when({ all: ['octavia:remede'] },
        { who: OCT, text: 'Maximilien… les voix se sont tues. J’ai vu tout ce qu’il m’a fait faire. Tout.' },
        { who: OCT, text: 'Je n’ai plus la force de porter cette couronne. Elle est à toi, si tu la veux.' }),
      ...when({ none: ['octavia:remede'] },
        { who: '', text: 'Octavia s’éteint dans les bras de son fils, libérée trop tard. La couronne roule au pied du trône.' }),
      ...when(DEMONS, { who: ARCHI, text: 'Ramasse-la, petit prince. Le Cercle a tenu parole. Le trône a tenu la sienne.' }),
      { who: MAX, text: 'La couronne est là, à mes pieds. Tous me regardent.',
        choices: [
          { label: 'Prendre la couronne', set: ['fin:couronne'] },
          { label: 'Refuser la couronne', set: ['fin:refus'] },
        ] },
    ],
    A: { faction: 'empire', label: 'L’armée du prince', ai: false },
    B: { faction: 'demons', label: 'Morvak et Capacocha', deckList: TRONE, ai: true,
      start: { avant: { '0': 'gardien_chaines', '1': 'bourreau_abime', '2': 'demon_akantha', '3': 'gardien_chaines' }, arriere: { '0': 'morvak', '2': 'capacocha' } } },
    mustSurvive: { B: 'morvak' },
    defeatLassitude: { A: 50, B: NO_LIMIT },
    noRegimentDefeatFromTurn: { A: 2, B: NO_LIMIT },
    events: [
      { turn: 2, pid: 'A', if: { all: ['legion:ralliee'] }, spawn: [{ cardId: 'soldat_kragz', zone: 'avant', idx: 0 }, { cardId: 'soldat_kragz', zone: 'avant', idx: 3 }],
        dialog: say([VARRO, 'La Légion est avec vous, Altesse ! Toute la Légion !']) },
      { turn: 3, pid: 'B', resource: 3, spawn: [{ cardId: 'fanatiques', zone: 'avant', idx: 1 }], dialog: say([MOR, 'À genoux. Tous. Vous n’avez plus d’autre voix que la mienne.']) },
      { turn: 4, pid: 'A', if: { all: ['forteresse:libre'] }, spawn: [{ cardId: 'forteresse', zone: 'avant', idx: 1 }],
        dialog: say('La verrière explose. Un dragon d’acier et de pierre se pose devant le trône.', [FORT, 'La famille impériale est sous ma garde depuis avant l’Empire. Recule, prêtre.']) },
      { turn: 5, pid: 'A', if: { all: ['octavia:remede'] }, spawn: [{ cardId: 'imperatrice_octavia', zone: 'arriere', idx: 1 }],
        dialog: say([OCT, 'Maximilien… La fiole… Je me souviens de mon nom. Gardes ! À votre Impératrice !']) },
      { turn: 6, pid: 'B', resource: 3, spawn: [{ cardId: 'bourreau_abime', zone: 'avant', idx: 2 }], dialog: say([CAPA, 'Plus d’âmes ! Encore ! Livre-les-moi !']) },
    ],
  },
  // =============================== Missions secondaires ===============================
  cs_forteresse: {
    id: 'cs_forteresse',
    side: true,
    title: 'Mission secondaire — Le dragon sous la citadelle',
    deckRules: { min: 20, text: 'Minimum 20 cartes. Forteresse, enchaînée par le culte, combat contre toi. Brise son Moral (sans la détruire) pour rompre l’emprise : elle change de camp et rejoint ton pool. Détruite, elle est perdue.' },
    intro: say(
      'Sous la vieille citadelle, des chaînes grosses comme des troncs retiennent un dragon d’acier et de pierre.',
      [CAP, 'Forteresse. Le gardien de votre famille, Altesse, depuis avant même que l’Empire ait un nom.'],
      [MAX, 'Morvak l’a enchaîné. Il savait qu’il ne pourrait jamais le soumettre.'],
      [CAP, 'Les chaînes le tiennent quand même. Il nous attaquera. Brisez sa volonté sans le tuer.'],
    ),
    victoryDialog: [
      ...when({ all: ['forteresse:libre'] },
        { who: FORT, text: 'Tu as le regard de ta mère, et celui de sa mère avant elle. Je viendrai quand tu m’appelleras, petit d’homme.' },
        { who: '', text: 'Forteresse rejoint ton pool. Elle viendra aussi d’elle-même au dernier combat.' }),
      ...when({ none: ['forteresse:libre'] },
        { who: CAP, text: 'Il est tombé… Nous n’avons pas su le libérer. Que les ancêtres nous pardonnent.' }),
    ],
    A: { faction: 'empire', label: 'L’armée du prince', ai: false },
    B: { faction: 'demons', label: 'Geôliers du culte', deckList: GEOLIERS, ai: true, start: { avant: { '1': 'forteresse', '2': 'cultiste' } } },
    liberation: { pid: 'B', cardIds: ['forteresse'] },
    onLiberated: 'forteresse:libre',
    defeatLassitude: { A: 45, B: 45 },
    events: [],
  },
  cs_remede: {
    id: 'cs_remede',
    side: true,
    title: 'Mission secondaire — Le remède de la Source',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Le Clerc de la Forêt (emplacement isolé) prépare le remède : il doit survivre jusqu’au début du tour 9.' },
    intro: say(
      'Un sanctuaire oublié, où coule encore une eau qui guérit l’esprit. Le culte l’a trouvé aussi.',
      [MAX, 'Si la maladie de ma mère est l’emprise de Morvak, alors cette eau peut la rompre.'],
      [CAP, 'Le clerc a besoin de temps pour préparer la fiole. Protégez-le.'],
    ),
    victoryDialog: say(
      'La fiole est prête, d’un bleu pâle et tremblant.',
      [MAX, 'Il faudra atteindre ma mère. Jusque dans la salle du trône s’il le faut.'],
    ),
    A: { faction: 'empire', label: 'L’armée du prince', ai: false, start: { isole: 'clerc_foret' } },
    B: { faction: 'demons', label: 'Profanateurs du culte', deckList: SANCTUAIRE, ai: true, start: { avant: { '1': 'cultiste', '2': 'chien_infernal' } } },
    mustSurvive: { A: 'clerc_foret' },
    winAtTurn: { A: 9 },
    onWin: ['octavia:remede'],
    defeatLassitude: { A: 45, B: 45 },
    noRegimentDefeatFromTurn: { A: NO_LIMIT, B: NO_LIMIT },
    events: [],
  },
  cs_legion: {
    id: 'cs_legion',
    side: true,
    title: 'Mission secondaire — La Légion égarée',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Les légionnaires sous l’emprise reviennent à eux quand leur Moral se brise : ils changent de camp. Libère-en au moins un pour rallier la Légion au dernier combat.' },
    intro: say(
      'Un camp de la Légion, aux portes de la capitale. Les soldats montent la garde comme des statues.',
      [VARRO, 'Ce sont mes hommes. Si je les réveille, ils me suivront jusqu’au trône.'],
    ),
    victoryDialog: [
      ...when({ all: ['legion:ralliee'] }, { who: VARRO, text: 'Ils se souviennent. La Légion sera là quand vous entrerez dans la salle du trône.' }),
      ...when({ none: ['legion:ralliee'] }, { who: VARRO, text: 'Aucun ne s’est réveillé… Morvak les tient trop fort.' }),
    ],
    A: { faction: 'empire', label: 'L’armée du prince', ai: false },
    B: { faction: 'empire', label: 'Légion sous l’emprise', deckList: LEGION_EGAREE, ai: true, start: { avant: { '0': 'lancier_emp', '1': 'soldat_kragz', '2': 'soldat_kragz', '3': 'lancier_emp' } } },
    liberation: { pid: 'B', cardIds: ['soldat_kragz', 'lancier_emp', 'recrue_imp'] },
    onLiberated: 'legion:ralliee',
    defeatLassitude: { A: 45, B: 45 },
    events: [],
  },
};

export const COURONNE: CampaignDef = {
  id: 'couronne',
  title: 'La Couronne de cendres',
  faction: 'empire',
  rank: 5,
  pitch: 'Chassé de la capitale par Morvak, le prince Maximilien rassemble une coalition pour reprendre le trône. Tes choix décident de tes alliés… et de la fin.',
  start: 'cc1',
  // Longueur indicative d'une partie (8 combats principaux) : sert à l'affichage « combat k sur 8 ».
  order: ['cc1', 'cc2', 'cc3', 'ce4', 'ce5', 'ce6', 'cc7', 'cc8'],
  scenarios: COURONNE_SCENARIOS,
  hero: MAX,
  allies: { 'allie:elfes': 'elfe', 'allie:nomades': 'nomades', 'allie:demons': 'demons' },
  sides: [
    { id: 'cs_forteresse', at: ['cc2', 'cc3'] },
    { id: 'cs_remede', at: ['ce5', 'ce6', 'cn5', 'cn6', 'cd5', 'cd6'] },
    { id: 'cs_legion', at: ['cc7'], if: { all: ['varro:sauve'] } },
  ],
  talks: {
    cc2: say(
      [CAP, 'Nos hommes ont peur, Altesse. Ils ont vu leurs frères d’armes se retourner contre eux.'],
      [MAX, 'Dis-leur que je ne laisserai personne derrière. Pas même ceux que Morvak tient.'],
      'Au loin, sous la vieille citadelle, un grondement sourd fait trembler le sol.',
      [CAP, 'On raconte qu’un dragon y dort enchaîné. Si c’est Forteresse…'],
    ),
    cc3: say(
      [MAX, 'Trois peuples. Trois façons de reprendre ma couronne. Laquelle me laissera encore digne de la porter ?'],
      [CAP, 'Les Elfes veulent une paix, les Nomades une promesse, le Cercle… rien, pour l’instant. C’est ce qui m’inquiète.'],
    ),
    ce4: say([LYRA, 'Sylvain a combattu ton peuple il y a peu. Il ne sourit pas encore, mais il est là.'], [MAX, 'C’est déjà plus que je n’espérais.']),
    ce5: say([SYL, 'Mon peuple ne pardonne pas vite. Mais il se souvient de qui l’a aidé.'], [CAP, 'On parle d’un sanctuaire où l’eau guérit l’esprit. Peut-être un remède pour l’Impératrice.']),
    ce6: say([LYRA, 'Après le col, il n’y a plus que la capitale.'], [MAX, 'Et ma mère.']),
    cn4: say([ALM, 'Sais-tu monter, Prince ? Non ? Tu apprendras.'], [ZAHRA, 'Le désert ne prête rien. Il échange.']),
    cn5: say([ZAHRA, 'Les puits sont nos temples. Morvak le sait.'], [CAP, 'On parle d’un sanctuaire où l’eau guérit l’esprit. Peut-être un remède pour l’Impératrice.']),
    cn6: say([ALM, 'Après la tempête, la capitale. Tes murailles sont bien hautes pour des gens qui ont peur du sable.']),
    cd4: say([ARCHI, 'Tu dors mal, petit prince. C’est le soufre. On s’y fait.'], [CAP, 'Les hommes murmurent, Altesse. Ils n’aiment pas nos nouveaux alliés.']),
    cd5: say([ARCHI, 'Morvak était mon novice. Le plus doué. Le plus avide.'], [CAP, 'On parle d’un sanctuaire où l’eau guérit l’esprit. Peut-être un remède pour l’Impératrice.']),
    cd6: say([ARCHI, 'Le dragon est l’enfant de Morvak. Tuer l’enfant pour atteindre le père : c’est ainsi que se gagnent les guerres.'], [MAX, 'C’est ainsi qu’on les perd aussi.']),
    cc7: [
      ...say([CAP, 'Demain, les portes. Après-demain, peut-être, le trône.']),
      ...when({ all: ['varro:sauve'] }, { who: VARRO, text: 'Un camp de la Légion tient la route du sud. Mes anciens soldats. Si je pouvais les réveiller…' }),
    ],
    cc8: say([MAX, 'Ce soir, je retrouverai ma mère. Ou ce qu’il en reste.'], [CAP, 'Quoi qu’il arrive, Altesse, nous serons derrière vous.']),
    fin: say([CAP, 'C’est fini, Altesse. Enfin.']),
  },
  endings: [
    { id: 'trone-vide', if: { all: ['fin:refus'] }, title: 'Le trône vide',
      text: 'Maximilien pose la couronne sur le trône et ne la reprend pas. « Un seul homme a suffi à nous perdre ; il en faudra plus d’un pour nous relever. » Il réunit un conseil où l’Empire et les peuples qui l’ont suivi ont chacun une voix. Le trône reste vide, et c’est peut-être la première fois qu’il est juste. Mais les vieilles familles grondent, et on ne gouverne pas longtemps avec des promesses.' },
    { id: 'cendres', if: { all: ['allie:demons'] }, title: 'La Couronne de cendres',
      text: 'Maximilien ceint la couronne. Le peuple l’acclame, sans savoir qui l’a conduit jusque-là. Le soir du sacre, l’Archidémon des Origines vient chercher son dû : une place au conseil, et des âmes, chaque année, au solstice. L’Empire a un empereur juste, qui règne sur un pacte. Dans les catacombes, le Cercle ancestral attend son heure.' },
    { id: 'deux-peuples', if: { all: ['octavia:remede'] }, title: 'Les deux peuples',
      text: 'Octavia, guérie, abdique en faveur de son fils et signe elle-même la paix qu’elle n’avait jamais voulue. Maximilien est couronné devant les bannières de ses alliés, réunies pour la première fois sous le même toit. Forteresse veille sur le palais, comme toujours. Pour la première fois depuis des siècles, l’Empire a des alliés plutôt que des ennemis.' },
    { id: 'aube-grise', title: 'L’aube grise',
      text: 'Octavia repose dans la crypte impériale. Maximilien est couronné le lendemain, en habit de deuil. Il tient parole : la paix avec ses alliés est signée, et la Légion ne quittera plus les frontières. Mais le jeune empereur ne sourit plus, et chacun sait que la victoire est venue un jour trop tard.' },
  ],
  endTitle: 'La Couronne de cendres',
  endText: 'Morvak est tombé.',
};
