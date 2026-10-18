// Profil du joueur : collection de cartes, monnaie, decks, options. Sauvegardé dans le navigateur.
import { CARDS } from '../data/cards';
import { AVATAR_CHANCE, AVATAR_IDS, avatarWeight, BASE_AVATAR, BASE_EMOTES, EMOTE_CHANCE, EMOTE_IDS, MAX_LOADOUT } from './cosmetics';
import { clearActiveProfileData, keyFor } from './store';

export const MAX_COPIES = 3;
export const COINS_PER_WIN = 5;
export const PACK_PRICE = 5;
export const PACK_SIZE = 5;
/** Monnaie rendue pour un exemplaire tiré au-delà de 3. */
export const COINS_PER_EXTRA = 1;

/** Cartes de scénario, jetons et cartes générées : jamais dans une collection ni un deck. */
const NOT_COLLECTIBLE = new Set(['convoi', 'garnison', 'halte_convoi', 'palissade_regiment', 'elem_eveil_regiment', 'soin_simple',
  'dragonnet_infernal', 'puits_sel_amar', 'source_corrompue', 'portail_infernal', 'gardienne_nid', 'chariot_oeufs', 'oeuf_rituel', 'legionnaire_desert', 'garde_capitale', 'mercenaire_stagiaire']);
export const COLLECTIBLE: string[] = Object.keys(CARDS).filter(id => !NOT_COLLECTIBLE.has(id));

export interface SavedDeck { id: string; name: string; cards: string[]; updated: number; /** Deck favori : affiché en premier. */ fav?: boolean }

/** Victoires et défaites par type de partie. */
export interface Record2 { w: number; l: number }
export interface Stats { ai: Record2; hotseat: Record2; online: Record2; campaign: Record2 }
export const EMPTY_STATS: Stats = { ai: { w: 0, l: 0 }, hotseat: { w: 0, l: 0 }, online: { w: 0, l: 0 }, campaign: { w: 0, l: 0 } };

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
  /** Niveaux des cartes en chiffres romains (sinon arabes). */
  romanLevels?: boolean;
  /** Mode vérification : cartes, images de profil et emotes affichées même non possédées (pour contrôler les illustrations). */
  showAll?: boolean;
}

export interface Profile {
  version: 1;
  collection: Record<string, number>;
  coins: number;
  decks: SavedDeck[];
  options: Options;
  /** Campagnes déjà fusionnées dans la collection (identifiant de campagne + date). */
  mergedCampaigns: string[];
  /** Nom du profil (utilisé en ligne). */
  name: string;
  stats: Stats;
  /** Cosmétiques possédés et choisis. */
  emotes: string[];
  emoteLoadout: string[];
  avatars: string[];
  avatar: string;
  /** Arts alternatifs débloqués (clés « carte.altN »). */
  altArts: string[];
  /** Art affiché pour une carte : clé d'un art alternatif possédé (absent = art de base). */
  artChoice: Record<string, string>;
}

/** Decks triés : favoris d'abord, puis les plus récemment modifiés. */
export const sortedDecks = (decks: SavedDeck[]) => decks.slice().sort((a, b) => Number(!!b.fav) - Number(!!a.fav) || b.updated - a.updated);

export const DEFAULT_OPTIONS: Options = { scale: 1, animSpeed: 1, aiSpeed: 1, bannerSpeed: 1, revealAiHand: false, allUnlocked: false, romanLevels: true };

/** Nouveau joueur : aucune carte. La campagne en débloque ; l'option « toutes les cartes débloquées » permet de tout essayer. */
export function newProfile(): Profile {
  return {
    version: 1,
    collection: Object.fromEntries(COLLECTIBLE.map(id => [id, 0])),
    coins: 0,
    decks: [],
    options: { ...DEFAULT_OPTIONS },
    mergedCampaigns: [],
    name: 'Joueur',
    stats: structuredClone(EMPTY_STATS),
    emotes: BASE_EMOTES.slice(),
    emoteLoadout: BASE_EMOTES.slice(),
    avatars: [BASE_AVATAR],
    avatar: BASE_AVATAR,
    altArts: [],
    artChoice: {},
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
export interface PackItem { id: string; isNew: boolean; extra: boolean; kind?: 'card' | 'emote' | 'avatar' | 'alt' }

/** Paquets : 1 chance sur 8 qu'une carte soit remplacée par un art alternatif (s'il en existe). */
export const ALT_ART_CHANCE = 0.125;
/** Carte d'un art alternatif (« lieutenant.alt1 » → « lieutenant »). */
export const altCardOf = (key: string) => key.replace(/\.alt\d+$/, '');
export interface PackResult { cards: PackItem[]; refund: number }

/** Ouvre un paquet de 5 cartes tirées dans toute la collection possible. `rand` renvoie un nombre dans [0, 1).
 * Une carte peut être remplacée par une emote (1 chance sur 5) et une autre par une image de profil (1 sur 10). */
export function openPack(p: Profile, rand: () => number = Math.random, altPool: string[] = []): PackResult | null {
  if (p.coins < PACK_PRICE) return null;
  p.coins -= PACK_PRICE;
  const out: PackResult = { cards: [], refund: 0 };
  const withEmote = rand() < EMOTE_CHANCE, withAvatar = rand() < AVATAR_CHANCE;
  const withAlt = altPool.length > 0 && rand() < ALT_ART_CHANCE;
  /** Tirage dans `list`, pondéré par `weight` (1 appel à `rand`). */
  const pick = (list: string[], weight: (id: string) => number) => {
    let r = rand() * list.reduce((t, x) => t + weight(x), 0);
    for (const x of list) { r -= weight(x); if (r < 0) return x; }
    return list[list.length - 1]!;
  };
  const cosmetic = (pool: string[], owned: string[], kind: 'emote' | 'avatar' | 'alt', weight: (id: string) => number = () => 1) => {
    const fresh = pool.filter(x => !owned.includes(x));
    if (!fresh.length) { out.refund += COINS_PER_EXTRA; out.cards.push({ id: pick(pool, weight), isNew: false, extra: true, kind }); return; }
    const id = pick(fresh, weight);
    owned.push(id);
    out.cards.push({ id, isNew: true, extra: false, kind });
  };
  if (withEmote) cosmetic(EMOTE_IDS, p.emotes, 'emote');
  if (withAvatar) cosmetic(AVATAR_IDS, p.avatars, 'avatar', avatarWeight);
  // Art alternatif : 3 fois plus de chances pour une carte déjà possédée.
  if (withAlt) cosmetic(altPool, p.altArts, 'alt', k => ((p.collection[altCardOf(k)] ?? 0) > 0 ? 3 : 1));
  while (out.cards.length < PACK_SIZE) {
    const id = COLLECTIBLE[Math.floor(rand() * COLLECTIBLE.length)]!;
    const have = p.collection[id] ?? 0;
    if (have >= MAX_COPIES) { out.refund += COINS_PER_EXTRA; out.cards.push({ id, isNew: false, extra: true, kind: 'card' }); continue; }
    p.collection[id] = have + 1;
    out.cards.push({ id, isNew: have === 0, extra: false, kind: 'card' });
  }
  // Les cosmétiques ne sont pas toujours en tête du paquet.
  for (let i = out.cards.length - 1; i > 0; i--) { const k = Math.floor(rand() * (i + 1)); [out.cards[i], out.cards[k]] = [out.cards[k]!, out.cards[i]!]; }
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
    name: typeof r.name === 'string' && r.name.trim() ? r.name.trim().slice(0, 24) : 'Joueur',
    stats: Object.fromEntries((Object.keys(EMPTY_STATS) as (keyof Stats)[]).map(k => [k, { w: Math.max(0, Number(r.stats?.[k]?.w) | 0), l: Math.max(0, Number(r.stats?.[k]?.l) | 0) }])) as unknown as Stats,
    ...(() => {
      const emotes = [...new Set([...BASE_EMOTES, ...(Array.isArray(r.emotes) ? r.emotes : []).filter(x => EMOTE_IDS.includes(x))])];
      const avatars = [...new Set([BASE_AVATAR, ...(Array.isArray(r.avatars) ? r.avatars : []).filter(x => AVATAR_IDS.includes(x))])];
      const loadout = (Array.isArray(r.emoteLoadout) ? r.emoteLoadout : emotes).filter(x => emotes.includes(x)).slice(0, MAX_LOADOUT);
      return { emotes, avatars, emoteLoadout: loadout.length ? loadout : emotes.slice(0, MAX_LOADOUT), avatar: typeof r.avatar === 'string' && avatars.includes(r.avatar) ? r.avatar : BASE_AVATAR };
    })(),
    ...(() => {
      // Les arts alternatifs ne sont pas vérifiés contre les fichiers ici (le profil ne connaît pas les images) : seulement leur forme.
      const altArts = [...new Set((Array.isArray(r.altArts) ? r.altArts : []).filter(k => typeof k === 'string' && /\.alt\d+$/.test(k) && CARDS[altCardOf(k)]))];
      const artChoice: Record<string, string> = {};
      for (const [id, k] of Object.entries(r.artChoice ?? {})) if (typeof k === 'string' && altArts.includes(k) && altCardOf(k) === id) artChoice[id] = k;
      return { altArts, artChoice };
    })(),
  };
}
export function loadProfile(): Profile {
  try { const raw = localStorage.getItem(keyFor(KEY)); return raw ? sanitizeProfile(JSON.parse(raw)) : newProfile(); } catch { return newProfile(); }
}
/** Efface tout : collection, pièces, decks, options et campagne en cours. */
export function resetEverything(): Profile {
  clearActiveProfileData();
  return newProfile();
}
export function saveProfile(p: Profile): void {
  try { localStorage.setItem(keyFor(KEY), JSON.stringify(p)); } catch { /* stockage indisponible */ }
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
