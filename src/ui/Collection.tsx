// Ma collection : toutes les cartes (possédées ou non), ouverture de paquets.
import { useState } from 'react';
import { CARDS } from '../data/cards';
import { COLLECTIBLE, MAX_COPIES, openPack, PACK_PRICE, PACK_SIZE, type PackResult, type Profile } from '../profile/profile';
import { CardTile } from './CardTile';
import { cardName, FACTION_LABEL, TYPE_LABEL } from './labels';

export interface Filters { faction: string; type: string; level: string; text: string; owned: 'all' | 'owned' | 'missing' }
export const NO_FILTER: Filters = { faction: 'all', type: 'all', level: 'all', text: '', owned: 'all' };
const ORDER: Record<string, number> = { Regiment: 0, Leader: 1, Tactique: 2 };
const FACTIONS = ['empire', 'elfe', 'demons', 'nomades', 'neutre'] as const;

export function filterCards(f: Filters, have: (id: string) => number): string[] {
  const t = f.text.trim().toLowerCase();
  return COLLECTIBLE.filter(id => {
    const c = CARDS[id]!;
    if (f.faction !== 'all' && c.faction !== f.faction) return false;
    if (f.type !== 'all' && c.cardType !== f.type) return false;
    if (f.level !== 'all' && String(c.niveau) !== f.level) return false;
    if (f.owned === 'owned' && !have(id)) return false;
    if (f.owned === 'missing' && have(id) >= MAX_COPIES) return false;
    if (t && !cardName(id).toLowerCase().includes(t)) return false;
    return true;
  }).sort((a, b) => FACTIONS.indexOf(CARDS[a]!.faction as typeof FACTIONS[number]) - FACTIONS.indexOf(CARDS[b]!.faction as typeof FACTIONS[number])
    || ORDER[CARDS[a]!.cardType]! - ORDER[CARDS[b]!.cardType]! || CARDS[a]!.niveau - CARDS[b]!.niveau || cardName(a).localeCompare(cardName(b)));
}

export function FilterBar({ f, set, ownedLabels }: { f: Filters; set: (f: Filters) => void; ownedLabels?: boolean }) {
  const chip = (key: keyof Filters, value: string, label: string) => (
    <button key={`${key}${value}`} type="button" className={f[key] === value ? 'on' : ''} onClick={() => set({ ...f, [key]: value })}>{label}</button>
  );
  return (
    <div className="filters">
      <div className="hand-sort">{chip('faction', 'all', 'Toutes factions')}{FACTIONS.map(x => chip('faction', x, FACTION_LABEL[x]))}</div>
      <div className="hand-sort">{chip('type', 'all', 'Tous types')}{(['Regiment', 'Leader', 'Tactique'] as const).map(x => chip('type', x, `${TYPE_LABEL[x]}s`))}</div>
      <div className="hand-sort">{chip('level', 'all', 'Tous niveaux')}{['1', '2', '3', '4', '5'].map(x => chip('level', x, `Niv. ${x}`))}</div>
      {ownedLabels !== false && <div className="hand-sort">{chip('owned', 'all', 'Toutes')}{chip('owned', 'owned', 'Possédées')}{chip('owned', 'missing', 'À compléter')}</div>}
      <input className="search" type="search" placeholder="Rechercher une carte…" value={f.text} onChange={e => set({ ...f, text: e.target.value })} aria-label="Rechercher une carte" />
    </div>
  );
}

function PackReveal({ result, onClose }: { result: PackResult; onClose: () => void }) {
  const [shown, setShown] = useState(0);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Ouverture d'un paquet">
      <div className="box wide">
        <h2>Nouveau paquet</h2>
        <div className="pack">
          {result.cards.map((c, i) => (
            <button key={i} type="button" className={`pack-slot${i < shown ? ' open' : ''}`} onClick={() => setShown(Math.max(shown, i + 1))} aria-label={i < shown ? cardName(c.id) : 'Retourner la carte'}>
              {i < shown ? (
                <>
                  <CardTile id={c.id} />
                  <span className={`tag${c.isNew ? ' new' : c.extra ? ' extra' : ''}`}>{c.isNew ? 'Nouvelle !' : c.extra ? `Déjà ${MAX_COPIES} : +1 pièce` : '+1 exemplaire'}</span>
                </>
              ) : <span className="pack-back">?</span>}
            </button>
          ))}
        </div>
        <div className="choices row">
          {shown < result.cards.length
            ? <button type="button" className="primary" onClick={() => setShown(result.cards.length)}>Tout retourner</button>
            : <button type="button" className="primary" onClick={onClose}>{result.refund ? `Récupérer ${result.refund} pièce(s) et fermer` : 'Fermer'}</button>}
        </div>
      </div>
    </div>
  );
}

export function MyCards({ profile, update }: { profile: Profile; update: (fn: (p: Profile) => void) => void }) {
  const [f, setF] = useState<Filters>(NO_FILTER);
  const [pack, setPack] = useState<PackResult | null>(null);
  const have = (id: string) => profile.collection[id] ?? 0;
  const ids = filterCards(f, have);
  const ownedDistinct = COLLECTIBLE.filter(id => have(id) > 0).length;
  const total = COLLECTIBLE.reduce((n, id) => n + have(id), 0);
  return (
    <div className="camp">
      <div className="camp-bar">
        <span className="pill">Cartes différentes : <b>{ownedDistinct}</b> / {COLLECTIBLE.length}</span>
        <span className="pill">Exemplaires : <b>{total}</b> / {COLLECTIBLE.length * MAX_COPIES}</span>
        <span className="pill coins">Pièces : <b>{profile.coins}</b></span>
        <button type="button" className="primary" disabled={profile.coins < PACK_PRICE} onClick={() => {
          let res: PackResult | null = null;
          update(p => { res = openPack(p); });
          if (res) setPack(res);
        }}>Ouvrir un paquet ({PACK_SIZE} cartes, {PACK_PRICE} pièces)</button>
      </div>
      <p className="muted small">Chaque victoire contre l’ordinateur ou en campagne rapporte 5 pièces. Un exemplaire tiré au-delà de 3 rend 1 pièce.</p>
      <FilterBar f={f} set={setF} />
      <div className="camp-grid">
        {ids.map(id => <CardTile key={id} id={id} dim={!have(id)} badge={<span className={`count${have(id) ? '' : ' zero'}`}>{have(id)} / {MAX_COPIES}</span>} />)}
      </div>
      {pack && <PackReveal result={pack} onClose={() => setPack(null)} />}
    </div>
  );
}
