// Jeu en ligne (premier jet) : salle d'attente, connexion pair-à-pair, puis partie entre deux navigateurs.
import { useEffect, useRef, useState } from 'react';
import type { GameSetup } from '../engine/game';
import type { Action, PlayerId } from '../engine/types';
import { hostRoom, joinRoom, manualHost, manualJoin, newRoomCode, PROTOCOL, webrtcAvailable, type Link, type NetMsg } from '../net/link';
import { checkDeck, type Profile } from '../profile/profile';
import { DeckSelect, resolveDeck, TopBar } from './Screens';

export interface OnlineStart { link: Link; setup: GameSetup; side: PlayerId; names: Record<PlayerId, string> }

type Step =
  | { k: 'menu' }
  | { k: 'hosting'; code: string; ready: boolean }
  | { k: 'joining'; code: string }
  | { k: 'manualHost'; offer: string | null; answer: string; accept: ((a: string) => Promise<void>) | null }
  | { k: 'manualJoin'; offer: string; answer: string | null }
  | { k: 'handshake' };

export function OnlineLobby({ profile, onStart, onBack, goDecks }: { profile: Profile; onStart: (s: OnlineStart) => void; onBack: () => void; goDecks: () => void }) {
  const firstMine = profile.decks.find(d => checkDeck(d.cards, profile).ok);
  const [deckKey, setDeckKey] = useState(firstMine ? `my:${firstMine.id}` : 'demo:empire');
  const [name, setName] = useState('Joueur');
  const [step, setStep] = useState<Step>({ k: 'menu' });
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);

  const validDeck = deckKey.startsWith('my:') ? profile.decks.some(d => `my:${d.id}` === deckKey && checkDeck(d.cards, profile).ok) : profile.options.allUnlocked;
  const mine = () => { const d = resolveDeck(profile, deckKey); return { name: name.trim() || 'Joueur', faction: d.faction, deck: d.cards }; };

  /** Une fois reliés : chacun se présente, puis l'hôte fixe la partie (graine, camp, decks) et l'envoie. */
  const handshake = (link: Link, isHost: boolean) => {
    cleanup.current = null;
    setStep({ k: 'handshake' });
    const me = mine();
    link.onMessage = (m: NetMsg) => {
      if (m.t === 'hello' && isHost) {
        if (m.v !== PROTOCOL) { setError('Versions du jeu différentes : mettez tous les deux le jeu à jour.'); link.close(); return; }
        const hostSide: PlayerId = Math.random() < 0.5 ? 'A' : 'B';
        const them = { name: m.name, faction: m.faction, deck: m.deck };
        const start: NetMsg = { t: 'start', seed: `net-${Date.now()}-${Math.random()}`, hostSide, A: hostSide === 'A' ? me : them, B: hostSide === 'A' ? them : me };
        link.send(start);
        begin(link, start, hostSide);
      } else if (m.t === 'start' && !isHost) {
        begin(link, m, m.hostSide === 'A' ? 'B' : 'A');
      }
    };
    link.onClose = () => { setError('La connexion a été coupée.'); setStep({ k: 'menu' }); };
    link.send({ t: 'hello', v: PROTOCOL, ...me });
  };
  const begin = (link: Link, m: Extract<NetMsg, { t: 'start' }>, side: PlayerId) => {
    link.onMessage = null; link.onClose = null;
    const names = { A: m.A.name, B: m.B.name };
    if (names.A === names.B) { names.A += ' (A)'; names.B += ' (B)'; }
    onStart({ link, side, names, setup: { seed: m.seed, A: { faction: m.A.faction, deck: m.A.deck }, B: { faction: m.B.faction, deck: m.B.deck } } });
  };
  const fail = (msg: string) => { setError(msg); setStep({ k: 'menu' }); cleanup.current?.(); cleanup.current = null; };

  const host = () => {
    setError('');
    const code = newRoomCode();
    setStep({ k: 'hosting', code, ready: false });
    cleanup.current = hostRoom(code, () => setStep({ k: 'hosting', code, ready: true }), l => handshake(l, true), fail);
  };
  const join = () => {
    setError('');
    const code = joinCode.trim().toUpperCase().replace(/^LDF-/, '');
    if (code.length < 4) { setError('Entre le code donné par ton adversaire.'); return; }
    setStep({ k: 'joining', code });
    cleanup.current = joinRoom(code, l => handshake(l, false), fail);
  };
  const manualHostStart = async () => {
    setError('');
    setStep({ k: 'manualHost', offer: null, answer: '', accept: null });
    try {
      const r = await manualHost(l => handshake(l, true));
      setStep({ k: 'manualHost', offer: r.offer, answer: '', accept: r.accept });
    } catch (e) { fail(`Impossible de créer l’invitation (${String(e)}).`); }
  };
  const manualJoinStart = async (offer: string) => {
    setError('');
    try {
      const answer = await manualJoin(offer, l => handshake(l, false));
      setStep({ k: 'manualJoin', offer, answer });
    } catch { setError('Code d’invitation invalide.'); }
  };
  const copy = (t: string) => { navigator.clipboard?.writeText(t).catch(() => { /* sélection manuelle */ }); };

  if (!webrtcAvailable()) {
    return (
      <div className="setup">
        <TopBar title="Jouer en ligne" onBack={onBack} />
        <p className="warn">Cette page ne permet pas les connexions entre navigateurs. Ouvre le jeu depuis son site (GitHub Pages) ou depuis le fichier HTML pour jouer en ligne.</p>
      </div>
    );
  }

  return (
    <div className="setup">
      <TopBar title="Jouer en ligne" onBack={() => { cleanup.current?.(); onBack(); }} />
      <p className="muted small">Premier jet : une partie entre deux navigateurs, sans compte. La partie est calculée des deux côtés ; seules les actions voyagent. Une victoire rapporte 5 pièces.</p>

      {step.k === 'menu' && (
        <>
          <label className="field"><span>Ton nom</span><input className="search" value={name} maxLength={24} onChange={e => setName(e.target.value)} /></label>
          <DeckSelect profile={profile} value={deckKey} onChange={setDeckKey} human label="Ton deck" />
          {!validDeck && <p className="warn">Il te faut un deck valide. <button type="button" className="link" onClick={goDecks}>Créer un deck</button> — ou active « Toutes les cartes débloquées » dans les options.</p>}
          <section className="menu-block">
            <h2>Avec un code court</h2>
            <p className="muted small">Un service gratuit de mise en relation (PeerJS) relie les deux navigateurs, puis la partie passe directement de l’un à l’autre.</p>
            <div className="choices row left">
              <button type="button" className="primary" disabled={!validDeck} onClick={host}>Créer une partie</button>
            </div>
            <div className="join-row">
              <input className="search" placeholder="Code reçu (ex. K7QM2X)" value={joinCode} onChange={e => setJoinCode(e.target.value)} aria-label="Code de la partie à rejoindre" />
              <button type="button" disabled={!validDeck} onClick={join}>Rejoindre</button>
            </div>
          </section>
          <details className="menu-block">
            <summary>Sans service externe : codes à copier-coller</summary>
            <p className="muted small">L’hôte envoie un long code d’invitation (par message), l’invité renvoie un code de réponse. Plus lourd, mais rien ne passe par un service tiers.</p>
            <div className="choices row left">
              <button type="button" disabled={!validDeck} onClick={() => void manualHostStart()}>Je crée l’invitation</button>
              <button type="button" disabled={!validDeck} onClick={() => setStep({ k: 'manualJoin', offer: '', answer: null })}>J’ai reçu une invitation</button>
            </div>
          </details>
        </>
      )}

      {step.k === 'hosting' && (
        <section className="menu-block">
          <h2>{step.ready ? 'Partie créée' : 'Création de la partie…'}</h2>
          {step.ready && <>
            <p>Donne ce code à ton adversaire :</p>
            <p className="room-code" onClick={() => copy(step.code)} title="Copier">{step.code}</p>
            <p className="muted small">En attente de son arrivée… (garde cette page ouverte)</p>
          </>}
          <div className="choices row left"><button type="button" onClick={() => { cleanup.current?.(); setStep({ k: 'menu' }); }}>Annuler</button></div>
        </section>
      )}

      {step.k === 'joining' && (
        <section className="menu-block">
          <h2>Connexion à la partie {step.code}…</h2>
          <div className="choices row left"><button type="button" onClick={() => { cleanup.current?.(); setStep({ k: 'menu' }); }}>Annuler</button></div>
        </section>
      )}

      {step.k === 'manualHost' && (
        <section className="menu-block">
          <h2>1. Envoie ce code d’invitation</h2>
          {step.offer ? <>
            <textarea className="code-box" readOnly rows={4} value={step.offer} onFocus={e => e.currentTarget.select()} />
            <div className="choices row left"><button type="button" onClick={() => copy(step.offer!)}>Copier</button></div>
            <h2>2. Colle ici la réponse de ton adversaire</h2>
            <textarea className="code-box" rows={4} value={step.answer} onChange={e => setStep({ ...step, answer: e.target.value })} />
            <div className="choices row left">
              <button type="button" className="primary" disabled={!step.answer.trim()} onClick={() => { step.accept!(step.answer).catch(() => setError('Code de réponse invalide.')); }}>Se connecter</button>
              <button type="button" onClick={() => setStep({ k: 'menu' })}>Annuler</button>
            </div>
          </> : <p className="muted">Préparation de l’invitation…</p>}
        </section>
      )}

      {step.k === 'manualJoin' && (
        <section className="menu-block">
          <h2>1. Colle le code d’invitation</h2>
          <textarea className="code-box" rows={4} value={step.offer} onChange={e => setStep({ ...step, offer: e.target.value })} readOnly={!!step.answer} />
          {!step.answer ? (
            <div className="choices row left">
              <button type="button" className="primary" disabled={!step.offer.trim()} onClick={() => void manualJoinStart(step.offer)}>Créer ma réponse</button>
              <button type="button" onClick={() => setStep({ k: 'menu' })}>Annuler</button>
            </div>
          ) : <>
            <h2>2. Renvoie ce code de réponse à l’hôte</h2>
            <textarea className="code-box" readOnly rows={4} value={step.answer} onFocus={e => e.currentTarget.select()} />
            <div className="choices row left"><button type="button" onClick={() => copy(step.answer!)}>Copier</button></div>
            <p className="muted small">La partie démarre dès que l’hôte a collé ta réponse.</p>
          </>}
        </section>
      )}

      {step.k === 'handshake' && <section className="menu-block"><h2>Connecté ! Préparation de la partie…</h2></section>}
      {error && <p className="warn">{error}</p>}
    </div>
  );
}

/** Ordre et contenu des actions reçues pour la partie en cours. */
export function useRemoteInbox(link: Link | null): { inbox: Action[]; gone: boolean; send: (a: Action) => void } {
  const [inbox, setInbox] = useState<Action[]>([]);
  const [gone, setGone] = useState(false);
  const sent = useRef(0);
  useEffect(() => {
    if (!link) return;
    link.onMessage = m => { if (m.t === 'act') setInbox(i => [...i, m.a]); if (m.t === 'bye') setGone(true); };
    link.onClose = () => setGone(true);
    return () => { link.onMessage = null; link.onClose = null; };
  }, [link]);
  return { inbox, gone, send: a => link?.send({ t: 'act', n: sent.current++, a }) };
}
