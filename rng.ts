// Hasard reproductible (mulberry32). L'état du générateur vit dans GameState.rng :
// une même graine et les mêmes actions redonnent exactement la même partie.

export function nextRandom(seedState: number): { value: number; state: number } {
  let t = (seedState + 0x6d2b79f5) | 0;
  const state = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state };
}

/** Graine numérique à partir d'un texte ou d'un nombre. */
export function seedFrom(input: string | number): number {
  if (typeof input === 'number') return input | 0;
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}
