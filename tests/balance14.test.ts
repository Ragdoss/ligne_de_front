// Équilibrage 14 (19/11/2026) : les nouveaux effets des cartes jamais retenues à impact négatif (tableur « Cartes à renforcer »).
import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/data/cards';
import { Ctx } from '../src/engine/ctx';
import { cardCost } from '../src/engine/play';
import { playsForHandCard } from '../src/engine/game';
import type { GameEvent, GameState, PlayerId, Zone } from '../src/engine/types';
import { act, blankGame, give, place } from './helpers';

const quiet = () => blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
const slot = (player: PlayerId, zone: Zone, idx: number) => ({ player, zone, idx });
const ready = (s: GameState, res = 20) => { for (const p of ['A', 'B'] as const) { s.players[p].level = 5; s.players[p].resource = res; } return s; };
type Hit = Extract<GameEvent, { type: 'attack' }>;
const hits = (ev: GameEvent[], cardId: string) => ev.filter((e): e is Hit => e.type === 'attack' && e.attackerCard === cardId);
const choose = (s: GameState, pick: (o: { cardId?: string; value?: number; handUid?: number; skip?: boolean }) => boolean) => {
  const i = s.pending[0]!.options!.findIndex(pick);
  expect(i).toBeGreaterThanOrEqual(0);
  return act(s, { type: 'choose', option: i }).state;
};

describe('Équilibrage 14', () => {
  it('Officier de relève : le régiment qui le reçoit regagne 1 Moral', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'recrue_imp', { leader: 'officier_releve', leaderOwner: 'A', currentEnd: 1 });
    place(s, 'A', 'avant', 1, 'soldat_kragz', { currentMor: 3 });
    place(s, 'B', 'avant', 0, 'forteresse');
    s = act(s, { type: 'endTurn' }).state;
    const to = s.players.A.board.avant[1]!;
    expect(to.leader).toBe('officier_releve');
    expect(to.currentMor).toBe(3 - 1 + 1); // −1 (mort d'un allié), +1 (Officier)
  });

  it('Chant de la sève : la 3e Tactique du tour donne aussi 1 Moral et pioche 1 carte', () => {
    let s = ready(quiet());
    const u = place(s, 'A', 'avant', 0, 'pousse_sylve', { currentEnd: 5, currentMor: 2 });
    s.players.A.tacticsThisTurn = 2;
    const n = s.players.A.hand.length;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'chant_seve'), target: slot('A', 'avant', 0) }).state;
    const v = new Ctx(s).findUnit(u.uid)!;
    expect(v.currentEnd).toBe(15);
    expect(v.currentMor).toBe(3);
    expect(v.tempAtk).toBe(10);
    expect(s.players.A.hand.length).toBe(n + 1);
  });

  it('Druide Ancien : le porteur attaque la Proie en priorité, avec +10 ATK', () => {
    const s = ready(quiet());
    place(s, 'A', 'avant', 0, 'pousse_sylve', { types: ['Elfe', 'Élémentaux'], leader: 'druide_ancien', leaderOwner: 'A' });
    place(s, 'B', 'avant', 0, 'forteresse');
    const prey = place(s, 'B', 'avant', 3, 'forteresse');
    prey.prey = 'A';
    const ctx = new Ctx(s);
    const base = ctx.effectiveAtk(s.players.A.board.avant[0]!);
    const h = hits(act(s, { type: 'endTurn' }).events, 'pousse_sylve')[0]!;
    expect(h.target).toBe(prey.uid);
    expect(h.atk).toBe(base + 10);
  });

  it('Rançon d’Âmes : +15 ATK par point, jusqu’à la fin du prochain tour du lanceur', () => {
    let s = ready(quiet());
    const d = place(s, 'A', 'avant', 0, 'chien_infernal');
    const ctx0 = new Ctx(s);
    const base = ctx0.effectiveAtk(d);
    s = act(s, { type: 'play', handUid: give(s, 'A', 'rancon_ames'), target: slot('A', 'avant', 0) }).state;
    s = choose(s, o => o.value === 2);
    expect(new Ctx(s).effectiveAtk(new Ctx(s).findUnit(d.uid)!)).toBe(base + 30);
    s = act(s, { type: 'endTurn' }).state; // combat de A
    expect(new Ctx(s).findUnit(d.uid)!.lingerAtk).toBe(30);
    s = act(s, { type: 'endTurn' }).state; // combat de B
    expect(new Ctx(s).findUnit(d.uid)!.lingerAtk).toBe(30);
    s = act(s, { type: 'endTurn' }).state; // combat suivant de A : fin du bonus
    expect(new Ctx(s).findUnit(d.uid)?.lingerAtk ?? 0).toBe(0);
  });

  it('Capacocha : (niveau sacrifié − 3) régiments de la main adverse demandent un Sacrifice', () => {
    let s = ready(quiet());
    place(s, 'A', 'arriere', 0, 'forteresse'); // niveau 5 : 2 régiments touchés
    for (const id of ['recrue_imp', 'recrue_imp', 'recrue_imp', 'promotion']) give(s, 'B', id);
    s = act(s, { type: 'play', handUid: give(s, 'A', 'capacocha'), target: slot('A', 'arriere', 0) }).state;
    const taxed = s.players.B.hand.filter(h => h.sacrificeBonus);
    expect(taxed).toHaveLength(2);
    expect(taxed.every(h => h.cardId === 'recrue_imp')).toBe(true);
    // Une Recrue taxée ne peut se jouer qu'en sacrifiant un régiment de niveau 1+.
    s.active = 'B';
    expect(playsForHandCard(s, taxed[0]!.uid)).toHaveLength(0);
    place(s, 'B', 'avant', 2, 'recrue_imp');
    const plays = playsForHandCard(s, taxed[0]!.uid);
    expect(plays.length).toBeGreaterThan(0);
    expect(plays.every(a => a.type === 'play' && a.target?.zone === 'avant' && a.target.idx === 2)).toBe(true);
  });

  it('Pacte mineur : une des cartes piochées coûte 1 de moins', () => {
    let s = ready(quiet());
    s.players.A.deck = ['chevalier_prov', 'forteresse', 'recrue_imp', ...s.players.A.deck];
    s = act(s, { type: 'play', handUid: give(s, 'A', 'pacte_mineur') }).state;
    s = choose(s, o => o.value === 1); // paie l'Offrande : pioche 3
    expect(s.pending[0]!.kind).toBe('pacteMineurCost');
    s = choose(s, o => o.cardId === 'forteresse');
    const h = s.players.A.hand.find(x => x.cardId === 'forteresse')!;
    expect(cardCost(new Ctx(s), 'A', h)).toBe(CARDS.forteresse!.cout - 1);
  });

  it('Rempart de chair : pas plus de 1 Moral perdu par tour sous les attaques', () => {
    let s = ready(quiet());
    const d = place(s, 'B', 'avant', 0, 'chien_infernal', { types: ['Démon'] });
    place(s, 'A', 'avant', 0, 'chien_infernal');
    place(s, 'A', 'arriere', 0, 'archer_imp');
    s.active = 'B';
    s = act(s, { type: 'play', handUid: give(s, 'B', 'rempart_chair'), target: slot('B', 'avant', 0) }).state;
    s = choose(s, o => o.value === 0);
    expect(new Ctx(s).findUnit(d.uid)!.squareArm).toBe(20);
    const mor = new Ctx(s).findUnit(d.uid)!.currentMor;
    s = act(s, { type: 'endTurn' }).state; // combat de B : A riposte
    const r = act(s, { type: 'endTurn' }); // combat de A : deux attaques sur le chien de B
    const lost = r.events.filter(e => e.type === 'attack' && e.target === d.uid).reduce((n, e) => n + (e as Hit).moralLoss, 0);
    expect(lost).toBeLessThanOrEqual(1);
    void mor;
  });

  it('Voile d’ombre : Mirage 1, Mirage 2 avec l’Offrande', () => {
    let s = ready(quiet());
    const u = place(s, 'A', 'avant', 0, 'chien_infernal');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'voile_ombre'), target: slot('A', 'avant', 0) }).state;
    s = choose(s, o => o.value === 1); // paie l'Offrande
    expect(new Ctx(s).findUnit(u.uid)!.keywords).toContain('Mirage 2');
  });

  it('Puits empoisonné : le dessus de la pioche et une carte de la main au hasard', () => {
    let s = ready(quiet());
    s.players.B.board.isole = new Ctx(s).makeUnit('puits_empoisonne', 'B');
    for (const id of ['recrue_imp', 'promotion']) give(s, 'A', id);
    s.active = 'B';
    const deck = s.players.A.deck.length, hand = s.players.A.hand.length;
    s = act(s, { type: 'endTurn' }).state; // début du tour de A
    expect(s.players.A.discard.length).toBeGreaterThanOrEqual(2);
    expect(s.players.A.deck.length).toBeLessThan(deck);
    void hand;
  });

  it('Forgeron de campagne : +5 ARM au régiment choisi', () => {
    let s = ready(quiet());
    s.players.B.board.isole = new Ctx(s).makeUnit('forgeron_campagne', 'B');
    place(s, 'B', 'avant', 0, 'recrue_imp');
    const t = place(s, 'B', 'avant', 1, 'chevalier_prov');
    s = act(s, { type: 'endTurn' }).state; // début du tour de B
    expect(s.pending[0]!.kind).toBe('forgeron');
    s = choose(s, o => o.value === t.uid);
    expect(new Ctx(s).findUnit(t.uid)!.baseArm).toBe(t.baseArm + 5);
  });

  it('Quartier-maître : +1 ressource, puis +2 à partir de son 3e tour en jeu', () => {
    let s = ready(quiet(), 0);
    place(s, 'B', 'avant', 0, 'recrue_imp', { leader: 'quartier_maitre', leaderOwner: 'B', leaderSince: s.turn - 1 }); // attaché au tour précédent de B
    const gains: number[] = [];
    for (let i = 0; i < 3; i++) {
      const r = act(s, { type: 'endTurn' }); // début du tour de B
      gains.push(r.events.filter(e => e.type === 'resource' && e.source === 'generator').reduce((n, e) => n + (e as { amount: number }).amount, 0));
      s = act(r.state, { type: 'endTurn' }).state;
    }
    expect(gains).toEqual([1, 1, 2]);
  });

  it('Maître des pactes : un sacrifice fait aussi piocher, et chaque déclenchement rapporte 1 ressource', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 1, 'chien_infernal', { types: ['Démon'], leader: 'maitre_pactes', leaderOwner: 'A' });
    place(s, 'A', 'arriere', 0, 'cultiste');
    const res = s.players.A.resource;
    const r = act(s, { type: 'play', handUid: give(s, 'A', 'rituel_sang_noir'), target: slot('A', 'arriere', 0) });
    expect(r.events.filter(e => e.type === 'draw' && e.source === 'maitre_pactes')).toHaveLength(1);
    expect(r.state.players.A.resource).toBe(res - CARDS.rituel_sang_noir!.cout + 1); // seconde passe : +1 ressource
  });

  it('Maître des pactes (seconde passe) : plus de limite d’une fois par tour', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 1, 'chien_infernal', { types: ['Démon'], leader: 'maitre_pactes', leaderOwner: 'A' });
    let n = 0;
    for (let i = 0; i < 2; i++) {
      const r = act(s, { type: 'play', handUid: give(s, 'A', 'pacte_sang') });
      n += r.events.filter(e => e.type === 'draw' && e.source === 'maitre_pactes').length;
      s = r.state;
    }
    expect(n).toBe(2);
  });

  it('Dernier carré (seconde passe) : le Moral reste protégé après le tour suivant', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'recrue_imp');
    const victim = place(s, 'A', 'avant', 1, 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'dernier_carre') }).state;
    s = act(act(s, { type: 'endTurn' }).state, { type: 'endTurn' }).state; // le tour de A revient
    const mor = s.players.A.board.avant[0]!.currentMor;
    const v = new Ctx(s).findUnit(victim.uid);
    if (v) new Ctx(s).destroy(v, 'end');
    expect(s.players.A.board.avant[0]!.currentMor).toBe(mor);
  });

  it('Dresseuse de basilics (seconde passe) : le Basilic cherché arrive avec +10 ATK, +5 END, +2 Moral', () => {
    let s = ready(quiet());
    s.players.B.discard = ['forteresse'];
    s.players.A.deck = ['recrue_imp', 'basilics_oasis', 'recrue_imp'];
    s = act(s, { type: 'play', handUid: give(s, 'A', 'dresseuse_basilics'), target: slot('A', 'arriere', 0) }).state;
    s = choose(s, o => o.cardId === 'forteresse');
    const h = s.players.A.hand.find(x => x.cardId === 'basilics_oasis')!;
    expect(h.buff).toEqual({ atk: 10, end: 5, mor: 2 });
    s = act(s, { type: 'play', handUid: h.uid, target: slot('A', 'avant', 2) }).state;
    const u = s.players.A.board.avant[2]!;
    expect(u.baseAtk).toBe(CARDS.basilics_oasis!.atk! + 10);
    expect(u.maxMor).toBe(CARDS.basilics_oasis!.mor! + 2);
  });
});
