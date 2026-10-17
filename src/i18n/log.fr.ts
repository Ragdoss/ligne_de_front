// Traduction des événements du moteur en lignes de journal (français).
import type { GameEvent, PlayerId, SlotRef } from '../engine/types';
import { CARD_TEXT_FR } from './cards.fr';

export const cardName = (id: string): string => CARD_TEXT_FR[id]?.name ?? id;
const srcName = (id: string): string => (id === 'handLimit' ? 'main pleine' : cardName(id));
const zoneFr = (r: SlotRef) => (r.zone === 'isole' ? 'isolé' : `${r.zone === 'avant' ? 'avant' : 'arrière'} ${r.idx + 1}`);

const REASONS: Record<string, string> = {
  lassitude: 'a atteint sa limite de lassitude',
  noRegiment: "n'a plus aucun régiment en fin de tour",
  emptyDeck: 'doit piocher mais sa pioche est vide',
  vitalDestroyed: 'a perdu son régiment vital',
  convoyArrived: 'n\'a pas pu arrêter le convoi',
  survived: 'n\'a pas réussi à l\'emporter à temps',
};

const LASSITUDE_SOURCES: Record<string, string> = {
  destroyed: 'régiment détruit', moralCheck: 'comparaison de Moral', scenario: 'scénario',
};

export function formatEvent(e: GameEvent, names: Record<PlayerId, string> = { A: 'Joueur A', B: 'Joueur B' }): string | null {
  const n = (p: PlayerId) => names[p];
  switch (e.type) {
    case 'turnStart':
      return `Tour ${e.turn} : ${n(e.player)} — ressource ${e.resource}${e.leftover ? ` (dont ${e.leftover} reportée(s))` : ''}, ${e.blocked ? `main pleine : défausse ${e.blocked} carte(s) avant de piocher` : `pioche ${e.drawn.length ? e.drawn.map(cardName).join(', ') : 'aucune carte'}`}.`;
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
      // Déjà annoncée par la ligne de destruction ou de comparaison de Moral.
      if (e.source === 'destroyed' || e.source === 'moralCheck') return null;
      return e.amount > 0
        ? `${n(e.player)} gagne ${e.amount} point(s) de lassitude (${LASSITUDE_SOURCES[e.source] ?? cardName(e.source)}) — total ${e.total}.`
        : `${n(e.player)} perd ${-e.amount} point(s) de lassitude — total ${e.total}.`;
    case 'levelUp': return `${n(e.player)} passe niveau ${e.level}.`;
    case 'reserveJoined': return `${n(e.player)} : ${e.count} carte(s) de niveau 4-5 rejoignent la pioche.`;
    case 'moralCheck':
      return e.loser
        ? `Moral total — ${n('A')} ${e.totals.A}, ${n('B')} ${e.totals.B} : ${n(e.loser)} gagne ${e.amount} point(s) de lassitude.`
        : `Moral total égal (${e.totals.A}) : aucune lassitude.`;
    case 'resource': return `${n(e.player)} gagne ${e.amount} ressource(s) (${e.source === 'paysans' ? 'Paysans' : e.source === 'generator' ? 'régiments générateurs' : e.source === 'scenario' ? 'scénario' : cardName(e.source)}).`;
    case 'draw': return e.source === 'turn' ? null : `${n(e.player)} pioche ${cardName(e.cardId)} (${srcName(e.source)}).`;
    case 'generated': return `${cardName(e.cardId)} est créé dans la main de ${n(e.player)} (${cardName(e.source)}).`;
    case 'returnedToHand': return `${cardName(e.cardId)} retourne dans la main de ${n(e.player)}.`;
    case 'moved': return `${cardName(e.cardId)} est déplacé de ${zoneFr(e.from)} vers ${zoneFr(e.to)}.`;
    case 'leaderDestroyed': return `${cardName(e.leaderId)}, à la tête de ${cardName(e.cardId)}, est éliminé.`;
    case 'left': return `${cardName(e.cardId)} quitte le plateau (fin de durée de vie).`;
    case 'effect': {
      const special: Record<string, string> = {
        convoyHalt: 'Le convoi marque une halte : il n’avance pas ce tour-ci.',
        convoyArrived: 'Le convoi quitte le terrain : il a traversé le col !',
        halteConvoi: `${n(e.player)} ordonne une halte au convoi et pioche une carte.`,
        choiceEmpty: `${cardName(e.cardId)} : rien à choisir, l’effet est sans conséquence.`,
        weather: e.data?.kind === 'tempete' ? 'Une tempête de sable se lève : seuls les Nomades y voient encore (Distance perdue, −20 INI).'
          : e.data?.kind === 'nuit' ? 'La nuit tombe : les Démons gagnent +10 ATK.'
          : e.data?.kind === 'jour' ? 'Le jour se lève : les Elfes gagnent +15 INI.' : 'La tempête retombe.',
        alarm: 'L’alarme est donnée ! Des renforts accourent.',
        liberated: `${cardName(e.cardId)} est libéré et rejoint ${n(e.player)} !`,
        hatch: `${cardName(e.cardId)} éclot !`,
        cheikh: `${cardName(e.cardId)} : la défausse adverse renforce son porteur (+5 ATK).`,
        tempeteSable: `${n(e.player)} soulève une tempête de sable : l’adversaire perd Distance et 20 INI ce tour-ci.`,
        purification: `${cardName(e.cardId)} purifie sa cible.`,
        noTarget: `${cardName(e.cardId)} : aucune cible, sans effet.`,
        controlTaken: `${cardName(e.cardId)} : ${n(e.player)} prend le contrôle de ${cardName(String(e.data?.target ?? ''))} jusqu’à la fin du tour.`,
        controlKept: `${cardName(e.cardId)} : ${cardName(String(e.data?.target ?? ''))} passe pour de bon du côté de ${n(e.player)}.`,
        controlReturned: `${cardName(e.cardId)} retourne auprès de ${n(e.player)}.`,
        controlLost: `${cardName(e.cardId)} ne trouve pas de place pour revenir : il part en défausse.`,
        mirage: `Mirage : l’attaque de ${cardName(String(e.data?.attacker ?? ''))} contre ${cardName(e.cardId)} frappe le vide.`,
        mirageGained: `${cardName(e.cardId)} gagne Mirage 1.`,
        mirageOasis: `${cardName(e.cardId)} : un régiment gagne Mirage 1.`,
        lyraPing: `${cardName(e.cardId)} inflige ${e.data?.damage ?? 10} dégâts à ${cardName(String(e.data?.target ?? ''))}.`,
        growth: `${cardName(e.cardId)} grandit (Croissance).`,
        dryade: `Dryade corrompue : le soin est annulé et devient une baisse de lassitude.`,
        chantSeve: `${cardName(e.cardId)} : deuxième Tactique du tour, +10 ATK.`,
        augure: `${n(e.player)} remet en ordre le dessus de sa pioche.`,
        chuchoteurKeep: `${n(e.player)} garde la carte du dessus de sa pioche.`,
        marchandAmes: `${cardName(e.cardId)} retire ${cardName(String(e.data?.cardId ?? ''))} de la défausse adverse.`,
        terreBrulee: `${cardName(e.cardId)} : ${e.data?.count ?? 0} régiment(s) de la défausse alimentent l’usure, puis sont retirés de la partie.`,
        rempartChair: `${cardName(e.cardId)} : +15 ARM jusqu’au prochain tour (${e.data?.count ?? 0} régiment(s)).`,
      };
      return special[e.key] ?? `${cardName(e.cardId)} : effet appliqué.`;
    }
    case 'choice': return null;
    case 'discarded': return `${n(e.player)} défausse ${cardName(e.cardId)} (${srcName(e.source)}).`;
    case 'intercepted': return `Saboteur Nomade : ${cardName(e.cardId)}, piochée par ${n(e.player)}, part en défausse (le Saboteur perd ${e.moralLoss} Moral).`;
    case 'freeCopy': return `Archéotacticiens : ${n(e.player)} reçoit une copie gratuite de ${cardName(e.cardId)}.`;
    case 'sacrificed': return `${cardName(e.cardId)} est sacrifié pour invoquer ${cardName(e.forCard)}.`;
    case 'dialog': return e.lines.map(l => (l.who ? `${l.who} : « ${l.text} »` : l.text)).join(' ');
    case 'gameOver': return `Fin de partie : ${n(e.winner)} l'emporte — l'adversaire ${REASONS[e.reason] ?? e.reason}.`;
  }
}
