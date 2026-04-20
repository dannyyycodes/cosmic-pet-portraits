// Dynamic memorial OG image — returns an SVG rendered on demand, so any
// memorial reading can share with a card that names the pet, the years, and
// a quiet pullquote.
//
// ── Important dependency note ────────────────────────────────────────────────
// This endpoint currently returns image/svg+xml, NOT a PNG. SVG is rendered
// correctly by most modern OG consumers (Slack, Discord, iMessage rich
// previews, LinkedIn, Google Search, WhatsApp on iOS). However, Twitter and
// some legacy Facebook crawlers prefer raster PNG. If Danny approves adding
// the `@vercel/og` dependency (~1.5MB in runtime, renders real PNG via
// satori + resvg), we can swap the handler body to `new ImageResponse(...)`
// with no other changes to the calling markup. See
// https://vercel.com/docs/functions/og-image-generation for the upgrade path.
//
// Query params:
//   pet    — pet's display name (required)
//   years  — "2015 – 2024" or similar (optional)
//   quote  — a short pullquote to render centred (optional; truncated to 160c)
//
// Image dimensions: 1200x630 (standard OG)

import type { VercelRequest, VercelResponse } from '@vercel/node';

const BG_CREAM = '#fbfaf6';
const BG_DOVE = '#f8f5ee';
const TEXT_DARK = '#2d2428';
const TEXT_MUTED = '#9a8578';
const GOLD = '#c4a265';
const SAGE = '#8fa082';

function esc(input: string | undefined | null): string {
  if (!input) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.substring(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

// Naive line-wrapper. Assumes ~11px per character at the size we use.
// Good enough for SVG previews; full satori would handle this properly.
function wrapText(text: string, maxCharsPerLine: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { pet: petRaw, years: yearsRaw, quote: quoteRaw } = req.query as Record<string, string>;

  const pet = esc(truncate(String(petRaw || 'Beloved'), 40));
  const years = esc(truncate(String(yearsRaw || ''), 20));
  const quote = truncate(String(quoteRaw || ''), 160);

  // Wrap quote to ~50 chars/line; max 3 lines.
  const quoteLines = wrapText(quote, 52).slice(0, 3);
  const hasQuote = quoteLines.length > 0;

  // Layout anchors (1200x630 canvas).
  const cx = 600;

  // Vertical spacing — dynamic based on whether we have a quote.
  const petY = hasQuote ? 260 : 300;
  const yearsY = petY + 80;
  const quoteStartY = yearsY + (years ? 70 : 30);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-label="In remembrance of ${pet}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BG_CREAM}"/>
      <stop offset="60%" stop-color="${BG_DOVE}"/>
      <stop offset="100%" stop-color="${BG_CREAM}"/>
    </linearGradient>
    <!-- subtle vignette -->
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stop-color="${BG_CREAM}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${BG_DOVE}" stop-opacity="0.35"/>
    </radialGradient>
  </defs>

  <!-- Canvas -->
  <rect x="0" y="0" width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="630" fill="url(#vignette)"/>

  <!-- Hairline gold frame -->
  <rect x="36" y="36" width="1128" height="558" fill="none" stroke="${GOLD}" stroke-width="0.75" opacity="0.55"/>

  <!-- Top eyebrow: sage, tracked, uppercase -->
  <text
    x="${cx}" y="130"
    font-family="'DM Serif Display', Georgia, 'Times New Roman', serif"
    font-size="22"
    letter-spacing="7"
    text-anchor="middle"
    fill="${SAGE}"
    font-weight="600"
  >IN REMEMBRANCE</text>

  <!-- Top thin gold rule under eyebrow -->
  <line x1="${cx - 45}" y1="158" x2="${cx + 45}" y2="158" stroke="${GOLD}" stroke-width="0.8" opacity="0.65"/>

  <!-- Pet name: DM Serif Display fallback chain, 88pt warm brown -->
  <text
    x="${cx}" y="${petY}"
    font-family="'DM Serif Display', Georgia, 'Times New Roman', serif"
    font-size="88"
    text-anchor="middle"
    fill="${TEXT_DARK}"
  >${pet}</text>

  ${years ? `
  <!-- Years: Cormorant italic fallback chain -->
  <text
    x="${cx}" y="${yearsY}"
    font-family="'Cormorant', 'Cormorant Garamond', Georgia, serif"
    font-size="34"
    font-style="italic"
    text-anchor="middle"
    fill="${TEXT_MUTED}"
  >${years}</text>
  ` : ''}

  ${hasQuote ? `
  <!-- Pullquote: italic serif, muted, centre -->
  ${quoteLines.map((line, i) => `
    <text
      x="${cx}" y="${quoteStartY + i * 36}"
      font-family="'DM Serif Display', Georgia, 'Times New Roman', serif"
      font-size="26"
      font-style="italic"
      text-anchor="middle"
      fill="${TEXT_DARK}"
    >${esc(line)}</text>
  `).join('')}
  ` : ''}

  <!-- Bottom thin gold rule -->
  <line x1="${cx - 40}" y1="544" x2="${cx + 40}" y2="544" stroke="${GOLD}" stroke-width="0.8" opacity="0.65"/>

  <!-- Wordmark -->
  <text
    x="${cx}" y="575"
    font-family="'DM Serif Display', Georgia, 'Times New Roman', serif"
    font-size="18"
    letter-spacing="4"
    text-anchor="middle"
    fill="${SAGE}"
    opacity="0.85"
  >littlesouls.app</text>
</svg>`;

  // Cache 24h at the edge — the card is deterministic per-query-string.
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(svg);
}
