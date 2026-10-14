import { describe, expect, it } from 'vitest';
import { DEMO_DECKS } from '../src/data/decks';
import { applyAction, createGame, legalActions } from '../src/engine/game';
import { formatEvent } from '../src/i18n/log.fr';
import type { GameEvent } from '../src/engine/types';

describe('Journal en français', () => {
  it('chaque type d\'événement produit d\'une vraie partie se traduit sans erreur', () => {
    let s = createGame({ seed: 7, A: { faction: 'empire', deck: DEMO_DECKS.empire! }, B: { faction: 'elfe', deck: DEMO_DECKS.elfe! } });
    const events: GameEvent[] = [];
    for (let i = 0; i < 400 && !s.over; i++) {
      const acts = legalActions(s);
      const r = applyAction(s, acts[i % acts.length]!);
      if (r.ok) { s = r.state; events.push(...r.events); }
    }
    const lines = events.map(e => formatEvent(e)).filter(Boolean) as string[];
    expect(lines.length).toBeGreaterThan(20);
    for (const l of lines) expect(l).not.toMatch(/undefined|NaN/);
  });
});
