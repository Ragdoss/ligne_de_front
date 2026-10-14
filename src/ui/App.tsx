// Application : écran de départ, puis partie (plateau, mains, ciblage, choix, journal, IA).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chooseAction } from '../ai/heuristic';
import { DEMO_DECKS } from '../data/decks';
import { card, Ctx } from '../engine/ctx';
import { actingPlayer, applyAction, createGame, DEFAULT_LEVEL_THRESHOLDS, playsForHandCard, whyUnplayable } from '../engine/game';
import { drawCountFor } from '../engine/turn';
import type { Action, Faction, GameEvent, GameState, PlayerId, SlotRef } from '../engine/types';
import { formatEvent } from '../i18n/log.fr';
import { Board, type Highlight } from './Board';
import { Hand } from './Hand';
import { cardDesc, cardName, choiceTitle, FACTION_LABEL, optionLabel, PLAYABLE_FACTIONS, UNPLAYABLE } from './labels';

type Mode = 'ai' | 'hotseat' | 'watch';
interface Setup { mode: Mode; A: Faction; B: Faction }

const sameSlot = (a?: SlotRef, b?: SlotRef) => !!a && !!b && a.player === b.player && a.zone === b.zone && a.idx === b.idx;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function SetupScreen({ onStart }: { onStart: (s: Setup) => void }) {
  const [mode, setMode] = useState<Mode>('ai');
  const [A, setA] = useState<Faction>('empire');
  const [B, setB] = useState<Faction>('elfe');
  const pick = (v: Faction, set: (f: Faction) => void, label: string) => (
    <fieldset className="pick">
      <legend>{label}</legend>
      {PLAYABLE_FACTIONS.map(f => (
        <label key={f} className={`fchip ${f}${v === f ? ' on' : ''}`}>
          <input type="radio" name={label} checked={v === f} onChange={() => set(f)} />
          {FACTION_LABEL[f]} <small>({DEMO_DECKS[f]!.length} cartes)</small>
        </label>
      ))}
    </fieldset>
  );
  return (
    <div className="setup">
      <h1>Ligne de Front</h1>
      <p className="muted">Version de test du vrai jeu, sur le nouveau moteur. Decks de démonstration.</p>
      <fieldset className="pick">
        <legend>Mode</legend>
        {([['ai', 'Contre l’ordinateur'], ['hotseat', 'À deux sur le même écran'], ['watch', 'Regarder l’ordinateur contre lui-même']] as const).map(([m, l]) => (
          <label key={m} className={`fchip${mode === m ? ' on' : ''}`}>
            <input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} />{l}
          </label>
        ))}
      </fieldset>
      {pick(A, setA, mode === 'watch' ? 'Joueur A (ordinateur, commence)' : 'Joueur A (toi, commence)')}
      {pick(B, setB, mode === 'ai' || mode === 'watch' ? 'Joueur B (ordinateur)' : 'Joueur B')}
      <button type="button" className="primary" onClick={() => onStart({ mode, A, B })}>Commencer la partie</button>
    </div>
  );
}

function PlayerBar({ game, p, label, active }: { game: GameState; p: PlayerId; label: string; active: boolean }) {
  const pl = game.players[p];
  const ctx = new Ctx(game);
  const thr = game.config.levelThresholds[p] ?? DEFAULT_LEVEL_THRESHOLDS;
  const next = thr[pl.level];
  const defeat = game.config.defeatLassitude[p];
  const moral = ctx.units(p).filter(u => !card(u.cardId).excludeFromMoralTotal).reduce((n, u) => n + u.currentMor, 0);
  return (
    <div className={`pbar${active ? ' active' : ''}`}>
      <strong className={`pname ${pl.faction}`}>{label}{active ? ' — à toi' : ''}</strong>
      <span>Ressource <b>{pl.resource}</b></span>
      <span>Niveau <b>{pl.level}</b></span>
      <span title={`Niveau suivant à ${next ?? '—'} points ; défaite à ${defeat}`}>
        Lassitude <b>{pl.points}</b>/{defeat}
        <span className="meter"><i style={{ width: `${Math.min(100, (100 * pl.points) / defeat)}%` }} /></span>
      </span>
      <span>Moral total <b>{moral}</b></span>
      <span title={`Pioche ${drawCountFor(pl.level)} carte(s) par tour`}>Pioche <b>{pl.deck.length}</b>{pl.reserve.length ? ` (+${pl.reserve.length} niv. 4-5)` : ''}</span>
      <span>Défausse <b>{pl.discard.length}</b></span>
    </div>
  );
}

interface Banner { id: number; who: string; cardId: string }

function GameScreen({ setup, onQuit }: { setup: Setup; onQuit: () => void }) {
  const names: Record<PlayerId, string> = { A: FACTION_LABEL[setup.A], B: FACTION_LABEL[setup.B] };
  const human: Record<PlayerId, boolean> = { A: setup.mode !== 'watch', B: setup.mode === 'hotseat' };
  const [game, setGame] = useState<GameState>(() => createGame({
    seed: Date.now(), A: { faction: setup.A, deck: DEMO_DECKS[setup.A]! }, B: { faction: setup.B, deck: DEMO_DECKS[setup.B]! },
  }));
  const [shown, setShown] = useState<GameState | null>(null); // état affiché pendant une animation de combat
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [faded, setFaded] = useState<Set<number>>(new Set());
  const [log, setLog] = useState<{ text: string; cls: string }[]>([{ text: `Tour 1 : ${names.A} commence.`, cls: 'turn' }]);
  const [sel, setSel] = useState<{ uid: number; first?: SlotRef } | null>(null);
  const [hint, setHint] = useState('');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [order, setOrder] = useState<Record<PlayerId, number[]>>({ A: [], B: [] });
  const [revealAI, setRevealAI] = useState(false);
  const [overClosed, setOverClosed] = useState(false);
  const busy = useRef(false);
  const view = shown ?? game;
  const acting = actingPlayer(game);
  const humanTurn = human[acting] && !game.over && !shown;
  const bottom: PlayerId = setup.mode === 'hotseat' ? game.active : 'A';
  const top: PlayerId = bottom === 'A' ? 'B' : 'A';

  const pushBanner = useCallback((who: string, cardId: string, ai: boolean) => {
    const id = Math.random();
    setBanners(b => [...b.slice(-2), { id, who, cardId }]);
    setTimeout(() => setBanners(b => b.filter(x => x.id !== id)), ai ? 4200 : 2600);
  }, []);

  const apply = useCallback(async (action: Action) => {
    if (busy.current) return;
    const r = applyAction(game, action);
    if (!r.ok) { setHint(`Action impossible : ${UNPLAYABLE[r.error] ?? r.error}`); return; }
    busy.current = true;
    setSel(null);
    setHint('');
    const lines = r.events.map(e => ({ e, text: formatEvent(e, names) })).filter(x => x.text) as { e: GameEvent; text: string }[];
    setLog(l => [...l, ...lines.map(({ e, text }) => ({ text, cls: e.type === 'turnStart' || e.type === 'combatStart' ? 'turn' : e.type === 'destroyed' || e.type === 'gameOver' ? 'kill' : e.type === 'levelUp' || e.type === 'lassitude' ? 'lvl' : '' }))]);
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
          await sleep(setup.mode === 'watch' ? 380 : 520);
        } else if (e.type === 'destroyed') {
          gone.add(e.uid);
          setFaded(new Set(gone));
        }
      }
      setHighlight(null);
      setFaded(new Set());
      setShown(null);
    }
    setGame(r.state);
    busy.current = false;
  }, [game, names, human, pushBanner, setup.mode]);

  // Tour de l'ordinateur (et ses choix en attente).
  useEffect(() => {
    if (game.over || shown || busy.current || human[acting]) return;
    const t = setTimeout(() => { void apply(chooseAction(game)); }, setup.mode === 'watch' ? 250 : 450);
    return () => clearTimeout(t);
  }, [game, shown, acting, apply, human, setup.mode]);

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

  // Défilement automatique du journal
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [log]);

  const choice = game.pending[0];
  const handFor = (p: PlayerId) => (
    <Hand
      game={view}
      player={p}
      order={order[p]}
      setOrder={o => setOrder(x => ({ ...x, [p]: o }))}
      canAct={humanTurn && game.active === p && !game.pending.length}
      hidden={!human[p] && !revealAI && setup.mode !== 'watch'}
      selected={game.active === p ? sel?.uid ?? null : null}
      onSelect={onSelectCard}
    />
  );

  return (
    <div className="game">
      <header className="topbar">
        <h1>Ligne de Front</h1>
        <div className="actions">
          {setup.mode === 'ai' && <button type="button" onClick={() => setRevealAI(v => !v)}>{revealAI ? 'Cacher' : 'Révéler'} la main de l’ordinateur</button>}
          <button type="button" onClick={onQuit}>Nouvelle partie</button>
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
          <p className="hint" aria-live="polite">{shown ? 'Résolution du combat…' : hint || (game.over ? '' : humanTurn ? `À ${names[game.active]} de jouer : choisis une carte, ou termine ton tour.` : `${names[acting]} réfléchit…`)}</p>
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

      {choice && choice.options && human[choice.player] && !shown && (
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

      {game.over && !shown && !overClosed && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="box">
            <h2>Victoire : {names[game.over.winner]}</h2>
            <p>{formatEvent({ type: 'gameOver', winner: game.over.winner, reason: game.over.reason }, names)}</p>
            <p className="muted">Partie terminée au tour {game.turn}. Le journal reste consultable.</p>
            <div className="choices row">
              <button type="button" onClick={() => setOverClosed(true)}>Voir le plateau</button>
              <button type="button" className="primary" onClick={onQuit}>Nouvelle partie</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [key, setKey] = useState(0);
  if (!setup) return <SetupScreen onStart={s => { setSetup(s); setKey(k => k + 1); }} />;
  return <GameScreen key={key} setup={setup} onQuit={() => setSetup(null)} />;
}
