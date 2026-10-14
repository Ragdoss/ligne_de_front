// Format des scénarios de campagne (données) — proche de celui du simulateur prototype.
import type { DialogLine, Faction, PlayerId, ScenarioEvent } from '../engine/types';

export interface SideDef {
  faction: Faction;
  label: string;
  /** Deck imposé (ordinateur ; le joueur, lui, joue le deck construit depuis son pool). */
  deckList?: string[];
  ai: boolean;
  start?: { avant?: Record<string, string>; arriere?: Record<string, string> };
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
  emptyDeckDefeat?: boolean;
  startLevel?: Partial<Record<PlayerId, number>>;
  levelThresholds?: Partial<Record<PlayerId, number[]>>;
  moralCheckLassitude?: number;
  moralCheckLostResource?: Partial<Record<PlayerId, { base: number; level3: number }>>;
  endTurnLassitude?: Partial<Record<PlayerId, number>>;
  startOverrides?: Record<string, { mor?: number }>;
  convoy?: { cardId: string; pid: PlayerId; firstTurn: number; every: number };
  events: ScenarioEvent[];
  reward?: Reward;
}
