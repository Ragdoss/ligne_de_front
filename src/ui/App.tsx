// Application : menu, partie libre, campagne (deck → scénario → récompenses → scénario suivant).
import { useState } from 'react';
import { currentScenario, saveCampaign, scenarioAiFilter, scenarioGameSetup, selectionToDeck, type CampaignSave } from '../campaign/campaign';
import { CAMPAIGN_ORDER } from '../campaign/scenarios';
import type { GameState } from '../engine/types';
import { formatEvent } from '../i18n/log.fr';
import { CampaignDeck } from './CampaignDeck';
import { Dialog, GameScreen } from './GameScreen';
import { deckOf, factionOf, labelOf, Menu, type FreeSetup } from './Menu';
import { Rewards } from './Rewards';

/** Lien terminé par #autopilot : l'ordinateur joue aussi à ta place en campagne (pratique pour tester les scénarios). */
const AUTOPILOT = typeof location !== 'undefined' && location.hash === '#autopilot';

type Screen =
  | { kind: 'menu' }
  | { kind: 'free'; setup: FreeSetup; key: number }
  | { kind: 'campDeck'; campaign: CampaignSave }
  | { kind: 'campGame'; campaign: CampaignSave; deck: string[]; key: number }
  | { kind: 'campVictory'; campaign: CampaignSave }
  | { kind: 'campReward'; campaign: CampaignSave }
  | { kind: 'campEnd'; campaign: CampaignSave };

function EndBox({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="box">
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="choices row">{children}</div>
      </div>
    </div>
  );
}

export function App() {
  const [screen, setScreen] = useState<Screen>({ kind: 'menu' });
  const menu = () => setScreen({ kind: 'menu' });

  if (screen.kind === 'menu') {
    return <Menu onFree={setup => setScreen({ kind: 'free', setup, key: Date.now() })} onCampaign={c => { saveCampaign(c); setScreen({ kind: 'campDeck', campaign: c }); }} />;
  }

  if (screen.kind === 'free') {
    const { setup } = screen;
    const names = { A: labelOf(setup.A), B: labelOf(setup.B) };
    if (names.A === names.B) { names.A += ' (A)'; names.B += ' (B)'; }
    return (
      <GameScreen
        key={screen.key}
        setup={{ seed: screen.key, A: { faction: factionOf(setup.A), deck: deckOf(setup.A) }, B: { faction: factionOf(setup.B), deck: deckOf(setup.B) } }}
        names={names}
        human={{ A: setup.mode !== 'watch', B: setup.mode === 'hotseat' }}
        flip={setup.mode === 'hotseat'}
        fast={setup.mode === 'watch'}
        onQuit={menu}
        renderEnd={(g, close) => (
          <EndBox title={`Victoire : ${names[g.over!.winner]}`} text={`${formatEvent({ type: 'gameOver', winner: g.over!.winner, reason: g.over!.reason }, names)} (tour ${g.turn})`}>
            <button type="button" onClick={close}>Voir le plateau</button>
            <button type="button" onClick={() => setScreen({ kind: 'free', setup, key: Date.now() })}>Rejouer</button>
            <button type="button" className="primary" onClick={menu}>Menu</button>
          </EndBox>
        )}
      />
    );
  }

  if (screen.kind === 'campDeck') {
    const c = screen.campaign;
    return (
      <CampaignDeck
        key={c.idx}
        campaign={c}
        scenario={currentScenario(c)}
        onMenu={menu}
        onLaunch={sel => {
          const next = { ...c, deck: sel };
          saveCampaign(next);
          setScreen({ kind: 'campGame', campaign: next, deck: selectionToDeck(sel), key: Date.now() });
        }}
      />
    );
  }

  if (screen.kind === 'campGame') {
    const c = screen.campaign;
    const sc = currentScenario(c);
    const names = { A: sc.A.label, B: sc.B.label };
    return (
      <GameScreen
        key={screen.key}
        setup={scenarioGameSetup(sc, screen.deck, screen.key)}
        names={names}
        human={{ A: !AUTOPILOT, B: false }}
        fast={AUTOPILOT}
        aiFilter={scenarioAiFilter(sc)}
        title={sc.title}
        intro={sc.intro}
        onQuit={() => setScreen({ kind: 'campDeck', campaign: c })}
        renderEnd={(g: GameState, close) => g.over!.winner === 'A' ? (
          <EndBox title="Scénario réussi !" text={formatEvent({ type: 'gameOver', winner: 'A', reason: g.over!.reason }, names) ?? ''}>
            <button type="button" onClick={close}>Voir le plateau</button>
            <button type="button" className="primary" onClick={() => setScreen({ kind: 'campVictory', campaign: c })}>Continuer la campagne</button>
          </EndBox>
        ) : (
          <EndBox title="Scénario échoué" text={formatEvent({ type: 'gameOver', winner: g.over!.winner, reason: g.over!.reason }, names) ?? ''}>
            <button type="button" onClick={close}>Voir le plateau</button>
            <button type="button" onClick={menu}>Menu</button>
            <button type="button" className="primary" onClick={() => setScreen({ kind: 'campDeck', campaign: c })}>Réessayer le scénario</button>
          </EndBox>
        )}
      />
    );
  }

  if (screen.kind === 'campVictory') {
    const c = screen.campaign;
    const sc = currentScenario(c);
    const after = () => setScreen(sc.reward ? { kind: 'campReward', campaign: c } : advance(c));
    return <div className="camp-bg">{sc.victoryDialog?.length ? <Dialog title={sc.title} lines={sc.victoryDialog} onClose={after} /> : <Dialog lines={[{ who: '', text: 'Victoire !' }]} onClose={after} />}</div>;
  }

  if (screen.kind === 'campReward') {
    const c = screen.campaign;
    return <div className="camp-bg"><Rewards campaign={c} reward={currentScenario(c).reward!} onDone={updated => setScreen(advance(updated))} /></div>;
  }

  // Fin de campagne
  return (
    <div className="camp-bg">
      <EndBox title="Fin de la campagne (pour l’instant)" text="Sylvain est vaincu et la frontière est sauve. Les prochains scénarios arrivent bientôt.">
        <button type="button" onClick={() => setScreen({ kind: 'campDeck', campaign: screen.campaign })}>Rejouer le dernier scénario</button>
        <button type="button" className="primary" onClick={menu}>Menu</button>
      </EndBox>
    </div>
  );
}

/** Passe au scénario suivant (ou à la fin de campagne) et sauvegarde. */
function advance(c: CampaignSave): Screen {
  if (c.idx >= CAMPAIGN_ORDER.length - 1) {
    const done = { ...c, finished: true };
    saveCampaign(done);
    return { kind: 'campEnd', campaign: done };
  }
  const next = { ...c, idx: c.idx + 1 };
  saveCampaign(next);
  return { kind: 'campDeck', campaign: next };
}
