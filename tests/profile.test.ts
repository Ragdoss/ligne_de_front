import { describe, expect, it } from 'vitest';
import { autoComplete, checkDeck, COLLECTIBLE, mergeCampaignPool, newProfile, openPack, PACK_PRICE } from '../src/profile/profile';

describe('Profil joueur', () => {
  it('un nouveau joueur ne possède aucune carte ; avec « toutes les cartes débloquées », il construit un deck valide', () => {
    const p = newProfile();
    expect(COLLECTIBLE.every(id => !p.collection[id])).toBe(true);
    expect(checkDeck(autoComplete([], p, 'empire'), p).ok).toBe(false);
    p.options.allUnlocked = true;
    for (const f of ['empire', 'elfe', 'demons', 'nomades']) {
      const deck = autoComplete([], p, f);
      const c = checkDeck(deck, p);
      expect(c.problems).toEqual([]);
    }
  });
  it('règles de deck : 3 exemplaires max, 3 régiments de niveau 1, 30 cartes niv. 1-3, 15 niv. 4-5', () => {
    expect(checkDeck(Array(4).fill('recrue_imp')).problems.some(x => x.includes('3 maximum'))).toBe(true);
    const c = checkDeck(['ralliement']);
    expect(c.ok).toBe(false);
    expect(c.problems).toHaveLength(3);
  });
  it('un paquet : 5 cartes, coûte 5, les exemplaires au-delà de 3 rendent 1 pièce', () => {
    const p = newProfile();
    p.coins = PACK_PRICE;
    const first = COLLECTIBLE[0]!;
    p.collection[first] = 2;
    const r = openPack(p, () => 0.0)!; // tire toujours la même carte : 1 nouvel exemplaire, puis 4 en trop
    expect(r.cards).toHaveLength(5);
    expect(p.collection[first]).toBe(3);
    expect(r.refund).toBe(4);
    expect(p.coins).toBe(4);
    expect(openPack(p)).toBeNull(); // 4 pièces < prix d'un paquet
  });
  it('fin de campagne : la collection monte au nombre d’exemplaires du pool (3 max), une seule fois', () => {
    const p = newProfile();
    p.collection.cavalier_elfe = 1; p.collection.recrue_imp = 1;
    const gained = mergeCampaignPool(p, ['cavalier_elfe', 'cavalier_elfe', ...Array(12).fill('recrue_imp')], 'camp-1');
    expect(gained).toEqual({ cavalier_elfe: 1, recrue_imp: 2 });
    expect(p.collection.cavalier_elfe).toBe(2);
    expect(p.collection.recrue_imp).toBe(3);
    expect(mergeCampaignPool(p, ['lancier_emp', 'lancier_emp'], 'camp-1')).toEqual({});
  });
});
