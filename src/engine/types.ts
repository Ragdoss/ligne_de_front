// Types du moteur de règles de Ligne de Front.
// Règle d'or : l'état de partie est un objet JSON pur (aucune référence d'objet, aucune fonction),
// pour pouvoir le copier, le sauvegarder, le rejouer et l'envoyer sur le réseau.

export type PlayerId = 'A' | 'B';
export type Zone = 'avant' | 'arriere' | 'isole';
export type Faction = 'empire' | 'elfe' | 'demons' | 'nomades' | 'neutre';
export type CardType = 'Regiment' | 'Leader' | 'Tactique';

export type TargetRule =
  | 'none'
  | 'allie-quelconque'
  | 'allie-avec-leader'
  | 'lancier-allie'
  | 'archer-allie'
  | 'elfe-allie'
  | 'demon-allie'
  | 'nomade-allie'
  | 'ennemi-quelconque'
  | 'ennemi-avec-leader'
  | 'ennemi-puis-case-vide'
  | 'elfe-allie-puis-case';

/** Définition d'une carte (données). Les champs optionnels décrivent les capacités spéciales. */
export interface CardDef {
  id: string;
  cardType: CardType;
  faction: Faction;
  niveau: number;
  cout: number;
  // Régiments
  types?: string[];
  slotType?: Zone;
  slotTypes?: Zone[];
  atk?: number;
  end?: number;
  arm?: number;
  ini?: number;
  mor?: number;
  startMor?: number;
  keywords?: string[];
  arrivesReady?: boolean;
  vieTours?: number;
  // Leaders
  typesRequired?: string[];
  bonusAtk?: number;
  bonusArm?: number;
  bonusIni?: number;
  bonusMor?: number;
  bonusEnd?: number;
  targetsEnemy?: boolean;
  requiresLeader?: boolean;
  requiresOwnEmpireLeaderToCast?: boolean;
  grantsKeywordOnAttach?: string;
  healOnAttach?: number;
  healMorOnAttach?: number;
  healCarrierEachTurn?: { end: number; mor: number };
  healEachTurn?: number;
  visionOnAttach?: boolean;
  tacticCostReduction?: number;
  moralPerAdjacentEmpireEachTurn?: boolean;
  soloWinsMoralCheck?: boolean;
  lassitudePerHealStep?: number;
  bonusNiveauOnAttach?: number;
  grantsReadyOnAttach?: boolean;
  // Tactiques
  targetRule?: TargetRule;
  effect?: string;
  dynamicCost?: 'frontEmpty' | 'brokenEnemyCount';
  elementalDiscount?: number;
  // Capacités de régiments
  armBonusWithLeader?: number;
  moralToLeaderCarriersEachTurn?: number;
  moralFloorWithLeader?: number;
  createsLieutenantOnArrival?: boolean;
  healAllMoralOnArrival?: boolean;
  generatesResourceEachTurn?: number;
  ralliesBrokenEmpireEachTurn?: number;
  healsMostInjuredEachTurn?: number;
  moralOnFullHeal?: number;
  stunsTargetOnAttack?: boolean;
  /** Effet doublé si le joueur contrôle un Élémentaux (Sérénité de la Forêt). */
  doubledWithElemental?: boolean;
  /** Bonus d'ATK contre les régiments Monté (Lanciers : 10 par défaut). */
  bonusVsMounted?: number;
  excludeFromMoralTotal?: boolean;
  onEnemyDeathMoral?: number;
  onAllyDeathMoralGain?: number;
  /** Régiment unique : un seul exemplaire en jeu à la fois par joueur. */
  unique?: boolean;
  /** Leader : le régiment porteur ne perd pas de Moral quand un allié est détruit (hors Moral brisé). */
  leaderNoAllyDeathMoralLoss?: boolean;
  onDeathDraw?: number;
  // Autres capacités (Démons, Nomades) pas encore portées : tolérées dans les données.
  [extra: string]: unknown;
}

export interface SlotRef {
  player: PlayerId;
  zone: Zone;
  idx: number;
}

export interface Unit {
  uid: number;
  cardId: string;
  controller: PlayerId;
  types: string[];
  keywords: string[];
  niveau: number;
  baseAtk: number;
  baseArm: number;
  ini: number;
  maxEnd: number;
  currentEnd: number;
  maxMor: number;
  currentMor: number;
  leader: string | null;
  leaderOwner: PlayerId | null;
  justDeployed: boolean;
  arrivesReady: boolean;
  brokenMorale: boolean;
  vieTours: number | null;
  isToken: boolean;
  // Effets temporaires (remis à zéro après chaque combat)
  tempAtk: number;
  tempDebuffAtk: number;
  tempArm: number;
  tempIni: number;
  ignoreArmor: boolean;
  stunned: boolean;
  /** uid du régiment (Rangers) qui a sonné cette unité, pour le bonus de Moral à la destruction. */
  stunnedBy: number | null;
  /** Formation en Carré : bonus d'Armure jusqu'au prochain tour de `squareOwner`. */
  squareArm: number;
  squareOwner: PlayerId | null;
  /** Pacte de Survie : pertes converties en lassitude pour `owner` jusqu'à son prochain tour. */
  pactShield: { owner: PlayerId; endAcc: number } | null;
  /** Blessé ce tour-ci par un Frondeur Nomade. */
  woundedByFrondeur: boolean;
  /** Compteur de tours (éclosion de l'Œuf de Dragon). */
  counter?: number;
  /** Tempête de Sable : perd Distance pour ce combat. */
  blinded?: boolean;
}

export interface HandCard {
  uid: number;
  cardId: string;
  /** Carte générée (Soin simple, Lieutenant créé…) : disparaît au lieu d'aller en défausse. */
  generated?: boolean;
  /** Peut être jouée sans respecter le niveau requis (renforts de scénario). */
  levelFree?: boolean;
  /** Réduction de coût propre à cet exemplaire (Suppôt Infernal, Charmeur de Basilics). */
  discount?: number;
  /** Copie gratuite d'Archéotacticiens : coût 0, détruite à la fin du tour de son propriétaire. */
  freeCopy?: boolean;
}

export interface Board {
  avant: (Unit | null)[];
  arriere: (Unit | null)[];
  isole: Unit | null;
}

export interface PlayerState {
  id: PlayerId;
  faction: Faction;
  resource: number;
  level: number;
  points: number;
  deck: string[];
  /** Cartes de niveau 4-5 tenues hors de la pioche jusqu'au niveau 4. */
  reserve: string[];
  hand: HandCard[];
  discard: string[];
  board: Board;
  /** Reliquat d'Endurance soignée pour la Veilleuse des Sources. */
  healAcc: number;
}

export type ChoiceKind =
  | 'vision'            // Vision : une des 3 prochaines tactiques du deck
  | 'promotionDiscard'  // Promotion : Leader de la main à défausser
  | 'promotionPick'     // Promotion : Leader révélé à piocher
  | 'recoverDemon'      // Suppôt Infernal : copie d'un Démon de la défausse (moins chère)
  | 'recoverDemonOs'    // Veilleur d'Os : récupérer un Démon de la défausse (ou rien)
  | 'ranconAmes'        // Rançon d'Âmes : lassitude payée (1 à 5)
  | 'tuteur'            // Tuteur Démoniaque : niveau de Démon cherché
  | 'handDiscard'       // Défausse de main au choix (Marché Noir, Frappez/Volez le ravitaillement)
  | 'relics'            // Chasseur de Reliques : régiment de la défausse adverse + stat gagnée
  | 'shadow'            // Marchand d'Ombres : carte de la main adverse à défausser
  | 'caravane'          // Caravane Marchande : carte de la défausse adverse à supprimer
  | 'ransomDesert'      // Rançon du Désert : carte de la défausse adverse à supprimer
  | 'frondeurStun';     // Frondeur Nomade : régiment adverse à sonner

export interface ChoiceOption {
  cardId?: string;
  handUid?: number;
  value?: number;
  stat?: 'atk' | 'arm';
  skip?: boolean;
  /** Position d'un régiment ciblé (affichage). */
  where?: string;
}

/**
 * Choix en attente. Les choix s'empilent dans une file (GameState.pending) ; seul le premier est actif.
 * Ses options sont calculées au moment où il devient actif (l'état a pu changer entre-temps).
 */
export interface PendingChoice {
  kind: ChoiceKind;
  player: PlayerId;
  /** Carte à l'origine du choix. */
  source: string;
  options: ChoiceOption[] | null;
  data: Record<string, number | string | null>;
}

/** Réglages de partie (valeurs par défaut = règles standard ; les scénarios les modifient). */
export interface GameConfig {
  layout: { avant: number; arriere: number };
  levelThresholds: Record<PlayerId, number[]>;
  defeatLassitude: Record<PlayerId, number>;
  moralCheck: boolean;
  /** Lassitude fixe donnée par la comparaison de Moral (sinon : niveau max des deux joueurs). */
  moralCheckLassitude: number | null;
  /** Lassitude automatique en fin de tour, par joueur. */
  endTurnLassitude: Record<PlayerId, number>;
  /** Tour à partir duquel « aucun régiment en fin de tour » fait perdre. */
  noRegimentDefeatFromTurn: Record<PlayerId, number>;
  /** Régiment (cardId) dont la destruction fait perdre son contrôleur. */
  mustSurvive: Partial<Record<PlayerId, string>>;
  handLimit: number;
  startingHand: number;
  /** false : piocher dans une pioche vide ne fait pas perdre (on ne pioche simplement rien). Absent = true. */
  emptyDeckDefeat?: boolean | Partial<Record<PlayerId, boolean>>;
  /** Victoire du joueur dès que ce tour commence (« tenir jusqu'au tour X »). */
  winAtTurn?: Partial<Record<PlayerId, number>>;
  /** Libération : ces régiments de `pid` passent dans l'autre camp quand leur Moral se brise. */
  liberation?: { pid: PlayerId; cardIds: string[] };
}

// ---------- Scénarios ----------
export interface DialogLine { who: string; text: string }
export interface ScenarioEvent {
  turn: number;
  pid: PlayerId;
  dialog?: DialogLine[];
  resource?: number;
  /** Cartes ajoutées à la main (générées : elles ne vont pas en défausse). */
  giveCards?: string[];
  /** Les cartes données peuvent être jouées sans le niveau requis. */
  levelFree?: boolean;
  spawn?: { cardId: string; zone: 'avant' | 'arriere'; idx: number }[];
  /** Points de lassitude donnés au joueur (tutoriel : montrer la montée de niveau). */
  lassitude?: number;
}
/** Météo périodique : actif `duration` tours tous les `every` tours à partir de `first`. Tempête, ou nuit (sinon jour). */
export interface Weather { kind: 'tempete' | 'nuit'; first: number; every: number; duration: number }
/** Alarme : `pid` ne pose aucun régiment (ordinateur) avant l'alarme, donnée au tour `turn` ou à sa première perte. */
export interface Alarm { pid: PlayerId; turn: number; resource?: number; spawn?: ScenarioEvent['spawn']; dialog?: DialogLine[] }
export interface ScenarioRules {
  events: ScenarioEvent[];
  /** Convoi : avance d'une case vers la droite (rang arrière) tous les `every` tours à partir de `firstTurn`. */
  convoy?: { cardId: string; pid: PlayerId; firstTurn: number; every: number };
  /** Ressources gagnées par le perdant de la comparaison de Moral (base, ou level3 à partir du niveau 3). */
  moralCheckLostResource?: Partial<Record<PlayerId, { base: number; level3: number }>>;
  weather?: Weather;
  alarm?: Alarm;
}
export interface ScenarioSetup extends ScenarioRules {
  start?: Partial<Record<PlayerId, { avant?: Record<string, string>; arriere?: Record<string, string>; isole?: string }>>;
  startHand?: Partial<Record<PlayerId, string[]>>;
  startLevel?: Partial<Record<PlayerId, number>>;
  startOverrides?: Record<string, { mor?: number }>;
  /** Ressources supplémentaires au départ (aide après plusieurs défaites en campagne). */
  startResource?: Partial<Record<PlayerId, number>>;
}
export interface ScenarioRuntime extends ScenarioRules {
  fired: string[];
  convoyHold: number;
  /** Alarme donnée (et renforts déjà arrivés). */
  alarmRaised?: boolean;
  alarmDone?: boolean;
  /** Régiments libérés (Libération). */
  liberated?: number;
}

export interface GameState {
  config: GameConfig;
  players: Record<PlayerId, PlayerState>;
  active: PlayerId;
  turn: number;
  nextUid: number;
  rng: number;
  pending: PendingChoice[];
  scenario: ScenarioRuntime | null;
  over: { winner: PlayerId; reason: string } | null;
}

export type Action =
  | { type: 'play'; handUid: number; target?: SlotRef; target2?: SlotRef }
  | { type: 'choose'; option: number }
  | { type: 'endTurn' };

export type GameEvent =
  | { type: 'turnStart'; player: PlayerId; turn: number; resource: number; leftover: number; drawn: string[]; blocked: number }
  | { type: 'cardPlayed'; player: PlayerId; cardId: string; cost: number }
  | { type: 'deployed'; player: PlayerId; uid: number; cardId: string; slot: SlotRef }
  | { type: 'leaderAttached'; player: PlayerId; leaderId: string; uid: number; cardId: string }
  | { type: 'combatStart'; player: PlayerId }
  | { type: 'attack'; attacker: number; attackerCard: string; target: number; targetCard: string; atk: number; arm: number; damage: number; moralLoss: number; end: number; mor: number }
  | { type: 'stunned'; uid: number; cardId: string; by: number | null }
  | { type: 'skipAttack'; uid: number; cardId: string; reason: 'stunned' | 'noAtk' }
  | { type: 'destroyed'; player: PlayerId; uid: number; cardId: string; cause: 'end' | 'moral' | 'both' | 'effect'; lassitude: number }
  | { type: 'heal'; uid: number; cardId: string; end: number; mor: number; source: string }
  | { type: 'moralLoss'; uid: number; cardId: string; amount: number; source: string }
  | { type: 'lassitude'; player: PlayerId; amount: number; total: number; source: string }
  | { type: 'levelUp'; player: PlayerId; level: number }
  | { type: 'reserveJoined'; player: PlayerId; count: number }
  | { type: 'moralCheck'; totals: Record<PlayerId, number>; loser: PlayerId | null; amount: number }
  | { type: 'resource'; player: PlayerId; amount: number; source: string }
  | { type: 'draw'; player: PlayerId; cardId: string; source: string }
  | { type: 'generated'; player: PlayerId; cardId: string; source: string }
  | { type: 'returnedToHand'; player: PlayerId; cardId: string }
  | { type: 'moved'; uid: number; cardId: string; from: SlotRef; to: SlotRef }
  | { type: 'leaderDestroyed'; uid: number; cardId: string; leaderId: string }
  | { type: 'left'; player: PlayerId; uid: number; cardId: string; reason: 'lifespan' }
  | { type: 'effect'; key: string; player: PlayerId; cardId: string; data?: Record<string, unknown> }
  | { type: 'choice'; player: PlayerId; kind: ChoiceKind }
  | { type: 'discarded'; player: PlayerId; cardId: string; source: string }
  | { type: 'intercepted'; player: PlayerId; cardId: string; saboteur: number; moralLoss: number }
  | { type: 'freeCopy'; player: PlayerId; cardId: string }
  | { type: 'sacrificed'; player: PlayerId; uid: number; cardId: string; forCard: string }
  | { type: 'dialog'; lines: DialogLine[] }
  | { type: 'gameOver'; winner: PlayerId; reason: string };

export type ActionResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: string };
