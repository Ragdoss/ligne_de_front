# Tournoi des decks du mode normal (18/11/2026)

Les 10 decks de src/data/optimizedNormal.ts, 24 parties par paire (chacun commence 12 fois), IA forte des deux côtés (tools/normal-league.ts). V = victoire, D = défaite, par raison de fin de partie.

```
1080 parties
empire-demons     69 % (216) V-lassitude 52%, V-noRegiment 17%, D-lassitude 15%, D-noRegiment 10%, D-emptyDeck 6%
elfe              57 % (216) V-lassitude 38%, V-noRegiment 19%, D-emptyDeck 18%, D-lassitude 16%, D-noRegiment 9%
empire-elfe       57 % (216) V-noRegiment 32%, V-lassitude 25%, D-noRegiment 20%, D-emptyDeck 13%, D-lassitude 10%
elfe-nomades      56 % (216) V-emptyDeck 42%, D-noRegiment 18%, D-lassitude 15%, V-noRegiment 13%, D-emptyDeck 11%, V-lassitude 1%
demons            50 % (216) V-lassitude 31%, D-lassitude 19%, V-noRegiment 19%, D-emptyDeck 16%, D-noRegiment 14%
elfe-demons       50 % (216) V-noRegiment 25%, V-lassitude 25%, D-emptyDeck 22%, D-lassitude 19%, D-noRegiment 9%
demons-nomades    49 % (216) V-emptyDeck 44%, D-noRegiment 22%, D-lassitude 19%, D-emptyDeck 10%, V-noRegiment 5%, V-lassitude 0%
nomades           44 % (216) V-emptyDeck 37%, D-noRegiment 25%, D-lassitude 19%, D-emptyDeck 13%, V-noRegiment 6%
empire            34 % (216) D-lassitude 36%, V-lassitude 27%, D-emptyDeck 20%, D-noRegiment 10%, V-noRegiment 7%, V-emptyDeck 0%
empire-nomades    34 % (216) D-lassitude 34%, V-emptyDeck 29%, D-emptyDeck 23%, D-noRegiment 9%, V-lassitude 3%, V-noRegiment 2%

matrice (ligne bat colonne, %)
                 empire-    elfe empire- elfe-no  demons elfe-de demons- nomades  empire empire-
empire-demons          —      50      50      67      75      54      75      75      88      83
elfe                  50       —      50      46      50      54      63      54      71      75
empire-elfe           50      50       —      33      67      54      58      63      88      50
elfe-nomades          33      54      67       —      58      50      50      58      58      71
demons                25      50      33      42       —      46      50      75      67      67
elfe-demons           46      46      46      50      54       —      46      50      58      58
demons-nomades        25      38      42      50      50      54       —      67      46      71
nomades               25      46      38      42      25      50      33       —      63      71
empire                13      29      13      42      33      42      54      38       —      46
empire-nomades        17      25      50      29      33      42      29      29      54       —

premier joueur gagne 49 %
```

## Essai : +10 END aux régiments Nomades de niveau 1 à 3 (balance/essai-nomades-end10.json)

Mêmes parties (mêmes graines) pour toutes les paires qui comprennent un deck Nomades ; les paires sans Nomades sont reprises du tournoi de base.

```
1080 parties
empire-demons     67 % (216) V-lassitude 55%, D-lassitude 15%, V-noRegiment 12%, D-noRegiment 12%, D-emptyDeck 6%
elfe-nomades      63 % (216) V-emptyDeck 50%, D-lassitude 15%, V-noRegiment 12%, D-emptyDeck 11%, D-noRegiment 11%, V-lassitude 1%
demons-nomades    55 % (216) V-emptyDeck 45%, D-lassitude 20%, D-noRegiment 15%, D-emptyDeck 11%, V-noRegiment 7%, V-lassitude 2%
elfe              51 % (216) V-lassitude 34%, D-emptyDeck 22%, D-lassitude 17%, V-noRegiment 17%, D-noRegiment 10%
empire-elfe       51 % (216) V-noRegiment 27%, V-lassitude 24%, D-noRegiment 20%, D-emptyDeck 19%, D-lassitude 10%
elfe-demons       51 % (216) V-lassitude 27%, V-noRegiment 24%, D-emptyDeck 20%, D-lassitude 19%, D-noRegiment 9%
demons            50 % (216) V-lassitude 35%, D-lassitude 19%, D-emptyDeck 17%, V-noRegiment 15%, D-noRegiment 15%
nomades           48 % (216) V-emptyDeck 42%, D-lassitude 18%, D-emptyDeck 17%, D-noRegiment 17%, V-noRegiment 6%, V-lassitude 1%
empire-nomades    34 % (216) D-lassitude 35%, V-emptyDeck 29%, D-emptyDeck 22%, D-noRegiment 9%, V-lassitude 3%, V-noRegiment 3%
empire            31 % (216) D-lassitude 38%, V-lassitude 24%, D-emptyDeck 22%, D-noRegiment 10%, V-noRegiment 6%, V-emptyDeck 0%

matrice (ligne bat colonne, %)
                 empire- elfe-no demons-    elfe empire- elfe-de  demons nomades empire-  empire
empire-demons          —      58      71      50      50      54      75      71      88      88
elfe-nomades          42       —      38      71      79      54      58      79      67      79
demons-nomades        29      63       —      50      54      58      50      50      79      58
elfe                  50      29      50       —      50      54      50      46      58      71
empire-elfe           50      21      46      50       —      54      67      33      50      88
elfe-demons           46      46      42      46      46       —      54      54      67      58
demons                25      42      50      50      33      46       —      63      71      67
nomades               29      21      50      54      67      46      38       —      63      67
empire-nomades        13      33      21      42      50      33      29      38       —      50
empire                13      21      42      29      13      42      33      33      50       —

premier joueur gagne 52 %
```

## Équilibrage 13 (Nomades) : decks Nomades réoptimisés

Les 4 decks Nomades réoptimisés avec les nouvelles valeurs ; les paires sans Nomades sont reprises du tournoi de base (elles ne contiennent aucune carte modifiée).

```
1080 parties
empire-demons     67 % (216) V-lassitude 50%, V-noRegiment 17%, D-lassitude 15%, D-noRegiment 10%, D-emptyDeck 8%
empire-elfe       58 % (216) V-noRegiment 33%, V-lassitude 25%, D-noRegiment 21%, D-emptyDeck 11%, D-lassitude 10%
elfe-demons       56 % (216) V-lassitude 30%, V-noRegiment 25%, D-lassitude 19%, D-emptyDeck 15%, D-noRegiment 10%, V-emptyDeck 0%
nomades           55 % (216) V-emptyDeck 45%, D-lassitude 19%, D-noRegiment 16%, D-emptyDeck 11%, V-noRegiment 10%
elfe              52 % (216) V-lassitude 33%, D-emptyDeck 19%, D-lassitude 18%, V-noRegiment 18%, D-noRegiment 10%, V-emptyDeck 1%
elfe-nomades      51 % (216) V-emptyDeck 38%, D-noRegiment 21%, D-lassitude 16%, V-noRegiment 12%, D-emptyDeck 12%, V-lassitude 0%
demons            49 % (216) V-lassitude 30%, D-lassitude 19%, V-noRegiment 19%, D-emptyDeck 19%, D-noRegiment 13%
demons-nomades    42 % (216) V-emptyDeck 32%, D-lassitude 23%, D-noRegiment 23%, D-emptyDeck 12%, V-noRegiment 7%, V-lassitude 2%
empire-nomades    38 % (216) V-emptyDeck 26%, D-lassitude 23%, D-noRegiment 20%, D-emptyDeck 19%, V-noRegiment 7%, V-lassitude 5%
empire            32 % (216) D-lassitude 38%, V-lassitude 25%, D-emptyDeck 18%, D-noRegiment 12%, V-noRegiment 7%, V-emptyDeck 0%

matrice (ligne bat colonne, %)
                 empire- empire- elfe-de nomades    elfe elfe-no  demons demons- empire-  empire
empire-demons          —      50      54      54      50      54      75      83      92      88
empire-elfe           50       —      54      42      50      46      67      83      46      88
elfe-demons           46      46       —      63      46      63      54      71      54      58
nomades               46      58      38       —      58      63      54      50      79      50
elfe                  50      50      54      42       —      50      50      50      54      71
elfe-nomades          46      54      38      38      50       —      58      46      63      67
demons                25      33      46      46      50      42       —      58      71      67
demons-nomades        17      17      29      50      50      54      42       —      67      54
empire-nomades         8      54      46      21      46      38      29      33       —      67
empire                13      13      42      50      29      33      33      46      33       —

premier joueur gagne 45 %
```

Retenus pour le menu : les nouveaux decks Nomades (55 % au lieu de 44 %) et Empire + Nomades (38 % au lieu de 34 %) ; Elfes + Nomades et Démons + Nomades gardent leur deck précédent (56 % et 49 %, contre 51 % et 42 % pour les réoptimisés : reports/normal-*-nomades-eq13.json).

## Deck d’essai Basilics + main adverse (decks/nomades-basilics-main.json), équilibrage 13

```
240 parties
empire-demons     88 % (24) V-lassitude 58%, V-noRegiment 29%, D-noRegiment 13%
empire            83 % (24) V-lassitude 63%, V-noRegiment 21%, D-emptyDeck 8%, D-noRegiment 4%, D-lassitude 4%
elfe              83 % (24) V-lassitude 54%, V-noRegiment 29%, D-emptyDeck 13%, D-noRegiment 4%
demons            79 % (24) V-lassitude 54%, V-noRegiment 25%, D-emptyDeck 13%, D-noRegiment 8%
elfe-demons       79 % (24) V-lassitude 42%, V-noRegiment 38%, D-emptyDeck 21%
demons-nomades    79 % (24) V-emptyDeck 46%, V-lassitude 17%, V-noRegiment 17%, D-noRegiment 13%, D-emptyDeck 8%
elfe-nomades      71 % (24) V-emptyDeck 54%, V-lassitude 13%, D-noRegiment 13%, D-lassitude 13%, V-noRegiment 4%, D-emptyDeck 4%
nomades           67 % (24) V-emptyDeck 50%, V-noRegiment 17%, D-emptyDeck 17%, D-lassitude 13%, D-noRegiment 4%
empire-elfe       54 % (24) V-noRegiment 46%, D-noRegiment 42%, V-lassitude 8%, D-emptyDeck 4%
empire-nomades    50 % (24) D-noRegiment 33%, V-emptyDeck 21%, V-lassitude 17%, D-emptyDeck 17%, V-noRegiment 13%
nomades-basilics  27 % (240) D-lassitude 33%, D-noRegiment 24%, D-emptyDeck 17%, V-noRegiment 13%, V-emptyDeck 10%, V-lassitude 3%

```

## Seconde passe (18/11 au soir) : tournoi final, anciens et nouveaux decks côte à côte

Nouvelle passe pour les 6 decks sans Nomades (Uniques jusqu’à 3 exemplaires, adversaires : les decks du mode normal), suffixe -v2 ; deck défausse optimisé depuis celui de Nathan (decks/nomades-defausse-optimise.json). 17 decks, 12 parties par paire.

```
1632 parties
empire-demons     64 % (192) V-lassitude 52%, D-lassitude 18%, D-noRegiment 15%, V-noRegiment 11%, D-emptyDeck 4%, V-emptyDeck 1%
demons-v2         62 % (192) V-lassitude 41%, D-lassitude 27%, V-noRegiment 21%, D-noRegiment 7%, D-emptyDeck 4%
elfe              59 % (192) V-lassitude 40%, D-lassitude 21%, V-noRegiment 19%, D-emptyDeck 11%, D-noRegiment 9%, V-emptyDeck 1%
elfe-demons       57 % (192) V-lassitude 31%, V-noRegiment 26%, D-lassitude 22%, D-emptyDeck 12%, D-noRegiment 8%
demons-nomades    54 % (192) V-emptyDeck 41%, D-noRegiment 22%, D-lassitude 19%, V-noRegiment 10%, D-emptyDeck 5%, V-lassitude 3%
empire-v2         53 % (192) V-lassitude 43%, D-lassitude 24%, D-emptyDeck 15%, V-noRegiment 9%, D-noRegiment 8%
elfe-v2           53 % (192) V-lassitude 36%, D-lassitude 31%, V-noRegiment 16%, D-emptyDeck 9%, D-noRegiment 7%
empire-demons-v2  53 % (192) V-lassitude 42%, D-lassitude 27%, D-noRegiment 14%, V-noRegiment 11%, D-emptyDeck 7%
elfe-demons-v2    52 % (192) D-lassitude 31%, V-lassitude 29%, V-noRegiment 23%, D-emptyDeck 9%, D-noRegiment 8%
nomades           50 % (192) V-emptyDeck 34%, D-lassitude 23%, D-noRegiment 19%, V-noRegiment 15%, D-emptyDeck 8%, V-lassitude 1%
empire-elfe       50 % (192) D-noRegiment 29%, V-lassitude 26%, V-noRegiment 24%, D-lassitude 13%, D-emptyDeck 8%
elfe-nomades      49 % (192) V-emptyDeck 37%, D-noRegiment 22%, D-lassitude 21%, V-noRegiment 13%, D-emptyDeck 7%
demons            45 % (192) D-lassitude 27%, V-lassitude 26%, V-noRegiment 19%, D-noRegiment 18%, D-emptyDeck 10%
empire-elfe-v2    45 % (192) D-lassitude 27%, V-lassitude 26%, D-noRegiment 20%, V-noRegiment 19%, D-emptyDeck 8%
empire-nomades    38 % (192) D-lassitude 29%, V-emptyDeck 26%, D-noRegiment 22%, D-emptyDeck 11%, V-noRegiment 6%, V-lassitude 6%
empire            35 % (192) D-lassitude 44%, V-lassitude 29%, D-emptyDeck 11%, D-noRegiment 10%, V-noRegiment 6%, V-emptyDeck 1%
defausse-opt      32 % (192) D-noRegiment 31%, D-lassitude 29%, V-noRegiment 20%, V-emptyDeck 8%, D-emptyDeck 8%, V-lassitude 4%

```

Retenus : Empire v2 (35 → 53 %) et Démons v2 (45 → 62 %). Les 4 autres gardent leur deck (Elfes 59 contre 53, Empire + Démons 64 contre 53, Elfes + Démons 57 contre 52, Empire + Elfes 50 contre 45).

## Génération du 19/11 après l’équilibrage 14, et decks toutes factions

Nouvelle passe des 10 clés (suffixe -eq14 ; adversaires : decks du mode normal ; une mutation sur deux essaie une carte de l’équilibrage 14) et 3 recherches toutes factions (libre-<deck de départ>, 8 générations). Tournoi : 23 decks, 12 parties par paire.

```
3036 parties
demons            66 % (264) V-lassitude 45%, D-lassitude 25%, V-noRegiment 21%, D-noRegiment 5%, D-emptyDeck 3%
empire-demons-eq14  65 % (264) V-lassitude 56%, D-lassitude 18%, D-noRegiment 9%, V-noRegiment 9%, D-emptyDeck 8%, V-emptyDeck 0%
libre-elfe        65 % (264) V-lassitude 41%, V-noRegiment 23%, D-lassitude 18%, D-noRegiment 9%, D-emptyDeck 8%
empire-demons     64 % (264) V-lassitude 50%, D-lassitude 21%, V-noRegiment 12%, D-noRegiment 11%, D-emptyDeck 4%, V-emptyDeck 2%
demons-eq14       63 % (264) V-lassitude 48%, D-lassitude 31%, V-noRegiment 15%, D-emptyDeck 3%, D-noRegiment 2%
nomades           55 % (264) V-emptyDeck 41%, D-lassitude 20%, V-noRegiment 14%, D-noRegiment 13%, D-emptyDeck 12%, V-lassitude 1%
libre-empire-demons  55 % (264) V-lassitude 33%, D-lassitude 27%, V-noRegiment 22%, D-emptyDeck 9%, D-noRegiment 8%
elfe-demons       52 % (264) V-lassitude 30%, D-lassitude 23%, V-noRegiment 22%, D-emptyDeck 16%, D-noRegiment 9%
elfe              51 % (264) V-lassitude 31%, D-lassitude 22%, D-emptyDeck 21%, V-noRegiment 19%, D-noRegiment 6%, V-emptyDeck 1%
empire-elfe       50 % (264) V-noRegiment 25%, D-noRegiment 25%, V-lassitude 25%, D-emptyDeck 13%, D-lassitude 12%
empire-eq14       48 % (264) V-lassitude 36%, D-emptyDeck 22%, D-lassitude 19%, D-noRegiment 11%, V-noRegiment 11%, V-emptyDeck 1%
libre-nomades     48 % (264) V-emptyDeck 36%, D-lassitude 23%, D-noRegiment 15%, D-emptyDeck 13%, V-noRegiment 11%, V-lassitude 1%
elfe-demons-eq14  47 % (264) D-lassitude 31%, V-lassitude 31%, V-noRegiment 16%, D-emptyDeck 13%, D-noRegiment 10%, V-emptyDeck 0%
elfe-eq14         46 % (264) V-lassitude 31%, D-lassitude 30%, D-emptyDeck 18%, V-noRegiment 14%, D-noRegiment 7%
empire-elfe-eq14  46 % (264) V-lassitude 33%, D-lassitude 29%, D-emptyDeck 18%, V-noRegiment 10%, D-noRegiment 7%, V-emptyDeck 2%
elfe-nomades-eq14  46 % (264) V-emptyDeck 37%, D-lassitude 22%, D-noRegiment 17%, D-emptyDeck 14%, V-noRegiment 8%, V-lassitude 1%
elfe-nomades      45 % (264) V-emptyDeck 36%, D-lassitude 23%, D-noRegiment 16%, D-emptyDeck 15%, V-noRegiment 9%
empire            44 % (264) V-lassitude 31%, D-lassitude 25%, D-emptyDeck 22%, V-noRegiment 11%, D-noRegiment 9%, V-emptyDeck 2%
demons-nomades-eq14  44 % (264) V-emptyDeck 31%, D-lassitude 24%, D-noRegiment 22%, V-noRegiment 10%, D-emptyDeck 10%, V-lassitude 2%
demons-nomades    41 % (264) V-emptyDeck 31%, D-noRegiment 25%, D-lassitude 23%, D-emptyDeck 11%, V-noRegiment 9%, V-lassitude 1%
empire-nomades    39 % (264) V-emptyDeck 26%, D-noRegiment 21%, D-lassitude 21%, D-emptyDeck 19%, V-noRegiment 8%, V-lassitude 5%
nomades-eq14      39 % (264) D-noRegiment 31%, V-emptyDeck 28%, D-lassitude 18%, D-emptyDeck 13%, V-noRegiment 10%
empire-nomades-eq14  34 % (264) D-lassitude 27%, V-emptyDeck 27%, D-noRegiment 23%, D-emptyDeck 16%, V-noRegiment 5%, V-lassitude 2%

```

Ajoutés au menu à côté des anciens (reports/normal-added.json) : Empire + Démons, Empire, Elfes + Nomades et Démons + Nomades du 19/11 (meilleurs que leur ancien deck), et les 3 decks toutes factions.

Cartes de l’équilibrage 14 retenues par les 10 nouveaux decks (exemplaires) : Ralliement d’urgence 5, Cheikh des ossements 3, Héraut impérial 3, Veilleur d’Os 3, Rançonnement 2, puis une fois Officier de relève, Promotion, Capacocha, Volez le ravitaillement, Maximilien, Forgeron de campagne, Maître de Caravane, Puits empoisonné, Brise du Matin, Première Lame.
