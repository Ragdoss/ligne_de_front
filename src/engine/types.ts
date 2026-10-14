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
  | 'ransomDesert';     // Rançon du Désert : carte de la défausse adverse à supprimer

export interface ChoiceOption {
  cardId?: string;
  handUid?: number;
  value?: number;
  stat?: 'atk' | 'arm';
  skip?: boolean;
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
}

export interface GameState {
  config: GameConfig;
  players: Record<PlayerId, PlayerState>;
  active: PlayerId;
  turn: number;
  nextUid: number;
  rng: number;
  pending: PendingChoice[];
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
  | { type: 'gameOver'; winner: PlayerId; reason: string };

export type ActionResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: string };
