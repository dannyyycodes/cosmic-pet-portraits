

# Landing Page Overhaul: 7 Changes

## Summary of Changes

1. **Headline change** — "You'll Never Look at Them The Same Way Again" in orange
2. **All buttons orange** — Change primary color from green to orange across the entire Variant C theme
3. **Gift banner above navbar** — Butternut Box-style top banner linking to gift purchase
4. **Glimpse Inside section** — Remove it (too weak, not adding value)
5. **UGC section moved up** — Right after hero CTA, before anything else
6. **Pricing update** — $27 Standard, $35 with Portrait. Remove Weekly Updates tier entirely (it's an upsell, not a landing page offer)
7. **Remove How It Works** — Emotional buyers don't need process steps. FAQ covers it for analytical readers

---

## Technical Details

### File 1: `src/index.css` (lines 93-133)
Change the `.variant-c` primary color from forest green to a warm orange:
- `--primary`: from `145 47% 33%` (green) to `25 85% 55%` (warm orange, approx `#E07A30`)
- `--ring`: same orange
- `--warm-sage`, `--warm-green`: update to orange to match
- All buttons, checkmarks, badges, and accents auto-inherit this change site-wide

### File 2: `src/components/variants/variant-c/HeroVariantC.tsx`
- Change headline from "You'll Never Look at Your Pet" to "You'll Never Look at Them"
- Change accent span from `text-primary` to explicit orange `text-[#E07A30]` so the headline orange stands out even if primary is used elsewhere
- Keep Trustpilot badge, SampleCarousel, bullet strip, CTA — all auto-inherit orange via `bg-primary`

### File 3: `src/components/Navbar.tsx`
- Add a full-width gift banner **above** the navbar (like Butternut Box's "30% off your first 2 boxes + free gift →")
- Banner text: "🎁 The perfect gift for a pet lover → Give a Personalized Reading" with arrow, linking to `/gift`
- Styled with a contrasting background (e.g., a soft maroon/burgundy `#8B2252` or a deep warm color to stand out against buttery yellow) with white text
- Dismissible with X button, stores state in sessionStorage
- This replaces or sits alongside the existing `UrgencyBanner` — the gift banner is always-on, not time-limited

### File 4: `src/pages/Index.tsx`
- **Remove** the `ReportPreviewSection` ("Glimpse Inside") import and its `VariantOnly` block (lines 163-168)
- **Move** `VideoTestimonials` block to immediately after the Hero section (before `MicroFAQ`)
- **Remove** the `HowItWorksVariantC` section from the Variant C renderer (lines 200-209) — keep A/B variants intact
- Section order for Variant C becomes: Hero → UGC Videos → MicroFAQ → Testimonials → Perfect For → Pricing → Two Options Cards → Mid CTA → FAQ → Final CTA → Footer

### File 5: `src/components/variants/variant-c/PricingPreview.tsx`
- Change Standard tier: `$35` → `$27`, name stays "Personality Reading"
- Change Premium tier: `$50` → `$35`, name stays "Premium with Portrait"
- **Remove** the entire Weekly Updates tier (3rd column) — this is an upsell offered post-purchase, not on landing
- Grid changes from `md:grid-cols-3` to `md:grid-cols-2` with `max-w-2xl` container
- "Most Popular" badge stays on Premium

### File 6: `src/components/StickyMobileCTA.tsx`
- Button already uses `bg-primary` — will auto-inherit orange from CSS change

### File 7: `src/components/variants/variant-c/CTAVariantC.tsx`
- Buttons already use `bg-primary` — will auto-inherit orange

### File 8: `src/components/ExitIntentPopup.tsx`
- Uses `variant="gold"` button — no change needed, but the `primary` references in coupon styling will auto-inherit orange

---

## Section Order After Changes (Variant C)

```text
[Gift Banner - always visible above navbar]
[Navbar]
Hero (headline in orange, orange CTA)
UGC Video Testimonials (moved up)
Micro FAQ
Written Testimonials
Perfect For
Pricing ($27 / $35, two columns)
Two Options Cards (For My Pet / For a Friend)
Mid CTA
FAQ
Final CTA
Footer
```

---

## What Gets Removed
- "A Glimpse Inside" report preview section (entire component stays in codebase, just removed from page)
- "How It Works" section (for Variant C only — A/B keep theirs)
- Weekly Updates pricing tier

## What Stays
- Variants A and B completely untouched
- All other components, backend, database unchanged
- No new dependencies

**Total files modified: ~6-7**

