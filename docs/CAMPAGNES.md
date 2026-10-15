# Campagnes — Nomades, Elfes, Démons

**Implémentées** (src/campaign/demons.ts, elfes.ts, nomades.ts), avec les nouvelles cartes et mécaniques ci-dessous. Les chiffres de difficulté sont dans reports/difficulte-scenarios.md. Écarts avec la proposition : D5 se tient jusqu'au tour 8 (et non 9), et plusieurs scénarios désactivent la défaite par pioche vide du joueur (pools encore petits). Ce document reste une base de travail. Chaque scénario indique sa **règle spéciale**, en distinguant :
- **[existe]** : déjà dans le moteur ou les scénarios actuels (convoi, régiment vital, renforts par événement, niveau de départ, terrain 6/5, lassitude de fin de tour, ordinateur qui cesse de poser des régiments, pas de défaite par pioche vide…) ;
- **[nouveau]** : mécanique à programmer.

Le joueur est toujours le joueur A, l'ordinateur le joueur B.

---

## Un fil rouge commun (proposition)

Les trois campagnes peuvent raconter **la même histoire vue de trois côtés**. Ce fil rouge relie aussi la campagne de l'Empire déjà jouée.

1. **Démons** : un culte démoniaque caché **au cœur de la capitale impériale** attend des **œufs de dragon**. Les Invocateurs vont les voler dans les nids du désert, puis traversent l'Empire pour les livrer.
2. **Elfes** : Sylvain, Gardien Élémentaire, traque les Démons qui souillent les sources. Il découvre que leur piste mène… à l'Empire. Il en conclut que l'Empire protège le culte, ce qui explique l'invasion de la campagne Empire.
3. **Nomades** : après le vol des œufs, l'Empire envahit le désert pour reprendre le contrôle des nids de dragons. Il accuse les Nomades d'avoir laissé faire.
4. **Empire** (campagne actuelle) : l'attaque elfe « inexpliquée » trouve son explication. Le Commandant le pressent au camp de fin de campagne (« ce n'était pas seulement Sylvain »).

Ordre conseillé : Démons → Elfes → Nomades → Empire. Mais chaque campagne doit rester jouable seule.

---

## Campagne Nomade — « Les sables ne plient pas »

**Pitch** : la Légion impériale entre dans le désert. Les Nomades ne peuvent pas gagner une bataille rangée : ils harcèlent, affament, et font tomber l'armée par ses arrières. C'est l'identité de la faction (défausse, mise au rebut, Basilics).
**Pool de départ** : Frondeurs, Jeunes Nomades, Marchands d'Ombres, Caravane, Embuscade, Guide du Désert, quelques Basilics de l'Oasis.

### N1 — Les éclaireurs de la Légion
- **Situation** : une avant-garde impériale reconnaît les oasis, loin de ses bases.
- **Règle spéciale [existe]** : le deck impérial ne fait que **20 cartes** et la défaite par pioche vide s'applique. La partie apprend au joueur que vider la pioche adverse est une vraie condition de victoire.
- **Victoire** : classique, ou Empire à court de cartes.
- **Récompense** : 2 Saboteurs Nomades, puis le choix entre Marché Noir et Frappez le ravitaillement.

### N2 — Le puits de Sel-Amar
- **Situation** : la Légion veut prendre le seul puits de la région.
- **Règle spéciale [existe]** : un **Puits** (régiment isolé, 0 ATK, grosse Endurance, +1 ressource par tour) est **vital** pour les Nomades, comme la Garnison du scénario 2 de l'Empire. Des renforts impériaux arrivent aux tours 4 et 7.
- **Victoire** : classique ; défaite si le Puits tombe.
- **Récompense** : promotion de 2 Jeunes Nomades en Marchands d'Ombres, et un Éleveur de Basilics.

### N3 — Razzia sur le ravitaillement
- **Situation** : un convoi impérial traverse les dunes. C'est le scénario 3 de l'Empire à l'envers.
- **Règle spéciale [existe]** : le **convoi est du côté de l'ordinateur**, et il avance d'une case tous les deux tours. Le moteur gère déjà un convoi pour n'importe quel joueur.
- **Victoire** : détruire le convoi avant qu'il sorte du terrain. Défaite s'il sort.
- **Récompense** : le butin du convoi, 3 cartes de niveau 4 à choisir (Archéotacticiens, Volez le ravitaillement, Rançon du Désert…).

### N4 — La tempête de sable
- **Situation** : la Légion se replie à travers le grand erg. Les Nomades connaissent la tempête, pas l'Empire.
- **Règle spéciale [nouveau]** : tous les 3 tours, une **tempête** souffle pendant un tour. Les régiments perdent Distance et –20 INI, sauf les Nomades porteurs d'un Guide du Désert.
- **Victoire** : classique.
- **Récompense** : les cartes de niveau 5 (Basilics du Désert) et un Leader Nomade de haut niveau (voir les idées de cartes).

### N5 — La Forteresse dans les dunes (combat final)
- **Situation** : le général impérial a fait venir **Forteresse l'Intuable** pour tenir l'oasis centrale.
- **Règle spéciale [existe]** : l'Intuable est **vital pour l'Empire**, qui commence au niveau 3 avec un Dragon Impérial en réserve.
- **Victoire** : détruire l'Intuable, ou épuiser la pioche impériale. C'est la victoire « à la nomade ».

---

## Campagne Elfe — « La Purification »

**Pitch** : les sources sacrées pourrissent les unes après les autres. Sylvain mène les Royaumes Elfiques contre les Démons qui les souillent. C'est une campagne de soins et d'élémentaux contre une faction qui se nourrit de la mort.
**Pool de départ** : Éclaireurs, Élémentaires de Terre, Archers des Bois, Bourgeonnement, Brise du Matin, Repositionnement. Sylvain rejoint le pool au scénario 3.

### E1 — La source souillée
- **Situation** : une **Source corrompue** soigne les Démons à chaque fin de tour.
- **Règle spéciale [existe]** : la Source est un régiment isolé vital pour l'ordinateur (même mécanique que Sylvain au scénario 4 de l'Empire).
- **Victoire** : détruire la Source.
- **Récompense** : Dryades Guérisseuses ×2 et Élémentaire d'Eau.

### E2 — Les captifs
- **Situation** : les Démons ont capturé des Elfes et les font combattre (les Esclaves Guerriers sont Humains et Elfes).
- **Règle spéciale [nouveau]** : quand un **Esclave Guerrier** adverse a le Moral brisé, il **change de camp** au lieu de fuir : c'est la « Libération ». Le joueur est encouragé à briser le Moral plutôt qu'à détruire.
- **Victoire** : classique. Le bonus de récompense dépend du nombre d'Esclaves libérés.
- **Récompense** : les Esclaves libérés rejoignent le pool, et 1 tactique à choisir.

### E3 — La nuit sans fin
- **Situation** : un rituel plonge la forêt dans la nuit, et les Démons y sont plus forts.
- **Règle spéciale [nouveau]** : alternance **jour / nuit** tous les 2 tours. La nuit, les Démons ont +10 ATK. Le jour, les Elfes ont +15 INI.
- **Victoire [nouveau]** : **tenir jusqu'à l'aube**, au tour 10, ou victoire classique avant. Une victoire « au nombre de tours » serait réutilisable partout.
- **Récompense** : Sylvain, Gardien Élémentaire rejoint le pool, avec le Leader Vision.

### E4 — Le portail des Abysses (combat final)
- **Situation** : un **Portail infernal** crache des Chiens Infernaux à chaque tour.
- **Règle spéciale [existe]** : le Portail est isolé, vital pour l'ordinateur et très résistant. Les Chiens arrivent par des événements d'invocation à chaque tour. Changement Tectonique et les élémentaux permettent de l'atteindre.
- **Victoire** : détruire le Portail. Dialogue final : la piste du culte mène à la capitale impériale.

---

## Campagne Démon — « Les Œufs du Dragon »

**Pitch** : le culte attend son offrande au cœur de la capitale impériale. Il faut voler les œufs, les transporter à travers deux nations, et les livrer vivants. C'est une campagne d'escorte, où sacrifier ses troupes est un outil plutôt qu'une perte.
**Pool de départ** : Cultistes, Chiens Infernaux, Acolyte Damné, Esclaves Guerriers, Pacte de Sang, Effroi Démoniaque.

### D1 — Le nid des sables (contre les Nomades)
- **Situation** : les œufs reposent dans un nid gardé par une **Gardienne du Nid** (Basilic).
- **Règle spéciale [existe]** : la Gardienne est vitale pour l'ordinateur ; la détruire, c'est s'emparer des œufs.
- **Victoire** : détruire la Gardienne.
- **Récompense** : 2 cartes **Œuf de Dragon** imposées dans le deck pour la suite (voir les idées de cartes), Fanatiques et Cérémonie du Déclin.

### D2 — La traversée du désert (contre les Nomades)
- **Situation** : les Nomades poursuivent le **Chariot des œufs**.
- **Règle spéciale [existe]** : c'est le convoi du scénario 3 de l'Empire, côté Démons, avec la Halte du Convoi. Les Nomades harcèlent la main et la pioche du joueur : il apprend à jouer contre la défausse.
- **Victoire** : le Chariot sort du terrain.
- **Récompense** : promotion de Cultistes en Fanatiques, puis 2 cartes de niveau 3 à choisir.

### D3 — La frontière impériale (contre l'Empire)
- **Situation** : il faut forcer un poste frontière avant que l'Empire ne donne l'alerte.
- **Règle spéciale [existe]** : **lassitude automatique en fin de tour** pour le joueur, qui a une limite de temps. Le paradoxe est voulu : cette lassitude nourrit Abîme Grandissant, et le joueur doit choisir entre se presser et monter en puissance.
- **Victoire** : classique avant la défaite par lassitude.
- **Récompense** : Veilleur d'Os, Dette Infernale ou Rançon d'Âmes.

### D4 — Les égouts de la capitale (contre l'Empire)
- **Situation** : infiltration ; la garde ne sait pas encore que les Démons sont là.
- **Règle spéciale [nouveau]** : **l'ordinateur ne pose aucun régiment avant l'alarme**, qui sonne au tour 4 ou dès qu'un régiment impérial est détruit. C'est l'inverse de la règle actuelle « l'ordinateur cesse de poser des régiments à partir du tour X ». Des renforts arrivent ensuite par événements.
- **Victoire** : classique.
- **Récompense** : Maître du Chenil Infernal et un Leader de niveau 5 (voir les idées de cartes).

### D5 — L'offrande (combat final)
- **Situation** : le rituel commence au sommet de la capitale ; la garde impériale et un Dragon Impérial chargent.
- **Règle spéciale [existe] + [nouveau]** : un **Œuf de Dragon** posé sur le plateau est vital pour le joueur [existe]. Victoire si l'œuf survit **8 tours**, le temps du rituel [nouveau, même mécanique que l'aube du scénario E3].
- **Fin** : l'œuf éclôt en **Dragon Infernal**, qui rejoint la collection. Dialogue final : un éclaireur elfe a tout vu.

---

## Nouvelles mécaniques à programmer (récapitulatif)

| Mécanique | Utilisée par | Difficulté |
|---|---|---|
| Victoire en survivant jusqu'au tour X | E3, D5 (et réutilisable) | faible |
| L'ordinateur ne pose rien avant une alarme (tour X ou déclencheur) | D4 | faible |
| Événement global périodique (tempête, jour / nuit) | N4, E3 | moyenne |
| Changement de camp au Moral brisé (Libération) | E2 | moyenne |

Tout le reste réutilise ce qui existe : convoi (pour n'importe quel camp), régiment vital, renforts et invocations par événement, terrain, niveau de départ, lassitude automatique, taille de deck, défaite par pioche vide activable.

---

## Factions qui manquent de cartes

| Faction | Cartes | Niv. 1 | Niv. 2 | Niv. 3 | Niv. 4 | Niv. 5 |
|---|---|---|---|---|---|---|
| Empire | 26 | 2 | 7 | 8 | 6 | 3 |
| Elfes | 26 | 4 | 9 | 9 | 3 | 1 |
| Démons | 19 | 3 | 4 | 8 | 3 | 1 |
| Nomades | 19 | 3 | 6 | 6 | 3 | 1 |
| Neutres | 3 | 1 | 1 | 0 | 1 | 0 |

Constats :
- **Démons et Nomades** ont 7 cartes de moins que l'Empire et les Elfes. Il leur manque surtout des régiments de niveau 2 chez les Démons (un seul : l'Esclave Guerrier) et de la fin de partie (une seule carte de niveau 5 chacun, aucun Leader de niveau 4-5 chez les Nomades).
- **Elfes** : pas de régiment de niveau 5.
- **Neutres** : seulement 3 cartes.

### Idées pour les Démons
- **Diablotins** (régiment niv. 2, Démon, Minions, coût 1) : chair à sacrifice. Quand il sert de sacrifice, +1 ressource.
- **Gargouille de Cendres** (régiment niv. 2, Démon, sacrifice niv. 1+) : défensive, 15 ARM. Regagne 1 Moral quand un allié est sacrifié.
- **Seigneur des Abysses** (Leader niv. 5, requiert Démon) : le porteur gagne Effrayant 2. Chaque sacrifice que tu fais lui rend 10 END.
- **Œuf de Dragon** (régiment niv. 3, Dragon, isolé, 0 ATK, 60 END) : après 3 de tes tours, éclot en Dragonnet Infernal. Carte de campagne, puis à collectionner.
- **Dragon Infernal** (régiment niv. 5, Démon + Dragon, sacrifice niv. 4+) : à l'arrivée, tous les régiments adverses perdent 2 Moral. Récompense de fin de campagne.

### Idées pour les Nomades
- **Cavaliers des Dunes** (régiment niv. 2, Humain, Nomade, Monté) : arrive prêt, INI élevée. Les Nomades n'ont aucune cavalerie.
- **Cheikh des Dunes** (Leader niv. 4, requiert Nomade) : chaque fois que l'adversaire défausse une carte, le porteur gagne +5 ATK permanent.
- **Reine des Basilics** (régiment niv. 5, Basilic, Nomade) : à l'arrivée, reprend en main un Basilic de ta défausse ; Effrayant 1.
- **Tempête de Sable** (tactique niv. 3) : les régiments adverses perdent Distance et –20 INI ce tour-ci. C'est la carte du scénario N4 en version jouable.
- **Oasis cachée** (tactique niv. 2) : pioche 2 cartes, défausse 1 ; +1 ressource si tu contrôles une Caravane.

### Idées pour les Elfes
- **Tréant Millénaire** (régiment niv. 5, Élémentaux) : 120 END ; à chaque fin de ton tour, soigne tous tes régiments de 5 END.
- **Gardienne de la Lumière** (régiment niv. 4, Elfe, Clerc) : +15 ATK contre les Démons ; ses soins rendent aussi 1 Moral.
- **Rite de Purification** (tactique niv. 3) : retire Effrayant et les bonus permanents d'un régiment adverse ; si c'est un Démon, il perd aussi 2 Moral.

### Idées neutres (utiles à tous les decks)
- **Mercenaires** (régiment niv. 2, Humain, coût 2) : statistiques moyennes, sans effet : un bouche-trou jouable dans n'importe quel deck.
- **Ravitaillement** (tactique niv. 1) : +1 ressource ce tour-ci, pioche 1 carte au tour suivant.
- **Bannière Déchirée** (tactique niv. 3) : un régiment au Moral brisé regagne 4 Moral.
