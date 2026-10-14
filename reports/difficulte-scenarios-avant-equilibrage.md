# Difficulté des scénarios de campagne

Modifications testées (`balance/avant-equilibrage.json`) :

- cadets_academie.cout : 4 → 3
- cadets_academie.atk : 7 → 10
- cadets_academie.end : 36 → 40
- lancier_emp.atk : 12 → 15
- lancier_emp.arm : 4 → 5
- lancier_emp.bonusVsMounted : 15 → 10
- soldat_kragz.atk : 9 → 10
- soldat_kragz.arm : 4 → 5
- chevalier_prov.atk : 14 → 15
- chevalier_prov.arm : 13 → 15
- arbaletrier_imp.keywords : ["Lent","Pénétration 5"] → ["Lent"]
- serenite_foret.cout : 1 → 2
- serenite_foret.doubledWithElemental : true → false
- clerc_foret.cout : 2 → 3
- saboteur_nomade.atk : 1 → 0
- saboteur_nomade.end : 21 → 20
- frondeur_nomade.cout : 1 → 2
- archeotacticiens.cout : 4 → 3
- fanatiques.cout : 3 → 4

200 parties par scénario. L'Empire est joué par l'ordinateur avec tout son pool de campagne ; l'ordinateur joue moins bien qu'un humain : ces taux sont une borne basse.

| Scénario | Pool (cartes) | Réussite | Tours (moy.) | Défaites les plus fréquentes |
|---|---|---|---|---|
| Scénario 1 — Attaque à la frontière | 20 | **6 %** | 5.1 | lassitude (94 %), plus de régiment (1 %) |
| Scénario 2 — Le siège de Kragz | 23 | **10 %** | 3.8 | régiment vital détruit (88 %), lassitude (3 %) |
| Scénario 3 — Le convoi du col des Brumes | 28 | **11 %** | 6.9 | régiment vital détruit (89 %) |
| Scénario 4 — Sylvain, le Gardien Élémentaire | 31 | **27 %** | 8.2 | lassitude (69 %), plus de régiment (5 %) |

## Pools utilisés

- **Scénario 1 — Attaque à la frontière** : 12× Recrue Impériale, 3× Archer Impérial, 3× Lieutenant, 2× Palissade
- **Scénario 2 — Le siège de Kragz** : 10× Recrue Impériale, 3× Archer Impérial, 3× Lieutenant, 2× Palissade, 2× Lancier de l'Empire, 2× Chevalier de Province, 1× Arbalétrier Impérial
- **Scénario 3 — Le convoi du col des Brumes** : 9× Recrue Impériale, 3× Archer Impérial, 3× Lieutenant, 2× Palissade, 2× Lancier de l'Empire, 2× Chevalier de Province, 1× Arbalétrier Impérial, 1× Capitaine de la Garde, 2× Soldat de Kragz, 1× Porte-Étendard, 1× Ralliement, 1× Charge Impériale
- **Scénario 4 — Sylvain, le Gardien Élémentaire** : 9× Recrue Impériale, 3× Archer Impérial, 3× Lieutenant, 2× Palissade, 2× Lancier de l'Empire, 2× Chevalier de Province, 1× Arbalétrier Impérial, 1× Capitaine de la Garde, 2× Soldat de Kragz, 1× Porte-Étendard, 1× Ralliement, 1× Charge Impériale, 1× Chevalier Templier, 1× État Major, 1× Cavaliers Dragons Élite
