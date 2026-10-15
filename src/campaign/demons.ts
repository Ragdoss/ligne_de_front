// Campagne Démon — « Les Œufs du Dragon » : voler des œufs de dragon dans le désert et les livrer au culte de la capitale.
import { cards, NO_LIMIT, say } from './dsl';
import type { CampaignDef, CampaignScenario } from './types';

const H = 'Hiérophante Morvak';
const AC = 'Acolyte';

const START_POOL = cards('cultiste*6', 'chien_infernal*4', 'esclave_guerrier*3', 'diablotins*3', 'acolyte_damne*2', 'effroi_demoniaque*2', 'pacte_sang');

const NOMADES_NID = cards('jeune_nomade*4', 'frondeur_nomade*4', 'marchand_ombres*2', 'basilics_oasis*2', 'charmeur_basilics*2',
  'eleveur_basilics', 'embuscade*2', 'guide_desert*2', 'caravane_marchande*2');

const NOMADES_POURSUITE = cards('jeune_nomade*4', 'frondeur_nomade*4', 'marchand_ombres*3', 'cavaliers_dunes*2', 'basilics_oasis*2',
  'saboteur_nomade', 'frappez_ravitaillement*2', 'marche_noir', 'guide_desert*2', 'embuscade*2', 'caravane_marchande*2', 'archeotacticiens', 'volez_ravitaillement');

const EMPIRE_FRONTIERE = cards('recrue_imp*5', 'lancier_emp*3', 'archer_imp*3', 'soldat_kragz*2', 'lieutenant*3', 'porte_etendard*2',
  'ralliement*2', 'capitaine_garde*2', 'chevalier_prov*2');

const EMPIRE_CAPITALE = cards('recrue_imp*4', 'lancier_emp*3', 'archer_imp*3', 'soldat_kragz*3', 'chevalier_prov*2', 'capitaine_garde*2',
  'general_empire', 'formation_carre*2', 'ralliement*2', 'cadets_academie', 'chevalier_templier', 'ordre_haut_commandement');

const EMPIRE_GARDE = cards('recrue_imp*3', 'lancier_emp*3', 'arbaletrier_imp*2', 'soldat_kragz*3', 'chevalier_prov*3', 'capitaine_garde*2',
  'general_empire', 'aumonier_guerre', 'formation_carre*2', 'ralliement*2', 'chevalier_templier*2', 'ordre_haut_commandement', 'cavaliers_dragons_elite');

export const DEMON_SCENARIOS: Record<string, CampaignScenario> = {
  d1: {
    id: 'd1',
    title: 'Les Œufs — 1. Le nid des sables',
    deckRules: { min: 20, text: 'Minimum 20 cartes. Détruis la Gardienne du Nid pour t’emparer des œufs. Pas de défaite par pioche vide.' },
    intro: say(
      'Au cœur du désert, une Basilic géante couve les derniers œufs de dragon sauvages, gardée par les Nomades.',
      [H, 'Le culte attend son offrande depuis trop longtemps. Ces œufs seront à nous.'],
      [AC, 'La Gardienne est énorme, maître. Et les Nomades sont nombreux.'],
      [H, 'Alors offrez-leur vos frères. Un sacrifice ouvre toujours la voie.'],
    ),
    victoryDialog: say(
      'La Gardienne s’effondre dans le sable. Les œufs, encore tièdes, sont hissés sur un chariot.',
      [AC, 'Deux œufs intacts, maître !'],
      [H, 'Le désert est long jusqu’à l’Empire. Que personne ne les quitte des yeux.'],
    ),
    A: { faction: 'demons', label: 'Invocateurs de Démons', deckList: START_POOL, ai: false, start: { avant: { '1': 'cultiste' } } },
    B: { faction: 'nomades', label: 'Nomades du désert', deckList: NOMADES_NID, ai: true, start: { avant: { '1': 'gardienne_nid', '2': 'jeune_nomade' } } },
    mustSurvive: { B: 'gardienne_nid' },
    emptyDeckDefeat: false,
    defeatLassitude: { A: 45, B: 40 },
    noRegimentDefeatFromTurn: { A: 2, B: NO_LIMIT },
    events: [
      { turn: 4, pid: 'B', resource: 1, spawn: [{ cardId: 'basilics_oasis', zone: 'avant', idx: 3 }], dialog: say(['Nomade', 'Protégez la Gardienne ! Les Basilics de l’oasis arrivent !']) },
    ],
    reward: {
      gifts: cards('oeuf_dragon*2', 'fanatiques*2', 'ceremonie_declin'),
      lines: { gifts: { who: H, text: 'Les œufs voyageront avec nous. Ces fanatiques et cette cérémonie serviront le culte.' } },
    },
  },
  d2: {
    id: 'd2',
    title: 'Les Œufs — 2. La traversée du désert',
    deckRules: { min: 20, text: 'Minimum 20 cartes. Terrain plus long (6/5). Le Chariot des œufs doit traverser : s’il est détruit, c’est la défaite. Pas de défaite par pioche vide.' },
    layout: { avant: 6, arriere: 5 },
    intro: say(
      'Les Nomades ne pardonnent pas le vol. Leurs cavaliers harcèlent la colonne démoniaque à travers les dunes.',
      'Le Chariot des œufs avance d’une case tous les deux tours, de gauche à droite. Tu as deux Haltes du Convoi pour le retenir derrière tes troupes.',
      [H, 'Ils viseront vos mains et vos réserves, pas vos lames. Ne vous laissez pas affamer.'],
    ),
    victoryDialog: say(
      'Le chariot sort des dunes. Au loin, les tours de la frontière impériale.',
      [AC, 'Les Nomades abandonnent la poursuite.'],
      [H, 'Le plus dur commence. L’Empire garde ses frontières mieux que ses secrets.'],
    ),
    A: { faction: 'demons', label: 'Invocateurs de Démons', ai: false, start: { arriere: { '0': 'chariot_oeufs' } }, startHand: ['halte_convoi', 'halte_convoi'] },
    B: { faction: 'nomades', label: 'Nomades du désert', deckList: NOMADES_POURSUITE, ai: true, start: { avant: { '2': 'frondeur_nomade', '3': 'jeune_nomade' } } },
    convoy: { cardId: 'chariot_oeufs', pid: 'A', firstTurn: 3, every: 2 },
    mustSurvive: { A: 'chariot_oeufs' },
    emptyDeckDefeat: false,
    defeatLassitude: { A: 40, B: 40 },
    noRegimentDefeatFromTurn: { A: NO_LIMIT, B: NO_LIMIT },
    events: [
      { turn: 5, pid: 'B', resource: 2, spawn: [{ cardId: 'cavaliers_dunes', zone: 'avant', idx: 4 }, { cardId: 'cavaliers_dunes', zone: 'avant', idx: 5 }],
        dialog: say(['Cavalier des dunes', 'Rendez les œufs, ou le sable boira votre sang !']) },
    ],
    reward: {
      order: ['exchange', 'picks'],
      exchange: { from: 'cultiste', to: 'fanatiques', count: 2 },
      picks: { count: 2, unique: true, title: 'Récompense — Rites interdits', text: 'Choisis une carte à ajouter à ton pool',
        options: ['demon_akantha', 'dette_infernale', 'rancon_ames', 'banquet_infernal', 'suppot_infernal', 'pacte_survie', 'gargouille_cendres'] },
    },
  },
  d3: {
    id: 'd3',
    title: 'Les Œufs — 3. La frontière impériale',
    deckRules: { min: 20, text: 'Minimum 20 cartes. Chaque fin de tour te coûte 2 points de lassitude : le temps presse (mais Abîme Grandissant s’en nourrit).' },
    intro: say(
      'Un poste frontière barre la route. Si un messager atteint la capitale, le culte sera découvert.',
      [H, 'Chaque heure perdue rapproche l’alerte. Frappez vite, frappez fort.'],
      [AC, 'Et si nous tardons ?'],
      [H, 'Alors notre fatigue nourrira l’Abîme. Mais il ne nous attendra pas éternellement.'],
    ),
    victoryDialog: say(
      'Le poste tombe sans qu’un seul cavalier ne s’en échappe.',
      [H, 'Personne ne sait que nous sommes là. Gardons-le ainsi jusqu’aux égouts de la capitale.'],
    ),
    A: { faction: 'demons', label: 'Invocateurs de Démons', ai: false },
    B: { faction: 'empire', label: 'Poste frontière impérial', deckList: EMPIRE_FRONTIERE, ai: true, start: { avant: { '1': 'soldat_kragz', '2': 'recrue_imp' }, arriere: { '1': 'archer_imp' } } },
    startLevel: { A: 2 },
    endTurnLassitude: { A: 2 },
    defeatLassitude: { A: 50, B: 30 },
    noRegimentDefeatFromTurn: { A: 2, B: 3 },
    events: [
      { turn: 3, pid: 'B', resource: 2, dialog: say(['Sergent impérial', 'Des démons ! Tenez la ligne, envoyez quelqu’un à la capitale !']) },
    ],
    reward: {
      gifts: cards('veilleur_os', 'abime_grandissant'),
      picks: { count: 1, title: 'Récompense — Pactes', text: 'Choisis une carte à ajouter à ton pool', options: ['dette_infernale', 'rancon_ames', 'pacte_survie', 'gargouille_cendres', 'pretre_sacrificiel'] },
    },
  },
  d4: {
    id: 'd4',
    title: 'Les Œufs — 4. Les égouts de la capitale',
    deckRules: { min: 25, text: 'Minimum 25 cartes. La garde ne pose aucun régiment avant l’alarme : elle sonne au tour 5, ou dès que tu détruis un garde. Tu ne perds pas si ta pioche est vide.' },
    intro: say(
      'Sous la capitale impériale, les égouts mènent tout droit au temple caché du culte.',
      [AC, 'Deux gardes seulement, maître. Ils ne se doutent de rien.'],
      [H, 'Le premier qui tombe donnera l’alarme. Prépare tes forces avant de frapper… mais pas trop longtemps : la relève passe au tour 5.'],
    ),
    victoryDialog: say(
      'La garde des égouts est en déroute. Au-dessus, les cloches sonnent dans toute la ville.',
      [H, 'Qu’ils sonnent. L’offrande aura lieu cette nuit, au sommet de leur propre capitale.'],
    ),
    A: { faction: 'demons', label: 'Invocateurs de Démons', ai: false },
    B: { faction: 'empire', label: 'Garde de la capitale', deckList: EMPIRE_CAPITALE, ai: true, start: { avant: { '1': 'garde_capitale', '2': 'garde_capitale' } } },
    startLevel: { A: 3, B: 2 },
    emptyDeckDefeat: { A: false },
    alarm: {
      pid: 'B', turn: 5, resource: 3,
      spawn: [{ cardId: 'garde_capitale', zone: 'avant', idx: 0 }, { cardId: 'garde_capitale', zone: 'avant', idx: 3 }, { cardId: 'archer_imp', zone: 'arriere', idx: 1 }],
      dialog: say(['Capitaine de la garde', 'Alerte ! Des démons dans les égouts ! Toute la garde en bas !']),
    },
    defeatLassitude: { A: 55, B: 32 },
    noRegimentDefeatFromTurn: { A: 2, B: 6 },
    events: [],
    reward: {
      gifts: cards('maitre_chenil_infernal', 'seigneur_abysses'),
      picks: { count: 1, title: 'Récompense — Secrets du culte', text: 'Choisis une carte à ajouter à ton pool', options: ['tuteur_demoniaque', 'abime_grandissant', 'veilleur_os', 'oeuf_dragon'] },
    },
  },
  d5: {
    id: 'd5',
    title: 'Les Œufs — 5. L’offrande',
    deckRules: { min: 25, text: 'Minimum 25 cartes. L’Œuf de l’offrande est vital : protège-le jusqu’au début du tour 8 (fin du rituel), ou écrase la garde avant. Tu ne perds pas si ta pioche est vide.' },
    intro: say(
      'Au sommet du temple, le rituel commence. L’Œuf de l’offrande repose sur l’autel.',
      [H, 'Sept tours. Il faut sept tours au rituel. Tenez, quoi qu’il arrive.'],
      [AC, 'Maître… la garde impériale monte l’escalier. Et j’entends des ailes.'],
    ),
    victoryDialog: say(
      'La dernière incantation résonne. L’œuf se fend : un dragon noir aux yeux de braise déploie ses ailes au-dessus de la capitale.',
      [H, 'Le culte est servi. Que l’Empire contemple ce qu’il a nourri en son sein.'],
      'Dans l’ombre d’une tour, une éclaireuse elfe a tout vu. Elle repart vers la forêt, porteuse d’une terrible nouvelle.',
    ),
    A: { faction: 'demons', label: 'Invocateurs de Démons', ai: false, start: { arriere: { '1': 'oeuf_rituel' } } },
    B: { faction: 'empire', label: 'Garde impériale', deckList: EMPIRE_GARDE, ai: true,
      start: { avant: { '1': 'garde_capitale', '2': 'garde_capitale', '3': 'chevalier_prov' }, arriere: { '1': 'arbaletrier_imp' } } },
    mustSurvive: { A: 'oeuf_rituel' },
    winAtTurn: { A: 8 },
    emptyDeckDefeat: { A: false },
    startLevel: { A: 3, B: 3 },
    defeatLassitude: { A: 70, B: 45 },
    noRegimentDefeatFromTurn: { A: NO_LIMIT, B: 3 },
    events: [
      { turn: 6, pid: 'B', resource: 2, spawn: [{ cardId: 'dragon_imp', zone: 'avant', idx: 1 }], dialog: say(['Général impérial', 'Lâchez le Dragon Impérial ! Brisez cet autel !']) },
    ],
    reward: {
      gifts: cards('dragon_infernal'),
      lines: { gifts: { who: H, text: 'Le dragon est né. Il marchera désormais à nos côtés.' } },
    },
  },
};

export const DEMONS: CampaignDef = {
  id: 'demons',
  title: 'Les Œufs du Dragon',
  faction: 'demons',
  rank: 1,
  pitch: 'Vole des œufs de dragon dans le désert, traverse l’Empire et livre-les au culte caché au cœur de la capitale.',
  order: ['d1', 'd2', 'd3', 'd4', 'd5'],
  scenarios: DEMON_SCENARIOS,
  hero: H,
  talks: {
    d1: say(
      'Une grotte au bord du désert. Les braseros éclairent des symboles tracés au sang.',
      [AC, 'Le culte de la capitale a encore écrit, maître. Ils s’impatientent.'],
      [H, 'Ils auront leurs œufs. Les nids des Nomades ne sont qu’à deux jours d’ici.'],
      [AC, 'On dit que les Nomades se battent comme des voleurs : ils frappent vos réserves avant vos soldats.'],
      [H, 'Alors nous serons riches en chair. Les cultistes sont faits pour tomber.'],
    ),
    d2: say(
      [AC, 'Les œufs sont chargés. Le chariot grince à chaque dune.'],
      [H, 'Qu’il grince. Tant qu’il avance, nous avançons.'],
      [AC, 'Les guetteurs ont vu des cavaliers sur les crêtes.'],
      [H, 'Ils veulent nos cartes et notre patience. Garde toujours des troupes devant le chariot.'],
    ),
    d3: say(
      [AC, 'La frontière, maître. Un fortin, quelques archers, une bannière impériale.'],
      [H, 'Le temps est notre ennemi. Chaque nuit ici est une nuit de trop.'],
      [AC, 'Les frères disent que l’Abîme grandit avec notre fatigue.'],
      [H, 'C’est vrai. Mais même l’Abîme a un fond.'],
    ),
    d4: say(
      'Sous les remparts de la capitale, l’odeur des égouts couvre celle du soufre.',
      [AC, 'Deux gardes seulement à l’entrée. Ils jouent aux dés.'],
      [H, 'Laisse-les jouer. Prépare nos forces, puis frappe d’un coup : au premier cri, toute la garde descendra.'],
    ),
    d5: say(
      [AC, 'Le temple est prêt. Les fidèles chantent depuis l’aube.'],
      [H, 'Le rituel prendra sept tours. Sept tours où rien ne doit toucher l’œuf.'],
      [AC, 'Et après ?'],
      [H, 'Après, l’Empire saura qui le gouverne vraiment.'],
    ),
    fin: say(
      'Le dragon noir tourne au-dessus de la capitale en flammes. Le culte exulte.',
      [AC, 'Nous avons réussi, maître.'],
      [H, 'Nous avons commencé. Et quelque part dans la forêt, quelqu’un vient d’apprendre notre nom.'],
    ),
  },
  endTitle: 'Le dragon noir',
  endText: 'L’offrande est accomplie : un dragon infernal est né au cœur de l’Empire. La suite se joue dans la campagne elfe.',
};
