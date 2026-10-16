// Draft à 4 : paquets, choix des IA, decks et tournoi.
import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/data/cards';
import { autoFillBasics, checkDraftDeck, newDraft, PACK_SIZE, PACKS, pickCard, recordHumanMatch, SEATS, standings, nextOpponent, type DraftState } from '../src/draft/draft';

const draftAll = () => {
  let st: DraftState = newDraft(42);
  while (st.phase === 'pick') st = pickCard(st, 0);
  return st;
};

describe('Draft à 4', () => {
  it('3 paquets de 15 : chacun repart avec 45 cartes, sans carte perdue', () => {
    const st = newDraft(7);
    expect(st.packs).toHaveLength(SEATS);
    expect(st.packs.every(p => p.length === PACK_SIZE)).toBe(true);
    const done = draftAll();
    expect(done.phase).toBe('build');
    expect(done.picks.every(p => p.length === PACKS * PACK_SIZE)).toBe(true);
  });
  it('les paquets tournent : la 2e carte vient du paquet du voisin', () => {
    const st = newDraft(3);
    const neighbour = st.packs[SEATS - 1]!.slice();
    const after = pickCard(st, 0);
    expect(after.packs[0]!.length).toBe(PACK_SIZE - 1);
    expect(after.packs[0]!.every(id => neighbour.includes(id))).toBe(true);
  });
  it('les IA construisent des decks valides', () => {
    const st = draftAll();
    for (let s = 1; s < SEATS; s++) expect(checkDraftDeck(st.decks[s]!, st.picks[s]!).ok).toBe(true);
  });
  it('le joueur ne peut mettre que ses cartes draftées (régiments de base à volonté)', () => {
    const st = draftAll();
    const deck = autoFillBasics(st.picks[0]!, 'empire');
    expect(checkDraftDeck(deck, st.picks[0]!).ok).toBe(true);
    const notMine = Object.keys(CARDS).find(id => !st.picks[0]!.includes(id) && CARDS[id]!.niveau === 3)!;
    expect(checkDraftDeck([...deck, notMine], st.picks[0]!).ok).toBe(false);
  });
  it('tournoi : 3 rondes, 6 matchs, un classement', () => {
    let st = draftAll();
    st.decks[0] = autoFillBasics(st.picks[0]!, 'empire');
    st.phase = 'tournament';
    const opps: number[] = [];
    for (let r = 0; r < 3; r++) { opps.push(nextOpponent(st)!); st = recordHumanMatch(st, r % 2 === 0, 10); }
    expect(opps).toEqual([1, 2, 3]);
    expect(st.phase).toBe('done');
    expect(st.results).toHaveLength(6);
    expect(standings(st).reduce((n, x) => n + x.wins, 0)).toBe(6);
  }, 120000);
});
