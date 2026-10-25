# Game Design Document — [Titre à définir]
*Jeu de cartes à collectionner (TCG), fantasy, univers original*

> Document vivant — à enrichir au fil de la conception. Les sections marquées **[OUVERT]** sont des points encore à trancher.

---

## 1. Pitch

Un jeu de cartes à collectionner en duel, se déroulant dans un univers fantasy original déjà en cours d'écriture par l'auteur. Les cartes représentent des **régiments** que les joueurs déploient pour tenir une ligne de front, dans un système de combat automatique inspiré de la bataille rangée plutôt que du duel de sorciers classique.

**Piliers de conception :**
- **Pas de monétisation agressive** : aucune lootbox, aucun taux de drop aberrant. La campagne solo débloque l'intégralité du core set.
- **Pas de boucle de snowball frustrante** : un système de niveau dynamique limite l'avantage du joueur en tête.
- **Plus de profondeur qu'un jeu de cartes papier** : les stats et interactions des régiments exploitent ce qu'un support numérique permet (calculs multiples, effets conditionnels, positionnement).
- **Thème militaire assumé** : composition d'armée, formation, ligne de front — pas juste un skin fantasy sur un moteur de jeu générique.

---

## 2. Univers

Univers fantasy original, en cours d'écriture par l'auteur (lore externe au présent document — à référencer/lier une fois disponible).

**[OUVERT]** Lien avec le lore existant : factions jouables, ton (grimdark / héroïque / autre), échelle des conflits représentés par les "régiments".

---

## 3. Types de cartes

Le régiment n'est qu'un des types de cartes du jeu. Trois types identifiés à ce stade :

### Régiment
Type de carte principal du deck — représente une unité de troupes déployée sur le plateau. Possède les stats détaillées en section 9 (ATK, END, ARM, INI, MOR) et occupe un slot du plateau décrit en section 8.

### Leader
Carte qui **modifie un régiment** : ajoute des mots-clés, des bonus de statistiques, ou des effets. N'est pas une unité autonome sur le plateau — s'applique à un régiment cible (existant ou au moment de son déploiement). **L'effet est permanent (aura attachée)** : il dure tant que le régiment ciblé reste en vie, et disparaît avec lui s'il est détruit. **Un seul Leader à la fois** par régiment : en jouer un nouveau sur un régiment déjà équipé **remplace** le précédent. Suit le même modèle économique que les régiments (coût en ressource + niveau requis, section 7).

**Règle de compatibilité de types** : chaque Leader porte un ou plusieurs **types** (ex : Elfe, Lancier, Nomade, Empire...). Un Leader ne peut être joué sur un régiment que si **ce régiment possède tous les types du Leader** (le régiment peut avoir des types supplémentaires — la correspondance n'a pas besoin d'être exacte).
- *Exemple* : un Leader "Elfe" peut être joué sur n'importe quel régiment Elfe, y compris un régiment Elfe + Archer.
- *Exemple* : un Leader "Lancier + Nomade" peut être joué sur un régiment Lancier + Nomade + Empire, mais pas sur un régiment Elfe + Lancier (il lui manque le type Nomade).

**Principe de puissance** : plus un Leader porte de types, plus il impose de contraintes de deckbuilding (il faut construire son armée autour de cette combinaison précise) — en contrepartie, il peut être **plus puissant**. Pas de limite fixée dans les règles sur le nombre de Leaders/Tactiques par deck : l'équilibre entre polyvalence et puissance est laissé à la main du joueur qui construit son deck, la contrainte de types faisant naturellement office de garde-fou.

### Tactique
Équivalent des éphémères/rituels de Magic : effet ponctuel, résolu immédiatement puis la carte quitte le jeu (cimetière/défausse). Sert aux effets réactifs ou aux coups tactiques ponctuels (buff temporaire, dégâts directs, manipulation de plateau...). Suit le même modèle économique que les régiments (coût en ressource + niveau requis, section 7).

**Règle de faction par défaut** : une Tactique est **neutre** (jouable dans n'importe quel deck) sauf si elle cible spécifiquement des régiments d'un type donné (ex : Charge Impériale ne cible que des Lanciers, Volée de Flèches ne cible que des Archers) — dans ce cas elle est naturellement rattachée à la faction où ce type est le plus présent, mais reste une convention de rangement plutôt qu'une restriction dure.

**[OUVERT]**
- D'autres types de cartes à venir (terrain, événement, faction...) ?

---

## 4. Types de régiments et synergies

Chaque régiment porte un ou plusieurs **types** — un mélange de **races**, de **factions**, et de **rôles de combat** (Archer, Lancier, Chevalier...). Les types ne sont pas de simples étiquettes cosmétiques : ce sont des **cibles et des prérequis** pour des effets de cartes.

### Races
Liste des races envisagées à ce stade : **Ange, Démon, Dragon, Géant, Basilic, Phénix (unique), Vampire, Kraken, Léviathan, Béhémoth, Élémentaux, Humain**.
Des **versions corrompues** de certaines races peuvent exister en tant que races à part entière si le besoin de design se présente (ex : **Néphilim** comme version corrompue d'Ange).

### Factions (jouables)
Les factions structurent le deckbuilding et la campagne — chaque faction rassemble certaines races et peut se décliner en sous-factions :
- **Empire** : superfaction humaine, incluant des Dragons, elle-même divisée en **sous-factions (provinces)**.
- **Royaumes Elfiques** : Elfes et Élémentaux.
- **Invocateurs de Démons** : Démons et cultistes humains à leur service, axée sur le **sacrifice** de régiments alliés (cf. sous-section dédiée ci-dessous). Intégrée au simulateur (section 15) — troisième faction jouable dès l'écran de sélection des decks.
- **Nomades** : faction mixte Elfes/Humains, axée sur le **sabotage de la main et de la pioche adverses** avant de lâcher ses gros Basilics (cf. sous-section dédiée ci-dessous). Quatrième faction jouable.

Point de départ initial limité à Empire et Royaumes Elfiques pour le core set, désormais étendu aux factions Démons puis Nomades — d'autres pourront être ajoutées plus tard si le besoin se présente (les races non encore rattachées à une faction, comme Ange/Géant/Vampire/Kraken/Léviathan/Béhémoth, restent candidates à de futures factions ou à un statut neutre/monstre ; le Basilic est désormais rattaché aux Nomades).

### Faction : Invocateurs de Démons
**Identité** : plutôt que de payer uniquement en ressource, les Démons les plus puissants exigent en plus de **sacrifier un régiment allié d'un niveau minimum donné** au moment de leur invocation (un coût supplémentaire, pas une réduction du coût en ressource) — la faction doit donc élever de la chair à canon jetable pour nourrir des démons de plus en plus forts. Le sacrifice utilise les règles générales existantes (le contrôleur du régiment sacrifié gagne des points égaux à son niveau, les alliés restants perdent 1 Moral) : il **accélère la propre montée en niveau du joueur Démons**, mais le rapproche aussi plus vite de la défaite par dépassement de niveau (50 points). Double tranchant assumé, sans règle supplémentaire à inventer.

**Règle de sacrifice** :
- Chaque Démon qui l'exige précise un **niveau minimum requis** pour le régiment sacrifié.
- Le régiment sacrifié doit se trouver dans **le même type d'emplacement** que celui où le Démon va apparaître (rang avant, arrière ou isolé) — le Démon prend directement sa place.
- **Le gain n'est pas automatique** : chaque Démon précise individuellement s'il récupère les statistiques *réelles* du régiment sacrifié (ATK, Endurance maximale, Armure et Initiative telles quelles, pas une formule liée au niveau), ses mots-clés, les deux, ou ni l'un ni l'autre — ça permet de créer des Démons à l'effet particulier plutôt qu'un seul comportement générique. Voir le Compendium pour ce que chaque carte récupère précisément.
- **Le régiment sacrifié peut, lui aussi, offrir un bonus** : au-delà de ce que le Démon invoqué prévoit de récupérer, certaines cartes définissent un effet propre qui s'applique **quel que soit le Démon qui les consomme** (ex : Fanatiques, section 14, qui octroie Effrayant 2 et l'arrivée prête au Démon invoqué grâce à lui). Les deux sources de bonus (côté Démon invoqué, côté chair à sacrifice) se cumulent.

**Mots-clés propres à la faction** :
- **Effrayant X** : quand ce régiment attaque, la cible perd **X point(s) de Moral supplémentaires**, en plus du 1 point perdu pour avoir simplement subi une attaque (section 9). Désactivé si le porteur a le Moral brisé, comme les autres bonus offensifs liés aux mots-clés.

**Cartes du prototype** : la liste complète (Cultiste, Chien Infernal, Esclave Guerrier, Acolyte Damné, Prêtre Sacrificiel, Suppôt Infernal, Démon d'Akantha, Effroi Démoniaque, Tuteur Démoniaque, Fanatiques, Maître du Chenil Infernal) est tenue à jour dans le **[Compendium des cartes](https://claude.ai/artifact/Qu2WyGn3EAiWHgbb97tuGb)** plutôt que recopiée ici — voir section 14 pour l'explication de ce choix. Quelques exemples pour donner le ton :
- **Prêtre Sacrificiel** (Leader Humain) donne au régiment porteur le mot-clé **Minions** et **+1 niveau permanent** — combo pensé pour "préparer" un sacrifice avantageux : la cible devient éligible à des sacrifices exigeant un niveau plus élevé, sans coûter de points ni de Moral aux alliés si elle est ensuite sacrifiée (grâce à Minions).
- **Démon d'Akantha** (coût 4) exige un sacrifice de niveau 3+ et récupère les *statistiques réelles* du régiment sacrifié — ATK, Endurance maximale, Armure et Initiative s'ajoutent telles quelles aux siennes (sacrifier un régiment costaud rend Akantha nettement plus fort, contrairement à une simple formule liée au niveau), mais pas ses mots-clés. Porte aussi Effrayant 2, et se soigne de 15 Endurance chaque fois qu'un régiment **adverse** est détruit par son Moral — un Démon de contrôle plutôt que de pur sacrifice.
- **Chien Infernal** exige lui aussi un sacrifice (niveau 1+, même rang) mais n'en récupère ni les statistiques ni les mots-clés — le sacrifice sert uniquement de coût d'accès, pas de source de puissance : un Chien Infernal reste un Chien Infernal quel que soit ce qui a été sacrifié pour l'invoquer. Porte aussi le rôle **Monté**.
- **Effroi Démoniaque** (Tactique, niveau 2, coût 2) est la première Tactique de la faction à **cibler un régiment adverse** : il lui fait perdre 2 de Moral + 1 par régiment Démon dans l'armée du lanceur, et s'il est détruit par cette perte de Moral, tous les régiments Démon du lanceur regagnent 1 Moral — scale avec le nombre de Démons déjà sur le plateau, payoff pensé pour une armée déjà engagée dans le sacrifice plutôt que pour une ouverture de partie.
- **Tuteur Démoniaque** (Tactique, niveau 4, coût 1, sans cible) laisse le joueur choisir un niveau entre 1 et 5 parmi ceux **effectivement présents** dans son deck de régiments Démon, cherche et pioche le premier régiment Démon de ce niveau rencontré dans l'ordre de pioche, puis octroie à la fois une ressource **et un point de lassitude** par carte "sautée" (sa position dans le deck) — un tuteur qui devient d'autant plus rentable que la carte visée était profondément enfouie.
- **Suppôt Infernal** (Leader, niveau 3, coût 2, cible un régiment déjà porteur d'un Leader) gagne une capacité de récupération : quand le **régiment porteur est détruit**, son contrôleur choisit un régiment Démon de sa défausse (le porteur lui-même y est déjà, s'il est Démon) et en crée une **copie en main** qui coûte **2 de moins** à jouer (jamais moins de 0). La carte d'origine reste dans la défausse ; la réduction est liée à cet exemplaire précis jusqu'à ce qu'il soit joué.
- **Banquet Infernal** (Tactique, niveau 3, coût 0, cible un de ses propres régiments) : le régiment est **toujours détruit** et le lanceur gagne autant de **ressources** que son Moral actuel. Si le lanceur contrôle un Démon (la cible comprise), le régiment acquiert d'abord **Minions** : sa destruction ne coûte alors aucune lassitude ni perte de Moral aux alliés. Sans Démon, la destruction a ses conséquences habituelles.
- **Le thème de la lassitude (Démons)** : la lassitude fait monter de niveau mais rapproche de la défaite ; plusieurs cartes la manipulent comme une ressource à dépenser. *Pacte de Sang* (Tactique, niveau 2, coût 0) : +4 lassitude, pioche 2 cartes, +2 ressources. *Rançon d'Âmes* (Tactique, niveau 3, coût 1, cible un Démon allié) : le joueur choisit X de 1 à 5, gagne X lassitude, et le Démon gagne +5 ATK par point payé pour le combat. *Dette Infernale* (Tactique, niveau 3, coût 1, cible un régiment allié) : +10 ATK et +20 END **permanents**, contre une lassitude immédiate égale au niveau du régiment. *Pacte de Survie* (Tactique, niveau 3, coût 1, cible un Démon allié) : jusqu'au début du prochain tour du lanceur, toute perte de Moral du Démon (attaque subie, mort d'un allié, Effroi…) est évitée et donne **1 lassitude** à la place (1 par événement, quel que soit le montant évité) ; toute perte d'Endurance est évitée et donne **1 lassitude par tranche de 10 END** évitées (le reliquat est conservé d'un coup à l'autre). *Abîme Grandissant* (Leader Démon, niveau 4, coût 2) : +5 ATK par tranche de 10 lassitude du contrôleur. *Cérémonie du Déclin* (Régiment Démon + Magicien, niveau 3, coût 3, arrière, 5/30/0/8/5, sacrifice niveau 2+ sans gain) : **+1 lassitude au début de chaque tour** de son contrôleur, et **chaque fois que ce contrôleur gagne des points de lassitude** (quelle qu'en soit la source : régiment détruit, comparaison de Moral, cartes…), il gagne **autant de ressources** (cumulable avec plusieurs exemplaires). *Veilleur d'Os* (Régiment Démon + Magicien, niveau 4, coût 4, arrière, Distance, 10/30/5/12/6, sacrifice niveau 3+ sans gain — le régiment sacrifié rejoignant la défausse avant l'arrivée, il peut être récupéré par le Veilleur lui-même) : première carte de **nécromancie** — à son arrivée, son contrôleur peut récupérer en main un régiment Démon de sa défausse (la carte quitte la défausse), au prix d'autant de lassitude que son niveau.
- **Fanatiques** (niveau 3, rôle Humain, peut être déployé au rang **avant ou arrière** au choix) n'a aucune ATK et sert avant tout de chair à sacrifice de qualité : le Démon qui le consomme comme sacrifice gagne **Effrayant 2** et **arrive prêt**, quel que soit son propre réglage d'héritage par ailleurs (les deux sources de bonus se cumulent, cf. règle de sacrifice ci-dessus).
- **Maître du Chenil Infernal** (niveau 5, rôle Démon + Magicien, coût 8, rang arrière, Distance, Effrayant 1, sacrifice niveau 4+) est la pièce de moteur de fin de partie : à la fin de **chaque tour de son propre contrôleur** (pas celui de l'adversaire), juste avant la résolution des combats, il comble **tous les emplacements vides du rang avant** de son contrôleur avec des Chiens Infernaux (qui gagnent Minions à cette occasion) — une chenil qui se régénère en continu tant qu'il reste en jeu. Restriction ajoutée après un premier test où l'effet se déclenchait aussi au tour adverse (bien trop fort, cf. section 15).

**[OUVERT]**
- Rattachement des Néphilims (version corrompue d'Ange) à cette faction, ou statut à part.
- Une Tactique dédiée façon "Pacte de sang" (sacrifice contre effet immédiat fort) reste à chiffrer.
- INI/MOR du Cultiste non précisés par l'auteur — valeurs par défaut (INI 10, MOR 3) posées pour le simulateur, à confirmer.
- Validation par playtesting du fait que le Démon doive apparaître dans le même rang que le sacrifié plutôt que n'importe où.

### Faction : Nomades
**Identité** : contrairement aux autres factions qui développent leur propre plateau, les Nomades jouent contre la main et le deck adverses — empêcher l'adversaire de déployer son armée avant même qu'elle n'arrive sur le plateau. Deux leviers : la **défausse** (retirer des cartes de la main adverse) et la **mise au rebut depuis le deck** (intercepter ou piocher pour l'adversaire, la carte filant en défausse au lieu d'arriver en main). Groupe mixte Elfes et Humains ; sa pièce maîtresse de fin de partie est le **Basilic**, nouvelle race (cf. section 4, liste des races).

**Nouvelle zone de jeu : la défausse**. Chaque joueur dispose désormais d'une pile de défausse, alimentée par les effets des Nomades (défausse forcée, carte piochée interceptée, carte du dessus du deck mise au rebut) **et par toute carte jouée ou détruite** : une **Tactique** jouée rejoint la défausse de son joueur après résolution ; un **régiment** détruit rejoint celle de son contrôleur ; un **Leader** qui quitte le jeu (porteur détruit, Leader détruit par Assassinat, Leader remplacé) rejoint celle du joueur qui l'avait joué. Exceptions : les jetons créés par effet (régiments Palissade, Chiens Infernaux du Maître du Chenil) et les cartes générées ou temporaires (Soin simple du Clerc, copies gratuites d'Archéotacticiens) disparaissent sans passer par la défausse. Cette règle ouvre la voie à une mécanique de **nécromancie** (récupérer des cartes dans sa défausse). Les cartes en défausse sont hors-jeu : elles ne sont pas rejouables ni rebrassées dans le deck, sauf via un effet explicite (Suppôt Infernal, cf. section 4).

**Mots-clés et mécaniques propres à la faction** :
- **Interception de pioche (Saboteur Nomade)** : tant qu'un Saboteur Nomade du joueur X est en jeu, chaque carte que l'adversaire de X pioche (pioche de début de tour, mort d'un régiment, Tuteur Démoniaque, etc. — toute source confondue) part **immédiatement en défausse** au lieu de rejoindre sa main, et le Saboteur perd un Moral égal au **coût** de la carte interceptée. Si son Moral tombe à 0 ou moins, il est détruit ; s'il était tombé **sous -1**, l'adversaire pioche malgré tout une carte en compensation (cette pioche de compensation n'est plus interceptée, le Saboteur étant mort).
- **Mise au rebut déclenchée par une blessure (Frondeur Nomade)** : si un régiment **blessé ce tour-ci** par un Frondeur Nomade est détruit (par n'importe quelle source), son contrôleur met la carte du dessus de son deck directement en défausse.
- **Défausse forcée à l'arrivée (Jeune Nomade)** et **pioche compensatoire à la mort (Jeune Nomade)** : symétrie volontaire — la carte la plus agressive et la moins chère de la faction punit l'adversaire à son arrivée, mais le rembourse partiellement s'il parvient à la détruire.
- **Réduction de coût ciblée (Charmeur de Basilics)** : à son arrivée, un régiment Basilic au hasard de la main de son contrôleur coûte 1 de moins — un exemplaire précis est désigné au hasard (et non "le premier Basilic joué" ni toutes les copies) grâce à une identité interne par exemplaire en main (cf. section 15, ajustements), donc si plusieurs Basilics sont en main en même temps, un seul d'entre eux profite de la réduction, comme l'effet le décrit.
- **"Les Basilics arrivent prêts" (Charmeur de Basilics)** : capacité passive tant que le Charmeur reste en jeu — tout régiment Basilic déployé n'importe où ignore la pénalité d'apparition.
- **Mirage** : Tactique sans cible qui fait rejouer **l'effet d'arrivée en jeu** (et uniquement celui-ci — pas les effets permanents ni les effets de mort) de tous les régiments Nomades actuellement en jeu de son contrôleur.
- **Rejeu d'arrivée via Leader (Maître de Caravane)** : contrairement à Mirage (effet ponctuel, tous les Nomades en jeu), le Maître de Caravane est un Leader qui ne fait rejouer l'effet d'arrivée que du **régiment précis** auquel il s'attache, au moment de l'attache — une version ciblée et répétable (un nouveau Maître de Caravane peut être posé sur un autre porteur) plutôt qu'un "board wipe" d'activations.
- **Mise au rebut ciblée par coût (Archéotacticiens)** : à son arrivée, fouille le deck adverse et en retire une carte Tactique, une carte Leader et un régiment — dans chaque catégorie, celle (ou l'une de celles, en cas d'égalité) qui a le **coût le plus élevé** plutôt qu'une carte au hasard sans condition. Punit particulièrement un deck adverse qui mise sur ses grosses cartes de fin de partie.
- **Copie gratuite sur Tactique défaussée (Archéotacticiens)** : capacité passive tant qu'il reste en jeu — toute carte Tactique qui atterrit dans la défausse adverse **autrement que parce que l'adversaire l'a jouée** (par son propre effet d'arrivée, par le mill du Frondeur Nomade, la défausse forcée du Jeune Nomade, etc.) offre à son contrôleur une copie exacte de cette Tactique, gratuite (coût 0) directement en main. Cette copie n'est pas permanente : si elle n'a pas été jouée, elle se détruit à la fin du tour de son contrôleur (pas celui de l'adversaire).
- **Bonus de fin de partie scalant sur la défausse adverse (Basilics du Désert)** : à son arrivée, gagne +5 Endurance, +1 Armure, +3 Initiative et +1 Moral **par régiment actuellement dans la défausse de l'adversaire** — une pièce de finisseur qui récompense directement tout le travail de sabotage fait par le reste de la faction avant son arrivée, plutôt qu'un gros corps à stats fixes.

**Cartes du prototype** : la liste complète (Jeune Nomade, Frondeur Nomade, Saboteur Nomade, Charmeur de Basilics, Basilics de l'Oasis, Mirage, Maître de Caravane, Archéotacticiens, Basilics du Désert) est tenue à jour dans le **[Compendium des cartes](https://claude.ai/artifact/Qu2WyGn3EAiWHgbb97tuGb)**. Quelques exemples pour donner le ton :
- **Jeune Nomade** (niveau 1, coût 1, rang avant, arrive prêt) force l'adversaire à défausser une carte au hasard dès son arrivée, et lui offre une pioche de compensation s'il meurt — la pression qu'il inflige a un prix si l'adversaire parvient à le tuer vite.
- **Saboteur Nomade** (niveau 3, coût 3, slot isolé, 0 ATK) n'attaque jamais mais verrouille toute pioche adverse tant qu'il tient, au prix de son propre Moral qui s'effondre à mesure qu'il intercepte des cartes chères.
- **Basilics de l'Oasis** (niveau 3, coût 5, rang avant ou arrière au choix) récompense le choix de rang à la pose : +10 Endurance s'il reste au contact, ou Distance + 30 Initiative s'il est posé en soutien — première carte du jeu dont l'effet d'arrivée dépend entièrement du rang choisi.
- **Archéotacticiens** (niveau 4, coût 3, rang arrière, Distance) frappe le deck adverse trois fois à son arrivée (Tactique, Leader et régiment les plus chers), puis continue de transformer chaque Tactique adverse défaussée en copie gratuite tant qu'il tient le terrain — une carte de contrôle qui se nourrit du reste du sabotage de la faction.

**[OUVERT]**
- La défausse reste pour l'instant une zone purement passive (rien ne la recycle) — une future carte pourrait vouloir piocher depuis sa propre défausse ou celle de l'adversaire.
- Interaction Saboteur Nomade / Tuteur Démoniaque non testée en partie réelle : le Tuteur étant une pioche ciblée dans le deck, elle est elle aussi interceptée par un Saboteur adverse comme une pioche normale — cohérent avec l'esprit de la carte, à confirmer à l'usage.
- INI d'Archéotacticiens non précisée par l'auteur — valeur par défaut (25) posée pour le simulateur, cohérente avec les autres régiments Distance de rang arrière, à confirmer.
- Le "coût le plus élevé" utilisé par Archéotacticiens pour choisir sa cible dans le deck adverse est le coût de base affiché sur la carte (pas un coût recalculé en tenant compte d'une réduction en cours, comme celle du Charmeur de Basilics) — différence qui ne devrait jamais se voir en pratique puisqu'on regarde dans un deck, pas dans une main, mais à garder en tête si la mécanique évolue.

### Rôle des types
- **Cible d'effet** : un régiment peut octroyer un bonus (de stats, de mots-clés...) à tous les régiments d'un type donné. Ex : un régiment qui donne un bonus de statistiques à tous les régiments **Empire** en jeu (effet "bannière" / tribal).
- **Prérequis d'effet** : une carte Tactique peut n'être jouable que sur des régiments d'un type précis, ou avoir un **effet renforcé** contre/sur les régiments d'un type donné.
- **Prérequis de Leader** : cf. section 3, règle de compatibilité de types.

### Types et mots-clés : une association naturelle, pas obligatoire
Certains types sont naturellement associés à des mots-clés ou des tendances de stats, sans que ce soit une règle rigide :
- Les **Archers** seront naturellement à distance (RANGE > 0).
- Les **Chevaliers** auront naturellement une Armure (ARM) plus élevée que leurs homologues.
- Ces associations restent des **tendances de design**, pas des contraintes strictes — une carte peut très bien casser l'attente (un Archer sans portée particulière, un Chevalier fragile) si l'effet de la carte le justifie.

**[OUVERT]**
- Système des versions corrompues : mécanique de transformation en cours de partie, ou simplement des cartes distinctes dès la conception (ex : Néphilim est une carte à part, pas une transformation d'Ange) ?
- Rattachement des races non encore assignées (Ange, Démon, Géant, Vampire, Kraken, Léviathan, Béhémoth, Basilic) à de futures factions, ou statut neutre/monstre transversal aux factions.
- Un régiment a-t-il un nombre maximum de types cumulables ?
- Premiers exemples concrets d'effets "bannière"/tribaux et de Tactiques à ciblage typé, pour valider le système en pratique.

### Statut "Unique" (règle des Légendes)
Certaines cartes (ex : le Phénix) portent le statut de **Légende** : elles ne peuvent exister qu'en un seul exemplaire simultanément en jeu, quelle que soit la zone.

**Règle des Légendes :**
- Chaque fois qu'une Légende arrive dans l'une des zones suivantes : **Main, Champ de bataille, Cimetière, Exil**, toutes les autres Légendes du même nom (peu importe leur zone d'origine) sont envoyées dans une zone spéciale, la **zone des légendes**.
- Lorsqu'une Légende devrait être envoyée au Cimetière ou en Exil (peu importe d'où elle vient), les joueurs concernés doivent choisir entre deux issues : soit la Légende se déplace effectivement vers cette zone, soit les autres Légendes du même nom précédemment envoyées en zone des légendes par cette même règle retournent dans leur zone d'origine à la place.
- Ce choix se résout par un **vote** : chaque carte présente dans la zone des légendes compte pour une voix.
- **En cas d'égalité**, c'est le **propriétaire de la carte en déplacement** qui tranche.

### Rôles de combat
Liste non exhaustive des rôles envisagés à ce stade, avec leur tendance de conception (cf. principe "association naturelle, pas obligatoire" ci-dessus) :

| Rôle | Tendance de conception |
|---|---|
| **Soldat** | Rôle de base, sans spécialisation marquée |
| **Lancier** | Dégâts bonus contre les régiments Monté |
| **Chevalier** | Armure (ARM) plus élevée |
| **Recrue** | Coût faible |
| **Élite** | Moral (MOR) élevé |
| **Monté** | Cavalerie au sens large — pas limité aux chevaux (chevaucheurs de hyènes ou autres montures envisageables) |
| **Archer** | Portée (RANGE > 0) |
| **Arbalétrier** | Portée et dégâts élevés, mais attaque moins souvent |
| **Magicien** | Magie offensive |
| **Clerc** | Magie défensive |
| **Support** | Logistique |

**[OUVERT]**
- Liste volontairement non exhaustive — d'autres rôles viendront s'ajouter au fil de la conception des cartes.
- Mécanique exacte derrière "attaque moins souvent" (Arbalétrier) : cadence fixe (ex : un tour sur deux), stat de cadence dédiée, ou lié à l'Initiative existante ?
- **Système de magie (Magicien/Clerc) — direction confirmée** : pas de ressource dédiée type "mana" (jugée trop complexe en plus de la Ressource et du Niveau). Un régiment Magicien/Clerc en jeu **génère des cartes de sort directement en main au début du tour de son contrôleur**, correspondant aux sorts qu'il peut lancer. **Premier exemple chiffré** : le Clerc de la Forêt génère *Soin simple* (Tactique, coût 0, niveau 1, cible un allié quelconque, +10 Endurance) à chaque tour tant qu'il est en jeu. Détails encore à préciser pour les futurs Magiciens/Clercs : une carte générée par tour est-elle la norme, ou certains en génèrent plusieurs / des sorts différents ? Sorts liés à un porteur précis ou à un pool commun ? Que devient une carte de sort générée si elle n'est pas jouée (défaussée en fin de tour ? conservée) ?

---

## 5. Boucle d'acquisition des cartes

- **Collection du joueur** : chaque carte peut être possédée en **3 exemplaires au maximum**. Un nouveau joueur commence avec **1 exemplaire de chaque carte** collectionnable (jetons et cartes de scénario exclus).
- **Monnaie du jeu (pièces)** : **+5 pièces par victoire** contre l'ordinateur en partie locale ou par scénario de campagne réussi (pas en mode à deux ni en spectateur). Aucune monnaie achetable : la monnaie se gagne uniquement en jouant.
- **Paquets** : un paquet coûte **5 pièces** et contient **5 cartes** tirées dans l'intégralité du pool collectionnable (pas de rareté pour l'instant). Un exemplaire tiré alors qu'on en possède déjà 3 rapporte **1 pièce** à la place.
- **Campagne** : le pool de la campagne est **séparé** de la collection du joueur. À la fin d'une campagne, on compare les deux : pour chaque carte, la collection monte au nombre d'exemplaires du pool de campagne (3 maximum) — ex. 1 Cavaliers Elfes en collection et 2 en fin de campagne → 2 en collection. Une campagne n'est comptée qu'une fois.
- **Option « Toutes les cartes débloquées »** : toutes les cartes à 3 exemplaires pour les parties locales et le créateur de deck (sans modifier la collection).
- **Règles de construction d'un deck** : 3 exemplaires maximum par carte ; au moins **3 régiments de niveau 1** ; au moins **30 cartes de niveau 1 à 3** ; au moins **15 cartes de niveau 4-5**.
- **Pistes futures** : raretés, skins alternatifs de cartes, extensions.

**[OUVERT]** Modèle économique global du jeu — décision reportée. La philosophie reste « pas de RNG payant » : les paquets aléatoires ne s'achètent qu'avec la monnaie gagnée en jeu.

---

### Campagnes et jeu en ligne

- **Quatre campagnes** racontent la même histoire de quatre côtés (détail : `docs/CAMPAGNES.md`) : Démons « Les Œufs du Dragon », Elfes « La Purification », Nomades « Les sables ne plient pas », Empire « La frontière de Kragz ». Toutes disponibles dès le départ, ordre conseillé : Démons → Elfes → Nomades → Empire.
- **Jeu en ligne (premier jet)** : partie entre deux navigateurs, en pair-à-pair. Le moteur étant déterministe, seules les actions sont échangées. Connexion par code court (service de mise en relation gratuit) ou par codes à copier-coller. Une victoire rapporte 5 pièces. Un serveur ne deviendra nécessaire que pour un mode classé ou une économie protégée contre la triche.

---

## 6. Ressource et pioche

- **Ressource** : chaque joueur dispose au début de son tour d'une ressource **égale à son niveau actuel** (1 à 5) — pas de croissance cumulative indépendante, la ressource suit directement le système de niveau (section 7). **La ressource non dépensée en fin de tour est reportée au tour suivant**, en plus de la ressource de base du nouveau tour.
- Sert à payer le coût des cartes, en complément du niveau requis.
- **Pioche** : le nombre de cartes piochées en début de tour dépend aussi du niveau — **1 carte** aux niveaux 1 et 2, **2 cartes** aux niveaux 3 et 4, **3 cartes** au niveau 5 (depuis le 17/10/2026 ; auparavant 1/2/2/3/3).
- **Limite de main** : si un joueur a **10 cartes ou plus** en main au moment de la pioche de **début de tour**, il **défausse d'abord autant de cartes (de son choix) qu'il va en piocher**, puis il pioche normalement. La pioche ne peut donc jamais être bloquée et le deck continue de s'épuiser. Cette règle ne concerne que la pioche de routine : les autres effets qui font piocher ou créent des cartes en main (mort d'un régiment, Tuteur Démoniaque, sorts du Clerc, etc.) ne sont pas limités.
- **Main de départ** : chaque joueur commence la partie avec **5 cartes** en main : **3 régiments de niveau 1 garantis**, puis les 2 cartes restantes piochées normalement dans le reste du deck — pensé pour éviter un tour 0 frustrant faute de carte de niveau 1 jouable, l'aléatoire pur s'étant révélé trop défavorable dans certains tirages.
- **Réserve de niveau 4-5** : les cartes de niveau 4 et 5 restent **hors du deck** en réserve et n'y sont mélangées qu'au moment où le joueur atteint le niveau 4 — elles ne peuvent donc jamais être piochées avant que le joueur soit en mesure de les jouer.

---

## 7. Système de niveau

Mécanique centrale qui différencie ce jeu d'un TCG classique et sert de garde-fou anti-snowball.

### Règles
- Chaque carte a, en plus de son coût en ressource, un **niveau requis**. Un joueur de niveau *N* peut jouer toute carte de niveau *N* ou inférieur (seuils cumulatifs, pas paliers exclusifs).
- **Le niveau ne redescend jamais** : même si le total de points de lassitude repasse sous un seuil (via des cartes qui en retirent, cf. Elfes), le joueur conserve son niveau acquis — perdre de la lassitude ne l'éloigne que de la défaite.
- Chaque joueur possède **son propre compteur de niveau** (1 à 5) et **son propre total de points de lassitude** accumulés au fil de la partie. (Ces points s'appelaient auparavant « points de niveau » ; ils font monter de niveau, mais mesurent aussi l'usure de l'armée et rapprochent de la défaite.)

### Seuils de niveau (points de lassitude cumulés nécessaires)

| Niveau | Points de lassitude cumulés requis |
|---|---|
| 2 | 4 |
| 3 | 9 |
| 4 | 16 |
| 5 | 25 |
| **Défaite** | 25 points supplémentaires après avoir atteint le niveau 5 (soit 50 points cumulés au total) |

*(Suite logique en carrés parfaits : 2², 3², 4², 5².)*

### Sources de points de lassitude
- **Régiment détruit** : à chaque fois qu'un régiment est détruit, **son contrôleur** (le joueur qui le possédait, pas celui qui l'a détruit) gagne un nombre de points de lassitude égal au **niveau de ce régiment**.
- **Fin de tour** : à la fin de chaque tour, le joueur dont l'armée a le **Moral total le plus bas** gagne des points de lassitude selon le **niveau le plus élevé parmi les deux joueurs** : **1 / 1 / 2 / 2 / 3** aux niveaux 1 / 2 / 3 / 4 / 5 (auparavant : autant que ce niveau).
- **Effets de cartes** : certaines cartes en accordent directement (Tuteur Démoniaque, cf. section 4).

### Intention de design
Le joueur en tête doit conclure la partie avant que son adversaire, en rattrapant son retard en niveau (via ses pertes de régiments et son désavantage de Moral), n'accède à des cartes assez fortes pour renverser la situation — et inversement, être en retard donne accès à de meilleurs outils mais rapproche dangereusement de la défaite par dépassement de niveau (le total de 50 points cumulés). Ça crée une urgence des deux côtés du plateau, à des moments différents de la partie.

**[OUVERT]**
- Cas d'égalité stricte de Moral entre les deux joueurs en fin de tour : personne ne gagne de points, ou les deux ?
- Validation par playtesting de la courbe en carrés parfaits (est-ce que l'écart croissant entre les paliers reste jouable en pratique ?).


---

## 8. Plateau de combat

### Structure
- **Ligne unique par joueur, sur deux rangs** : un rang avant et un rang arrière, face à l'adversaire.
- **4 slots en rang avant**, **3 slots en rang arrière**, positionnés **en quinconce** (chaque slot arrière est "entre" deux slots avant plutôt qu'aligné avec un seul).
- **1 slot isolé** supplémentaire, très difficile à cibler, réservé à des unités de soutien particulières (cavalerie, artillerie, logistique...).

### Combat
- **Résolution automatique, à la fin de CHAQUE tour** (donc deux fois par round complet : une fois à la fin du tour du joueur actif, une fois à la fin du tour de son adversaire). Tous les régiments engagés frappent dans l'**ordre décroissant d'Initiative (INI)** — résolution globale sur tout le plateau, pas simultanée par clash. Un régiment à haute INI peut donc tuer sa cible avant qu'elle n'ait l'occasion de riposter.
- **Mot-clé "Lent"** : un régiment portant ce mot-clé **n'attaque pas lors du combat de fin de tour adverse** — il ne participe qu'au combat de fin de son propre tour (soit une seule fois par round, contre deux fois pour un régiment normal).
- **Pénalité d'apparition** : le tour où un régiment est déployé, il **ne fait pas ses dégâts maximum** au combat (un "rodage" plutôt qu'une incapacité totale d'agir) — mécanisme distinct de la dégradation d'ATK liée à l'Endurance (section 9), taux exact encore à définir.
- **Régiment "prêt"** : exception à la pénalité d'apparition ci-dessus — un régiment qui **arrive prêt** (précisé individuellement sur sa carte, ou accordé ponctuellement par un effet) **ne subit pas** la pénalité d'apparition le tour où il arrive. Premier exemple : l'Élémentaire de Feu (section 14) arrive toujours prêt ; Fanatiques (section 14) rend prêt le Démon qui le sacrifie pour apparaître.
- **Protection confirmée** : **mes propres régiments du rang avant protègent mes régiments du rang arrière** (et non l'inverse). Chaque slot arrière est protégé tant que les slots avant adjacents (position en quinconce) sont occupés côté du même joueur.
- **Rang avant (mêlée)** : chaque régiment avant (sans le mot-clé Distance) frappe le régiment adverse du slot en vis-à-vis (mêlée contre mêlée). Un régiment avant **avec Distance** vise comme depuis l'arrière : n'importe quel emplacement avant ou arrière adverse, au Moral le plus bas (règle du 17/10/2026).
- **Règle de percée** : si le slot avant adverse en face est **vide**, le régiment avant frappe alors directement un régiment du **rang arrière** adverse plutôt que de rester sans cible. **S'il existe plusieurs cibles possibles** (le slot vide étant adjacent à deux régiments arrière en quinconce), **c'est le régiment au Moral le plus bas qui est ciblé**.
- **Rang arrière** : un régiment arrière **sans Distance** ne peut attaquer que ce qui lui fait directement face — les **deux emplacements avant adverses adjacents** (le Moral le plus bas est visé) et, s'ils sont vides, le **régiment arrière en miroir** ; s'il n'y a personne en face, il n'attaque pas. Un régiment arrière **avec Distance** peut viser **n'importe quel emplacement avant ou arrière** adverse (hors slot isolé), toujours au Moral le plus bas. Un régiment du **slot isolé** n'attaque **que s'il a Distance** ; il vise alors n'importe quel emplacement avant ou arrière adverse (Moral le plus bas), jamais le slot isolé adverse. Il ne participe pas au clash de mêlée, sauf s'il est exposé par la règle de percée ci-dessus.
- **Slot isolé** : emplacement unique, très difficile à cibler, réservé aux unités de soutien spéciales (cavalerie, artillerie, logistique...). En contrepartie de cette quasi-intouchabilité, les cartes éligibles à ce slot ont généralement une **durée de vie limitée intégrée** :
  - Unités **à durée de vie** (ex : logistique, ATK 0) : quittent le plateau après un **nombre de tours fixe**. Le mot-clé *Non-combattant* n'existe plus : une unité qui ne doit pas attaquer a simplement **0 ATK**.
  - Unités **combattantes** (ex : cavalerie, artillerie) : perdent de l'**Endurance à chaque combat** auquel elles participent, même en l'absence de riposte adverse (usure).
  - **Exception assumée** : l'État Major (section 14) a 0 ATK mais **sans durée de vie fixe par tours** — contrepartie jugée suffisante par son faible impact direct (0 ATK, pas de combat) face à l'intouchabilité du slot isolé. Il n'est cependant **pas increvable pour autant** : avec seulement 5 Moral de base, et comme tout régiment non-Minions il perd 1 Moral à chaque régiment allié détruit (règle générale, section 9), il tombe à 0 Moral — donc est détruit — au bout de 5 pertes subies par son armée, qu'il ait combattu ou non. C'est une mort "par attrition passive" plutôt qu'une limite de durée fixe, mais ça borne quand même sa durée de vie dans une armée qui encaisse des pertes. À surveiller en playtest si ce seuil de 5 s'avère trop généreux ou trop fragile.
- **Pas de mécanique de "board wipe"** : décision de conception assumée — le jeu doit récompenser la construction et le maintien d'une armée cohérente, pas la destruction totale du plateau adverse en un coup.

**[OUVERT]**
- *(point mis de côté pour l'instant, à revenir plus tard)* Mécanique exacte de "très difficile à cibler" du slot isolé : immunité totale sauf effets spécifiques ? ou juste une priorité de ciblage très basse ?
- Valeurs précises : nombre de tours pour les unités à durée de vie du slot isolé, taux de perte d'Endurance pour les combattants du slot isolé.

---

## 9. Stats des régiments

| Stat | Abréviation | Rôle |
|---|---|---|
| Attaque | ATK | Dégâts infligés au contact ou à distance |
| Endurance | END | Points de vie ; un régiment encaisse des dégâts sur plusieurs tours, ne meurt pas nécessairement en un clash |
| Armure | ARM | Réduction fixe des dégâts subis (ATK adverse − ARM) |
| Initiative | INI | Détermine l'ordre global de résolution des combats sur tout le plateau — du plus rapide au plus lent, une INI plus haute peut infliger ses dégâts avant de subir les siens |
| Moral | MOR | Sert de jauge de résistance psychologique du régiment. **Sert aussi de métrique de "force" du plateau pour le système de niveau (section 7)** : la somme du Moral de tous les régiments en jeu détermine qui domine le champ de bataille. |

*(La Portée n'est plus une stat numérique — remplacée par le mot-clé **Distance**, cf. ci-dessous et section 8.)*

### Mot-clé : Distance
Remplace l'ancienne stat "Portée". Un régiment portant le mot-clé **Distance** tire depuis le rang arrière sans participer au clash de mêlée (sauf s'il est exposé par la règle de percée, section 8) ; un régiment qui ne le porte pas est un combattant de mêlée, cantonné au rang avant.

### Règles de Moral
- Un régiment perd **1 point de Moral** à chaque fois qu'il **subit une attaque** (indépendamment des dégâts d'Endurance encaissés).
- Un régiment perd **1 point de Moral** lorsqu'un **régiment allié** (du même contrôleur) est détruit.
- Un régiment gagne **1 point de Moral** lorsqu'il **détruit** un autre régiment.
- Lorsqu'un régiment a perdu **2/3 de son Moral** (il ne lui reste plus qu'un tiers ou moins de son Moral maximal), il perd ses **mots-clés positifs**, y compris les mots-clés fonctionnels comme **Distance** et **Pénétration** (un archer au Moral brisé frappe alors comme un régiment arrière sans Distance) : on dit alors qu'il a le **Moral brisé**. Les mots-clés négatifs (Lent) restent, et Minions reste aussi (sinon il ne servirait presque jamais, un régiment mourant ayant souvent le Moral brisé). Il perd aussi les bonus de son Leader et ses capacités propres, mais **les bonus des tactiques s'appliquent toujours** (À couvert, Formation en carré, Dernier carré… ; règle du 18/10/2026).
- **Destruction** : un régiment est détruit lorsque son Moral atteint **0**, *ou* lorsque son Endurance atteint **0** — les deux jauges sont fatales indépendamment l'une de l'autre (règle confirmée après premiers tests sur le simulateur, section 15).
- **Récupération du Moral brisé** : un régiment qui regagne du Moral au point de dépasser à nouveau le seuil d'un tiers de son Moral maximal **retrouve ses mots-clés positifs** (le statut de Moral brisé n'est pas permanent, il se recalcule à chaque soin de Moral). Premier effet à exploiter cette règle : l'État Major (section 14), qui rallie chaque tour les régiments Empire au Moral brisé.

*Ces règles de Moral sont un premier jet à valider par le playtesting — l'autrice/l'auteur du jeu note lui-même qu'il faudra voir à terme si l'équilibre fonctionne comme espéré.*

### Mot-clé : Minions
Un régiment portant le mot-clé **Minions** est une unité de figuration jetable : à sa destruction, il **ne fait perdre aucun point de Moral aux alliés restants**, et **ne rapporte aucun point de lassitude** à son contrôleur (exception aux règles générales de Moral et de score ci-dessus). Le gain de +1 Moral pour l'unité qui l'a tué reste inchangé. En revanche, un régiment Minions **ne regagne pas de Moral** quand il détruit un régiment (règle du 24/10/2026). Utilisé notamment par les régiments créés par la tactique **Palissade** (section 14).

### Mot-clé : Effrayant X
Quand un régiment portant **Effrayant X** attaque, la cible perd **X point(s) de Moral supplémentaires**, en plus du 1 point perdu pour avoir simplement subi une attaque — soit (1 + X) au total. **Les Effrayant s'additionnent** : un régiment qui a déjà Effrayant X et gagne Effrayant Y passe à Effrayant X+Y (ex. Démon d'Akantha, Effrayant 2, qui sacrifie des Fanatiques : Effrayant 4). C'est la règle de **tous les mots-clés chiffrés** (Pénétration d'armure comprise). Comme les autres bonus offensifs liés aux mots-clés, il est désactivé si le porteur a le Moral brisé (perte des mots-clés positifs, cf. ci-dessus). Introduit avec la faction Invocateurs de Démons (section 4).

### Statut : Sonné
Un régiment **sonné** ne participe pas au combat de fin de tour en cours (il n'attaque pas), puis redevient normal au combat suivant — c'est un effet ponctuel, pas un mot-clé permanent de la carte. Introduit par **Rangers** (section 14, Royaumes Elfiques) : le régiment qu'il attaque est sonné pour le reste du combat de fin de tour en cours. Si ce régiment sonné est ensuite détruit par un régiment Elfe avant la fin du combat, Rangers et le régiment Elfe qui l'a achevé regagnent chacun 2 Moral.

### ATK et Endurance : dégradation au combat
Plus un régiment est blessé, moins il se bat efficacement. L'ATK effective d'un régiment dépend en continu de son **Endurance actuelle** par rapport à son Endurance maximale (recalculée à chaque fois que le régiment attaque, pas seulement à son déploiement) :

`ATK effective = (1/2 × ATK de base) + (Endurance actuelle / Endurance max) × (1/2 × ATK de base)`

- À pleine Endurance, l'ATK effective est égale à l'ATK de base (ratio = 1).
- Plus l'Endurance actuelle baisse, plus l'ATK effective diminue, avec un **plancher à 50 % de l'ATK de base** lorsqu'il ne reste plus qu'1 point d'Endurance.
- **Une unité dont l'ATK effective est inférieure ou égale à 0 n'attaque pas** ce combat (elle ne cible personne et ne déclenche aucun effet lié à l'attaque). Concerne surtout les régiments à ATK de base nul ou très faible, comme les régiments de soutien non-combattants (ex : Paysans).

**[OUVERT]**
- Arrondi de la formule (à l'entier le plus proche, arrondi inférieur/supérieur ?).
- La pénalité d'apparition (section 8) reste un mécanisme **distinct** de cette formule (un régiment fraîchement déployé est à pleine Endurance, donc à pleine ATK selon cette formule — le taux de réduction spécifique au tour d'apparition reste encore à définir séparément).

---

## 10. Conditions de victoire et de défaite

- **Pas de points de vie joueur.**
- **Défaite automatique** si un joueur n'a **aucun régiment sur le plateau à la fin de son propre tour**, **l'emplacement isolé exclu** (règle du 22/10/2026 : un régiment isolé seul ne suffit pas).
- **Défaite classique** si le deck est vide au moment de piocher (fatigue/deck-out).
- **Défaite par dépassement de niveau** (section 7).
- **Conditions de victoire alternatives** : portées par des **cartes spécifiques** (effet de carte qui offre une voie de victoire différente), plutôt qu'une règle systémique du jeu de base.

**[OUVERT]** Exemples concrets de cartes à condition de victoire alternative (quel type d'objectif : survie d'une carte X tours, accumulation d'une ressource, combo spécifique ?).

---

## 11. Plateforme et développement

- **Cible** : PC / Mac, jouable en navigateur ou en application.
- **Moteur recommandé** : Godot (open-source, gratuit, GDScript accessible avec des notions de code de base) — alternative : Unity si besoin d'assets/tutoriels spécifiques TCG tout faits.
- **Mode de jeu prévu** : solo contre IA (prioritaire, plus simple à développer seul) puis multijoueur PvP en ligne à terme (à ne pas attaquer en premier — complexité technique élevée).
- **Contexte projet** : hobby personnel, sans deadline.

---

## 12. Points ouverts — récapitulatif

- Types de cartes : autres types de cartes à venir (terrain, événement, faction...).
- Types de régiments : système des versions corrompues, rattachement des races restantes à des factions, nombre max de types cumulables, premiers exemples d'effets tribaux/typés.
- Cadence exacte de l'Arbalétrier, et détails du système de génération de cartes de sort par les Magiciens/Clercs.
- Système de niveau : gestion de l'égalité stricte de Moral en fin de tour, validation par playtesting de la courbe en carrés parfaits.
- Taux exact de réduction des dégâts au tour d'apparition d'un régiment (mécanisme distinct de la formule ATK/Endurance, cf. section 9).
- Arrondi de la formule ATK/Endurance ; validation par playtesting des règles de Moral (perte sur attaque subie/perte d'allié, gain sur destruction, seuil des 2/3 pour la perte des mots-clés positifs).
- Degré d'intouchabilité du slot isolé, et valeurs précises de ses règles d'usure (durée en tours / perte d'Endurance) — *mis de côté pour plus tard*.
- Exemples concrets de cartes à condition de victoire alternative.
- Modèle économique / de commercialisation (reporté).
- **[HYPOTHÈSE] Catégorie « Piège »** : cartes posées à l'avance qui se déclenchent à un événement précis (attaque, arrivée en jeu d'un régiment, etc.) — pas retenue pour l'instant. Raison : sur les TCG en ligne, pouvoir jouer à tout moment (cartes réactives, fenêtres de réponse) allonge fortement les parties à cause des temps d'attente entre joueurs, et complique le mode « par correspondance » (chaque réaction forcerait l'autre joueur à attendre). À rouvrir plus tard si le besoin de jeu réactif se fait sentir ; un piège à déclenchement automatique resterait la version la moins coûteuse en attente.

---

## 13. Prochaines étapes suggérées

1. Playtester les exemples de cartes de la section 14 pour sentir le rythme d'une partie.
2. Étoffer chaque faction avec assez de cartes pour couvrir tous les rôles de combat et tous les niveaux (1 à 5).
3. Trancher les points ouverts qui bloquent le prototypage (cadence de l'Arbalétrier, paliers de Moral, réduction de dégâts à l'apparition).
4. Une fois quelques dizaines de cartes rédigées, lancer un vrai prototype papier/tableur pour tester l'équilibrage avant de coder quoi que ce soit.

---

## 14. Exemples de cartes (prototype)

*Noms provisoires, à adapter au lore — l'objectif ici est de tester le système de règles en pratique, pas de figer le flavor. Stats (ATK/END/ARM/INI/MOR) multipliées par 5 par rapport au premier jet, pour un panel de valeurs plus large ; Niveau et Coût en ressource restent inchangés (liés aux systèmes déjà chiffrés en sections 6-7). La Portée est devenue le mot-clé **Distance** (cf. section 9).*

**La liste complète des cartes (Empire, Royaumes Elfiques, Invocateurs de Démons, neutres) est tenue dans un document séparé, le [Compendium des cartes](https://claude.ai/artifact/Qu2WyGn3EAiWHgbb97tuGb)**, filtrable par faction et par type et mis à jour à chaque carte créée ou modifiée — pour garder cette section du GDD lisible à mesure que le roster grandit, elle ne recopie plus les tableaux de stats complets, seulement les enseignements de design ci-dessous et quelques exemples ponctuels ailleurs dans le document (Cultiste, Démon d'Akantha... cf. section 4).

### Ce que ces exemples mettent en lumière
- Le **Dragon Impérial** (Niv. 5) illustre le haut du spectre de puissance/coût, cohérent avec le système de niveau — injouable avant la fin de partie ou un net désavantage.
- **Sylvain, Gardien Élémentaire** est le seul régiment à cumuler Elfe + Élémentaux, ce qui justifie de pouvoir accueillir le Druide Ancien — bon test du principe de compatibilité de types.
- Le **Clerc de la Forêt** occupe le slot isolé avec 0 ATK (durée de vie : 3 tours), générant la carte **Soin simple** plutôt que de se battre — illustre concrètement la mécanique de magie retenue, désormais avec un premier sort chiffré.
- **Moral divisé par 3** sur tous les régiments, et **ressource non dépensée reportée au tour suivant** — ajustements confirmés après playtest sur le simulateur (section 15).
- L'**Arbalétrier Impérial** a des stats élevées mais sa "cadence lente" reste à formaliser (section 4, point ouvert).
- **Auto-équilibrage confirmé** : une armée tout-Recrues reste bon marché à jouer, mais son Moral total faible la fait presque systématiquement perdre la comparaison de fin de tour — son contrôleur gagne donc des points de lassitude à chaque tour malgré son avantage économique. La mécanique se régule donc naturellement, sans besoin de règle supplémentaire.

**[OUVERT]** Ces valeurs numériques sont un premier jet, non équilibrées — un vrai passage de playtesting sera nécessaire une fois plusieurs dizaines de cartes rédigées.

---

## 15. Simulateur de test

Un prototype jouable (page web interactive, hotseat à deux mains visibles) implémente l'ensemble des règles ci-dessus pour vérifier qu'elles s'articulent correctement : plateau, déploiement, combat automatique, formule ATK/Endurance, Moral, niveau/points, conditions de victoire.

**Lien** : https://claude.ai/artifact/MUX8jikS2TbX13hNNGsknL

Le simulateur documente lui-même, dans un encart "Hypothèses", les choix faits là où le GDD était encore silencieux (ciblage à distance, égalité de Moral, etc.) — à consulter en complément de ce document.

### Ajustements issus des premiers tests
- **Destruction à 0 d'Endurance** ajoutée en complément de la destruction à 0 de Moral (cf. section 9) — les deux jauges tuent indépendamment.
- **Pénalité d'apparition** confirmée à -50 % d'ATK.
- **Ciblage à Moral le plus bas** confirmé pour toute percée ou tir à distance offrant plusieurs cibles.
- **Endurance de tous les régiments doublée** (cf. section 14) suite aux premiers tests — les combats duraient trop peu de tours avec les valeurs initiales.
- **Ressource égale au niveau du joueur**, avec **report de la ressource non dépensée** au tour suivant ; **pioche progressive** (1/2/3 cartes selon le niveau) ; **main de départ à 5 cartes** ; **cartes de niveau 4-5 tenues en réserve** hors deck jusqu'au niveau 4 (cf. section 6).
- **Moral de tous les régiments divisé par 3** — à l'inverse de l'Endurance, le Moral rendait les combats trop longs.
- **Premier sort concret pour le Clerc de la Forêt** : *Soin simple* (Tactique, coût 0, niveau 1, cible un allié quelconque, +10 Endurance), généré en main à chaque tour de son contrôleur.
- **Trois nouvelles cartes** : Paysans (génère de la ressource pour son contrôleur), Lieutenant (Leader Empire, bonus d'ATK/INI/Moral) et Chamane de la Forêt (Leader Elfe, soin à l'arrivée puis récurrent) — cf. section 14.
- **ATK effective ≤ 0 : l'unité n'attaque pas** ce combat (cf. section 9) — évite qu'un régiment à ATK nul (ex : Paysans) inflige inutilement une perte de Moral à sa cible pour 0 dégât.
- **Animation de combat** ajoutée au simulateur : une flèche part de l'attaquant vers sa cible, dans l'ordre d'Initiative, pour suivre le déroulement coup par coup.
- **Deux nouvelles tactiques et un nouveau mot-clé** : *Palissade* (coût variable, crée un régiment Minions par emplacement vide du rang avant) et *À couvert* (coût 1, −20 ATK / +30 ARM sur un allié ciblé, pour un tour de combat) — cf. section 14. Le mot-clé **Minions** (section 9) a été introduit à cette occasion : une unité qui en est porteuse ne coûte pas de Moral aux alliés et ne rapporte pas de point à sa mort.
- **Coût de À couvert réduit de 2 à 1** après un premier test (2 semblait trop cher pour un effet défensif ponctuel).
- **Règle de faction par défaut pour les Tactiques** précisée (section 3) : neutre sauf ciblage typé spécifique.
- **Écran de sélection des factions** ajouté au simulateur : avant chaque partie (et à chaque "Nouvelle partie"), chaque joueur choisit sa faction dans une liste de cartes cliquables plutôt que d'avoir Empire/Royaumes Elfiques imposés par défaut — pensé pour accueillir de futures factions sans changement de structure.
- **Troisième faction jouable : Invocateurs de Démons**, avec sa mécanique de sacrifice (cf. section 4), sélectionnable dans l'écran de choix de faction.
- **Nouvelle règle de Leader : "doit déjà porter un Leader"** (Suppôt Infernal) — un Leader peut désormais exiger que sa cible porte déjà un autre Leader, qu'il remplace en s'attachant (règle "un seul Leader à la fois" inchangée) ; premier cas d'usage d'un Leader qui n'impose aucun type requis.
- **Révision de la faction Démons** : les premières esquisses *Démon Mineur*/*Démon Majeur* (héritage automatique de stats + mots-clés) sont retirées, remplacées par des cartes à effet propre où l'héritage sur sacrifice est configuré carte par carte (cf. section 4) — Cultiste revu (chair à canon qui fait piocher à sa mort plutôt qu'un simple corps faible), et quatre nouvelles cartes : Chien Infernal, Esclave Guerrier, Prêtre Sacrificiel, Démon d'Akantha. Nouveau mot-clé **Effrayant X** (section 9).
- **Compendium des cartes** créé comme document séparé du GDD : liste exhaustive et filtrable de toutes les cartes à jour, en miroir du catalogue du simulateur — la section 14 ne recopie plus les tableaux complets pour rester lisible à mesure que le roster grandit. Lien : https://claude.ai/artifact/Qu2WyGn3EAiWHgbb97tuGb
- **Decks de démonstration étoffés** : les trois decks (Empire, Royaumes Elfiques, Démons) sont passés de "une copie de chaque carte" à des decks à copies multiples et proportions choisies (ex. 4 Recrue Impériale, 3 Paysans...) — plus représentatif d'un vrai deck que le set de test initial.
- **Chien Infernal exige désormais un sacrifice** (niveau 1+, même rang) mais n'en récupère ni les statistiques ni les mots-clés — le sacrifice n'est qu'un coût d'accès pour cette carte, pas une source de puissance (cf. section 4).
- **Mécanique de récupération de stats sur sacrifice revue** : au lieu d'une formule fixe (+5 ATK/+5 END par niveau du sacrifié), le Démon récupère désormais les **statistiques réelles** du régiment sacrifié (son ATK et son Endurance maximale telles quelles). Le Démon d'Akantha est mis à jour en conséquence — sacrifier un régiment costaud le rend nettement plus fort qu'un régiment faible du même niveau.
- **Chien Infernal gagne le rôle Monté**, et le deck de démonstration Démons remplace ses deux Élémentaires de Feu (hors thème) par deux Lanciers de l'Empire.
- **Deux nouvelles Tactiques Démons** : *Effroi Démoniaque* (niveau 2, coût 2 — première Tactique de la faction à cibler un régiment **adverse** ; perte de Moral scalant avec le nombre de Démons alliés, payoff de Moral pour ces mêmes Démons si la cible en meurt) et *Tuteur Démoniaque* (niveau 4, coût 1, sans cible — choix d'un niveau parmi ceux présents dans le deck, pioche le premier régiment Démon de ce niveau, gain de ressource égal à sa position dans le deck). Première Tactique du jeu à cibler le camp adverse : a nécessité de permettre à `isValidTarget` de valider une case du joueur non-actif pour les Tactiques concernées, et d'introduire un nouvel écran de choix (sans lien avec un emplacement du plateau) pour la sélection de niveau du Tuteur.
- **Nouvelle règle transversale : régiment "prêt"** (cf. section 8) — un régiment peut être exempté de la pénalité d'apparition, soit nativement (l'Élémentaire de Feu arrive désormais toujours prêt), soit via un effet ponctuel (Fanatiques, voir plus bas).
- **Deux nouvelles cartes Démons** : *Fanatiques* (niveau 3, rôle Humain, déployable au rang avant **ou** arrière — première carte avec un choix de rang à la pose — sans ATK, mais tout Démon qui le sacrifie gagne Effrayant 2 et arrive prêt, en plus de ce que ce Démon récupère par ailleurs) et *Maître du Chenil Infernal* (niveau 5, rôle Démon + Magicien, coût 8, rang arrière, sacrifice niveau 4+, Distance, Effrayant 1 — à chaque fin de tour, avant les combats, comble les emplacements vides du rang avant de son contrôleur avec des Chiens Infernaux Minions, une pièce de moteur à faire tourner en continu).
- **Nouvelle Tactique Elfe : Repositionnement** (niveau 2, coût 1) — sélectionne un régiment Elfe allié puis un second emplacement (avant ou arrière, vide ou occupé) et échange leurs positions, les deux régiments déplacés gagnant +20 Initiative pour le combat du tour. Première carte à exiger une **sélection en deux étapes** (un régiment, puis un emplacement) plutôt qu'une cible unique — a nécessité un petit état de sélection intermédiaire dans le simulateur, propre à cette carte.
- **Correctif Compendium** : les en-têtes de colonnes du tableau (NOM, TYPE, NIV., etc.) se retrouvaient mal positionnées sur certains affichages (un reliquat de positionnement `sticky` mal calé) — passées en positionnement normal, toujours au-dessus de leur colonne.
- **Maître du Chenil Infernal restreint au tour de son contrôleur** : l'invocation automatique de Chiens Infernaux ne se déclenche plus qu'à la fin du tour de son propre contrôleur, plus à celle de l'adversaire — l'effet était beaucoup trop fort en se déclenchant deux fois par round.
- **Nouvelle carte Elfe : Rangers** (niveau 3, coût 2, rôle Elfe Archer, rang arrière, Distance, Lent) — le régiment qu'il attaque est **sonné** et n'attaque pas au combat de fin de tour en cours (nouveau statut, cf. section 9) ; si ce régiment sonné est ensuite détruit par un régiment Elfe avant la fin du combat, Rangers et le régiment Elfe qui l'a achevé regagnent chacun 2 Moral.
- **Démon d'Akantha révisé** : récupère désormais aussi l'Armure et l'Initiative réelles du régiment sacrifié (en plus de l'ATK et de l'Endurance déjà prévues), et son coût passe de 2 à 4 pour compenser ce gain élargi.
- **Nouvelle carte Empire : État Major** (niveau 4, coût 2, rôle Empire Humain Élite, slot isolé, 0 ATK, sans limite de durée — exception documentée section 8) — au début de chaque tour de son contrôleur : +2 ressources, et les régiments Empire au Moral brisé regagnent 3 Moral (première carte à faire sortir un régiment du statut de Moral brisé, cf. règle de récupération ajoutée section 9). Comme tout régiment non-Minions, il reste soumis à la perte de 1 Moral par allié détruit : avec 5 Moral de base, il meurt tout seul au bout de 5 pertes subies par son armée, combat ou sacrifice confondus — ce n'est donc pas une pièce increvable, juste une pièce sans horloge de durée de vie propre.
- **Main de départ garantie** : les 5 cartes de départ ne sont plus un tirage entièrement aléatoire — **3 régiments de niveau 1** sont garantis, les 2 cartes restantes étant piochées normalement (cf. section 6). Objectif : éviter le tour 0 frustrant où l'on n'a aucune carte de niveau 1 jouable par malchance de tirage.
- **Limite de main appliquée à la pioche de début de tour** : si piocher ferait dépasser **10 cartes** en main, la pioche de routine est bloquée (cf. section 6) ; les autres sources de cartes (mort d'un régiment, Tuteur Démoniaque, sorts du Clerc, etc.) restent illimitées et non concernées par cette limite.
- **Nouvelle Tactique neutre : Choc et Effroi** (niveau 4, coût **variable** = nombre de régiments adverses au Moral brisé au moment de jouer la carte, sans cible) — sonne tous les régiments adverses actuellement au Moral brisé (ils n'attaqueront pas le prochain combat). Deuxième carte à coût dynamique après Palissade, et première à utiliser le statut Sonné (introduit par Rangers, section 9) sans passer par une attaque.
- **Créateur de deck** ajouté comme document séparé : page qui permet de composer une liste de deck en piochant librement dans tout le pool de cartes (aucune restriction de faction), avec des indicateurs informatifs — jamais bloquants, le prototypage prime — sur quatre repères de construction (3 régiments niveau 1 minimum, 30 cartes niveau 1-3 minimum, 15 cartes niveau 4-5 minimum, 3 exemplaires max conseillés par carte) et un export en texte à coller directement dans le simulateur (`const DECK_LIST_<NOM> = [...]`). Lien : https://claude.ai/artifact/LPty8DqVyHDj5Q5zxhuYaN
- **Deck personnalisé jouable sans toucher au code** : l'écran de choix de faction du simulateur propose désormais, en plus des trois factions, une option "Deck personnalisé" par joueur qui ouvre une zone où coller librement une liste de cartes (texte brut ou export du créateur de deck ci-dessus) ; les ids reconnus sont comptés en main de jeu, les ids inconnus sont simplement ignorés et signalés (jamais bloquant).
- **Coût de Charge Impériale réduit de 2 à 0** après retour de test — l'effet (ignorer l'Armure adverse d'un Lancier ciblé) semblait trop cher pour rester compétitif face aux autres Tactiques Empire.
- **Exception sur À couvert** : si la perte standard de 20 ATK devait faire tomber la cible à 0 ATK ou moins, elle garde 1 ATK au lieu de 0, mais ne gagne que 20 Armure au lieu de 30 (plutôt que de donner le plein bonus défensif à une unité déjà réduite à l'inaction).
- **Stats affichées dans le créateur de deck** : chaque carte Régiment ou Leader affiche désormais ses valeurs ATK/END/ARM/INI/MOR (bonus avec un "+" pour un Leader) directement dans sa vignette, en plus du texte d'effet.
- **Infobulles d'effet dans le simulateur** : survoler une carte en main ou sur le plateau affiche désormais une infobulle avec son texte d'effet (les mêmes descriptions que celles du créateur de deck).
- **Fusion des mots-clés "Cadence lente" et "Lent"** : l'Arbalétrier Impérial portait jusqu'ici "Cadence lente" (un combat sur deux, aux deux tours) alors que Rangers porte "Lent" (n'attaque qu'au combat de fin de tour de son propre contrôleur) — deux mots-clés différents pour un objectif similaire ("ralentir" une unité à distance forte). L'Arbalétrier passe désormais lui aussi sur le mot-clé **Lent**, et le mot-clé "Cadence lente" (et son mécanisme de rechargement interne) est retiré du jeu — un seul mot-clé, une seule règle (section 8).
- **Druide Ancien (Elfe)** : coût réduit de 5 à 2.
- **Général de l'Empire révisé** : coût réduit de 3 à 2, et nouvelle capacité — au début de chaque tour de son contrôleur, le régiment porteur gagne 1 Moral par régiment Empire allié dans un slot **adjacent sur sa ligne** (avant ou arrière ; le slot isolé n'a pas de voisin).
- **Quatre nouvelles cartes Empire** :
  - *Ordre du Haut Commandement* (Tactique, niveau 4, coût 2, sans cible) — tous les régiments du joueur portant un Leader gagnent +10 ATK/+5 ARM pour le combat, et regagnent 4 Moral et 20 Endurance.
  - *Assassinat* (Tactique, niveau 4, coût 2, cible un régiment adverse porteur d'un Leader) — détruit ce Leader ; le régiment ciblé survit mais perd les bonus qu'il en tirait. Première carte à retirer un Leader sans détruire son porteur.
  - *Espion Impérial* (Leader, niveau 4, coût 3) — carte à part : elle ne se pose pas sur un régiment allié mais sur un **régiment adverse quelconque**, et seulement si son contrôleur possède déjà un régiment Empire porteur d'un Leader ; la cible gagne le mot-clé **Lent**. Premier Leader du jeu à s'attacher au camp adverse (`isValidTarget` et l'attache d'un Leader généralisés pour accepter une cible côté opposé).
  - *Cavaliers Dragons Élite* (Régiment, niveau 4, coût 6, rôle Dragon + Empire + Monté + Humain, rang avant, arrive prêt) — à son arrivée, **tous vos régiments Empire** retrouvent un Moral plein (y compris sortie du statut Moral brisé).
- **Correctif Cavaliers Dragons Élite** : le soin de Moral à l'arrivée profitait par erreur aux deux camps (lecture trop littérale de "tous les régiments") — corrigé pour ne cibler que les régiments **Empire du contrôleur**, comme prévu depuis le départ.
- **Quatrième faction jouable : Nomades** (cf. section 4), avec sa propre zone de jeu — la **défausse** — et sa mécanique d'interception de pioche. Six nouvelles cartes : *Jeune Nomade*, *Frondeur Nomade*, *Saboteur Nomade*, *Charmeur de Basilics*, *Basilics de l'Oasis* et *Mirage*. Nouvelle race **Basilic**. A nécessité de centraliser tous les points de pioche du simulateur (pioche de début de tour, mort d'un régiment, Tuteur Démoniaque) derrière une fonction commune, pour que l'interception du Saboteur Nomade s'applique uniformément quelle que soit la source de la pioche.
- **Decks de démonstration** : nouveau deck Nomades ajouté aux trois existants (Empire, Royaumes Elfiques, Démons), avec quelques cartes neutres/génériques en complément des six cartes propres à la faction pour atteindre une taille de deck comparable.
- **Identité par exemplaire en main** ajoutée au simulateur (un identifiant interne distinct par carte présente en main, même quand plusieurs copies identiques s'y trouvent) pour corriger le Charmeur de Basilics : la réduction de coût vise désormais réellement **un seul exemplaire désigné au hasard**, et non plus toutes les copies d'un Basilic ou "le premier joué" — correctif demandé après coup, l'implémentation initiale étant une simplification trop généreuse dès qu'un deck contient plusieurs Basilics.
- **Trois nouvelles cartes Nomades** (cf. section 4) : *Maître de Caravane* (Leader, niveau 2, coût 1 — fait rejouer à son porteur son effet d'arrivée en jeu), *Archéotacticiens* (Régiment, niveau 4, coût 3, rang arrière, Distance — mise au rebut ciblée par coût dans le deck adverse à l'arrivée, puis copie gratuite de toute Tactique adverse défaussée tant qu'il reste en jeu) et *Basilics du Désert* (Régiment, niveau 5, coût 8, rang avant — gagne END/ARM/INI/Moral à l'arrivée en proportion de la défausse adverse). A nécessité de centraliser tout envoi de carte en défausse derrière une fonction commune (`sendCardToDiscard`), pour que la passive d'Archéotacticiens se déclenche de façon uniforme quelle que soit la source de la défausse (son propre effet, le mill du Frondeur Nomade, la défausse forcée du Jeune Nomade) ; et d'introduire une notion de carte temporaire en main (coût 0, détruite en fin de tour de son contrôleur), réutilisable pour de futurs effets similaires.

- **Égalité d'Initiative** : en cas d'égalité d'Initiative entre régiments adverses lors d'un combat, le régiment du **joueur actif** (celui dont la fin de tour déclenche le combat) frappe en premier.
- **Mode « par correspondance »** dans le simulateur : export de l'état complet de la partie sous forme de code texte à envoyer à l'adversaire, qui le colle pour reprendre la partie là où elle en était (aucun serveur ; les deux mains restent visibles dans le code). Ajout aussi du **Moral total** des régiments en jeu dans les infos de chaque joueur, et déplacement de la main du joueur du haut au-dessus du champ de bataille.
- **Équilibrage des Leaders** : Général de l'Empire gagne +10 END permanents ; coûts réduits — Lieutenant 1 → 0, Espion Impérial 3 → 2, Chamane de la Forêt 3 → 1, Druide Ancien 2 → 1, Acolyte Damné 1 → 0.
- **Renommage** : les « points de niveau » deviennent les **points de lassitude** (mécanique inchangée).
- **Défausse élargie** : tout régiment détruit (hors jetons) rejoint désormais la défausse de son contrôleur, ce qui alimente le Suppôt Infernal et fait scaler les Basilics du Désert sur les régiments perdus par l'adversaire (la carte est aussi précisée : seuls les **régiments** de la défausse comptent, conformément à sa description d'origine).
- **Suppôt Infernal** : nouvelle capacité de récupération à la mort du porteur (cf. section 4). **Tuteur Démoniaque** : donne désormais aussi des points de lassitude égaux à la position dans le deck. **Nouvelle Tactique Démons : Banquet Infernal** (niveau 3, coût 0 ; décklist de démonstration Démons : 2 exemplaires ajoutés).

- **Toutes les cartes jouées rejoignent la défausse** (Tactiques après résolution, Leaders quand ils quittent le jeu), en plus des régiments détruits — base d'une future mécanique de nécromancie (cf. section 4). Conséquence assumée : *Archéotacticiens* copie désormais **chaque** Tactique que l'adversaire joue, pas seulement celles que les Nomades lui font défausser. Les cartes générées (Soin simple, copies gratuites) et les jetons n'entrent pas dans la défausse.

- **Sept nouvelles cartes Démons autour de la lassitude** (cf. section 4) : *Pacte de Sang*, *Rançon d'Âmes*, *Dette Infernale*, *Pacte de Survie*, *Abîme Grandissant*, *Cérémonie du Déclin* et *Veilleur d'Os*. Valeurs (niveaux, coûts, stats, ratio de +5 ATK par lassitude, palier de 10 pour Abîme Grandissant) proposées par l'assistant à valider au playtest. Ajout au simulateur d'un choix de X pour Rançon d'Âmes, d'un second mode de la fenêtre de récupération de défausse (Veilleur d'Os, avec option de ne rien récupérer) et d'un statut « Pacte de Survie » affiché sur le régiment protégé. Décklist de démonstration Démons : un exemplaire de chaque ajouté.

- **Ciblage du rang arrière revu** : Distance devient réellement déterminant (cf. section 8) — sans lui, un régiment arrière n'atteint que les trois emplacements en face de lui ; avec lui, tout le plateau (hors slot isolé), au Moral le plus bas. **L'Arbalétrier Impérial perd Distance** (il reste Lent) et ne frappe donc plus que devant lui.
- **Cérémonie du Déclin retravaillée** : +1 lassitude au début de chaque tour de son contrôleur, et tout gain de lassitude de ce contrôleur lui donne autant de ressources (au lieu de +1 ressource/+1 lassitude en fin de tour). Tous les gains de lassitude du simulateur passent désormais par une fonction commune.

- **Onze nouvelles cartes Elfes** — mouvement, Initiative, soins, perte de lassitude (valeurs de niveau/coût/stats proposées par l'assistant, à valider au playtest) :
  - *Brise du Matin* (Tactique, niv. 1, coût 0) : tous les Elfes alliés +15 INI pour le combat. *Brume Trompeuse* (Tactique, niv. 2, coût 1) : un régiment adverse perd 20 INI pour le combat, **plus un régiment adverse au hasard par Élémentaux contrôlé**. *Chant du Vent* (Leader Elfe, niv. 3, coût 1) : +25 INI permanents.
  - *Retraite Sylvestre* (Tactique, niv. 2, coût 1) : un Elfe allié retourne en main avec ses stats de base (pas de soin nécessaire), son Leader part en défausse, sans lassitude ni perte de Moral. *Changement Tectonique* (Tactique, niv. 3, coût 2, **2 de moins avec un Élémentaux**) : déplace un régiment adverse (avant/arrière) vers un emplacement vide de son camp.
  - Chaîne de soins : *Bourgeonnement* (niv. 1, coût 0 : 10 END + 1 Moral), *Floraison* (niv. 3, coût 2 : 30 END + 2 Moral) et *Fructification* (niv. 5, coût 4 : 50 END + 5 Moral). **Avec un Élémentaux**, Bourgeonnement crée une Floraison en main, Floraison crée une Fructification en main, et Fructification soigne en plus tous les autres régiments de 10 END et 1 Moral. Les cartes créées ne passent pas par la défausse. *Dryades Guérisseuses* (Régiment Elfe + Clerc, niv. 3, coût 3, arrière, 5/30/0/20/5) : soignent de 10 END le régiment le plus blessé à chaque fin de tour de leur contrôleur.
  - Perte de lassitude : *Sérénité de la Forêt* (Tactique, niv. 3, coût 2) retire 3 points de lassitude, **sans limite d'usage** (à corriger au playtest si abusif) ; *Veilleuse des Sources* (Leader Elfe, niv. 4, coût 2) retire 1 point de lassitude par tranche de 20 END soignées sur les régiments de son contrôleur.
- **Le niveau ne redescend jamais** (cf. section 7), règle introduite pour les cartes qui retirent de la lassitude. Les soins du simulateur passent désormais par une fonction commune, y compris ceux de l'*Ordre du Haut Commandement* et du *Démon d'Akantha*, qui déclenchent donc aussi la *Veilleuse des Sources*. Décklist de démonstration Elfes : un exemplaire de chaque nouvelle carte ajouté.

- **Minions et gains de Moral sur perte d'allié** : un régiment Minions détruit n'inflige toujours pas de perte de Moral aux alliés, mais les effets qui *donnent* du Moral à la perte d'un allié (Esclave Guerrier, +2 Moral) se déclenchent quand même. Corrige le cas Banquet Infernal + Esclave Guerrier, où le gain était annulé à tort.
- **Retrait du mot-clé Non-combattant + 4 cartes Elfes (Élémentaux)** : le mot-clé *Non-combattant* est supprimé ; État Major et Clerc de la Forêt ont désormais **0 ATK** (le Clerc garde sa durée de vie de 3 tours). Nouvelles cartes : **Élémentaire de Terre** (niv. 1, coût 2, avant, 10 ATK / 50 END / 5 ARM / 5 INI / 6 MOR) ; **Élémentaire d'Eau** (niv. 2, coût 3, arrière, Distance, 5 ATK / 20 END / 0 ARM / 5 INI / 5 MOR : à la fin du tour de son contrôleur, soigne de 10 END son régiment le plus blessé, et s'il atteint ainsi son END max il gagne 1 Moral) ; **Vision** (Leader, niv. 3, coût 1, requiert Élémentaux : les tactiques jouées coûtent 1 de moins, minimum 0, coûts variables compris (Palissade, Choc et Effroi : la réduction s'applique au coût calculé, et la carte reste injouable si son effet n'a aucune cible) ; à l'attache, choisir une des 3 prochaines tactiques du deck, mélanger le deck et la placer en première carte) ; **Éveil Élémentaire** (Tactique, niv. 2, coût 2 : crée un Élémentaire Éveillé Minions, 10 ATK / 30 END / 0 ARM / 1 INI / 4 MOR, dans le premier emplacement vide du rang avant).
- **11 cartes Empire (mécanique de Leaders, Moral et Armure élevés)** : régiments *Soldat de Kragz* (niv. 2, coût 3, avant, 10 ATK / 50 END / 5 ARM / 12 INI / 8 MOR, +5 ARM s'il porte un Leader), *Porte-Étendard* (niv. 2, coût 2, arrière, 5/30/5/5/7, début de tour : +1 Moral à chaque régiment porteur d'un Leader), *Chevalier Templier* (niv. 4, coût 4, avant, 10/60/10/8/6, Moral plancher 3 avec un Leader), *Cadets de l'Académie* (niv. 3, coût 3, avant ou arrière, 10/40/5/15/6, crée un Lieutenant en main à l'arrivée), *Forteresse l'Intuable* (Dragon Empire, niv. 5, coût 7, avant, 15/100/20/5/12) ; Leaders *Capitaine de la Garde* (niv. 3, coût 1, +10 ARM +2 MOR), *Aumônier de Guerre* (niv. 3, coût 1, soin du porteur de 10 END + 1 Moral à l'attache et à chaque début de tour) et *Maréchal d'Empire* (niv. 5, coût 3, requiert Empire + Dragon, +20 ATK +10 ARM +6 MOR ; si le porteur est le seul régiment de son camp, son contrôleur gagne la comparaison de Moral de fin de tour) ; tactiques *Ralliement* (niv. 2, coût 1 : +3 Moral à un porteur de Leader, +5 si Moral brisé), *Formation en Carré* (niv. 3, coût 2 : +10 ARM aux porteurs de Leader jusqu'au prochain tour du lanceur) et *Promotion* (niv. 3, coût 1 : défausser un Leader de la main, révéler les 2 prochains Leaders du deck, en piocher un, mélanger le deck). Vision réduit désormais aussi les coûts variables.
- **10 cartes Nomades + Archéotacticiens révisé** : régiments *Chasseur de Reliques* (niv. 3, coût 3, arrière, 10/30/0/20/5 ; à l'arrivée, choisit un régiment de la défausse adverse, le supprime et gagne en permanent son ATK ou son ARM), *Marchand d'Ombres* (niv. 2, coût 2, avant, 10/40/0/25/6 ; à l'arrivée, consulte la main adverse et choisit une carte défaussée), *Caravane Marchande* (niv. 2, coût 1, isolé, 0/30/0/0/6, durée de vie 3 tours, +1 ressource par tour ; à l'arrivée supprime une carte de la défausse adverse et gagne en durée de vie le niveau de cette carte), *Éleveur de Basilics* (niv. 3, coût 3, arrière, 10/30/2/8/6 ; les Basilics en main coûtent 1 de moins, chaque Basilic qui arrive en jeu gagne +10 END permanents, et l'Éleveur se soigne de 10 END à chaque arrivée d'un Basilic allié) ; Leader *Guide du Désert* (niv. 2, coût 0, requiert Nomade, +15 INI, supprime la pénalité d'apparition du porteur) ; tactiques *Marché Noir* (niv. 3, coût 1 : chaque joueur pioche 3, le lanceur défausse 2 cartes de son choix, l'adversaire 2 au hasard), *Embuscade* (niv. 1, coût 1 : +50 INI et le régiment Nomade refait son effet d'arrivée), *Rançon du Désert* (niv. 4, coût 3 : supprime une carte de la défausse adverse et met autant de cartes de son deck en défausse que son niveau), *Frappez le ravitaillement* (niv. 3, coût 3 : l'adversaire défausse 2 cartes de son choix) et *Volez le ravitaillement* (niv. 4, coût 4 : l'adversaire défausse 3 cartes de son choix, le lanceur gagne 7 ressources moins la somme des niveaux défaussés). **Archéotacticiens** ne copie plus les Tactiques que l'adversaire joue lui-même (elles vont toujours en défausse), seulement celles qui y arrivent par un autre moyen. La Forteresse Empire s'appelle désormais *Forteresse l'Intuable*.
- **Slot isolé et Distance** : un régiment du slot isolé ne peut attaquer que s'il possède Distance (il ne peut alors pas viser l'autre slot isolé). Sans Distance, il n'attaque pas.
- **Options de test du simulateur** : bouton pour **activer/désactiver la comparaison de Moral de fin de tour** (lassitude donnée au joueur au Moral total le plus bas), afin de tester d'autres scénarios de rythme de partie ; l'état du bouton est conservé dans le code de correspondance. L'écran de sélection des factions est aussi plus compact (cartes de faction en grille, import par correspondance repliable).

**[OUVERT]** Le simulateur reste un outil de test des règles, pas un prototype équilibré : à continuer d'ajuster au fil des parties.
- **Adversaire ordinateur (prototype)** : case « Contrôlé par l'ordinateur » par joueur sur l'écran de choix des factions. IA à heuristiques : joue ses régiments (sacrifie seulement si le gain est net), ses Leaders et un sous-ensemble de tactiques (soins, buffs, assassinat, etc.), résout elle-même les choix différés, puis termine son tour. Sa main est cachée. Base technique des combats scénario de la campagne solo (conditions de victoire et nombre d'emplacements configurables à venir).
- **Campagne solo — Scénario 1 « Attaque à la frontière »** (Empire contre Royaumes Elfiques contrôlés par l'ordinateur ; bouton sur l'écran de choix des factions). Premier scénario piloté par des données (decks fixes, plateaux de départ, événements par tour, conditions de victoire/défaite, dialogues). Départ : Palissades en avant 2 et 3 + Archer Impérial en arrière 2 contre 2 Éclaireurs Elfes en avant 2 et 3. Tour 3 : message « On ne s'en sortira pas sans aide » et l'ordinateur gagne 2 ressources ; tour 4 : +3 ; tour 5 : le joueur gagne 15 ressources et reçoit 3 Chevaliers de Province et 2 Arbalétriers Impériaux (jouables quel que soit son niveau) avec un dialogue de renforts. À partir de son tour 6 l'ordinateur ne pose plus de régiment : détruire tous ses régiments donne la victoire (« aucun régiment en fin de tour », sans effet avant le tour 6 pour l'ordinateur). Défaite du joueur : 16 points de lassitude ou aucun régiment ; pas de limite de lassitude pour l'ordinateur. Dialogue de fin : Commandant / Soldat / Soldat 2 (attaque de Kragz). Réserve de cartes à choisir et construction de deck entre scénarios : à venir.
- **IA** : joue désormais *Retraite Sylvestre* (retire un elfe blessé, seulement si elle garde au moins un autre régiment en jeu). Nouveau bouton « Main de l'ordi : cachée / révélée ».
- **Campagne solo : pool, fenêtre de deck et récompenses.** Le joueur possède un *pool* de cartes qui évolue de scénario en scénario. Avant chaque combat, une fenêtre (inspirée du créateur de deck) permet de choisir les cartes du pool qui entrent dans le deck : pas de taille maximale, **taille minimale imposée par le scénario** (20 pour les scénarios 1 et 2 ; les règles de deck peuvent être modifiées par scénario, dont des cartes imposées). Sauvegarde automatique dans le navigateur, plus un code de sauvegarde à copier/coller pour reprendre ailleurs. Fin du scénario 1 : récompense en deux temps — (1) au choix, remplacer 2 Recrues Impériales du pool par 2 Lanciers de l'Empire ; (2) dans tous les cas, ajouter 2 Chevaliers de Province et 1 Arbalétrier Impérial au pool.
- **Scénario 2 « Le siège de Kragz »** : le joueur (Empire) commence avec la carte de scénario **Garnison** (régiment Empire, Distance, arrière central : ATK 10, END 80, ARM 5, INI 10, MOR max 6 mais commence à 3 ; gagne 1 Moral à chaque régiment adverse vaincu) protégée par 2 Palissades en avant 2 et 3, face à 2 Élémentaires de Terre. Deck elfe de l'ordinateur (30 cartes, niveaux 1-3, riche en Élémentaux) : 3 Bourgeonnement, 3 Éclaireurs Elfes, 3 Élémentaires de Terre, 3 Archers des Bois, 1 Brume Trompeuse, 3 Élémentaires d'Eau, 2 Élémentaires de Feu, 3 Éveil Élémentaire, 3 Cavaliers Elfes, 3 Dryades Guérisseuses, 3 Vision. Victoire : les elfes atteignent le niveau 4 (16 points de lassitude) ou n'ont plus de régiment. Défaite : la Garnison est détruite ou le joueur atteint le niveau 4. À chaque comparaison de Moral perdue, l'ordinateur gagne 1 ressource (2 s'il est niveau 3).
- **Scénario 2 — ajustements** : l'ordinateur (elfes) **commence niveau 2** et passe **niveau 3 à 4 points de lassitude** (niveau 4 inchangé à 16) ; réglages portés par le scénario (`startLevel`, `levelThresholds`). **Récompenses de fin de scénario 2** : (1) 1 Capitaine de la Garde + 2 Soldats de Kragz ajoutés au pool ; (2) au choix, remplacer 1 Recrue Impériale par 1 Porte-Étendard ; (3) deux choix (le même peut être pris deux fois) parmi les 4 tactiques Empire de niveau 3 ou moins : Ralliement, Charge Impériale, Formation en Carré, Promotion. L'ordre des étapes de récompense est réglable par scénario.
- **Terrain configurable (moteur)** : le plateau n'est plus figé à 4 emplacements avant / 3 arrière : un scénario peut définir `layout` (ex. 6 avant / 5 arrière). L'adjacence avant/arrière suit la taille du plateau. Un régiment peut être exclu du Moral total de fin de tour (`excludeFromMoralTotal`) ; un scénario peut invoquer des régiments (jetons) à un tour donné, déplacer un régiment-convoi à intervalle fixe (échange de place avec l'occupant, victoire à la sortie), et proposer des récompenses de cartes uniques (sans doublon).
- **Scénario 3 « Le convoi du col des Brumes »** : plateau de 6 emplacements avant et 5 arrière. Le joueur commence avec seulement le **Convoi de Ravitaillement** (carte de scénario : ATK 0, END 30, ARM 0, INI 0, MOR 30, arrière gauche, non compté dans le Moral total). Aux débuts des tours 3, 5, 7 et 9 il avance d'un emplacement vers la droite (il échange sa place avec un régiment qui l'occupe) ; au tour 11 il sort du plateau : **victoire**. Sa destruction = **défaite** ; aucune autre condition de défaite (ni lassitude, ni « aucun régiment »). Les elfes (niveau 2 dès le départ, niveau 3 à 4 points) commencent avec 2 Éclaireurs en avant 3 et 4 et 1 Archer en arrière 3 ; deck de 30 cartes plus mobile (Éclaireurs, Cavaliers, Archers, Rangers, soins). Au début de leur tour 6, **embuscade** : ils invoquent 2 Élémentaires de Terre et 1 Élémentaire de Feu. Récompense : 3 cartes de niveau 4 au choix (sans doublon) parmi Chevalier Templier, État Major, Cavaliers Dragons Élite, Ordre du Haut Commandement, Assassinat, Espion Impérial.
- **Scénario 2 — comparaison de Moral** : la comparaison de Moral de fin de tour ne donne que **1 point de lassitude** quel que soit le niveau (option de scénario `moralCheckLassitude`).
- **Scénario 2 — Palissades de départ** : les 2 Palissades déjà en jeu ont 4 Moral au lieu de 3 (les Palissades créées en cours de partie restent à 3).
- **Scénario 3 — difficulté réduite** : plus d'Archer elfe au départ (les elfes commencent avec 2 Éclaireurs seulement) ; le Convoi de Ravitaillement a désormais le type **Empire** ; les elfes commencent **niveau 1** (seuils de niveau normaux) mais gagnent **2 points de lassitude à la fin de chacun de leurs tours** (en plus de ceux gagnés par pertes de régiments et comparaison de Moral). Option de scénario `endTurnLassitude`.
- **Scénario 3 — Halte du Convoi** : nouvelle Tactique de scénario **gratuite** (coût 0, niveau 1, usage unique, jamais défaussée) ; le joueur en commence avec 2 en main. Effet : le convoi **saute sa prochaine avancée** (les haltes se cumulent) et le joueur **pioche 1 carte**. Permet de garder le convoi derrière des troupes solides. (Option de scénario `startHand` : cartes ajoutées à la main de départ.)
- **Scénario 4 « Sylvain, le Gardien Élémentaire » (premier jet, à retravailler)** : deck minimum 25 cartes. Le joueur démarre niveau 2 avec 2 Palissades (4 Moral) en avant ; les elfes démarrent niveau 2 avec **Sylvain** (rang avant, central) et 1 Élémentaire de Terre. Seuils de niveau : joueur 4/10/18, elfes 4/10/16 points. **Victoire** : Sylvain détruit, ou 25 points de lassitude pour les elfes. **Défaite** : 30 points de lassitude pour le joueur ou plus aucun régiment (à partir du tour 3). Comparaison de Moral = 1 point ; les elfes gagnent 1 point de lassitude à la fin de chacun de leurs tours. Renforts elfes : élémentaux invoqués aux tours 3, 5, 7 (dialogue de Sylvain) et 10, avec +2/+2/+3/+3 ressources. Le deck elfe est riche en élémentaux, avec 2 Druides Anciens. Objectif : les cartes de niveau 4 gagnées au scénario 3 servent ici. Équilibrage à faire ensemble (l'IA jouant l'Empire avec un pool réduit perd, ce n'est pas représentatif).
- **Correctif Leaders** : un régiment ne peut plus recevoir un Leader s'il en porte déjà un (la case n'est plus ciblable). Seuls les Leaders qui exigent « déjà porteur d'un Leader » (Suppôt Infernal) en remplacent un ; les Leaders qui ciblent un régiment adverse sont inchangés.
- **Scénario 4 — Changements Tectoniques** : le deck elfe contient 2 *Changement Tectonique*. Consigne donnée à l'IA : elle ne le joue que si un Sylvain en jeu n'a **aucun régiment à portée** (ni en face sur l'avant, ni sur les emplacements arrière adjacents) ; elle déplace alors son régiment le moins précieux vers l'emplacement avant vide en face de Sylvain. (L'IA sait maintenant jouer les tactiques à deux cibles.)
- **Ergonomie (simulateur)** : la main peut être réorganisée — tri en un clic par coût, type ou niveau, ou à la main (glisser-déposer, ou flèches ‹ › sur la carte, utiles sur téléphone). Les cartes en main affichent désormais leurs stats (ATK, END, ARM, INI, MOR, rang) et leur effet résumé ; les Leaders affichent leurs bonus. Plus besoin d'ouvrir le compendium pendant une partie.
- **Ergonomie (créateur de deck et compendium)** : nouveau filtre par niveau, combinable avec les filtres de faction et de type.
- **Simulateur** : un bandeau apparaît en haut de l'écran quand une Tactique est jouée (joueur, nom de la carte, effet), plus longtemps quand c'est l'ordinateur. Le bloc « Hypothèses prises pour faire tourner ce prototype » (obsolète) est retiré de la page ; les règles de référence restent dans ce GDD.
- **Limite de main revue (main pleine)** : avec 10 cartes ou plus en main au début du tour, on défausse autant de cartes (au choix) que l'on va piocher, puis on pioche. Remplace l'ancien blocage de la pioche, qui pouvait figer une partie (aucun joueur ne pouvait plus perdre par pioche vide ni gagner de lassitude). Règle appliquée dans le moteur du vrai jeu ; le simulateur prototype garde l'ancien comportement.
- **Équilibrage 1 et 2 (14/10/2026, validés par simulation)** — nouveau mot-clé **Pénétration d'armure X** : quand ce régiment attaque, il ignore les X premiers points d'Armure de sa cible. Cartes modifiées : *Cadets de l'Académie* coût 4, ATK 7, END 36 ; *Lancier de l'Empire* ATK 12, ARM 4, +15 ATK contre les Montés ; *Soldat de Kragz* ATK 9, ARM 4 ; *Chevalier de Province* ATK 14, ARM 13 ; *Arbalétrier Impérial* gagne Pénétration d'armure 5 ; *Sérénité de la Forêt* coût 1, effet doublé (6 points) si l'on contrôle un Élémentaux ; *Clerc de la Forêt* coût 2 ; *Saboteur Nomade* ATK 1, END 21 ; *Frondeur Nomade* coût 1 ; *Archéotacticiens* coût 4 ; *Fanatiques* coût 3. Résultat en simulation : Empire 80 % → 76 % de victoires contre les autres factions (decks de démonstration), écart entre la meilleure et la pire carte resserré (+10,2/−4,9 → +5,7/−3,4).
- **Acolyte Damné (16/10/2026)** : en plus de +5 ATK, le régiment qu'il mène ne perd plus de Moral quand un régiment allié est détruit (effet de Leader, donc perdu tant que le porteur a le Moral brisé).
- **Mots-clés chiffrés cumulatifs (16/10/2026)** : tout mot-clé avec une valeur s'additionne — Effrayant X + Effrayant Y = Effrayant X+Y, Pénétration d'armure X + Y = Pénétration X+Y, et de même pour tout futur mot-clé chiffré (auparavant seule la valeur la plus forte comptait). Concerne notamment les Fanatiques (sacrifice) et le Seigneur des Abysses (Leader).
- **Régiments uniques (16/10/2026)** : un régiment marqué **Unique** ne peut avoir qu'un exemplaire en jeu à la fois, **tous joueurs confondus** : le premier qui le pose empêche l'autre de poser le sien tant qu'il reste en jeu (on peut en avoir plusieurs dans le deck). Version simple de la règle des Légendes : la zone des légendes et le vote ne sont pas encore appliqués. Premiers Uniques : Forteresse, Sylvain, Tréant Millénaire, Démon d'Akantha, Dragon Infernal, Reine des Basilics, Gardienne de la Lumière.
- **Mode Draft à 4 (16/10/2026)** : 4 joueurs (dont 3 IA pour l'instant), 3 paquets de 15 cartes passés de main en main ; deck d'au moins 40 cartes tirées des 45 draftées, plus des régiments de base à volonté ; tournoi chacun contre chacun en 3 rondes.
- **Première vague de la première édition (17/10/2026)** : 50 cartes intégrées (`src/data/wave1.ts`), relues dans le tableur de vague 1. Nouvelles règles :
  - **Adjacence** : les *voisins* d'un régiment sont ceux de gauche et de droite sur sa ligne, et ceux de devant et derrière (une case arrière touche les deux cases avant qui l'encadrent). **Formation** ne compte que gauche-droite.
  - **Ralliement X** : à son arrivée, les voisins regagnent X Moral. **Formation** : bonus selon les régiments Empire voisins sur la ligne (Hallebardiers, Gardes du drapeau, Colonel de la Ligne).
  - **Croissance** : le régiment grandit au début de chaque tour de son contrôleur (avec un plafond propre à la carte). **Communion** : un Elfe et un Élémentaux (deux régiments distincts) en jeu. Effets « chaque fois que tu joues une Tactique » (Danseuses, Chœur, Lyra, Chant de la sève).
  - **Offrande X** : en jouant la carte, on choisit de payer X lassitude pour l'effet renforcé. **Prise de contrôle** (pas un mot-clé) : chaque carte fixe ses conditions ; le joueur qui prend le contrôle choisit la case où poser le régiment (sans case libre, il part dans la défausse de son propriétaire) ; un régiment pris jusqu'à la fin du tour combat pour son nouveau contrôleur, peut servir de sacrifice (sa carte retourne alors dans la défausse de son propriétaire), puis rentre à la fin du tour.
  - **Mirage X** : X attaques au total frappent le vide (perdu avec le Moral brisé, cumulatif). **Pillage X** : un ennemi détruit fait défausser X cartes du dessus de la pioche adverse. **Marché** : au début de son tour, on peut défausser une carte pour en piocher une. **Usure** : effets qui défaussent le dessus de la pioche adverse.
  - **Cartes bicolores** : comptent comme des deux factions ; leurs Leaders acceptent un porteur de l'une ou l'autre race. **Alliance** : bonus si, parmi les autres régiments du joueur, on trouve les deux rôles indiqués (au moins un de chaque ; un même régiment peut porter les deux) — règle précisée le 22/10/2026.
  - Nouveaux Uniques : Le Commandant de la campagne de Kragz, Lyra, Hiérophante Morvak, Cheikha Zahra, Légat Varro (Leader).
- **Équilibrage 3 (17/10/2026, validé par simulation)** — freiner l'usure des Nomades après la vague 1 : *Terre brûlée* coût 3 et 3 cartes défaussées au plus ; *Puits empoisonné* coût 3, 1 carte de la pioche (et toujours 1 de la main) par tour adverse ; *Voleurs de provisions* coût 2 ; *Danseurs de sable* 1 carte au lieu de 2. Tournoi entre factions (decks aléatoires mono-faction) : Nomades 83 % → 74 %, Empire 56 %, Elfes 38 %, Démons 33 %.
- **Équilibrage 4 (17/10/2026)** : pioche de début de tour ramenée à **1 / 1 / 2 / 2 / 3** cartes aux niveaux 1 à 5 (au lieu de 1 / 2 / 2 / 3 / 3) — la pioche devient plus précieuse, les mains pleines de cartes trop chères se font plus rares, et l'usure perd mécaniquement de sa force. *Puits empoisonné* ne fait plus défausser de carte de la main. Tournoi entre factions (decks aléatoires mono-faction) : Empire 60 %, Nomades 58 % (au lieu de 74 %), Démons 45 %, Elfes 37 % ; fins par pioche vide 45 % → 28 %.
- **Équilibrage 5 — Elfes (17/10/2026)** : *Dryade corrompue* 10/40/0/15/6, les soins ne sont plus annulés (ils font en plus baisser la lassitude) ; *Éveil Élémentaire* coût 1, jeton 15/40/5/5/4 posé dans la case avant choisie, deux jetons avec Communion ; *Sérénité de la Forêt* pioche aussi 1 carte ; *Floraison* coût 1, 3 Moral ; *Rite de Purification* coût 1 ; *Chant du Vent* +20 INI et +10 ATK ; *Veilleuse des Sources* 1 lassitude par tranche de 10 END ; *Dryades Guérisseuses* 15 END et 1 Moral ; *Prêtresse des saisons* +5 ATK de base, +2 Moral si Communion à l'attache ; *Vision* porteur Elfe ou Élémentaux.
- **Vague 2 — Elfes (17/10/2026)** : 12 cartes pour trois plans de jeu. *Cibler les faibles* : Sentinelle des cimes (niv. 2, coût 3, arrière, Distance, 12/25/0/30/5, +10 ATK contre un Moral brisé), Traqueuse sylvestre (niv. 3, coût 4, Distance, 15/30/0/35/6, vise l'END la plus basse), Marque du chasseur (niv. 1, coût 0 : ce tour-ci les tireurs visent la cible et ignorent 5 ARM), Visez les faibles (niv. 2, coût 2 : ce tour-ci la première ligne attaque le soutien désigné), Chant de la traque (niv. 4, coût 3 : les tireurs frappent tout de suite), Seigneure de la chasse (Unique, niv. 5, coût 6, Distance, 25/50/5/40/9 : un régiment adverse brisé détruit donne 2 lassitude de plus). *Tenir la ligne* : Gardienne du seuil (niv. 3, coût 4, arrière, 5/35/0/15/7 : avant chaque combat, ses voisins avant regagnent 5 END et 1 Moral), Racines protectrices (niv. 2, coût 2 : pas sous 1 END ni 1 Moral jusqu'au prochain tour du lanceur, sacrifice possible), Bénédiction de la sylve (Leader niv. 2, coût 1, +5 ARM : sauve le porteur une fois puis part en défausse). *Soutiens* : Racines immobilisantes (niv. 2, coût 2 : le régiment ciblé n'attaque plus tant que le lanceur contrôle un Élémentaux), Éclaireuse des fourrés (niv. 2, coût 2, avant ou arrière, Archer, Distance, 12/25/0/30/5), Maître des embuscades (Leader niv. 3, coût 1, +5 ATK : + l'avance d'INI sur la cible). **Règle** : Distance fonctionne aussi depuis la première ligne. **Nouveau mot-clé** *Débordement X* : quand ce régiment attaque un régiment de première ligne, les deux régiments derrière lui subissent X dégâts (aucune carte pour l'instant).
- **Équilibrage 6 — Nomades (17/10/2026)** : 42 % des parties de l'échelle finissaient par une victoire nomade par pioche vide. *Fuite dans les dunes* coût 2, 2 cartes défaussées au plus ; *Voleurs de provisions* ne se cumulent plus (1 carte par régiment détruit) ; *Puits empoisonné* dure 2 tours ; *Archéotacticiens* coût 5, ne retire plus le Leader ; *Jeune Nomade* END 20 ; *Seigneur des caravanes perdues* coût 2 ; *Terre brûlée* 2 cartes au plus ; *Mirage de l'oasis* coût 1. Decks Nomades aléatoires contre les qualifiés des autres factions : 50 % → 42 % (reports/impact-nomades*.md).
- **Équilibrage 7 — Elfes (17/10/2026)** : remise à niveau des cartes Elfes peu jouées. *Sérénité de la Forêt* pioche 2 ; *Rite de Purification* coût 0 ; *Danseuses des lames* 15/30, +10 ATK par Tactique ; *Chœur des saisons* coût 3, pioche toutes les 2 Tactiques ; *Chamane de la Forêt* 25 END à l'attache puis 10 par tour ; *Élémentaire de Feu* END 30, MOR 5 ; *Sylvain* coût 5, ATK 25 ; *Volée de Flèches* coût 1 ; *Archer des Bois* END 30 ; *Marque du chasseur* ignore 10 ARM. Les cartes ne sont plus pénalisantes (reports/impact-elfe-eq7.md), la faction passe de 32 à 33 % contre les qualifiés : son niveau sera revu après les 4 vagues.
- **Vague 2, suite (18/10/2026)** : 38 cartes relues par Nathan (src/data/wave2b.ts). *Empire* : Écuyers de la Garde (Formation avec un Monté), Arbalétriers en rang (Distance, Lent, Formation), Lanciers du rempart (+10 ARM avec deux voisins), Chevaliers de l'Ordre (prêts, Ralliement 1), Cuirassiers lourds (seconde attaque après une destruction), Connétable et Héraut impérial (Leaders niv. 4 et 5), Dernier carré, Charge décisive, L'Impératrice Octavia (Unique, niv. 5, coût 2 : +5 ATK et +5 ARM aux porteurs de Leader). *Démons* : La Garde d'Asura (archers elfes : piocher quand elle est sacrifiée), Sorcière du pacte, Voile d'ombre et Chaînes de l'Abîme (Offrande), Gardien des chaînes (sacrifice : −3 ATK par niveau sacrifié aux attaquants de ses voisins), Grimoire interdit (pioche 3, remets-en 2 ; Offrande 1 : la pioche est mélangée ensuite, pour se débarrasser de 2 cartes inutiles), Bourreau de l'Abîme (+10 ATK par régiment brisé en jeu), Seigneur des tourments, Rituel du sang noir, Archidémon des Origines (Unique : détruit le régiment adverse au Moral le plus haut, deux avec un sacrifice de niveau 5). *Nomades* (sans nouvelle usure) : Chamelier, Éclaireuse des sables, Sentinelles de l'oasis, Maître du bazar, Caravanier armé, Tempête de lames, Émir des dunes, Al-Mansur le Magnifique (Unique). *Cross-faction* : Serment du traité, Contrat de convoi, Exécution exemplaire, Sang de sève, Vent porteur, Basilic démoniaque. *Neutres* : Milice de village, Ingénieurs de siège, Quartier-maître, Vivres de campagne. Premier texte d'ambiance (Archidémon des Origines), affiché quand il reste de la place.
- **Équilibrage 8 — Moral (18/10/2026)** : +1 Moral pour tous les régiments (sauf cartes de scénario et Palissade). Testé à +1 et +2 sur la finale : le Moral cause 29 % des destructions au lieu de 41 %, l'Endurance devient la première cause de mort (51 %) ; l'équilibre des factions bouge à peine (Démons 63 %, Empire 54 %, Elfes 44 %, Nomades 40 %).
- **Campagnes plus faciles (20/10/2026)** : la campagne sert de grand tutoriel. Sans toucher au contenu des scénarios, une aide s'applique partout (`CAMPAIGN_EASE`, src/campaign/campaign.ts) : +1 ressource au départ, seuil de défaite par lassitude du joueur ×1,5, et le régiment vital du joueur (Garnison, Convoi, Chariot, Œuf, Puits…) a END ×1,5 et +2 Moral (maximum et départ) ; pertes de Moral normales, ATK adverse inchangée (réglage de Nathan après un premier essai plus fort). L'aide du camp (+1 ressource de départ) se débloque toutes les 2 défaites sur un scénario au lieu de 3. Paquets : les cartes déjà possédées en 3 exemplaires ne sortent plus.
- **Modes de difficulté de campagne (21/10/2026)** : *Histoire*, *Guerrier* (par défaut) et *Héros*, au choix au camp entre deux combats. Chaque scénario a son réglage par mode (src/campaign/ease.ts, calculé par tools/tune-campaign.ts) : ressources en plus au départ, seuil de défaite par lassitude du joueur, END et Moral du régiment à protéger. Cible : l'ordinateur jouant le camp du joueur gagne 70-80 % (Histoire), 50-60 % (Guerrier), 20-30 % (Héros). Kragz, le Convoi, Sylvain, le Portail des Abysses et la Tempête de sable plafonnent (25-55 % même avec beaucoup d'aide) : l'ordinateur y joue mal, ils ont une aide progressive raisonnable. L'aide du camp après des défaites s'ajoute dans tous les modes.
- **Lisibilité du combat (23/10/2026)** : le plateau se met à jour après chaque attaque (et après les effets d'avant-combat, ex. Chiens du Maître du Chenil, visibles avant leurs attaques) ; le régiment qui attaque se déplace jusqu'à sa cible (option désactivable) ; bulles de variation (« −5 END », « +10 ATK », « −1 MOR », « Moral brisé »…) pour tout changement de statistiques, en combat comme hors combat (tactiques, effets, mort d'un allié) ; l'Œuf de Dragon affiche ses tours avant éclosion. Traversée du désert : Guerrier lassitude max 45 et Chariot 40 END ; Histoire Chariot 60 END et lassitude max 50.
- **Draft à plusieurs en ligne (23/10/2026)** : jusqu'à 4 joueurs humains, chacun sur son navigateur (salon PeerJS avec un code court) ; l'ordinateur prend les places libres. L'hôte tient l'état du draft (src/draft/multi.ts) : les paquets ne tournent que quand tous les humains ont choisi ; chacun construit son deck ; tournoi chacun contre chacun (Bo1/Bo3/Bo5, premier joueur au hasard puis en alternance). Les parties entre deux humains se jouent en ligne (actions relayées par l'hôte) ; contre l'ordinateur, chacun joue chez lui ; les matchs entre ordinateurs sont simulés. Un joueur qui se déconnecte est remplacé par l'ordinateur.
- **Équilibrage 9 — opération exorcisme (25/10/2026)** : les Démons dominaient la finale entre decks optimisés (71 %). *Pacte de sang* coût 1 (était 0) ; *Légion de Morvak* coût 2 (était 0, garde l'effet d'arrivée du régiment sacrifié) ; *Bourreau de l'Abîme* +5 ATK par régiment au Moral brisé (était +10) ; *Gargouille sentinelle* coût 4 (était 3) ; *Gargouille de Cendres* 10 ARM (était 15). Mesure (tools/balance-check.ts, 5 meilleurs decks optimisés par faction, IA forte, 4 parties par paire, mêmes parties) : Démons 70 → 60 %, Nomades 64 → 67 %, Empire 40 → 45 %, Elfes 25 → 29 %. Même jour : *Grimoire interdit* pioche 4 cartes (au lieu de 3) et en remet toujours 2.
- **Decks optimisés après l'équilibrage 9 (25/10/2026)** : 4 générations de plus (13 au total). Finale entre les 5 meilleurs decks optimisés de chaque faction : Nomades 67 %, Démons 59 % (71 % avant l'équilibrage), Empire 47 % (35 %), Elfes 27 % (27 %). Les Démons gardent leur noyau (Gargouilles, Légion, Bourreau, Pacte de Sang à 3 exemplaires) et ajoutent 3 Banquet Infernal. Les decks optimisés du menu sont mis à jour (src/data/optimized.ts).
