// Écran de partie : plateau, mains, ciblage, choix, dialogues de scénario, journal, ordinateur.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chooseAction, type ActionFilter } from '../ai/heuristic';
import { card, Ctx } from '../engine/ctx';
import { actingPlayer, applyAction, createGame, DEFAULT_LEVEL_THRESHOLDS, playsForHandCard, whyUnplayable, type GameSetup } from '../engine/game';
import { drawCountFor } from '../engine/turn';
import type { Action, DialogLine, GameEvent, GameState, PlayerId, SlotRef } from '../engine/types';
import { formatEvent } from '../i18n/log.fr';
import { Board, type Highlight } from './Board';
import { Hand } from './Hand';
import { cardDesc, cardName, choiceTitle, optionLabel, UNPLAYABLE } from './labels';

const sameSlot = (a?: SlotRef, b?: SlotRef) => !!a && !!b && a.player === b.player && a.zone === b.zone && a.idx === b.idx;
import { Dialog } from './VnDialog';
export { Dialog };

const WEATHER_LABEL = { tempete: 'Tempête de sable', nuit: 'Nuit', jour: 'Jour' } as const;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface GameScreenProps {
  setup: GameSetup;
  names: Record<PlayerId, string>;
  human: Record<PlayerId, boolean>;
  /** Le plateau se retourne vers le joueur actif (deux joueurs sur le même écran). */
  flip?: boolean;
  /** Vitesse d'animation plus rapide (ordinateur contre ordinateur). */
  fast?: boolean;
  /** Règles imposées à l'ordinateur (scénarios). */
  aiFilter?: ActionFilter;
  title?: string;
  intro?: DialogLine[];
  /** Fin de partie : le parent décide de la suite (récompenses, réessayer…). */
  renderEnd: (game: GameState, close: () => void) => React.ReactNode;
  onQuit: () => void;
  /** Multiplicateur de durée des animations de combat (options). */
  animMul?: number;
  /** Multiplicateur du délai de réflexion de l'ordinateur (options). */
  aiMul?: number;
  /** Main de l'ordinateur visible dès le départ (options). */
  initialReveal?: boolean;
  /** Appelé une fois quand la partie se termine. */
  onOver?: (game: GameState) => void;
  /** Jeu en ligne : le camp `side` est joué à distance ; ses actions arrivent dans `inbox`, les nôtres partent par `send`. */
  remote?: { side: PlayerId; send: (a: Action) => void; inbox: Action[] };
  /** Camp affiché en bas de l'écran (par défaut A, ou le joueur actif à deux sur le même écran). */
  bottomSide?: PlayerId;
  /** Suivi de la partie (tutoriel) : appelé à chaque nouvel état. */
  onGame?: (game: GameState) => void;
  /** Contenu affiché par-dessus le plateau (bulle du tutoriel). */
  overlay?: React.ReactNode;
}

function PlayerBar({ game, p, label, active }: { game: GameState; p: PlayerId; label: string; active: boolean }) {
  const pl = game.players[p];
  const ctx = new Ctx(game);
  const thr = game.config.levelThresholds[p] ?? DEFAULT_LEVEL_THRESHOLDS;
  const next = thr[pl.level];
  const defeat = game.config.defeatLassitude[p];
  const noLimit = defeat >= 1e8;
  const moral = ctx.units(p).filter(u => !card(u.cardId).excludeFromMoralTotal).reduce((n, u) => n + u.currentMor, 0);
  return (
    <div className={`pbar${active ? ' active' : ''}`}>
      <strong className={`pname ${pl.faction}`}>{label}{active ? ' — à toi' : ''}</strong>
      <span>Ressource <b>{pl.resource}</b></span>
      <span>Niveau <b>{pl.level}</b></span>
      <span title={`Niveau suivant à ${next ?? '—'} points ; ${noLimit ? 'pas de défaite par lassitude' : `défaite à ${defeat}`}`}>
        Lassitude <b>{pl.points}</b>{noLimit ? '' : `/${defeat}`}
        {!noLimit && <span className="meter"><i style={{ width: `${Math.min(100, (100 * pl.points) / defeat)}%` }} /></span>}
      </span>
      <span>Moral total <b>{moral}</b></span>
      <span title={`Pioche ${drawCountFor(pl.level)} carte(s) par tour`}>Pioche <b>{pl.deck.length}</b>{pl.reserve.length ? ` (+${pl.reserve.length} niv. 4-5)` : ''}</span>
      <span>Défausse <b>{pl.discard.length}</b></span>
    </div>
  );
}

interface Banner { id: number; who: string; cardId: string }

export function GameScreen({ setup, names, human, flip, fast, aiFilter, title, intro, renderEnd, onQuit, animMul = 1, aiMul = 1, initialReveal = false, onOver, remote, bottomSide, onGame, overlay }: GameScreenProps) {
  const [game, setGame] = useState<GameState>(() => createGame(setup));
  const [shown, setShown] = useState<GameState | null>(null); // état affiché pendant une animation de combat
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [faded, setFaded] = useState<Set<number>>(new Set());
  const [log, setLog] = useState<{ text: string; cls: string }[]>([{ text: `Tour 1 : ${names.A} commence.`, cls: 'turn' }]);
  const [sel, setSel] = useState<{ uid: number; first?: SlotRef } | null>(null);
  const [hint, setHint] = useState('');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [order, setOrder] = useState<Record<PlayerId, number[]>>({ A: [], B: [] });
  const [revealAI, setRevealAI] = useState(initialReveal);
  const [overClosed, setOverClosed] = useState(false);
  const [dialogs, setDialogs] = useState<{ title?: string; lines: DialogLine[] }[]>(() => (intro?.length ? [{ title, lines: intro }] : []));
  const busy = useRef(false);
  const view = shown ?? game;
  const acting = actingPlayer(game);
  const paused = !!shown || dialogs.length > 0;
  const humanTurn = human[acting] && !game.over && !paused;
  const bottom: PlayerId = bottomSide ?? (flip ? game.active : 'A');
  const top: PlayerId = bottom === 'A' ? 'B' : 'A';
  const watch = !human.A && !human.B;

  const pushBanner = useCallback((who: string, cardId: string, ai: boolean) => {
    const id = Math.random();
    setBanners(b => [...b.slice(-2), { id, who, cardId }]);
    setTimeout(() => setBanners(b => b.filter(x => x.id !== id)), ai ? 4200 : 2600);
  }, []);

  const apply = useCallback(async (action: Action, fromRemote = false) => {
    if (busy.current) return;
    const actor = actingPlayer(game);
    const r = applyAction(game, action);
    if (!r.ok) { setHint(fromRemote ? `Désynchronisation avec l’adversaire (${r.error}).` : `Action impossible : ${UNPLAYABLE[r.error] ?? r.error}`); return; }
    if (remote && !fromRemote && actor !== remote.side) remote.send(action);
    busy.current = true;
    setSel(null);
    setHint('');
    const lines = r.events.map(e => ({ e, text: formatEvent(e, names) })).filter(x => x.text) as { e: GameEvent; text: string }[];
    setLog(l => [...l, ...lines.map(({ e, text }) => ({ text, cls: e.type === 'turnStart' || e.type === 'combatStart' ? 'turn' : e.type === 'destroyed' || e.type === 'gameOver' ? 'kill' : e.type === 'levelUp' || e.type === 'lassitude' ? 'lvl' : e.type === 'dialog' ? 'dlg-line' : '' }))]);
    for (const e of r.events) {
      if (e.type === 'cardPlayed' && card(e.cardId).cardType === 'Tactique') pushBanner(names[e.player], e.cardId, !human[e.player]);
    }
    // Animation du combat : on montre l'état d'avant, attaque par attaque, puis l'état final.
    if (action.type === 'endTurn' && r.events.some(e => e.type === 'attack')) {
      setShown(game);
      const gone = new Set<number>();
      for (const e of r.events) {
        if (e.type === 'attack') {
          setHighlight({ attacker: e.attacker, target: e.target, damage: e.damage, moral: e.moralLoss });
          await sleep((fast ? 380 : 520) * animMul);
        } else if (e.type === 'destroyed') {
          gone.add(e.uid);
          setFaded(new Set(gone));
        }
      }
      setHighlight(null);
      setFaded(new Set());
      setShown(null);
    }
    const dlg = r.events.filter(e => e.type === 'dialog').map(e => ({ lines: (e as { lines: DialogLine[] }).lines }));
    if (dlg.length) setDialogs(d => [...d, ...dlg]);
    setGame(r.state);
    busy.current = false;
  }, [game, names, human, pushBanner, fast, animMul, remote]);

  // Tour de l'ordinateur (et ses choix en attente). Il attend que les dialogues soient fermés.
  useEffect(() => {
    if (game.over || paused || busy.current || human[acting] || remote?.side === acting) return;
    const t = setTimeout(() => { void apply(chooseAction(game, undefined, aiFilter)); }, (fast ? 250 : 450) * aiMul);
    return () => clearTimeout(t);
  }, [game, paused, acting, apply, human, fast, aiFilter, aiMul]);

  useEffect(() => { onGame?.(game); }, [game, onGame]);

  // Jeu en ligne : on applique les actions reçues, une par une, quand l'écran est libre.
  const played = useRef(0);
  useEffect(() => {
    if (!remote || busy.current || shown) return;
    const a = remote.inbox[played.current];
    if (!a) return;
    played.current++;
    void apply(a, true);
  }, [remote, remote?.inbox.length, game, shown, apply]);

  // Fin de partie signalée une seule fois au parent (gains de pièces…).
  const overSent = useRef(false);
  useEffect(() => {
    if (game.over && !overSent.current) { overSent.current = true; onOver?.(game); }
  }, [game, onOver]);

  // Ciblage
  const plays = useMemo(() => (sel ? playsForHandCard(game, sel.uid) : []), [game, sel]);
  const isTarget = (ref: SlotRef) => {
    if (!sel || !humanTurn) return false;
    if (!sel.first) return plays.some(a => a.type === 'play' && sameSlot(a.target, ref));
    return plays.some(a => a.type === 'play' && sameSlot(a.target, sel.first) && sameSlot(a.target2, ref));
  };
  const onSlot = (ref: SlotRef) => {
    if (!sel) return;
    if (!sel.first) {
      const one = plays.find(a => a.type === 'play' && sameSlot(a.target, ref));
      if (!one || one.type !== 'play') return;
      if (one.target2) { setSel({ ...sel, first: ref }); setHint('Choisis maintenant la case de destination.'); return; }
      void apply(one);
    } else {
      const two = plays.find(a => a.type === 'play' && sameSlot(a.target, sel.first) && sameSlot(a.target2, ref));
      if (two) void apply(two);
    }
  };
  const onSelectCard = (uid: number) => {
    if (!humanTurn || game.pending.length) return;
    if (sel?.uid === uid) { setSel(null); setHint(''); return; }
    const why = whyUnplayable(game, uid);
    const h = game.players[game.active].hand.find(x => x.uid === uid)!;
    if (why) { setHint(`${cardName(h.cardId)} : ${UNPLAYABLE[why] ?? why}.`); return; }
    const ps = playsForHandCard(game, uid);
    if (ps.length === 1 && ps[0]!.type === 'play' && !ps[0]!.target) { void apply(ps[0]!); return; }
    setSel({ uid });
    setHint(`${cardName(h.cardId)} : choisis une case en surbrillance (clique à nouveau la carte pour annuler).`);
  };

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [log]);

  const choice = game.pending[0];
  const weather = new Ctx(view).weather();
  const handFor = (p: PlayerId) => (
    <Hand
      game={view}
      player={p}
      order={order[p]}
      setOrder={o => setOrder(x => ({ ...x, [p]: o }))}
      canAct={humanTurn && game.active === p && !game.pending.length}
      hidden={!human[p] && !revealAI && !watch}
      selected={game.active === p ? sel?.uid ?? null : null}
      onSelect={onSelectCard}
    />
  );

  return (
    <div className="game">
      <header className="topbar">
        <h1>{title ?? 'Ligne de Front'}</h1>
        <div className="actions">
          {weather && <span className={`weather ${weather}`}>{WEATHER_LABEL[weather]}</span>}
          {!watch && !remote && (!human.A || !human.B) && <button type="button" onClick={() => setRevealAI(v => !v)}>{revealAI ? 'Cacher' : 'Révéler'} la main de l’ordinateur</button>}
          <button type="button" onClick={onQuit}>Quitter la partie</button>
        </div>
      </header>

      <section className="side">
        <h2 className="hand-title">Main — {names[top]}</h2>
        {handFor(top)}
        <PlayerBar game={view} p={top} label={names[top]} active={game.active === top} />
        <Board game={view} player={top} bottom={false} isTarget={isTarget} isFirstPicked={r => sameSlot(sel?.first, r)} onSlot={onSlot} highlight={highlight} faded={faded} />
      </section>
      <div className="frontline">ligne de front</div>
      <section className="side">
        <Board game={view} player={bottom} bottom isTarget={isTarget} isFirstPicked={r => sameSlot(sel?.first, r)} onSlot={onSlot} highlight={highlight} faded={faded} />
        <PlayerBar game={view} p={bottom} label={names[bottom]} active={game.active === bottom} />
        <div className="controls">
          <p className="hint" aria-live="polite">{shown ? 'Résolution du combat…' : hint || (game.over ? '' : humanTurn ? `À ${names[game.active]} de jouer : choisis une carte, ou termine ton tour.` : paused ? '' : `${names[acting]} réfléchit…`)}</p>
          <button type="button" className="primary" disabled={!humanTurn || !!game.pending.length || busy.current} onClick={() => void apply({ type: 'endTurn' })}>Fin du tour</button>
        </div>
        <h2 className="hand-title">Main — {names[bottom]}</h2>
        {handFor(bottom)}
      </section>

      <details className="log" open>
        <summary>Journal</summary>
        <div className="log-list" ref={logRef}>{log.map((l, i) => <div key={i} className={l.cls}>{l.text}</div>)}</div>
      </details>

      <div className="banners" aria-live="polite">
        {banners.map(b => (
          <div key={b.id} className={`banner ${card(b.cardId).faction}`}>
            <div className="b-who">{b.who} joue une tactique</div>
            <div className="b-name">{cardName(b.cardId)}</div>
            <div className="b-desc">{cardDesc(b.cardId)}</div>
          </div>
        ))}
      </div>

      {dialogs[0] && !shown && <Dialog title={dialogs[0].title} lines={dialogs[0].lines} onClose={() => setDialogs(d => d.slice(1))} />}

      {!dialogs.length && choice && choice.options && human[choice.player] && !shown && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label={choiceTitle(choice)}>
          <div className="box">
            <p className="b-who">{names[choice.player]}</p>
            <h2>{choiceTitle(choice)}</h2>
            <div className="choices">
              {choice.options.map((o, i) => (
                <button type="button" key={i} title={o.cardId ? cardDesc(o.cardId) : ''} onClick={() => void apply({ type: 'choose', option: i })}>{optionLabel(choice, o)}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!dialogs.length && overlay}
      {game.over && !shown && !dialogs.length && !overClosed && renderEnd(game, () => setOverClosed(true))}
    </div>
  );
}
