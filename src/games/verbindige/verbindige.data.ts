import type { VerbindigePuzzle } from '@/types';

export const SAMPLE_VERBINDIGE: VerbindigePuzzle = {
  id: 'v-001',
  date: '2026-04-16',
  groups: [
    {
      category: 'Wörter für Kopf',
      category_label: 'Wörter für Kopf',
      difficulty: 1,
      items: [
        { text: 'Gring', hochdeutsch: 'Kopf', region: 'ZH' },
        { text: 'Grind', hochdeutsch: 'Kopf', region: 'BE' },
        { text: 'Bire', hochdeutsch: 'Kopf (Birne)', region: 'AG' },
        { text: 'Tscholi', hochdeutsch: 'Kopf', region: 'SG' },
      ],
    },
    {
      category: 'Gemüse auf Mundart',
      category_label: 'Gemüse auf Mundart',
      difficulty: 2,
      items: [
        { text: 'Rüebli', hochdeutsch: 'Karotte', region: 'CH' },
        { text: 'Kabis', hochdeutsch: 'Kohl', region: 'ZH' },
        { text: 'Härdöpfel', hochdeutsch: 'Kartoffel', region: 'BE' },
        { text: 'Nüssli', hochdeutsch: 'Feldsalat', region: 'CH' },
      ],
    },
    {
      category: 'Fortbewegungsmittel',
      category_label: 'Fortbewegungsmittel',
      difficulty: 3,
      items: [
        { text: 'Töffli', hochdeutsch: 'Mofa', region: 'CH' },
        { text: 'Velo', hochdeutsch: 'Fahrrad', region: 'CH' },
        { text: 'Trottinett', hochdeutsch: 'Tretroller', region: 'CH' },
        { text: 'Güxi', hochdeutsch: 'Fahrrad (alt)', region: 'ZH' },
      ],
    },
    {
      category: 'Dummkopf / Chaot',
      category_label: 'Dummkopf / Chaot',
      difficulty: 4,
      items: [
        { text: 'Tschumpel', hochdeutsch: 'Tölpel', region: 'BE' },
        { text: 'Sürmel', hochdeutsch: 'Faulpelz', region: 'ZH' },
        { text: 'Löli', hochdeutsch: 'Dummkopf', region: 'CH' },
        { text: 'Tubel', hochdeutsch: 'Tollpatsch', region: 'ZH' },
      ],
    },
  ],
};
