// Équilibrage 6 (17/10/2026) : les Nomades gagnaient 42 % des parties de l'échelle par pioche vide.
// Mesuré avec tools/faction-card-impact.ts : decks Nomades aléatoires contre les qualifiés des autres factions, 50 % → 42 %.
import type { CardDef } from '../engine/types';

export const BALANCE_6: Record<string, Partial<CardDef>> = {
  fuite_dunes: { cout: 2, millCap: 2 },
  voleurs_provisions: { millOnAllyDeathNoStack: true },
  puits_empoisonne: { vieTours: 2 },
  archeotacticiens: { archeoTypes: ['Tactique', 'Regiment'], cout: 5 },
  jeune_nomade: { end: 20 },
  seigneur_caravanes: { cout: 2 },
  terre_brulee: { millCap: 2 },
  mirage_oasis: { cout: 1 },
};
