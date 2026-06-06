// CosmicLineIcon — one cohesive line-icon set for the Soul Reading.
// Replaces cheap unicode glyphs (☉ ☽ ♀ ✦ …) with hand-tuned 24x24 strokes:
// circles, orbits, short rays and simple arcs so every icon shares a family
// look at 16 / 18 / 24px. Pure inline SVG, stroke-only, no fills, no deps.

import type { JSX } from 'react';

// Each entry is the inner SVG markup for a 24x24 viewBox.
// Conventions: centred on (12,12), strokes only (stroke="currentColor"),
// disc radius ~3.5-5 for the "body", rays/arcs kept short for optical balance.
const PATHS: Record<string, JSX.Element> = {
  // ── Luminaries ──────────────────────────────────────────────
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2.4M12 18.6V21M3 12h2.4M18.6 12H21M5.6 5.6l1.7 1.7M16.7 16.7l1.7 1.7M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7" />
    </>
  ),
  moon: <path d="M16.5 13.4A6.5 6.5 0 1 1 10.6 5.1a5 5 0 0 0 5.9 8.3Z" />,

  // ── Planets (astro-flavoured but unified) ───────────────────
  mercury: (
    <>
      <path d="M8.4 4.2a3.6 3.6 0 0 0 7.2 0" />
      <circle cx="12" cy="11.4" r="3.4" />
      <path d="M12 14.8V20M9.4 17.4h5.2" />
    </>
  ),
  venus: (
    <>
      <circle cx="12" cy="8.8" r="4" />
      <path d="M12 12.8V20M9 16.6h6" />
    </>
  ),
  mars: (
    <>
      <circle cx="10.4" cy="13.6" r="4" />
      <path d="M13.6 10.4 19 5M14.6 5H19v4.4" />
    </>
  ),
  jupiter: (
    <>
      <path d="M6 8.6c0-2 1.6-3.4 3.4-3.4 2 0 3.2 1.5 3.2 4.4V18" />
      <path d="M5 18h8.8" />
    </>
  ),
  saturn: (
    <>
      <path d="M8 6.6v8.8c0 1.6 1 2.6 2.4 2.6 1.5 0 2.6-1.1 2.6-2.8" />
      <path d="M5.6 6.6h5.2" />
      <path d="M13 11.4c2.4-.5 4 .1 4 1.3 0 1.5-2.4 2.7-5.4 2.7" />
    </>
  ),

  // ── Elements ────────────────────────────────────────────────
  spark: <path d="M12 3.5c.7 3.6 1.4 4.3 5 5-3.6.7-4.3 1.4-5 5-.7-3.6-1.4-4.3-5-5 3.6-.7 4.3-1.4 5-5Z" />,
  water: <path d="M12 4.2C8.8 8 7 10.7 7 13.2A5 5 0 0 0 17 13.2C17 10.7 15.2 8 12 4.2Z" />,
  fire: <path d="M12 3.6c2.6 2.7 4.4 5.1 4.4 7.9A4.4 4.4 0 0 1 7.6 11.5c0-1.1.4-2.1 1-3 .2 1 .9 1.7 1.8 1.9-.6-2.3.2-4.5 1.6-6.8Z" />,
  earth: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4v16" />
    </>
  ),
  air: (
    <>
      <path d="M4 8.5h10.4a2.3 2.3 0 1 0-2.3-2.3" />
      <path d="M4 12.5h13a2.3 2.3 0 1 1-2.3 2.3" />
      <path d="M4 16.5h8.4a2 2 0 1 1-2 2" />
    </>
  ),

  // ── Reading motifs ──────────────────────────────────────────
  heartOrbit: (
    <>
      <path d="M12 10.2c-1-1.7-3.6-1.6-4.4.3-.6 1.5.5 3 4.4 5.3 3.9-2.3 5-3.8 4.4-5.3-.8-1.9-3.4-2-4.4-.3Z" />
      <path d="M5 6.5c2.8-1.9 8.2-1.9 14 1" strokeOpacity="0.5" />
    </>
  ),
  mask: (
    <>
      <path d="M5 6.5c0 6 2 11 7 11s7-5 7-11c-2.4.9-4.7 1.3-7 1.3S7.4 7.4 5 6.5Z" />
      <path d="M9 11.4h.01M15 11.4h.01" />
    </>
  ),
  pawOrbit: (
    <>
      <circle cx="12" cy="14.4" r="3.2" />
      <circle cx="7.2" cy="11.4" r="1.1" />
      <circle cx="16.8" cy="11.4" r="1.1" />
      <circle cx="9.4" cy="7.8" r="1.1" />
      <circle cx="14.6" cy="7.8" r="1.1" />
    </>
  ),
  star: <path d="M12 3.8 14.2 9 20 9.6l-4.3 3.9L17 19l-5-3-5 3 1.3-5.5L4 9.6 9.8 9Z" />,
  orbit: (
    <>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="9" ry="4.2" transform="rotate(-28 12 12)" />
      <circle cx="19" cy="8.2" r="1.2" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-7 4.5-11 14-11-1 8-5 11-11 11" />
      <path d="M7 17c2.5-3.5 5-5.5 8-7" strokeOpacity="0.55" />
    </>
  ),
  crown: (
    <>
      <path d="M4.5 8.5 7.5 14h9l3-5.5L15 11l-3-5-3 5Z" />
      <path d="M7 17h10" />
    </>
  ),
  eye: (
    <>
      <path d="M3 12c2.5-3.8 5.6-5.7 9-5.7s6.5 1.9 9 5.7c-2.5 3.8-5.6 5.7-9 5.7S5.5 15.8 3 12Z" />
      <circle cx="12" cy="12" r="2.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19 6v5c0 4.4-2.9 7.7-7 9.5-4.1-1.8-7-5.1-7-9.5V6Z" />
      <path d="M9.4 12l1.8 1.9 3.4-3.6" strokeOpacity="0.7" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15 9 13 13l-4 2 2-4Z" />
      <circle cx="12" cy="12" r="0.6" />
    </>
  ),
  scroll: (
    <>
      <path d="M7 4.5h8.5a2 2 0 0 1 2 2V17a2.5 2.5 0 0 1-2.5 2.5H8" />
      <path d="M17.5 17.5a2.5 2.5 0 0 0 2.5-2.5h-5" />
      <path d="M7 4.5A2.5 2.5 0 0 0 4.5 7v.5a1.5 1.5 0 0 0 1.5 1.5H8V6.5A2 2 0 0 0 7 4.5Z" />
      <path d="M9.5 9h5M9.5 12h5" strokeOpacity="0.55" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 4c.6 3.1 1.3 3.8 4.4 4.4-3.1.6-3.8 1.3-4.4 4.4-.6-3.1-1.3-3.8-4.4-4.4C10.7 7.8 11.4 7.1 12 4Z" />
      <path d="M17.5 13.5c.3 1.4.6 1.7 2 2-1.4.3-1.7.6-2 2-.3-1.4-.6-1.7-2-2 1.4-.3 1.7-.6 2-2Z" />
    </>
  ),
  gift: (
    <>
      <path d="M5 10.5h14V18a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18Z" />
      <path d="M4 8h16v2.5H4zM12 8v11.5" />
      <path d="M12 8C12 5.8 10.6 4.5 9.2 4.5A1.7 1.7 0 0 0 9 8Zm0 0c0-2.2 1.4-3.5 2.8-3.5A1.7 1.7 0 0 1 12 8Z" />
    </>
  ),
  chat: (
    <>
      <path d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3a1.5 1.5 0 0 1-1.5-1.5V8A1.5 1.5 0 0 1 5 6.5Z" />
      <path d="M8.5 10.5h7M8.5 13h4.5" strokeOpacity="0.55" />
    </>
  ),
};

export function CosmicLineIcon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const inner = PATHS[name] ?? PATHS.spark;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {inner}
    </svg>
  );
}

// A 32px rounded chip that frames an icon in a faint gold ring — used for
// section markers / inline list bullets so glyphs feel intentional.
export function IconChip({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={`w-8 h-8 rounded-full flex items-center justify-center ${className ?? ''}`}
      style={{
        border: '1px solid rgba(230,193,121,0.25)',
        background: 'rgba(243,236,255,0.025)',
        color: '#e6c179',
      }}
    >
      <CosmicLineIcon name={name} />
    </span>
  );
}

export default CosmicLineIcon;
