/* Visitor intent — the one quiet question the readings landing asks.
 *
 * "memorial"  — the pet is no longer at their side. The passage softens,
 *               the checkout becomes the hushed memorial path.
 * "discovery" — the pet is here. The full discovery page, unchanged.
 * absent      — never answered. Treated as discovery everywhere, and the
 *               threshold prompt stays eligible to render.
 *
 * Precedence: URL param (?r=memorial / ?memorial=1 / ?occasion=memorial)
 * wins once and is then stripped from the address bar; after that the
 * stored choice holds. Grief state is never fixed: clearIntent() restores
 * the prompt.
 *
 * REGISTER CARRY FOR TRAFFIC SOURCES: append ?r=memorial to any
 * memorial-targeted link (ads, posts, emails) and the page opens with
 * "Held in memory" preselected and the whole passage in past tense,
 * before first paint, no flicker. Links without the param default to
 * discovery ("Here with you"). Example:
 *   https://littlesouls.app/v2?r=memorial
 */

export type Intent = "memorial" | "discovery";

export const INTENT_KEY = "ls_intent";
export const INTENT_EVENT = "ls-intent";

function readStored(): Intent | null {
  try {
    const v = localStorage.getItem(INTENT_KEY);
    return v === "memorial" || v === "discovery" ? v : null;
  } catch {
    return null;
  }
}

function persist(v: Intent | null): void {
  try {
    if (v === null) localStorage.removeItem(INTENT_KEY);
    else localStorage.setItem(INTENT_KEY, v);
  } catch {
    /* private mode — session-only intent is fine */
  }
}

/* Strip the memorial params so a shared/refreshed URL does not re-assert
 * intent the visitor has since changed. Storage carries it from here. */
function stripUrlIntent(): void {
  try {
    const url = new URL(window.location.href);
    if (
      !url.searchParams.has("memorial") &&
      url.searchParams.get("occasion") !== "memorial" &&
      url.searchParams.get("r") !== "memorial"
    ) return;
    url.searchParams.delete("memorial");
    if (url.searchParams.get("occasion") === "memorial") url.searchParams.delete("occasion");
    if (url.searchParams.get("r") === "memorial") url.searchParams.delete("r");
    window.history.replaceState(window.history.state, "", url.pathname + (url.searchParams.toString() ? "?" + url.searchParams.toString() : "") + url.hash);
  } catch {
    /* ignore */
  }
}

export function getIntent(): Intent | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("r") === "memorial" || params.get("memorial") === "1" || params.get("occasion") === "memorial") {
      persist("memorial");
      stripUrlIntent();
      return "memorial";
    }
  } catch {
    /* ignore */
  }
  return readStored();
}

export function setIntent(v: Intent): void {
  if (typeof window === "undefined") return;
  persist(v);
  window.dispatchEvent(new CustomEvent<Intent | null>(INTENT_EVENT, { detail: v }));
}

export function clearIntent(): void {
  if (typeof window === "undefined") return;
  persist(null);
  window.dispatchEvent(new CustomEvent<Intent | null>(INTENT_EVENT, { detail: null }));
}
