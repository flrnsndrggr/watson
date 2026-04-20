import { useVerbindige } from './useVerbindige';
import { VerbindigeTile } from './VerbindigeTile';
import { SolvedGroup } from './SolvedGroup';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

const REVEAL_DELAY_MS = 700;
const FADE_DELAY_MS = 400;

// External store for timer-driven reveal sequence — avoids setState-in-effect.
let _revealCount = 0;
let _started = false;
let _timers: ReturnType<typeof setTimeout>[] = [];
const _listeners = new Set<() => void>();

function revealSubscribe(cb: () => void) {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}
function revealGetSnapshot() { return _revealCount; }
function revealNotify() { _listeners.forEach((l) => l()); }

function startReveal(groupCount: number, onComplete?: () => void) {
  if (_started) return;
  _started = true;

  for (let i = 0; i < groupCount; i++) {
    const t = setTimeout(() => {
      _revealCount = i + 1;
      revealNotify();
    }, FADE_DELAY_MS + i * REVEAL_DELAY_MS);
    _timers.push(t);
  }

  const completeTimer = setTimeout(() => {
    onComplete?.();
  }, FADE_DELAY_MS + groupCount * REVEAL_DELAY_MS + 400);
  _timers.push(completeTimer);
}

function resetReveal() {
  _timers.forEach(clearTimeout);
  _timers = [];
  _revealCount = 0;
  _started = false;
  revealNotify();
}

interface VerbindigeBoardProps {
  shufflePhase?: 'idle' | 'out' | 'in';
  onRevealComplete?: () => void;
}

export function VerbindigeBoard({ shufflePhase = 'idle', onRevealComplete }: VerbindigeBoardProps) {
  const {
    remainingItems,
    selected,
    solvedGroups,
    status,
    toggleItem,
    lastGuessResult,
    lastWrongItems,
    pendingCorrect,
    confirmCorrectGroup,
    clearLastResult,
    clearWrongItems,
  } = useVerbindige();

  const [wrongItems, setWrongItems] = useState<Set<string>>(new Set());
  const [collapsingItems, setCollapsingItems] = useState<Set<string>>(new Set());
  const revealedCount = useSyncExternalStore(revealSubscribe, revealGetSnapshot);

  // FLIP animation: smooth layout transition for remaining tiles after a group is confirmed
  const tileRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const firstRects = useRef<Map<string, DOMRect> | null>(null);
  const flipPending = useRef(false);

  const setTileRef = useCallback((key: string) => (el: HTMLButtonElement | null) => {
    if (el) tileRefs.current.set(key, el);
    else tileRefs.current.delete(key);
  }, []);

  // Separate player-solved groups from loss-revealed groups
  const playerSolved = solvedGroups.filter((g) => !g.revealedOnLoss);
  const lossRevealed = solvedGroups.filter((g) => g.revealedOnLoss);
  const lossRevealedCount = lossRevealed.length;

  // Derive fadingOut from game state — no useState needed
  const fadingOut = status === 'lost' && lossRevealedCount > 0;

  // Start staggered loss reveal
  useEffect(() => {
    if (status === 'lost' && lossRevealedCount > 0) {
      startReveal(lossRevealedCount, onRevealComplete);
    }
  }, [status, lossRevealedCount, onRevealComplete]);

  // Reset reveal state on new puzzle
  useEffect(() => {
    if (status === 'playing') {
      resetReveal();
    }
  }, [status]);

  // Handle wrong guess feedback
  useEffect(() => {
    if (lastGuessResult === 'wrong' || lastGuessResult === 'one-away') {
      const items = new Set(lastWrongItems.map((s) => s.text));
      queueMicrotask(() => setWrongItems(items));
      const timer = setTimeout(() => {
        setWrongItems(new Set());
        clearWrongItems();
        clearLastResult();
      }, 500);
      return () => clearTimeout(timer);
    }

    // Clear duplicate result without visual feedback (toast handles it)
    if (lastGuessResult === 'duplicate') {
      const timer = setTimeout(clearLastResult, 300);
      return () => clearTimeout(timer);
    }
  }, [lastGuessResult, lastWrongItems, clearLastResult, clearWrongItems]);

  // Correct guess: two-phase animation
  // Phase 1 (0–400ms): tiles flash difficulty color with bounce
  // Phase 2 (400–700ms): tiles collapse, then confirmCorrectGroup resolves the state
  // Phase 3 (700ms+): remaining tiles FLIP-animate to new grid positions
  useEffect(() => {
    if (!pendingCorrect) return;

    // Phase 2: collapse tiles after bounce completes
    const collapseTimer = setTimeout(() => {
      setCollapsingItems(new Set(pendingCorrect.itemTexts));
    }, 400);

    // Phase 3: snapshot remaining tile positions, then confirm group
    const confirmTimer = setTimeout(() => {
      // FLIP "First": capture positions of tiles that will remain
      const rects = new Map<string, DOMRect>();
      tileRefs.current.forEach((el, key) => {
        if (pendingCorrect.itemTexts.has(key)) return;
        rects.set(key, el.getBoundingClientRect());
      });
      firstRects.current = rects;
      flipPending.current = true;

      confirmCorrectGroup();
      clearLastResult();
    }, 700);

    return () => {
      clearTimeout(collapseTimer);
      clearTimeout(confirmTimer);
      setCollapsingItems(new Set());
    };
  }, [pendingCorrect, confirmCorrectGroup, clearLastResult]);

  // FLIP "Last, Invert, Play": after React re-renders with fewer tiles,
  // animate them from their old positions to their new ones.
  useLayoutEffect(() => {
    if (!flipPending.current || !firstRects.current) return;
    flipPending.current = false;
    const first = firstRects.current;
    firstRects.current = null;

    const toAnimate: Array<{ el: HTMLElement; dx: number; dy: number }> = [];

    tileRefs.current.forEach((el, key) => {
      const firstRect = first.get(key);
      if (!firstRect) return;
      const lastRect = el.getBoundingClientRect();
      const dx = firstRect.left - lastRect.left;
      const dy = firstRect.top - lastRect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      toAnimate.push({ el, dx, dy });
    });

    if (toAnimate.length === 0) return;

    // Invert: place tiles at their old positions
    for (const { el, dx, dy } of toAnimate) {
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    }

    // Play: animate to new positions on the next frame
    requestAnimationFrame(() => {
      for (const { el } of toAnimate) {
        el.style.transition = 'transform 300ms ease-out';
        el.style.transform = '';
      }
      // Clean up inline styles after animation completes
      setTimeout(() => {
        for (const { el } of toAnimate) {
          el.style.transition = '';
          el.style.transform = '';
        }
      }, 350);
    });
  }, [remainingItems]);

  const isPlaying = status === 'playing';
  const visibleLossGroups = lossRevealed.slice(0, revealedCount);

  return (
    <div className="flex flex-col gap-2">
      {/* Player-solved groups (always visible, sorted by difficulty) */}
      {playerSolved
        .sort((a, b) => a.difficulty - b.difficulty)
        .map((group) => (
          <SolvedGroup key={group.category} group={group} />
        ))}

      {/* Remaining items grid — fades out on loss */}
      {remainingItems.length > 0 && (
        <div
          className={`grid grid-cols-4 gap-[var(--game-tile-gap)] ${
            fadingOut ? 'animate-[tileFadeOut_350ms_ease-out_forwards]' : ''
          }`}
        >
          {remainingItems.map((item, index) => (
            <VerbindigeTile
              key={item.text}
              ref={setTileRef(item.text)}
              item={item}
              isSelected={selected.some((s) => s.text === item.text)}
              isWrong={wrongItems.has(item.text)}
              onToggle={() => toggleItem(item)}
              disabled={!isPlaying || pendingCorrect != null}
              shufflePhase={shufflePhase}
              index={index}
              correctDifficulty={
                pendingCorrect?.itemTexts.has(item.text)
                  ? pendingCorrect.group.difficulty
                  : undefined
              }
              isCollapsing={collapsingItems.has(item.text)}
            />
          ))}
        </div>
      )}

      {/* Loss-revealed groups (staggered, with unveil animation) */}
      {visibleLossGroups
        .sort((a, b) => a.difficulty - b.difficulty)
        .map((group) => (
          <SolvedGroup
            key={group.category}
            group={group}
            isReveal
          />
        ))}
    </div>
  );
}
