# UX Polish Checklist

Items for the `watson-game-polish` agent. One item per run, commit to `polish/incremental`.

## Shared Components

- [x] Toast notifications: add auto-dismiss after 3s with fade-out animation (2026-04-16)
- [x] Toast: ensure toast stacks if multiple fire (e.g., "Schon gefunden!" then "Mundart-Bonus!") (2026-04-18)
- [x] ShareButton: verify share text format matches spec for each game (emoji grid, score, URL) (2026-04-18)
- [x] ShareButton: add Web Share API integration for mobile (navigator.share fallback to clipboard) (2026-04-19)
- [x] GameShell: add `prefers-reduced-motion` media query — disable confetti, use opacity instead of transforms (2026-04-19)
- [x] GameHeader: add streak counter display next to game title (when user has active streak) (2026-04-19)
- [x] ErrorDots: add subtle pulse animation on the dot that just filled (2026-04-19)
- [ ] AdSlot: placeholder styling with watson gray background and "Anzeige" label
- [ ] Loading state: add skeleton loader for puzzle data fetch (game-shaped placeholder)
- [ ] 404 page: create a custom not-found page at unknown routes with link back to landing

## Verbindige

- [ ] Tile selection: add scale(1.03) + cyan border on tap, 150ms ease
- [ ] Correct group solve: tiles slide up into solved row with color reveal, 400ms ease-out
- [ ] Wrong guess: translateX shake keyframe animation, 400ms
- [ ] "One away" toast: show "Fast! Nur 1 falsch." when exactly 3 of 4 items are correct
- [ ] Game complete: confetti burst using canvas-confetti library
- [ ] Solved groups: show category label with difficulty color background
- [ ] Tile grid: ensure 44x44px minimum touch targets on mobile (WCAG AA)
- [ ] Deselect all: add "Auswahl löschen" button that clears all selected tiles

## Schlagziil

- [ ] Headline card: category label (Schweiz, Sport, etc.) styled with watson green
- [ ] Correct answer: green flash on headline card, auto-advance after 2s
- [ ] Wrong answer: red flash, error counter increments visually
- [ ] Article link: "watson-Artikel lesen" button appears after solving each headline
- [ ] Results screen: show all 5 headlines with correct answers + article links
- [ ] Input: auto-focus on the text input when headline appears
- [ ] Input: submit on Enter key press

## Zämesetzli

- [ ] Emoji pool: drag-and-drop interaction for combining emojis
- [ ] Valid compound: satisfying combine animation with score popup
- [ ] Invalid compound: gentle bounce-back animation
- [ ] Score display: running total with rank progression bar
- [ ] Hint system: subtle glow on emojis that can be combined

## Cross-Game

- [ ] Landing page: show today's date and puzzle numbers
- [ ] Landing page: game cards with play status (not started / in progress / completed)
- [ ] Navigation: active route highlighted in layout nav
- [ ] Mobile: verify all games work on 375px viewport with one-thumb interaction
- [ ] Dark mode: respect `prefers-color-scheme` (watson nav is already dark)
- [ ] Keyboard navigation: full tab-through support for all interactive elements
- [ ] ARIA labels: announce game state changes for screen readers
