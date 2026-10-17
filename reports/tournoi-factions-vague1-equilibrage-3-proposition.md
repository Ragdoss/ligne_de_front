# Tournoi entre factions (decks aléatoires mono-faction)

Modifications testées (`balance/equilibrage-3-proposition.json`) :

- terre_brulee.cout : 2 → 3
- terre_brulee.millCap : null → 4
- puits_empoisonne.cout : 2 → 3
- puits_empoisonne.poisonsOpponentTurn : {"mill":2,"handDiscard":1} → {"mill":1,"handDiscard":1}
- voleurs_provisions.cout : 1 → 2
- danseurs_sable.onDeathOpponentMill : 2 → 1
- gargouille_sentinelle.cout : 3 → 4
- legion_morvak.cout : 0 → 1

900 parties terminées, 150 par paire de factions ; durée moyenne 12.1 tours ; 194 s.
Decks : 45 cartes tirées au hasard parmi la faction, les neutres et les bicolores de la faction (cartes de base + première vague). IA v2 des deux côtés.

| Faction | Victoires | Taux |
|---|---|---|
| Empire | 247 / 450 | 55 % |
| Elfes | 192 / 450 | 43 % |
| Démons | 131 / 450 | 29 % |
| Nomades | 330 / 450 | 73 % |

| Ligne contre colonne | Empire | Elfes | Démons | Nomades |
|---|---|---|---|---|
| Empire | — | 67 % | 67 % | 30 % |
| Elfes | 33 % | — | 65 % | 30 % |
| Démons | 33 % | 35 % | — | 20 % |
| Nomades | 70 % | 70 % | 80 % | — |

Fins de partie : emptyDeck 48 %, lassitude 37 %, noRegiment 15 %.
