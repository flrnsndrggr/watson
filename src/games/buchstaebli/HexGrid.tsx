interface HexGridProps {
  centerLetter: string;
  outerLetters: string[];
  onLetterClick: (letter: string) => void;
  shufflePhase?: 'out' | 'in' | null;
}

function HexButton({
  letter,
  isCenter,
  onClick,
  shufflePhase,
  staggerIndex,
}: {
  letter: string;
  isCenter: boolean;
  onClick: () => void;
  shufflePhase?: 'out' | 'in' | null;
  staggerIndex: number;
}) {
  const shuffleStyle = shufflePhase
    ? {
        animation: `${shufflePhase === 'out' ? 'shuffleOut' : 'shuffleIn'} 200ms ease-${shufflePhase === 'out' ? 'in' : 'out'} ${staggerIndex * 30}ms both`,
      }
    : undefined;

  return (
    <button
      onClick={onClick}
      style={shuffleStyle}
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

export function HexGrid({ centerLetter, outerLetters, onLetterClick, shufflePhase }: HexGridProps) {
  // Arrange 6 outer letters in a hex pattern around center
  // Layout: row of 2, row of 3 (with center), row of 2
  const top = outerLetters.slice(0, 2);
  const mid = [outerLetters[2], centerLetter, outerLetters[3]];
  const bottom = outerLetters.slice(4, 6);

  // Stagger indices: outer letters only (center doesn't animate on shuffle)
  const outerIndices = [0, 1, 2, -1, 3, 4, 5]; // -1 = center

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {/* Top row */}
      <div className="flex gap-2">
        {top.map((letter, i) => (
          <HexButton
            key={`top-${i}`}
            letter={letter}
            isCenter={false}
            onClick={() => onLetterClick(letter)}
            shufflePhase={shufflePhase}
            staggerIndex={outerIndices[i]}
          />
        ))}
      </div>
      {/* Middle row with center */}
      <div className="flex gap-2">
        {mid.map((letter, i) => (
          <HexButton
            key={`mid-${i}`}
            letter={letter}
            isCenter={i === 1}
            onClick={() => onLetterClick(letter)}
            shufflePhase={i === 1 ? null : shufflePhase}
            staggerIndex={outerIndices[i + 2]}
          />
        ))}
      </div>
      {/* Bottom row */}
      <div className="flex gap-2">
        {bottom.map((letter, i) => (
          <HexButton
            key={`bot-${i}`}
            letter={letter}
            isCenter={false}
            onClick={() => onLetterClick(letter)}
            shufflePhase={shufflePhase}
            staggerIndex={outerIndices[i + 5]}
          />
        ))}
      </div>
    </div>
  );
}
