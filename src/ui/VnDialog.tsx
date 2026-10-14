// Dialogues façon « roman visuel » : les personnages face à face, celui qui parle en pleine encre,
// l'autre estompé ; une réplique à la fois dans le bandeau du bas (la précédente reste visible, estompée).
import { useEffect, useState } from 'react';
import type { DialogLine } from '../engine/types';
import soldat from './assets/soldat.png';

/** Portrait de chaque personnage (le soldat sert de portrait provisoire à tout le monde). */
const PORTRAITS: Record<string, string> = {};
const portraitOf = (who: string) => PORTRAITS[who] ?? soldat;

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

  // Côté de chaque personnage : dans l'ordre d'apparition, gauche, droite, gauche…
  const speakers = [...new Set(lines.map(l => l.who).filter(Boolean))];
  const side = (who: string) => (speakers.indexOf(who) % 2 === 0 ? 'left' : 'right');
  const shownOn = (s: 'left' | 'right') => {
    const said = lines.slice(0, i + 1).map(l => l.who).filter(w => w && side(w) === s);
    return said.length ? said[said.length - 1]! : speakers.find(w => side(w) === s);
  };
  const cur = lines[i]!;
  const prev = i > 0 ? lines[i - 1] : undefined;
  const line = (l: DialogLine, cls: string) => (
    <p className={`vn-line ${cls} ${l.who ? side(l.who) : 'narr'}`}>{l.who && <b>{l.who} : </b>}{l.text}</p>
  );
  return (
    <div className="vn" role="dialog" aria-modal="true" aria-label={title ?? 'Dialogue'} onClick={next}>
      <div className="vn-top">
        {title && <h2>{title}</h2>}
        <button type="button" className="vn-skip" onClick={e => { e.stopPropagation(); onClose(); }}>Passer »</button>
      </div>
      <div className="vn-stage">
        {(['left', 'right'] as const).map(s => {
          const who = shownOn(s);
          return who ? <img key={s} className={`vn-fig ${s}${cur.who === who ? ' speaking' : ''}`} src={portraitOf(who)} alt={who} /> : <span key={s} />;
        })}
      </div>
      <div className="vn-band">
        {prev && line(prev, 'past')}
        {line(cur, 'now')}
        <button type="button" className="vn-next" autoFocus onClick={e => { e.stopPropagation(); next(); }}>
          {last ? button : 'Suivant ▸'}
        </button>
        <span className="vn-count">{i + 1} / {lines.length}</span>
      </div>
    </div>
  );
}
