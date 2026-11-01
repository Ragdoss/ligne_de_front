// Format des scénarios de campagne (données) — proche de celui du simulateur prototype.
import type { Alarm, DialogLine, Faction, FlagCond, PlayerId, ScenarioEvent, Weather } from '../engine/types';

export interface SideDef {
  faction: Faction;
  label: string;
  /** Deck imposé (ordinateur ; le joueur, lui, joue le deck construit depuis son pool). */
  deckList?: string[];
  /** Campagne à embranchements : deck remplacé selon les drapeaux (la première variante qui correspond). */
  deckVariants?: { if: FlagCond; deckList: string[] }[];
  ai: boolean;
  start?: { avant?: Record<string, string>; arriere?: Record<string, string>; isole?: string };
  startHand?: string[];
}

export interface Reward {
  order?: ('gifts' | 'exchange' | 'picks' | 'draft' | 'promote')[];
  gifts?: string[];
  exchange?: { from: string; to: string; count: number };
  picks?: { count: number; options: string[]; unique?: boolean; title?: string; text?: string };
  /** Volontaires : `rounds` fois, `size` cartes tirées au hasard dans la faction (niveau ≤ maxLevel), on en garde une. */
  draft?: { rounds: number; size: number; maxLevel: number };
  /** Réplique qui présente chaque étape de la récompense (sinon : texte par défaut du Commandant). */
  lines?: Partial<Record<'gifts' | 'exchange' | 'picks' | 'draft' | 'promote', DialogLine>>;
}

export interface CampaignScenario {
  id: string;
  title: string;
  deckRules: { min: number; text: string; forced?: string[] };
  layout?: { avant: number; arriere: number };
  intro: DialogLine[];
  victoryDialog?: DialogLine[];
  A: SideDef;
  B: SideDef;
  defeatLassitude?: Partial<Record<PlayerId, number>>;
  noRegimentDefeatFromTurn?: Partial<Record<PlayerId, number>>;
  /** L'ordinateur ne pose plus de régiment à partir de ce tour. */
  aiNoRegimentsFromTurn?: Partial<Record<PlayerId, number>>;
  mustSurvive?: Partial<Record<PlayerId, string>>;
  /** false : pas de défaite par pioche vide dans ce scénario. */
  emptyDeckDefeat?: boolean | Partial<Record<PlayerId, boolean>>;
  startLevel?: Partial<Record<PlayerId, number>>;
  levelThresholds?: Partial<Record<PlayerId, number[]>>;
  moralCheckLassitude?: number;
  moralCheckLostResource?: Partial<Record<PlayerId, { base: number; level3: number }>>;
  endTurnLassitude?: Partial<Record<PlayerId, number>>;
  startOverrides?: Record<string, { mor?: number }>;
  convoy?: { cardId: string; pid: PlayerId; firstTurn: number; every: number };
  events: ScenarioEvent[];
  reward?: Reward;
  /** Victoire en tenant jusqu'au début de ce tour. */
  winAtTurn?: Partial<Record<PlayerId, number>>;
  /** Libération : ces régiments adverses changent de camp au Moral brisé ; ceux libérés rejoignent le pool après la victoire. */
  liberation?: { pid: PlayerId; cardIds: string[] };
  weather?: Weather;
  alarm?: Alarm;
  // ----- Campagnes à embranchements -----
  /** Scénarios suivants : le premier dont la condition est remplie (aucun = fin de la campagne). */
  next?: { if?: FlagCond; to: string }[];
  /** Drapeaux posés à la victoire. */
  onWin?: string[];
  /** Drapeau posé si au moins un régiment a été libéré (Libération). */
  onLiberated?: string;
  /** Récompense remplacée selon les drapeaux (la première variante qui correspond). */
  rewardVariants?: { if: FlagCond; reward: Reward }[];
  /** Mission secondaire : jouée depuis le camp, une seule fois, sans faire avancer la campagne. */
  side?: boolean;
}

/** Une campagne : une suite de scénarios, des discussions de camp, un texte de fin. */
export interface CampaignDef {
  id: string;
  title: string;
  /** Faction jouée. */
  faction: Faction;
  /** Ordre conseillé dans le fil rouge (1 = à jouer en premier). */
  rank: number;
  pitch: string;
  order: string[];
  scenarios: Record<string, CampaignScenario>;
  /** Discussions au camp, par scénario à venir (et 'fin'). */
  talks: Record<string, DialogLine[]>;
  /** Personnage principal de la faction (récompenses présentées par lui). */
  hero: string;
  endTitle: string;
  endText: string;
  // ----- Campagnes à embranchements (absentes : campagne en ligne droite, `order`) -----
  /** Premier scénario de la carte (les suivants viennent de `next`). `order` sert alors de longueur indicative. */
  start?: string;
  /** Missions secondaires proposées au camp quand le scénario en cours est dans `at`. */
  sides?: { id: string; at: string[]; if?: FlagCond }[];
  /** Fins possibles, testées dans l'ordre : la première qui correspond. */
  endings?: { id: string; if?: FlagCond; title: string; text: string }[];
  /** Drapeau d'alliance → faction alliée (ses cartes entrent dans les Volontaires). */
  allies?: Record<string, Faction>;
}
