// Campagne à embranchements (« La Couronne de cendres ») : drapeaux, graphe, missions secondaires, fins, alliés, Promotion.
import { describe, expect, it } from 'vitest';
import {
  availableSides, currentScenario, draftFactions, endingOf, linesFor, newCampaign, nextNode, promoteOffers, rewardWithDraft, sanitize, withFlags,
} from '../src/campaign/campaign';
import { CAMPAIGN_BY_ID, SCENARIOS } from '../src/campaign/campaigns';
import { CARDS } from '../src/data/cards';

describe('Campagne à embranchements', () => {
  it('démarre au premier nœud avec des drapeaux vides', () => {
    const c = newCampaign('couronne');
    expect(c.node).toBe('cc1');
    expect(c.flags).toEqual([]);
    expect(currentScenario(c).id).toBe('cc1');
  });
  it('le choix d’allié oriente l’acte 2, puis tout converge vers la capitale', () => {
    const c = { ...newCampaign('couronne'), node: 'cc3', idx: 2 };
    expect(nextNode(withFlags(c, ['allie:elfes']))).toBe('ce4');
    expect(nextNode(withFlags(c, ['allie:nomades']))).toBe('cn4');
    expect(nextNode(withFlags(c, ['allie:demons']))).toBe('cd4');
    for (const n of ['ce6', 'cn6', 'cd6']) expect(nextNode({ ...c, node: n })).toBe('cc7');
    expect(nextNode({ ...c, node: 'cc8' })).toBeNull();
  });
  it('chaque nœud du graphe existe et chaque branche fait 8 combats', () => {
    const def = CAMPAIGN_BY_ID.couronne!;
    for (const sc of Object.values(def.scenarios)) for (const n of sc.next ?? []) expect(SCENARIOS[n.to]).toBeDefined();
    for (const ally of Object.keys(def.allies!)) {
      let c = withFlags({ ...newCampaign('couronne') }, [ally]);
      let n = 1;
      for (let to = nextNode(c); to; to = nextNode(c)) { c = { ...c, node: to }; n++; }
      expect(n).toBe(8);
    }
  });
  it('les répliques et les événements suivent les drapeaux', () => {
    const c = { ...newCampaign('couronne'), node: 'cc2', idx: 1 };
    const sauve = currentScenario(withFlags(c, ['varro:sauve']));
    const perdu = currentScenario(withFlags(c, ['varro:perdu']));
    expect(sauve.intro?.some(l => l.who === 'Légat Varro')).toBe(true);
    expect(perdu.intro?.some(l => l.who === 'Légat Varro')).toBe(false);
    expect(sauve.events.some(e => e.pid === 'A')).toBe(true);
    expect(perdu.events.some(e => e.pid === 'A')).toBe(false);
    expect(linesFor({ flags: [] }, [{ who: 'x', text: 'y', if: { all: ['a'] } }])).toEqual([]);
  });
  it('missions secondaires : proposées au bon moment, une seule fois, et sous condition', () => {
    const c = { ...newCampaign('couronne'), node: 'cc2', idx: 1 };
    expect(availableSides(c).map(s => s.id)).toEqual(['cs_forteresse']);
    expect(availableSides({ ...c, sidesDone: ['cs_forteresse'] })).toEqual([]);
    const c7 = { ...c, node: 'cc7' };
    expect(availableSides(c7)).toEqual([]);
    expect(availableSides(withFlags(c7, ['varro:sauve'])).map(s => s.id)).toEqual(['cs_legion']);
  });
  it('les fins dépendent des choix', () => {
    const c = newCampaign('couronne');
    expect(endingOf(withFlags(c, ['allie:elfes', 'fin:refus'])).title).toBe('Le trône vide');
    expect(endingOf(withFlags(c, ['allie:demons', 'octavia:remede'])).title).toBe('La Couronne de cendres');
    expect(endingOf(withFlags(c, ['allie:nomades', 'octavia:remede'])).title).toBe('Les deux peuples');
    expect(endingOf(withFlags(c, ['allie:nomades'])).title).toBe('L’aube grise');
  });
  it('l’allié rejoint les Volontaires et offre ses cadeaux', () => {
    const c = { ...newCampaign('couronne'), node: 'cc3', idx: 2 };
    expect(draftFactions(c)).toEqual(['empire']);
    const n = withFlags(c, ['allie:nomades']);
    expect(draftFactions(n)).toEqual(['empire', 'nomades']);
    expect(currentScenario(n).reward?.gifts).toContain('al_mansur');
    expect(currentScenario(withFlags(c, ['allie:elfes'])).reward?.gifts).toContain('lyra');
  });
  it('Promotion : une carte contre une de niveau +1 ou +2, même type, une fois sur deux', () => {
    const c = { ...newCampaign('couronne'), node: 'cc2', idx: 1 };
    const offers = promoteOffers(c);
    expect(offers.length).toBeGreaterThan(0);
    for (const { from, to } of offers) {
      const a = CARDS[from]!, b = CARDS[to]!;
      expect(c.pool).toContain(from);
      expect(b.niveau - a.niveau).toBeGreaterThanOrEqual(1);
      expect(b.niveau - a.niveau).toBeLessThanOrEqual(2);
      expect(b.cardType).toBe(a.cardType);
    }
    expect(rewardWithDraft(c)?.order).toContain('promote');
    expect(rewardWithDraft(withFlags({ ...c, idx: 2, node: 'cc3' }, ['allie:elfes']))?.order).not.toContain('promote');
  });
  it('la sauvegarde garde drapeaux et position, pas la mission en cours', () => {
    const c = { ...withFlags(newCampaign('couronne'), ['varro:sauve']), node: 'cc2', idx: 1, side: 'cs_forteresse', sidesDone: ['x'] };
    const s = sanitize(JSON.parse(JSON.stringify(c)))!;
    expect(s.flags).toEqual(['varro:sauve']);
    expect(s.node).toBe('cc2');
    expect(s.side).toBeUndefined();
  });
});
