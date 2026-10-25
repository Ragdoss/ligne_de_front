// Piles d'un joueur à côté de son plateau : pioche (dos de carte et nombre), paquet des niveaux 4-5 tant qu'il n'a pas
// rejoint la pioche, défausse (carte du dessus, cliquable pour la parcourir).
import type { PlayerState } from '../engine/types';
import { artKeyFor, CardFace } from './CardFace';
import { cardName } from './labels';
import type { PlayerId } from '../engine/types';

function Back({ n, label, faction, title }: { n: number; label: string; faction: string; title: string }) {
  return (
    <div className={`pile ${faction}${n ? '' : ' empty'}`} title={title}>
      <div className="pile-stack" style={{ ['--depth' as string]: Math.min(6, Math.ceil(n / 6)) }}>
        {n > 0 ? <div className="card-back"><span>{n}</span></div> : <div className="pile-none">0</div>}
      </div>
      <div className="pile-label">{label}</div>
    </div>
  );
}

export function Piles({ pl, p, onOpenDiscard, onHover }: { pl: PlayerState; p: PlayerId; onOpenDiscard: () => void; onHover?: (id: string | null, x?: number, owner?: PlayerId) => void }) {
  const top = pl.discard[pl.discard.length - 1];
  return (
    <div className="piles">
      <Back n={pl.deck.length} label="Pioche" faction={pl.faction} title={`Pioche : ${pl.deck.length} carte(s)`} />
      {pl.reserve.length > 0 && (
        <Back n={pl.reserve.length} label="Niv. 4-5" faction={pl.faction}
          title={`Cartes de niveau 4-5 : ${pl.reserve.length}, mélangées à la pioche au passage au niveau 4`} />
      )}
      <button type="button" className={`pile discard${top ? '' : ' empty'}`} onClick={onOpenDiscard} disabled={!top}
        title={top ? `Défausse : ${pl.discard.length} carte(s) — cliquer pour la parcourir` : 'Défausse vide'}
        onMouseEnter={e => top && onHover?.(top, e.clientX, p)} onMouseLeave={() => onHover?.(null)}>
        <div className="pile-stack" style={{ ['--depth' as string]: Math.min(6, Math.ceil(pl.discard.length / 6)) }}>
          {top ? <div className="discard-top"><CardFace id={top} variant={artKeyFor(top, p)} /><span className="pile-count">{pl.discard.length}</span></div> : <div className="pile-none">0</div>}
        </div>
        <div className="pile-label">Défausse</div>
      </button>
    </div>
  );
}

/** Parcourir une défausse : la carte la plus récente en premier. */
export function DiscardViewer({ pl, p, name, onClose, onHover }: { pl: PlayerState; p: PlayerId; name: string; onClose: () => void; onHover: (id: string | null, x?: number, owner?: PlayerId) => void }) {
  const list = pl.discard.slice().reverse();
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={`Défausse de ${name}`} onClick={onClose}>
      <div className="box wide discard-box" onClick={e => e.stopPropagation()}>
        <h2>Défausse — {name} <span className="muted small">({list.length} carte{list.length > 1 ? 's' : ''}, la plus récente en premier)</span></h2>
        <div className="discard-grid">
          {list.map((id, i) => (
            <div key={i} className="discard-card" title={cardName(id)} onMouseEnter={e => onHover(id, e.clientX, p)} onMouseLeave={() => onHover(null)}>
              <CardFace id={id} variant={artKeyFor(id, p)} />
            </div>
          ))}
        </div>
        <div className="choices"><button type="button" className="primary" onClick={onClose}>Fermer</button></div>
      </div>
    </div>
  );
}
