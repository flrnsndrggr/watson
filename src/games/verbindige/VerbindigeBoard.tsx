import { useVerbindige } from './useVerbindige';
import { VerbindigeTile } from './VerbindigeTile';
import { SolvedGroup } from './SolvedGroup';
import { useEffect, useState } from 'react';

export function VerbindigeBoard() {
  const {
    remainingItems,
    selected,
    solvedGroups,
    status,
    toggleItem,
    lastGuessResult,
    lastWrongItems,
    clearLastResult,
    clearWrongItems,
  } = useVerbindige();

  const [wrongItems, setWrongItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (lastGuessResult === 'wrong' || lastGuessResult === 'one-away') {
      setWrongItems(new Set(lastWrongItems.map((s) => s.text)));
      const timer = setTimeout(() => {
        setWrongItems(new Set());
        clearWrongItems();
        clearLastResult();
      }, 500);
      return () => clearTimeout(timer);
    }
    if (lastGuessResult === 'correct') {
      const timer = setTimeout(() => clearLastResult(), 300);
      return () => clearTimeout(timer);
    }
  }, [lastGuessResult, lastWrongItems, clearLastResult, clearWrongItems]);

  const isPlaying = status === 'playing';

  return (
    <div className="flex flex-col gap-2">
      {/* Solved groups */}
      {solvedGroups
        .sort((a, b) => a.difficulty - b.difficulty)
        .map((group) => (
          <SolvedGroup key={group.category} group={group} />
        ))}

      {/* Remaining items grid */}
      {remainingItems.length > 0 && (
        <div className="grid grid-cols-4 gap-[var(--game-tile-gap)]">
          {remainingItems.map((item) => (
            <VerbindigeTile
              key={item.text}
              item={item}
              isSelected={selected.some((s) => s.text === item.text)}
              isWrong={wrongItems.has(item.text)}
              onToggle={() => toggleItem(item)}
              disabled={!isPlaying}
            />
          ))}
        </div>
      )}
    </div>
  );
}
