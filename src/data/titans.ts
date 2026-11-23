// Mode roguelite (03/11/2026) : cartes exclusives, glissées dans les decks adverses et utilisées par les boss.
// Elles ne font pas partie du jeu normal : elles ne sont enregistrées dans CARDS qu'à l'ouverture d'une run
// (registerTitanCards), pour ne jamais apparaître dans la collection, les paquets, le draft ou les outils d'équilibrage.
// Les malus « définitifs » s'appliquent à l'exemplaire touché pour toute la run (voir src/roguelite/run.ts).
import type { CardDef } from '../engine/types';
import { CARDS } from './cards';

export const TITAN_CARDS: Record<string, CardDef> = {
  // Proposées par Nathan.
  titan_demon_ronge: {
    id: 'titan_demon_ronge', cardType: 'Regiment', faction: 'demons', niveau: 2, cout: 2, slotType: 'avant', types: ['Démon'],
    atk: 15, end: 30, arm: 0, ini: 10, mor: 5, keywords: [], sacrificeMinLevel: 1, sacrificeGainsStats: false, titanLeaderDrain: 10,
  },
  titan_archere: {
    id: 'titan_archere', cardType: 'Regiment', faction: 'elfe', niveau: 2, cout: 3, slotType: 'arriere', types: ['Elfe', 'Archer'],
    atk: 15, end: 25, arm: 0, ini: 25, mor: 5, keywords: ['Distance', 'Prime'], primeTitanEnd: 5,
  },
  // Proposée par Claude.
  titan_echo: { id: 'titan_echo', cardType: 'Tactique', faction: 'neutre', niveau: 2, cout: 2, targetRule: 'ennemi-quelconque', effect: 'titanEcho' },
  // Mini-boss de l'acte 1 : l'Essence de la réalité (côté joueur).
  essence_realite: {
    id: 'essence_realite', cardType: 'Regiment', faction: 'neutre', niveau: 1, cout: 0, slotType: 'arriere', types: ['Essence'],
    atk: 0, end: 100, arm: 0, ini: 0, mor: 50, keywords: [], essenceDrain: true, excludeFromMoralTotal: true,
  },
  // Boss de l'acte 1 : le Titan du Glissement et la tactique pour lui résister.
  titan_glissement: {
    id: 'titan_glissement', cardType: 'Regiment', faction: 'neutre', niveau: 5, cout: 0, slotType: 'arriere', types: ['Titan'],
    atk: 5, end: 50, arm: 5, ini: 20, mor: 15, keywords: [], excludeFromMoralTotal: true, // 23/11/2026 : END 75 → 50, Moral 20 → 15
  },
  // Second mini-boss de l'acte 1 (Nathan, 04/11/2026).
  fragment_realite: {
    id: 'fragment_realite', cardType: 'Regiment', faction: 'neutre', niveau: 2, cout: 0, slotTypes: ['avant', 'arriere'], types: ['Essence'],
    atk: 0, end: 1, arm: 0, ini: 0, mor: 4, keywords: ['Minions'], fragmentCurse: true, // Minions (10/11/2026) : sa destruction ne donne pas de lassitude
  },
  // Boss de l'acte 2 (Nathan, 07/11/2026) : le Titan de la Fracture, puis ses deux éclats.
  titan_fracture: {
    id: 'titan_fracture', cardType: 'Regiment', faction: 'neutre', niveau: 5, cout: 0, slotType: 'arriere', types: ['Titan'],
    atk: 10, end: 60, arm: 10, ini: 30, mor: 10, keywords: [], excludeFromMoralTotal: true,
  },
  titan_eclat_vif: {
    id: 'titan_eclat_vif', cardType: 'Regiment', faction: 'neutre', niveau: 5, cout: 0, slotTypes: ['avant', 'arriere'], types: ['Titan'],
    atk: 30, end: 60, arm: 10, ini: 60, mor: 10, keywords: [], excludeFromMoralTotal: true,
  },
  titan_eclat_massif: {
    id: 'titan_eclat_massif', cardType: 'Regiment', faction: 'neutre', niveau: 5, cout: 0, slotTypes: ['avant', 'arriere'], types: ['Titan'],
    atk: 10, end: 120, arm: 20, ini: 30, mor: 20, keywords: [], excludeFromMoralTotal: true,
  },
  lutter_mouvement: { id: 'lutter_mouvement', cardType: 'Tactique', faction: 'neutre', niveau: 1, cout: 0, targetRule: 'none', effect: 'holdGround' },
  // Boss de l'acte 3 (Nathan, 21/11/2026) : le Titan de la Discorde, sa Tactique et son régiment isolé.
  titan_discorde: {
    id: 'titan_discorde', cardType: 'Regiment', faction: 'neutre', niveau: 5, cout: 0, slotType: 'arriere', types: ['Titan'],
    atk: 0, end: 100, arm: 10, ini: 40, mor: 30, keywords: [], excludeFromMoralTotal: true,
  },
  manipulation_faibles: {
    id: 'manipulation_faibles', cardType: 'Tactique', faction: 'neutre', niveau: 2, cout: 3, targetRule: 'ennemi-quelconque', effect: 'manipulation',
    needsFreeSlot: true, targetNotBroken: true,
  },
  modifieur_esprit: {
    id: 'modifieur_esprit', cardType: 'Regiment', faction: 'neutre', niveau: 4, cout: 5, slotType: 'isole', types: ['Esprit'],
    atk: 0, end: 10, arm: 0, ini: 5, mor: 2, keywords: [], vieTours: 2, mindControlEachEnemyTurn: true,
  },
  // Ville assiégée (événement du roguelite, Nathan, 22/11/2026) : ses stats viennent du bonus (startOverrides).
  garnison_ville: {
    id: 'garnison_ville', cardType: 'Regiment', faction: 'demons', niveau: 1, cout: 0, slotType: 'arriere', types: ['Démon', 'Garnison'],
    atk: 0, end: 20, arm: 0, ini: 5, mor: 5, keywords: [],
  },
  // Mini-boss de l'acte 3 (Nathan, 21/11/2026) : le Titan du Reflet.
  titan_reflet: {
    id: 'titan_reflet', cardType: 'Regiment', faction: 'neutre', niveau: 5, cout: 0, slotType: 'isole', types: ['Titan'],
    atk: 0, end: 50, arm: 50, ini: 40, mor: 10, keywords: [], excludeFromMoralTotal: true,
  },
} as unknown as Record<string, CardDef>;

export const TITAN_TEXT_FR: Record<string, { name: string; desc: string }> = {
  titan_demon_ronge: { name: 'Démon rongé par les Titans', desc: 'Sacrifice niveau 1+. À son arrivée, un Leader adverse en jeu perd définitivement 10 % de ses bonus par niveau du régiment sacrifié.' },
  titan_archere: { name: 'Archère du Glissement', desc: 'Prime : la cible perd définitivement 5 END maximum.' },
  titan_echo: { name: 'Écho du Titan', desc: 'Un régiment adverse perd définitivement 10 % de son ATK.' },
  essence_realite: { name: 'Essence de la réalité', desc: 'Chaque fois qu’elle est attaquée, des régiments de son camp au hasard (autant que le niveau de l’attaquant) perdent définitivement 1 ATK, 1 INI et 1 ARM. Elle ne compte pas dans le Moral total.' },
  titan_glissement: { name: 'Titan du Glissement', desc: 'Au début de chaque tour du Titan, tes régiments glissent d’une case vers la droite ; ceux qui sortent du terrain sont détruits. Il ne compte pas dans le Moral total.' },
  fragment_realite: { name: 'Fragment de réalité', desc: 'Le régiment qui le détruit perd définitivement 1 ATK, 1 ARM et 1 INI ; à la 3e fois pour ce régiment, 1 Moral en plus.' },
  titan_fracture: { name: 'Titan de la Fracture', desc: 'Quand il est détruit, le terrain se scinde en deux terrains de 3 avant / 2 arrière qui ne communiquent plus, et deux nouveaux Titans apparaissent. Il ne compte pas dans le Moral total.' },
  titan_eclat_vif: { name: 'Éclat vif de la Fracture', desc: 'Un des deux Titans nés de la Fracture. Il ne compte pas dans le Moral total.' },
  titan_eclat_massif: { name: 'Éclat massif de la Fracture', desc: 'Un des deux Titans nés de la Fracture. Il ne compte pas dans le Moral total.' },
  lutter_mouvement: { name: 'Lutter contre le mouvement', desc: 'Au prochain tour du Titan, tes régiments ne glissent pas. Coûte 1 de plus à chaque fois que tu la joues.' },
  titan_discorde: { name: 'Titan de la Discorde', desc: 'Un régiment qui l’attaque pour la 3e fois change de camp (après le combat). Il ne compte pas dans le Moral total.' },
  manipulation_faibles: { name: 'Manipulation des faibles', desc: 'Prends le contrôle d’un régiment adverse (avant ou arrière, Moral non brisé) jusqu’à ce que son Moral soit brisé. Sans case libre de ton côté, il part en défausse.' },
  modifieur_esprit: { name: 'Modifieur de l’esprit', desc: 'Au début de chaque tour adverse, prend le contrôle du meilleur régiment adverse, jusqu’à ce que le Modifieur quitte le jeu. Durée de vie : 2 tours.' },
  garnison_ville: { name: 'Garnison de la ville', desc: 'Les Cultistes qui tiennent les murs. Si la garnison tombe, le combat est perdu.' },
  titan_reflet: { name: 'Titan du Reflet', desc: 'Chaque régiment que tu joues fait apparaître en face une copie à 75 % de ses stats. Son camp ne pose ses régiments qu’en face des tiens. Il ne compte pas dans le Moral total.' },
};

/** Enregistre les cartes du mode roguelite (idempotent). */
export function registerTitanCards(text?: Record<string, { name: string; desc: string }>): void {
  for (const [id, c] of Object.entries(TITAN_CARDS)) CARDS[id] ??= c;
  if (text) for (const [id, t] of Object.entries(TITAN_TEXT_FR)) text[id] ??= t;
}
