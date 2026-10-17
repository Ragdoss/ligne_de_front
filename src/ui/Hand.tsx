// Main d'un joueur : cartes avec stats lisibles, coût actuel, tri (coût, type, niveau) et réorganisation manuelle.
import { useLayoutEffect, useRef, useState } from 'react';
import { card } from '../engine/ctx';
import { costOf, whyUnplayable } from '../engine/game';
import type { CardDef, GameState, HandCard, PlayerId } from '../engine/types';
import { ArtBackdrop, bearerLabel, leaderBonuses, levelLabel, slotLabel, STAT_KEYS, STAT_LABEL } from './CardFace';
import { cardDesc, cardName, TYPE_LABEL, UNPLAYABLE, visibleKeywords } from './labels';

/** Résumé d'une carte en main : stats colorées, bonus de Leader ou début de l'effet. */
function Summary({ c }: { c: CardDef }) {
  if (c.cardType === 'Regiment') {
    const kws = [...(c.unique ? ['Unique'] : []), ...visibleKeywords(c.keywords ?? [])];
    return (
      <>
        <div className="h-line">{STAT_KEYS.map((k, i) => <span key={k}>{i > 0 && ' · '}<b className={`v-${k}`} title={STAT_LABEL[k]}>{c[k] as number}</b></span>)}</div>
        {kws.length > 0 && <div className="h-kw">{kws.join(', ')}</div>}
      </>
    );
  }
  if (c.cardType === 'Leader') {
    return (
      <>
        <div className="h-line">{leaderBonuses(c).map(([k, v], i) => <span key={k}>{i > 0 && ' · '}<b className={`v-${k}`}>+{v} {k.toUpperCase()}</b></span>)}</div>
        <div className="h-kw">Porteur : {bearerLabel(c)}</div>
      </>
    );
  }
  return <div className="h-desc">{cardDesc(c.id)}</div>;
}

export type SortMode = 'cout' | 'type' | 'niveau';

export function sortHand(game: GameState, p: PlayerId, hand: HandCard[], mode: SortMode): number[] {
  const rank: Record<string, number> = { Regiment: 0, Leader: 1, Tactique: 2 };
  const key = (h: HandCard): (number | string)[] => {
    const c = card(h.cardId);
    const cost = costOf(game, p, h.uid);
    if (mode === 'cout') return [cost, c.niveau, rank[c.cardType]!, cardName(c.id)];
    if (mode === 'niveau') return [c.niveau, cost, rank[c.cardType]!, cardName(c.id)];
    return [rank[c.cardType]!, c.niveau, cost, cardName(c.id)];
  };
  return [...hand].sort((a, b) => {
    const ka = key(a), kb = key(b);
    for (let i = 0; i < ka.length; i++) { if (ka[i]! < kb[i]!) return -1; if (ka[i]! > kb[i]!) return 1; }
    return 0;
  }).map(h => h.uid);
}

export interface HandProps {
  game: GameState;
  player: PlayerId;
  /** Ordre d'affichage choisi par le joueur (uids) ; les nouvelles cartes s'ajoutent à droite. */
  order: number[];
  setOrder: (o: number[]) => void;
  canAct: boolean;
  hidden: boolean;
  selected: number | null;
  onSelect: (uid: number) => void;
  /** Début du glisser d'une carte (pour la poser directement sur le plateau). */
  onDragCard?: (uid: number) => void;
  /** Survol d'une carte : carte à afficher en grand (null en sortie). */
  onHover?: (cardId: string | null, x?: number) => void;
}

export function Hand({ game, player, order, setOrder, canAct, hidden, selected, onSelect, onDragCard, onHover }: HandProps) {
  const hand = game.players[player].hand;
  const [drag, setDrag] = useState<number | null>(null);
  // Animation du tri (technique FLIP) : chaque carte glisse de son ancienne place vers la nouvelle.
  const els = useRef(new Map<number, HTMLElement>());
  // Positions de mise en page (offsetLeft/Top) : elles ignorent les transformations en cours (survol, carte
  // soulevée, animation), sinon un simple survol, qui redessine la main, ferait voler les cartes.
  const prev = useRef(new Map<number, { x: number; y: number }>());
  useLayoutEffect(() => {
    const next = new Map<number, { x: number; y: number }>();
    els.current.forEach((el, uid) => {
      const r = { x: el.offsetLeft, y: el.offsetTop };
      next.set(uid, r);
      const p = prev.current.get(uid);
      if (p && (Math.abs(p.x - r.x) > 2 || Math.abs(p.y - r.y) > 2) && typeof el.animate === 'function') {
        el.animate([{ transform: `translate(${p.x - r.x}px, ${p.y - r.y}px)` }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
    prev.current = next;
  });
  if (hidden) return <div className="hand-hidden">{hand.length} carte(s) en main (cachées)</div>;
  const byUid = new Map(hand.map(h => [h.uid, h]));
  const shown = [...order.filter(u => byUid.has(u)), ...hand.filter(h => !order.includes(h.uid)).map(h => h.uid)].map(u => byUid.get(u)!);
  const move = (uid: number, to: number) => {
    const ids = shown.map(h => h.uid).filter(u => u !== uid);
    ids.splice(Math.max(0, Math.min(ids.length, to)), 0, uid);
    setOrder(ids);
  };
  return (
    <div className="hand-wrap">
      <div className="hand-sort">
        Trier :
        {(['cout', 'type', 'niveau'] as SortMode[]).map(m => (
          <button key={m} type="button" onClick={() => setOrder(sortHand(game, player, hand, m))}>{m === 'cout' ? 'coût' : m}</button>
        ))}
        <span className="muted">· glisse une carte sur le plateau pour la jouer, ou entre les autres pour la ranger</span>
      </div>
      <div className="hand" onDragOver={e => e.preventDefault()} onDrop={() => { if (drag !== null) move(drag, shown.length); setDrag(null); }}>
        {shown.length === 0 && <p className="muted">Main vide.</p>}
        {shown.map((h, i) => {
          const c = card(h.cardId);
          const cost = costOf(game, player, h.uid);
          const why = canAct ? whyUnplayable(game, h.uid) : 'turn';
          const playable = canAct && !why;
          return (
            <div
              key={h.uid}
              role="button"
              tabIndex={0}
              ref={el => { if (el) els.current.set(h.uid, el); else els.current.delete(h.uid); }}
              draggable
              onDragStart={e => { setDrag(h.uid); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(h.uid)); if (playable) onDragCard?.(h.uid); }}
              onDragEnd={() => setDrag(null)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.stopPropagation(); if (drag !== null) move(drag, i); setDrag(null); }}
              className={`hcard ${c.faction}${selected === h.uid ? ' selected' : ''}${playable ? '' : ' off'}`}
              aria-disabled={!playable}
              title={`${cardName(c.id)}\n${cardDesc(c.id)}${why && why !== 'turn' ? `\nInjouable : ${UNPLAYABLE[why] ?? why}` : ''}`}
              onClick={() => onSelect(h.uid)}
              onMouseEnter={e => onHover?.(c.id, e.clientX)}
              onMouseLeave={() => onHover?.(null)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(h.uid); } }}
            >
              <ArtBackdrop id={c.id} />
              <span className={`h-cost${cost < c.cout ? ' cheaper' : cost > c.cout ? ' dearer' : ''}`} title={`Coût ${cost}${c.dynamicCost ? ' (variable)' : ''}`}>{cost}</span>
              <span className="h-lvl" title={`Niveau ${c.niveau}`}>{levelLabel(c.niveau)}</span>
              <div className="h-low">
                <div className="h-name">{cardName(c.id)}</div>
                <div className="h-type">{TYPE_LABEL[c.cardType]}{c.cardType === 'Regiment' ? ` · ${slotLabel(c)}` : ''}{h.freeCopy ? ' · copie gratuite' : ''}</div>
                <Summary c={c} />
              </div>
              <button type="button" className="mv l" aria-label="Décaler à gauche" onClick={e => { e.stopPropagation(); move(h.uid, i - 1); }}>‹</button>
              <button type="button" className="mv r" aria-label="Décaler à droite" onClick={e => { e.stopPropagation(); move(h.uid, i + 1); }}>›</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
