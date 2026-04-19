import { Link } from 'react-router-dom';

interface ArchiveBannerProps {
  date: string;
}

export function ArchiveBanner({ date }: ArchiveBannerProps) {
  const formatted = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('de-CH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg bg-[var(--color-blue)]/10 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="text-sm" aria-hidden>📅</span>
        <div>
          <span className="text-xs font-semibold text-[var(--color-blue)]">
            Archiv
          </span>
          {formatted && (
            <span className="ml-1.5 text-xs text-[var(--color-gray-text)]">
              {formatted}
            </span>
          )}
        </div>
      </div>
      <Link
        to="/archiv"
        className="text-xs font-semibold text-[var(--color-blue)] hover:underline"
      >
        ← Zurück
      </Link>
    </div>
  );
}
