/**
 * Soul Reading viewer-token helper.
 *
 * Token = HMAC-SHA256(jobId + ":" + customerEmail, READING_TOKEN_SECRET) → base64url, 32 chars.
 *
 * Properties we want:
 *   - Deterministic: same (jobId, email, secret) → same token. Lets the
 *     Phase 4 webhook write the token at insert-time and the Phase 7 worker
 *     re-derive it for the email if needed.
 *   - URL-safe: base64url (no padding, no `+`/`/`).
 *   - Unguessable: 32 chars × 6 bits ≈ 192 bits of entropy, more than enough
 *     for a "Calendly-style" share link (cf. soul-reading-fulfilment §5.1).
 *   - Server-only: uses node:crypto.timingSafeEqual for verification, so
 *     the token is never compared with `===`.
 *
 * The customer-facing URL is `/reading/<token>`. The Phase 4 webhook stores
 * the token on `soul_reading_jobs.viewer_token` (UNIQUE), so the read path
 * is a single indexed lookup. We don't try to "decode" the token back to a
 * jobId — we just look it up by string match. That's why the shape is
 * `HMAC(jobId+email)` rather than something reversible.
 *
 * Secret: `READING_TOKEN_SECRET` env var. Generate via
 *   `openssl rand -base64 32`
 * and set in Vercel for all three environments (Production / Preview / Dev).
 *
 * Source of truth:
 *   • [[research-2026-05-04-soul-reading-fulfilment]] §5 (token security)
 *   • [[launch-plan-2026-05-05]] Phase 6 (viewer page)
 */
import crypto from "node:crypto";

const TOKEN_LENGTH = 32; // base64url chars; ~192 bits of entropy

function getSecret(): string {
  const secret = process.env.READING_TOKEN_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "READING_TOKEN_SECRET env var missing or too short (min 16 chars). " +
        "Generate with `openssl rand -base64 32` and set in Vercel.",
    );
  }
  return secret;
}

function digestBase64Url(jobId: string, customerEmail: string, secret: string): string {
  // Normalise email: trimmed + lowercased so a token derived from
  // "Foo@Example.com" matches one derived from "foo@example.com  ".
  const normalisedEmail = customerEmail.trim().toLowerCase();
  const message = `${jobId}:${normalisedEmail}`;
  const digest = crypto.createHmac("sha256", secret).update(message).digest("base64url");
  return digest.slice(0, TOKEN_LENGTH);
}

/**
 * Generate a deterministic viewer token for a soul_reading_jobs row.
 *
 * Call this from the Phase 4 webhook handler when inserting a new row,
 * and write the result to `soul_reading_jobs.viewer_token`.
 */
export function generateReadingToken(jobId: string, customerEmail: string): string {
  if (!jobId || typeof jobId !== "string") {
    throw new Error("generateReadingToken: jobId is required");
  }
  if (!customerEmail || typeof customerEmail !== "string") {
    throw new Error("generateReadingToken: customerEmail is required");
  }
  return digestBase64Url(jobId, customerEmail, getSecret());
}

/**
 * Constant-time equality check. Useful if you ever need to verify a token
 * presented by a customer against a re-derived one (rather than looking it
 * up in the DB). The /api/reading/[token] handler does a DB lookup instead,
 * so this is exposed for completeness / future use (e.g. /fix/<token>).
 */
export function verifyReadingToken(token: string, jobId: string, customerEmail: string): boolean {
  if (typeof token !== "string" || token.length !== TOKEN_LENGTH) return false;
  let expected: string;
  try {
    expected = digestBase64Url(jobId, customerEmail, getSecret());
  } catch {
    return false;
  }
  // Buffer.byteLength must match for timingSafeEqual; both are TOKEN_LENGTH ASCII chars.
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * URL-format check. Token must be `[A-Za-z0-9_-]{32}` (base64url alphabet).
 * Use to short-circuit DB lookups for obviously malformed tokens.
 */
export function isWellFormedToken(token: string): boolean {
  return typeof token === "string" && /^[A-Za-z0-9_-]{32}$/.test(token);
}

export const READING_TOKEN_LENGTH = TOKEN_LENGTH;
