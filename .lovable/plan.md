

# Emotional Journey Polish + Pawprint Dividers + Checkout Redesign

## 3 Changes

### 1. EmotionalJourney.tsx — Tighter Spacing, Mobile-Optimised, Handwritten Font, Paw/Heart Dividers

**Typography:**
- Add `Caveat` Google Font to `index.html` and `tailwind.config.ts` for handwritten section headlines
- Section headlines ("They Love You Without Conditions.") use `font-caveat` at `text-3xl sm:text-4xl`
- Body lines stay serif but at `text-base sm:text-lg` (smaller than current `text-lg sm:text-xl`)
- Emphasis lines ("Just loyalty. Just presence. Just love.") slightly larger, warm accent color

**Spacing — tighter:**
- Sections: `py-10 sm:py-14` (down from `py-20 sm:py-28`)
- Line spacing: `space-y-2 sm:space-y-3` (down from `space-y-4 sm:space-y-5`)
- Headline margin-bottom: `mb-5 sm:mb-7` (down from `mb-10 sm:mb-14`)

**Paw + Heart dividers between sections:**
- Replace `· · ·` dots with tiny SVG pawprints in blue (`text-blue-400/40`) and hearts in red (`text-red-400/40`)
- A small trail of 3 elements: 🐾 ❤️ 🐾 using inline SVGs, subtle opacity

**Remove hero CTA + trust text:**
- `HeroVariantC` returns `null` — the emotional journey starts immediately after navbar

**Remove CTA after emotional journey section** (the "Instant delivery" one at bottom of EmotionalJourney) — CTAs remain only before/after UGC

### 2. Checkout Page — Single Tier + Portrait Upsell Toggle + Full Testimonials

**Complete redesign of QuickCheckout.tsx:**

Replace the two-tier card selector with a single product at $27 base price, plus a portrait upsell toggle:
- Single clean card showing "Personality Reading" at $27
- Feature list without orange check icons covering the price
- A toggle/switch below: "Add Custom Portrait (+$8)" that bumps price to $35
- When toggled on, show a brief description of the portrait

**Layout:**
- Header with badge + headline in Caveat font
- Single pricing card with features
- Portrait upsell toggle (using Switch component)
- Dynamic checkout button showing current price
- Trustpilot + trust strip
- Full `PremiumTestimonials` component with all pet images below
- Back link

### 3. Supporting Files

| File | Change |
|------|--------|
| `index.html` | Add Caveat Google Font link |
| `tailwind.config.ts` | Add `caveat` font family |
| `src/components/variants/variant-c/EmotionalJourney.tsx` | Tighter spacing, Caveat headlines, paw/heart SVG dividers, remove bottom CTA |
| `src/components/variants/variant-c/HeroVariantC.tsx` | Return null (no hero CTA) |
| `src/pages/QuickCheckout.tsx` | Single tier + portrait toggle upsell + PremiumTestimonials component |

### Technical Details

**Caveat font addition:**
```html
<!-- index.html -->
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap" rel="stylesheet">
```

**tailwind.config.ts fontFamily:**
```
caveat: ['Caveat', 'cursive'],
```

**Paw divider SVG** — small inline SVG pawprint in blue, heart in red, arranged as a horizontal trail between each of the 3 emotional sections. Approximately 20px icons at 30-40% opacity.

**Checkout pricing logic:**
- Base: `priceCents = 2700` ($27)
- With portrait toggle on: `priceCents = 3500` ($35)
- `selectedTier` sent to `create-checkout`: `includesPortrait` boolean based on toggle state
- Button text updates dynamically: "Get Your Reading — $27" or "Get Your Reading — $35"

