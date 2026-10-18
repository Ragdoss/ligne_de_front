import { describe, expect, it } from 'vitest';
import { humanGameFirst, newDraft } from '../src/draft/draft';

describe('Draft : joueur qui commence', () => {
  it('alterne dans un match, et la première partie varie selon le draft', () => {
    const firsts = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const st = newDraft(seed, 5);
      const g1 = humanGameFirst(st);
      firsts.add(g1);
      st.current = [1, 0]; expect(humanGameFirst(st)).not.toBe(g1);
      st.current = [1, 1]; expect(humanGameFirst(st)).toBe(g1);
      st.current = [2, 1]; expect(humanGameFirst(st)).not.toBe(g1);
    }
    expect(firsts.size).toBe(2);
  });
});
