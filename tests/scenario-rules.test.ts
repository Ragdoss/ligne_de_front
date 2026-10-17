// Bulle des règles de scénario : chaque scénario de campagne produit des règles cohérentes.
import { describe, expect, it } from 'vitest';
import { SCENARIOS } from '../src/campaign/campaigns';
import { scenarioRules } from '../src/ui/ScenarioRules';

describe('Règles de scénario', () => {
  it('chaque scénario a des conditions de victoire et de défaite', () => {
    for (const sc of Object.values(SCENARIOS)) {
      const r = scenarioRules(sc);
      expect(r.victory.length, sc.id).toBeGreaterThan(0);
      expect(r.defeat.length, sc.id).toBeGreaterThan(0);
    }
  });
  it('neutralisations et nouvelles défaites (convoi impérial, s3)', () => {
    const r = scenarioRules(SCENARIOS.s3!);
    const t = r.defeat.map(x => `${x.tag}:${x.text}`).join('\n');
    expect(t).toContain('nouveau:Convoi');
    expect(t).toContain('neutre:Pas de défaite par la lassitude');
    expect(t).toContain('neutre:Pas de défaite par pioche vide');
    expect(r.special.some(x => x.text.startsWith('Convoi'))).toBe(true);
  });
  it('météo : tempête (n4) et nuit (e3)', () => {
    expect(scenarioRules(SCENARIOS.n4!).special.some(x => x.text.includes('Tempête de sable aux tours 2, 5, 8'))).toBe(true);
    expect(scenarioRules(SCENARIOS.e3!).special.some(x => x.text.includes('Nuit aux tours 3-4, 7-8'))).toBe(true);
  });
});
