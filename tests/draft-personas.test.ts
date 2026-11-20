// IA du draft : notes apprises par des drafts entre IA et personnalités tirées au hasard (20/11/2026).
import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/data/cards';
import {
  buildAiDeck, cardFactions, checkDraftDeck, drawPersonalities, newDraft, personalityOf, PERSONALITIES, pickCard, rating, SEATS, topFactions, type DraftState,
} from '../src/draft/draft';
import { newMulti } from '../src/draft/multi';

const draftAll = (seed: number) => {
  let st: DraftState = newDraft(seed);
  while (st.phase === 'pick') st = pickCard(st, 0);
  return st;
};

describe('IA du draft : personnalités', () => {
  it('chaque siège reçoit une personnalité, toujours la même pour une graine donnée', () => {
    const st = newDraft(1234);
    expect(st.personalities).toHaveLength(SEATS);
    expect(st.personalities!.every(i => i >= 0 && i < PERSONALITIES.length)).toBe(true);
    expect(newDraft(1234).personalities).toEqual(st.personalities);
    expect(newMulti(1234, 1, []).personalities).toEqual(drawPersonalities(1234));
  });

  it('toutes les personnalités sont tirées, d’un draft à l’autre', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed < 60; seed++) for (const i of drawPersonalities(seed).slice(1)) seen.add(i);
    expect(seen.size).toBe(PERSONALITIES.length);
  });

  it('un ancien draft sans personnalités utilise la personnalité par défaut', () => {
    const st = newDraft(5);
    delete st.personalities;
    expect(personalityOf(st, 2)).toBe(PERSONALITIES[0]);
    let s: DraftState = st;
    while (s.phase === 'pick') s = pickCard(s, 0);
    for (let seat = 1; seat < SEATS; seat++) expect(checkDraftDeck(s.decks[seat]!, s.picks[seat]!).ok).toBe(true);
  });

  it('les decks des IA sont légaux, quelle que soit la personnalité', () => {
    for (const seed of [3, 17, 99]) {
      const st = draftAll(seed);
      for (let seat = 1; seat < SEATS; seat++) expect(checkDraftDeck(st.decks[seat]!, st.picks[seat]!).ok).toBe(true);
      for (const p of PERSONALITIES) expect(checkDraftDeck(buildAiDeck(st.picks[1]!, p), st.picks[1]!).ok).toBe(true);
    }
  });

  it('« Opportuniste » ne garde hors de ses deux factions que les bonnes cartes ; « Libre » prend les meilleures', () => {
    const st = draftAll(21);
    const picks = st.picks[2]!;
    const opp = PERSONALITIES.find(p => p.id === 'opportuniste')!;
    const [f1, f2] = topFactions(picks);
    const inMain = (id: string) => cardFactions(id).some(f => f === f1 || f === f2 || f === 'neutre');
    const pool = picks.filter(id => inMain(id) || rating(id) >= opp.offKeep).length;
    const outside = buildAiDeck(picks, opp).filter(id => !inMain(id));
    // Hors de ses deux factions : seulement des cartes notées 1 ou plus, sauf s'il faut compléter le deck.
    if (pool >= 40) expect(outside.every(id => rating(id) >= opp.offKeep)).toBe(true);
    expect(outside.every(id => CARDS[id])).toBe(true);
    const libre = PERSONALITIES.find(p => p.id === 'libre')!;
    const deck = buildAiDeck(picks, libre);
    expect(deck.length).toBeGreaterThanOrEqual(40);
    expect(new Set(deck).size).toBeGreaterThan(5);
  });
});
