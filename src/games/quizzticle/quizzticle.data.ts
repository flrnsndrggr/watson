import type { QuizzticlePuzzle } from '@/types';

/**
 * Sample Quizzticle puzzle. Sporcle-style list-fill: player has 20 minutes
 * to type as many of the 30 items belonging to the prompt category.
 *
 * Sample data: 26 cantons of Switzerland — easy starting point, reliable
 * acceptance variants (canton names + abbreviations + native-language
 * names where they differ).
 */
export const SAMPLE_QUIZZTICLE: QuizzticlePuzzle = {
  id: 'qt-001',
  date: '2026-04-28',
  episode: 1,
  prompt: 'Alle 26 Schweizer Kantone',
  category: 'Geografie',
  slot_count: 26,
  duration_seconds: 1200,
  items: [
    { display: 'Zürich',                    accepted_answers: ['Zürich', 'Zurich', 'ZH'] },
    { display: 'Bern',                      accepted_answers: ['Bern', 'Berne', 'BE'] },
    { display: 'Luzern',                    accepted_answers: ['Luzern', 'Lucerne', 'LU'] },
    { display: 'Uri',                       accepted_answers: ['Uri', 'UR'] },
    { display: 'Schwyz',                    accepted_answers: ['Schwyz', 'SZ'] },
    { display: 'Obwalden',                  accepted_answers: ['Obwalden', 'OW'] },
    { display: 'Nidwalden',                 accepted_answers: ['Nidwalden', 'NW'] },
    { display: 'Glarus',                    accepted_answers: ['Glarus', 'GL'] },
    { display: 'Zug',                       accepted_answers: ['Zug', 'ZG'] },
    { display: 'Freiburg',                  accepted_answers: ['Freiburg', 'Fribourg', 'FR'] },
    { display: 'Solothurn',                 accepted_answers: ['Solothurn', 'SO'] },
    { display: 'Basel-Stadt',               accepted_answers: ['Basel-Stadt', 'Basel Stadt', 'BS'] },
    { display: 'Basel-Landschaft',          accepted_answers: ['Basel-Landschaft', 'Baselland', 'BL'] },
    { display: 'Schaffhausen',              accepted_answers: ['Schaffhausen', 'SH'] },
    { display: 'Appenzell Ausserrhoden',    accepted_answers: ['Appenzell Ausserrhoden', 'Ausserrhoden', 'AR'] },
    { display: 'Appenzell Innerrhoden',     accepted_answers: ['Appenzell Innerrhoden', 'Innerrhoden', 'AI'] },
    { display: 'St. Gallen',                accepted_answers: ['St. Gallen', 'St Gallen', 'St.Gallen', 'Sankt Gallen', 'SG'] },
    { display: 'Graubünden',                accepted_answers: ['Graubünden', 'Graubunden', 'Grisons', 'Grigioni', 'Grischun', 'GR'] },
    { display: 'Aargau',                    accepted_answers: ['Aargau', 'AG'] },
    { display: 'Thurgau',                   accepted_answers: ['Thurgau', 'TG'] },
    { display: 'Tessin',                    accepted_answers: ['Tessin', 'Ticino', 'TI'] },
    { display: 'Waadt',                     accepted_answers: ['Waadt', 'Vaud', 'VD'] },
    { display: 'Wallis',                    accepted_answers: ['Wallis', 'Valais', 'VS'] },
    { display: 'Neuenburg',                 accepted_answers: ['Neuenburg', 'Neuchâtel', 'Neuchatel', 'NE'] },
    { display: 'Genf',                      accepted_answers: ['Genf', 'Genève', 'Geneve', 'Geneva', 'GE'] },
    { display: 'Jura',                      accepted_answers: ['Jura', 'JU'] },
  ],
};
