import { useState } from 'react';
import type { EmojiItem } from '@/types';

interface EmojiPoolProps {
  emojis: EmojiItem[];
  selectedEmojis: string[];
  hintableEmojis?: Set<string>;
  onSelect: (emoji: string) => void;
}

function EmojiButton({ item, isSelected, hintMode, isHintable, onSelect }: { item: EmojiItem; isSelected: boolean; hintMode: boolean; isHintable: boolean; onSelect: () => void }) {
  const [showNoun, setShowNoun] = useState(false);

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.setData('text/plain', item.emoji);
    e.dataTransfer.effectAllowed = 'copy';
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  }

  function handleDragEnd(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).style.opacity = '';
  }

  // Three visual states:
  // 1. Selected: cyan highlight (always wins)
  // 2. Hint mode + hintable: pulsing glow draws attention to productive emojis
  // 3. Hint mode + not hintable: dimmed — this emoji has no remaining compounds
  // 4. Normal (no hint): equal neutral styling for all
  let stateClass: string;
  if (isSelected) {
    stateClass = 'scale-110 bg-[var(--color-cyan)] shadow-md ring-2 ring-[var(--color-cyan)]';
  } else if (hintMode && isHintable) {
    stateClass = 'bg-[var(--color-gray-bg)] hover:bg-[var(--color-gray-bg)]/80 animate-[hintGlow_2s_ease-in-out_infinite]';
  } else if (hintMode) {
    stateClass = 'bg-[var(--color-gray-bg)] hover:bg-[var(--color-gray-bg)]/80 opacity-40';
  } else {
    stateClass = 'bg-[var(--color-gray-bg)] hover:bg-[var(--color-gray-bg)]/80';
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
        ${stateClass}
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
  const hintMode = !!hintableEmojis;

  return (
    <div className="flex flex-wrap justify-center gap-3 py-4">
      {emojis.map((item) => (
        <EmojiButton
          key={item.emoji}
          item={item}
          isSelected={selectedEmojis.includes(item.emoji)}
          hintMode={hintMode}
          isHintable={hintMode && hintableEmojis.has(item.emoji)}
          onSelect={() => onSelect(item.emoji)}
        />
      ))}
    </div>
  );
}
