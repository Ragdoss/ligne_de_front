# IA du draft : entraînement par des drafts entre IA (20/11/2026)

Demandé par Nathan : améliorer l'IA du draft en la faisant drafter contre elle-même, cartes hors faction permises ; garder plusieurs « personnalités » si elles font jeu égal.

Outil : `tools/draft-train.ts` (données complètes : `reports/draft-train.json`, journal : `reports/draft-train-log.txt`).
Chaque draft : 4 IA, 6 paquets de 8 cartes (comme le vrai draft), deck de 40 cartes, puis chacune contre chacune, 2 parties par paire (chacune commence une fois), IA forte (celle que le joueur affronte en draft).

## Phase A — notes des cartes (8 itérations × 96 drafts, 48 min)

- Départ : l'impact mesuré par le test des decks aléatoires (équilibrage 14), pour les 259 cartes.
- À chaque itération, les IA draftent avec beaucoup de hasard pour essayer toutes les cartes ; la note d'une carte devient l'écart de victoires (en points) des decks qui la jouent, sur les 3 dernières itérations, lissé avec la note précédente.
- Les notes bougent encore d'environ 1 point par itération : c'est le bruit de mesure, pas une dérive.

Mieux notées : Chevaliers de l'Ordre 8, Terreur la sentinelle 6,7, Lieutenant 4,9, Gardien des chaînes 4,9, Gardienne de la Lumière 4,6, Sergents instructeurs 4,3, Danseuses des lames 4,2, Cuirassiers lourds 4,2, Sentinelle de chêne 4,1, Élémentaire de Terre 4.

Moins bien notées : Frappez le ravitaillement −14, Rançonnement −12, Seigneur des caravanes perdues −11, Émir des dunes −9,8, Maître du bazar −9,5, Colporteur −9,2, Cheikh des Dunes −9,2, Forgeron de campagne −7,9, Récupérateur −7,9.
En draft, le plan d'usure nomade ne prend pas : on a rarement assez de cartes de défausse pour qu'il fonctionne.

## Phase B — façon de drafter (192 drafts, 4 réglages dans les mêmes drafts, sièges tournants)

| Réglage | Victoires |
|---|---|
| Libre : les meilleures cartes, sans regarder la faction | 56 % |
| Deux factions, hors faction si note ≥ 4 | 50 % |
| Souple : hors faction si note ≥ 2 | 49 % |
| Nouvelles notes, anciens réglages (deux factions strictes) | 46 % |

## Phase C — nouvelle IA (Libre) contre l'ancienne (192 drafts, deux sièges chacune)

**La nouvelle IA gagne 71 % de ses parties.**

Decks de la nouvelle IA : 13 % de cartes neutres, Elfes 37 %, Empire 26 %, Démons 12 %, Nomades 12 % (l'ancienne : Démons 31 %, Nomades 28 %, Empire 20 %, Elfes 13 %).
Cartes qu'elle prend le plus souvent hors de ses deux factions principales (exemplaires par deck) : Jeune Nomade 0,49, Acolyte Damné 0,41, Mirage de l'oasis 0,32, Basilics du Désert 0,27, Pacte de Sang 0,26, La Garde d'Asura 0,25, Gardien des chaînes 0,25, Effroi Démoniaque 0,24, Chamelier 0,23, Terreur la sentinelle 0,22.

## Personnalités (192 drafts : 3 réglages et l'ancienne IA dans les mêmes drafts, 1 152 parties chacun)

| Personnalité | Victoires | Decks à 3 factions (≥ 5 cartes) | Cartes de ses 2 factions + neutres |
|---|---|---|---|
| **Opportuniste** : suit deux factions, prend une bonne carte d'ailleurs (note ≥ 1) | 62 % | 66 % | 33 / 40 |
| **Libre** : les meilleures cartes, quelle que soit la faction | 60 % | 95 % | 28 / 40 |
| Fidèle : deux factions, hors faction si note ≥ 4 | 54 % | 33 % | 36 / 40 |
| Ancienne IA | 25 % | 37 % | 34 / 42 |

Retenues : **Opportuniste** et **Libre** (2 points d'écart, dans la marge de hasard). Fidèle est écartée (6 à 8 points derrière).

## Dans le jeu

- `src/draft/ratings.ts` : les nouvelles notes (les anciennes sont gardées dans `tools/draft-ratings-v1.ts` pour comparaison).
- `src/draft/draft.ts` :
  - chaque IA reçoit une personnalité tirée au hasard à partir de la graine du draft (`DraftState.personalities`), utilisée pour ses choix et la construction de son deck ;
  - les cartes bi-factions comptent pour leurs deux factions ;
  - les anciens drafts en cours prennent Opportuniste.
- Construction du deck des IA et du bouton « Deck proposé » :
  - d'abord les cartes de ses deux factions et les neutres, plus les cartes d'ailleurs dont la note atteint le seuil de la personnalité ;
  - puis 3 régiments de niveau 1, au moins 8 cartes de niveau 4-5 et les meilleures cartes jusqu'à 40.
- Écrans du draft (solo et à plusieurs) :
  - la personnalité de chaque adversaire s'affiche à côté de son nom, avec sa description au survol ;
  - la colonne « Deck » montre ses factions (« Elfes + Empire »).
- Les matchs entre IA du tournoi restent simulés avec l'IA rapide, comme avant.
