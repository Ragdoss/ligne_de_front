// Discussions au camp, entre deux combats (« Discuter avec les troupes »).
// Indice = scénario à venir (0 = avant le scénario 1) ; 'fin' = campagne terminée. Textes provisoires.
import type { DialogLine } from '../engine/types';

export const EMPIRE_TALKS: Record<string, DialogLine[]> = {
  s1: [
    { who: '', text: 'Le camp de la frontière s’éveille. Les feux de la nuit fument encore.' },
    { who: 'Soldat', text: 'Commandant, les patrouilles ont encore vu des elfes rôder près de la forêt cette nuit.' },
    { who: 'Commandant', text: 'Des éclaireurs, comme chaque saison. Ils observent, puis ils repartent.' },
    { who: 'Soldat', text: 'Ils étaient plus nombreux que d’habitude. Beaucoup plus.' },
    { who: 'Commandant', text: 'Alors doublez les gardes. Et que chaque régiment soit prêt à se mettre en ligne.' },
  ],
  s2: [
    { who: '', text: 'Les renforts ont tenu la frontière. La colonne se reforme en hâte vers Kragz.' },
    { who: 'Soldat', text: 'On dit que les elfes ont amené des élémentaux devant les remparts. Des créatures de pierre et de vent.' },
    { who: 'Commandant', text: 'Des élémentaux ou pas, la garnison de Kragz doit tenir. Si elle tombe, la ville tombe avec elle.' },
    { who: 'Soldat', text: 'Les hommes sont fatigués, commandant.' },
    { who: 'Commandant', text: 'Je sais. Ils se reposeront derrière les murs de Kragz, pas avant.' },
  ],
  s3: [
    { who: '', text: 'Kragz est sauve, mais ses greniers sont vides. Au camp, on compte les rations.' },
    { who: 'Soldat', text: 'Le convoi de ravitaillement attend au pied du col des Brumes. Personne n’aime passer par là.' },
    { who: 'Commandant', text: 'Le col est étroit et le brouillard y tombe sans prévenir. C’est l’endroit rêvé pour une embuscade.' },
    { who: 'Soldat', text: 'Alors on avance lentement, et on garde le convoi derrière nos meilleurs régiments.' },
    { who: 'Commandant', text: 'Exactement. Les chariots passent avant tout le reste.' },
  ],
  s4: [
    { who: '', text: 'La veille de la bataille. Le camp est silencieux ; chacun aiguise ses armes.' },
    { who: 'Soldat', text: 'Sylvain, le Gardien Élémentaire… On raconte que la terre se soulève quand il le demande.' },
    { who: 'Commandant', text: 'On raconte beaucoup de choses. Il se cache derrière ses élémentaux : c’est donc qu’il craint nos lances.' },
    { who: 'Soldat', text: 'Et s’il appelle encore des renforts ?' },
    { who: 'Commandant', text: 'Alors on frappe vite, et on frappe juste. Abattez Sylvain, ou épuisez son armée jusqu’à ce qu’elle plie.' },
  ],
  fin: [
    { who: '', text: 'L’armée elfique a reflué au-delà de la forêt. Pour la première fois depuis des semaines, le camp chante.' },
    { who: 'Soldat', text: 'On a réussi, commandant. La frontière tient.' },
    { who: 'Commandant', text: 'Pour cette fois. Mais quelqu’un a poussé les elfes à cette guerre, et ce n’était pas seulement Sylvain.' },
    { who: 'Soldat', text: 'Vous pensez que ça va recommencer ?' },
    { who: 'Commandant', text: 'Je pense qu’il faut se tenir prêts. Profitez de la paix tant qu’elle dure.' },
  ],
};
