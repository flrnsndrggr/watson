import { useEffect, useState } from 'react';
import { ShareButton } from '@/components/shared/ShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { StreakPrompt } from '@/components/shared/StreakPrompt';
import { generateShareText } from '@/lib/share';
import { useVerbindige } from './useVerbindige';

const DIFFICULTY_EMOJIS: Record<number, string> = {
  1: '🟨',
  2: '🟩',
  3: '🟦',
  4: '🟪',
};

interface PerformanceTier {
  heading: string;
  sub: string;
  accentClass: string;
}

function getPerformanceTier(
  status: 'won' | 'lost',
  mistakes: number,
): PerformanceTier {
  if (status === 'lost') {
    return {
      heading: 'Nächstes Mal!',
      sub: 'Jede Runde macht dich besser.',
      accentClass: 'text-[var(--color-gray-text)]',
    };
  }
  if (mistakes === 0) {
    return {
      heading: 'Perfekt!',
      sub: 'Kein einziger Fehler — chapeau!',
      accentClass: 'text-[var(--color-pink)]',
    };
  }
  if (mistakes === 1) {
    return {
      heading: 'Super gmacht!',
      sub: 'Nur ein Fehler — starke Leistung.',
      accentClass: 'text-[var(--color-green)]',
    };
  }
  if (mistakes === 2) {
    return {
      heading: 'Guet gspilt!',
      sub: 'Solide durchgekämpft.',
      accentClass: 'text-[var(--color-cyan)]',
    };
  }
  return {
    heading: 'Knapp!',
    sub: 'Gerade noch geschafft — Nervenstärke!',
    accentClass: 'text-[var(--color-blue)]',
  };
}

function useNextPuzzleCountdown(): string {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const now = new Date();
      // Next midnight in local time
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

export function VerbindigeResult() {
  const { solvedGroups, status, puzzle, mistakes, maxMistakes, streak } =
    useVerbindige();
  const countdown = useNextPuzzleCountdown();

  if (status !== 'won' && status !== 'lost') return null;

  const tier = getPerformanceTier(status, mistakes);

  // Build emoji grid from solve order
  const orderedGroups = [...solvedGroups].sort(
    (a, b) => a.guessOrder - b.guessOrder,
  );
  const emojiRows = orderedGroups.map(
    (g) => DIFFICULTY_EMOJIS[g.difficulty].repeat(4),
  );
  const emojiGrid = emojiRows.join('\n');

  const shareText = generateShareText(
    'verbindige',
    puzzle?.date ?? 1,
    emojiGrid,
  );

  return (
    <div
      className="mt-6 animate-[resultSlideUp_400ms_ease-out]"
      role="region"
      aria-label={status === 'won' ? 'Gewonnen' : 'Verloren'}
    >
      {/* Divider */}
      <div className="mx-auto mb-5 h-px w-16 bg-[var(--color-gray-bg)]" />

      {/* Performance heading */}
      <div className="text-center animate-[resultSlideUp_400ms_ease-out_100ms_both]">
        <h2
          className={`font-[family-name:var(--font-heading)] text-2xl font-bold ${tier.accentClass}`}
        >
          {tier.heading}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-gray-text)]">{tier.sub}</p>
      </div>

      {/* Mistakes summary */}
      <div className="mt-4 flex items-center justify-center gap-1.5 animate-[resultSlideUp_400ms_ease-out_200ms_both]">
        <span className="mr-1 text-xs font-semibold text-[var(--color-gray-text)]">
          Fehler:
        </span>
        {Array.from({ length: maxMistakes }, (_, i) => (
          <span
            key={i}
            className={`inline-block h-2.5 w-2.5 rounded-full transition-colors ${
              i < mistakes
                ? 'bg-[var(--color-pink)]'
                : 'bg-[var(--color-gray-bg)]'
            }`}
          />
        ))}
      </div>

      {/* Streak badge */}
      {streak.current >= 1 && (
        <div className="mt-4 flex justify-center animate-[resultSlideUp_400ms_ease-out_250ms_both]">
          <StreakBadge streak={streak} />
        </div>
      )}

      {/* Streak account prompt */}
      <StreakPrompt streak={streak} />

      {/* Emoji grid — staggered row reveal */}
      <div
        className="mx-auto mt-5 flex flex-col items-center gap-1"
        aria-label="Ergebnis-Raster"
      >
        {emojiRows.map((row, i) => (
          <div
            key={i}
            className="animate-[emojiRowPop_300ms_ease-out_both] text-2xl leading-relaxed tracking-wider"
            style={{ animationDelay: `${300 + i * 120}ms` }}
          >
            {row}
          </div>
        ))}
      </div>

      {/* Share button */}
      <div className="mt-5 flex justify-center animate-[resultSlideUp_400ms_ease-out_800ms_both]">
        <ShareButton text={shareText} label="Ergebnis teilen" />
      </div>

      {/* Puzzle number */}
      {puzzle && (
        <p className="mt-2 text-center text-xs text-[var(--color-gray-text)]">
          Verbindige #{puzzle.date}
        </p>
      )}

      {/* Next puzzle countdown */}
      <div className="mt-4 text-center animate-[resultSlideUp_400ms_ease-out_900ms_both]">
        <p className="text-xs text-[var(--color-gray-text)]">
          Nächsts Verbindige in{' '}
          <span className="font-semibold text-[var(--color-black)]">
            {countdown}
          </span>
        </p>
      </div>

      <PostGameSection currentGame="verbindige" />
    </div>
  );
}
