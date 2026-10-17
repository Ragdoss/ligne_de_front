// Vague 2 (Elfes) : chaque mécanique, la règle de Distance en première ligne, puis des parties aléatoires.
import { describe, expect, it } from 'vitest';
import { chooseActionV1 } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { WAVE2_IDS } from '../src/data/wave2';
import { addKeyword, Ctx } from '../src/engine/ctx';
import { applyAction, createGame, legalActions } from '../src/engine/game';
import { nextRandom } from '../src/engine/rng';
import type { GameEvent } from '../src/engine/types';
import { CARD_TEXT_FR } from '../src/i18n/cards.fr';
import { COLLECTIBLE } from '../src/profile/profile';
import { act, blankGame, give, place } from './helpers';

const slot = (player: 'A' | 'B', zone: 'avant' | 'arriere' | 'isole', idx: number) => ({ player, zone, idx });
const quiet = () => blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
type Hit = Extract<GameEvent, { type: 'attack' }>;
const hitsBy = (ev: GameEvent[], cardId: string) => ev.filter((e): e is Hit => e.type === 'attack' && e.attackerCard === cardId);

describe('Vague 2 : données', () => {
  it('12 cartes Elfes, nommées, collectionnables', () => {
    expect(WAVE2_IDS).toHaveLength(12);
    for (const id of WAVE2_IDS) {
      expect(CARD_TEXT_FR[id]?.name, id).toBeTruthy();
      expect(COLLECTIBLE).toContain(id);
      expect(CARDS[id]!.faction).toBe('elfe');
    }
  });
});

describe('Vague 2 : cibler les faibles', () => {
  it('Distance fonctionne en première ligne : vise le Moral le plus bas', () => {
    const s = quiet();
    place(s, 'A', 'avant', 0, 'eclaireuse_fourres');
    place(s, 'B', 'avant', 0, 'recrue_imp', { atk: 0 } as never);
    const weak = place(s, 'B', 'arriere', 2, 'recrue_imp', { currentMor: 2 });
    const r = act(s, { type: 'endTurn' });
    expect(hitsBy(r.events, 'eclaireuse_fourres')[0]!.target).toBe(weak.uid);
  });
  it('Sentinelle des cimes : +10 ATK contre un régiment au Moral brisé', () => {
    const s = quiet();
    place(s, 'A', 'arriere', 0, 'sentinelle_cimes');
    place(s, 'B', 'avant', 0, 'forteresse', { brokenMorale: true, currentMor: 1 });
    const r = act(s, { type: 'endTurn' });
    expect(hitsBy(r.events, 'sentinelle_cimes')[0]!.atk).toBe(new Ctx(s).effectiveAtk(s.players.A.board.arriere[0]!) + 10);
  });
  it('Traqueuse sylvestre : vise l’Endurance la plus basse', () => {
    const s = quiet();
    place(s, 'A', 'arriere', 0, 'traqueuse_sylvestre');
    place(s, 'B', 'avant', 0, 'recrue_imp', { currentMor: 1 });
    const hurt = place(s, 'B', 'avant', 2, 'recrue_imp', { currentEnd: 5 });
    const r = act(s, { type: 'endTurn' });
    expect(hitsBy(r.events, 'traqueuse_sylvestre')[0]!.target).toBe(hurt.uid);
  });
  it('Marque du chasseur : les tireurs visent la cible et ignorent 10 ARM', () => {
    let s = quiet(); s.players.A.level = 1; s.players.A.resource = 5;
    place(s, 'A', 'arriere', 0, 'traqueuse_sylvestre');
    place(s, 'B', 'avant', 0, 'recrue_imp', { currentEnd: 3 });
    const tank = place(s, 'B', 'avant', 3, 'forteresse');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'marque_chasseur'), target: slot('B', 'avant', 3) }).state;
    const r = act(s, { type: 'endTurn' });
    const h = hitsBy(r.events, 'traqueuse_sylvestre')[0]!;
    expect(h.target).toBe(tank.uid);
    expect(h.arm).toBe(Math.max(0, new Ctx(s).effectiveArm(s.players.B.board.avant[3]!) - 10));
    expect(r.state.players.B.board.avant[3]?.markedBy ?? null).toBeNull(); // « ce tour-ci »
  });
  it('Visez les faibles : la première ligne attaque le soutien désigné', () => {
    let s = quiet(); s.players.A.level = 2; s.players.A.resource = 5;
    place(s, 'A', 'avant', 0, 'recrue_imp');
    place(s, 'B', 'avant', 0, 'recrue_imp');
    const support = place(s, 'B', 'arriere', 3, 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'visez_faibles'), target: slot('B', 'arriere', 3) }).state;
    const r = act(s, { type: 'endTurn' });
    expect(hitsBy(r.events, 'recrue_imp').find(h => h.attacker === s.players.A.board.avant[0]!.uid)!.target).toBe(support.uid);
  });
  it('Chant de la traque : les tireurs frappent tout de suite', () => {
    let s = quiet(); s.players.A.level = 4; s.players.A.resource = 5;
    place(s, 'A', 'arriere', 0, 'sentinelle_cimes');
    place(s, 'A', 'avant', 0, 'eclaireuse_fourres');
    place(s, 'B', 'avant', 1, 'forteresse');
    const r = act(s, { type: 'play', handUid: give(s, 'A', 'chant_traque') });
    expect(hitsBy(r.events, 'sentinelle_cimes')).toHaveLength(1);
    expect(hitsBy(r.events, 'eclaireuse_fourres')).toHaveLength(1);
  });
  it('Seigneure de la chasse : un régiment adverse brisé détruit donne 2 lassitude de plus', () => {
    const s = quiet();
    place(s, 'A', 'arriere', 0, 'seigneure_chasse');
    place(s, 'B', 'avant', 0, 'recrue_imp', { brokenMorale: true, currentMor: 1, currentEnd: 5 });
    const before = s.players.B.points;
    const r = act(s, { type: 'endTurn' });
    expect(r.state.players.B.points).toBe(before + 1 + 2); // niveau 1 + Seigneure
  });
});

describe('Vague 2 : tenir la première ligne', () => {
  it('Racines protectrices : le régiment ne tombe pas, jusqu’au prochain tour du lanceur', () => {
    let s = quiet(); s.players.A.level = 2; s.players.A.resource = 5;
    place(s, 'A', 'avant', 0, 'recrue_imp', { currentEnd: 1 });
    place(s, 'B', 'avant', 0, 'forteresse');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'racines_protectrices'), target: slot('A', 'avant', 0) }).state;
    s = act(s, { type: 'endTurn' }).state;
    expect(s.players.A.board.avant[0]?.currentEnd).toBe(1);
    s = act(s, { type: 'endTurn' }).state; // combat du tour adverse : toujours protégé
    expect(s.players.A.board.avant[0]).toBeTruthy();
    expect(s.players.A.board.avant[0]!.guardOwner ?? null).toBeNull(); // fin au début du tour du lanceur
  });
  it('Bénédiction de la sylve : sauve le porteur une fois, puis part en défausse', () => {
    const s = quiet();
    place(s, 'A', 'avant', 0, 'eclaireuse_fourres', { currentEnd: 1, leader: 'benediction_sylve', leaderOwner: 'A' });
    place(s, 'B', 'avant', 0, 'forteresse');
    const r = act(s, { type: 'endTurn' });
    const u = r.state.players.A.board.avant[0]!;
    expect(u.currentEnd).toBe(1);
    expect(u.leader).toBeNull();
    expect(r.state.players.A.discard).toContain('benediction_sylve');
  });
  it('Gardienne du seuil : soigne ses voisins de la ligne avant avant les attaques', () => {
    const s = quiet();
    place(s, 'A', 'arriere', 1, 'gardienne_seuil');
    const f = place(s, 'A', 'avant', 1, 'recrue_imp', { currentEnd: 10, currentMor: 2 });
    const r = act(s, { type: 'endTurn' });
    const u = r.state.players.A.board.avant[1]!;
    expect(u.currentEnd).toBe(15);
    expect(u.currentMor).toBe(3);
    expect(u.uid).toBe(f.uid);
  });
});

describe('Vague 2 : placement et soutiens', () => {
  it('Racines immobilisantes : pas d’attaque tant que le lanceur contrôle un Élémentaux', () => {
    let s = quiet(); s.players.A.level = 2; s.players.A.resource = 5;
    place(s, 'A', 'avant', 0, 'pousse_sylve');
    place(s, 'B', 'avant', 0, 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'racines_immobilisantes'), target: slot('B', 'avant', 0) }).state;
    let r = act(s, { type: 'endTurn' });
    expect(hitsBy(r.events, 'recrue_imp')).toHaveLength(0);
    s = r.state; s.players.A.board.avant[0] = null; // plus d'Élémentaux
    place(s, 'A', 'avant', 0, 'forteresse');
    r = act(s, { type: 'endTurn' });
    expect(hitsBy(r.events, 'recrue_imp').length).toBeGreaterThan(0);
  });
  it('Maître des embuscades : + l’avance d’INI sur la cible', () => {
    const s = quiet();
    const e = place(s, 'A', 'avant', 0, 'eclaireuse_fourres', { leader: 'maitre_embuscades', leaderOwner: 'A', keywords: [] });
    const t = place(s, 'B', 'avant', 0, 'forteresse');
    const ctx = new Ctx(s);
    const diff = Math.max(0, ctx.effectiveIni(e) - ctx.effectiveIni(t));
    const r = act(s, { type: 'endTurn' });
    expect(hitsBy(r.events, 'eclaireuse_fourres')[0]!.atk).toBe(ctx.effectiveAtk(e) + diff);
  });
  it('Débordement X : frapper la première ligne blesse les deux régiments derrière', () => {
    const s = quiet();
    const a = place(s, 'A', 'avant', 1, 'recrue_imp');
    addKeyword(a, 'Débordement 5');
    place(s, 'B', 'avant', 1, 'forteresse');
    const b0 = place(s, 'B', 'arriere', 0, 'recrue_imp', { atk: 0 } as never);
    const b1 = place(s, 'B', 'arriere', 1, 'recrue_imp');
    const b3 = place(s, 'B', 'arriere', 3, 'recrue_imp');
    const r = act(s, { type: 'endTurn' });
    const ev = r.events.filter(e => e.type === 'effect' && e.key === 'debordement').map(e => (e as unknown as { data: { uid: number } }).data.uid);
    expect(ev.sort()).toEqual([b0.uid, b1.uid].sort());
    expect(ev).not.toContain(b3.uid);
  });
});

describe('Vague 2 : parties aléatoires', () => {
  it('80 parties Elfes avec la vague 2 vont au bout', () => {
    let rng = 4242;
    const rand = (n: number) => { const r = nextRandom(rng); rng = r.state; return Math.floor(r.value * n); };
    const elf = COLLECTIBLE.filter(id => CARDS[id]!.faction === 'elfe' || CARDS[id]!.faction === 'neutre');
    const low = elf.filter(id => CARDS[id]!.niveau <= 3), high = elf.filter(id => CARDS[id]!.niveau >= 4);
    const w2low = WAVE2_IDS.filter(id => CARDS[id]!.niveau <= 3), w2high = WAVE2_IDS.filter(id => CARDS[id]!.niveau >= 4);
    const deck = () => {
      const d = ['recrue_imp', 'recrue_imp', 'recrue_imp', 'recrue_imp', 'recrue_imp'];
      for (let i = 0; i < 25; i++) d.push(i % 2 ? w2low[rand(w2low.length)]! : low[rand(low.length)]!);
      for (let i = 0; i < 15; i++) d.push(i % 2 ? w2high[rand(w2high.length)]! : high[rand(high.length)]!);
      return d;
    };
    for (let g = 0; g < 80; g++) {
      let s = createGame({ seed: `w2-${g}`, A: { faction: 'elfe', deck: deck() }, B: { faction: g % 2 ? 'nomades' : 'elfe', deck: deck() } });
      for (let step = 0; step < 2500 && !s.over; step++) {
        const acts = legalActions(s);
        const a = g % 3 === 0 ? chooseActionV1(s) : acts[rand(acts.length)]!;
        const r = applyAction(s, a);
        if (!r.ok) throw new Error(`${r.error} ${JSON.stringify(a)}`);
        s = r.state;
        if (s.over) break;
        const ctx = new Ctx(s);
        for (const p of ['A', 'B'] as const) for (const u of ctx.units(p)) {
          expect(u.currentEnd).toBeGreaterThan(0);
          expect(u.currentMor).toBeGreaterThan(0);
        }
      }
    }
  }, 120000);
});
