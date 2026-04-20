import type { Ref } from 'react';
import type { VerbindigeItem } from '@/types';

type ShufflePhase = 'idle' | 'out' | 'in';

const DIFFICULTY_BG: Record<number, string> = {
  1: 'bg-[var(--color-difficulty-1)]',
  2: 'bg-[var(--color-difficulty-2)]',
  3: 'bg-[var(--color-difficulty-3)]',
  4: 'bg-[var(--color-difficulty-4)]',
};

const DIFFICULTY_BORDER: Record<number, string> = {
  1: 'border-[var(--color-difficulty-1)]',
  2: 'border-[var(--color-difficulty-2)]',
  3: 'border-[var(--color-difficulty-3)]',
  4: 'border-[var(--color-difficulty-4)]',
};

interface VerbindigeTileProps {
  ref?: Ref<HTMLButtonElement>;
  item: VerbindigeItem;
  isSelected: boolean;
  isWrong: boolean;
  onToggle: () => void;
  disabled: boolean;
  shufflePhase?: ShufflePhase;
  index?: number;
  /** When set, tile flashes the difficulty color to confirm a correct guess */
  correctDifficulty?: 1 | 2 | 3 | 4;
  /** When true, tile is collapsing away after the flash */
  isCollapsing?: boolean;
}

export function VerbindigeTile({
  ref,
  item,
  isSelected,
  isWrong,
  onToggle,
  disabled,
  shufflePhase = 'idle',
  index = 0,
  correctDifficulty,
  isCollapsing,
}: VerbindigeTileProps) {
  const staggerDelay = `${index * 20}ms`;
  const shuffleClass =
    shufflePhase === 'out'
      ? 'animate-[shuffleOut_180ms_ease-in_forwards]'
      : shufflePhase === 'in'
        ? 'animate-[shuffleIn_180ms_ease-out_forwards]'
        : '';

  // Correct guess: flash difficulty color with bounce, then collapse
  const isCorrectFlash = correctDifficulty != null;
  const correctBg = isCorrectFlash ? DIFFICULTY_BG[correctDifficulty] : '';
  const correctBorder = isCorrectFlash ? DIFFICULTY_BORDER[correctDifficulty] : '';
  const correctAnim = isCollapsing
    ? 'animate-[tileCorrectCollapse_300ms_ease-in_forwards]'
    : isCorrectFlash
      ? 'animate-[tileCorrectBounce_400ms_ease]'
      : '';

  return (
    <button
      ref={ref}
      onClick={onToggle}
      disabled={disabled || shufflePhase !== 'idle' || isCorrectFlash}
      aria-label={`${isSelected ? 'Deselect' : 'Select'} ${item.text}`}
      aria-pressed={isSelected}
      style={shufflePhase !== 'idle' ? { animationDelay: staggerDelay } : undefined}
      className={`
        flex h-[60px] items-center justify-center rounded-[var(--game-tile-radius)]
        border-2 px-2 text-center text-sm font-semibold
        select-none transition-all duration-[var(--transition-fast)]
        [-webkit-tap-highlight-color:transparent]
        ${shuffleClass}
        ${correctAnim}
        ${isCorrectFlash ? `${correctBg} ${correctBorder} text-white` : ''}
        ${isWrong && !isCorrectFlash ? 'animate-[shake_0.4s_ease] border-[var(--color-pink)] bg-[var(--color-pink)] text-white' : ''}
        ${isSelected && !isWrong && !isCorrectFlash ? 'scale-[1.03] border-[var(--color-cyan)] bg-[var(--color-cyan)] text-white' : ''}
        ${!isSelected && !isWrong && !isCorrectFlash ? 'border-[var(--color-gray-bg)] bg-white text-[var(--color-black)] hover:border-[var(--color-cyan)]' : ''}
        ${disabled && !isCorrectFlash ? 'cursor-default opacity-60' : isCorrectFlash ? 'cursor-default' : 'cursor-pointer'}
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
