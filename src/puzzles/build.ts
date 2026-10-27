// Construction d'une partie à partir d'un puzzle, et suivi de l'objectif.
import { Ctx } from '../engine/ctx';
import { createGame } from '../engine/game';
import type { GameState, PlayerId, Zone } from '../engine/types';
import type { Puzzle, PuzzleCell, PuzzleSide } from './types';

const FILLER = Array(20).fill('recrue_imp') as string[];

export interface BuiltPuzzle { state: GameState; targetUid: number | null }

export function buildPuzzle(pz: Puzzle): BuiltPuzzle {
  const s = createGame({
    seed: `puzzle-${pz.id}`,
    A: { faction: pz.A.faction, deck: pz.A.deck ?? FILLER },
    B: { faction: pz.B.faction, deck: pz.B.deck ?? FILLER },
    config: { startingHand: 0, emptyDeckDefeat: false, defeatLassitude: { A: pz.A.limit ?? 50, B: pz.B.limit ?? 50 } },
  });
  const ctx = new Ctx(s);
  let targetUid: number | null = null;
  const setup = (p: PlayerId, side: PuzzleSide) => {
    const pl = s.players[p];
    pl.level = side.level ?? 1;
    pl.resource = side.resource ?? pl.level;
    pl.points = side.lassitude ?? 0;
    pl.hand = (side.hand ?? []).map(cardId => ({ uid: s.nextUid++, cardId }));
    // Pioche dans l'ordre écrit (pas de mélange), du dessus vers le dessous ; pas de paquet niveaux 4-5 à part.
    pl.deck = [...(side.deck ?? FILLER)];
    pl.reserve = [];
    const put = (zone: Zone, idx: number, cell: PuzzleCell | null | undefined) => {
      if (!cell) return;
      const c = typeof cell === 'string' ? { card: cell } : cell;
      const u = ctx.makeUnit(c.card, p);
      u.justDeployed = !!c.fresh;
      if (c.end !== undefined) u.currentEnd = Math.min(u.maxEnd, c.end);
      if (c.mor !== undefined) { u.currentMor = Math.min(u.maxMor, c.mor); u.brokenMorale = u.currentMor <= Math.floor(u.maxMor / 3); }
      if (c.leader) { u.leader = c.leader; u.leaderOwner = p; }
      ctx.setAt({ player: p, zone, idx }, u);
      // Emplacement de la cible numéroté comme à l'écran : « avant.1 » = première case avant (à gauche).
      if (p === 'B' && pz.goal.type === 'destroy' && pz.goal.slot === `${zone}.${idx + 1}`) targetUid = u.uid;
    };
    (side.avant ?? []).forEach((c, i) => put('avant', i, c));
    (side.arriere ?? []).forEach((c, i) => put('arriere', i, c));
    put('isole', 0, side.isole);
  };
  setup('A', pz.A);
  setup('B', pz.B);
  s.active = 'A';
  return { state: s, targetUid };
}

/** Objectif atteint (« won »), manqué (« lost »), ou partie en cours (null). */
export function puzzleStatus(pz: Puzzle, s: GameState, targetUid: number | null): 'won' | 'lost' | null {
  if (pz.goal.type === 'win') {
    if (s.over) return s.over.winner === 'A' ? 'won' : 'lost';
  } else {
    if (s.over?.winner === 'B') return 'lost'; // détruire la cible en perdant la partie ne compte pas
    if (targetUid !== null && !new Ctx(s).findUnit(targetUid)) return 'won';
    if (s.over) return 'lost';
  }
  return s.active === 'B' || s.turn > 1 ? 'lost' : null; // le tour est passé sans atteindre l'objectif
}
