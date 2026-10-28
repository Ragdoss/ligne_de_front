// Textes des cartes refondues autour de la Proie (28/10/2026). Ils remplacent ceux des autres fichiers pour ces cartes ;
// à la fusion de la relecture des textes (branche « Mise-à-jour-Leader-vers-Meneur »), les harmoniser ici.

const T = (id: string, desc: string, name?: string) => [id, { desc, ...(name ? { name } : {}) }] as const;

/** Texte d'effet (et nom, pour les nouvelles cartes) des cartes de la Proie. */
export const PROIE_TEXT_FR: Record<string, { name?: string; desc: string }> = Object.fromEntries([
  T('eclaireur_elfe', 'À son arrivée et après un déplacement, le régiment adverse en face de lui devient la Proie.'),
  T('eclaireuse_fourres', 'À son arrivée et après un déplacement, le régiment adverse au Moral le plus bas devient la Proie. Toutes tes attaques contre la Proie gagnent +5 ATK.'),
  T('marque_chasseur', 'Le régiment ciblé devient la Proie. Ce tour-ci, tes régiments à Distance l’attaquent, avec +10 ATK, et ignorent 10 ARM contre lui.'),
  T('rangers', 'Sa cible est Sonnée et devient la Proie.'),
  T('chant_vent', 'Quand le porteur attaque, sa cible devient la Proie.'),
  T('visez_faibles', 'Ce tour-ci, tes régiments avant sans Distance attaquent le régiment ciblé : un régiment arrière adverse, ou la Proie où qu’elle soit.'),
  T('racines_immobilisantes', 'Tant que tu contrôles un régiment Élémentaux, le régiment ciblé ne peut pas attaquer. Coûte 0 contre la Proie.'),
  T('changement_tectonique', 'Déplace un régiment adverse (avant/arrière) vers un emplacement vide de son camp. Coûte 2 de moins si tu contrôles un Élémentaux ; 0 contre la Proie.'),
  T('brume_trompeuse', 'Un régiment adverse perd 20 INI pour ce combat, ainsi qu’un régiment adverse supplémentaire au hasard par régiment Élémentaux que tu contrôles. Si c’est la Proie, elle perd aussi 2 Moral.'),
  T('repositionnement', 'Échange la position d’un Elfe allié avec un autre emplacement ; +20 INI ce tour-ci aux deux. L’Elfe déplacé gagne +10 ATK ce tour-ci s’il se retrouve en face de la Proie.'),
  T('archer_bois', '+10 ATK contre la Proie.'),
  T('volee_fleches', 'Tous tes régiments Archer gagnent +10 ATK ce tour-ci, +20 contre la Proie. Ajoute à ta main une Volée de Flèches qui coûte 1 de plus ; elle disparaît à la fin du tour.'),
  T('sentinelle_cimes', '+10 ATK contre un régiment au Moral brisé ou contre la Proie.'),
  T('traqueuse_sylvestre', 'Vise la Proie en priorité, sinon le régiment adverse à l’Endurance la plus basse (au lieu du Moral le plus bas).'),
  T('cavalier_elfe', 'Si la Proie est dans la rangée avant adverse, il l’attaque au lieu du régiment en face.'),
  T('chant_traque', 'Tes régiments à Distance frappent tout de suite, hors combat : la Proie s’il y en a une, sinon leur cible habituelle.'),
  T('lyra', 'Chaque fois que tu joues une Tactique, elle inflige 10 dégâts à la Proie, ou à défaut au régiment adverse à l’Endurance la plus basse.'),
  T('seigneure_chasse', 'Chaque fois qu’un régiment adverse au Moral brisé ou la Proie est détruit, l’adversaire gagne 2 lassitude. Quand la Proie est détruite, le régiment adverse qui a le plus d’Endurance devient la nouvelle Proie.'),
  T('druide_ancien', 'Quand le porteur détruit la Proie, il regagne 20 END et 2 Moral.'),
  T('hallali', 'Si une Proie a été détruite depuis le début de ton tour précédent : pioche 2 cartes et gagne 1 ressource. Puis le régiment adverse au Moral le plus bas devient la Proie.', 'Hallali'),
]);
