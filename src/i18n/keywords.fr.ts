// Glossaire des mots-clés et termes de règles, affiché à côté d'une carte laissée en grand quelques secondes.
import { CARDS } from '../data/cards';
import { CARD_TEXT_FR } from './cards.fr';

export interface GlossEntry { term: string; text: string }

/** Définitions courtes (le X est la valeur indiquée sur la carte). */
const GLOSS: Record<string, string> = {
  Distance: 'Peut attaquer n’importe quel régiment adverse (hors emplacement isolé), en visant le Moral le plus bas, depuis l’avant comme depuis l’arrière.',
  'Effrayant X': 'Quand ce régiment attaque, sa cible perd X Moral en plus du 1 Moral habituel. Les Effrayant s’additionnent.',
  Ralliement: 'À son arrivée, ses voisins regagnent X Moral.',
  Mirage: 'Les X premières attaques qui le visent frappent le vide (au total, pas par tour).',
  Lent: 'N’attaque qu’au combat de fin de son propre tour, pas à celui de l’adversaire. Gardé même au Moral brisé.',
  Minions: 'À sa destruction, ses alliés ne perdent pas de Moral et son camp ne gagne pas de lassitude. Il ne regagne pas de Moral en détruisant un régiment. Gardé même au Moral brisé.',
  Marché: 'Au début de ton tour, tu peux défausser une carte de ta main pour en piocher une.',
  Pénétration: 'Quand ce régiment attaque, il ignore X points d’Armure de sa cible.',
  Pillage: 'Quand il détruit un régiment, l’adversaire défausse les X cartes du dessus de sa pioche.',
  Débordement: 'Quand il attaque un régiment de la ligne avant, les deux régiments derrière sa cible subissent X dégâts.',
  Prêt: 'Arrive prêt : pas de pénalité d’arrivée, il frappe avec toute son ATK dès le tour où il est posé (sinon, la moitié).',
  'Arrive prêt': 'Pas de pénalité d’arrivée : il frappe avec toute son ATK dès le tour où il est posé (sinon, la moitié).',
  Offrande: 'En jouant la carte, tu peux payer X lassitude pour obtenir l’effet renforcé.',
  'Sacrifice X': 'Pour le poser, sacrifie un de tes régiments de niveau X ou plus : il prend sa place.\nLe Meneur est détruit.',
  Formation: 'Bonus selon les régiments voisins sur la même ligne (à gauche et à droite seulement).',
  'Durée de vie': 'Quitte le plateau après le nombre de tours indiqué.',
  Communion: 'Actif tant que tu contrôles un Elfe et un Élémentaux (deux régiments distincts).',
  Alliance: 'Bonus tant que tes autres régiments réunissent les deux rôles indiqués (au moins un de chaque ; un même régiment peut porter les deux).',
  Unique: 'Un seul exemplaire en jeu à la fois, tous joueurs confondus.',
  Sonné: 'Le régiment n’attaque pas lors du prochain combat.',
  'Moral brisé': 'À un tiers de son Moral ou moins : perd ses mots-clés positifs, les bonus de son Leader et ses capacités ; les tactiques jouées sur lui s’appliquent toujours.',
  Lassitude: 'Points de défaite : en atteindre le seuil (50 en général) fait perdre la partie. Ils font aussi monter de niveau.',
  Leader: 'S’attache à un régiment sans Leader et lui donne ses bonus, tant que ce régiment n’a pas le Moral brisé.',
  Isolé: 'Emplacement à part, presque impossible à cibler, pour les unités de soutien.',
  'Soin simple': 'Soigne 15 d\'Endurance à la cible.',
};

/** Termes cherchés dans le texte d'effet (ordre d'affichage). */
const IN_TEXT: [string, RegExp][] = [
  ['Distance', /\bDistance\b/], ['Effrayant', /Effrayant/], ['Ralliement', /Ralliement/], ['Mirage', /\bMirage\b/], ['Lent', /\bLent\b/],
  ['Minions', /Minions/], ['Marché', /\bMarché\b/], ['Pénétration', /Pénétration/], ['Pillage', /Pillage/], ['Débordement', /Débordement/],
  ['Arrive prêt', /arrive(nt)? prêts?/i], ['Offrande', /Offrande/], ['Sacrifice', /Sacrifice niveau/], ['Formation', /Formation/],
  ['Durée de vie', /Durée de vie/i], ['Communion', /Communion/], ['Alliance', /Alliance/], ['Sonné', /sonnés?\b/i],
  ['Moral brisé', /Moral brisé/i], ['Lassitude', /lassitude/i], ['Isolé', /\bisolé\b/i],
];

const base = (k: string) => k.replace(/\s+\d+$/, '');

/** Mots-clés et termes d'une carte (et de son texte d'effet), avec leur définition. */
export function glossaryFor(id: string): GlossEntry[] {
  const c = CARDS[id];
  if (!c) return [];
  const found = new Set<string>();
  for (const k of c.keywords ?? []) if (GLOSS[base(k)]) found.add(base(k));
  const granted = c.grantsKeywordOnAttach as string | undefined;
  if (granted && GLOSS[base(granted)]) found.add(base(granted));
  if (c.unique) found.add('Unique');
  if (c.arrivesReady && !found.has('Prêt')) found.add('Arrive prêt');
  if (c.offrande) found.add('Offrande');
  if (c.sacrificeMinLevel !== undefined) found.add('Sacrifice');
  if (c.vieTours) found.add('Durée de vie');
  if (c.cardType === 'Leader') found.add('Leader');
  const desc = CARD_TEXT_FR[id]?.desc ?? '';
  for (const [term, re] of IN_TEXT) if (re.test(desc)) found.add(term);
  const order = Object.keys(GLOSS);
  return [...found].sort((a, b) => order.indexOf(a) - order.indexOf(b)).map(term => ({ term, text: GLOSS[term]! }));
}
