/**
 * Stable browser visitor ID via FingerprintJS open-source.
 *
 * Used at signup to pair with email-dedup so the same browser can't farm
 * unlimited free credits via email aliases (SimpleLogin, AnonAddy, DuckDuckGo,
 * Apple Hide-My-Email). The signup trigger reads it from raw_user_meta_data
 * and grants 0 credits if the fingerprint is already on file.
 *
 * Fail-soft: if FingerprintJS can't load (privacy extension, ITP, etc.)
 * returns null and the trigger falls back to email-only dedup.
 */
import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cached: string | null = null;
let inflight: Promise<string | null> | null = null;

export async function getVisitorId(): Promise<string | null> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      cached = result.visitorId;
      return cached;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
