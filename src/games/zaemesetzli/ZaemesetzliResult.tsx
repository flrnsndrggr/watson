import { useEffect, useState } from 'react';
import { ShareButton } from '@/components/shared/ShareButton';
import { ShareImageButton } from '@/components/shared/ShareImageButton';
import { StoryShareButton } from '@/components/shared/StoryShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { StreakBadge } from '@/components/shared/StreakBadge';
import { StreakPrompt } from '@/components/shared/StreakPrompt';
import { NotificationPrompt } from '@/components/shared/NotificationPrompt';
import { LeaderboardPanel } from '@/components/shared/LeaderboardPanel';
import { generateShareText } from '@/lib/share';
import type { ShareCardData } from '@/lib/shareImage';
import { useZaemesetzli } from './useZaemesetzli';
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
        sub: 'Alle Wörter, maximale Punkte — chapeau!',
        accentClass: 'text-[var(--color-pink)]',
      };
    case 'meister':
      return {
        heading: 'Meister!',
        sub: 'Hervorragend kombiniert — fast perfekt.',
        accentClass: 'text-[var(--color-green)]',
      };
    case 'geselle':
      return {
        heading: 'Geselle!',
        sub: 'Starke Leistung — solide Wortkenntnis.',
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
        heading: 'Komplett!',
        sub: 'Alle Wörter gefunden — weiter so!',
        accentClass: 'text-[var(--color-cyan)]',
      };
  }
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

export function ZaemesetzliResult() {
  const { puzzle, foundWords, score, currentRank, hintsUsed, streak, status } =
    useZaemesetzli();
  const countdown = useNextPuzzleCountdown();
  const [showAllWords, setShowAllWords] = useState(false);

  if ((status !== 'complete' && status !== 'finished') || !puzzle) return null;

  const foundWordSet = new Set(foundWords.map((fw) => fw.word.toLowerCase()));
  const unfoundWords = puzzle.valid_compounds.filter(
    (c) => !foundWordSet.has(c.word.toLowerCase()),
  );

  const tier = getPerformanceTier(currentRank);
  const mundartCount = foundWords.filter((fw) => fw.is_mundart).length;

  // Build emoji compound grid for sharing
  const compoundEmojis = foundWords
    .slice(0, 8)
    .map((fw) => fw.components.join(''))
    .join(' ');
  const extraCount = foundWords.length > 8 ? `+${foundWords.length - 8}` : '';

  const shareText = generateShareText(
    'zaemesetzli',
    puzzle.date,
    `${foundWords.length}/${puzzle.valid_compounds.length} · ${score} Pkt · ${RANK_LABELS[currentRank]}\n${compoundEmojis}${extraCount ? ` ${extraCount}` : ''}`,
  );

  const cardData: ShareCardData = {
    gameName: 'Zämesetzli',
    gamePath: 'zaemesetzli',
    puzzleId: puzzle.date,
    heading: tier.heading,
    subheading: tier.sub,
    accentColor: TIER_HEX[tier.accentClass] ?? '#00C6FF',
    grid: {
      type: 'zaemesetzli',
      found: foundWords.length,
      total: puzzle.valid_compounds.length,
      rank: RANK_LABELS[currentRank],
      score,
      maxScore: puzzle.max_score,
    },
    stats: mundartCount > 0
      ? `${score} Pkt · ${RANK_LABELS[currentRank]} · ${mundartCount}× Mundart`
      : `${score} Pkt · ${RANK_LABELS[currentRank]}`,
  };

  return (
    <div
      className="mt-6 animate-[resultSlideUp_400ms_ease-out]"
      role="region"
      aria-label={`Ergebnis: ${foundWords.length} von ${puzzle.valid_compounds.length} Wörter gefunden`}
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
          {foundWords.length}
        </span>
        <span className="text-lg text-[var(--color-gray-text)]">
          /{puzzle.valid_compounds.length}
        </span>
        <div className="mt-1 flex items-center justify-center gap-3 text-xs text-[var(--color-gray-text)]">
          <span>{score} Punkte</span>
          <span>·</span>
          <span>{RANK_LABELS[currentRank]}</span>
          {mundartCount > 0 && (
            <>
              <span>·</span>
              <span>🇨🇭 {mundartCount}× Mundart</span>
            </>
          )}
          {hintsUsed > 0 && (
            <>
              <span>·</span>
              <span>💡 {hintsUsed}× Tipp</span>
            </>
          )}
        </div>
      </div>

      {/* Emoji compound grid — staggered reveal */}
      <div
        className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-1.5"
        aria-label="Gefundene Kombinationen"
      >
        {foundWords.map((fw, i) => (
          <span
            key={fw.word}
            className="animate-[emojiRowPop_300ms_ease-out_both] text-xl"
            style={{ animationDelay: `${300 + i * 60}ms` }}
            title={fw.word}
          >
            {fw.components.join('')}
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

      {/* Notification opt-in */}
      <NotificationPrompt />

      {/* Leaderboard */}
      <LeaderboardPanel gameType="zaemesetzli" puzzleDate={puzzle.date} />

      {/* Share buttons */}
      <div className="mt-5 flex items-center justify-center gap-2 animate-[resultSlideUp_400ms_ease-out_800ms_both]">
        <ShareButton text={shareText} label="Ergebnis teilen" game="zaemesetzli" />
        <ShareImageButton cardData={cardData} game="zaemesetzli" />
        <StoryShareButton cardData={cardData} game="zaemesetzli" />
      </div>

      {/* Puzzle date */}
      <p className="mt-2 text-center text-xs text-[var(--color-gray-text)]">
        Zämesetzli #{puzzle.date}
      </p>

      {/* Expandable words list — found + unfound */}
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
                  fw.is_mundart
                    ? 'bg-[var(--color-green)]/10 text-[var(--color-black)]'
                    : 'bg-[var(--color-gray-bg)] text-[var(--color-black)]'
                }`}
              >
                <span>
                  {fw.components.join('')}{' '}
                  <span className="font-semibold">{fw.word}</span>
                  {fw.is_mundart && <span className="ml-1">🇨🇭</span>}
                </span>
                <span className="text-xs text-[var(--color-gray-text)]">
                  {fw.points}pt
                </span>
              </div>
            ))}
            {unfoundWords.length > 0 && (
              <>
                <div className="mt-2 mb-1 text-xs font-semibold text-[var(--color-gray-text)]">
                  Nicht gefunden:
                </div>
                {unfoundWords.map((c) => (
                  <div
                    key={c.word}
                    className="flex items-center justify-between rounded px-3 py-1.5 text-sm bg-[var(--color-gray-bg)]/50 text-[var(--color-gray-text)]"
                  >
                    <span>
                      {c.components.join('')}{' '}
                      <span className="font-semibold">{c.word}</span>
                      {c.is_mundart && <span className="ml-1">🇨🇭</span>}
                    </span>
                    <span className="text-xs">
                      {c.points}pt
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Next puzzle countdown */}
      <div className="mt-4 text-center animate-[resultSlideUp_400ms_ease-out_1000ms_both]">
        <p className="text-xs text-[var(--color-gray-text)]">
          Nächsts Zämesetzli in{' '}
          <span className="font-semibold text-[var(--color-black)]">
            {countdown}
          </span>
        </p>
      </div>

      <PostGameSection currentGame="zaemesetzli" />
    </div>
  );
}
