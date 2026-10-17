// File des choix en attente : calcul des options quand un choix devient actif, et application du choix.

import { Ctx, card, opponentOf } from './ctx';
import { applyOffrande, isDemonRegiment } from './play';
import { CARD_TEXT_FR } from '../i18n/cards.fr';
import type { ChoiceOption, PendingChoice } from './types';

const unique = (ids: string[]) => Array.from(new Set(ids));

function computeOptions(ctx: Ctx, c: PendingChoice): ChoiceOption[] {
  const pl = ctx.player(c.player);
  const opp = ctx.player(opponentOf(c.player));
  switch (c.kind) {
    case 'vision':
      return pl.deck.filter(id => card(id).cardType === 'Tactique').slice(0, 3).map(cardId => ({ cardId }));
    case 'promotionDiscard':
      return pl.hand.filter(h => card(h.cardId).cardType === 'Leader').map(h => ({ handUid: h.uid, cardId: h.cardId }));
    case 'promotionPick':
      return pl.deck.filter(id => card(id).cardType === 'Leader').slice(0, 2).map(cardId => ({ cardId }));
    case 'recoverDemon':
      return unique(pl.discard.filter(isDemonRegiment)).map(cardId => ({ cardId }));
    case 'recoverDemonOs': {
      const opts: ChoiceOption[] = unique(pl.discard.filter(isDemonRegiment)).map(cardId => ({ cardId }));
      return opts.length ? [...opts, { skip: true }] : [];
    }
    case 'ranconAmes':
      return ctx.findUnit(Number(c.data.uid)) ? [1, 2, 3, 4, 5].map(value => ({ value })) : [];
    case 'tuteur': {
      const levels = unique(pl.deck.filter(isDemonRegiment).map(id => String(card(id).niveau))).map(Number).sort((a, b) => a - b);
      return levels.map(value => ({ value }));
    }
    case 'handDiscard':
      return Number(c.data.n) > 0 ? pl.hand.map(h => ({ handUid: h.uid, cardId: h.cardId })) : [];
    case 'relics': {
      if (!ctx.findUnit(Number(c.data.uid))) return [];
      const out: ChoiceOption[] = [];
      for (const id of unique(opp.discard.filter(x => card(x).cardType === 'Regiment'))) {
        if ((card(id).atk ?? 0) > 0) out.push({ cardId: id, stat: 'atk' });
        if ((card(id).arm ?? 0) > 0) out.push({ cardId: id, stat: 'arm' });
      }
      return out;
    }
    case 'shadow':
      return opp.hand.map(h => ({ handUid: h.uid, cardId: h.cardId }));
    case 'caravane':
      return ctx.findUnit(Number(c.data.uid)) ? unique(opp.discard).map(cardId => ({ cardId })) : [];
    case 'ransomDesert':
      return unique(opp.discard).map(cardId => ({ cardId }));
    case 'frondeurStun':
      return ctx.units(opponentOf(c.player)).map(u => {
        const r = ctx.slotOf(u.uid)!;
        return { value: u.uid, cardId: u.cardId, where: r.zone === 'isole' ? 'isolé' : `${r.zone === 'avant' ? 'avant' : 'arrière'} ${r.idx + 1}` };
      });
    case 'offrande': {
      const x = Number(c.data.x);
      return [{ value: 0, label: 'Ne pas payer l’Offrande' }, { value: 1, label: `Payer l’Offrande : +${x} lassitude` }];
    }
    case 'augure': {
      const rest = String(c.data.rest ?? '').split(',').filter(Boolean);
      const out: ChoiceOption[] = [];
      rest.forEach((cardId, i) => {
        out.push({ cardId, value: i * 2, label: `${cardName(cardId)} → au-dessus de la pioche` });
        out.push({ cardId, value: i * 2 + 1, label: `${cardName(cardId)} → en dessous de la pioche` });
      });
      return out;
    }
    case 'chuchoteur': {
      const top = pl.deck[0];
      if (!top || Number(c.data.left) <= 0) return [];
      return [{ cardId: top, value: 1, label: `Garder ${cardName(top)} sur le dessus` }, { cardId: top, value: 0, label: `Défausser ${cardName(top)} (+1 lassitude)` }];
    }
    case 'marchandAmes':
      return unique(opp.discard.filter(x => card(x).cardType === 'Regiment')).map(cardId => ({ cardId }));
    case 'placeControlled': {
      const u = ctx.findUnit(Number(c.data.uid));
      if (!u || u.controller === c.player) return [];
      const L = ctx.s.config.layout;
      const out: ChoiceOption[] = [];
      for (const zone of ['avant', 'arriere'] as const) for (let idx = 0; idx < L[zone]; idx++) {
        if (!pl.board[zone][idx]) out.push({ slot: { zone, idx }, label: `Poser ${cardName(u.cardId)} en ${zone === 'avant' ? 'avant' : 'arrière'} ${idx + 1}` });
      }
      return out;
    }
    case 'placeToken': {
      if (Number(c.data.left) <= 0) return [];
      return pl.board.avant.map((u, idx) => (u ? null : { slot: { zone: 'avant' as const, idx }, label: `Poser ${cardName(String(c.data.cardId))} en avant ${idx + 1}` })).filter((o): o is NonNullable<typeof o> => !!o);
    }
    case 'marche': {
      if (!pl.hand.length || !pl.deck.length) return [];
      return [{ skip: true, label: 'Ne rien échanger' }, ...pl.hand.map(h => ({ handUid: h.uid, cardId: h.cardId, label: `Défausser ${cardName(h.cardId)} et piocher` }))];
    }
  }
}
const cardName = (id: string) => CARD_TEXT_FR[id]?.name ?? id;

/** Quand un choix n'a aucune option, il se termine sans effet (sauf la fin du vol de ravitaillement). */
function finishWithoutOptions(ctx: Ctx, c: PendingChoice): void {
  if (c.kind === 'handDiscard' && c.data.drawAfter) {
    // Main pleine en début de tour : les défausses sont faites, on pioche.
    for (let i = 0; i < Number(c.data.drawAfter) && !ctx.over; i++) ctx.draw(c.player, 'handLimit');
  } else if (c.kind === 'handDiscard' && c.data.thief) {
    const thief = c.data.thief as 'A' | 'B';
    const gain = Math.max(0, Number(c.data.gainBase) - Number(c.data.sum));
    ctx.player(thief).resource += gain;
    ctx.emit({ type: 'resource', player: thief, amount: gain, source: c.source });
  } else if (c.kind === 'placeControlled') {
    // Aucune case libre : le régiment pris part dans la défausse de son propriétaire.
    const u = ctx.findUnit(Number(c.data.uid));
    if (u && u.controller !== c.player) ctx.discardControlled(u, c.player, c.source);
  } else if (c.kind !== 'handDiscard') {
    ctx.emit({ type: 'effect', key: 'choiceEmpty', player: c.player, cardId: c.source, data: { kind: c.kind } });
  }
}

/** Active le premier choix de la file (calcule ses options) ; saute ceux qui n'ont aucune option. */
export function activateChoices(ctx: Ctx): void {
  const q = ctx.s.pending;
  while (q.length && !ctx.over) {
    const head = q[0]!;
    if (head.options) return;
    const opts = computeOptions(ctx, head);
    if (opts.length) {
      head.options = opts;
      ctx.emit({ type: 'choice', player: head.player, kind: head.kind });
      return;
    }
    q.shift();
    finishWithoutOptions(ctx, head);
  }
  if (ctx.over) ctx.s.pending = [];
}

export function resolveChoice(ctx: Ctx, index: number): string | null {
  const c = ctx.s.pending[0];
  if (!c || !c.options) return 'noChoice';
  const o = c.options[index];
  if (!Number.isInteger(index) || !o) return 'badOption';
  ctx.s.pending.shift();
  const p = c.player;
  const q = opponentOf(p);
  const pl = ctx.player(p);
  const opp = ctx.player(q);
  const removeFrom = (list: string[], id: string) => { const i = list.indexOf(id); if (i !== -1) list.splice(i, 1); };
  const note = (key: string, data?: Record<string, unknown>) => ctx.emit({ type: 'effect', key, player: p, cardId: c.source, data });

  switch (c.kind) {
    case 'vision':
      removeFrom(pl.deck, o.cardId!);
      pl.deck = [o.cardId!, ...ctx.shuffle(pl.deck)];
      note('visionChosen', { chosen: o.cardId });
      break;
    case 'promotionDiscard':
      ctx.discardFromHand(p, o.handUid!, c.source);
      ctx.s.pending.unshift({ kind: 'promotionPick', player: p, source: c.source, options: null, data: {} });
      break;
    case 'promotionPick':
      removeFrom(pl.deck, o.cardId!);
      ctx.deliverDrawn(p, o.cardId!, c.source);
      pl.deck = ctx.shuffle(pl.deck);
      break;
    case 'recoverDemon': {
      const discount = (card(c.source).recoverDiscount as number | undefined) ?? 2;
      ctx.addToHand(p, o.cardId!, { discount });
      note('recovered', { cardId: o.cardId, discount });
      break;
    }
    case 'recoverDemonOs':
      if (o.skip) { note('recoverSkipped'); break; }
      removeFrom(pl.discard, o.cardId!);
      ctx.addToHand(p, o.cardId!);
      note('recovered', { cardId: o.cardId });
      ctx.gainLassitude(p, card(o.cardId!).niveau, c.source);
      break;
    case 'ranconAmes': {
      const u = ctx.findUnit(Number(c.data.uid))!;
      u.tempAtk += 5 * o.value!;
      note('ranconAmes', { uid: u.uid, x: o.value });
      ctx.gainLassitude(p, o.value!, c.source);
      break;
    }
    case 'tuteur': {
      const i = pl.deck.findIndex(id => isDemonRegiment(id) && card(id).niveau === o.value);
      const id = pl.deck.splice(i, 1)[0]!;
      ctx.deliverDrawn(p, id, c.source);
      const gain = i + 1;
      pl.resource += gain;
      ctx.emit({ type: 'resource', player: p, amount: gain, source: c.source });
      ctx.gainLassitude(p, gain, c.source);
      break;
    }
    case 'handDiscard': {
      const id = ctx.discardFromHand(p, o.handUid!, c.source)!;
      const next = { ...c, options: null, data: { ...c.data, n: Number(c.data.n) - 1, sum: Number(c.data.sum) + card(id).niveau } };
      ctx.s.pending.unshift(next); // continue (ou se termine avec le gain du voleur quand il n'y a plus rien à défausser)
      break;
    }
    case 'relics': {
      const u = ctx.findUnit(Number(c.data.uid))!;
      removeFrom(opp.discard, o.cardId!);
      if (o.stat === 'atk') u.baseAtk += card(o.cardId!).atk ?? 0; else u.baseArm += card(o.cardId!).arm ?? 0;
      note('relics', { uid: u.uid, cardId: o.cardId, stat: o.stat });
      break;
    }
    case 'shadow':
      ctx.discardFromHand(q, o.handUid!, c.source);
      break;
    case 'caravane': {
      const u = ctx.findUnit(Number(c.data.uid))!;
      removeFrom(opp.discard, o.cardId!);
      if (u.vieTours !== null) u.vieTours += card(o.cardId!).niveau;
      note('caravane', { uid: u.uid, cardId: o.cardId });
      break;
    }
    case 'frondeurStun': {
      const t = ctx.findUnit(o.value!);
      if (!t) break;
      t.stunned = true;
      ctx.emit({ type: 'stunned', uid: t.uid, cardId: t.cardId, by: Number(c.data.uid) });
      break;
    }
    case 'offrande':
      applyOffrande(ctx, p, c.source, o.value === 1, Number(c.data.x), c.data.uid === null ? null : Number(c.data.uid));
      break;
    case 'augure': {
      const rest = String(c.data.rest).split(',').filter(Boolean);
      const i = Math.floor(o.value! / 2);
      const id = rest.splice(i, 1)[0]!;
      const top = String(c.data.top).split(',').filter(Boolean), bottom = String(c.data.bottom).split(',').filter(Boolean);
      (o.value! % 2 === 0 ? top : bottom).push(id);
      if (rest.length) { ctx.s.pending.unshift({ ...c, options: null, data: { ...c.data, rest: rest.join(','), top: top.join(','), bottom: bottom.join(',') } }); break; }
      // La première carte placée au-dessus sera la première piochée.
      pl.deck = [...top, ...pl.deck, ...bottom];
      note('augure', { top: top.length, bottom: bottom.length });
      break;
    }
    case 'chuchoteur': {
      if (o.value === 1) { note('chuchoteurKeep'); break; }
      ctx.mill(p, 1, c.source);
      ctx.gainLassitude(p, 1, c.source);
      const left = Number(c.data.left) - 1;
      if (left > 0 && !ctx.over) ctx.s.pending.unshift({ ...c, options: null, data: { ...c.data, left } });
      break;
    }
    case 'marchandAmes': {
      removeFrom(opp.discard, o.cardId!);
      const lvl = card(o.cardId!).niveau;
      pl.resource += lvl;
      ctx.emit({ type: 'resource', player: p, amount: lvl, source: c.source });
      note('marchandAmes', { cardId: o.cardId });
      ctx.gainLassitude(p, Math.max(0, lvl - (opp.discardedThisTurn ?? 0)), c.source);
      break;
    }
    case 'placeControlled': {
      const u = ctx.findUnit(Number(c.data.uid));
      if (!u || u.controller === p) break;
      ctx.placeControlled(u, p, { player: p, zone: o.slot!.zone, idx: o.slot!.idx }, c.data.temporary === 1, c.source);
      if (c.data.fullMoral === 1) { u.currentMor = u.maxMor; u.brokenMorale = false; }
      break;
    }
    case 'placeToken': {
      const t = ctx.makeUnit(String(c.data.cardId), p, true);
      pl.board.avant[o.slot!.idx] = t;
      ctx.emit({ type: 'deployed', player: p, uid: t.uid, cardId: t.cardId, slot: { player: p, zone: 'avant', idx: o.slot!.idx } });
      const left = Number(c.data.left) - 1;
      if (left > 0) ctx.s.pending.unshift({ ...c, options: null, data: { ...c.data, left } });
      break;
    }
    case 'marche':
      if (o.skip) break;
      ctx.discardFromHand(p, o.handUid!, c.source);
      if (!ctx.over) ctx.draw(p, c.source);
      break;
    case 'ransomDesert': {
      removeFrom(opp.discard, o.cardId!);
      const n = card(o.cardId!).niveau;
      for (let i = 0; i < n && opp.deck.length; i++) {
        const top = opp.deck.shift()!;
        ctx.discard(q, top);
        ctx.emit({ type: 'discarded', player: q, cardId: top, source: c.source });
      }
      break;
    }
  }
  return null;
}
