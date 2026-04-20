import { type ReactNode, useCallback, useState } from 'react';
import { SponsorBar } from './SponsorBar';
import { PreGameInterstitial } from './PreGameInterstitial';
import { usePreGameInterstitial } from '@/lib/usePreGameInterstitial';

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
  const { shouldShow, markShown } = usePreGameInterstitial();
  const [showInterstitial, setShowInterstitial] = useState(shouldShow);

  const handleDismiss = useCallback(() => {
    markShown();
    setShowInterstitial(false);
  }, [markShown]);

  return (
    <div className="mx-auto max-w-[600px] px-4 py-4 md:px-0">
      {showInterstitial && <PreGameInterstitial onDismiss={handleDismiss} />}
      {showSponsor && <SponsorBar sponsor={sponsor} />}
      {children}
    </div>
  );
}
