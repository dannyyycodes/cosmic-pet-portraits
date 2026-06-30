import { useEffect } from 'react';
import { captureUtm, getUtm, type UtmParams } from '@/lib/utm';

/**
 * Capture utm_* from the URL into first-party storage on mount, so attribution
 * survives the funnel fork (/start -> /, /pawtraits) and later SPA navigations
 * that drop the query string. ANALYTICS-ONLY, additive — touches no UI.
 *
 * Returns the current attribution (URL wins, else persisted) for convenience.
 */
export function useUtmCapture(): UtmParams {
  useEffect(() => {
    captureUtm();
  }, []);
  return getUtm();
}

export default useUtmCapture;
