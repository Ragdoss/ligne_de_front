// Première vague de la première édition : chaque mécanique, puis des parties aléatoires avec ces cartes.
import { describe, expect, it } from 'vitest';
import { chooseActionV1 } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { WAVE1_IDS } from '../src/data/wave1';
import { CARD_TEXT_FR } from '../src/i18n/cards.fr';
import { Ctx, keywordValue } from '../src/engine/ctx';
import { applyAction, createGame, legalActions, whyUnplayable } from '../src/engine/game';
import { nextRandom } from '../src/engine/rng';
import { COLLECTIBLE } from '../src/profile/profile';
import { act, blankGame, give, place } from './helpers';

const slot = (player: 'A' | 'B', zone: 'avant' | 'arriere' | 'isole', idx: number) => ({ player, zone, idx });
const choose = (s: ReturnType<typeof blankGame>, i: number) => act(s, { type: 'choose', option: i }).state;
const endTurn = (s: ReturnType<typeof blankGame>) => act(s, { type: 'endTurn' }).state;

describe('Vague 1 : données', () => {
  it('50 cartes, toutes nommées, collectionnables', () => {
    expect(WAVE1_IDS).toHaveLength(50);
    for (const id of WAVE1_IDS) {
      expect(CARD_TEXT_FR[id]?.name, id).toBeTruthy();
      expect(COLLECTIBLE).toContain(id);
    }
  });
});

describe('Vague 1 : Empire', () => {
  it('Ralliement : voisins gauche-droite et devant-derrière', () => {
    let s = blankGame(); s.players.A.resource = 5;
    const left = place(s, 'A', 'arriere', 0, 'recrue_imp', { currentMor: 1 });
    const front = place(s, 'A', 'avant', 1, 'recrue_imp', { currentMor: 1 });
    const far = place(s, 'A', 'avant', 3, 'recrue_imp', { currentMor: 1 });
    const uid = give(s, 'A', 'tambour_bataillon');
    s = act(s, { type: 'play', handUid: uid, target: slot('A', 'arriere', 1) }).state;
    const b = s.players.A.board;
    expect(b.arriere[0]!.currentMor).toBe(left.currentMor + 1);
    expect(b.avant[1]!.currentMor).toBe(front.currentMor + 1);
    expect(b.avant[3]!.currentMor).toBe(far.currentMor);
  });
  it('Formation : Hallebardiers (+5 ARM par voisin Empire), Gardes du drapeau (+5 ATK), Colonel (+5 ARM)', () => {
    const s = blankGame();
    const hal = place(s, 'A', 'avant', 1, 'hallebardiers_ligne');
    const ctx = new Ctx(s);
    const base = ctx.effectiveArm(hal);
    place(s, 'A', 'avant', 0, 'recrue_imp');
    place(s, 'A', 'avant', 2, 'gardes_drapeau', { leader: 'colonel_ligne', leaderOwner: 'A' });
    expect(ctx.effectiveArm(hal)).toBe(base + 10 + 5);
    const r = s.players.A.board.avant[0]!;
    const atk0 = ctx.effectiveAtk(r);
    s.players.A.board.avant[1] = null;
    place(s, 'A', 'avant', 1, 'gardes_drapeau');
    expect(ctx.effectiveAtk(r)).toBe(atk0 + 5);
  });
  it('Grand Maître d’armes : deux frappes, la seconde à moitié', () => {
    let s = blankGame({ moralCheck: false });
    place(s, 'A', 'avant', 0, 'recrue_imp', { leader: 'grand_maitre_armes', leaderOwner: 'A' });
    place(s, 'B', 'avant', 0, 'forteresse');
    const r = act(s, { type: 'endTurn' });
    const hits = r.events.filter(e => e.type === 'attack' && e.attackerCard === 'recrue_imp');
    expect(hits).toHaveLength(2);
    expect((hits[1] as { atk: number }).atk).toBe(Math.round((hits[0] as { atk: number }).atk / 2));
    s = r.state;
  });
  it('Appel aux armes : une Recrue prête par case avant vide, +3 Moral', () => {
    let s = blankGame(); s.players.A.level = 4; s.players.A.resource = 10;
    place(s, 'A', 'avant', 0, 'recrue_imp', { currentMor: 1 });
    const uid = give(s, 'A', 'appel_aux_armes');
    s = act(s, { type: 'play', handUid: uid }).state;
    expect(s.players.A.board.avant.every(Boolean)).toBe(true);
    expect(s.players.A.board.avant[1]!.arrivesReady).toBe(true);
    expect(s.players.A.board.avant[0]!.currentMor).toBe(4);
  });
  it('Le Commandant : Leaders 1 de moins ; Unique', () => {
    const s = blankGame(); s.players.A.level = 5; s.players.A.resource = 1;
    place(s, 'A', 'avant', 0, 'commandant_kragz');
    place(s, 'A', 'avant', 1, 'recrue_imp');
    const uid = give(s, 'A', 'capitaine_garde'); // coût 1 → 0
    s.players.A.resource = 0;
    expect(whyUnplayable(s, uid)).toBeNull();
    const again = give(s, 'A', 'commandant_kragz');
    s.players.A.resource = 10;
    expect(whyUnplayable(s, again)).toBe('unique');
  });
});

describe('Vague 1 : Elfes', () => {
  it('Croissance : Pousse de Sylve (5 fois au plus), Gardien d’écorce (+30 ARM au plus)', () => {
    let s = blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
    place(s, 'A', 'arriere', 0, 'pousse_sylve');
    place(s, 'A', 'arriere', 1, 'gardien_ecorce');
    for (let i = 0; i < 16; i++) s = endTurn(s);
    const p = s.players.A.board.arriere[0]!, g = s.players.A.board.arriere[1]!;
    expect(p.baseAtk).toBe(5 + 2 * 5);
    expect(p.maxEnd).toBe(25 + 5 * 5);
    expect(g.baseArm).toBe(30);
  });
  it('Tactiques : Lettrée (−1), Danseuses (+5 ATK), Chœur (pioche toutes les 3), Chant de la sève (2e tactique : +10 ATK)', () => {
    let s = blankGame(); s.players.A.resource = 10;
    place(s, 'A', 'arriere', 0, 'lettree_conclave');
    const dan = place(s, 'A', 'avant', 0, 'danseuses_lames');
    place(s, 'A', 'arriere', 1, 'choeur_saisons');
    const ids = [give(s, 'A', 'chant_seve'), give(s, 'A', 'chant_seve'), give(s, 'A', 'ravitaillement')];
    const before = s.players.A.hand.length;
    s = act(s, { type: 'play', handUid: ids[0]!, target: slot('A', 'avant', 0) }).state;
    expect(s.players.A.board.avant[0]!.tempAtk).toBe(5);
    s = act(s, { type: 'play', handUid: ids[1]!, target: slot('A', 'avant', 0) }).state;
    expect(s.players.A.board.avant[0]!.tempAtk).toBe(5 + 10 + 5);
    const res = s.players.A.resource;
    s = act(s, { type: 'play', handUid: ids[2]!, target: undefined }).state; // Ravitaillement : coût 1 − 1 = 0
    expect(s.players.A.resource).toBe(res);
    expect(s.players.A.hand.length).toBe(before - 3 + 2 + 1); // 2 pioches de Ravitaillement + 1 du Chœur
    void dan;
  });
  it('Lyra : 10 dégâts au régiment adverse à l’END la plus basse à chaque Tactique', () => {
    let s = blankGame(); s.players.A.resource = 5;
    place(s, 'A', 'arriere', 0, 'lyra');
    place(s, 'B', 'avant', 0, 'recrue_imp');
    const weak = place(s, 'B', 'avant', 1, 'recrue_imp', { currentEnd: 8 });
    const uid = give(s, 'A', 'brise_matin');
    s = act(s, { type: 'play', handUid: uid }).state;
    expect(new Ctx(s).findUnit(weak.uid)).toBeNull();
  });
  it('Communion : Prêtresse (+10 ATK) et Sentinelle (provoque les Distance)', () => {
    const s = blankGame();
    const elf = place(s, 'A', 'avant', 0, 'eclaireur_elfe', { leader: 'pretresse_saisons', leaderOwner: 'A' });
    const ctx = new Ctx(s);
    const a0 = ctx.effectiveAtk(elf);
    place(s, 'A', 'avant', 1, 'elem_terre');
    expect(ctx.effectiveAtk(elf)).toBe(a0 + 10);
    place(s, 'A', 'avant', 3, 'sentinelle_chene');
    const archer = place(s, 'B', 'arriere', 0, 'archer_imp');
    s.players.A.board.avant[0]!.currentMor = 1;
    const r = act(s, { type: 'endTurn' });
    const shot = r.events.find(e => e.type === 'attack' && e.attacker === archer.uid) as { targetCard: string } | undefined;
    expect(shot?.targetCard).toBe('sentinelle_chene');
  });
});

describe('Vague 1 : Démons', () => {
  it('Offrande : Pacte mineur pioche 1, ou 3 en payant 3 lassitude', () => {
    let s = blankGame(); s.players.A.resource = 5;
    const uid = give(s, 'A', 'pacte_mineur');
    s = act(s, { type: 'play', handUid: uid }).state;
    expect(s.pending[0]?.kind).toBe('offrande');
    const n = s.players.A.hand.length, lass = s.players.A.points;
    s = choose(s, 1);
    expect(s.players.A.hand.length).toBe(n + 3);
    expect(s.players.A.points).toBe(lass + 3);
  });
  it('Appât : prise de contrôle jusqu’à la fin du tour, puis retour', () => {
    let s = blankGame({ moralCheck: false }); s.players.A.level = 2; s.players.A.resource = 5;
    const r = place(s, 'B', 'avant', 2, 'recrue_imp');
    place(s, 'B', 'avant', 0, 'recrue_imp');
    const uid = give(s, 'A', 'appat_invocateur');
    s = act(s, { type: 'play', handUid: uid, target: slot('B', 'avant', 2) }).state;
    expect(s.pending[0]?.kind).toBe('placeControlled');
    const pick = s.pending[0]!.options!.findIndex(o => o.slot?.zone === 'arriere' && o.slot.idx === 1);
    s = choose(s, pick); // le joueur qui prend le contrôle choisit la case
    expect(new Ctx(s).slotOf(r.uid)).toEqual({ player: 'A', zone: 'arriere', idx: 1 });
    s = endTurn(s);
    const back = new Ctx(s).findUnit(r.uid);
    if (back) expect(back.controller).toBe('B');
  });
  it('Appât + sacrifice : le régiment volé nourrit un Démon, sa carte va dans la défausse adverse', () => {
    let s = blankGame(); s.players.A.level = 3; s.players.A.resource = 10;
    place(s, 'B', 'avant', 0, 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'appat_invocateur'), target: slot('B', 'avant', 0) }).state;
    s = choose(s, 0);
    const at = new Ctx(s).slotOf(s.players.A.board.avant.find(Boolean)!.uid)!;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'chien_infernal'), target: at }).state;
    expect(s.players.B.discard).toContain('recrue_imp');
    expect(s.players.A.board.avant[at.idx]!.cardId).toBe('chien_infernal');
  });
  it('Murmure de l’Abîme avec Offrande : le régiment reste, Moral plein', () => {
    let s = blankGame(); s.players.A.level = 3; s.players.A.resource = 5;
    const t = place(s, 'B', 'avant', 0, 'soldat_kragz', { currentMor: 1, brokenMorale: true });
    s = act(s, { type: 'play', handUid: give(s, 'A', 'murmure_abime'), target: slot('B', 'avant', 0) }).state;
    s = choose(s, 1); // payer l'Offrande
    s = choose(s, 0); // case choisie
    const u = new Ctx(s).findUnit(t.uid)!;
    expect(u.controller).toBe('A');
    expect(u.borrowed ?? null).toBeNull();
    expect(u.currentMor).toBe(u.maxMor);
  });
  it('Prise de contrôle sans case libre : le régiment part dans la défausse de son propriétaire', () => {
    let s = blankGame(); s.players.A.level = 2; s.players.A.resource = 5;
    for (let i = 0; i < 4; i++) place(s, 'A', 'avant', i, 'recrue_imp');
    for (let i = 0; i < 3; i++) place(s, 'A', 'arriere', i, 'archer_imp');
    const t = place(s, 'B', 'avant', 0, 'lancier_emp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'appat_invocateur'), target: slot('B', 'avant', 0) }).state;
    expect(new Ctx(s).findUnit(t.uid)).toBeNull();
    expect(s.players.B.discard).toContain('lancier_emp');
  });
  it('Augure de l’Abîme : chaque carte au-dessus ou en dessous', () => {
    let s = blankGame(); s.players.A.resource = 5;
    s.players.A.deck = ['archer_imp', 'lancier_emp', 'chevalier_prov', ...s.players.A.deck];
    s = act(s, { type: 'play', handUid: give(s, 'A', 'augure_abime') }).state;
    s = choose(s, 1); // archer en dessous
    s = choose(s, 2); // chevalier (2e restant) au-dessus
    s = choose(s, 0); // lancier au-dessus
    expect(s.players.A.deck.slice(0, 2)).toEqual(['chevalier_prov', 'lancier_emp']);
    expect(s.players.A.deck.at(-1)).toBe('archer_imp');
  });
  it('Légion de Morvak : stats, mots-clés et effet d’arrivée du sacrifié', () => {
    let s = blankGame(); s.players.A.level = 4; s.players.A.resource = 5;
    place(s, 'A', 'arriere', 0, 'tambour_bataillon');
    place(s, 'A', 'avant', 0, 'recrue_imp', { currentMor: 3 });
    s = act(s, { type: 'play', handUid: give(s, 'A', 'legion_morvak'), target: slot('A', 'arriere', 0) }).state;
    const l = s.players.A.board.arriere[0]!;
    expect(l.cardId).toBe('legion_morvak');
    expect(l.maxEnd).toBe(10 + 25);
    expect(keywordValue(l, 'Ralliement')).toBe(1);
    expect(s.players.A.board.avant[0]!.currentMor).toBe(3); // −1 (sacrifice d'un allié) +1 (Ralliement rejoué)
  });
  it('Gargouille sentinelle : attaquer un allié adjacent coûte 1 Moral', () => {
    const s = blankGame({ moralCheck: false });
    place(s, 'A', 'avant', 0, 'recrue_imp');
    place(s, 'A', 'arriere', 0, 'gargouille_sentinelle');
    const att = place(s, 'B', 'avant', 0, 'soldat_kragz');
    const r = act(s, { type: 'endTurn' });
    const after = new Ctx(r.state).findUnit(att.uid)!;
    expect(after.currentMor).toBeLessThan(att.currentMor - 1); // −1 (attaqué) −1 (Gargouille)
  });
});

describe('Vague 1 : Nomades', () => {
  it('Mirage : la première attaque frappe le vide', () => {
    const s = blankGame({ moralCheck: false });
    const d = place(s, 'A', 'avant', 0, 'danseurs_sable');
    place(s, 'B', 'avant', 0, 'soldat_kragz');
    const r = act(s, { type: 'endTurn' });
    const u = new Ctx(r.state).findUnit(d.uid)!;
    expect(u.currentEnd).toBe(d.currentEnd);
    expect(keywordValue(u, 'Mirage')).toBe(0);
  });
  it('Pillage : un ennemi détruit fait défausser le dessus de la pioche adverse', () => {
    const s = blankGame({ moralCheck: false });
    place(s, 'A', 'avant', 0, 'razzieurs_dunes');
    place(s, 'B', 'avant', 0, 'recrue_imp', { currentEnd: 1 });
    const n = s.players.B.deck.length;
    const r = act(s, { type: 'endTurn' });
    expect(r.state.players.B.deck.length).toBeLessThanOrEqual(n - 2);
  });
  it('Usure : Voleurs, Terre brûlée, Fuite dans les dunes, Zahra, Puits', () => {
    let s = blankGame({ moralCheck: false }); s.players.A.level = 3; s.players.A.resource = 10;
    s.players.A.discard = ['recrue_imp', 'recrue_imp', 'ravitaillement'];
    const deckB = s.players.B.deck.length;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'terre_brulee') }).state;
    expect(s.players.B.deck.length).toBe(deckB - 2);
    expect(s.players.A.discard.filter(id => CARDS[id]!.cardType === 'Regiment')).toHaveLength(0);
    place(s, 'A', 'avant', 0, 'jeune_nomade');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'fuite_dunes'), target: slot('A', 'avant', 0) }).state;
    expect(s.players.A.hand.some(h => h.cardId === 'jeune_nomade')).toBe(true);
    expect(s.players.B.deck.length).toBe(deckB - 3);
    place(s, 'A', 'isole', 0, 'puits_empoisonne');
    const before = s.players.B.deck.length;
    s = endTurn(s); // début du tour de B : −2 pioche (+ pioche normale) et une défausse de main
    expect(s.pending[0]?.kind).toBe('handDiscard');
    expect(s.players.B.deck.length).toBe(before - 2 - 1);
  });
  it('Marché : défausser une carte pour en piocher une', () => {
    let s = blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
    place(s, 'B', 'arriere', 0, 'colporteur');
    s = endTurn(s);
    expect(s.pending[0]?.kind).toBe('marche');
    const n = s.players.B.hand.length;
    s = choose(s, 1);
    expect(s.players.B.hand.length).toBe(n);
    expect(s.players.B.discard.length).toBe(1);
  });
});

describe('Vague 1 : cross-faction et neutres', () => {
  it('Leaders bicolores : Inquisiteur sur un Démon, Moral plancher 2', () => {
    let s = blankGame(); s.players.A.level = 3; s.players.A.resource = 5;
    place(s, 'A', 'avant', 0, 'chien_infernal');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'inquisiteur_dechu'), target: slot('A', 'avant', 0) }).state;
    const u = s.players.A.board.avant[0]!;
    expect(keywordValue(u, 'Effrayant')).toBe(2);
    new Ctx(s).loseMoral(u, 99);
    expect(u.currentMor).toBe(2);
  });
  it('Dryade corrompue : les soins deviennent une baisse de lassitude (reliquat conservé)', () => {
    let s = blankGame(); s.players.A.resource = 5; s.players.A.points = 10;
    place(s, 'A', 'arriere', 0, 'dryade_corrompue');
    place(s, 'A', 'avant', 0, 'recrue_imp', { currentEnd: 5 });
    s = act(s, { type: 'play', handUid: give(s, 'A', 'soin_simple', { generated: true }), target: slot('A', 'avant', 0) }).state;
    expect(s.players.A.board.avant[0]!.currentEnd).toBe(5);
    expect(s.players.A.points).toBe(10);
    s = act(s, { type: 'play', handUid: give(s, 'A', 'soin_simple', { generated: true }), target: slot('A', 'avant', 0) }).state;
    expect(s.players.A.points).toBe(9);
  });
  it('Ravitailleur : pioche à l’arrivée et quand il est défaussé', () => {
    let s = blankGame(); s.players.A.resource = 5;
    const n = s.players.A.hand.length;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'ravitailleur'), target: slot('A', 'arriere', 0) }).state;
    expect(s.players.A.hand.length).toBe(n + 1);
    s.players.A.deck.unshift('ravitailleur');
    const ctx = new Ctx(s);
    const before = s.players.A.hand.length;
    ctx.mill('A', 1, 'test');
    expect(s.players.A.hand.length).toBe(before + 1);
  });
});

describe('Vague 1 : parties aléatoires', () => {
  it('120 parties avec des decks aléatoires mêlant la vague 1 vont au bout (IA et coups au hasard)', () => {
    let rng = 777;
    const rand = (n: number) => { const r = nextRandom(rng); rng = r.state; return Math.floor(r.value * n); };
    const low = COLLECTIBLE.filter(id => CARDS[id]!.niveau <= 3), high = COLLECTIBLE.filter(id => CARDS[id]!.niveau >= 4);
    const deck = () => {
      const d = ['recrue_imp', 'recrue_imp', 'recrue_imp'];
      for (let i = 0; i < 27; i++) d.push(i % 2 ? WAVE1_IDS.filter(id => CARDS[id]!.niveau <= 3)[rand(35)] ?? low[rand(low.length)]! : low[rand(low.length)]!);
      for (let i = 0; i < 15; i++) d.push(i % 2 ? WAVE1_IDS.filter(id => CARDS[id]!.niveau >= 4)[rand(12)] ?? high[rand(high.length)]! : high[rand(high.length)]!);
      return d;
    };
    for (let g = 0; g < 120; g++) {
      let s = createGame({ seed: `w1-${g}`, A: { faction: 'empire', deck: deck() }, B: { faction: 'demons', deck: deck() } });
      for (let step = 0; step < 2500 && !s.over; step++) {
        const acts = legalActions(s);
        const a = g % 3 === 0 ? chooseActionV1(s) : acts[rand(acts.length)]!;
        const r = applyAction(s, a);
        if (!r.ok) throw new Error(`${r.error} ${JSON.stringify(a)}`);
        s = r.state;
        const ctx = new Ctx(s);
        for (const p of ['A', 'B'] as const) for (const u of ctx.units(p)) {
          expect(u.controller).toBe(p);
          expect(u.currentEnd).toBeGreaterThan(0);
          expect(u.currentMor).toBeGreaterThan(0);
        }
      }
    }
  }, 240000);
});
