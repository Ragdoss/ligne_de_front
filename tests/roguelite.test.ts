// Prototype roguelite : structure d'un acte, lassitude gardée, exemplaires abîmés ou améliorés, règles des Titans.
import { describe, expect, it } from 'vitest';
import { Ctx } from '../src/engine/ctx';
import { createGame } from '../src/engine/game';
import { attack } from '../src/engine/combat';
import { CARDS } from '../src/data/cards';
import { registerTitanCards } from '../src/data/titans';
import {
  buyUpgrade, closeRun, xpWon, defeatAt, newMeta as freshMeta, afterFight, chooseOption, fight, improve, keptLassitude, newMeta, newRun, nextNode, optionsFor, variantDef, variantId, type RunState,
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
    const up = fight({ ...run, upg: { lassitude: 3 } }, { kind: 'combat', reward: 'or', deck: 'd1' }, 1).setup;
    expect(up.config!.defeatLassitude).toEqual({ A: 19, B: 16 });
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
    const rc: { uid: number; id: string; mods: { end?: number; cout?: number }; curse?: { atk: number } } = { uid: 1, id: 'soldat_kragz', mods: { end: 4, cout: -1 }, curse: { atk: -3 } };
    improve(rc);
    expect(rc.mods).toEqual({ end: 4, cout: -1 });
    expect(rc.curse).toBeUndefined();
  });
  it('les malus infligés en partie restent sur l’exemplaire touché', () => {
    const run = { ...newRun('t5'), current: { kind: 'combat', reward: 'or', deck: 'd1' } as const };
    const target = run.deck[0]!;
    const g = createGame(fight(run, run.current, 1).setup);
    g.runMods = { [variantId(target)]: { atk: -2 } };
    g.over = { winner: 'A', reason: 'lassitude' };
    const next = afterFight(run, g);
    expect(next.deck[0]!.curse?.atk).toBe(-2);
    expect(next.deck[0]!.mods.atk).toBeUndefined();
    expect(next.steps[0]!.kind).toBe('resume');
    expect(nextNode(next).node).toBe(1);
  });
});

describe('Roguelite : effets propres à une carte sur un exemplaire', () => {
  it('Percepteur impérial (exemplaire de run) : l’adversaire défausse 2 cartes', () => {
    const run = newRun('t7');
    run.deck.push({ uid: 99, id: 'percepteur_imperial', mods: {} });
    fight(run, { kind: 'combat', reward: 'or', deck: 'd1' }, 1); // enregistre les exemplaires
    let s = blankGame();
    place(s, 'A', 'avant', 0, 'soldat_kragz', { leader: 'lieutenant', leaderOwner: 'A' });
    s.players.B.hand = [{ uid: 900, cardId: 'recrue_imp' }, { uid: 901, cardId: 'recrue_imp' }, { uid: 902, cardId: 'recrue_imp' }];
    s.players.A.resource = 5; s.players.A.level = 2;
    const h = give(s, 'A', 'percepteur_imperial~99');
    s = act(s, { type: 'play', handUid: h, target: { player: 'A', zone: 'avant', idx: 1 } }).state;
    expect(s.players.B.hand).toHaveLength(1);
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

describe('Roguelite : Moral total', () => {
  it('l’Essence de la réalité et le Titan du Glissement ne comptent pas dans le Moral total', () => {
    expect(CARDS.essence_realite!.excludeFromMoralTotal).toBe(true);
    expect(CARDS.titan_glissement!.excludeFromMoralTotal).toBe(true);
  });
});

describe('Roguelite : améliorations entre les runs', () => {
  it('achat : coût payé, niveau monté, verrou respecté', () => {
    let m = { ...freshMeta(), essence: 10, xp: 20 };
    m = buyUpgrade(m, 'lassitude');
    expect(m.upg.lassitude).toBe(1);
    expect(m.essence).toBe(7);
    expect(buyUpgrade(m, 'regeneration')).toBe(m); // à débloquer au camp
    m = buyUpgrade(m, 'armee_elue');
    expect(m.xp).toBe(15);
  });
  it('Lassitude : seuil +1 par niveau, 20 au plus à l’acte 1', () => {
    expect(defeatAt({ act: 1, upg: { lassitude: 2 } })).toBe(18);
    expect(defeatAt({ act: 1, upg: { lassitude: 9 } })).toBe(20);
  });
  it('Armée élue, Généralissime, Génie, Imperator s’appliquent aux exemplaires', () => {
    const b = CARDS.soldat_kragz!;
    expect(variantDef({ uid: 1, id: 'soldat_kragz', mods: {} }, { armee_elue: 2 }).atk).toBe(b.atk! + Math.round(b.atk! * 0.2));
    expect(variantDef({ uid: 500, id: 'soldat_kragz', mods: {} }, { armee_elue: 2 }).atk).toBe(b.atk); // carte gagnée en route
    const l = variantDef({ uid: 2, id: 'lieutenant', mods: {} }, { generalissime: 1, imperator: 1 });
    expect(l.bonusAtk).toBe(Math.round(CARDS.lieutenant!.bonusAtk! * 1.2));
    expect(l.cout).toBe(Math.max(0, CARDS.lieutenant!.cout - 1));
    expect(variantDef({ uid: 3, id: 'ralliement', mods: {} }, { genie: 1 }).cout).toBe(CARDS.ralliement!.cout >= 2 ? CARDS.ralliement!.cout - 1 : CARDS.ralliement!.cout);
  });
  it('Incorruptible : une défaite relance le combat à la moitié de la lassitude maximale', () => {
    const run = { ...newRun('t8', { ...freshMeta(), upg: { incorruptible: 1 } }), current: { kind: 'combat', reward: 'or', deck: 'd1' } as const };
    const g = createGame(fight(run, run.current, 1).setup);
    g.over = { winner: 'B', reason: 'lassitude' };
    const next = afterFight(run, g);
    expect(next.over).toBeNull();
    expect(next.revives).toBe(0);
    expect(next.lassitude).toBe(8);
    expect(next.relaunch).toBe(true);
    expect(next.current).toEqual(run.current);
  });
});

describe('Roguelite : Étendards', () => {
  it('Tambour, Carte d’état-major, Sceau, Lame maudite, Étendard déchiré', () => {
    const run = { ...newRun('t9'), etendards: ['tambour', 'etat_major', 'sceau', 'lame', 'dechire'] };
    const o = { kind: 'combat', reward: 'or', deck: 'd1' } as const;
    const plain = createGame(fight({ ...run, etendards: [] }, o, 5).setup);
    const g = createGame(fight(run, o, 5).setup);
    expect(g.players.A.resource).toBe(plain.players.A.resource + 1);
    expect(g.players.A.hand.length).toBe(plain.players.A.hand.length + 1);
    expect(g.players.A.leaderSeal).toBe(true);
    expect(g.config.endTurnLassitude.A).toBe(1);
    const rc = run.deck.find(c => CARDS[c.id]!.cardType === 'Regiment')!;
    const d = CARDS[variantId(rc)]!;
    expect(d.atk).toBe(CARDS[rc.id]!.atk! + 5);
    expect(d.mor).toBe(CARDS[rc.id]!.mor! + 1);
  });
  it('Sceau impérial : le premier Leader du tour coûte 1 de moins', () => {
    let s = blankGame();
    s.players.A.leaderSeal = true;
    place(s, 'A', 'avant', 0, 'soldat_kragz');
    place(s, 'A', 'avant', 1, 'soldat_kragz');
    s.players.A.level = 3; s.players.A.resource = 10;
    const cost = CARDS.capitaine_garde!.cout;
    const h1 = give(s, 'A', 'capitaine_garde'), h2 = give(s, 'A', 'capitaine_garde');
    s = act(s, { type: 'play', handUid: h1, target: { player: 'A', zone: 'avant', idx: 0 } }).state;
    expect(s.players.A.resource).toBe(10 - Math.max(0, cost - 1));
    s = act(s, { type: 'play', handUid: h2, target: { player: 'A', zone: 'avant', idx: 1 } }).state;
    expect(s.players.A.resource).toBe(10 - Math.max(0, cost - 1) - cost);
  });
  it('le mini-boss offre un Étendard', () => {
    const run = { ...newRun('t10'), current: { kind: 'miniboss', deck: 'd3' } as const };
    const g = createGame(fight(run, run.current, 1).setup);
    g.over = { winner: 'A', reason: 'lassitude' };
    const next = afterFight(run, g);
    expect(next.steps.some(x => x.kind === 'etendard')).toBe(true);
  });
});

describe('Roguelite : Eldrin, le premier Bourgeon', () => {
  it('deck elfe, volontaires elfes ou neutres, Étendards elfes', () => {
    const run = newRun('e1', freshMeta(), 'eldrin');
    expect(run.champion).toBe('eldrin');
    expect(run.deck.every(c => ['elfe', 'neutre'].includes(CARDS[c.id]!.faction))).toBe(true);
    const { setup } = fight(run, { kind: 'combat', reward: 'or', deck: 'd1' }, 1);
    expect(setup.A.faction).toBe('elfe');
  });
  it('améliorations d’Expérience propres à chaque champion', () => {
    let m = { ...freshMeta(), xp: 50 };
    m = buyUpgrade(m, 'armee_elue', 'eldrin');
    expect(m.upg['eldrin:armee_elue']).toBe(1);
    expect(m.upg['augustus:armee_elue']).toBeUndefined();
    expect(buyUpgrade(m, 'imperator', 'eldrin').upg['eldrin:imperator']).toBe(1); // pas proposée à Eldrin dans l'écran
    m = buyUpgrade(buyUpgrade(m, 'fontaine', 'eldrin'), 'inepuisable', 'eldrin');
    const run = newRun('e2', m, 'eldrin');
    expect(run.upg).toMatchObject({ armee_elue: 1, fontaine: 1, inepuisable: 1 });
    expect(nextNode({ ...run, lassitude: 5 }).lassitude).toBe(4);
    expect(createGame(fight(run, { kind: 'combat', reward: 'or', deck: 'd1' }, 1).setup).players.A.tacticDrawEvery).toBe(3);
  });
  it('Bannière du chasseur insatiable : Proie détruite → un régiment adverse perd 10 END', () => {
    const s = blankGame();
    const ctx = new Ctx(s);
    s.players.A.preyKillEnd = 10;
    const prey = place(s, 'B', 'avant', 0, 'recrue_imp', { prey: 'A' });
    const other = place(s, 'B', 'avant', 1, 'soldat_kragz');
    const before = other.currentEnd;
    ctx.destroy(prey, 'end');
    expect(other.currentEnd).toBe(before - 10);
  });
});

describe('Roguelite : Expérience', () => {
  it('versée à la fin de chaque combat gagné, pas en fin de run', () => {
    const run = { ...newRun('x1'), current: { kind: 'combat', reward: 'xp', deck: 'd1' } as const };
    const g = createGame(fight(run, run.current, 1).setup);
    g.over = { winner: 'A', reason: 'lassitude' };
    const next = afterFight(run, g);
    expect(xpWon(run, next)).toBe(3);
    expect(closeRun({ ...freshMeta(), xp: 3 }, { ...next, over: { won: false, text: '' } }).xp).toBe(3);
  });
});
