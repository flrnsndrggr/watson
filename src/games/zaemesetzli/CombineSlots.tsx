interface CelebrationData {
  components: string[];
  word: string;
  points: number;
  is_mundart: boolean;
}

interface CombineSlotsProps {
  selectedEmojis: string[];
  onClear: () => void;
  celebration: CelebrationData | null;
}

export function CombineSlots({ selectedEmojis, onClear, celebration }: CombineSlotsProps) {
  const slots = [0, 1, 2];

  // During celebration, show the found compound with animations
  if (celebration) {
    return (
      <div
        className="flex items-center justify-center gap-2 py-3"
        role="status"
        aria-label={`Gefunden: ${celebration.word}`}
      >
        {celebration.components.map((emoji, i) => (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-[var(--color-green)]">+</span>}
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-[var(--color-green)] bg-[var(--color-green)]/15 text-xl animate-[celebrateSlot_400ms_ease-out_both]"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {emoji}
            </div>
          </div>
        ))}
        <span className="mx-1 text-[var(--color-green)] font-semibold">=</span>
        <div className="flex items-center gap-1.5 animate-[wordReveal_500ms_ease-out_200ms_both]">
          <span className="font-[family-name:var(--font-heading)] text-base font-bold text-[var(--color-green)]">
            {celebration.word}
          </span>
          <span className="animate-[checkPop_400ms_ease-out_400ms_both] text-sm text-[var(--color-green)]">
            ✓
          </span>
        </div>
        <span
          className="ml-1.5 animate-[wordReveal_400ms_ease-out_350ms_both] rounded-full bg-[var(--color-green)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--color-green)]"
        >
          +{celebration.points}{celebration.is_mundart ? ' 🇨🇭' : ''}
        </span>
      </div>
    );
  }

  // Default: empty/filling slots
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
              className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-xl transition-all duration-150 ${
                selectedEmojis[i]
                  ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 animate-[slotFill_200ms_ease-out]'
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
