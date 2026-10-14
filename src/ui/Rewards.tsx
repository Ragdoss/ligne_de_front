// Récompenses de fin de scénario : renforts offerts, échange optionnel, cartes à choisir.
import { useEffect, useState } from 'react';
import { addToPool, removeFromPool, type CampaignSave } from '../campaign/campaign';
import type { Reward } from '../campaign/types';
import { cardDesc, cardName } from './labels';

type Step = 'gifts' | 'exchange' | 'picks';

export function Rewards({ campaign, reward, onDone }: { campaign: CampaignSave; reward: Reward; onDone: (c: CampaignSave) => void }) {
  const order: Step[] = (reward.order ?? ['exchange', 'gifts', 'picks']).filter(s =>
    (s === 'gifts' && reward.gifts?.length) ||
    (s === 'exchange' && reward.exchange && campaign.pool.filter(x => x === reward.exchange!.from).length >= reward.exchange.count) ||
    (s === 'picks' && reward.picks));
  const [c] = useState<CampaignSave>(() => structuredClone(campaign));
  const [i, setI] = useState(0);
  const [pickNo, setPickNo] = useState(1);
  const [options, setOptions] = useState<string[]>(reward.picks?.options ?? []);
  const next = () => { if (i + 1 >= order.length) onDone(c); else setI(i + 1); };
  const step = order[i];
  useEffect(() => { if (!order.length) onDone(c); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!step) return null;

  let body: React.ReactNode;
  if (step === 'gifts') {
    const n: Record<string, number> = {};
    for (const id of reward.gifts!) n[id] = (n[id] ?? 0) + 1;
    body = (
      <>
        <h2>Récompense — Renforts</h2>
        <p>Des renforts rejoignent ta cause et entrent dans ton pool de cartes :</p>
        <ul>{Object.entries(n).map(([id, k]) => <li key={id}><b>{k}× {cardName(id)}</b> — {cardDesc(id)}</li>)}</ul>
        <div className="choices row"><button type="button" className="primary" autoFocus onClick={() => { reward.gifts!.forEach(id => addToPool(c, id)); next(); }}>Accepter</button></div>
      </>
    );
  } else if (step === 'exchange') {
    const ex = reward.exchange!;
    body = (
      <>
        <h2>Récompense — Promotion</h2>
        <p>Veux-tu promouvoir {ex.count}× {cardName(ex.from)} en {ex.count}× {cardName(ex.to)} ? Elles quittent ton pool et sont remplacées.</p>
        <p className="muted">{cardName(ex.to)} : {cardDesc(ex.to)}</p>
        <div className="choices row">
          <button type="button" onClick={next}>Garder mes cartes</button>
          <button type="button" className="primary" onClick={() => { for (let k = 0; k < ex.count; k++) { removeFromPool(c, ex.from); addToPool(c, ex.to); } next(); }}>
            Promouvoir {ex.count}× {cardName(ex.from)}
          </button>
        </div>
      </>
    );
  } else {
    const pk = reward.picks!;
    body = (
      <>
        <h2>{pk.title ?? 'Récompense — Cartes'}</h2>
        <p>{pk.text ?? 'Choisis une carte à ajouter à ton pool'} (choix {pickNo} sur {pk.count}). {pk.unique ? 'Chaque carte ne peut être prise qu’une fois.' : 'Tu peux prendre deux fois la même.'}</p>
        <div className="choices">
          {options.map(id => (
            <button type="button" key={id} onClick={() => {
              addToPool(c, id);
              if (pk.unique) setOptions(o => o.filter(x => x !== id));
              if (pickNo >= pk.count) next(); else setPickNo(pickNo + 1);
            }}>
              <b>{cardName(id)}</b> — {cardDesc(id)}
            </button>
          ))}
        </div>
      </>
    );
  }
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="box">{body}</div>
    </div>
  );
}
