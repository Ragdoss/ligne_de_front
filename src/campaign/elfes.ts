// Campagne Elfe — « La Purification » : Sylvain et les Royaumes Elfiques chassent les Démons qui souillent les sources.
import { cards, NO_LIMIT, say } from './dsl';
import type { CampaignDef, CampaignScenario } from './types';

const SY = 'Sylvain';
const LY = 'Éclaireuse Lyra';

const START_POOL = cards('eclaireur_elfe*6', 'archer_bois*3', 'elem_terre*3', 'bourgeonnement*3', 'brise_matin*2', 'repositionnement*2', 'dryades_guerisseuses');

// 24/10/2026 : 4 cartes de plus dans chaque deck démon (trop de victoires du joueur par pioche vide adverse).
const DEMONS_SOURCE = cards('cultiste*7', 'chien_infernal*5', 'esclave_guerrier*3', 'acolyte_damne*2', 'effroi_demoniaque*2', 'pacte_sang*2', 'diablotins*4');
const DEMONS_CAPTIFS = cards('esclave_guerrier*6', 'cultiste*7', 'diablotins*4', 'chien_infernal*4', 'fanatiques*2', 'acolyte_damne*2', 'effroi_demoniaque*2',
  'pacte_survie', 'demon_akantha', 'banquet_infernal');
const DEMONS_NUIT = cards('chien_infernal*5', 'demon_akantha*2', 'cultiste*6', 'fanatiques*2', 'esclave_guerrier*3', 'effroi_demoniaque*3',
  'rancon_ames', 'dette_infernale', 'acolyte_damne*2', 'suppot_infernal', 'veilleur_os', 'abime_grandissant');
const DEMONS_PORTAIL = cards('cultiste*5', 'chien_infernal*4', 'demon_akantha*2', 'fanatiques*2', 'ceremonie_declin', 'gargouille_cendres*2', 'diablotins*3',
  'effroi_demoniaque*2', 'banquet_infernal', 'acolyte_damne*2', 'veilleur_os', 'maitre_chenil_infernal');

/** Le Portail crache un Chien Infernal à chaque tour des Démons, sur une case avant qui tourne. */
const portalSpawns = Array.from({ length: 14 }, (_, k) => ({
  turn: k + 2, pid: 'B' as const, spawn: [{ cardId: 'chien_infernal', zone: 'avant' as const, idx: (k * 3) % 4 }],
  ...(k === 4 ? { resource: 2, dialog: say(['Voix du Portail', 'Encore… encore… la forêt brûlera.']) } : {}),
}));

export const ELF_SCENARIOS: Record<string, CampaignScenario> = {
  e1: {
    id: 'e1',
    title: 'La Purification — 1. La source souillée',
    deckRules: { min: 20, text: 'Minimum 20 cartes. Détruis la Source corrompue (rang arrière) : elle soigne les Démons à chaque tour. Tu ne perds pas si ta pioche est vide.' },
    intro: say(
      'La source sacrée de Lys-Argent coule noire. Des cultistes y ont planté un autel de soufre.',
      [LY, 'Tant que la source est souillée, leurs blessures se referment toutes seules.'],
      [SY, 'Alors c’est la source qu’il faut abattre. Dégagez le passage, puis frappez au cœur.'],
    ),
    victoryDialog: say(
      'L’autel se brise ; l’eau de la source s’éclaircit lentement.',
      [LY, 'Ces cultistes… ils ne sont pas d’ici. Leurs robes portent un symbole impérial.'],
      [SY, 'Impérial ? Garde ce lambeau. Nous suivrons leur piste.'],
    ),
    A: { faction: 'elfe', label: 'Royaumes Elfiques', deckList: START_POOL, ai: false },
    B: { faction: 'demons', label: 'Cultistes de la source', deckList: DEMONS_SOURCE, ai: true,
      start: { avant: { '1': 'cultiste', '2': 'chien_infernal' }, arriere: { '1': 'source_corrompue' } } },
    mustSurvive: { B: 'source_corrompue' },
    emptyDeckDefeat: { A: false },
    defeatLassitude: { A: 45, B: 40 },
    noRegimentDefeatFromTurn: { A: 2, B: NO_LIMIT },
    events: [
      { turn: 4, pid: 'B', resource: 2, dialog: say(['Cultiste', 'Le maître nous protège ! La source nous protège !']) },
    ],
    reward: {
      gifts: cards('dryades_guerisseuses', 'elem_eau*2'),
      picks: { count: 1, title: 'Récompense — Dons de la forêt', text: 'Choisis une carte à ajouter à ton pool', options: ['floraison', 'chamane_foret', 'volee_fleches', 'gardienne_lumiere'] },
      lines: { gifts: { who: SY, text: 'La source purifiée nous envoie ses gardiennes et ses esprits d’eau.' } },
    },
  },
  e2: {
    id: 'e2',
    title: 'La Purification — 2. Les captifs',
    deckRules: { min: 20, text: 'Minimum 20 cartes. Un Esclave Guerrier ennemi dont le Moral se brise est libéré et rejoint ton camp. Ceux que tu libères rejoignent ton pool. Tu ne perds pas si ta pioche est vide.' },
    intro: say(
      'Les Démons ont enchaîné des elfes et des humains capturés, et les font combattre en première ligne.',
      [LY, 'Ce sont les nôtres, Sylvain. On ne peut pas les massacrer.'],
      [SY, 'Brisez leur peur, pas leurs corps. Un captif qui ne craint plus ses maîtres reviendra vers nous.'],
    ),
    victoryDialog: say(
      'Les chaînes tombent. Les captifs libérés se rangent aux côtés des elfes.',
      [LY, 'Un des captifs dit que les démons parlent d’une « nuit sans fin » préparée plus au nord.'],
    ),
    A: { faction: 'elfe', label: 'Royaumes Elfiques', ai: false },
    B: { faction: 'demons', label: 'Geôliers démoniaques', deckList: DEMONS_CAPTIFS, ai: true,
      start: { avant: { '1': 'esclave_guerrier', '2': 'esclave_guerrier' }, arriere: { '1': 'cultiste' } } },
    liberation: { pid: 'B', cardIds: ['esclave_guerrier'] },
    emptyDeckDefeat: { A: false },
    defeatLassitude: { A: 40, B: 45 },
    noRegimentDefeatFromTurn: { A: 2, B: 4 },
    events: [
      { turn: 5, pid: 'B', resource: 2, spawn: [{ cardId: 'demon_akantha', zone: 'avant', idx: 0 }], dialog: say(['Geôlier', 'Fouettez les captifs ! Qu’ils avancent !']) },
    ],
    reward: {
      picks: { count: 1, title: 'Récompense — Ruses sylvestres', text: 'Choisis une carte à ajouter à ton pool', options: ['rangers', 'retraite_sylvestre', 'brume_trompeuse', 'cavalier_elfe', 'rite_purification'] },
      lines: { picks: { who: SY, text: 'Choisis ce qui nous servira contre la nuit qui vient.' } },
    },
  },
  e3: {
    id: 'e3',
    title: 'La Purification — 3. La nuit sans fin',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Nuit aux tours 3-4, 7-8, 11-12… (Démons +10 ATK), jour le reste du temps (Elfes +15 INI). Tiens jusqu’au début du tour 10. Tu ne perds pas si ta pioche est vide.' },
    intro: say(
      'Un rituel démoniaque étouffe le soleil sur la forêt. La nuit revient sans cesse, et avec elle des démons plus forts.',
      [SY, 'Nous ne pouvons pas les vaincre dans le noir. Tenons jusqu’à l’aube véritable.'],
      [LY, 'Combien de temps ?'],
      [SY, 'Neuf tours. Au dixième, le rituel s’épuise.'],
    ),
    victoryDialog: say(
      'Le soleil perce enfin. Les démons se dispersent, aveuglés.',
      [LY, 'Le ritualiste avait une carte sur lui : un passage vers les Abysses, au pied des montagnes.'],
      [SY, 'Un portail. C’est par là qu’ils entrent dans notre monde. Il faut le fermer.'],
    ),
    A: { faction: 'elfe', label: 'Royaumes Elfiques', ai: false },
    B: { faction: 'demons', label: 'Ritualistes de la nuit', deckList: DEMONS_NUIT, ai: true,
      start: { avant: { '1': 'chien_infernal', '2': 'cultiste' } } },
    weather: { kind: 'nuit', first: 3, every: 4, duration: 2 },
    winAtTurn: { A: 10 },
    emptyDeckDefeat: { A: false },
    startLevel: { A: 2, B: 2 },
    defeatLassitude: { A: 60, B: 40 },
    noRegimentDefeatFromTurn: { A: 2, B: 4 },
    events: [
      { turn: 4, pid: 'B', resource: 1, spawn: [{ cardId: 'chien_infernal', zone: 'avant', idx: 0 }, { cardId: 'chien_infernal', zone: 'avant', idx: 3 }] },
      { turn: 7, pid: 'B', resource: 2, spawn: [{ cardId: 'demon_akantha', zone: 'avant', idx: 2 }], dialog: say(['Ritualiste', 'Que la nuit ne finisse jamais !']) },
    ],
    reward: {
      gifts: cards('sylvain', 'vision'),
      picks: { count: 1, title: 'Récompense — Esprits élémentaires', text: 'Choisis une carte à ajouter à ton pool', options: ['elem_feu', 'eveil_elementaire', 'serenite_foret', 'changement_tectonique'] },
      lines: { gifts: { who: SY, text: 'Je combattrai moi-même au portail. Prends aussi cette Vision : elle guidera nos sorts.' } },
    },
  },
  e4: {
    id: 'e4',
    title: 'La Purification — 4. Le portail des Abysses',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Détruis le Portail infernal (150 END, rang arrière) : un Chien Infernal en surgit à chaque tour. Tu ne perds pas si ta pioche est vide.' },
    intro: say(
      'Au pied des montagnes, un portail de flammes noires pulse comme un cœur.',
      [LY, 'Il en sort sans arrêt. Des chiens, des choses pires.'],
      [SY, 'Les chiens ne comptent pas. Seul le portail compte. La terre nous aidera à l’atteindre.'],
    ),
    victoryDialog: say(
      'Le portail se referme dans un hurlement. Le silence retombe sur la montagne.',
      [LY, 'Sylvain… les démons ne venaient pas seulement des Abysses. On a trouvé ceci : des ordres signés depuis la capitale impériale.'],
      [SY, 'L’Empire abrite ce culte. S’ils protègent ces monstres, alors l’Empire devra répondre de ses crimes.'],
      'Ainsi commença la guerre entre la forêt et l’Empire…',
    ),
    A: { faction: 'elfe', label: 'Royaumes Elfiques', ai: false },
    B: { faction: 'demons', label: 'Légions des Abysses', deckList: DEMONS_PORTAIL, ai: true,
      start: { avant: { '1': 'gargouille_cendres', '2': 'chien_infernal' }, arriere: { '1': 'portail_infernal' } } },
    mustSurvive: { B: 'portail_infernal' },
    emptyDeckDefeat: { A: false },
    startLevel: { A: 2, B: 2 },
    defeatLassitude: { A: 60, B: 50 },
    noRegimentDefeatFromTurn: { A: 2, B: NO_LIMIT },
    events: portalSpawns,
    reward: {
      gifts: cards('treant_millenaire'),
      lines: { gifts: { who: SY, text: 'La forêt te confie son plus vieux gardien.' } },
    },
  },
};

export const ELFES: CampaignDef = {
  id: 'elfes',
  title: 'La Purification',
  faction: 'elfe',
  rank: 2,
  pitch: 'Sylvain et les Royaumes Elfiques purifient les sources souillées et remontent la piste des Démons… jusqu’à l’Empire.',
  order: ['e1', 'e2', 'e3', 'e4'],
  scenarios: ELF_SCENARIOS,
  hero: SY,
  talks: {
    e1: say(
      'Une clairière au bord de Lys-Argent. Les arbres ont perdu leurs feuilles en une nuit.',
      [LY, 'L’eau sent le soufre. Les dryades ne répondent plus.'],
      [SY, 'Des démons, dans notre forêt. Depuis combien de temps ?'],
      [LY, 'Assez longtemps pour bâtir un autel.'],
      [SY, 'Alors nous le détruirons avant qu’ils en bâtissent un deuxième.'],
    ),
    e2: say(
      [LY, 'Les éclaireurs ont trouvé un camp de prisonniers. Des elfes, des humains, enchaînés ensemble.'],
      [SY, 'Les démons les envoient mourir à leur place.'],
      [LY, 'Si on les brise, ils fuiront. Ou ils nous rejoindront.'],
      [SY, 'Alors visons leur peur, et ramenons-les chez nous.'],
    ),
    e3: say(
      'Le soleil se couche au milieu de l’après-midi. Les oiseaux se taisent.',
      [LY, 'Encore la nuit. Les démons sont plus forts dans le noir.'],
      [SY, 'Mais au jour, nos archers voient plus loin et frappent plus vite. Profitons de chaque aube.'],
    ),
    e4: say(
      [LY, 'Le portail est là, derrière une ligne de gargouilles.'],
      [SY, 'Changement Tectonique peut arracher le portail à son abri et le jeter en première ligne.'],
      [LY, 'Tu veux déplacer le portail lui-même ?'],
      [SY, 'La terre obéit à qui la respecte. Le portail, lui, ne la respecte pas.'],
    ),
    fin: say(
      'Les sources coulent à nouveau claires. Mais au conseil des Royaumes, on ne parle plus que de l’Empire.',
      [LY, 'Tu es sûr de toi, Sylvain ? Une guerre contre l’Empire…'],
      [SY, 'Ils ont nourri ces démons. Je ne laisserai pas la forêt brûler une seconde fois.'],
    ),
  },
  endTitle: 'Les sources sont purifiées',
  endText: 'Le portail est fermé, mais la piste du culte mène à la capitale impériale. Sylvain prépare la guerre : c’est le début de la campagne Empire.',
};
