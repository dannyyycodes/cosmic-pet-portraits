

# Landing Page Transformation: Emotional Journey + UGC Only

## What Changes

Strip the Variant C landing page down to a powerful emotional narrative. Remove all "selling" sections — the copy itself IS the sell. UGC ads provide social proof. CTA buttons convert.

### New Variant C Landing Page Structure

```text
CURRENT (Variant C):
Hero → UGC Videos → Sample Carousel → Written Testimonials → Perfect For → Pricing → Options Cards → Mid CTA → FAQ → Final CTA → Footer

NEW (Variant C):
Hero (stripped to just CTA) → Emotional Journey Copy → CTA → UGC Videos → CTA → Footer
```

### Technical Details

#### File 1: `src/components/variants/variant-c/HeroVariantC.tsx`
Strip down to minimal — just a small CTA at top, no headline/subheadline/bullets/Trustpilot. The emotional copy below IS the hero. Or keep a very minimal version with just the CTA button and trust line.

#### File 2: NEW `src/components/variants/variant-c/EmotionalJourney.tsx`
A beautiful, scroll-driven component that presents the user's copy as a reading journey:

**Section 1 — "They Love You Without Conditions."**
- Large serif headline, then each line fades in with spacing:
  "On your best days." / "On your worst days." / "No judgement." / "No expectations." / "Just loyalty. Just presence. Just love."

**Section 2 — "They're Not 'Just a Pet.'"**
- New section with warm background shift
- "They are a living, feeling soul..." paragraph
- "The way they comfort you." / "The way they protect you." / "The way they choose you — every single day."
- "That means something." — bold, standalone

**Section 3 — "This Is an Act of Love."**
- "Taking the time to understand them more deeply..."
- The quoted block: "I see you. I appreciate you. I'm grateful you're in my life."
- Closing: "Because when someone loves you unconditionally... the most beautiful thing you can do is try to understand them in return."

Each section uses `framer-motion` whileInView animations — gentle fade-ins, no flashy effects. Large readable serif typography. Generous whitespace. Subtle warm background gradients between sections.

#### File 3: `src/pages/Index.tsx`
For Variant C, restructure to:
1. Hero (minimal — just CTA button + trust line)
2. `<EmotionalJourney />` — the full copy
3. CTA button (mid)
4. `<VideoTestimonials />` — UGC section
5. CTA button (final)
6. Footer

**Remove from Variant C:** SampleCarousel, TestimonialsVariantC, PerfectForSection, PricingPreview, Options Cards, FAQVariantC, Mid CTA card, Final CTA card. These are all replaced by the emotional journey + inline CTA buttons.

#### File 4: `src/pages/QuickCheckout.tsx`
Move written testimonials here (the ones removed from landing page). Add a testimonial carousel or a few select quotes below the tier cards for social proof at the point of purchase.

### Files Modified

| File | Change |
|------|--------|
| `src/components/variants/variant-c/EmotionalJourney.tsx` | **NEW** — emotional copy formatted as scroll journey |
| `src/components/variants/variant-c/HeroVariantC.tsx` | Strip to minimal CTA only |
| `src/pages/Index.tsx` | Remove all Variant C sections except Hero, EmotionalJourney, UGC, CTAs, Footer |
| `src/pages/QuickCheckout.tsx` | Add written testimonials for social proof at purchase |

