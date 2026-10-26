// Carte survolée affichée en grand, hors partie (créateur de deck, draft, collection) : un petit magasin global
// que les tuiles et les lignes de deck alimentent au survol. En partie, GameScreen a son propre agrandissement.
import { useSyncExternalStore } from 'react';
import { ZoomCard } from './ZoomCard';

let current: { id: string; left: boolean; variant?: string } | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());

export function showZoom(id: string | null, x?: number, variant?: string): void {
  const next = id ? { id, left: x !== undefined && x > window.innerWidth / 2, variant } : null;
  if (next?.id === current?.id && next?.left === current?.left && next?.variant === current?.variant) return;
  current = next;
  emit();
}

/** Props à étaler sur un élément pour qu'il affiche la carte en grand au survol. */
export const zoomProps = (id: string, variant?: string) => ({
  onMouseEnter: (e: React.MouseEvent) => showZoom(id, e.clientX, variant),
  onMouseLeave: () => showZoom(null),
});

export function HoverZoom() {
  const z = useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f); }; }, () => current);
  return z ? <ZoomCard id={z.id} left={z.left} variant={z.variant} /> : null;
}
