// Écrans de menu : accueil, jouer en local, campagnes, options.
import { useState } from 'react';
import { exportCode, importCode, loadCampaign, newCampaign, type CampaignSave } from '../campaign/campaign';
import { CAMPAIGN_ORDER, SCENARIOS } from '../campaign/scenarios';
import { DEMO_DECKS } from '../data/decks';
import type { Faction } from '../engine/types';
import { checkDeck, DEFAULT_OPTIONS, profileCode, profileFromCode, resetEverything, type Options, type Profile } from '../profile/profile';
import { mainFaction } from './Decks';
import { FACTION_LABEL, PLAYABLE_FACTIONS } from './labels';

export type HomeTarget = 'local' | 'online' | 'campaign' | 'collection' | 'options';

export function Home({ profile, go }: { profile: Profile; go: (t: HomeTarget) => void }) {
  const items: [HomeTarget, string, string][] = [
    ['local', 'Jouer en local', 'Contre l’ordinateur, à deux sur le même écran, ou en spectateur'],
    ['online', 'Jouer en ligne', 'Bientôt'],
    ['campaign', 'Campagne', 'Les campagnes solo et ta campagne en cours'],
    ['collection', 'Ma collection', 'Mes decks, mes cartes, ouverture de paquets'],
    ['options', 'Options', 'Taille de l’interface, vitesse du jeu…'],
  ];
  return (
    <div className="home">
      <h1>Ligne de Front</h1>
      <p className="muted">Jeu de cartes de régiments</p>
      <nav className="home-menu" aria-label="Menu principal">
        {items.map(([t, label, sub]) => (
          <button key={t} type="button" className="home-item" disabled={t === 'online'} onClick={() => go(t)}>
            <b>{label}</b><span>{sub}</span>
          </button>
        ))}
      </nav>
      <p className="pill coins">Pièces : <b>{profile.coins}</b></p>
    </div>
  );
}

export function TopBar({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <header className="topbar">
      <div className="tb-left">
        <button type="button" onClick={onBack} aria-label="Retour">← Retour</button>
        <h1>{title}</h1>
      </div>
      <div className="actions">{right}</div>
    </header>
  );
}

// ---------- Jouer en local ----------
export type Mode = 'ai' | 'hotseat' | 'watch';
/** Deck choisi : un deck du joueur (« my:<id> ») ou un deck de démonstration (« demo:<faction> »). */
export interface LocalSetup { mode: Mode; A: string; B: string }

export function resolveDeck(profile: Profile, key: string): { cards: string[]; faction: Faction; label: string } {
  if (key.startsWith('my:')) {
    const d = profile.decks.find(x => `my:${x.id}` === key)!;
    return { cards: d.cards, faction: mainFaction(d.cards) as Faction, label: d.name };
  }
  const f = key.slice(5) as Faction;
  return { cards: DEMO_DECKS[f]!, faction: f, label: FACTION_LABEL[f] };
}

function DeckSelect({ profile, value, onChange, label, human }: { profile: Profile; value: string; onChange: (v: string) => void; label: string; human: boolean }) {
  const mine = profile.decks.filter(d => checkDeck(d.cards, profile).ok);
  const demoAllowed = !human || profile.options.allUnlocked;
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}>
        {mine.length > 0 && <optgroup label="Mes decks">{mine.map(d => <option key={d.id} value={`my:${d.id}`}>{d.name} ({d.cards.length} cartes)</option>)}</optgroup>}
        {demoAllowed && <optgroup label="Decks de démonstration">{PLAYABLE_FACTIONS.map(f => <option key={f} value={`demo:${f}`}>{FACTION_LABEL[f]}</option>)}</optgroup>}
      </select>
    </label>
  );
}

export function LocalPlay({ profile, onStart, onBack, goDecks }: { profile: Profile; onStart: (s: LocalSetup) => void; onBack: () => void; goDecks: () => void }) {
  const firstMine = profile.decks.find(d => checkDeck(d.cards, profile).ok);
  const [mode, setMode] = useState<Mode>('ai');
  const [A, setA] = useState<string>(firstMine ? `my:${firstMine.id}` : 'demo:empire');
  const [B, setB] = useState<string>('demo:elfe');
  const humanA = mode !== 'watch', humanB = mode === 'hotseat';
  const valid = (k: string, human: boolean) => (k.startsWith('my:') ? profile.decks.some(d => `my:${d.id}` === k && checkDeck(d.cards, profile).ok) : !human || profile.options.allUnlocked);
  const ready = valid(A, humanA) && valid(B, humanB);
  return (
    <div className="setup">
      <TopBar title="Jouer en local" onBack={onBack} />
      <fieldset className="pick">
        <legend>Mode</legend>
        {([['ai', 'Contre l’ordinateur'], ['hotseat', 'À deux sur le même écran'], ['watch', 'Ordinateur contre ordinateur']] as const).map(([m, l]) => (
          <label key={m} className={`fchip${mode === m ? ' on' : ''}`}>
            <input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} />{l}
          </label>
        ))}
      </fieldset>
      <DeckSelect profile={profile} value={A} onChange={setA} human={humanA} label={humanA ? 'Ton deck (joueur A, commence)' : 'Joueur A (ordinateur, commence)'} />
      <DeckSelect profile={profile} value={B} onChange={setB} human={humanB} label={humanB ? 'Joueur B' : 'Joueur B (ordinateur)'} />
      {!ready && (
        <p className="warn">
          Il te faut un deck valide construit avec tes cartes (la campagne et les paquets t’en font gagner). <button type="button" className="link" onClick={goDecks}>Créer un deck</button>
          {' '}— ou active « Toutes les cartes débloquées » dans les options pour utiliser toutes les cartes et les decks de démonstration.
        </p>
      )}
      <p className="muted small">Une victoire contre l’ordinateur rapporte 5 pièces.</p>
      <button type="button" className="primary" disabled={!ready} onClick={() => onStart({ mode, A, B })}>Commencer la partie</button>
    </div>
  );
}

// ---------- Campagnes ----------
export function CampaignMenu({ onPlay, onBack }: { onPlay: (c: CampaignSave) => void; onBack: () => void }) {
  const [saved] = useState(() => loadCampaign());
  const [armed, setArmed] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  return (
    <div className="setup">
      <TopBar title="Campagne" onBack={onBack} />
      <section className="menu-block">
        <h2>Empire contre Elfes</h2>
        <p className="muted">4 scénarios. Ton pool de campagne grandit après chaque victoire ; avant chaque combat, tu choisis ton deck. À la fin, les cartes gagnées rejoignent ta collection.</p>
        <div className="choices row left">
          {saved && (
            <button type="button" className="primary" onClick={() => onPlay(saved)}>
              {saved.finished ? 'Revoir la campagne (dernier scénario)' : `Continuer — ${SCENARIOS[CAMPAIGN_ORDER[saved.idx]!]!.title}`}
            </button>
          )}
          <button type="button" className={saved ? '' : 'primary'} onClick={() => { if (saved && !armed) { setArmed(true); return; } onPlay(newCampaign()); }}>
            {saved && armed ? 'Une campagne est en cours : cliquer encore pour recommencer' : 'Nouvelle campagne'}
          </button>
        </div>
        <details>
          <summary>Reprendre avec un code de sauvegarde</summary>
          <div className="custom-deck">
            <textarea rows={2} value={code} onChange={e => { setCode(e.target.value); setCodeError(''); }} aria-label="Code de sauvegarde de campagne" />
            <button type="button" onClick={() => { const c = importCode(code); if (c) onPlay(c); else setCodeError('Code invalide ou incomplet.'); }}>Reprendre</button>
            {codeError && <p className="warn">{codeError}</p>}
            {saved && <p className="muted small">Code de ta campagne en cours : <code className="code">{exportCode(saved)}</code></p>}
          </div>
        </details>
      </section>
      <section className="menu-block muted"><h2>Autres campagnes</h2><p>À venir.</p></section>
    </div>
  );
}

// ---------- Options ----------
export function OptionsScreen({ profile, update, onBack }: { profile: Profile; update: (fn: (p: Profile) => void) => void; onBack: () => void }) {
  const o = profile.options;
  const set = <K extends keyof Options>(k: K, v: Options[K]) => update(p => { p.options[k] = v; });
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [resetArmed, setResetArmed] = useState(false);
  const range = (k: 'scale' | 'animSpeed' | 'aiSpeed', label: string, min: number, max: number, step: number, fmt: (v: number) => string) => (
    <label className="field">
      <span>{label} : <b>{fmt(o[k])}</b></span>
      <input type="range" min={min} max={max} step={step} value={o[k]} onChange={e => set(k, Number(e.target.value))} />
    </label>
  );
  return (
    <div className="setup">
      <TopBar title="Options" onBack={onBack} />
      <section className="menu-block">
        {range('scale', 'Taille de l’interface', 0.8, 1.4, 0.05, v => `${Math.round(v * 100)} %`)}
        {range('animSpeed', 'Durée des animations de combat', 0.25, 2, 0.25, v => (v === 1 ? 'normale' : `×${v}`))}
        {range('aiSpeed', 'Temps de réflexion affiché de l’ordinateur', 0.25, 3, 0.25, v => (v === 1 ? 'normal' : `×${v}`))}
        <label className="check"><input type="checkbox" checked={o.revealAiHand} onChange={e => set('revealAiHand', e.target.checked)} /> Main de l’ordinateur visible dès le début</label>
        <label className="check"><input type="checkbox" checked={o.allUnlocked} onChange={e => set('allUnlocked', e.target.checked)} /> Toutes les cartes débloquées (parties locales et créateur de deck)</label>
        <button type="button" onClick={() => update(p => { p.options = { ...DEFAULT_OPTIONS }; })}>Rétablir les réglages par défaut</button>
      </section>
      <section className="menu-block danger-zone">
        <h2>Tout réinitialiser</h2>
        <p className="muted small">Efface ta collection, tes pièces, tes decks, tes options et ta campagne en cours. Impossible à annuler (pense au code de sauvegarde ci-dessous si tu veux pouvoir revenir en arrière).</p>
        <div className="choices row left">
          {resetArmed ? (
            <>
              <button type="button" className="danger" onClick={() => { const fresh = resetEverything(); update(p => Object.assign(p, fresh)); setResetArmed(false); setMsg('Tout a été réinitialisé.'); }}>Oui, tout effacer</button>
              <button type="button" onClick={() => setResetArmed(false)}>Annuler</button>
            </>
          ) : <button type="button" onClick={() => setResetArmed(true)}>Tout réinitialiser…</button>}
        </div>
        {msg === 'Tout a été réinitialisé.' && <p className="ok">{msg}</p>}
      </section>
      <section className="menu-block">
        <h2>Sauvegarde du profil</h2>
        <p className="muted small">Ta collection, tes pièces, tes decks et tes options sont enregistrés dans ce navigateur. Ce code permet de les transférer ailleurs.</p>
        <code className="code">{profileCode(profile)}</code>
        <div className="custom-deck">
          <textarea rows={2} value={code} onChange={e => { setCode(e.target.value); setMsg(''); }} aria-label="Code de profil à importer" />
          <button type="button" onClick={() => { const p = profileFromCode(code); if (!p) { setMsg('Code invalide.'); return; } update(cur => Object.assign(cur, p)); setMsg('Profil importé.'); }}>Importer ce profil (remplace l’actuel)</button>
          {msg && <p className="muted small">{msg}</p>}
        </div>
      </section>
    </div>
  );
}
