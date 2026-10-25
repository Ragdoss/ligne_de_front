// Mise en évidence d'éléments de l'écran (tutoriel) : un cadre sur chaque élément ; s'il y en a plusieurs, ils sont
// présentés l'un après l'autre (cadre lumineux et étiquette avec une flèche), les autres restent encadrés discrètement.
// Un élément hors de l'écran a son étiquette collée au bord, flèche vers lui.
import { useEffect, useState } from 'react';

export interface Spot { sel: string; label?: string; /** Nombre d'éléments mis en évidence au plus (6 par défaut). */ max?: number }
interface Box { x: number; y: number; w: number; h: number; spot: number; first: boolean }

const PAD = 4;
const CYCLE_MS = 2600;
export function Spotlight({ spots }: { spots: Spot[] }) {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [vh, setVh] = useState(() => window.innerHeight); // bas utile de l'écran
  const [active, setActive] = useState(0);
  // Au changement d'étape : on fait défiler l'écran jusqu'au premier élément s'il n'est pas visible.
  useEffect(() => {
    const el = spots.map(s => document.querySelector(s.sel)).find(Boolean);
    if (!el) return;
    const r = el.getBoundingClientRect(), bar = document.querySelector('.pbar-bottom')?.getBoundingClientRect();
    const bottom = bar ? bar.top : window.innerHeight;
    if (r.top < 60 || r.bottom > bottom) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [spots]);
  useEffect(() => {
    setActive(0);
    if (spots.length < 2) return;
    const t = setInterval(() => setActive(a => (a + 1) % spots.length), CYCLE_MS);
    return () => clearInterval(t);
  }, [spots]);
  useEffect(() => {
    let raf = 0, last = '';
    const tick = () => {
      const out: Box[] = [];
      spots.forEach((s, k) => {
        const els = [...document.querySelectorAll(s.sel)].slice(0, s.max ?? 6);
        els.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          if (r.width && r.height) out.push({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), spot: k, first: i === 0 });
        });
      });
      // Bas utile de l'écran : au-dessus de la barre du joueur (flottante).
      const limit = Math.round(document.querySelector('.pbar-bottom')?.getBoundingClientRect().top ?? window.innerHeight);
      const key = JSON.stringify(out) + limit;
      if (key !== last) { last = key; setBoxes(out); setVh(Math.min(window.innerHeight, limit)); }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [spots]);
  return (
    <div className="spots" aria-hidden="true">
      {boxes.map((b, i) => {
        const on = b.spot === active;
        const above = b.y + b.h < 0, below = b.y > vh - 20;
        const label = on && b.first ? spots[b.spot]!.label : undefined;
        return (
          <div key={i}>
            {!above && !below && <div className={`spot-box${on ? ' on' : ''}`} style={{ left: b.x - PAD, top: b.y - PAD, width: b.w + 2 * PAD, height: b.h + 2 * PAD }} />}
            {label && (
              <div className={`spot-tag${above ? ' edge-top' : below ? ' edge-bottom' : b.y < 40 ? ' under' : ''}`}
                style={{ left: b.x + b.w / 2, top: above ? 8 : below ? vh - 8 : b.y < 40 ? b.y + b.h + PAD : b.y - PAD }}>
                {above ? '▲ ' : ''}{label}{below ? ' ▼' : ''}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
