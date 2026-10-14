// Contexte d'exécution d'une action : une copie modifiable de l'état + la liste des événements produits.
// Toutes les règles « de base » partagées (unités, soins, Moral, lassitude, destructions, pioche) sont ici.

import { CARDS } from '../data/cards';
import { nextRandom } from './rng';
import type {
  CardDef, GameEvent, GameState, PlayerId, PlayerState, SlotRef, Unit, Zone,
} from './types';

export const opponentOf = (p: PlayerId): PlayerId => (p === 'A' ? 'B' : 'A');

export function card(id: string): CardDef {
  const c = CARDS[id];
  if (!c) throw new Error(`Carte inconnue : ${id}`);
  return c;
}

export class Ctx {
  readonly events: GameEvent[] = [];
  constructor(public readonly s: GameState) {}

  emit(e: GameEvent): void { this.events.push(e); }
  get over(): boolean { return this.s.over !== null; }
  player(p: PlayerId): PlayerState { return this.s.players[p]; }

  // ---------- Hasard ----------
  random(): number {
    const r = nextRandom(this.s.rng);
    this.s.rng = r.state;
    return r.value;
  }
  randomInt(n: number): number { return Math.floor(this.random() * n); }
  shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.randomInt(i + 1);
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  }
  uid(): number { return this.s.nextUid++; }

  // ---------- Plateau ----------
  units(p: PlayerId): Unit[] {
    const b = this.player(p).board;
    const out: Unit[] = [];
    b.avant.forEach(u => { if (u) out.push(u); });
    b.arriere.forEach(u => { if (u) out.push(u); });
    if (b.isole) out.push(b.isole);
    return out;
  }
  unitAt(ref: SlotRef): Unit | null {
    const b = this.player(ref.player).board;
    if (ref.zone === 'isole') return b.isole;
    return b[ref.zone][ref.idx] ?? null;
  }
  setAt(ref: SlotRef, u: Unit | null): void {
    const b = this.player(ref.player).board;
    if (ref.zone === 'isole') b.isole = u;
    else b[ref.zone][ref.idx] = u;
  }
  slotOf(uid: number): SlotRef | null {
    for (const p of ['A', 'B'] as PlayerId[]) {
      const b = this.player(p).board;
      for (const zone of ['avant', 'arriere'] as const) {
        const i = b[zone].findIndex(u => u?.uid === uid);
        if (i !== -1) return { player: p, zone, idx: i };
      }
      if (b.isole?.uid === uid) return { player: p, zone: 'isole', idx: 0 };
    }
    return null;
  }
  findUnit(uid: number): Unit | null {
    const ref = this.slotOf(uid);
    return ref ? this.unitAt(ref) : null;
  }
  isAlive(u: Unit): boolean { return this.slotOf(u.uid) !== null; }
  adjBack(i: number): number[] {
    const n = this.s.config.layout.arriere;
    return [i - 1, i].filter(k => k >= 0 && k < n);
  }
  adjFront(k: number): number[] {
    const n = this.s.config.layout.avant;
    return [k, k + 1].filter(i => i >= 0 && i < n);
  }
  allSlots(p: PlayerId): SlotRef[] {
    const L = this.s.config.layout;
    const out: SlotRef[] = [];
    for (let i = 0; i < L.avant; i++) out.push({ player: p, zone: 'avant', idx: i });
    for (let i = 0; i < L.arriere; i++) out.push({ player: p, zone: 'arriere', idx: i });
    out.push({ player: p, zone: 'isole', idx: 0 });
    return out;
  }
  controlsElemental(p: PlayerId): boolean { return this.units(p).some(u => u.types.includes('Élémentaux')); }

  makeUnit(cardId: string, controller: PlayerId, isToken = false): Unit {
    const c = card(cardId);
    return {
      uid: this.uid(),
      cardId,
      controller,
      types: (c.types ?? []).slice(),
      keywords: (c.keywords ?? []).slice(),
      niveau: c.niveau,
      baseAtk: c.atk ?? 0,
      baseArm: c.arm ?? 0,
      ini: c.ini ?? 0,
      maxEnd: c.end ?? 1,
      currentEnd: c.end ?? 1,
      maxMor: c.mor ?? 1,
      currentMor: c.startMor ?? c.mor ?? 1,
      leader: null,
      leaderOwner: null,
      justDeployed: true,
      arrivesReady: !!c.arrivesReady,
      brokenMorale: false,
      vieTours: c.vieTours ?? null,
      isToken,
      tempAtk: 0, tempDebuffAtk: 0, tempArm: 0, tempIni: 0,
      ignoreArmor: false, stunned: false, stunnedBy: null,
      squareArm: 0, squareOwner: null,
    };
  }

  // ---------- Statistiques effectives ----------
  effectiveAtk(u: Unit): number {
    const ratio = 0.5 + 0.5 * (u.currentEnd / u.maxEnd);
    let atk = u.baseAtk * ratio;
    if (u.justDeployed && !u.arrivesReady) atk *= 0.5;
    if (u.leader && !u.brokenMorale) atk += card(u.leader).bonusAtk ?? 0;
    if (!u.brokenMorale) atk += u.tempAtk;
    atk -= u.tempDebuffAtk;
    return Math.max(0, Math.round(atk));
  }
  effectiveArm(u: Unit): number {
    let arm = u.baseArm;
    if (u.leader && !u.brokenMorale) {
      arm += card(u.leader).bonusArm ?? 0;
      arm += card(u.cardId).armBonusWithLeader ?? 0;
    }
    if (!u.brokenMorale) arm += u.squareArm + u.tempArm;
    return arm;
  }
  effectiveIni(u: Unit): number {
    let ini = u.ini;
    if (u.leader && !u.brokenMorale) ini += card(u.leader).bonusIni ?? 0;
    return ini + u.tempIni;
  }

  // ---------- Moral ----------
  checkBroken(u: Unit): void {
    if (!u.brokenMorale && u.currentMor <= Math.floor(u.maxMor / 3)) u.brokenMorale = true;
  }
  /** Retire du Moral ; retourne la perte réellement appliquée (plancher du Chevalier Templier). */
  loseMoral(u: Unit, amount: number): number {
    if (amount <= 0) return 0;
    const before = u.currentMor;
    let after = Math.max(0, before - amount);
    const floor = card(u.cardId).moralFloorWithLeader;
    if (u.leader && floor && before >= floor) after = Math.max(floor, after);
    u.currentMor = after;
    return before - after;
  }
  /** Gain de Moral « brut » (plafonné), sans lever l'état Moral brisé (cas du tueur). */
  addMoralRaw(u: Unit, n: number): void { u.currentMor = Math.min(u.maxMor, u.currentMor + n); }

  heal(u: Unit, end: number, mor: number, source: string): { end: number; mor: number } {
    let gEnd = 0, gMor = 0;
    if (end > 0) { const b = u.currentEnd; u.currentEnd = Math.min(u.maxEnd, b + end); gEnd = u.currentEnd - b; }
    if (mor > 0) {
      const b = u.currentMor; u.currentMor = Math.min(u.maxMor, b + mor); gMor = u.currentMor - b;
      if (u.brokenMorale && u.currentMor > Math.floor(u.maxMor / 3)) u.brokenMorale = false;
    }
    if (gEnd || gMor) this.emit({ type: 'heal', uid: u.uid, cardId: u.cardId, end: gEnd, mor: gMor, source });
    if (gEnd > 0) {
      const owner = this.player(u.controller);
      const veil = this.units(u.controller).find(x => x.leader && card(x.leader).lassitudePerHealStep);
      if (veil) {
        const step = card(veil.leader!).lassitudePerHealStep!;
        owner.healAcc += gEnd;
        const g = Math.floor(owner.healAcc / step);
        owner.healAcc %= step;
        if (g > 0) this.loseLassitude(u.controller, g, veil.leader!);
      }
    }
    return { end: gEnd, mor: gMor };
  }

  // ---------- Lassitude et niveaux ----------
  gainLassitude(p: PlayerId, n: number, source: string): void {
    if (n <= 0 || this.over) return;
    const pl = this.player(p);
    pl.points += n;
    this.emit({ type: 'lassitude', player: p, amount: n, total: pl.points, source });
    this.checkLevel(p);
  }
  loseLassitude(p: PlayerId, n: number, source: string): void {
    const pl = this.player(p);
    const before = pl.points;
    pl.points = Math.max(0, pl.points - n);
    if (before !== pl.points) this.emit({ type: 'lassitude', player: p, amount: pl.points - before, total: pl.points, source });
  }
  checkLevel(p: PlayerId): void {
    const pl = this.player(p);
    const thr = this.s.config.levelThresholds[p];
    let lvl = 1;
    for (let i = 1; i < thr.length; i++) if (pl.points >= thr[i]!) lvl = i + 1;
    const wasBelow4 = pl.level < 4;
    if (lvl > pl.level) {
      pl.level = Math.min(5, lvl);
      this.emit({ type: 'levelUp', player: p, level: pl.level });
    }
    if (wasBelow4 && pl.level >= 4 && pl.reserve.length) {
      this.emit({ type: 'reserveJoined', player: p, count: pl.reserve.length });
      pl.deck = this.shuffle(pl.deck.concat(pl.reserve));
      pl.reserve = [];
    }
    const defeat = this.s.config.defeatLassitude[p];
    if (pl.points >= defeat) this.endGame(opponentOf(p), 'lassitude');
  }

  endGame(winner: PlayerId, reason: string): void {
    if (this.s.over) return;
    this.s.over = { winner, reason };
    this.emit({ type: 'gameOver', winner, reason });
  }

  // ---------- Cartes ----------
  addToHand(p: PlayerId, cardId: string, opts: { generated?: boolean; levelFree?: boolean } = {}): void {
    this.player(p).hand.push({ uid: this.uid(), cardId, ...opts });
  }
  generate(p: PlayerId, cardId: string, source: string): void {
    this.addToHand(p, cardId, { generated: true });
    this.emit({ type: 'generated', player: p, cardId, source });
  }
  /** Pioche une carte ; pioche vide = défaite. Retourne false si la partie s'arrête. */
  draw(p: PlayerId, source: string): boolean {
    const pl = this.player(p);
    const cardId = pl.deck.shift();
    if (cardId === undefined) { this.endGame(opponentOf(p), 'emptyDeck'); return false; }
    this.addToHand(p, cardId);
    this.emit({ type: 'draw', player: p, cardId, source });
    return true;
  }
  discard(p: PlayerId, cardId: string): void { this.player(p).discard.push(cardId); }
  discardLeader(u: Unit): void {
    if (u.leader) this.discard(u.leaderOwner ?? u.controller, u.leader);
  }

  // ---------- Destruction ----------
  /**
   * Détruit un régiment et applique toutes les conséquences : lassitude, défausse,
   * perte de Moral des alliés (en cascade), gains de Moral déclenchés.
   */
  destroy(u: Unit, cause: 'end' | 'moral' | 'both' | 'effect', killer: Unit | null = null): void {
    const p = u.controller;
    const ref = this.slotOf(u.uid);
    if (!ref) return;
    this.setAt(ref, null);
    const def = card(u.cardId);
    const minion = u.keywords.includes('Minions');
    this.emit({ type: 'destroyed', player: p, uid: u.uid, cardId: u.cardId, cause, lassitude: minion ? 0 : u.niveau });
    if (!minion) this.gainLassitude(p, u.niveau, 'destroyed');
    if (!u.isToken) this.discard(p, u.cardId);
    this.discardLeader(u);
    const vital = this.s.config.mustSurvive[p];
    if (vital && vital === u.cardId) this.endGame(opponentOf(p), 'vitalDestroyed');

    for (const e of this.units(opponentOf(p))) {
      const g = card(e.cardId).onEnemyDeathMoral;
      if (g) this.heal(e, 0, g, e.cardId);
    }
    if (killer) {
      this.addMoralRaw(killer, 1);
      if (u.stunnedBy !== null && killer.types.includes('Elfe')) {
        this.addMoralRaw(killer, 2);
        const ranger = this.findUnit(u.stunnedBy);
        if (ranger) this.addMoralRaw(ranger, 2);
        this.emit({ type: 'effect', key: 'rangersBonus', player: killer.controller, cardId: killer.cardId });
      }
    }
    if (def.onDeathDraw) for (let i = 0; i < def.onDeathDraw && !this.over; i++) this.draw(p, u.cardId);
    if (this.over) return;

    const allies = this.units(p);
    for (const a of allies) {
      if (!minion) {
        const lost = this.loseMoral(a, 1);
        if (lost) this.emit({ type: 'moralLoss', uid: a.uid, cardId: a.cardId, amount: lost, source: 'allyDeath' });
      }
      const gain = card(a.cardId).onAllyDeathMoralGain;
      if (gain) this.addMoralRaw(a, gain);
      this.checkBroken(a);
    }
    if (!minion) {
      for (const a of allies.filter(x => x.currentMor <= 0)) {
        if (this.over) return;
        this.destroy(a, 'moral');
      }
    }
  }
}
