// Écrans de menu : accueil, jouer en local, campagnes, options.
import { useState } from 'react';
import { exportCode, importCode, loadCampaign, newCampaign, type CampaignSave } from '../campaign/campaign';
import { CAMPAIGNS } from '../campaign/campaigns';
import type { CampaignDef } from '../campaign/types';
import { CHAMPION_POOLS, pickChampion } from '../data/champions';
import { DEMO_DECKS } from '../data/decks';
import type { Faction } from '../engine/types';
import { checkDeck, DEFAULT_OPTIONS, newProfile, profileCode, profileFromCode, resetEverything, saveProfile, sortedDecks, type Options, type Profile } from '../profile/profile';
import { AVATAR_IDS, AVATARS, EMOTE_IDS, EMOTES, MAX_LOADOUT } from '../profile/cosmetics';
import { Avatar } from './avatars';
import { activeProfileId, createProfileEntry, deleteProfileEntry, listProfiles, renameProfileEntry, setActiveProfile } from '../profile/store';
import { mainFaction } from './Decks';
import { FACTION_LABEL, PLAYABLE_FACTIONS } from './labels';

export type HomeTarget = 'tutorial' | 'local' | 'online' | 'draft' | 'campaign' | 'collection' | 'options';

export function Home({ profile, go }: { profile: Profile; go: (t: HomeTarget) => void }) {
  const items: [HomeTarget, string, string][] = [
    ['tutorial', 'Tutoriel', 'Apprendre les règles en un combat guidé (5 minutes)'],
    ['local', 'Jouer en local', 'Contre l’ordinateur, à deux sur le même écran, ou en spectateur'],
    ['online', 'Jouer en ligne', 'Contre un ami, de navigateur à navigateur (premier jet)'],
    ['draft', 'Draft à 4', 'Draft contre 3 adversaires de l’ordinateur, puis tournoi'],
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
          <button key={t} type="button" className="home-item" onClick={() => go(t)}>
            <b>{label}</b><span>{sub}</span>
          </button>
        ))}
      </nav>
      <p className="home-who"><Avatar id={profile.avatar} size={88} /> <b>{profile.name}</b> <span className="pill coins">Pièces : <b>{profile.coins}</b></span></p>
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
/** Deck choisi : un deck du joueur (« my:<id> »), un deck de démonstration (« demo:<faction> ») ou un champion de l'échelle (« champ:<faction> »). */
export interface LocalSetup { mode: Mode; A: string; B: string }

export function resolveDeck(profile: Profile, key: string): { cards: string[]; faction: Faction; label: string } {
  if (key.startsWith('my:')) {
    const d = profile.decks.find(x => `my:${x.id}` === key)!;
    return { cards: d.cards, faction: mainFaction(d.cards) as Faction, label: d.name };
  }
  if (key.startsWith('champ:')) {
    const f = key.slice(6) as Faction;
    return { cards: pickChampion(f)!.cards, faction: f, label: `Champion ${FACTION_LABEL[f]}` }; // un deck du pool, au hasard
  }
  const f = key.slice(5) as Faction;
  return { cards: DEMO_DECKS[f]!, faction: f, label: FACTION_LABEL[f] };
}

export function DeckSelect({ profile, value, onChange, label, human }: { profile: Profile; value: string; onChange: (v: string) => void; label: string; human: boolean }) {
  const mine = sortedDecks(profile.decks).filter(d => checkDeck(d.cards, profile).ok);
  const demoAllowed = !human || profile.options.allUnlocked;
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}>
        {mine.length > 0 && <optgroup label="Mes decks">{mine.map(d => <option key={d.id} value={`my:${d.id}`}>{d.fav ? '★ ' : ''}{d.name} ({d.cards.length} cartes)</option>)}</optgroup>}
        {demoAllowed && <optgroup label="Decks de démonstration">{PLAYABLE_FACTIONS.map(f => <option key={f} value={`demo:${f}`}>{FACTION_LABEL[f]}</option>)}</optgroup>}
        {demoAllowed && <optgroup label="Meilleurs decks du tournoi (champions)">{PLAYABLE_FACTIONS.filter(f => CHAMPION_POOLS[f]?.length).map(f => <option key={f} value={`champ:${f}`}>Champion {FACTION_LABEL[f]} ({CHAMPION_POOLS[f]!.length} decks, un au hasard)</option>)}</optgroup>}
      </select>
    </label>
  );
}

export function LocalPlay({ profile, onStart, onBack, goDecks }: { profile: Profile; onStart: (s: LocalSetup) => void; onBack: () => void; goDecks: () => void }) {
  const firstMine = sortedDecks(profile.decks).find(d => checkDeck(d.cards, profile).ok);
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
function CampaignBlock({ def, onPlay }: { def: CampaignDef; onPlay: (c: CampaignSave) => void }) {
  const [saved] = useState(() => loadCampaign(def.id));
  const [armed, setArmed] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  return (
    <section className={`menu-block camp-block ${def.faction}`}>
      <div className="camp-block-head">
        <span className="rank" title="Ordre conseillé">{def.rank}</span>
        <div>
          <h2>{def.title}</h2>
          <p className="muted small">{FACTION_LABEL[def.faction]} · {def.order.length} scénarios</p>
        </div>
      </div>
      <p>{def.pitch}</p>
      <div className="choices row left">
        {saved && (
          <button type="button" className="primary" onClick={() => onPlay(saved)}>
            {saved.finished ? 'Revoir (dernier scénario)' : `Continuer — combat ${saved.idx + 1} sur ${def.order.length}`}
          </button>
        )}
        <button type="button" className={saved ? '' : 'primary'} onClick={() => { if (saved && !armed) { setArmed(true); return; } onPlay(newCampaign(def.id)); }}>
          {saved && armed ? 'Une partie est en cours : cliquer encore pour recommencer' : 'Nouvelle campagne'}
        </button>
      </div>
      <details>
        <summary>Code de sauvegarde</summary>
        <div className="custom-deck">
          <textarea rows={2} value={code} onChange={e => { setCode(e.target.value); setCodeError(''); }} aria-label={`Code de sauvegarde — ${def.title}`} />
          <button type="button" onClick={() => { const c = importCode(code); if (c) onPlay(c); else setCodeError('Code invalide ou incomplet.'); }}>Reprendre avec ce code</button>
          {codeError && <p className="warn">{codeError}</p>}
          {saved && <p className="muted small">Code de ta partie en cours : <code className="code">{exportCode(saved)}</code></p>}
        </div>
      </details>
    </section>
  );
}

export function CampaignMenu({ onPlay, onBack }: { onPlay: (c: CampaignSave) => void; onBack: () => void }) {
  return (
    <div className="setup wide">
      <TopBar title="Campagnes" onBack={onBack} />
      <p className="muted">Les quatre campagnes racontent la même histoire de quatre côtés. Ordre conseillé : Démons, Elfes, Nomades, puis Empire — mais chacune se joue seule. À la fin d’une campagne, les cartes gagnées rejoignent ta collection.</p>
      <div className="camp-blocks">
        {CAMPAIGNS.map(def => <CampaignBlock key={def.id} def={def} onPlay={onPlay} />)}
      </div>
    </div>
  );
}

// ---------- Options ----------
const STAT_LABEL = { ai: 'Contre l’ordinateur', hotseat: 'À deux (joueur A)', online: 'En ligne', campaign: 'Campagnes' } as const;

/** Profils : chacun a sa collection, ses pièces, ses decks, ses campagnes, ses options et ses statistiques. */
function ProfilesBlock({ profile, update, onSwitchProfile }: { profile: Profile; update: (fn: (p: Profile) => void) => void; onSwitchProfile: () => void }) {
  const active = activeProfileId();
  // Le nom affiché dans la liste suit le nom enregistré dans le profil.
  const [list, setList] = useState(() => { renameProfileEntry(active, profile.name); return listProfiles(); });
  const [newName, setNewName] = useState('');
  const [armed, setArmed] = useState<string | null>(null);
  const rename = (name: string) => { update(p => { p.name = name.slice(0, 24); }); renameProfileEntry(active, name.trim() || 'Joueur'); setList(listProfiles()); };
  return (
    <section className="menu-block">
      <h2>Profils</h2>
      <label className="field"><span>Nom du profil actif (utilisé en ligne)</span>
        <input className="search" value={profile.name} maxLength={24} onChange={e => rename(e.target.value)} onBlur={e => { if (!e.target.value.trim()) rename('Joueur'); }} />
      </label>
      <div className="stats-grid">
        {(Object.keys(STAT_LABEL) as (keyof typeof STAT_LABEL)[]).map(k => (
          <span key={k} className="pill">{STAT_LABEL[k]} : <b>{profile.stats[k].w}</b> V – <b>{profile.stats[k].l}</b> D</span>
        ))}
      </div>
      {list.length > 1 && (
        <div className="profile-list">
          {list.filter(p => p.id !== active).map(p => (
            <div key={p.id} className="profile-row">
              <b>{p.name}</b>
              <button type="button" onClick={() => { setActiveProfile(p.id); onSwitchProfile(); setList(listProfiles()); }}>Utiliser ce profil</button>
              {armed === p.id
                ? <button type="button" className="danger" onClick={() => { deleteProfileEntry(p.id); setArmed(null); setList(listProfiles()); }}>Confirmer la suppression</button>
                : <button type="button" onClick={() => setArmed(p.id)}>Supprimer</button>}
            </div>
          ))}
        </div>
      )}
      <div className="join-row plain">
        <input className="search" placeholder="Nom du nouveau profil" value={newName} maxLength={24} onChange={e => setNewName(e.target.value)} aria-label="Nom du nouveau profil" />
        <button type="button" disabled={!newName.trim()} onClick={() => {
          createProfileEntry(newName.trim());
          const fresh = newProfile(); fresh.name = newName.trim();
          saveProfile(fresh); setNewName(''); onSwitchProfile(); setList(listProfiles());
        }}>Créer et utiliser</button>
      </div>
      <p className="muted small">Chaque profil a sa propre collection, ses pièces, ses decks, ses campagnes et ses options.</p>
    </section>
  );
}

/** Apparence : image de profil et emotes emportées en ligne (parmi celles débloquées dans les paquets). */
function CosmeticsBlock({ profile, update }: { profile: Profile; update: (fn: (p: Profile) => void) => void }) {
  const toggle = (id: string) => update(p => {
    const on = p.emoteLoadout.includes(id);
    if (on) { if (p.emoteLoadout.length > 1) p.emoteLoadout = p.emoteLoadout.filter(x => x !== id); }
    else if (p.emoteLoadout.length < MAX_LOADOUT) p.emoteLoadout = [...p.emoteLoadout, id];
  });
  return (
    <section className="menu-block">
      <h2>Image de profil</h2>
      <div className="avatar-grid">
        {AVATAR_IDS.map(id => {
          const have = profile.avatars.includes(id);
          return (
            <button key={id} type="button" disabled={!have} className={`avatar-pick${profile.avatar === id ? ' on' : ''}${have ? '' : ' locked'}`}
              title={have ? AVATARS[id] : `${AVATARS[id]} — à débloquer dans les paquets`} onClick={() => update(p => { p.avatar = id; })}>
              <Avatar id={id} size={64} />
              <span>{have ? AVATARS[id] : '🔒'}</span>
            </button>
          );
        })}
      </div>
      <h2>Emotes en ligne <small className="muted">({profile.emoteLoadout.length} / {MAX_LOADOUT} choisies)</small></h2>
      <div className="emote-grid">
        {EMOTE_IDS.map(id => {
          const have = profile.emotes.includes(id);
          const on = profile.emoteLoadout.includes(id);
          return (
            <label key={id} className={`emote-pick${have ? '' : ' locked'}`} title={have ? '' : 'À débloquer dans les paquets'}>
              <input type="checkbox" disabled={!have || (!on && profile.emoteLoadout.length >= MAX_LOADOUT)} checked={on} onChange={() => toggle(id)} />
              {have ? `« ${EMOTES[id]} »` : '🔒 Emote à débloquer'}
            </label>
          );
        })}
      </div>
      <p className="muted small">Les emotes et les images de profil se débloquent dans les paquets (Ma collection → Mes cartes).</p>
    </section>
  );
}

export function OptionsScreen({ profile, update, onBack, onSwitchProfile }: { profile: Profile; update: (fn: (p: Profile) => void) => void; onBack: () => void; onSwitchProfile: () => void }) {
  const o = profile.options;
  const set = <K extends keyof Options>(k: K, v: Options[K]) => update(p => { p.options[k] = v; });
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [resetArmed, setResetArmed] = useState(false);
  const range = (k: 'scale' | 'animSpeed' | 'aiSpeed' | 'bannerSpeed', label: string, min: number, max: number, step: number, fmt: (v: number) => string) => (
    <label className="field">
      <span>{label} : <b>{fmt(o[k])}</b></span>
      <input type="range" min={min} max={max} step={step} value={o[k]} onChange={e => set(k, Number(e.target.value))} />
    </label>
  );
  return (
    <div className="setup">
      <TopBar title="Options" onBack={onBack} />
      <ProfilesBlock profile={profile} update={update} onSwitchProfile={onSwitchProfile} />
      <CosmeticsBlock profile={profile} update={update} />
      <section className="menu-block">
        {range('scale', 'Taille de l’interface', 0.8, 1.4, 0.05, v => `${Math.round(v * 100)} %`)}
        {range('animSpeed', 'Durée des animations de combat', 0.25, 2, 0.25, v => (v === 1 ? 'normale' : `×${v}`))}
        {range('aiSpeed', 'Temps de réflexion affiché de l’ordinateur', 0.25, 3, 0.25, v => (v === 1 ? 'normal' : `×${v}`))}
        {range('bannerSpeed', 'Durée des bandeaux (tactiques, Leaders adverses)', 0.5, 4, 0.5, v => (v === 1 ? 'normale' : `×${v}`))}
        <label className="check"><input type="checkbox" checked={o.revealAiHand} onChange={e => set('revealAiHand', e.target.checked)} /> Main de l’ordinateur visible dès le début</label>
        <label className="check"><input type="checkbox" checked={o.romanLevels !== false} onChange={e => set('romanLevels', e.target.checked)} /> Niveaux des cartes en chiffres romains (II, III…)</label>
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
        <details><summary>Afficher le code de ce profil</summary><code className="code">{profileCode(profile)}</code></details>
        <div className="custom-deck">
          <textarea rows={2} value={code} onChange={e => { setCode(e.target.value); setMsg(''); }} aria-label="Code de profil à importer" />
          <button type="button" onClick={() => { const p = profileFromCode(code); if (!p) { setMsg('Code invalide.'); return; } update(cur => Object.assign(cur, p)); setMsg('Profil importé.'); }}>Importer ce profil (remplace l’actuel)</button>
          {msg && <p className="muted small">{msg}</p>}
        </div>
      </section>
    </div>
  );
}
