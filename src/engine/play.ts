// Jouer une carte : coût, conditions, cibles valides, effets ; et choix en attente (Vision, Promotion).

import { Ctx, card, opponentOf } from './ctx';
import type { CardDef, HandCard, PlayerId, SlotRef, Unit } from './types';

// ---------- Coût ----------
export function tacticReduction(ctx: Ctx, p: PlayerId): number {
  return ctx.units(p).reduce((n, u) => n + (u.leader ? card(u.leader).tacticCostReduction ?? 0 : 0), 0);
}
export function dynamicRawCost(ctx: Ctx, c: CardDef, p: PlayerId): number {
  if (c.dynamicCost === 'frontEmpty') return ctx.player(p).board.avant.filter(u => !u).length;
  if (c.dynamicCost === 'brokenEnemyCount') return ctx.units(opponentOf(p)).filter(u => u.brokenMorale).length;
  return 0;
}
export function cardCost(ctx: Ctx, p: PlayerId, h: HandCard): number {
  const c = card(h.cardId);
  if (c.dynamicCost) {
    const raw = dynamicRawCost(ctx, c, p);
    return raw <= 0 ? 0 : Math.max(0, raw - tacticReduction(ctx, p));
  }
  let cost = c.cout;
  if (c.elementalDiscount && ctx.controlsElemental(p)) cost -= c.elementalDiscount;
  if (c.cardType === 'Tactique') cost -= tacticReduction(ctx, p);
  return Math.max(0, cost);
}

// ---------- Jouabilité ----------
/** Raison pour laquelle la carte ne peut pas être jouée maintenant (null = jouable, hors choix de cible). */
export function unplayableReason(ctx: Ctx, p: PlayerId, h: HandCard): string | null {
  const c = card(h.cardId);
  const pl = ctx.player(p);
  if (c.niveau > pl.level && !h.levelFree) return 'level';
  if (c.dynamicCost && dynamicRawCost(ctx, c, p) <= 0) return 'noEffect';
  if (cardCost(ctx, p, h) > pl.resource) return 'resource';
  if (c.requiresOwnEmpireLeaderToCast && !ctx.units(p).some(u => u.types.includes('Empire') && u.leader)) return 'condition';
  if (c.effect === 'tectonique') {
    const b = ctx.player(opponentOf(p)).board;
    const slots = [...b.avant, ...b.arriere];
    if (!slots.some(Boolean) || !slots.some(x => !x)) return 'condition';
  }
  if (c.effect === 'eveilElementaire' && !pl.board.avant.some(u => !u)) return 'condition';
  if (c.effect === 'promotion') {
    const hasLeaderInHand = pl.hand.some(x => x.uid !== h.uid && card(x.cardId).cardType === 'Leader');
    if (!hasLeaderInHand) return 'condition';
  }
  return null;
}

/** La carte demande-t-elle une cible ? Et une seconde ? */
export function targetCount(c: CardDef): 0 | 1 | 2 {
  if (c.cardType === 'Tactique') {
    if (c.targetRule === 'none') return 0;
    if (c.targetRule === 'ennemi-puis-case-vide' || c.targetRule === 'elfe-allie-puis-case') return 2;
  }
  return 1;
}

function targetsOpponent(c: CardDef): boolean {
  return (c.cardType === 'Tactique' && (c.targetRule === 'ennemi-quelconque' || c.targetRule === 'ennemi-avec-leader' || c.targetRule === 'ennemi-puis-case-vide'))
    || (c.cardType === 'Leader' && !!c.targetsEnemy);
}

/** Première cible valide pour la carte jouée par `p`. */
export function validFirstTarget(ctx: Ctx, p: PlayerId, c: CardDef, ref: SlotRef): boolean {
  if (ref.player !== (targetsOpponent(c) ? opponentOf(p) : p)) return false;
  const u = ctx.unitAt(ref);
  if (c.cardType === 'Regiment') {
    const zones = c.slotTypes ?? [c.slotType];
    return zones.includes(ref.zone) && !u;
  }
  if (!u) return false;
  if (c.cardType === 'Leader') {
    if (c.requiresLeader && !u.leader) return false;
    if (!c.requiresLeader && !c.targetsEnemy && u.leader) return false; // un seul Leader par régiment
    return (c.typesRequired ?? []).every(t => u.types.includes(t));
  }
  switch (c.targetRule) {
    case 'ennemi-puis-case-vide': return ref.zone !== 'isole';
    case 'elfe-allie-puis-case': return ref.zone !== 'isole' && u.types.includes('Elfe');
    case 'allie-quelconque': case 'ennemi-quelconque': return true;
    case 'lancier-allie': return u.types.includes('Lancier');
    case 'archer-allie': return u.types.includes('Archer');
    case 'elfe-allie': return u.types.includes('Elfe');
    case 'demon-allie': return u.types.includes('Démon');
    case 'nomade-allie': return u.types.includes('Nomade');
    case 'allie-avec-leader': case 'ennemi-avec-leader': return !!u.leader;
    default: return false;
  }
}

export function validSecondTarget(ctx: Ctx, c: CardDef, first: SlotRef, ref: SlotRef): boolean {
  if (ref.zone === 'isole') return false;
  if (c.targetRule === 'ennemi-puis-case-vide') return ref.player === first.player && !ctx.unitAt(ref);
  if (c.targetRule === 'elfe-allie-puis-case') return ref.player === first.player && !(ref.zone === first.zone && ref.idx === first.idx);
  return false;
}

// ---------- Jouer ----------
export function playCard(ctx: Ctx, p: PlayerId, handUid: number, target?: SlotRef, target2?: SlotRef): string | null {
  const pl = ctx.player(p);
  const hIdx = pl.hand.findIndex(h => h.uid === handUid);
  if (hIdx === -1) return 'notInHand';
  const h = pl.hand[hIdx]!;
  const c = card(h.cardId);
  const why = unplayableReason(ctx, p, h);
  if (why) return why;
  const n = targetCount(c);
  if (n >= 1 && (!target || !validFirstTarget(ctx, p, c, target))) return 'badTarget';
  if (n === 2 && (!target2 || !validSecondTarget(ctx, c, target!, target2))) return 'badTarget2';

  const cost = cardCost(ctx, p, h);
  pl.resource -= cost;
  pl.hand.splice(hIdx, 1);
  ctx.emit({ type: 'cardPlayed', player: p, cardId: c.id, cost });

  if (c.cardType === 'Regiment') deployRegiment(ctx, p, c, target!);
  else if (c.cardType === 'Leader') attachLeader(ctx, p, c, ctx.unitAt(target!)!);
  else {
    if (!h.generated) ctx.discard(p, c.id);
    resolveTactic(ctx, p, c, target, target2);
  }
  return null;
}

function deployRegiment(ctx: Ctx, p: PlayerId, c: CardDef, ref: SlotRef): void {
  const u = ctx.makeUnit(c.id, p);
  ctx.setAt(ref, u);
  ctx.emit({ type: 'deployed', player: p, uid: u.uid, cardId: c.id, slot: ref });
  if (c.createsLieutenantOnArrival) ctx.generate(p, 'lieutenant', c.id);
  if (c.healAllMoralOnArrival) {
    for (const x of ctx.units(p)) {
      if (!x.types.includes('Empire')) continue;
      ctx.heal(x, 0, x.maxMor, c.id);
      x.brokenMorale = false;
    }
  }
}

function attachLeader(ctx: Ctx, p: PlayerId, c: CardDef, u: Unit): void {
  if (u.leader) ctx.discardLeader(u); // remplacement (Leaders « requiert un Leader » uniquement)
  u.leader = c.id;
  u.leaderOwner = p;
  if (c.bonusMor) { u.maxMor += c.bonusMor; u.currentMor = Math.min(u.maxMor, u.currentMor + c.bonusMor); }
  ctx.emit({ type: 'leaderAttached', player: p, leaderId: c.id, uid: u.uid, cardId: u.cardId });
  if (c.bonusEnd) { u.maxEnd += c.bonusEnd; u.currentEnd += c.bonusEnd; }
  if (c.healOnAttach) ctx.heal(u, c.healOnAttach, 0, c.id);
  if (c.healMorOnAttach) ctx.heal(u, 0, c.healMorOnAttach, c.id);
  if (c.grantsKeywordOnAttach && !u.keywords.includes(c.grantsKeywordOnAttach)) u.keywords.push(c.grantsKeywordOnAttach);
  if (c.bonusNiveauOnAttach) u.niveau += c.bonusNiveauOnAttach;
  if (c.grantsReadyOnAttach) u.arrivesReady = true;
  if (c.visionOnAttach) openVision(ctx, p);
}

function resolveTactic(ctx: Ctx, p: PlayerId, c: CardDef, t1?: SlotRef, t2?: SlotRef): void {
  const pl = ctx.player(p);
  const target = t1 ? ctx.unitAt(t1) : null;
  const note = (key: string, data?: Record<string, unknown>) => ctx.emit({ type: 'effect', key, player: p, cardId: c.id, data });
  switch (c.effect) {
    case 'palissade': {
      let n = 0;
      pl.board.avant.forEach((u, i) => { if (!u) { pl.board.avant[i] = ctx.makeUnit('palissade_regiment', p, true); n++; } });
      note('palissade', { count: n });
      break;
    }
    case 'eveilElementaire': {
      const i = pl.board.avant.findIndex(u => !u);
      const u = ctx.makeUnit('elem_eveil_regiment', p, true);
      pl.board.avant[i] = u;
      ctx.emit({ type: 'deployed', player: p, uid: u.uid, cardId: u.cardId, slot: { player: p, zone: 'avant', idx: i } });
      break;
    }
    case 'chocEtEffroi': {
      let n = 0;
      for (const u of ctx.units(opponentOf(p))) if (u.brokenMorale) { u.stunned = true; n++; }
      note('chocEtEffroi', { count: n });
      break;
    }
    case 'formationCarre': {
      let n = 0;
      for (const u of ctx.units(p)) if (u.leader) { u.squareArm = 10; u.squareOwner = p; n++; }
      note('formationCarre', { count: n });
      break;
    }
    case 'ordreHautCommandement': {
      let n = 0;
      for (const u of ctx.units(p)) if (u.leader) { u.tempAtk += 10; u.tempArm += 5; ctx.heal(u, 20, 4, c.id); n++; }
      note('ordreHautCommandement', { count: n });
      break;
    }
    case 'briseMatin': {
      let n = 0;
      for (const u of ctx.units(p)) if (u.types.includes('Elfe')) { u.tempIni += 15; n++; }
      note('briseMatin', { count: n });
      break;
    }
    case 'serenite': ctx.loseLassitude(p, 3, c.id); break;
    case 'promotion': {
      const options = pl.hand.filter(h => card(h.cardId).cardType === 'Leader').map(h => h.uid);
      ctx.s.pending = { kind: 'promotionDiscard', player: p, options };
      ctx.emit({ type: 'choice', player: p, kind: 'promotionDiscard' });
      break;
    }
    case 'assassinat': {
      if (target?.leader) {
        ctx.discardLeader(target);
        ctx.emit({ type: 'leaderDestroyed', uid: target.uid, cardId: target.cardId, leaderId: target.leader });
        target.leader = null;
      }
      break;
    }
    case 'ignoreArmure': target!.ignoreArmor = true; note('ignoreArmure', { uid: target!.uid }); break;
    case 'buffArchers': {
      for (const u of ctx.units(p)) if (u.types.includes('Archer')) u.tempAtk += 10;
      note('buffArchers');
      break;
    }
    case 'soin10': ctx.heal(target!, 10, 0, c.id); break;
    case 'ralliement': ctx.heal(target!, 0, target!.brokenMorale ? 5 : 3, c.id); break;
    case 'couvert': {
      const pre = ctx.effectiveAtk(target!);
      if (pre - 20 <= 0) { target!.tempDebuffAtk += Math.max(0, pre - 1); target!.tempArm += 20; }
      else { target!.tempDebuffAtk += 20; target!.tempArm += 30; }
      note('couvert', { uid: target!.uid });
      break;
    }
    case 'brumeTrompeuse': {
      const elems = ctx.units(p).filter(u => u.types.includes('Élémentaux')).length;
      target!.tempIni -= 20;
      const hit = [target!.uid];
      const pool = ctx.units(opponentOf(p)).filter(u => u.uid !== target!.uid);
      for (let i = 0; i < elems && pool.length; i++) {
        const extra = pool.splice(ctx.randomInt(pool.length), 1)[0]!;
        extra.tempIni -= 20;
        hit.push(extra.uid);
      }
      note('brumeTrompeuse', { uids: hit });
      break;
    }
    case 'retraiteSylvestre': {
      ctx.discardLeader(target!);
      ctx.setAt(t1!, null);
      ctx.addToHand(p, target!.cardId);
      ctx.emit({ type: 'returnedToHand', player: p, cardId: target!.cardId });
      break;
    }
    case 'bourgeonnement': case 'floraison': case 'fructification': {
      const cfg = { bourgeonnement: { end: 10, mor: 1, next: 'floraison' }, floraison: { end: 30, mor: 2, next: 'fructification' }, fructification: { end: 50, mor: 5, next: null } }[c.effect];
      const elem = ctx.controlsElemental(p);
      ctx.heal(target!, cfg.end, cfg.mor, c.id);
      if (elem && cfg.next) ctx.generate(p, cfg.next, c.id);
      if (elem && c.effect === 'fructification') for (const u of ctx.units(p)) if (u.uid !== target!.uid) ctx.heal(u, 10, 1, c.id);
      break;
    }
    case 'tectonique': {
      const u = target!;
      ctx.setAt(t1!, null);
      ctx.setAt(t2!, u);
      ctx.emit({ type: 'moved', uid: u.uid, cardId: u.cardId, from: t1!, to: t2! });
      break;
    }
    case 'repositionnement': {
      const first = target!;
      const second = ctx.unitAt(t2!);
      ctx.setAt(t1!, second);
      ctx.setAt(t2!, first);
      first.tempIni += 20;
      ctx.emit({ type: 'moved', uid: first.uid, cardId: first.cardId, from: t1!, to: t2! });
      if (second) { second.tempIni += 20; ctx.emit({ type: 'moved', uid: second.uid, cardId: second.cardId, from: t2!, to: t1! }); }
      break;
    }
    default:
      throw new Error(`Effet de tactique non implémenté : ${c.effect} (${c.id})`);
  }
}

// ---------- Choix en attente ----------
function openVision(ctx: Ctx, p: PlayerId): void {
  const options = ctx.player(p).deck.filter(id => card(id).cardType === 'Tactique').slice(0, 3);
  if (!options.length) { ctx.emit({ type: 'effect', key: 'visionEmpty', player: p, cardId: 'vision' }); return; }
  ctx.s.pending = { kind: 'vision', player: p, options };
  ctx.emit({ type: 'choice', player: p, kind: 'vision' });
}

export function resolveChoice(ctx: Ctx, option: number): string | null {
  const pend = ctx.s.pending;
  if (!pend) return 'noChoice';
  if (!Number.isInteger(option) || option < 0 || option >= pend.options.length) return 'badOption';
  const pl = ctx.player(pend.player);
  ctx.s.pending = null;
  if (pend.kind === 'vision') {
    const id = pend.options[option]!;
    pl.deck.splice(pl.deck.indexOf(id), 1);
    pl.deck = [id, ...ctx.shuffle(pl.deck)];
    ctx.emit({ type: 'effect', key: 'visionChosen', player: pend.player, cardId: 'vision', data: { chosen: id } });
  } else if (pend.kind === 'promotionDiscard') {
    const uid = pend.options[option]!;
    const i = pl.hand.findIndex(h => h.uid === uid);
    const h = pl.hand.splice(i, 1)[0]!;
    if (!h.generated) ctx.discard(pend.player, h.cardId);
    const picks = pl.deck.filter(id => card(id).cardType === 'Leader').slice(0, 2);
    ctx.emit({ type: 'effect', key: 'promotionDiscarded', player: pend.player, cardId: 'promotion', data: { discarded: h.cardId, revealed: picks } });
    if (picks.length) {
      ctx.s.pending = { kind: 'promotionPick', player: pend.player, options: picks };
      ctx.emit({ type: 'choice', player: pend.player, kind: 'promotionPick' });
    }
  } else {
    const id = pend.options[option]!;
    pl.deck.splice(pl.deck.indexOf(id), 1);
    ctx.addToHand(pend.player, id);
    ctx.emit({ type: 'draw', player: pend.player, cardId: id, source: 'promotion' });
    pl.deck = ctx.shuffle(pl.deck);
  }
  return null;
}
