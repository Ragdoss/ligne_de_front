// Roguelite, 21/11/2026 (Nathan) : le Sultan (Nomades), ses Étendards et améliorations, l'acte 3, le Titan du Reflet
// (mini-boss) et le Titan de la Discorde (boss).
import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { SCENARIOS } from '../src/campaign/campaigns';
import { attack } from '../src/engine/combat';
import { Ctx, keywordValue } from '../src/engine/ctx';
import { applyAction, createGame } from '../src/engine/game';
import { startTurn } from '../src/engine/turn';
import type { GameState } from '../src/engine/types';
import {
  afterFight, championOf, CHAMPIONS, fight, newMeta, newRun, optionsFor, registerRun, SULTAN_UNLOCK, unlocksWon, variantDef, withUnlocks, type RunState,
} from '../src/roguelite/run';
import { ACT3_DECKS } from '../src/roguelite/act3decks';
import { registerTitanCards } from '../src/data/titans';
import { act, blankGame, give, place } from './helpers';

registerTitanCards();
const won = (s: GameState, winner: 'A' | 'B' = 'A') => ({ ...s, over: { winner, reason: 'test' }, players: { ...s.players, A: { ...s.players.A, points: 4 } } }) as GameState;
const fakeGame = () => won(blankGame());

describe('Le Sultan', () => {
  it('champion Nomade, deck de départ de la campagne Nomade, débloqué par le boss de l’acte 1', () => {
    const c = championOf('sultan');
    expect(c.faction).toBe('nomades');
    expect(c.deck()).toEqual(SCENARIOS.n1!.A.deckList);
    expect(c.unlock).toBe(SULTAN_UNLOCK);
    expect(CHAMPIONS.map(x => x.id)).toContain('sultan');
  });
  it('battre le boss de l’acte 1 débloque le Sultan', () => {
    let run = newRun('sul1');
    run = { ...run, node: 8, current: { kind: 'boss', titan: 'glissement', deck: 'e2' } };
    const next = afterFight(run, fakeGame());
    expect(next.act).toBe(2);
    expect(unlocksWon(run, next)).toEqual([SULTAN_UNLOCK]);
    const meta = withUnlocks(newMeta(), unlocksWon(run, next));
    expect(meta.unlocks).toEqual([SULTAN_UNLOCK]);
    expect(withUnlocks(meta, [SULTAN_UNLOCK])).toBe(meta);
  });
  it('améliorations : Basilics +5 % ATK +10 % END et INI par niveau, isolés −1 par niveau, Leaders Mirage, Fanion des pillards', () => {
    const b = CARDS.basilics_desert!;
    const d = variantDef({ uid: 1, id: 'basilics_desert', mods: {} }, { maitre_basilics: 2 });
    expect(d.atk).toBe(Math.round(b.atk! * 1.1));
    expect(d.end).toBe(Math.round(b.end! * 1.2));
    expect(d.ini).toBe(Math.round(b.ini! * 1.2));
    expect(variantDef({ uid: 1, id: 'saboteur_nomade', mods: {} }, { caravanes: 2 }).cout).toBe(Math.max(0, CARDS.saboteur_nomade!.cout - 2));
    expect((variantDef({ uid: 1, id: 'vision', mods: {} }, { mirage_royal: 2 }) as unknown as { leaderMirage: number }).leaderMirage).toBe(2);
    expect(variantDef({ uid: 1, id: 'recrue_imp', mods: {} }, { 'etd:fanion': 1 }).keywords).toContain('Pillage 1');
    expect(variantDef({ uid: 1, id: 'razzieurs_dunes', mods: {} }, { 'etd:fanion': 1 }).keywords).toEqual(['Pillage 2']);
  });
});

describe('Étendards et Razzia (moteur)', () => {
  it('Sablier du Sultan : au début de ton tour, l’adversaire défausse la 1re carte de sa pioche', () => {
    const s = blankGame();
    s.players.A.turnMill = 1;
    s.scenario = { events: [], fired: [], convoyHold: 0 };
    const before = s.players.B.discard.length;
    startTurn(new Ctx(s), 'A');
    expect(s.players.B.discard.length).toBe(before + 1);
  });
  it('Voile de mirage : ton régiment au Moral le plus bas gagne Mirage 1 (et ça s’additionne)', () => {
    const s = blankGame();
    s.players.A.mirageLowest = 1;
    const low = place(s, 'A', 'avant', 0, 'recrue_imp', { currentMor: 2 });
    place(s, 'A', 'avant', 1, 'recrue_imp');
    s.scenario = { events: [], fired: [], convoyHold: 0 };
    startTurn(new Ctx(s), 'A');
    startTurn(new Ctx(s), 'A');
    expect(keywordValue(s.players.A.board.avant[0]!, 'Mirage')).toBe(2);
    expect(low.uid).toBe(s.players.A.board.avant[0]!.uid);
  });
  it('Razzia : une défausse adverse en entraîne une de plus, au plus N fois par tour', () => {
    const s = blankGame();
    s.players.A.razzia = 2;
    for (let i = 0; i < 5; i++) give(s, 'B', 'recrue_imp');
    const ctx = new Ctx(s);
    ctx.discardFromHand('B', s.players.B.hand[0]!.uid, 'test');
    expect(s.players.B.hand.length).toBe(3); // 1 + 1 de Razzia
    const deck = s.players.B.deck.length;
    ctx.mill('B', 2, 'test');
    expect(s.players.B.deck.length).toBe(deck - 3); // 2 + 1 (la limite de 2 par tour est atteinte)
    ctx.discardFromHand('B', s.players.B.hand[0]!.uid, 'marche', true); // échange volontaire : pas de Razzia
    expect(s.players.B.hand.length).toBe(2);
  });
});

describe('Acte 3', () => {
  const act3 = (seed: string): RunState => ({ ...newRun(seed), act: 3, node: 0 });
  it('le boss de l’acte 2 ouvre l’acte 3 ; ses combats utilisent les decks de l’acte 3', () => {
    let run: RunState = { ...newRun('a3'), act: 2, node: 8, current: { kind: 'boss', titan: 'fracture', deck: 'a2:empire' } };
    run = afterFight(run, fakeGame());
    expect(run.act).toBe(3);
    expect(run.over).toBeNull();
    const combats = [0, 1, 2, 3, 4].flatMap(n => optionsFor({ ...run, node: n })).filter(o => o.kind === 'combat');
    expect(combats.length).toBeGreaterThan(0);
    for (const o of combats) expect((o as { deck: string }).deck.startsWith('a3:')).toBe(true);
    expect(optionsFor({ ...run, node: 8 })).toEqual([expect.objectContaining({ kind: 'boss', titan: 'discorde' })]);
    expect(optionsFor({ ...run, node: 4 }).find(o => o.kind === 'miniboss')).toEqual(expect.objectContaining({ boss: 'reflet' }));
  });
  it('10 decks : les 6 paires et les 4 trios, de 45 cartes', () => {
    expect(ACT3_DECKS.length).toBeGreaterThanOrEqual(2);
    for (const d of ACT3_DECKS) { expect(d.cards).toHaveLength(45); expect(d.factions.length).toBeGreaterThanOrEqual(2); }
  });
  it('adversaire de l’acte 3 : niveau 3, 1 régiment de niveau 2 et 2 de niveau 3 en main', () => {
    const run = act3('a3b');
    registerRun(run);
    const { setup } = fight(run, { kind: 'combat', reward: 'or', deck: `a3:${ACT3_DECKS[0]!.key}` }, 1);
    const s = createGame(setup);
    expect(s.players.B.level).toBe(3);
    const lv = s.players.B.hand.filter(h => CARDS[h.cardId]!.cardType === 'Regiment').map(h => CARDS[h.cardId]!.niveau);
    expect(lv.filter(l => l === 2).length).toBeGreaterThanOrEqual(1);
    expect(lv.filter(l => l === 3).length).toBeGreaterThanOrEqual(2);
    expect(s.config.defeatLassitude.B).toBe(50);
  });
  it('battre le Titan de la Discorde gagne la run', () => {
    const run = { ...act3('a3c'), node: 8, current: { kind: 'boss' as const, titan: 'discorde' as const, deck: `a3:${ACT3_DECKS[0]!.key}` } };
    const next = afterFight(run, fakeGame());
    expect(next.over?.won).toBe(true);
  });
  it('boss : Titan en arrière 2, 10 Manipulations et 3 Modifieurs dans son deck', () => {
    const run = act3('a3d');
    const { setup } = fight(run, { kind: 'boss', titan: 'discorde', deck: `a3:${ACT3_DECKS[0]!.key}` }, 1);
    const all = [...setup.B.deck];
    expect(all.filter(x => x === 'manipulation_faibles')).toHaveLength(10);
    expect(all.filter(x => x === 'modifieur_esprit')).toHaveLength(3);
    const s = createGame(setup);
    expect(s.players.B.board.arriere[1]?.cardId).toBe('titan_discorde');
    expect(s.config.mustSurvive.B).toBe('titan_discorde');
  });
});

describe('Titan de la Discorde (moteur)', () => {
  it('à sa 3e attaque contre le Titan, le régiment passe de son côté après le combat', () => {
    const s = blankGame();
    s.scenario = { events: [], fired: [], convoyHold: 0, discorde: { pid: 'B', titan: 'titan_discorde', switchAt: 3 } };
    const t = place(s, 'B', 'arriere', 1, 'titan_discorde');
    const a = place(s, 'A', 'avant', 1, 'recrue_imp', { maxEnd: 999, currentEnd: 999 });
    const ctx = new Ctx(s);
    attack(ctx, a, t); attack(ctx, a, t);
    ctx.settleControl();
    expect(a.controller).toBe('A');
    attack(ctx, a, t);
    expect(a.controller).toBe('A'); // pas au milieu du combat
    ctx.settleControl();
    expect(a.controller).toBe('B');
    expect(ctx.slotOf(a.uid)?.player).toBe('B');
  });
  it('Manipulation des faibles : le régiment reste pris jusqu’à ce que son Moral se brise', () => {
    let s = blankGame();
    for (const p of ['A', 'B'] as const) { s.players[p].level = 5; s.players[p].resource = 10; }
    s.active = 'B';
    const u = place(s, 'A', 'avant', 2, 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'B', 'manipulation_faibles'), target: { player: 'A', zone: 'avant', idx: 2 } }).state;
    s = act(s, { type: 'choose', option: 0 }).state;
    const ctx = new Ctx(s);
    const taken = ctx.findUnit(u.uid)!;
    expect(taken.controller).toBe('B');
    ctx.returnBorrowed(); // la fin du tour ne le rend pas
    expect(taken.controller).toBe('B');
    taken.currentMor = 1; ctx.checkBroken(taken); ctx.settleControl();
    expect(taken.controller).toBe('A');
  });
  it('Modifieur de l’esprit : au début de ton tour il prend ton meilleur régiment, rendu quand il quitte le jeu', () => {
    const s = blankGame();
    const strong = place(s, 'A', 'avant', 0, 'basilics_desert');
    place(s, 'A', 'avant', 1, 'recrue_imp');
    const m = new Ctx(s).makeUnit('modifieur_esprit', 'B');
    s.players.B.board.isole = m;
    startTurn(new Ctx(s), 'A');
    const ctx = new Ctx(s);
    expect(ctx.findUnit(strong.uid)!.controller).toBe('B');
    s.players.B.board.isole = null; // il quitte le jeu
    ctx.settleControl();
    expect(ctx.findUnit(strong.uid)!.controller).toBe('A');
  });
});

describe('Titan du Reflet (moteur)', () => {
  it('chaque régiment joué crée en face une copie à 75 % ; le Titan ne pose qu’en face de tes régiments', () => {
    let s = blankGame();
    for (const p of ['A', 'B'] as const) { s.players[p].level = 5; s.players[p].resource = 10; }
    s.scenario = { events: [], fired: [], convoyHold: 0, reflet: { pid: 'B', pct: 75 } };
    s = act(s, { type: 'play', handUid: give(s, 'A', 'recrue_imp'), target: { player: 'A', zone: 'avant', idx: 3 } }).state;
    const copy = s.players.B.board.avant[3]!;
    expect(copy.cardId).toBe('recrue_imp');
    expect(copy.baseAtk).toBe(Math.round(10 * 0.75));
    expect(copy.maxEnd).toBe(Math.round(30 * 0.75));
    expect(copy.isToken).toBe(true);
    s.active = 'B';
    const h = give(s, 'B', 'recrue_imp');
    expect(applyAction(s, { type: 'play', handUid: h, target: { player: 'B', zone: 'avant', idx: 0 } }).ok).toBe(false);
  });
});

describe('Combats de l’acte 3 joués par l’ordinateur', () => {
  it('le Reflet et la Discorde se jouent jusqu’au bout sans erreur', () => {
    for (const o of [{ kind: 'miniboss', boss: 'reflet', deck: `a3:${ACT3_DECKS[0]!.key}` }, { kind: 'boss', titan: 'discorde', deck: `a3:${ACT3_DECKS[ACT3_DECKS.length - 1]!.key}` }] as const) {
      const run = { ...newRun('sim'), act: 3, lassitude: 16 };
      registerRun(run);
      let s = createGame(fight(run, o, 7).setup);
      for (let k = 0; k < 4000 && !s.over && s.turn <= 40; k++) {
        const r = applyAction(s, chooseAction(s));
        expect(r.ok).toBe(true);
        if (!r.ok) break;
        s = r.state;
      }
      expect(s.turn).toBeGreaterThan(2);
    }
  }, 60000);
});
