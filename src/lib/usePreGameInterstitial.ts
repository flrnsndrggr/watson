import { useState, useCallback } from 'react';

const SESSION_KEY = 'watson_interstitial_shown';

/**
 * Returns whether the interstitial should be shown (once per session, mobile only).
 * Call `markShown()` after the interstitial is dismissed.
 */
export function usePreGameInterstitial(): {
  shouldShow: boolean;
  markShown: () => void;
} {
  const [shouldShow] = useState<boolean>(() => {
    // Only on mobile viewports
    if (typeof window === 'undefined' || window.innerWidth >= 640) return false;
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return false;
    }
  });

  const markShown = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // storage unavailable — interstitial won't re-show this render anyway
    }
  }, []);

  return { shouldShow, markShown };
}
