// Le camp, entre deux combats de campagne : le décor, et la barre d'actions en bas.
import { useState, type CSSProperties } from 'react';
import { bonusFor, bonusUnlocked, campaignDef, defaultDeckSelection, defeatsOn, FAILS_PER_BONUS, MAX_BONUS, type CampaignSave } from '../campaign/campaign';
import type { CampaignScenario } from '../campaign/types';
import campImg from './assets/camp.png';
import campEmpireImg from './assets/camp_empire.webp';
import campElfesImg from './assets/camp_elfes.webp';
import campNomadesImg from './assets/camp_nomades.webp';
import campDemonsImg from './assets/camp_demons.webp';
import { Dialog } from './VnDialog';

/** Décor du camp par campagne (les autres campagnes gardent le décor par défaut). `troops` : zone cliquable « Discuter », en % de l'image. */
interface CampArt { src: string; ratio: number; alt: string; troops: { left: number; top: number; width: number; height: number } }
const DEFAULT_ART: CampArt = {
  src: campImg, ratio: 1400 / 815, alt: 'Le camp de l’armée impériale, au pied des montagnes',
  troops: { left: 33, top: 32, width: 24, height: 40 },
};
const CAMP_ART: Record<string, CampArt> = {
  empire: {
    src: campEmpireImg, ratio: 1400 / 933, alt: 'Le camp de l’armée impériale autour du feu, au pied des montagnes et du château',
    troops: { left: 21, top: 58, width: 48, height: 30 },
  },
  elfes: {
    src: campElfesImg, ratio: 1400 / 933, alt: 'Le camp des Royaumes elfiques : tentes, bannières et archers autour du feu',
    troops: { left: 6, top: 36, width: 68, height: 50 },
  },
  nomades: {
    src: campNomadesImg, ratio: 1400 / 933, alt: 'Le camp des Nomades du désert : tente, feu et chameaux à l’oasis',
    troops: { left: 9, top: 42, width: 40, height: 38 },
  },
  demons: {
    src: campDemonsImg, ratio: 1400 / 933, alt: 'Le camp des Invocateurs de Démons : autel, braseros et statue cornue au milieu des ruines',
    troops: { left: 6, top: 44, width: 40, height: 46 },
  },
};

/** En bas à droite du camp : nombre d'essais et aide au départ (+1, +2… ressources) après plusieurs défaites. */
function AttemptsPanel({ campaign, scenario, onBonus }: { campaign: CampaignSave; scenario: CampaignScenario; onBonus: (b: number) => void }) {
  const defeats = defeatsOn(campaign, scenario.id);
  const unlocked = bonusUnlocked(campaign, scenario.id);
  const chosen = bonusFor(campaign, scenario.id);
  const nextAt = (unlocked + 1) * FAILS_PER_BONUS - defeats;
  return (
    <aside className="hub-help" aria-label="Essais et aide">
      <b>Essai n° {defeats + 1}</b>
      {defeats > 0 && <span>{defeats} défaite{defeats > 1 ? 's' : ''} sur ce combat</span>}
      {unlocked > 0 && (
        <div className="help-choice" role="radiogroup" aria-label="Ressources supplémentaires au départ">
          <span>Ressources en plus au départ :</span>
          {Array.from({ length: unlocked + 1 }, (_, b) => (
            <button key={b} type="button" role="radio" aria-checked={chosen === b} className={chosen === b ? 'on' : ''} onClick={() => onBonus(b)}>
              {b === 0 ? 'Aucune' : `+${b}`}
            </button>
          ))}
        </div>
      )}
      {unlocked < MAX_BONUS && defeats > 0 && <span className="muted">Aide {unlocked ? 'suivante' : 'au départ'} dans {nextAt} défaite{nextAt > 1 ? 's' : ''}</span>}
    </aside>
  );
}

export function CampHub({ campaign, scenario, onDeck, onFight, onOptions, onMenu, onBonus }: {
  campaign: CampaignSave;
  scenario: CampaignScenario;
  onBonus: (b: number) => void;
  onDeck: () => void;
  onFight: () => void;
  onOptions: () => void;
  onMenu: () => void;
}) {
  const [talk, setTalk] = useState(false);
  const deckSize = Object.values(defaultDeckSelection(campaign)).reduce((a, b) => a + b, 0);
  const def = campaignDef(campaign);
  const lines = def.talks[campaign.finished ? 'fin' : scenario.id] ?? [];
  const art = CAMP_ART[campaign.campaign] ?? DEFAULT_ART;
  return (
    <div className="camp-hub">
      <header className="hub-head">
        <span className="hub-step">{campaign.finished ? 'Campagne terminée' : `${def.title} — combat ${campaign.idx + 1} sur ${def.order.length}`}</span>
        <h1>{scenario.title}</h1>
        <span className="hub-deck">Deck : {deckSize} cartes (minimum {scenario.deckRules.min}) · Pool : {campaign.pool.length} cartes</span>
      </header>
      <div className="hub-scene">
        <div className="hub-frame" style={{ '--hub-ratio': art.ratio } as CSSProperties}>
          <img src={art.src} alt={art.alt} />
          {lines.length > 0 && (
            <button
              type="button" className="hub-troops" onClick={() => setTalk(true)} aria-label="Discuter avec les troupes"
              style={{ left: `${art.troops.left}%`, top: `${art.troops.top}%`, width: `${art.troops.width}%`, height: `${art.troops.height}%` }}
            >
              <span>Discuter</span>
            </button>
          )}
        </div>
        {!campaign.finished && <AttemptsPanel campaign={campaign} scenario={scenario} onBonus={onBonus} />}
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
