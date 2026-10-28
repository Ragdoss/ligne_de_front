// Plateau : rangs avant / arrière, emplacement isolé, régiments avec leurs statistiques effectives.
import { card, Ctx } from '../engine/ctx';
import type { GameState, PlayerId, SlotRef, Unit, Zone } from '../engine/types';
import { ArtBackdrop, artKeyFor, levelLabel } from './CardFace';
import type { Bubble, Bubbles } from './bubbles';
import { cardDesc, cardName, KEPT_WHEN_BROKEN, visibleKeywords } from './labels';

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
  /** Simulation du combat : pertes et destructions prévues par régiment. */
  preview?: Map<number, { end: number; mor: number; dead: boolean }>;
  /** Survol d'un régiment ou de son Leader : carte à afficher en grand (null en sortie). */
  onHover?: (cardId: string | null, x?: number, owner?: PlayerId) => void;
  /** Bulles de variation de statistiques à afficher sur les régiments. */
  bubbles?: Bubbles | null;
  /** Colonne de gauche (pioche, défausse). */
  left?: React.ReactNode;
  /** Sous l'emplacement isolé (côté ligne de front) : le Moral total. */
  isoExtra?: React.ReactNode;
}

type Pv = { end: number; mor: number; dead: boolean };
function UnitCard({ u, ctx, highlight, faded, pv, onHover, side, bubbles }: { u: Unit; ctx: Ctx; highlight: Highlight | null; faded: boolean; pv?: Pv; onHover?: (id: string | null, x?: number, owner?: PlayerId) => void; side: PlayerId; bubbles?: Bubble[] }) {
  // Propriétaire de la carte (pour son art) : celui qui l'a jouée, même si elle est empruntée.
  const owner: PlayerId = u.borrowed?.owner ?? side;
  const leaderOwner: PlayerId = u.leader && card(u.leader).targetsEnemy ? (owner === 'A' ? 'B' : 'A') : owner;
  const d = card(u.cardId);
  const atk = ctx.effectiveAtk(u), arm = ctx.effectiveArm(u), ini = ctx.effectiveIni(u);
  const cls = ['unit', d.faction];
  if (u.brokenMorale) cls.push('broken');
  if (u.prey) cls.push('is-prey');
  if (faded) cls.push('dead');
  if (pv?.dead) cls.push('pv-dead');
  if (highlight?.attacker === u.uid) cls.push('attacking');
  if (highlight?.target === u.uid) cls.push('hit');
  const allKws = visibleKeywords(u.keywords);
  // Moral brisé : les mots-clés sont perdus, sauf les négatifs (Lent) et Minions.
  const kept = u.brokenMorale ? allKws.filter(k => KEPT_WHEN_BROKEN.includes(k)) : [];
  const kws = u.brokenMorale ? allKws.filter(k => !KEPT_WHEN_BROKEN.includes(k)) : allKws;
  // Œuf : tours restants avant l'éclosion (le compteur avance au début de chaque tour de son contrôleur).
  const hatch = d.hatchesInto ? Math.max(1, ((d.hatchTurns as number | undefined) ?? 3) - (u.counter ?? 0)) : 0;
  const flags = [u.justDeployed && !u.arrivesReady ? 'déploiement' : '', u.stunned ? 'sonné' : '', u.pactShield ? 'pacte' : ''].filter(Boolean);
  const tip = `${cardName(u.cardId)}${u.leader ? ` + ${cardName(u.leader)}` : ''}\n${cardDesc(u.cardId)}${u.leader ? `\n${cardName(u.leader)} : ${cardDesc(u.leader)}` : ''}`;
  const base = (k: 'atk' | 'arm' | 'ini', v: number) => (v > ((k === 'atk' ? u.baseAtk : k === 'arm' ? u.baseArm : u.ini)) ? ' up' : v < (k === 'atk' ? u.baseAtk : k === 'arm' ? u.baseArm : u.ini) ? ' down' : '');
  return (
    <div className={cls.join(' ')} data-uid={u.uid} title={tip} onMouseEnter={e => onHover?.(u.cardId, e.clientX, owner)} onMouseLeave={() => onHover?.(null)}>
      <ArtBackdrop id={u.cardId} variant={artKeyFor(u.cardId, owner)} />
      <div className="u-top">
        <span className={`u-atk${base('atk', atk)}`} title="Attaque"><b>{atk}</b><i>ATK</i></span>
        <span className="u-lvl" title={`Niveau ${u.niveau}`}>{levelLabel(u.niveau)}</span>
        <span className={`u-arm${base('arm', arm)}`} title="Armure"><b>{arm}</b><i>ARM</i></span>
      </div>
      <div className="u-mid">
        {u.leader ? (
          <span className="u-leader" title={`${cardName(u.leader)} : ${cardDesc(u.leader)}`}
            onMouseEnter={e => { e.stopPropagation(); onHover?.(u.leader!, e.clientX, leaderOwner); }} onMouseLeave={e => onHover?.(u.cardId, e.clientX, owner)}>{cardName(u.leader)}</span>
        ) : <span />}
        <span className={`u-ini${base('ini', ini)}`} title="Initiative">INI {ini}</span>
      </div>
      {pv && (pv.end || pv.mor || pv.dead) ? (
        <div className={`pv${pv.dead ? ' dead' : ''}`}>
          {pv.dead ? 'Détruit' : [pv.end ? `${pv.end > 0 ? '+' : '−'}${Math.abs(pv.end)} END` : '', pv.mor ? `${pv.mor > 0 ? '+' : '−'}${Math.abs(pv.mor)} MOR` : ''].filter(Boolean).join(' · ')}
        </div>
      ) : null}
      <div className="u-low">
        <div className="u-name">{cardName(u.cardId)}{u.brokenMorale && <em className="u-broken"> · brisé</em>}</div>
        {(kws.length > 0 || kept.length > 0 || flags.length > 0 || u.vieTours !== null) && (
          <div className="u-kw">
            {kws.length > 0 && <s className={u.brokenMorale ? '' : 'kw-on'} title={u.brokenMorale ? 'Moral brisé : mots-clés perdus' : undefined}>{kws.join(' · ')}</s>}
            {[...(kws.length ? [''] : []), ...kept, ...(u.vieTours !== null ? [`${u.vieTours} tour(s)`] : []), ...flags].join(' · ')}
          </div>
        )}
        <div className="bar end" aria-label={`Endurance ${u.currentEnd} sur ${u.maxEnd}`}>
          <i style={{ width: `${(100 * u.currentEnd) / u.maxEnd}%` }} />
          <em>END {u.currentEnd}/{u.maxEnd}</em>
        </div>
        <div className="bar mor" aria-label={`Moral ${u.currentMor} sur ${u.maxMor}`}>
          <i style={{ width: `${(100 * u.currentMor) / u.maxMor}%` }} />
          <em>MOR {u.currentMor}/{u.maxMor}</em>
        </div>
      </div>
      {u.prey && <div className="u-prey" title="Proie : désignée par un Elfe adverse">Proie</div>}
      {hatch > 0 && <div className="u-hatch" title="Tours avant l’éclosion">Éclot dans {hatch} tour{hatch > 1 ? 's' : ''}</div>}
      {bubbles && bubbles.length > 0 && (
        <div className="floaters">{bubbles.map((x, i) => <span key={i} className={`floater ${x.up ? 'up' : 'down'}`}>{x.text}</span>)}</div>
      )}
    </div>
  );
}

export function Board({ game, player, bottom, isTarget, isFirstPicked, onSlot, highlight, faded, preview, onHover, bubbles, left, isoExtra }: BoardProps) {
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
        onDragOver={target ? e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } : undefined}
        onDrop={target ? e => { e.preventDefault(); onSlot(ref); } : undefined}
        onKeyDown={target ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSlot(ref); } } : undefined}
        aria-label={`${zone === 'isole' ? 'Isolé' : zone === 'avant' ? `Avant ${idx + 1}` : `Arrière ${idx + 1}`}${u ? ` : ${cardName(u.cardId)}` : ' (vide)'}`}
      >
        {u ? <UnitCard u={u} ctx={ctx} highlight={highlight} faded={faded.has(u.uid)} pv={preview?.get(u.uid)} onHover={onHover} side={player} bubbles={bubbles?.get(u.uid)} /> : <span className="slot-label">{zone === 'isole' ? 'Isolé' : zone === 'avant' ? 'Avant' : 'Arrière'}</span>}
      </div>
    );
  };
  const front = <div className="row front">{b.avant.map((u, i) => slot('avant', i, u))}</div>;
  const back = <div className="row back">{b.arriere.map((u, i) => slot('arriere', i, u))}</div>;
  return (
    <div className={`board ${bottom ? 'bottom' : 'top'}`}>
      {left}
      <div className="rows">{bottom ? <>{front}{back}</> : <>{back}{front}</>}</div>
      <div className={`iso${isoExtra ? ' with-extra' : ''}`}>{bottom ? <>{isoExtra}{slot('isole', 0, b.isole)}</> : <>{slot('isole', 0, b.isole)}{isoExtra}</>}</div>
    </div>
  );
}
