// Roguelite, événements (Nathan, 22/11/2026) : camp abandonné revu, fontaine des Elfes, bazar de l'oasis, chantier d'un
// sceau, ville assiégée ; maximum d'Offrandes par événement.
import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { registerTitanCards } from '../src/data/titans';
import { applyAction, createGame } from '../src/engine/game';
import type { GameState } from '../src/engine/types';
import {
  afterFight, applyCards, catalogueFor, defeatAt, DEMON_UNLOCK, eventChoices, EVENT_MAX_OFFERINGS, fight, garrisonStats, newMeta, newRun, resolveEvent,
  unlocksWon, type RunMeta, type RunState,
} from '../src/roguelite/run';
import { blankGame } from './helpers';

registerTitanCards();
const metaWith = (event: string, off: number, offrandes = 5): RunMeta => ({ ...newMeta(), offrandes, offeredAt: { [event]: off } });
const ids = (run: RunState, meta: RunMeta, ev: Parameters<typeof eventChoices>[2]) => eventChoices(run, meta, ev).map(c => c.id);
const enabled = (run: RunState, meta: RunMeta, ev: Parameters<typeof eventChoices>[2], id: string) => !eventChoices(run, meta, ev).find(c => c.id === id)!.disabled;
const won = (): GameState => ({ ...blankGame(), over: { winner: 'A', reason: 'test' } }) as GameState;

describe('Offrandes au plus par événement', () => {
  it('au maximum, les choix à Offrande disparaissent', () => {
    const run = newRun('max');
    for (const [ev, max] of Object.entries(EVENT_MAX_OFFERINGS) as [Parameters<typeof eventChoices>[2], number][]) {
      if (ev === 'ville') run.ville = { cardLevel: 0, offered: false };
      expect(ids(run, metaWith(ev, max - 1), ev)).toContain(ev === 'bazar' ? 'offrande' : 'offrande');
      expect(ids(run, metaWith(ev, max), ev)).not.toContain('offrande');
    }
  });
});

describe('Le camp abandonné', () => {
  it('se reposer : +5 de lassitude maximale par Offrande déjà faite, pour le reste de la run', () => {
    const run = newRun('camp');
    expect(enabled(run, metaWith('camp', 0), 'camp', 'repos')).toBe(false);
    const before = defeatAt(run);
    resolveEvent(run, metaWith('camp', 2), 'camp', 'repos');
    expect(run.bonusLimit).toBe(10);
    expect(defeatAt(run)).toBe(before + 10);
    expect(defeatAt({ ...run, act: 3 })).toBe(defeatAt({ ...run, act: 3, bonusLimit: 0 }) + 10);
  });
});

describe('La fontaine des Elfes', () => {
  it('boire : −5 lassitude par Offrande ; l’Offrande ne fait rien d’autre ; Incorruptible après 3 Offrandes', () => {
    const run = { ...newRun('fon'), lassitude: 20 };
    resolveEvent(run, metaWith('fontaine', 2), 'fontaine', 'boire');
    expect(run.lassitude).toBe(10);
    const m = metaWith('fontaine', 0);
    resolveEvent(run, m, 'fontaine', 'offrande');
    expect(m.offrandes).toBe(4);
    expect(m.offeredAt.fontaine).toBe(1);
    expect(run.steps).toHaveLength(0);
    expect(ids(run, metaWith('fontaine', 2), 'fontaine')).not.toContain('incorruptible');
    const m3 = metaWith('fontaine', 3);
    expect(ids(run, m3, 'fontaine')).toContain('incorruptible');
    resolveEvent(run, m3, 'fontaine', 'incorruptible');
    expect(m3.unlocks).toContain('incorruptible');
  });
  it('tremper les armes : retire les malus de 3 cartes par Offrande, au hasard', () => {
    const run = newRun('tre');
    for (const rc of run.deck.slice(0, 5)) rc.curse = { atk: -5 };
    resolveEvent(run, metaWith('fontaine', 1), 'fontaine', 'tremper');
    expect(run.deck.filter(c => c.curse).length).toBe(2);
  });
});

describe('Le bazar de l’oasis', () => {
  it('dîme : 30 or par Offrande ; carte au choix parmi toutes celles du champion (sans binômes)', () => {
    const run = newRun('baz');
    const g = run.gold;
    resolveEvent(run, metaWith('bazar', 2), 'bazar', 'dime');
    expect(run.gold).toBe(g + 60);
    resolveEvent(run, metaWith('bazar', 0), 'bazar', 'carte');
    expect(run.steps[0]).toEqual({ kind: 'catalogue' });
    const cat = catalogueFor(run);
    expect(cat.length).toBeGreaterThan(50);
    expect(cat.some(id => CARDS[id]!.niveau === 5)).toBe(true);
    expect(cat.every(id => ['empire', 'neutre'].includes(CARDS[id]!.faction) && ((CARDS[id]!.factions as string[] | undefined)?.length ?? 0) < 2)).toBe(true);
  });
  it('l’Offrande donne la Caravane marchande pour la run ; la 2e débloque la Mobilisation initiale ; à 5, la ligne logistique', () => {
    const run = newRun('car');
    const m = metaWith('bazar', 1);
    resolveEvent(run, m, 'bazar', 'offrande');
    expect(run.caravane).toBe(true);
    expect(m.unlocks).toContain('mobilisation_initiale');
    const s = createGame(fight(run, { kind: 'combat', reward: 'or', deck: 'e2' }, 1).setup);
    expect(s.players.A.board.isole?.cardId).toBe('caravane_marchande');
    const run2 = newRun('car2');
    expect(ids(run2, metaWith('bazar', 5), 'bazar')).toEqual(['dime', 'carte', 'logistique']);
    resolveEvent(run2, metaWith('bazar', 5), 'bazar', 'logistique');
    expect(run2.caravane).toBe(true);
  });
});

describe('Le chantier d’un sceau', () => {
  it('le sceau : les N prochains Titans boss d’acte commencent avec 15 × N END en moins', () => {
    const run = newRun('sce');
    expect(enabled(run, metaWith('chantier', 0), 'chantier', 'sceau')).toBe(false);
    resolveEvent(run, metaWith('chantier', 2), 'chantier', 'sceau');
    expect(run.sceau).toEqual({ left: 2, end: 30 });
    const s = createGame(fight(run, { kind: 'boss', titan: 'glissement', deck: 'e2' }, 1).setup);
    const t = [...s.players.B.board.arriere, ...s.players.B.board.avant].find(u => u?.cardId === 'titan_glissement')!;
    expect(t.maxEnd).toBe(CARDS.titan_glissement!.end! - 30);
    const next = afterFight({ ...run, node: 8, current: { kind: 'boss', titan: 'glissement', deck: 'e2' } }, { ...won(), players: { ...won().players } });
    expect(next.sceau?.left).toBe(1);
  });
  it('la bénédiction Parangon demande Incorruptible au niveau 1 ou plus', () => {
    const run = newRun('par');
    expect(enabled(run, metaWith('chantier', 0), 'chantier', 'benediction')).toBe(false);
    const m = { ...metaWith('chantier', 0), upg: { incorruptible: 1 } };
    expect(enabled(run, m, 'chantier', 'benediction')).toBe(true);
    resolveEvent(run, m, 'chantier', 'benediction');
    expect(m.unlocks).toContain('parangon');
  });
});

describe('La ville assiégée', () => {
  it('une carte et une Offrande au plus, puis partir ou combattre ; bonus = niveau de la carte + Offrandes', () => {
    const run = newRun('vil');
    run.ville = { cardLevel: 0, offered: false };
    const m = metaWith('ville', 1);
    resolveEvent(run, m, 'ville', 'carte');
    expect(run.steps.map(x => x.kind)).toEqual(['cartes', 'evenement']);
    const lvl3 = run.deck.find(c => CARDS[c.id]!.niveau >= 2)!;
    applyCards(run, 'ville', [lvl3.uid]);
    run.steps.shift();
    expect(run.deck.some(c => c.uid === lvl3.uid)).toBe(false);
    expect(ids(run, m, 'ville')).toEqual(['offrande', 'partir', 'combat']);
    resolveEvent(run, m, 'ville', 'offrande');
    run.steps.shift();
    expect(ids(run, m, 'ville')).toEqual(['partir', 'combat']);
    resolveEvent(run, m, 'ville', 'combat');
    expect(run.current).toEqual(expect.objectContaining({ kind: 'ville', bonus: CARDS[lvl3.id]!.niveau + 2 }));
  });
  it('le combat : garnison en arrière 2, Garde d’Asura, Diablotins ; adversaire un niveau plus haut ; la garnison doit survivre', () => {
    const run = newRun('vil2');
    const b = 4, g = garrisonStats(b);
    const s = createGame(fight(run, { kind: 'ville', deck: 'e2', bonus: b }, 1).setup);
    const gar = s.players.A.board.arriere[1]!;
    expect(gar.cardId).toBe('garnison_ville');
    expect([gar.baseAtk, gar.maxEnd, gar.baseArm, gar.ini, gar.maxMor]).toEqual([g.atk, g.end, g.arm, g.ini, g.mor]);
    expect(s.players.A.board.arriere[0]?.cardId).toBe('garde_asura');
    expect(s.players.A.board.avant[2]?.cardId).toBe('diablotins');
    expect(s.players.B.board.arriere[2]?.cardId).toBe('ingenieurs_siege');
    expect(s.players.B.board.isole?.cardId).toBe('forgeron_campagne');
    expect(s.players.B.level).toBe(2);
    expect(s.config.mustSurvive.A).toBe('garnison_ville');
  });
  it('gagner : or, Essence, Expérience, un Étendard, et le déblocage du champion des Démons', () => {
    const run = { ...newRun('vil3'), current: { kind: 'ville' as const, deck: 'e2', bonus: 2 } };
    const next = afterFight(run, won());
    expect(unlocksWon(run, next)).toEqual([DEMON_UNLOCK]);
    expect(next.steps.some(x => x.kind === 'etendard')).toBe(true);
    expect(next.essence).toBe(run.essence + 5);
  });
  it('se joue jusqu’au bout par l’ordinateur', () => {
    let s = createGame(fight({ ...newRun('vil4'), act: 2, lassitude: 8 }, { kind: 'ville', deck: 'a2:empire', bonus: 3 }, 3).setup);
    for (let k = 0; k < 4000 && !s.over && s.turn <= 40; k++) { const r = applyAction(s, chooseAction(s)); expect(r.ok).toBe(true); if (!r.ok) break; s = r.state; }
    expect(s.turn).toBeGreaterThan(1);
  }, 30000);
});
