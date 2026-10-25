// Écran de partie : plateau, mains, ciblage, choix, dialogues de scénario, journal, ordinateur.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chooseAction, chooseActionV3, STRONG_AI, type ActionFilter } from '../ai/heuristic';
import { card, Ctx, recordStates } from '../engine/ctx';
import { actingPlayer, applyAction, createGame, DEFAULT_LEVEL_THRESHOLDS, playsForHandCard, whyUnplayable, type GameSetup } from '../engine/game';
import { drawCountFor } from '../engine/turn';
import type { Action, DialogLine, GameEvent, GameState, PendingChoice, PlayerId, SlotRef } from '../engine/types';
import { formatEvent } from '../i18n/log.fr';
import { Board, type Highlight } from './Board';
import { artKeyFor, CardFace, clearGameArts, setGameArts } from './CardFace';
import { APP_VERSION } from '../version';
import { Hand } from './Hand';
import { ZoomCard } from './ZoomCard';
import { statBubbles, type Bubbles } from './bubbles';
import { playSound, playSounds, requestMusic, soundsFor } from './sound';
import { DiscardViewer, Piles } from './Piles';
import { cardDesc, cardName, choiceTitle, optionLabel, UNPLAYABLE } from './labels';

const sameSlot = (a?: SlotRef, b?: SlotRef) => !!a && !!b && a.player === b.player && a.zone === b.zone && a.idx === b.idx;
import { Avatar } from './avatars';
import { Dialog } from './VnDialog';
export { Dialog };

const WEATHER_LABEL = { tempete: 'Tempête de sable', nuit: 'Nuit', jour: 'Jour' } as const;
/** Résultat du combat si le joueur finit son tour maintenant : pertes d'END/Moral et destructions, par régiment. */
export interface CombatPreview { units: Map<number, { end: number; mor: number; dead: boolean }>; summary: string }
function simulateCombat(game: GameState): CombatPreview | null {
  const r = applyAction(game, { type: 'endTurn' });
  if (!r.ok) return null;
  const units = new Map<number, { end: number; mor: number; dead: boolean }>();
  const get = (uid: number) => { let x = units.get(uid); if (!x) { x = { end: 0, mor: 0, dead: false }; units.set(uid, x); } return x; };
  const me = game.active, them = me === 'A' ? 'B' : 'A';
  const lass: Record<string, number> = { A: 0, B: 0 };
  const dead: Record<string, number> = { A: 0, B: 0 };
  let started = false;
  for (const e of r.events) {
    if (e.type === 'combatStart') { started = true; continue; }
    if (!started) continue;
    if (e.type === 'turnStart') break;
    if (e.type === 'attack') { const x = get(e.target); x.end -= e.damage; x.mor -= e.moralLoss; }
    else if (e.type === 'moralLoss') get(e.uid).mor -= e.amount;
    else if (e.type === 'heal') { const x = get(e.uid); x.end += e.end; x.mor += e.mor; }
    else if (e.type === 'destroyed') { get(e.uid).dead = true; dead[e.player]!++; }
    else if (e.type === 'lassitude' && e.amount > 0) lass[e.player]! += e.amount;
  }
  const parts = [`régiments détruits : ${dead[them]} chez l’adversaire, ${dead[me]} chez toi`, `lassitude : +${lass[me]} pour toi, +${lass[them]} pour l’adversaire`];
  if (r.state.over) parts.push(r.state.over.winner === me ? 'la partie serait GAGNÉE' : 'la partie serait PERDUE');
  return { units, summary: `Si tu finis ton tour : ${parts.join(' ; ')}.` };
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
/** Option « le régiment qui attaque se déplace jusqu'à sa cible » (réglée par App à partir du profil). */
let attackMotionOn = true;
export function setAttackMotion(on: boolean): void { attackMotionOn = on; }

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
  /** Multiplicateur de la durée des bandeaux (options). */
  bannerMul?: number;
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
  /** Images de profil affichées dans les barres des joueurs. */
  avatars?: Partial<Record<PlayerId, string | undefined>>;
  /** IA forte (v3) ; sinon IA v2 (campagne et tutoriel : leur difficulté a été réglée avec la v2). */
  strongAi?: boolean;
  /** Musique de la partie (candidats, du plus précis au plus général ; docs/SONS.md). */
  music?: string[];
  /** Le régiment qui attaque se déplace jusqu'à sa cible (Options). */
  attackMotion?: boolean;
  /** Arts alternatifs choisis par chaque joueur (carte → clé d'art). */
  arts?: Partial<Record<PlayerId, Record<string, string>>>;
  /** Contenu affiché par-dessus le plateau (bulle du tutoriel). */
  overlay?: React.ReactNode;
}

function PlayerBar({ game, p, label, active, avatar, where }: { game: GameState; p: PlayerId; label: string; active: boolean; avatar?: string; where: 'top' | 'bottom' }) {
  const pl = game.players[p];
  const thr = game.config.levelThresholds[p] ?? DEFAULT_LEVEL_THRESHOLDS;
  const from = thr[pl.level - 1] ?? 0, next = thr[pl.level];
  const defeat = game.config.defeatLassitude[p];
  const noLimit = defeat >= 1e8;
  const lvlPct = next === undefined ? 100 : Math.max(0, Math.min(100, (100 * (pl.points - from)) / (next - from)));
  return (
    <div className={`pbar pbar-${where} ${pl.faction}${active ? ' active' : ''}`}>
      {avatar && <Avatar id={avatar} size={34} />}
      <strong className={`pname ${pl.faction}`}>{label}{active ? ' — à toi' : ''}</strong>
      <span className="pb-res" title={`Ressource : ${pl.resource}`}><i className="res-coin">{pl.resource}</i></span>
      <span className="pb-gauge pb-level" title={next === undefined ? 'Niveau maximum' : `Niveau ${pl.level + 1} à ${next} points de lassitude`}>
        Niveau <b>{pl.level}</b>
        <span className="meter lvl"><i style={{ width: `${lvlPct}%` }} /></span>
        <small>{next === undefined ? 'max' : `→ ${pl.level + 1} à ${next}`}</small>
      </span>
      <span className="pb-gauge pb-lass" title={`Pioche ${drawCountFor(pl.level)} carte(s) par tour ; ${noLimit ? 'pas de défaite par lassitude' : `défaite à ${defeat}`}`}>
        Lassitude <b>{pl.points}</b>{noLimit ? '' : `/${defeat}`}
        {!noLimit && <span className="meter"><i style={{ width: `${Math.min(100, (100 * pl.points) / defeat)}%` }} /></span>}
      </span>
    </div>
  );
}

/** Moral total d'un joueur, affiché entre les deux emplacements isolés. */
function MoralTotal({ game, p }: { game: GameState; p: PlayerId }) {
  const ctx = new Ctx(game);
  const moral = ctx.units(p).filter(u => !card(u.cardId).excludeFromMoralTotal).reduce((n, u) => n + u.currentMor, 0);
  return <div className={`iso-moral ${game.players[p].faction}`} title="Moral total des régiments (test de Moral)"><small>Moral total</small><b>{moral}</b></div>;
}

interface Banner { id: number; who: string; cardId: string; on?: string }

/** Libellé court d'une option sous l'illustration de sa carte (le nom de la carte est déjà sur la carte). */
function shortLabel(full: string, id: string): string {
  const t = full.replace(cardName(id), '').replace(/\s{2,}/g, ' ').replace(/^\s*[→—:-]\s*/, '').trim();
  if (!t || /^niv\./.test(t)) return 'Choisir';
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Choix en attente : les options liées à une carte sont montrées avec l'illustration de la carte, les autres en boutons. */
export function ChoicePanel({ choice, onPick, onHover }: { choice: PendingChoice; onPick: (i: number) => void; onHover: (id: string | null, x?: number) => void }) {
  const opts = choice.options ?? [];
  // Options consécutives sur la même carte : une seule carte, plusieurs boutons (ex. Augure : dessus / dessous).
  const groups: { id: string; items: { i: number; label: string }[] }[] = [];
  const rest: number[] = [];
  opts.forEach((o, i) => {
    if (!o.cardId) { rest.push(i); return; }
    const label = shortLabel(optionLabel(choice, o), o.cardId);
    const last = groups[groups.length - 1];
    if (last && last.id === o.cardId && !last.items.some(x => x.label === label) && opts[i - 1]?.cardId === o.cardId) last.items.push({ i, label });
    else groups.push({ id: o.cardId, items: [{ i, label }] });
  });
  return (
    <>
      {groups.length > 0 && (
        <div className="choice-cards">
          {groups.map((g, k) => (
            <div key={k} className="choice-card" onMouseEnter={e => onHover(g.id, e.clientX)} onMouseLeave={() => onHover(null)}>
              {g.items.length === 1
                ? <button type="button" className="cc-pick" aria-label={optionLabel(choice, opts[g.items[0]!.i]!)} onClick={() => onPick(g.items[0]!.i)}><CardFace id={g.id} variant={artKeyFor(g.id, choice.player)} /></button>
                : <CardFace id={g.id} variant={artKeyFor(g.id, choice.player)} />}
              <div className="cc-acts">
                {g.items.map(x => <button key={x.i} type="button" title={optionLabel(choice, opts[x.i]!)} onClick={() => onPick(x.i)}>{x.label}</button>)}
              </div>
            </div>
          ))}
        </div>
      )}
      {rest.length > 0 && (
        <div className="choices">
          {rest.map(i => <button type="button" key={i} onClick={() => onPick(i)}>{optionLabel(choice, opts[i]!)}</button>)}
        </div>
      )}
    </>
  );
}

export function GameScreen({ setup, names, human, flip, fast, aiFilter, title, intro, renderEnd, onQuit, animMul = 1, aiMul = 1, bannerMul = 1, initialReveal = false, onOver, remote, bottomSide, onGame, overlay, avatars, arts, attackMotion = attackMotionOn, strongAi = false, music = ['combat'] }: GameScreenProps) {
  const musicKey = music.join('|');
  useEffect(() => requestMusic(musicKey.split('|')), [musicKey]);
  /** Joueur de cet écran (sons de victoire / défaite) ; null à deux sur le même écran ou en spectateur. */
  const me: PlayerId | null = remote ? (remote.side === 'A' ? 'B' : 'A') : human.A !== human.B ? (human.A ? 'A' : 'B') : null;
  const artsRef = useRef<Partial<Record<PlayerId, Record<string, string>>>>({});
  artsRef.current = arts ?? {};
  setGameArts(artsRef.current); // chaque camp avec ses propres arts (base pour l'ordinateur)
  // En quittant la partie seulement (pas si une nouvelle partie, ex. revanche, a déjà pris la main).
  useEffect(() => () => clearGameArts(artsRef.current), []);
  const [game, setGame] = useState<GameState>(() => createGame(setup));
  useEffect(() => { setZoomState(null); }, [game]); // une carte jouée ou détruite ne reste pas affichée
  // Carte survolée, affichée en grand du côté opposé à la souris (fermée dès que le jeu change).
  const [zoom, setZoomState] = useState<{ id: string; left: boolean; owner?: PlayerId } | null>(null);
  const setZoom = useCallback((id: string | null, x?: number, owner?: PlayerId) => setZoomState(id ? { id, owner, left: x !== undefined && x > window.innerWidth / 2 } : null), []);
  const [shown, setShown] = useState<GameState | null>(null); // état affiché pendant une animation de combat
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [faded, setFaded] = useState<Set<number>>(new Set());
  const [bubbles, setBubblesState] = useState<Bubbles | null>(null);
  const bubbleTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  /** Bulles de variation de statistiques : chaque régiment garde les siennes un moment (les nouvelles remplacent les anciennes). */
  const setBubbles = useCallback((b: Bubbles | null) => {
    if (!b || !b.size) return;
    setBubblesState(cur => { const next = new Map(cur ?? []); for (const [uid, list] of b) next.set(uid, list); return next; });
    for (const uid of b.keys()) {
      const old = bubbleTimers.current.get(uid);
      if (old) clearTimeout(old);
      bubbleTimers.current.set(uid, setTimeout(() => {
        bubbleTimers.current.delete(uid);
        setBubblesState(cur => { if (!cur?.has(uid)) return cur; const next = new Map(cur); next.delete(uid); return next.size ? next : null; });
      }, 1800 * Math.max(0.6, animMul)));
    }
  }, [animMul]);
  const [log, setLog] = useState<{ text: string; cls: string }[]>([{ text: `Tour 1 : ${names[setup.first ?? 'A']} commence.`, cls: 'turn' }]);
  const [sel, setSel] = useState<{ uid: number; first?: SlotRef } | null>(null);
  const [hint, setHint] = useState('');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [order, setOrder] = useState<Record<PlayerId, number[]>>({ A: [], B: [] });
  const [revealAI, setRevealAI] = useState(initialReveal);
  const [peek, setPeek] = useState(false);
  /** Défausse ouverte (parcourir ses cartes). */
  const [discardOf, setDiscardOf] = useState<PlayerId | null>(null);
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

  const pushBanner = useCallback((who: string, cardId: string, ai: boolean, on?: string) => {
    const id = Math.random();
    setBanners(b => [...b.slice(-2), { id, who, cardId, on }]);
    setTimeout(() => setBanners(b => b.filter(x => x.id !== id)), (ai ? 4200 : 2600) * bannerMul);
  }, [bannerMul]);

  const apply = useCallback(async (action: Action, fromRemote = false) => {
    if (busy.current) return;
    const actor = actingPlayer(game);
    const { result: r, states } = recordStates(() => applyAction(game, action));
    if (!r.ok) { setHint(fromRemote ? `Désynchronisation avec l’adversaire (${r.error}).` : `Action impossible : ${UNPLAYABLE[r.error] ?? r.error}`); return; }
    if (remote && !fromRemote && actor !== remote.side) remote.send(action);
    busy.current = true;
    setSel(null);
    setHint('');
    const lines = r.events.map(e => ({ e, text: formatEvent(e, names) })).filter(x => x.text) as { e: GameEvent; text: string }[];
    setLog(l => [...l, ...lines.map(({ e, text }) => ({ text, cls: e.type === 'turnStart' || e.type === 'combatStart' ? 'turn' : e.type === 'destroyed' || e.type === 'gameOver' ? 'kill' : e.type === 'levelUp' || e.type === 'lassitude' ? 'lvl' : e.type === 'dialog' ? 'dlg-line' : '' }))]);
    for (const e of r.events) {
      if (e.type === 'cardPlayed' && card(e.cardId).cardType === 'Tactique') pushBanner(names[e.player], e.cardId, !human[e.player]);
      // Leaders joués par l'adversaire (ordinateur ou joueur à distance) : même bandeau, avec le régiment qui le reçoit.
      if (e.type === 'leaderAttached' && !human[e.player]) pushBanner(names[e.player], e.leaderId, true, cardName(e.cardId));
    }
    // Animation du combat, attaque par attaque : le plateau affiché suit l'état du jeu après chaque attaque
    // (et après les effets d'avant-combat, comme les Chiens du Maître du Chenil), avec les bulles de variation.
    const T = (fast ? 380 : 600) * animMul;
    const ev = r.events;
    const at = (i: number) => (i < 0 ? game : states[i] ?? r.state);
    const attacks = ev.map((e, i) => (e.type === 'attack' ? i : -1)).filter(i => i >= 0);
    if (action.type === 'endTurn' && attacks.length) {
      const startIdx = ev.findIndex(e => e.type === 'combatStart');
      playSounds(soundsFor(ev.slice(0, attacks[0]), me));
      // Avant les attaques : effets d'avant-combat.
      const pre = at(attacks[0]! - 1);
      setShown(pre);
      const preB = statBubbles(game, pre);
      if (preB.size || ev.slice(startIdx, attacks[0]).some(e => e.type === 'deployed')) { setBubbles(preB); await sleep(T); }
      for (let k = 0; k < attacks.length; k++) {
        const i = attacks[k]!, end = (attacks[k + 1] ?? ev.findIndex((e, j) => j > i && e.type === 'turnStart')) - 1;
        const last = end >= i ? end : ev.length - 1;
        const e = ev[i] as Extract<GameEvent, { type: 'attack' }>;
        setShown(at(i - 1));
        setHighlight({ attacker: e.attacker, target: e.target });
        const [swing, hit] = soundsFor([e], me);
        playSound(swing!);
        await sleep(T * 0.75);
        playSounds([hit!, ...soundsFor(ev.slice(i + 1, last + 1).filter(x => x.type !== 'turnStart'), me)]);
        // Résultat de l'attaque (et de ses suites : destructions, Moral perdu par les alliés…).
        const segment = ev.slice(i, last + 1);
        const killed = segment.filter(x => x.type === 'destroyed').map(x => (x as { uid: number }).uid);
        const firstKill = segment.findIndex(x => x.type === 'destroyed');
        setBubbles(statBubbles(at(i - 1), at(last)));
        if (killed.length) {
          setShown(at(i + firstKill - 1));
          setFaded(new Set(killed));
          await sleep(T * 0.45);
          setFaded(new Set());
        }
        setShown(at(last));
        await sleep(T * 0.5);
      }
      setHighlight(null);
      setFaded(new Set());
      setShown(null);
      // Début du tour suivant (pioche…) : sons après le combat.
      const ts = ev.findIndex((y, k) => k > attacks[attacks.length - 1]! && y.type === 'turnStart');
      if (ts >= 0) playSounds(soundsFor(ev.slice(ts), me));
      const tail = at(ev.length - 1);
      const endB = statBubbles(at(attacks[attacks.length - 1]!), tail, false);
      setBubbles(endB);
    } else {
      // Autres actions (tactique, Leader, effet…) : sons et bulles des variations de statistiques.
      playSounds(soundsFor(r.events, me));
      const b = statBubbles(game, r.state);
      setBubbles(b);
    }
    const dlg = r.events.filter(e => e.type === 'dialog').map(e => ({ lines: (e as { lines: DialogLine[] }).lines }));
    if (dlg.length) setDialogs(d => [...d, ...dlg]);
    setGame(r.state);
    busy.current = false;
  }, [game, names, human, pushBanner, fast, animMul, remote, setBubbles, me]);

  // Tour de l'ordinateur (et ses choix en attente). Il attend que les dialogues soient fermés.
  useEffect(() => {
    if (game.over || paused || busy.current || human[acting] || remote?.side === acting) return;
    const t = setTimeout(() => { void apply(strongAi ? chooseActionV3(game, undefined, aiFilter, STRONG_AI) : chooseAction(game, undefined, aiFilter)); }, (fast ? 250 : 450) * aiMul);
    return () => clearTimeout(t);
  }, [game, paused, acting, apply, human, fast, aiFilter, aiMul, strongAi]);

  useEffect(() => { onGame?.(game); }, [game, onGame]);

  // Charge : le régiment qui attaque fonce vers sa cible puis revient (désactivable dans les Options).
  useEffect(() => {
    if (!attackMotion || !highlight?.attacker || !highlight.target) return;
    const el = document.querySelector<HTMLElement>(`.unit[data-uid="${highlight.attacker}"]`);
    const to = document.querySelector<HTMLElement>(`.unit[data-uid="${highlight.target}"]`);
    if (!el || !to || typeof el.animate !== 'function') return;
    const a = el.getBoundingClientRect(), b = to.getBoundingClientRect();
    const k = el.offsetWidth ? a.width / el.offsetWidth : 1; // zoom de l'interface (Options)
    const dx = ((b.left + b.width / 2) - (a.left + a.width / 2)) / k, dy = ((b.top + b.height / 2) - (a.top + a.height / 2)) / k;
    // On s'arrête au contact (pas au centre de la cible).
    const len = Math.hypot(dx, dy) || 1, stop = Math.max(0, len - (b.height / k) * 0.55) / len;
    const anim = el.animate([
      { transform: 'translate(0, 0) scale(1.04)' },
      { transform: `translate(${dx * stop}px, ${dy * stop}px) scale(1.08)`, offset: 0.55, easing: 'ease-in' },
      { transform: 'translate(0, 0) scale(1.04)' },
    ], { duration: (fast ? 380 : 600) * animMul * 0.75, easing: 'ease-out' });
    el.style.zIndex = '30';
    anim.onfinish = anim.oncancel = () => { el.style.zIndex = ''; };
    return () => anim.cancel();
  }, [highlight, attackMotion, fast, animMul]);

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
  /** Glisser une carte de la main : on la sélectionne pour que les cases valides s'allument (déposer = jouer). */
  const onDragCard = (uid: number) => {
    if (!humanTurn || game.pending.length || sel?.uid === uid) return;
    if (whyUnplayable(game, uid)) return;
    const ps = playsForHandCard(game, uid);
    if (ps.length === 1 && ps[0]!.type === 'play' && !ps[0]!.target) return; // sans cible : un clic suffit
    setSel({ uid });
    const h = game.players[game.active].hand.find(x => x.uid === uid)!;
    setHint(`${cardName(h.cardId)} : dépose-la sur une case en surbrillance.`);
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

  // Simulation du combat de fin de tour (« pièce à l'œil ») : uniquement le plateau, visible des deux joueurs.
  const preview = useMemo(() => (peek && humanTurn && !game.pending.length ? simulateCombat(game) : null), [peek, humanTurn, game]);
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
      onDragCard={onDragCard}
      onHover={setZoom}
    />
  );

  return (
    <div className={`game${preview ? ' previewing' : ''}`}>
      <header className="topbar">
        <h1>{title ?? 'Ligne de Front'}</h1>
        <div className="actions">
          {weather && <span className={`weather ${weather}`}>{WEATHER_LABEL[weather]}</span>}
          {!watch && !remote && (!human.A || !human.B) && <button type="button" onClick={() => setRevealAI(v => !v)}>{revealAI ? 'Cacher' : 'Révéler'} la main de l’ordinateur</button>}
          <button type="button" onClick={onQuit}>Quitter la partie</button>
        </div>
      </header>

      <PlayerBar game={view} p={top} label={names[top]} active={game.active === top} avatar={avatars?.[top]} where="top" />
      <section className="side side-top">
        <h2 className="hand-title">Main — {names[top]}</h2>
        {handFor(top)}
        <Board game={view} player={top} bottom={false} isTarget={isTarget} isFirstPicked={r => sameSlot(sel?.first, r)} onSlot={onSlot} highlight={highlight} faded={faded} preview={preview?.units} onHover={setZoom} bubbles={bubbles}
          left={<Piles pl={view.players[top]} p={top} onOpenDiscard={() => setDiscardOf(top)} onHover={setZoom} />} isoExtra={<MoralTotal game={view} p={top} />} />
      </section>
      <div className="frontline">ligne de front<span className="version-mark" aria-hidden="true">v {APP_VERSION}</span></div>
      <section className="side side-bottom">
        <Board game={view} player={bottom} bottom isTarget={isTarget} isFirstPicked={r => sameSlot(sel?.first, r)} onSlot={onSlot} highlight={highlight} faded={faded} preview={preview?.units} onHover={setZoom} bubbles={bubbles}
          left={<Piles pl={view.players[bottom]} p={bottom} onOpenDiscard={() => setDiscardOf(bottom)} onHover={setZoom} />} isoExtra={<MoralTotal game={view} p={bottom} />} />
        <div className="controls">
          <button type="button" className={`eye-coin${peek ? ' open' : ''}`} disabled={!humanTurn || !!game.pending.length} onClick={() => setPeek(v => !v)}
            aria-pressed={peek} title={peek ? 'Masquer la simulation du combat' : 'Simuler le combat de fin de tour'}>
            <span className="face closed" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M8 21 Q20 29 32 21" /><path d="M12 24 l-2 4 M20 26 v4 M28 24 l2 4" /></svg></span>
            <span className="face opened" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M6 20 Q20 8 34 20 Q20 32 6 20 Z" /><circle cx="20" cy="20" r="5" /></svg></span>
          </button>
          {preview && <p className="preview-sum" aria-live="polite">{preview.summary}</p>}
          <p className="hint" aria-live="polite">{shown ? 'Résolution du combat…' : hint || (game.over ? '' : humanTurn ? `À ${names[game.active]} de jouer : choisis une carte, ou termine ton tour.` : paused ? '' : `${names[acting]} réfléchit…`)}</p>
          <button type="button" className="primary" disabled={!humanTurn || !!game.pending.length || busy.current} onClick={() => void apply({ type: 'endTurn' })}>Fin du tour</button>
        </div>
        <h2 className="hand-title">Main — {names[bottom]}</h2>
        {handFor(bottom)}
      </section>
      <PlayerBar game={view} p={bottom} label={names[bottom]} active={game.active === bottom} avatar={avatars?.[bottom]} where="bottom" />

      <details className="log" open>
        <summary>Journal</summary>
        <div className="log-list" ref={logRef}>{log.map((l, i) => <div key={i} className={l.cls}>{l.text}</div>)}</div>
      </details>

      <div className="banners" aria-live="polite">
        {banners.map(b => (
          <div key={b.id} className={`banner ${card(b.cardId).faction}`}>
            <div className="b-who">{b.who} joue {card(b.cardId).cardType === 'Leader' ? `un Leader${b.on ? ` sur ${b.on}` : ''}` : 'une tactique'}</div>
            <div className="b-name">{cardName(b.cardId)}</div>
            <div className="b-desc">{cardDesc(b.cardId)}</div>
          </div>
        ))}
      </div>

      {dialogs[0] && !shown && <Dialog title={dialogs[0].title} lines={dialogs[0].lines} onClose={() => setDialogs(d => d.slice(1))} />}

      {!dialogs.length && choice && choice.options && human[choice.player] && !shown && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label={choiceTitle(choice)}>
          <div className={`box${choice.options.some(o => o.cardId) ? ' wide' : ''}`}>
            <p className="b-who">{names[choice.player]}</p>
            <h2>{choiceTitle(choice)}</h2>
            <ChoicePanel choice={choice} onPick={i => { setZoom(null); void apply({ type: 'choose', option: i }); }} onHover={(id, x) => setZoom(id, x, choice.player)} />
          </div>
        </div>
      )}

      {discardOf && <DiscardViewer pl={view.players[discardOf]} p={discardOf} name={names[discardOf]} onClose={() => { setDiscardOf(null); setZoom(null); }} onHover={setZoom} />}

      {zoom && <ZoomCard id={zoom.id} left={zoom.left} variant={artKeyFor(zoom.id, zoom.owner)} />}

      {!dialogs.length && overlay}
      {game.over && !shown && !dialogs.length && !overClosed && renderEnd(game, () => setOverClosed(true))}
    </div>
  );
}
