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
