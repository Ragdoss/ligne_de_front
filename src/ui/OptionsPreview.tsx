// Aperçu dans les Options : une carte en main, un régiment en jeu et la carte agrandie au survol,
// pour régler la taille de l'interface, de la carte agrandie et l'affichage des niveaux en voyant le résultat.
import { useMemo } from 'react';
import { DEMO_DECKS } from '../data/decks';
import { Ctx } from '../engine/ctx';
import { createGame } from '../engine/game';
import { Board } from './Board';
import { Hand } from './Hand';
import { ZoomCard } from './ZoomCard';

const HAND = ['lieutenant', 'chevaliers_ordre', 'charge_decisive'];

export function OptionsPreview() {
  const game = useMemo(() => {
    const s = createGame({ seed: 'apercu-options', A: { faction: 'empire', deck: DEMO_DECKS.empire! }, B: { faction: 'elfe', deck: DEMO_DECKS.elfe! } });
    s.players.A.hand = HAND.map((cardId, i) => ({ uid: 9000 + i, cardId }));
    s.players.A.level = 5; s.players.A.resource = 10; // cartes jouables : affichées normalement
    const ctx = new Ctx(s);
    const u = Object.assign(ctx.makeUnit('cuirassiers_lourds', 'A'), { justDeployed: false, leader: 'connetable', leaderOwner: 'A' as const });
    ctx.setAt({ player: 'A', zone: 'avant', idx: 1 }, u);
    const v = Object.assign(ctx.makeUnit('archer_imp', 'A'), { justDeployed: false });
    ctx.setAt({ player: 'A', zone: 'arriere', idx: 1 }, v);
    return s;
  }, []);
  const none = () => false;
  return (
    <section className="menu-block options-preview" aria-label="Aperçu">
      <h2>Aperçu</h2>
      <div className="op-grid">
        <div className="op-col">
          <h3>En main</h3>
          <Hand game={game} player="A" order={HAND.map((_, i) => 9000 + i)} setOrder={() => {}} canAct hidden={false} selected={null} onSelect={() => {}} />
          <h3>En jeu</h3>
          <div className="op-board">
            <Board game={game} player="A" bottom isTarget={none} isFirstPicked={none} onSlot={() => {}} highlight={null} faded={new Set()} />
          </div>
        </div>
        <div className="op-col op-zoom">
          <h3>Au survol</h3>
          <ZoomCard id="chevaliers_ordre" left={false} still />
        </div>
      </div>
      <p className="muted small">Au survol, la carte s’affiche en grand ; laissée 2 secondes, ses mots-clés s’expliquent à côté.</p>
    </section>
  );
}
