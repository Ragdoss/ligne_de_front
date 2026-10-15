// Partie du tutoriel : decks, main de départ et renforts fixés pour que le déroulé guidé soit toujours le même.
import type { GameSetup } from '../engine/game';

export const TUTORIAL_SETUP: GameSetup = {
  seed: 'tutoriel',
  A: { faction: 'empire', deck: Array(12).fill('recrue_imp') },
  B: { faction: 'neutre', deck: Array(12).fill('mercenaires') },
  config: { startingHand: 0, defeatLassitude: { A: 50, B: 18 }, emptyDeckDefeat: false },
  scenario: {
    events: [
      { turn: 2, pid: 'A', lassitude: 4, resource: 3, giveCards: ['archer_imp'] },
    ],
    start: { B: { avant: { '1': 'mercenaires' } } },
    startHand: { A: ['recrue_imp', 'recrue_imp', 'lieutenant', 'ralliement'], B: [] },
  },
};
