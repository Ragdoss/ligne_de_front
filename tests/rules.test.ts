// Tests des règles de base (GDD). Chaque test vérifie une règle précise sur un plateau construit à la main.
import { describe, expect, it } from 'vitest';
import { pickTarget } from '../src/engine/combat';
import { Ctx } from '../src/engine/ctx';
import { applyAction, createGame, legalActions } from '../src/engine/game';
import { DEMO_DECKS } from '../src/data/decks';
import { act, blankGame, give, place, unitAt } from './helpers';

const endTurn = { type: 'endTurn' } as const;

describe('Mise en place', () => {
  it('main de départ : 5 cartes dont au moins 3 régiments de niveau 1, niveaux 4-5 en réserve', () => {
    const s = createGame({ seed: 1, A: { faction: 'empire', deck: DEMO_DECKS.empire! }, B: { faction: 'elfe', deck: DEMO_DECKS.elfe! } });
    for (const p of ['A', 'B'] as const) {
      const pl = s.players[p];
      expect(pl.hand).toHaveLength(5);
      const lvl1 = pl.hand.filter(h => h.cardId === 'recrue_imp' || h.cardId === 'eclaireur_elfe' || h.cardId === 'paysans' || h.cardId === 'elem_terre');
      expect(lvl1.length).toBeGreaterThanOrEqual(3);
      expect(pl.reserve.length).toBeGreaterThan(0);
      expect(pl.deck.some(id => ['dragon_imp', 'sylvain', 'forteresse'].includes(id))).toBe(false);
    }
  });
  it('même graine = même partie', () => {
    const mk = () => createGame({ seed: 'abc', A: { faction: 'empire', deck: DEMO_DECKS.empire! }, B: { faction: 'elfe', deck: DEMO_DECKS.elfe! } });
    expect(mk()).toEqual(mk());
  });
});

describe('Déploiement', () => {
  it('payer le coût et occuper un emplacement du bon rang', () => {
    let s = blankGame();
    const uid = give(s, 'A', 'recrue_imp');
    expect(applyAction(s, { type: 'play', handUid: uid, target: { player: 'A', zone: 'arriere', idx: 0 } }).ok).toBe(false);
    s = act(s, { type: 'play', handUid: uid, target: { player: 'A', zone: 'avant', idx: 1 } }).state;
    expect(unitAt(s, 'A', 'avant', 1)?.cardId).toBe('recrue_imp');
    expect(s.players.A.resource).toBe(0);
  });
  it('niveau requis et ressources insuffisantes refusés', () => {
    const s = blankGame();
    const lvl3 = give(s, 'A', 'chevalier_prov');
    expect(applyAction(s, { type: 'play', handUid: lvl3, target: { player: 'A', zone: 'avant', idx: 0 } })).toEqual({ ok: false, error: 'level' });
    s.players.A.level = 3;
    expect(applyAction(s, { type: 'play', handUid: lvl3, target: { player: 'A', zone: 'avant', idx: 0 } })).toEqual({ ok: false, error: 'resource' });
  });
  it("pénalité d'apparition : -50 % d'ATK le tour du déploiement (sauf « arrive prêt »)", () => {
    const s = blankGame();
    const ctx = new Ctx(s);
    const r = place(s, 'A', 'avant', 0, 'recrue_imp', { justDeployed: true });
    const f = place(s, 'A', 'avant', 1, 'elem_feu', { justDeployed: true });
    expect(ctx.effectiveAtk(r)).toBe(5);
    expect(ctx.effectiveAtk(f)).toBe(25);
  });
  it("l'ATK baisse avec l'Endurance (50 % à 0 END, 100 % à pleine END)", () => {
    const s = blankGame();
    const r = place(s, 'A', 'avant', 0, 'recrue_imp', { currentEnd: 15 });
    expect(new Ctx(s).effectiveAtk(r)).toBe(8); // 10 × 0,75 = 7,5 arrondi
  });
});

describe('Ciblage', () => {
  it('avant : le régiment en miroir', () => {
    const s = blankGame();
    const a = place(s, 'A', 'avant', 1, 'recrue_imp');
    const m = place(s, 'B', 'avant', 1, 'eclaireur_elfe');
    place(s, 'B', 'arriere', 0, 'archer_bois', { currentMor: 1 });
    expect(pickTarget(new Ctx(s), a, 'A', 'avant', 1)?.uid).toBe(m.uid);
  });
  it('percée : sans miroir, le plus faible en Moral des arrières adjacents', () => {
    const s = blankGame();
    const a = place(s, 'A', 'avant', 1, 'recrue_imp');
    place(s, 'B', 'arriere', 0, 'archer_bois', { currentMor: 4 });
    const weak = place(s, 'B', 'arriere', 1, 'archer_bois', { currentMor: 2 });
    place(s, 'B', 'arriere', 2, 'archer_bois', { currentMor: 1 }); // non adjacent à l'avant 1
    expect(pickTarget(new Ctx(s), a, 'A', 'avant', 1)?.uid).toBe(weak.uid);
  });
  it('Distance : le plus faible en Moral de tout le plateau adverse (hors isolé)', () => {
    const s = blankGame();
    const a = place(s, 'A', 'arriere', 0, 'archer_imp');
    place(s, 'B', 'avant', 0, 'eclaireur_elfe');
    const weak = place(s, 'B', 'arriere', 2, 'archer_bois', { currentMor: 2 });
    expect(pickTarget(new Ctx(s), a, 'A', 'arriere', 0)?.uid).toBe(weak.uid);
  });
  it('arrière sans Distance : les deux avants qui lui font face', () => {
    const s = blankGame();
    const a = place(s, 'A', 'arriere', 1, 'arbaletrier_imp');
    place(s, 'B', 'avant', 0, 'eclaireur_elfe', { currentMor: 1 }); // pas en face
    const face = place(s, 'B', 'avant', 2, 'eclaireur_elfe', { currentMor: 3 });
    expect(pickTarget(new Ctx(s), a, 'A', 'arriere', 1)?.uid).toBe(face.uid);
  });
});

describe('Combat de fin de tour', () => {
  it('dégâts = ATK − ARM, chaque attaque coûte 1 Moral à la cible', () => {
    let s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'avant', 0, 'recrue_imp');
    const t = place(s, 'B', 'avant', 0, 'elem_terre');
    s = act(s, endTurn).state;
    const after = s.players.B.board.avant[0]!;
    expect(after.uid).toBe(t.uid);
    expect(after.currentEnd).toBe(50 - (10 - 5));
    expect(after.currentMor).toBe(6 + 1 - 1); // +1 Moral (Équilibrage 8)
  });
  it("destruction : lassitude = niveau, alliés -1 Moral, l'attaquant +1 Moral", () => {
    let s = blankGame();
    s.config.moralCheck = false;
    const killer = place(s, 'A', 'avant', 0, 'recrue_imp', { currentMor: 3, ini: 99 });
    place(s, 'B', 'avant', 0, 'eclaireur_elfe', { currentEnd: 5 });
    const ally = place(s, 'B', 'avant', 2, 'eclaireur_elfe');
    s = act(s, endTurn).state;
    expect(s.players.B.board.avant[0]).toBeNull();
    expect(s.players.B.points).toBe(1);
    expect(s.players.B.discard).toContain('eclaireur_elfe');
    expect(s.players.B.board.avant[2]!.currentMor).toBe(ally.currentMor - 1);
    expect(s.players.A.board.avant[0]!.currentMor).toBe(killer.currentMor + 1);
  });
  it('Minions : aucune lassitude ni perte de Moral pour les alliés', () => {
    let s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'avant', 0, 'recrue_imp');
    place(s, 'B', 'avant', 0, 'palissade_regiment', { currentEnd: 5, isToken: true });
    const ally = place(s, 'B', 'avant', 2, 'eclaireur_elfe');
    s = act(s, endTurn).state;
    expect(s.players.B.board.avant[0]).toBeNull();
    expect(s.players.B.points).toBe(0);
    expect(s.players.B.board.avant[2]!.currentMor).toBe(ally.currentMor);
    expect(s.players.B.discard).toHaveLength(0); // jeton : pas de défausse
  });
  it("ordre d'Initiative : le plus rapide frappe d'abord ; à égalité, le joueur actif", () => {
    let s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'avant', 0, 'recrue_imp', { ini: 20, currentEnd: 5 });
    place(s, 'B', 'avant', 0, 'eclaireur_elfe', { ini: 20, currentEnd: 5 });
    const r = act(s, endTurn);
    const atk = r.events.filter(e => e.type === 'attack');
    expect(atk).toHaveLength(1); // A frappe d'abord et tue, B ne riposte pas
    expect(r.state.players.B.board.avant[0]).toBeNull();
  });
  it("Lent : n'attaque qu'au combat de fin de tour de son contrôleur", () => {
    let s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'arriere', 1, 'arbaletrier_imp');
    place(s, 'B', 'avant', 1, 'elem_terre');
    s.active = 'B';
    const r1 = act(s, endTurn);
    expect(r1.events.some(e => e.type === 'attack' && e.attackerCard === 'arbaletrier_imp')).toBe(false);
    const r2 = act(r1.state, endTurn);
    expect(r2.events.some(e => e.type === 'attack' && e.attackerCard === 'arbaletrier_imp')).toBe(true);
  });
  it('Lancier : +15 ATK contre un régiment Monté', () => {
    let s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'avant', 0, 'lancier_emp');
    place(s, 'B', 'avant', 0, 'cavalier_elfe', { ini: 0 });
    const ev = act(s, endTurn).events.find(e => e.type === 'attack' && e.attackerCard === 'lancier_emp');
    expect(ev && ev.type === 'attack' && ev.atk).toBe(12 + 15);
  });
  it('Moral brisé (≤ 1/3) : le bonus de Leader ne compte plus', () => {
    const s = blankGame();
    const u = place(s, 'A', 'avant', 0, 'recrue_imp', { leader: 'lieutenant', leaderOwner: 'A' });
    const ctx = new Ctx(s);
    expect(ctx.effectiveAtk(u)).toBe(15);
    u.currentMor = 1;
    ctx.checkBroken(u);
    expect(u.brokenMorale).toBe(true);
    expect(ctx.effectiveAtk(u)).toBe(10);
  });
});

describe('Comparaison de Moral', () => {
  it('le Moral total le plus bas prend 1/1/2/2/3 lassitude selon le plus haut niveau (1 à 5) ; égalité = rien', () => {
    let s = blankGame();
    place(s, 'A', 'arriere', 0, 'paysans'); // 3 Moral, n'attaque pas
    place(s, 'B', 'arriere', 2, 'paysans', { currentMor: 2 });
    s.players.B.level = 3;
    const r = act(s, endTurn);
    const mc = r.events.find(e => e.type === 'moralCheck');
    expect(mc).toMatchObject({ loser: 'B', amount: 2 });
    expect(r.state.players.B.points).toBe(2);
    s = blankGame();
    place(s, 'A', 'arriere', 0, 'paysans');
    place(s, 'B', 'arriere', 2, 'paysans');
    expect(act(s, endTurn).events.find(e => e.type === 'moralCheck')).toMatchObject({ loser: null });
  });
});

describe('Ressources, niveaux, pioche', () => {
  it('ressource = niveau + reliquat ; Paysans +1', () => {
    let s = blankGame();
    place(s, 'B', 'arriere', 0, 'paysans');
    place(s, 'A', 'arriere', 0, 'paysans');
    s.players.B.resource = 2;
    s = act(s, endTurn).state; // tour de B
    expect(s.players.B.resource).toBe(1 + 2 + 1);
  });
  it('niveaux à 4/9/16/25 points ; les cartes de réserve rejoignent la pioche au niveau 4', () => {
    const s = createGame({ seed: 2, A: { faction: 'empire', deck: [...Array(20).fill('recrue_imp'), 'dragon_imp'] }, B: { faction: 'elfe', deck: Array(20).fill('eclaireur_elfe') } });
    const ctx = new Ctx(s);
    ctx.gainLassitude('A', 4, 'test');
    expect(s.players.A.level).toBe(2);
    ctx.gainLassitude('A', 12, 'test');
    expect(s.players.A.level).toBe(4);
    expect(s.players.A.reserve).toHaveLength(0);
    expect(s.players.A.deck).toContain('dragon_imp');
  });
  it('pioche : 1 / 1 / 2 / 2 / 3 cartes aux niveaux 1 à 5', () => {
    for (const [lvl, n] of [[1, 1], [2, 1], [3, 2], [4, 2], [5, 3]] as const) {
      let s = blankGame();
      place(s, 'A', 'avant', 0, 'recrue_imp');
      place(s, 'B', 'avant', 3, 'eclaireur_elfe');
      s.players.B.level = lvl;
      s.config.moralCheck = false;
      s = act(s, endTurn).state;
      expect(s.players.B.hand, `niveau ${lvl}`).toHaveLength(n);
    }
  });
  it('défaites : 50 points de lassitude, aucun régiment en fin de tour, pioche vide', () => {
    let s = blankGame();
    new Ctx(s).gainLassitude('A', 50, 'test');
    expect(s.over).toEqual({ winner: 'B', reason: 'lassitude' });
    s = blankGame();
    place(s, 'B', 'avant', 0, 'eclaireur_elfe');
    expect(act(s, endTurn).state.over).toEqual({ winner: 'B', reason: 'noRegiment' });
    s = blankGame();
    place(s, 'A', 'avant', 0, 'recrue_imp');
    place(s, 'B', 'avant', 3, 'eclaireur_elfe');
    s.players.B.deck = [];
    expect(act(s, endTurn).state.over).toEqual({ winner: 'A', reason: 'emptyDeck' });
  });
});

describe('Leaders', () => {
  it('bonus au porteur, types requis, un seul Leader par régiment', () => {
    let s = blankGame();
    s.players.A.level = 3; s.players.A.resource = 5;
    const r = place(s, 'A', 'avant', 0, 'recrue_imp');
    const l1 = give(s, 'A', 'lieutenant');
    const l2 = give(s, 'A', 'capitaine_garde');
    s = act(s, { type: 'play', handUid: l1, target: { player: 'A', zone: 'avant', idx: 0 } }).state;
    const u = s.players.A.board.avant[0]!;
    expect(u.leader).toBe('lieutenant');
    expect(u.maxMor).toBe(r.maxMor + 2);
    expect(applyAction(s, { type: 'play', handUid: l2, target: { player: 'A', zone: 'avant', idx: 0 } })).toEqual({ ok: false, error: 'badTarget' });
  });
});

describe('Tactiques', () => {
  it('Palissade : coût = emplacements avant vides, crée des Palissades (Minions)', () => {
    let s = blankGame();
    s.players.A.level = 2; s.players.A.resource = 9;
    place(s, 'A', 'avant', 0, 'recrue_imp');
    const t = give(s, 'A', 'palissade_tactique');
    s = act(s, { type: 'play', handUid: t }).state;
    expect(s.players.A.resource).toBe(6);
    expect(s.players.A.board.avant.filter(u => u?.cardId === 'palissade_regiment')).toHaveLength(3);
  });
  it('Ralliement : +3 Moral, +5 si le Moral est brisé', () => {
    let s = blankGame();
    s.players.A.level = 2; s.players.A.resource = 9;
    place(s, 'A', 'avant', 0, 'recrue_imp', { leader: 'lieutenant', leaderOwner: 'A', maxMor: 9, currentMor: 2, brokenMorale: true });
    const t = give(s, 'A', 'ralliement');
    s = act(s, { type: 'play', handUid: t, target: { player: 'A', zone: 'avant', idx: 0 } }).state;
    expect(s.players.A.board.avant[0]!.currentMor).toBe(7);
    expect(s.players.A.board.avant[0]!.brokenMorale).toBe(false);
  });
  it('Changement Tectonique : déplace un régiment adverse vers une case vide (2 cibles)', () => {
    let s = blankGame();
    s.players.A.level = 3; s.players.A.resource = 9;
    const e = place(s, 'B', 'arriere', 2, 'archer_bois');
    const t = give(s, 'A', 'changement_tectonique');
    s = act(s, { type: 'play', handUid: t, target: { player: 'B', zone: 'arriere', idx: 2 }, target2: { player: 'B', zone: 'avant', idx: 1 } }).state;
    expect(s.players.B.board.avant[1]!.uid).toBe(e.uid);
  });
  it('Vision : choix parmi les 3 prochaines tactiques, placée en haut du deck', () => {
    let s = blankGame();
    s.players.A.level = 3; s.players.A.resource = 9;
    place(s, 'A', 'avant', 0, 'elem_terre');
    s.players.A.deck = ['recrue_imp', 'ralliement', 'recrue_imp', 'charge_imp', 'formation_carre', 'promotion'];
    const v = give(s, 'A', 'vision');
    s = act(s, { type: 'play', handUid: v, target: { player: 'A', zone: 'avant', idx: 0 } }).state;
    expect(s.pending[0]).toMatchObject({ kind: 'vision', options: [{ cardId: 'ralliement' }, { cardId: 'charge_imp' }, { cardId: 'formation_carre' }] });
    expect(legalActions(s)).toHaveLength(3);
    expect(applyAction(s, { type: 'endTurn' })).toEqual({ ok: false, error: 'choicePending' });
    s = act(s, { type: 'choose', option: 1 }).state;
    expect(s.players.A.deck[0]).toBe('charge_imp');
    expect(s.pending).toHaveLength(0);
  });
  it('Promotion : défausser un Leader, puis choisir parmi les 2 prochains Leaders du deck', () => {
    let s = blankGame();
    s.players.A.level = 3; s.players.A.resource = 9;
    s.players.A.deck = ['recrue_imp', 'capitaine_garde', 'recrue_imp', 'general_empire', 'lieutenant'];
    give(s, 'A', 'lieutenant');
    const p = give(s, 'A', 'promotion');
    s = act(s, { type: 'play', handUid: p }).state;
    s = act(s, { type: 'choose', option: 0 }).state;
    expect(s.players.A.discard).toContain('lieutenant');
    expect(s.pending[0]).toMatchObject({ kind: 'promotionPick', options: [{ cardId: 'capitaine_garde' }, { cardId: 'general_empire' }] });
    s = act(s, { type: 'choose', option: 1 }).state;
    expect(s.players.A.hand.map(h => h.cardId)).toEqual(['general_empire']);
  });
});

describe('Main pleine', () => {
  it('main pleine en début de tour : défausser autant que la pioche (au choix), puis piocher', () => {
    let s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'avant', 0, 'recrue_imp');
    place(s, 'B', 'avant', 3, 'eclaireur_elfe');
    s.players.B.level = 3; // pioche 2 cartes
    for (let i = 0; i < 10; i++) give(s, 'B', 'chevalier_prov');
    const deckBefore = s.players.B.deck.length;
    s = act(s, { type: 'endTurn' }).state;
    expect(s.pending[0]).toMatchObject({ kind: 'handDiscard', player: 'B' });
    s = act(s, { type: 'choose', option: 0 }).state;
    s = act(s, { type: 'choose', option: 0 }).state;
    expect(s.pending).toHaveLength(0);
    expect(s.players.B.hand).toHaveLength(10);
    expect(s.players.B.discard.filter(id => id === 'chevalier_prov')).toHaveLength(2);
    expect(s.players.B.deck.length).toBe(deckBefore - 2);
  });
});

describe('Pénétration d\'armure', () => {
  it("l'attaquant ignore les X premiers points d'Armure", () => {
    let s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'avant', 0, 'recrue_imp', { keywords: ['Pénétration 5'] });
    place(s, 'B', 'avant', 0, 'chevalier_prov', { ini: 0, baseArm: 15 });
    const ev = act(s, { type: 'endTurn' }).events.find(e => e.type === 'attack' && e.attackerCard === 'recrue_imp');
    expect(ev).toMatchObject({ arm: 10, damage: 0 });
    s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'avant', 0, 'recrue_imp', { keywords: ['Pénétration 5'] });
    place(s, 'B', 'avant', 0, 'elem_terre', { ini: 0 });
    expect(act(s, { type: 'endTurn' }).events.find(e => e.type === 'attack' && e.attackerCard === 'recrue_imp')).toMatchObject({ arm: 0, damage: 10 });
  });
});
