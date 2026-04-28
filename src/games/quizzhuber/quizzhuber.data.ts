import type { QuizzhuberPuzzle } from '@/types';

/**
 * Sample Quizzhuber puzzle. Used as a fallback if Supabase has no entry
 * for today, and as the seed for the watson-puzzle-content agent's
 * episode generation.
 *
 * Format mirrors watson.ch's "Quizz den Huber": 10 hard, Swiss-flavoured
 * trivia questions wrapped in an editorial host persona. The intro is
 * the host setting up the week's theme.
 */
export const SAMPLE_QUIZZHUBER: QuizzhuberPuzzle = {
  id: 'qh-001',
  date: '2026-04-28',
  episode: 1,
  intro:
    'Willkommen zur ersten Folge. Diese Woche: zehn Fragen quer durch die Schweizer Kulturgeschichte. ' +
    'Ich verspreche dir nichts — aber wenn du 8 von 10 schaffst, schreib es in die Kommentare.',
  questions: [
    {
      prompt: 'In welchem Jahr wurde die SBB gegründet?',
      options: ['1898', '1902', '1882', '1920'],
      correct_index: 0,
      category: 'Geschichte',
      explanation: 'Die SBB wurde nach der Verstaatlichung 1898 als bundeseigene Bahn gegründet.',
    },
    {
      prompt: 'Welcher Schweizer Pass ist der höchste?',
      options: ['Furkapass', 'Umbrailpass', 'Nufenenpass', 'Grimselpass'],
      correct_index: 1,
      category: 'Geografie',
      explanation: 'Der Umbrailpass im Münstertal ist mit 2503 m der höchste asphaltierte Pass der Schweiz.',
    },
    {
      prompt: 'Welcher Bundesrat trat 2017 zurück?',
      options: ['Doris Leuthard', 'Didier Burkhalter', 'Johann Schneider-Ammann', 'Ueli Maurer'],
      correct_index: 1,
      category: 'Politik',
      explanation: 'Didier Burkhalter trat überraschend per Ende Oktober 2017 zurück.',
    },
    {
      prompt: 'Wie viele Sprachregionen hat die Schweiz offiziell?',
      options: ['3', '4', '5', '2'],
      correct_index: 1,
      category: 'Sprache',
      explanation: 'Deutsch, Französisch, Italienisch und Rätoromanisch — vier Landessprachen.',
    },
    {
      prompt: 'Welche Rockband stammt aus Bern?',
      options: ['Yello', 'Züri West', 'Krokus', 'Stiller Has'],
      correct_index: 1,
      category: 'Musik',
      explanation: 'Züri West — trotz dem irreführenden Namen — ist die Berner Mundart-Rockband schlechthin.',
    },
    {
      prompt: 'Welcher Schweizer gewann 2022 Tour-de-Suisse?',
      options: ['Marc Hirschi', 'Stefan Küng', 'Mathias Frank', 'Gino Mäder'],
      correct_index: 0,
      category: 'Sport',
      explanation: 'Marc Hirschi holte 2022 den Gesamtsieg an der Tour de Suisse.',
    },
    {
      prompt: 'Wo steht das «Goms» in der Schweiz?',
      options: ['Wallis', 'Graubünden', 'Tessin', 'Glarus'],
      correct_index: 0,
      category: 'Geografie',
      explanation: 'Das Goms ist das Hochtal des oberen Wallis, ab Brig rhoneaufwärts.',
    },
    {
      prompt: 'Welches Zürcher Fest endet mit dem Verbrennen des Bööggs?',
      options: ['Knabenschiessen', 'Sechseläuten', 'Züri Fäscht', 'Caliente'],
      correct_index: 1,
      category: 'Brauchtum',
      explanation: 'Beim Sechseläuten verbrennt die Stadt den Schneemann-Böögg um Punkt 18 Uhr.',
    },
    {
      prompt: 'Welche Schweizerin wurde 2025 zur Bundesrätin gewählt?',
      options: ['Karin Keller-Sutter', 'Élisabeth Baume-Schneider', 'Viola Amherd', 'Eva Herzog'],
      correct_index: 1,
      category: 'Politik',
      explanation:
        'Élisabeth Baume-Schneider wurde Ende 2022 in den Bundesrat gewählt und 2025 als Departementsvorsteherin bestätigt.',
    },
    {
      prompt: 'Wie heisst der höchste Berg, den man komplett auf Schweizer Boden besteigen kann?',
      options: ['Matterhorn', 'Dom', 'Mönch', 'Eiger'],
      correct_index: 1,
      category: 'Geografie',
      explanation:
        'Der Dom (4546 m) ist der höchste vollständig in der Schweiz liegende Gipfel.',
    },
  ],
};
