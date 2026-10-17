// Fin de tour (combat, contrôles de défaite) et début du tour suivant (ressources, effets, pioche).

import { resolveCombat } from './combat';
import { Ctx, card, opponentOf } from './ctx';
import { scenarioTurnStart } from './scenario';
import type { PlayerId } from './types';

/** Cartes piochées en début de tour selon le niveau : 1 / 1 / 2 / 2 / 3. */
export function drawCountFor(level: number): number {
  return level >= 5 ? 3 : level >= 3 ? 2 : 1;
}

export function endTurn(ctx: Ctx): void {
  const ending = ctx.s.active;
  // Copies gratuites d'Archéotacticiens non jouées : détruites en fin de tour.
  const pl = ctx.player(ending);
  pl.hand = pl.hand.filter(h => !h.freeCopy);
  resolveCombat(ctx, ending);
  if (ctx.over) return;
  // Prise de contrôle temporaire : les régiments empruntés retournent à leur propriétaire.
  ctx.returnBorrowed();

  const extra = ctx.s.config.endTurnLassitude[ending];
  if (extra) ctx.gainLassitude(ending, extra, 'scenario');
  if (ctx.over) return;

  if (ctx.units(ending).length === 0 && ctx.s.turn >= ctx.s.config.noRegimentDefeatFromTurn[ending]) {
    ctx.endGame(opponentOf(ending), 'noRegiment');
    return;
  }

  const next = opponentOf(ending);
  ctx.s.active = next;
  if (ending === 'B') {
    ctx.s.turn++;
    // « Tenir jusqu'au tour X » : victoire dès que ce tour commence.
    const w = ctx.s.config.winAtTurn;
    for (const p of ['A', 'B'] as PlayerId[]) {
      if (w?.[p] && ctx.s.turn >= w[p]!) { ctx.endGame(p, 'survived'); return; }
    }
  }
  startTurn(ctx, next);
}

export function startTurn(ctx: Ctx, p: PlayerId): void {
  const pl = ctx.player(p);
  const q = opponentOf(p);
  pl.tacticsThisTurn = 0;
  pl.discardedThisTurn = 0;
  ctx.player(q).discardedThisTurn = 0;
  // Formation en Carré : prend fin au début du tour de son lanceur.
  for (const q of ['A', 'B'] as PlayerId[]) {
    for (const u of ctx.units(q)) {
      if (u.squareOwner === p) { u.squareArm = 0; u.squareOwner = null; }
      if (u.guardOwner === p) u.guardOwner = null; // Racines protectrices : jusqu'au prochain tour du lanceur
      if (u.stunHold === p) u.stunHold = null; // Chaînes de l'Abîme (Offrande)
      if (u.steadyOwner === p) u.steadyOwner = null; // Dernier carré
      if (u.pactShield?.owner === p) u.pactShield = null; // Pacte de Survie : fin au début du tour du lanceur
    }
  }

  // Ressource : niveau + reliquat du tour précédent.
  const leftover = pl.resource;
  pl.resource = pl.level + leftover;
  let peasants = 0;
  for (const u of ctx.units(p)) if (u.keywords.includes('GenerateurRessource')) peasants += pl.level >= 4 ? 2 : 1;
  if (peasants) { pl.resource += peasants; ctx.emit({ type: 'resource', player: p, amount: peasants, source: 'paysans' }); }

  // Œuf de Dragon : éclot après quelques tours de son contrôleur.
  for (const u of ctx.units(p)) {
    const d = card(u.cardId);
    const into = d.hatchesInto as string | undefined;
    if (!into) continue;
    u.counter = (u.counter ?? 0) + 1;
    if (u.counter < ((d.hatchTurns as number | undefined) ?? 3)) continue;
    const ref = ctx.slotOf(u.uid)!;
    const baby = ctx.makeUnit(into, p, true);
    baby.justDeployed = false;
    if (u.leader) { baby.leader = u.leader; baby.leaderOwner = u.leaderOwner; }
    ctx.setAt(ref, baby);
    ctx.emit({ type: 'effect', key: 'hatch', player: p, cardId: u.cardId, data: { into } });
    ctx.emit({ type: 'deployed', player: p, uid: baby.uid, cardId: into, slot: ref });
  }

  // Croissance : les régiments (et porteurs d'Ancien de la canopée) grandissent au début du tour de leur contrôleur.
  for (const u of ctx.units(p)) {
    const g = card(u.cardId).growth as { atk?: number; end?: number; arm?: number; max: number } | undefined;
    if (g && (u.growthCount ?? 0) < g.max) {
      u.growthCount = (u.growthCount ?? 0) + 1;
      u.baseAtk += g.atk ?? 0; u.baseArm += g.arm ?? 0;
      if (g.end) { u.maxEnd += g.end; u.currentEnd += g.end; }
      ctx.emit({ type: 'effect', key: 'growth', player: p, cardId: u.cardId, data: { uid: u.uid } });
    }
    const le = u.leader ? card(u.leader).leaderGrowthEnd as number | undefined : undefined;
    if (le) { u.maxEnd += le; u.currentEnd += le; }
  }

  // Usure au début du tour : Puits empoisonné adverse, Cheikha Zahra, Seigneur des caravanes perdues.
  const poison = ctx.player(q).board.isole;
  const pz = poison ? card(poison.cardId).poisonsOpponentTurn as { mill: number; handDiscard: number } | undefined : undefined;
  if (pz) {
    ctx.mill(p, pz.mill, poison!.cardId);
    if (pz.handDiscard) ctx.queueChoice('handDiscard', p, poison!.cardId, { n: pz.handDiscard, sum: 0, thief: null, gainBase: 0 });
  }
  for (const u of ctx.units(p)) {
    if (ctx.over) return;
    if (card(u.cardId).zahraMill) { const o = ctx.player(q); ctx.mill(q, o.discard.length > o.deck.length ? 2 : 1, u.cardId); }
  }
  for (const side of [p, q]) {
    for (const u of ctx.units(side)) {
      const m = u.leader ? card(u.leader).millWhileMoreLassitude as number | undefined : undefined;
      if (m && ctx.player(side).points > ctx.player(opponentOf(side)).points) ctx.mill(opponentOf(side), m, u.leader!);
    }
  }
  if (ctx.over) return;

  // Cérémonie du Déclin : +1 lassitude au début du tour (qui rapporte aussi des ressources).
  for (const u of ctx.units(p)) {
    const n = card(u.cardId).lassitudeAtTurnStart as number | undefined;
    if (n) ctx.gainLassitude(p, n, u.cardId);
  }
  if (ctx.over) return;

  let generators = 0, rally = 0;
  for (const u of ctx.units(p)) {
    const d = card(u.cardId);
    generators += d.generatesResourceEachTurn ?? 0;
    if (u.leader) generators += (card(u.leader).leaderResourceEachTurn as number | undefined) ?? 0; // Quartier-maître
    const rc = d.resourceIfCaravane as number | undefined; // Caravanier armé
    if (rc && ctx.units(p).some(x => x.cardId === 'caravane_marchande')) generators += rc;
    rally = Math.max(rally, d.ralliesBrokenEmpireEachTurn ?? 0);
  }
  if (generators) { pl.resource += generators; ctx.emit({ type: 'resource', player: p, amount: generators, source: 'generator' }); }
  if (rally) {
    for (const u of ctx.units(p)) if (u.brokenMorale && u.types.includes('Empire')) ctx.heal(u, 0, rally, 'etat_major');
  }

  // Héraut impérial : tes porteurs de Leader regagnent du Moral.
  for (const h of ctx.units(p)) {
    const r = h.leader && !h.brokenMorale ? card(h.leader).leaderRallyCarriersEachTurn as number | undefined : undefined;
    if (r) for (const x of ctx.units(p)) if (x.leader) ctx.heal(x, 0, r, h.leader!);
  }

  // Général de l'Empire : +1 Moral par régiment Empire adjacent sur sa ligne.
  for (const u of ctx.units(p)) {
    if (!u.leader || !card(u.leader).moralPerAdjacentEmpireEachTurn) continue;
    const ref = ctx.slotOf(u.uid);
    if (!ref || ref.zone === 'isole') continue;
    const row = pl.board[ref.zone];
    const n = [ref.idx - 1, ref.idx + 1].filter(i => row[i]?.types.includes('Empire')).length;
    if (n) ctx.heal(u, 0, n, u.leader);
  }
  // Porte-Étendard : +1 Moral par exemplaire à chaque porteur de Leader. Aumônier : soin du porteur.
  const banners = ctx.units(p).reduce((n, u) => n + (card(u.cardId).moralToLeaderCarriersEachTurn ?? 0), 0);
  if (banners) for (const u of ctx.units(p)) if (u.leader) ctx.heal(u, 0, banners, 'porte_etendard');
  for (const u of ctx.units(p)) {
    const h = u.leader ? card(u.leader).healCarrierEachTurn : undefined;
    if (h) ctx.heal(u, h.end, h.mor, u.leader!);
  }

  // Régiment isolé : Clerc de la Forêt (génère Soin simple), puis durée de vie.
  const iso = pl.board.isole;
  if (iso?.cardId === 'clerc_foret') ctx.generate(p, 'soin_simple', 'clerc_foret');
  if (iso && iso.vieTours !== null) {
    iso.vieTours -= 1;
    if (iso.vieTours <= 0) {
      pl.board.isole = null;
      ctx.emit({ type: 'left', player: p, uid: iso.uid, cardId: iso.cardId, reason: 'lifespan' });
    }
  }

  // Scénario : avancée du convoi et événements du tour (renforts, dialogues…).
  scenarioTurnStart(ctx, p);
  if (ctx.over) return;

  // Pioche. Main pleine (limite atteinte) : on défausse d'abord autant de cartes qu'on va en piocher (au choix),
  // puis on pioche — la pioche continue donc toujours de s'épuiser.
  // Sans défaite par pioche vide (certains scénarios), on ne pioche que ce qui reste.
  const count = !ctx.emptyDeckLoses(p) ? Math.min(drawCountFor(pl.level), pl.deck.length) : drawCountFor(pl.level);
  if (count > 0 && pl.hand.length >= ctx.s.config.handLimit) {
    ctx.emit({ type: 'turnStart', player: p, turn: ctx.s.turn, resource: pl.resource, leftover, drawn: [], blocked: count });
    ctx.queueChoice('handDiscard', p, 'handLimit', { n: count, sum: 0, thief: null, gainBase: 0, drawAfter: count });
    queueMarket(ctx, p);
    return;
  }
  const drawn: string[] = [];
  for (let i = 0; i < count; i++) {
    const cardId = pl.deck[0];
    if (!ctx.draw(p, 'turn')) return;
    drawn.push(cardId!);
  }
  ctx.emit({ type: 'turnStart', player: p, turn: ctx.s.turn, resource: pl.resource, leftover, drawn, blocked: 0 });
  queueMarket(ctx, p);
}

/** Marché : après la pioche, chaque régiment Marché propose de défausser une carte pour en piocher une. */
export function queueMarket(ctx: Ctx, p: PlayerId): void {
  const sellers = ctx.units(p).filter(u => u.keywords.includes('Marché') && !u.brokenMorale);
  for (const u of sellers) ctx.queueChoice('marche', p, u.cardId);
  // Al-Mansur le Magnifique : un passage de plus au Marché (s'il y a un Marché).
  const extra = ctx.units(p).find(u => card(u.cardId).doubleMarket && !u.brokenMorale);
  if (extra && sellers.length) ctx.queueChoice('marche', p, extra.cardId);
}
