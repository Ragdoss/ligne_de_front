// Carte affichée en grand au survol ; laissée 2 secondes, elle s'accompagne du glossaire de ses mots-clés.
import { useEffect, useState } from 'react';
import { glossaryFor } from '../i18n/keywords.fr';
import { CardFace } from './CardFace';

export const GLOSSARY_DELAY = 2000;

export function ZoomCard({ id, left, variant }: { id: string; left: boolean; variant?: string }) {
  const [gloss, setGloss] = useState(false);
  useEffect(() => {
    setGloss(false);
    const t = setTimeout(() => setGloss(true), GLOSSARY_DELAY);
    return () => clearTimeout(t);
  }, [id]);
  const entries = gloss ? glossaryFor(id) : [];
  return (
    <div className={`zoom${left ? ' left' : ''}`} aria-hidden="true">
      <CardFace id={id} variant={variant} />
      {entries.length > 0 && (
        <dl className="zoom-gloss">
          {entries.map(e => <div key={e.term}><dt>{e.term}</dt><dd>{e.text}</dd></div>)}
        </dl>
      )}
    </div>
  );
}
