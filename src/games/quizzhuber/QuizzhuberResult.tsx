import { useEffect, useMemo, useState } from 'react';
import { useQuizzhuber } from './useQuizzhuber';
import { ShareButton } from '@/components/shared/ShareButton';
import { ShareImageButton } from '@/components/shared/ShareImageButton';
import { StoryShareButton } from '@/components/shared/StoryShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { LeaderboardPanel } from '@/components/shared/LeaderboardPanel';
import { StatsPanel } from '@/components/shared/StatsPanel';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { StreakPrompt } from '@/components/shared/StreakPrompt';
import { NotificationPrompt } from '@/components/shared/NotificationPrompt';
import { AdSlot } from '@/components/shared/AdSlot';
import { generateShareText } from '@/lib/share';
import { computeGameStats } from '@/lib/gameStats';
import type { ShareCardData } from '@/lib/shareImage';

interface PerformanceTier {
  heading: string;
  sub: string;
  accentClass: string;
}

function getPerformanceTier(correct: number, total: number): PerformanceTier {
  const ratio = correct / total;
  if (ratio === 1) {
    return {
      heading: 'Perfekt!',
      sub: 'Alles richtig — bisch en wandelndi Enzyklopädie.',
      accentClass: 'text-[var(--color-pink)]',
    };
  }
  if (ratio >= 0.8) {
    return {
      heading: 'Beachtlich.',
      sub: 'Fast alles gwüsst — starke Leischtig.',
      accentClass: 'text-[var(--color-green)]',
    };
  }
  if (ratio >= 0.5) {
    return {
      heading: 'Geht so.',
      sub: 'Meh als d Hälfti — solidi Basis.',
      accentClass: 'text-[var(--color-cyan)]',
    };
  }
  return {
    heading: 'Nächschts Mal!',
    sub: 'Übig macht de Meischter — nächschti Wuche gits es nöis.',
    accentClass: 'text-[var(--color-gray-text)]',
  };
}

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

export function QuizzhuberResult() {
  const { puzzle, answers, streak } = useQuizzhuber();
  const countdown = useNextPuzzleCountdown();

  const correct = puzzle
    ? puzzle.questions.reduce(
        (sum, q, i) => sum + (answers[i] === q.correct_index ? 1 : 0),
        0,
      )
    : 0;
  const todayBucket = String(correct);
  const stats = useMemo(
    () => computeGameStats('quizzhuber', todayBucket),
    [todayBucket],
  );

  if (!puzzle) return null;

  const total = puzzle.questions.length;
  const pct = Math.round((correct / total) * 100);
  const tier = getPerformanceTier(correct, total);

  const emojiSquares = puzzle.questions.map((q, i) =>
    answers[i] === q.correct_index ? '🟩' : '🟥',
  );

  const shareText = generateShareText(
    'quizzhuber',
    puzzle.date ?? String(puzzle.episode),
    `Quizz den Huber #${puzzle.episode} — ${correct}/${total}\n${emojiSquares.join('')}`,
  );

  const cardData: ShareCardData = {
    gameName: 'Quizz den Huber',
    gamePath: 'quizzhuber',
    puzzleId: String(puzzle.episode),
    heading: tier.heading,
    subheading: `${correct}/${total} richtig (${pct}%)`,
    accentColor: correct === total ? '#F40F97' : correct >= total / 2 ? '#7BD400' : '#8A8A8A',
    grid: { type: 'schlagloch', results: emojiSquares.map(e => e === '🟩' ? 'correct' as const : 'wrong' as const), hints: puzzle.questions.map(() => false) },
    stats: `${correct}/${total} richtig`,
  };

  return (
    <div
      className="mt-6 animate-[resultSlideUp_400ms_ease-out]"
      role="region"
      aria-label={`Ergebnis: ${correct} von ${total} richtig`}
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
        <span className="font-[family-name:var(--font-heading)] text-5xl font-black">
          {correct}
        </span>
        <span className="text-2xl text-[var(--color-gray-text)]">/{total}</span>
        <p className="mt-1 text-xs text-[var(--color-gray-text)]">{pct}% richtig</p>
      </div>

      {/* Emoji accuracy grid */}
      <div
        className="mx-auto mt-4 flex items-center justify-center gap-1"
        aria-label="Ergebnis-Raster"
      >
        {emojiSquares.map((square, i) => (
          <span
            key={i}
            className="animate-[emojiRowPop_300ms_ease-out_both] text-2xl"
            style={{ animationDelay: `${300 + i * 80}ms` }}
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

      {/* Per-question review */}
      <div className="mt-6 text-left" role="list" aria-label="Alle Fragen">
        <h3 className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-[var(--color-gray-text)] animate-[resultSlideUp_400ms_ease-out_500ms_both]">
          Alle Fragen
        </h3>
        <div className="flex flex-col gap-2">
          {puzzle.questions.map((q, i) => {
            const userIdx = answers[i];
            const isCorrect = userIdx === q.correct_index;
            return (
              <div
                key={i}
                className={`animate-[resultSlideUp_400ms_ease-out_both] rounded-lg border-2 p-3 ${
                  isCorrect
                    ? 'border-[var(--color-green)]/40 bg-[var(--color-green)]/[0.04]'
                    : 'border-[var(--color-pink)]/40 bg-[var(--color-pink)]/[0.04]'
                }`}
                style={{ animationDelay: `${550 + i * 60}ms` }}
              >
                <p className="text-sm font-semibold">
                  {i + 1}. {q.prompt}
                </p>
                <p className="mt-1 text-xs text-[var(--color-gray-text)]">
                  Richtig:{' '}
                  <span className="font-semibold text-[var(--color-black)]">
                    {q.options[q.correct_index]}
                  </span>
                  {!isCorrect && userIdx !== null && (
                    <>
                      {' · Deine Antwort: '}
                      <span className="text-[var(--color-pink)]">{q.options[userIdx]}</span>
                    </>
                  )}
                </p>
                {q.explanation && (
                  <p className="mt-1 text-xs text-[var(--color-gray-text)]">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak account prompt */}
      <StreakPrompt streak={streak} />

      {/* Notification opt-in */}
      <NotificationPrompt />

      {/* Leaderboard */}
      <LeaderboardPanel gameType="quizzhuber" puzzleDate={puzzle.date} />

      {/* Personal statistics */}
      <StatsPanel stats={stats} distributionLabel="Ergebnis-Verteilung" />

      {/* Share buttons */}
      <div className="mt-5 flex items-center justify-center gap-2 animate-[resultSlideUp_400ms_ease-out_800ms_both]">
        <ShareButton text={shareText} label="Ergebnis teilen" game="quizzhuber" />
        <ShareImageButton cardData={cardData} game="quizzhuber" />
        <StoryShareButton cardData={cardData} game="quizzhuber" />
      </div>

      {/* Puzzle date */}
      <p className="mt-2 text-center text-xs text-[var(--color-gray-text)]">
        Quizz den Huber #{puzzle.episode}
      </p>

      {/* Next puzzle countdown */}
      <div className="mt-4 text-center animate-[resultSlideUp_400ms_ease-out_900ms_both]">
        <p className="text-xs text-[var(--color-gray-text)]">
          Nächschts Quizz in{' '}
          <span className="font-semibold text-[var(--color-black)]">
            {countdown}
          </span>
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <AdSlot type="mrec" />
      </div>

      <PostGameSection currentGame="quizzhuber" />
    </div>
  );
}
