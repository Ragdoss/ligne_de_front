// Draft à 4 joueurs contre l'IA : choix des cartes paquet par paquet, construction du deck, puis tournoi en 3 rondes.
import { useMemo, useState } from 'react';
import { CARDS } from '../data/cards';
import {
  AI_AVATARS, AI_NAMES, FACTION_AVATAR, BASICS, buildAiDeck, checkDraftDeck, deckFaction, DECK_MIN, humanGameFirst, newDraft, nextOpponent, PACK_SIZE, PACKS, pickCard,
  recordHumanGame, SCHEDULE, standings, winsNeeded, type BestOf, type DraftState,
} from '../draft/draft';
import { formatEvent } from '../i18n/log.fr';
import { COINS_PER_WIN, type Profile } from '../profile/profile';
import { keyFor } from '../profile/store';
import { Avatar } from './avatars';
import { CardTile } from './CardTile';
import { showZoom, zoomProps } from './HoverZoom';
import { GameScreen } from './GameScreen';
import { cardName, FACTION_LABEL } from './labels';
import { TopBar } from './Screens';

const KEY = 'ligneDeFront.jeu.draft.v1';
/** Bonus de pièces pour la première place du tournoi. */
export const DRAFT_FIRST_BONUS = 10;

function loadDraft(): DraftState | null {
  try { const raw = localStorage.getItem(keyFor(KEY)); return raw ? (JSON.parse(raw) as DraftState) : null; } catch { return null; }
}
function saveDraft(st: DraftState | null): void {
  try { if (st) localStorage.setItem(keyFor(KEY), JSON.stringify(st)); else localStorage.removeItem(keyFor(KEY)); } catch { /* stockage indisponible */ }
}

const FACTION_ORDER = ['empire', 'elfe', 'demons', 'nomades', 'neutre'];
const byFactionLevel = (a: string, b: string) =>
  FACTION_ORDER.indexOf(CARDS[a]!.faction) - FACTION_ORDER.indexOf(CARDS[b]!.faction) || CARDS[a]!.niveau - CARDS[b]!.niveau || cardName(a).localeCompare(cardName(b));
const countOf = (ids: string[]) => { const n: Record<string, number> = {}; for (const id of ids) n[id] = (n[id] ?? 0) + 1; return n; };

function PicksSummary({ picks }: { picks: string[] }) {
  const n = countOf(picks);
  const fac = countOf(picks.map(id => CARDS[id]!.faction));
  const high = picks.filter(id => CARDS[id]!.niveau >= 4).length;
  return (
    <aside className="draft-picks" aria-label="Tes cartes draftées">
      <h2 className="sub">Tes cartes ({picks.length})</h2>
      <p className="small muted">{FACTION_ORDER.filter(f => fac[f]).map(f => `${FACTION_LABEL[f as keyof typeof FACTION_LABEL]} ${fac[f]}`).join(' · ')}{picks.length ? ` · niveau 4-5 : ${high}` : ''}</p>
      <div className="draft-list">
        {Object.keys(n).sort(byFactionLevel).map(id => (
          <div key={id} className={`deck-line ${CARDS[id]!.faction}`} {...zoomProps(id)}><span>{n[id]}</span>{cardName(id)}<small>niv. {CARDS[id]!.niveau}</small></div>
        ))}
      </div>
    </aside>
  );
}

function Builder({ st, onDone }: { st: DraftState; onDone: (deck: string[]) => void }) {
  const picks = st.picks[0]!;
  const have = countOf(picks);
  const [deck, setDeck] = useState<string[]>(() => buildAiDeck(picks));
  const inDeck = countOf(deck);
  const chk = checkDraftDeck(deck, picks);
  const add = (id: string) => setDeck(d => [...d, id]);
  const remove = (id: string) => setDeck(d => { const i = d.lastIndexOf(id); return i < 0 ? d : [...d.slice(0, i), ...d.slice(i + 1)]; });
  const ids = Object.keys(have).sort(byFactionLevel);
  const ctl = (id: string, max: number) => (
    <>
      <button type="button" aria-label={`Retirer ${cardName(id)}`} disabled={!inDeck[id]} onClick={() => remove(id)}>−</button>
      <span className="count">{inDeck[id] ?? 0}{Number.isFinite(max) ? ` / ${max}` : ''}</span>
      <button type="button" aria-label={`Ajouter ${cardName(id)}`} disabled={(inDeck[id] ?? 0) >= max} onClick={() => add(id)}>+</button>
    </>
  );
  return (
    <>
      <div className="draft-check">
        <b>Deck : {chk.total} cartes</b> (au moins {DECK_MIN}) · régiments de niveau 1 : {chk.lvl1} · niveau 4-5 : {chk.high}
        {chk.problems.map(p => <p key={p} className="bad small">{p}</p>)}
        {chk.warnings.map(p => <p key={p} className="small muted">{p}</p>)}
        <div className="choices row left">
          <button type="button" onClick={() => setDeck(buildAiDeck(picks))}>Deck proposé</button>
          <button type="button" onClick={() => setDeck([])}>Vider</button>
          <button type="button" className="primary" disabled={!chk.ok} onClick={() => onDone(deck)}>Valider le deck et lancer le tournoi</button>
        </div>
      </div>
      <h2 className="sub">Tes cartes draftées</h2>
      <div className="camp-grid">{ids.map(id => <CardTile key={id} id={id} dim={!inDeck[id]}>{ctl(id, have[id]!)}</CardTile>)}</div>
      <h2 className="sub">Régiments de base (à volonté)</h2>
      <div className="camp-grid">{BASICS.map(id => <CardTile key={id} id={id} dim={!inDeck[id]}>{ctl(id, Infinity)}</CardTile>)}</div>
    </>
  );
}

export function DraftScreen({ profile, onExit, gameOpts, reward }: {
  profile: Profile;
  onExit: () => void;
  gameOpts: { animMul: number; aiMul: number; bannerMul: number; initialReveal: boolean };
  /** Victoire d'un match (pièces + statistiques) ; `first` = première place finale. */
  reward: (r: { win?: boolean; first?: boolean }) => void;
}) {
  const [st, setSt] = useState<DraftState | null>(() => loadDraft());
  /** Partie en cours ; premier joueur tiré au hasard en début de match, puis en alternance (Bo3, Bo5). */
  const [game, setGame] = useState<{ opp: number; key: number; first: 'A' | 'B' } | null>(null);
  const [bestOf, setBestOf] = useState<BestOf>(1);
  /** Issue de la dernière partie jouée : match terminé ou non, score du match. */
  const [after, setAfter] = useState<{ done: boolean; score: [number, number] } | null>(null);
  const set = (s: DraftState | null) => { saveDraft(s); setSt(s); };
  const names = useMemo(() => [profile.name, ...AI_NAMES], [profile.name]);
  const avatars = [profile.avatar, ...AI_AVATARS.map((a, i) => (st?.decks[i + 1] ? FACTION_AVATAR[deckFaction(st.decks[i + 1]!)]! : a))];

  if (game && st) {
    const opp = game.opp;
    const nm = { A: names[0]!, B: names[opp]! };
    return (
      <GameScreen
        key={game.key}
        {...gameOpts}
        setup={{ seed: `draft-${st.seed}-me-${opp}-${game.key}`, first: game.first, A: { faction: deckFaction(st.decks[0]!), deck: st.decks[0]! }, B: { faction: deckFaction(st.decks[opp]!), deck: st.decks[opp]! } }}
        names={nm}
        human={{ A: true, B: false }}
        avatars={{ A: profile.avatar, B: avatars[opp] }}
        title={`Draft — ronde ${Math.min(3, (st.results.length / 2) + 1)}`}
        onQuit={() => setGame(null)}
        onOver={g => {
          const win = g.over!.winner === 'A';
          const nextSt = recordHumanGame(st, win, g.turn);
          const done = !nextSt.current;
          const score: [number, number] = done ? nextSt.results.filter(r => r.a === 0).at(-1)!.score ?? [win ? 1 : 0, win ? 0 : 1] : nextSt.current!;
          setAfter({ done, score });
          if (done) {
            const first = nextSt.phase === 'done' && standings(nextSt)[0]!.seat === 0;
            reward({ win: score[0] > score[1], first });
          }
          set(nextSt);
        }}
        renderEnd={(g, close) => (
          <div className="overlay" role="dialog" aria-modal="true">
            <div className="box">
              <h2>{g.over!.winner === 'A' ? 'Victoire !' : `Victoire : ${nm.B}`}</h2>
              <p>{formatEvent({ type: 'gameOver', winner: g.over!.winner, reason: g.over!.reason }, nm)} (tour {g.turn})</p>
              {(st.bestOf ?? 1) > 1 && after && <p className="series">Match : {names[0]} {after.score[0]} – {after.score[1]} {nm.B}{after.done ? (after.score[0] > after.score[1] ? ' — match gagné !' : ' — match perdu') : ''}</p>}
              {after?.done && after.score[0] > after.score[1] && <p className="coin-gain">+{COINS_PER_WIN} pièces</p>}
              <div className="choices row">
                <button type="button" onClick={close}>Voir le plateau</button>
                {after && !after.done
                  ? <button type="button" className="primary" onClick={() => setGame({ opp, key: Date.now(), first: humanGameFirst(st) })}>Partie suivante</button>
                  : <button type="button" className="primary" onClick={() => setGame(null)}>Retour au tournoi</button>}
              </div>
            </div>
          </div>
        )}
      />
    );
  }

  const quit = <TopBar title="Draft à 4" onBack={onExit} />;

  if (!st) {
    return (
      <div className="camp">
        {quit}
        <div className="draft-intro">
          <p>Toi et trois adversaires dirigés par l’ordinateur ouvrez chacun un paquet de {PACK_SIZE} cartes. Tu en gardes une, puis tu passes le reste à ton voisin, et ainsi de suite jusqu’à ce que le paquet soit vide. On recommence avec {PACKS} paquets au total : tu repars avec {PACKS * PACK_SIZE} cartes.</p>
          <p>Tu construis ensuite un deck d’au moins {DECK_MIN} cartes avec tes cartes draftées, plus autant de Mercenaires stagiaires que tu veux. Puis tournoi : un match contre chaque adversaire. Chaque match gagné rapporte {COINS_PER_WIN} pièces, la première place {DRAFT_FIRST_BONUS} de plus.</p>
          <fieldset className="draft-format">
            <legend>Format des matchs</legend>
            {([1, 3, 5] as BestOf[]).map(bo => (
              <label key={bo}><input type="radio" name="bo" checked={bestOf === bo} onChange={() => setBestOf(bo)} /> Bo{bo}{bo > 1 ? ` (${winsNeeded(bo)} victoires pour gagner le match)` : ' (une partie)'}</label>
            ))}
          </fieldset>
          <p className="small muted">Toutes les cartes du jeu peuvent sortir, même celles que tu ne possèdes pas. Les cartes draftées ne rejoignent pas ta collection.</p>
          <div className="choices row left"><button type="button" className="primary" onClick={() => set(newDraft(Date.now(), bestOf))}>Commencer un draft</button></div>
        </div>
      </div>
    );
  }

  const abandon = (
    <button type="button" onClick={() => set(null)}>{st.phase === 'done' ? 'Nouveau draft' : 'Abandonner ce draft'}</button>
  );

  if (st.phase === 'pick') {
    const pickNo = PACK_SIZE - st.packs[0]!.length + 1;
    return (
      <div className="camp">
        <TopBar title={`Draft — paquet ${st.round + 1} / ${PACKS}, choix ${pickNo} / ${PACK_SIZE}`} onBack={onExit} right={abandon} />
        <p className="small muted">Clique sur une carte pour la garder. Le reste du paquet part {st.round % 2 === 0 ? 'à ta gauche' : 'à ta droite'}.</p>
        <div className="draft-layout">
          <div className="camp-grid">
            {st.packs[0]!.map((id, i) => (
              <button type="button" key={`${id}-${i}`} className="vn-pick" aria-label={`Garder ${cardName(id)}`} onClick={() => { set(pickCard(st, i)); showZoom(null); }}><CardTile id={id} /></button>
            ))}
          </div>
          <PicksSummary picks={st.picks[0]!} />
        </div>
      </div>
    );
  }

  if (st.phase === 'build') {
    return (
      <div className="camp">
        <TopBar title="Draft — construis ton deck" onBack={onExit} right={abandon} />
        <Builder st={st} onDone={deck => { const s = structuredClone(st); s.decks[0] = deck; s.phase = 'tournament'; set(s); }} />
      </div>
    );
  }

  // Tournoi (en cours ou terminé)
  const table = standings(st);
  const opp = nextOpponent(st);
  const round = st.results.length / 2;
  return (
    <div className="camp">
      <TopBar title={st.phase === 'done' ? 'Draft — classement final' : `Draft — tournoi, ronde ${round + 1} / ${SCHEDULE.length}`} onBack={onExit} right={abandon} />
      {st.phase === 'done' && (
        <p className="draft-final">{table[0]!.seat === 0
          ? `Tu remportes le tournoi ! +${DRAFT_FIRST_BONUS} pièces.`
          : `Tournoi terminé : tu finis ${['premier', 'deuxième', 'troisième', 'quatrième'][table.findIndex(x => x.seat === 0)]}. ${names[table[0]!.seat]} l’emporte.`}</p>
      )}
      <table className="draft-table">
        <thead><tr><th>#</th><th>Joueur</th><th>Deck</th><th>Victoires</th><th>Défaites</th></tr></thead>
        <tbody>
          {table.map((t, i) => (
            <tr key={t.seat} className={t.seat === 0 ? 'me' : undefined}>
              <td>{i + 1}</td>
              <td><Avatar id={avatars[t.seat]!} size={32} /> {names[t.seat]}</td>
              <td>{FACTION_LABEL[deckFaction(st.decks[t.seat]!)]}</td>
              <td>{t.wins}</td><td>{t.losses}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {st.results.length > 0 && (
        <ul className="draft-results small">
          {st.results.map((r, i) => <li key={i}>Ronde {r.round + 1} : {names[r.a]} contre {names[r.b]} — victoire de <b>{names[r.winner]}</b>{r.score && (st.bestOf ?? 1) > 1 ? ` (${Math.max(...r.score)}–${Math.min(...r.score)})` : ''}</li>)}
        </ul>
      )}
      {opp !== null && st.phase === 'tournament' && (
        <div className="choices row left">
          <button type="button" className="primary" onClick={() => setGame({ opp, key: Date.now(), first: humanGameFirst(st) })}>
            {st.current ? `Partie ${st.current[0] + st.current[1] + 1} contre ${names[opp]} (match : ${st.current[0]} – ${st.current[1]})` : `Jouer la ronde ${round + 1} contre ${names[opp]} (${FACTION_LABEL[deckFaction(st.decks[opp]!)]}${(st.bestOf ?? 1) > 1 ? `, Bo${st.bestOf}` : ''})`}
          </button>
        </div>
      )}
      <details className="small"><summary>Mon deck ({st.decks[0]!.length} cartes)</summary>
        <div className="draft-list">{Object.entries(countOf(st.decks[0]!)).sort(([a], [b]) => byFactionLevel(a, b)).map(([id, k]) => (
          <div key={id} className={`deck-line ${CARDS[id]!.faction}`} {...zoomProps(id)}><span>{k}</span>{cardName(id)}<small>niv. {CARDS[id]!.niveau}</small></div>
        ))}</div>
      </details>
    </div>
  );
}
