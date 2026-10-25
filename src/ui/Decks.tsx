// Mes decks : liste des decks du joueur et créateur de deck (règles vérifiées en direct).
import { useMemo, useState } from 'react';
import { CARDS } from '../data/cards';
import { exportDeck, parseDeck } from '../profile/deckText';
import { autoComplete, checkDeck, MAX_COPIES, owned, sortedDecks, type Profile, type SavedDeck } from '../profile/profile';
import { CardTile } from './CardTile';
import { showZoom, zoomProps } from './HoverZoom';
import { filterCards, FilterBar, NO_FILTER, type Filters } from './Collection';
import { cardName, FACTION_LABEL, PLAYABLE_FACTIONS } from './labels';

export { parseDeck } from '../profile/deckText';

export function mainFaction(cards: string[]): string {
  const n: Record<string, number> = {};
  for (const id of cards) if (CARDS[id]!.faction !== 'neutre') n[CARDS[id]!.faction] = (n[CARDS[id]!.faction] ?? 0) + 1;
  return Object.entries(n).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutre';
}

export function DeckList({ profile, update }: { profile: Profile; update: (fn: (p: Profile) => void) => void }) {
  const [editing, setEditing] = useState<SavedDeck | null>(null);
  if (editing) {
    return (
      <DeckBuilder
        profile={profile}
        initial={editing}
        onCancel={() => setEditing(null)}
        onSave={d => { update(p => { const i = p.decks.findIndex(x => x.id === d.id); if (i === -1) p.decks.push(d); else p.decks[i] = d; }); setEditing(null); }}
        onDelete={() => { update(p => { p.decks = p.decks.filter(x => x.id !== editing.id); }); setEditing(null); }}
      />
    );
  }
  return (
    <div className="camp">
      <div className="choices row left">
        <button type="button" className="primary" onClick={() => setEditing({ id: `d${Date.now()}`, name: 'Nouveau deck', cards: [], updated: Date.now() })}>Créer un deck</button>
      </div>
      {profile.decks.length === 0 && <p className="muted">Aucun deck pour l’instant. Crée ton premier deck : le bouton « Compléter automatiquement » te propose un deck valide à partir de ta collection.</p>}
      <div className="deck-list">
        {sortedDecks(profile.decks).map(d => {
          const chk = checkDeck(d.cards, profile);
          const f = mainFaction(d.cards);
          return (
            <div key={d.id} className={`deck-row ${f}`} role="button" tabIndex={0} onClick={() => setEditing(d)} onKeyDown={e => { if (e.key === 'Enter') setEditing(d); }}>
              <button type="button" className={`fav${d.fav ? ' on' : ''}`} aria-pressed={!!d.fav} title={d.fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                onClick={e => { e.stopPropagation(); update(p => { const x = p.decks.find(y => y.id === d.id); if (x) x.fav = !x.fav; }); }}>{d.fav ? '★' : '☆'}</button>
              <b>{d.name}</b>
              <span>{d.cards.length} cartes · {FACTION_LABEL[f as keyof typeof FACTION_LABEL] ?? f}</span>
              <span className={chk.ok ? 'ok' : 'warn'}>{chk.ok ? 'Valide' : `${chk.problems.length} problème(s)`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeckBuilder({ profile, initial, onSave, onCancel, onDelete }: {
  profile: Profile; initial: SavedDeck; onSave: (d: SavedDeck) => void; onCancel: () => void; onDelete: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [cards, setCards] = useState<string[]>(initial.cards);
  const [f, setF] = useState<Filters>({ ...NO_FILTER, owned: profile.options.allUnlocked ? 'all' : 'owned' });
  const [autoFaction, setAutoFaction] = useState<string>(() => (initial.cards.length ? mainFaction(initial.cards) : 'empire'));
  const [importText, setImportText] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const count = useMemo(() => { const n: Record<string, number> = {}; for (const id of cards) n[id] = (n[id] ?? 0) + 1; return n; }, [cards]);
  const chk = checkDeck(cards, profile);
  const have = (id: string) => owned(profile, id);
  const ids = filterCards(f, have);
  const add = (id: string) => { if ((count[id] ?? 0) < Math.min(MAX_COPIES, have(id))) setCards([...cards, id]); };
  const remove = (id: string) => { const i = cards.lastIndexOf(id); if (i !== -1) setCards([...cards.slice(0, i), ...cards.slice(i + 1)]); };
  const listed = Object.entries(count).sort((a, b) => CARDS[a[0]]!.niveau - CARDS[b[0]]!.niveau || cardName(a[0]).localeCompare(cardName(b[0])));
  return (
    <div className="builder">
      <div className="builder-main">
        <FilterBar f={f} set={setF} />
        <div className="camp-grid">
          {ids.map(id => {
            const n = count[id] ?? 0, max = Math.min(MAX_COPIES, have(id));
            return (
              <CardTile key={id} id={id} dim={!n}>
                <button type="button" aria-label={`Retirer ${cardName(id)}`} disabled={!n} onClick={() => remove(id)}>−</button>
                <span>{n} / {max}</span>
                <button type="button" aria-label={`Ajouter ${cardName(id)}`} disabled={n >= max} onClick={() => add(id)}>+</button>
              </CardTile>
            );
          })}
        </div>
      </div>
      <aside className="builder-side">
        <input className="search" value={name} onChange={e => setName(e.target.value)} aria-label="Nom du deck" />
        <div className="camp-bar">
          <span className="pill">Total <b>{chk.counts.total}</b></span>
          <span className={`pill ${chk.counts.low >= 30 ? 'ok' : 'warn'}`}>Niv. 1-3 <b>{chk.counts.low}</b>/30</span>
          <span className={`pill ${chk.counts.high >= 15 ? 'ok' : 'warn'}`}>Niv. 4-5 <b>{chk.counts.high}</b>/15</span>
          <span className={`pill ${chk.counts.lvl1Regiments >= 3 ? 'ok' : 'warn'}`}>Régiments niv. 1 <b>{chk.counts.lvl1Regiments}</b>/3</span>
        </div>
        {chk.ok ? <p className="ok">Deck valide.</p> : <ul className="warn small">{chk.problems.map(x => <li key={x}>{x}</li>)}</ul>}
        <div className="deck-cards">
          {listed.length === 0 && <p className="muted small">Ajoute des cartes avec les boutons + de la grille.</p>}
          {listed.map(([id, n]) => (
            <button key={id} type="button" className={`deck-line ${CARDS[id]!.faction}`} {...zoomProps(id)} onClick={() => { remove(id); showZoom(null); }} title="Retirer un exemplaire">
              <span>{n}×</span> {cardName(id)} <small>niv. {CARDS[id]!.niveau}</small>
            </button>
          ))}
        </div>
        <div className="auto">
          <select value={autoFaction} onChange={e => setAutoFaction(e.target.value)} aria-label="Faction privilégiée">
            {PLAYABLE_FACTIONS.map(x => <option key={x} value={x}>{FACTION_LABEL[x]}</option>)}
          </select>
          <button type="button" onClick={() => setCards(autoComplete(cards, profile, autoFaction))}>Compléter automatiquement</button>
        </div>
        <div className="choices row left">
          <button type="button" onClick={() => { setImportText(importText === null ? '' : null); setShowExport(false); setImportMsg(''); }}>Importer une liste</button>
          <button type="button" disabled={!cards.length} onClick={() => { setShowExport(!showExport); setImportText(null); setCopied(false); }}>Exporter</button>
          <button type="button" onClick={() => setCards([])}>Vider</button>
        </div>
        {importText !== null && (
          <div className="custom-deck">
            <textarea rows={6} value={importText} onChange={e => setImportText(e.target.value)} placeholder={'3 Recrues impériales\n2 Lanciers…  (liste exportée, ou identifiants)'} aria-label="Liste de cartes à importer" />
            <button type="button" onClick={() => {
              const r = parseDeck(importText);
              setCards(r.deck);
              if (r.name && /^(Nouveau deck|Deck sans nom)$/.test(name)) setName(r.name);
              setImportText(null);
              setImportMsg(r.unknown.length ? `Cartes non reconnues, ignorées : ${r.unknown.join(', ')}.` : '');
            }}>Remplacer le deck par cette liste</button>
            <p className="muted small">Les cartes non possédées seront signalées dans les problèmes du deck.</p>
          </div>
        )}
        {importMsg && <p className="warn small">{importMsg}</p>}
        {showExport && (
          <div className="custom-deck">
            <textarea rows={8} readOnly value={exportDeck(cards, name)} aria-label="Liste du deck à copier" onFocus={e => e.currentTarget.select()} />
            <button type="button" onClick={e => {
              const ta = (e.currentTarget.previousElementSibling as HTMLTextAreaElement);
              const fallback = () => { ta.focus(); ta.select(); try { document.execCommand('copy'); setCopied(true); } catch { /* sélection seule */ } };
              try { navigator.clipboard.writeText(ta.value).then(() => setCopied(true), fallback); } catch { fallback(); }
            }}>{copied ? 'Copié !' : 'Copier'}</button>
            <p className="muted small">À coller dans « Importer une liste » (ici ou chez un autre joueur).</p>
          </div>
        )}
        <div className="choices row">
          {confirmDelete
            ? <button type="button" className="danger" onClick={onDelete}>Confirmer la suppression</button>
            : <button type="button" onClick={() => setConfirmDelete(true)}>Supprimer</button>}
          <button type="button" onClick={onCancel}>Annuler</button>
          <button type="button" className="primary" onClick={() => onSave({ ...initial, name: name.trim() || 'Deck sans nom', cards, updated: Date.now() })}>Enregistrer</button>
        </div>
      </aside>
    </div>
  );
}
