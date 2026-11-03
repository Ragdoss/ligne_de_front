// Prototype roguelite : structure d'un acte, lassitude gardée, exemplaires abîmés ou améliorés, règles des Titans.
import { describe, expect, it } from 'vitest';
import { Ctx } from '../src/engine/ctx';
import { createGame } from '../src/engine/game';
import { attack } from '../src/engine/combat';
import { CARDS } from '../src/data/cards';
import { registerTitanCards } from '../src/data/titans';
import {
  afterFight, chooseOption, fight, improve, keptLassitude, newMeta, newRun, nextNode, optionsFor, variantDef, variantId, type RunState,
} from '../src/roguelite/run';
import { act, blankGame, give, place } from './helpers';

registerTitanCards();

describe('Roguelite : structure d’un acte', () => {
  it('8 nœuds puis le boss ; le 7e propose toujours le marchand', () => {
    const run = newRun('t1');
    expect(optionsFor({ ...run, node: 8 })).toEqual([expect.objectContaining({ kind: 'boss' })]);
    for (let s = 0; s < 10; s++) {
      const o = optionsFor({ ...newRun(`m${s}`), node: 6, miniBossDone: true });
      expect(o[0]!.kind).toBe('marche');
      expect(o.length).toBeLessThanOrEqual(2);
    }
  });
  it('mini-boss : proposé dès le 4e nœud, seule option à sa 3e apparition, un seul par acte', () => {
    const run = newRun('t2');
    expect(optionsFor({ ...run, node: 2 }).some(o => o.kind === 'miniboss')).toBe(false);
    expect(optionsFor({ ...run, node: 3 }).some(o => o.kind === 'miniboss')).toBe(true);
    expect(optionsFor({ ...run, node: 5, miniBossOffers: 2 })).toEqual([expect.objectContaining({ kind: 'miniboss' })]);
    expect(optionsFor({ ...run, node: 4, miniBossDone: true }).some(o => o.kind === 'miniboss')).toBe(false);
  });
  it('un seul événement par acte, jamais deux fois le même dans une run', () => {
    for (let s = 0; s < 20; s++) {
      const o = optionsFor({ ...newRun(`e${s}`), node: 1, eventThisAct: true });
      expect(o.some(x => x.kind === 'event')).toBe(false);
      const p = optionsFor({ ...newRun(`e${s}`), node: 1, eventsSeen: ['camp', 'entrainement'] });
      expect(p.some(x => x.kind === 'event')).toBe(false);
    }
  });
  it('choisir une option compte une apparition du mini-boss', () => {
    const run = { ...newRun('t3'), node: 3 };
    run.options = optionsFor(run);
    const i = run.options.findIndex(o => o.kind !== 'miniboss');
    const next = chooseOption(run, newMeta(), Math.max(0, i));
    expect(next.miniBossOffers).toBe(1);
  });
});

describe('Roguelite : lassitude gardée', () => {
  it('exemples du document', () => {
    expect(keptLassitude(6, 14)).toBe(7);
    expect(keptLassitude(16, 24)).toBe(16);
    expect(keptLassitude(8, 20, 15)).toBe(8);
  });
  it('le combat commence avec la lassitude gardée et le niveau qui va avec', () => {
    const run: RunState = { ...newRun('t4'), lassitude: 10 };
    const { setup } = fight(run, { kind: 'combat', reward: 'or', deck: 'd1' }, 1);
    const g = createGame(setup);
    expect(g.players.A.points).toBe(10);
    expect(g.players.A.level).toBe(3);
    expect(g.config.defeatLassitude.A).toBe(16);
  });
});

describe('Roguelite : exemplaires', () => {
  it('malus plancher à 25 %, coût +2 au plus, Leader en pourcentage', () => {
    const b = CARDS.soldat_kragz!;
    const d = variantDef({ uid: 1, id: 'soldat_kragz', mods: { end: -999, cout: 5 } });
    expect(d.end).toBe(Math.round(b.end! * 0.25));
    expect(d.cout).toBe(b.cout + 2);
    const l = variantDef({ uid: 2, id: 'lieutenant', mods: { bonusPct: -50 } });
    expect(l.bonusAtk).toBe(Math.round(CARDS.lieutenant!.bonusAtk! * 0.5));
  });
  it('une amélioration efface d’abord les malus', () => {
    const rc = { uid: 1, id: 'soldat_kragz', mods: { atk: -3, end: 4 } };
    improve(rc);
    expect(rc.mods).toEqual({ end: 4 });
  });
  it('les malus infligés en partie restent sur l’exemplaire touché', () => {
    const run = { ...newRun('t5'), current: { kind: 'combat', reward: 'or', deck: 'd1' } as const };
    const target = run.deck[0]!;
    const g = createGame(fight(run, run.current, 1).setup);
    g.runMods = { [variantId(target)]: { atk: -2 } };
    g.over = { winner: 'A', reason: 'lassitude' };
    const next = afterFight(run, g);
    expect(next.deck[0]!.mods.atk).toBe(-2);
    expect(next.steps[0]!.kind).toBe('resume');
    expect(nextNode(next).node).toBe(1);
  });
});

describe('Roguelite : cartes des Titans et boss', () => {
  it('Écho du Titan : -10 % d’ATK, définitif', () => {
    let s = blankGame();
    const u = place(s, 'B', 'avant', 0, 'soldat_kragz');
    s.players.A.resource = 5; s.players.A.level = 2;
    const h = give(s, 'A', 'titan_echo');
    s = act(s, { type: 'play', handUid: h, target: { player: 'B', zone: 'avant', idx: 0 } }).state;
    expect(s.runMods?.soldat_kragz?.atk).toBe(-Math.max(1, Math.round(u.baseAtk * 0.1)));
  });
  it('Essence de la réalité : chaque attaque use des régiments de son camp', () => {
    const s = blankGame();
    const ctx = new Ctx(s);
    const ess = place(s, 'A', 'arriere', 1, 'essence_realite');
    place(s, 'A', 'avant', 0, 'recrue_imp');
    const att = place(s, 'B', 'avant', 0, 'archer_bois');
    s.players.B.level = 1;
    attack(ctx, att, ess);
    expect(s.runMods?.recrue_imp).toEqual({ atk: -1, ini: -1, arm: -1 });
  });
  it('Glissement : les régiments glissent d’une case au tour du Titan, sauf après « Lutter contre le mouvement »', () => {
    const run = { ...newRun('t6'), node: 8 };
    const { setup } = fight(run, { kind: 'boss', deck: 'e2' }, 3);
    let s = createGame(setup);
    s.players.A.hand = [];
    place(s, 'A', 'avant', 0, 'recrue_imp');
    s = act(s, { type: 'endTurn' }).state; // tour du Titan : glissement
    expect(s.players.A.board.avant[1]?.cardId).toMatch(/^recrue_imp/);
    while (s.active !== 'A' || s.pending.length) s = act(s, s.pending.length ? { type: 'choose', option: 0 } : { type: 'endTurn' }).state;
    const tac = s.players.A.hand.find(h => h.cardId === 'lutter_mouvement');
    expect(tac).toBeDefined();
    s = act(s, { type: 'play', handUid: tac!.uid }).state;
    expect(s.players.A.costTax?.lutter_mouvement).toBe(1);
    const before = s.players.A.board.avant.findIndex(u => u?.cardId.startsWith('recrue_imp'));
    s = act(s, { type: 'endTurn' }).state;
    expect(s.players.A.board.avant.findIndex(u => u?.cardId.startsWith('recrue_imp'))).toBe(before);
  });
});
