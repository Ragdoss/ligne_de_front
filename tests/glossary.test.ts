import { describe, expect, it } from 'vitest';
import { CARD_TEXT_FR } from '../src/i18n/cards.fr';
import { glossaryFor } from '../src/i18n/keywords.fr';
import { cardDesc } from '../src/ui/labels';

describe('Glossaire', () => {
  it('les mots entre accolades ne s’affichent pas mais ajoutent leur définition', () => {
    const old = CARD_TEXT_FR.rangers!.desc;
    CARD_TEXT_FR.rangers!.desc = 'Sa cible est sonnée. {Moral brisé, Lassitude}';
    try {
      expect(cardDesc('rangers')).toBe('Sa cible est sonnée.');
      const terms = glossaryFor('rangers').map(g => g.term);
      expect(terms).toEqual(expect.arrayContaining(['Sonné', 'Moral brisé', 'Lassitude']));
    } finally { CARD_TEXT_FR.rangers!.desc = old; }
  });
  it('formes conjuguées : Sonnée, sonne', () => {
    expect(glossaryFor('rangers').map(g => g.term)).toContain('Sonné');
  });
});
