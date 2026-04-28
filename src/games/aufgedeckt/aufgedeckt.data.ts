import type { AufgedecktPuzzle } from '@/types';

/**
 * Sample Aufgedeckt puzzle. Image-tile reveal: each round shows a hidden
 * image under a 5x5 grid; the player reveals tiles one at a time and
 * types the answer. Score = correct count + total tiles revealed (lower
 * is better).
 *
 * Image URLs use Wikimedia Commons placeholders so the page renders
 * cleanly without us hosting assets. The watson-puzzle-content agent
 * replaces them with curated images per episode.
 */
export const SAMPLE_AUFGEDECKT: AufgedecktPuzzle = {
  id: 'auf-001',
  date: '2026-04-28',
  episode: 1,
  threshold: 80,
  rounds: [
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Matterhorn_seen_from_Z%C3%BCrich.jpg/640px-Matterhorn_seen_from_Z%C3%BCrich.jpg',
      answer: 'Matterhorn',
      accepted_answers: ['Matterhorn', 'Mattahore', 'Cervin'],
      hint: 'Berühmtester Berg der Schweiz.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Roger_Federer_2015.jpg/640px-Roger_Federer_2015.jpg',
      answer: 'Roger Federer',
      accepted_answers: ['Roger Federer', 'Federer', 'RF'],
      hint: 'Der Maestro aus Basel.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Toblerone_3362.jpg/640px-Toblerone_3362.jpg',
      answer: 'Toblerone',
      accepted_answers: ['Toblerone', 'Tobler'],
      hint: 'Dreieckige Schokolade.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Bahnhofstrasse_Zurich.jpg/640px-Bahnhofstrasse_Zurich.jpg',
      answer: 'Bahnhofstrasse',
      accepted_answers: ['Bahnhofstrasse', 'Bahnhofstr.', 'Bahnhofstrasse Zürich'],
      hint: 'Zürcher Einkaufsmeile.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Rivella_-_Original_-_PET-Flasche.jpg/360px-Rivella_-_Original_-_PET-Flasche.jpg',
      answer: 'Rivella',
      accepted_answers: ['Rivella'],
      hint: 'Kultgetränk aus Milchserum.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Gotthard_Pass_Tremola.jpg/640px-Gotthard_Pass_Tremola.jpg',
      answer: 'Gotthardpass',
      accepted_answers: ['Gotthardpass', 'Gotthard', 'San Gottardo'],
      hint: 'Alpenpass mit kurvenreicher Tremola.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Schweizer_K%C3%A4se_Emmentaler.jpg/640px-Schweizer_K%C3%A4se_Emmentaler.jpg',
      answer: 'Emmentaler',
      accepted_answers: ['Emmentaler', 'Emmentaler Käse', 'Emmental'],
      hint: 'Berühmt für seine Löcher.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/SBB_Re_460_044-1.jpg/640px-SBB_Re_460_044-1.jpg',
      answer: 'SBB',
      accepted_answers: ['SBB', 'CFF', 'FFS', 'Schweizerische Bundesbahnen'],
      hint: 'Rote Lokomotive.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Eiger_North_Face.jpg/640px-Eiger_North_Face.jpg',
      answer: 'Eiger',
      accepted_answers: ['Eiger', 'Eigernordwand', 'Eiger Nordwand'],
      hint: 'Berner-Oberland-Berg mit berüchtigter Nordwand.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Tinguely_Brunnen.jpg/640px-Tinguely_Brunnen.jpg',
      answer: 'Tinguely',
      accepted_answers: ['Tinguely', 'Jean Tinguely', 'Tinguely-Brunnen'],
      hint: 'Basler Künstler mit kinetischen Skulpturen.',
    },
  ],
};
