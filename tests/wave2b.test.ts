// Vague 2, suite : chaque mécanique nouvelle, puis des parties aléatoires avec ces cartes.
import { describe, expect, it } from 'vitest';
import { chooseActionV1 } from '../src/ai/heuristic';
import { CARDS } from '../src/data/cards';
import { WAVE2B_IDS } from '../src/data/wave2b';
import { Ctx } from '../src/engine/ctx';
import { applyAction, createGame, legalActions } from '../src/engine/game';
import { nextRandom } from '../src/engine/rng';
import type { GameEvent, GameState } from '../src/engine/types';
import { CARD_TEXT_FR } from '../src/i18n/cards.fr';
import { COLLECTIBLE } from '../src/profile/profile';
import { act, blankGame, give, place } from './helpers';

const slot = (player: 'A' | 'B', zone: 'avant' | 'arriere' | 'isole', idx: number) => ({ player, zone, idx });
const quiet = () => blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
const choose = (s: GameState, i: number) => act(s, { type: 'choose', option: i }).state;
type Hit = Extract<GameEvent, { type: 'attack' }>;
const hitsBy = (ev: GameEvent[], cardId: string) => ev.filter((e): e is Hit => e.type === 'attack' && e.attackerCard === cardId);

describe('Vague 2 suite : données', () => {
  it('38 cartes, nommées, collectionnables', () => {
    expect(WAVE2B_IDS).toHaveLength(38);
    for (const id of WAVE2B_IDS) {
      expect(CARD_TEXT_FR[id]?.name, id).toBeTruthy();
      expect(COLLECTIBLE).toContain(id);
    }
  });
});

describe('Vague 2 suite : Empire', () => {
  it('Écuyers (+5 ATK avec un Monté voisin), Lanciers (+10 ARM avec deux voisins), Connétable (+5 ATK aux voisins du porteur)', () => {
    const s = quiet();
    const ec = place(s, 'A', 'avant', 1, 'ecuyers_garde');
    const ctx = new Ctx(s);
    const a0 = ctx.effectiveAtk(ec);
    place(s, 'A', 'avant', 0, 'chevaliers_ordre', { leader: 'connetable', leaderOwner: 'A' });
    expect(ctx.effectiveAtk(ec)).toBe(a0 + 5 + 5);
    const lan = place(s, 'A', 'avant', 2, 'lanciers_rempart');
    const arm1 = ctx.effectiveArm(lan);
    place(s, 'A', 'avant', 3, 'recrue_imp');
    expect(ctx.effectiveArm(lan)).toBe(arm1 + 10);
  });
  it('L’Impératrice Octavia : +5 ATK et +5 ARM aux porteurs de Leader', () => {
    const s = quiet();
    const u = place(s, 'A', 'avant', 0, 'recrue_imp', { leader: 'lieutenant', leaderOwner: 'A' });
    const ctx = new Ctx(s);
    const a = ctx.effectiveAtk(u), r = ctx.effectiveArm(u);
    place(s, 'A', 'arriere', 0, 'imperatrice_octavia');
    expect(ctx.effectiveAtk(u)).toBe(a + 5);
    expect(ctx.effectiveArm(u)).toBe(r + 5);
  });
  it('Dernier carré : +15 ARM à l’avant, pas de perte de Moral à la mort d’un allié', () => {
    let s = quiet(); s.players.A.level = 4; s.players.A.resource = 9;
    const f = place(s, 'A', 'avant', 0, 'recrue_imp');
    const victim = place(s, 'A', 'avant', 1, 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'dernier_carre') }).state;
    const ctx = new Ctx(s);
    expect(s.players.A.board.avant[0]!.squareArm).toBe(15);
    const mor = s.players.A.board.avant[0]!.currentMor;
    ctx.destroy(ctx.findUnit(victim.uid)!, 'end');
    expect(s.players.A.board.avant[0]!.currentMor).toBe(mor);
    void f;
  });
  it('Cuirassiers lourds : une seconde attaque après avoir détruit un régiment', () => {
    const s = quiet();
    place(s, 'A', 'avant', 1, 'cuirassiers_lourds');
    place(s, 'B', 'avant', 1, 'recrue_imp', { currentEnd: 1 });
    place(s, 'B', 'arriere', 1, 'recrue_imp');
    const r = act(s, { type: 'endTurn' });
    expect(hitsBy(r.events, 'cuirassiers_lourds')).toHaveLength(2);
  });
  it('Héraut impérial : les porteurs de Leader regagnent 1 Moral au début du tour', () => {
    let s = quiet();
    place(s, 'B', 'avant', 0, 'recrue_imp', { leader: 'heraut_imperial', leaderOwner: 'B', currentMor: 2 });
    place(s, 'B', 'avant', 1, 'recrue_imp', { leader: 'lieutenant', leaderOwner: 'B', currentMor: 2 });
    s = act(s, { type: 'endTurn' }).state; // début du tour de B
    expect(s.players.B.board.avant[1]!.currentMor).toBe(3);
  });
});

describe('Vague 2 suite : Démons', () => {
  it('Rituel du sang noir : sacrifie, pioche le niveau ; la Garde d’Asura fait piocher 1 de plus', () => {
    let s = quiet(); s.players.A.level = 4; s.players.A.resource = 9;
    place(s, 'A', 'arriere', 0, 'garde_asura');
    const n = s.players.A.hand.length;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'rituel_sang_noir'), target: slot('A', 'arriere', 0) }).state;
    expect(s.players.A.board.arriere[0]).toBeNull();
    expect(s.players.A.hand.length).toBe(n + 1 + 1);
  });
  it('Gardien des chaînes : les attaquants de ses voisins perdent 3 ATK par niveau sacrifié', () => {
    let s = quiet(); s.players.A.level = 3; s.players.A.resource = 9;
    place(s, 'A', 'arriere', 1, 'recrue_imp'); // niveau 1, sacrifié
    const nb = place(s, 'A', 'avant', 1, 'forteresse');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'gardien_chaines'), target: slot('A', 'arriere', 1) }).state;
    expect(new Ctx(s).findUnit(s.players.A.board.arriere[1]!.uid)!.chainsLoss).toBe(3);
    place(s, 'B', 'avant', 1, 'recrue_imp');
    const r = act(s, { type: 'endTurn' });
    const h = hitsBy(r.events, 'recrue_imp').find(x => x.target === nb.uid)!;
    expect(h.atk).toBe(new Ctx(s).effectiveAtk(s.players.B.board.avant[1]!) - 3);
  });
  it('Grimoire interdit : pioche 3, remet 2 cartes choisies sur la pioche', () => {
    let s = quiet(); s.players.A.level = 3; s.players.A.resource = 9;
    s.players.A.deck = ['lieutenant', 'paysans', 'archer_imp', 'recrue_imp', 'recrue_imp'];
    s = act(s, { type: 'play', handUid: give(s, 'A', 'grimoire_interdit') }).state;
    s = choose(s, 0); // sans Offrande
    expect(s.players.A.hand).toHaveLength(3);
    s = act(s, { type: 'choose', option: s.pending[0]!.options!.findIndex(o => o.cardId === 'archer_imp') }).state;
    s = act(s, { type: 'choose', option: s.pending[0]!.options!.findIndex(o => o.cardId === 'lieutenant') }).state;
    expect(s.players.A.deck.slice(0, 2)).toEqual(['archer_imp', 'lieutenant']);
    expect(s.players.A.hand.map(h => h.cardId)).toEqual(['paysans']);
  });
  it('Grimoire interdit avec Offrande : les 2 cartes remises sont mélangées dans la pioche', () => {
    let s = quiet(); s.players.A.level = 3; s.players.A.resource = 9;
    s.players.A.deck = ['lieutenant', 'paysans', 'archer_imp', ...Array(20).fill('recrue_imp')];
    const lass = s.players.A.points;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'grimoire_interdit') }).state;
    s = choose(s, 1);
    expect(s.players.A.points).toBe(lass + 1);
    s = choose(s, 0); s = choose(s, 0);
    expect(s.players.A.hand).toHaveLength(1);
    expect(s.players.A.deck).toHaveLength(22);
    expect(s.pending).toHaveLength(0);
  });
  it('Chaînes de l’Abîme avec Offrande : sonné aussi au combat du tour adverse', () => {
    let s = quiet(); s.players.A.level = 3; s.players.A.resource = 9;
    place(s, 'A', 'avant', 0, 'forteresse');
    place(s, 'B', 'avant', 0, 'recrue_imp');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'chaines_abime'), target: slot('B', 'avant', 0) }).state;
    s = choose(s, 1);
    let r = act(s, { type: 'endTurn' });
    expect(hitsBy(r.events, 'recrue_imp')).toHaveLength(0);
    r = act(r.state, { type: 'endTurn' }); // fin du tour de B : toujours sonné
    expect(hitsBy(r.events, 'recrue_imp')).toHaveLength(0);
  });
  it('Bourreau de l’Abîme : +10 ATK par autre régiment au Moral brisé', () => {
    const s = quiet();
    const b = place(s, 'A', 'avant', 0, 'bourreau_abime');
    const ctx = new Ctx(s);
    const a = ctx.effectiveAtk(b);
    place(s, 'A', 'avant', 1, 'recrue_imp', { brokenMorale: true, currentMor: 1 });
    place(s, 'B', 'avant', 1, 'recrue_imp', { brokenMorale: true, currentMor: 1 });
    expect(ctx.effectiveAtk(b)).toBe(a + 20);
  });
  it('Seigneur des tourments : chaque régiment détruit par le porteur donne 1 lassitude', () => {
    const s = quiet();
    place(s, 'A', 'avant', 0, 'forteresse', { leader: 'seigneur_tourments', leaderOwner: 'A' });
    place(s, 'B', 'avant', 0, 'recrue_imp', { currentEnd: 1 });
    const before = s.players.B.points;
    const r = act(s, { type: 'endTurn' });
    expect(r.state.players.B.points).toBe(before + 1 + 1); // niveau 1 + Seigneur
  });
  it('Archidémon des Origines : détruit le régiment adverse au Moral le plus haut (deux si sacrifice de niveau 5)', () => {
    let s = quiet(); s.players.A.level = 5; s.players.A.resource = 20;
    place(s, 'A', 'avant', 0, 'forteresse'); // niveau 5
    place(s, 'B', 'avant', 0, 'recrue_imp');
    place(s, 'B', 'avant', 1, 'gardienne_lumiere');
    place(s, 'B', 'avant', 2, 'sylvain');
    s = act(s, { type: 'play', handUid: give(s, 'A', 'archidemon_origines'), target: slot('A', 'avant', 0) }).state;
    expect(s.players.B.board.avant.filter(Boolean).map(u => u!.cardId)).toEqual(['recrue_imp']);
  });
});

describe('Vague 2 suite : Nomades et neutres', () => {
  it('Sentinelles de l’oasis : +5 ARM aux Nomades ; Milice de village : +5 ARM avec un Humain voisin', () => {
    const s = quiet();
    const n = place(s, 'A', 'avant', 0, 'chamelier');
    const ctx = new Ctx(s);
    const a = ctx.effectiveArm(n);
    place(s, 'A', 'isole', 0, 'sentinelles_oasis');
    expect(ctx.effectiveArm(n)).toBe(a + 5);
    const m = place(s, 'A', 'avant', 2, 'milice_village');
    const m0 = ctx.effectiveArm(m);
    place(s, 'A', 'avant', 3, 'recrue_imp');
    expect(ctx.effectiveArm(m)).toBe(m0 + 5);
  });
  it('Al-Mansur : un Marché de plus ; Maître du bazar : +1 ressource au premier échange', () => {
    let s = quiet();
    place(s, 'B', 'avant', 0, 'chamelier', { leader: 'maitre_bazar', leaderOwner: 'B' });
    place(s, 'B', 'arriere', 0, 'al_mansur');
    s = act(s, { type: 'endTurn' }).state;
    expect(s.pending.filter(c => c.kind === 'marche')).toHaveLength(2);
    const res = s.players.B.resource;
    s = choose(s, 1);
    expect(s.players.B.resource).toBe(res + 1);
  });
  it('Caravanier armé : +1 ressource avec une Caravane Marchande', () => {
    let s = quiet();
    place(s, 'B', 'avant', 0, 'caravanier_arme');
    place(s, 'B', 'avant', 1, 'caravane_marchande');
    const left = s.players.B.resource;
    s = act(s, { type: 'endTurn' }).state;
    expect(s.players.B.resource).toBe(left + s.players.B.level + 1 + 1); // reliquat + niveau + Caravane + Caravanier
  });
});

describe('Vague 2 suite : parties aléatoires', () => {
  it('80 parties avec ces cartes vont au bout', () => {
    let rng = 909;
    const rand = (n: number) => { const r = nextRandom(rng); rng = r.state; return Math.floor(r.value * n); };
    const low = COLLECTIBLE.filter(id => CARDS[id]!.niveau <= 3), high = COLLECTIBLE.filter(id => CARDS[id]!.niveau >= 4);
    const nl = WAVE2B_IDS.filter(id => CARDS[id]!.niveau <= 3), nh = WAVE2B_IDS.filter(id => CARDS[id]!.niveau >= 4);
    const deck = () => {
      const d = ['recrue_imp', 'recrue_imp', 'recrue_imp', 'recrue_imp', 'recrue_imp'];
      for (let i = 0; i < 25; i++) d.push(i % 2 ? nl[rand(nl.length)]! : low[rand(low.length)]!);
      for (let i = 0; i < 15; i++) d.push(i % 2 ? nh[rand(nh.length)]! : high[rand(high.length)]!);
      return d;
    };
    const F = ['empire', 'demons', 'nomades', 'elfe'] as const;
    for (let g = 0; g < 80; g++) {
      let s = createGame({ seed: `w2b-${g}`, A: { faction: F[g % 4]!, deck: deck() }, B: { faction: F[(g + 1) % 4]!, deck: deck() } });
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
  }, 180000);
});

describe('Moral brisé et tactiques', () => {
  it('À couvert donne son armure même à un régiment au Moral brisé', () => {
    let s = quiet();
    const u = place(s, 'A', 'avant', 0, 'recrue_imp', { brokenMorale: true });
    s.players.A.resource = 9;
    const before = new Ctx(s).effectiveArm(u);
    s = act(s, { type: 'play', handUid: give(s, 'A', 'a_couvert'), target: slot('A', 'avant', 0) }).state;
    expect(new Ctx(s).effectiveArm(s.players.A.board.avant[0]!)).toBe(before + 20);
  });
});
