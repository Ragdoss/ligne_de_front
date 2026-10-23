// Bulles de variation de statistiques : on compare deux états du jeu, régiment par régiment
// (ATK, ARM, INI effectives, END et Moral actuels, Moral brisé), pour afficher « −5 END », « +10 ATK »…
import { Ctx } from '../engine/ctx';
import type { GameState, Unit } from '../engine/types';

export interface Bubble { text: string; up: boolean }
export type Bubbles = Map<number, Bubble[]>;

function unitsOf(s: GameState): Map<number, Unit> {
  const m = new Map<number, Unit>();
  for (const p of ['A', 'B'] as const) {
    const b = s.players[p].board;
    for (const u of [...b.avant, ...b.arriere, b.isole]) if (u) m.set(u.uid, u);
  }
  return m;
}

/**
 * Variations entre `before` et `after` pour les régiments présents dans les deux états.
 * `full` : aussi ATK, ARM et INI (sinon seulement END, Moral et Moral brisé, ex. remise à zéro des bonus en fin de tour).
 */
export function statBubbles(before: GameState, after: GameState, full = true): Bubbles {
  const out: Bubbles = new Map();
  const a = unitsOf(before), b = unitsOf(after);
  const ca = new Ctx(before), cb = new Ctx(after);
  for (const [uid, u1] of a) {
    const u2 = b.get(uid);
    if (!u2) continue;
    const list: Bubble[] = [];
    const add = (delta: number, label: string) => { if (delta) list.push({ text: `${delta > 0 ? '+' : '−'}${Math.abs(delta)} ${label}`, up: delta > 0 }); };
    if (full) {
      add(cb.effectiveAtk(u2) - ca.effectiveAtk(u1), 'ATK');
      add(cb.effectiveArm(u2) - ca.effectiveArm(u1), 'ARM');
      add(cb.effectiveIni(u2) - ca.effectiveIni(u1), 'INI');
    }
    add(u2.currentEnd - u1.currentEnd, 'END');
    add(u2.currentMor - u1.currentMor, 'MOR');
    if (!u1.brokenMorale && u2.brokenMorale) list.push({ text: 'Moral brisé', up: false });
    if (u1.brokenMorale && !u2.brokenMorale) list.push({ text: 'Moral rétabli', up: true });
    if (list.length) out.set(uid, list);
  }
  return out;
}
