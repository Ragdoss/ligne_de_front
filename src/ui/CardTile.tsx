// Tuile de carte réutilisable (collection, créateur de deck, campagne).
import { CARDS } from '../data/cards';
import { cardDesc, cardName, TYPE_LABEL, visibleKeywords } from './labels';

export function statsLine(id: string): string {
  const c = CARDS[id]!;
  if (c.cardType === 'Regiment') {
    const kw = visibleKeywords(c.keywords ?? []);
    const slot = c.slotTypes ? 'avant/arrière' : c.slotType === 'arriere' ? 'arrière' : c.slotType === 'isole' ? 'isolé' : 'avant';
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
    <div className={`ccard ${c.faction}${dim ? '' : ' in'}`}>
      <div className="cc-head"><b>{cardName(id)}</b><span>Niv. {c.niveau} · Coût {c.dynamicCost ? 'var.' : c.cout}</span></div>
      <div className="cc-type">{TYPE_LABEL[c.cardType]}{c.types?.length ? ` · ${c.types.join(', ')}` : ''}</div>
      <div className="cc-stats">{statsLine(id)}</div>
      <div className="cc-desc">{cardDesc(id)}</div>
      {(badge || children) && <div className="cc-ctl">{badge}{children}</div>}
    </div>
  );
}
