/**
 * Design tokens for /portraits — single source of truth.
 * Used by all portraits/* components. Inline-style values so each section
 * stays self-contained without leaking into the rest of the site's Tailwind.
 *
 * Aesthetic direction (refreshed 2026-05-03): Bright commercial polish.
 *   White-led background, deep indigo text, soft grey panels, Rose CTA.
 *   Reads like a real Shopify shop, not an editorial magazine.
 *
 * Typography:
 *   • Display = Asap (confident, characterful sans — for headings)
 *   • Body    = Assistant (clean readable sans — for everything else)
 *   • Cormorant italic kept ONLY for the occasional whispered accent line
 *
 * Rose (#bf524a) is the brand differentiator — locked, used for every CTA.
 */

export const PALETTE = {
  // ── Surfaces ────────────────────────────────────────────────────────
  cream: "#ffffff",         // page background — pure white, commercial
  cream2: "#fafafa",        // soft panel
  paper: "#f5f5f5",         // dimmer panel
  sand: "#ededed",          // hairline / divider
  sandDeep: "#cccccc",      // subtle border on cards

  // ── Type ────────────────────────────────────────────────────────────
  // No purple/indigo — neutral warm charcoal.
  ink: "#1c1c1c",           // headlines (true near-black)
  earth: "#3a3a3a",         // body text
  earthMuted: "#7a7a7a",    // captions / metadata
  earthSubtle: "#979797",   // disabled / secondary

  // ── Brand accent — LOCKED ───────────────────────────────────────────
  rose: "#bf524a",          // primary CTA + emotional accent
  roseDeep: "#9c3d36",      // hover / pressed
  roseSoft: "#fbeae8",      // tinted background flag
  gold: "#c4a265",          // SECONDARY accent — used sparingly (Soul Edition only)
  goldSoft: "#d4b67a",
  goldDeep: "#8b6f3a",

  // ── Cinematic dark surfaces (used INSIDE framed portrait stage only) ─
  // Warm near-black, no purple. Used for footer bg + hero caption tab.
  cosmos: "#1a1814",
  cosmosMid: "#2a2520",
} as const;

/** Display heading — Asap, confident sans, near-black ink. */
export const display = (size: string) =>
  ({
    fontFamily: 'Asap, system-ui, sans-serif',
    fontSize: size,
    fontWeight: 700,
    lineHeight: 1.08,
    letterSpacing: "-0.02em",
    textWrap: "balance" as const,
  }) as const;

/** Body text — Assistant, clean readable sans. */
export const body = (size: string) =>
  ({
    fontFamily: 'Assistant, system-ui, sans-serif',
    fontSize: size,
    fontWeight: 400,
    lineHeight: 1.6,
  }) as const;

/** Italic Cormorant accent — used sparingly for emotional whispers. */
export const cormorantItalic = (size: string) =>
  ({
    fontFamily: '"Cormorant", "Cormorant Garamond", Georgia, serif',
    fontStyle: "italic" as const,
    fontWeight: 400,
    fontSize: size,
    lineHeight: 1.42,
    letterSpacing: "-0.005em",
  }) as const;

/** Eyebrow uppercase label — used above every section H2. */
export const eyebrow = (color: string = PALETTE.earthMuted) =>
  ({
    fontFamily: 'Assistant, system-ui, sans-serif',
    fontSize: "12px",
    fontWeight: 700,
    color,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
  }) as const;

/** Tabular price — Asap with tabular-nums. */
export const tabularPrice = (size: string) =>
  ({
    fontFamily: 'Asap, system-ui, sans-serif',
    fontSize: size,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums" as const,
    letterSpacing: "-0.01em",
    color: PALETTE.ink,
  }) as const;

/** Motion durations (ms) — keep cohesive across sections. */
export const MOTION = {
  fast: 200,
  base: 400,
  slow: 900,
  hero: 1200,
  reveal: 1100,
} as const;

/** Easing curves — quint-out for reveals, sine for breathing. */
export const EASE = {
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
};
