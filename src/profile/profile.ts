// Profil du joueur : collection de cartes, monnaie, decks, options. Sauvegardé dans le navigateur.
import { CARDS } from '../data/cards';

export const MAX_COPIES = 3;
export const COINS_PER_WIN = 5;
export const PACK_PRICE = 5;
export const PACK_SIZE = 5;
/** Monnaie rendue pour un exemplaire tiré au-delà de 3. */
export const COINS_PER_EXTRA = 1;

/** Cartes de scénario, jetons et cartes générées : jamais dans une collection ni un deck. */
const NOT_COLLECTIBLE = new Set(['convoi', 'garnison', 'halte_convoi', 'palissade_regiment', 'elem_eveil_regiment', 'soin_simple',
  'dragonnet_infernal', 'puits_sel_amar', 'source_corrompue', 'portail_infernal', 'gardienne_nid', 'chariot_oeufs', 'oeuf_rituel', 'legionnaire_desert', 'garde_capitale']);
export const COLLECTIBLE: string[] = Object.keys(CARDS).filter(id => !NOT_COLLECTIBLE.has(id));

export interface SavedDeck { id: string; name: string; cards: string[]; updated: number }

export interface Options {
  /** Taille de l'interface (1 = normale). */
  scale: number;
  /** Multiplicateur de durée des animations de combat (0,5 = deux fois plus rapide). */
  animSpeed: number;
  /** Délai de réflexion affiché de l'ordinateur (multiplicateur). */
  aiSpeed: number;
  /** Durée d'affichage des bandeaux (tactiques, Leaders adverses) : multiplicateur. */
  bannerSpeed: number;
  /** Main de l'ordinateur visible dès le début de la partie. */
  revealAiHand: boolean;
  /** Toutes les cartes utilisables en partie locale, même non possédées. */
  allUnlocked: boolean;
}

export interface Profile {
  version: 1;
  collection: Record<string, number>;
  coins: number;
  decks: SavedDeck[];
  options: Options;
  /** Campagnes déjà fusionnées dans la collection (identifiant de campagne + date). */
  mergedCampaigns: string[];
}

export const DEFAULT_OPTIONS: Options = { scale: 1, animSpeed: 1, aiSpeed: 1, bannerSpeed: 1, revealAiHand: false, allUnlocked: false };

/** Nouveau joueur : aucune carte. La campagne en débloque ; l'option « toutes les cartes débloquées » permet de tout essayer. */
export function newProfile(): Profile {
  return {
    version: 1,
    collection: Object.fromEntries(COLLECTIBLE.map(id => [id, 0])),
    coins: 0,
    decks: [],
    options: { ...DEFAULT_OPTIONS },
    mergedCampaigns: [],
  };
}

export const owned = (p: Profile, id: string) => (p.options.allUnlocked ? MAX_COPIES : Math.min(MAX_COPIES, p.collection[id] ?? 0));

// ---------- Règles de construction ----------
export interface DeckCheck { ok: boolean; problems: string[]; counts: { total: number; low: number; high: number; lvl1Regiments: number } }

export function checkDeck(cards: string[], p?: Profile): DeckCheck {
  const n: Record<string, number> = {};
  for (const id of cards) n[id] = (n[id] ?? 0) + 1;
  const problems: string[] = [];
  const low = cards.filter(id => CARDS[id]!.niveau <= 3).length;
  const high = cards.length - low;
  const lvl1Regiments = cards.filter(id => CARDS[id]!.niveau === 1 && CARDS[id]!.cardType === 'Regiment').length;
  for (const [id, k] of Object.entries(n)) {
    if (!CARDS[id] || !COLLECTIBLE.includes(id)) problems.push(`Carte non autorisée : ${id}`);
    else if (k > MAX_COPIES) problems.push(`${k} exemplaires de ${id} (3 maximum)`);
    else if (p && k > owned(p, id)) problems.push(`${id} : ${k} dans le deck, ${owned(p, id)} possédé(s)`);
  }
  if (lvl1Regiments < 3) problems.push(`Au moins 3 régiments de niveau 1 (${lvl1Regiments} actuellement)`);
  if (low < 30) problems.push(`Au moins 30 cartes de niveau 1 à 3 (${low} actuellement)`);
  if (high < 15) problems.push(`Au moins 15 cartes de niveau 4-5 (${high} actuellement)`);
  return { ok: problems.length === 0, problems, counts: { total: cards.length, low, high, lvl1Regiments } };
}

// ---------- Paquets ----------
export interface PackResult { cards: { id: string; isNew: boolean; extra: boolean }[]; refund: number }

/** Ouvre un paquet de 5 cartes tirées dans toute la collection possible. `rand` renvoie un nombre dans [0, 1). */
export function openPack(p: Profile, rand: () => number = Math.random): PackResult | null {
  if (p.coins < PACK_PRICE) return null;
  p.coins -= PACK_PRICE;
  const out: PackResult = { cards: [], refund: 0 };
  for (let i = 0; i < PACK_SIZE; i++) {
    const id = COLLECTIBLE[Math.floor(rand() * COLLECTIBLE.length)]!;
    const have = p.collection[id] ?? 0;
    if (have >= MAX_COPIES) { out.refund += COINS_PER_EXTRA; out.cards.push({ id, isNew: false, extra: true }); continue; }
    p.collection[id] = have + 1;
    out.cards.push({ id, isNew: have === 0, extra: false });
  }
  p.coins += out.refund;
  return out;
}

/** Fin de campagne : chaque carte du pool de campagne au-delà de la collection y est ajoutée (3 maximum). Retourne les gains. */
export function mergeCampaignPool(p: Profile, pool: string[], campaignKey: string): Record<string, number> {
  if (p.mergedCampaigns.includes(campaignKey)) return {};
  const n: Record<string, number> = {};
  for (const id of pool) if (COLLECTIBLE.includes(id)) n[id] = (n[id] ?? 0) + 1;
  const gained: Record<string, number> = {};
  for (const [id, k] of Object.entries(n)) {
    const target = Math.min(MAX_COPIES, k);
    const have = p.collection[id] ?? 0;
    if (target > have) { gained[id] = target - have; p.collection[id] = target; }
  }
  p.mergedCampaigns.push(campaignKey);
  return gained;
}

// ---------- Sauvegarde ----------
const KEY = 'ligneDeFront.jeu.profil.v1';
export function sanitizeProfile(raw: unknown): Profile {
  const base = newProfile();
  const r = raw as Partial<Profile> | null;
  if (!r || typeof r !== 'object') return base;
  const collection: Record<string, number> = {};
  for (const id of COLLECTIBLE) collection[id] = Math.max(0, Math.min(MAX_COPIES, Number(r.collection?.[id] ?? 0) | 0));
  return {
    version: 1,
    collection,
    coins: Math.max(0, Number(r.coins ?? 0) | 0),
    decks: Array.isArray(r.decks) ? r.decks.filter(d => d && typeof d.name === 'string' && Array.isArray(d.cards)).map(d => ({ ...d, cards: d.cards.filter(id => CARDS[id]) })) : [],
    options: { ...DEFAULT_OPTIONS, ...(r.options ?? {}) },
    mergedCampaigns: Array.isArray(r.mergedCampaigns) ? r.mergedCampaigns.filter(x => typeof x === 'string') : [],
  };
}
export function loadProfile(): Profile {
  try { const raw = localStorage.getItem(KEY); return raw ? sanitizeProfile(JSON.parse(raw)) : newProfile(); } catch { return newProfile(); }
}
/** Efface tout : collection, pièces, decks, options et campagne en cours. */
export function resetEverything(): Profile {
  try { for (const k of Object.keys(localStorage)) if (k.startsWith('ligneDeFront.jeu.')) localStorage.removeItem(k); } catch { /* stockage indisponible */ }
  return newProfile();
}
export function saveProfile(p: Profile): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* stockage indisponible */ }
}
export const profileCode = (p: Profile) => btoa(unescape(encodeURIComponent(JSON.stringify(p))));
export function profileFromCode(code: string): Profile | null {
  try { return sanitizeProfile(JSON.parse(decodeURIComponent(escape(atob(code.trim()))))); } catch { return null; }
}

/**
 * Complète un deck avec des cartes possédées jusqu'à respecter les règles, en privilégiant une faction
 * (puis les cartes neutres, puis les autres factions). Ne retire jamais de carte.
 */
export function autoComplete(cards: string[], p: Profile, faction?: string): string[] {
  const deck = cards.slice();
  const count = (id: string) => deck.filter(x => x === id).length;
  const pref = (id: string) => (CARDS[id]!.faction === faction ? 0 : CARDS[id]!.faction === 'neutre' ? 1 : 2);
  const candidates = (filter: (id: string) => boolean) => COLLECTIBLE.filter(filter).sort((a, b) => pref(a) - pref(b) || CARDS[a]!.niveau - CARDS[b]!.niveau || a.localeCompare(b));
  const fill = (filter: (id: string) => boolean, need: () => boolean) => {
    for (let round = 0; round < MAX_COPIES && need(); round++) {
      for (const id of candidates(filter)) {
        if (!need()) break;
        if (count(id) < owned(p, id) && count(id) <= round) deck.push(id);
      }
    }
  };
  fill(id => CARDS[id]!.niveau === 1 && CARDS[id]!.cardType === 'Regiment', () => checkDeck(deck).counts.lvl1Regiments < 3);
  fill(id => CARDS[id]!.niveau <= 3, () => checkDeck(deck).counts.low < 30);
  fill(id => CARDS[id]!.niveau >= 4, () => checkDeck(deck).counts.high < 15);
  return deck;
}
