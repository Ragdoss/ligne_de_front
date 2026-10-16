// Jouer une carte : coût, conditions, cibles valides, effets (régiments, Leaders, tactiques, effets d'arrivée).
// Les effets qui demandent une décision passent par la file de choix (voir choices.ts).

import { Ctx, addKeyword, card, opponentOf } from './ctx';
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
  if (h.freeCopy) return 0;
  const c = card(h.cardId);
  if (c.dynamicCost) {
    const raw = dynamicRawCost(ctx, c, p);
    return raw <= 0 ? 0 : Math.max(0, raw - tacticReduction(ctx, p));
  }
  let cost = c.cout - (h.discount ?? 0);
  if (c.types?.includes('Basilic')) {
    for (const u of ctx.units(p)) cost -= (card(u.cardId).basilicCostReduction as number | undefined) ?? 0;
  }
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
  if (c.dynamicCost && dynamicRawCost(ctx, c, p) <= 0 && !h.freeCopy) return 'noEffect';
  if (cardCost(ctx, p, h) > pl.resource) return 'resource';
  if (c.requiresOwnEmpireLeaderToCast && !ctx.units(p).some(u => u.types.includes('Empire') && u.leader)) return 'condition';
  switch (c.effect) {
    case 'tectonique': {
      const b = ctx.player(opponentOf(p)).board;
      const slots = [...b.avant, ...b.arriere];
      if (!slots.some(Boolean) || !slots.some(x => !x)) return 'condition';
      break;
    }
    case 'eveilElementaire': if (!pl.board.avant.some(u => !u)) return 'condition'; break;
    case 'promotion': if (!pl.hand.some(x => x.uid !== h.uid && card(x.cardId).cardType === 'Leader')) return 'condition'; break;
    case 'tuteurDemoniaque': if (!pl.deck.some(id => isDemonRegiment(id))) return 'condition'; break;
    case 'halteConvoi': if (!ctx.s.scenario?.convoy) return 'scenarioOnly'; break;
  }
  return null;
}

export const isDemonRegiment = (id: string) => card(id).cardType === 'Regiment' && !!card(id).types?.includes('Démon');

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
    const min = c.sacrificeMinLevel as number | undefined;
    if (min) return !!u && ref.zone === c.slotType && u.niveau >= min; // invocation par sacrifice
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
    if (!h.generated) ctx.discard(p, c.id, true);
    resolveTactic(ctx, p, c, target, target2);
  }
  return null;
}

function deployRegiment(ctx: Ctx, p: PlayerId, c: CardDef, ref: SlotRef): void {
  const pl = ctx.player(p);
  const u = ctx.makeUnit(c.id, p);
  const min = c.sacrificeMinLevel as number | undefined;
  if (min) {
    // Invocation par sacrifice : le régiment sacrifié est détruit (avec ses conséquences habituelles).
    const sac = ctx.unitAt(ref)!;
    if (c.sacrificeGainsStats) {
      u.baseAtk += sac.baseAtk; u.maxEnd += sac.maxEnd; u.currentEnd += sac.maxEnd; u.baseArm += sac.baseArm; u.ini += sac.ini;
    }
    if (c.sacrificeGainsKeywords) for (const k of sac.keywords) addKeyword(u, k);
    const grant = card(sac.cardId).onSacrificeGrant as { keywords?: string[]; arrivesReady?: boolean } | undefined;
    if (grant) {
      for (const k of grant.keywords ?? []) addKeyword(u, k);
      if (grant.arrivesReady) u.arrivesReady = true;
    }
    ctx.emit({ type: 'sacrificed', player: p, uid: sac.uid, cardId: sac.cardId, forCard: c.id });
    const sacRes = card(sac.cardId).onSacrificedResource as number | undefined;
    ctx.destroy(sac, 'effect');
    if (ctx.over) return;
    if (sacRes) { pl.resource += sacRes; ctx.emit({ type: 'resource', player: p, amount: sacRes, source: sac.cardId }); }
    // Gargouille de Cendres (Moral) et Seigneur des Abysses (soin du porteur) : chaque sacrifice les renforce.
    for (const x of ctx.units(p)) {
      const m = card(x.cardId).moralOnAllySacrificed as number | undefined;
      if (m) ctx.heal(x, 0, m, x.cardId);
      const h = x.leader ? card(x.leader).healOnOwnSacrifice as number | undefined : undefined;
      if (h) ctx.heal(x, h, 1, x.leader!);
    }
  }
  if (u.types.includes('Basilic') && ctx.units(p).some(x => card(x.cardId).grantsBasilicsArriveReady)) u.arrivesReady = true;
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
  if (u.types.includes('Nomade')) nomadArrival(ctx, p, u);
  if (u.types.includes('Basilic')) {
    for (const e of ctx.units(p)) {
      const d = card(e.cardId);
      const bonus = d.basilicEndBonus as number | undefined;
      if (bonus) { u.maxEnd += bonus; u.currentEnd += bonus; }
      const selfHeal = d.healsOnBasilicArrival as number | undefined;
      if (selfHeal) ctx.heal(e, selfHeal, 0, e.cardId);
    }
  }
  if (c.recoversDemonOnArrival) ctx.queueChoice('recoverDemonOs', p, c.id);
  // Dragon Infernal : tous les régiments adverses perdent du Moral à son arrivée.
  const terror = c.onArrivalEnemyMoralLoss as number | undefined;
  if (terror) {
    const q = opponentOf(p);
    for (const e of ctx.units(q)) {
      const lost = ctx.loseMoral(e, terror);
      if (lost) ctx.emit({ type: 'moralLoss', uid: e.uid, cardId: e.cardId, amount: lost, source: c.id });
      ctx.checkBroken(e);
    }
    for (const e of ctx.units(q).filter(x => x.currentMor <= 0)) { if (ctx.over) return; if (ctx.isAlive(e)) ctx.destroy(e, 'moral'); }
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
  if (c.grantsKeywordOnAttach) addKeyword(u, c.grantsKeywordOnAttach);
  if (c.bonusNiveauOnAttach) u.niveau += c.bonusNiveauOnAttach;
  if (c.grantsReadyOnAttach) u.arrivesReady = true;
  if (c.visionOnAttach) ctx.queueChoice('vision', p, c.id);
  if (c.replaysArrivalEffectOnAttach && u.types.includes('Nomade')) nomadArrival(ctx, u.controller, u);
}

// ---------- Effets d'arrivée des Nomades (rejoués par Mirage, Embuscade, Maître de Caravane) ----------
function nomadArrival(ctx: Ctx, p: PlayerId, u: Unit): void {
  const q = opponentOf(p);
  const opp = ctx.player(q);
  const note = (key: string, data?: Record<string, unknown>) => ctx.emit({ type: 'effect', key, player: p, cardId: u.cardId, data });
  switch (u.cardId) {
    case 'jeune_nomade': {
      if (!opp.hand.length) { note('noTarget'); break; }
      ctx.discardFromHand(q, opp.hand[ctx.randomInt(opp.hand.length)]!.uid, u.cardId);
      break;
    }
    case 'frondeur_nomade': {
      // Son contrôleur choisit le régiment adverse à sonner.
      if (!ctx.units(q).length) { note('noTarget'); break; }
      ctx.queueChoice('frondeurStun', p, u.cardId, { uid: u.uid });
      break;
    }
    case 'charmeur_basilics': {
      const bas = ctx.player(p).hand.filter(h => card(h.cardId).types?.includes('Basilic'));
      if (!bas.length) { note('noTarget'); break; }
      const h = bas[ctx.randomInt(bas.length)]!;
      h.discount = (h.discount ?? 0) + 1;
      note('basilicDiscount', { cardId: h.cardId });
      break;
    }
    case 'basilics_oasis': {
      const ref = ctx.slotOf(u.uid);
      if (ref?.zone === 'avant') { u.maxEnd += 10; u.currentEnd += 10; note('oasisAvant'); }
      else if (ref?.zone === 'arriere') { if (!u.keywords.includes('Distance')) u.keywords.push('Distance'); u.ini += 30; note('oasisArriere'); }
      break;
    }
    case 'archeotacticiens': {
      for (const type of ['Tactique', 'Leader', 'Regiment'] as const) {
        const idxs = opp.deck.map((id, i) => [id, i] as const).filter(([id]) => card(id).cardType === type);
        if (!idxs.length) continue;
        const max = Math.max(...idxs.map(([id]) => card(id).cout));
        const tied = idxs.filter(([id]) => card(id).cout === max);
        const [id, i] = tied[ctx.randomInt(tied.length)]!;
        opp.deck.splice(i, 1);
        ctx.discard(q, id);
        ctx.emit({ type: 'discarded', player: q, cardId: id, source: u.cardId });
      }
      break;
    }
    case 'chasseur_reliques': ctx.queueChoice('relics', p, u.cardId, { uid: u.uid }); break;
    case 'marchand_ombres': ctx.queueChoice('shadow', p, u.cardId); break;
    case 'caravane_marchande': ctx.queueChoice('caravane', p, u.cardId, { uid: u.uid }); break;
    case 'reine_basilics': {
      const pl = ctx.player(p);
      const ids = pl.discard.filter(id => card(id).cardType === 'Regiment' && card(id).types?.includes('Basilic'));
      if (!ids.length) { note('noTarget'); break; }
      const best = ids.sort((a, b) => card(b).niveau - card(a).niveau)[0]!;
      pl.discard.splice(pl.discard.indexOf(best), 1);
      ctx.addToHand(p, best);
      ctx.emit({ type: 'returnedToHand', player: p, cardId: best });
      break;
    }
    case 'basilics_desert': {
      const n = opp.discard.filter(id => card(id).cardType === 'Regiment').length;
      if (!n) { note('noTarget'); break; }
      u.maxEnd += 5 * n; u.currentEnd += 5 * n; u.baseArm += n; u.ini += 3 * n; u.maxMor += n; u.currentMor += n;
      note('basilicsDesert', { count: n });
      break;
    }
  }
}

// ---------- Tactiques ----------
function resolveTactic(ctx: Ctx, p: PlayerId, c: CardDef, t1?: SlotRef, t2?: SlotRef): void {
  const pl = ctx.player(p);
  const q = opponentOf(p);
  const target = t1 ? ctx.unitAt(t1) : null;
  const note = (key: string, data?: Record<string, unknown>) => ctx.emit({ type: 'effect', key, player: p, cardId: c.id, data });
  switch (c.effect) {
    // --- Neutres ---
    case 'palissade': {
      let n = 0;
      pl.board.avant.forEach((u, i) => { if (!u) { pl.board.avant[i] = ctx.makeUnit('palissade_regiment', p, true); n++; } });
      note('palissade', { count: n });
      break;
    }
    case 'chocEtEffroi': {
      let n = 0;
      for (const u of ctx.units(q)) if (u.brokenMorale) { u.stunned = true; n++; }
      note('chocEtEffroi', { count: n });
      break;
    }
    case 'couvert': {
      const pre = ctx.effectiveAtk(target!);
      if (pre - 20 <= 0) { target!.tempDebuffAtk += Math.max(0, pre - 1); target!.tempArm += 20; }
      else { target!.tempDebuffAtk += 20; target!.tempArm += 30; }
      note('couvert', { uid: target!.uid });
      break;
    }
    // --- Empire ---
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
    case 'promotion': ctx.queueChoice('promotionDiscard', p, c.id); break;
    case 'assassinat': {
      if (target?.leader) {
        ctx.discardLeader(target);
        ctx.emit({ type: 'leaderDestroyed', uid: target.uid, cardId: target.cardId, leaderId: target.leader });
        target.leader = null;
      }
      break;
    }
    case 'ignoreArmure': target!.ignoreArmor = true; note('ignoreArmure', { uid: target!.uid }); break;
    case 'ralliement': ctx.heal(target!, 0, target!.brokenMorale ? 5 : 3, c.id); break;
    // --- Elfes ---
    case 'eveilElementaire': {
      const i = pl.board.avant.findIndex(u => !u);
      const u = ctx.makeUnit('elem_eveil_regiment', p, true);
      pl.board.avant[i] = u;
      ctx.emit({ type: 'deployed', player: p, uid: u.uid, cardId: u.cardId, slot: { player: p, zone: 'avant', idx: i } });
      break;
    }
    case 'briseMatin': {
      let n = 0;
      for (const u of ctx.units(p)) if (u.types.includes('Elfe')) { u.tempIni += 15; n++; }
      note('briseMatin', { count: n });
      break;
    }
    case 'serenite': ctx.loseLassitude(p, c.doubledWithElemental && ctx.controlsElemental(p) ? 6 : 3, c.id); break;
    case 'buffArchers': {
      for (const u of ctx.units(p)) if (u.types.includes('Archer')) u.tempAtk += 10;
      note('buffArchers');
      break;
    }
    case 'soin10': ctx.heal(target!, 10, 0, c.id); break;
    case 'brumeTrompeuse': {
      const elems = ctx.units(p).filter(u => u.types.includes('Élémentaux')).length;
      target!.tempIni -= 20;
      const hit = [target!.uid];
      const pool = ctx.units(q).filter(u => u.uid !== target!.uid);
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
    // --- Démons ---
    case 'effroiDemoniaque': {
      const demons = ctx.units(p).filter(u => u.types.includes('Démon')).length;
      const lost = ctx.loseMoral(target!, 2 + demons);
      ctx.emit({ type: 'moralLoss', uid: target!.uid, cardId: target!.cardId, amount: lost, source: c.id });
      ctx.checkBroken(target!);
      if (target!.currentMor <= 0) {
        ctx.destroy(target!, 'moral');
        if (!ctx.over) for (const u of ctx.units(p)) if (u.types.includes('Démon')) ctx.addMoralRaw(u, 1);
      }
      break;
    }
    case 'pacteSang': {
      ctx.gainLassitude(p, 4, c.id);
      if (ctx.over) break;
      pl.resource += 2;
      ctx.emit({ type: 'resource', player: p, amount: 2, source: c.id });
      for (let i = 0; i < 2 && !ctx.over; i++) ctx.draw(p, c.id);
      break;
    }
    case 'ranconAmes': ctx.queueChoice('ranconAmes', p, c.id, { uid: target!.uid }); break;
    case 'detteInfernale': {
      const u = target!;
      u.baseAtk += 10; u.maxEnd += 20; u.currentEnd += 20;
      note('detteInfernale', { uid: u.uid });
      ctx.gainLassitude(p, u.niveau, c.id);
      break;
    }
    case 'pacteSurvie': target!.pactShield = { owner: p, endAcc: 0 }; note('pacteSurvie', { uid: target!.uid }); break;
    case 'banquetInfernal': {
      const u = target!;
      if (ctx.units(p).some(x => x.types.includes('Démon')) && !u.keywords.includes('Minions')) u.keywords.push('Minions');
      const gain = Math.max(0, u.currentMor);
      ctx.destroy(u, 'effect');
      if (ctx.over) break;
      pl.resource += gain;
      ctx.emit({ type: 'resource', player: p, amount: gain, source: c.id });
      break;
    }
    case 'tuteurDemoniaque': ctx.queueChoice('tuteur', p, c.id); break;
    // --- Scénario ---
    case 'halteConvoi': {
      ctx.s.scenario!.convoyHold++;
      note('halteConvoi');
      ctx.draw(p, c.id);
      break;
    }
    // --- Nouvelles cartes ---
    case 'tempeteSable': {
      for (const u of ctx.units(q)) { u.blinded = true; u.tempIni -= 20; }
      note('tempeteSable');
      break;
    }
    case 'oasisCachee': {
      for (let i = 0; i < 2 && !ctx.over; i++) ctx.draw(p, c.id);
      if (ctx.over) break;
      if (ctx.units(p).some(u => u.cardId === 'caravane_marchande')) { pl.resource += 1; ctx.emit({ type: 'resource', player: p, amount: 1, source: c.id }); }
      ctx.queueChoice('handDiscard', p, c.id, { n: 1, sum: 0, thief: null, gainBase: 0 });
      break;
    }
    case 'purification': {
      const u = target!;
      const d = card(u.cardId);
      u.keywords = u.keywords.filter(k => !k.startsWith('Effrayant'));
      u.baseAtk = Math.min(u.baseAtk, d.atk ?? 0);
      u.baseArm = Math.min(u.baseArm, d.arm ?? 0);
      if (u.maxEnd > (d.end ?? 1)) { u.maxEnd = d.end ?? 1; u.currentEnd = Math.min(u.currentEnd, u.maxEnd); }
      note('purification', { uid: u.uid });
      if (u.types.includes('Démon')) {
        const lost = ctx.loseMoral(u, 2);
        ctx.emit({ type: 'moralLoss', uid: u.uid, cardId: u.cardId, amount: lost, source: c.id });
        ctx.checkBroken(u);
        if (u.currentMor <= 0) ctx.destroy(u, 'moral');
      }
      break;
    }
    case 'ravitaillement': for (let i = 0; i < 2 && !ctx.over; i++) ctx.draw(p, c.id); break;
    case 'banniereDechiree': ctx.heal(target!, 0, target!.brokenMorale ? 4 : 2, c.id); break;
    // --- Nomades ---
    case 'mirage': for (const u of ctx.units(p)) if (u.types.includes('Nomade')) nomadArrival(ctx, p, u); break;
    case 'embuscade': target!.tempIni += 50; nomadArrival(ctx, p, target!); break;
    case 'marcheNoir': {
      for (const who of [p, q]) for (let i = 0; i < 3 && !ctx.over; i++) ctx.draw(who, c.id);
      if (ctx.over) break;
      for (let i = 0; i < 2 && ctx.player(q).hand.length; i++) {
        const opp = ctx.player(q);
        ctx.discardFromHand(q, opp.hand[ctx.randomInt(opp.hand.length)]!.uid, c.id);
      }
      ctx.queueChoice('handDiscard', p, c.id, { n: 2, sum: 0, thief: null, gainBase: 0 });
      break;
    }
    case 'ranconDesert': ctx.queueChoice('ransomDesert', p, c.id); break;
    case 'frappezRavitaillement': ctx.queueChoice('handDiscard', q, c.id, { n: 2, sum: 0, thief: null, gainBase: 0 }); break;
    case 'volezRavitaillement': ctx.queueChoice('handDiscard', q, c.id, { n: 3, sum: 0, thief: p, gainBase: 7 }); break;
    default:
      throw new Error(`Effet de tactique non implémenté : ${c.effect} (${c.id})`);
  }
}
