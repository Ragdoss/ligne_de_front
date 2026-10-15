// Plateau : rangs avant / arrière, emplacement isolé, régiments avec leurs statistiques effectives.
import { card, Ctx } from '../engine/ctx';
import type { GameState, PlayerId, SlotRef, Unit, Zone } from '../engine/types';
import { cardDesc, cardName, visibleKeywords } from './labels';

export interface Highlight {
  attacker?: number;
  target?: number;
  damage?: number;
  moral?: number;
}

export interface BoardProps {
  game: GameState;
  player: PlayerId;
  /** Le joueur du bas a son rang avant en haut (face à l'adversaire), celui du haut l'a en bas. */
  bottom: boolean;
  isTarget: (ref: SlotRef) => boolean;
  isFirstPicked: (ref: SlotRef) => boolean;
  onSlot: (ref: SlotRef) => void;
  highlight: Highlight | null;
  faded: Set<number>;
}

function UnitCard({ u, ctx, highlight, faded }: { u: Unit; ctx: Ctx; highlight: Highlight | null; faded: boolean }) {
  const d = card(u.cardId);
  const atk = ctx.effectiveAtk(u), arm = ctx.effectiveArm(u), ini = ctx.effectiveIni(u);
  const cls = ['unit', d.faction];
  if (u.brokenMorale) cls.push('broken');
  if (faded) cls.push('dead');
  if (highlight?.attacker === u.uid) cls.push('attacking');
  if (highlight?.target === u.uid) cls.push('hit');
  const kws = visibleKeywords(u.keywords);
  const flags = [u.justDeployed && !u.arrivesReady ? 'déploiement' : '', u.stunned ? 'sonné' : '', u.brokenMorale ? 'Moral brisé' : '', u.pactShield ? 'pacte' : ''].filter(Boolean);
  const tip = `${cardName(u.cardId)}${u.leader ? ` + ${cardName(u.leader)}` : ''}\n${cardDesc(u.cardId)}${u.leader ? `\n${cardName(u.leader)} : ${cardDesc(u.leader)}` : ''}`;
  return (
    <div className={cls.join(' ')} title={tip}>
      <div className="u-name">{cardName(u.cardId)}</div>
      {u.leader && <div className="u-leader">★ {cardName(u.leader)}</div>}
      <div className="u-stats">
        <span className={atk !== u.baseAtk ? 'mod' : ''}>ATK <b>{atk}</b></span>
        <span>ARM <b>{arm}</b></span>
        <span>INI <b>{ini}</b></span>
      </div>
      <div className="bar end" aria-label={`Endurance ${u.currentEnd} sur ${u.maxEnd}`}>
        <i style={{ width: `${(100 * u.currentEnd) / u.maxEnd}%` }} />
        <em>END {u.currentEnd}/{u.maxEnd}</em>
      </div>
      <div className="bar mor" aria-label={`Moral ${u.currentMor} sur ${u.maxMor}`}>
        <i style={{ width: `${(100 * u.currentMor) / u.maxMor}%` }} />
        <em>MOR {u.currentMor}/{u.maxMor}</em>
      </div>
      {(kws.length > 0 || flags.length > 0 || u.vieTours !== null) && (
        <div className="u-kw">
          {kws.length > 0 && <s className={u.brokenMorale ? '' : 'kw-on'} title={u.brokenMorale ? 'Moral brisé : mots-clés perdus' : undefined}>{kws.join(' · ')}</s>}
          {[...(kws.length ? [''] : []), ...(u.vieTours !== null ? [`${u.vieTours} tour(s)`] : []), ...flags].join(' · ')}
        </div>
      )}
      {highlight?.target === u.uid && highlight.damage !== undefined && (
        <div className="floater">−{highlight.damage} END{highlight.moral ? ` · −${highlight.moral} MOR` : ''}</div>
      )}
    </div>
  );
}

export function Board({ game, player, bottom, isTarget, isFirstPicked, onSlot, highlight, faded }: BoardProps) {
  const ctx = new Ctx(game);
  const b = game.players[player].board;
  const slot = (zone: Zone, idx: number, u: Unit | null) => {
    const ref: SlotRef = { player, zone, idx };
    const target = isTarget(ref);
    const picked = isFirstPicked(ref);
    return (
      <div
        role="button"
        key={`${zone}${idx}`}
        className={`slot ${zone}${target ? ' target' : ''}${picked ? ' picked' : ''}${u ? '' : ' empty'}`}
        tabIndex={target ? 0 : -1}
        aria-disabled={!target}
        onClick={target ? () => onSlot(ref) : undefined}
        onKeyDown={target ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSlot(ref); } } : undefined}
        aria-label={`${zone === 'isole' ? 'Isolé' : zone === 'avant' ? `Avant ${idx + 1}` : `Arrière ${idx + 1}`}${u ? ` : ${cardName(u.cardId)}` : ' (vide)'}`}
      >
        {u ? <UnitCard u={u} ctx={ctx} highlight={highlight} faded={faded.has(u.uid)} /> : <span className="slot-label">{zone === 'isole' ? 'Isolé' : zone === 'avant' ? 'Avant' : 'Arrière'}</span>}
      </div>
    );
  };
  const front = <div className="row front">{b.avant.map((u, i) => slot('avant', i, u))}</div>;
  const back = <div className="row back">{b.arriere.map((u, i) => slot('arriere', i, u))}</div>;
  return (
    <div className={`board ${bottom ? 'bottom' : 'top'}`}>
      <div className="rows">{bottom ? <>{front}{back}</> : <>{back}{front}</>}</div>
      <div className="iso">{slot('isole', 0, b.isole)}</div>
    </div>
  );
}
