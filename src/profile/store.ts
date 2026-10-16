// Plusieurs profils dans le même navigateur : chaque profil a ses propres sauvegardes (collection, decks, campagnes…).
// Le premier profil (« main ») garde les clés historiques ; les suivants sont préfixés par leur identifiant.

export interface ProfileEntry { id: string; name: string }
interface Index { active: string; list: ProfileEntry[] }

const INDEX_KEY = 'ligneDeFront.jeu.profils.v1';
const MAIN = 'main';
const PREFIX = 'ligneDeFront.jeu.';

function readIndex(): Index {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (raw) {
      const i = JSON.parse(raw) as Index;
      if (Array.isArray(i.list) && i.list.length && typeof i.active === 'string') return i;
    }
  } catch { /* stockage indisponible */ }
  return { active: MAIN, list: [{ id: MAIN, name: 'Joueur' }] };
}
function writeIndex(i: Index): void {
  try { localStorage.setItem(INDEX_KEY, JSON.stringify(i)); } catch { /* stockage indisponible */ }
}

export const listProfiles = (): ProfileEntry[] => readIndex().list;
export const activeProfileId = (): string => readIndex().active;

/** Clé de stockage pour le profil actif. `legacy` : clé historique complète (ex. 'ligneDeFront.jeu.profil.v1'). */
export function keyFor(legacy: string): string {
  const id = activeProfileId();
  return id === MAIN ? legacy : legacy.replace(PREFIX, `${PREFIX}${id}.`);
}

export function setActiveProfile(id: string): void {
  const i = readIndex();
  if (i.list.some(p => p.id === id)) writeIndex({ ...i, active: id });
}
export function createProfileEntry(name: string): string {
  const i = readIndex();
  const id = `x_${Date.now().toString(36)}`;
  writeIndex({ active: id, list: [...i.list, { id, name }] });
  return id;
}
export function renameProfileEntry(id: string, name: string): void {
  const i = readIndex();
  writeIndex({ ...i, list: i.list.map(p => (p.id === id ? { ...p, name } : p)) });
}
/** Supprime un profil (jamais le profil actif) et toutes ses sauvegardes. */
export function deleteProfileEntry(id: string): void {
  const i = readIndex();
  if (id === i.active || i.list.length <= 1) return;
  try {
    for (const k of Object.keys(localStorage)) {
      const mine = id === MAIN ? k.startsWith(PREFIX) && !k.startsWith(`${PREFIX}x_`) && k !== INDEX_KEY : k.startsWith(`${PREFIX}${id}.`);
      if (mine) localStorage.removeItem(k);
    }
  } catch { /* stockage indisponible */ }
  writeIndex({ ...i, list: i.list.filter(p => p.id !== id) });
}
/** Efface les sauvegardes du profil actif (réinitialisation). */
export function clearActiveProfileData(): void {
  const id = activeProfileId();
  try {
    for (const k of Object.keys(localStorage)) {
      if (k === INDEX_KEY) continue;
      const mine = id === MAIN ? k.startsWith(PREFIX) && !k.startsWith(`${PREFIX}x_`) : k.startsWith(`${PREFIX}${id}.`);
      if (mine) localStorage.removeItem(k);
    }
  } catch { /* stockage indisponible */ }
}
