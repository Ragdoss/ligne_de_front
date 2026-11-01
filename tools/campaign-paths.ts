// Étapes d'une campagne telles qu'un joueur les traverse, avec le pool attendu avant chaque combat (outils de difficulté).
// Campagnes linéaires : l'ordre du fil rouge, récompenses écrites prises (premières options pour les choix).
// Campagnes à embranchements : chaque branche d'allié (Varro sauvé, missions secondaires jouées dès qu'elles s'ouvrent,
// Volontaires et Promotion compris, premier choix proposé) ; le tronc commun n'est compté qu'une fois (première branche).
import { addToPool, availableSides, type CampaignSave, currentScenario, draftOptions, newCampaign, nextNode, promoteOffers, removeFromPool, rewardWithDraft, withFlags } from '../src/campaign/campaign';
import { SCENARIOS } from '../src/campaign/campaigns';
import type { CampaignDef, CampaignScenario } from '../src/campaign/types';

export interface Step { id: string; sc: CampaignScenario; pool: string[] }

const take = (c: CampaignSave, rw: CampaignScenario['reward']) => {
  if (!rw) return;
  for (const step of rw.order ?? ['exchange', 'gifts', 'picks']) {
    if (step === 'gifts') rw.gifts?.forEach(g => addToPool(c, g));
    if (step === 'exchange' && rw.exchange) for (let k = 0; k < rw.exchange.count; k++) if (removeFromPool(c, rw.exchange.from)) addToPool(c, rw.exchange.to);
    if (step === 'picks' && rw.picks) rw.picks.options.slice(0, rw.picks.count).forEach(o => addToPool(c, o));
    if (step === 'promote') { const o = promoteOffers(c)[0]; if (o && removeFromPool(c, o.from)) addToPool(c, o.to); }
    if (step === 'draft' && rw.draft) for (let r = 0; r < rw.draft.rounds; r++) { const o = draftOptions(c, r, rw.draft.size, rw.draft.maxLevel)[0]; if (o) addToPool(c, o); }
  }
};

export function campaignSteps(def: CampaignDef): Step[] {
  const steps: Step[] = [];
  if (!def.start) {
    const c = newCampaign(def.id);
    for (const id of def.order) { steps.push({ id, sc: SCENARIOS[id]!, pool: c.pool.slice() }); take(c, SCENARIOS[id]!.reward); }
    return steps;
  }
  const COMMON = /^cc|^cs_(forteresse|legion)/;
  Object.keys(def.allies ?? { '': '' }).forEach((ally, bi) => {
    let c: CampaignSave = { ...newCampaign(def.id), flags: ['varro:sauve'] };
    const play = (id: string) => {
      const sc = currentScenario(c);
      if (bi === 0 || !COMMON.test(id)) steps.push({ id, sc, pool: c.pool.slice() });
      for (const l of sc.victoryDialog ?? []) if (l.choices) c = withFlags(c, (l.choices.find(ch => ch.set?.includes(ally)) ?? l.choices[0]!).set);
      c = withFlags(c, [...(sc.onWin ?? []), ...(sc.onLiberated ? [sc.onLiberated] : [])]);
      take(c, rewardWithDraft(c));
    };
    for (let guard = 0; guard < 30 && c.node; guard++) {
      for (const sd of availableSides(c)) { c = { ...c, side: sd.id }; play(sd.id); c = { ...c, side: undefined, sidesDone: [...(c.sidesDone ?? []), sd.id] }; }
      play(c.node!);
      const to = nextNode(c);
      c = to ? { ...c, idx: c.idx + 1, node: to } : { ...c, node: undefined };
    }
  });
  return steps;
}
