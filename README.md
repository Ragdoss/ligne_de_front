# Ligne de Front

Jeu de cartes de régiments (Empire, Royaumes Elfiques, Invocateurs de Démons, Nomades).

Ce dépôt contient le **vrai jeu**, construit à partir des règles validées dans le simulateur prototype
(`docs/simulateur_prototype.html`) et décrites dans le document de conception (`docs/GDD.md`).

## Organisation

```
src/
  engine/        Moteur de règles : pur, sans interface, entièrement testé
    types.ts     État de partie, actions, événements
    game.ts      API : createGame, applyAction, legalActions
    ctx.ts       Règles partagées (unités, Moral, soins, lassitude, destructions, pioche)
    combat.ts    Combat de fin de tour, ciblage, comparaison de Moral
    turn.ts      Fin et début de tour (ressources, effets récurrents, pioche)
    play.ts      Jouer une carte (coût, cibles, effets des tactiques, choix en attente)
    rng.ts       Hasard reproductible (graine)
  data/          Données : cartes, decks
  i18n/          Textes français (noms des cartes, journal de partie)
tests/           Tests automatiques (une règle = un test, plus des parties aléatoires complètes)
tools/           Outils (extraction du catalogue depuis le prototype)
docs/            GDD et prototype historique
```

## Principes

- **L'état de partie est un objet JSON pur.** On peut le copier, le sauvegarder, le rejouer, l'envoyer en réseau.
- **Le moteur ne fait que des transitions** : `applyAction(état, action) → { état, événements }`.
  Les événements (attaque, destruction, lassitude…) alimentent le journal, les animations et l'IA.
- **Hasard à graine** : même graine + mêmes actions = même partie (rapports de bug, tests, multijoueur).
- **Les cartes sont des données.** Une capacité spéciale = un champ de la carte, implémenté une fois dans le moteur.

## Commandes

```bash
npm install
npm test          # tests
npm run typecheck # vérification des types
npm run check     # les deux
```

## Avancement

Voir `docs/AVANCEMENT.md`.
