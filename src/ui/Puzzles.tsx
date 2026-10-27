// Mode puzzle : liste des énigmes, puis une partie figée où il faut atteindre l'objectif en un seul tour.
import { useCallback, useMemo, useState } from 'react';
import { buildPuzzle, puzzleStatus } from '../puzzles/build';
import { PUZZLES } from '../puzzles/puzzles';
import { solvePuzzle } from '../puzzles/solve';
import type { Puzzle } from '../puzzles/types';
import { Ctx } from '../engine/ctx';
import * as GAME from '../engine/game';
import type { Action, GameState, SlotRef } from '../engine/types';
import type { Profile } from '../profile/profile';
import { GameScreen } from './GameScreen';
import { cardName } from './labels';
import { TopBar } from './Screens';

const STARS = ['', '★', '★★', '★★★'];
const DIFF = ['', 'Facile', 'Moyen', 'Difficile'];

export function goalText(pz: Puzzle, s?: GameState): string {
  if (pz.goal.type === 'win') return 'Gagne la partie avant la fin de ton tour.';
  const [zone, idx] = pz.goal.slot.split('.') as [string, string];
  const u = s?.players.B.board[zone as 'avant' | 'arriere']?.[Number(idx)] ?? (zone === 'isole' ? s?.players.B.board.isole : null);
  return `Détruis la cible : ${u ? cardName(u.cardId) : 'le régiment désigné'} (${zone === 'avant' ? 'rangée avant' : zone === 'arriere' ? 'rangée arrière' : 'case isolée'} adverse) avant la fin de ton tour.`;
}

export function PuzzleList({ profile, onPlay, onBack }: { profile: Profile; onPlay: (id: string) => void; onBack: () => void }) {
  const done = new Set(profile.puzzlesDone ?? []);
  return (
    <div className="setup">
      <TopBar title="Puzzles" onBack={onBack} />
      <section className="menu-block">
        <p className="muted small">Une situation figée, un objectif, un seul tour pour l’atteindre : l’adversaire ne joue pas. Chaque puzzle a au moins une solution (vérifiée par le jeu).</p>
        <div className="puzzle-list">
          {PUZZLES.map((pz, i) => (
            <button key={pz.id} type="button" className={`puzzle-item${done.has(pz.id) ? ' done' : ''}`} onClick={() => onPlay(pz.id)}>
              <span className="pz-num">{i + 1}</span>
              <span className="pz-main"><b>{pz.title}</b><small>{goalText(pz, buildPuzzle(pz).state)}</small></span>
              <span className="pz-diff" title={DIFF[pz.difficulty]}>{STARS[pz.difficulty]}</span>
              <span className="pz-done">{done.has(pz.id) ? '✓ Réussi' : ''}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

const slotText = (r?: SlotRef) => (r ? `${r.player === 'A' ? 'ta' : 'la'} ${r.zone === 'avant' ? `case avant ${r.idx + 1}` : r.zone === 'arriere' ? `case arrière ${r.idx + 1}` : 'case isolée'}${r.player === 'B' ? ' adverse' : ''}` : '');

/** Premier coup d'une solution, en clair. */
function hintFor(pz: Puzzle, s: GameState, targetUid: number | null): string {
  // On cherche depuis la position actuelle si elle est encore gagnable, sinon depuis le début.
  const fromHere = solveFrom(pz, s, targetUid);
  const start = buildPuzzle(pz);
  const sol = fromHere ?? solvePuzzle(pz, { maxSolutions: 1 }).solutions[0];
  const base = fromHere ? s : start.state;
  const a = sol?.[0];
  if (!a) return 'Aucune solution trouvée depuis cette position : recommence le puzzle.';
  const prefix = fromHere ? '' : 'Depuis cette position, ce n’est plus possible : recommence. ';
  if (a.type === 'endTurn') return `${prefix}Tout est prêt : finis ton tour.`;
  if (a.type === 'choose') return `${prefix}Choisis : ${base.pending[0]?.options?.[a.option]?.label ?? 'l’option ' + (a.option + 1)}.`;
  const h = base.players.A.hand.find(x => x.uid === a.handUid);
  return `${prefix}Commence par jouer ${h ? cardName(h.cardId) : 'une carte'}${a.target ? ` sur ${slotText(a.target)}` : ''}.`;
}
function solveFrom(pz: Puzzle, s: GameState, targetUid: number | null): Action[] | null {
  // Petit solveur depuis un état quelconque (même principe que solvePuzzle).
  const { applyAction, legalActions } = GAME;
  let found: Action[] | null = null, n = 0;
  const dfs = (st: GameState, path: Action[]) => {
    if (found || ++n > 50_000) return;
    const r = puzzleStatus(pz, st, targetUid);
    if (r === 'won') { found = path; return; }
    if (r === 'lost') return;
    for (const a of legalActions(st)) { const x = applyAction(st, a); if (x.ok) dfs(x.state, [...path, a]); if (found) return; }
  };
  dfs(s, []);
  return found;
}
export function PuzzleGame({ id, profile, update, gameOpts, onBack, onNext }: {
  id: string; profile: Profile; update: (fn: (p: Profile) => void) => void;
  gameOpts: { animMul: number; aiMul: number; bannerMul: number }; onBack: () => void; onNext: (id: string) => void;
}) {
  const pz = PUZZLES.find(p => p.id === id)!;
  const idx = PUZZLES.indexOf(pz);
  const [key, setKey] = useState(1);
  const built = useMemo(() => buildPuzzle(pz), [pz, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const [game, setGame] = useState<GameState>(built.state);
  const [hint, setHint] = useState('');
  const [folded, setFolded] = useState(false);
  const status = puzzleStatus(pz, game, built.targetUid);
  const onGame = useCallback((g: GameState) => {
    setGame(g);
    if (puzzleStatus(pz, g, built.targetUid) === 'won') update(p => { p.puzzlesDone = [...new Set([...(p.puzzlesDone ?? []), pz.id])]; });
  }, [pz, built, update]);
  const restart = () => { setKey(k => k + 1); setHint(''); setGame(buildPuzzle(pz).state); };
  const next = PUZZLES[idx + 1];
  const target = built.targetUid !== null ? new Ctx(game).findUnit(built.targetUid) : null;

  const bubble = status ? (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="box">
        <h2>{status === 'won' ? 'Puzzle réussi !' : 'Raté…'}</h2>
        <p>{status === 'won' ? 'Bien joué : objectif atteint en un seul tour.' : 'L’objectif n’est pas atteint à la fin de ton tour.'}</p>
        <div className="choices row">
          <button type="button" onClick={restart}>Recommencer</button>
          <button type="button" onClick={onBack}>Liste des puzzles</button>
          {status === 'won' && next && <button type="button" className="primary" onClick={() => onNext(next.id)}>Puzzle suivant</button>}
          {status === 'lost' && <button type="button" className="primary" onClick={restart}>Réessayer</button>}
        </div>
      </div>
    </div>
  ) : (
    <aside className={`tuto puzzle-goal${folded ? ' folded' : ''}`} aria-live="polite" aria-label="Objectif du puzzle">
      <header>
        <span className="tuto-count">{STARS[pz.difficulty]}</span>
        <b>{pz.title}</b>
        <button type="button" className="tuto-fold" onClick={() => setFolded(f => !f)} aria-label={folded ? 'Afficher' : 'Réduire'}>{folded ? '▾' : '▴'}</button>
      </header>
      {!folded && <>
        <p className="tuto-task">➜ {goalText(pz, built.state)}</p>
        {target && <p className="pz-target">Cible : {cardName(target.cardId)}, END {target.currentEnd}/{target.maxEnd}, Moral {target.currentMor}/{target.maxMor}.</p>}
        {hint && <p className="pz-hint">💡 {hint}</p>}
        <div className="tuto-nav">
          <button type="button" onClick={() => setHint(hintFor(pz, game, built.targetUid))}>Indice</button>
          <button type="button" onClick={restart}>Recommencer</button>
        </div>
      </>}
    </aside>
  );

  return (
    <GameScreen
      key={`${id}-${key}`}
      {...gameOpts}
      setup={{ seed: `puzzle-${pz.id}`, A: { faction: pz.A.faction, deck: [] }, B: { faction: pz.B.faction, deck: [] } }}
      initialState={built.state}
      names={{ A: 'Toi', B: 'Adversaire' }}
      human={{ A: true, B: true }}
      bottomSide="A"
      title={`Puzzle ${idx + 1} — ${pz.title}`}
      intro={[{ who: 'Puzzle', text: pz.intro }, { who: 'Objectif', text: goalText(pz, built.state) }]}
      onQuit={onBack}
      onGame={onGame}
      overlay={bubble}
      renderEnd={() => null}
      music={['puzzle', 'combat']}
    />
  );
}
