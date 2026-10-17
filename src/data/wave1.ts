// Première vague de la première édition (50 cartes, validée le 17/10/2026 à partir du tableur de relecture).
// Les champs spéciaux sont lus par le moteur (src/engine) ; les textes sont dans src/i18n/wave1.fr.ts.
import type { CardDef } from '../engine/types';

const R = 'Regiment', L = 'Leader', T = 'Tactique';
type Def = Omit<CardDef, 'id'>;

const reg = (faction: CardDef['faction'], niveau: number, cout: number, slot: CardDef['slotType'] | CardDef['slotTypes'], types: string[],
  [atk, end, arm, ini, mor]: number[], extra: Partial<CardDef> = {}): Def => ({
  cardType: R, faction, niveau, cout, ...(Array.isArray(slot) ? { slotTypes: slot } : { slotType: slot }), types,
  atk, end, arm, ini, mor, keywords: [], ...extra,
});
const lead = (faction: CardDef['faction'], niveau: number, cout: number, extra: Partial<CardDef> = {}): Def => ({
  cardType: L, faction, niveau, cout, bonusAtk: 0, bonusArm: 0, bonusIni: 0, bonusMor: 0, ...extra,
});
const tac = (faction: CardDef['faction'], niveau: number, cout: number, targetRule: CardDef['targetRule'], effect: string, extra: Partial<CardDef> = {}): Def => ({
  cardType: T, faction, niveau, cout, targetRule, effect, ...extra,
});

const DEFS: Record<string, Def> = {
  // ----- Empire -----
  tambour_bataillon: reg('empire', 1, 1, 'arriere', ['Humain', 'Empire'], [0, 25, 0, 10, 5], { keywords: ['Ralliement 1'] }),
  sergents_instructeurs: reg('empire', 2, 2, 'avant', ['Humain', 'Empire'], [10, 40, 5, 12, 7], { keywords: ['Ralliement 2'] }),
  hallebardiers_ligne: reg('empire', 2, 3, 'avant', ['Humain', 'Empire', 'Soldat'], [12, 45, 5, 12, 7], { formationArmPerEmpireNeighbor: 5 }),
  gardes_drapeau: reg('empire', 3, 4, 'avant', ['Humain', 'Empire'], [15, 50, 10, 12, 8], { formationAtkToNeighbors: 5 }),
  cavaliers_garde: reg('empire', 3, 4, 'avant', ['Humain', 'Empire', 'Monté'], [20, 40, 8, 30, 7], { killRalliesNeighbors: 1 }),
  cuirassiers_kragz: reg('empire', 4, 3, 'avant', ['Humain', 'Empire', 'Monté', 'Élite'], [18, 40, 10, 22, 7], { arrivesReady: true }),
  colonel_ligne: lead('empire', 4, 2, { typesRequired: ['Empire'], bonusAtk: 10, bonusArm: 5, leaderFormationArm: 5 }),
  grand_maitre_armes: lead('empire', 5, 3, { typesRequired: ['Empire'], bonusAtk: 15, bonusIni: 10, bonusMor: 2, leaderDoubleStrike: true }),
  appel_aux_armes: tac('empire', 4, 3, 'none', 'appelAuxArmes'),
  commandant_kragz: reg('empire', 5, 7, 'avant', ['Humain', 'Empire', 'Chevalier'], [25, 80, 15, 20, 12], { unique: true, keywords: ['Ralliement 3'], leaderCostReduction: 1 }),
  // ----- Elfes -----
  pousse_sylve: reg('elfe', 1, 1, 'avant', ['Élémentaux'], [5, 25, 0, 10, 5], { growth: { atk: 2, end: 5, max: 5 } }),
  gardien_ecorce: reg('elfe', 2, 3, 'avant', ['Élémentaux'], [10, 50, 0, 8, 7], { growth: { arm: 10, max: 3 } }),
  danseuses_lames: reg('elfe', 2, 2, 'avant', ['Elfe', 'Soldat'], [12, 25, 0, 30, 5], { atkPerTacticThisTurn: 5 }),
  lettree_conclave: reg('elfe', 2, 2, 'arriere', ['Elfe', 'Clerc'], [5, 25, 0, 20, 6], { keywords: ['Distance'], unitTacticCostReduction: 1 }),
  choeur_saisons: reg('elfe', 3, 4, 'arriere', ['Elfe', 'Clerc'], [10, 30, 0, 20, 6], { keywords: ['Distance'], drawEveryTactics: 3 }),
  pretresse_saisons: lead('elfe', 3, 1, { typesRequired: ['Elfe'], communionBonus: { atk: 10, ini: 10 } }),
  ancien_canopee: lead('elfe', 4, 2, { typesRequired: ['Elfe'], bonusArm: 5, leaderGrowthEnd: 5 }),
  sentinelle_chene: reg('elfe', 4, 5, 'avant', ['Elfe', 'Élémentaux'], [15, 70, 10, 10, 9], { communionAttackerAtkLoss: 5, tauntsDistance: true }),
  chant_seve: tac('elfe', 1, 0, 'allie-quelconque', 'chantSeve'),
  lyra: reg('elfe', 5, 6, 'arriere', ['Elfe'], [25, 50, 5, 40, 9], { unique: true, keywords: ['Distance'], tacticPing: 10 }),
  // ----- Démons -----
  augure_abime: tac('demons', 1, 0, 'none', 'augure'),
  chuchoteur_abysses: reg('demons', 2, 2, 'arriere', ['Démon'], [5, 30, 0, 15, 5], { keywords: ['Distance'], sacrificeMinLevel: 1, sacrificeGainsStats: false }),
  pacte_mineur: tac('demons', 1, 1, 'none', 'pacteMineur', { offrande: 3 }),
  appat_invocateur: tac('demons', 2, 1, 'ennemi-quelconque', 'appat', { maxTargetLevel: 2, needsFreeSlot: true }),
  murmure_abime: tac('demons', 3, 2, 'ennemi-moral-brise', 'murmure', { offrande: 2, needsFreeSlot: true }),
  maitre_pactes: lead('demons', 3, 1, { typesRequired: ['Démon'], bonusAtk: 5, drawOnFirstCardLassitude: true }),
  rempart_chair: tac('demons', 2, 1, 'allie-quelconque', 'rempartChair', { offrande: 2 }),
  gargouille_sentinelle: reg('demons', 3, 3, 'arriere', ['Démon'], [10, 40, 10, 10, 6], { keywords: ['Distance'], punishesAttackersOfNeighbors: 1 }),
  legion_morvak: reg('demons', 4, 0, ['avant', 'arriere', 'isole'], ['Démon'], [5, 10, 5, 5, 2], {
    keywords: ['Effrayant 1'], sacrificeMinLevel: 1, sacrificeGainsStats: true, sacrificeGainsKeywords: true, sacrificeGainsMor: true, sacrificeReplaysArrival: true,
  }),
  morvak: reg('demons', 5, 7, 'avant', ['Humain', 'Magicien'], [20, 60, 5, 20, 10], { unique: true, drawOnOwnSacrifice: 1 }),
  // ----- Nomades -----
  voleurs_provisions: reg('nomades', 1, 1, 'avant', ['Humain', 'Nomade'], [5, 20, 0, 25, 4], { millOnAllyDeath: 1 }),
  colporteur: reg('nomades', 1, 1, 'arriere', ['Humain', 'Nomade'], [0, 20, 0, 10, 4], { keywords: ['Marché'] }),
  danseurs_sable: reg('nomades', 2, 2, 'avant', ['Humain', 'Nomade'], [8, 25, 0, 30, 5], { keywords: ['Mirage 1'], onDeathOpponentMill: 2 }),
  razzieurs_dunes: reg('nomades', 2, 3, 'avant', ['Humain', 'Nomade', 'Monté'], [14, 30, 2, 32, 6], { keywords: ['Pillage 2'] }),
  puits_empoisonne: reg('nomades', 2, 2, 'isole', ['Puits'], [0, 20, 0, 0, 4], { vieTours: 3, poisonsOpponentTurn: { mill: 2, handDiscard: 1 } }),
  seigneur_caravanes: lead('nomades', 3, 1, { typesRequired: ['Nomade'], bonusIni: 5, millWhileMoreLassitude: 1 }),
  fuite_dunes: tac('nomades', 2, 1, 'nomade-allie', 'fuiteDunes'),
  terre_brulee: tac('nomades', 3, 2, 'none', 'terreBrulee'),
  mirage_oasis: tac('nomades', 1, 0, 'allie-quelconque', 'mirageOasis'),
  zahra: reg('nomades', 5, 6, 'arriere', ['Humain', 'Nomade'], [15, 50, 5, 35, 9], { unique: true, keywords: ['Distance', 'Mirage 2'], zahraMill: true }),
  // ----- Cross-faction -----
  garde_frontiere_sylvestre: reg('empire', 2, 3, 'avant', ['Elfe', 'Empire'], [12, 45, 5, 18, 7], { factions: ['empire', 'elfe'], alliance: ['Empire', 'Elfe'], allianceArm: 10 }),
  legat_varro: lead('empire', 4, 2, { factions: ['empire', 'nomades'], unique: true, typesRequiredAny: ['Empire', 'Nomade'], bonusAtk: 5, bonusMor: 2, replaysAnyArrivalOnAttach: true }),
  inquisiteur_dechu: lead('empire', 3, 1, { factions: ['empire', 'demons'], typesRequiredAny: ['Empire', 'Démon'], grantsKeywordOnAttach: 'Effrayant 1', leaderMoralFloor: 2 }),
  dryade_corrompue: reg('elfe', 3, 3, 'arriere', ['Elfe', 'Démon'], [5, 35, 0, 15, 6], { factions: ['elfe', 'demons'], healsBecomeLassitude: 20 }),
  chevaucheurs_mirage: reg('elfe', 3, 4, 'avant', ['Elfe', 'Nomade', 'Monté'], [18, 35, 2, 35, 6], { factions: ['elfe', 'nomades'], keywords: ['Mirage 1'], readyIfTacticThisTurn: true, mirageIfThreeFirstAttacks: true }),
  marchand_ames: reg('demons', 3, 3, 'arriere', ['Démon', 'Nomade'], [10, 30, 0, 15, 6], { factions: ['demons', 'nomades'], sacrificeMinLevel: 1, sacrificeGainsStats: false }),
  // ----- Neutre -----
  ravitailleur: reg('neutre', 1, 1, 'arriere', ['Humain'], [0, 25, 0, 5, 5], { onArrivalDraw: 1, onDeathDraw: 1, drawWhenDiscarded: 1 }),
  veterans_louer: reg('neutre', 3, 4, 'avant', ['Humain'], [18, 45, 8, 15, 7], { arrivesReady: true }),
  capitaine_mercenaire: lead('neutre', 2, 1, { bonusAtk: 5, bonusIni: 5, resourceOnAttach: 1 }),
  cor_ralliement: tac('neutre', 2, 1, 'none', 'corRalliement'),
};

export const WAVE1: Record<string, CardDef> = Object.fromEntries(Object.entries(DEFS).map(([id, d]) => [id, { id, ...d } as CardDef]));
export const WAVE1_IDS = Object.keys(WAVE1);
