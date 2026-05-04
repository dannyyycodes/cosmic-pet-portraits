/**
 * Cross-page pet-photo sharing — survives /portraits ↔ /portraits/studio ↔
 * /portraits/templates navigation. Photo URL persists in localStorage so a
 * customer who uploads on one page doesn't have to re-upload on another.
 */
const STORAGE_KEY = "ls.portraits.photo.v1";
const TTL_MS = 1000 * 60 * 60 * 24; // 24h

interface StoredPhoto { url: string; ts: number }

export function savePetPhoto(url: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, ts: Date.now() } satisfies StoredPhoto));
  } catch { /* private mode / quota — silent */ }
}

export function loadPetPhoto(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPhoto;
    if (!parsed.url || typeof parsed.url !== "string") return null;
    if (Date.now() - parsed.ts > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.url;
  } catch { return null; }
}

export function clearPetPhoto(): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
}

/**
 * Wrap a fetch with a hard timeout via AbortController.
 * Resolves with the response or throws an AbortError after `ms` milliseconds.
 */
export async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, ms = 45000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}
