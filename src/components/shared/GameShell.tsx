import type { ReactNode } from 'react';
import { SponsorBar } from './SponsorBar';

interface GameShellProps {
  children: ReactNode;
  /** Pass sponsor config to show a branded banner above the game. */
  sponsor?: {
    name: string;
    logoUrl?: string;
    clickUrl?: string;
  };
  /** Set to false to hide the sponsor bar (e.g. for archive mode). */
  showSponsor?: boolean;
}

export function GameShell({ children, sponsor, showSponsor = true }: GameShellProps) {
  return (
    <div className="mx-auto max-w-[600px] px-4 py-4 md:px-0">
      {showSponsor && <SponsorBar sponsor={sponsor} />}
      {children}
    </div>
  );
}
