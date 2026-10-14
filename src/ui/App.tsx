// Application : accueil, parties locales, campagne, collection (decks, cartes, paquets), options.
import { useCallback, useRef, useState } from 'react';
import { currentScenario, defaultDeckSelection, saveCampaign, scenarioAiFilter, scenarioGameSetup, selectionToDeck, type CampaignSave } from '../campaign/campaign';
import { CAMPAIGN_ORDER } from '../campaign/scenarios';
import type { GameState } from '../engine/types';
import { formatEvent } from '../i18n/log.fr';
import { COINS_PER_WIN, loadProfile, mergeCampaignPool, saveProfile, type Profile } from '../profile/profile';
import { CampHub } from './Camp';
import { CampaignDeck } from './CampaignDeck';
import { CardTile } from './CardTile';
import { MyCards } from './Collection';
import { DeckList } from './Decks';
import { Dialog, GameScreen } from './GameScreen';
import { Rewards } from './Rewards';
import { CampaignMenu, Home, LocalPlay, OptionsScreen, resolveDeck, TopBar, type LocalSetup } from './Screens';

/** Lien terminé par #autopilot : l'ordinateur joue aussi à ta place en campagne (pratique pour tester les scénarios). */
const AUTOPILOT = typeof location !== 'undefined' && location.hash === '#autopilot';

type Screen =
  | { kind: 'home' }
  | { kind: 'local' }
  | { kind: 'localGame'; setup: LocalSetup; key: number }
  | { kind: 'campaignMenu' }
  | { kind: 'campHub'; campaign: CampaignSave }
  | { kind: 'campDeck'; campaign: CampaignSave }
  | { kind: 'campOptions'; campaign: CampaignSave }
  | { kind: 'campGame'; campaign: CampaignSave; deck: string[]; key: number }
  | { kind: 'campVictory'; campaign: CampaignSave }
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
    if (c.idx >= CAMPAIGN_ORDER.length - 1) {
      const done = { ...c, finished: true };
      saveCampaign(done);
      let gained: Record<string, number> = {};
      update(p => { gained = mergeCampaignPool(p, done.pool, done.id); });
      return { kind: 'campEnd', campaign: done, gained };
    }
    const next = { ...c, idx: c.idx + 1 };
    saveCampaign(next);
    return { kind: 'campHub', campaign: next };
  };

  let content: React.ReactNode;

  if (screen.kind === 'home') {
    content = <Home profile={profile} go={t => setScreen(t === 'local' ? { kind: 'local' } : t === 'campaign' ? { kind: 'campaignMenu' } : t === 'collection' ? { kind: 'collection', tab: 'decks' } : t === 'options' ? { kind: 'options' } : { kind: 'home' })} />;
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
        setup={scenarioGameSetup(sc, screen.deck, screen.key)}
        names={names}
        human={{ A: !AUTOPILOT, B: false }}
        fast={AUTOPILOT}
        aiFilter={scenarioAiFilter(sc)}
        title={sc.title}
        intro={sc.intro}
        onQuit={() => setScreen({ kind: 'campHub', campaign: c })}
        onOver={g => { if (g.over!.winner === 'A') update(p => { p.coins += COINS_PER_WIN; }); }}
        renderEnd={(g: GameState, close) => g.over!.winner === 'A' ? (
          <EndBox title="Scénario réussi !" text={formatEvent({ type: 'gameOver', winner: 'A', reason: g.over!.reason }, names) ?? ''} extra={<CoinGain />}>
            <button type="button" onClick={close}>Voir le plateau</button>
            <button type="button" className="primary" onClick={() => setScreen({ kind: 'campVictory', campaign: c })}>Continuer la campagne</button>
          </EndBox>
        ) : (
          <EndBox title="Scénario échoué" text={formatEvent({ type: 'gameOver', winner: g.over!.winner, reason: g.over!.reason }, names) ?? ''}>
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
    content = <div className="camp-bg">{sc.victoryDialog?.length ? <Dialog title={sc.title} lines={sc.victoryDialog} onClose={after} /> : <Dialog lines={[{ who: '', text: 'Victoire !' }]} onClose={after} />}</div>;
  } else if (screen.kind === 'campReward') {
    const c = screen.campaign;
    content = <div className="camp-bg"><Rewards campaign={c} reward={currentScenario(c).reward!} onDone={updated => setScreen(advance(updated))} /></div>;
  } else if (screen.kind === 'campEnd') {
    const gained = Object.entries(screen.gained);
    const total = gained.reduce((n, [, k]) => n + k, 0);
    content = (
      <div className="camp">
        <TopBar title="Fin de la campagne" onBack={home} />
        <p>Sylvain est vaincu et la frontière est sauve. Les prochains scénarios arrivent bientôt.</p>
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
