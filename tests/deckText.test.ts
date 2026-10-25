import { describe, expect, it } from 'vitest';
import { DEMO_DECKS as DECKS } from '../src/data/decks';
import { exportDeck, parseDeck } from '../src/profile/deckText';

describe('Export et import de deck', () => {
  it('l’export se réimporte à l’identique (avec le nom)', () => {
    const deck = DECKS.demons!;
    const r = parseDeck(exportDeck(deck, 'Mon deck'));
    expect(r.unknown).toEqual([]);
    expect(r.name).toBe('Mon deck');
    expect([...r.deck].sort()).toEqual([...deck].sort());
  });
  it('accepte « 3x Nom », les noms sans accents et l’ancien format', () => {
    expect(parseDeck('2x bourreau de l\'abime\n1 recrue_imp').deck).toEqual(['bourreau_abime', 'bourreau_abime', 'recrue_imp']);
    expect(parseDeck("const DECK = ['recrue_imp', 'recrue_imp'];").deck).toEqual(['recrue_imp', 'recrue_imp']);
    expect(parseDeck('recrue_imp, lancier_emp').deck.length).toBeGreaterThan(0);
    expect(parseDeck('3 Carte inventée').unknown).toEqual(['Carte inventée']);
  });
});
