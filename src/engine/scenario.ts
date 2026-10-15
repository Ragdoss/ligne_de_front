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
  }
}

/** Début du tour de `p` : avancée du convoi, puis événements prévus pour ce tour et ce joueur. */
export function scenarioTurnStart(ctx: Ctx, p: PlayerId): void {
  const sc = ctx.s.scenario;
  if (!sc || ctx.over) return;
  moveConvoy(ctx, p);
  if (ctx.over) return;
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

