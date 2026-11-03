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
    atk: 5, end: 75, arm: 5, ini: 20, mor: 20, keywords: [],
  },
  lutter_mouvement: { id: 'lutter_mouvement', cardType: 'Tactique', faction: 'neutre', niveau: 1, cout: 0, targetRule: 'none', effect: 'holdGround' },
} as unknown as Record<string, CardDef>;

export const TITAN_TEXT_FR: Record<string, { name: string; desc: string }> = {
  titan_demon_ronge: { name: 'Démon rongé par les Titans', desc: 'Sacrifice niveau 1+. À son arrivée, un Leader adverse en jeu perd définitivement 10 % de ses bonus par niveau du régiment sacrifié.' },
  titan_archere: { name: 'Archère du Glissement', desc: 'Prime : la cible perd définitivement 5 END maximum.' },
  titan_echo: { name: 'Écho du Titan', desc: 'Un régiment adverse perd définitivement 10 % de son ATK.' },
  essence_realite: { name: 'Essence de la réalité', desc: 'Chaque fois qu’elle est attaquée, des régiments de son camp au hasard (autant que le niveau de l’attaquant) perdent définitivement 1 ATK, 1 INI et 1 ARM. Elle ne compte pas dans le Moral total.' },
  titan_glissement: { name: 'Titan du Glissement', desc: 'Au début de chaque tour du Titan, tes régiments glissent d’une case vers la droite ; ceux qui sortent du terrain sont détruits.' },
  lutter_mouvement: { name: 'Lutter contre le mouvement', desc: 'Au prochain tour du Titan, tes régiments ne glissent pas. Coûte 1 de plus à chaque fois que tu la joues.' },
};

/** Enregistre les cartes du mode roguelite (idempotent). */
export function registerTitanCards(text?: Record<string, { name: string; desc: string }>): void {
  for (const [id, c] of Object.entries(TITAN_CARDS)) CARDS[id] ??= c;
  if (text) for (const [id, t] of Object.entries(TITAN_TEXT_FR)) text[id] ??= t;
}
