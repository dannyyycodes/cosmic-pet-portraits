

# Fix: Mobile Spacing — Reduce Section Heights for Faster Scrolling

## Problem

Every beat uses `minHeight: "100vh"` (or 60-80vh), which on mobile creates enormous empty whitespace around small text blocks. The page takes far too long to scroll through because each section forces a full screen height even when the content only needs a fraction of that.

## Solution

Use responsive min-heights: keep the cinematic full-viewport feel on desktop but collapse to content-driven heights on mobile. Replace static `minHeight` values with CSS `clamp()` or media-query-aware values.

### Changes to `Beat` component and each beat's `minHeight`

| Beat | Current | Mobile (< 768px) | Desktop |
|------|---------|-------------------|---------|
| 1 (headline) | `100vh` | `60vh` | `100vh` |
| 2 (whisper) | `60vh` | `35vh` | `60vh` |
| 3 ("just") | `65vh` | `30vh` | `65vh` |
| 4 (loyalty) | `70vh` | `45vh` | `70vh` |
| 5 (not just a pet) | `100vh` | `60vh` | `100vh` |
| 6 (incantation) | `80vh` | `50vh` | `80vh` |
| 7 (means something) | `60vh` | `35vh` | `60vh` |
| 8 (act of love) | `100vh` | `60vh` | `100vh` |
| 9 (I see you) | `75vh` | `50vh` | `75vh` |
| 10 (signature) | `100vh` | `60vh` | `100vh` |
| CTA | `100vh` | `60vh` | `100vh` |

**Implementation approach**: Since `minHeight` is set via inline styles and we can't use Tailwind breakpoints there, we'll detect mobile via a simple check (`window.innerWidth < 768`) and pass a multiplier, OR use CSS `clamp()` on minHeight values. The cleanest approach: update the `Beat` component to accept both a `minHeight` and a `mobileMinHeight`, then use a media query via `matchMedia` or simply use the existing `useIsMobile` hook.

### Additional mobile tightening

- Reduce vertical padding on mobile from `clamp(40px, 8vw, 80px)` to `clamp(24px, 6vw, 80px)` — saves ~16px per section on small screens
- UGC video cards: reduce from 180px wide to 140px on mobile so they fit 2 per row without excess scrolling

### File changed

| File | Change |
|------|--------|
| `src/components/variants/variant-c/EmotionalJourney.tsx` | Import `useIsMobile`, add `mobileMinHeight` prop to `Beat`, reduce all section heights on mobile, tighten padding |

