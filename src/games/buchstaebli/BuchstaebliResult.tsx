import { useEffect, useState } from 'react';
import { ShareButton } from '@/components/shared/ShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { StreakPrompt } from '@/components/shared/StreakPrompt';
import { generateShareText } from '@/lib/share';
import { useBuchstaebli } from './useBuchstaebli';
import type { Rank } from '@/types';

const RANK_LABELS: Record<Rank, string> = {
  stift: 'Stift',
  lehrling: 'Lehrling',
  geselle: 'Geselle',
  meister: 'Meister',
  bundesrat: 'Bundesrat',
};

interface PerformanceTier {
  heading: string;
  sub: string;
  accentClass: string;
}

function getPerformanceTier(rank: Rank): PerformanceTier {
  switch (rank) {
    case 'bundesrat':
      return {
        heading: 'Bundesrat!',
        sub: 'Alle Wörter gefunden — absolut legendär!',
        accentClass: 'text-[var(--color-pink)]',
      };
    case 'meister':
      return {
        heading: 'Meister!',
        sub: 'Hervorragender Wortschatz — fast perfekt.',
        accentClass: 'text-[var(--color-green)]',
      };
    case 'geselle':
      return {
        heading: 'Geselle!',
        sub: 'Starke Leistung — du kennst dich aus.',
        accentClass: 'text-[var(--color-cyan)]',
      };
    case 'lehrling':
      return {
        heading: 'Lehrling!',
        sub: 'Guter Start — morgen findest du mehr.',
        accentClass: 'text-[var(--color-blue)]',
      };
    default:
      return {
        heading: 'Stift!',
        sub: 'Jeder fängt klein an — morgen wird besser.',
        accentClass: 'text-[var(--color-gray-text)]',
      };
  }
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

export function BuchstaebliResult() {
  const { puzzle, foundWords, score, currentRank, streak, status } = useBuchstaebli();
  const countdown = useNextPuzzleCountdown();
  const [showAllWords, setShowAllWords] = useState(false);

  if (status !== 'complete' || !puzzle) return null;

  const tier = getPerformanceTier(currentRank);
  const pangramCount = foundWords.filter((fw) => fw.is_pangram).length;
  const mundartCount = foundWords.filter((fw) => fw.is_mundart).length;

  // Build rank emoji for sharing
  const rankEmojis: Record<Rank, string> = {
    stift: '📝',
    lehrling: '📘',
    geselle: '🔧',
    meister: '🏆',
    bundesrat: '🇨🇭',
  };

  const shareText = generateShareText(
    'buchstaebli',
    puzzle.date,
    `${score} Punkte · ${foundWords.length} Wörter · ${rankEmojis[currentRank]} ${RANK_LABELS[currentRank]}${pangramCount > 0 ? '\n✨ Pangram gefunden!' : ''}`,
  );

  return (
    <div
      className="mt-6 animate-[resultSlideUp_400ms_ease-out]"
      role="region"
      aria-label={`Ergebnis: ${foundWords.length} Wörter gefunden, ${score} Punkte`}
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

      {/* Score + stats */}
      <div className="mt-4 text-center animate-[resultSlideUp_400ms_ease-out_200ms_both]">
        <span className="font-[family-name:var(--font-heading)] text-4xl font-bold text-[var(--color-black)]">
          {score}
        </span>
        <span className="text-lg text-[var(--color-gray-text)]">
          /{puzzle.max_score}
        </span>
        <p className="mt-0.5 text-xs text-[var(--color-gray-text)]">Punkte</p>
        <div className="mt-2 flex items-center justify-center gap-3 text-xs text-[var(--color-gray-text)]">
          <span>{foundWords.length} Wörter</span>
          <span>·</span>
          <span>{RANK_LABELS[currentRank]}</span>
          {pangramCount > 0 && (
            <>
              <span>·</span>
              <span>✨ {pangramCount}× Pangram</span>
            </>
          )}
          {mundartCount > 0 && (
            <>
              <span>·</span>
              <span>🇨🇭 {mundartCount}× Mundart</span>
            </>
          )}
        </div>
      </div>

      {/* Word badges — staggered reveal */}
      {foundWords.length > 0 && (
        <div
          className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-1.5"
          aria-label="Gefundene Wörter"
        >
          {foundWords.map((fw, i) => (
            <span
              key={fw.word}
              className={`animate-[emojiRowPop_300ms_ease-out_both] inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                fw.is_pangram
                  ? 'bg-[var(--color-pink)] text-white'
                  : fw.is_mundart
                    ? 'bg-[var(--color-green)] text-white'
                    : 'bg-[var(--color-gray-bg)] text-[var(--color-black)]'
              }`}
              style={{ animationDelay: `${300 + i * 60}ms` }}
            >
              {fw.word.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {/* Streak badge */}
      {streak.current >= 1 && (
        <div className="mt-4 flex justify-center animate-[resultSlideUp_400ms_ease-out_250ms_both]">
          <StreakBadge streak={streak} />
        </div>
      )}

      {/* Streak account prompt */}
      <StreakPrompt streak={streak} />

      {/* Share button */}
      <div className="mt-5 flex justify-center animate-[resultSlideUp_400ms_ease-out_800ms_both]">
        <ShareButton text={shareText} label="Ergebnis teilen" />
      </div>

      {/* Puzzle date */}
      <p className="mt-2 text-center text-xs text-[var(--color-gray-text)]">
        Buchstäbli #{puzzle.date}
      </p>

      {/* Expandable found words list */}
      <div className="mt-4 animate-[resultSlideUp_400ms_ease-out_900ms_both]">
        <button
          onClick={() => setShowAllWords(!showAllWords)}
          className="mx-auto flex items-center gap-1 text-xs text-[var(--color-gray-text)] hover:text-[var(--color-cyan)]"
        >
          {showAllWords ? 'Wörter ausblenden' : 'Alle Wörter anzeigen'}
          <span
            className={`inline-block transition-transform ${showAllWords ? 'rotate-180' : ''}`}
          >
            ▾
          </span>
        </button>

        {showAllWords && (
          <div className="mt-2 flex flex-col gap-1">
            {foundWords.map((fw) => (
              <div
                key={fw.word}
                className={`flex items-center justify-between rounded px-3 py-1.5 text-sm ${
                  fw.is_pangram
                    ? 'bg-[var(--color-pink)]/10 text-[var(--color-black)]'
                    : fw.is_mundart
                      ? 'bg-[var(--color-green)]/10 text-[var(--color-black)]'
                      : 'bg-[var(--color-gray-bg)] text-[var(--color-black)]'
                }`}
              >
                <span>
                  <span className="font-semibold">{fw.word.toUpperCase()}</span>
                  {fw.is_pangram && <span className="ml-1">✨</span>}
                  {fw.is_mundart && <span className="ml-1">🇨🇭</span>}
                </span>
                <span className="text-xs text-[var(--color-gray-text)]">
                  {fw.points}pt
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next puzzle countdown */}
      <div className="mt-4 text-center animate-[resultSlideUp_400ms_ease-out_1000ms_both]">
        <p className="text-xs text-[var(--color-gray-text)]">
          Nächsts Buchstäbli in{' '}
          <span className="font-semibold text-[var(--color-black)]">
            {countdown}
          </span>
        </p>
      </div>

      <PostGameSection currentGame="buchstaebli" />
    </div>
  );
}
