import { describe, expect, it } from 'vitest';
import { checkDraftDeck, PACK_SIZE, PACKS, buildAiDeck } from '../src/draft/draft';
import { choosePick, dropHuman, gameFirst, myMatch, newMulti, recordGame, submitDeck, type MultiDraft } from '../src/draft/multi';

const seats = (n: number) => Array.from({ length: n }, (_, i) => ({ name: `J${i}`, avatar: 'empire.1', human: true }));

function draftAll(st: MultiDraft): MultiDraft {
  while (st.phase === 'pick') for (let s = 0; s < 4; s++) if (st.seats[s]!.human && st.chosen[s] === null && st.phase === 'pick') st = choosePick(st, s, 0);
  return st;
}

describe('Draft à plusieurs', () => {
  it('les paquets ne tournent que quand tous les humains ont choisi', () => {
    let st = newMulti(42, 1, seats(2));
    st = choosePick(st, 0, 0);
    expect(st.picks[0]).toHaveLength(0);
    expect(st.chosen[0]).toBe(0);
    st = choosePick(st, 1, 0);
    expect(st.picks[0]).toHaveLength(1);
    expect(st.picks[2]).toHaveLength(1); // l'ordinateur a choisi aussi
    expect(st.chosen).toEqual([null, null, null, null]);
  });
  it('draft complet, decks, tournoi entre deux humains et deux ordinateurs', () => {
    let st = draftAll(newMulti(7, 3, seats(2)));
    expect(st.phase).toBe('build');
    expect(st.picks[0]).toHaveLength(PACKS * PACK_SIZE);
    expect(st.decks[2]).not.toBeNull();
    for (const s of [0, 1]) st = submitDeck(st, s, buildAiDeck(st.picks[s]!));
    expect(checkDraftDeck(st.decks[0]!, st.picks[0]!).ok).toBe(true);
    expect(st.phase).toBe('tournament');
    expect(st.results).toHaveLength(1); // 2 contre 3 joué par l'ordinateur
    const m = myMatch(st, 0)!;
    expect([m.a, m.b, m.opp]).toEqual([0, 1, 1]);
    const f1 = gameFirst(st, 0, 1);
    st = recordGame(st, 0, 1, 0, 10);
    expect(gameFirst(st, 0, 1)).not.toBe(f1); // alternance en Bo3
    st = recordGame(st, 0, 1, 0, 10);
    expect(st.mround).toBe(1);
    // Ronde 2 : chaque humain contre un ordinateur.
    expect(myMatch(st, 0)!.opp).toBe(2);
    st = recordGame(st, 0, 2, 2, 9); st = recordGame(st, 0, 2, 2, 9);
    st = recordGame(st, 1, 3, 1, 9); st = recordGame(st, 1, 3, 1, 9);
    expect(st.mround).toBe(2);
    st = dropHuman(st, 1); // le joueur 2 part : son match est joué par l'ordinateur
    st = recordGame(st, 0, 3, 0, 8); st = recordGame(st, 0, 3, 0, 8);
    expect(st.phase).toBe('done');
    expect(st.results).toHaveLength(6);
  });
});
