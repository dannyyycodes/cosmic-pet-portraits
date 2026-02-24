

# Butternut Box-Inspired Color Overhaul (Maroon → Green)

Butternut Box uses a distinctive warm, friendly palette: **buttery yellow** background (`#FFF4D2`), **dark maroon/burgundy** for CTAs and accents, white form cards, Trustpilot badge, and large pet photography. You want the same vibe but with **green replacing the maroon**.

Here is the exact color system and every file change needed.

---

## New Color Palette

```text
Butternut Box Original → AstroPets Adaptation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Background:    #FFF4D2 (buttery yellow)  →  #FFF4D2 (same)
Text:          #2D2019 (dark brown)      →  #2D2019 (same)
CTA/Primary:   #8B2252 (maroon)          →  #2D7D46 (forest green)
CTA Hover:     #6E1A41                   →  #236B3A (darker green)
Accent:        #C4A35A (warm gold)       →  #C4A35A (same)
Cards:         #FFFFFF                   →  #FFFFFF
Card border:   #E8DCC8 (warm tan)        →  #E8DCC8 (same)
Muted text:    #7A6F63 (warm brown)      →  #7A6F63 (same)
Trust badges:  #00B67A (Trustpilot)      →  #00B67A (same)
Sage accents:  #7DB87D                   →  #2D7D46 (match primary)
Navbar:        White/cream               →  White/cream
```

The key insight: Butternut Box works because of the **warm buttery yellow** background contrasting against **bold-colored CTAs** on white cards. The maroon-to-green swap keeps the same contrast ratios and emotional warmth.

---

## Technical Details

### Files to Modify (10)

**1. `src/index.css` (`.variant-c` block, lines 93-133)**
Rewrite all CSS custom properties:
- `--background`: shift from cream `35 33% 98%` to buttery yellow `45 100% 91%` (≈ `#FFF4D2`)
- `--foreground`: warm dark brown `25 30% 12%` (≈ `#2D2019`)
- `--primary`: forest green `145 47% 33%` (≈ `#2D7D46`)
- `--primary-foreground`: white
- `--card`: pure white `0 0% 100%`
- `--card-foreground`: same dark brown
- `--muted`: light tan `35 30% 92%`
- `--muted-foreground`: warm brown `30 12% 44%` (≈ `#7A6F63`)
- `--border`: warm tan `35 35% 85%` (≈ `#E8DCC8`)
- `--accent`: warm gold `43 50% 56%`
- `--warm-sage`: update to match green primary `145 47% 33%`
- `--warm-coral`: replaced with `--warm-green: 145 47% 33%`
- `--shadow-card`: slightly stronger warm shadow `0 4px 20px hsl(35 40% 30% / 0.08)`

**2. `src/components/variants/variant-c/HeroVariantC.tsx`**
- Replace generic gold stars with **Trustpilot green badge** (5 green `#00B67A` squares with white stars, "Trustpilot | Rated Excellent" text underneath) — exactly like Butternut Box and like Variant A already has
- Add `SampleCarousel` component below the CTA to bring back real pet photos
- Update CTA button text color reference (primary is now green, so `bg-primary` will auto-render green)
- The bullet strip checkmarks already use `--warm-sage` which will inherit the new green

**3. `src/components/variants/variant-c/VideoTestimonials.tsx`**
- Change aspect ratio from `4/3` to **`9/16`** (iPhone vertical UGC style) as previously requested
- Use existing customer photos as blurred placeholder backgrounds instead of blank gray
- Remove "Coming soon" text — replace with subtle play overlay
- 3 cards on mobile (horizontal scroll), 6 on desktop grid
- Structure ready for dropping in real video URLs

**4. `src/components/variants/variant-c/ReportPreviewSection.tsx`**
- Add a colored top border stripe on each card (green, gold, brown, green) for visual variety
- Increase card width from 280/300px to 320px
- Add warm buttery background band behind the section (`bg-[#FFF0C0]/30`)

**5. `src/components/variants/variant-c/PerfectForSection.tsx`**
- Make pills larger with more padding
- Add unique left-border color per occasion
- Add a slightly different buttery background behind the section for visual separation

**6. `src/components/variants/variant-c/HowItWorksVariantC.tsx`**
- Add contrasting background band (slightly deeper butter, `#FFEDB5`)
- Step numbers become green circles
- Connecting dotted lines between cards on desktop

**7. `src/components/variants/variant-c/TestimonialsVariantC.tsx`**
- Increase customer photo size (w-12 → w-14)
- Add subtle warm left-border accent on cards
- Bolder highlight quote styling

**8. `src/components/variants/variant-c/CTAVariantC.tsx`**
- Add circular pet photo strip (from existing sample images) above the CTA headline
- CTA button is already `bg-primary` so it will auto-render green

**9. `src/components/variants/variant-c/PricingPreview.tsx`**
- "Most Popular" badge will auto-render green via `bg-primary`
- Add subtle buttery background behind pricing section
- Premium card ring already uses `ring-primary` — will auto-render green

**10. `src/components/variants/VariantBackground.tsx`**
- Update the Variant C gradient from cream `#FEFCF8` tones to buttery yellow `#FFF4D2` tones

### What Stays the Same
- Variants A and B — completely untouched
- All page layouts and section ordering
- Backend / database — no changes
- No new dependencies
- SampleCarousel component code (it uses theme tokens, auto-inherits new palette)

### Key Visual Result
The page will feel like Butternut Box: warm buttery yellow background, white cards with tan borders, bold green CTA buttons, Trustpilot badge prominently displayed, real pet photos in the hero, and strong visual separation between sections. Every section gets its own subtle background variation to eliminate the "flat cream wall" problem.

