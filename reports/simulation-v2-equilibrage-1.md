# Rapport de simulation

Modifications testées (`balance/equilibrage-1.json`) :

- cadets_academie.cout : 3 → 4
- lancier_emp.atk : 15 → 12
- lancier_emp.arm : 5 → 4
- lancier_emp.bonusVsMounted : null → 15
- soldat_kragz.atk : 10 → 9
- soldat_kragz.arm : 5 → 4
- chevalier_prov.atk : 15 → 14
- chevalier_prov.arm : 15 → 13
- serenite_foret.cout : 2 → 1
- clerc_foret.cout : 3 → 2
- saboteur_nomade.atk : 0 → 1
- saboteur_nomade.end : 20 → 21

1600 parties IA contre IA (100 par match-up, graine « v2 »), 166 s.

## Taux de victoire par faction (hors miroirs)

| Faction | Parties | Victoires |
|---|---|---|
| Empire | 600 | 75 % |
| Elfes | 600 | 39 % |
| Démons | 600 | 44 % |
| Nomades | 600 | 42 % |

## Match-ups (victoires du joueur de la ligne, qui commence)

| | Empire | Elfes | Démons | Nomades |
|---|---|---|---|---|
| **Empire** | — | 76 % | 60 % | 75 % |
| **Elfes** | 15 % | — | 41 % | 49 % |
| **Démons** | 20 % | 40 % | — | 49 % |
| **Nomades** | 26 % | 53 % | 47 % | — |

## Déroulement

- Durée moyenne (parties terminées) : 10.1 tours.
- Le premier joueur gagne 48 % des parties.
- Fins de partie : lassitude 85 %, plus de régiment 12 %, pioche vide 4 %.

## Cartes (parties où la carte a été jouée au moins une fois)

| Carte | Jouée dans | Victoires quand jouée |
|---|---|---|
| Maître du Chenil Infernal | 26 | 96 % |
| Cavaliers Dragons Élite | 34 | 76 % |
| Frappez le ravitaillement | 66 | 74 % |
| Espion Impérial | 36 | 72 % |
| Porte-Étendard | 289 | 72 % |
| Archer Impérial | 542 | 72 % |
| Lancier de l'Empire | 639 | 71 % |
| Aumônier de Guerre | 186 | 70 % |
| État Major | 81 | 70 % |
| Soldat de Kragz | 456 | 70 % |
| Général de l'Empire | 287 | 70 % |
| Lieutenant | 715 | 69 % |
| Recrue Impériale | 773 | 69 % |
| Capitaine de la Garde | 268 | 68 % |
| Ralliement | 368 | 68 % |
| Cadets de l'Académie | 312 | 67 % |
| Ordre du Haut Commandement | 88 | 67 % |
| Formation en Carré | 194 | 65 % |
| Charge Impériale | 111 | 65 % |
| Volée de Flèches | 41 | 63 % |
| Choc et Effroi | 48 | 63 % |
| Chevalier de Province | 504 | 60 % |
| Démon d'Akantha | 256 | 59 % |
| Marché Noir | 83 | 58 % |
| Abîme Grandissant | 166 | 57 % |
| Paysans | 1272 | 57 % |
| Chevalier Templier | 76 | 57 % |
| Druide Ancien | 32 | 56 % |
| À couvert | 274 | 56 % |
| Volez le ravitaillement | 183 | 54 % |
| Forteresse l'Intuable | 26 | 54 % |
| Pacte de Survie | 45 | 53 % |
| Archéotacticiens | 740 | 52 % |
| Dette Infernale | 122 | 52 % |
| Acolyte Damné | 351 | 52 % |
| Chien Infernal | 695 | 50 % |
| Élémentaire d'Eau | 244 | 50 % |
| Effroi Démoniaque | 640 | 50 % |
| Arbalétrier Impérial | 717 | 50 % |
| Prêtre Sacrificiel | 547 | 48 % |
| Archer des Bois | 571 | 48 % |
| Fanatiques | 422 | 48 % |
| Cultiste | 746 | 48 % |
| Esclave Guerrier | 565 | 48 % |
| Palissade | 754 | 48 % |
| Suppôt Infernal | 235 | 47 % |
| Fructification | 125 | 47 % |
| Changement Tectonique | 222 | 47 % |
| Banquet Infernal | 140 | 46 % |
| Basilics de l'Oasis | 487 | 46 % |
| Embuscade | 391 | 45 % |
| Chant du Vent | 110 | 45 % |
| Sylvain, Gardien Élémentaire | 144 | 44 % |
| Brise du Matin | 54 | 44 % |
| Jeune Nomade | 796 | 44 % |
| Basilics du Désert | 74 | 43 % |
| Cavalier Elfe | 536 | 43 % |
| Repositionnement | 272 | 43 % |
| Floraison | 183 | 43 % |
| Vision | 94 | 43 % |
| Veilleur d'Os | 47 | 43 % |
| Mirage | 367 | 43 % |
| Caravane Marchande | 561 | 42 % |
| Éveil Élémentaire | 278 | 42 % |
| Éclaireur Elfe | 745 | 42 % |
| Rangers | 248 | 42 % |
| Soin simple | 295 | 42 % |
| Guide du Désert | 378 | 42 % |
| Élémentaire de Terre | 556 | 41 % |
| Bourgeonnement | 230 | 41 % |
| Élémentaire de Feu | 643 | 41 % |
| Marchand d'Ombres | 621 | 41 % |
| Sérénité de la Forêt | 230 | 41 % |
| Chasseur de Reliques | 554 | 41 % |
| Chamane de la Forêt | 495 | 40 % |
| Maître de Caravane | 588 | 39 % |
| Cérémonie du Déclin | 23 | 39 % |
| Clerc de la Forêt | 521 | 39 % |
| Charmeur de Basilics | 474 | 38 % |
| Brume Trompeuse | 41 | 37 % |
| Éleveur de Basilics | 223 | 36 % |
| Dryades Guérisseuses | 91 | 32 % |
| Assassinat | 61 | 31 % |
| Saboteur Nomade | 145 | 26 % |
| Retraite Sylvestre | 23 | 22 % |

_Lecture : l'IA est heuristique et les decks sont ceux de démonstration ; ces chiffres signalent des déséquilibres à examiner, ils ne les prouvent pas._
