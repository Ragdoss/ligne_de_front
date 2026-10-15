// Le camp, entre deux combats de campagne : le décor, et la barre d'actions en bas.
import { useState } from 'react';
import { campaignDef, defaultDeckSelection, type CampaignSave } from '../campaign/campaign';
import type { CampaignScenario } from '../campaign/types';
import campImg from './assets/camp.png';
import { Dialog } from './VnDialog';

export function CampHub({ campaign, scenario, onDeck, onFight, onOptions, onMenu }: {
  campaign: CampaignSave;
  scenario: CampaignScenario;
  onDeck: () => void;
  onFight: () => void;
  onOptions: () => void;
  onMenu: () => void;
}) {
  const [talk, setTalk] = useState(false);
  const deckSize = Object.values(defaultDeckSelection(campaign)).reduce((a, b) => a + b, 0);
  const def = campaignDef(campaign);
  const lines = def.talks[campaign.finished ? 'fin' : scenario.id] ?? [];
  return (
    <div className="camp-hub">
      <header className="hub-head">
        <span className="hub-step">{campaign.finished ? 'Campagne terminée' : `${def.title} — combat ${campaign.idx + 1} sur ${def.order.length}`}</span>
        <h1>{scenario.title}</h1>
        <span className="hub-deck">Deck : {deckSize} cartes (minimum {scenario.deckRules.min}) · Pool : {campaign.pool.length} cartes</span>
      </header>
      <div className="hub-scene">
        <div className="hub-frame">
          <img src={campImg} alt="Le camp de l’armée impériale, au pied des montagnes" />
          {lines.length > 0 && (
            <button type="button" className="hub-troops" onClick={() => setTalk(true)} aria-label="Discuter avec les troupes">
              <span>Discuter</span>
            </button>
          )}
        </div>
      </div>
      <nav className="hub-bar" aria-label="Actions du camp">
        <button type="button" onClick={onDeck}>Votre deck</button>
        <button type="button" disabled={!lines.length} onClick={() => setTalk(true)}>Discuter avec les troupes</button>
        <button type="button" className="go" onClick={onFight}>{campaign.finished ? 'Rejouer le dernier combat' : 'Continuer au prochain combat'}</button>
        <button type="button" onClick={onOptions}>Options</button>
        <button type="button" onClick={onMenu}>Retour au menu principal</button>
      </nav>
      {talk && <Dialog title="Au camp" lines={lines} onClose={() => setTalk(false)} button="Retour au camp" />}
    </div>
  );
}
