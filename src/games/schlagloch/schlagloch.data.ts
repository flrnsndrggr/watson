import type { SchlaglochPuzzle } from '@/types';

export const SAMPLE_SCHLAGLOCH: SchlaglochPuzzle = {
  id: 's-001',
  date: '2026-04-16',
  headlines: [
    {
      display: 'Der Bundesrat will die _____ bis 2030 verdoppeln',
      article_url: 'https://watson.ch/schweiz/energie/123',
      article_year: 2026,
      article_date: '14. April 2026',
      category: 'Schweiz',
      difficulty: 1,
      context_hint: 'Es geht um erneuerbare Energien und die Energiestrategie 2050.',
    },
    {
      display: 'watson-Reporter deckt _____ im Aargauer Asylwesen auf',
      article_url: 'https://watson.ch/schweiz/migration/456',
      article_year: 2025,
      article_date: '3. Oktober 2025',
      category: 'Schweiz',
      difficulty: 1,
      context_hint: 'Eine investigative Recherche zu Zuständen in Asylunterkünften.',
    },
    {
      display: 'Credit Suisse wird von _____ übernommen',
      article_url: 'https://watson.ch/wirtschaft/banken/789',
      article_year: 2023,
      article_date: '19. März 2023',
      category: 'Wirtschaft',
      difficulty: 2,
      context_hint: 'Die grösste Bankenübernahme in der Schweizer Geschichte.',
    },
    {
      display: 'Die Schweiz stimmt über die _____ ab — und sagt Ja',
      article_url: 'https://watson.ch/schweiz/abstimmung/101',
      article_year: 2021,
      article_date: '13. Juni 2021',
      category: 'Schweiz',
      difficulty: 2,
      context_hint: 'Ein Umweltgesetz, das zu den Pariser Klimazielen beitragen soll.',
    },
    {
      display: '_____ gewinnt den Eurovision Song Contest in Malmö',
      article_url: 'https://watson.ch/leben/musik/102',
      article_year: 2024,
      article_date: '11. Mai 2024',
      category: 'Leben',
      difficulty: 3,
      context_hint: 'Ein Schweizer Künstler mit einem Nonbinary-Hit.',
    },
  ],
};

// Demo answers — in production, these are server-side only
export const DEMO_ANSWERS: string[][] = [
  ['solarenergie', 'solar-energie'],
  ['missstaende', 'missstände'],
  ['ubs'],
  ['co2-gesetz', 'co2 gesetz', 'co2gesetz'],
  ['nemo'],
];

// Display-ready answer strings for reveal (proper casing, umlauts, etc.)
export const DEMO_DISPLAY_ANSWERS: string[] = [
  'Solarenergie',
  'Missstände',
  'UBS',
  'CO2-Gesetz',
  'Nemo',
];
