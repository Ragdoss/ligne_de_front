// Menu principal : campagne solo, et partie libre (decks de démonstration ou personnalisés).
import { useState } from 'react';
import { exportCode, importCode, loadCampaign, newCampaign, type CampaignSave } from '../campaign/campaign';
import { CAMPAIGN_ORDER, SCENARIOS } from '../campaign/scenarios';
import { CARDS } from '../data/cards';
import { DEMO_DECKS } from '../data/decks';
import type { Faction } from '../engine/types';
import { FACTION_LABEL, PLAYABLE_FACTIONS } from './labels';

export type Mode = 'ai' | 'hotseat' | 'watch';
export interface DeckChoice { faction: Faction; custom: string | null }
export interface FreeSetup { mode: Mode; A: DeckChoice; B: DeckChoice }

/** Lit une liste de cartes collée (format du simulateur, ou simple liste) : tous les identifiants reconnus. */
export function parseDeck(text: string): { deck: string[]; unknown: string[] } {
  const quoted = [...text.matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]!.trim());
  const words = quoted.length ? quoted : text.split(/[\s,;]+/).filter(Boolean);
  const deck: string[] = [], unknown: string[] = [];
  for (const w of words) (CARDS[w] ? deck : unknown).push(w);
  return { deck, unknown };
}
const mainFaction = (deck: string[]): Faction => {
  const n: Record<string, number> = {};
  for (const id of deck) n[CARDS[id]!.faction] = (n[CARDS[id]!.faction] ?? 0) + 1;
  return (Object.entries(n).filter(([f]) => f !== 'neutre').sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutre') as Faction;
};
export const deckOf = (c: DeckChoice): string[] => (c.custom !== null ? parseDeck(c.custom).deck : DEMO_DECKS[c.faction]!);
export const factionOf = (c: DeckChoice): Faction => (c.custom !== null ? mainFaction(parseDeck(c.custom).deck) : c.faction);
export const labelOf = (c: DeckChoice): string => (c.custom !== null ? `Deck personnalisé (${FACTION_LABEL[factionOf(c)]})` : FACTION_LABEL[c.faction]);
const MIN_CUSTOM = 10;

function DeckPicker({ value, onChange, label }: { value: DeckChoice; onChange: (v: DeckChoice) => void; label: string }) {
  const parsed = value.custom !== null ? parseDeck(value.custom) : null;
  return (
    <fieldset className="pick">
      <legend>{label}</legend>
      {PLAYABLE_FACTIONS.map(f => (
        <label key={f} className={`fchip ${f}${value.custom === null && value.faction === f ? ' on' : ''}`}>
          <input type="radio" name={label} checked={value.custom === null && value.faction === f} onChange={() => onChange({ faction: f, custom: null })} />
          {FACTION_LABEL[f]} <small>({DEMO_DECKS[f]!.length})</small>
        </label>
      ))}
      <label className={`fchip${value.custom !== null ? ' on' : ''}`}>
        <input type="radio" name={label} checked={value.custom !== null} onChange={() => onChange({ ...value, custom: value.custom ?? '' })} />
        Deck personnalisé
      </label>
      {parsed && (
        <div className="custom-deck">
          <textarea
            rows={4}
            value={value.custom!}
            onChange={e => onChange({ ...value, custom: e.target.value })}
            placeholder="Colle une liste de cartes, par exemple : const DECK = ['recrue_imp','recrue_imp','lancier_emp', …]; ou recrue_imp, lancier_emp …"
            aria-label={`${label} : liste de cartes`}
          />
          <p className={parsed.deck.length >= MIN_CUSTOM && !parsed.unknown.length ? 'ok' : 'warn'}>
            {parsed.deck.length} carte(s) reconnue(s){parsed.deck.length < MIN_CUSTOM ? ` — il en faut au moins ${MIN_CUSTOM}` : ''}.
            {parsed.unknown.length > 0 && ` Inconnues (ignorées) : ${parsed.unknown.slice(0, 6).join(', ')}${parsed.unknown.length > 6 ? '…' : ''}`}
          </p>
        </div>
      )}
    </fieldset>
  );
}

export function Menu({ onFree, onCampaign }: { onFree: (s: FreeSetup) => void; onCampaign: (c: CampaignSave) => void }) {
  const [mode, setMode] = useState<Mode>('ai');
  const [A, setA] = useState<DeckChoice>({ faction: 'empire', custom: null });
  const [B, setB] = useState<DeckChoice>({ faction: 'elfe', custom: null });
  const [saved] = useState(() => loadCampaign());
  const [armed, setArmed] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const ready = (c: DeckChoice) => c.custom === null || parseDeck(c.custom).deck.length >= MIN_CUSTOM;
  return (
    <div className="setup">
      <h1>Ligne de Front</h1>

      <section className="menu-block">
        <h2>Campagne solo — Empire contre Elfes</h2>
        <p className="muted">4 scénarios. Ton pool de cartes grandit après chaque victoire ; avant chaque combat, tu choisis ton deck.</p>
        <div className="choices row left">
          {saved && (
            <button type="button" className="primary" onClick={() => onCampaign(saved)}>
              {saved.finished ? 'Revoir la campagne (dernier scénario)' : `Continuer — ${SCENARIOS[CAMPAIGN_ORDER[saved.idx]!]!.title}`}
            </button>
          )}
          <button type="button" className={saved ? '' : 'primary'} onClick={() => { if (saved && !armed) { setArmed(true); return; } onCampaign(newCampaign()); }}>
            {saved && armed ? 'Une sauvegarde existe : cliquer encore pour l’écraser' : 'Nouvelle campagne'}
          </button>
        </div>
        <details>
          <summary>Reprendre avec un code de sauvegarde</summary>
          <div className="custom-deck">
            <textarea rows={2} value={code} onChange={e => { setCode(e.target.value); setCodeError(''); }} aria-label="Code de sauvegarde" />
            <button type="button" onClick={() => { const c = importCode(code); if (c) onCampaign(c); else setCodeError('Code invalide ou incomplet.'); }}>Reprendre</button>
            {codeError && <p className="warn">{codeError}</p>}
            {saved && <p className="muted small">Code de ta sauvegarde actuelle : <code className="code">{exportCode(saved)}</code></p>}
          </div>
        </details>
      </section>

      <section className="menu-block">
        <h2>Partie libre</h2>
        <fieldset className="pick">
          <legend>Mode</legend>
          {([['ai', 'Contre l’ordinateur'], ['hotseat', 'À deux sur le même écran'], ['watch', 'Ordinateur contre ordinateur']] as const).map(([m, l]) => (
            <label key={m} className={`fchip${mode === m ? ' on' : ''}`}>
              <input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} />{l}
            </label>
          ))}
        </fieldset>
        <DeckPicker value={A} onChange={setA} label={mode === 'watch' ? 'Joueur A (ordinateur, commence)' : 'Joueur A (toi, commence)'} />
        <DeckPicker value={B} onChange={setB} label={mode === 'hotseat' ? 'Joueur B' : 'Joueur B (ordinateur)'} />
        <button type="button" className="primary" disabled={!ready(A) || !ready(B)} onClick={() => onFree({ mode, A, B })}>Commencer la partie</button>
      </section>
    </div>
  );
}
