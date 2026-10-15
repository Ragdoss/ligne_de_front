// Noms et descriptions des cartes en français.
export const CARD_TEXT_FR: Record<string, { name: string; desc: string }> = {
  "recrue_imp": {
    "name": "Recrue Impériale",
    "desc": "Soldat de base, sans spécialisation."
  },
  "lancier_emp": {
    "name": "Lancier de l'Empire",
    "desc": "+15 ATK contre les régiments Monté."
  },
  "archer_imp": {
    "name": "Archer Impérial",
    "desc": "Mot-clé Distance."
  },
  "arbaletrier_imp": {
    "name": "Arbalétrier Impérial",
    "desc": "Lent. Pénétration d'armure 5 (ignore les 5 premiers points d'Armure de sa cible)."
  },
  "chevalier_prov": {
    "name": "Chevalier de Province",
    "desc": "Armure élevée, pas d'effet particulier."
  },
  "dragon_imp": {
    "name": "Dragon Impérial",
    "desc": "Grosse brute de fin de partie, pas d'effet particulier."
  },
  "general_empire": {
    "name": "Général de l'Empire",
    "desc": "+10 ATK, +5 ARM, +10 END permanents au porteur. Au début de chaque tour de son contrôleur, le porteur gagne 1 Moral par régiment Empire adjacent sur sa ligne."
  },
  "soldat_kragz": {
    "name": "Soldat de Kragz",
    "desc": "5 ARM de base ; +5 ARM tant qu'il porte un Leader."
  },
  "porte_etendard": {
    "name": "Porte-Étendard",
    "desc": "Au début de ton tour, chaque régiment porteur d'un Leader gagne 1 Moral."
  },
  "chevalier_templier": {
    "name": "Chevalier Templier",
    "desc": "Tant qu'il porte un Leader, son Moral ne peut pas descendre sous 3."
  },
  "cadets_academie": {
    "name": "Cadets de l'Académie",
    "desc": "Avant ou arrière. À son arrivée, crée un Lieutenant dans ta main."
  },
  "forteresse": {
    "name": "Forteresse l'Intuable",
    "desc": "Un Dragon massif (100 END, 20 ARM, 12 Moral) : l'Intuable."
  },
  "capitaine_garde": {
    "name": "Capitaine de la Garde",
    "desc": "Leader : +10 ARM, +2 MOR."
  },
  "aumonier_guerre": {
    "name": "Aumônier de Guerre",
    "desc": "Leader : à son attache puis au début de chaque tour de son contrôleur, le porteur regagne 10 END et 1 Moral."
  },
  "marechal_empire": {
    "name": "Maréchal d'Empire",
    "desc": "Leader requérant Empire + Dragon : +20 ATK, +10 ARM, +6 MOR. Si le porteur est ton seul régiment, tu gagnes la comparaison de Moral de fin de tour."
  },
  "ralliement": {
    "name": "Ralliement",
    "desc": "Cible un régiment allié porteur d'un Leader : il regagne 3 Moral (5 s'il a le Moral brisé)."
  },
  "formation_carre": {
    "name": "Formation en Carré",
    "desc": "Jusqu'à ton prochain tour, tous tes régiments porteurs d'un Leader gagnent +10 ARM."
  },
  "promotion": {
    "name": "Promotion",
    "desc": "Défausse un Leader de ta main, révèle les 2 prochains Leaders de ton deck, choisis-en un et pioche-le, puis mélange le deck."
  },
  "charge_imp": {
    "name": "Charge Impériale",
    "desc": "Le Lancier ciblé ignore l'Armure adverse ce tour-ci."
  },
  "convoi": {
    "name": "Convoi de Ravitaillement",
    "desc": "Régiment de scénario. 0 ATK, très fragile mais d'un Moral très élevé (il n'est pas compté dans le Moral total de fin de tour). Avance d'un emplacement vers la droite à intervalle régulier ; sa destruction fait perdre le scénario, sa sortie du plateau le fait gagner."
  },
  "garnison": {
    "name": "Garnison",
    "desc": "Régiment de scénario. Commence avec 3 Moral (maximum 6). Gagne 1 Moral chaque fois qu'un régiment adverse est vaincu."
  },
  "paysans": {
    "name": "Paysans",
    "desc": "+1 ressource/tour à son contrôleur (+1 de plus niveau 4+)."
  },
  "lieutenant": {
    "name": "Lieutenant",
    "desc": "+5 ATK, +5 INI, +2 Moral permanent au porteur."
  },
  "etat_major": {
    "name": "État Major",
    "desc": "Isolé, 0 ATK. +2 ressources/tour ; rallie 3 Moral aux régiments Empire au Moral brisé de son contrôleur."
  },
  "ordre_haut_commandement": {
    "name": "Ordre du Haut Commandement",
    "desc": "Tous vos régiments porteurs d'un Leader gagnent +10 ATK/+5 ARM ce tour-ci, et regagnent 4 Moral et 20 Endurance."
  },
  "halte_convoi": {
    "name": "Halte du Convoi",
    "desc": "Gratuite. Ton convoi saute sa prochaine avancée, et tu pioches une carte (scénarios d’escorte)."
  },
  "assassinat": {
    "name": "Assassinat",
    "desc": "Détruit le Leader attaché au régiment adverse ciblé (le régiment lui-même survit)."
  },
  "espion_imperial": {
    "name": "Espion Impérial",
    "desc": "Jouable sur un régiment adverse si vous contrôlez déjà un régiment Empire porteur d'un Leader. La cible gagne le mot-clé Lent."
  },
  "cavaliers_dragons_elite": {
    "name": "Cavaliers Dragons Élite",
    "desc": "Arrive prêt. À son arrivée, tous vos régiments Empire retrouvent un Moral plein."
  },
  "eclaireur_elfe": {
    "name": "Éclaireur Elfe",
    "desc": "Soldat de base, sans spécialisation."
  },
  "archer_bois": {
    "name": "Archer des Bois",
    "desc": "Mot-clé Distance."
  },
  "cavalier_elfe": {
    "name": "Cavalier Elfe",
    "desc": "Cavalerie rapide, pas d'effet particulier."
  },
  "elem_feu": {
    "name": "Élémentaire de Feu",
    "desc": "Forte ATK, faible END/MOR. Arrive prêt (pas de pénalité d'apparition)."
  },
  "clerc_foret": {
    "name": "Clerc de la Forêt",
    "desc": "Isolé, Distance, 0 ATK, durée de vie 3 tours. Génère Soin simple en main chaque tour."
  },
  "elem_terre": {
    "name": "Élémentaire de Terre",
    "desc": "Mur bon marché : 50 END, 5 ARM, 6 Moral. Active tes tactiques d'Élémentaux dès le niveau 1."
  },
  "elem_eau": {
    "name": "Élémentaire d'Eau",
    "desc": "Distance. À chaque fin de ton tour, soigne de 10 END ton régiment le plus blessé ; s'il atteint ainsi son END max, il gagne 1 Moral."
  },
  "elem_eveil_regiment": {
    "name": "Élémentaire Éveillé",
    "desc": "Mot-clé Minions. Créé automatiquement par la tactique Éveil Élémentaire."
  },
  "eveil_elementaire": {
    "name": "Éveil Élémentaire",
    "desc": "Crée un Élémentaire Éveillé (Minions : 10 ATK, 30 END, 0 ARM, 1 INI, 4 Moral) dans le premier emplacement vide du rang avant."
  },
  "vision": {
    "name": "Vision",
    "desc": "Requiert Élémentaux. Les tactiques que tu joues coûtent 1 de moins (minimum 0, coûts variables compris). À l'attache : choisis une des 3 prochaines tactiques de ton deck, mélange le deck, puis mets-la en première carte."
  },
  "sylvain": {
    "name": "Sylvain, Gardien Élémentaire",
    "desc": "Gros gabarit polyvalent, pas d'effet particulier."
  },
  "druide_ancien": {
    "name": "Druide Ancien",
    "desc": "+15 ATK, +10 ARM au porteur (double type requis)."
  },
  "volee_fleches": {
    "name": "Volée de Flèches",
    "desc": "Tous vos régiments Archer gagnent +10 ATK ce tour-ci."
  },
  "soin_simple": {
    "name": "Soin simple",
    "desc": "+10 Endurance à la cible. Générée par le Clerc de la Forêt."
  },
  "chamane_foret": {
    "name": "Chamane de la Forêt",
    "desc": "+15 END à l'arrivée puis +5 END à chaque fin de tour (des deux joueurs)."
  },
  "repositionnement": {
    "name": "Repositionnement",
    "desc": "Échange la position d'un Elfe allié avec un autre emplacement ; +20 INI ce tour-ci aux deux."
  },
  "rangers": {
    "name": "Rangers",
    "desc": "Distance, Lent. Sa cible est Sonnée. Si un Elfe l'achève, Rangers + le tueur regagnent 2 Moral."
  },
  "palissade_regiment": {
    "name": "Palissade",
    "desc": "Mot-clé Minions. Créée automatiquement par la tactique Palissade."
  },
  "palissade_tactique": {
    "name": "Palissade",
    "desc": "Coût variable (1 par emplacement avant vide). Crée un régiment Palissade (Minions) par emplacement vide."
  },
  "a_couvert": {
    "name": "À couvert",
    "desc": "La cible perd 20 ATK (minimum 1 ATK restant) et gagne 30 Armure ce tour-ci ; si l'ATK aurait dû tomber à 0, elle ne gagne que 20 Armure à la place."
  },
  "choc_et_effroi": {
    "name": "Choc et Effroi",
    "desc": "Coût variable (= nb de régiments adverses au Moral brisé). Les sonne tous."
  },
  "cultiste": {
    "name": "Cultiste",
    "desc": "À sa mort, son contrôleur pioche 1 carte."
  },
  "chien_infernal": {
    "name": "Chien Infernal",
    "desc": "Effrayant 1. Sacrifice niveau 1+ requis (coût d'accès, aucun gain)."
  },
  "esclave_guerrier": {
    "name": "Esclave Guerrier",
    "desc": "Regagne 2 Moral quand un autre régiment allié est détruit (même s'il est Minions)."
  },
  "acolyte_damne": {
    "name": "Acolyte Damné",
    "desc": "+5 ATK. Premier Leader Démon, aucun prérequis de Leader existant."
  },
  "pretre_sacrificiel": {
    "name": "Prêtre Sacrificiel",
    "desc": "Le porteur gagne Minions et +1 niveau permanent."
  },
  "suppot_infernal": {
    "name": "Suppôt Infernal",
    "desc": "+10 ATK, +5 ARM, +5 INI. Remplace le Leader déjà présent. Quand le régiment porteur est détruit : copie en main d'un régiment Démon de ta défausse, qui coûte 2 de moins à jouer."
  },
  "demon_akantha": {
    "name": "Démon d'Akantha",
    "desc": "Effrayant 2. Sacrifice niveau 3+ : récupère ATK/END/ARM/INI réels du sacrifié. Soin 15 END si un ennemi meurt de Moral."
  },
  "effroi_demoniaque": {
    "name": "Effroi Démoniaque",
    "desc": "La cible perd 2 Moral + 1 par Démon allié. Si détruite ainsi, vos Démons regagnent 1 Moral."
  },
  "brise_matin": {
    "name": "Brise du Matin",
    "desc": "Tous tes régiments Elfes gagnent +15 INI pour ce combat."
  },
  "brume_trompeuse": {
    "name": "Brume Trompeuse",
    "desc": "Un régiment adverse perd 20 INI pour ce combat, ainsi qu'un régiment adverse supplémentaire au hasard par régiment Élémentaux que tu contrôles."
  },
  "retraite_sylvestre": {
    "name": "Retraite Sylvestre",
    "desc": "Un Elfe allié retourne en main (il y retrouve toutes ses stats de base, son Leader part en défausse). Aucune lassitude, aucune perte de Moral pour les alliés."
  },
  "changement_tectonique": {
    "name": "Changement Tectonique",
    "desc": "Déplace un régiment adverse (avant/arrière) vers un emplacement vide de son camp. Coûte 2 de moins si tu contrôles un Élémentaux."
  },
  "bourgeonnement": {
    "name": "Bourgeonnement",
    "desc": "Soigne un régiment allié de 10 END et 1 Moral. Si tu contrôles un Élémentaux, crée une Floraison en main."
  },
  "floraison": {
    "name": "Floraison",
    "desc": "Soigne un régiment allié de 30 END et 2 Moral. Si tu contrôles un Élémentaux, crée une Fructification en main."
  },
  "fructification": {
    "name": "Fructification",
    "desc": "Soigne un régiment allié de 50 END et 5 Moral. Si tu contrôles un Élémentaux, tous tes autres régiments regagnent 10 END et 1 Moral."
  },
  "serenite_foret": {
    "name": "Sérénité de la Forêt",
    "desc": "Tu perds 3 points de lassitude, 6 si tu contrôles un Élémentaux (le niveau ne redescend jamais)."
  },
  "chant_vent": {
    "name": "Chant du Vent",
    "desc": "+25 INI permanents au porteur."
  },
  "veilleuse_sources": {
    "name": "Veilleuse des Sources",
    "desc": "Chaque fois qu'un de tes régiments regagne de l'Endurance, tu perds 1 point de lassitude par tranche de 20 END soignées (reliquat conservé)."
  },
  "dryades_guerisseuses": {
    "name": "Dryades Guérisseuses",
    "desc": "À chaque fin de ton tour, soigne de 10 END ton régiment le plus blessé."
  },
  "pacte_sang": {
    "name": "Pacte de Sang",
    "desc": "Gagne 4 points de lassitude, pioche 2 cartes et gagne 2 ressources."
  },
  "rancon_ames": {
    "name": "Rançon d'Âmes",
    "desc": "Cible un Démon allié : gagne X points de lassitude (X au choix, 1 à 5) ; il gagne +5 ATK par point payé pour ce combat."
  },
  "dette_infernale": {
    "name": "Dette Infernale",
    "desc": "Cible un régiment allié : +10 ATK et +20 END permanents, mais tu gagnes immédiatement autant de points de lassitude que son niveau."
  },
  "pacte_survie": {
    "name": "Pacte de Survie",
    "desc": "Cible un Démon allié, jusqu'au début de ton prochain tour : s'il devait perdre du Moral, tu gagnes 1 point de lassitude à la place ; s'il devait perdre de l'Endurance, tu gagnes 1 point de lassitude par tranche de 10 END ainsi évitées."
  },
  "abime_grandissant": {
    "name": "Abîme Grandissant",
    "desc": "Requiert Démon. Le porteur gagne +5 ATK par tranche de 10 points de lassitude de son contrôleur."
  },
  "ceremonie_declin": {
    "name": "Cérémonie du Déclin",
    "desc": "Sacrifice niveau 2+ requis (coût d'accès, aucun gain). Au début de chaque tour de son contrôleur : +1 point de lassitude. Chaque fois que son contrôleur gagne des points de lassitude, il gagne autant de ressources."
  },
  "veilleur_os": {
    "name": "Veilleur d'Os",
    "desc": "Distance. Sacrifice niveau 3+ requis (coût d'accès, aucun gain). À son arrivée, tu peux récupérer en main un régiment Démon de ta défausse (il quitte la défausse) ; tu gagnes autant de lassitude que son niveau."
  },
  "banquet_infernal": {
    "name": "Banquet Infernal",
    "desc": "Cible un de tes régiments : il est détruit et tu gagnes autant de ressources que son Moral actuel. Si tu contrôles un Démon, il acquiert d'abord Minions (pas de lassitude ni de perte de Moral pour les alliés)."
  },
  "tuteur_demoniaque": {
    "name": "Tuteur Démoniaque",
    "desc": "Choisis un niveau présent dans ton deck, pioche le premier Démon de ce niveau, gagne des ressources ET des points de lassitude = sa position dans le deck."
  },
  "fanatiques": {
    "name": "Fanatiques",
    "desc": "0 ATK. S'il sert de sacrifice, le Démon invoqué gagne Effrayant 2 et arrive prêt."
  },
  "maitre_chenil_infernal": {
    "name": "Maître du Chenil Infernal",
    "desc": "Distance, Effrayant 1. Sacrifice niveau 4+. Chaque fin de tour de son contrôleur, comble le rang avant de Chiens Infernaux (Minions)."
  },
  "jeune_nomade": {
    "name": "Jeune Nomade",
    "desc": "Arrive prêt. À son arrivée, l'adversaire défausse une carte au hasard. À sa mort, l'adversaire pioche une carte."
  },
  "frondeur_nomade": {
    "name": "Frondeur Nomade",
    "desc": "À son arrivée, sonne un régiment adverse de ton choix. Si une cible qu'il a blessée ce tour-ci est détruite, l'adversaire met la carte du dessus de son deck dans sa défausse."
  },
  "saboteur_nomade": {
    "name": "Saboteur Nomade",
    "desc": "Chaque fois que l'adversaire pioche une carte, elle part immédiatement en défausse et ce régiment perd un Moral égal au coût de la carte. S'il meurt avec un Moral inférieur à -1, l'adversaire pioche une carte en compensation."
  },
  "charmeur_basilics": {
    "name": "Charmeur de Basilics",
    "desc": "À son arrivée, un régiment Basilic au hasard de votre main coûte 1 de moins. Tant qu'il est en jeu, vos régiments Basilics arrivent prêts."
  },
  "basilics_oasis": {
    "name": "Basilics de l'Oasis",
    "desc": "À son arrivée : +10 Endurance s'il est à l'avant ; Distance et +30 Initiative s'il est à l'arrière."
  },
  "mirage": {
    "name": "Mirage",
    "desc": "Tous vos régiments Nomades en jeu refont leur effet d'arrivée en jeu."
  },
  "maitre_caravane": {
    "name": "Maître de Caravane",
    "desc": "Requiert un porteur Nomade. À son attache, le porteur refait son effet d'arrivée en jeu."
  },
  "archeotacticiens": {
    "name": "Archéotacticiens",
    "desc": "Distance. À son arrivée, met dans la défausse adverse une carte Tactique, une carte Leader et un régiment au hasard parmi les plus chers du deck adverse. Tant qu'il est en jeu, toute Tactique qui arrive dans la défausse adverse autrement que parce que l'adversaire l'a jouée vous offre une copie gratuite en main (coût 0, détruite en fin de votre tour)."
  },
  "chasseur_reliques": {
    "name": "Chasseur de Reliques",
    "desc": "À son arrivée, choisis un régiment dans la défausse adverse et supprime-le : le Chasseur gagne de façon permanente, au choix, l'ATK ou l'ARM de ce régiment."
  },
  "marchand_ombres": {
    "name": "Marchand d'Ombres",
    "desc": "À son arrivée, tu regardes la main adverse et choisis une carte que l'adversaire défausse."
  },
  "caravane_marchande": {
    "name": "Caravane Marchande",
    "desc": "Isolé, 0 ATK, durée de vie 3 tours. Au début de ton tour : +1 ressource. À son arrivée, supprime une carte de la défausse adverse (ton choix) : sa durée de vie augmente du niveau de cette carte."
  },
  "eleveur_basilics": {
    "name": "Éleveur de Basilics",
    "desc": "Les régiments Basilic de ta main coûtent 1 de moins. Chaque Basilic qui arrive en jeu de ton côté gagne +10 END permanents, et l'Éleveur se soigne de 10 END."
  },
  "guide_desert": {
    "name": "Guide du Désert",
    "desc": "Requiert un porteur Nomade : +15 INI, et le porteur n'a plus de pénalité d'apparition."
  },
  "marche_noir": {
    "name": "Marché Noir",
    "desc": "Chaque joueur pioche 3 cartes. Tu défausses 2 cartes de ta main (ton choix) ; l'adversaire en défausse 2 au hasard."
  },
  "embuscade": {
    "name": "Embuscade",
    "desc": "Un de tes régiments Nomades gagne +50 INI ce combat et refait son effet d'arrivée en jeu."
  },
  "rancon_desert": {
    "name": "Rançon du Désert",
    "desc": "Supprime une carte de la défausse adverse (ton choix), puis met dans la défausse adverse autant de cartes du dessus de son deck que le niveau de la carte supprimée."
  },
  "frappez_ravitaillement": {
    "name": "Frappez le ravitaillement",
    "desc": "L'adversaire défausse 2 cartes de sa main (son choix)."
  },
  "volez_ravitaillement": {
    "name": "Volez le ravitaillement",
    "desc": "L'adversaire défausse 3 cartes de sa main (son choix). Tu gagnes 7 ressources moins la somme des niveaux des cartes défaussées (minimum 0)."
  },
  "basilics_desert": {
    "name": "Basilics du Désert",
    "desc": "À son arrivée, gagne 5 END, 1 ARM, 3 INI et 1 Moral par carte dans la défausse adverse."
  },
  "diablotins": {
    "name": "Diablotins",
    "desc": "Minions (sa mort ne donne ni lassitude ni perte de Moral aux alliés). Quand il sert de sacrifice, tu gagnes 1 ressource."
  },
  "gargouille_cendres": {
    "name": "Gargouille de Cendres",
    "desc": "Sacrifice niveau 1+ requis. Armure élevée. Regagne 1 Moral chaque fois que tu sacrifies un régiment."
  },
  "seigneur_abysses": {
    "name": "Seigneur des Abysses",
    "desc": "Requiert Démon. +10 ATK, +2 Moral, Effrayant 2. Chaque fois que tu sacrifies un régiment, le porteur regagne 10 END et 1 Moral."
  },
  "oeuf_dragon": {
    "name": "Œuf de Dragon",
    "desc": "0 ATK. Au début de ton 3e tour après sa pose, éclot en Dragonnet Infernal (25 ATK, 50 END, 10 ARM, Effrayant 1) qui garde son Leader."
  },
  "dragonnet_infernal": {
    "name": "Dragonnet Infernal",
    "desc": "Né d'un Œuf de Dragon. Effrayant 1."
  },
  "dragon_infernal": {
    "name": "Dragon Infernal",
    "desc": "Sacrifice niveau 4+ requis. Effrayant 2. À son arrivée, tous les régiments adverses perdent 2 Moral."
  },
  "cavaliers_dunes": {
    "name": "Cavaliers des Dunes",
    "desc": "Cavalerie nomade. Arrive prêt (pas de pénalité d'apparition)."
  },
  "cheikh_dunes": {
    "name": "Cheikh des Dunes",
    "desc": "Requiert un porteur Nomade. +5 ATK, +2 Moral. Chaque fois que l'adversaire défausse une carte de sa main, le porteur gagne +5 ATK permanent."
  },
  "reine_basilics": {
    "name": "Reine des Basilics",
    "desc": "Effrayant 1. À son arrivée, reprends en main le Basilic de plus haut niveau de ta défausse."
  },
  "tempete_sable": {
    "name": "Tempête de Sable",
    "desc": "Ce tour-ci, tous les régiments adverses perdent Distance et 20 INI."
  },
  "oasis_cachee": {
    "name": "Oasis cachée",
    "desc": "Pioche 2 cartes, puis défausse 1 carte de ta main. +1 ressource si tu contrôles une Caravane Marchande."
  },
  "treant_millenaire": {
    "name": "Tréant Millénaire",
    "desc": "120 END. À chaque fin de ton tour, soigne tous tes régiments de 5 END."
  },
  "gardienne_lumiere": {
    "name": "Gardienne de la Lumière",
    "desc": "Distance. +15 ATK contre les Démons. À chaque fin de ton tour, soigne ton régiment le plus blessé de 10 END et 1 Moral."
  },
  "rite_purification": {
    "name": "Rite de Purification",
    "desc": "Le régiment adverse ciblé perd Effrayant et tous ses bonus permanents (ATK, ARM, END). Si c'est un Démon, il perd aussi 2 Moral."
  },
  "mercenaires": {
    "name": "Mercenaires",
    "desc": "Troupe de louage sans attache : jouable dans tous les decks."
  },
  "ravitaillement": {
    "name": "Ravitaillement",
    "desc": "Pioche 2 cartes."
  },
  "banniere_dechiree": {
    "name": "Bannière Déchirée",
    "desc": "Un régiment allié regagne 4 Moral s'il a le Moral brisé, 2 sinon."
  },
  "puits_sel_amar": {
    "name": "Puits de Sel-Amar",
    "desc": "Vital. 0 ATK. +1 ressource au début de chaque tour de son contrôleur."
  },
  "source_corrompue": {
    "name": "Source corrompue",
    "desc": "Vitale. 0 ATK. À chaque fin de tour des Démons, soigne leur régiment le plus blessé de 15 END."
  },
  "portail_infernal": {
    "name": "Portail infernal",
    "desc": "Vital. 0 ATK, 150 END, 10 ARM. Des Chiens Infernaux en surgissent à chaque tour."
  },
  "gardienne_nid": {
    "name": "Gardienne du Nid",
    "desc": "Vitale. Une Basilic géante qui veille sur les œufs de dragon."
  },
  "chariot_oeufs": {
    "name": "Chariot des œufs",
    "desc": "Le convoi des Démons : il avance d'une case tous les deux tours, de gauche à droite."
  },
  "oeuf_rituel": {
    "name": "Œuf de l'offrande",
    "desc": "Vital. L'œuf que le culte doit recevoir."
  },
  "legionnaire_desert": {
    "name": "Légionnaire du désert",
    "desc": "Fantassin impérial équipé pour le désert (carte de scénario)."
  },
  "garde_capitale": {
    "name": "Garde de la capitale",
    "desc": "Garde impériale (carte de scénario)."
  }
};
