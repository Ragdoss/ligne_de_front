// Tutoriel : un seul combat guidé (environ 5 minutes) qui présente le plateau, le combat, le Moral, la lassitude,
// les niveaux, les Leaders, les tactiques et les mots-clés. Une bulle suit la partie et avance quand le joueur agit.
import { useCallback, useEffect, useState } from 'react';
import { Ctx } from '../engine/ctx';
import { TUTORIAL_SETUP } from '../campaign/tutorial';
import type { GameState } from '../engine/types';
import { GameScreen } from './GameScreen';

const NAMES = { A: 'Toi (Empire)', B: 'Pillards' };



const INTRO = [
  { who: 'Commandant', text: 'Bienvenue, recrue. Des pillards rôdent près du fort : c’est l’occasion idéale de t’apprendre la guerre.' },
  { who: 'Commandant', text: 'Un seul combat, cinq minutes. Je te guide pas à pas dans la bulle en haut à droite.' },
];

interface Step {
  title: string;
  body: React.ReactNode;
  /** Étape « à toi de jouer » : avance seule quand la condition est remplie. */
  wait?: (g: GameState) => boolean;
  task?: string;
}

const units = (g: GameState) => new Ctx(g).units('A');

const STEPS: Step[] = [
  {
    title: 'Le champ de bataille',
    body: <>
      <p>Ton camp est en bas, celui des Pillards en haut. Chaque camp a une <b>rangée avant</b> (le contact), une <b>rangée arrière</b> (derrière, protégée) et une case <b>isolée</b> à droite, pour les unités spéciales.</p>
      <p>Entre les deux : la <b>ligne de front</b>. En dessous de ton plateau, ta barre de joueur : ressource, niveau, lassitude, Moral total, pioche.</p>
    </>,
  },
  {
    title: 'Ta main et ta ressource',
    body: <>
      <p>Chaque carte a un <b>coût</b> (en ressource) et un <b>niveau</b> requis. Tu commences au niveau 1 avec 1 ressource.</p>
      <p>Au début de chaque tour, tu reçois autant de ressource que ton niveau, <b>plus ce que tu n’as pas dépensé</b> au tour précédent.</p>
      <p>Trois types de cartes : les <b>Régiments</b> (tes troupes), les <b>Leaders</b> (qui renforcent un régiment) et les <b>Tactiques</b> (effet immédiat).</p>
    </>,
  },
  {
    title: 'Déploie un régiment',
    body: <p>Clique sur une <b>Recrue Impériale</b> dans ta main, puis sur une case <b>avant</b> en surbrillance. Face à un ennemi, c’est lui qu’elle attaquera.</p>,
    task: 'Pose une Recrue Impériale à l’avant.',
    wait: g => units(g).length > 0,
  },
  {
    title: 'Lire un régiment',
    body: <>
      <p><b>ATK</b> : les dégâts infligés. <b>END</b> : l’endurance (ses points de vie). <b>ARM</b> : l’armure, retirée de chaque attaque reçue.</p>
      <p><b>INI</b> : l’initiative, qui décide qui frappe en premier. <b>MOR</b> : le Moral, le courage du régiment.</p>
      <p>Un régiment qui vient d’arriver frappe à <b>moitié de son ATK</b> à son premier combat (pénalité d’apparition).</p>
    </>,
  },
  {
    title: 'Termine ton tour',
    body: <p>Clique sur <b>Fin du tour</b>. Un <b>combat</b> a lieu à la fin de <b>chaque</b> tour, le tien comme celui de l’adversaire : tous les régiments en jeu attaquent.</p>,
    task: 'Clique sur « Fin du tour » et regarde les deux combats.',
    wait: g => g.turn >= 2 && g.active === 'A',
  },
  {
    title: 'Le combat',
    body: <>
      <p>Les régiments frappent par <b>initiative</b> décroissante. Un régiment avant attaque celui <b>en face</b> ; si la case est vide, il perce vers la rangée arrière.</p>
      <p>Dégâts = <b>ATK − ARM</b> de la cible. Chaque coup reçu retire aussi <b>1 Moral</b>. Un régiment blessé frappe moins fort.</p>
      <p>Un régiment est détruit quand son <b>END</b> ou son <b>Moral</b> tombe à 0.</p>
    </>,
  },
  {
    title: 'Le Moral',
    body: <>
      <p>À un tiers de son Moral, un régiment a le <b>Moral brisé</b> : il perd les bonus de son Leader et de ses tactiques, et <b>ses mots-clés</b> (même Distance), sauf les mots-clés négatifs comme <b>Lent</b>, qu’il garde.</p>
      <p>Quand un régiment est détruit, <b>tous ses alliés perdent 1 Moral</b>. Une défaite peut en entraîner d’autres !</p>
      <p>Après chaque combat, on compare le <b>Moral total</b> des deux camps : le plus bas gagne de la <b>lassitude</b>.</p>
    </>,
  },
  {
    title: 'Lassitude et niveaux',
    body: <>
      <p>La <b>lassitude</b>, c’est la fatigue de ton armée : régiment détruit (autant que son niveau), comparaison de Moral perdue… À <b>50</b>, tu perds la partie.</p>
      <p>Mais elle te fait aussi <b>monter de niveau</b> (à 4, 9, 16 et 25 points) : plus de ressource, plus de cartes piochées, et des cartes plus puissantes jouables. Une armée éprouvée devient plus redoutable.</p>
      <p>Pour ce tutoriel, tes troupes ont déjà assez de fatigue : te voilà <b>niveau 2</b>, avec 3 ressources de renfort et un Archer en main.</p>
    </>,
  },
  {
    title: 'Le rang arrière',
    body: <p>Les régiments <b>arrière</b> sont protégés tant que l’avant tient. L’<b>Archer Impérial</b> a le mot-clé <b>Distance</b> : de l’arrière comme de l’avant, il frappe le régiment adverse au Moral le plus bas, où qu’il soit.</p>,
    task: 'Pose l’Archer Impérial à l’arrière.',
    wait: g => units(g).some(u => new Ctx(g).slotOf(u.uid)?.zone === 'arriere'),
  },
  {
    title: 'Les Leaders',
    body: <p>Un <b>Leader</b> s’attache à un régiment sans Leader et le renforce tant qu’il n’a pas le Moral brisé. Le <b>Lieutenant</b> (coût 0) donne +5 ATK, +5 INI et +2 Moral.</p>,
    task: 'Attache le Lieutenant à une Recrue : clique-le, puis clique la Recrue.',
    wait: g => units(g).some(u => u.leader),
  },
  {
    title: 'Les tactiques',
    body: <p>Une <b>Tactique</b> produit son effet tout de suite, puis part en défausse. <b>Ralliement</b> rend 3 Moral à un régiment qui porte un Leader (5 s’il a le Moral brisé).</p>,
    task: 'Joue Ralliement sur ta Recrue menée par le Lieutenant.',
    wait: g => !g.players.A.hand.some(h => h.cardId === 'ralliement'),
  },
  {
    title: 'Les mots-clés',
    body: <ul className="tuto-kw">
      <li><b>Distance</b> : de l’arrière comme de l’avant, frappe le Moral le plus bas adverse.</li>
      <li><b>Lent</b> : n’attaque qu’au combat de fin de ton propre tour.</li>
      <li><b>Arrive prêt</b> : pas de pénalité d’apparition.</li>
      <li><b>Effrayant X</b> : chaque coup retire X Moral de plus.</li>
      <li><b>Pénétration X</b> : ignore X points d’armure. (Les mots-clés chiffrés s’additionnent : Effrayant 1 + Effrayant 2 = Effrayant 3.)</li>
      <li><b>Sonné</b> : saute sa prochaine attaque.</li>
      <li><b>Minions</b> : sa mort ne donne pas de lassitude et ne fait pas perdre de Moral aux alliés.</li>
      <li><b>Monté</b> : cavalerie, vulnérable aux Lanciers (+15 ATK contre elle).</li>
      <li><b>Isolé</b> : se pose dans la case isolée ; il n’est jamais attaqué.</li>
    </ul>,
  },
  {
    title: 'Gagner la partie',
    body: <>
      <p>Un joueur perd s’il atteint sa <b>limite de lassitude</b>, s’il n’a <b>plus aucun régiment</b> à la fin de son tour, ou s’il doit piocher dans une <b>pioche vide</b>.</p>
      <p>Les Pillards sont fragiles : leur limite n’est que de 18. Continue à jouer et à finir tes tours jusqu’à la victoire !</p>
    </>,
    task: 'Remporte le combat.',
    wait: g => !!g.over,
  },
];

export function Tutorial({ onExit, onCampaign, gameOpts }: { onExit: () => void; onCampaign: () => void; gameOpts: { animMul: number; aiMul: number; bannerMul: number } }) {
  const [step, setStep] = useState(0);
  const [game, setGame] = useState<GameState | null>(null);
  const [hidden, setHidden] = useState(false);
  const [key, setKey] = useState(1);
  const onGame = useCallback((g: GameState) => setGame(g), []);
  const cur = STEPS[Math.min(step, STEPS.length - 1)]!;

  // Les étapes « à toi de jouer » avancent seules quand l'action est faite (même si elle a été faite en avance).
  useEffect(() => {
    if (!game || step >= STEPS.length - 1) return;
    if (cur.wait?.(game)) setStep(s => s + 1);
  }, [game, step, cur]);

  const bubble = (
    <aside className={`tuto${hidden ? ' folded' : ''}`} aria-live="polite" aria-label="Tutoriel">
      <header>
        <span className="tuto-count">{step + 1} / {STEPS.length}</span>
        <b>{cur.title}</b>
        <button type="button" className="tuto-fold" onClick={() => setHidden(h => !h)} aria-label={hidden ? 'Afficher la bulle' : 'Réduire la bulle'}>{hidden ? '▾' : '▴'}</button>
      </header>
      {!hidden && <>
        <div className="tuto-body">{cur.body}</div>
        {cur.task && <p className="tuto-task">➜ {cur.task}</p>}
        <div className="tuto-nav">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)}>‹ Précédent</button>}
          {!cur.wait && <button type="button" className="go" onClick={() => setStep(step + 1)}>Suivant ›</button>}
          {cur.wait && step < STEPS.length - 1 && <button type="button" onClick={() => setStep(step + 1)}>Passer l’étape</button>}
        </div>
      </>}
    </aside>
  );

  return (
    <GameScreen
      key={key}
      {...gameOpts}
      setup={TUTORIAL_SETUP}
      names={NAMES}
      human={{ A: true, B: false }}
      title="Tutoriel"
      intro={INTRO}
      onQuit={onExit}
      onGame={onGame}
      overlay={game?.over ? null : bubble}
      renderEnd={g => (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="box">
            <h2>{g.over!.winner === 'A' ? 'Tutoriel réussi !' : 'Les Pillards l’emportent…'}</h2>
            <p>{g.over!.winner === 'A'
              ? 'Tu connais les bases : déploiement, combat, Moral, lassitude, niveaux, Leaders, tactiques et mots-clés. La campagne Empire est un bon point de départ ; chaque scénario rappelle ses règles spéciales.'
              : 'Pas grave : c’est en perdant qu’on apprend. Tu peux recommencer le tutoriel ou passer directement aux campagnes.'}</p>
            <div className="choices row">
              <button type="button" onClick={() => { setStep(0); setGame(null); setKey(k => k + 1); }}>Recommencer</button>
              <button type="button" onClick={onExit}>Accueil</button>
              <button type="button" className="primary" onClick={onCampaign}>Aller aux campagnes</button>
            </div>
          </div>
        </div>
      )}
    />
  );
}
