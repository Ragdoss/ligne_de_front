// Application : accueil, parties locales, campagne, collection (decks, cartes, paquets), options.
import { useCallback, useRef, useState } from 'react';
import { addToPool, bonusFor, bonusUnlocked, campaignDef, defeatsOn, currentScenario, defaultDeckSelection, saveCampaign, scenarioAiFilter, scenarioGameSetup, selectionToDeck, type CampaignSave } from '../campaign/campaign';
import type { DialogLine, GameState } from '../engine/types';
import { formatEvent } from '../i18n/log.fr';
import { COINS_PER_WIN, loadProfile, mergeCampaignPool, saveProfile, type Profile } from '../profile/profile';
import { CampHub } from './Camp';
import { CampaignDeck } from './CampaignDeck';
import { CardTile } from './CardTile';
import { MyCards } from './Collection';
import { DeckList } from './Decks';
import { Dialog, GameScreen } from './GameScreen';
import { OnlineLobby, useRemoteInbox, type OnlineStart } from './Online';
import { Rewards } from './Rewards';
import { Tutorial } from './Tutorial';
import { CampaignMenu, Home, LocalPlay, OptionsScreen, resolveDeck, TopBar, type LocalSetup } from './Screens';

/** Lien terminé par #autopilot : l'ordinateur joue aussi à ta place en campagne (pratique pour tester les scénarios). */
const AUTOPILOT = typeof location !== 'undefined' && location.hash === '#autopilot';

type Screen =
  | { kind: 'home' }
  | { kind: 'local' }
  | { kind: 'tutorial'; key: number }
  | { kind: 'online' }
  | { kind: 'onlineGame'; start: OnlineStart; key: number }
  | { kind: 'localGame'; setup: LocalSetup; key: number }
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
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
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
  const o = profile.options;
  const gameOpts = { animMul: o.animSpeed, aiMul: o.aiSpeed, initialReveal: o.revealAiHand };

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
    content = <Home profile={profile} go={t => setScreen(t === 'tutorial' ? { kind: 'tutorial', key: Date.now() } : t === 'local' ? { kind: 'local' } : t === 'online' ? { kind: 'online' } : t === 'campaign' ? { kind: 'campaignMenu' } : t === 'collection' ? { kind: 'collection', tab: 'decks' } : t === 'options' ? { kind: 'options' } : { kind: 'home' })} />;
  } else if (screen.kind === 'local') {
    content = <LocalPlay profile={profile} onBack={home} goDecks={() => setScreen({ kind: 'collection', tab: 'decks' })} onStart={setup => setScreen({ kind: 'localGame', setup, key: Date.now() })} />;
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
        setup={{ seed: screen.key, A: { faction: A.faction, deck: A.cards }, B: { faction: B.faction, deck: B.cards } }}
        names={names}
        human={{ A: setup.mode !== 'watch', B: setup.mode === 'hotseat' }}
        flip={setup.mode === 'hotseat'}
        fast={setup.mode === 'watch'}
        onQuit={() => setScreen({ kind: 'local' })}
        onOver={g => { if (paid && g.over!.winner === 'A') update(p => { p.coins += COINS_PER_WIN; }); }}
        renderEnd={(g, close) => (
          <EndBox
            title={`Victoire : ${names[g.over!.winner]}`}
            text={`${formatEvent({ type: 'gameOver', winner: g.over!.winner, reason: g.over!.reason }, names)} (tour ${g.turn})`}
            extra={paid && g.over!.winner === 'A' ? <CoinGain /> : null}
          >
            <button type="button" onClick={close}>Voir le plateau</button>
            <button type="button" onClick={() => setScreen({ kind: 'localGame', setup, key: Date.now() })}>Rejouer</button>
            <button type="button" className="primary" onClick={home}>Accueil</button>
          </EndBox>
        )}
      />
    );
  } else if (screen.kind === 'tutorial') {
    content = <Tutorial key={screen.key} gameOpts={{ animMul: o.animSpeed, aiMul: o.aiSpeed }} onExit={home} onCampaign={() => setScreen({ kind: 'campaignMenu' })} />;
  } else if (screen.kind === 'online') {
    content = <OnlineLobby profile={profile} onBack={home} goDecks={() => setScreen({ kind: 'collection', tab: 'decks' })} onStart={start => setScreen({ kind: 'onlineGame', start, key: Date.now() })} />;
  } else if (screen.kind === 'onlineGame') {
    content = <OnlineGame key={screen.key} start={screen.start} gameOpts={gameOpts} onExit={() => setScreen({ kind: 'online' })}
      onWin={() => update(p => { p.coins += COINS_PER_WIN; })} />;
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
    content = <OptionsScreen profile={profile} update={update} onBack={() => setScreen({ kind: 'campHub', campaign: c })} />;
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
        onQuit={() => setScreen({ kind: 'campHub', campaign: c })}
        onOver={g => {
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
    content = <div className="camp-bg"><Rewards campaign={c} hero={campaignDef(c).hero} reward={currentScenario(c).reward!} onDone={updated => setScreen(advance(updated))} /></div>;
  } else if (screen.kind === 'campEnd') {
    const gained = Object.entries(screen.gained);
    const total = gained.reduce((n, [, k]) => n + k, 0);
    content = (
      <div className="camp">
        <TopBar title={campaignDef(screen.campaign).endTitle} onBack={home} />
        <p>{campaignDef(screen.campaign).endText}</p>
        <h2 className="sub">{total ? `${total} carte(s) rejoignent ta collection` : 'Aucune nouvelle carte pour ta collection'}</h2>
        <p className="muted small">Pour chaque carte, ta collection monte au nombre d’exemplaires de ton pool de campagne (3 maximum). Une campagne n’est comptée qu’une fois.</p>
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
    content = <OptionsScreen profile={profile} update={update} onBack={home} />;
  }

  return <div className="app-zoom" style={{ zoom: o.scale }}>{content}</div>;
}

/** Partie en ligne : notre camp est en bas, le camp adverse est joué à distance. */
function OnlineGame({ start, gameOpts, onExit, onWin }: {
  start: OnlineStart; gameOpts: { animMul: number; aiMul: number; initialReveal: boolean }; onExit: () => void; onWin: () => void;
}) {
  const { inbox, gone, send } = useRemoteInbox(start.link);
  const [ended, setEnded] = useState(false);
  const other = start.side === 'A' ? 'B' : 'A';
  const quit = () => { try { start.link.send({ t: 'bye' }); } catch { /* déjà fermée */ } start.link.close(); onExit(); };
  return (
    <>
      <GameScreen
        animMul={gameOpts.animMul}
        aiMul={gameOpts.aiMul}
        setup={start.setup}
        names={start.names}
        human={{ A: start.side === 'A', B: start.side === 'B' }}
        bottomSide={start.side}
        remote={{ side: other, send, inbox }}
        title="Partie en ligne"
        onQuit={quit}
        onOver={g => { setEnded(true); if (g.over!.winner === start.side) onWin(); }}
        renderEnd={(g, close) => (
          <EndBox
            title={g.over!.winner === start.side ? 'Victoire !' : 'Défaite'}
            text={`${formatEvent({ type: 'gameOver', winner: g.over!.winner, reason: g.over!.reason }, start.names)} (tour ${g.turn})`}
            extra={g.over!.winner === start.side ? <CoinGain /> : null}
          >
            <button type="button" onClick={close}>Voir le plateau</button>
            <button type="button" className="primary" onClick={quit}>Quitter</button>
          </EndBox>
        )}
      />
      {gone && !ended && (
        <EndBox title="Connexion perdue" text="Ton adversaire a quitté la partie ou la connexion a été coupée.">
          <button type="button" className="primary" onClick={quit}>Retour</button>
        </EndBox>
      )}
    </>
  );
}
