// Combat de fin de tour et comparaison de Moral.

import { Ctx, addKeyword, card, keywordValue, opponentOf } from './ctx';
import { scenarioMoralCheckLost } from './scenario';
import type { PlayerId, Unit, Zone } from './types';

function lowestMoral(list: (Unit | null | undefined)[]): Unit | null {
  let best: Unit | null = null;
  for (const u of list) if (u && (!best || u.currentMor < best.currentMor)) best = u;
  return best;
}

/**
 * Cible d'un attaquant :
 * - avec Distance (avant, arrière ou isolé) : le plus faible en Moral de tout l'avant et l'arrière adverses
 *   (Traqueuse sylvestre : la plus basse END ; Marque du chasseur : le régiment marqué) ;
 * - avant sans Distance : le régiment en miroir, sinon le plus faible en Moral parmi les arrières adjacents (percée)
 *   (Visez les faibles : le régiment arrière désigné) ;
 * - arrière sans Distance : le plus faible des deux avants adjacents, sinon l'arrière en miroir.
 */
export function pickTarget(ctx: Ctx, a: Unit, p: PlayerId, zone: Zone, idx: number): Unit | null {
  const opp = ctx.player(opponentOf(p)).board;
  const distance = ctx.hasDistance(a);
  const all = [...opp.avant, ...opp.arriere];
  if (distance) {
    // Marque du chasseur : les régiments à Distance de ce joueur attaquent le régiment marqué.
    const marked = all.find(u => u && u.markedBy === p);
    if (marked) return marked;
    // Sentinelle de chêne : les régiments à Distance doivent l'attaquer.
    const taunts = all.filter(u => u && !u.brokenMorale && card(u.cardId).tauntsDistance);
    if (taunts.length) return lowestMoral(taunts);
    if (card(a.cardId).targetsLowestEnd && !a.brokenMorale) { // Traqueuse sylvestre
      let best: Unit | null = null;
      for (const u of all) if (u && (!best || u.currentEnd < best.currentEnd)) best = u;
      return best;
    }
    return lowestMoral(all);
  }
  if (zone === 'avant') {
    const exposed = opp.arriere.find(u => u && u.exposedTo === p); // Visez les faibles
    if (exposed) return exposed;
    return opp.avant[idx] ?? lowestMoral(ctx.adjBack(idx).map(k => opp.arriere[k]));
  }
  if (zone === 'arriere') return lowestMoral(ctx.adjFront(idx).map(i => opp.avant[i])) ?? opp.arriere[idx] ?? null;
  return null;
}

/** Chant de la traque : les régiments à Distance de `p` frappent tout de suite (par initiative décroissante). */
export function volley(ctx: Ctx, p: PlayerId): void {
  const shooters = ctx.units(p).filter(u => ctx.hasDistance(u) && ctx.effectiveAtk(u) > 0 && !u.stunned)
    .sort((x, y) => ctx.effectiveIni(y) - ctx.effectiveIni(x));
  for (const u of shooters) {
    if (ctx.over) return;
    const pos = ctx.slotOf(u.uid);
    if (!pos || pos.player !== p || isRooted(ctx, u)) continue;
    const t = pickTarget(ctx, u, p, pos.zone, pos.idx);
    if (t) attack(ctx, u, t);
  }
  if (!ctx.over) for (const x of ctx.units(opponentOf(p))) if (x.markedBy === p) x.markedBy = null;
}

/** Racines immobilisantes : le régiment ne peut pas attaquer tant que le lanceur contrôle un Élémentaux. */
function isRooted(ctx: Ctx, u: Unit): boolean {
  return !!u.rootedBy && ctx.units(u.rootedBy).some(x => x.types.includes('Élémentaux'));
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

  // Gardienne du seuil : avant les attaques, ses voisins de la ligne avant regagnent END et Moral (à chaque combat).
  for (const p of ['A', 'B'] as PlayerId[]) {
    for (const g of ctx.units(p)) {
      const h = card(g.cardId).healsFrontNeighborsBeforeCombat as { end: number; mor: number } | undefined;
      const ref = h && !g.brokenMorale ? ctx.slotOf(g.uid) : null;
      if (!ref) continue;
      for (const n of ctx.neighbors(ref)) if (ctx.slotOf(n.uid)?.zone === 'avant') ctx.heal(n, h!.end, h!.mor, g.cardId);
    }
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

  // Chevaucheurs du mirage : nombre d'attaques de chaque camp avant la première attaque adverse.
  const firstCount: Record<PlayerId, number> = { A: 0, B: 0 };
  const attacked: Record<PlayerId, boolean> = { A: false, B: false };
  for (const a of eligible) {
    if (ctx.over) return;
    const pos = ctx.slotOf(a.u.uid);
    if (!pos || pos.player !== a.p) continue; // détruit (ou libéré : il a changé de camp) plus tôt dans ce combat
    if (a.u.stunned) {
      a.u.stunned = false;
      ctx.emit({ type: 'skipAttack', uid: a.u.uid, cardId: a.u.cardId, reason: 'stunned' });
      continue;
    }
    if (isRooted(ctx, a.u)) { ctx.emit({ type: 'skipAttack', uid: a.u.uid, cardId: a.u.cardId, reason: 'rooted' }); continue; }
    if (ctx.effectiveAtk(a.u) <= 0) {
      if ((card(a.u.cardId).atk ?? 0) > 0) ctx.emit({ type: 'skipAttack', uid: a.u.uid, cardId: a.u.cardId, reason: 'noAtk' });
      continue;
    }
    // La position est relue : un régiment peut avoir été déplacé avant son attaque.
    const target = pickTarget(ctx, a.u, a.p, pos.zone, pos.idx);
    if (!target) continue;
    if (!attacked[opponentOf(a.p)]) firstCount[a.p]++;
    attacked[a.p] = true;
    attack(ctx, a.u, target);
    // Cuirassiers lourds : une seconde attaque après avoir détruit un régiment (une fois par combat).
    if (!ctx.over && card(a.u.cardId).extraAttackOnKill && !ctx.isAlive(target) && ctx.isAlive(a.u) && !a.u.brokenMorale) {
      const pos3 = ctx.slotOf(a.u.uid);
      const t3 = pos3 && pos3.player === a.p ? pickTarget(ctx, a.u, a.p, pos3.zone, pos3.idx) : null;
      if (t3) attack(ctx, a.u, t3);
    }
    // Grand Maître d'armes : seconde frappe à moitié d'ATK.
    if (!ctx.over && a.u.leader && !a.u.brokenMorale && card(a.u.leader).leaderDoubleStrike) {
      const pos2 = ctx.slotOf(a.u.uid);
      const t2 = pos2 && pos2.player === a.p ? pickTarget(ctx, a.u, a.p, pos2.zone, pos2.idx) : null;
      if (t2) attack(ctx, a.u, t2, 0.5);
    }
  }
  if (ctx.over) return;
  for (const p of ['A', 'B'] as PlayerId[]) {
    if (firstCount[p] < 3) continue;
    for (const u of ctx.units(p)) if (card(u.cardId).mirageIfThreeFirstAttacks) { addKeyword(u, 'Mirage 1'); ctx.emit({ type: 'effect', key: 'mirageGained', player: p, cardId: u.cardId, data: { uid: u.uid } }); }
  }

  // Fin des effets ponctuels de combat et de la pénalité d'apparition.
  for (const p of ['A', 'B'] as PlayerId[]) {
    for (const u of ctx.units(p)) {
      u.justDeployed = false;
      u.ignoreArmor = false;
      u.tempAtk = 0; u.tempDebuffAtk = 0; u.tempArm = 0; u.tempIni = 0;
      u.stunned = !!u.stunHold; // Chaînes de l'Abîme avec Offrande : reste sonné jusqu'au prochain tour du lanceur
      u.woundedByFrondeur = false;
      u.blinded = false;
      u.markedBy = null; u.exposedTo = null; // Marque du chasseur, Visez les faibles : « ce tour-ci »
    }
  }
  if (ctx.over) return;
  moralCheck(ctx);
}

export function attack(ctx: Ctx, a: Unit, target: Unit, mult = 1): void {
  // Mirage X : l'attaque frappe le vide (X fois par partie ; perdu avec le Moral brisé).
  const mirage = target.brokenMorale ? 0 : keywordValue(target, 'Mirage');
  if (mirage > 0) {
    target.keywords = target.keywords.filter(k => !k.startsWith('Mirage '));
    if (mirage > 1) target.keywords.push(`Mirage ${mirage - 1}`);
    ctx.emit({ type: 'effect', key: 'mirage', player: target.controller, cardId: target.cardId, data: { uid: target.uid, attacker: a.cardId } });
    return;
  }
  let atk = Math.round(ctx.effectiveAtk(a) * mult);
  // Sentinelle de chêne : Communion, ses attaquants perdent de l'ATK.
  const loss = card(target.cardId).communionAttackerAtkLoss as number | undefined;
  if (loss && !target.brokenMorale && ctx.communion(target.controller)) atk = Math.max(0, atk - loss);
  // Gardien des chaînes : attaquer un de ses voisins coûte de l'ATK.
  const tPos = ctx.slotOf(target.uid);
  if (tPos) for (const g of ctx.neighbors(tPos)) if (!g.brokenMorale && g.chainsLoss) atk = Math.max(0, atk - g.chainsLoss);
  const vsMounted = card(a.cardId).bonusVsMounted ?? (a.types.includes('Lancier') ? 10 : 0);
  if (vsMounted && target.types.includes('Monté') && !a.brokenMorale) atk += vsMounted;
  const vsTypes = card(a.cardId).bonusVsTypes as Record<string, number> | undefined;
  if (vsTypes && !a.brokenMorale) for (const [t, v] of Object.entries(vsTypes)) if (target.types.includes(t)) atk += v;
  const vsBroken = card(a.cardId).bonusVsBroken as number | undefined; // Sentinelle des cimes
  if (vsBroken && target.brokenMorale && !a.brokenMorale) atk += vsBroken;
  // Maître des embuscades : + l'avance d'INI de l'attaquant sur sa cible.
  if (a.leader && !a.brokenMorale && card(a.leader).leaderIniDiffAtk) atk += Math.max(0, ctx.effectiveIni(a) - ctx.effectiveIni(target));
  // Pénétration d'armure X : l'attaquant ignore les X premiers points d'Armure de sa cible.
  const penVal = (a.brokenMorale ? 0 : keywordValue(a, 'Pénétration')) // cumulée, comme tout mot-clé chiffré
    + (target.markedBy === a.controller && ctx.hasDistance(a) ? ((card('marque_chasseur').markPen as number | undefined) ?? 5) : 0); // Marque du chasseur
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
  // Gargouille sentinelle : attaquer un de ses alliés adjacents coûte du Moral à l'attaquant.
  const tRef = ctx.slotOf(target.uid);
  let punish = 0;
  if (tRef) for (const g of ctx.neighbors(tRef)) if (!g.brokenMorale) punish += (card(g.cardId).punishesAttackersOfNeighbors as number | undefined) ?? 0;
  const owner = target.controller;
  // Débordement X : frapper un régiment de première ligne blesse aussi les deux régiments derrière lui.
  const over = a.brokenMorale ? 0 : keywordValue(a, 'Débordement');
  if (over && tRef?.zone === 'avant') {
    for (const k of ctx.adjBack(tRef.idx)) {
      const b = ctx.player(owner).board.arriere[k];
      if (!b) continue;
      b.currentEnd = Math.max(0, b.currentEnd - over);
      ctx.emit({ type: 'effect', key: 'debordement', player: a.controller, cardId: a.cardId, data: { uid: b.uid, target: b.cardId, damage: over } });
      if (b.currentEnd <= 0) { ctx.destroy(b, 'end', a); if (ctx.over) return; }
    }
  }
  if (dead) {
    const cause = target.currentEnd <= 0 && target.currentMor <= 0 ? 'both' : target.currentEnd <= 0 ? 'end' : 'moral';
    ctx.destroy(target, cause, a);
    if (ctx.over) return;
    // Seigneur des tourments : chaque régiment détruit par le porteur donne de la lassitude à l'adversaire.
    const kl = a.leader && !a.brokenMorale && !ctx.isAlive(target) ? card(a.leader).leaderKillLassitude as number | undefined : undefined;
    if (kl) { ctx.gainLassitude(owner, kl, a.leader!); if (ctx.over) return; }
    if (ctx.isAlive(a) && !a.brokenMorale && !ctx.isAlive(target)) { // (Racines protectrices, Bénédiction : la cible a pu survivre)
      // Pillage X : l'adversaire défausse le dessus de sa pioche.
      const pil = keywordValue(a, 'Pillage');
      if (pil) ctx.mill(owner, pil, a.cardId);
      // Cavaliers de la Garde : ses alliés adjacents regagnent du Moral.
      const rally = card(a.cardId).killRalliesNeighbors as number | undefined;
      const aRef = ctx.slotOf(a.uid);
      if (rally && aRef) for (const n of ctx.neighbors(aRef)) ctx.heal(n, 0, rally, a.cardId);
    }
  }
  if (punish && !ctx.over && ctx.isAlive(a)) {
    const lost = ctx.loseMoral(a, punish);
    if (lost) ctx.emit({ type: 'moralLoss', uid: a.uid, cardId: a.cardId, amount: lost, source: 'gargouille_sentinelle' });
    ctx.checkBroken(a);
    if (a.currentMor <= 0) ctx.destroy(a, 'moral');
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
