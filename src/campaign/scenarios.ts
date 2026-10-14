// Les 4 scénarios de la campagne Empire contre Elfes (repris à l'identique du simulateur prototype).
import type { CampaignScenario } from './types';

/** Aucune limite (lassitude sans défaite, règle « aucun régiment » désactivée…). */
export const NO_LIMIT = 1e9;

export const SCENARIOS: Record<string, CampaignScenario> = {
  "s1": {
    "id": "s1",
    "title": "Scénario 1 — Attaque à la frontière",
    "deckRules": {
      "min": 20,
      "text": "Minimum 20 cartes. Aucune limite maximale : un deck plus gros est moins régulier."
    },
    "reward": {
      "exchange": {
        "from": "recrue_imp",
        "to": "lancier_emp",
        "count": 2
      },
      "gifts": [
        "chevalier_prov",
        "chevalier_prov",
        "arbaletrier_imp"
      ]
    },
    "intro": [
      {
        "who": "",
        "text": "Les régiments à la frontière se font attaquer tout à coup par des elfes. Un messager est parti prévenir le quartier général."
      },
      {
        "who": "",
        "text": "Dans 5 tours, les troupes des garnisons environnantes seront là pour nous aider. Il faut tenir jusque-là."
      }
    ],
    "A": {
      "faction": "empire",
      "label": "Empire",
      "deckList": [
        "recrue_imp",
        "recrue_imp",
        "recrue_imp",
        "recrue_imp",
        "recrue_imp",
        "recrue_imp",
        "recrue_imp",
        "recrue_imp",
        "recrue_imp",
        "recrue_imp",
        "recrue_imp",
        "recrue_imp",
        "archer_imp",
        "archer_imp",
        "archer_imp",
        "lieutenant",
        "lieutenant",
        "lieutenant",
        "palissade_tactique",
        "palissade_tactique"
      ],
      "ai": false,
      "start": {
        "avant": {
          "1": "palissade_regiment",
          "2": "palissade_regiment"
        },
        "arriere": {
          "1": "archer_imp"
        }
      }
    },
    "B": {
      "faction": "elfe",
      "label": "Royaumes Elfiques",
      "deckList": [
        "eclaireur_elfe",
        "eclaireur_elfe",
        "eclaireur_elfe",
        "eclaireur_elfe",
        "eclaireur_elfe",
        "eclaireur_elfe",
        "archer_bois",
        "archer_bois",
        "archer_bois",
        "retraite_sylvestre",
        "retraite_sylvestre",
        "retraite_sylvestre",
        "cavalier_elfe",
        "cavalier_elfe",
        "cavalier_elfe",
        "chamane_foret",
        "chamane_foret",
        "chamane_foret",
        "dryades_guerisseuses",
        "dryades_guerisseuses",
        "dryades_guerisseuses",
        "floraison",
        "floraison",
        "floraison"
      ],
      "ai": true,
      "start": {
        "avant": {
          "1": "eclaireur_elfe",
          "2": "eclaireur_elfe"
        }
      }
    },
    "defeatLassitude": {
      "A": 16,
      "B": NO_LIMIT
    },
    "noRegimentDefeatFromTurn": {
      "A": 1,
      "B": 6
    },
    "aiNoRegimentsFromTurn": {
      "B": 6
    },
    "events": [
      {
        "turn": 3,
        "pid": "A",
        "dialog": [
          {
            "who": "Commandant",
            "text": "On ne s'en sortira pas sans aide."
          }
        ]
      },
      {
        "turn": 3,
        "pid": "B",
        "resource": 2
      },
      {
        "turn": 4,
        "pid": "B",
        "resource": 3
      },
      {
        "turn": 5,
        "pid": "A",
        "resource": 15,
        "giveCards": [
          "chevalier_prov",
          "chevalier_prov",
          "chevalier_prov",
          "arbaletrier_imp",
          "arbaletrier_imp"
        ],
        "levelFree": true,
        "dialog": [
          {
            "who": "Soldat",
            "text": "Nous sommes sauvés, les renforts sont enfin arrivés ! Un dernier effort les gars !!"
          }
        ]
      }
    ],
    "victoryDialog": [
      {
        "who": "Commandant",
        "text": "Jamais les elfes n'avaient été aussi agressifs dans leurs escarmouches."
      },
      {
        "who": "Soldat",
        "text": "En effet. J'espère qu'on va bientôt avoir un compte rendu de nos espions pour pouvoir expliquer tout ça."
      },
      {
        "who": "Commandant",
        "text": "Et surtout qu'on ne subisse pas de nouvelles attaques."
      },
      {
        "who": "Soldat 2",
        "text": "Commandant ! La ville de Kragz se fait attaquer ! Un messager vient d'arriver !"
      }
    ]
  },
  "s2": {
    "id": "s2",
    "title": "Scénario 2 — Le siège de Kragz",
    "deckRules": {
      "min": 20,
      "text": "Minimum 20 cartes. Aucune limite maximale."
    },
    "intro": [
      {
        "who": "",
        "text": "La ville de Kragz est assiégée par les elfes. Les défenses tombent les unes après les autres."
      },
      {
        "who": "",
        "text": "Les assaillants sont soutenus par de puissants élémentaux. Il faut empêcher la garnison de tomber : tant qu'elle tient, la ville tient."
      }
    ],
    "A": {
      "faction": "empire",
      "label": "Empire",
      "ai": false,
      "start": {
        "avant": {
          "1": "palissade_regiment",
          "2": "palissade_regiment"
        },
        "arriere": {
          "1": "garnison"
        }
      }
    },
    "B": {
      "faction": "elfe",
      "label": "Royaumes Elfiques",
      "deckList": [
        "bourgeonnement",
        "bourgeonnement",
        "bourgeonnement",
        "eclaireur_elfe",
        "eclaireur_elfe",
        "eclaireur_elfe",
        "elem_terre",
        "elem_terre",
        "elem_terre",
        "archer_bois",
        "archer_bois",
        "archer_bois",
        "brume_trompeuse",
        "elem_eau",
        "elem_eau",
        "elem_eau",
        "elem_feu",
        "elem_feu",
        "eveil_elementaire",
        "eveil_elementaire",
        "eveil_elementaire",
        "cavalier_elfe",
        "cavalier_elfe",
        "cavalier_elfe",
        "dryades_guerisseuses",
        "dryades_guerisseuses",
        "dryades_guerisseuses",
        "vision",
        "vision",
        "vision"
      ],
      "ai": true,
      "start": {
        "avant": {
          "1": "elem_terre",
          "2": "elem_terre"
        }
      }
    },
    "defeatLassitude": {
      "A": 16,
      "B": 16
    },
    "mustSurvive": {
      "A": "garnison"
    },
    "moralCheckLostResource": {
      "B": {
        "base": 1,
        "level3": 2
      }
    },
    "startOverrides": {
      "palissade_regiment": {
        "mor": 4
      }
    },
    "moralCheckLassitude": 1,
    "startLevel": {
      "B": 2
    },
    "levelThresholds": {
      "B": [
        0,
        0,
        4,
        16,
        25
      ]
    },
    "reward": {
      "order": [
        "gifts",
        "exchange",
        "picks"
      ],
      "gifts": [
        "capitaine_garde",
        "soldat_kragz",
        "soldat_kragz"
      ],
      "exchange": {
        "from": "recrue_imp",
        "to": "porte_etendard",
        "count": 1
      },
      "picks": {
        "count": 2,
        "options": [
          "ralliement",
          "charge_imp",
          "formation_carre",
          "promotion"
        ],
        "text": "Choisis une tactique à ajouter à ton pool"
      }
    },
    "events": [],
    "victoryDialog": [
      {
        "who": "",
        "text": "Les assauts elfes se brisent contre les remparts. Les élémentaux se dispersent et la garnison tient bon."
      },
      {
        "who": "",
        "text": "Kragz est sauvée, pour cette fois."
      }
    ]
  },
  "s3": {
    "id": "s3",
    "title": "Scénario 3 — Le convoi du col des Brumes",
    "deckRules": {
      "min": 20,
      "text": "Minimum 20 cartes. Terrain plus long : 6 emplacements à l'avant, 5 à l'arrière. Pas de défaite par pioche vide."
    },
    "layout": {
      "avant": 6,
      "arriere": 5
    },
    "emptyDeckDefeat": false,
    "intro": [
      {
        "who": "",
        "text": "Kragz respire, mais ses réserves sont presque épuisées. Un convoi de ravitaillement doit traverser le col des Brumes pour la rejoindre."
      },
      {
        "who": "",
        "text": "Le convoi avance lentement, d'un emplacement tous les deux tours, de la gauche vers la droite. Il est fragile : défendez-le jusqu'à ce qu'il ait quitté le terrain."
      },
      {
        "who": "",
        "text": "Vous disposez de deux Halte du Convoi (gratuites) : chacune retarde une avancée et fait piocher une carte. Gardez le convoi derrière des troupes solides !"
      }
    ],
    "A": {
      "faction": "empire",
      "label": "Empire",
      "ai": false,
      "start": {
        "arriere": {
          "0": "convoi"
        }
      },
      "startHand": [
        "halte_convoi",
        "halte_convoi"
      ]
    },
    "B": {
      "faction": "elfe",
      "label": "Royaumes Elfiques",
      "deckList": [
        "eclaireur_elfe",
        "eclaireur_elfe",
        "eclaireur_elfe",
        "eclaireur_elfe",
        "eclaireur_elfe",
        "cavalier_elfe",
        "cavalier_elfe",
        "cavalier_elfe",
        "cavalier_elfe",
        "archer_bois",
        "archer_bois",
        "archer_bois",
        "archer_bois",
        "rangers",
        "rangers",
        "rangers",
        "dryades_guerisseuses",
        "dryades_guerisseuses",
        "chamane_foret",
        "chamane_foret",
        "elem_terre",
        "elem_terre",
        "bourgeonnement",
        "bourgeonnement",
        "bourgeonnement",
        "floraison",
        "floraison",
        "volee_fleches",
        "volee_fleches",
        "brume_trompeuse"
      ],
      "ai": true,
      "start": {
        "avant": {
          "2": "eclaireur_elfe",
          "3": "eclaireur_elfe"
        }
      }
    },
    "defeatLassitude": {
      "A": NO_LIMIT,
      "B": NO_LIMIT
    },
    "noRegimentDefeatFromTurn": {
      "A": 999,
      "B": 999
    },
    "mustSurvive": {
      "A": "convoi"
    },
    "endTurnLassitude": {
      "B": 2
    },
    "convoy": {
      "cardId": "convoi",
      "pid": "A",
      "firstTurn": 3,
      "every": 2
    },
    "events": [
      {
        "turn": 6,
        "pid": "B",
        "dialog": [
          {
            "who": "",
            "text": "Embuscade ! La terre s'ouvre devant le convoi : des élémentaux surgissent du sol !"
          }
        ],
        "spawn": [
          {
            "cardId": "elem_terre",
            "zone": "avant",
            "idx": 2
          },
          {
            "cardId": "elem_terre",
            "zone": "avant",
            "idx": 3
          },
          {
            "cardId": "elem_feu",
            "zone": "avant",
            "idx": 1
          }
        ]
      }
    ],
    "reward": {
      "picks": {
        "count": 3,
        "unique": true,
        "title": "Récompense — Cartes de niveau 4",
        "text": "Choisis une carte de niveau 4 à ajouter à ton pool",
        "options": [
          "chevalier_templier",
          "etat_major",
          "cavaliers_dragons_elite",
          "ordre_haut_commandement",
          "assassinat",
          "espion_imperial"
        ]
      }
    },
    "victoryDialog": [
      {
        "who": "",
        "text": "Le convoi franchit le col sous les acclamations de Kragz."
      },
      {
        "who": "Soldat",
        "text": "Commandant, nous avons capturé un éclaireur elfe. Il parle d'un chef qui rassemble toute l'armée elfique : Sylvain, le Gardien Élémentaire."
      },
      {
        "who": "Commandant",
        "text": "Alors c'est lui, derrière tout cela. Il faudra l'affronter."
      }
    ]
  },
  "s4": {
    "id": "s4",
    "title": "Scénario 4 — Sylvain, le Gardien Élémentaire",
    "deckRules": {
      "min": 25,
      "text": "Minimum 25 cartes. Aucune limite maximale. Vos cartes de niveau 4 vous attendent : la partie sera longue."
    },
    "intro": [
      {
        "who": "",
        "text": "Les renseignements sont formels : Sylvain, le Gardien Élémentaire, mène lui-même l'armée elfique sur la plaine de Kragz."
      },
      {
        "who": "Commandant",
        "text": "C'est la bataille décisive. Détruisez Sylvain, ou brisez la volonté de son armée en l'épuisant."
      },
      {
        "who": "",
        "text": "Sylvain se tient derrière ses élémentaux, et il rappelle des renforts toutes les deux tours. Les elfes commencent au niveau 2."
      }
    ],
    "A": {
      "faction": "empire",
      "label": "Empire",
      "ai": false,
      "start": {
        "avant": {
          "0": "palissade_regiment",
          "3": "palissade_regiment"
        }
      }
    },
    "B": {
      "faction": "elfe",
      "label": "Royaumes Elfiques",
      "deckList": [
        "eclaireur_elfe",
        "eclaireur_elfe",
        "eclaireur_elfe",
        "archer_bois",
        "archer_bois",
        "archer_bois",
        "cavalier_elfe",
        "cavalier_elfe",
        "cavalier_elfe",
        "rangers",
        "rangers",
        "elem_terre",
        "elem_terre",
        "elem_terre",
        "elem_eau",
        "elem_eau",
        "elem_feu",
        "elem_feu",
        "elem_feu",
        "chamane_foret",
        "chamane_foret",
        "clerc_foret",
        "clerc_foret",
        "druide_ancien",
        "druide_ancien",
        "dryades_guerisseuses",
        "dryades_guerisseuses",
        "floraison",
        "floraison",
        "fructification",
        "eveil_elementaire",
        "eveil_elementaire",
        "eveil_elementaire",
        "volee_fleches",
        "brise_matin",
        "changement_tectonique",
        "changement_tectonique"
      ],
      "ai": true,
      "start": {
        "avant": {
          "1": "sylvain",
          "2": "elem_terre"
        }
      }
    },
    "defeatLassitude": {
      "A": 30,
      "B": 25
    },
    "mustSurvive": {
      "B": "sylvain"
    },
    "noRegimentDefeatFromTurn": {
      "A": 3,
      "B": 999
    },
    "moralCheckLassitude": 1,
    "startLevel": {
      "A": 2,
      "B": 2
    },
    "levelThresholds": {
      "A": [
        0,
        0,
        4,
        10,
        18
      ],
      "B": [
        0,
        0,
        4,
        10,
        16
      ]
    },
    "endTurnLassitude": {
      "B": 1
    },
    "events": [
      {
        "turn": 3,
        "pid": "B",
        "resource": 2,
        "spawn": [
          {
            "cardId": "elem_eau",
            "zone": "avant",
            "idx": 3
          }
        ]
      },
      {
        "turn": 5,
        "pid": "B",
        "resource": 2,
        "spawn": [
          {
            "cardId": "elem_feu",
            "zone": "avant",
            "idx": 0
          }
        ]
      },
      {
        "turn": 7,
        "pid": "B",
        "resource": 3,
        "dialog": [
          {
            "who": "Sylvain",
            "text": "Vous ne franchirez pas la plaine. La terre elle-même combat pour moi !"
          }
        ],
        "spawn": [
          {
            "cardId": "elem_terre",
            "zone": "avant",
            "idx": 2
          },
          {
            "cardId": "elem_eau",
            "zone": "avant",
            "idx": 3
          }
        ]
      },
      {
        "turn": 10,
        "pid": "B",
        "resource": 3,
        "spawn": [
          {
            "cardId": "elem_feu",
            "zone": "avant",
            "idx": 0
          },
          {
            "cardId": "elem_terre",
            "zone": "avant",
            "idx": 3
          }
        ]
      }
    ],
    "victoryDialog": [
      {
        "who": "",
        "text": "Sylvain s'effondre ; les élémentaux se dissolvent dans le sol. L'armée elfique bat en retraite."
      },
      {
        "who": "Commandant",
        "text": "La frontière est sauve. Mais combien de temps durera cette paix ?"
      }
    ]
  }
};

export const CAMPAIGN_ORDER = ['s1', 's2', 's3', 's4'];
