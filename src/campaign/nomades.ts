// Campagne Nomade — « Les sables ne plient pas » : résister à l'invasion du désert par la Légion impériale.
import { cards, NO_LIMIT, say } from './dsl';
import type { CampaignDef, CampaignScenario } from './types';

const Z = 'Cheikha Zahra';
const ID = 'Éclaireur Idris';
const LEGAT = 'Légat Varro';

const START_POOL = cards('jeune_nomade*5', 'frondeur_nomade*5', 'marchand_ombres*3', 'caravane_marchande*2', 'embuscade*2', 'guide_desert*2', 'basilics_oasis*2');

const LEGION_AVANTGARDE = cards('recrue_imp*5', 'archer_imp*3', 'lancier_emp*3', 'legionnaire_desert*4', 'soldat_kragz*2', 'lieutenant*2', 'ralliement', 'charge_imp', 'porte_etendard');
const LEGION_PUITS = cards('recrue_imp*4', 'legionnaire_desert*4', 'archer_imp*3', 'lancier_emp*3', 'soldat_kragz*2', 'lieutenant*2', 'capitaine_garde',
  'ralliement*2', 'formation_carre', 'cadets_academie');
const LEGION_CONVOI = cards('recrue_imp*4', 'lancier_emp*3', 'archer_imp*3', 'soldat_kragz*3', 'lieutenant*2', 'capitaine_garde*2', 'formation_carre*2',
  'ralliement*2', 'porte_etendard', 'chevalier_prov');
const LEGION_TEMPETE = cards('legionnaire_desert*4', 'archer_imp*4', 'arbaletrier_imp*2', 'lancier_emp*3', 'soldat_kragz*2', 'chevalier_prov*2',
  'lieutenant*2', 'capitaine_garde*2', 'ralliement*2', 'formation_carre', 'chevalier_templier');
const LEGION_FORTERESSE = cards('recrue_imp*3', 'lancier_emp*3', 'soldat_kragz*2', 'chevalier_prov*2', 'archer_imp*2', 'lieutenant*2', 'capitaine_garde*2',
  'general_empire', 'ralliement*2', 'formation_carre', 'ordre_haut_commandement', 'dragon_imp');

export const NOMAD_SCENARIOS: Record<string, CampaignScenario> = {
  n1: {
    id: 'n1',
    title: 'Les Sables — 1. Les éclaireurs de la Légion',
    deckRules: { min: 20, text: 'Minimum 20 cartes. L’avant-garde impériale est loin de ses bases : sa pioche ne fait que 22 cartes. Si elle doit piocher dans une pioche vide, elle perd.' },
    intro: say(
      'Des bannières impériales flottent sur les dunes. Une avant-garde de la Légion reconnaît les oasis.',
      [ID, 'Ils sont peu nombreux, Cheikha. Mais ils marchent comme s’ils étaient chez eux.'],
      [Z, 'Ils ont emporté peu de vivres. Volons-leur ce qu’ils ont, et le désert fera le reste.'],
    ),
    victoryDialog: say(
      'L’avant-garde reflue, affamée et désorganisée.',
      [ID, 'Un prisonnier parle : la Légion veut le puits de Sel-Amar. Sans lui, aucune armée ne traverse le désert.'],
      [Z, 'Alors c’est là que nous les attendrons.'],
    ),
    A: { faction: 'nomades', label: 'Nomades du désert', deckList: START_POOL, ai: false },
    B: { faction: 'empire', label: 'Avant-garde de la Légion', deckList: LEGION_AVANTGARDE, ai: true, start: { avant: { '1': 'recrue_imp', '2': 'legionnaire_desert' } } },
    defeatLassitude: { A: 35, B: 40 },
    events: [
      { turn: 3, pid: 'B', dialog: say([LEGAT, 'Avancez ! Ce ne sont que des pillards et des bergers.']) },
    ],
    reward: {
      gifts: cards('saboteur_nomade*2'),
      picks: { count: 1, title: 'Récompense — Ruses du désert', text: 'Choisis une carte à ajouter à ton pool', options: ['marche_noir', 'frappez_ravitaillement', 'cavaliers_dunes', 'oasis_cachee'] },
      lines: { gifts: { who: Z, text: 'Ces saboteurs se glisseront dans leurs lignes de ravitaillement.' } },
    },
  },
  n2: {
    id: 'n2',
    title: 'Les Sables — 2. Le puits de Sel-Amar',
    deckRules: { min: 20, text: 'Minimum 20 cartes. Le Puits (rang arrière) est vital : il te rapporte 1 ressource par tour, mais s’il tombe, c’est la défaite. Tu ne perds pas si ta pioche est vide.' },
    intro: say(
      'Le puits de Sel-Amar est le seul point d’eau à trois jours à la ronde. La Légion marche droit dessus.',
      [Z, 'Sans ce puits, nos caravanes meurent. Sans ce puits, la Légion meurt aussi.'],
      [ID, 'Des renforts impériaux arrivent par vagues. On a repéré une colonne pour dans quelques heures, une autre plus tard.'],
    ),
    victoryDialog: say(
      'Les légionnaires reculent, assoiffés. Le puits est sauf.',
      [LEGAT, 'Repliez-vous ! Nous prendrons le désert autrement : par le ravitaillement.'],
      [ID, 'Ils font venir un grand convoi de vivres à travers les dunes.'],
    ),
    A: { faction: 'nomades', label: 'Nomades du désert', ai: false, start: { arriere: { '1': 'puits_sel_amar' } } },
    B: { faction: 'empire', label: 'Légion impériale', deckList: LEGION_PUITS, ai: true, start: { avant: { '1': 'legionnaire_desert', '2': 'legionnaire_desert' } } },
    mustSurvive: { A: 'puits_sel_amar' },
    emptyDeckDefeat: { A: false },
    defeatLassitude: { A: 45, B: 40 },
    noRegimentDefeatFromTurn: { A: NO_LIMIT, B: 8 },
    events: [
      { turn: 4, pid: 'B', resource: 2, spawn: [{ cardId: 'legionnaire_desert', zone: 'avant', idx: 0 }, { cardId: 'legionnaire_desert', zone: 'avant', idx: 3 }],
        dialog: say([LEGAT, 'Première colonne, en avant ! Prenez ce puits !']) },
      { turn: 7, pid: 'B', resource: 3, spawn: [{ cardId: 'chevalier_prov', zone: 'avant', idx: 1 }, { cardId: 'lancier_emp', zone: 'avant', idx: 2 }],
        dialog: say([LEGAT, 'Deuxième colonne ! Les chevaliers en tête !']) },
    ],
    reward: {
      order: ['exchange', 'gifts'],
      exchange: { from: 'jeune_nomade', to: 'marchand_ombres', count: 2 },
      gifts: cards('eleveur_basilics', 'charmeur_basilics'),
      lines: {
        exchange: { who: Z, text: 'Deux de nos jeunes se sont distingués. Je peux en faire des Marchands d’Ombres : ils quitteront ton pool et seront remplacés. Qu’en dis-tu ?' },
        gifts: { who: Z, text: 'Les éleveurs de Basilics de Sel-Amar se joignent à nous.' },
      },
    },
  },
  n3: {
    id: 'n3',
    title: 'Les Sables — 3. Razzia sur le ravitaillement',
    deckRules: { min: 20, text: 'Minimum 20 cartes. Terrain plus long (6/5). Détruis le convoi impérial (rang arrière, il avance tous les deux tours) avant qu’il quitte le terrain. Tu ne perds pas si ta pioche est vide.' },
    layout: { avant: 6, arriere: 5 },
    intro: say(
      'Un long convoi de chariots impériaux serpente entre les dunes, bien escorté.',
      [ID, 'Il avance d’une case tous les deux tours. Quand il sortira du terrain, la Légion aura de quoi tenir des mois.'],
      [Z, 'Alors il ne sortira pas. Vide la ligne qui le protège et frappe les chariots.'],
    ),
    victoryDialog: say(
      'Les chariots brûlent. Les vivres de la Légion partent en fumée.',
      [Z, 'Partagez le butin entre les tribus. Et faites savoir que le désert ne nourrit pas les envahisseurs.'],
    ),
    A: { faction: 'nomades', label: 'Nomades du désert', ai: false },
    B: { faction: 'empire', label: 'Convoi de la Légion', deckList: LEGION_CONVOI, ai: true,
      start: { avant: { '0': 'soldat_kragz', '1': 'lancier_emp', '2': 'legionnaire_desert' }, arriere: { '0': 'convoi', '1': 'archer_imp' } } },
    convoy: { cardId: 'convoi', pid: 'B', firstTurn: 2, every: 2 },
    startOverrides: { convoi: { mor: 25 } },
    mustSurvive: { B: 'convoi' },
    emptyDeckDefeat: { A: false },
    startLevel: { A: 2 },
    defeatLassitude: { A: 40, B: 50 },
    noRegimentDefeatFromTurn: { A: 2, B: NO_LIMIT },
    events: [
      { turn: 5, pid: 'B', resource: 2, spawn: [{ cardId: 'legionnaire_desert', zone: 'avant', idx: 3 }], dialog: say(['Sergent du convoi', 'Serrez les rangs autour des chariots !']) },
    ],
    reward: {
      picks: { count: 3, unique: true, title: 'Récompense — Le butin du convoi', text: 'Choisis une carte du butin à ajouter à ton pool',
        options: ['archeotacticiens', 'volez_ravitaillement', 'rancon_desert', 'cheikh_dunes', 'tempete_sable', 'chasseur_reliques'] },
    },
  },
  n4: {
    id: 'n4',
    title: 'Les Sables — 4. La tempête de sable',
    deckRules: { min: 25, text: 'Minimum 25 cartes. Une tempête souffle aux tours 2, 5, 8… : les régiments non Nomades perdent Distance et 20 INI. Pas de défaite par pioche vide (pour personne).' },
    intro: say(
      'Privée de vivres, la Légion se replie à travers le grand erg. Le vent se lève.',
      [ID, 'La tempête arrive par vagues. Leurs archers ne verront plus rien.'],
      [Z, 'Nous, nous sommes nés dedans. Frappons quand le sable vole.'],
    ),
    victoryDialog: say(
      'L’arrière-garde impériale disparaît sous les dunes.',
      [LEGAT, 'Assez ! Faites venir l’Intuable. Nous tiendrons l’oasis centrale quoi qu’il en coûte.'],
      [ID, 'Une forteresse vivante… un dragon de pierre et d’acier.'],
    ),
    A: { faction: 'nomades', label: 'Nomades du désert', ai: false },
    B: { faction: 'empire', label: 'Arrière-garde de la Légion', deckList: LEGION_TEMPETE, ai: true,
      start: { avant: { '0': 'legionnaire_desert', '1': 'lancier_emp', '2': 'soldat_kragz' }, arriere: { '1': 'archer_imp' } } },
    weather: { kind: 'tempete', first: 2, every: 3, duration: 1 },
    moralCheckLassitude: 1,
    emptyDeckDefeat: false,
    startLevel: { A: 2, B: 2 },
    defeatLassitude: { A: 70, B: 40 },
    noRegimentDefeatFromTurn: { A: 2, B: 4 },
    events: [
      { turn: 6, pid: 'B', resource: 2, spawn: [{ cardId: 'chevalier_prov', zone: 'avant', idx: 3 }], dialog: say([LEGAT, 'Les chevaliers en couverture ! Ne rompez pas !']) },
    ],
    reward: {
      gifts: cards('basilics_desert', 'guide_desert'),
      picks: { count: 1, title: 'Récompense — Légendes des sables', text: 'Choisis une carte à ajouter à ton pool', options: ['reine_basilics', 'cheikh_dunes', 'oasis_cachee', 'tempete_sable'] },
    },
  },
  n5: {
    id: 'n5',
    title: 'Les Sables — 5. La Forteresse dans les dunes',
    deckRules: { min: 30, text: 'Minimum 30 cartes. Détruis Forteresse l’Intuable, ou épuise la pioche impériale (22 cartes) : si elle doit piocher dans une pioche vide, la Légion perd.' },
    intro: say(
      'L’oasis centrale. Forteresse l’Intuable s’y est enracinée comme une montagne.',
      [LEGAT, 'Cent hommes, un dragon de pierre et des vivres pour un mois. Venez donc nous déloger.'],
      [Z, 'Un mois ? Nous verrons combien de jours tiennent tes réserves.'],
    ),
    victoryDialog: say(
      'La Légion évacue l’oasis. Le désert redevient aux Nomades.',
      [Z, 'Ils reviendront peut-être. Mais ils sauront que le sable ne plie pas.'],
      [ID, 'Cheikha… les prisonniers disent que l’Empire cherchait les nids de dragons. Quelqu’un a volé des œufs, et ils nous en accusent.'],
    ),
    A: { faction: 'nomades', label: 'Nomades du désert', ai: false },
    B: { faction: 'empire', label: 'Légion impériale', deckList: LEGION_FORTERESSE, ai: true,
      start: { avant: { '1': 'forteresse', '2': 'chevalier_prov' }, arriere: { '1': 'arbaletrier_imp' } } },
    mustSurvive: { B: 'forteresse' },
    startLevel: { A: 3, B: 3 },
    defeatLassitude: { A: 50, B: 50 },
    noRegimentDefeatFromTurn: { A: 2, B: NO_LIMIT },
    events: [
      { turn: 4, pid: 'B', resource: 2, dialog: say([LEGAT, 'Tenez la ligne ! L’Intuable ne tombera pas !']) },
    ],
    reward: {
      gifts: cards('reine_basilics', 'cheikh_dunes'),
      lines: { gifts: { who: Z, text: 'Les tribus te confient leur Reine des Basilics et le titre de Cheikh.' } },
    },
  },
};

export const NOMADES: CampaignDef = {
  id: 'nomades',
  title: 'Les sables ne plient pas',
  faction: 'nomades',
  rank: 3,
  pitch: 'La Légion impériale envahit le désert. Harcèle-la, affame-la, et fais-la tomber par ses arrières.',
  order: ['n1', 'n2', 'n3', 'n4', 'n5'],
  scenarios: NOMAD_SCENARIOS,
  hero: Z,
  talks: {
    n1: say(
      'Sous la grande tente de la Cheikha, le thé fume et les visages sont graves.',
      [ID, 'Des légionnaires ont planté leurs bannières à l’oasis de Kher. Ils disent que le désert appartient à l’Empire.'],
      [Z, 'Le désert n’appartient à personne. Il reprend tout ce qu’on lui prend.'],
      [ID, 'On ne gagnera pas une bataille rangée contre la Légion.'],
      [Z, 'Alors ne livrons pas de bataille rangée. Vidons leurs mains, leurs sacs, leurs réserves.'],
    ),
    n2: say(
      [ID, 'Les puits du sud sont empoisonnés. Il ne reste que Sel-Amar.'],
      [Z, 'C’est là qu’ils viendront. Et c’est là que nous tiendrons.'],
      [ID, 'Le puits nous donne de l’eau à revendre. Chaque tour, il remplit nos outres… et nos bourses.'],
    ),
    n3: say(
      [ID, 'Le convoi a quitté la côte. Cinquante chariots, une escorte lourde.'],
      [Z, 'Une escorte protège l’avant. Personne ne protège jamais assez l’arrière.'],
    ),
    n4: say(
      'Le ciel jaunit à l’horizon. Les chameaux s’agenouillent d’eux-mêmes.',
      [ID, 'La grande tempête arrive.'],
      [Z, 'Pour eux, c’est une malédiction. Pour nous, c’est un manteau.'],
    ),
    n5: say(
      [ID, 'L’Intuable ne craint ni nos frondes ni nos lances.'],
      [Z, 'Mais il a des soldats à nourrir, et des réserves qui s’épuisent. Une forteresse affamée tombe comme les autres.'],
    ),
    fin: say(
      'Les tribus fêtent la victoire autour des feux. La Cheikha reste pensive.',
      [Z, 'Des œufs de dragon volés… Les nids sont à nous depuis toujours. Qui aurait osé ?'],
      [ID, 'Les anciens parlent d’hommes en robe pourpre, accompagnés de chiens qui fumaient.'],
      [Z, 'Des démons. Alors l’Empire n’est peut-être pas notre seul ennemi.'],
    ),
  },
  endTitle: 'Le désert est libre',
  endText: 'La Légion quitte le désert. Mais le vol des œufs de dragon reste une énigme… que la campagne démon éclaire.',
};
