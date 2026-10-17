// Vague 2 (Elfes) : cibler les régiments faibles, tenir la première ligne, frapper les soutiens.
// Validée le 17/10/2026 (Pas du vent retirée ; Racines tirantes devenues Racines immobilisantes).
// Les champs spéciaux sont lus par le moteur (src/engine) ; les textes sont dans src/i18n/wave2.fr.ts.
import type { CardDef } from '../engine/types';

type Def = Omit<CardDef, 'id'>;

const reg = (niveau: number, cout: number, slot: CardDef['slotType'] | CardDef['slotTypes'], types: string[],
  [atk, end, arm, ini, mor]: number[], extra: Partial<CardDef> = {}): Def => ({
  cardType: 'Regiment', faction: 'elfe', niveau, cout, ...(Array.isArray(slot) ? { slotTypes: slot } : { slotType: slot }), types,
  atk, end, arm, ini, mor, keywords: [], ...extra,
});
const lead = (niveau: number, cout: number, extra: Partial<CardDef> = {}): Def => ({
  cardType: 'Leader', faction: 'elfe', niveau, cout, bonusAtk: 0, bonusArm: 0, bonusIni: 0, bonusMor: 0, ...extra,
});
const tac = (niveau: number, cout: number, targetRule: CardDef['targetRule'], effect: string, extra: Partial<CardDef> = {}): Def => ({
  cardType: 'Tactique', faction: 'elfe', niveau, cout, targetRule, effect, ...extra,
});

const DEFS: Record<string, Def> = {
  // ----- Cibler les régiments faibles -----
  sentinelle_cimes: reg(2, 3, 'arriere', ['Elfe', 'Archer'], [12, 25, 0, 30, 5], { keywords: ['Distance'], bonusVsBroken: 10 }),
  traqueuse_sylvestre: reg(3, 4, 'arriere', ['Elfe', 'Archer'], [15, 30, 0, 35, 6], { keywords: ['Distance'], targetsLowestEnd: true }),
  marque_chasseur: tac(1, 0, 'ennemi-quelconque', 'marqueChasseur'),
  chant_traque: tac(4, 3, 'none', 'chantTraque'),
  seigneure_chasse: reg(5, 6, 'arriere', ['Elfe', 'Archer'], [25, 50, 5, 40, 9], { unique: true, keywords: ['Distance'], brokenEnemyDeathLassitude: 2 }),
  visez_faibles: tac(2, 2, 'ennemi-arriere', 'visezFaibles'),
  // ----- Tenir la première ligne -----
  gardienne_seuil: reg(3, 4, 'arriere', ['Elfe', 'Clerc'], [5, 35, 0, 15, 7], { healsFrontNeighborsBeforeCombat: { end: 5, mor: 1 } }),
  racines_protectrices: tac(2, 2, 'allie-quelconque', 'racinesProtectrices'),
  benediction_sylve: lead(2, 1, { typesRequiredAny: ['Elfe', 'Élémentaux'], bonusArm: 5, leaderSavesOnce: true }),
  // ----- Placement et soutiens -----
  racines_immobilisantes: tac(2, 2, 'ennemi-quelconque', 'racinesImmobilisantes'),
  eclaireuse_fourres: reg(2, 2, ['avant', 'arriere'], ['Elfe', 'Archer'], [12, 25, 0, 30, 5], { keywords: ['Distance'] }),
  maitre_embuscades: lead(3, 1, { typesRequired: ['Elfe'], bonusAtk: 5, leaderIniDiffAtk: true }),
};

export const WAVE2: Record<string, CardDef> = Object.fromEntries(Object.entries(DEFS).map(([id, d]) => [id, { id, ...d } as CardDef]));
export const WAVE2_IDS = Object.keys(WAVE2);
