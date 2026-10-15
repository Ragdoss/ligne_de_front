// Nouvelles cartes et nouvelles mécaniques de scénario (campagnes Nomade, Elfe, Démon).
import { describe, expect, it } from 'vitest';
import { Ctx } from '../src/engine/ctx';
import { createGame } from '../src/engine/game';
import { act, blankGame, give, place } from './helpers';

const slot = (player: 'A' | 'B', zone: 'avant' | 'arriere', idx: number) => ({ player, zone, idx });

describe('Nouvelles cartes', () => {
  it('Diablotins sacrifiés : +1 ressource ; Gargouille regagne du Moral ; Seigneur des Abysses soigne son porteur', () => {
    let s = blankGame();
    s.players.A.level = 4; s.players.A.resource = 10;
    place(s, 'A', 'avant', 0, 'diablotins');
    const garg = place(s, 'A', 'avant', 2, 'gargouille_cendres', { currentMor: 3 });
    const lord = place(s, 'A', 'avant', 3, 'chien_infernal', { leader: 'seigneur_abysses', leaderOwner: 'A', currentEnd: 10 });
    const uid = give(s, 'A', 'gargouille_cendres');
    s = act(s, { type: 'play', handUid: uid, target: slot('A', 'avant', 0) }).state;
    expect(s.players.A.resource).toBe(10 - 2 + 1);
    expect(s.players.A.board.avant[2]!.currentMor).toBe(garg.currentMor + 1); // Minions : pas de perte de Moral
    expect(s.players.A.board.avant[3]!.currentEnd).toBe(lord.currentEnd + 10);
  });
  it('Effrayant : la valeur la plus forte compte (Seigneur des Abysses sur un Chien Infernal)', () => {
    const s = blankGame();
    const u = place(s, 'A', 'avant', 0, 'chien_infernal');
    u.keywords.push('Effrayant 2');
    expect(new Ctx(s).fear(u)).toBe(2);
  });
  it('Œuf de Dragon : éclot au début du 3e tour de son contrôleur', () => {
    let s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'arriere', 0, 'oeuf_dragon');
    place(s, 'B', 'avant', 0, 'recrue_imp');
    for (let i = 0; i < 6; i++) s = act(s, { type: 'endTurn' }).state;
    expect(s.players.A.board.arriere[0]!.cardId).toBe('dragonnet_infernal');
  });
  it('Dragon Infernal : tous les régiments adverses perdent 2 Moral à son arrivée', () => {
    let s = blankGame();
    s.players.A.level = 5; s.players.A.resource = 10;
    place(s, 'A', 'avant', 0, 'chevalier_templier');
    const e = place(s, 'B', 'avant', 1, 'recrue_imp');
    const uid = give(s, 'A', 'dragon_infernal');
    s = act(s, { type: 'play', handUid: uid, target: slot('A', 'avant', 0) }).state;
    expect(s.players.B.board.avant[1]!.currentMor).toBe(e.currentMor - 2);
  });
  it('Cheikh des Dunes : +5 ATK permanent par carte que l’adversaire défausse', () => {
    let s = blankGame();
    s.players.A.level = 4; s.players.A.resource = 10;
    const u = place(s, 'A', 'avant', 0, 'jeune_nomade', { leader: 'cheikh_dunes', leaderOwner: 'A' });
    give(s, 'B', 'recrue_imp'); give(s, 'B', 'recrue_imp');
    const uid = give(s, 'A', 'frappez_ravitaillement');
    s = act(s, { type: 'play', handUid: uid }).state;
    while (s.pending.length) s = act(s, { type: 'choose', option: 0 }).state;
    expect(s.players.A.board.avant[0]!.baseAtk).toBe(u.baseAtk + 10);
  });
  it('Tempête de Sable : les régiments adverses perdent Distance pour ce combat', () => {
    let s = blankGame();
    s.players.A.level = 3; s.players.A.resource = 5;
    const archer = place(s, 'B', 'arriere', 0, 'archer_bois');
    const uid = give(s, 'A', 'tempete_sable');
    s = act(s, { type: 'play', handUid: uid }).state;
    const ctx = new Ctx(s);
    expect(ctx.hasDistance(s.players.B.board.arriere[0]!)).toBe(false);
    expect(ctx.effectiveIni(s.players.B.board.arriere[0]!)).toBe(archer.ini - 20);
    s = act(s, { type: 'endTurn' }).state;
    expect(new Ctx(s).hasDistance(s.players.B.board.arriere[0]!)).toBe(true);
  });
  it('Gardienne de la Lumière : +15 ATK contre les Démons', () => {
    let s = blankGame();
    s.config.moralCheck = false;
    place(s, 'A', 'arriere', 0, 'gardienne_lumiere');
    const d = place(s, 'B', 'avant', 0, 'cultiste', { types: ['Démon'] });
    const r = act(s, { type: 'endTurn' });
    const hit = r.events.find(e => e.type === 'attack' && e.target === d.uid);
    expect(hit && hit.type === 'attack' && hit.atk).toBe(30);
  });
  it('Rite de Purification : retire Effrayant et les bonus permanents ; un Démon perd 2 Moral', () => {
    let s = blankGame();
    s.players.A.level = 3; s.players.A.resource = 5;
    const d = place(s, 'B', 'avant', 0, 'chien_infernal', { baseAtk: 40 });
    const uid = give(s, 'A', 'rite_purification');
    s = act(s, { type: 'play', handUid: uid, target: slot('B', 'avant', 0) }).state;
    const u = s.players.B.board.avant[0]!;
    expect(u.keywords.some(k => k.startsWith('Effrayant'))).toBe(false);
    expect(u.baseAtk).toBe(10);
    expect(u.currentMor).toBe(d.currentMor - 2);
  });
});

describe('Mécaniques de scénario', () => {
  it('Tenir jusqu’au tour X : victoire dès que ce tour commence', () => {
    let s = blankGame({ winAtTurn: { A: 3 }, moralCheck: false });
    place(s, 'A', 'avant', 0, 'recrue_imp');
    place(s, 'B', 'avant', 3, 'recrue_imp');
    for (let i = 0; i < 4; i++) s = act(s, { type: 'endTurn' }).state;
    expect(s.over).toEqual({ winner: 'A', reason: 'survived' });
  });
  it('Libération : un Esclave Guerrier adverse au Moral brisé change de camp, Moral plein', () => {
    let s = blankGame({ liberation: { pid: 'B', cardIds: ['esclave_guerrier'] }, moralCheck: false });
    s.scenario = { events: [], fired: [], convoyHold: 0, liberated: 0 };
    place(s, 'A', 'avant', 0, 'chevalier_prov', { ini: 99 });
    place(s, 'B', 'avant', 0, 'esclave_guerrier', { currentMor: 2 });
    s = act(s, { type: 'endTurn' }).state;
    const freed = new Ctx(s).units('A').find(u => u.cardId === 'esclave_guerrier');
    expect(freed?.controller).toBe('A');
    expect(freed?.currentMor).toBe(freed?.maxMor);
    expect(s.scenario!.liberated).toBe(1);
  });
  it('Météo : la nuit, les Démons ont +10 ATK ; le jour, les Elfes ont +15 INI', () => {
    const s = createGame({ seed: 1, A: { faction: 'elfe', deck: Array(30).fill('eclaireur_elfe') }, B: { faction: 'demons', deck: Array(30).fill('cultiste') }, scenario: { events: [], weather: { kind: 'nuit', first: 3, every: 4, duration: 2 } } });
    const ctx = new Ctx(s);
    const elf = place(s, 'A', 'avant', 0, 'eclaireur_elfe');
    const dem = place(s, 'B', 'avant', 0, 'chien_infernal');
    expect(ctx.weather()).toBe('jour');
    expect(ctx.effectiveIni(elf)).toBe(elf.ini + 15);
    s.turn = 3;
    expect(ctx.weather()).toBe('nuit');
    expect(ctx.effectiveAtk(dem)).toBe(20);
  });
  it('Alarme : la première perte de l’ordinateur donne l’alarme, les renforts arrivent à son tour suivant', () => {
    let s = createGame({ seed: 1, A: { faction: 'demons', deck: Array(30).fill('cultiste') }, B: { faction: 'empire', deck: Array(30).fill('recrue_imp') },
      config: { moralCheck: false }, scenario: { events: [], alarm: { pid: 'B', turn: 9, spawn: [{ cardId: 'garde_capitale', zone: 'avant', idx: 1 }] } } });
    s.players.A.hand = []; s.players.B.hand = [];
    place(s, 'A', 'avant', 0, 'chevalier_prov', { ini: 99, baseAtk: 99 });
    place(s, 'B', 'avant', 0, 'recrue_imp');
    s = act(s, { type: 'endTurn' }).state;
    expect(s.scenario!.alarmRaised).toBe(true);
    expect(s.players.B.board.avant[1]?.cardId).toBe('garde_capitale');
  });
});
