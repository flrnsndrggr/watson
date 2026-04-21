import { useEffect, useState, useMemo } from 'react';
import { ShareButton } from '@/components/shared/ShareButton';
import { ShareImageButton } from '@/components/shared/ShareImageButton';
import { StoryShareButton } from '@/components/shared/StoryShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { StreakPrompt } from '@/components/shared/StreakPrompt';
import { NotificationPrompt } from '@/components/shared/NotificationPrompt';
import { LeaderboardPanel } from '@/components/shared/LeaderboardPanel';
import { StatsPanel } from '@/components/shared/StatsPanel';
import { AdSlot } from '@/components/shared/AdSlot';
import { generateShareText } from '@/lib/share';
import { computeGameStats } from '@/lib/gameStats';
import type { ShareCardData } from '@/lib/shareImage';
import type { SchlagziilHeadline } from '@/types';
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

interface HeadlineReviewItemProps {
  headline: SchlagziilHeadline;
  result: 'correct' | 'wrong' | null;
  revealedAnswer: string | null;
  hintUsed: boolean;
  index: number;
}

function HeadlineReviewItem({
  headline,
  result,
  revealedAnswer,
  hintUsed,
  index,
}: HeadlineReviewItemProps) {
  const isCorrect = result === 'correct';

  // Replace the blank _____ with the revealed answer inline
  const renderedHeadline = revealedAnswer
    ? headline.display.replace(
        /_+/,
        revealedAnswer,
      )
    : headline.display;

  return (
    <div
      className="rounded-lg border-2 px-3 py-2.5 animate-[resultSlideUp_400ms_ease-out_both]"
      style={{
        animationDelay: `${600 + index * 120}ms`,
        borderColor: isCorrect
          ? 'var(--color-green)'
          : 'var(--color-pink)',
        backgroundColor: isCorrect
          ? 'rgba(123, 212, 0, 0.06)'
          : 'rgba(244, 15, 151, 0.06)',
      }}
    >
      {/* Category + result indicator */}
      <div className="flex items-center gap-1.5">
        <span className="inline-block rounded bg-[var(--color-gray-bg)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-gray-text)]">
          {headline.category}
        </span>
        <span className="text-[11px] text-[var(--color-gray-text)]">
          {headline.article_date || headline.article_year}
        </span>
        {hintUsed && (
          <span className="text-[11px]" aria-label="Tipp benutzt">💡</span>
        )}
        <span
          className="ml-auto text-sm"
          aria-label={isCorrect ? 'Richtig' : 'Falsch'}
        >
          {isCorrect ? '✓' : '✗'}
        </span>
      </div>

      {/* Headline with answer highlighted */}
      <p className="mt-1 text-sm leading-snug">
        &laquo;{revealedAnswer
          ? renderedHeadline.split(revealedAnswer).reduce<React.ReactNode[]>(
              (acc, part, i) => {
                if (i > 0) {
                  acc.push(
                    <span
                      key={`answer-${i}`}
                      className={`font-bold ${
                        isCorrect
                          ? 'text-[var(--color-green)]'
                          : 'text-[var(--color-pink)]'
                      }`}
                    >
                      {revealedAnswer}
                    </span>,
                  );
                }
                acc.push(<span key={`text-${i}`}>{part}</span>);
                return acc;
              },
              [],
            )
          : headline.display}&raquo;
      </p>

      {/* Article link */}
      <a
        href={headline.article_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1.5 inline-block text-xs font-semibold text-[var(--color-cyan)] hover:underline"
      >
        watson-Artikel lesen →
      </a>
    </div>
  );
}

export function SchlagziilResult() {
  const { results, revealedAnswers, hintsUsed, puzzle, status, streak } = useSchlagziil();
  const countdown = useNextPuzzleCountdown();

  const correctCount = results.filter((r) => r === 'correct').length;
  const todayBucket = status === 'finished' ? String(correctCount) : undefined;
  const stats = useMemo(
    () => computeGameStats('schlagziil', todayBucket),
    [todayBucket],
  );

  if (status !== 'finished' || !puzzle) return null;
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

      {/* Headline review — always visible, the key product differentiator */}
      <div className="mt-5" role="list" aria-label="Alle Schlagzeilen mit Antworten">
        <h3 className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--color-gray-text)] animate-[resultSlideUp_400ms_ease-out_500ms_both]">
          Alle Schlagzeilen
        </h3>
        <div className="flex flex-col gap-2">
          {puzzle.headlines.map((headline, i) => (
            <HeadlineReviewItem
              key={i}
              headline={headline}
              result={results[i]}
              revealedAnswer={revealedAnswers[i]}
              hintUsed={hintsUsed[i]}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Streak badge */}
      {streak.current >= 1 && (
        <div className="mt-4 flex justify-center animate-[resultSlideUp_400ms_ease-out_250ms_both]">
          <StreakBadge streak={streak} />
        </div>
      )}

      {/* Streak account prompt */}
      <StreakPrompt streak={streak} />

      {/* Notification opt-in */}
      <NotificationPrompt />

      {/* Leaderboard */}
      <LeaderboardPanel gameType="schlagziil" puzzleDate={puzzle.date} showTime />

      {/* Personal statistics */}
      <StatsPanel stats={stats} distributionLabel="Treffer-Verteilung" />

      {/* Share buttons */}
      <div className="mt-5 flex items-center justify-center gap-2 animate-[resultSlideUp_400ms_ease-out_800ms_both]">
        <ShareButton text={shareText} label="Ergebnis teilen" game="schlagziil" />
        <ShareImageButton cardData={cardData} game="schlagziil" />
        <StoryShareButton cardData={cardData} game="schlagziil" />
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
