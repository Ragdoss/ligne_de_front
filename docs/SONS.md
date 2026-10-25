# Sons et musiques

Le jeu joue un son quand il trouve un fichier au bon nom ; un fichier absent est simplement ignoré. On peut donc ajouter
les sons un par un, sans toucher au code. Code : `src/ui/sound.ts`.

## Où déposer les fichiers

- **Effets sonores** : `src/ui/assets/sons/`
- **Musiques** : `src/ui/assets/musiques/`

Formats : `.ogg` (de préférence) ou `.mp3` (`.wav` et `.m4a` acceptés pour les effets). Noms en minuscules, sans accents.

- **Variantes** : `attaque-1.ogg`, `attaque-2.ogg`, `attaque-3.ogg`… sont toutes des sons « attaque », tirés au hasard
  (évite la répétition). Même principe pour les musiques (`combat-1.ogg`, `combat-2.ogg`).
- **Taille** : effets courts (0,2 à 1,5 s), mono, 64 à 96 kb/s → 5 à 30 Ko chacun. Musiques en boucle, 2 à 4 min,
  stéréo 96 à 128 kb/s → 2 à 4 Mo chacune. La page publiée ne charge un fichier qu'au moment de le jouer, mais la version
  hors ligne (un seul fichier HTML) contient tout : rester raisonnable.
- **Volume** : normaliser les effets entre eux (environ −16 LUFS), la musique un peu plus bas ; les réglages de volume
  sont dans les Options (effets, musique, couper le son).
- Les navigateurs bloquent tout son avant le premier clic du joueur : la musique de l'accueil démarre au premier clic.

## Effets sonores

Pour chaque événement, le jeu essaie les noms dans l'ordre et joue le premier qui existe.

| Fichier | Quand |
|---|---|
| `clic` | clic sur un bouton de l'interface |
| `test` | relâcher le réglage de volume des effets dans les Options (sinon `clic`) |
| `deploiement` | un régiment est posé (carte jouée, ou jeton / régiment créé par un effet) |
| `tactique` | une Tactique est jouée |
| `leader` | un Leader est attaché |
| `carte-<id>` | une carte précise est jouée (remplace `deploiement` / `tactique` / `leader`), ex. `carte-dragon_infernal` |
| `combat` | début du combat |
| `attaque` | un régiment attaque (au moment où il s'élance) |
| `attaque-distance` | un régiment à Distance attaque (sinon `attaque`) |
| `attaque-<id>` | attaque d'un régiment précis, ex. `attaque-forteresse` |
| `impact` | l'attaque fait des dégâts |
| `bloque` | l'attaque est entièrement absorbée par l'armure (sinon `impact`) |
| `destruction` | un régiment est détruit (Endurance à 0) |
| `fuite` | un régiment est détruit par le Moral (sinon `destruction`) |
| `destruction-<id>` | destruction d'un régiment précis |
| `destruction-leader` | un Leader est détruit (sinon `destruction`) |
| `moral` | un régiment perd du Moral par un effet (Effrayant, Terreur, perte d'un allié…) ; la perte de Moral d'une attaque normale est dans `impact` |
| `soin` | un régiment regagne de l'Endurance ou du Moral |
| `sonne` | un régiment est sonné |
| `sacrifice` | un régiment est sacrifié |
| `lassitude` | un joueur gagne de la lassitude |
| `niveau` | un joueur monte de niveau |
| `pioche` | un joueur pioche |
| `defausse` | une carte est défaussée |
| `tour` | début d'un tour |
| `victoire` / `defaite` | fin de la partie, du point de vue du joueur de l'écran (à deux sur le même écran : `victoire`) |
| `effet-<clé>` | effet particulier d'une carte, ex. `effet-mirage`, `effet-dryade` (les clés sont les `key` des événements `effect` dans src/engine) |

Plusieurs sons d'une même action se suivent avec un léger décalage, chacun une seule fois ; pendant le combat, chaque
attaque a son son d'élan puis d'impact, calés sur l'animation.

## Musiques

Chaque écran demande une liste de morceaux, du plus précis au plus général ; le premier qui existe est joué en boucle,
avec un fondu au changement d'écran. Sans aucun fichier de musique, le jeu reste silencieux.

| Écran | Morceaux essayés |
|---|---|
| Accueil, options, parties locales et en ligne (menus), choix de campagne | `menu` |
| Collection, paquets, decks | `collection`, `menu` |
| Draft (choix des cartes) | `draft`, `menu` |
| Camp de campagne (entre deux combats) | `camp`, `menu` |
| Victoire et fin de campagne | `victoire`, `camp`, `menu` |
| Toute partie (locale, en ligne, draft, tutoriel) | `combat` |
| Partie de campagne | `scenario-<id du scénario>`, `combat-<id de la campagne>`, `combat-campagne`, `combat` |

Identifiants : campagnes `empire`, `demons`, `elfes`, `nomades` ; scénarios `d1`…`d5` (Les Œufs), `e1`…`e4`
(La Purification), `n1`…`n5` (Les Sables), etc. (champ `id` dans `src/campaign/*.ts`). Ex. `scenario-e4.ogg` pour
« Le portail des Abysses », `combat-nomades.ogg` pour tous les combats de la campagne des Sables.

## Publier

1. Déposer les fichiers dans les dossiers ci-dessus, avec les bons noms.
2. `npm test` puis `npx vite build --mode web` : les sons sont copiés dans `dist-web/img/` avec les images.
3. Commit et push (`git pull --rebase --autostash origin main` avant) ; GitHub Pages se met à jour tout seul. Pour
   l'artifact, publier `dist-web/index.html` avec les nouveaux fichiers de `dist-web/img/` (même procédure que les
   illustrations, docs/ILLUSTRATIONS.md).
