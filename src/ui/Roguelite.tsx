// Mode roguelite — prototype de l'acte 1 (03/11/2026). La logique est dans src/roguelite/run.ts.
import { useState } from 'react';
import type { GameState } from '../engine/types';
import {
  addCard, afterFight, applyCards, chooseOption, closeRun, defeatAt, eligible, EVENT_TEXT, eventChoices, fight, isImproved, isTouched, loadMeta, loadRun,
  marketOffers, enemyLabel, xpWon, CHAMPIONS, championOf, shortName, upgradesFor, type ChampionId, newMeta, NODES_PER_ACT, etendardOf, UPGRADES, buyUpgrade, cannotBuy, upgradeLevel, newRun, nextNode, offrandesWon, promotions, registerRun, removeCard, resolveEvent, saveMeta, saveRun, variantId, volunteers,
  LASSITUDE_SHOP, type CardPurpose, type NodeOption, type RunMeta, type RunState, type Step,
} from '../roguelite/run';
import { formatEvent } from '../i18n/log.fr';
import { SCENARIOS } from '../campaign/campaigns';
import { CardTile } from './CardTile';
import { GameScreen } from './GameScreen';
import { showZoom } from './HoverZoom';
import { cardName, FACTION_LABEL } from './labels';
import { ScenarioRulesBubble, type LiveGame } from './ScenarioRules';
import { TopBar } from './Screens';

type GameOpts = { animMul: number; aiMul: number; bannerMul: number; initialReveal: boolean };

const REWARD_LABEL = { or: 'de l’or en plus', essence: 'de l’Essence divine', xp: 'de l’Expérience', offrandes: 'une Offrande', amelioration: 'une amélioration de carte' } as const;
const PURPOSE_TITLE: Record<CardPurpose, string> = {
  retirer: 'Retirer une carte de ton deck', ameliorer: 'Améliorer une carte : efface d’abord ses malus des Titans ; sinon régiment +10 % ATK, END, ARM et Moral, Leader +20 % à ses bonus, Tactique −1 de coût', humain: 'L’entraînement humain : +5 ARM, +2 Moral',
  elfe: 'L’entraînement elfe : coûte 1 de moins, +10 INI', garde: 'Laisser jusqu’à 2 régiments surveiller le camp (ils quittent ton deck)',
};

function optionText(o: NodeOption): { icon: string; title: string; text: string } {
  if (o.kind === 'combat') return { icon: '⚔', title: `Combat : ${enemyLabel(o.deck)}`, text: `Récompenses : de l’or, ${REWARD_LABEL[o.reward]} et 2 volontaires.` };
  if (o.kind === 'miniboss') return { icon: '✦', title: o.boss === 'fragments' ? 'Mini-boss : les Fragments de réalité' : o.boss === 'fracture' ? 'Mini-boss : la Fracture de la réalité' : o.boss === 'convergence' ? 'Mini-boss : la Convergence' : 'Mini-boss : l’Essence de la réalité', text: 'Un adversaire plus fort, une règle spéciale. Récompenses : un Étendard, de l’or, de l’Essence divine, des volontaires, une promotion et une amélioration.' };
  if (o.kind === 'event') return { icon: '❖', title: `Événement : ${EVENT_TEXT[o.id].title}`, text: 'Un choix, sans combat.' };
  if (o.kind === 'marche') return { icon: '⚖', title: 'Marchand', text: '5 offres : cartes, retrait, repos, amélioration, parfois un Étendard.' };
  if (o.titan === 'fracture') return { icon: '☠', title: 'Boss : le Titan de la Fracture', text: 'Le Titan de l’acte 2 : à sa chute, le terrain se scinde et deux Titans apparaissent.' };
  return { icon: '☠', title: 'Boss : le Titan du Glissement', text: 'Le Titan de l’acte 1. Le vaincre ouvre l’acte 2.' };
}

/** Panneau d'Augustus : rappel de la faction et de l'état de la run. */
function ChampionPanel({ run, meta, onDeck }: { run: RunState; meta: RunMeta; onDeck: () => void }) {
  const lim = defeatAt(run);
  return (
    <aside className="rl-champion" aria-label="Champion">
      <div className="rl-crest">{championOf(run.champion).crest}</div>
      <div className="rl-champ-body">
        <b>{championOf(run.champion).name}</b>
        <span className="muted small">Champion : {FACTION_LABEL[championOf(run.champion).faction]} · Acte {run.act}</span>
        <div className="rl-lass" title="Lassitude gardée / seuil de défaite de l’acte">
          <span>Lassitude <b>{run.lassitude}</b> / {lim}</span>
          <span className="rl-bar"><span style={{ width: `${Math.min(100, (100 * run.lassitude) / lim)}%` }} /></span>
        </div>
        <div className="rl-purse">
          <span className="pill">Or <b>{run.gold}</b></span>
          <span className="pill">Essence divine <b>{meta.essence}</b>{run.essence ? ` +${run.essence}` : ''}</span>
          <span className="pill" title="Réserve commune à tous les champions, versée à la fin de chaque combat">Expérience <b>{meta.xp}</b>{run.xp ? ` (dont ${run.xp} cette run)` : ''}</span>
          <span className="pill">Offrandes <b>{meta.offrandes}</b></span>
        </div>
        {(run.etendards ?? []).length > 0 && (
          <div className="rl-etendards">
            <span className="muted small">Étendards</span>
            {run.etendards.map(e => <span key={e} className={`rl-etd${etendardOf(e).risky ? ' risky' : ''}`} title={etendardOf(e).desc}>{etendardOf(e).name}</span>)}
          </div>
        )}
        <button type="button" onClick={onDeck}>Deck : {run.deck.length} cartes</button>
      </div>
    </aside>
  );
}

function Progress({ run }: { run: RunState }) {
  return (
    <ol className="rl-path" aria-label="Progression de l’acte">
      {Array.from({ length: NODES_PER_ACT + 1 }, (_, i) => (
        <li key={i} className={i < run.node ? 'done' : i === run.node ? 'now' : ''}>{i === NODES_PER_ACT ? 'Boss' : i + 1}</li>
      ))}
    </ol>
  );
}

const modBadge = (run: RunState, id: string) => {
  const rc = run.deck.find(c => variantId(c) === id);
  if (!rc) return undefined;
  if (isTouched(rc)) return <span className="rl-mark touched">Touchée par les Titans</span>;
  if (isImproved(rc)) return <span className="rl-mark improved">Améliorée</span>;
  return undefined;
};

/** Choix de cartes du deck (retirer, améliorer, entraînement). */
function CardPicker({ run, purpose, n, optional, onDone }: { run: RunState; purpose: CardPurpose; n: number; optional: boolean; onDone: (uids: number[]) => void }) {
  const list = eligible(run, purpose);
  const need = Math.min(n, list.length);
  const [sel, setSel] = useState<number[]>([]);
  const toggle = (uid: number) => setSel(s => (s.includes(uid) ? s.filter(x => x !== uid) : s.length < n ? [...s, uid] : s));
  return (
    <section className="rl-step">
      <h2 className="sub">{PURPOSE_TITLE[purpose]}</h2>
      <p className="muted">{n > 1 ? `Choisis jusqu’à ${n} cartes.` : 'Choisis une carte.'}</p>
      <div className="choices row left">
        {optional && <button type="button" onClick={() => onDone([])}>Passer</button>}
        <button type="button" className="primary" disabled={optional ? sel.length === 0 : sel.length < need} onClick={() => { showZoom(null); onDone(sel); }}>Valider ({sel.length})</button>
      </div>
      <div className="camp-grid">
        {list.map(c => (
          <button type="button" key={c.uid} className={`vn-pick${sel.includes(c.uid) ? ' on' : ''}`} onClick={() => toggle(c.uid)}>
            <CardTile id={variantId(c)} badge={modBadge(run, variantId(c))} />
          </button>
        ))}
      </div>
    </section>
  );
}

export function RogueliteScreen({ gameOpts, live, onExit }: { gameOpts: GameOpts; live: LiveGame; onExit: () => void }) {
  const [meta, setMetaState] = useState<RunMeta>(() => loadMeta());
  const [run, setRunState] = useState<RunState | null>(() => loadRun());
  const [mode, setMode] = useState<'home' | 'run' | 'deck' | 'game' | 'upgrades'>(() => (loadRun() ? 'run' : 'home'));
  const [gameKey, setGameKey] = useState(0);
  const [notes, setNotes] = useState<string[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [champ, setChamp] = useState<ChampionId>(() => loadRun()?.champion ?? 'augustus');
  const [upChamp, setUpChamp] = useState<ChampionId>(champ);
  const setRun = (r: RunState | null) => { if (r) registerRun(r); saveRun(r); setRunState(r); };
  const setMeta = (m: RunMeta) => { saveMeta(m); setMetaState(m); };

  // ---------- Améliorations ----------
  if (mode === 'upgrades') {
    const section = (cur: 'essence' | 'xp', title: string) => (
      <section className="rl-step">
        <h2 className="sub">{title}</h2>
        <div className="rl-upgrades">
          {upgradesFor(upChamp).filter(u => u.currency === cur).map(u => {
            const lvl = upgradeLevel(meta, u, upChamp);
            const why = cannotBuy(meta, u, upChamp);
            const locked = !!u.unlock && !meta.unlocks.includes(u.unlock.key);
            return (
              <div key={u.id} className={`rl-upg${locked ? ' locked' : ''}`}>
                <b>{u.name}</b> <span className="pill">Niveau {lvl} / {u.max}</span>
                <p className="small">{u.desc}</p>
                {lvl < u.max && <button type="button" disabled={!!why} title={why ?? undefined} onClick={() => setMeta(buyUpgrade(meta, u.id, upChamp))}>{locked ? u.unlock!.text : `${u.cost(lvl)} ${cur === 'essence' ? 'Essence' : 'Expérience'}`}</button>}
              </div>
            );
          })}
        </div>
      </section>
    );
    return (
      <div className="camp rl">
        <TopBar title="Améliorations" onBack={() => setMode('home')} />
        <p className="muted small">Elles s’appliquent à partir de la prochaine run et ne se perdent jamais.</p>
        {section('essence', `Bénédictions divines (Essence divine : ${meta.essence})`)}
        <div className="hand-sort">Champion :{CHAMPIONS.filter(c => !c.unlock || meta.unlocks.includes(c.unlock)).map(c => (
          <button key={c.id} type="button" className={upChamp === c.id ? 'on' : ''} onClick={() => setUpChamp(c.id)}>{shortName(c.id)}</button>
        ))}</div>
        {section('xp', `Améliorations de ${shortName(upChamp)} (Expérience : ${meta.xp})`)}
      </div>
    );
  }

  // ---------- Accueil ----------
  if (mode === 'home' || !run) {
    return (
      <div className="camp rl">
        <TopBar title="Roguelite — prototype" onBack={onExit} />
        <p>Tu es l’instrument des Dieux dans leur guerre contre les Titans. Les Titans corrompent la réalité et dressent les armées des Dieux les unes contre les autres.</p>
        <p className="muted small">Prototype de l’acte 1 : 8 nœuds puis le Titan du Glissement. La lassitude est en partie gardée d’un combat à l’autre ; à {defeatAt({ act: 1 } as RunState)} de lassitude, la run est perdue. L’Essence divine et l’Expérience gagnées s’achètent en améliorations entre les runs. Pas encore d’Étendards.</p>
        <div className="rl-purse">
          <span className="pill">Essence divine <b>{meta.essence}</b></span>
          <span className="pill">Expérience <b>{meta.xp}</b></span>
          <span className="pill">Offrandes <b>{meta.offrandes}</b></span>
          <span className="pill">Runs <b>{meta.runs}</b> · gagnées <b>{meta.wins}</b></span>
        </div>
        <h2 className="sub">Champion</h2>
        <div className="rl-champions">
          {CHAMPIONS.map(c => {
            const open = !c.unlock || meta.unlocks.includes(c.unlock);
            return (
              <button type="button" key={c.id} disabled={!open} className={`rl-champ-card${champ === c.id ? ' on' : ''}${open ? '' : ' locked'}`} onClick={() => { setChamp(c.id); setUpChamp(c.id); }}>
                <div className="rl-crest">{open ? c.crest : '?'}</div><b>{c.name}</b>
                <span className="muted small">{FACTION_LABEL[c.faction]}{open ? '' : ' · à débloquer par un événement'}</span>
              </button>
            );
          })}
          {(['demons', 'nomades'] as const).map(f => (
            <div key={f} className="rl-champ-card locked"><div className="rl-crest">?</div><b>{FACTION_LABEL[f]}</b>
              <span className="muted small">À débloquer par un événement</span></div>
          ))}
        </div>
        <p className="small">Champion désigné : <span className="rl-desig on">{shortName(meta.designated ?? 'augustus')}</span>
          <span className="muted"> — le jouer rapporte +1 Expérience à chaque combat gagné. Un nouveau champion est désigné au hasard après chaque run.</span></p>
        <div className="choices row left">
          <button type="button" onClick={() => setMode('upgrades')}>Améliorations (Essence divine, Expérience)</button>
          {run && !run.over && <button type="button" className="primary" onClick={() => setMode('run')}>Continuer la run (nœud {run.node + 1})</button>}
          <button type="button" className={run && !run.over ? '' : 'primary'} onClick={() => { const r = newRun(String(Date.now()), meta, champ); setRun(r); setNotes([]); setMode('run'); }}>
            {run && !run.over ? 'Abandonner et recommencer' : 'Nouvelle run'}
          </button>
        </div>
        <div className="rl-reset">
          {!confirmReset
            ? <button type="button" onClick={() => setConfirmReset(true)}>Tout réinitialiser</button>
            : <>
                <span className="small">Effacer la run en cours, l’Essence divine, l’Expérience, les Offrandes, les améliorations et les déblocages du mode ?</span>
                <button type="button" className="danger" onClick={() => { setRun(null); setMeta(newMeta()); setNotes([]); setConfirmReset(false); }}>Oui, tout effacer</button>
                <button type="button" onClick={() => setConfirmReset(false)}>Annuler</button>
              </>}
          {!meta.unlocks.includes('champion:elfe') && <button type="button" onClick={() => setMeta({ ...meta, unlocks: [...meta.unlocks, 'champion:elfe'] })}>Débloquer Eldrin (test)</button>}
        </div>
      </div>
    );
  }

  // ---------- Deck ----------
  if (mode === 'deck') {
    return (
      <div className="camp rl">
        <TopBar title={`Deck d’${shortName(run.champion)} (${run.deck.length} cartes)`} onBack={() => setMode('run')} />
        <div className="camp-grid">{run.deck.map(c => <CardTile key={c.uid} id={variantId(c)} badge={modBadge(run, variantId(c))} />)}</div>
      </div>
    );
  }

  // ---------- Combat ----------
  if (mode === 'game' && run.current && run.current.kind !== 'event' && run.current.kind !== 'marche') {
    const { sc, setup } = fight(run, run.current, gameKey);
    const names = { A: shortName(run.champion), B: sc.B.label };
    return (
      <GameScreen
        key={gameKey}
        {...gameOpts}
        setup={setup}
        music={['combat-campagne', 'combat']}
        names={names}
        human={{ A: true, B: false }}
        title={sc.title}
        intro={sc.intro}
        onGame={live.set}
        overlay={<ScenarioRulesBubble sc={sc} live={live} />}
        onQuit={() => setMode('run')}
        renderEnd={(g: GameState, close) => (
          <div className="overlay" role="dialog" aria-modal="true">
            <div className="box">
              <h2>{g.over!.winner === 'A' ? 'Victoire !' : 'Défaite'}</h2>
              <p>{formatEvent({ type: 'gameOver', winner: g.over!.winner, reason: g.over!.reason }, names) ?? ''}</p>
              {Object.keys(g.runMods ?? {}).length > 0 && <p className="muted small">Des cartes ont été touchées par les Titans : leurs malus restent pour toute la run.</p>}
              <div className="choices row">
                <button type="button" onClick={close}>Voir le plateau</button>
                <button type="button" className="primary" onClick={() => {
                  const o = run.current;
                  const next = afterFight(run, g);
                  let m = { ...meta, offrandes: meta.offrandes + (g.over!.winner === 'A' ? offrandesWon(o) : 0), xp: meta.xp + xpWon(run, next) };
                  if (next.over) m = closeRun(m, next);
                  setMeta(m); setRun(next); setMode('run');
                }}>Continuer</button>
              </div>
            </div>
          </div>
        )}
      />
    );
  }

  // ---------- Run ----------
  const step: Step | undefined = run.steps[0];
  const doneStep = (r: RunState, extra: string[] = []) => {
    const next = structuredClone(r);
    next.steps.shift();
    setNotes(n => [...n, ...extra]);
    if (next.relaunch && !next.steps.length) { next.relaunch = false; setRun(next); return; } // Incorruptible : on rejoue le combat
    if (!next.steps.length && !next.over && next.current) { setRun(nextNode(next)); setNotes([]); return; }
    setRun(next);
  };
  let body: React.ReactNode;
  if (run.over && !step) {
    body = (
      <section className="rl-step">
        <h2 className="sub">{run.over.won ? 'Run gagnée !' : 'Run perdue'}</h2>
        <p>{run.over.text}</p>
        <p className="muted">L’Essence divine (+{run.essence}) est gardée pour les prochaines runs ; l’Expérience (+{run.xp}) a été versée à la fin de chaque combat.</p>
        <div className="choices row left"><button type="button" className="primary" onClick={() => { setRun(null); setMode('home'); }}>Retour à l’accueil du mode</button></div>
      </section>
    );
  } else if (step?.kind === 'resume') {
    body = (
      <section className="rl-step">
        <h2 className="sub">{step.title}</h2>
        {step.lines.map((l, i) => <p key={i}>{l}</p>)}
        <div className="choices row left"><button type="button" className="primary" onClick={() => doneStep(run)}>Continuer</button></div>
      </section>
    );
  } else if (step?.kind === 'volontaires') {
    const opts = volunteers(run, step.round);
    body = (
      <section className="rl-step">
        <h2 className="sub">Volontaires ({step.round + 1} / 2) : une carte rejoint ton deck</h2>
        <div className="camp-grid">
          {opts.map(id => <button type="button" key={id} className="vn-pick" onClick={() => { showZoom(null); const n = structuredClone(run); addCard(n, id); doneStep(n, [`${cardName(id)} rejoint ton deck.`]); }}><CardTile id={id} /></button>)}
        </div>
        <div className="choices row left"><button type="button" onClick={() => doneStep(run)}>Personne cette fois</button></div>
      </section>
    );
  } else if (step?.kind === 'etendard') {
    body = (
      <section className="rl-step">
        <h2 className="sub">Un Étendard rejoint l’armée d’{shortName(run.champion)}</h2>
        <p className="muted">Son effet dure toute la run.</p>
        <div className="rl-options">
          {step.choices.map(id => {
            const e = etendardOf(id);
            return (
              <button type="button" key={id} className={`rl-option${e.risky ? ' risky' : ''}`} onClick={() => { const n = structuredClone(run); n.etendards = [...(n.etendards ?? []), id]; doneStep(n, [`Étendard : ${e.name}.`]); }}>
                <span className="rl-icon" aria-hidden="true">⚑</span><b>{e.name}</b><span className="small">{e.desc}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  } else if (step?.kind === 'promotion') {
    const offers = promotions(run);
    body = (
      <section className="rl-step">
        <h2 className="sub">Promotion : une carte de ton deck contre une de niveau supérieur</h2>
        <div className="rl-promos">
          {offers.map(o => {
            const rc = run.deck.find(c => c.uid === o.uid)!;
            return (
              <button type="button" key={o.uid} className="promo-pair" onClick={() => { showZoom(null); const n = structuredClone(run); removeCard(n, o.uid); addCard(n, o.to); doneStep(n, [`${cardName(rc.id)} est promu en ${cardName(o.to)}.`]); }}>
                <CardTile id={variantId(rc)} /><span className="promo-arrow">→</span><CardTile id={o.to} />
              </button>
            );
          })}
        </div>
        <div className="choices row left"><button type="button" onClick={() => doneStep(run)}>Personne cette fois</button></div>
      </section>
    );
  } else if (step?.kind === 'cartes') {
    body = <CardPicker key={`${run.node}-${run.steps.length}`} run={run} purpose={step.purpose} n={step.n} optional={step.optional} onDone={uids => { const n = structuredClone(run); const out = applyCards(n, step.purpose, uids); doneStep(n, out); }} />;
  } else if (step?.kind === 'evenement') {
    const ev = EVENT_TEXT[step.id];
    body = (
      <section className="rl-step">
        <h2 className="sub">{ev.title}</h2>
        <p>{ev.text}</p>
        <div className="vn-choices rl-choices">
          {eventChoices(run, meta, step.id, step.second).map(ch => (
            <button type="button" key={ch.id} className="vn-choice" disabled={!!ch.disabled} title={ch.disabled} onClick={() => {
              const n = structuredClone(run);
              const m = structuredClone(meta);
              n.steps.shift();
              const out = resolveEvent(n, m, step.id, ch.id);
              if (out.length) n.steps.unshift({ kind: 'resume', title: ev.title, lines: out });
              setMeta(m);
              if (!n.steps.length) { setRun(nextNode(n)); setNotes([]); } else setRun(n);
            }}>{ch.label}{ch.disabled ? ` (${ch.disabled})` : ''}</button>
          ))}
        </div>
      </section>
    );
  } else if (step?.kind === 'marche') {
    const offers = marketOffers(run, meta, step.gold0 ?? run.gold);
    const buy = (i: number) => {
      const o = offers[i]!;
      const n = structuredClone(run);
      if (o.kind === 'benediction') {
        setMeta({ ...meta, offrandes: meta.offrandes - o.price, unlocks: [...meta.unlocks, o.benediction!] });
        setNotes(x => [...x, `Bénédiction débloquée : ${UPGRADES.find(u => u.id === o.benediction)!.name} (à acheter avec l’Essence divine entre les runs).`]);
      } else n.gold -= o.price;
      (n.steps[0] as Extract<Step, { kind: 'marche' }>).bought.push(i);
      if (o.kind === 'etendard') { n.etendards = [...(n.etendards ?? []), o.etendard!]; setNotes(x => [...x, `Étendard : ${etendardOf(o.etendard!).name}.`]); }
      if (o.kind === 'carte') { addCard(n, o.cardId!); setNotes(x => [...x, `${cardName(o.cardId!)} rejoint ton deck.`]); }
      if (o.kind === 'lassitude') { n.lassitude = Math.max(0, n.lassitude - LASSITUDE_SHOP); setNotes(x => [...x, `Lassitude −${LASSITUDE_SHOP}.`]); }
      if (o.kind === 'retirer') n.steps.unshift({ kind: 'cartes', purpose: 'retirer', n: 1, optional: false });
      if (o.kind === 'ameliorer') n.steps.unshift({ kind: 'cartes', purpose: 'ameliorer', n: 1, optional: false });
      setRun(n);
    };
    const label = (o: (typeof offers)[number]) => o.kind === 'carte' ? `Acheter ${cardName(o.cardId!)}` : o.kind === 'retirer' ? 'Retirer une carte de ton deck' : o.kind === 'lassitude' ? `Baisser ta lassitude de ${LASSITUDE_SHOP}` : o.kind === 'etendard' ? `Étendard : ${etendardOf(o.etendard!).name} — ${etendardOf(o.etendard!).desc}` : o.kind === 'benediction' ? `Débloquer la bénédiction « ${UPGRADES.find(u => u.id === o.benediction)!.name} » : ${UPGRADES.find(u => u.id === o.benediction)!.desc}` : 'Améliorer une carte';
    body = (
      <section className="rl-step">
        <h2 className="sub">Le marchand</h2>
        <p className="muted">Chaque offre ne s’achète qu’une fois. Tu as {run.gold} or.</p>
        <div className="rl-market">
          {offers.map((o, i) => {
            const done = step.bought.includes(i);
            return (
              <div key={i} className={`rl-offer${done ? ' sold' : ''}`}>
                {o.cardId && <CardTile id={o.cardId} />}
                <b>{label(o)}</b>
                <button type="button" disabled={done || (o.kind === 'benediction' ? meta.offrandes < o.price || meta.unlocks.includes(o.benediction!) : run.gold < o.price) || (o.kind === 'lassitude' && run.lassitude === 0)} onClick={() => buy(i)}>{done ? 'Acheté' : o.kind === 'benediction' ? `${o.price} Offrandes` : `${o.price} or`}</button>
              </div>
            );
          })}
        </div>
        <div className="choices row left"><button type="button" className="primary" onClick={() => doneStep(run)}>Quitter le marchand</button></div>
      </section>
    );
  } else if (run.current && !step) {
    body = (
      <section className="rl-step">
        <h2 className="sub">{optionText(run.current).title}</h2>
        <div className="choices row left"><button type="button" className="primary" onClick={() => { setGameKey(Date.now()); setMode('game'); }}>Livrer le combat</button></div>
      </section>
    );
  } else {
    body = (
      <section className="rl-step">
        <h2 className="sub">{run.node === 0 ? 'Ta route commence' : 'Où aller ensuite ?'}</h2>
        <div className="rl-options">
          {run.options.map((o, i) => {
            const t = optionText(o);
            return (
              <button type="button" key={i} className={`rl-option ${o.kind}`} onClick={() => {
                const next = chooseOption(run, meta, i);
                setRun(next);
                if (next.current && next.current.kind !== 'event' && next.current.kind !== 'marche') { setGameKey(Date.now()); setMode('game'); }
              }}>
                <span className="rl-icon" aria-hidden="true">{t.icon}</span>
                <b>{t.title}</b>
                <span className="muted small">{t.text}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }
  return (
    <div className="camp rl">
      <TopBar title={`Roguelite — Acte ${run.act}, nœud ${Math.min(run.node + 1, NODES_PER_ACT + 1)}`} onBack={() => setMode('home')} />
      <div className="rl-layout">
        <ChampionPanel run={run} meta={meta} onDeck={() => setMode('deck')} />
        <div className="rl-main">
          <Progress run={run} />
          {notes.length > 0 && <div className="rl-notes">{notes.map((n, i) => <p key={i} className="small">{n}</p>)}</div>}
          {body}
        </div>
      </div>
    </div>
  );
}
