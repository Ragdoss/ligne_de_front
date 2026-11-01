// Vague 3 (49 cartes), validée le 01/11/2026 à partir du tableur relu par Nathan (Ligne_de_Front_vague_3_v2_1.xlsx).
// Démons : le Leader qui survit au sacrifice et la succession ; Elfes : Prime (frapper avant) ; Nomades : la main adverse
// (taxe et défausse) et les Basilics ; Empire : les Leaders qui ne se perdent pas. Le Dévoreur de légions est laissé de côté.
// Le Moral du tableur inclut le +1 de l'Équilibrage 8 : on retire 1 ici, applyBalance8 le rajoute.
// Les champs spéciaux sont lus par le moteur (src/engine) ; les textes sont dans src/i18n/wave3.fr.ts.
import type { CardDef } from '../engine/types';

type Def = Omit<CardDef, 'id'>;
type F = CardDef['faction'];

const reg = (faction: F, niveau: number, cout: number, slot: CardDef['slotType'] | CardDef['slotTypes'], types: string[],
  [atk, end, arm, ini, mor]: number[], extra: Partial<CardDef> = {}): Def => ({
  cardType: 'Regiment', faction, niveau, cout, ...(Array.isArray(slot) ? { slotTypes: slot } : { slotType: slot }), types,
  atk, end, arm, ini, mor: mor! - 1, keywords: [], ...extra,
});
const lead = (faction: F, niveau: number, cout: number, extra: Partial<CardDef> = {}): Def => ({
  cardType: 'Leader', faction, niveau, cout, bonusAtk: 0, bonusArm: 0, bonusIni: 0, bonusMor: 0, ...extra,
});
const tac = (faction: F, niveau: number, cout: number, targetRule: CardDef['targetRule'], effect: string, extra: Partial<CardDef> = {}): Def => ({
  cardType: 'Tactique', faction, niveau, cout, targetRule, effect, ...extra,
});

const DEFS: Record<string, Def> = {
  // ----- Démons : le Leader qui survit au sacrifice, la succession -----
  seigneur_holocaustes: lead('demons', 4, 2, { typesRequired: ['Démon'], bonusAtk: 5, holocaustLeader: { atk: 5, mor: 1 } }),
  heritier_abime: lead('demons', 3, 2, { requiresLeader: true, bonusAtk: 10, bonusMor: 1, moralLossPerReplacedLevel: 1 }),
  usurpateur_infernal: lead('demons', 5, 1, { requiresLeader: true, typesRequired: ['Démon'], bonusAtk: 10, bonusMor: 2, grantsKeywordOnAttach: 'Effrayant 1', drawOnAttach: 2 }),
  pacte_succession: tac('demons', 2, 1, 'allie-avec-leader', 'pacteSuccession'),
  vaisseau_chair: reg('demons', 4, 2, 'avant', ['Humain', 'Elfe'], [5, 45, 0, 5, 6], { onSacrificedResource: 2, onSacrificedDemonMoralPerTurn: 1 }),
  collecteur_ames: reg('demons', 2, 2, 'arriere', ['Démon'], [8, 30, 0, 12, 6], { keywords: ['Distance'], atkOnOwnSacrifice: 5 }),
  autel_ames: reg('demons', 3, 2, 'isole', ['Démon'], [0, 40, 5, 0, 7], { vieTours: 4, resourceOnOwnSacrifice: 2 }),
  rite_passation: tac('demons', 3, 1, 'allie-avec-leader-puis-allie', 'ritePassation'),
  capacocha: reg('demons', 5, 7, 'arriere', ['Démon'], [20, 60, 10, 15, 11], { unique: true, keywords: ['Distance'], sacrificeMinLevel: 3, sacrificeGainsStats: false, lassitudeOnOwnSacrifice: 1 }),
  // ----- Elfes : Prime -----
  lames_aube: reg('elfe', 1, 1, 'avant', ['Elfe'], [10, 20, 0, 18, 5], { keywords: ['Prime'], primeAtk: 5 }),
  archere_premier_trait: reg('elfe', 2, 2, 'arriere', ['Elfe', 'Archer'], [10, 25, 0, 24, 6], { keywords: ['Distance', 'Prime'], primeMoral: 1 }),
  duelliste_sylvestre: reg('elfe', 3, 3, 'avant', ['Elfe'], [15, 35, 0, 30, 6], { keywords: ['Prime'], primeStun: true }),
  vif_argent: lead('elfe', 2, 1, { typesRequired: ['Elfe'], bonusIni: 15, leaderPrimeAtk: 10 }),
  coup_avance: tac('elfe', 1, 1, 'elfe-allie', 'coupAvance', { primeAtkGiven: 20 }),
  avantage_decisif: tac('elfe', 3, 1, 'none', 'avantageDecisif'),
  gardien_crepuscule: reg('elfe', 4, 4, 'avant', ['Elfe', 'Élémentaux'], [20, 55, 10, 20, 8], { keywords: ['Prime'], primeArm: 20 }),
  maitresse_initiative: lead('elfe', 4, 2, { typesRequired: ['Elfe'], bonusIni: 10, auraPrimeAtk: 5 }),
  vent_aurore: tac('elfe', 4, 3, 'allie-quelconque', 'ventAurore'),
  premiere_lame: reg('elfe', 5, 6, 'avant', ['Elfe'], [25, 50, 5, 50, 10], { unique: true, keywords: ['Prime'], primeExtraAttack: true }),
  // ----- Nomades : la main adverse et les Basilics -----
  chapardeuse: reg('nomades', 1, 1, 'avant', ['Humain', 'Nomade'], [8, 25, 0, 25, 5]),
  basilics_rodeur: reg('nomades', 2, 2, 'avant', ['Basilic', 'Nomade'], [10, 35, 5, 10, 6], { growOnEnemyHandDiscard: { atk: 5, end: 5 } }),
  ranconnement: tac('nomades', 2, 2, 'none', 'ranconnement'),
  dresseuse_basilics: reg('nomades', 3, 3, 'arriere', ['Humain', 'Nomade'], [10, 30, 0, 15, 6], { keywords: ['Distance'] }),
  recuperateur: lead('nomades', 2, 1, { typesRequired: ['Nomade'], bonusAtk: 5, recoverTacticOnAttach: true }),
  recyclage_sables: tac('nomades', 2, 1, 'none', 'recyclageSables'),
  mirage_morts: tac('nomades', 3, 2, 'none', 'mirageMorts'),
  interrogatoire: tac('nomades', 3, 2, 'none', 'interrogatoire'),
  cheikh_ossements: lead('nomades', 4, 2, { typesRequired: ['Nomade'], statPerEnemyDiscard: 1, statPerEnemyDiscardMax: 20 }),
  basilic_necropole: reg('nomades', 5, 6, 'arriere', ['Basilic', 'Nomade'], [15, 60, 5, 20, 10], { unique: true }),
  // ----- Empire : les Leaders qui ne se perdent pas -----
  officier_releve: lead('empire', 2, 1, { typesRequired: ['Empire'], bonusArm: 5, relayOnCarrierDeath: true }),
  porte_drapeau_garde: reg('empire', 2, 2, 'avant', ['Humain', 'Empire'], [10, 35, 5, 15, 7], { moralOnNeighborLeaderAttach: 2 }),
  ecole_officiers: tac('empire', 3, 1, 'none', 'ecoleOfficiers'),
  ordre_releve: tac('empire', 2, 1, 'allie-avec-leader-puis-empire', 'ordreReleve'),
  veterans_ligne: reg('empire', 3, 3, 'avant', ['Humain', 'Empire'], [15, 45, 10, 12, 8], { rowMoralEachTurn: 1 }),
  garde_imperiale: reg('empire', 4, 5, 'avant', ['Humain', 'Empire', 'Élite'], [22, 60, 15, 15, 10], { armBonusWithLeader: 5, atkBonusWithLeader: 5 }),
  marechal_campagne: lead('empire', 5, 3, { typesRequired: ['Empire'], bonusAtk: 10, bonusArm: 10, bonusMor: 2, relayOnCarrierDeath: true }),
  maximilien: reg('empire', 5, 6, 'avant', ['Humain', 'Empire'], [20, 60, 15, 20, 13], { unique: true, keywords: ['Ralliement 2'], leadersReturnToHand: true }),
  // ----- Bi-factions -----
  archers_garde_sylvestre: reg('empire', 3, 3, 'arriere', ['Elfe', 'Empire', 'Archer'], [15, 35, 5, 20, 7], { factions: ['empire', 'elfe'], keywords: ['Distance'], preyAtkWithLeader: 10 }),
  bourreau_legion: lead('empire', 3, 1, { factions: ['empire', 'demons'], typesRequiredAny: ['Empire', 'Démon'], bonusAtk: 5, leaderOnSacrifice: { mor: 2, atk: 10 } }),
  percepteur_imperial: reg('empire', 2, 2, 'avant', ['Humain', 'Empire', 'Nomade'], [10, 35, 5, 12, 7], { factions: ['empire', 'nomades'] }),
  chasseresse_damnee: reg('elfe', 3, 3, 'arriere', ['Elfe', 'Démon'], [15, 30, 0, 22, 6], { factions: ['elfe', 'demons'], keywords: ['Distance'], preyDeathLassitudeLoss: 2, preyOnAnySacrifice: true }),
  coursiers_mirage: reg('elfe', 2, 3, 'avant', ['Elfe', 'Nomade', 'Monté'], [12, 30, 0, 40, 6], { factions: ['elfe', 'nomades'], keywords: ['Prime'], primeDiscard: 1 }),
  marchand_damnes: reg('demons', 3, 2, 'avant', ['Démon', 'Nomade'], [10, 35, 5, 12, 7], { factions: ['demons', 'nomades'], sacrificeMinLevel: 1, sacrificeGainsStats: false }),
  // ----- Neutres -----
  sentinelle_route: reg('neutre', 1, 1, 'arriere', ['Humain'], [6, 20, 0, 15, 5], { keywords: ['Distance'] }),
  garde_corps: lead('neutre', 1, 0, { bonusEnd: 10 }),
  ralliement_urgence: tac('neutre', 3, 1, 'none', 'corRalliement', { rallyBroken: 3 }),
  forgeron_campagne: reg('neutre', 2, 2, 'isole', ['Humain'], [0, 30, 0, 5, 3], { armToRandomAllyEachTurn: 5 }),
  eclaireur_mercenaire: reg('neutre', 2, 1, 'avant', ['Humain'], [10, 20, 0, 35, 5], { arrivesReady: true }),
  bourse_guerre: tac('neutre', 1, 1, 'none', 'bourseGuerre'),
};

export const WAVE3: Record<string, CardDef> = Object.fromEntries(Object.entries(DEFS).map(([id, d]) => [id, { id, ...d } as CardDef]));
export const WAVE3_IDS = Object.keys(WAVE3);
