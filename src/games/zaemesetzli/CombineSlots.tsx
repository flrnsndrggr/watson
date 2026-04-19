interface CombineSlotsProps {
  selectedEmojis: string[];
  onClear: () => void;
}

export function CombineSlots({ selectedEmojis, onClear }: CombineSlotsProps) {
  const slots = [0, 1, 2];

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <span className="text-sm text-[var(--color-gray-text)]">Kombiniere:</span>
      {slots.map((i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && i < (selectedEmojis.length > 2 ? 3 : 2) && (
            <span className="text-[var(--color-gray-text)]">+</span>
          )}
          {i < (selectedEmojis.length > 2 ? 3 : 2) && (
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl ${
                selectedEmojis[i]
                  ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)]/10'
                  : 'border-dashed border-[var(--color-gray-bg)]'
              }`}
            >
              {selectedEmojis[i] ?? '?'}
            </div>
          )}
        </div>
      ))}
      <span className="mx-1 text-[var(--color-gray-text)]">=</span>
      <span className="text-lg">?</span>
      {selectedEmojis.length > 0 && (
        <button
          onClick={onClear}
          aria-label="Emoji-Auswahl zurücksetzen"
          className="ml-2 text-xs text-[var(--color-gray-text)] underline hover:text-[var(--color-black)]"
        >
          Zurücksetzen
        </button>
      )}
    </div>
  );
}
