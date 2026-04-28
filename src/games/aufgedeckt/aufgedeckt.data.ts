import type { AufgedecktPuzzle } from '@/types';

/**
 * Sample Aufgedeckt puzzle. Image URLs are verified Wikimedia Commons
 * sources fetched via the Wikipedia pageimages API on 2026-04-28. The
 * watson-puzzle-content agent should curate higher-quality, properly
 * licensed assets per episode.
 */
export const SAMPLE_AUFGEDECKT: AufgedecktPuzzle = {
  id: 'auf-001',
  date: '2026-04-28',
  episode: 1,
  threshold: 80,
  rounds: [
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Matterhorn_from_Domh%C3%BCtte_-_2.jpg',
      answer: 'Matterhorn',
      accepted_answers: ['Matterhorn', 'Mattahore', 'Cervin'],
      hint: 'Berühmtester Berg der Schweiz.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Roger_Federer_2015_%28cropped%29.jpg',
      answer: 'Roger Federer',
      accepted_answers: ['Roger Federer', 'Federer', 'RF'],
      hint: 'Der Maestro aus Basel.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Toblerone_3362.jpg',
      answer: 'Toblerone',
      accepted_answers: ['Toblerone', 'Tobler'],
      hint: 'Dreieckige Schokolade.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Bahnhofstrasse-2019.jpg',
      answer: 'Bahnhofstrasse',
      accepted_answers: ['Bahnhofstrasse', 'Bahnhofstr.', 'Bahnhofstrasse Zürich'],
      hint: 'Zürcher Einkaufsmeile.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Musikinstrumenten-Museum_Berlin_-_Alphorn_in_Fis_-_1108187.jpg',
      answer: 'Alphorn',
      accepted_answers: ['Alphorn', 'Alphörner'],
      hint: 'Holzblasinstrument der Alpenhirten.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Gotthardpass_2008.jpg',
      answer: 'Gotthardpass',
      accepted_answers: ['Gotthardpass', 'Gotthard', 'San Gottardo'],
      hint: 'Alpenpass mit kurvenreicher Tremola.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Cervelas_2.jpg',
      answer: 'Cervelat',
      accepted_answers: ['Cervelat', 'Servelat', 'Cervelas'],
      hint: 'Schweizer Nationalwurst.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Alpen_Edelwei%C3%9F%2C_Leontopodium_alpinum_2.JPG',
      answer: 'Edelweiss',
      accepted_answers: ['Edelweiss', 'Edelweiß', 'Leontopodium'],
      hint: 'Bergblume und nationales Symbol.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/North_face.jpg',
      answer: 'Eiger',
      accepted_answers: ['Eiger', 'Eigernordwand', 'Eiger Nordwand'],
      hint: 'Berner-Oberland-Berg mit berüchtigter Nordwand.',
    },
    {
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/69/Swiss_Wrestlers_Rigi_Schwinget_2025_05.jpg',
      answer: 'Schwingen',
      accepted_answers: ['Schwingen', 'Schwinger', 'Hosenlupf'],
      hint: 'Schweizer Nationalsport mit kurzen Hosen.',
    },
  ],
};
