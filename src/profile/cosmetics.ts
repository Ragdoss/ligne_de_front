// Cosmétiques : emotes (répliques en ligne) et images de profil. Les deux se débloquent dans les paquets.

/** Toutes les emotes : identifiant → réplique. */
export const EMOTES: Record<string, string> = {
  salut: 'Salutations !', bravo: 'Bien joué !', merci: 'Merci !', oups: 'Oups…', reflexion: 'Laisse-moi réfléchir…',
  presque: 'C’était moins une !', desole: 'Désolé…', atoi: 'À toi de jouer.', impressionnant: 'Impressionnant.', revanche: 'Revanche ?',
  'empire.1': 'Pour l’Empire !', 'empire.2': 'Tenez la ligne !', 'empire.3': 'La discipline vaincra.',
  'elfe.1': 'La forêt se souvient.', 'elfe.2': 'Le vent est avec nous.', 'elfe.3': 'Que les racines vous retiennent !',
  'demons.1': 'Vos âmes sont à nous.', 'demons.2': 'Le sacrifice est un honneur.', 'demons.3': 'L’Abîme a faim.',
  'nomades.1': 'Le sable vous engloutira.', 'nomades.2': 'Vos réserves sont à moi.', 'nomades.3': 'Le désert ne pardonne pas.',
};
export const EMOTE_IDS = Object.keys(EMOTES);
/** Emotes données à tout nouveau profil. */
export const BASE_EMOTES = ['salut', 'bravo'];
/** Nombre d'emotes emportées en partie en ligne. */
export const MAX_LOADOUT = 6;

/** Images de profil : bustes des personnages (faction/numéro de la planche). 1 à 4 : série au crayon ; 5 à 8 : série enluminée (en couleurs). */
export const AVATARS: Record<string, string> = {
  'empire.1': 'Chevalier impérial', 'empire.2': 'Épéiste impérial', 'empire.3': 'Lancier impérial', 'empire.4': 'Arbalétrier impérial',
  'elfe.1': 'Archère elfe', 'elfe.2': 'Gardien sylvestre', 'elfe.3': 'Lame sylvestre', 'elfe.4': 'Éclaireuse elfe',
  'demons.1': 'Voyant de l’Abîme', 'demons.2': 'Acolyte', 'demons.3': 'Hiérophante', 'demons.4': 'Faucheur',
  'nomades.1': 'Guide du désert', 'nomades.2': 'Cheikha', 'nomades.3': 'Pillard des dunes', 'nomades.4': 'Archer des sables',
  'empire.5': 'Chevalier enluminé', 'empire.6': 'Épéiste enluminé', 'empire.7': 'Lancier enluminé', 'empire.8': 'Arbalétrier enluminé',
  'elfe.5': 'Archère enluminée', 'elfe.6': 'Gardien enluminé', 'elfe.7': 'Lame enluminée', 'elfe.8': 'Éclaireuse enluminée',
  'demons.5': 'Voyant enluminé', 'demons.6': 'Acolyte enluminé', 'demons.7': 'Hiérophante enluminé', 'demons.8': 'Faucheur enluminé',
  'nomades.5': 'Guide enluminé', 'nomades.6': 'Cheikha enluminée', 'nomades.7': 'Pillard enluminé', 'nomades.8': 'Archer enluminé',
};
export const AVATAR_IDS = Object.keys(AVATARS);
export const BASE_AVATAR = 'empire.2';

/** Paquets : 1 chance sur 5 qu'une carte soit remplacée par une emote, 1 sur 10 par une image de profil. */
export const EMOTE_CHANCE = 0.2;
export const AVATAR_CHANCE = 0.1;
