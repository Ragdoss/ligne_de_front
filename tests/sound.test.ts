import { describe, expect, it } from 'vitest';
import type { GameEvent } from '../src/engine/types';
import { soundsFor } from '../src/ui/sound';

describe('Sons des événements', () => {
  it('du plus précis au plus général', () => {
    const ev: GameEvent[] = [
      { type: 'cardPlayed', player: 'A', cardId: 'dragon_infernal', cost: 7 },
      { type: 'destroyed', player: 'B', uid: 3, cardId: 'recrue_imp', cause: 'moral' } as GameEvent,
      { type: 'gameOver', winner: 'B', reason: 'lassitude' },
    ];
    expect(soundsFor(ev, 'A')).toEqual([
      ['carte-dragon_infernal', 'deploiement'],
      ['destruction-recrue_imp', 'fuite', 'destruction'],
      ['defaite'],
    ]);
    expect(soundsFor([ev[2]!], 'B')).toEqual([['victoire']]);
  });
});
