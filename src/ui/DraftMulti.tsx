// Draft à plusieurs en ligne : jusqu'à 4 joueurs humains (un hôte et 3 invités), l'ordinateur complète les places.
// L'hôte tient l'état du draft (src/draft/multi.ts) et l'envoie à chaque changement ; les parties entre deux humains
// se jouent comme en ligne (même graine des deux côtés, seules les actions voyagent, relayées par l'hôte).
import { useCallback, useEffect, useRef, useState } from 'react';
import { CARDS } from '../data/cards';
import { AI_AVATARS, AI_NAMES, deckFaction, FACTION_AVATAR, PACK_SIZE, PACKS, SCHEDULE, standings, winsNeeded, type BestOf } from '../draft/draft';
import { canChangeDeck, changeDeck, choosePick, dropHuman, gameFirst, gameKey, myMatch, newMulti, recordGame, type MultiDraft } from '../draft/multi';
import type { Action, GameState } from '../engine/types';
import { formatEvent } from '../i18n/log.fr';
import { hostRoomMulti, joinRoom, newRoomCode, PROTOCOL, webrtcAvailable, type Link, type NetMsg } from '../net/link';
import { defeatCoins, type Profile } from '../profile/profile';
import { Avatar } from './avatars';
import { CardTile } from './CardTile';
import { Builder, byFactionLevel, countOf, DraftStats, PackGrid, PicksSummary, SortChips, type DraftSort } from './Draft';
import { GameScreen } from './GameScreen';
import { showZoom, zoomProps } from './HoverZoom';
import { cardName, FACTION_LABEL } from './labels';
import { TopBar } from './Screens';

const MAX_GUESTS = 3;
type Player = { name: string; avatar?: string };
type Step = { k: 'menu' } | { k: 'hosting'; code: string; ready: boolean } | { k: 'joining'; code: string } | { k: 'lobby'; code?: string };

export function MultiDraftScreen({ profile, onExit, gameOpts, reward }: {
  profile: Profile;
  onExit: () => void;
  gameOpts: { animMul: number; aiMul: number; bannerMul: number; initialReveal: boolean };
  reward: (r: { win?: boolean; first?: boolean; consolation?: number }) => void;
}) {
  const [step, setStep] = useState<Step>({ k: 'menu' });
  const [role, setRole] = useState<'host' | 'guest' | null>(null);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [bestOf, setBestOf] = useState<BestOf>(1);
  const [players, setPlayers] = useState<Player[]>([]); // salon : l'hôte d'abord
  const [me, setMe] = useState(0);
  const [st, setSt] = useState<MultiDraft | null>(null);
  const [inbox, setInbox] = useState<Record<string, Action[]>>({});
  const [game, setGame] = useState<{ key: string; a: number; b: number } | null>(null);
  const [sort, setSort] = useState<DraftSort>('faction');
  const [editDeck, setEditDeck] = useState(false);
  const stRef = useRef<MultiDraft | null>(null);
  const links = useRef(new Map<number, Link>()); // hôte : siège → liaison
  const hostLink = useRef<Link | null>(null); // invité : liaison vers l'hôte
  const cleanup = useRef<(() => void) | null>(null);
  const sent = useRef(new Map<string, number>());
  const playersRef = useRef<Player[]>([]);

  const myName = profile.name || 'Joueur';
  const broadcast = (m: NetMsg) => links.current.forEach(l => { try { l.send(m); } catch { /* liaison coupée */ } });
  /** Hôte : applique un changement d'état et l'envoie à tous. */
  const update = useCallback((fn: (s: MultiDraft) => MultiDraft) => {
    const cur = stRef.current;
    if (!cur) return;
    const next = fn(cur);
    if (next === cur) return;
    stRef.current = next;
    setSt(next);
    broadcast({ t: 'dstate', st: next });
  }, []);
  const pushAct = (game: string, a: Action) => setInbox(x => ({ ...x, [game]: [...(x[game] ?? []), a] }));

  // ---------- Hôte ----------
  const sendLobby = () => {
    const list = playersRef.current;
    links.current.forEach((l, seat) => { try { l.send({ t: 'dlobby', players: list, you: seat }); } catch { /* rien */ } });
  };
  const host = () => {
    setError('');
    const code = newRoomCode();
    setRole('host');
    playersRef.current = [{ name: myName, avatar: profile.avatar }];
    setPlayers(playersRef.current);
    setStep({ k: 'hosting', code, ready: false });
    cleanup.current = hostRoomMulti(code, () => setStep({ k: 'hosting', code, ready: true }), l => {
      let seat = -1;
      l.onMessage = (m: NetMsg) => {
        if (seat < 0) {
          if (m.t !== 'dhello') return;
          if (m.v !== PROTOCOL) { l.close(); return; }
          if (stRef.current || links.current.size >= MAX_GUESTS) { l.send({ t: 'dfull' }); setTimeout(() => l.close(), 300); return; }
          seat = playersRef.current.length;
          links.current.set(seat, l);
          playersRef.current = [...playersRef.current, { name: m.name.slice(0, 24) || 'Joueur', avatar: m.avatar }];
          setPlayers(playersRef.current);
          sendLobby();
          return;
        }
        if (m.t === 'dpick') update(s => choosePick(s, seat, m.index));
        else if (m.t === 'ddeck') update(s => changeDeck(s, seat, m.deck));
        else if (m.t === 'dresult') update(s => recordGame(s, m.a, m.b, m.winner, m.turns));
        else if (m.t === 'dact') {
          if (m.to === 0) pushAct(m.game, m.a);
          else links.current.get(m.to)?.send(m);
        }
      };
      l.onClose = () => {
        if (seat < 0) return;
        links.current.delete(seat);
        if (stRef.current) { update(s => dropHuman(s, seat)); return; }
        // Salon : on retire le joueur et on renumérote les places.
        const rest = [...links.current.entries()].sort((x, y) => x[0] - y[0]);
        const list: Player[] = [playersRef.current[0]!];
        links.current = new Map();
        rest.forEach(([old, link]) => { list.push(playersRef.current[old]!); links.current.set(list.length - 1, link); });
        playersRef.current = list;
        setPlayers(list);
        sendLobby();
      };
    }, msg => { setError(msg); setStep({ k: 'menu' }); setRole(null); });
  };
  const start = () => {
    const seats = Array.from({ length: 4 }, (_, i) => {
      const p = playersRef.current[i];
      if (p) return { name: p.name, avatar: p.avatar ?? 'empire.2', human: true };
      const k = i - playersRef.current.length;
      return { name: AI_NAMES[k % AI_NAMES.length]!, avatar: AI_AVATARS[k % AI_AVATARS.length]!, human: false };
    });
    const s = newMulti(Date.now(), bestOf, seats);
    stRef.current = s;
    setSt(s);
    setMe(0);
    broadcast({ t: 'dstate', st: s });
  };

  // ---------- Invité ----------
  const join = () => {
    setError('');
    const code = joinCode.trim().toUpperCase().replace(/^LDF-/, '');
    if (code.length < 4) { setError('Entre le code donné par l’hôte.'); return; }
    setRole('guest');
    setStep({ k: 'joining', code });
    cleanup.current = joinRoom(code, l => {
      hostLink.current = l;
      l.onMessage = (m: NetMsg) => {
        if (m.t === 'dlobby') { setPlayers(m.players); setMe(m.you); setStep({ k: 'lobby' }); }
        else if (m.t === 'dfull') { setError('Ce draft est complet ou déjà commencé.'); setStep({ k: 'menu' }); setRole(null); }
        else if (m.t === 'dstate') { stRef.current = m.st; setSt(m.st); }
        else if (m.t === 'dact') pushAct(m.game, m.a);
      };
      l.onClose = () => setError('La connexion avec l’hôte a été coupée.');
      l.send({ t: 'dhello', v: PROTOCOL, name: myName, avatar: profile.avatar });
    }, msg => { setError(msg); setStep({ k: 'menu' }); setRole(null); });
  };

  useEffect(() => () => { cleanup.current?.(); links.current.forEach(l => l.close()); hostLink.current?.close(); }, []);

  // Intentions du joueur local : appliquées directement chez l'hôte, envoyées à l'hôte chez un invité.
  const act = (m: Extract<NetMsg, { t: 'dpick' | 'ddeck' | 'dresult' }>) => {
    if (role === 'host') {
      if (m.t === 'dpick') update(s => choosePick(s, me, m.index));
      else if (m.t === 'ddeck') update(s => changeDeck(s, me, m.deck));
      else update(s => recordGame(s, m.a, m.b, m.winner, m.turns));
    } else hostLink.current?.send(m);
  };
  const sendAct = (m: Extract<NetMsg, { t: 'dact' }>) => {
    if (role === 'host') links.current.get(m.to)?.send(m);
    else hostLink.current?.send(m);
  };

  // Récompenses : matchs gagnés, première place (une seule fois chacun).
  const seen = useRef(new Set<number>());
  const firstDone = useRef(false);
  useEffect(() => {
    if (!st) return;
    st.results.forEach((r, i) => {
      if (seen.current.has(i) || (r.a !== me && r.b !== me)) return;
      seen.current.add(i);
      reward({ win: r.winner === me });
    });
    if (st.phase === 'done' && !firstDone.current) {
      firstDone.current = true;
      if (standings(st)[0]!.seat === me) reward({ first: true });
    }
  }, [st, me, reward]);

  const leave = () => { cleanup.current?.(); links.current.forEach(l => l.close()); hostLink.current?.close(); onExit(); };

  // ---------- Partie en cours ----------
  if (game && st) {
    const { a, b, key } = game;
    const mySide = me === a ? 'A' : 'B';
    const opp = me === a ? b : a;
    const vsAi = !st.seats[opp]!.human;
    const names = { A: st.seats[a]!.name, B: st.seats[b]!.name };
    return (
      <GameScreen
        key={key}
        {...gameOpts}
        setup={{ seed: key, first: gameFirst(st, a, b), A: { faction: deckFaction(st.decks[a]!), deck: st.decks[a]! }, B: { faction: deckFaction(st.decks[b]!), deck: st.decks[b]! } }}
        names={names}
        human={{ A: mySide === 'A', B: mySide === 'B' }}
        bottomSide={mySide}
        avatars={{ A: st.seats[a]!.avatar, B: st.seats[b]!.avatar }}
        remote={vsAi ? undefined : {
          side: mySide === 'A' ? 'B' : 'A',
          send: (x: Action) => { const n = sent.current.get(key) ?? 0; sent.current.set(key, n + 1); sendAct({ t: 'dact', game: key, n, a: x, to: opp }); },
          inbox: inbox[key] ?? [],
        }}
        title={`Draft à plusieurs — ronde ${st.mround + 1} / ${SCHEDULE.length}`}
        onQuit={() => setGame(null)}
        onOver={(g: GameState) => {
          const winner = g.over!.winner === 'A' ? a : b;
          if (vsAi || me === a) act({ t: 'dresult', a, b, winner, turns: g.turn }); // un seul joueur déclare la partie
          if (winner !== me) reward({ consolation: defeatCoins(g.players[g.over!.winner].level) });
        }}
        renderEnd={(g, close) => {
          const won = (g.over!.winner === 'A' ? a : b) === me;
          const lost = defeatCoins(g.players[g.over!.winner].level);
          return (
            <div className="overlay" role="dialog" aria-modal="true">
              <div className="box">
                <h2>{won ? 'Victoire !' : `Victoire : ${names[g.over!.winner]}`}</h2>
                <p>{formatEvent({ type: 'gameOver', winner: g.over!.winner, reason: g.over!.reason }, names)} (tour {g.turn})</p>
                {!won && <p className="coin-gain">{lost ? `+${lost} pièce(s)` : 'Aucune pièce'} <span className="muted small">(niveau adverse − 2)</span></p>}
                <div className="choices row">
                  <button type="button" onClick={close}>Voir le plateau</button>
                  <button type="button" className="primary" onClick={() => setGame(null)}>Retour au tournoi</button>
                </div>
              </div>
            </div>
          );
        }}
      />
    );
  }

  const top = <TopBar title="Draft à plusieurs" onBack={leave} />;

  if (!webrtcAvailable()) {
    return <div className="camp">{top}<p className="warn">Cette page ne permet pas les connexions entre navigateurs. Ouvre le jeu depuis son site (GitHub Pages) pour jouer en ligne.</p></div>;
  }

  // ---------- Avant le draft : créer ou rejoindre, salon ----------
  if (!st) {
    const code = step.k === 'hosting' ? step.code : null;
    return (
      <div className="camp">
        {top}
        <div className="draft-intro">
          <p>Jusqu’à 4 joueurs, chacun sur son navigateur : l’hôte crée un salon et donne le code aux autres. Les places libres sont prises par l’ordinateur. Même déroulé que le draft solo ({PACKS} paquets de {PACK_SIZE} cartes, construction du deck, puis un match contre chaque adversaire).</p>
          {error && <p className="warn">{error}</p>}
          {step.k === 'menu' && (
            <>
              <section className="menu-block">
                <h2>Héberger</h2>
                <div className="choices row left"><button type="button" className="primary" onClick={host}>Créer un salon</button></div>
              </section>
              <section className="menu-block">
                <h2>Rejoindre</h2>
                <div className="join-row">
                  <input className="search" placeholder="Code reçu (ex. K7QM2X)" value={joinCode} onChange={e => setJoinCode(e.target.value)} aria-label="Code du salon" />
                  <button type="button" onClick={join}>Rejoindre</button>
                </div>
              </section>
              <p className="muted small">Tu joues sous le nom de ton profil : <b>{myName}</b>.</p>
            </>
          )}
          {step.k === 'joining' && <p>Connexion au salon {step.code}…</p>}
          {(role === 'host' ? step.k === 'hosting' : step.k === 'lobby') && (
            <section className="menu-block">
              <h2>Salon {code ? <code className="code">{code}</code> : null}</h2>
              {role === 'host' && (step.k === 'hosting' && !step.ready ? <p className="muted">Ouverture du salon…</p> : <p className="muted small">Donne ce code aux autres joueurs (3 au plus).</p>)}
              <ol className="draft-lobby">
                {Array.from({ length: 4 }, (_, i) => {
                  const p = players[i];
                  return <li key={i}>{p ? <><Avatar id={p.avatar ?? 'empire.2'} size={28} /> <b>{p.name}</b>{i === 0 ? ' (hôte)' : ''}{i === me ? ' — toi' : ''}</> : <span className="muted">Place libre : l’ordinateur</span>}</li>;
                })}
              </ol>
              {role === 'host' ? (
                <>
                  <fieldset className="draft-format">
                    <legend>Format des matchs</legend>
                    {([1, 3, 5] as BestOf[]).map(bo => (
                      <label key={bo}><input type="radio" name="mbo" checked={bestOf === bo} onChange={() => setBestOf(bo)} /> Bo{bo}{bo > 1 ? ` (${winsNeeded(bo)} victoires)` : ''}</label>
                    ))}
                  </fieldset>
                  <div className="choices row left"><button type="button" className="primary" onClick={start}>Lancer le draft ({players.length} joueur{players.length > 1 ? 's' : ''} + {4 - players.length} ordinateur{4 - players.length > 1 ? 's' : ''})</button></div>
                </>
              ) : <p className="muted">En attente du lancement par l’hôte…</p>}
            </section>
          )}
        </div>
      </div>
    );
  }

  const waitingFor = (pred: (i: number) => boolean) => st.seats.map((s, i) => (s.human && pred(i) ? s.name : '')).filter(Boolean).join(', ');
  const status = error ? <p className="warn">{error}</p> : null;

  // ---------- Choix des cartes ----------
  if (st.phase === 'pick') {
    const pack = st.packs[me]!;
    const pickNo = PACK_SIZE - pack.length + 1;
    const done = st.chosen[me] !== null;
    return (
      <div className="camp">
        <TopBar title={`Draft à plusieurs — paquet ${st.round + 1} / ${PACKS}, choix ${pickNo} / ${PACK_SIZE}`} onBack={leave} />
        {status}
        <p className="small muted">{done ? `Choix enregistré. En attente de : ${waitingFor(i => st.chosen[i] === null)}.` : `Clique sur une carte pour la garder. Le reste du paquet part ${st.round % 2 === 0 ? 'à ta gauche' : 'à ta droite'}.`}</p>
        <div className="draft-layout">
          <div>
            <SortChips value={sort} set={setSort} />
            <PackGrid pack={pack} sort={sort} disabled={done} chosen={st.chosen[me]} onPick={i => act({ t: 'dpick', index: i })} />
            <h3 className="sub small">Ce paquet</h3>
            <DraftStats ids={pack} />
          </div>
          <PicksSummary picks={st.picks[me]!} sort={sort} />
        </div>
      </div>
    );
  }

  // ---------- Construction ----------
  if (st.phase === 'build') {
    return (
      <div className="camp">
        <TopBar title="Draft à plusieurs — construis ton deck" onBack={leave} />
        {status}
        {st.decks[me]
          ? <p>Deck validé. En attente de : {waitingFor(i => !st.decks[i])}.</p>
          : <Builder picks={st.picks[me]!} onDone={deck => act({ t: 'ddeck', deck })} doneLabel="Valider mon deck" />}
      </div>
    );
  }

  // ---------- Tournoi ----------
  if (editDeck && canChangeDeck(st, me)) {
    return (
      <div className="camp">
        <TopBar title="Draft à plusieurs — modifier ton deck" onBack={() => setEditDeck(false)} />
        <Builder picks={st.picks[me]!} initial={st.decks[me]!} doneLabel="Enregistrer le deck" onCancel={() => setEditDeck(false)}
          onDone={deck => { act({ t: 'ddeck', deck }); setEditDeck(false); }} />
      </div>
    );
  }
  const table = standings(st);
  const mm = myMatch(st, me);
  const bo = st.bestOf ?? 1;
  return (
    <div className="camp">
      <TopBar title={st.phase === 'done' ? 'Draft à plusieurs — classement final' : `Draft à plusieurs — ronde ${st.mround + 1} / ${SCHEDULE.length}`} onBack={leave} />
      {status}
      {st.phase === 'done' && <p className="draft-final">{table[0]!.seat === me ? 'Tu remportes le tournoi !' : `Tournoi terminé : ${st.seats[table[0]!.seat]!.name} l’emporte.`}</p>}
      <table className="draft-table">
        <thead><tr><th>#</th><th>Joueur</th><th>Deck</th><th>Victoires</th><th>Défaites</th></tr></thead>
        <tbody>
          {table.map((t, i) => (
            <tr key={t.seat} className={t.seat === me ? 'me' : undefined}>
              <td>{i + 1}</td>
              <td><Avatar id={st.seats[t.seat]!.human ? st.seats[t.seat]!.avatar : FACTION_AVATAR[deckFaction(st.decks[t.seat]!)]!} size={32} /> {st.seats[t.seat]!.name}{st.seats[t.seat]!.human ? '' : ' 🤖'}</td>
              <td>{FACTION_LABEL[deckFaction(st.decks[t.seat]!)]}</td>
              <td>{t.wins}</td><td>{t.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {st.results.length > 0 && (
        <ul className="draft-results small">
          {st.results.map((r, i) => <li key={i}>Ronde {r.round + 1} : {st.seats[r.a]!.name} contre {st.seats[r.b]!.name} — victoire de <b>{st.seats[r.winner]!.name}</b>{r.score && bo > 1 ? ` (${Math.max(...r.score)}–${Math.min(...r.score)})` : ''}</li>)}
        </ul>
      )}
      {mm && !mm.done && (
        <div className="choices row left">
          <button type="button" className="primary" onClick={() => setGame({ key: gameKey(st, mm.a, mm.b), a: mm.a, b: mm.b })}>
            {`Jouer contre ${st.seats[mm.opp]!.name}${st.seats[mm.opp]!.human ? '' : ' (ordinateur)'}`}{bo > 1 ? ` — match ${mm.a === me ? mm.score[0] : mm.score[1]} – ${mm.a === me ? mm.score[1] : mm.score[0]}, Bo${bo}` : ''}
          </button>
          {st.seats[mm.opp]!.human && <span className="muted small">Ton adversaire doit lancer la partie lui aussi.</span>}
        </div>
      )}
      {mm?.done && st.phase === 'tournament' && <p className="muted">Ton match est joué. En attente des autres matchs de la ronde.</p>}
      {canChangeDeck(st, me) && <div className="choices row left"><button type="button" onClick={() => setEditDeck(true)}>Modifier mon deck avant le prochain adversaire</button></div>}
      {st.decks[me] && (
        <details className="small"><summary>Mon deck ({st.decks[me]!.length} cartes)</summary>
          <div className="draft-list">{Object.entries(countOf(st.decks[me]!)).sort(([x], [y]) => byFactionLevel(x, y)).map(([id, k]) => (
            <div key={id} className={`deck-line ${CARDS[id]!.faction}`} {...zoomProps(id)}><span>{k}</span>{cardName(id)}<small>niv. {CARDS[id]!.niveau}</small></div>
          ))}</div>
        </details>
      )}
    </div>
  );
}
