interface HexGridProps {
  centerLetter: string;
  outerLetters: string[];
  onLetterClick: (letter: string) => void;
}

function HexButton({ letter, isCenter, onClick }: { letter: string; isCenter: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex h-[52px] w-[52px] items-center justify-center
        rounded-full text-lg font-bold
        transition-all duration-[var(--transition-fast)]
        active:scale-95 select-none
        ${isCenter
          ? 'bg-[var(--color-cyan)] text-white shadow-md'
          : 'bg-[var(--color-gray-bg)] text-[var(--color-black)] hover:bg-[var(--color-cyan)] hover:text-white'
        }
      `}
    >
      {letter}
    </button>
  );
}

export function HexGrid({ centerLetter, outerLetters, onLetterClick }: HexGridProps) {
  // Arrange 6 outer letters in a hex pattern around center
  // Layout: row of 2, row of 3 (with center), row of 2
  const top = outerLetters.slice(0, 2);
  const mid = [outerLetters[2], centerLetter, outerLetters[3]];
  const bottom = outerLetters.slice(4, 6);

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {/* Top row */}
      <div className="flex gap-2">
        {top.map((letter) => (
          <HexButton key={letter + '-top'} letter={letter} isCenter={false} onClick={() => onLetterClick(letter)} />
        ))}
      </div>
      {/* Middle row with center */}
      <div className="flex gap-2">
        {mid.map((letter, i) => (
          <HexButton
            key={letter + '-mid-' + i}
            letter={letter}
            isCenter={i === 1}
            onClick={() => onLetterClick(letter)}
          />
        ))}
      </div>
      {/* Bottom row */}
      <div className="flex gap-2">
        {bottom.map((letter) => (
          <HexButton key={letter + '-bot'} letter={letter} isCenter={false} onClick={() => onLetterClick(letter)} />
        ))}
      </div>
    </div>
  );
}
