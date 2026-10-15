// Toutes les campagnes, dans l'ordre conseillé du fil rouge (Démons → Elfes → Nomades → Empire).
import { EMPIRE_TALKS } from './campTalks';
import { DEMONS } from './demons';
import { ELFES } from './elfes';
import { NOMADES } from './nomades';
import { EMPIRE_SCENARIOS } from './scenarios';
import type { CampaignDef, CampaignScenario } from './types';

export const EMPIRE: CampaignDef = {
  id: 'empire',
  title: 'La frontière de Kragz',
  faction: 'empire',
  rank: 4,
  pitch: 'Les elfes attaquent la frontière sans prévenir. Tiens Kragz, escorte le convoi et affronte Sylvain, le Gardien Élémentaire.',
  order: ['s1', 's2', 's3', 's4'],
  scenarios: EMPIRE_SCENARIOS,
  hero: 'Commandant',
  talks: EMPIRE_TALKS,
  endTitle: 'Fin de la campagne',
  endText: 'Sylvain est vaincu et la frontière est sauve. Mais quelqu’un a poussé les elfes à cette guerre…',
};

export const CAMPAIGNS: CampaignDef[] = [DEMONS, ELFES, NOMADES, EMPIRE];
export const CAMPAIGN_BY_ID: Record<string, CampaignDef> = Object.fromEntries(CAMPAIGNS.map(c => [c.id, c]));
/** Tous les scénarios de toutes les campagnes, par identifiant. */
export const SCENARIOS: Record<string, CampaignScenario> = Object.assign({}, ...CAMPAIGNS.map(c => c.scenarios));
