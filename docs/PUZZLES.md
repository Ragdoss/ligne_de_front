# Puzzles

Une situation figée, un objectif, **un seul tour** pour l'atteindre ; l'adversaire ne joue pas.

- Les puzzles : `src/puzzles/puzzles.ts` (liste `PUZZLES`, dans l'ordre d'affichage).
- Le format : `src/puzzles/types.ts`.
- Construction de la partie et suivi de l'objectif : `src/puzzles/build.ts` ; solveur : `src/puzzles/solve.ts` ;
  écran : `src/ui/Puzzles.tsx`.

## Écrire un puzzle

```ts
{
  id: 'marque',                       // identifiant unique (sert à retenir les puzzles réussis)
  title: 'La marque du chasseur',
  difficulty: 1,                      // 1 facile, 2 moyen, 3 difficile (étoiles)
  intro: 'Texte de présentation…',
  goal: { type: 'destroy', slot: 'avant.3' },   // ou { type: 'win' }
  A: {                                // toi
    faction: 'elfe', level: 2, resource: 1,
    hand: ['marque_chasseur', 'volee_fleches', 'brise_matin'],
    arriere: [null, 'archer_bois', 'eclaireuse_fourres'],
  },
  B: {                                // l'adversaire
    faction: 'empire', level: 3,
    avant: [{ card: 'mercenaires', mor: 3 }, null, { card: 'chevalier_prov', end: 45 }, null],
  },
}
```

- **Objectifs** : `{ type: 'win' }` (faire perdre l'adversaire avant la fin de ton tour : en général, il est proche de
  sa limite de lassitude) ou `{ type: 'destroy', slot: 'avant.3' }` (détruire le régiment adverse posé à cet
  emplacement, **numéroté à partir de 1 comme à l'écran**, de gauche à droite : `avant.1` à `avant.4`, `arriere.1` à
  `arriere.3`, `isole.1`). Exemple : avec `avant: [{ card: 'treant_millenaire' }, 'elem_terre', null, null]`, le Tréant
  est en `avant.1` et l'Élémentaire en `avant.2`. Le combat de fin de ton tour compte.
- **Un camp** : `faction`, `level` (1 à 5, débloque les cartes jouables), `resource` (ressource disponible ce tour ;
  par défaut le niveau), `lassitude` (actuelle), `limit` (limite de défaite, 50 par défaut), `hand` (cartes en main),
  `avant` (4 cases), `arriere` (3 cases), `isole`, `deck` (pioche, du dessus vers le dessous ; par défaut des Recrues
  sans importance).
- **Une case** : `null` (vide), un identifiant de carte (`'archer_bois'`), ou les détails :
  `{ card: 'chevalier_prov', end: 45, mor: 6, leader: 'lieutenant', fresh: true }` — END et Moral actuels (par défaut
  au maximum ; impossible de dépasser le maximum de la carte), Leader déjà attaché, `fresh` : posé ce tour (frappe à
  moitié de son ATK). Par défaut, les régiments sont prêts.
- Les identifiants de cartes sont ceux de `src/data/` (ex. `recrue_imp`, `marque_chasseur`) ; la liste des noms est dans
  `src/i18n/*.fr.ts`.

## Vérification

`npm test` vérifie chaque puzzle avec le solveur : il doit avoir au moins une solution, et finir le tour sans rien faire
doit échouer. Pour voir toutes les solutions d'un puzzle (utile pour régler la difficulté : s'il y en a trop, le
puzzle est trop facile) :

```
npx tsx tools/puzzle-check.ts            # tous les puzzles
npx tsx tools/puzzle-check.ts marque     # un seul
```

En jeu, le bouton **Indice** utilise le même solveur : il donne le premier coup d'une solution depuis la position
actuelle (ou dit de recommencer si elle n'est plus gagnable).
