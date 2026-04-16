import type { VerbindigeItem } from '@/types';

interface VerbindigeTileProps {
  item: VerbindigeItem;
  isSelected: boolean;
  isWrong: boolean;
  onToggle: () => void;
  disabled: boolean;
}

export function VerbindigeTile({ item, isSelected, isWrong, onToggle, disabled }: VerbindigeTileProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        flex h-[60px] items-center justify-center rounded-[var(--game-tile-radius)]
        border-2 px-2 text-center text-sm font-semibold
        select-none transition-all duration-[var(--transition-fast)]
        [-webkit-tap-highlight-color:transparent]
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
