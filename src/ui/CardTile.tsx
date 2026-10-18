// Tuile de carte réutilisable (collection, créateur de deck, campagne).
import { CARDS } from '../data/cards';
import { CardFace } from './CardFace';
import { zoomProps } from './HoverZoom';
import { cardDesc, cardName, visibleKeywords } from './labels';

export function statsLine(id: string): string {
  const c = CARDS[id]!;
  if (c.cardType === 'Regiment') {
    const kw = visibleKeywords(c.keywords ?? []);
    const ZL: Record<string, string> = { avant: 'avant', arriere: 'arrière', isole: 'isolé' };
    const slot = (c.slotTypes ?? [c.slotType ?? 'avant']).map(z => ZL[z]).join('/');
    const all = [...(c.unique ? ['Unique'] : []), ...kw];
    return `ATK ${c.atk} · END ${c.end} · ARM ${c.arm} · INI ${c.ini} · MOR ${c.mor} · ${slot}${all.length ? ` · ${all.join(', ')}` : ''}`;
  }
  if (c.cardType === 'Leader') {
    const b = ([['ATK', c.bonusAtk], ['ARM', c.bonusArm], ['INI', c.bonusIni], ['MOR', c.bonusMor], ['END', c.bonusEnd]] as const).filter(([, v]) => v).map(([k, v]) => `+${v} ${k}`);
    return `Leader${b.length ? ` · ${b.join(' ')}` : ''}${c.typesRequired?.length ? ` · porteur ${c.typesRequired.join('/')}` : ''}`;
  }
  return 'Tactique';
}

export function CardTile({ id, dim, badge, children }: { id: string; dim?: boolean; badge?: React.ReactNode; children?: React.ReactNode }) {
  const c = CARDS[id]!;
  return (
    <div className={`ccard ${c.faction}${dim ? '' : ' in'}`} {...zoomProps(id)} title={`${cardName(id)} — ${statsLine(id)}${cardDesc(id) ? `\n${cardDesc(id)}` : ''}`}>
      <CardFace id={id} />
      {(badge || children) && <div className="cc-ctl">{badge}{children}</div>}
    </div>
  );
}
