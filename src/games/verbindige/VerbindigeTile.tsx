import type { VerbindigeItem } from '@/types';

type ShufflePhase = 'idle' | 'out' | 'in';

interface VerbindigeTileProps {
  item: VerbindigeItem;
  isSelected: boolean;
  isWrong: boolean;
  onToggle: () => void;
  disabled: boolean;
  shufflePhase?: ShufflePhase;
  index?: number;
}

export function VerbindigeTile({ item, isSelected, isWrong, onToggle, disabled, shufflePhase = 'idle', index = 0 }: VerbindigeTileProps) {
  const staggerDelay = `${index * 20}ms`;
  const shuffleClass =
    shufflePhase === 'out'
      ? 'animate-[shuffleOut_180ms_ease-in_forwards]'
      : shufflePhase === 'in'
        ? 'animate-[shuffleIn_180ms_ease-out_forwards]'
        : '';

  return (
    <button
      onClick={onToggle}
      disabled={disabled || shufflePhase !== 'idle'}
      style={shufflePhase !== 'idle' ? { animationDelay: staggerDelay } : undefined}
      className={`
        flex h-[60px] items-center justify-center rounded-[var(--game-tile-radius)]
        border-2 px-2 text-center text-sm font-semibold
        select-none transition-all duration-[var(--transition-fast)]
        [-webkit-tap-highlight-color:transparent]
        ${shuffleClass}
        ${isWrong ? 'animate-[shake_0.4s_ease] border-[var(--color-pink)] bg-[var(--color-pink)] text-white' : ''}
        ${isSelected && !isWrong ? 'scale-[1.03] border-[var(--color-cyan)] bg-[var(--color-cyan)] text-white' : ''}
        ${!isSelected && !isWrong ? 'border-[var(--color-gray-bg)] bg-white text-[var(--color-black)] hover:border-[var(--color-cyan)]' : ''}
        ${disabled ? 'cursor-default opacity-60' : 'cursor-pointer'}
      `}
    >
      {item.emoji ? (
        <span className="text-2xl">{item.emoji}</span>
      ) : (
        <span className="leading-tight">{item.text}</span>
      )}
    </button>
  );
}
