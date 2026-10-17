// Catalogue des cartes (données). Source initiale : simulateur HTML, désormais la référence est ce fichier.
import type { CardDef } from '../engine/types';
import { BALANCE_5 } from './balance5';
import { BALANCE_6 } from './balance6';
import { WAVE1 } from './wave1';
import { WAVE2 } from './wave2';

const BASE_CARDS: Record<string, CardDef> = {
  "recrue_imp": {
    "id": "recrue_imp",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire",
      "Recrue"
    ],
    "niveau": 1,
    "cout": 1,
    "slotType": "avant",
    "atk": 10,
    "end": 30,
    "arm": 0,
    "ini": 15,
    "mor": 5,
    "keywords": []
  },
  "lancier_emp": {
    "id": "lancier_emp",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire",
      "Lancier"
    ],
    "niveau": 2,
    "cout": 3,
    "slotType": "avant",
    "atk": 12,
    "end": 40,
    "arm": 4,
    "ini": 20,
    "mor": 7,
    "keywords": [
      "BonusAntiMonte"
    ],
    "bonusVsMounted": 15
  },
  "archer_imp": {
    "id": "archer_imp",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire",
      "Archer"
    ],
    "niveau": 2,
    "cout": 3,
    "slotType": "arriere",
    "atk": 10,
    "end": 30,
    "arm": 0,
    "ini": 25,
    "mor": 5,
    "keywords": [
      "Distance"
    ]
  },
  "arbaletrier_imp": {
    "id": "arbaletrier_imp",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire",
      "Arbalétrier"
    ],
    "niveau": 3,
    "cout": 4,
    "slotType": "arriere",
    "atk": 25,
    "end": 30,
    "arm": 0,
    "ini": 10,
    "mor": 5,
    "keywords": [
      "Lent",
      "Pénétration 5"
    ]
  },
  "chevalier_prov": {
    "id": "chevalier_prov",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire",
      "Chevalier"
    ],
    "niveau": 3,
    "cout": 5,
    "slotType": "avant",
    "atk": 14,
    "end": 50,
    "arm": 13,
    "ini": 10,
    "mor": 8,
    "keywords": []
  },
  "dragon_imp": {
    "id": "dragon_imp",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Dragon",
      "Empire"
    ],
    "niveau": 5,
    "cout": 8,
    "slotType": "avant",
    "atk": 35,
    "end": 80,
    "arm": 10,
    "ini": 15,
    "mor": 10,
    "keywords": []
  },
  "general_empire": {
    "id": "general_empire",
    "cardType": "Leader",
    "faction": "empire",
    "typesRequired": [
      "Empire"
    ],
    "niveau": 3,
    "cout": 2,
    "bonusAtk": 10,
    "bonusArm": 5,
    "bonusIni": 0,
    "bonusMor": 0,
    "bonusEnd": 10,
    "moralPerAdjacentEmpireEachTurn": true
  },
  "soldat_kragz": {
    "id": "soldat_kragz",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire"
    ],
    "niveau": 2,
    "cout": 3,
    "slotType": "avant",
    "atk": 9,
    "end": 50,
    "arm": 4,
    "ini": 12,
    "mor": 8,
    "keywords": [],
    "armBonusWithLeader": 5
  },
  "porte_etendard": {
    "id": "porte_etendard",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire"
    ],
    "niveau": 2,
    "cout": 2,
    "slotType": "arriere",
    "atk": 5,
    "end": 30,
    "arm": 5,
    "ini": 5,
    "mor": 7,
    "keywords": [],
    "moralToLeaderCarriersEachTurn": 1
  },
  "chevalier_templier": {
    "id": "chevalier_templier",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire",
      "Chevalier"
    ],
    "niveau": 4,
    "cout": 4,
    "slotType": "avant",
    "atk": 10,
    "end": 60,
    "arm": 10,
    "ini": 8,
    "mor": 6,
    "keywords": [],
    "moralFloorWithLeader": 3
  },
  "cadets_academie": {
    "id": "cadets_academie",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire"
    ],
    "niveau": 3,
    "cout": 4,
    "slotTypes": [
      "avant",
      "arriere"
    ],
    "atk": 7,
    "end": 36,
    "arm": 5,
    "ini": 15,
    "mor": 6,
    "keywords": [],
    "createsLieutenantOnArrival": true
  },
  "forteresse": {
    "id": "forteresse",
    "unique": true,
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Dragon",
      "Empire"
    ],
    "niveau": 5,
    "cout": 7,
    "slotType": "avant",
    "atk": 15,
    "end": 100,
    "arm": 20,
    "ini": 5,
    "mor": 12,
    "keywords": []
  },
  "capitaine_garde": {
    "id": "capitaine_garde",
    "cardType": "Leader",
    "faction": "empire",
    "typesRequired": [
      "Empire"
    ],
    "niveau": 3,
    "cout": 1,
    "bonusAtk": 0,
    "bonusArm": 10,
    "bonusIni": 0,
    "bonusMor": 2
  },
  "aumonier_guerre": {
    "id": "aumonier_guerre",
    "cardType": "Leader",
    "faction": "empire",
    "typesRequired": [
      "Empire"
    ],
    "niveau": 3,
    "cout": 1,
    "bonusAtk": 0,
    "bonusArm": 0,
    "bonusIni": 0,
    "bonusMor": 0,
    "healOnAttach": 10,
    "healMorOnAttach": 1,
    "healCarrierEachTurn": {
      "end": 10,
      "mor": 1
    }
  },
  "marechal_empire": {
    "id": "marechal_empire",
    "cardType": "Leader",
    "faction": "empire",
    "typesRequired": [
      "Empire",
      "Dragon"
    ],
    "niveau": 5,
    "cout": 3,
    "bonusAtk": 20,
    "bonusArm": 10,
    "bonusIni": 0,
    "bonusMor": 6,
    "soloWinsMoralCheck": true
  },
  "ralliement": {
    "id": "ralliement",
    "cardType": "Tactique",
    "faction": "empire",
    "niveau": 2,
    "cout": 1,
    "targetRule": "allie-avec-leader",
    "effect": "ralliement"
  },
  "formation_carre": {
    "id": "formation_carre",
    "cardType": "Tactique",
    "faction": "empire",
    "niveau": 3,
    "cout": 2,
    "targetRule": "none",
    "effect": "formationCarre"
  },
  "promotion": {
    "id": "promotion",
    "cardType": "Tactique",
    "faction": "empire",
    "niveau": 3,
    "cout": 1,
    "targetRule": "none",
    "effect": "promotion"
  },
  "charge_imp": {
    "id": "charge_imp",
    "cardType": "Tactique",
    "faction": "empire",
    "niveau": 2,
    "cout": 0,
    "targetRule": "lancier-allie",
    "effect": "ignoreArmure"
  },
  "convoi": {
    "id": "convoi",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire",
      "Convoi"
    ],
    "niveau": 1,
    "cout": 0,
    "slotType": "arriere",
    "atk": 0,
    "end": 30,
    "arm": 0,
    "ini": 0,
    "mor": 30,
    "keywords": [],
    "excludeFromMoralTotal": true
  },
  "garnison": {
    "id": "garnison",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire"
    ],
    "niveau": 1,
    "cout": 0,
    "slotType": "arriere",
    "atk": 10,
    "end": 80,
    "arm": 5,
    "ini": 10,
    "mor": 6,
    "startMor": 3,
    "keywords": [
      "Distance"
    ],
    "onEnemyDeathMoral": 1
  },
  "paysans": {
    "id": "paysans",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain"
    ],
    "niveau": 1,
    "cout": 1,
    "slotType": "arriere",
    "atk": 0,
    "end": 10,
    "arm": 0,
    "ini": 5,
    "mor": 3,
    "keywords": [
      "GenerateurRessource"
    ]
  },
  "lieutenant": {
    "id": "lieutenant",
    "cardType": "Leader",
    "faction": "empire",
    "typesRequired": [
      "Empire"
    ],
    "niveau": 2,
    "cout": 0,
    "bonusAtk": 5,
    "bonusArm": 0,
    "bonusIni": 5,
    "bonusMor": 2
  },
  "etat_major": {
    "id": "etat_major",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire",
      "Élite"
    ],
    "niveau": 4,
    "cout": 2,
    "slotType": "isole",
    "atk": 0,
    "end": 30,
    "arm": 5,
    "ini": 0,
    "mor": 5,
    "keywords": [],
    "generatesResourceEachTurn": 2,
    "ralliesBrokenEmpireEachTurn": 3
  },
  "ordre_haut_commandement": {
    "id": "ordre_haut_commandement",
    "cardType": "Tactique",
    "faction": "empire",
    "niveau": 4,
    "cout": 2,
    "targetRule": "none",
    "effect": "ordreHautCommandement"
  },
  "halte_convoi": {
    "id": "halte_convoi",
    "cardType": "Tactique",
    "faction": "empire",
    "niveau": 1,
    "cout": 0,
    "targetRule": "none",
    "effect": "halteConvoi"
  },
  "assassinat": {
    "id": "assassinat",
    "cardType": "Tactique",
    "faction": "empire",
    "niveau": 4,
    "cout": 2,
    "targetRule": "ennemi-avec-leader",
    "effect": "assassinat"
  },
  "espion_imperial": {
    "id": "espion_imperial",
    "cardType": "Leader",
    "faction": "empire",
    "typesRequired": [],
    "niveau": 4,
    "cout": 2,
    "bonusAtk": 0,
    "bonusArm": 0,
    "bonusIni": 0,
    "bonusMor": 0,
    "targetsEnemy": true,
    "requiresOwnEmpireLeaderToCast": true,
    "grantsKeywordOnAttach": "Lent"
  },
  "cavaliers_dragons_elite": {
    "id": "cavaliers_dragons_elite",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Dragon",
      "Empire",
      "Monté",
      "Humain"
    ],
    "niveau": 4,
    "cout": 6,
    "slotType": "avant",
    "atk": 15,
    "end": 60,
    "arm": 15,
    "ini": 14,
    "mor": 10,
    "keywords": [],
    "arrivesReady": true,
    "healAllMoralOnArrival": true
  },
  "eclaireur_elfe": {
    "id": "eclaireur_elfe",
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Elfe",
      "Recrue"
    ],
    "niveau": 1,
    "cout": 1,
    "slotType": "avant",
    "atk": 10,
    "end": 20,
    "arm": 0,
    "ini": 25,
    "mor": 5,
    "keywords": []
  },
  "archer_bois": {
    "id": "archer_bois",
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Elfe",
      "Archer"
    ],
    "niveau": 2,
    "cout": 3,
    "slotType": "arriere",
    "atk": 15,
    "end": 20,
    "arm": 0,
    "ini": 30,
    "mor": 5,
    "keywords": [
      "Distance"
    ]
  },
  "cavalier_elfe": {
    "id": "cavalier_elfe",
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Elfe",
      "Monté"
    ],
    "niveau": 3,
    "cout": 4,
    "slotType": "avant",
    "atk": 20,
    "end": 40,
    "arm": 5,
    "ini": 25,
    "mor": 7,
    "keywords": []
  },
  "elem_feu": {
    "id": "elem_feu",
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Élémentaux"
    ],
    "niveau": 2,
    "cout": 3,
    "slotType": "avant",
    "atk": 25,
    "end": 20,
    "arm": 0,
    "ini": 20,
    "mor": 3,
    "keywords": [],
    "arrivesReady": true
  },
  "clerc_foret": {
    "id": "clerc_foret",
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Elfe",
      "Clerc"
    ],
    "niveau": 2,
    "cout": 2,
    "slotType": "isole",
    "atk": 0,
    "end": 30,
    "arm": 0,
    "ini": 15,
    "mor": 7,
    "keywords": [
      "Distance"
    ],
    "vieTours": 3
  },
  "elem_terre": {
    "id": "elem_terre",
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Élémentaux"
    ],
    "niveau": 1,
    "cout": 2,
    "slotType": "avant",
    "atk": 10,
    "end": 50,
    "arm": 5,
    "ini": 5,
    "mor": 6,
    "keywords": []
  },
  "elem_eau": {
    "id": "elem_eau",
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Élémentaux"
    ],
    "niveau": 2,
    "cout": 3,
    "slotType": "arriere",
    "atk": 5,
    "end": 20,
    "arm": 0,
    "ini": 5,
    "mor": 5,
    "keywords": [
      "Distance"
    ],
    "healsMostInjuredEachTurn": 10,
    "moralOnFullHeal": 1
  },
  "elem_eveil_regiment": {
    "id": "elem_eveil_regiment",
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Élémentaux"
    ],
    "niveau": 2,
    "cout": 0,
    "slotType": "avant",
    "atk": 10,
    "end": 30,
    "arm": 0,
    "ini": 1,
    "mor": 4,
    "keywords": [
      "Minions"
    ]
  },
  "eveil_elementaire": {
    "id": "eveil_elementaire",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 2,
    "cout": 2,
    "targetRule": "none",
    "effect": "eveilElementaire"
  },
  "vision": {
    "id": "vision",
    "cardType": "Leader",
    "faction": "elfe",
    "typesRequired": [
      "Élémentaux"
    ],
    "niveau": 3,
    "cout": 1,
    "bonusAtk": 0,
    "bonusArm": 0,
    "bonusIni": 0,
    "bonusMor": 0,
    "tacticCostReduction": 1,
    "visionOnAttach": true
  },
  "sylvain": {
    "id": "sylvain",
    "unique": true,
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Elfe",
      "Élémentaux",
      "Chevalier"
    ],
    "niveau": 4,
    "cout": 6,
    "slotType": "avant",
    "atk": 20,
    "end": 60,
    "arm": 15,
    "ini": 15,
    "mor": 8,
    "keywords": []
  },
  "druide_ancien": {
    "id": "druide_ancien",
    "cardType": "Leader",
    "faction": "elfe",
    "typesRequired": [
      "Elfe",
      "Élémentaux"
    ],
    "niveau": 4,
    "cout": 1,
    "bonusAtk": 15,
    "bonusArm": 10,
    "bonusIni": 0,
    "bonusMor": 0
  },
  "volee_fleches": {
    "id": "volee_fleches",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 2,
    "cout": 2,
    "targetRule": "archer-allie",
    "effect": "buffArchers"
  },
  "soin_simple": {
    "id": "soin_simple",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 1,
    "cout": 0,
    "targetRule": "allie-quelconque",
    "effect": "soin10"
  },
  "chamane_foret": {
    "id": "chamane_foret",
    "cardType": "Leader",
    "faction": "elfe",
    "typesRequired": [
      "Elfe"
    ],
    "niveau": 3,
    "cout": 1,
    "bonusAtk": 0,
    "bonusArm": 0,
    "bonusIni": 0,
    "bonusMor": 0,
    "healOnAttach": 15,
    "healEachTurn": 5
  },
  "repositionnement": {
    "id": "repositionnement",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 2,
    "cout": 1,
    "targetRule": "elfe-allie-puis-case",
    "effect": "repositionnement"
  },
  "rangers": {
    "id": "rangers",
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Elfe",
      "Archer"
    ],
    "niveau": 3,
    "cout": 2,
    "slotType": "arriere",
    "atk": 10,
    "end": 20,
    "arm": 0,
    "ini": 40,
    "mor": 4,
    "keywords": [
      "Distance",
      "Lent"
    ],
    "stunsTargetOnAttack": true
  },
  "palissade_regiment": {
    "id": "palissade_regiment",
    "cardType": "Regiment",
    "faction": "neutre",
    "types": [
      "Construction"
    ],
    "niveau": 2,
    "cout": 0,
    "slotType": "avant",
    "atk": 0,
    "end": 50,
    "arm": 0,
    "ini": 5,
    "mor": 3,
    "keywords": [
      "Minions"
    ]
  },
  "palissade_tactique": {
    "id": "palissade_tactique",
    "cardType": "Tactique",
    "faction": "neutre",
    "niveau": 2,
    "cout": 1,
    "targetRule": "none",
    "effect": "palissade",
    "dynamicCost": "frontEmpty"
  },
  "a_couvert": {
    "id": "a_couvert",
    "cardType": "Tactique",
    "faction": "neutre",
    "niveau": 1,
    "cout": 1,
    "targetRule": "allie-quelconque",
    "effect": "couvert"
  },
  "choc_et_effroi": {
    "id": "choc_et_effroi",
    "cardType": "Tactique",
    "faction": "neutre",
    "niveau": 4,
    "cout": 0,
    "targetRule": "none",
    "effect": "chocEtEffroi",
    "dynamicCost": "brokenEnemyCount"
  },
  "cultiste": {
    "id": "cultiste",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Humain"
    ],
    "niveau": 1,
    "cout": 1,
    "slotType": "avant",
    "atk": 0,
    "end": 40,
    "arm": 0,
    "ini": 10,
    "mor": 3,
    "keywords": [],
    "onDeathDraw": 1
  },
  "chien_infernal": {
    "id": "chien_infernal",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Démon",
      "Monté"
    ],
    "niveau": 1,
    "cout": 1,
    "slotType": "avant",
    "atk": 10,
    "end": 30,
    "arm": 5,
    "ini": 32,
    "mor": 6,
    "keywords": [
      "Effrayant 1"
    ],
    "sacrificeMinLevel": 1,
    "sacrificeGainsStats": false
  },
  "esclave_guerrier": {
    "id": "esclave_guerrier",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Humain",
      "Elfe"
    ],
    "niveau": 2,
    "cout": 3,
    "slotType": "avant",
    "atk": 10,
    "end": 50,
    "arm": 5,
    "ini": 18,
    "mor": 4,
    "keywords": [],
    "onAllyDeathMoralGain": 2
  },
  "mercenaire_stagiaire": {
    "id": "mercenaire_stagiaire",
    "cardType": "Regiment",
    "faction": "neutre",
    "types": [
      "Humain",
      "Recrue"
    ],
    "niveau": 1,
    "cout": 1,
    "slotType": "avant",
    "atk": 10,
    "end": 20,
    "arm": 0,
    "ini": 15,
    "mor": 5,
    "keywords": []
  },
  "acolyte_damne": {
    "id": "acolyte_damne",
    "cardType": "Leader",
    "faction": "demons",
    "typesRequired": [
      "Démon"
    ],
    "niveau": 1,
    "cout": 0,
    "bonusAtk": 5,
    "bonusArm": 0,
    "bonusIni": 0,
    "bonusMor": 0,
    "leaderNoAllyDeathMoralLoss": true
  },
  "pretre_sacrificiel": {
    "id": "pretre_sacrificiel",
    "cardType": "Leader",
    "faction": "demons",
    "typesRequired": [
      "Humain"
    ],
    "niveau": 2,
    "cout": 1,
    "bonusAtk": 0,
    "bonusArm": 0,
    "bonusIni": 0,
    "bonusMor": 0,
    "grantsKeywordOnAttach": "Minions",
    "bonusNiveauOnAttach": 1
  },
  "suppot_infernal": {
    "id": "suppot_infernal",
    "cardType": "Leader",
    "faction": "demons",
    "typesRequired": [],
    "niveau": 3,
    "cout": 2,
    "bonusAtk": 10,
    "bonusArm": 5,
    "bonusIni": 5,
    "bonusMor": 0,
    "requiresLeader": true,
    "recoversDemonOnCarrierDeath": true,
    "recoverDiscount": 2
  },
  "demon_akantha": {
    "id": "demon_akantha",
    "unique": true,
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Démon"
    ],
    "niveau": 3,
    "cout": 4,
    "slotType": "avant",
    "atk": 20,
    "end": 10,
    "arm": 5,
    "ini": 0,
    "mor": 10,
    "keywords": [
      "Effrayant 2"
    ],
    "sacrificeMinLevel": 3,
    "sacrificeGainsStats": true,
    "onEnemyMoralDeathHeal": 15
  },
  "effroi_demoniaque": {
    "id": "effroi_demoniaque",
    "cardType": "Tactique",
    "faction": "demons",
    "niveau": 2,
    "cout": 2,
    "targetRule": "ennemi-quelconque",
    "effect": "effroiDemoniaque"
  },
  "brise_matin": {
    "id": "brise_matin",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 1,
    "cout": 0,
    "targetRule": "none",
    "effect": "briseMatin"
  },
  "brume_trompeuse": {
    "id": "brume_trompeuse",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 2,
    "cout": 1,
    "targetRule": "ennemi-quelconque",
    "effect": "brumeTrompeuse"
  },
  "retraite_sylvestre": {
    "id": "retraite_sylvestre",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 2,
    "cout": 1,
    "targetRule": "elfe-allie",
    "effect": "retraiteSylvestre"
  },
  "changement_tectonique": {
    "id": "changement_tectonique",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 3,
    "cout": 2,
    "targetRule": "ennemi-puis-case-vide",
    "effect": "tectonique",
    "elementalDiscount": 2
  },
  "bourgeonnement": {
    "id": "bourgeonnement",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 1,
    "cout": 0,
    "targetRule": "allie-quelconque",
    "effect": "bourgeonnement"
  },
  "floraison": {
    "id": "floraison",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 3,
    "cout": 2,
    "targetRule": "allie-quelconque",
    "effect": "floraison"
  },
  "fructification": {
    "id": "fructification",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 5,
    "cout": 4,
    "targetRule": "allie-quelconque",
    "effect": "fructification"
  },
  "serenite_foret": {
    "id": "serenite_foret",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 3,
    "cout": 1,
    "targetRule": "none",
    "effect": "serenite",
    "doubledWithElemental": true
  },
  "chant_vent": {
    "id": "chant_vent",
    "cardType": "Leader",
    "faction": "elfe",
    "typesRequired": [
      "Elfe"
    ],
    "niveau": 3,
    "cout": 1,
    "bonusAtk": 0,
    "bonusArm": 0,
    "bonusIni": 25,
    "bonusMor": 0
  },
  "veilleuse_sources": {
    "id": "veilleuse_sources",
    "cardType": "Leader",
    "faction": "elfe",
    "typesRequired": [
      "Elfe"
    ],
    "niveau": 4,
    "cout": 2,
    "bonusAtk": 0,
    "bonusArm": 0,
    "bonusIni": 0,
    "bonusMor": 0,
    "lassitudePerHealStep": 20
  },
  "dryades_guerisseuses": {
    "id": "dryades_guerisseuses",
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Elfe",
      "Clerc"
    ],
    "niveau": 3,
    "cout": 3,
    "slotType": "arriere",
    "atk": 5,
    "end": 30,
    "arm": 0,
    "ini": 20,
    "mor": 5,
    "keywords": [],
    "healsMostInjuredEachTurn": 10
  },
  "pacte_sang": {
    "id": "pacte_sang",
    "cardType": "Tactique",
    "faction": "demons",
    "niveau": 2,
    "cout": 0,
    "targetRule": "none",
    "effect": "pacteSang"
  },
  "rancon_ames": {
    "id": "rancon_ames",
    "cardType": "Tactique",
    "faction": "demons",
    "niveau": 3,
    "cout": 1,
    "targetRule": "demon-allie",
    "effect": "ranconAmes"
  },
  "dette_infernale": {
    "id": "dette_infernale",
    "cardType": "Tactique",
    "faction": "demons",
    "niveau": 3,
    "cout": 1,
    "targetRule": "allie-quelconque",
    "effect": "detteInfernale"
  },
  "pacte_survie": {
    "id": "pacte_survie",
    "cardType": "Tactique",
    "faction": "demons",
    "niveau": 3,
    "cout": 1,
    "targetRule": "demon-allie",
    "effect": "pacteSurvie"
  },
  "abime_grandissant": {
    "id": "abime_grandissant",
    "cardType": "Leader",
    "faction": "demons",
    "typesRequired": [
      "Démon"
    ],
    "niveau": 4,
    "cout": 2,
    "bonusAtk": 0,
    "bonusArm": 0,
    "bonusIni": 0,
    "bonusMor": 0,
    "atkPerLassitudeStep": 5,
    "lassitudeStep": 10
  },
  "ceremonie_declin": {
    "id": "ceremonie_declin",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Démon",
      "Magicien"
    ],
    "niveau": 3,
    "cout": 3,
    "slotType": "arriere",
    "atk": 5,
    "end": 30,
    "arm": 0,
    "ini": 8,
    "mor": 5,
    "keywords": [],
    "sacrificeMinLevel": 2,
    "sacrificeGainsStats": false,
    "sacrificeGainsKeywords": false,
    "lassitudeAtTurnStart": 1,
    "resourceOnLassitudeGain": true
  },
  "veilleur_os": {
    "id": "veilleur_os",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Démon",
      "Magicien"
    ],
    "niveau": 4,
    "cout": 4,
    "slotType": "arriere",
    "atk": 10,
    "end": 30,
    "arm": 5,
    "ini": 12,
    "mor": 6,
    "keywords": [
      "Distance"
    ],
    "sacrificeMinLevel": 3,
    "sacrificeGainsStats": false,
    "sacrificeGainsKeywords": false,
    "recoversDemonOnArrival": true
  },
  "banquet_infernal": {
    "id": "banquet_infernal",
    "cardType": "Tactique",
    "faction": "demons",
    "niveau": 3,
    "cout": 0,
    "targetRule": "allie-quelconque",
    "effect": "banquetInfernal"
  },
  "tuteur_demoniaque": {
    "id": "tuteur_demoniaque",
    "cardType": "Tactique",
    "faction": "demons",
    "niveau": 4,
    "cout": 1,
    "targetRule": "none",
    "effect": "tuteurDemoniaque"
  },
  "fanatiques": {
    "id": "fanatiques",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Humain"
    ],
    "niveau": 3,
    "cout": 3,
    "slotTypes": [
      "avant",
      "arriere"
    ],
    "atk": 0,
    "end": 60,
    "arm": 5,
    "ini": 11,
    "mor": 5,
    "keywords": [],
    "onSacrificeGrant": {
      "keywords": [
        "Effrayant 2"
      ],
      "arrivesReady": true
    }
  },
  "maitre_chenil_infernal": {
    "id": "maitre_chenil_infernal",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Démon",
      "Magicien"
    ],
    "niveau": 5,
    "cout": 8,
    "slotType": "arriere",
    "atk": 10,
    "end": 40,
    "arm": 10,
    "ini": 50,
    "mor": 5,
    "keywords": [
      "Distance",
      "Effrayant 1"
    ],
    "sacrificeMinLevel": 4,
    "sacrificeGainsStats": false,
    "sacrificeGainsKeywords": false,
    "summonsChienInfernalEachTurn": true
  },
  "jeune_nomade": {
    "id": "jeune_nomade",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Humain",
      "Nomade"
    ],
    "niveau": 1,
    "cout": 1,
    "slotType": "avant",
    "atk": 5,
    "end": 30,
    "arm": 0,
    "ini": 27,
    "mor": 4,
    "keywords": [
      "Prêt"
    ],
    "arrivesReady": true,
    "onDeathOpponentDraws": 1
  },
  "frondeur_nomade": {
    "id": "frondeur_nomade",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Humain",
      "Nomade"
    ],
    "niveau": 1,
    "cout": 1,
    "slotType": "arriere",
    "atk": 5,
    "end": 20,
    "arm": 0,
    "ini": 31,
    "mor": 5,
    "keywords": [],
    "woundInflictsFrondeurMill": true
  },
  "saboteur_nomade": {
    "id": "saboteur_nomade",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Humain",
      "Nomade"
    ],
    "niveau": 3,
    "cout": 3,
    "slotType": "isole",
    "atk": 1,
    "end": 21,
    "arm": 0,
    "ini": 0,
    "mor": 10,
    "keywords": [],
    "interceptsEnemyDraws": true
  },
  "charmeur_basilics": {
    "id": "charmeur_basilics",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Elfe",
      "Nomade"
    ],
    "niveau": 2,
    "cout": 2,
    "slotType": "arriere",
    "atk": 10,
    "end": 20,
    "arm": 2,
    "ini": 4,
    "mor": 5,
    "keywords": [],
    "grantsBasilicsArriveReady": true
  },
  "basilics_oasis": {
    "id": "basilics_oasis",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Basilic",
      "Nomade"
    ],
    "niveau": 3,
    "cout": 5,
    "slotTypes": [
      "avant",
      "arriere"
    ],
    "atk": 15,
    "end": 40,
    "arm": 10,
    "ini": 12,
    "mor": 8,
    "keywords": []
  },
  "mirage": {
    "id": "mirage",
    "cardType": "Tactique",
    "faction": "nomades",
    "niveau": 2,
    "cout": 2,
    "targetRule": "none",
    "effect": "mirage"
  },
  "maitre_caravane": {
    "id": "maitre_caravane",
    "cardType": "Leader",
    "faction": "nomades",
    "typesRequired": [
      "Nomade"
    ],
    "niveau": 2,
    "cout": 1,
    "bonusAtk": 0,
    "bonusArm": 0,
    "bonusIni": 0,
    "bonusMor": 0,
    "replaysArrivalEffectOnAttach": true
  },
  "archeotacticiens": {
    "id": "archeotacticiens",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Humain",
      "Magicien",
      "Nomade"
    ],
    "niveau": 4,
    "cout": 4,
    "slotType": "arriere",
    "atk": 15,
    "end": 30,
    "arm": 5,
    "ini": 25,
    "mor": 6,
    "keywords": [
      "Distance"
    ],
    "grantsFreeTacticCopyOnEnemyDiscard": true
  },
  "chasseur_reliques": {
    "id": "chasseur_reliques",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Humain",
      "Nomade"
    ],
    "niveau": 3,
    "cout": 3,
    "slotType": "arriere",
    "atk": 10,
    "end": 30,
    "arm": 0,
    "ini": 20,
    "mor": 5,
    "keywords": []
  },
  "marchand_ombres": {
    "id": "marchand_ombres",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Humain",
      "Nomade"
    ],
    "niveau": 2,
    "cout": 2,
    "slotType": "avant",
    "atk": 10,
    "end": 40,
    "arm": 0,
    "ini": 25,
    "mor": 6,
    "keywords": []
  },
  "caravane_marchande": {
    "id": "caravane_marchande",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Humain",
      "Nomade"
    ],
    "niveau": 2,
    "cout": 1,
    "slotType": "isole",
    "atk": 0,
    "end": 30,
    "arm": 0,
    "ini": 0,
    "mor": 6,
    "keywords": [],
    "vieTours": 3,
    "generatesResourceEachTurn": 1
  },
  "eleveur_basilics": {
    "id": "eleveur_basilics",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Humain",
      "Nomade"
    ],
    "niveau": 3,
    "cout": 3,
    "slotType": "arriere",
    "atk": 10,
    "end": 30,
    "arm": 2,
    "ini": 8,
    "mor": 6,
    "keywords": [],
    "healsOnBasilicArrival": 10,
    "basilicCostReduction": 1,
    "basilicEndBonus": 10
  },
  "guide_desert": {
    "id": "guide_desert",
    "cardType": "Leader",
    "faction": "nomades",
    "typesRequired": [
      "Nomade"
    ],
    "niveau": 2,
    "cout": 0,
    "bonusAtk": 0,
    "bonusArm": 0,
    "bonusIni": 15,
    "bonusMor": 0,
    "grantsReadyOnAttach": true
  },
  "marche_noir": {
    "id": "marche_noir",
    "cardType": "Tactique",
    "faction": "nomades",
    "niveau": 3,
    "cout": 1,
    "targetRule": "none",
    "effect": "marcheNoir"
  },
  "embuscade": {
    "id": "embuscade",
    "cardType": "Tactique",
    "faction": "nomades",
    "niveau": 1,
    "cout": 1,
    "targetRule": "nomade-allie",
    "effect": "embuscade"
  },
  "rancon_desert": {
    "id": "rancon_desert",
    "cardType": "Tactique",
    "faction": "nomades",
    "niveau": 4,
    "cout": 3,
    "targetRule": "none",
    "effect": "ranconDesert"
  },
  "frappez_ravitaillement": {
    "id": "frappez_ravitaillement",
    "cardType": "Tactique",
    "faction": "nomades",
    "niveau": 3,
    "cout": 3,
    "targetRule": "none",
    "effect": "frappezRavitaillement"
  },
  "volez_ravitaillement": {
    "id": "volez_ravitaillement",
    "cardType": "Tactique",
    "faction": "nomades",
    "niveau": 4,
    "cout": 4,
    "targetRule": "none",
    "effect": "volezRavitaillement"
  },
  "basilics_desert": {
    "id": "basilics_desert",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Basilic",
      "Nomade"
    ],
    "niveau": 5,
    "cout": 8,
    "slotType": "avant",
    "atk": 25,
    "end": 20,
    "arm": 0,
    "ini": 0,
    "mor": 1,
    "keywords": []
  },
  "diablotins": {
    "id": "diablotins",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Démon"
    ],
    "niveau": 2,
    "cout": 1,
    "slotType": "avant",
    "atk": 8,
    "end": 20,
    "arm": 0,
    "ini": 20,
    "mor": 4,
    "keywords": [
      "Minions"
    ],
    "onSacrificedResource": 1
  },
  "gargouille_cendres": {
    "id": "gargouille_cendres",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Démon"
    ],
    "niveau": 2,
    "cout": 2,
    "slotType": "avant",
    "atk": 10,
    "end": 40,
    "arm": 15,
    "ini": 8,
    "mor": 6,
    "keywords": [],
    "sacrificeMinLevel": 1,
    "sacrificeGainsStats": false,
    "moralOnAllySacrificed": 1
  },
  "seigneur_abysses": {
    "id": "seigneur_abysses",
    "cardType": "Leader",
    "faction": "demons",
    "niveau": 5,
    "cout": 3,
    "typesRequired": [
      "Démon"
    ],
    "bonusAtk": 10,
    "bonusMor": 2,
    "grantsKeywordOnAttach": "Effrayant 2",
    "healOnOwnSacrifice": 10
  },
  "oeuf_dragon": {
    "id": "oeuf_dragon",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Dragon"
    ],
    "niveau": 3,
    "cout": 2,
    "slotType": "arriere",
    "atk": 0,
    "end": 60,
    "arm": 10,
    "ini": 0,
    "mor": 8,
    "keywords": [],
    "hatchesInto": "dragonnet_infernal",
    "hatchTurns": 3
  },
  "dragonnet_infernal": {
    "id": "dragonnet_infernal",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Démon",
      "Dragon"
    ],
    "niveau": 3,
    "cout": 0,
    "slotType": "arriere",
    "atk": 25,
    "end": 50,
    "arm": 10,
    "ini": 20,
    "mor": 8,
    "keywords": [
      "Effrayant 1"
    ]
  },
  "dragon_infernal": {
    "id": "dragon_infernal",
    "unique": true,
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Démon",
      "Dragon"
    ],
    "niveau": 5,
    "cout": 7,
    "slotType": "avant",
    "atk": 30,
    "end": 70,
    "arm": 10,
    "ini": 18,
    "mor": 10,
    "keywords": [
      "Effrayant 2"
    ],
    "sacrificeMinLevel": 4,
    "sacrificeGainsStats": false,
    "onArrivalEnemyMoralLoss": 2
  },
  "cavaliers_dunes": {
    "id": "cavaliers_dunes",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Humain",
      "Nomade",
      "Monté"
    ],
    "niveau": 2,
    "cout": 3,
    "slotType": "avant",
    "atk": 14,
    "end": 30,
    "arm": 2,
    "ini": 35,
    "mor": 6,
    "keywords": [],
    "arrivesReady": true
  },
  "cheikh_dunes": {
    "id": "cheikh_dunes",
    "cardType": "Leader",
    "faction": "nomades",
    "niveau": 4,
    "cout": 2,
    "typesRequired": [
      "Nomade"
    ],
    "bonusAtk": 5,
    "bonusMor": 2,
    "atkPerEnemyDiscard": 5
  },
  "reine_basilics": {
    "id": "reine_basilics",
    "unique": true,
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Basilic",
      "Nomade"
    ],
    "niveau": 5,
    "cout": 7,
    "slotType": "avant",
    "atk": 30,
    "end": 60,
    "arm": 10,
    "ini": 15,
    "mor": 9,
    "keywords": [
      "Effrayant 1"
    ]
  },
  "tempete_sable": {
    "id": "tempete_sable",
    "cardType": "Tactique",
    "faction": "nomades",
    "niveau": 3,
    "cout": 2,
    "targetRule": "none",
    "effect": "tempeteSable"
  },
  "oasis_cachee": {
    "id": "oasis_cachee",
    "cardType": "Tactique",
    "faction": "nomades",
    "niveau": 2,
    "cout": 1,
    "targetRule": "none",
    "effect": "oasisCachee"
  },
  "treant_millenaire": {
    "id": "treant_millenaire",
    "unique": true,
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Élémentaux"
    ],
    "niveau": 5,
    "cout": 7,
    "slotType": "avant",
    "atk": 20,
    "end": 120,
    "arm": 10,
    "ini": 5,
    "mor": 10,
    "keywords": [],
    "healsAllEachTurn": 5
  },
  "gardienne_lumiere": {
    "id": "gardienne_lumiere",
    "unique": true,
    "cardType": "Regiment",
    "faction": "elfe",
    "types": [
      "Elfe",
      "Clerc"
    ],
    "niveau": 4,
    "cout": 4,
    "slotType": "arriere",
    "atk": 15,
    "end": 40,
    "arm": 5,
    "ini": 20,
    "mor": 7,
    "keywords": [
      "Distance"
    ],
    "bonusVsTypes": {
      "Démon": 15
    },
    "healsMostInjuredEachTurn": 10,
    "healMorWithHeal": 1
  },
  "rite_purification": {
    "id": "rite_purification",
    "cardType": "Tactique",
    "faction": "elfe",
    "niveau": 3,
    "cout": 2,
    "targetRule": "ennemi-quelconque",
    "effect": "purification"
  },
  "mercenaires": {
    "id": "mercenaires",
    "cardType": "Regiment",
    "faction": "neutre",
    "types": [
      "Humain"
    ],
    "niveau": 2,
    "cout": 2,
    "slotType": "avant",
    "atk": 12,
    "end": 35,
    "arm": 3,
    "ini": 15,
    "mor": 5,
    "keywords": []
  },
  "ravitaillement": {
    "id": "ravitaillement",
    "cardType": "Tactique",
    "faction": "neutre",
    "niveau": 1,
    "cout": 1,
    "targetRule": "none",
    "effect": "ravitaillement"
  },
  "banniere_dechiree": {
    "id": "banniere_dechiree",
    "cardType": "Tactique",
    "faction": "neutre",
    "niveau": 3,
    "cout": 1,
    "targetRule": "allie-quelconque",
    "effect": "banniereDechiree"
  },
  "puits_sel_amar": {
    "id": "puits_sel_amar",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Puits"
    ],
    "niveau": 1,
    "cout": 0,
    "slotType": "arriere",
    "atk": 0,
    "end": 90,
    "arm": 5,
    "ini": 0,
    "mor": 30,
    "keywords": [],
    "generatesResourceEachTurn": 1,
    "excludeFromMoralTotal": true
  },
  "source_corrompue": {
    "id": "source_corrompue",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Source"
    ],
    "niveau": 1,
    "cout": 0,
    "slotType": "arriere",
    "atk": 0,
    "end": 80,
    "arm": 5,
    "ini": 0,
    "mor": 12,
    "keywords": [],
    "healsMostInjuredEachTurn": 15,
    "excludeFromMoralTotal": true
  },
  "portail_infernal": {
    "id": "portail_infernal",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Portail"
    ],
    "niveau": 1,
    "cout": 0,
    "slotType": "arriere",
    "atk": 0,
    "end": 150,
    "arm": 10,
    "ini": 0,
    "mor": 20,
    "keywords": [],
    "excludeFromMoralTotal": true
  },
  "gardienne_nid": {
    "id": "gardienne_nid",
    "cardType": "Regiment",
    "faction": "nomades",
    "types": [
      "Basilic",
      "Nomade"
    ],
    "niveau": 3,
    "cout": 0,
    "slotType": "avant",
    "atk": 20,
    "end": 70,
    "arm": 10,
    "ini": 15,
    "mor": 10,
    "keywords": []
  },
  "chariot_oeufs": {
    "id": "chariot_oeufs",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Convoi"
    ],
    "niveau": 1,
    "cout": 0,
    "slotType": "arriere",
    "atk": 0,
    "end": 40,
    "arm": 5,
    "ini": 0,
    "mor": 30,
    "keywords": [],
    "excludeFromMoralTotal": true
  },
  "oeuf_rituel": {
    "id": "oeuf_rituel",
    "cardType": "Regiment",
    "faction": "demons",
    "types": [
      "Dragon"
    ],
    "niveau": 1,
    "cout": 0,
    "slotType": "arriere",
    "atk": 0,
    "end": 60,
    "arm": 10,
    "ini": 0,
    "mor": 30,
    "keywords": [],
    "excludeFromMoralTotal": true
  },
  "legionnaire_desert": {
    "id": "legionnaire_desert",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire"
    ],
    "niveau": 2,
    "cout": 2,
    "slotType": "avant",
    "atk": 12,
    "end": 40,
    "arm": 6,
    "ini": 12,
    "mor": 7,
    "keywords": []
  },
  "garde_capitale": {
    "id": "garde_capitale",
    "cardType": "Regiment",
    "faction": "empire",
    "types": [
      "Humain",
      "Empire"
    ],
    "niveau": 2,
    "cout": 0,
    "slotType": "avant",
    "atk": 12,
    "end": 45,
    "arm": 8,
    "ini": 12,
    "mor": 7,
    "keywords": []
  }
} as Record<string, CardDef>;

/** Toutes les cartes : catalogue de base + vagues 1 et 2 de la première édition. */
export const CARDS: Record<string, CardDef> = { ...BASE_CARDS, ...WAVE1, ...WAVE2 };
for (const [id, over] of Object.entries({ ...BALANCE_5, ...BALANCE_6 })) CARDS[id] = { ...CARDS[id]!, ...over } as CardDef;
