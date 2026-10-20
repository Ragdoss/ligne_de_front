// Ma collection : toutes les cartes (possédées ou non), ouverture de paquets.
import { useState } from 'react';
import { CARDS } from '../data/cards';
import { COLLECTIBLE, MAX_COPIES, openPack, PACK_PRICE, PACK_SIZE, type PackResult, type Profile } from '../profile/profile';
import { AVATARS, EMOTES } from '../profile/cosmetics';
import { Avatar } from './avatars';
import { ALT_ART_KEYS, altArtCard, altArtNumber, altArtsOf, CardFace } from './CardFace';
import { CardTile } from './CardTile';
import { cardName, FACTION_LABEL, TYPE_LABEL } from './labels';

export interface Filters { faction: string; type: string; level: string; text: string; owned: 'all' | 'owned' | 'missing' }
export const NO_FILTER: Filters = { faction: 'all', type: 'all', level: 'all', text: '', owned: 'all' };
const ORDER: Record<string, number> = { Regiment: 0, Leader: 1, Tactique: 2 };
const FACTIONS = ['empire', 'elfe', 'demons', 'nomades', 'neutre'] as const;

export function filterCards(f: Filters, have: (id: string) => number): string[] {
  const t = f.text.trim().toLowerCase();
  return COLLECTIBLE.filter(id => {
    const c = CARDS[id]!;
    if (f.faction !== 'all' && c.faction !== f.faction) return false;
    if (f.type !== 'all' && c.cardType !== f.type) return false;
    if (f.level !== 'all' && String(c.niveau) !== f.level) return false;
    if (f.owned === 'owned' && !have(id)) return false;
    if (f.owned === 'missing' && have(id) >= MAX_COPIES) return false;
    if (t && !cardName(id).toLowerCase().includes(t)) return false;
    return true;
  }).sort((a, b) => FACTIONS.indexOf(CARDS[a]!.faction as typeof FACTIONS[number]) - FACTIONS.indexOf(CARDS[b]!.faction as typeof FACTIONS[number])
    || ORDER[CARDS[a]!.cardType]! - ORDER[CARDS[b]!.cardType]! || CARDS[a]!.niveau - CARDS[b]!.niveau || cardName(a).localeCompare(cardName(b)));
}

export function FilterBar({ f, set, ownedLabels }: { f: Filters; set: (f: Filters) => void; ownedLabels?: boolean }) {
  const chip = (key: keyof Filters, value: string, label: string) => (
    <button key={`${key}${value}`} type="button" className={f[key] === value ? 'on' : ''} onClick={() => set({ ...f, [key]: value })}>{label}</button>
  );
  return (
    <div className="filters">
      <div className="hand-sort">{chip('faction', 'all', 'Toutes factions')}{FACTIONS.map(x => chip('faction', x, FACTION_LABEL[x]))}</div>
      <div className="hand-sort">{chip('type', 'all', 'Tous types')}{(['Regiment', 'Leader', 'Tactique'] as const).map(x => chip('type', x, `${TYPE_LABEL[x]}s`))}</div>
      <div className="hand-sort">{chip('level', 'all', 'Tous niveaux')}{['1', '2', '3', '4', '5'].map(x => chip('level', x, `Niv. ${x}`))}</div>
      {ownedLabels !== false && <div className="hand-sort">{chip('owned', 'all', 'Toutes')}{chip('owned', 'owned', 'Possédées')}{chip('owned', 'missing', 'À compléter')}</div>}
      <input className="search" type="search" placeholder="Rechercher une carte…" value={f.text} onChange={e => set({ ...f, text: e.target.value })} aria-label="Rechercher une carte" />
    </div>
  );
}

function PackReveal({ result, onClose }: { result: PackResult; onClose: () => void }) {
  const [shown, setShown] = useState(0);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Ouverture d'un paquet">
      <div className="box wide">
        <h2>Nouveau paquet</h2>
        <div className="pack">
          {result.cards.map((c, i) => (
            <button key={i} type="button" className={`pack-slot${i < shown ? ' open' : ''}`} onClick={() => setShown(Math.max(shown, i + 1))} aria-label={i < shown ? (c.kind === 'emote' ? `Emote : ${EMOTES[c.id]}` : c.kind === 'avatar' ? `Image de profil : ${AVATARS[c.id]}` : c.kind === 'alt' ? `Art alternatif : ${cardName(altArtCard(c.id))}` : cardName(c.id)) : 'Retourner la carte'}>
              {i < shown ? (
                <>
                  {c.kind === 'emote' ? (
                    <div className="cosmo emote"><span className="cosmo-type">Emote</span><p>« {EMOTES[c.id]} »</p></div>
                  ) : c.kind === 'avatar' ? (
                    <div className="cosmo avatar-card"><span className="cosmo-type">Image de profil</span><Avatar id={c.id} size={110} /><p>{AVATARS[c.id]}</p></div>
                  ) : c.kind === 'alt' ? (
                    <div className="ccard in alt-reveal"><CardFace id={altArtCard(c.id)} variant={c.id} /><span className="alt-ribbon">Art alternatif</span></div>
                  ) : <CardTile id={c.id} />}
                  <span className={`tag${c.isNew ? ' new' : c.extra ? ' extra' : ''}`}>{c.isNew ? (c.kind && c.kind !== 'card' ? 'Débloquée !' : 'Nouvelle !') : c.extra ? (c.kind && c.kind !== 'card' ? 'Déjà possédée : +1 pièce' : `Déjà ${MAX_COPIES} : +1 pièce`) : '+1 exemplaire'}</span>
                </>
              ) : <span className="pack-back">?</span>}
            </button>
          ))}
        </div>
        <div className="choices row">
          {shown < result.cards.length
            ? <button type="button" className="primary" onClick={() => setShown(result.cards.length)}>Tout retourner</button>
            : <button type="button" className="primary" onClick={onClose}>{result.refund ? `Récupérer ${result.refund} pièce(s) et fermer` : 'Fermer'}</button>}
        </div>
      </div>
    </div>
  );
}

/** Carte non possédée : dos de carte, sans illustration ni texte (on garde la surprise et la grille reste légère). */
function MaskedTile({ id }: { id: string }) {
  const c = CARDS[id]!;
  return (
    <div className={`ccard masked ${c.faction}`} title="Carte pas encore possédée">
      <div className="mask-back"><span>?</span><small>{FACTION_LABEL[c.faction]} · niv. {c.niveau}</small></div>
      <div className="cc-ctl"><span className="count zero">0 / {MAX_COPIES}</span></div>
    </div>
  );
}

/** Choix de l'art d'une carte : base ou un art alternatif débloqué (tous en mode vérification). */
function ArtPicker({ id, profile, update }: { id: string; profile: Profile; update: (fn: (p: Profile) => void) => void }) {
  const alts = altArtsOf(id);
  if (!alts.length) return null;
  const cur = profile.artChoice[id];
  const can = (k: string) => profile.altArts.includes(k) || !!profile.options.showAll;
  const pick = (k?: string) => update(p => {
    if (!k) delete p.artChoice[id];
    else p.artChoice[id] = k; // en mode vérification, un art non débloqué n'est qu'un aperçu (retiré au prochain chargement)
  });
  return (
    <span className="art-pick" role="group" aria-label="Art de la carte">
      <button type="button" className={!cur ? 'on' : ''} onClick={() => pick()} title="Art de base">Base</button>
      {alts.map(k => (
        <button key={k} type="button" className={cur === k ? 'on' : ''} disabled={!can(k)} onClick={() => pick(k)}
          title={can(k) ? `Art alternatif ${altArtNumber(k)}` : 'Art alternatif à débloquer dans les paquets'}>
          {can(k) ? `Alt ${altArtNumber(k)}` : '🔒'}
        </button>
      ))}
    </span>
  );
}

const pct = (x: number, y: number) => `${Math.floor((100 * x) / Math.max(1, y))} %`;

export function MyCards({ profile, update }: { profile: Profile; update: (fn: (p: Profile) => void) => void }) {
  const [f, setF] = useState<Filters>({ ...NO_FILTER, owned: 'owned' }); // par défaut : seulement les cartes possédées
  const [pack, setPack] = useState<PackResult | null>(null);
  const have = (id: string) => profile.collection[id] ?? 0;
  const ids = filterCards(f, have);
  const ownedDistinct = COLLECTIBLE.filter(id => have(id) > 0).length;
  const total = COLLECTIBLE.reduce((n, id) => n + have(id), 0);
  return (
    <div className="camp">
      <div className="camp-bar">
        <span className="pill">Cartes différentes : <b>{ownedDistinct}</b> / {COLLECTIBLE.length}</span>
        <span className="pill">Exemplaires : <b>{total}</b> / {COLLECTIBLE.length * MAX_COPIES}</span>
        <span className="pill ok">Complétion : <b>{pct(total, COLLECTIBLE.length * MAX_COPIES)}</b></span>
        {ALT_ART_KEYS.length > 0 && <span className="pill">Arts alternatifs : <b>{profile.altArts.filter(k => ALT_ART_KEYS.includes(k)).length}</b> / {ALT_ART_KEYS.length}</span>}
        <span className="pill coins">Pièces : <b>{profile.coins}</b></span>
        <button type="button" className="primary" disabled={profile.coins < PACK_PRICE} onClick={() => {
          let res: PackResult | null = null;
          update(p => { res = openPack(p, Math.random, ALT_ART_KEYS); });
          if (res) setPack(res);
        }}>Ouvrir un paquet ({PACK_SIZE} cartes, {PACK_PRICE} pièces)</button>
      </div>
      <p className="muted small">Chaque victoire contre l’ordinateur ou en campagne rapporte 5 pièces. Les cartes que tu as déjà en 3 exemplaires ne sortent plus des paquets. Un paquet peut aussi contenir une emote (1 chance sur 5), une image de profil (1 sur 10) ou un art alternatif d’une carte que tu possèdes (1 sur 8), à choisir ensuite sous la carte : ton adversaire le verra aussi en partie. La fin d’une campagne ajoute ses cartes à ta collection.</p>
      <p className="completion">
        {FACTIONS.map(fa => {
          const list = COLLECTIBLE.filter(id => CARDS[id]!.faction === fa);
          const got = list.reduce((n, id) => n + Math.min(MAX_COPIES, have(id)), 0);
          return <span key={fa} className={`fchip ${fa}`}>{FACTION_LABEL[fa]} <b>{pct(got, list.length * MAX_COPIES)}</b></span>;
        })}
      </p>
      <FilterBar f={f} set={setF} />
      {ids.length === 0 && <p className="muted">{f.owned === 'owned' ? 'Aucune carte possédée avec ces filtres. Choisis « Toutes » pour voir les cartes à découvrir.' : 'Aucune carte avec ces filtres.'}</p>}
      <div className="camp-grid">
        {ids.map(id => (have(id) || profile.options.showAll
          ? <CardTile key={id} id={id} dim={!have(id)} badge={<span className={`count${have(id) ? '' : ' zero'}`}>{have(id)} / {MAX_COPIES}</span>}>
              <ArtPicker id={id} profile={profile} update={update} />
            </CardTile>
          : <MaskedTile key={id} id={id} />))}
      </div>
      {pack && <PackReveal result={pack} onClose={() => setPack(null)} />}
    </div>
  );
}
