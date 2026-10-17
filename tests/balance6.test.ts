// Équilibrage 6 (Nomades) : les nouveaux plafonds d'usure.
import { describe, expect, it } from 'vitest';
import { Ctx } from '../src/engine/ctx';
import { act, blankGame, give, place } from './helpers';

describe('Équilibrage 6 : Nomades', () => {
  it('Voleurs de provisions : plusieurs Voleurs ne se cumulent pas', () => {
    const s = blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
    place(s, 'A', 'avant', 0, 'voleurs_provisions');
    place(s, 'A', 'avant', 1, 'voleurs_provisions');
    place(s, 'A', 'avant', 2, 'voleurs_provisions');
    const victim = place(s, 'A', 'avant', 3, 'recrue_imp');
    const before = s.players.B.deck.length;
    new Ctx(s).destroy(victim, 'end');
    expect(s.players.B.deck.length).toBe(before - 1);
  });
  it('Fuite dans les dunes : 2 cartes défaussées au plus', () => {
    let s = blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
    s.players.A.level = 5; s.players.A.resource = 9;
    place(s, 'A', 'arriere', 0, 'zahra');
    const before = s.players.B.deck.length;
    s = act(s, { type: 'play', handUid: give(s, 'A', 'fuite_dunes'), target: { player: 'A', zone: 'arriere', idx: 0 } }).state;
    expect(s.players.B.deck.length).toBe(before - 2);
    expect(s.players.A.hand.some(h => h.cardId === 'zahra')).toBe(true);
  });
});

describe('Moral brisé : les mots-clés négatifs restent', () => {
  it('Un régiment Lent au Moral brisé reste Lent (il n’attaque pas au combat du tour adverse)', () => {
    let s = blankGame({ moralCheck: false, noRegimentDefeatFromTurn: { A: 999, B: 999 } });
    place(s, 'B', 'avant', 0, 'recrue_imp', { keywords: ['Lent'], brokenMorale: true, currentMor: 1 });
    place(s, 'A', 'avant', 0, 'forteresse');
    const r = act(s, { type: 'endTurn' }); // combat de fin du tour de A : B est Lent, il n'attaque pas
    expect(r.events.some(e => e.type === 'attack' && e.attackerCard === 'recrue_imp')).toBe(false);
    s = r.state;
  });
});
