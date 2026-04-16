import { useState } from 'react';

interface HeadlineCardProps {
  display: string;
  category: string;
  articleYear: number;
  articleDate?: string;
  articleUrl: string;
  contextHint?: string;
  onSubmit: (guess: string) => void;
  isCorrect: boolean | null;
  revealedAnswer: string | null;
  disabled: boolean;
  hintUsed: boolean;
  onUseHint: () => void;
}

export function HeadlineCard({
  display,
  category,
  articleYear,
  articleDate,
  articleUrl,
  contextHint,
  onSubmit,
  isCorrect,
  revealedAnswer,
  disabled,
  hintUsed,
  onUseHint,
}: HeadlineCardProps) {
  const [input, setInput] = useState('');
  const [showHint, setShowHint] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSubmit(input.trim());
      setInput('');
    }
  }

  function handleHint() {
    setShowHint(true);
    onUseHint();
  }

  return (
    <div
      className={`rounded-lg border-2 p-4 transition-colors ${
        isCorrect === true
          ? 'border-[var(--color-green)] bg-green-50'
          : isCorrect === false
            ? 'border-[var(--color-pink)] bg-pink-50'
            : 'border-[var(--color-gray-bg)] bg-white'
      }`}
    >
      {/* Year + Category badge */}
      <div className="flex items-center gap-2">
        <span className="inline-block rounded bg-[var(--color-nav-bg)] px-2 py-0.5 text-xs font-bold text-white">
          🕐 {articleYear}
        </span>
        <span className="inline-block rounded bg-[var(--color-gray-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--color-gray-text)]">
          {category}
        </span>
      </div>

      {/* Headline text */}
      <p className="mt-2 text-lg font-semibold leading-snug">
        &laquo;{display}&raquo;
      </p>

      {/* Hint */}
      {contextHint && !revealedAnswer && (
        <div className="mt-2">
          {showHint || hintUsed ? (
            <p className="text-xs text-[var(--color-gray-text)] italic">
              💡 {contextHint}
            </p>
          ) : (
            <button
              onClick={handleHint}
              className="text-xs text-[var(--color-gray-text)] underline hover:text-[var(--color-cyan)]"
            >
              💡 Tipp anzeigen
            </button>
          )}
        </div>
      )}

      {/* Input or revealed answer */}
      {revealedAnswer ? (
        <div className="mt-3">
          <span
            className={`inline-block rounded px-3 py-1 text-sm font-bold ${
              isCorrect ? 'bg-[var(--color-green)] text-white' : 'bg-[var(--color-pink)] text-white'
            }`}
          >
            {revealedAnswer.charAt(0).toUpperCase() + revealedAnswer.slice(1)}
          </span>
          {hintUsed && <span className="ml-1 text-xs">💡</span>}
          {articleDate && (
            <span className="ml-2 text-xs text-[var(--color-gray-text)]">{articleDate}</span>
          )}
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 text-sm font-semibold text-[var(--color-cyan)] hover:underline"
          >
            watson-Artikel lesen &rarr;
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            placeholder="Dein Tipp..."
            autoFocus
            className="flex-1 rounded border-2 border-[var(--color-gray-bg)] px-3 py-2 text-sm font-semibold outline-none transition-colors focus:border-[var(--color-cyan)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className="rounded bg-[var(--color-cyan)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            &rarr;
          </button>
        </form>
      )}
    </div>
  );
}
