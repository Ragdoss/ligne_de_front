// Vague 3 : Prime, succession des Leaders, main adverse des Nomades, Leaders qui ne se perdent pas.
import { describe, expect, it } from 'vitest';
import { Ctx } from '../src/engine/ctx';
import { cardCost } from '../src/engine/play';
import type { GameEvent, GameState, PlayerId, Zone } from '../src/engine/types';
import { act, blankGame, give, place } from './helpers';

const quiet = () => blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
const slot = (player: PlayerId, zone: Zone, idx: number) => ({ player, zone, idx });
const ready = (s: GameState, res = 10) => { for (const p of ['A', 'B'] as const) { s.players[p].level = 5; s.players[p].resource = res; } return s; };
type Hit = Extract<GameEvent, { type: 'attack' }>;
const hits = (ev: GameEvent[], cardId: string) => ev.filter((e): e is Hit => e.type === 'attack' && e.attackerCard === cardId);
const choose = (s: GameState, pick: (o: { cardId?: string; value?: number; handUid?: number }) => boolean) => {
  const i = s.pending[0]!.options!.findIndex(pick);
  expect(i).toBeGreaterThanOrEqual(0);
  return act(s, { type: 'choose', option: i }).state;
};

describe('Vague 3 — Elfes (Prime)', () => {
  it('Prime : bonus seulement si la cible n’a pas encore attaqué', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'lames_aube');
    place(s, 'B', 'avant', 0, 'forteresse');
    expect(hits(act(s, { type: 'endTurn' }).events, 'lames_aube')[0]!.atk).toBe(10 + 5);
    s = ready(quiet());
    place(s, 'A', 'avant', 0, 'lames_aube');
    place(s, 'B', 'avant', 0, 'forteresse', { tempIni: 100 });
    expect(hits(act(s, { type: 'endTurn' }).events, 'lames_aube')[0]!.atk).toBeLessThanOrEqual(10);
  });

  it('Duelliste sylvestre sonne sa cible ; Première Lame attaque deux fois', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'duelliste_sylvestre');
    place(s, 'B', 'avant', 0, 'forteresse');
    let r = act(s, { type: 'endTurn' });
    expect(hits(r.events, 'forteresse')).toHaveLength(0);
    s = ready(quiet());
    place(s, 'A', 'avant', 0, 'premiere_lame');
    place(s, 'B', 'avant', 0, 'forteresse');
    r = act(s, { type: 'endTurn' });
    expect(hits(r.events, 'premiere_lame')).toHaveLength(2);
  });

  it('Coup d’avance, Vif-argent et Maîtresse de l’initiative donnent Prime', () => {
    const s = ready(quiet());
    place(s, 'A', 'avant', 0, 'recrue_imp', { types: ['Elfe'], leader: 'maitresse_initiative', leaderOwner: 'A' });
    place(s, 'B', 'avant', 0, 'forteresse');
    const s2 = act(s, { type: 'play', handUid: give(s, 'A', 'coup_avance'), target: slot('A', 'avant', 0) }).state;
    // 10 ATK + Prime : 20 (Coup d'avance) + 5 (Maîtresse)
    expect(hits(act(s2, { type: 'endTurn' }).events, 'recrue_imp')[0]!.atk).toBe(35);
  });

  it('Vent de l’aurore : les régiments plus lents que la cible n’attaquent pas', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'premiere_lame');
    place(s, 'A', 'avant', 1, 'recrue_imp');
    place(s, 'B', 'avant', 0, 'forteresse');
    place(s, 'B', 'avant', 1, 'forteresse');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'vent_aurore'), target: slot('A', 'avant', 0) }).state;
    const r = act(s, { type: 'endTurn' });
    expect(hits(r.events, 'forteresse')).toHaveLength(0);
    expect(hits(r.events, 'recrue_imp')).toHaveLength(0);
    expect(hits(r.events, 'premiere_lame').length).toBeGreaterThan(0);
  });

  it('Avantage décisif : 3 attaques avant l’adversaire font piocher 2 cartes', () => {
    let s = ready(quiet());
    for (let i = 0; i < 3; i++) { place(s, 'A', 'avant', i, 'lames_aube'); place(s, 'B', 'avant', i, 'forteresse'); }
    s = act(s, { type: 'play', handUid: give(s, 'A', 'avantage_decisif') }).state;
    const hand = s.players.A.hand.length;
    const r = act(s, { type: 'endTurn' });
    expect(r.events.some(e => e.type === 'effect' && e.key === 'avantageDecisifOk')).toBe(true);
    expect(r.state.players.A.hand.length).toBe(hand + 2);
  });
});

describe('Vague 3 — Démons', () => {
  it('Seigneur des holocaustes : passe sur le Démon invoqué et grandit', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'diablotins', { leader: 'seigneur_holocaustes', leaderOwner: 'A' });
    s = act(s, { type: 'play', handUid: give(s, 'A', 'basilic_demoniaque'), target: slot('A', 'avant', 0) }).state;
    const u = s.players.A.board.avant[0]!;
    expect(u.cardId).toBe('basilic_demoniaque');
    expect(u.leader).toBe('seigneur_holocaustes');
    expect(u.leaderStacks).toBe(1);
    expect(s.players.A.discard).not.toContain('seigneur_holocaustes');
  });

  it('Héritier de l’Abîme : remplace un Leader ; l’adversaire perd du Moral selon son niveau', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'cultiste', { leader: 'seigneur_tourments', leaderOwner: 'A' });
    const e = place(s, 'B', 'avant', 0, 'forteresse');
    const before = e.currentMor;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'heritier_abime'), target: slot('A', 'avant', 0) }).state;
    expect(s.players.A.board.avant[0]!.leader).toBe('heritier_abime');
    expect(s.players.A.discard).toContain('seigneur_tourments');
    expect(s.players.B.board.avant[0]!.currentMor).toBe(before - 4);
  });

  it('Sacrifice : Collecteur, Autel et Capacocha réagissent ; Vaisseau de chair rapporte', () => {
    let s = ready(quiet(), 20);
    place(s, 'A', 'arriere', 0, 'collecteur_ames');
    place(s, 'A', 'arriere', 1, 'capacocha');
    s.players.A.board.isole = new Ctx(s).makeUnit('autel_ames', 'A');
    place(s, 'A', 'avant', 0, 'vaisseau_chair', { bornTurn: s.turn - 2 });
    place(s, 'A', 'avant', 1, 'diablotins', { currentMor: 2 });
    const res = s.players.A.resource, lassB = s.players.B.points;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'basilic_demoniaque'), target: slot('A', 'avant', 0) }).state;
    expect(s.players.A.board.arriere[0]!.baseAtk).toBe(8 + 5);
    expect(s.players.B.points).toBe(lassB + 1);
    expect(s.players.A.resource).toBe(res - 3 + 2 + 2); // coût 3, +2 Vaisseau, +2 Autel
    expect(s.players.A.board.avant[1]!.currentMor).toBe(2 - 1 + 2); // −1 (mort d'un allié), +2 (2 tours passés en jeu)
  });

  it('Pacte de succession : défausse le Leader ; Offrande 2 = pioche 2 et +2 ressources', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'cultiste', { leader: 'seigneur_tourments', leaderOwner: 'A' });
    s = act(s, { type: 'play', handUid: give(s, 'A', 'pacte_succession'), target: slot('A', 'avant', 0) }).state;
    const hand = s.players.A.hand.length, res = s.players.A.resource;
    s = choose(s, o => o.value === 2);
    expect(s.players.A.board.avant[0]!.leader).toBeNull();
    expect(s.players.A.hand.length).toBe(hand + 2);
    expect(s.players.A.resource).toBe(res + 2);
  });
});

describe('Vague 3 — Empire', () => {
  it('Officier de relève : passe sur un voisin Empire sans Leader', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'recrue_imp', { leader: 'officier_releve', leaderOwner: 'A', currentEnd: 1 });
    place(s, 'A', 'avant', 1, 'soldat_kragz');
    place(s, 'B', 'avant', 0, 'forteresse');
    s = act(s, { type: 'endTurn' }).state;
    expect(s.players.A.board.avant[0]).toBeNull();
    expect(s.players.A.board.avant[1]!.leader).toBe('officier_releve');
  });

  it('Maximilien : le Leader d’un porteur détruit revient en main', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'recrue_imp', { leader: 'capitaine_garde', leaderOwner: 'A', currentEnd: 1 });
    place(s, 'A', 'avant', 3, 'maximilien');
    place(s, 'B', 'avant', 0, 'forteresse');
    s = act(s, { type: 'endTurn' }).state;
    expect(s.players.A.hand.some(h => h.cardId === 'capitaine_garde')).toBe(true);
  });

  it('Ordre de relève et Rite de passation déplacent un Leader', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'recrue_imp', { leader: 'capitaine_garde', leaderOwner: 'A' });
    place(s, 'A', 'avant', 2, 'soldat_kragz', { currentEnd: 20 });
    s = act(s, { type: 'play', handUid: give(s, 'A', 'ordre_releve'), target: slot('A', 'avant', 0), target2: slot('A', 'avant', 2) }).state;
    expect(s.players.A.board.avant[0]!.leader).toBeNull();
    expect(s.players.A.board.avant[2]!.leader).toBe('capitaine_garde');
    expect(s.players.A.board.avant[2]!.currentEnd).toBe(30);
  });

  it('École d’officiers : pioche le prochain Leader, 1 de moins', () => {
    let s = ready(quiet());
    s.players.A.deck = ['recrue_imp', 'recrue_imp', 'connetable', 'recrue_imp'];
    s = act(s, { type: 'play', handUid: give(s, 'A', 'ecole_officiers') }).state;
    const h = s.players.A.hand.find(x => x.cardId === 'connetable')!;
    expect(cardCost(new Ctx(s), 'A', h)).toBe(1);
  });
});

describe('Vague 3 — Nomades et bi-factions', () => {
  it('Chapardeuse : la carte révélée coûte son niveau de plus ; Interrogatoire taxe toutes les copies', () => {
    let s = ready(quiet());
    s.players.B.hand = [];
    give(s, 'B', 'forteresse');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'chapardeuse'), target: slot('A', 'avant', 0) }).state;
    const ctx = new Ctx(s);
    const h = s.players.B.hand[0]!;
    expect(cardCost(ctx, 'B', h)).toBe(7 + 5);
    s = ready(quiet());
    for (let i = 0; i < 4; i++) give(s, 'B', 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'interrogatoire') }).state;
    s = choose(s, () => true);
    expect(s.players.B.costTax?.recrue_imp).toBe(2);
    s.players.B.hand.push({ uid: 9999, cardId: 'recrue_imp' });
    expect(cardCost(new Ctx(s), 'B', s.players.B.hand.at(-1)!)).toBe(3);
  });

  it('Rançonnement : perdre 2 ressources au prochain tour', () => {
    let s = ready(quiet());
    give(s, 'B', 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'ranconnement') }).state;
    s = choose(s, o => o.value === -1);
    expect(s.players.B.resourcePenalty).toBe(2);
    const lvl = s.players.B.level;
    s.players.B.resource = 0;
    s = act(s, { type: 'endTurn' }).state;
    expect(s.players.B.resource).toBe(lvl - 2);
  });

  it('Basilics rôdeurs grandissent à chaque défausse adverse ; Cheikh des ossements compte la défausse adverse', () => {
    let s = ready(quiet());
    const b = place(s, 'A', 'avant', 0, 'basilics_rodeur', { leader: 'cheikh_ossements', leaderOwner: 'A' });
    s.players.B.discard = Array(25).fill('recrue_imp');
    const ctx = new Ctx(s);
    const atk0 = ctx.effectiveAtk(b);
    expect(ctx.effectiveArm(b)).toBe(5 + 20);
    give(s, 'B', 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'frappez_ravitaillement') }).state;
    while (s.pending.length) s = act(s, { type: 'choose', option: 0 }).state;
    expect(new Ctx(s).effectiveAtk(s.players.A.board.avant[0]!)).toBe(atk0 + 5);
  });

  it('Dresseuse de basilics : place un Basilic de niveau ≤ sur le dessus de la pioche', () => {
    let s = ready(quiet());
    s.players.B.discard = ['forteresse'];
    s.players.A.deck = ['recrue_imp', 'basilics_oasis', 'reine_basilics', 'recrue_imp'];
    s = act(s, { type: 'play', handUid: give(s, 'A', 'dresseuse_basilics'), target: slot('A', 'arriere', 0) }).state;
    s = choose(s, o => o.cardId === 'forteresse');
    expect(s.players.A.deck[0]).toBe('reine_basilics');
    expect(s.players.B.discard).not.toContain('forteresse');
  });

  it('Mirage des morts : copie gratuite d’une Tactique Nomade de la défausse', () => {
    let s = ready(quiet());
    s.players.A.discard = ['tempete_sable', 'charge_imp'];
    s = act(s, { type: 'play', handUid: give(s, 'A', 'mirage_morts') }).state;
    expect(s.pending[0]!.options).toHaveLength(1);
    s = choose(s, () => true);
    const h = s.players.A.hand.find(x => x.cardId === 'tempete_sable')!;
    expect(h.freeCopy).toBe(true);
    expect(s.players.A.discard).not.toContain('tempete_sable');
  });

  it('Coursiers du mirage : Prime fait défausser ; Percepteur impérial fait défausser 2 cartes', () => {
    let s = ready(quiet());
    place(s, 'A', 'avant', 0, 'coursiers_mirage');
    place(s, 'B', 'avant', 0, 'forteresse');
    give(s, 'B', 'recrue_imp');
    let r = act(s, { type: 'endTurn' });
    expect(r.events.some(e => e.type === 'discarded' && e.source === 'coursiers_mirage')).toBe(true);
    s = ready(quiet());
    place(s, 'A', 'avant', 1, 'recrue_imp', { leader: 'capitaine_garde', leaderOwner: 'A' });
    for (let i = 0; i < 3; i++) give(s, 'B', 'recrue_imp');
    r = act(s, { type: 'play', handUid: give(s, 'A', 'percepteur_imperial'), target: slot('A', 'avant', 0) });
    expect(r.state.players.B.hand).toHaveLength(1);
  });

  it('Bourse de guerre : +3 maintenant, −1 au prochain tour', () => {
    let s = ready(quiet(), 0);
    s.players.A.resource = 1;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'bourse_guerre') }).state;
    expect(s.players.A.resource).toBe(3);
    expect(s.players.A.resourcePenalty).toBe(1);
  });
});
