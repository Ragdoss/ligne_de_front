// Rôles ajoutés aux régiments (21/11/2026) et roguelite : binômes retirés des cartes proposées aux champions.
import { describe, expect, it } from 'vitest';
import { CARDS } from '../src/data/cards';
import { ROLES_ADDED } from '../src/data/roles';
import { newMeta, newRun, promotions, volunteers } from '../src/roguelite/run';

const isPair = (id: string) => ((CARDS[id]!.factions as string[] | undefined)?.length ?? 0) > 1;

describe('Rôles des régiments', () => {
  it('chaque rôle demandé est sur la carte, une seule fois', () => {
    for (const [id, add] of Object.entries(ROLES_ADDED)) {
      for (const t of add) expect(CARDS[id]!.types, id).toContain(t);
      expect(new Set(CARDS[id]!.types).size, id).toBe(CARDS[id]!.types!.length);
    }
  });
  it('exemples : Chamelier Monté, Lyra Archer et Élite, Garde-frontière sylvestre Humain (avec les races)', () => {
    expect(CARDS.chamelier!.types).toEqual(['Humain', 'Nomade', 'Monté']);
    expect(CARDS.lyra!.types).toEqual(['Elfe', 'Archer', 'Élite']);
    expect(CARDS.sentinelle_chene!.types).toEqual(['Elfe', 'Élémentaux', 'Chevalier']);
    expect(CARDS.garde_frontiere_sylvestre!.types).toEqual(['Elfe', 'Humain', 'Empire']);
  });
  it('tous les régiments neutres de niveau 1 sont des Recrues', () => {
    for (const c of Object.values(CARDS)) if (c.cardType === 'Regiment' && c.faction === 'neutre' && c.niveau === 1) expect(c.types, c.id).toContain('Recrue');
  });
});

describe('Roguelite : binômes', () => {
  it('volontaires et promotions ne proposent pas de binômes aux champions', () => {
    for (const champ of ['augustus', 'eldrin'] as const) {
      for (let k = 0; k < 40; k++) {
        const run = { ...newRun(`bi${champ}${k}`, newMeta(), champ), node: k % 8 };
        for (const id of [...volunteers(run, 0), ...volunteers(run, 1)]) expect(isPair(id), id).toBe(false);
        for (const p of promotions(run)) expect(isPair(p.to), p.to).toBe(false);
      }
    }
  });
});
