// Refonte des Elfes : la Proie.
import { describe, expect, it } from 'vitest';
import { Ctx } from '../src/engine/ctx';
import { applyAction, legalActions } from '../src/engine/game';
import type { GameEvent, GameState, PlayerId, Zone } from '../src/engine/types';
import { act, blankGame, give, place } from './helpers';

const quiet = () => blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
const slot = (player: PlayerId, zone: Zone, idx: number) => ({ player, zone, idx });
const ready = (s: GameState, res = 10) => { s.players.A.level = 5; s.players.A.resource = res; s.players.B.level = 5; return s; };
const preyOf = (s: GameState, hunter: PlayerId) => new Ctx(s).preyOf(hunter);
type Hit = Extract<GameEvent, { type: 'attack' }>;
const hits = (ev: GameEvent[], cardId: string) => ev.filter((e): e is Hit => e.type === 'attack' && e.attackerCard === cardId);

describe('Proie', () => {
  it('Éclaireur Elfe : le régiment en face devient la Proie à son arrivée', () => {
    let s = ready(quiet());
    const target = place(s, 'B', 'avant', 2, 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'eclaireur_elfe'), target: slot('A', 'avant', 2) }).state;
    expect(preyOf(s, 'A')?.uid).toBe(target.uid);
  });

  it('une seule Proie à la fois ; elle reste après un déplacement', () => {
    let s = ready(quiet());
    const a = place(s, 'B', 'avant', 0, 'recrue_imp');
    const b = place(s, 'B', 'avant', 1, 'mercenaires');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'marque_chasseur'), target: slot('B', 'avant', 0) }).state;
    expect(preyOf(s, 'A')?.uid).toBe(a.uid);
    s = act(s, { type: 'play', handUid: give(s, 'A', 'marque_chasseur'), target: slot('B', 'avant', 1) }).state;
    expect(preyOf(s, 'A')?.uid).toBe(b.uid);
    expect(s.players.B.board.avant[0]!.prey ?? null).toBeNull();
    // Changement Tectonique : coûte 0 contre la Proie, et la Proie le reste une fois déplacée.
    s.players.A.resource = 0;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'changement_tectonique'), target: slot('B', 'avant', 1), target2: slot('B', 'arriere', 0) }).state;
    expect(s.players.B.board.arriere[0]?.prey).toBe('A');
  });

  it('pour son camp, une Tactique qui cible sa propre Proie coûte 1 de plus', () => {
    const s = ready(quiet());
    place(s, 'B', 'avant', 0, 'recrue_imp', { prey: 'A' });
    place(s, 'B', 'avant', 1, 'recrue_imp');
    s.active = 'B'; s.players.B.resource = 0;
    const h = give(s, 'B', 'chant_seve'); // coût 0
    const targets = legalActions(s).filter(x => x.type === 'play' && x.handUid === h).map(x => (x as { target?: { idx: number } }).target?.idx);
    expect(targets).toEqual([1]); // la Proie coûte 1 : pas assez de ressource
    expect(applyAction(s, { type: 'play', handUid: h, target: slot('B', 'avant', 0) }).ok).toBe(false);
  });

  it('Archer des Bois +10 ATK et Volée de Flèches +20 contre la Proie', () => {
    let s = ready(quiet());
    place(s, 'A', 'arriere', 0, 'archer_bois');
    place(s, 'B', 'avant', 0, 'forteresse', { prey: 'A', currentMor: 1 });
    s = act(s, { type: 'play', handUid: give(s, 'A', 'volee_fleches'), target: slot('A', 'arriere', 0) }).state;
    const r = act(s, { type: 'endTurn' });
    expect(hits(r.events, 'archer_bois')[0]!.atk).toBe(15 + 10 + 10 + 10);
  });

  it('Visez les faibles : la première ligne attaque la Proie en première ligne', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'recrue_imp');
    const prey = place(s, 'B', 'avant', 3, 'mercenaires', { prey: 'A' });
    place(s, 'B', 'avant', 0, 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'visez_faibles'), target: slot('B', 'avant', 3) }).state;
    const r = act(s, { type: 'endTurn' });
    expect(hits(r.events, 'recrue_imp').find(h => h.attacker !== prey.uid && h.target === prey.uid)).toBeTruthy();
  });

  it('Traqueuse et Rangers : la Proie d’abord ; la cible des Rangers devient la Proie', () => {
    let s = ready(quiet());
    place(s, 'A', 'arriere', 0, 'traqueuse_sylvestre');
    const prey = place(s, 'B', 'avant', 0, 'forteresse', { prey: 'A' });
    place(s, 'B', 'avant', 1, 'recrue_imp', { currentEnd: 3 });
    let r = act(s, { type: 'endTurn' });
    expect(hits(r.events, 'traqueuse_sylvestre')[0]!.target).toBe(prey.uid);
    s = ready(quiet());
    place(s, 'A', 'arriere', 0, 'rangers');
    const weak = place(s, 'B', 'avant', 1, 'forteresse', { currentMor: 4 });
    r = act(s, { type: 'endTurn' });
    expect(r.state.players.B.board.avant[1]?.uid).toBe(weak.uid);
    expect(r.state.players.B.board.avant[1]?.prey).toBe('A');
  });

  it('Seigneure de la chasse : la Proie détruite donne 2 lassitude et une nouvelle Proie (la plus grosse END)', () => {
    let s = ready(quiet());
    place(s, 'A', 'arriere', 0, 'seigneure_chasse');
    place(s, 'B', 'avant', 0, 'recrue_imp', { prey: 'A', currentEnd: 1, currentMor: 6 });
    const big = place(s, 'B', 'avant', 2, 'forteresse');
    const before = s.players.B.points;
    const r = act(s, { type: 'play', handUid: give(s, 'A', 'lyra'), target: slot('A', 'arriere', 1) });
    s = act(r.state, { type: 'play', handUid: give(r.state, 'A', 'brise_matin') }).state; // Lyra : 10 dégâts à la Proie
    expect(s.players.B.board.avant[0]).toBeNull();
    expect(s.players.B.points).toBe(before + 1 + 2); // niveau de la Recrue + Seigneure
    expect(preyOf(s, 'A')?.uid).toBe(big.uid);
  });

  it('Hallali : pioche 2 et +1 ressource si une Proie est tombée ce tour, sinon désigne une Proie', () => {
    let s = ready(quiet(), 5);
    const low = place(s, 'B', 'avant', 0, 'recrue_imp', { currentMor: 2 });
    place(s, 'B', 'avant', 1, 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'hallali') }).state;
    expect(preyOf(s, 'A')?.uid).toBe(low.uid);
    s.players.A.preyKilledAt = new Ctx(s).turnMarker();
    const hand = s.players.A.hand.length, res = s.players.A.resource;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'hallali') }).state;
    expect(s.players.A.hand.length).toBe(hand + 2);
    expect(s.players.A.resource).toBe(res - 1 + 1);
  });
});
