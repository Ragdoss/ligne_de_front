// Contexte d'exécution d'une action : une copie modifiable de l'état + la liste des événements produits.
// Toutes les règles « de base » partagées (unités, soins, Moral, lassitude, destructions, pioche) sont ici.

import { CARDS } from '../data/cards';
import { nextRandom } from './rng';
import type {
  CardDef, ChoiceKind, GameEvent, GameState, HandCard, PlayerId, PlayerState, SlotRef, Unit,
} from './types';

export const opponentOf = (p: PlayerId): PlayerId => (p === 'A' ? 'B' : 'A');

export function card(id: string): CardDef {
  const c = CARDS[id];
  if (!c) throw new Error(`Carte inconnue : ${id}`);
  return c;
}

/** Valeur cumulée d'un mot-clé chiffré (« Effrayant 2 », « Pénétration 5 »…) ; 0 s'il est absent. */
export function keywordValue(u: Unit, name: string): number {
  let v = 0;
  for (const k of u.keywords) if (k.startsWith(name + ' ')) v += parseInt(k.slice(name.length + 1), 10) || 0;
  return v;
}

/** Ajoute un mot-clé à un régiment. Les mots-clés chiffrés s'additionnent : X + Y = une seule entrée « Nom X+Y ». */
export function addKeyword(u: Unit, k: string): void {
  const m = /^(.+) (\d+)$/.exec(k);
  if (m) {
    const name = m[1]!;
    const i = u.keywords.findIndex(x => x.startsWith(name + ' ') && /^\d+$/.test(x.slice(name.length + 1)));
    if (i >= 0) { u.keywords[i] = `${name} ${keywordValue(u, name) + Number(m[2])}`; u.keywords = u.keywords.filter((x, j) => j === i || !x.startsWith(name + ' ')); return; }
  }
  if (!u.keywords.includes(k)) u.keywords.push(k);
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
  /** Voisins d'un emplacement : gauche-droite sur la même ligne, et devant-derrière (une case arrière touche les deux cases avant qui l'encadrent). */
  neighbors(ref: SlotRef): Unit[] {
    if (ref.zone === 'isole') return [];
    const b = this.player(ref.player).board;
    const out: (Unit | null | undefined)[] = [b[ref.zone][ref.idx - 1], b[ref.zone][ref.idx + 1]];
    if (ref.zone === 'avant') for (const k of this.adjBack(ref.idx)) out.push(b.arriere[k]);
    else for (const i of this.adjFront(ref.idx)) out.push(b.avant[i]);
    return out.filter((u): u is Unit => !!u);
  }
  /** Voisins gauche-droite sur la même ligne seulement (Formation). */
  rowNeighbors(ref: SlotRef): Unit[] {
    if (ref.zone === 'isole') return [];
    const row = this.player(ref.player).board[ref.zone];
    return [row[ref.idx - 1], row[ref.idx + 1]].filter((u): u is Unit => !!u);
  }
  /** Deux régiments distincts de `p` : l'un du type `a`, l'autre du type `b` (Communion, Alliance). */
  hasPair(p: PlayerId, a: string, b: string): boolean {
    const us = this.units(p);
    return us.some(x => x.types.includes(a) && us.some(y => y !== x && y.types.includes(b)));
  }
  /** Communion : un Elfe et un Élémentaux (deux régiments distincts) en jeu. */
  communion(p: PlayerId): boolean { return this.hasPair(p, 'Elfe', 'Élémentaux'); }
  /** Alliance d'une carte bicolore : un autre régiment de l'une de ses deux races en jeu. */
  allianceActive(u: Unit): boolean {
    const al = card(u.cardId).alliance as string[] | undefined;
    if (!al) return false;
    return this.units(u.controller).some(x => x !== u && al.some(t => x.types.includes(t)));
  }
  /** Case libre la plus proche pour `p` (même rangée d'abord, puis l'autre). */
  freeSlotNear(p: PlayerId, zone: 'avant' | 'arriere', idx: number): SlotRef | null {
    const b = this.player(p).board;
    for (const z of [zone, zone === 'avant' ? 'arriere' : 'avant'] as const) {
      let best = -1, dist = 99;
      b[z].forEach((x, i) => { if (!x && Math.abs(i - idx) < dist) { dist = Math.abs(i - idx); best = i; } });
      if (best >= 0) return { player: p, zone: z, idx: best };
    }
    return null;
  }
  /** Prise de contrôle d'un régiment (avant ou arrière) par `p` : `p` choisit la case où le poser (aucune case libre = défausse). */
  takeControl(u: Unit, p: PlayerId, temporary: boolean, source: string, fullMoral = false): void {
    if (u.controller === p || !this.isAlive(u)) return;
    this.queueChoice('placeControlled', p, source, { uid: u.uid, temporary: temporary ? 1 : 0, fullMoral: fullMoral ? 1 : 0 });
  }
  /** Pose le régiment pris dans la case choisie par son nouveau contrôleur. */
  placeControlled(u: Unit, p: PlayerId, dest: SlotRef, temporary: boolean, source: string): void {
    const from = this.slotOf(u.uid);
    if (!from || this.unitAt(dest)) return;
    const prev = u.controller;
    this.setAt(from, null);
    u.controller = p;
    if (temporary) u.borrowed = { owner: u.borrowed?.owner ?? prev };
    else { u.owner = u.borrowed?.owner ?? u.owner ?? prev; u.borrowed = null; }
    u.pactShield = null; u.squareArm = 0; u.squareOwner = null; u.stunned = false; u.guardOwner = null; u.rootedBy = null; u.markedBy = null; u.exposedTo = null;
    this.setAt(dest, u);
    this.emit({ type: 'effect', key: temporary ? 'controlTaken' : 'controlKept', player: p, cardId: source, data: { uid: u.uid, target: u.cardId } });
    this.emit({ type: 'moved', uid: u.uid, cardId: u.cardId, from, to: dest });
  }
  /** Régiment pris sans case libre : il part dans la défausse de son propriétaire. */
  discardControlled(u: Unit, p: PlayerId, source: string): void {
    const from = this.slotOf(u.uid);
    if (!from) return;
    this.setAt(from, null);
    if (!u.isToken) this.discard(u.borrowed?.owner ?? u.owner ?? u.controller, u.cardId);
    this.discardLeader(u);
    this.emit({ type: 'effect', key: 'controlDiscarded', player: p, cardId: source, data: { target: u.cardId } });
  }
  /** Fin du tour : les régiments empruntés retournent à leur propriétaire (case libre la plus proche, sinon en défausse). */
  returnBorrowed(): void {
    for (const p of ['A', 'B'] as PlayerId[]) {
      for (const u of this.units(p)) {
        if (!u.borrowed) continue;
        const owner = u.borrowed.owner;
        const from = this.slotOf(u.uid)!;
        u.borrowed = null;
        this.setAt(from, null);
        u.controller = owner;
        const dest = from.zone === 'isole' ? null : this.freeSlotNear(owner, from.zone, from.idx);
        if (dest) {
          this.setAt(dest, u);
          this.emit({ type: 'effect', key: 'controlReturned', player: owner, cardId: u.cardId, data: { uid: u.uid } });
          this.emit({ type: 'moved', uid: u.uid, cardId: u.cardId, from, to: dest });
        } else {
          if (!u.isToken) this.discard(owner, u.cardId);
          this.discardLeader(u);
          this.emit({ type: 'effect', key: 'controlLost', player: owner, cardId: u.cardId, data: { uid: u.uid } });
        }
      }
    }
  }
  /** Défausse les `n` cartes du dessus de la pioche de `p` (usure) ; s'arrête si la pioche est vide. */
  mill(p: PlayerId, n: number, source: string): number {
    const pl = this.player(p);
    let k = 0;
    for (; k < n && pl.deck.length && !this.over; k++) {
      const top = pl.deck.shift()!;
      this.discard(p, top);
      this.emit({ type: 'discarded', player: p, cardId: top, source });
      const d = card(top).drawWhenDiscarded as number | undefined;
      if (d) for (let i = 0; i < d && !this.over; i++) this.draw(p, top);
    }
    return k;
  }

  // ---------- Météo de scénario ----------
  /** Météo du tour `turn` (par défaut le tour en cours) : tempête, nuit, jour, ou rien. */
  weather(turn = this.s.turn): 'tempete' | 'nuit' | 'jour' | null {
    const w = this.s.scenario?.weather;
    if (!w) return null;
    const on = turn >= w.first && (turn - w.first) % w.every < w.duration;
    if (w.kind === 'tempete') return on ? 'tempete' : null;
    return on ? 'nuit' : 'jour';
  }
  /** Le régiment frappe-t-il à distance ce tour-ci (Tempête de Sable, tempête de scénario) ? */
  hasDistance(u: Unit): boolean {
    // Moral brisé : le régiment perd ses mots-clés (Distance comprise).
    if (u.brokenMorale || !u.keywords.includes('Distance') || u.blinded) return false;
    return !(this.weather() === 'tempete' && !u.types.includes('Nomade'));
  }
  /** Valeur d'Effrayant (cumulée : Effrayant X + Effrayant Y = Effrayant X+Y). */
  fear(u: Unit): number { return keywordValue(u, 'Effrayant'); }

  /** Aide de campagne : régiment vital du joueur aidé. */
  isEasedVital(u: Unit): boolean {
    const e = this.s.scenario?.ease;
    return !!e && e.helped === u.controller && this.s.config.mustSurvive[u.controller] === u.cardId;
  }
  makeUnit(cardId: string, controller: PlayerId, isToken = false): Unit {
    const c = card(cardId);
    const ease = this.s.scenario?.ease;
    const atkMul = ease && ease.weak === controller ? ease.atk : 1;
    const vital = !!ease && ease.helped === controller && this.s.config.mustSurvive[controller] === cardId;
    const endMul = vital ? ease!.vitalEnd : 1;
    const end = Math.round((c.end ?? 1) * endMul);
    return {
      uid: this.uid(),
      cardId,
      controller,
      types: (c.types ?? []).slice(),
      keywords: (c.keywords ?? []).slice(),
      niveau: c.niveau,
      baseAtk: Math.round((c.atk ?? 0) * atkMul),
      baseArm: (c.arm ?? 0) + (vital ? ease!.vitalArm : 0),
      ini: c.ini ?? 0,
      maxEnd: end,
      currentEnd: end,
      maxMor: (c.mor ?? 1) + (vital ? ease!.vitalMor : 0),
      currentMor: (c.startMor ?? c.mor ?? 1) + (vital ? ease!.vitalMor : 0),
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
      pactShield: null, woundedByFrondeur: false,
    };
  }

  // ---------- Statistiques effectives ----------
  effectiveAtk(u: Unit): number {
    const ratio = 0.5 + 0.5 * (u.currentEnd / u.maxEnd);
    let atk = u.baseAtk * ratio;
    if (u.justDeployed && !u.arrivesReady) atk *= 0.5;
    if (u.leader && !u.brokenMorale) {
      const l = card(u.leader);
      atk += l.bonusAtk ?? 0;
      // Abîme Grandissant : +X ATK par tranche de lassitude de son contrôleur.
      const step = l.lassitudeStep as number | undefined, per = l.atkPerLassitudeStep as number | undefined;
      if (step && per) atk += Math.floor(this.player(u.controller).points / step) * per;
    }
    // Bonus des tactiques (ce tour-ci) : ils s'appliquent même au Moral brisé.
    atk += u.tempAtk;
    if (!u.brokenMorale) {
      // Prêtresse des saisons : Communion.
      const cb = u.leader ? card(u.leader).communionBonus as { atk?: number } | undefined : undefined;
      if (cb?.atk && this.communion(u.controller)) atk += cb.atk;
      // Gardes du drapeau : Formation, +ATK aux voisins Empire sur la ligne.
      if (u.types.includes('Empire')) {
        const ref = this.slotOf(u.uid);
        if (ref) for (const n of this.rowNeighbors(ref)) if (!n.brokenMorale) atk += (card(n.cardId).formationAtkToNeighbors as number | undefined) ?? 0;
      }
      atk += this.wave2bAtk(u);
    }
    if (this.weather() === 'nuit' && u.types.includes('Démon')) atk += 10;
    atk -= u.tempDebuffAtk;
    return Math.max(0, Math.round(atk));
  }
  effectiveArm(u: Unit): number {
    let arm = u.baseArm;
    if (u.leader && !u.brokenMorale) {
      arm += card(u.leader).bonusArm ?? 0;
      arm += card(u.cardId).armBonusWithLeader ?? 0;
    }
    // Bonus des tactiques (À couvert, Formation en carré, Dernier carré…) : ils s'appliquent même au Moral brisé.
    arm += u.squareArm + u.tempArm;
    if (!u.brokenMorale) {
      const d = card(u.cardId);
      const ref = (d.formationArmPerEmpireNeighbor || u.types.includes('Empire')) ? this.slotOf(u.uid) : null;
      if (ref) {
        const row = this.rowNeighbors(ref);
        // Hallebardiers en ligne : +ARM par voisin Empire.
        const per = d.formationArmPerEmpireNeighbor as number | undefined;
        if (per) arm += per * row.filter(n => n.types.includes('Empire')).length;
        // Colonel de la Ligne : +ARM aux régiments Empire voisins de son porteur.
        if (u.types.includes('Empire')) for (const n of row) if (n.leader && !n.brokenMorale) arm += (card(n.leader).leaderFormationArm as number | undefined) ?? 0;
      }
      // Garde-frontière sylvestre : Alliance.
      const al = d.allianceArm as number | undefined;
      if (al && this.allianceActive(u)) arm += al;
      arm += this.wave2bArm(u);
    }
    return arm;
  }
  /** Vague 2 (suite) : bonus d'ATK de Formation et d'aura. */
  wave2bAtk(u: Unit): number {
    const d = card(u.cardId);
    const ref = this.slotOf(u.uid);
    let atk = 0;
    const row = ref && ref.zone !== 'isole' ? this.rowNeighbors(ref) : [];
    const mounted = d.formationAtkIfMountedNeighbor as number | undefined; // Écuyers de la Garde
    if (mounted && row.some(n => n.types.includes('Monté'))) atk += mounted;
    const perEmp = d.formationAtkPerEmpireNeighbor as number | undefined; // Arbalétriers en rang
    if (perEmp) atk += perEmp * row.filter(n => n.types.includes('Empire')).length;
    for (const n of row) if (n.leader && !n.brokenMorale) atk += (card(n.leader).leaderFormationAtk as number | undefined) ?? 0; // Connétable
    if (u.leader) for (const x of this.units(u.controller)) if (!x.brokenMorale) atk += (card(x.cardId).auraLeaderCarriers as number | undefined) ?? 0; // Impératrice
    const perBroken = d.atkPerBrokenOnBoard as number | undefined; // Bourreau de l'Abîme
    if (perBroken) atk += perBroken * [...this.units('A'), ...this.units('B')].filter(x => x.uid !== u.uid && x.brokenMorale).length;
    return atk;
  }
  /** Vague 2 (suite) : bonus d'ARM de Formation et d'aura. */
  wave2bArm(u: Unit): number {
    const d = card(u.cardId);
    const ref = this.slotOf(u.uid);
    let arm = 0;
    const two = d.armIfTwoRowNeighbors as number | undefined; // Lanciers du rempart
    if (two && ref && ref.zone !== 'isole' && this.rowNeighbors(ref).length >= 2) arm += two;
    const human = d.armIfHumanNeighbor as number | undefined; // Milice de village
    if (human && ref && this.neighbors(ref).some(n => n.types.includes('Humain'))) arm += human;
    if (u.leader) for (const x of this.units(u.controller)) if (!x.brokenMorale) arm += (card(x.cardId).auraLeaderCarriers as number | undefined) ?? 0; // Impératrice
    const iso = this.player(u.controller).board.isole; // Sentinelles de l'oasis
    if (iso && !iso.brokenMorale && u.types.includes('Nomade')) arm += (card(iso.cardId).auraNomadeArm as number | undefined) ?? 0;
    return arm;
  }
  effectiveIni(u: Unit): number {
    let ini = u.ini;
    if (u.leader && !u.brokenMorale) {
      ini += card(u.leader).bonusIni ?? 0;
      const cb = card(u.leader).communionBonus as { ini?: number } | undefined;
      if (cb?.ini && this.communion(u.controller)) ini += cb.ini;
    }
    const w = this.weather();
    if (w === 'tempete' && !u.types.includes('Nomade')) ini -= 20;
    if (w === 'jour' && u.types.includes('Elfe')) ini += 15;
    return ini + u.tempIni;
  }

  // ---------- Moral ----------
  checkBroken(u: Unit): void {
    if (!u.brokenMorale && u.currentMor <= Math.floor(u.maxMor / 3)) {
      u.brokenMorale = true;
      this.tryLiberate(u);
    }
  }
  /** Libération (scénario) : un régiment désigné dont le Moral se brise change de camp, Moral plein. */
  tryLiberate(u: Unit): void {
    const lib = this.s.config.liberation;
    if (!lib || u.controller !== lib.pid || !lib.cardIds.includes(u.cardId) || u.currentMor <= 0 || u.currentEnd <= 0) return;
    const ref = this.slotOf(u.uid);
    if (!ref || ref.zone === 'isole') return;
    const q = opponentOf(u.controller);
    const board = this.player(q).board;
    const free = (zone: 'avant' | 'arriere') => {
      let best = -1, dist = 99;
      board[zone].forEach((x, i) => { if (!x && Math.abs(i - ref.idx) < dist) { dist = Math.abs(i - ref.idx); best = i; } });
      return best;
    };
    let zone: 'avant' | 'arriere' = ref.zone, idx = free(zone);
    if (idx < 0) { zone = zone === 'avant' ? 'arriere' : 'avant'; idx = free(zone); }
    if (idx < 0) return;
    this.setAt(ref, null);
    this.discardLeader(u);
    u.leader = null; u.leaderOwner = null;
    u.controller = q;
    u.currentMor = u.maxMor; u.brokenMorale = false;
    u.justDeployed = true; u.stunned = false; u.pactShield = null;
    board[zone][idx] = u;
    if (this.s.scenario) this.s.scenario.liberated = (this.s.scenario.liberated ?? 0) + 1;
    this.emit({ type: 'effect', key: 'liberated', player: q, cardId: u.cardId });
    this.emit({ type: 'moved', uid: u.uid, cardId: u.cardId, from: ref, to: { player: q, zone, idx } });
  }
  /** Retire du Moral ; retourne la perte réellement appliquée (plancher du Chevalier Templier). */
  loseMoral(u: Unit, amount: number): number {
    if (amount <= 0) return 0;
    if (u.pactShield) { // Pacte de Survie : la perte devient 1 point de lassitude pour le lanceur
      this.emit({ type: 'effect', key: 'pactMoral', player: u.pactShield.owner, cardId: 'pacte_survie', data: { uid: u.uid } });
      this.gainLassitude(u.pactShield.owner, 1, 'pacte_survie');
      return 0;
    }
    const before = u.currentMor;
    let after = Math.max(0, before - amount);
    const floor = card(u.cardId).moralFloorWithLeader;
    if (u.leader && floor && before >= floor) after = Math.max(floor, after);
    const lf = u.leader ? card(u.leader).leaderMoralFloor as number | undefined : undefined; // Inquisiteur déchu
    if (lf && before >= lf) after = Math.max(lf, after);
    u.currentMor = after;
    return before - after;
  }
  /** Gain de Moral « brut » (plafonné), sans lever l'état Moral brisé (cas du tueur). */
  addMoralRaw(u: Unit, n: number): void {
    const b = u.currentMor;
    u.currentMor = Math.min(u.maxMor, u.currentMor + n);
    this.dryadBonus(u, 0, u.currentMor - b);
  }
  /** Dryade corrompue : chaque gain d'END ou de Moral d'un allié fait aussi baisser la lassitude (1 par tranche de 20 END, 1 par point de Moral). */
  private dryadBonus(u: Unit, gEnd: number, gMor: number): void {
    if (gEnd <= 0 && gMor <= 0) return;
    const dry = this.units(u.controller).find(x => card(x.cardId).healsAlsoLowerLassitude);
    if (!dry) return;
    const step = card(dry.cardId).healsAlsoLowerLassitude as number;
    const pl = this.player(u.controller);
    pl.dryadAcc = (pl.dryadAcc ?? 0) + gEnd;
    const g = Math.floor(pl.dryadAcc / step) + gMor;
    pl.dryadAcc %= step;
    if (g > 0) { this.emit({ type: 'effect', key: 'dryade', player: u.controller, cardId: dry.cardId, data: { uid: u.uid } }); this.loseLassitude(u.controller, g, dry.cardId); }
  }

  heal(u: Unit, end: number, mor: number, source: string): { end: number; mor: number } {
    let gEnd = 0, gMor = 0;
    if (end > 0) { const b = u.currentEnd; u.currentEnd = Math.min(u.maxEnd, b + end); gEnd = u.currentEnd - b; }
    if (mor > 0) {
      const b = u.currentMor; u.currentMor = Math.min(u.maxMor, b + mor); gMor = u.currentMor - b;
      if (u.brokenMorale && u.currentMor > Math.floor(u.maxMor / 3)) u.brokenMorale = false;
    }
    if (gEnd || gMor) this.emit({ type: 'heal', uid: u.uid, cardId: u.cardId, end: gEnd, mor: gMor, source });
    this.dryadBonus(u, gEnd, gMor);
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
    // Cérémonie du Déclin : chaque exemplaire en jeu rapporte autant de ressources que de lassitude gagnée.
    const ceremonies = this.units(p).filter(u => card(u.cardId).resourceOnLassitudeGain).length;
    if (ceremonies) {
      pl.resource += n * ceremonies;
      this.emit({ type: 'resource', player: p, amount: n * ceremonies, source: 'ceremonie_declin' });
    }
    this.checkLevel(p);
    // Maître des pactes : la première lassitude gagnée par l'effet d'une carte, à chaque tour, fait piocher.
    if (!this.over && !['destroyed', 'moralCheck', 'scenario'].includes(source)) {
      for (const x of this.units(p)) {
        const v = card(x.cardId).atkOnCardLassitude as number | undefined; // Sorcière du pacte
        if (v && !x.brokenMorale) x.tempAtk += v;
      }
      const marker = this.s.turn * 2 + (this.s.active === 'A' ? 0 : 1);
      const pact = this.units(p).find(x => x.leader && !x.brokenMorale && card(x.leader).drawOnFirstCardLassitude);
      if (pact && pl.pactDrawnAt !== marker) {
        pl.pactDrawnAt = marker;
        this.draw(p, pact.leader!);
      }
    }
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
  addToHand(p: PlayerId, cardId: string, opts: Omit<HandCard, 'uid' | 'cardId'> = {}): HandCard {
    const h: HandCard = { uid: this.uid(), cardId, ...opts };
    this.player(p).hand.push(h);
    return h;
  }
  generate(p: PlayerId, cardId: string, source: string): void {
    this.addToHand(p, cardId, { generated: true });
    this.emit({ type: 'generated', player: p, cardId, source });
  }
  /** La pioche vide fait-elle perdre ce joueur ? (réglage de scénario, global ou par joueur) */
  emptyDeckLoses(p: PlayerId): boolean {
    const e = this.s.config.emptyDeckDefeat;
    if (e === undefined || e === true) return true;
    if (e === false) return false;
    return e[p] ?? true;
  }
  /** Pioche une carte ; pioche vide = défaite. Retourne false si la partie s'arrête. */
  draw(p: PlayerId, source: string): boolean {
    const pl = this.player(p);
    const cardId = pl.deck.shift();
    if (cardId === undefined) {
      if (!this.emptyDeckLoses(p)) return true;
      this.endGame(opponentOf(p), 'emptyDeck'); return false;
    }
    this.deliverDrawn(p, cardId, source);
    return !this.over;
  }
  /** Une carte retirée du deck rejoint la main… sauf si un Saboteur Nomade adverse l'intercepte. */
  deliverDrawn(p: PlayerId, cardId: string, source: string): void {
    const sab = this.units(opponentOf(p)).find(u => card(u.cardId).interceptsEnemyDraws);
    if (!sab) {
      this.addToHand(p, cardId);
      this.emit({ type: 'draw', player: p, cardId, source });
      return;
    }
    this.discard(p, cardId);
    const cost = card(cardId).cout;
    sab.currentMor -= cost;
    this.emit({ type: 'intercepted', player: p, cardId, saboteur: sab.uid, moralLoss: cost });
    if (sab.currentMor <= 0) {
      const compensate = sab.currentMor < -1;
      this.destroy(sab, 'moral');
      if (compensate && !this.over && this.player(p).deck.length) this.draw(p, 'saboteur_nomade');
    }
  }
  /**
   * Une carte arrive dans la défausse de `p`. Si c'est une Tactique que `p` n'a pas jouée lui-même et que
   * l'adversaire contrôle des Archéotacticiens, l'adversaire en reçoit une copie gratuite.
   */
  discard(p: PlayerId, cardId: string, playedByOwner = false): void {
    const pl = this.player(p);
    pl.discard.push(cardId);
    pl.discardedThisTurn = (pl.discardedThisTurn ?? 0) + 1;
    if (card(cardId).cardType !== 'Tactique' || playedByOwner) return;
    const q = opponentOf(p);
    if (this.units(q).some(u => card(u.cardId).grantsFreeTacticCopyOnEnemyDiscard)) {
      this.addToHand(q, cardId, { generated: true, freeCopy: true });
      this.emit({ type: 'freeCopy', player: q, cardId });
    }
  }
  /** Défausse une carte précise de la main (défausse forcée). */
  discardFromHand(p: PlayerId, handUid: number, source: string): string | null {
    const pl = this.player(p);
    const i = pl.hand.findIndex(h => h.uid === handUid);
    if (i === -1) return null;
    const h = pl.hand.splice(i, 1)[0]!;
    if (!h.generated) this.discard(p, h.cardId);
    this.emit({ type: 'discarded', player: p, cardId: h.cardId, source });
    // Ravitailleur : défaussé de la main, il fait piocher.
    const dw = card(h.cardId).drawWhenDiscarded as number | undefined;
    if (dw) for (let i = 0; i < dw && !this.over; i++) this.draw(p, h.cardId);
    // Cheikh des Dunes : chaque défausse adverse renforce son porteur.
    for (const u of this.units(opponentOf(p))) {
      const g = u.leader ? card(u.leader).atkPerEnemyDiscard as number | undefined : undefined;
      if (g) { u.baseAtk += g; this.emit({ type: 'effect', key: 'cheikh', player: u.controller, cardId: u.leader!, data: { uid: u.uid } }); }
    }
    return h.cardId;
  }
  discardLeader(u: Unit): void {
    if (u.leader) this.discard(u.leaderOwner ?? u.controller, u.leader);
  }
  /** Ajoute un choix à la file d'attente (ses options sont calculées quand il devient actif). */
  queueChoice(kind: ChoiceKind, player: PlayerId, source: string, data: Record<string, number | string | null> = {}): void {
    this.s.pending.push({ kind, player, source, options: null, data });
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
    // Racines protectrices, Bénédiction de la sylve : le régiment tient (pas contre un sacrifice).
    if (cause !== 'effect') {
      const blessed = !!u.leader && !!card(u.leader).leaderSavesOnce;
      if (u.guardOwner || blessed) {
        u.currentEnd = Math.max(1, u.currentEnd);
        u.currentMor = Math.max(1, u.currentMor);
        this.checkBroken(u);
        const source = u.guardOwner ? 'racines_protectrices' : u.leader!;
        if (!u.guardOwner) { this.discardLeader(u); u.leader = null; u.leaderOwner = null; }
        this.emit({ type: 'effect', key: 'saved', player: p, cardId: source, data: { uid: u.uid, target: u.cardId } });
        return;
      }
    }
    this.setAt(ref, null);
    const def = card(u.cardId);
    const minion = u.keywords.includes('Minions');
    // Seigneure de la chasse : un régiment adverse au Moral brisé détruit coûte de la lassitude à son camp.
    if (u.brokenMorale && !minion) {
      const lv = this.units(opponentOf(p)).reduce((n, x) => n + (x.brokenMorale ? 0 : ((card(x.cardId).brokenEnemyDeathLassitude as number | undefined) ?? 0)), 0);
      if (lv) { this.emit({ type: 'effect', key: 'seigneureChasse', player: opponentOf(p), cardId: 'seigneure_chasse', data: { target: u.cardId } }); this.gainLassitude(p, lv, 'seigneure_chasse'); if (this.over) return; }
    }
    this.emit({ type: 'destroyed', player: p, uid: u.uid, cardId: u.cardId, cause, lassitude: minion ? 0 : u.niveau });
    if (!minion) this.gainLassitude(p, u.niveau, 'destroyed');
    if (!u.isToken) this.discard(u.borrowed?.owner ?? u.owner ?? p, u.cardId); // un régiment volé retourne dans la défausse de son propriétaire
    this.discardLeader(u);
    // Suppôt Infernal : le porteur détruit permet de récupérer une copie d'un Démon de la défausse.
    if (u.leader && card(u.leader).recoversDemonOnCarrierDeath) this.queueChoice('recoverDemon', p, u.leader);
    const vital = this.s.config.mustSurvive[p];
    if (vital && vital === u.cardId) this.endGame(opponentOf(p), 'vitalDestroyed');
    // Alarme de scénario : la première perte de `pid` donne l'alarme (renforts au début de son prochain tour).
    const sc = this.s.scenario;
    if (sc?.alarm && sc.alarm.pid === p && !sc.alarmRaised && !this.s.over) {
      sc.alarmRaised = true;
      this.emit({ type: 'effect', key: 'alarm', player: p, cardId: u.cardId });
    }

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
    const oppDraws = def.onDeathOpponentDraws as number | undefined;
    if (oppDraws) for (let i = 0; i < oppDraws && !this.over; i++) this.draw(opponentOf(p), u.cardId);
    // Frondeur Nomade : une cible qu'il a blessée ce tour-ci et qui meurt fait défausser le dessus du deck.
    if (u.woundedByFrondeur && !minion && !this.over) {
      const top = this.player(p).deck.shift();
      if (top) { this.discard(p, top); this.emit({ type: 'discarded', player: p, cardId: top, source: 'frondeur_nomade' }); }
    }
    // Danseurs de sable : à sa mort, l'adversaire défausse le dessus de sa pioche.
    const om = def.onDeathOpponentMill as number | undefined;
    if (om && !this.over) this.mill(opponentOf(p), om, u.cardId);
    // Voleurs de provisions : chaque régiment allié détruit fait défausser le dessus de la pioche adverse.
    let thieves = this.units(p).reduce((n, x) => n + ((card(x.cardId).millOnAllyDeath as number | undefined) ?? 0), 0) + ((def.millOnAllyDeath as number | undefined) ?? 0);
    if (thieves && card('voleurs_provisions').millOnAllyDeathNoStack) thieves = Math.min(thieves, (card('voleurs_provisions').millOnAllyDeath as number | undefined) ?? 1); // plusieurs Voleurs ne se cumulent pas
    if (thieves && !this.over) this.mill(opponentOf(p), thieves, 'voleurs_provisions');
    // Démon d'Akantha : se soigne quand un ennemi meurt de son Moral.
    if (cause === 'moral' && !this.over) {
      for (const e of this.units(opponentOf(p))) {
        const h = card(e.cardId).onEnemyMoralDeathHeal as number | undefined;
        if (h) this.heal(e, h, 0, e.cardId);
      }
    }
    if (this.over) return;

    const allies = this.units(p);
    for (const a of allies) {
      const steady = (!!a.leader && !a.brokenMorale && !!card(a.leader).leaderNoAllyDeathMoralLoss) || !!a.steadyOwner; // Acolyte Damné, Dernier carré
      if (!minion && !steady) {
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
