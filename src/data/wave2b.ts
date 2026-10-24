// Vague 2, suite (38 cartes : Empire, Démons, Nomades, cross-faction, neutres), validée le 18/10/2026
// à partir du tableur relu par Nathan. Les champs spéciaux sont lus par le moteur ; textes dans src/i18n/wave2b.fr.ts.
import type { CardDef } from '../engine/types';

type Def = Omit<CardDef, 'id'>;
type F = CardDef['faction'];

const reg = (faction: F, niveau: number, cout: number, slot: CardDef['slotType'] | CardDef['slotTypes'], types: string[],
  [atk, end, arm, ini, mor]: number[], extra: Partial<CardDef> = {}): Def => ({
  cardType: 'Regiment', faction, niveau, cout, ...(Array.isArray(slot) ? { slotTypes: slot } : { slotType: slot }), types,
  atk, end, arm, ini, mor, keywords: [], ...extra,
});
const lead = (faction: F, niveau: number, cout: number, extra: Partial<CardDef> = {}): Def => ({
  cardType: 'Leader', faction, niveau, cout, bonusAtk: 0, bonusArm: 0, bonusIni: 0, bonusMor: 0, ...extra,
});
const tac = (faction: F, niveau: number, cout: number, targetRule: CardDef['targetRule'], effect: string, extra: Partial<CardDef> = {}): Def => ({
  cardType: 'Tactique', faction, niveau, cout, targetRule, effect, ...extra,
});

const DEFS: Record<string, Def> = {
  // ----- Empire : Formation, cavalerie lourde, Leaders 4-5, fin de partie -----
  ecuyers_garde: reg('empire', 1, 1, 'avant', ['Humain', 'Empire', 'Recrue'], [8, 25, 5, 15, 5], { formationAtkIfMountedNeighbor: 5 }),
  arbaletriers_rang: reg('empire', 2, 3, 'arriere', ['Humain', 'Empire', 'Arbalétrier'], [20, 30, 0, 12, 6], { keywords: ['Distance', 'Lent'], formationAtkPerEmpireNeighbor: 5 }),
  lanciers_rempart: reg('empire', 2, 2, 'avant', ['Humain', 'Empire', 'Lancier'], [12, 40, 5, 10, 6], { armIfTwoRowNeighbors: 10 }),
  chevaliers_ordre: reg('empire', 3, 4, 'avant', ['Humain', 'Empire', 'Monté', 'Chevalier'], [20, 45, 10, 25, 8], { keywords: ['Ralliement 1', 'Prêt'], arrivesReady: true }),
  cuirassiers_lourds: reg('empire', 4, 5, 'avant', ['Humain', 'Empire', 'Monté', 'Élite'], [25, 60, 15, 20, 9], { extraAttackOnKill: true }),
  connetable: lead('empire', 4, 2, { typesRequired: ['Empire'], bonusArm: 10, bonusMor: 2, leaderFormationAtk: 5 }),
  heraut_imperial: lead('empire', 5, 3, { typesRequired: ['Empire'], bonusAtk: 5, bonusMor: 3, leaderRallyCarriersEachTurn: 1 }),
  dernier_carre: tac('empire', 4, 3, 'none', 'dernierCarre'),
  charge_decisive: tac('empire', 5, 4, 'none', 'chargeDecisive'),
  imperatrice_octavia: reg('empire', 5, 2, 'arriere', ['Humain', 'Empire'], [5, 35, 5, 10, 8], { unique: true, keywords: ['Ralliement 2'], auraLeaderCarriers: 5 }),
  // ----- Démons : défense, régiments arrière, pioche, sacrifice -----
  garde_asura: reg('demons', 1, 1, 'arriere', ['Elfe', 'Archer'], [5, 20, 0, 10, 4], { keywords: ['Distance'], onSacrificedDraw: 1 }),
  sorciere_pacte: reg('demons', 2, 2, 'arriere', ['Démon', 'Magicien'], [8, 30, 0, 15, 6], { keywords: ['Distance'], atkOnCardLassitude: 5 }),
  voile_ombre: tac('demons', 2, 1, 'allie-quelconque', 'voileOmbre', { offrande: 2 }),
  gardien_chaines: reg('demons', 3, 3, ['avant', 'arriere'], ['Démon'], [10, 45, 10, 10, 7], { keywords: ['Distance'], sacrificeMinLevel: 1, sacrificeGainsStats: false, chainsLossPerLevel: 3 }),
  grimoire_interdit: tac('demons', 3, 2, 'none', 'grimoire', { offrande: 1 }),
  chaines_abime: tac('demons', 3, 2, 'ennemi-quelconque', 'chainesAbime', { offrande: 2 }),
  bourreau_abime: reg('demons', 4, 4, 'avant', ['Démon'], [22, 50, 5, 18, 8], { keywords: ['Effrayant 1'], atkPerBrokenOnBoard: 10 }),
  seigneur_tourments: lead('demons', 4, 2, { typesRequired: ['Démon'], bonusAtk: 10, grantsKeywordOnAttach: 'Effrayant 1', leaderKillLassitude: 1 }),
  rituel_sang_noir: tac('demons', 4, 2, 'allie-quelconque', 'rituelSang'),
  archidemon_origines: reg('demons', 5, 8, 'avant', ['Démon'], [35, 70, 10, 15, 10], { unique: true, keywords: ['Effrayant 2'], sacrificeMinLevel: 3, sacrificeGainsStats: false, arrivalDestroyHighestMoral: true }),
  // ----- Nomades : caravane, Marché, Mirage -----
  chamelier: reg('nomades', 1, 1, 'avant', ['Humain', 'Nomade'], [8, 25, 0, 25, 4], { keywords: ['Marché'] }),
  eclaireuse_sables: reg('nomades', 1, 1, 'arriere', ['Humain', 'Nomade'], [6, 20, 0, 30, 4], { keywords: ['Distance', 'Mirage 1'] }),
  sentinelles_oasis: reg('nomades', 2, 2, 'isole', ['Humain', 'Nomade'], [0, 40, 5, 0, 6], { vieTours: 4, auraNomadeArm: 5 }),
  maitre_bazar: lead('nomades', 2, 1, { typesRequired: ['Nomade'], bonusIni: 5, grantsKeywordOnAttach: 'Marché', marketResource: 1 }),
  caravanier_arme: reg('nomades', 3, 3, 'avant', ['Humain', 'Nomade'], [15, 45, 5, 20, 7], { resourceIfCaravane: 1 }),
  tempete_lames: tac('nomades', 3, 1, 'none', 'tempeteLames'),
  emir_dunes: lead('nomades', 4, 2, { typesRequired: ['Nomade'], bonusAtk: 10, bonusIni: 10, grantsKeywordOnAttach: 'Mirage 1' }),
  al_mansur: reg('nomades', 5, 6, 'arriere', ['Humain', 'Nomade'], [15, 55, 5, 30, 9], { unique: true, generatesResourceEachTurn: 1, doubleMarket: true }),
  // ----- Cross-faction -----
  serment_traite: tac('empire', 3, 2, 'none', 'sermentTraite', { factions: ['empire', 'elfe'] }),
  contrat_convoi: tac('empire', 1, 0, 'none', 'contratConvoi', { factions: ['empire', 'nomades'] }),
  execution_exemplaire: tac('empire', 2, 1, 'allie-quelconque', 'executionExemplaire', { factions: ['empire', 'demons'] }),
  sang_seve: tac('elfe', 2, 1, 'allie-quelconque', 'sangSeve', { factions: ['elfe', 'demons'] }),
  vent_porteur: tac('elfe', 2, 1, 'none', 'ventPorteur', { factions: ['elfe', 'nomades'] }),
  basilic_demoniaque: reg('demons', 3, 3, 'avant', ['Démon', 'Basilic'], [18, 40, 5, 10, 6], { factions: ['demons', 'nomades'], keywords: ['Effrayant 1'], sacrificeMinLevel: 2, sacrificeGainsStats: false }),
  // ----- Neutres -----
  milice_village: reg('neutre', 1, 1, 'avant', ['Humain'], [8, 30, 0, 10, 5], { armIfHumanNeighbor: 5 }),
  ingenieurs_siege: reg('neutre', 3, 3, 'arriere', ['Humain'], [15, 30, 0, 10, 6], { keywords: ['Distance', 'Pénétration 10'] }),
  quartier_maitre: lead('neutre', 2, 1, { bonusEnd: 5, leaderResourceEachTurn: 1 }),
  vivres_campagne: tac('neutre', 2, 1, 'none', 'vivresCampagne'),
};

export const WAVE2B: Record<string, CardDef> = Object.fromEntries(Object.entries(DEFS).map(([id, d]) => [id, { id, ...d } as CardDef]));
export const WAVE2B_IDS = Object.keys(WAVE2B);
