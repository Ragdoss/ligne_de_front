# Illustrations des cartes

Gabarit validé par Nathan le 17/10/2026 (première illustration : le Lieutenant).

## Format

- **Ratio 9:16 en portrait** pour toutes les cartes (référence : 941 × 1672 px). Le jeu affiche l'image entière.
- **Le haut** porte le sujet (personnage, créature, scène). Sur le plateau et dans la main, le jeu ne montre que **le haut de l'image, agrandi** : la tête et le buste doivent se trouver dans le premier tiers.
- **Les 40 % du bas** sont laissés libres : un fond clair et uni (brume, parchemin), sans détail important. Le cartouche (nom, rôle), l'effet et les stats viennent s'y poser, en texte foncé.
- Les coins supérieurs sont couverts par le coût (à gauche) et le niveau (à droite) : rien d'essentiel dans ces coins.
- Le style de référence : peinture texturée, palette désaturée, couleur de la faction en accent (rouge pour l'Empire).

## Fichiers

- Dossier : `src/ui/assets/cards/`.
- **Nom du fichier = identifiant de la carte** (celui de `src/data/cards.ts`, `wave1.ts`, `wave2.ts`), par exemple `lieutenant.webp`, `gardes_drapeau.webp`.
- Format : `.webp` de préférence (`.png` et `.jpg` acceptés), environ **600 px de large** et moins de 100 Ko : le jeu est livré en un seul fichier HTML.
- Il suffit de déposer le fichier : il est repris automatiquement partout (collection, draft, récompenses, plateau, main, agrandissement au survol). Les cartes sans illustration gardent la couleur de leur faction et leur initiale.

## Arts alternatifs

- Même format que l'art de base, nommé **`<id de carte>.altN.webp`** dans le même dossier : `lieutenant.alt1.webp`, `lieutenant.alt2.webp`…
- Ils sont repris automatiquement : chaque paquet a 1 chance sur 8 de contenir un art alternatif, **seulement d'une carte déjà possédée** (au moins un exemplaire). Le joueur choisit l'art sous la carte, dans Ma collection → Mes cartes (« Base », « Alt 1 »…).
- En partie, chaque joueur voit ses cartes avec ses arts et celles de l'adversaire avec les arts de l'adversaire (envoyés en ligne au début de la partie ; l'ordinateur joue avec les arts de base).
- L'option « Afficher toutes les cartes… » rend tous les arts alternatifs sélectionnables, pour les vérifier sans les débloquer.
- Un art alternatif peut exister sans art de base.

## Où le gabarit est codé

- `src/ui/CardFace.tsx` : carte complète, fond (illustration ou couleur de faction), niveau en chiffres romains ou arabes (Options).
- `src/ui/Board.tsx` (régiments en jeu) et `src/ui/Hand.tsx` (main).
- `src/ui/styles.css`, bloc « Gabarit des cartes ».

## Publication

- Depuis le 18/10/2026, le jeu publié (GitHub Pages et artifact) est construit par `npm run build:web` : `dist-web/index.html` (code et styles intégrés) et les images dans `dist-web/img/`. Les illustrations ne sont chargées qu'à l'affichage, et la page reste petite quel que soit le nombre d'images (la version en un seul fichier dépassait les 16 Mo d'un artifact).
- `npm run build` produit toujours la version en un seul fichier (`dist/index.html`), pour jouer hors ligne.
- Artifact : publier `dist-web/index.html` avec tous les fichiers de `dist-web/img/` (racine `dist-web`).
