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
