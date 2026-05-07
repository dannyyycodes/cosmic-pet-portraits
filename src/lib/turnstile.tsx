/**
 * Cloudflare Turnstile React wrapper — invisible/managed widget.
 *
 * Loads the Turnstile script once globally, renders an invisible widget
 * inside a <div> we hand it, and resolves with a token when it passes.
 *
 * Usage:
 *   const { execute, reset, mountRef } = useTurnstile();
 *   <div ref={mountRef} />          // can be display:none — Turnstile auto-renders
 *   const token = await execute();  // returns the Turnstile token
 *
 * We use action="signup" so the dashboard can show signup-specific stats.
 *
 * Test keys (always pass / always block) live in vault rules until the real
 * widget is provisioned in dash.cloudflare.com → Turnstile.
 */
import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        opts: {
          sitekey: string;
          action?: string;
          appearance?: 'always' | 'execute' | 'interaction-only';
          execution?: 'render' | 'execute';
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'invisible';
        }
      ) => string;
      execute: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptLoadingPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;
  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src^="${TURNSTILE_SCRIPT_SRC.split('?')[0]}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('turnstile-script-failed')));
      return;
    }
    const s = document.createElement('script');
    s.src = TURNSTILE_SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile-script-failed'));
    document.head.appendChild(s);
  });
  return scriptLoadingPromise;
}

interface UseTurnstileOpts {
  action?: string;
}

export function useTurnstile(opts: UseTurnstileOpts = {}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const pendingResolveRef = useRef<((token: string) => void) | null>(null);
  const pendingRejectRef = useRef<((err: Error) => void) | null>(null);

  const siteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? '';

  useEffect(() => {
    if (!mountRef.current || !siteKey) return;
    let cancelled = false;
    let widgetId: string | null = null;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !mountRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(mountRef.current, {
          sitekey: siteKey,
          action: opts.action ?? 'signup',
          execution: 'execute',           // wait for our explicit .execute() call
          appearance: 'interaction-only', // only show UI if interaction needed
          size: 'invisible',
          callback: (token) => {
            const resolve = pendingResolveRef.current;
            pendingResolveRef.current = null;
            pendingRejectRef.current = null;
            resolve?.(token);
          },
          'error-callback': () => {
            const reject = pendingRejectRef.current;
            pendingResolveRef.current = null;
            pendingRejectRef.current = null;
            reject?.(new Error('turnstile-error'));
          },
          'expired-callback': () => {
            // Token expired before we used it. Auto-reset so next execute() works.
            if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
          },
        });
        widgetIdRef.current = widgetId;
      })
      .catch((err) => {
        console.error('turnstile load failed', err);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current); } catch { /* noop */ }
      }
      widgetIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  const execute = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!siteKey) {
        // No site key configured — local dev or misconfigured. Resolve with
        // an empty token; server falls open in non-prod, fails closed in prod.
        resolve('');
        return;
      }
      if (!widgetIdRef.current || !window.turnstile) {
        reject(new Error('turnstile-not-ready'));
        return;
      }
      pendingResolveRef.current = resolve;
      pendingRejectRef.current = reject;
      try {
        window.turnstile.execute(widgetIdRef.current);
      } catch (err) {
        pendingResolveRef.current = null;
        pendingRejectRef.current = null;
        reject(err as Error);
      }
    });
  }, [siteKey]);

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      try { window.turnstile.reset(widgetIdRef.current); } catch { /* noop */ }
    }
  }, []);

  return { execute, reset, mountRef, hasSiteKey: !!siteKey };
}
