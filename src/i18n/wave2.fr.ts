// Textes de la vague 2 Elfes (les stats, mots-clés et bonus de Leader sont affichés à part).
export const WAVE2_TEXT_FR: Record<string, { name: string; desc: string }> = {
  sentinelle_cimes: { name: 'Sentinelle des cimes', desc: '+10 ATK contre un régiment au Moral brisé.' },
  traqueuse_sylvestre: { name: 'Traqueuse sylvestre', desc: 'Vise le régiment adverse à l’Endurance la plus basse (au lieu du Moral le plus bas).' },
  marque_chasseur: { name: 'Marque du chasseur', desc: 'Ce tour-ci, tes régiments à Distance attaquent le régiment ciblé, avec +10 ATK, et ignorent 10 ARM contre lui.' },
  chant_traque: { name: 'Chant de la traque', desc: 'Tes régiments à Distance frappent tout de suite, hors combat, leur cible habituelle.' },
  seigneure_chasse: { name: 'Seigneure de la chasse', desc: 'Chaque fois qu’un régiment adverse au Moral brisé est détruit, l’adversaire gagne 2 lassitude.' },
  visez_faibles: { name: 'Visez les faibles', desc: 'Ce tour-ci, tes régiments avant sans Distance attaquent le régiment arrière adverse ciblé, comme s’il était en face d’eux.' },
  gardienne_seuil: { name: 'Gardienne du seuil', desc: 'À chaque combat, avant les attaques, ses voisins de la ligne avant regagnent 5 END et 1 Moral.' },
  racines_protectrices: { name: 'Racines protectrices', desc: 'Jusqu’à ton prochain tour, le régiment ciblé ne peut pas descendre sous 1 END ni sous 1 Moral (un sacrifice reste possible).' },
  benediction_sylve: { name: 'Bénédiction de la sylve', desc: 'La première fois que le porteur devrait être détruit, il reste à 1 END et 1 Moral (au moins), et ce Leader part en défausse.' },
  racines_immobilisantes: { name: 'Racines immobilisantes', desc: 'Tant que tu contrôles un régiment Élémentaux, le régiment ciblé ne peut pas attaquer.' },
  eclaireuse_fourres: { name: 'Éclaireuse des fourrés', desc: '' },
  maitre_embuscades: { name: 'Maître des embuscades', desc: 'Quand le porteur attaque, il gagne autant d’ATK que son avance d’INI sur sa cible.' },
};
