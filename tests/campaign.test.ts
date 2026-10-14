// Scénarios de campagne : mise en place, événements, convoi, règles de victoire.
import { describe, expect, it } from 'vitest';
import { chooseAction } from '../src/ai/heuristic';
import { newCampaign, scenarioAiFilter, scenarioGameSetup } from '../src/campaign/campaign';
import { SCENARIOS } from '../src/campaign/scenarios';
import { applyAction, createGame } from '../src/engine/game';
import type { GameState } from '../src/engine/types';
import { act } from './helpers';

const start = (id: string) => createGame(scenarioGameSetup(SCENARIOS[id]!, newCampaign().pool, 'test'));
/** Fait finir les tours jusqu'au tour `turn` (joueur A actif), sans jouer de carte. */
function skipTo(s: GameState, turn: number): GameState {
  let cur = s;
  while (!cur.over && (cur.turn < turn || cur.active !== 'A')) {
    cur = act(cur, { type: 'endTurn' }).state;
    while (cur.pending.length) cur = act(cur, { type: 'choose', option: 0 }).state;
  }
  return cur;
}

describe('Scénarios', () => {
  it('scénario 1 : plateau de départ et renforts du tour 5', () => {
    let s = start('s1');
    expect(s.players.A.board.avant.map(u => u?.cardId ?? null)).toEqual([null, 'palissade_regiment', 'palissade_regiment', null]);
    expect(s.players.A.board.arriere[1]?.cardId).toBe('archer_imp');
    expect(s.players.B.board.avant.map(u => u?.cardId ?? null)).toEqual([null, 'eclaireur_elfe', 'eclaireur_elfe', null]);
    s.config.defeatLassitude = { A: 1e9, B: 1e9 };
    s = skipTo(s, 5);
    if (s.over) return; // partie déjà finie (aucun régiment) : on ne teste pas les renforts dans ce cas
    const given = s.players.A.hand.filter(h => h.levelFree);
    expect(given.map(h => h.cardId).sort()).toEqual(['arbaletrier_imp', 'arbaletrier_imp', 'chevalier_prov', 'chevalier_prov', 'chevalier_prov']);
  });
  it('scénario 2 : Garnison vitale, Palissades à 4 Moral, elfes niveau 2', () => {
    const s = start('s2');
    expect(s.players.A.board.arriere[1]).toMatchObject({ cardId: 'garnison', currentMor: 3, maxMor: 6 });
    expect(s.players.A.board.avant[1]).toMatchObject({ cardId: 'palissade_regiment', currentMor: 4, maxMor: 4 });
    expect(s.players.B.level).toBe(2);
    expect(s.config.mustSurvive).toEqual({ A: 'garnison' });
  });
  it('scénario 3 : plateau 6/5, Halte du Convoi retarde l’avancée et fait piocher', () => {
    let s = start('s3');
    expect(s.players.A.board.avant).toHaveLength(6);
    expect(s.players.A.board.arriere[0]?.cardId).toBe('convoi');
    const halte = s.players.A.hand.find(h => h.cardId === 'halte_convoi')!;
    const handBefore = s.players.A.hand.length;
    s = act(s, { type: 'play', handUid: halte.uid }).state;
    expect(s.players.A.hand.length).toBe(handBefore); // jouée (−1) puis pioche (+1)
    expect(s.scenario!.convoyHold).toBe(1);
    s = skipTo(s, 3); // 1re avancée prévue au tour 3 : annulée par la halte
    if (s.over) return;
    expect(s.players.A.board.arriere[0]?.cardId).toBe('convoi');
    s = skipTo(s, 5);
    if (s.over) return;
    expect(s.players.A.board.arriere[1]?.cardId).toBe('convoi');
  });
  it('scénario 3 : le convoi qui sort du terrain fait gagner', () => {
    let s = start('s3');
    const row = s.players.A.board.arriere;
    row[4] = row[0]!; row[0] = null;
    s.turn = 2; s.active = 'B'; // B finit le tour 2 : A commence le tour 3, où le convoi avance
    const r = act(s, { type: 'endTurn' });
    expect(r.state.over).toEqual({ winner: 'A', reason: 'convoyArrived' });
  });
  it('scénario 4 : Sylvain vital, et l’ordinateur ne joue Tectonique que pour lui trouver une cible', () => {
    const s = start('s4');
    expect(s.config.mustSurvive).toEqual({ B: 'sylvain' });
    const filter = scenarioAiFilter(SCENARIOS.s4!);
    s.active = 'B';
    s.players.B.level = 3; s.players.B.resource = 9;
    s.players.B.hand = [{ uid: 9999, cardId: 'changement_tectonique' }];
    // Palissade A en avant 0 : Sylvain (avant 1) n'a rien en face ni derrière (arrière 0 et 1 vides).
    const ok = { type: 'play' as const, handUid: 9999, target: { player: 'A' as const, zone: 'avant' as const, idx: 0 }, target2: { player: 'A' as const, zone: 'avant' as const, idx: 1 } };
    const ko = { ...ok, target2: { player: 'A' as const, zone: 'avant' as const, idx: 2 } };
    expect(filter(s, ok)).toBe(true);
    expect(filter(s, ko)).toBe(false);
  });
  it('les 4 scénarios se jouent jusqu’au bout avec l’ordinateur des deux côtés', () => {
    for (const id of ['s1', 's2', 's3', 's4']) {
      const sc = SCENARIOS[id]!;
      let s = createGame(scenarioGameSetup(sc, newCampaign().pool, id));
      const f = scenarioAiFilter(sc);
      for (let n = 0; n < 4000 && !s.over; n++) {
        const r = applyAction(s, chooseAction(s, undefined, s.active === 'B' ? f : undefined));
        if (!r.ok) throw new Error(r.error);
        s = r.state;
      }
      expect(s.over, id).not.toBeNull();
    }
  });
});
