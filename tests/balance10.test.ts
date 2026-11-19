import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/data/cards';
import { blankGame, act, give, place } from './helpers';
import type { GameState } from '../src/engine/types';

const quiet = () => blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
const slot = (player: 'A' | 'B', zone: 'avant' | 'arriere' | 'isole', idx: number) => ({ player, zone, idx });
const ready = (s: GameState) => { s.players.A.level = 5; s.players.A.resource = 20; s.players.A.points = 20; return s; };

describe('Équilibrage 10 — Elfes', () => {
  it('valeurs des cartes', () => {
    expect(CARDS.rangers!.keywords).toEqual(['Distance']);
    expect(CARDS.elem_eau!.cout).toBe(2);
    expect(CARDS.sentinelle_cimes!.cout).toBe(2);
    expect(CARDS.clerc_foret!.vieTours).toBe(5);
  });
  it('Soin simple : 20 END et 1 Moral (équilibrage 14)', () => {
    const s = ready(quiet());
    const u = place(s, 'A', 'avant', 0, 'elem_terre', { currentEnd: 10 });
    u.currentMor = u.maxMor - 2;
    const r = act(s, { type: 'play', handUid: give(s, 'A', 'soin_simple'), target: slot('A', 'avant', 0) });
    expect(r.state.players.A.board.avant[0]!.currentEnd).toBe(u.currentEnd + 20);
    expect(r.state.players.A.board.avant[0]!.currentMor).toBe(u.currentMor + 1);
  });
  it('Sérénité (équilibrage 14) : la défaite recule de 5, de 10 avec un Élémentaux ; la lassitude ne bouge pas', () => {
    let s = ready(quiet());
    const lim = s.config.defeatLassitude.A;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'serenite_foret') }).state;
    expect(s.players.A.points).toBe(20);
    expect(s.config.defeatLassitude.A).toBe(lim + 5);
    s = ready(quiet());
    place(s, 'A', 'avant', 0, 'elem_terre');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'serenite_foret') }).state;
    expect(s.config.defeatLassitude.A).toBe(lim + 10);
  });
  it('Chant de la sève et Sang de sève comptent comme des soins (Veilleuse des Sources)', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'elem_terre', { currentEnd: 5, leader: 'veilleuse_sources', leaderOwner: 'A' });
    s = act(s, { type: 'play', handUid: give(s, 'A', 'chant_seve'), target: slot('A', 'avant', 0) }).state;
    expect(s.players.A.points).toBe(19); // 10 END soignées → −1
    s = act(s, { type: 'play', handUid: give(s, 'A', 'sang_seve'), target: slot('A', 'avant', 0) }).state;
    expect(s.players.A.points).toBe(19); // +3, puis 30 END soignées → −3
  });
  it('Chœur des saisons pioche à son arrivée', () => {
    let s = ready(quiet());
    s.players.A.deck = ['recrue_imp', 'recrue_imp'];
    const before = s.players.A.hand.length;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'choeur_saisons'), target: slot('A', 'arriere', 0) }).state;
    expect(s.players.A.hand.length).toBe(before + 1);
  });
});

describe('Leader sur un régiment au Moral brisé', () => {
  it('le Moral apporté par le Leader le sort du Moral brisé s’il repasse au-dessus du tiers', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'lancier_emp', { currentMor: 2, brokenMorale: true });
    s = act(s, { type: 'play', handUid: give(s, 'A', 'lieutenant'), target: slot('A', 'avant', 0) }).state;
    const u = s.players.A.board.avant[0]!;
    expect(u.currentMor).toBe(4);
    expect(u.brokenMorale).toBe(false);
  });
  it('reste brisé s’il ne dépasse pas le tiers', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'lancier_emp', { currentMor: 1, brokenMorale: true });
    s = act(s, { type: 'play', handUid: give(s, 'A', 'lieutenant'), target: slot('A', 'avant', 0) }).state;
    expect(s.players.A.board.avant[0]!.brokenMorale).toBe(true);
  });
});
