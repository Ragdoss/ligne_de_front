// Volontaires de fin de scénario : tirage déterministe, cartes de la faction (ou neutres), niveau plafonné.
import { describe, expect, it } from 'vitest';
import { draftOptions, newCampaign, rewardWithDraft } from '../src/campaign/campaign';
import { CARDS } from '../src/data/cards';

describe('Campagne : volontaires', () => {
  it('3 tours de 3 cartes ajoutés aux récompenses, sauf au dernier scénario', () => {
    const c = newCampaign('nomades');
    const r = rewardWithDraft(c)!;
    expect(r.draft).toEqual({ rounds: 3, size: 3, maxLevel: 2 });
    expect(r.order?.at(-1)).toBe('draft');
    expect(rewardWithDraft({ ...c, idx: 4 })?.draft).toBeUndefined();
  });
  it('cartes de la faction ou neutres, niveau plafonné, tirage reproductible', () => {
    const c = newCampaign('elfes');
    const a = draftOptions(c, 1, 3, 2);
    expect(a).toHaveLength(3);
    expect(new Set(a).size).toBe(3);
    for (const id of a) {
      const d = CARDS[id]!;
      expect(d.niveau).toBeLessThanOrEqual(2);
      expect(d.faction === 'elfe' || d.faction === 'neutre' || ((d.factions as string[] | undefined) ?? []).includes('elfe')).toBe(true);
    }
    expect(draftOptions(c, 1, 3, 2)).toEqual(a);
    expect(draftOptions(c, 2, 3, 2)).not.toEqual(a);
  });
});
