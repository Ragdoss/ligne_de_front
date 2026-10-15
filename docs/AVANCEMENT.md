# Avancement

## Étape 1 — Moteur de règles (en cours)

Fait :
- Mise en place : main de départ (3 régiments niv. 1 garantis), réserve niv. 4-5, graine.
- Déploiement (rangs avant / arrière / isolé, avant-ou-arrière), coût, niveau requis.
- Pénalité d'apparition (−50 % ATK), ATK proportionnelle à l'Endurance, « arrive prêt ».
- Ciblage : miroir, percée (Moral le plus bas), Distance, arrière sans Distance.
- Combat de fin de tour : ordre d'Initiative (égalité = joueur actif), Lent, sonné, Effrayant, Lancier contre Monté.
- Destructions : lassitude = niveau, Minions, Moral des alliés en cascade, +1 Moral au tueur, défausse, Leader défaussé.
- Moral brisé (≤ 1/3) : coupe les bonus de Leader et les bonus temporaires.
- Comparaison de Moral de fin de tour (niveau max), Maréchal d'Empire, régiments exclus du total.
- Ressources (niveau + reliquat), Paysans, générateurs, niveaux 4/9/16/25, réserve qui rejoint la pioche au niveau 4.
- Pioche 1/2/3 selon le niveau, limite de main 10, défaites (lassitude 50, aucun régiment, pioche vide, régiment vital).
- Leaders : bonus, types requis, un seul Leader par régiment, Leaders sur régiment adverse (Espion Impérial).
- Les 99 cartes des 4 factions (hors carte de scénario « Halte du Convoi ») :
  sacrifices, Effrayant, Pacte de Survie, récupérations dans la défausse, Saboteur, Archéotacticiens…
- File de choix en attente (Vision, Promotion, Tuteur, Rançon d'Âmes, défausses au choix — y compris
  celles que doit faire l'adversaire —, Chasseur de Reliques, Caravane, Rançon du Désert…).
- Journal de partie en français.

À faire :
- Scénarios et campagne (le moteur a déjà les réglages : plateau, seuils, lassitude, régiment vital).

## Étape 2 — IA et simulations en masse (première version faite)

- `src/ai/heuristic.ts` : pour chaque action possible, l'IA simule « jouer puis finir le tour » et garde
  la meilleure position (fonction d'évaluation : régiments, Moral, lassitude, main, ressources).
  Elle n'a aucune règle propre à une carte : toute nouvelle carte est jouée automatiquement.
- `npm run sim -- 100` : 1 600 parties IA contre IA (toutes les paires de factions), rapport dans `reports/`.

Constats de la première simulation (`reports/simulation-v1.md`) :
- L'Empire gagne 85 % de ses parties. Son deck de démonstration contient toutes les récompenses de la
  campagne (63 cartes, beaucoup de Leaders et de soutiens) : à refaire avec des decks comparables.
- Blocage possible (1 % des parties) : main pleine = pioche bloquée = la partie pouvait ne jamais finir.
  **Corrigé (règle de Ragdoss)** : main pleine en début de tour → défausser autant que la pioche, puis piocher.

Deuxième simulation (`reports/simulation-v2.md`, decks Démons et Nomades de Ragdoss, nouvelle règle de main) :
- Plus aucune partie bloquée. Empire 80 %, Démons 42 %, Nomades 40 %, Elfes 38 %.
- Test complémentaire (60 parties par ligne, Empire contre Elfes) : Empire complet 88 %,
  Empire sans ses cartes de niveau 4-5 : 90 %, les deux sans niveau 4-5 : 93 %.
  → l'avantage de l'Empire se joue en début et milieu de partie (coûts et Leaders), pas dans ses grosses cartes.
## Étape 3 — Interface jouable
## Étape 4 — Contenu (campagne, roguelite, multijoueur)

## Équilibrage

Les modifications à tester s'écrivent dans `balance/*.json` ({ carte: { champ: nouvelle valeur } }) et se passent
aux outils avec `--patch` : `npm run sim -- 100 v2 --patch balance/equilibrage-1.json`. Le catalogue n'est pas modifié.

- `balance/equilibrage-1.json` (Ragdoss) : Empire 80 % → 75 % ; Cadets +10,2 → +7,6 ; Lancier +6,4 → +4,2 ;
  Soldat de Kragz +6,2 → +4,7 ; Chevalier de Province inchangé (+4,6 → +4,5) ; Sérénité, Clerc et Saboteur restent en bas.
- `balance/equilibrage-2.json` (équilibrage 1 + nouvelles demandes) : nouveau mot-clé **Pénétration X** (ignore les X premiers
  points d'Armure de la cible) et Sérénité doublée avec un Élémentaux. Empire 76 % ; Cadets +5,7 (toujours 1er) ;
  Frondeur −4,5 → −1,5 ; Archéotacticiens +6,0 → +4,2 ; Fanatiques, Sérénité, Arbalétrier restent en bas.

**Intégré au catalogue** (`npm run integrate -- balance/equilibrage-2.json`) : les valeurs d'équilibrage 2 sont désormais les valeurs officielles.

## Étape 3 — Interface jouable (première version)

- `src/ui/` (React) : écran de départ (contre l'ordinateur, à deux, ou ordinateur contre ordinateur), plateau avec
  statistiques effectives, main triable (coût/type/niveau, glisser-déposer, flèches), cases ciblables en surbrillance,
  tactiques à deux cibles, fenêtres de choix, journal en français, bandeau des tactiques, animation des attaques.
- `npm run dev` pour jouer en local, `npm run build:artifact` pour produire la page autonome `dist/ligne-de-front.html`.

## Campagne (portée du simulateur)

- Moteur : scénarios (`src/engine/scenario.ts`) — plateau de départ, main de départ, niveaux imposés, événements de début de
  tour (ressources, renforts en main jouables sans le niveau, invocations, dialogues), convoi + Halte du Convoi,
  ressources sur comparaison de Moral perdue.
- Données : `src/campaign/scenarios.ts` (les 4 scénarios à l'identique du simulateur), `src/campaign/campaign.ts`
  (pool, deck, récompenses, sauvegarde navigateur + code, règles de l'ordinateur : pas de régiment à partir du tour 6 au
  scénario 1, Changement Tectonique réservé à Sylvain au scénario 4).
- Interface : menu (campagne / partie libre avec decks personnalisés collés), fenêtre de deck, dialogues, récompenses,
  réessayer, fin de campagne. Lien terminé par `#autopilot` : l'ordinateur joue aussi à la place du joueur.
- `npm run difficulty -- 200` : réussite de l'ordinateur jouant l'Empire dans chaque scénario
  (`reports/difficulte-scenarios*.md`). Premiers chiffres (200 parties) : S1 5 %, S2 6 %, S3 11 %, S4 24 % ;
  avant équilibrage : 6 %, 10 %, 11 %, 27 % — l'effet du nerf est dans la marge (±4 points).

## Accueil, collection et économie

- Écran d'accueil : Jouer en local, Jouer en ligne (à venir), Campagne, Ma collection, Options.
- Profil du joueur (`src/profile/profile.ts`, sauvegardé dans le navigateur + code d'export) : collection (3 exemplaires max,
  1 exemplaire de chaque carte au départ), pièces, decks, options, campagnes déjà fusionnées.
- Économie : +5 pièces par victoire contre l'ordinateur ou par scénario réussi ; paquet de 5 cartes à 5 pièces, tiré dans tout le
  pool ; un exemplaire au-delà de 3 rend 1 pièce. Fin de campagne : la collection monte au niveau du pool de campagne (3 max).
- Ma collection : « Mes decks » (liste + créateur de deck avec règles en direct, complétion automatique, import de liste) et
  « Mes cartes » (toutes les cartes, possédées ou non, filtres, ouverture de paquets).
- Règles de deck : 3 exemplaires max, ≥ 3 régiments niv. 1, ≥ 30 cartes niv. 1-3, ≥ 15 cartes niv. 4-5.
- Options : taille de l'interface, durée des animations, temps de réflexion de l'ordinateur, main de l'ordinateur visible,
  toutes les cartes débloquées.

## Camp de campagne et dialogues

- Entre deux combats, la campagne passe par le camp (`src/ui/Camp.tsx`) : décor dessiné par Ragdoss, barre du bas
  Votre deck / Discuter avec les troupes / Continuer au prochain combat / Options / Retour au menu principal.
  Les soldats du décor sont cliquables (discussion). Textes du camp : `src/campaign/campTalks.ts` (provisoires).
- Dialogues façon roman visuel (`src/ui/VnDialog.tsx`), en campagne comme en combat : deux personnages face à face,
  celui qui parle en pleine encre, l'autre estompé ; une réplique à la fois, la précédente estompée au-dessus.
  Portraits par personnage dans `PORTRAITS` (le soldat sert à tous pour l'instant).
- Les récompenses de fin de scénario passent aussi en dialogue : le Commandant présente renforts, promotion et cartes à
  choisir (cartes au centre de la scène, choix dans le bandeau). Répliques personnalisables par scénario (`reward.lines`).
- Jusqu'à 5 personnages sur scène (3e et suivants en retrait à côté des deux premiers).
- Nouveau joueur : aucune carte (la campagne et les paquets en donnent ; option « toutes les cartes débloquées » pour tout essayer).
- Options : « Tout réinitialiser » (collection, pièces, decks, options, campagne), avec confirmation.

## Trois nouvelles campagnes, nouvelles cartes, jeu en ligne (premier jet)

- **Campagnes** (`src/campaign/campaigns.ts`) : Démons « Les Œufs du Dragon » (5 scénarios), Elfes « La Purification » (4),
  Nomades « Les sables ne plient pas » (5), Empire (4). Toutes disponibles ; ordre conseillé du fil rouge affiché dans le menu.
  Une sauvegarde par campagne. Discussions de camp, dialogues, récompenses présentées par le héros de chaque campagne.
- **Mécaniques de scénario** : victoire en tenant jusqu'au tour X (`winAtTurn`), alarme (l'ordinateur ne pose aucun régiment
  avant l'alarme, donnée à un tour fixe ou à sa première perte), météo périodique (tempête de sable, nuit/jour), Libération
  (un régiment adverse au Moral brisé change de camp et rejoint le pool), défaite par pioche vide réglable par joueur,
  régiment isolé de départ.
- **16 nouvelles cartes** : Démons (Diablotins, Gargouille de Cendres, Seigneur des Abysses, Œuf de Dragon → Dragonnet
  Infernal, Dragon Infernal), Nomades (Cavaliers des Dunes, Cheikh des Dunes, Reine des Basilics, Tempête de Sable,
  Oasis cachée), Elfes (Tréant Millénaire, Gardienne de la Lumière, Rite de Purification), Neutres (Mercenaires,
  Ravitaillement, Bannière Déchirée). Dans les paquets comme les autres. Effrayant : la valeur la plus forte compte.
- **Difficulté** (`npm run difficulty -- 40 all`, ordinateur dans le camp du joueur) : de 43-58 % au premier scénario à
  10-18 % au dernier ; `tools/one-scenario.ts` donne le détail par scénario.
- **Jeu en ligne** (`src/net/link.ts`, `src/ui/Online.tsx`) : pair-à-pair WebRTC, le moteur étant déterministe seules les
  actions voyagent. Connexion par code court (service gratuit PeerJS) ou par codes à copier-coller (aucun service externe).
  L'hôte tire au sort qui commence. +5 pièces par victoire. Limites : pas de reconnexion, pas de détection de triche
  (chaque navigateur connaît toute la partie), pas de chat.
- **GitHub Pages** : `.github/workflows/pages.yml` publie le jeu à chaque push (à activer dans les réglages du dépôt).

## Essais et aide en campagne

- Les défaites sont comptées par scénario (sauvegarde de campagne). En bas à droite du camp : « Essai n° X » et, toutes les
  3 défaites sur un même combat, une aide de +1 ressource au départ à choisir (jusqu'à +3). L'aide repart à zéro au scénario suivant.

## Tutoriel

- Accueil → « Tutoriel » : un seul combat guidé contre des Pillards (environ 5 minutes, 13 étapes). Une bulle en haut à droite
  explique le plateau, la main et la ressource, le combat, le Moral, la lassitude et les niveaux, le rang arrière (Distance),
  les Leaders, les tactiques, les mots-clés et les conditions de victoire ; les étapes « à toi de jouer » avancent seules.
  Partie fixée dans `src/campaign/tutorial.ts` (main de départ imposée, renfort et niveau 2 au tour 2) ; textes dans `src/ui/Tutorial.tsx`.
