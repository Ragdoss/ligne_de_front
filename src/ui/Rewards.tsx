// Récompenses de fin de scénario, présentées comme un dialogue : renforts offerts, échange optionnel, cartes à choisir.
import { useEffect, useState } from 'react';
import { addToPool, removeFromPool, type CampaignSave } from '../campaign/campaign';
import type { Reward } from '../campaign/types';
import type { DialogLine } from '../engine/types';
import { CardTile } from './CardTile';
import { cardName } from './labels';
import { VnScene } from './VnDialog';

type Step = 'gifts' | 'exchange' | 'picks';

const listCards = (ids: string[]) => {
  const n: Record<string, number> = {};
  for (const id of ids) n[id] = (n[id] ?? 0) + 1;
  return Object.entries(n).map(([id, k]) => `${k} ${cardName(id)}`).join(', ');
};

/** Pastille « dans ta collection » : aide à viser les cartes qui manquent encore. */
const ownedBadge = (k: number) => k >= 3
  ? <span className="count owned full" title="Tu as déjà les 3 exemplaires de cette carte">Collection 3/3</span>
  : k === 0
    ? <span className="count owned new" title="Tu n’as pas encore cette carte">Nouvelle</span>
    : <span className="count owned" title="Exemplaires dans ta collection">Collection {k}/3</span>;

export function Rewards({ campaign, reward, onDone, hero = 'Commandant', owned }: { campaign: CampaignSave; reward: Reward; onDone: (c: CampaignSave) => void; hero?: string; owned?: (id: string) => number }) {
  const order: Step[] = (reward.order ?? ['exchange', 'gifts', 'picks']).filter(s =>
    (s === 'gifts' && reward.gifts?.length) ||
    (s === 'exchange' && reward.exchange && campaign.pool.filter(x => x === reward.exchange!.from).length >= reward.exchange.count) ||
    (s === 'picks' && reward.picks));
  const [c] = useState<CampaignSave>(() => structuredClone(campaign));
  const [i, setI] = useState(0);
  const [pickNo, setPickNo] = useState(1);
  const [options, setOptions] = useState<string[]>(reward.picks?.options ?? []);
  const [taken, setTaken] = useState<string[]>([]);
  const next = () => { if (i + 1 >= order.length) onDone(c); else setI(i + 1); };
  const step = order[i];
  useEffect(() => { if (!order.length) onDone(c); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!step) return null;

  const say = (fallback: string): DialogLine => reward.lines?.[step] ?? { who: hero, text: fallback };
  const count = `Récompense ${i + 1} / ${order.length}`;
  let line: DialogLine, center: React.ReactNode, actions: React.ReactNode, title: string;

  if (step === 'gifts') {
    const n: Record<string, number> = {};
    for (const id of reward.gifts!) n[id] = (n[id] ?? 0) + 1;
    title = 'Récompense — Renforts';
    line = say(`Des renforts nous rejoignent : ${listCards(reward.gifts!)}. Ils entrent dans ton pool de cartes.`);
    center = <div className="vn-cards">{Object.entries(n).map(([id, k]) => <CardTile key={id} id={id} badge={<>{owned && ownedBadge(owned(id))}<span className="count">×{k}</span></>} />)}</div>;
    actions = <button type="button" className="vn-next" autoFocus onClick={() => { reward.gifts!.forEach(id => addToPool(c, id)); next(); }}>Accepter</button>;
  } else if (step === 'exchange') {
    const ex = reward.exchange!;
    title = 'Récompense — Promotion';
    line = say(`${ex.count} régiments de ${cardName(ex.from)} se sont distingués. Je peux les promouvoir en ${cardName(ex.to)} : ils quitteront ton pool et seront remplacés. Qu’en dis-tu ?`);
    center = (
      <div className="vn-cards">
        <CardTile id={ex.from} badge={<span className="count">−{ex.count}</span>} />
        <span className="vn-arrow" aria-hidden="true">→</span>
        <CardTile id={ex.to} badge={<span className="count">+{ex.count}</span>} />
      </div>
    );
    actions = (
      <>
        <button type="button" className="vn-alt" onClick={next}>Garder mes cartes</button>
        <button type="button" className="vn-next" onClick={() => { for (let k = 0; k < ex.count; k++) { removeFromPool(c, ex.from); addToPool(c, ex.to); } next(); }}>
          Promouvoir
        </button>
      </>
    );
  } else {
    const pk = reward.picks!;
    title = pk.title ?? 'Récompense — Cartes';
    line = say(`${pk.text ?? 'Choisis une carte à ajouter à ton pool'} (choix ${pickNo} sur ${pk.count}).${pk.unique ? ' Chaque carte ne peut être prise qu’une fois.' : ''}`);
    if (pickNo > 1) line = { who: hero, text: `Bon choix. Et ensuite ? (choix ${pickNo} sur ${pk.count})` };
    center = (
      <div className="vn-cards picks">
        {options.map(id => (
          <button type="button" key={id} className="vn-pick" aria-label={`Prendre ${cardName(id)}`} onClick={() => {
            addToPool(c, id);
            setTaken(t => [...t, id]);
            if (pk.unique) setOptions(o => o.filter(x => x !== id));
            if (pickNo >= pk.count) next(); else setPickNo(pickNo + 1);
          }}>
            <CardTile id={id} badge={owned ? ownedBadge(owned(id)) : undefined} />
          </button>
        ))}
      </div>
    );
    actions = <span className="vn-hint">{taken.length ? `Déjà choisi : ${listCards(taken)}` : 'Clique sur une carte pour la prendre.'}</span>;
  }
  return <VnScene title={title} cast={[...new Set([hero, line.who].filter(Boolean))]} speaking={line.who} now={line} center={center} actions={actions} count={count} />;
}
