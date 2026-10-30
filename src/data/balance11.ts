// Équilibrage 11 (30/10/2026) : l'usure des Nomades coûte 1 de plus (les 11 cartes qui défaussent le dessus de la pioche adverse).
import type { CardDef } from '../engine/types';

export const BALANCE_11: Record<string, Partial<CardDef>> = {
  frondeur_nomade: { cout: 2 },
  voleurs_provisions: { cout: 3 },
  danseurs_sable: { cout: 3 },
  seigneur_caravanes: { cout: 3 },
  fuite_dunes: { cout: 3 },
  rancon_desert: { cout: 4 },
  puits_empoisonne: { cout: 4 },
  terre_brulee: { cout: 4 },
  razzieurs_dunes: { cout: 4 },
  archeotacticiens: { cout: 6 },
  zahra: { cout: 7 },
};
