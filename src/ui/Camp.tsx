// Le camp, entre deux combats de campagne : le décor, et la barre d'actions en bas.
import { useState, type CSSProperties } from 'react';
import { availableSides, bonusFor, bonusUnlocked, campaignDef, defaultDeckSelection, defeatsOn, difficultyOf, FAILS_PER_BONUS, linesFor, MAX_BONUS, type CampaignSave } from '../campaign/campaign';
import type { DialogChoice } from '../engine/types';
import { DIFFICULTIES, DIFFICULTY_HINT, DIFFICULTY_LABEL, type Difficulty } from '../campaign/ease';
import type { CampaignScenario } from '../campaign/types';
import campImg from './assets/camp.png';
import campEmpireImg from './assets/camp_empire.webp';
import campElfesImg from './assets/camp_elfes.webp';
import campNomadesImg from './assets/camp_nomades.webp';
import campDemonsImg from './assets/camp_demons.webp';
import { Dialog } from './VnDialog';
import camp_cc1 from './assets/camps/cc1.webp';
import camp_cc2 from './assets/camps/cc2.webp';
import camp_cc3 from './assets/camps/cc3.webp';
import camp_ce4 from './assets/camps/ce4.webp';
import camp_ce5 from './assets/camps/ce5.webp';
import camp_ce6 from './assets/camps/ce6.webp';
import camp_cn4 from './assets/camps/cn4.webp';
import camp_cn5 from './assets/camps/cn5.webp';
import camp_cn6 from './assets/camps/cn6.webp';
import camp_cd4 from './assets/camps/cd4.webp';
import camp_cd5 from './assets/camps/cd5.webp';
import camp_cd6 from './assets/camps/cd6.webp';
import camp_cc7 from './assets/camps/cc7.webp';
import camp_cc8 from './assets/camps/cc8.webp';

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
  couronne: {
    src: campEmpireImg, ratio: 1400 / 933, alt: 'Le camp du prince en exil autour du feu, au pied des montagnes',
    troops: { left: 21, top: 58, width: 48, height: 30 },
  },
  demons: {
    src: campDemonsImg, ratio: 1400 / 933, alt: 'Le camp des Invocateurs de Démons : autel, braseros et statue cornue au milieu des ruines',
    troops: { left: 6, top: 44, width: 40, height: 46 },
  },
};

/** Décor propre à chaque combat de La Couronne de cendres (prioritaire sur celui de la campagne). */
const CAMP_ART_BY_SCENARIO: Record<string, CampArt> = {
  cc1: { src: camp_cc1, ratio: 1400 / 788, alt: 'Le camp impérial au palais, à la tombée de la nuit', troops: { left: 22, top: 40, width: 56, height: 46 } },
  cc2: { src: camp_cc2, ratio: 1400 / 788, alt: 'Le camp de fortune des exilés sur la route, la capitale fumant au loin', troops: { left: 10, top: 48, width: 60, height: 42 } },
  cc3: { src: camp_cc3, ratio: 1400 / 788, alt: 'La tente de conseil aux frontières : elfes, nomades et démons autour de la table', troops: { left: 22, top: 40, width: 56, height: 46 } },
  ce4: { src: camp_ce4, ratio: 1400 / 788, alt: 'Le camp à la lisière de la forêt, face aux sources noires', troops: { left: 10, top: 45, width: 58, height: 42 } },
  ce5: { src: camp_ce5, ratio: 1400 / 788, alt: 'Le campement elfe dans les arbres de la forêt captive', troops: { left: 3, top: 30, width: 60, height: 55 } },
  ce6: { src: camp_ce6, ratio: 1400 / 788, alt: 'Le camp elfe et impérial sur le col des brumes', troops: { left: 5, top: 35, width: 60, height: 50 } },
  cn4: { src: camp_cn4, ratio: 1400 / 788, alt: 'Le camp nomade à l’oasis, au crépuscule', troops: { left: 3, top: 35, width: 55, height: 50 } },
  cn5: { src: camp_cn5, ratio: 1400 / 788, alt: 'Le camp nomade autour du puits empoisonné', troops: { left: 15, top: 40, width: 65, height: 45 } },
  cn6: { src: camp_cn6, ratio: 1400 / 788, alt: 'Le camp nomade avant la tempête de sable', troops: { left: 5, top: 40, width: 45, height: 45 } },
  cd4: { src: camp_cd4, ratio: 1400 / 788, alt: 'Le camp démoniaque dans les ruines volcaniques, devant le brasero', troops: { left: 15, top: 35, width: 55, height: 50 } },
  cd5: { src: camp_cd5, ratio: 1400 / 788, alt: 'Le camp devant l’entrée des catacombes, sous les torches rouges', troops: { left: 3, top: 40, width: 80, height: 50 } },
  cd6: { src: camp_cd6, ratio: 1400 / 788, alt: 'Le camp au pied du volcan, face au dragon noir enchaîné', troops: { left: 10, top: 40, width: 70, height: 50 } },
  cc7: { src: camp_cc7, ratio: 1400 / 788, alt: 'L’armée alliée campe devant les portes de la capitale', troops: { left: 3, top: 55, width: 80, height: 40 } },
  cc8: { src: camp_cc8, ratio: 1400 / 788, alt: 'La cour du palais, devant les portes de la salle du trône', troops: { left: 8, top: 50, width: 70, height: 40 } },
};

/** En bas à droite du camp : nombre d'essais et aide au départ (+1, +2… ressources) après plusieurs défaites. */
function AttemptsPanel({ campaign, scenario, onBonus, onDifficulty }: { campaign: CampaignSave; scenario: CampaignScenario; onBonus: (b: number) => void; onDifficulty: (d: Difficulty) => void }) {
  const mode = difficultyOf(campaign);
  const defeats = defeatsOn(campaign, scenario.id);
  const unlocked = bonusUnlocked(campaign, scenario.id);
  const chosen = bonusFor(campaign, scenario.id);
  const nextAt = (unlocked + 1) * FAILS_PER_BONUS - defeats;
  return (
    <aside className="hub-help" aria-label="Difficulté, essais et aide">
      <div className="help-choice" role="radiogroup" aria-label="Difficulté">
        <span>Difficulté :</span>
        {DIFFICULTIES.map(d => (
          <button key={d} type="button" role="radio" aria-checked={mode === d} className={mode === d ? 'on' : ''} title={DIFFICULTY_HINT[d]} onClick={() => onDifficulty(d)}>
            {DIFFICULTY_LABEL[d]}
          </button>
        ))}
      </div>
      <span className="muted">{DIFFICULTY_HINT[mode]}</span>
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

export function CampHub({ campaign, scenario, onDeck, onFight, onOptions, onMenu, onBonus, onDifficulty, onSide, onChoose }: {
  campaign: CampaignSave;
  scenario: CampaignScenario;
  /** Lancer une mission secondaire. */
  onSide?: (id: string) => void;
  /** Choix fait dans une discussion de camp (drapeaux). */
  onChoose?: (c: DialogChoice) => void;
  onBonus: (b: number) => void;
  onDifficulty: (d: Difficulty) => void;
  onDeck: () => void;
  onFight: () => void;
  onOptions: () => void;
  onMenu: () => void;
}) {
  const [talk, setTalk] = useState(false);
  const deckSize = Object.values(defaultDeckSelection(campaign)).reduce((a, b) => a + b, 0);
  const def = campaignDef(campaign);
  const lines = linesFor(campaign, def.talks[campaign.finished ? 'fin' : scenario.id]);
  const sides = availableSides(campaign);
  const art = CAMP_ART_BY_SCENARIO[scenario.id] ?? CAMP_ART[campaign.campaign] ?? DEFAULT_ART;
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
        {/* Panneaux en bas à droite, empilés : missions secondaires au-dessus, réglages de la campagne en dessous. */}
        <div className="hub-panels">
          {sides.length > 0 && onSide && (
            <aside className="hub-help hub-sides" aria-label="Missions secondaires">
              <b>Mission{sides.length > 1 ? 's' : ''} secondaire{sides.length > 1 ? 's' : ''}</b>
              <span className="muted">Facultative, une seule fois : elle ne fait pas avancer la campagne, mais peut changer la suite.</span>
              {sides.map(s => <button key={s.id} type="button" onClick={() => onSide(s.id)}>{s.title}</button>)}
            </aside>
          )}
          {!campaign.finished && <AttemptsPanel campaign={campaign} scenario={scenario} onBonus={onBonus} onDifficulty={onDifficulty} />}
        </div>
      </div>
      <nav className="hub-bar" aria-label="Actions du camp">
        <button type="button" onClick={onDeck}>Votre deck</button>
        <button type="button" disabled={!lines.length} onClick={() => setTalk(true)}>Discuter avec les troupes</button>
        <button type="button" className="go" onClick={onFight}>{campaign.finished ? 'Rejouer le dernier combat' : 'Continuer au prochain combat'}</button>
        <button type="button" onClick={onOptions}>Options</button>
        <button type="button" onClick={onMenu}>Retour au menu principal</button>
      </nav>
      {talk && <Dialog title="Au camp" lines={lines} onClose={() => setTalk(false)} onChoose={onChoose} button="Retour au camp" />}
    </div>
  );
}
