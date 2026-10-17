# Tournoi entre factions (decks aléatoires mono-faction)

Modifications testées (`balance/equilibrage-3-variante.json`) :

- terre_brulee.cout : 2 → 3
- terre_brulee.millCap : null → 3
- puits_empoisonne.cout : 2 → 3
- puits_empoisonne.poisonsOpponentTurn : {"mill":2,"handDiscard":1} → {"mill":1,"handDiscard":1}
- voleurs_provisions.cout : 1 → 2
- danseurs_sable.onDeathOpponentMill : 2 → 1

900 parties terminées, 150 par paire de factions ; durée moyenne 11.8 tours ; 196 s.
Decks : 45 cartes tirées au hasard parmi la faction, les neutres et les bicolores de la faction (cartes de base + première vague). IA v2 des deux côtés.

| Faction | Victoires | Taux |
|---|---|---|
| Empire | 252 / 450 | 56 % |
| Elfes | 169 / 450 | 38 % |
| Démons | 147 / 450 | 33 % |
| Nomades | 332 / 450 | 74 % |

| Ligne contre colonne | Empire | Elfes | Démons | Nomades |
|---|---|---|---|---|
| Empire | — | 74 % | 64 % | 30 % |
| Elfes | 26 % | — | 60 % | 27 % |
| Démons | 36 % | 40 % | — | 22 % |
| Nomades | 70 % | 73 % | 78 % | — |

Fins de partie : lassitude 37 %, noRegiment 18 %, emptyDeck 45 %.
