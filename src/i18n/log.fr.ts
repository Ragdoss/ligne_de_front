// Traduction des événements du moteur en lignes de journal (français).
import type { GameEvent, PlayerId, SlotRef } from '../engine/types';
import { CARD_TEXT_FR } from './cards.fr';

export const cardName = (id: string): string => CARD_TEXT_FR[id]?.name ?? id;
const zoneFr = (r: SlotRef) => (r.zone === 'isole' ? 'isolé' : `${r.zone === 'avant' ? 'avant' : 'arrière'} ${r.idx + 1}`);

const REASONS: Record<string, string> = {
  lassitude: 'a atteint sa limite de lassitude',
  noRegiment: "n'a plus aucun régiment en fin de tour",
  emptyDeck: 'doit piocher mais sa pioche est vide',
  vitalDestroyed: 'a perdu son régiment vital',
};

const LASSITUDE_SOURCES: Record<string, string> = {
  destroyed: 'régiment détruit', moralCheck: 'comparaison de Moral', scenario: 'scénario',
};

export function formatEvent(e: GameEvent, names: Record<PlayerId, string> = { A: 'Joueur A', B: 'Joueur B' }): string | null {
  const n = (p: PlayerId) => names[p];
  switch (e.type) {
    case 'turnStart':
      return `Tour ${e.turn} : ${n(e.player)} — ressource ${e.resource}${e.leftover ? ` (dont ${e.leftover} reportée(s))` : ''}, pioche ${e.drawn.length ? e.drawn.map(cardName).join(', ') : 'aucune carte'}${e.blocked ? ` (${e.blocked} bloquée(s) : main pleine)` : ''}.`;
    case 'cardPlayed': return `${n(e.player)} joue ${cardName(e.cardId)} (coût ${e.cost}).`;
    case 'deployed': return `${cardName(e.cardId)} est déployé en ${zoneFr(e.slot)}.`;
    case 'leaderAttached': return `${cardName(e.leaderId)} prend la tête de ${cardName(e.cardId)}.`;
    case 'combatStart': return `— Combat de fin de tour (${n(e.player)}) —`;
    case 'attack':
      return `${cardName(e.attackerCard)} attaque ${cardName(e.targetCard)} : ${e.damage} dégâts (ATK ${e.atk} − ARM ${e.arm}), END ${e.end}, perd ${e.moralLoss} Moral (MOR ${e.mor}).`;
    case 'stunned': return `${cardName(e.cardId)} est sonné.`;
    case 'skipAttack': return e.reason === 'stunned' ? `${cardName(e.cardId)} est sonné : il n'attaque pas.` : `${cardName(e.cardId)} n'a plus d'ATK : il n'attaque pas.`;
    case 'destroyed': {
      const why = e.cause === 'moral' ? ' (déroute)' : e.cause === 'end' ? '' : e.cause === 'both' ? ' (Endurance et Moral à 0)' : '';
      return `${cardName(e.cardId)} (${n(e.player)}) est détruit${why}${e.lassitude ? ` — +${e.lassitude} lassitude` : ''}.`;
    }
    case 'heal': {
      const parts = [e.end ? `${e.end} END` : '', e.mor ? `${e.mor} Moral` : ''].filter(Boolean).join(' et ');
      return `${cardName(e.cardId)} regagne ${parts} (${cardName(e.source)}).`;
    }
    case 'moralLoss': return null; // trop verbeux : déjà couvert par la destruction de l'allié
    case 'lassitude':
      return e.amount > 0
        ? `${n(e.player)} gagne ${e.amount} point(s) de lassitude (${LASSITUDE_SOURCES[e.source] ?? cardName(e.source)}) — total ${e.total}.`
        : `${n(e.player)} perd ${-e.amount} point(s) de lassitude — total ${e.total}.`;
    case 'levelUp': return `${n(e.player)} passe niveau ${e.level}.`;
    case 'reserveJoined': return `${n(e.player)} : ${e.count} carte(s) de niveau 4-5 rejoignent la pioche.`;
    case 'moralCheck':
      return e.loser ? `Moral total ${e.totals.A} contre ${e.totals.B} : ${n(e.loser)} gagne ${e.amount} point(s) de lassitude.` : `Moral total égal (${e.totals.A}) : aucune lassitude.`;
    case 'resource': return `${n(e.player)} gagne ${e.amount} ressource(s) (${e.source === 'paysans' ? 'Paysans' : 'régiments générateurs'}).`;
    case 'draw': return e.source === 'turn' ? null : `${n(e.player)} pioche ${cardName(e.cardId)} (${cardName(e.source)}).`;
    case 'generated': return `${cardName(e.cardId)} est créé dans la main de ${n(e.player)} (${cardName(e.source)}).`;
    case 'returnedToHand': return `${cardName(e.cardId)} retourne dans la main de ${n(e.player)}.`;
    case 'moved': return `${cardName(e.cardId)} est déplacé de ${zoneFr(e.from)} vers ${zoneFr(e.to)}.`;
    case 'leaderDestroyed': return `${cardName(e.leaderId)}, à la tête de ${cardName(e.cardId)}, est éliminé.`;
    case 'left': return `${cardName(e.cardId)} quitte le plateau (fin de durée de vie).`;
    case 'effect': return `${cardName(e.cardId)} : effet appliqué.`;
    case 'choice': return null;
    case 'discarded': return `${n(e.player)} défausse ${cardName(e.cardId)} (${cardName(e.source)}).`;
    case 'intercepted': return `Saboteur Nomade : ${cardName(e.cardId)}, piochée par ${n(e.player)}, part en défausse (le Saboteur perd ${e.moralLoss} Moral).`;
    case 'freeCopy': return `Archéotacticiens : ${n(e.player)} reçoit une copie gratuite de ${cardName(e.cardId)}.`;
    case 'sacrificed': return `${cardName(e.cardId)} est sacrifié pour invoquer ${cardName(e.forCard)}.`;
    case 'gameOver': return `Fin de partie : ${n(e.winner)} l'emporte — l'adversaire ${REASONS[e.reason] ?? e.reason}.`;
  }
}
