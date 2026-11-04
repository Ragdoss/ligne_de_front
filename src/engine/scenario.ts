// Règles de scénario prises en charge par le moteur : mise en place, événements de début de tour,
// convoi, ressources gagnées en perdant la comparaison de Moral. Les textes et récompenses vivent dans src/campaign.

import { Ctx } from './ctx';
import type { DialogLine, PlayerId, ScenarioEvent, ScenarioSetup } from './types';

/** Place les régiments de départ, la main de départ et les niveaux imposés par le scénario. */
export function applyScenarioStart(ctx: Ctx, sc: ScenarioSetup): void {
  for (const p of ['A', 'B'] as PlayerId[]) {
    const pl = ctx.player(p);
    const lvl = sc.startLevel?.[p];
    if (lvl) { pl.level = Math.max(pl.level, lvl); pl.resource = pl.level; }
    pl.resource += sc.startResource?.[p] ?? 0;
    for (let i = 0; i < (sc.startDraw?.[p] ?? 0) && !ctx.over; i++) ctx.draw(p, 'campagne');
    for (const zone of ['avant', 'arriere'] as const) {
      for (const [idx, cardId] of Object.entries(sc.start?.[p]?.[zone] ?? {})) {
        const u = ctx.makeUnit(cardId, p, cardId === 'palissade_regiment');
        u.justDeployed = false;
        const ov = sc.startOverrides?.[cardId];
        if (ov?.mor !== undefined) { u.maxMor = ov.mor; u.currentMor = ov.mor; }
        pl.board[zone][Number(idx)] = u;
      }
    }
    const iso = sc.start?.[p]?.isole;
    if (iso) { const u = ctx.makeUnit(iso, p); u.justDeployed = false; pl.board.isole = u; }
    for (const cardId of sc.startHand?.[p] ?? []) ctx.addToHand(p, cardId, { generated: true });
    if (sc.leaderSeal?.[p]) pl.leaderSeal = true;
    if (sc.tacticDrawEvery?.[p]) pl.tacticDrawEvery = sc.tacticDrawEvery[p];
    if (sc.huntArrow?.[p]) pl.huntArrow = true;
    if (sc.preyKillEnd?.[p]) pl.preyKillEnd = sc.preyKillEnd[p];
    // Roguelite : lassitude gardée du combat précédent ; on commence au niveau correspondant.
    const lass = sc.startLassitude?.[p];
    if (lass) { pl.points = lass; ctx.checkLevel(p); pl.resource = Math.max(pl.resource, pl.level + (sc.startResource?.[p] ?? 0)); }
  }
  if (sc.fragments) spawnFragments(ctx); // Fragments de réalité : le premier est déjà là
}

/** Début du tour de `p` : avancée du convoi, puis événements prévus pour ce tour et ce joueur. */
export function scenarioTurnStart(ctx: Ctx, p: PlayerId): void {
  const sc = ctx.s.scenario;
  if (!sc || ctx.over) return;
  moveConvoy(ctx, p);
  if (ctx.over) return;
  glissement(ctx, p);
  if (ctx.over) return;
  if (sc.fragments?.pid === p) spawnFragments(ctx);
  if (sc.fracture?.victim === p) ctx.emit({ type: 'effect', key: ctx.fractured(p) ? 'fracture' : 'stable', player: p, cardId: '' });
  // Flèche de chasse : sans Proie désignée, le régiment adverse au Moral le plus bas devient la Proie.
  if (ctx.player(p).huntArrow) {
    const foes = ctx.units(p === 'A' ? 'B' : 'A').filter(u => ctx.slotOf(u.uid)?.zone !== 'isole');
    if (foes.length && !foes.some(u => u.prey === p)) ctx.setPrey(p, foes.reduce((a, b) => (b.currentMor < a.currentMor ? b : a)), 'fleche_chasse');
  }
  // Météo : annoncée au début du tour de A quand elle change.
  if (sc.weather && p === 'A') {
    const now = ctx.weather(), before = ctx.s.turn > 1 ? ctx.weather(ctx.s.turn - 1) : null;
    if (now !== before) ctx.emit({ type: 'effect', key: 'weather', player: p, cardId: '', data: { kind: now } });
  }
  // Alarme : donnée au tour prévu, renforts au début du tour de `pid` qui suit l'alarme.
  const al = sc.alarm;
  if (al && al.pid === p && !sc.alarmDone) {
    if (!sc.alarmRaised && ctx.s.turn >= al.turn) { sc.alarmRaised = true; ctx.emit({ type: 'effect', key: 'alarm', player: p, cardId: '' }); }
    if (sc.alarmRaised) {
      sc.alarmDone = true;
      runEvent(ctx, { turn: ctx.s.turn, pid: p, resource: al.resource, spawn: al.spawn, dialog: al.dialog });
      if (ctx.over) return;
    }
  }
  for (const ev of sc.events) {
    if (ev.turn !== ctx.s.turn || ev.pid !== p) continue;
    const key = `${ev.turn}${ev.pid}`;
    if (sc.fired.includes(key)) continue;
    sc.fired.push(key);
    runEvent(ctx, ev);
    if (ctx.over) return;
  }
}

/** Fragments de réalité : complète jusqu'au maximum, un par tour, sur une case libre au hasard. */
export function spawnFragments(ctx: Ctx): void {
  const f = ctx.s.scenario?.fragments;
  if (!f) return;
  const pl = ctx.player(f.pid);
  if (ctx.units(f.pid).filter(u => u.cardId === f.cardId).length >= f.max) return;
  const free: { zone: 'avant' | 'arriere'; idx: number }[] = [];
  for (const zone of ['avant', 'arriere'] as const) pl.board[zone].forEach((u, idx) => { if (!u) free.push({ zone, idx }); });
  if (!free.length) return;
  const at = free[ctx.randomInt(free.length)]!;
  const u = ctx.makeUnit(f.cardId, f.pid, true);
  u.justDeployed = false;
  pl.board[at.zone][at.idx] = u;
  ctx.emit({ type: 'effect', key: 'fragment', player: f.pid, cardId: f.cardId, data: { zone: at.zone, idx: at.idx } });
}

/** Titan du Glissement : au début du tour adverse, les régiments de la victime glissent d'une case vers la droite. */
function glissement(ctx: Ctx, p: PlayerId): void {
  const g = ctx.s.scenario?.glissement;
  if (!g) return;
  const sc = ctx.s.scenario!;
  const pl = ctx.player(g.victim);
  if (p === g.victim) {
    if (!pl.hand.some(h => h.cardId === g.tactic)) ctx.generate(p, g.tactic, 'glissement');
    return;
  }
  if (sc.holdGround) { sc.holdGround = false; ctx.emit({ type: 'effect', key: 'holdGround', player: g.victim, cardId: g.tactic }); return; }
  ctx.emit({ type: 'effect', key: 'glissement', player: g.victim, cardId: '' });
  for (const zone of ['avant', 'arriere'] as const) {
    const row = pl.board[zone];
    const last = row[row.length - 1];
    if (last) { ctx.destroy(last, 'effect'); if (ctx.over) return; }
    for (let i = row.length - 1; i > 0; i--) {
      const u = row[i - 1];
      row[i] = u ?? null; row[i - 1] = null;
      if (u) ctx.emit({ type: 'moved', uid: u.uid, cardId: u.cardId, from: { player: g.victim, zone, idx: i - 1 }, to: { player: g.victim, zone, idx: i } });
    }
  }
}

function runEvent(ctx: Ctx, ev: ScenarioEvent): void {
  const p = ev.pid;
  const pl = ctx.player(p);
  if (ev.lassitude) ctx.gainLassitude(p, ev.lassitude, 'scenario');
  if (ev.resource) {
    pl.resource += ev.resource;
    ctx.emit({ type: 'resource', player: p, amount: ev.resource, source: 'scenario' });
  }
  for (const sp of ev.spawn ?? []) {
    const row = pl.board[sp.zone];
    let idx = sp.idx;
    if (row[idx]) { // case occupée : la case libre la plus proche de la même rangée
      let best = -1, dist = 99;
      row.forEach((u, i) => { if (!u && Math.abs(i - sp.idx) < dist) { dist = Math.abs(i - sp.idx); best = i; } });
      idx = best;
    }
    if (idx < 0) continue;
    const u = ctx.makeUnit(sp.cardId, p, true);
    u.justDeployed = false;
    row[idx] = u;
    ctx.emit({ type: 'deployed', player: p, uid: u.uid, cardId: u.cardId, slot: { player: p, zone: sp.zone, idx } });
  }
  for (const cardId of ev.giveCards ?? []) {
    ctx.addToHand(p, cardId, { generated: true, levelFree: !!ev.levelFree });
    ctx.emit({ type: 'generated', player: p, cardId, source: 'scenario' });
  }
  if (ev.dialog?.length) ctx.emit({ type: 'dialog', lines: ev.dialog });
}

function moveConvoy(ctx: Ctx, p: PlayerId): void {
  const sc = ctx.s.scenario!;
  const cv = sc.convoy;
  if (!cv || cv.pid !== p) return;
  const t = ctx.s.turn;
  if (t < cv.firstTurn || (t - cv.firstTurn) % cv.every !== 0) return;
  if (sc.convoyHold > 0) {
    sc.convoyHold--;
    ctx.emit({ type: 'effect', key: 'convoyHalt', player: p, cardId: cv.cardId });
    return;
  }
  const row = ctx.player(p).board.arriere;
  const from = row.findIndex(u => u?.cardId === cv.cardId);
  if (from === -1) return;
  const convoy = row[from]!;
  const to = from + 1;
  if (to >= row.length) {
    row[from] = null;
    ctx.emit({ type: 'effect', key: 'convoyArrived', player: p, cardId: cv.cardId });
    ctx.endGame(p, 'convoyArrived');
    return;
  }
  const other = row[to] ?? null;
  row[to] = convoy;
  row[from] = other;
  ctx.emit({ type: 'moved', uid: convoy.uid, cardId: convoy.cardId, from: { player: p, zone: 'arriere', idx: from }, to: { player: p, zone: 'arriere', idx: to } });
  if (other) ctx.emit({ type: 'moved', uid: other.uid, cardId: other.cardId, from: { player: p, zone: 'arriere', idx: to }, to: { player: p, zone: 'arriere', idx: from } });
}

/** Le perdant de la comparaison de Moral gagne des ressources (scénario 2). */
export function scenarioMoralCheckLost(ctx: Ctx, loser: PlayerId): void {
  const cfg = ctx.s.scenario?.moralCheckLostResource?.[loser];
  if (!cfg || ctx.over) return;
  const pl = ctx.player(loser);
  const gain = pl.level >= 3 ? cfg.level3 : cfg.base;
  pl.resource += gain;
  ctx.emit({ type: 'resource', player: loser, amount: gain, source: 'scenario' });
}

