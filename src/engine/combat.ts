// Combat de fin de tour et comparaison de Moral.

import { Ctx, card, opponentOf } from './ctx';
import { scenarioMoralCheckLost } from './scenario';
import type { PlayerId, Unit, Zone } from './types';

function lowestMoral(list: (Unit | null | undefined)[]): Unit | null {
  let best: Unit | null = null;
  for (const u of list) if (u && (!best || u.currentMor < best.currentMor)) best = u;
  return best;
}

/**
 * Cible d'un attaquant :
 * - avant : le régiment en miroir, sinon le plus faible en Moral parmi les arrières adjacents (percée) ;
 * - arrière avec Distance (ou isolé avec Distance) : le plus faible en Moral de tout l'avant et l'arrière adverses ;
 * - arrière sans Distance : le plus faible des deux avants adjacents, sinon l'arrière en miroir.
 */
export function pickTarget(ctx: Ctx, a: Unit, p: PlayerId, zone: Zone, idx: number): Unit | null {
  const opp = ctx.player(opponentOf(p)).board;
  const distance = ctx.hasDistance(a);
  if (zone === 'avant') {
    return opp.avant[idx] ?? lowestMoral(ctx.adjBack(idx).map(k => opp.arriere[k]));
  }
  if (zone === 'arriere') {
    if (distance) return lowestMoral([...opp.avant, ...opp.arriere]);
    return lowestMoral(ctx.adjFront(idx).map(i => opp.avant[i])) ?? opp.arriere[idx] ?? null;
  }
  return distance ? lowestMoral([...opp.avant, ...opp.arriere]) : null;
}

export function resolveCombat(ctx: Ctx, ending: PlayerId): void {
  ctx.emit({ type: 'combatStart', player: ending });

  // Soins récurrents des Leaders (Chamane de la Forêt) : à chaque fin de tour, pour les deux joueurs.
  for (const p of ['A', 'B'] as PlayerId[]) {
    for (const u of ctx.units(p)) {
      const h = u.leader ? card(u.leader).healEachTurn : 0;
      if (h) ctx.heal(u, h, 0, u.leader!);
    }
  }
  // Soigneurs (Dryades, Élémentaire d'Eau) : à la fin du tour de leur contrôleur, soignent le plus blessé.
  for (const healer of ctx.units(ending)) {
    const d = card(healer.cardId);
    if (!d.healsMostInjuredEachTurn) continue;
    let best: Unit | null = null, miss = 0;
    for (const x of ctx.units(ending)) if (x.maxEnd - x.currentEnd > miss) { best = x; miss = x.maxEnd - x.currentEnd; }
    if (!best) continue;
    const r = ctx.heal(best, d.healsMostInjuredEachTurn, (d.healMorWithHeal as number | undefined) ?? 0, healer.cardId);
    if (d.moralOnFullHeal && r.end > 0 && best.currentEnd >= best.maxEnd) ctx.heal(best, 0, d.moralOnFullHeal, healer.cardId);
  }

  // Tréant Millénaire : soigne tous les régiments de son contrôleur.
  for (const healer of ctx.units(ending)) {
    const n = card(healer.cardId).healsAllEachTurn as number | undefined;
    if (n) for (const x of ctx.units(ending)) ctx.heal(x, n, 0, healer.cardId);
  }

  // Maître du Chenil Infernal : avant les attaques, comble le rang avant de son contrôleur de Chiens (Minions).
  if (ctx.units(ending).some(u => card(u.cardId).summonsChienInfernalEachTurn)) {
    const row = ctx.player(ending).board.avant;
    row.forEach((slot, idx) => {
      if (slot) return;
      const pup = ctx.makeUnit('chien_infernal', ending, true);
      if (!pup.keywords.includes('Minions')) pup.keywords.push('Minions');
      row[idx] = pup;
      ctx.emit({ type: 'deployed', player: ending, uid: pup.uid, cardId: pup.cardId, slot: { player: ending, zone: 'avant', idx } });
    });
  }

  type Att = { u: Unit; p: PlayerId; zone: Zone; idx: number };
  const attackers: Att[] = [];
  for (const p of ['A', 'B'] as PlayerId[]) {
    const b = ctx.player(p).board;
    b.avant.forEach((u, idx) => { if (u) attackers.push({ u, p, zone: 'avant', idx }); });
    b.arriere.forEach((u, idx) => { if (u) attackers.push({ u, p, zone: 'arriere', idx }); });
    if (b.isole && ctx.hasDistance(b.isole)) attackers.push({ u: b.isole, p, zone: 'isole', idx: 0 });
  }
  // Lent : n'attaque qu'au combat de fin de tour de son contrôleur.
  const eligible = attackers.filter(a => !(a.u.keywords.includes('Lent') && a.p !== ending));
  // Initiative décroissante ; à égalité, le joueur dont c'est le tour frappe en premier.
  eligible.sort((x, y) => {
    const d = ctx.effectiveIni(y.u) - ctx.effectiveIni(x.u);
    if (d !== 0) return d;
    if (x.p === y.p) return 0;
    return x.p === ending ? -1 : 1;
  });

  for (const a of eligible) {
    if (ctx.over) return;
    const pos = ctx.slotOf(a.u.uid);
    if (!pos || pos.player !== a.p) continue; // détruit (ou libéré : il a changé de camp) plus tôt dans ce combat
    if (a.u.stunned) {
      a.u.stunned = false;
      ctx.emit({ type: 'skipAttack', uid: a.u.uid, cardId: a.u.cardId, reason: 'stunned' });
      continue;
    }
    if (ctx.effectiveAtk(a.u) <= 0) {
      if ((card(a.u.cardId).atk ?? 0) > 0) ctx.emit({ type: 'skipAttack', uid: a.u.uid, cardId: a.u.cardId, reason: 'noAtk' });
      continue;
    }
    // La position est relue : un régiment peut avoir été déplacé avant son attaque.
    const target = pickTarget(ctx, a.u, a.p, pos.zone, pos.idx);
    if (!target) continue;
    attack(ctx, a.u, target);
  }

  // Fin des effets ponctuels de combat et de la pénalité d'apparition.
  for (const p of ['A', 'B'] as PlayerId[]) {
    for (const u of ctx.units(p)) {
      u.justDeployed = false;
      u.ignoreArmor = false;
      u.tempAtk = 0; u.tempDebuffAtk = 0; u.tempArm = 0; u.tempIni = 0;
      u.stunned = false;
      u.woundedByFrondeur = false;
      u.blinded = false;
    }
  }
  if (ctx.over) return;
  moralCheck(ctx);
}

function attack(ctx: Ctx, a: Unit, target: Unit): void {
  let atk = ctx.effectiveAtk(a);
  const vsMounted = card(a.cardId).bonusVsMounted ?? (a.types.includes('Lancier') ? 10 : 0);
  if (vsMounted && target.types.includes('Monté') && !a.brokenMorale) atk += vsMounted;
  const vsTypes = card(a.cardId).bonusVsTypes as Record<string, number> | undefined;
  if (vsTypes && !a.brokenMorale) for (const [t, v] of Object.entries(vsTypes)) if (target.types.includes(t)) atk += v;
  // Pénétration d'armure X : l'attaquant ignore les X premiers points d'Armure de sa cible.
  const pen = a.keywords.find(k => k.startsWith('Pénétration'));
  const penVal = pen ? parseInt(pen.split(' ')[1] ?? '0', 10) || 0 : 0;
  const arm = a.ignoreArmor ? 0 : Math.max(0, ctx.effectiveArm(target) - penVal);
  let damage = Math.max(0, atk - arm);
  if (target.pactShield && damage > 0) {
    // Pacte de Survie : les dégâts évités deviennent de la lassitude (1 par tranche de 10, reliquat conservé).
    const sh = target.pactShield;
    sh.endAcc += damage;
    const g = Math.floor(sh.endAcc / 10);
    sh.endAcc %= 10;
    ctx.emit({ type: 'effect', key: 'pactEnd', player: sh.owner, cardId: 'pacte_survie', data: { uid: target.uid, avoided: damage } });
    damage = 0;
    if (g) ctx.gainLassitude(sh.owner, g, 'pacte_survie');
    if (ctx.over) return;
  }
  target.currentEnd = Math.max(0, target.currentEnd - damage);
  if (damage > 0 && card(a.cardId).woundInflictsFrondeurMill) target.woundedByFrondeur = true;
  const fearVal = a.brokenMorale ? 0 : ctx.fear(a);
  const moralLoss = ctx.loseMoral(target, 1 + fearVal);
  ctx.checkBroken(target);
  ctx.emit({
    type: 'attack', attacker: a.uid, attackerCard: a.cardId, target: target.uid, targetCard: target.cardId,
    atk, arm, damage, moralLoss, end: target.currentEnd, mor: target.currentMor,
  });
  const dead = target.currentEnd <= 0 || target.currentMor <= 0;
  if (card(a.cardId).stunsTargetOnAttack && !dead) {
    target.stunned = true;
    target.stunnedBy = a.uid;
    ctx.emit({ type: 'stunned', uid: target.uid, cardId: target.cardId, by: a.uid });
  }
  if (dead) {
    const cause = target.currentEnd <= 0 && target.currentMor <= 0 ? 'both' : target.currentEnd <= 0 ? 'end' : 'moral';
    ctx.destroy(target, cause, a);
  }
}

/** Lassitude de la comparaison de Moral selon le plus haut niveau des deux joueurs (niveaux 1 à 5). */
export const MORAL_CHECK_LASSITUDE = [1, 1, 2, 2, 3];

/** Le joueur au Moral total le plus bas gagne de la lassitude (selon le plus haut niveau des deux joueurs, ou réglage). */
export function moralCheck(ctx: Ctx): void {
  const cfg = ctx.s.config;
  if (!cfg.moralCheck) return;
  const top = Math.max(ctx.player('A').level, ctx.player('B').level);
  const lvl = cfg.moralCheckLassitude ?? MORAL_CHECK_LASSITUDE[Math.min(5, Math.max(1, top)) - 1]!;
  // Maréchal d'Empire : seul régiment en jeu + ce Leader = comparaison gagnée d'office.
  const solo = (p: PlayerId) => {
    const us = ctx.units(p);
    return us.length === 1 && !!us[0]!.leader && !!card(us[0]!.leader!).soloWinsMoralCheck;
  };
  const sA = solo('A'), sB = solo('B');
  const total = (p: PlayerId) => ctx.units(p).filter(u => !card(u.cardId).excludeFromMoralTotal).reduce((s, u) => s + u.currentMor, 0);
  const totals = { A: total('A'), B: total('B') };
  let loser: PlayerId | null = null;
  if (sA !== sB) loser = sA ? 'B' : 'A';
  else if (totals.A < totals.B) loser = 'A';
  else if (totals.B < totals.A) loser = 'B';
  ctx.emit({ type: 'moralCheck', totals, loser, amount: loser ? lvl : 0 });
  if (loser) {
    ctx.gainLassitude(loser, lvl, 'moralCheck');
    scenarioMoralCheckLost(ctx, loser);
  }
}
