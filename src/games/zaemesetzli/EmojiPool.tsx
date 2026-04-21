import { useState } from 'react';
import type { EmojiItem } from '@/types';

interface EmojiPoolProps {
  emojis: EmojiItem[];
  selectedEmojis: string[];
  hintableEmojis?: Set<string>;
  onSelect: (emoji: string) => void;
}

function EmojiButton({ item, isSelected, isHintable, onSelect }: { item: EmojiItem; isSelected: boolean; isHintable: boolean; onSelect: () => void }) {
  const [showNoun, setShowNoun] = useState(false);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', item.emoji);
    e.dataTransfer.effectAllowed = 'copy';
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  }

  function handleDragEnd(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).style.opacity = '';
  }

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      onMouseEnter={() => setShowNoun(true)}
      onMouseLeave={() => setShowNoun(false)}
      onTouchStart={() => {
        setShowNoun(true);
        setTimeout(() => setShowNoun(false), 1500);
      }}
      className={`
        relative flex h-14 w-14 items-center justify-center rounded-lg text-2xl
        transition-all duration-[var(--transition-fast)] select-none cursor-grab active:cursor-grabbing
        ${isSelected
          ? 'scale-110 bg-[var(--color-cyan)] shadow-md ring-2 ring-[var(--color-cyan)]'
          : isHintable
            ? 'bg-[var(--color-gray-bg)] hover:bg-[var(--color-gray-bg)]/80 animate-[hintGlow_2s_ease-in-out_infinite]'
            : 'bg-[var(--color-gray-bg)] hover:bg-[var(--color-gray-bg)]/80 opacity-50'
        }
      `}
      aria-label={item.canonical_noun}
    >
      {item.emoji}
      {showNoun && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--color-nav-bg)] px-2 py-0.5 text-[10px] font-semibold text-white">
          {item.canonical_noun}{item.alt_nouns.length > 0 && ` · ${item.alt_nouns.join(', ')}`}
        </span>
      )}
    </button>
  );
}

export function EmojiPool({ emojis, selectedEmojis, hintableEmojis, onSelect }: EmojiPoolProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 py-4">
      {emojis.map((item) => (
        <EmojiButton
          key={item.emoji}
          item={item}
          isSelected={selectedEmojis.includes(item.emoji)}
          isHintable={!hintableEmojis || hintableEmojis.has(item.emoji)}
          onSelect={() => onSelect(item.emoji)}
        />
      ))}
    </div>
  );
}
