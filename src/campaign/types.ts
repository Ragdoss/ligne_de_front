// Format des scénarios de campagne (données) — proche de celui du simulateur prototype.
import type { Alarm, DialogLine, Faction, PlayerId, ScenarioEvent, Weather } from '../engine/types';

export interface SideDef {
  faction: Faction;
  label: string;
  /** Deck imposé (ordinateur ; le joueur, lui, joue le deck construit depuis son pool). */
  deckList?: string[];
  ai: boolean;
  start?: { avant?: Record<string, string>; arriere?: Record<string, string>; isole?: string };
  startHand?: string[];
}

export interface Reward {
  order?: ('gifts' | 'exchange' | 'picks')[];
  gifts?: string[];
  exchange?: { from: string; to: string; count: number };
  picks?: { count: number; options: string[]; unique?: boolean; title?: string; text?: string };
  /** Réplique qui présente chaque étape de la récompense (sinon : texte par défaut du Commandant). */
  lines?: Partial<Record<'gifts' | 'exchange' | 'picks', DialogLine>>;
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
}
