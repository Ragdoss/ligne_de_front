// Tests des mécaniques propres aux Démons et aux Nomades.
import { describe, expect, it } from 'vitest';
import { Ctx } from '../src/engine/ctx';
import { applyAction, legalActions } from '../src/engine/game';
import { act, blankGame, give, place } from './helpers';

const A_AVANT = (idx: number) => ({ player: 'A' as const, zone: 'avant' as const, idx });

describe('Démons', () => {
  it("Démon d'Akantha : sacrifice niveau 3+, récupère les stats du sacrifié, le sacrifice compte comme une perte", () => {
    let s = blankGame();
    s.players.A.level = 3; s.players.A.resource = 9;
    place(s, 'A', 'avant', 1, 'chevalier_prov');
    const ally = place(s, 'A', 'avant', 3, 'recrue_imp');
    const uid = give(s, 'A', 'demon_akantha');
    expect(applyAction(s, { type: 'play', handUid: uid, target: A_AVANT(0) }).ok).toBe(false); // case vide : il faut un sacrifice
    s = act(s, { type: 'play', handUid: uid, target: A_AVANT(1) }).state;
    const d = s.players.A.board.avant[1]!;
    expect(d.cardId).toBe('demon_akantha');
    expect([d.baseAtk, d.maxEnd, d.baseArm, d.ini]).toEqual([34, 60, 18, 10]); // Akantha 20/10/5/0 + Chevalier 14/50/13/10
    expect(s.players.A.points).toBe(3);
    expect(s.players.A.board.avant[3]!.currentMor).toBe(ally.currentMor - 1);
  });
  it('Suppôt Infernal : à la mort du porteur, copie d’un Démon de la défausse qui coûte 2 de moins', () => {
    let s = blankGame();
    s.config.moralCheck = false;
    s.players.B.discard = ['demon_akantha'];
    place(s, 'A', 'avant', 0, 'chevalier_prov', { ini: 99 });
    place(s, 'B', 'avant', 0, 'chien_infernal', { currentEnd: 1, leader: 'suppot_infernal', leaderOwner: 'B' });
    place(s, 'B', 'avant', 3, 'cultiste');
    s = act(s, { type: 'endTurn' }).state;
    expect(s.pending[0]).toMatchObject({ kind: 'recoverDemon', player: 'B' });
    expect(legalActions(s)).toEqual(expect.arrayContaining([{ type: 'choose', option: 0 }]));
    s = act(s, { type: 'choose', option: 0 }).state;
    const h = s.players.B.hand.find(x => x.cardId === 'demon_akantha')!;
    expect(h.discount).toBe(2);
  });
  it('Pacte de Survie : les pertes deviennent de la lassitude pour le lanceur', () => {
    let s = blankGame();
    s.config.moralCheck = false;
    s.players.A.level = 3; s.players.A.resource = 9;
    const demon = place(s, 'A', 'avant', 0, 'chien_infernal', { ini: 0 });
    place(s, 'B', 'avant', 0, 'cavalier_elfe');
    const t = give(s, 'A', 'pacte_survie');
    s = act(s, { type: 'play', handUid: t, target: A_AVANT(0) }).state;
    s = act(s, { type: 'endTurn' }).state;
    const u = s.players.A.board.avant[0]!;
    expect(u.currentEnd).toBe(demon.currentEnd);
    expect(u.currentMor).toBe(demon.currentMor);
    expect(s.players.A.points).toBe(1 + 1); // 15 dégâts évités = 1 point, 1 Moral évité = 1 point
  });
  it('Effroi Démoniaque : 2 Moral + 1 par Démon allié ; une destruction redonne 1 Moral aux Démons', () => {
    let s = blankGame();
    s.players.A.level = 2; s.players.A.resource = 9;
    place(s, 'A', 'avant', 0, 'chien_infernal', { currentMor: 3 });
    place(s, 'B', 'avant', 1, 'eclaireur_elfe', { currentMor: 3 });
    const t = give(s, 'A', 'effroi_demoniaque');
    s = act(s, { type: 'play', handUid: t, target: { player: 'B', zone: 'avant', idx: 1 } }).state;
    expect(s.players.B.board.avant[1]).toBeNull();
    expect(s.players.A.board.avant[0]!.currentMor).toBe(4);
  });
  it('Cérémonie du Déclin : +1 lassitude en début de tour, et autant de ressources', () => {
    let s = blankGame();
    place(s, 'A', 'avant', 0, 'recrue_imp');
    place(s, 'B', 'arriere', 0, 'ceremonie_declin');
    s.config.moralCheck = false;
    s = act(s, { type: 'endTurn' }).state;
    expect(s.players.B.points).toBe(1);
    expect(s.players.B.resource).toBe(1 + 1 + 1); // reliquat 1 + niveau 1 + Cérémonie 1
  });
  it('Tuteur Démoniaque : choisit un niveau, pioche le premier Démon de ce niveau, gagne ressources et lassitude = position', () => {
    let s = blankGame();
    s.players.A.level = 4; s.players.A.resource = 5;
    s.players.A.deck = ['recrue_imp', 'recrue_imp', 'demon_akantha', 'chien_infernal'];
    const t = give(s, 'A', 'tuteur_demoniaque');
    s = act(s, { type: 'play', handUid: t }).state;
    expect(s.pending[0]!.options).toEqual([{ value: 1 }, { value: 3 }]);
    s = act(s, { type: 'choose', option: 1 }).state;
    expect(s.players.A.hand.map(h => h.cardId)).toEqual(['demon_akantha']);
    expect(s.players.A.resource).toBe(5 - 1 + 3);
    expect(s.players.A.points).toBe(3);
  });
  it('Maître du Chenil : comble le rang avant de Chiens (Minions) à la fin du tour de son contrôleur', () => {
    let s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'arriere', 0, 'maitre_chenil_infernal');
    place(s, 'B', 'arriere', 2, 'paysans');
    s = act(s, { type: 'endTurn' }).state;
    const dogs = s.players.A.board.avant.filter(u => u?.cardId === 'chien_infernal');
    expect(dogs).toHaveLength(4);
    expect(dogs.every(u => u!.keywords.includes('Minions'))).toBe(true);
  });
});

describe('Nomades', () => {
  it('Saboteur Nomade : intercepte les pioches adverses et perd du Moral', () => {
    let s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'avant', 0, 'recrue_imp');
    place(s, 'A', 'isole', 0, 'saboteur_nomade');
    place(s, 'B', 'avant', 3, 'eclaireur_elfe');
    s.players.B.deck = ['chevalier_prov', 'recrue_imp'];
    const r = act(s, { type: 'endTurn' });
    expect(r.state.players.B.hand).toHaveLength(0);
    expect(r.state.players.B.discard).toContain('chevalier_prov');
    expect(r.state.players.A.board.isole!.currentMor).toBe(10 + 1 - 4); // +1 Moral (Équilibrage 8) ; Chevalier de Province à coût 4 (Équilibrage 12)
  });
  it('Archéotacticiens : une Tactique défaussée de force chez l’adversaire donne une copie gratuite', () => {
    let s = blankGame();
    place(s, 'A', 'arriere', 0, 'archeotacticiens');
    s.players.A.level = 3; s.players.A.resource = 9;
    s.players.B.hand = [];
    const victim = give(s, 'B', 'ralliement');
    const t = give(s, 'A', 'frappez_ravitaillement');
    s = act(s, { type: 'play', handUid: t }).state;
    expect(s.pending[0]).toMatchObject({ kind: 'handDiscard', player: 'B' });
    s = act(s, { type: 'choose', option: s.pending[0]!.options!.findIndex(o => o.handUid === victim) }).state;
    const copy = s.players.A.hand.find(h => h.cardId === 'ralliement')!;
    expect(copy.freeCopy).toBe(true);
    // La copie disparaît à la fin du tour de A si elle n'est pas jouée.
    place(s, 'A', 'avant', 0, 'recrue_imp');
    s.config.moralCheck = false;
    s = act(s, { type: 'endTurn' }).state;
    expect(s.players.A.hand.some(h => h.freeCopy)).toBe(false);
  });
  it('Volez le ravitaillement : l’adversaire défausse 3 cartes, le voleur gagne 7 − la somme des niveaux', () => {
    let s = blankGame();
    s.players.A.level = 4; s.players.A.resource = 4;
    for (const id of ['recrue_imp', 'lancier_emp', 'chevalier_prov']) give(s, 'B', id);
    const t = give(s, 'A', 'volez_ravitaillement');
    s = act(s, { type: 'play', handUid: t }).state;
    for (let i = 0; i < 3; i++) s = act(s, { type: 'choose', option: 0 }).state;
    expect(s.players.B.hand).toHaveLength(0);
    expect(s.pending).toHaveLength(0);
    expect(s.players.A.resource).toBe(0 + (7 - (1 + 2 + 3)));
  });
  it('Jeune Nomade : défausse au hasard à l’arrivée ; à sa mort l’adversaire pioche', () => {
    let s = blankGame();
    give(s, 'B', 'recrue_imp');
    const t = give(s, 'A', 'jeune_nomade');
    s = act(s, { type: 'play', handUid: t, target: A_AVANT(0) }).state;
    expect(s.players.B.hand).toHaveLength(0);
    const ctx = new Ctx(s);
    const before = s.players.B.hand.length;
    ctx.destroy(s.players.A.board.avant[0]!, 'end');
    expect(s.players.B.hand.length).toBe(before + 1);
  });
  it('Basilics de l’Oasis : +10 END à l’avant, Distance et +30 INI à l’arrière', () => {
    let s = blankGame();
    s.players.A.level = 3; s.players.A.resource = 20;
    const a = give(s, 'A', 'basilics_oasis');
    const b = give(s, 'A', 'basilics_oasis');
    s = act(s, { type: 'play', handUid: a, target: A_AVANT(0) }).state;
    s = act(s, { type: 'play', handUid: b, target: { player: 'A', zone: 'arriere', idx: 0 } }).state;
    expect(s.players.A.board.avant[0]!.maxEnd).toBe(50);
    expect(s.players.A.board.arriere[0]!.keywords).toContain('Distance');
    expect(s.players.A.board.arriere[0]!.ini).toBe(42);
  });
  it('Chasseur de Reliques : absorbe l’ATK ou l’ARM d’un régiment de la défausse adverse', () => {
    let s = blankGame();
    s.players.A.level = 3; s.players.A.resource = 9;
    s.players.B.discard = ['chevalier_prov'];
    const t = give(s, 'A', 'chasseur_reliques');
    s = act(s, { type: 'play', handUid: t, target: { player: 'A', zone: 'arriere', idx: 1 } }).state;
    expect(s.pending[0]!.options).toEqual([{ cardId: 'chevalier_prov', stat: 'atk' }, { cardId: 'chevalier_prov', stat: 'arm' }]);
    s = act(s, { type: 'choose', option: 1 }).state;
    expect(s.players.A.board.arriere[1]!.baseArm).toBe(13);
    expect(s.players.B.discard).toHaveLength(0);
  });
});
