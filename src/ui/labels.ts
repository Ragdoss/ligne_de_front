// Libellés d'interface (français).
import { card } from '../engine/ctx';
import type { ChoiceOption, Faction, PendingChoice } from '../engine/types';
import { CARD_TEXT_FR } from '../i18n/cards.fr';

export const cardName = (id: string) => CARD_TEXT_FR[id]?.name ?? id;
export const cardDesc = (id: string) => CARD_TEXT_FR[id]?.desc ?? '';

export const FACTION_LABEL: Record<Faction, string> = {
  empire: 'Empire', elfe: 'Royaumes Elfiques', demons: 'Invocateurs de Démons', nomades: 'Nomades', neutre: 'Neutre',
};
export const PLAYABLE_FACTIONS: Faction[] = ['empire', 'elfe', 'demons', 'nomades'];

export const TYPE_LABEL: Record<string, string> = { Regiment: 'Régiment', Leader: 'Leader', Tactique: 'Tactique' };

export const UNPLAYABLE: Record<string, string> = {
  level: 'niveau insuffisant',
  resource: 'pas assez de ressource',
  noEffect: "n'aurait aucun effet maintenant",
  condition: 'condition non remplie',
  noTarget: 'aucune cible possible',
  scenarioOnly: 'carte de scénario',
  unique: 'unique : déjà en jeu',
};

/** Mots-clés techniques (déjà expliqués par le texte de la carte) masqués à l'affichage. */
export const visibleKeywords = (kws: string[]) => kws.filter(k => !/^[A-Z][a-zé]+[A-Z]/.test(k));
/** Mots-clés gardés au Moral brisé : les mots-clés négatifs (Lent) et Minions. */
export const KEPT_WHEN_BROKEN = ['Lent', 'Minions'];

export function choiceTitle(c: PendingChoice): string {
  const remaining = Number(c.data.n);
  switch (c.kind) {
    case 'vision': return 'Vision : choisis la prochaine tactique que tu piocheras';
    case 'promotionDiscard': return 'Promotion : choisis le Leader de ta main à défausser';
    case 'promotionPick': return 'Promotion : choisis le Leader à piocher';
    case 'recoverDemon': return 'Suppôt Infernal : récupère une copie d’un Démon de ta défausse (coûte 2 de moins)';
    case 'recoverDemonOs': return 'Veilleur d’Os : récupère un Démon de ta défausse (tu gagnes autant de lassitude que son niveau)';
    case 'ranconAmes': return 'Rançon d’Âmes : combien de points de lassitude paies-tu ? (+5 ATK par point)';
    case 'tuteur': return 'Tuteur Démoniaque : quel niveau de Démon cherches-tu ?';
    case 'handDiscard':
      return c.source === 'handLimit'
        ? `Main pleine : défausse une carte avant de piocher (encore ${remaining})`
        : `${cardName(c.source)} : défausse une carte de ta main (encore ${remaining})`;
    case 'relics': return 'Chasseur de Reliques : choisis un régiment de la défausse adverse et la statistique gagnée';
    case 'shadow': return 'Marchand d’Ombres : main adverse révélée, choisis la carte qu’il défausse';
    case 'caravane': return 'Caravane Marchande : supprime une carte de la défausse adverse (durée de vie + son niveau)';
    case 'ransomDesert': return 'Rançon du Désert : supprime une carte de la défausse adverse';
    case 'frondeurStun': return 'Frondeur Nomade : choisis le régiment adverse à sonner (il n’attaquera pas à ce combat)';
    case 'offrande': return `${cardName(c.source)} : paies-tu l’Offrande (${c.data.x} lassitude) pour l’effet renforcé ?`;
    case 'grimoire': return `Grimoire interdit : choisis une carte de ta main à remettre sur ta pioche (encore ${c.data.left}${Number(c.data.shuffle) ? ' ; ta pioche sera mélangée ensuite' : ' ; la première remise sera piochée en premier'})`;
    case 'augure': return 'Augure de l’Abîme : place chaque carte au-dessus ou en dessous de ta pioche (la première placée au-dessus sera piochée en premier)';
    case 'chuchoteur': return `Chuchoteur des abysses : garder la carte du dessus, ou la défausser (encore ${c.data.left} regard(s))`;
    case 'marchandAmes': return 'Marchand d’âmes : retire un régiment de la défausse adverse (ressources = son niveau)';
    case 'placeControlled': return `${cardName(c.source)} : choisis où poser le régiment dont tu prends le contrôle`;
    case 'placeToken': return `${cardName(c.source)} : choisis la case avant du jeton (encore ${c.data.left})`;
    case 'marche': return `${cardName(c.source)} — Marché : défausser une carte de ta main pour en piocher une ?`;
  }
}

export function optionLabel(c: PendingChoice, o: ChoiceOption): string {
  if (o.label) return o.label;
  if (o.skip) return 'Ne rien récupérer';
  if (o.stat && o.cardId) {
    const d = card(o.cardId);
    return `${cardName(o.cardId)} → +${o.stat === 'atk' ? `${d.atk} ATK` : `${d.arm} ARM`}`;
  }
  if (o.where && o.cardId) return `${cardName(o.cardId)} — ${o.where}`;
  if (o.cardId) {
    const d = card(o.cardId);
    return `${cardName(o.cardId)} — niv. ${d.niveau}, coût ${d.dynamicCost ? 'variable' : d.cout}`;
  }
  if (o.value !== undefined) return c.kind === 'tuteur' ? `Niveau ${o.value}` : `${o.value}`;
  return '?';
}
