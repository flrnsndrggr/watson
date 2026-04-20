import { useEffect, useState } from 'react';
import { ShareButton } from '@/components/shared/ShareButton';
import { ShareImageButton } from '@/components/shared/ShareImageButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { StreakPrompt } from '@/components/shared/StreakPrompt';
import { LeaderboardPanel } from '@/components/shared/LeaderboardPanel';
import { AdSlot } from '@/components/shared/AdSlot';
import { generateShareText } from '@/lib/share';
import type { ShareCardData } from '@/lib/shareImage';
import { useSchlagziil } from './useSchlagziil';

interface PerformanceTier {
  heading: string;
  sub: string;
  accentClass: string;
}

function getPerformanceTier(correctCount: number): PerformanceTier {
  if (correctCount === 5) {
    return {
      heading: 'Perfekt!',
      sub: 'Alle 5 Schlagzeilen — du bist à jour!',
      accentClass: 'text-[var(--color-pink)]',
    };
  }
  if (correctCount === 4) {
    return {
      heading: 'Stark!',
      sub: 'Fast alles gewusst — starke Leistung.',
      accentClass: 'text-[var(--color-green)]',
    };
  }
  if (correctCount === 3) {
    return {
      heading: 'Guet!',
      sub: 'Mehr als die Hälfte — solide.',
      accentClass: 'text-[var(--color-cyan)]',
    };
  }
  if (correctCount === 2) {
    return {
      heading: 'Nicht schlecht!',
      sub: 'watson lesen hilft — morgen klappts besser.',
      accentClass: 'text-[var(--color-blue)]',
    };
  }
  return {
    heading: 'Nächstes Mal!',
    sub: 'Jede Runde macht dich besser.',
    accentClass: 'text-[var(--color-gray-text)]',
  };
}

const TIER_HEX: Record<string, string> = {
  'text-[var(--color-pink)]': '#F40F97',
  'text-[var(--color-green)]': '#7BD400',
  'text-[var(--color-cyan)]': '#00C6FF',
  'text-[var(--color-blue)]': '#0F6CF5',
  'text-[var(--color-gray-text)]': '#777777',
};

function useNextPuzzleCountdown(): string {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function update() {
      const now = new Date();
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

export function SchlagziilResult() {
  const { results, hintsUsed, puzzle, status, streak } = useSchlagziil();
  const countdown = useNextPuzzleCountdown();

  if (status !== 'finished' || !puzzle) return null;

  const correctCount = results.filter((r) => r === 'correct').length;
  const tier = getPerformanceTier(correctCount);

  // Build accuracy squares
  const accuracySquares = results.map((r, i) => {
    const square = r === 'correct' ? '🟩' : '🟥';
    const hint = hintsUsed[i] ? '💡' : '';
    return `${square}${hint}`;
  });
  const accuracyGrid = accuracySquares.join('');

  const shareText = generateShareText(
    'schlagziil',
    puzzle.date,
    `${correctCount}/5\n${accuracyGrid}\nIch lese watson, und du?`,
  );

  const cardData: ShareCardData = {
    gameName: 'Schlagziil',
    gamePath: 'schlagziil',
    puzzleId: puzzle.date,
    heading: tier.heading,
    subheading: tier.sub,
    accentColor: TIER_HEX[tier.accentClass] ?? '#00C6FF',
    grid: {
      type: 'schlagziil',
      results: results.map((r) => (r === 'correct' ? 'correct' : 'wrong')),
      hints: [...hintsUsed],
    },
    stats: `${correctCount}/5 richtig`,
  };

  return (
    <div
      className="mt-6 animate-[resultSlideUp_400ms_ease-out]"
      role="region"
      aria-label={`Ergebnis: ${correctCount} von 5 richtig`}
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

      {/* Score */}
      <div className="mt-4 text-center animate-[resultSlideUp_400ms_ease-out_200ms_both]">
        <span className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-black)]">
          {correctCount}
        </span>
        <span className="text-lg text-[var(--color-gray-text)]">/5</span>
      </div>

      {/* Accuracy grid — staggered square reveal */}
      <div
        className="mx-auto mt-4 flex items-center justify-center gap-1"
        aria-label="Ergebnis-Raster"
      >
        {accuracySquares.map((square, i) => (
          <span
            key={i}
            className="animate-[emojiRowPop_300ms_ease-out_both] text-2xl"
            style={{ animationDelay: `${300 + i * 100}ms` }}
          >
            {square}
          </span>
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

      {/* Leaderboard */}
      <LeaderboardPanel gameType="schlagziil" puzzleDate={puzzle.date} showTime />

      {/* Share buttons */}
      <div className="mt-5 flex items-center justify-center gap-2 animate-[resultSlideUp_400ms_ease-out_800ms_both]">
        <ShareButton text={shareText} label="Ergebnis teilen" game="schlagziil" />
        <ShareImageButton cardData={cardData} game="schlagziil" />
      </div>

      {/* Puzzle date */}
      <p className="mt-2 text-center text-xs text-[var(--color-gray-text)]">
        Schlagziil #{puzzle.date}
      </p>

      {/* Next puzzle countdown */}
      <div className="mt-4 text-center animate-[resultSlideUp_400ms_ease-out_900ms_both]">
        <p className="text-xs text-[var(--color-gray-text)]">
          Nächsts Schlagziil in{' '}
          <span className="font-semibold text-[var(--color-black)]">
            {countdown}
          </span>
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <AdSlot type="mrec" />
      </div>

      <PostGameSection currentGame="schlagziil" />
    </div>
  );
}
