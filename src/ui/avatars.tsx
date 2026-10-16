// Images des avatars (bustes des personnages).
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

const IMG: Record<string, string> = {
  'empire.1': e1, 'empire.2': e2, 'empire.3': e3, 'empire.4': e4,
  'elfe.1': l1, 'elfe.2': l2, 'elfe.3': l3, 'elfe.4': l4,
  'demons.1': d1, 'demons.2': d2, 'demons.3': d3, 'demons.4': d4,
  'nomades.1': n1, 'nomades.2': n2, 'nomades.3': n3, 'nomades.4': n4,
};
export const avatarImg = (id: string | undefined) => (id ? IMG[id] : undefined) ?? e2;

/** Médaillon rond : le haut du buste. */
export function Avatar({ id, size = 40, title }: { id?: string; size?: number; title?: string }) {
  return <img className="avatar" src={avatarImg(id)} alt={title ?? ''} title={title} style={{ width: size, height: size }} />;
}
