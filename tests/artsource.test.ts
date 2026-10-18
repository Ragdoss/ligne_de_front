import { describe, expect, it } from 'vitest';
import { artFile, artKeyFor, artOf, clearGameArts, setArtChoices, setGameArts } from '../src/ui/CardFace';

describe('Art emprunté', () => {
  it('le régiment Palissade suit l’art de la tactique, art alternatif choisi compris', () => {
    setArtChoices({});
    expect(artOf('palissade_regiment')).toBe(artOf('palissade_tactique'));
    expect(artOf('palissade_tactique')).toBeTruthy();
    setArtChoices({ palissade_tactique: 'palissade_tactique.alt2' });
    expect(artOf('palissade_regiment')).toBe(artFile('palissade_tactique.alt2'));
    expect(artOf('palissade_regiment')).not.toBe(artFile('palissade_tactique'));
    setArtChoices({});
  });
  it('en partie, chaque joueur voit le régiment avec l’art choisi pour sa tactique', () => {
    const arts = { A: { palissade_tactique: 'palissade_tactique.alt3' } };
    setGameArts(arts);
    expect(artKeyFor('palissade_regiment', 'A')).toBe('palissade_tactique.alt3');
    expect(artKeyFor('palissade_regiment', 'B')).toBe('palissade_tactique');
    expect(artFile(artKeyFor('palissade_regiment', 'B')!)).toBe(artFile('palissade_tactique'));
    clearGameArts(arts);
  });
});
