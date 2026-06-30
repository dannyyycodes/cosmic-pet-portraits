// First-party UTM capture + persistence (ANALYTICS-ONLY, additive).
//
// Captures utm_source / utm_medium / utm_campaign / utm_content from the URL on
// landing, persists them first-party (cookie `ls_utm`, 90 days, + localStorage
// backup), and exposes getUtm() (URL wins, else the persisted value) so every
// page_analytics event and email-lead payload can be traced back to the exact
// account that drove the visit. Conventions mirror referralTracking.ts.
//
// This file touches no UI, no checkout/payment, no edge function. It only reads
// the URL + browser storage and returns a plain object of utm fields.

export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type UtmParams = Partial<Record<UtmKey, string>>;

const UTM_COOKIE_KEY = 'ls_utm';
const UTM_COOKIE_DAYS = 90;
const UTM_MAX_LEN = 200; // guard against junk / overlong values

// Keep only the known utm keys, trimmed and length-capped, dropping empties.
function sanitize(input: Record<string, string | null | undefined>): UtmParams {
  const out: UtmParams = {};
  for (const key of UTM_KEYS) {
    const raw = input[key];
    if (typeof raw === 'string') {
      const v = raw.trim().slice(0, UTM_MAX_LEN);
      if (v) out[key] = v;
    }
  }
  return out;
}

function readFromUrl(): UtmParams {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const found: Record<string, string> = {};
    for (const key of UTM_KEYS) {
      const v = params.get(key);
      if (v) found[key] = v;
    }
    return sanitize(found);
  } catch {
    return {};
  }
}

function readFromStore(): UtmParams {
  // Cookie first (survives across tabs + most SPA navigations).
  if (typeof document !== 'undefined') {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const idx = cookie.indexOf('=');
        const name = cookie.slice(0, idx).trim();
        if (name === UTM_COOKIE_KEY) {
          const value = cookie.slice(idx + 1).trim();
          if (value) return sanitize(JSON.parse(decodeURIComponent(value)));
        }
      }
    } catch {
      /* malformed cookie — fall through to localStorage */
    }
  }
  // localStorage fallback (with explicit expiry, like referralTracking).
  try {
    const raw = localStorage.getItem(UTM_COOKIE_KEY);
    const expires = localStorage.getItem(`${UTM_COOKIE_KEY}_expires`);
    if (raw) {
      if (!expires || new Date(expires) > new Date()) {
        return sanitize(JSON.parse(raw));
      }
      localStorage.removeItem(UTM_COOKIE_KEY);
      localStorage.removeItem(`${UTM_COOKIE_KEY}_expires`);
    }
  } catch {
    /* storage might be blocked */
  }
  return {};
}

function persist(utm: UtmParams): void {
  if (Object.keys(utm).length === 0) return;
  const json = JSON.stringify(utm);
  const expires = new Date();
  expires.setTime(expires.getTime() + UTM_COOKIE_DAYS * 24 * 60 * 60 * 1000);

  if (typeof document !== 'undefined') {
    try {
      document.cookie =
        `${UTM_COOKIE_KEY}=${encodeURIComponent(json)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    } catch {
      /* cookie write blocked */
    }
  }
  try {
    localStorage.setItem(UTM_COOKIE_KEY, json);
    localStorage.setItem(`${UTM_COOKIE_KEY}_expires`, expires.toISOString());
  } catch {
    /* storage might be blocked */
  }
}

/**
 * Read utm_* from the current URL and, if any are present, persist them
 * first-party. Safe to call repeatedly (a no-op when the URL carries none).
 * Returns the params captured from the URL this call.
 */
export function captureUtm(): UtmParams {
  const fromUrl = readFromUrl();
  if (Object.keys(fromUrl).length > 0) persist(fromUrl);
  return fromUrl;
}

/**
 * The attribution to attach to analytics + leads. A fresh click wins (URL
 * params override), otherwise the persisted first-party value is used. Returns
 * only the keys that actually have a value (never injects nulls).
 */
export function getUtm(): UtmParams {
  const fromUrl = readFromUrl();
  if (Object.keys(fromUrl).length > 0) return fromUrl;
  return readFromStore();
}

/**
 * Coarse landing bucket derived from the path: anything under /pawtraits is the
 * portrait avenue, everything else is the soul-reading avenue. Defaults to the
 * live pathname when no path is given.
 */
export function getLandingAvenue(path?: string): 'pawtraits' | 'soul_reading' {
  const p =
    (path ?? (typeof window !== 'undefined' ? window.location.pathname : '')) || '';
  return p.includes('/pawtraits') ? 'pawtraits' : 'soul_reading';
}
