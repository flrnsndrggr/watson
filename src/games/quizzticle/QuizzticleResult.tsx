import { useQuizzticle } from './useQuizzticle';
import { ShareButton } from '@/components/shared/ShareButton';
import { PostGameSection } from '@/components/shared/PostGameSection';
import { LeaderboardPanel } from '@/components/shared/LeaderboardPanel';
import { generateShareText } from '@/lib/share';
import { StreakBadge } from '@/components/shared/StreakBadge';

/** Watson school grade for a 30-item Quizzticle. Scales linearly for other sizes. */
function swissGrade(score: number, total: number): { grade: string; label: string } {
  const scaled = (score / total) * 30;
  if (scaled >= 26) return { grade: '6.0', label: 'Bravissimo' };
  if (scaled >= 22) return { grade: '5.5', label: 'Sehr gut' };
  if (scaled >= 18) return { grade: '5.0', label: 'Gut' };
  if (scaled >= 14) return { grade: '4.5', label: 'Befriedigend' };
  if (scaled >= 10) return { grade: '4.0', label: 'Ausreichend' };
  return { grade: '—', label: 'Nachsitzen' };
}

export function QuizzticleResult() {
  const { puzzle, filled, filledDisplay, streak } = useQuizzticle();
  if (!puzzle) return null;

  const total = puzzle.items.length;
  const score = filled.filter(Boolean).length;
  const { grade, label } = swissGrade(score, total);

  const shareText = generateShareText(
    'verbindige',
    puzzle.date ?? puzzle.episode,
    `Quizzticle #${puzzle.episode} — ${score}/${total} (Note ${grade})\n${puzzle.prompt}`,
  );

  return (
    <div className="text-center">
      <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold">
        Quizzticle #{puzzle.episode}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-gray-text)]">{puzzle.prompt}</p>

      <div className="mt-4 flex items-end justify-center gap-3">
        <span className="font-[family-name:var(--font-heading)] text-5xl font-black">
          {score}
        </span>
        <span className="text-2xl text-[var(--color-gray-text)]">/{total}</span>
      </div>
      <p className="mt-2">
        <span className="rounded-full bg-[var(--color-pink)]/10 px-3 py-1 text-sm font-bold text-[var(--color-pink)]">
          Note {grade} · {label}
        </span>
      </p>

      {streak.current >= 1 && (
        <div className="mt-4 flex justify-center">
          <StreakBadge streak={streak} />
        </div>
      )}

      {/* Reveal all items */}
      <h2 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-gray-text)]">
        Alle Antworten
      </h2>
      <div className="grid grid-cols-2 gap-1.5 text-left sm:grid-cols-3">
        {puzzle.items.map((item, i) => (
          <div
            key={i}
            className={`rounded border px-2 py-1.5 text-xs leading-tight ${
              filled[i]
                ? 'border-[var(--color-green)]/30 bg-[var(--color-green)]/[0.06] font-semibold'
                : 'border-[var(--color-gray-bg)] bg-[var(--color-gray-bg)]/30 text-[var(--color-gray-text)]'
            }`}
          >
            {filled[i] ? (filledDisplay[i] ?? item.display) : item.display}
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-center">
        <ShareButton text={shareText} label="Ergebnis teilen" game="verbindige" />
      </div>

      <LeaderboardPanel gameType="quizzticle" puzzleDate={puzzle.date} />

      <PostGameSection currentGame="quizzticle" />
    </div>
  );
}
