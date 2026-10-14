// Fin de tour (combat, contrôles de défaite) et début du tour suivant (ressources, effets, pioche).

import { resolveCombat } from './combat';
import { Ctx, card, opponentOf } from './ctx';
import { scenarioTurnStart } from './scenario';
import type { PlayerId } from './types';

export function drawCountFor(level: number): number {
  return level >= 4 ? 3 : level >= 2 ? 2 : 1;
}

export function endTurn(ctx: Ctx): void {
  const ending = ctx.s.active;
  // Copies gratuites d'Archéotacticiens non jouées : détruites en fin de tour.
  const pl = ctx.player(ending);
  pl.hand = pl.hand.filter(h => !h.freeCopy);
  resolveCombat(ctx, ending);
  if (ctx.over) return;

  const extra = ctx.s.config.endTurnLassitude[ending];
  if (extra) ctx.gainLassitude(ending, extra, 'scenario');
  if (ctx.over) return;

  if (ctx.units(ending).length === 0 && ctx.s.turn >= ctx.s.config.noRegimentDefeatFromTurn[ending]) {
    ctx.endGame(opponentOf(ending), 'noRegiment');
    return;
  }

  const next = opponentOf(ending);
  ctx.s.active = next;
  if (ending === 'B') ctx.s.turn++;
  startTurn(ctx, next);
}

export function startTurn(ctx: Ctx, p: PlayerId): void {
  const pl = ctx.player(p);
  // Formation en Carré : prend fin au début du tour de son lanceur.
  for (const q of ['A', 'B'] as PlayerId[]) {
    for (const u of ctx.units(q)) {
      if (u.squareOwner === p) { u.squareArm = 0; u.squareOwner = null; }
      if (u.pactShield?.owner === p) u.pactShield = null; // Pacte de Survie : fin au début du tour du lanceur
    }
  }

  // Ressource : niveau + reliquat du tour précédent.
  const leftover = pl.resource;
  pl.resource = pl.level + leftover;
  let peasants = 0;
  for (const u of ctx.units(p)) if (u.keywords.includes('GenerateurRessource')) peasants += pl.level >= 4 ? 2 : 1;
  if (peasants) { pl.resource += peasants; ctx.emit({ type: 'resource', player: p, amount: peasants, source: 'paysans' }); }

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
    rally = Math.max(rally, d.ralliesBrokenEmpireEachTurn ?? 0);
  }
  if (generators) { pl.resource += generators; ctx.emit({ type: 'resource', player: p, amount: generators, source: 'generator' }); }
  if (rally) {
    for (const u of ctx.units(p)) if (u.brokenMorale && u.types.includes('Empire')) ctx.heal(u, 0, rally, 'etat_major');
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
  const count = ctx.s.config.emptyDeckDefeat === false ? Math.min(drawCountFor(pl.level), pl.deck.length) : drawCountFor(pl.level);
  if (count > 0 && pl.hand.length >= ctx.s.config.handLimit) {
    ctx.emit({ type: 'turnStart', player: p, turn: ctx.s.turn, resource: pl.resource, leftover, drawn: [], blocked: count });
    ctx.queueChoice('handDiscard', p, 'handLimit', { n: count, sum: 0, thief: null, gainBase: 0, drawAfter: count });
    return;
  }
  const drawn: string[] = [];
  for (let i = 0; i < count; i++) {
    const cardId = pl.deck[0];
    if (!ctx.draw(p, 'turn')) return;
    drawn.push(cardId!);
  }
  ctx.emit({ type: 'turnStart', player: p, turn: ctx.s.turn, resource: pl.resource, leftover, drawn, blocked: 0 });
}
