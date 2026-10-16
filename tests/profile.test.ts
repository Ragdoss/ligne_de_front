import { describe, expect, it } from 'vitest';
import { autoComplete, checkDeck, COLLECTIBLE, mergeCampaignPool, newProfile, openPack, PACK_PRICE } from '../src/profile/profile';

describe('Profil joueur', () => {
  it('cosmétiques : 2 emotes et 1 image de départ ; un paquet peut contenir une emote et une image de profil', () => {
    const p = newProfile();
    expect(p.emotes).toHaveLength(2);
    expect(p.avatars).toHaveLength(1);
    p.coins = PACK_PRICE;
    const r = openPack(p, () => 0.01)!; // < 1/10 : emote ET image de profil
    expect(r.cards).toHaveLength(5);
    expect(r.cards.filter(c => c.kind === 'emote')).toHaveLength(1);
    expect(r.cards.filter(c => c.kind === 'avatar')).toHaveLength(1);
    expect(p.emotes).toHaveLength(3);
    expect(p.avatars).toHaveLength(2);
  });
  it('images de profil : la série enluminée (5 à 8) sort 4 fois moins souvent que la série au crayon', () => {
    let seed = 12345;
    const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    let rare = 0, common = 0;
    for (let i = 0; i < 20000; i++) {
      const p = newProfile();
      p.coins = PACK_PRICE;
      p.avatars = [];
      let n = 0;
      const r = openPack(p, () => (n++ < 2 ? 0.01 : rand()))!; // force l'image de profil, puis tirage libre
      const a = r.cards.find(c => c.kind === 'avatar');
      if (a) { if (Number(a.id.split('.')[1]) >= 5) rare++; else common++; }
    }
    // 16 images rares (poids 1) contre 16 communes (poids 4) : une image tirée sur 5 est une rare, soit 4 fois moins par image.
    const share = rare / (rare + common);
    expect(share).toBeGreaterThan(0.18);
    expect(share).toBeLessThan(0.22);
  });
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
    const first = COLLECTIBLE[Math.floor(0.5 * COLLECTIBLE.length)]!;
    p.collection[first] = 2;
    const r = openPack(p, () => 0.5)!; // pas de cosmétique (0,5 ≥ 1/5) ; tire toujours la même carte : 1 nouvel exemplaire, puis 4 en trop
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
