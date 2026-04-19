interface SponsorBarProps {
  sponsor?: {
    name: string;
    logoUrl?: string;
    clickUrl?: string;
  };
}

/**
 * 728x90 leaderboard sponsor banner displayed above the game area.
 * Shows "Presented by [Brand]" when a sponsor is configured,
 * or a generic placeholder when no sponsor is set.
 */
export function SponsorBar({ sponsor }: SponsorBarProps) {
  const content = (
    <div
      className="mx-auto flex h-[60px] w-full max-w-[728px] items-center justify-center gap-3 rounded-lg bg-[var(--color-gray-bg)] px-4 sm:h-[90px]"
      role="complementary"
      aria-label="Sponsor"
    >
      <span className="text-xs text-[var(--color-gray-text)]">Presented by</span>
      {sponsor?.logoUrl ? (
        <img
          src={sponsor.logoUrl}
          alt={sponsor.name}
          className="h-6 max-w-[140px] object-contain sm:h-8 sm:max-w-[200px]"
        />
      ) : (
        <span className="font-[family-name:var(--font-heading)] text-sm font-bold text-[var(--color-black)] sm:text-base">
          {sponsor?.name ?? 'Sponsor'}
        </span>
      )}
    </div>
  );

  if (sponsor?.clickUrl) {
    return (
      <a
        href={sponsor.clickUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="mb-4 block"
        aria-label={`Sponsor: ${sponsor.name}`}
      >
        {content}
      </a>
    );
  }

  return <div className="mb-4">{content}</div>;
}
