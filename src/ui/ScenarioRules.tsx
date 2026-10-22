// Bulle « Règles du scénario » pendant un combat de campagne (comme la bulle du tutoriel).
// Les règles sont déduites de la configuration du scénario : elles restent justes si un scénario change.
import { useState, useSyncExternalStore } from 'react';
import type { CampaignScenario } from '../campaign/types';
import { CARDS } from '../data/cards';
import { DEFAULT_LEVEL_THRESHOLDS } from '../engine/game';
import type { GameState, PlayerId } from '../engine/types';
import { cardName } from './labels';

const NEVER = 999; // au-delà : la règle est neutralisée

/** Petit magasin pour suivre la partie en cours sans re-rendre tout l'écran parent. */
export function liveGameStore() {
  let g: GameState | null = null;
  const subs = new Set<() => void>();
  return {
    set: (x: GameState) => { g = x; subs.forEach(f => f()); },
    get: () => g,
    subscribe: (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; },
  };
}
export type LiveGame = ReturnType<typeof liveGameStore>;

export interface RuleLine { text: string; tag?: 'neutre' | 'nouveau' }
export interface ScenarioRuleSet { victory: RuleLine[]; defeat: RuleLine[]; special: RuleLine[]; enemy: RuleLine[] }

const turnsList = (first: number, every: number, duration: number) => {
  const out: string[] = [];
  for (let t = first, k = 0; k < 3; t += every, k++) out.push(duration > 1 ? `${t}-${t + duration - 1}` : `${t}`);
  return `${out.join(', ')}…`;
};

/** Règles d'un scénario, du point de vue du joueur (A). */
export function scenarioRules(sc: CampaignScenario): ScenarioRuleSet {
  const victory: RuleLine[] = [], defeat: RuleLine[] = [], special: RuleLine[] = [], enemy: RuleLine[] = [];
  const lass = (p: PlayerId) => sc.defeatLassitude?.[p] ?? 50;
  const noReg = (p: PlayerId) => sc.noRegimentDefeatFromTurn?.[p] ?? 1;
  const emptyDeck = (p: PlayerId) => (typeof sc.emptyDeckDefeat === 'object' ? sc.emptyDeckDefeat[p] ?? true : sc.emptyDeckDefeat ?? true);
  const enemyDeck = sc.B.deckList?.length ?? 0;

  // ----- Victoire -----
  if (sc.mustSurvive?.B) victory.push({ text: `Détruis ${cardName(sc.mustSurvive.B)} : sa chute te donne la victoire.`, tag: 'nouveau' });
  if (sc.winAtTurn?.A) victory.push({ text: `Tiens jusqu’au début du tour ${sc.winAtTurn.A} : tu gagnes.`, tag: 'nouveau' });
  if (sc.convoy?.pid === 'A') victory.push({ text: `Fais sortir ${cardName(sc.convoy.cardId)} par la droite du rang arrière : tu gagnes.`, tag: 'nouveau' });
  if (lass('B') < NEVER) victory.push({ text: `L’adversaire atteint ${lass('B')} de lassitude.` });
  else victory.push({ text: 'L’adversaire ne peut pas perdre par la lassitude.', tag: 'neutre' });
  if (noReg('B') < NEVER) victory.push({ text: noReg('B') > 1 ? `L’adversaire n’a plus aucun régiment (isolé exclu) à la fin de son tour, à partir du tour ${noReg('B')}.` : 'L’adversaire n’a plus aucun régiment (isolé exclu) à la fin de son tour.', tag: noReg('B') > 1 ? 'nouveau' : undefined });
  else victory.push({ text: 'Vider le plateau adverse ne suffit pas à gagner.', tag: 'neutre' });
  if (emptyDeck('B')) victory.push({ text: `L’adversaire doit piocher dans une pioche vide (sa pioche : ${enemyDeck} cartes).` });
  else victory.push({ text: 'L’adversaire ne perd pas si sa pioche est vide.', tag: 'neutre' });

  // ----- Défaite -----
  if (sc.mustSurvive?.A) defeat.push({ text: `${cardName(sc.mustSurvive.A)} est vital : s’il est détruit, tu perds.`, tag: 'nouveau' });
  if (sc.convoy?.pid === 'B') defeat.push({ text: `Si ${cardName(sc.convoy.cardId)} adverse sort du plateau par la droite, tu perds.`, tag: 'nouveau' });
  if (sc.winAtTurn?.B) defeat.push({ text: `Si l’adversaire tient jusqu’au tour ${sc.winAtTurn.B}, tu perds.`, tag: 'nouveau' });
  if (lass('A') >= NEVER) defeat.push({ text: 'Pas de défaite par la lassitude.', tag: 'neutre' });
  else defeat.push({ text: `Tu atteins ${lass('A')} de lassitude${lass('A') !== 50 ? ' (au lieu de 50)' : ''}.`, tag: lass('A') !== 50 ? 'nouveau' : undefined });
  if (noReg('A') >= NEVER) defeat.push({ text: 'Pas de défaite si tu n’as plus de régiment.', tag: 'neutre' });
  else defeat.push({ text: noReg('A') > 1 ? `Tu n’as plus aucun régiment (isolé exclu) à la fin de ton tour (à partir du tour ${noReg('A')}).` : 'Tu n’as plus aucun régiment (isolé exclu) à la fin de ton tour.' });
  if (!emptyDeck('A')) defeat.push({ text: 'Pas de défaite par pioche vide : tu ne pioches simplement plus.', tag: 'neutre' });
  else defeat.push({ text: 'Tu dois piocher dans une pioche vide.' });

  // ----- Règles spéciales -----
  const L = sc.layout;
  if (L && (L.avant !== 4 || L.arriere !== 3)) special.push({ text: `Terrain plus long : ${L.avant} emplacements à l’avant, ${L.arriere} à l’arrière.` });
  if (sc.convoy) {
    const mine = sc.convoy.pid === 'A';
    special.push({ text: `Convoi : ${cardName(sc.convoy.cardId)} (${mine ? 'le tien' : 'adverse'}) avance d’une case vers la droite du rang arrière tous les ${sc.convoy.every} tours, à partir du tour ${sc.convoy.firstTurn}. Il échange sa place avec le régiment qui s’y trouve.${mine ? ' La tactique Halte du Convoi lui fait sauter une avancée.' : ''}` });
  }
  const w = sc.weather;
  if (w?.kind === 'tempete') special.push({ text: `Tempête de sable aux tours ${turnsList(w.first, w.every, w.duration)} : les régiments non Nomades perdent Distance et 20 INI.` });
  if (w?.kind === 'nuit') special.push({ text: `Nuit aux tours ${turnsList(w.first, w.every, w.duration)} : les Démons gagnent +10 ATK. Le reste du temps il fait jour : les Elfes gagnent +15 INI.` });
  if (sc.alarm) special.push({ text: `Alarme : l’adversaire ne pose aucun régiment avant l’alarme. Elle sonne au tour ${sc.alarm.turn}, ou dès qu’il perd un régiment ; des renforts arrivent alors${sc.alarm.resource ? ` avec ${sc.alarm.resource} ressources` : ''}.` });
  if (sc.liberation) special.push({ text: `Libération : un ${sc.liberation.cardIds.map(cardName).join(' ou ')} adverse dont le Moral se brise change de camp, Moral plein. Ceux libérés rejoignent ton pool après la victoire (4 au plus).` });
  if (sc.moralCheckLassitude) special.push({ text: `La comparaison de Moral de fin de tour ne donne que ${sc.moralCheckLassitude} point de lassitude au perdant, quel que soit le niveau.` });
  if (sc.endTurnLassitude?.A) special.push({ text: `Chaque fin de ton tour te coûte ${sc.endTurnLassitude.A} point(s) de lassitude.` });
  if (sc.startLevel?.A) special.push({ text: `Tu commences au niveau ${sc.startLevel.A}.` });
  const th = sc.levelThresholds?.A;
  if (th && th.join() !== DEFAULT_LEVEL_THRESHOLDS.join()) special.push({ text: `Niveaux plus rapides : niveau 3 à ${th[2]}, 4 à ${th[3]}, 5 à ${th[4]} de lassitude.` });
  const mustIds = new Set([sc.mustSurvive?.A, sc.mustSurvive?.B].filter(Boolean));
  for (const [id, ov] of Object.entries(sc.startOverrides ?? {})) if (ov.mor !== undefined && !mustIds.has(id)) special.push({ text: `${cardName(id)} commence avec ${ov.mor} Moral.` });
  if (sc.A.startHand?.length) special.push({ text: `Main de départ : ${sc.A.startHand.map(cardName).join(', ')} en plus de ta main habituelle.` });
  if (sc.deckRules.forced?.length) special.push({ text: `Cartes ajoutées à ton deck : ${[...new Set(sc.deckRules.forced)].map(cardName).join(', ')}.` });

  // ----- Adversaire -----
  if (sc.startLevel?.B) enemy.push({ text: `Commence au niveau ${sc.startLevel.B}.` });
  const thB = sc.levelThresholds?.B;
  if (thB && thB.join() !== DEFAULT_LEVEL_THRESHOLDS.join()) enemy.push({ text: `Monte de niveau plus vite (niveau 3 à ${thB[2]}, 4 à ${thB[3]} de lassitude).` });
  if (sc.endTurnLassitude?.B) enemy.push({ text: `Chaque fin de son tour lui coûte ${sc.endTurnLassitude.B} point(s) de lassitude.` });
  const mlr = sc.moralCheckLostResource?.B;
  if (mlr) enemy.push({ text: `Quand il perd la comparaison de Moral, il gagne ${mlr.base} ressource (${mlr.level3} à partir du niveau 3).` });
  if (sc.aiNoRegimentsFromTurn?.B) enemy.push({ text: `Ne pose plus de régiment à partir du tour ${sc.aiNoRegimentsFromTurn.B}.` });
  const spawns = sc.events.filter(e => e.pid === 'B' && e.spawn?.length);
  if (spawns.length) enemy.push({ text: spawns.length > 3 ? 'Reçoit des renforts presque à chaque tour.' : `Reçoit des renforts au tour ${spawns.map(e => e.turn).join(', ')}.` });
  for (const id of [sc.mustSurvive?.B].filter(Boolean) as string[]) {
    const c = CARDS[id]!;
    if (c.healsMostInjuredEachTurn) enemy.push({ text: `${cardName(id)} soigne son régiment le plus blessé de ${c.healsMostInjuredEachTurn} END à chaque tour.` });
  }
  return { victory, defeat, special, enemy };
}

function Lines({ items }: { items: RuleLine[] }) {
  return (
    <ul className="sr-list">
      {items.map((r, i) => (
        <li key={i} className={r.tag ? `sr-${r.tag}` : undefined}>
          {r.tag === 'neutre' && <span className="sr-tag">neutralisée</span>}
          {r.tag === 'nouveau' && <span className="sr-tag">scénario</span>}
          {r.text}
        </li>
      ))}
    </ul>
  );
}

/** Bulle repliable des règles du scénario, avec la météo du tour en cours. */
export function ScenarioRulesBubble({ sc, live }: { sc: CampaignScenario; live: LiveGame }) {
  const game = useSyncExternalStore(live.subscribe, live.get);
  const [folded, setFolded] = useState(() => { try { return localStorage.getItem('ligneDeFront.jeu.reglesRepliees') === '1'; } catch { return false; } });
  const fold = (v: boolean) => { setFolded(v); try { localStorage.setItem('ligneDeFront.jeu.reglesRepliees', v ? '1' : '0'); } catch { /* rien */ } };
  if (game?.over) return null;
  const r = scenarioRules(sc);
  const turn = game?.turn ?? 1;
  const w = sc.weather;
  const on = w ? turn >= w.first && (turn - w.first) % w.every < w.duration : false;
  const now = !w ? null : w.kind === 'tempete' ? (on ? 'Tempête de sable en ce moment' : 'Pas de tempête ce tour-ci') : on ? 'Il fait nuit (Démons +10 ATK)' : 'Il fait jour (Elfes +15 INI)';
  return (
    <aside className={`tuto sr${folded ? ' folded' : ''}`} aria-label="Règles du scénario">
      <header>
        <b>Règles du scénario</b>
        <span className="tuto-count">Tour {turn}</span>
        <button type="button" className="tuto-fold" onClick={() => fold(!folded)} aria-label={folded ? 'Afficher les règles' : 'Réduire les règles'}>{folded ? '▾' : '▴'}</button>
      </header>
      {!folded && (
        <div className="tuto-body">
          {now && <p className="tuto-task">{now}</p>}
          <h3>Tu gagnes si…</h3><Lines items={r.victory} />
          <h3>Tu perds si…</h3><Lines items={r.defeat} />
          {r.special.length > 0 && <><h3>Règles spéciales</h3><Lines items={r.special} /></>}
          {r.enemy.length > 0 && <><h3>L’adversaire</h3><Lines items={r.enemy} /></>}
        </div>
      )}
    </aside>
  );
}
