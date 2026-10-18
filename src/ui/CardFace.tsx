// Gabarit des cartes (validé le 17/10/2026) : illustration pleine carte au format 9:16, bas laissé libre pour
// le cartouche (nom, rôle), l'effet et les stats. Les illustrations sont dans src/ui/assets/cards/<id de carte>.webp
// (ou .png / .jpg) : il suffit d'y déposer un fichier pour qu'il apparaisse partout dans le jeu.
// Arts alternatifs : <id de carte>.alt1.webp, .alt2.webp… ; ils se débloquent dans les paquets et se choisissent dans la collection.
import { CARDS } from '../data/cards';
import type { CardDef } from '../engine/types';
import { FLAVOR_FR } from '../i18n/wave2b.fr';
import { cardDesc, cardName, visibleKeywords } from './labels';

const FILES = import.meta.glob('./assets/cards/*.{webp,png,jpg,jpeg}', { eager: true, import: 'default' }) as Record<string, string>;
const ART: Record<string, string> = Object.fromEntries(Object.entries(FILES).map(([path, url]) => [path.replace(/^.*\/|\.[a-z]+$/g, ''), url]));
const ALT_RE = /^(.+)\.alt\d+$/;
/** Arts alternatifs disponibles (clés « carte.altN »), triés. */
export const ALT_ART_KEYS: string[] = Object.keys(ART).filter(k => ALT_RE.test(k)).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
/** Carte d'un art alternatif. */
export const altArtCard = (key: string): string => key.match(ALT_RE)?.[1] ?? key;
/** Arts alternatifs d'une carte. */
export const altArtsOf = (id: string): string[] => ALT_ART_KEYS.filter(k => altArtCard(k) === id);
/** Numéro d'un art alternatif (« carte.alt2 » → 2). */
export const altArtNumber = (key: string): number => Number(key.split('.alt')[1]);

// Art choisi par le joueur pour chaque carte (réglé par App à partir du profil).
let choice: Record<string, string> = {};
export function setArtChoices(c: Record<string, string>): void { choice = c; }
/** Illustration d'une carte, art alternatif choisi compris (undefined si elle n'en a pas encore). */
export const artOf = (id: string): string | undefined => (choice[id] && ART[choice[id]!]) || ART[id];
// En partie : arts choisis par chaque joueur (null hors partie : on montre les choix du profil).
type Side = 'A' | 'B';
let gameArts: Partial<Record<Side, Record<string, string>>> | null = null;
export function setGameArts(a: Partial<Record<Side, Record<string, string>>> | null): void { gameArts = a; }
/** Fin de partie : on revient aux choix du profil, sauf si une autre partie a déjà réglé ses arts. */
export function clearGameArts(a: Partial<Record<Side, Record<string, string>>>): void { if (gameArts === a) gameArts = null; }
/** Art à montrer pour une carte d'un joueur en partie (undefined hors partie). */
export const artKeyFor = (id: string, owner?: Side): string | undefined =>
  gameArts && owner ? gameArts[owner]?.[id] ?? id : undefined;
/** Arts choisis valides parmi une liste reçue (en ligne) : seulement des arts existants des cartes données. */
export function cleanArts(raw: unknown, cards: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, k] of Object.entries(raw as Record<string, unknown>))
    if (typeof k === 'string' && cards.includes(id) && altArtCard(k) === id && ART[k]) out[id] = k;
  return out;
}

/** Illustration d'une variante précise (identifiant de carte ou clé « carte.altN »). */
export const artFile = (key: string): string | undefined => ART[key];

// ---------- Niveau : chiffres romains (par défaut) ou arabes (Options) ----------
let roman = true;
export function setRomanLevels(on: boolean): void { roman = on; }
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export const levelLabel = (n: number): string => (roman ? ROMAN[n] ?? String(n) : String(n));

export const STAT_KEYS = ['atk', 'end', 'arm', 'ini', 'mor'] as const;
export const STAT_LABEL: Record<(typeof STAT_KEYS)[number], string> = { atk: 'ATK', end: 'END', arm: 'ARM', ini: 'INI', mor: 'MOR' };

const ZONE: Record<string, string> = { avant: 'Avant', arriere: 'Arrière', isole: 'Isolé' };
export const slotLabel = (c: CardDef): string => (c.slotTypes ?? [c.slotType ?? 'avant']).map(z => ZONE[z]).join(' / ');

/** Porteur d'un Leader, en clair. */
export function bearerLabel(c: CardDef): string {
  if (c.targetsEnemy) return 'régiment adverse';
  const any = c.typesRequiredAny as string[] | undefined;
  if (any?.length) return any.join(' ou ');
  return c.typesRequired?.length ? c.typesRequired.join(' + ') : 'quelconque';
}
export const leaderBonuses = (c: CardDef): [string, number][] =>
  ([['atk', c.bonusAtk], ['arm', c.bonusArm], ['ini', c.bonusIni], ['mor', c.bonusMor], ['end', c.bonusEnd]] as [string, number | undefined][])
    .filter((x): x is [string, number] => !!x[1]);

export function typeLine(c: CardDef): string {
  if (c.cardType === 'Regiment') return `Régiment${c.types?.length ? ` · ${c.types.join(', ')}` : ''}`;
  if (c.cardType === 'Leader') return `Leader · porteur ${bearerLabel(c)}`;
  return 'Tactique';
}

/** Fond d'une carte : son illustration, sinon la couleur de sa faction et son initiale. */
export function ArtBackdrop({ id, variant }: { id: string; variant?: string }) {
  const art = variant ? artFile(variant) ?? artFile(id) : artOf(id);
  return art
    ? <img className="art" src={art} alt="" draggable={false} />
    : <span className="art none" aria-hidden="true">{cardName(id).replace(/^(?:(?:Le|La|Les)\s+|L[’'])/, '').charAt(0)}</span>;
}

/** Carte complète (collection, draft, récompenses, agrandissement en partie). */
export function CardFace({ id, cost, className = '', variant }: { id: string; cost?: number; className?: string; /** Art précis à afficher (sinon l'art choisi). */ variant?: string }) {
  const c = CARDS[id]!;
  const desc = cardDesc(id);
  const kws = c.cardType === 'Regiment' ? visibleKeywords(c.keywords ?? []) : [];
  const size = desc.length > 210 ? ' xlong' : desc.length > 130 ? ' long' : '';
  const shownCost = c.dynamicCost ? 'X' : cost ?? c.cout;
  return (
    <div className={`cface ${c.faction} ${c.cardType.toLowerCase()}${(variant ? artFile(variant) ?? artFile(id) : artOf(id)) ? '' : ' noart'}${variant?.includes('.alt') ? ' alt' : ''} ${className}`}>
      <ArtBackdrop id={id} variant={variant} />
      <span className={`f-cost${cost !== undefined && cost < c.cout ? ' cheaper' : ''}`} title="Coût">{shownCost}</span>
      <span className="f-lvl" title={`Niveau ${c.niveau}`}>Niv. {levelLabel(c.niveau)}</span>
      {c.unique && <span className="f-uniq">Unique</span>}
      {c.cardType === 'Regiment' && <span className="f-slot">{slotLabel(c)}</span>}
      <div className={`f-body${size}`}>
        <div className="f-plate"><b className="f-name">{cardName(id)}</b><span className="f-type">{typeLine(c)}</span></div>
        {c.cardType === 'Leader' && leaderBonuses(c).length > 0 && (
          <div className="f-bonus">{leaderBonuses(c).map(([k, v]) => <span key={k} className={`st-${k}`}>+{v} {k.toUpperCase()}</span>)}</div>
        )}
        {kws.length > 0 && <div className="f-kw">{kws.join(' · ')}</div>}
        {desc && <p className="f-desc">{desc}</p>}
        {FLAVOR_FR[id] && <p className="f-flav">« {FLAVOR_FR[id]} »</p>}
        {c.cardType === 'Regiment' && (
          <div className="f-stats">
            {STAT_KEYS.map(k => <span key={k} className={`st-${k}`}><b>{c[k] as number}</b><i>{STAT_LABEL[k]}</i></span>)}
          </div>
        )}
      </div>
    </div>
  );
}
