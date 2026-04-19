import { useEffect, useState } from 'react';
import { ShareButton } from '@/components/shared/ShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { StreakPrompt } from '@/components/shared/StreakPrompt';
import { LeaderboardPanel } from '@/components/shared/LeaderboardPanel';
import { generateShareText } from '@/lib/share';
import { useVerbindige } from './useVerbindige';

const DIFFICULTY_EMOJIS: Record<number, string> = {
  1: '🟨',
  2: '🟩',
  3: '🟦',
  4: '🟪',
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Einfach',
  2: 'Mittel',
  3: 'Schwer',
  4: 'Knifflig',
};

const DIFFICULTY_BG: Record<number, string> = {
  1: 'bg-[var(--color-difficulty-1)]',
  2: 'bg-[var(--color-difficulty-2)]',
  3: 'bg-[var(--color-difficulty-3)]',
  4: 'bg-[var(--color-difficulty-4)]',
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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function VerbindigeResult() {
  const { solvedGroups, status, puzzle, mistakes, maxMistakes, streak, elapsedSeconds } =
    useVerbindige();
  const countdown = useNextPuzzleCountdown();
  const [showGroups, setShowGroups] = useState(false);

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

  const won = status === 'won';
  const timeSuffix = elapsedSeconds != null ? ` ${formatTime(elapsedSeconds)}` : '';
  const shareText = generateShareText(
    'verbindige',
    puzzle?.date ?? 1,
    `${won ? `${mistakes}/4 Fehler` : 'Knapp daneben'}${timeSuffix}\n${emojiGrid}`,
  );

  return (
    <div
      className="mt-6 animate-[resultSlideUp_400ms_ease-out]"
      role="region"
      aria-label={`${won ? 'Gewonnen' : 'Verloren'} mit ${mistakes} Fehlern`}
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

      {/* Mistakes + time summary */}
      <div className="mt-4 text-center animate-[resultSlideUp_400ms_ease-out_200ms_both]">
        <div className="flex items-center justify-center gap-1.5">
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
        {elapsedSeconds != null && (
          <p className="mt-1.5 text-xs text-[var(--color-gray-text)]">
            {formatTime(elapsedSeconds)}
          </p>
        )}
      </div>

      {/* Emoji grid — staggered row reveal */}
      <div
        className="mx-auto mt-4 flex flex-col items-center gap-1"
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

      {/* Streak badge */}
      {streak.current >= 1 && (
        <div className="mt-4 flex justify-center animate-[resultSlideUp_400ms_ease-out_250ms_both]">
          <StreakBadge streak={streak} />
        </div>
      )}

      {/* Streak account prompt */}
      <StreakPrompt streak={streak} />

      {/* Leaderboard */}
      <LeaderboardPanel gameType="verbindige" puzzleDate={puzzle?.date} showTime />

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

      {/* Expandable group review */}
      <div className="mt-4 animate-[resultSlideUp_400ms_ease-out_900ms_both]">
        <button
          onClick={() => setShowGroups(!showGroups)}
          className="mx-auto flex items-center gap-1 text-xs text-[var(--color-gray-text)] hover:text-[var(--color-cyan)]"
        >
          {showGroups ? 'Gruppen ausblenden' : 'Alle Gruppen anzeigen'}
          <span
            className={`inline-block transition-transform ${showGroups ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
        </button>

        {showGroups && puzzle && (
          <div className="mt-2 flex flex-col gap-1.5">
            {puzzle.groups
              .sort((a, b) => a.difficulty - b.difficulty)
              .map((group) => (
                <div
                  key={group.category}
                  className={`rounded-[var(--game-tile-radius)] px-3 py-2 text-white ${DIFFICULTY_BG[group.difficulty]}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {group.category_label ?? group.category}
                    </span>
                    <span className="text-[10px] opacity-75">
                      {DIFFICULTY_LABELS[group.difficulty]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs opacity-90">
                    {group.items.map((item) => (
                      <span key={item.text}>
                        {item.text}
                        {item.hochdeutsch && (
                          <span className="opacity-70"> = {item.hochdeutsch}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Next puzzle countdown */}
      <div className="mt-4 text-center animate-[resultSlideUp_400ms_ease-out_1000ms_both]">
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
