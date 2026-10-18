// Application : accueil, parties locales, campagne, collection (decks, cartes, paquets), options.
import { useCallback, useEffect, useRef, useState } from 'react';
import { addToPool, bonusFor, bonusUnlocked, campaignDef, defeatsOn, currentScenario, defaultDeckSelection, saveCampaign, scenarioAiFilter, scenarioGameSetup, selectionToDeck, type CampaignSave } from '../campaign/campaign';
import type { Action, DialogLine, GameState, PlayerId } from '../engine/types';
import { formatEvent } from '../i18n/log.fr';
import { COINS_PER_WIN, loadProfile, mergeCampaignPool, saveProfile, type Profile } from '../profile/profile';
import { CampHub } from './Camp';
import { CampaignDeck } from './CampaignDeck';
import { setRomanLevels } from './CardFace';
import { CardTile } from './CardTile';
import { HoverZoom, showZoom } from './HoverZoom';
import { MyCards } from './Collection';
import { DeckList } from './Decks';
import { Dialog, GameScreen } from './GameScreen';
import { DraftScreen, DRAFT_FIRST_BONUS } from './Draft';
import { EMOTES } from '../profile/cosmetics';
import { Avatar } from './avatars';
import { OnlineLobby, rematchMsg, startFromMsg, type OnlineStart } from './Online';
import { Rewards } from './Rewards';
import { liveGameStore, ScenarioRulesBubble } from './ScenarioRules';
import { Tutorial } from './Tutorial';
import { CampaignMenu, Home, LocalPlay, OptionsScreen, resolveDeck, TopBar, type LocalSetup } from './Screens';

/** Lien terminé par #autopilot : l'ordinateur joue aussi à ta place en campagne (pratique pour tester les scénarios). */
const AUTOPILOT = typeof location !== 'undefined' && location.hash === '#autopilot';

type Screen =
  | { kind: 'home' }
  | { kind: 'local' }
  | { kind: 'tutorial'; key: number }
  | { kind: 'online' }
  | { kind: 'draft' }
  | { kind: 'onlineGame'; start: OnlineStart; key: number }
  | { kind: 'localGame'; setup: LocalSetup; key: number; series?: Record<PlayerId, number>; first?: PlayerId }
  | { kind: 'campaignMenu' }
  | { kind: 'campHub'; campaign: CampaignSave }
  | { kind: 'campDeck'; campaign: CampaignSave }
  | { kind: 'campOptions'; campaign: CampaignSave }
  | { kind: 'campGame'; campaign: CampaignSave; deck: string[]; key: number }
  | { kind: 'campVictory'; campaign: CampaignSave; extra?: DialogLine[] }
  | { kind: 'campReward'; campaign: CampaignSave }
  | { kind: 'campEnd'; campaign: CampaignSave; gained: Record<string, number> }
  | { kind: 'collection'; tab: 'decks' | 'cards' }
  | { kind: 'options' };

function EndBox({ title, text, children, extra }: { title: string; text: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="box">
        <h2>{title}</h2>
        <p>{text}</p>
        {extra}
        <div className="choices row">{children}</div>
      </div>
    </div>
  );
}

const CoinGain = () => <p className="coin-gain">+{COINS_PER_WIN} pièces</p>;

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });
  useEffect(() => { showZoom(null); }, [screen.kind]); // l'agrandissement ne survit pas à un changement d'écran
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  /** Partie de campagne en cours, suivie par la bulle des règles du scénario. */
  const live = useRef(liveGameStore()).current;
  const profileRef = useRef(profile);
  /** Modifie le profil de façon synchrone (le résultat est disponible juste après l'appel) et le sauvegarde. */
  const update = useCallback((fn: (p: Profile) => void) => {
    const next = structuredClone(profileRef.current);
    fn(next);
    profileRef.current = next;
    saveProfile(next);
    setProfile(next);
  }, []);
  const home = () => setScreen({ kind: 'home' });
  /** Changement de profil : on recharge toutes ses données. */
  const switchProfile = () => { const p = loadProfile(); profileRef.current = p; setProfile(p); };
  const o = profile.options;
  setRomanLevels(o.romanLevels !== false);
  const gameOpts = { animMul: o.animSpeed, aiMul: o.aiSpeed, bannerMul: o.bannerSpeed, initialReveal: o.revealAiHand };

  /** Passe au scénario suivant ou termine la campagne (fusion du pool dans la collection). */
  const advance = (c: CampaignSave): Screen => {
    if (c.idx >= campaignDef(c).order.length - 1) {
      const done = { ...c, finished: true };
      saveCampaign(done);
      let gained: Record<string, number> = {};
      update(p => { gained = mergeCampaignPool(p, done.pool, done.id); });
      return { kind: 'campEnd', campaign: done, gained };
    }
    const next = { ...c, idx: c.idx + 1, bonus: 0 };
    saveCampaign(next);
    return { kind: 'campHub', campaign: next };
  };

  let content: React.ReactNode;

  if (screen.kind === 'home') {
    content = <Home profile={profile} go={t => setScreen(t === 'tutorial' ? { kind: 'tutorial', key: Date.now() } : t === 'local' ? { kind: 'local' } : t === 'online' ? { kind: 'online' } : t === 'draft' ? { kind: 'draft' } : t === 'campaign' ? { kind: 'campaignMenu' } : t === 'collection' ? { kind: 'collection', tab: 'decks' } : t === 'options' ? { kind: 'options' } : { kind: 'home' })} />;
  } else if (screen.kind === 'local') {
    content = <LocalPlay profile={profile} onBack={home} goDecks={() => setScreen({ kind: 'collection', tab: 'decks' })} onStart={setup => setScreen({ kind: 'localGame', setup, key: Date.now(), first: setup.first === 'B' ? 'B' : setup.first === 'A' ? 'A' : Math.random() < 0.5 ? 'A' : 'B' })} />;
  } else if (screen.kind === 'localGame') {
    const { setup } = screen;
    const A = resolveDeck(profile, setup.A), B = resolveDeck(profile, setup.B);
    const names = { A: A.label, B: B.label };
    if (names.A === names.B) { names.A += ' (A)'; names.B += ' (B)'; }
    const paid = setup.mode === 'ai';
    content = (
      <GameScreen
        key={screen.key}
        {...gameOpts}
        setup={{ seed: screen.key, first: screen.first ?? 'A', A: { faction: A.faction, deck: A.cards }, B: { faction: B.faction, deck: B.cards } }}
        names={names}
        human={{ A: setup.mode !== 'watch', B: setup.mode === 'hotseat' }}
        flip={setup.mode === 'hotseat'}
        fast={setup.mode === 'watch'}
        avatars={setup.mode !== 'watch' ? { A: profile.avatar } : undefined}
        onQuit={() => setScreen({ kind: 'local' })}
        onOver={g => {
          const winA = g.over!.winner === 'A';
          if (setup.mode !== 'watch') update(p => { if (paid && winA) p.coins += COINS_PER_WIN; p.stats[paid ? 'ai' : 'hotseat'][winA ? 'w' : 'l']++; });
          setScreen(cur => (cur.kind === 'localGame' ? { ...cur, series: { A: (cur.series?.A ?? 0) + (winA ? 1 : 0), B: (cur.series?.B ?? 0) + (winA ? 0 : 1) } } : cur));
        }}
        renderEnd={(g, close) => (
          <EndBox
            title={`Victoire : ${names[g.over!.winner]}`}
            text={`${formatEvent({ type: 'gameOver', winner: g.over!.winner, reason: g.over!.reason }, names)} (tour ${g.turn})`}
            extra={<>{paid && g.over!.winner === 'A' ? <CoinGain /> : null}
              <p className="series">Série : {names.A} {screen.series?.A ?? 0} – {screen.series?.B ?? 0} {names.B}</p></>}
          >
            <button type="button" onClick={close}>Voir le plateau</button>
            <button type="button" onClick={() => setScreen({ kind: 'localGame', setup, key: Date.now(), series: screen.series, first: (screen.first ?? 'A') === 'A' ? 'B' : 'A' })}>Revanche (l’autre joueur commence)</button>
            <button type="button" className="primary" onClick={home}>Accueil</button>
          </EndBox>
        )}
      />
    );
  } else if (screen.kind === 'draft') {
    content = <DraftScreen profile={profile} onExit={home} gameOpts={gameOpts}
      reward={r => update(p => { if (r.win !== undefined) { if (r.win) p.coins += COINS_PER_WIN; p.stats.ai[r.win ? 'w' : 'l']++; } if (r.first) p.coins += DRAFT_FIRST_BONUS; })} />;
  } else if (screen.kind === 'tutorial') {
    content = <Tutorial key={screen.key} gameOpts={{ animMul: o.animSpeed, aiMul: o.aiSpeed, bannerMul: o.bannerSpeed }} onExit={home} onCampaign={() => setScreen({ kind: 'campaignMenu' })} />;
  } else if (screen.kind === 'online') {
    content = <OnlineLobby profile={profile} onBack={home} goDecks={() => setScreen({ kind: 'collection', tab: 'decks' })} onStart={start => setScreen({ kind: 'onlineGame', start, key: Date.now() })} />;
  } else if (screen.kind === 'onlineGame') {
    content = <OnlineGame key={screen.key} start={screen.start} gameOpts={gameOpts} loadout={profile.emoteLoadout} onExit={() => setScreen({ kind: 'online' })}
      onResult={win => update(p => { if (win) p.coins += COINS_PER_WIN; p.stats.online[win ? 'w' : 'l']++; })} />;
  } else if (screen.kind === 'campaignMenu') {
    content = <CampaignMenu onBack={home} onPlay={c => { saveCampaign(c); setScreen({ kind: 'campHub', campaign: c }); }} />;
  } else if (screen.kind === 'campHub') {
    const c = screen.campaign;
    const sc = currentScenario(c);
    content = (
      <CampHub
        campaign={c}
        scenario={sc}
        onDeck={() => setScreen({ kind: 'campDeck', campaign: c })}
        onOptions={() => setScreen({ kind: 'campOptions', campaign: c })}
        onMenu={home}
        onBonus={b => { const next = { ...c, bonus: b }; saveCampaign(next); setScreen({ kind: 'campHub', campaign: next }); }}
        onFight={() => {
          const sel = defaultDeckSelection(c);
          const size = Object.values(sel).reduce((a, b) => a + b, 0);
          if (size < sc.deckRules.min) { setScreen({ kind: 'campDeck', campaign: c }); return; }
          setScreen({ kind: 'campGame', campaign: c, deck: selectionToDeck(sel), key: Date.now() });
        }}
      />
    );
  } else if (screen.kind === 'campOptions') {
    const c = screen.campaign;
    content = <OptionsScreen profile={profile} update={update} onSwitchProfile={switchProfile} onBack={() => setScreen({ kind: 'campaignMenu' })} />;
  } else if (screen.kind === 'campDeck') {
    const c = screen.campaign;
    content = (
      <CampaignDeck
        key={c.idx}
        campaign={c}
        scenario={currentScenario(c)}
        onBack={sel => { const next = { ...c, deck: sel }; saveCampaign(next); setScreen({ kind: 'campHub', campaign: next }); }}
        onLaunch={sel => {
          const next = { ...c, deck: sel };
          saveCampaign(next);
          setScreen({ kind: 'campGame', campaign: next, deck: selectionToDeck(sel), key: Date.now() });
        }}
      />
    );
  } else if (screen.kind === 'campGame') {
    const c = screen.campaign;
    const sc = currentScenario(c);
    const names = { A: sc.A.label, B: sc.B.label };
    content = (
      <GameScreen
        key={screen.key}
        {...gameOpts}
        setup={scenarioGameSetup(sc, screen.deck, screen.key, bonusFor(c, sc.id))}
        names={names}
        human={{ A: !AUTOPILOT, B: false }}
        fast={AUTOPILOT}
        aiFilter={scenarioAiFilter(sc)}
        title={sc.title}
        intro={sc.intro}
        onGame={live.set}
        overlay={<ScenarioRulesBubble sc={sc} live={live} />}
        onQuit={() => setScreen({ kind: 'campHub', campaign: c })}
        onOver={g => {
          update(p => { p.stats.campaign[g.over!.winner === 'A' ? 'w' : 'l']++; });
          if (g.over!.winner === 'A') { update(p => { p.coins += COINS_PER_WIN; }); return; }
          // Défaite : comptée pour ce scénario (débloque l'aide au départ après plusieurs échecs).
          const next = { ...c, attempts: { ...c.attempts, [sc.id]: (c.attempts[sc.id] ?? 0) + 1 } };
          saveCampaign(next);
          setScreen(cur => (cur.kind === 'campGame' ? { ...cur, campaign: next } : cur));
        }}
        renderEnd={(g: GameState, close) => g.over!.winner === 'A' ? (
          <EndBox title="Scénario réussi !" text={formatEvent({ type: 'gameOver', winner: 'A', reason: g.over!.reason }, names) ?? ''} extra={<CoinGain />}>
            <button type="button" onClick={close}>Voir le plateau</button>
            <button type="button" className="primary" onClick={() => {
              // Libération : les régiments libérés rejoignent le pool (4 au plus).
              const freed = sc.liberation ? Math.min(4, g.scenario?.liberated ?? 0) : 0;
              if (!freed) { setScreen({ kind: 'campVictory', campaign: c }); return; }
              const next = structuredClone(c);
              for (let k = 0; k < freed; k++) addToPool(next, sc.liberation!.cardIds[0]!);
              saveCampaign(next);
              setScreen({ kind: 'campVictory', campaign: next, extra: [{ who: '', text: `${freed} captif(s) libéré(s) rejoignent ton pool de cartes.` }] });
            }}>Continuer la campagne</button>
          </EndBox>
        ) : (
          <EndBox title="Scénario échoué" text={formatEvent({ type: 'gameOver', winner: g.over!.winner, reason: g.over!.reason }, names) ?? ''}
            extra={<p className="muted small">Défaites sur ce combat : {defeatsOn(c, sc.id)}.{bonusUnlocked(c, sc.id) > bonusFor(c, sc.id) ? ' Une aide est disponible au camp : des ressources en plus au départ.' : ''}</p>}>
            <button type="button" onClick={close}>Voir le plateau</button>
            <button type="button" onClick={() => setScreen({ kind: 'campHub', campaign: c })}>Retour au camp</button>
            <button type="button" className="primary" onClick={() => setScreen({ kind: 'campGame', campaign: c, deck: screen.deck, key: Date.now() })}>Réessayer le scénario</button>
          </EndBox>
        )}
      />
    );
  } else if (screen.kind === 'campVictory') {
    const c = screen.campaign;
    const sc = currentScenario(c);
    const after = () => setScreen(sc.reward ? { kind: 'campReward', campaign: c } : advance(c));
    const lines = [...(sc.victoryDialog?.length ? sc.victoryDialog : [{ who: '', text: 'Victoire !' }]), ...(screen.extra ?? [])];
    content = <div className="camp-bg"><Dialog title={sc.title} lines={lines} onClose={after} /></div>;
  } else if (screen.kind === 'campReward') {
    const c = screen.campaign;
    content = <div className="camp-bg"><Rewards campaign={c} hero={campaignDef(c).hero} reward={currentScenario(c).reward!} owned={id => profile.collection[id] ?? 0} onDone={updated => setScreen(advance(updated))} /></div>;
  } else if (screen.kind === 'campEnd') {
    const gained = Object.entries(screen.gained);
    const total = gained.reduce((n, [, k]) => n + k, 0);
    content = (
      <div className="camp">
        <TopBar title={campaignDef(screen.campaign).endTitle} onBack={home} />
        <p>{campaignDef(screen.campaign).endText}</p>
        <h2 className="sub">{total ? `${total} carte(s) rejoignent ta collection` : 'Aucune nouvelle carte pour ta collection'}</h2>
        <p className="muted small">Pour chaque carte, ta collection monte au nombre d’exemplaires de ton pool de campagne (3 maximum). Chaque campagne terminée compte : recommence-la en choisissant d’autres cartes pour compléter ta collection.</p>
        {gained.length > 0 && (
          <div className="camp-grid">
            {gained.map(([id, k]) => <CardTile key={id} id={id} badge={<span className="count">+{k}</span>} />)}
          </div>
        )}
        <div className="choices row left">
          <button type="button" onClick={() => setScreen({ kind: 'campHub', campaign: screen.campaign })}>Retour au camp</button>
          <button type="button" onClick={() => setScreen({ kind: 'collection', tab: 'cards' })}>Voir ma collection</button>
          <button type="button" className="primary" onClick={home}>Accueil</button>
        </div>
      </div>
    );
  } else if (screen.kind === 'collection') {
    const tab = screen.tab;
    content = (
      <div className="camp">
        <TopBar
          title="Ma collection"
          onBack={home}
          right={
            <div className="tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'decks'} className={tab === 'decks' ? 'on' : ''} onClick={() => setScreen({ kind: 'collection', tab: 'decks' })}>Mes decks</button>
              <button type="button" role="tab" aria-selected={tab === 'cards'} className={tab === 'cards' ? 'on' : ''} onClick={() => setScreen({ kind: 'collection', tab: 'cards' })}>Mes cartes</button>
            </div>
          }
        />
        {tab === 'decks' ? <DeckList profile={profile} update={update} /> : <MyCards profile={profile} update={update} />}
      </div>
    );
  } else {
    content = <OptionsScreen profile={profile} update={update} onSwitchProfile={switchProfile} onBack={home} />;
  }

  return <div className="app-zoom" style={{ zoom: o.scale }}>{content}<HoverZoom /></div>;
}

/** Partie en ligne : notre camp est en bas, le camp adverse est joué à distance. Revanche, série et emotes. */
function OnlineGame({ start: first, gameOpts, onExit, onResult, loadout }: {
  loadout: string[];
  start: OnlineStart; gameOpts: { animMul: number; aiMul: number; bannerMul: number; initialReveal: boolean }; onExit: () => void; onResult: (win: boolean) => void;
}) {
  const link = first.link;
  const [start, setStart] = useState(first);
  const [round, setRound] = useState(0);
  const [inbox, setInbox] = useState<Action[]>([]);
  const [gone, setGone] = useState(false);
  const [ended, setEnded] = useState(false);
  const [series, setSeries] = useState({ me: 0, them: 0 });
  const [rematch, setRematch] = useState({ me: false, them: false });
  const [bubbles, setBubbles] = useState<{ id: number; mine: boolean; text: string }[]>([]);
  const [muted, setMuted] = useState(false);
  const [emoteOpen, setEmoteOpen] = useState(false);
  const lastEmote = useRef(0);
  const sent = useRef(0);
  const startRef = useRef(start);
  startRef.current = start;

  const newRound = useCallback((st: OnlineStart) => {
    setStart(st); setInbox([]); sent.current = 0; setEnded(false); setRematch({ me: false, them: false }); setRound(r => r + 1);
  }, []);
  const showBubble = useCallback((mine: boolean, id: string) => {
    const text = EMOTES[id]; if (!text) return;
    const key = Math.random();
    setBubbles(b => [...b.filter(x => x.mine !== mine), { id: key, mine, text }]);
    setTimeout(() => setBubbles(b => b.filter(x => x.id !== key)), 3500);
  }, []);
  useEffect(() => {
    link.onMessage = m => {
      if (m.t === 'act') setInbox(i => [...i, m.a]);
      else if (m.t === 'bye') setGone(true);
      else if (m.t === 'emote') { if (!mutedRef.current) showBubble(false, m.id); }
      else if (m.t === 'rematch') setRematch(r => ({ ...r, them: true }));
      else if (m.t === 'start' && !startRef.current.isHost) newRound(startFromMsg(link, m, m.hostSide === 'A' ? 'B' : 'A', false));
    };
    link.onClose = () => setGone(true);
    return () => { link.onMessage = null; link.onClose = null; };
  }, [link, newRound, showBubble]);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  // Revanche : quand les deux joueurs l'ont demandée, l'hôte relance (l'autre joueur commence).
  useEffect(() => {
    if (!rematch.me || !rematch.them || !start.isHost) return;
    const m = rematchMsg(start.msg);
    link.send(m);
    newRound(startFromMsg(link, m, m.hostSide, true));
  }, [rematch, start, link, newRound]);

  const other = start.side === 'A' ? 'B' : 'A';
  const quit = () => { try { link.send({ t: 'bye' }); } catch { /* déjà fermée */ } link.close(); onExit(); };
  const emote = (id: string) => {
    if (Date.now() - lastEmote.current < 2000) return;
    lastEmote.current = Date.now();
    try { link.send({ t: 'emote', id }); } catch { /* connexion coupée */ }
    showBubble(true, id);
    setEmoteOpen(false);
  };
  const askRematch = () => { setRematch(r => ({ ...r, me: true })); try { link.send({ t: 'rematch' }); } catch { /* connexion coupée */ } };
  const seriesText = `Série : ${start.names[start.side]} ${series.me} – ${series.them} ${start.names[other]}`;

  const emoteUi = (
    <>
      <div className="emote-bar">
        <button type="button" onClick={() => setEmoteOpen(o => !o)} aria-expanded={emoteOpen}>💬 Emotes</button>
        <button type="button" onClick={() => setMuted(m => !m)} title={muted ? 'Réafficher les emotes adverses' : 'Masquer les emotes adverses'}>{muted ? '🔇' : '🔈'}</button>
        {emoteOpen && (
          <div className="emote-menu" role="menu">
            {loadout.map(id => <button key={id} type="button" role="menuitem" onClick={() => emote(id)}>{EMOTES[id]}</button>)}
          </div>
        )}
      </div>
      {bubbles.map(b => <div key={b.id} className={`emote-bubble ${b.mine ? 'mine' : 'theirs'}`}><Avatar id={start.avatars[b.mine ? start.side : other]} size={34} /><b>{b.mine ? start.names[start.side] : start.names[other]}</b> {b.text}</div>)}
    </>
  );

  return (
    <>
      <GameScreen
        key={round}
        animMul={gameOpts.animMul}
        aiMul={gameOpts.aiMul}
        bannerMul={gameOpts.bannerMul}
        setup={start.setup}
        names={start.names}
        human={{ A: start.side === 'A', B: start.side === 'B' }}
        bottomSide={start.side}
        remote={{ side: other, send: a => link.send({ t: 'act', n: sent.current++, a }), inbox }}
        title={`Partie en ligne — ${seriesText}`}
        avatars={start.avatars}
        onQuit={quit}
        overlay={emoteUi}
        onOver={g => {
          setEnded(true);
          const win = g.over!.winner === start.side;
          setSeries(x => (win ? { ...x, me: x.me + 1 } : { ...x, them: x.them + 1 }));
          onResult(win);
        }}
        renderEnd={(g, close) => (
          <EndBox
            title={g.over!.winner === start.side ? 'Victoire !' : 'Défaite'}
            text={`${formatEvent({ type: 'gameOver', winner: g.over!.winner, reason: g.over!.reason }, start.names)} (tour ${g.turn})`}
            extra={<>{g.over!.winner === start.side ? <CoinGain /> : null}<p className="series">{seriesText}</p>
              {rematch.them && !rematch.me && <p className="muted small">{start.names[other]} propose une revanche !</p>}
              {rematch.me && !rematch.them && <p className="muted small">En attente de la réponse de {start.names[other]}…</p>}</>}
          >
            <button type="button" onClick={close}>Voir le plateau</button>
            <button type="button" onClick={quit}>Quitter</button>
            <button type="button" className="primary" disabled={rematch.me || gone} onClick={askRematch}>{rematch.them ? 'Accepter la revanche' : 'Revanche'}</button>
          </EndBox>
        )}
      />
      {gone && (
        <EndBox title="Connexion perdue" text="Ton adversaire a quitté la partie ou la connexion a été coupée.">
          <button type="button" className="primary" onClick={quit}>Retour</button>
        </EndBox>
      )}
    </>
  );
}
