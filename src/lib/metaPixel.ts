/**
 * Meta Pixel client helpers.
 *
 * Base script lives in index.html (env-var-gated). This file:
 *   - Provides typed `track()` and `trackCustom()` wrappers
 *   - Exposes `useMetaPixelRouteTracker()` to fire PageView on every SPA route change
 *
 * No-op when window.fbq is undefined (Pixel ID not configured).
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    fbq?: (cmd: "init" | "track" | "trackCustom", arg: string, params?: Record<string, unknown>, opts?: { eventID?: string }) => void;
  }
}

export function track(eventName: string, params?: Record<string, unknown>, opts?: { eventID?: string }): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", eventName, params, opts);
}

export function trackCustom(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", eventName, params);
}

/**
 * Fires PageView on every route change. Place inside BrowserRouter once.
 */
export function useMetaPixelRouteTracker(): void {
  const location = useLocation();
  useEffect(() => {
    track("PageView");
  }, [location.pathname, location.search]);
}

export function MetaPixelRouteTracker(): null {
  useMetaPixelRouteTracker();
  return null;
}
