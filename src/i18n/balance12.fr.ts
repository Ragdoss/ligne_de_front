// Textes des cartes Empire retouchées à l'équilibrage 12 (30/10/2026). Ils remplacent ceux des autres fichiers ;
// à la fusion de la relecture des textes (branche « Mise-à-jour-Leader-vers-Meneur »), les harmoniser ici.

export const BALANCE12_TEXT_FR: Record<string, { desc: string }> = {
  capitaine_garde: { desc: 'Le porteur ne peut pas être ciblé par les Tactiques adverses.' },
  lanciers_rempart: { desc: '+10 ARM tant qu’il a deux voisins sur sa ligne. Les régiments adverses à Distance doivent l’attaquer.' },
  formation_carre: { desc: 'Jusqu’à ton prochain tour, tous tes régiments porteurs d’un Leader gagnent +20 ARM, et chacun de tes régiments ciblé par une Tactique adverse gagne +10 ARM avant qu’elle ne se résolve.' },
  charge_imp: { desc: 'Le régiment Empire ciblé ignore l’Armure adverse ce tour-ci. Si c’est un Lancier, il gagne aussi +10 ATK.' },
};
