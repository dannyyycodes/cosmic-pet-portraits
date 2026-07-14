import { memo } from 'react';
import type { GlyphType } from './types';

/**
 * Glyph — renders either a real astrological sigil (as serif text) or a
 * bespoke stroke icon. No emoji, no clip-art (Angel pro-grade law).
 */

const ICONS: Record<string, React.ReactNode> = {
  quill: (
    <>
      <path d="M20 4c-6 1-11 5-13 11l-2 5 5-2c6-2 10-7 11-13z" />
      <path d="M9 15c1.5-3 4-5.5 7-7" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />
      <path d="M18.5 15.5l.7 2 .8-2 .0 0" />
    </>
  ),
  tag: (
    <>
      <path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-7 7z" />
      <circle cx="8.5" cy="8.5" r="1.2" />
    </>
  ),
  balance: (
    <>
      <path d="M12 4v16" />
      <path d="M6 20h12" />
      <path d="M5 7h14" />
      <path d="M5 7l-2.5 5a3 3 0 0 0 5 0z" />
      <path d="M19 7l-2.5 5a3 3 0 0 0 5 0z" />
    </>
  ),
  checklist: (
    <>
      <path d="M9 6h11" /><path d="M9 12h11" /><path d="M9 18h11" />
      <path d="M4 5.5l1.2 1.2L7.5 4" /><path d="M4 11.5l1.2 1.2L7.5 10" /><path d="M4 17.5l1.2 1.2L7.5 16" />
    </>
  ),
  heart: <path d="M12 20s-7-4.6-9.2-9C1.3 8 3 4.6 6.4 4.6c2 0 3.2 1.2 3.6 2 .4-.8 1.6-2 3.6-2 3.4 0 5.1 3.4 3.6 6.4C19 15.4 12 20 12 20z" />,
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="M11 11l8 8" /><path d="M16 16l2-2" /><path d="M18.5 18.5l1.8-1.8" />
    </>
  ),
  spark: (
    <>
      <path d="M13 3l-7 10h5l-2 8 8-11h-5z" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </>
  ),
  bowl: (
    <>
      <path d="M3 11h18a9 9 0 0 1-18 0z" />
      <path d="M12 4c-1.5 1-1.5 2.5 0 3.5" /><path d="M9 5c-1 .8-1 2 0 2.8" /><path d="M15 5c-1 .8-1 2 0 2.8" />
    </>
  ),
  clover: (
    <>
      <path d="M12 12c-1-3-4-4-5.5-2.5S6 15 12 12z" />
      <path d="M12 12c3-1 4-4 2.5-5.5S9 6 12 12z" />
      <path d="M12 12c1 3 4 4 5.5 2.5S18 9 12 12z" />
      <path d="M12 12c-3 1-4 4-2.5 5.5S15 18 12 12z" />
      <path d="M12 12l-3 8" />
    </>
  ),
  gem: (
    <>
      <path d="M6 4h12l3 5-9 11L3 9z" />
      <path d="M3 9h18" /><path d="M9 4l-3 5 6 11 6-11-3-5" />
    </>
  ),
  mask: (
    <>
      <path d="M4 5c5-1 11-1 16 0 0 7-1.5 11-4 12-1.5.6-2.8-.8-4-.8s-2.5 1.4-4 .8C5.5 16 4 12 4 5z" />
      <path d="M8.5 9.5c.8-.6 1.8-.6 2.6 0" /><path d="M12.9 9.5c.8-.6 1.8-.6 2.6 0" />
    </>
  ),
  gavel: (
    <>
      <path d="M14 3l7 7-3 3-7-7z" />
      <path d="M9 8l3 3-6 6-3-3z" /><path d="M3 21h9" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="1" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5h16v11H9l-4 4V5z" />
      <path d="M8 10h8" /><path d="M8 13h5" />
    </>
  ),
  crown: (
    <>
      <path d="M4 8l3 8h10l3-8-5 4-3-6-3 6z" />
      <path d="M6 19h12" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0" /><path d="M12 17v4" /><path d="M9 21h6" />
    </>
  ),
  envelope: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  link: (
    <>
      <path d="M9 15l6-6" />
      <path d="M11 6l1.5-1.5a4 4 0 0 1 5.7 5.7L16 12" />
      <path d="M13 18l-1.5 1.5a4 4 0 0 1-5.7-5.7L8 12" />
    </>
  ),
  orbit: (
    <>
      <circle cx="12" cy="12" r="3" />
      <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-30 12 12)" />
      <circle cx="21" cy="8.5" r="1.3" />
    </>
  ),
  paw: (
    <>
      <circle cx="8" cy="8" r="1.8" /><circle cx="12" cy="6.5" r="1.8" /><circle cx="16" cy="8" r="1.8" />
      <path d="M12 11c-3 0-5 2.2-5 4.6C7 18 9 19 12 19s5-1 5-3.4C17 13.2 15 11 12 11z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  seal: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 6l1.6 3.4L17 10l-2.6 2.3.7 3.7L12 14.2 8.9 16l.7-3.7L7 10l3.4-.6z" />
    </>
  ),
};

interface GlyphProps {
  glyph: string;
  type: GlyphType;
  className?: string;
}

function GlyphBase({ glyph, type, className }: GlyphProps) {
  if (type === 'astro') {
    return <span className={className} aria-hidden="true">{glyph}</span>;
  }
  const icon = ICONS[glyph] ?? ICONS.sparkle;
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
    </span>
  );
}

export const Glyph = memo(GlyphBase);
