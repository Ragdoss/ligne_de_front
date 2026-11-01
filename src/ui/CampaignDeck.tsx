// Fenêtre de deck avant un scénario : on choisit, dans son pool, les cartes qui entrent dans le deck.
// Même présentation que le constructeur du draft (01/11/2026) : cartes illustrées, filtres, répartition du deck.
import { useMemo, useState } from 'react';
import { campaignDef, defaultDeckSelection, exportCode, poolCounts, type CampaignSave } from '../campaign/campaign';
import { CARDS } from '../data/cards';
import type { CampaignScenario } from '../campaign/types';
import { CardTile } from './CardTile';
import { FilterBar, NO_FILTER, type Filters } from './Collection';
import { byFactionLevel, DraftStats } from './Draft';
import { cardName } from './labels';

export function CampaignDeck({ campaign, scenario, onLaunch, onBack }: {
  campaign: CampaignSave;
  scenario: CampaignScenario;
  onLaunch: (sel: Record<string, number>) => void;
  /** Retour au camp : la sélection est conservée. */
  onBack: (sel: Record<string, number>) => void;
}) {
  const counts = useMemo(() => poolCounts(campaign.pool), [campaign]);
  const [sel, setSel] = useState<Record<string, number>>(() => defaultDeckSelection(campaign));
  const [f, setF] = useState<Filters>({ ...NO_FILTER });
  const [showCode, setShowCode] = useState(false);
  const size = Object.values(sel).reduce((a, b) => a + b, 0);
  const min = scenario.deckRules.min;
  const byType = { Regiment: 0, Leader: 0, Tactique: 0 } as Record<string, number>;
  for (const [id, n] of Object.entries(sel)) byType[CARDS[id]!.cardType]! += n;
  const t = f.text.trim().toLowerCase();
  const keep = (id: string) => {
    const c = CARDS[id]!;
    return (f.faction === 'all' || c.faction === f.faction || ((c.factions as string[] | undefined) ?? []).includes(f.faction))
      && (f.type === 'all' || c.cardType === f.type) && (f.level === 'all' || String(c.niveau) === f.level)
      && (!t || cardName(id).toLowerCase().includes(t));
  };
  const all = Object.keys(counts);
  const ids = all.filter(keep).sort(byFactionLevel);
  const deckIds = Object.entries(sel).flatMap(([id, n]) => Array<string>(n).fill(id));
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
      {deckIds.length > 0 && <div className="draft-check"><DraftStats ids={deckIds} /></div>}
      <div className="choices row left">
        <button type="button" onClick={() => setSel({ ...counts })}>Tout prendre</button>
        <button type="button" onClick={() => setSel(defaultDeckSelection(campaign))}>Deck proposé</button>
        <button type="button" onClick={() => setSel({})}>Vider</button>
      </div>
      <FilterBar f={f} set={setF} ownedLabels={false} />
      <h2 className="sub">Ton pool{ids.length < all.length ? ` (${ids.length} affichées sur ${all.length})` : ''}</h2>
      <div className="camp-grid">
        {ids.map(id => {
          const n = sel[id] ?? 0;
          return (
            <CardTile key={id} id={id} dim={!n}>
              <button type="button" aria-label={`Retirer ${cardName(id)}`} disabled={n <= 0} onClick={() => set(id, n - 1)}>−</button>
              <span className="count">{n} / {counts[id]}</span>
              <button type="button" aria-label={`Ajouter ${cardName(id)}`} disabled={n >= counts[id]!} onClick={() => set(id, n + 1)}>+</button>
            </CardTile>
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
