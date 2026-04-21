import type { HowToPlayStep } from '@/components/shared/HowToPlayModal';

export const VERBINDIGE_STEPS: HowToPlayStep[] = [
  { icon: '🔲', text: 'Finde 4 Gruppen à 4 Wörter, die zusammengehören.' },
  { icon: '👆', text: 'Tippe 4 Wörter an und drücke «Prüfen».' },
  { icon: '🎨', text: 'Jede Gruppe hat eine Farbe — von Gelb (einfach) bis Violett (knifflig).' },
  { icon: '❌', text: 'Du hast 4 Versuche. Danach ist das Spiel vorbei.' },
];

export const SCHLAGLOCH_STEPS: HowToPlayStep[] = [
  { icon: '📰', text: 'Errate das fehlende Wort in 5 echten watson-Schlagzeilen.' },
  { icon: '⌨️', text: 'Tippe deine Antwort ein und drücke Enter.' },
  { icon: '❌', text: '3 Fehler insgesamt — dann ist Schluss.' },
  { icon: '🔗', text: 'Nach jeder Schlagzeile kannst du den ganzen Artikel lesen.' },
];

export const ZAEMESETZLI_STEPS: HowToPlayStep[] = [
  { icon: '🧩', text: 'Kombiniere 2–3 Emojis zu zusammengesetzten Wörtern.' },
  { icon: '👆', text: 'Wähle Emojis aus und drücke «Prüfen» — wenn deine Kombination einem Wort entspricht, zählt sie.' },
  { icon: '🇨🇭', text: 'Mundart-Wörter geben extra Punkte!' },
  { icon: '🏔️', text: 'Steige auf: Stift → Lehrling → Geselle → Meister → Bundesrat.' },
];
