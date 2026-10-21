// Réglage de difficulté par scénario (21/10/2026) : ressources de départ en plus et seuil de défaite par lassitude
// du joueur, pour que l'ordinateur jouant le camp du joueur gagne 50 à 60 % des parties (tools/tune-campaign.ts).
// Absent = réglage commun de CAMPAIGN_EASE (src/campaign/campaign.ts). Le contenu des scénarios n'est pas modifié.
export interface ScenarioEase {
  /** Ressources en plus au départ. */
  startResource: number;
  /** Seuil de défaite par lassitude du joueur, en multiple du seuil du scénario. */
  lassitudeMul: number;
}
export const SCENARIO_EASE: Record<string, ScenarioEase> = {};
