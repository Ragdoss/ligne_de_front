// Fenêtre de deck avant un scénario : on choisit, dans son pool, les cartes qui entrent dans le deck.
import { useMemo, useState } from 'react';
import { campaignDef, defaultDeckSelection, exportCode, poolCounts, type CampaignSave } from '../campaign/campaign';
import { CARDS } from '../data/cards';
import type { CampaignScenario } from '../campaign/types';
import { cardDesc, cardName, TYPE_LABEL, visibleKeywords } from './labels';

const ORDER: Record<string, number> = { Regiment: 0, Leader: 1, Tactique: 2 };

function statsLine(id: string): string {
  const c = CARDS[id]!;
  if (c.cardType === 'Regiment') {
    const kw = visibleKeywords(c.keywords ?? []);
    const slot = c.slotTypes ? 'avant/arrière' : c.slotType === 'arriere' ? 'arrière' : c.slotType === 'isole' ? 'isolé' : 'avant';
    return `ATK ${c.atk} · END ${c.end} · ARM ${c.arm} · INI ${c.ini} · MOR ${c.mor} · ${slot}${kw.length ? ` · ${kw.join(', ')}` : ''}`;
  }
  if (c.cardType === 'Leader') {
    const b = ([['ATK', c.bonusAtk], ['ARM', c.bonusArm], ['INI', c.bonusIni], ['MOR', c.bonusMor], ['END', c.bonusEnd]] as const).filter(([, v]) => v).map(([k, v]) => `+${v} ${k}`);
    return `Leader${b.length ? ` · ${b.join(' ')}` : ''}${c.typesRequired?.length ? ` · porteur ${c.typesRequired.join('/')}` : ''}`;
  }
  return 'Tactique';
}

export function CampaignDeck({ campaign, scenario, onLaunch, onBack }: {
  campaign: CampaignSave;
  scenario: CampaignScenario;
  onLaunch: (sel: Record<string, number>) => void;
  /** Retour au camp : la sélection est conservée. */
  onBack: (sel: Record<string, number>) => void;
}) {
  const counts = useMemo(() => poolCounts(campaign.pool), [campaign]);
  const [sel, setSel] = useState<Record<string, number>>(() => defaultDeckSelection(campaign));
  const [filter, setFilter] = useState<'all' | 'Regiment' | 'Leader' | 'Tactique'>('all');
  const [showCode, setShowCode] = useState(false);
  const size = Object.values(sel).reduce((a, b) => a + b, 0);
  const min = scenario.deckRules.min;
  const byType = { Regiment: 0, Leader: 0, Tactique: 0 } as Record<string, number>;
  for (const [id, n] of Object.entries(sel)) byType[CARDS[id]!.cardType]! += n;
  const ids = Object.keys(counts)
    .filter(id => filter === 'all' || CARDS[id]!.cardType === filter)
    .sort((a, b) => ORDER[CARDS[a]!.cardType]! - ORDER[CARDS[b]!.cardType]! || CARDS[a]!.niveau - CARDS[b]!.niveau || cardName(a).localeCompare(cardName(b)));
  const set = (id: string, n: number) => setSel(s => ({ ...s, [id]: Math.max(0, Math.min(counts[id]!, n)) }));
  return (
    <div className="camp">
      <header className="topbar">
        <div>
          <p className="b-who">{campaignDef(campaign).title} — combat {campaign.idx + 1} sur {campaignDef(campaign).order.length}</p>
          <h1>{scenario.title}</h1>
        </div>
        <div className="actions">
          <button type="button" onClick={() => setShowCode(v => !v)}>Code de sauvegarde</button>
          <button type="button" onClick={() => onBack(sel)}>Retour au camp</button>
        </div>
      </header>
      {showCode && <p className="muted small">Copie ce code pour reprendre ailleurs : <code className="code">{exportCode(campaign)}</code></p>}
      <p>Constitue ton deck. {scenario.deckRules.text}</p>
      <div className="camp-bar">
        <span className={`pill ${size >= min ? 'ok' : 'warn'}`}>Deck : <b>{size}</b> carte(s) — minimum <b>{min}</b></span>
        <span className="pill">Pool : <b>{campaign.pool.length}</b></span>
        <span className="pill">Régiments <b>{byType.Regiment}</b></span>
        <span className="pill">Leaders <b>{byType.Leader}</b></span>
        <span className="pill">Tactiques <b>{byType.Tactique}</b></span>
      </div>
      <div className="hand-sort">
        {(['all', 'Regiment', 'Leader', 'Tactique'] as const).map(f => (
          <button key={f} type="button" className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f === 'all' ? 'Toutes' : `${TYPE_LABEL[f]}s`}</button>
        ))}
        <button type="button" onClick={() => setSel({ ...counts })}>Tout prendre</button>
      </div>
      <div className="camp-grid">
        {ids.map(id => {
          const c = CARDS[id]!, n = sel[id] ?? 0;
          return (
            <div key={id} className={`ccard ${c.faction}${n ? ' in' : ''}`}>
              <div className="cc-head"><b>{cardName(id)}</b><span>Niv. {c.niveau} · Coût {c.dynamicCost ? 'var.' : c.cout}</span></div>
              <div className="cc-stats">{statsLine(id)}</div>
              <div className="cc-desc">{cardDesc(id)}</div>
              <div className="cc-ctl">
                <button type="button" aria-label={`Retirer ${cardName(id)}`} disabled={n <= 0} onClick={() => set(id, n - 1)}>−</button>
                <span>{n} / {counts[id]}</span>
                <button type="button" aria-label={`Ajouter ${cardName(id)}`} disabled={n >= counts[id]!} onClick={() => set(id, n + 1)}>+</button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="controls">
        <p className="hint">{size >= min ? 'Prêt pour la bataille.' : `Il manque ${min - size} carte(s).`}</p>
        <button type="button" onClick={() => onBack(sel)}>Enregistrer et revenir au camp</button>
        <button type="button" className="primary" disabled={size < min} onClick={() => onLaunch(sel)}>Lancer le scénario</button>
      </div>
    </div>
  );
}
