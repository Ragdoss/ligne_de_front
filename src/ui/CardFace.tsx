// Gabarit des cartes (validé le 17/10/2026) : illustration pleine carte au format 9:16, bas laissé libre pour
// le cartouche (nom, rôle), l'effet et les stats. Les illustrations sont dans src/ui/assets/cards/<id de carte>.webp
// (ou .png / .jpg) : il suffit d'y déposer un fichier pour qu'il apparaisse partout dans le jeu.
import { CARDS } from '../data/cards';
import type { CardDef } from '../engine/types';
import { cardDesc, cardName, visibleKeywords } from './labels';

const FILES = import.meta.glob('./assets/cards/*.{webp,png,jpg,jpeg}', { eager: true, import: 'default' }) as Record<string, string>;
const ART: Record<string, string> = Object.fromEntries(Object.entries(FILES).map(([path, url]) => [path.replace(/^.*\/|\.[a-z]+$/g, ''), url]));
/** Illustration d'une carte (undefined si elle n'en a pas encore). */
export const artOf = (id: string): string | undefined => ART[id];

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
export function ArtBackdrop({ id }: { id: string }) {
  const art = artOf(id);
  return art
    ? <img className="art" src={art} alt="" draggable={false} />
    : <span className="art none" aria-hidden="true">{cardName(id).replace(/^(?:(?:Le|La|Les)\s+|L[’'])/, '').charAt(0)}</span>;
}

/** Carte complète (collection, draft, récompenses, agrandissement en partie). */
export function CardFace({ id, cost, className = '' }: { id: string; cost?: number; className?: string }) {
  const c = CARDS[id]!;
  const desc = cardDesc(id);
  const kws = c.cardType === 'Regiment' ? visibleKeywords(c.keywords ?? []) : [];
  const size = desc.length > 210 ? ' xlong' : desc.length > 130 ? ' long' : '';
  const shownCost = c.dynamicCost ? 'X' : cost ?? c.cout;
  return (
    <div className={`cface ${c.faction} ${c.cardType.toLowerCase()}${artOf(id) ? '' : ' noart'} ${className}`}>
      <ArtBackdrop id={id} />
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
        {c.cardType === 'Regiment' && (
          <div className="f-stats">
            {STAT_KEYS.map(k => <span key={k} className={`st-${k}`}><b>{c[k] as number}</b><i>{STAT_LABEL[k]}</i></span>)}
          </div>
        )}
      </div>
    </div>
  );
}
