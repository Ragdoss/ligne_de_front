// Dialogues façon « roman visuel » : les personnages face à face, celui qui parle en pleine encre,
// les autres estompés ; une réplique à la fois dans le bandeau du bas (la précédente reste visible, estompée).
// VnScene sert aussi aux récompenses de campagne (cartes au centre, choix dans le bandeau).
import { useEffect, useState } from 'react';
import type { DialogLine } from '../engine/types';
import soldat from './assets/soldat.png';
import empireChevalier from './assets/portraits/empire/1.webp';
import empireEpeiste from './assets/portraits/empire/2.webp';
import empireArbaletrier from './assets/portraits/empire/4.webp';
import empireCapitaine from './assets/portraits/empire/capitaine.webp';
import empireSergent from './assets/portraits/empire/sergent.webp';
import empireGeneral from './assets/portraits/empire/general.webp';
import empireLegat from './assets/portraits/empire/legat.webp';
import elfeArchere from './assets/portraits/elfe/1.webp';
import elfeGardien from './assets/portraits/elfe/2.webp';
import demonsAcolyte from './assets/portraits/demons/2.webp';
import demonsHierophante from './assets/portraits/demons/3.webp';
import nomadesGuide from './assets/portraits/nomades/1.webp';
import nomadesCheikha from './assets/portraits/nomades/2.webp';
import nomadesPillard from './assets/portraits/nomades/3.webp';
import nomadesEclaireur from './assets/portraits/nomades/4.webp';

/**
 * Portrait de chaque personnage, en buste ; le soldat sert de portrait provisoire aux autres.
 * Les planches complètes sont dans assets/portraits/<faction>/ (1 à 4, de gauche à droite sur la planche) :
 * non utilisés pour l'instant : empire/3 (lancier), elfe/3, elfe/4, demons/1 (bâton à l'œil), demons/4, empire/impératrice et empire/chancelier
 * (série en couleurs de l'Empire, nommée au lieu d'être numérotée : capitaine, sergent, general, legat, imperatrice, chancelier).
 */
const PORTRAITS: Record<string, string> = {
  // Empire
  'Commandant': empireChevalier,
  'Soldat': empireEpeiste,
  'Légat Varro': empireLegat,
  'Sergent du convoi': empireArbaletrier,
  'Sergent impérial': empireSergent,
  'Capitaine de la garde': empireCapitaine,
  'Général impérial': empireGeneral,
  // Royaumes elfiques
  'Sylvain': elfeGardien,
  'Éclaireuse Lyra': elfeArchere,
  // Invocateurs de démons
  'Hiérophante Morvak': demonsHierophante,
  'Acolyte': demonsAcolyte,
  // Nomades
  'Cheikha Zahra': nomadesCheikha,
  'Éclaireur Idris': nomadesEclaireur,
  'Nomade': nomadesGuide,
  'Cavalier des dunes': nomadesPillard,
};
const portraitOf = (who: string) => PORTRAITS[who] ?? soldat;

/** Placement : 1er à gauche, 2e à droite, 3e à droite (en retrait), 4e à gauche (en retrait)… */
function sideOf(cast: string[], who: string): 'left' | 'right' {
  const i = cast.indexOf(who);
  return i === 0 || i === 3 || i === 4 ? 'left' : 'right';
}

export function VnScene({ title, cast, speaking, past, now, center, actions, onAdvance, onSkip, count }: {
  title?: string;
  /** Personnages présents, dans l'ordre d'apparition (4 au plus sont affichés). */
  cast: string[];
  speaking?: string;
  past?: DialogLine;
  now: DialogLine;
  /** Contenu au centre de la scène (cartes d'une récompense…). */
  center?: React.ReactNode;
  /** Boutons du bandeau ; sans eux, un clic n'importe où fait avancer. */
  actions?: React.ReactNode;
  onAdvance?: () => void;
  onSkip?: () => void;
  count?: string;
}) {
  const shown = cast.slice(0, 5);
  const left = shown.filter(w => sideOf(shown, w) === 'left');
  const right = shown.filter(w => sideOf(shown, w) === 'right').reverse(); // le premier à droite reste au bord
  const fig = (w: string, s: 'left' | 'right', inner: boolean) => (
    <img key={w} className={`vn-fig ${s}${inner ? ' inner' : ''}${speaking === w ? ' speaking' : ''}`} src={portraitOf(w)} alt={w} />
  );
  const line = (l: DialogLine, cls: string) => (
    <p className={`vn-line ${cls} ${l.who ? sideOf(shown, l.who) : 'narr'}`}>{l.who && <b>{l.who} : </b>}{l.text}</p>
  );
  return (
    <div className={`vn${onAdvance ? ' advance' : ''}`} role="dialog" aria-modal="true" aria-label={title ?? 'Dialogue'} onClick={onAdvance}>
      <div className="vn-top">
        {title && <h2>{title}</h2>}
        {onSkip && <button type="button" className="vn-skip" onClick={e => { e.stopPropagation(); onSkip(); }}>Passer »</button>}
      </div>
      <div className="vn-stage">
        <div className="vn-group left">{left.map((w, i) => fig(w, 'left', i > 0))}</div>
        <div className="vn-center" onClick={e => center && e.stopPropagation()}>{center}</div>
        <div className="vn-group right">{right.map((w, i) => fig(w, 'right', i < right.length - 1))}</div>
      </div>
      <div className="vn-band" onClick={e => actions && e.stopPropagation()}>
        {past && line(past, 'past')}
        {line(now, 'now')}
        <div className="vn-actions">{actions}</div>
        {count && <span className="vn-count">{count}</span>}
      </div>
    </div>
  );
}

export function Dialog({ title, lines, onClose, button = 'Continuer' }: { title?: string; lines: DialogLine[]; onClose: () => void; button?: string }) {
  const [i, setI] = useState(0);
  const last = i >= lines.length - 1;
  const next = () => (last ? onClose() : setI(i + 1));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const cast = [...new Set(lines.map(l => l.who).filter(Boolean))];
  const cur = lines[i]!;
  return (
    <VnScene
      title={title}
      cast={cast}
      speaking={cur.who}
      past={i > 0 ? lines[i - 1] : undefined}
      now={cur}
      onAdvance={next}
      onSkip={onClose}
      count={`${i + 1} / ${lines.length}`}
      actions={<button type="button" className="vn-next" autoFocus onClick={e => { e.stopPropagation(); next(); }}>{last ? button : 'Suivant ▸'}</button>}
    />
  );
}
