# Rapport de simulation

Modifications testées (`balance/equilibrage-2.json`) :

- cadets_academie.cout : 3 → 4
- cadets_academie.atk : 10 → 7
- cadets_academie.end : 40 → 36
- lancier_emp.atk : 15 → 12
- lancier_emp.arm : 5 → 4
- lancier_emp.bonusVsMounted : null → 15
- soldat_kragz.atk : 10 → 9
- soldat_kragz.arm : 5 → 4
- chevalier_prov.atk : 15 → 14
- chevalier_prov.arm : 15 → 13
- arbaletrier_imp.keywords : ["Lent"] → ["Lent","Pénétration 5"]
- serenite_foret.cout : 2 → 1
- serenite_foret.doubledWithElemental : null → true
- clerc_foret.cout : 3 → 2
- saboteur_nomade.atk : 0 → 1
- saboteur_nomade.end : 20 → 21
- frondeur_nomade.cout : 2 → 1
- archeotacticiens.cout : 3 → 4
- fanatiques.cout : 4 → 3

1600 parties IA contre IA (100 par match-up, graine « v2 »), 161 s.

## Taux de victoire par faction (hors miroirs)

| Faction | Parties | Victoires |
|---|---|---|
| Empire | 600 | 76 % |
| Elfes | 600 | 40 % |
| Démons | 600 | 46 % |
| Nomades | 600 | 39 % |

## Match-ups (victoires du joueur de la ligne, qui commence)

| | Empire | Elfes | Démons | Nomades |
|---|---|---|---|---|
| **Empire** | — | 77 % | 62 % | 75 % |
| **Elfes** | 14 % | — | 39 % | 52 % |
| **Démons** | 20 % | 44 % | — | 48 % |
| **Nomades** | 26 % | 45 % | 37 % | — |

## Déroulement

- Durée moyenne (parties terminées) : 10.1 tours.
- Le premier joueur gagne 47 % des parties.
- Fins de partie : lassitude 85 %, plus de régiment 12 %, pioche vide 3 %.

## Cartes (parties où la carte a été jouée au moins une fois)

| Carte | Jouée dans | Victoires quand jouée |
|---|---|---|
| Druide Ancien | 26 | 81 % |
| Frappez le ravitaillement | 55 | 80 % |
| Cavaliers Dragons Élite | 37 | 78 % |
| Aumônier de Guerre | 189 | 74 % |
| Archer Impérial | 530 | 72 % |
| Espion Impérial | 36 | 72 % |
| Général de l'Empire | 287 | 72 % |
| Porte-Étendard | 291 | 71 % |
| Lancier de l'Empire | 636 | 71 % |
| Lieutenant | 707 | 70 % |
| Formation en Carré | 186 | 70 % |
| Ordre du Haut Commandement | 96 | 70 % |
| Recrue Impériale | 775 | 70 % |
| Soldat de Kragz | 454 | 69 % |
| Charge Impériale | 114 | 68 % |
| Ralliement | 373 | 68 % |
| Capitaine de la Garde | 275 | 68 % |
| Cadets de l'Académie | 290 | 68 % |
| Volée de Flèches | 42 | 67 % |
| État Major | 86 | 65 % |
| Choc et Effroi | 44 | 64 % |
| Chevalier Templier | 67 | 61 % |
| Chevalier de Province | 504 | 60 % |
| À couvert | 264 | 59 % |
| Forteresse l'Intuable | 22 | 59 % |
| Démon d'Akantha | 297 | 59 % |
| Acolyte Damné | 358 | 58 % |
| Paysans | 1274 | 57 % |
| Volez le ravitaillement | 161 | 57 % |
| Marché Noir | 70 | 56 % |
| Cérémonie du Déclin | 28 | 54 % |
| Abîme Grandissant | 157 | 52 % |
| Chien Infernal | 691 | 52 % |
| Suppôt Infernal | 202 | 52 % |
| Élémentaire d'Eau | 246 | 51 % |
| Veilleur d'Os | 41 | 51 % |
| Archéotacticiens | 723 | 51 % |
| Dette Infernale | 123 | 50 % |
| Fructification | 137 | 50 % |
| Prêtre Sacrificiel | 549 | 50 % |
| Effroi Démoniaque | 634 | 50 % |
| Pacte de Survie | 50 | 50 % |
| Esclave Guerrier | 571 | 50 % |
| Fanatiques | 507 | 50 % |
| Cultiste | 746 | 50 % |
| Arbalétrier Impérial | 690 | 49 % |
| Changement Tectonique | 217 | 49 % |
| Palissade | 745 | 48 % |
| Archer des Bois | 568 | 48 % |
| Sylvain, Gardien Élémentaire | 140 | 46 % |
| Rangers | 260 | 45 % |
| Chant du Vent | 110 | 45 % |
| Cavalier Elfe | 536 | 44 % |
| Brume Trompeuse | 34 | 44 % |
| Repositionnement | 277 | 44 % |
| Banquet Infernal | 149 | 44 % |
| Floraison | 170 | 43 % |
| Soin simple | 300 | 43 % |
| Basilics de l'Oasis | 493 | 43 % |
| Embuscade | 382 | 42 % |
| Éclaireur Elfe | 744 | 42 % |
| Basilics du Désert | 72 | 42 % |
| Bourgeonnement | 233 | 42 % |
| Élémentaire de Feu | 637 | 41 % |
| Jeune Nomade | 796 | 41 % |
| Mirage | 359 | 41 % |
| Brise du Matin | 51 | 41 % |
| Vision | 88 | 41 % |
| Élémentaire de Terre | 558 | 41 % |
| Caravane Marchande | 564 | 40 % |
| Clerc de la Forêt | 535 | 40 % |
| Chamane de la Forêt | 497 | 40 % |
| Sérénité de la Forêt | 241 | 40 % |
| Éveil Élémentaire | 265 | 40 % |
| Marchand d'Ombres | 616 | 38 % |
| Chasseur de Reliques | 554 | 37 % |
| Maître de Caravane | 591 | 37 % |
| Assassinat | 53 | 36 % |
| Guide du Désert | 378 | 36 % |
| Éleveur de Basilics | 212 | 35 % |
| Charmeur de Basilics | 474 | 35 % |
| Dryades Guérisseuses | 88 | 33 % |
| Saboteur Nomade | 141 | 24 % |

_Lecture : l'IA est heuristique et les decks sont ceux de démonstration ; ces chiffres signalent des déséquilibres à examiner, ils ne les prouvent pas._
