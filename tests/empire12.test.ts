// Équilibrage 12 — l'Empire : « la ligne tient ».
import { describe, expect, it } from 'vitest';
import { applyAction, legalActions } from '../src/engine/game';
import type { GameEvent, GameState, PlayerId, Zone } from '../src/engine/types';
import { act, blankGame, give, place } from './helpers';

const quiet = () => blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
const slot = (player: PlayerId, zone: Zone, idx: number) => ({ player, zone, idx });
const ready = (s: GameState, res = 10) => { s.players.A.level = 5; s.players.A.resource = res; s.players.B.level = 5; s.players.B.resource = res; return s; };
type Hit = Extract<GameEvent, { type: 'attack' }>;
const hits = (ev: GameEvent[], cardId: string) => ev.filter((e): e is Hit => e.type === 'attack' && e.attackerCard === cardId);

describe('Équilibrage 12 (Empire)', () => {
  it('Capitaine de la Garde : le porteur ne peut pas être ciblé par une Tactique adverse', () => {
    let s = ready(quiet());
    place(s, 'B', 'avant', 0, 'soldat_kragz');
    s = act(s, { type: 'endTurn' }).state; // au tour de B
    s.players.B.resource = 10; s.players.B.level = 5;
    s = act(s, { type: 'play', handUid: give(s, 'B', 'capitaine_garde'), target: slot('B', 'avant', 0) }).state;
    s = act(s, { type: 'endTurn' }).state; // retour à A
    s.players.A.resource = 10;
    const h = give(s, 'A', 'marque_chasseur');
    expect(legalActions(s).some(x => x.type === 'play' && x.handUid === h)).toBe(false);
    expect(applyAction(s, { type: 'play', handUid: h, target: slot('B', 'avant', 0) }).ok).toBe(false);
  });

  it('Formation en Carré : +20 ARM aux porteurs de Leader, +10 ARM au régiment ciblé par une Tactique adverse', () => {
    let s = ready(quiet());
    s.active = 'B';
    const u = place(s, 'B', 'avant', 0, 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'B', 'formation_carre') }).state;
    s = act(s, { type: 'endTurn' }).state;
    s.players.A.resource = 10;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'marque_chasseur'), target: slot('B', 'avant', 0) }).state;
    expect(s.players.B.board.avant[0]!.uid).toBe(u.uid);
    expect(s.players.B.board.avant[0]!.squareArm).toBe(10);
  });

  it('Charge Impériale : un régiment Empire ignore l’Armure ; un Lancier gagne +10 ATK', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'lancier_emp');
    place(s, 'B', 'avant', 0, 'forteresse');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'charge_imp'), target: slot('A', 'avant', 0) }).state;
    const hit = hits(act(s, { type: 'endTurn' }).events, 'lancier_emp')[0]!;
    expect(hit.arm).toBe(0);
    expect(hit.atk).toBe(12 + 10);
  });

  it('Lanciers du rempart : les régiments adverses à Distance doivent les attaquer', () => {
    const s = ready(quiet());
    place(s, 'A', 'arriere', 0, 'archer_bois');
    place(s, 'B', 'avant', 0, 'recrue_imp', { currentMor: 1 });
    const l = place(s, 'B', 'avant', 3, 'lanciers_rempart');
    const hit = hits(act(s, { type: 'endTurn' }).events, 'archer_bois')[0]!;
    expect(hit.target).toBe(l.uid);
  });
});
