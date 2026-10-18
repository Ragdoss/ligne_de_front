import { describe, expect, it } from 'vitest';
import { artsForDeck, newProfile, openPack, PACK_PRICE, sanitizeProfile } from '../src/profile/profile';

const seq = (vals: number[]) => { let i = 0; return () => vals[i++ % vals.length]!; };

describe('Arts alternatifs', () => {
  it('un paquet peut débloquer un art alternatif', () => {
    const p = newProfile(); p.coins = PACK_PRICE; p.collection.lieutenant = 1; p.collection.connetable = 1;
    // emote non, avatar non, art alternatif oui (0.01 < 1/8), puis tirage dans le pool
    const res = openPack(p, seq([0.99, 0.99, 0.01, 0.5, 0.3]), ['lieutenant.alt1', 'connetable.alt1'])!;
    const alt = res.cards.filter(c => c.kind === 'alt');
    expect(alt).toHaveLength(1);
    expect(alt[0]!.isNew).toBe(true);
    expect(p.altArts).toEqual([alt[0]!.id]);
    expect(res.cards).toHaveLength(5);
  });
  it('sans art alternatif disponible, le tirage ne change pas', () => {
    const a = newProfile(), b = newProfile(); a.coins = b.coins = PACK_PRICE;
    const r = [0.99, 0.99, 0.4, 0.2, 0.7, 0.1, 0.9, 0.3];
    expect(openPack(a, seq(r))).toEqual(openPack(b, seq(r), []));
  });
  it('seuls les arts des cartes possédées peuvent sortir', () => {
    const p = newProfile(); p.coins = PACK_PRICE * 2; p.collection.connetable = 1;
    const pool = ['lieutenant.alt1', 'connetable.alt1'];
    const res = openPack(p, seq([0.99, 0.99, 0.01, 0.95, 0.3]), pool)!;
    expect(res.cards.filter(c => c.kind === 'alt').map(c => c.id)).toEqual(['connetable.alt1']);
    const none = newProfile(); none.coins = PACK_PRICE;
    const r2 = openPack(none, seq([0.99, 0.99, 0.01, 0.5, 0.3]), pool)!;
    expect(r2.cards.some(c => c.kind === 'alt')).toBe(false);
  });
  it('déjà tous possédés : +1 pièce', () => {
    const p = newProfile(); p.coins = PACK_PRICE; p.altArts = ['lieutenant.alt1']; p.collection.lieutenant = 1;
    const res = openPack(p, seq([0.99, 0.99, 0.01, 0.5, 0.3]), ['lieutenant.alt1'])!;
    expect(res.cards.find(c => c.kind === 'alt')!.extra).toBe(true);
    expect(res.refund).toBeGreaterThanOrEqual(1);
  });
  it('le profil ne garde que des choix d’arts possédés et cohérents', () => {
    const p = sanitizeProfile({ altArts: ['lieutenant.alt1', 'pas_une_carte.alt1', 'lieutenant'], artChoice: { lieutenant: 'lieutenant.alt1', connetable: 'connetable.alt2', archer_imp: 'lieutenant.alt1' } });
    expect(p.altArts).toEqual(['lieutenant.alt1']);
    expect(p.artChoice).toEqual({ lieutenant: 'lieutenant.alt1' });
  });
  it('en partie, on n’envoie que les arts débloqués des cartes du deck', () => {
    const p = newProfile(); p.altArts = ['lieutenant.alt1']; p.artChoice = { lieutenant: 'lieutenant.alt1', connetable: 'connetable.alt1' };
    expect(artsForDeck(p, ['lieutenant', 'archer_imp'])).toEqual({ lieutenant: 'lieutenant.alt1' });
    expect(artsForDeck(p, ['archer_imp'])).toEqual({});
  });
});
