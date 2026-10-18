// Images des avatars (bustes des personnages) : série au crayon (1 à 4) et série enluminée (5 à 8).
import e1 from './assets/portraits/empire/1.webp';
import e2 from './assets/portraits/empire/2.webp';
import e3 from './assets/portraits/empire/3.webp';
import e4 from './assets/portraits/empire/4.webp';
import l1 from './assets/portraits/elfe/1.webp';
import l2 from './assets/portraits/elfe/2.webp';
import l3 from './assets/portraits/elfe/3.webp';
import l4 from './assets/portraits/elfe/4.webp';
import d1 from './assets/portraits/demons/1.webp';
import d2 from './assets/portraits/demons/2.webp';
import d3 from './assets/portraits/demons/3.webp';
import d4 from './assets/portraits/demons/4.webp';
import n1 from './assets/portraits/nomades/1.webp';
import n2 from './assets/portraits/nomades/2.webp';
import n3 from './assets/portraits/nomades/3.webp';
import n4 from './assets/portraits/nomades/4.webp';
import e5 from './assets/portraits/empire/5.webp';
import e6 from './assets/portraits/empire/6.webp';
import e7 from './assets/portraits/empire/7.webp';
import e8 from './assets/portraits/empire/8.webp';
import l5 from './assets/portraits/elfe/5.webp';
import l6 from './assets/portraits/elfe/6.webp';
import l7 from './assets/portraits/elfe/7.webp';
import l8 from './assets/portraits/elfe/8.webp';
import d5 from './assets/portraits/demons/5.webp';
import d6 from './assets/portraits/demons/6.webp';
import d7 from './assets/portraits/demons/7.webp';
import d8 from './assets/portraits/demons/8.webp';
import n5 from './assets/portraits/nomades/5.webp';
import n6 from './assets/portraits/nomades/6.webp';
import n7 from './assets/portraits/nomades/7.webp';
import n8 from './assets/portraits/nomades/8.webp';
import m1 from './assets/portraits/mercenaires/1.webp';
import s1 from './assets/portraits/sergents/1.webp';
import c1 from './assets/portraits/clerc/1.webp';
import sp1 from './assets/portraits/sorciere/1.webp';
import o1 from './assets/portraits/oeuf/1.webp';
import g5 from './assets/portraits/gardienne/5.webp';
import g6 from './assets/portraits/gardienne/6.webp';

const IMG: Record<string, string> = {
  'empire.1': e1, 'empire.2': e2, 'empire.3': e3, 'empire.4': e4,
  'elfe.1': l1, 'elfe.2': l2, 'elfe.3': l3, 'elfe.4': l4,
  'demons.1': d1, 'demons.2': d2, 'demons.3': d3, 'demons.4': d4,
  'nomades.1': n1, 'nomades.2': n2, 'nomades.3': n3, 'nomades.4': n4,
  'empire.5': e5, 'empire.6': e6, 'empire.7': e7, 'empire.8': e8,
  'elfe.5': l5, 'elfe.6': l6, 'elfe.7': l7, 'elfe.8': l8,
  'demons.5': d5, 'demons.6': d6, 'demons.7': d7, 'demons.8': d8,
  'nomades.5': n5, 'nomades.6': n6, 'nomades.7': n7, 'nomades.8': n8,
  'mercenaires.1': m1,
  'sergents.1': s1,
  'clerc.1': c1,
  'sorciere.1': sp1,
  'oeuf.1': o1,
  'gardienne.5': g5,
  'gardienne.6': g6,
};
export const avatarImg = (id: string | undefined) => (id ? IMG[id] : undefined) ?? e2;

/** Médaillon rond : le haut du buste. */
export function Avatar({ id, size = 40, title }: { id?: string; size?: number; title?: string }) {
  return <img className="avatar" src={avatarImg(id)} alt={title ?? ''} title={title} style={{ width: size, height: size }} />;
}
