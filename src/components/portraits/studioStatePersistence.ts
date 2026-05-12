/**
 * studioStatePersistence — survive a tab close / browser refresh / accidental
 * navigate during the (sometimes 60s+) generation flow without losing the
 * customer's pets, prompt, generated variants, approval, and selected variant.
 *
 * Why this exists: StudioFlow keeps all of those in useState only. If the
 * customer accidentally closes the tab between "click Generate" and
 * "click Add to cart" they lose:
 *   - pet name(s) they typed
 *   - prompt they crafted
 *   - the generated variant they were about to approve (and the credit it
 *     burned to produce)
 *   - approval state
 *
 * Storage choice: localStorage (not IndexedDB) — payload is small (<50KB:
 * a few names, a prompt, 1-4 image URLs). localStorage is synchronous,
 * supported everywhere, and matches the existing photoSharing.ts pattern.
 *
 * TTL: 4h. Long enough that "I closed the tab while the generation was
 * running" is recoverable; short enough that stale state from a previous
 * session doesn't surprise the user.
 *
 * Cleared automatically on:
 *   - cart add success (handled by caller)
 *   - successful checkout redirect (handled by caller)
 *   - explicit reset (handled by caller)
 */

const STORAGE_KEY = "ls.portraits.studio.state.v1";
// 24h TTL — long enough to cover "I bookmarked the studio mid-session and
// came back the next morning"; short enough that month-old state from a
// dev test session doesn't surprise a returning user.
const TTL_MS = 1000 * 60 * 60 * 24;

export interface PersistedPet {
  id: string;
  name: string;
  noName: boolean;
  photoUrl: string | null;
}

export interface PersistedVariant {
  url: string;
  composition: string;
}

export interface StudioState {
  pets: PersistedPet[];
  prompt: string;
  variants: PersistedVariant[];
  selectedVariantUrl: string | null;
  approved: boolean;
  /** When set, a generation is in flight on the server (fal queue). The
   *  studio should resume polling /api/portraits?action=generation_status
   *  with this id on mount so a tab close mid-generation isn't lost. */
  pendingJobId?: string | null;
  /** Customer hasn't committed to a frame yet — the upfront picker is in
   *  its "I don't know yet" state. sizeKey/frameColor still hold sensible
   *  defaults (16x20 black) so cart-add works at any moment, but the UI
   *  shows the picker as deferred until they explicitly pick. */
  frameDeferred?: boolean;
  /** Persisted size + frame so the upfront picker survives a refresh.
   *  null frameColor = unframed slim canvas (entry / default).
   *  string = wood-tone frame upgrade ("black" | "natural-wood" | "dark-wood"). */
  sizeKey?: string;
  frameColor?: string | null;
  /** Delivery method — "physical" (canvas) or "digital" (download only). */
  deliveryType?: "physical" | "digital";
}

interface StoredEnvelope {
  state: StudioState;
  ts: number;
}

export function saveStudioState(state: StudioState): void {
  if (typeof window === "undefined") return;
  try {
    const env: StoredEnvelope = { state, ts: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(env));
  } catch {
    // Private mode / quota exceeded — silent. Non-fatal; loss of persistence
    // beats throwing in the hot path of the studio.
  }
}

export function loadStudioState(): StudioState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const env = JSON.parse(raw) as StoredEnvelope;
    if (!env || typeof env.ts !== "number" || !env.state) return null;
    if (Date.now() - env.ts > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Defensive validation — if the schema drifted, drop and start fresh.
    const s = env.state;
    if (!Array.isArray(s.pets)) return null;
    if (typeof s.prompt !== "string") return null;
    if (!Array.isArray(s.variants)) return null;
    if (typeof s.approved !== "boolean") return null;
    return s;
  } catch {
    return null;
  }
}

export function clearStudioState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* silent */
  }
}
