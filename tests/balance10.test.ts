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
  it('Soin simple : 15 END', () => {
    const s = ready(quiet());
    const u = place(s, 'A', 'avant', 0, 'elem_terre', { currentEnd: 10 });
    const r = act(s, { type: 'play', handUid: give(s, 'A', 'soin_simple'), target: slot('A', 'avant', 0) });
    expect(r.state.players.A.board.avant[0]!.currentEnd).toBe(u.currentEnd + 15);
  });
  it('Sérénité : −5 lassitude, −10 avec un Élémentaux', () => {
    let s = ready(quiet());
    s = act(s, { type: 'play', handUid: give(s, 'A', 'serenite_foret') }).state;
    expect(s.players.A.points).toBe(15);
    s = ready(quiet());
    place(s, 'A', 'avant', 0, 'elem_terre');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'serenite_foret') }).state;
    expect(s.players.A.points).toBe(10);
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
