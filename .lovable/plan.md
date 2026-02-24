

# Phase 1+2: Variant C "Warm & Trusted" Redesign

## What's Changing

Variant C gets a complete visual and copy overhaul -- from dark cosmic meme-style to a warm, clean, premium editorial design optimized for conversion. Variants A and B stay untouched.

## Design System

- **Background:** Warm cream (#FEFCF8) instead of dark navy
- **Text:** Warm charcoal (#2D2B29) instead of light gray
- **CTA buttons ONLY:** Warm coral (#E8734A) -- used sparingly, never for borders/icons/highlights
- **Trust accents:** Sage green (#7DB87D) for checkmarks and verified badges
- **Cards:** White with soft shadows instead of dark glass with neon borders
- **Everything else:** Neutral whites and warm grays -- white space = premium

## Landing Page Section Order (Optimized)

```text
1. Navbar (white bg, dark text, coral CTA)
2. Hero (transformation headline + bullet strip + social proof + micro-excerpt)
3. Micro FAQ (one objection buster: "Do I need my pet's birth time? No.")
4. Report Preview Gallery ("A Glimpse Inside" -- scrollable pages)
5. UGC Video Testimonials (placeholder grid for your videos)
6. Written Testimonials (clean white cards, real quotes)
7. Perfect For (occasion triggers: birthdays, gotcha days, memorials, gifts)
8. Pricing (3 tiers with anchoring -- premium elevated 5-8%)
9. Trust Reinforcement (secure checkout + instant delivery + money-back)
10. How It Works (3 warm steps)
11. Options Cards ("For My Pet" / "For a Friend" -- no meme language)
12. Mid CTA ("Your pet already knows who they are")
13. FAQ (warm accordion)
14. Final CTA ("Create their personalized 15+ page report now")
15. Footer (warm styling)
```

Key change from previous plan: Pricing moved BEFORE options cards to reduce cognitive tension. Trust block added directly under pricing. One micro-FAQ placed right under hero to kill hesitation.

## Sales Copy (Final)

| Location | Copy |
|----------|------|
| Hero headline | "You'll never look at your pet the same way again" |
| Subheadline | "A 15+ page personalized report that captures who your companion really is -- their quirks, their love language, and why they do the things they do. Delivered instantly." |
| Bullet strip | "Understand why they do what they do" / "Discover their emotional blueprint" / "Keep a beautifully designed memory forever" |
| Social proof | 5 gold stars + "4.9 from 2,347 reviews" |
| Micro-excerpt | "Bella -- Golden Retriever, Age 4: Bella loves intensely. She doesn't just greet you at the door -- she celebrates you." |
| Micro FAQ | "Do I need my pet's birth time?" / "No -- we only need their birthday." |
| Mid CTA | "Your pet already knows who they are. It's time you did too." |
| Final CTA | "Create their personalized 15+ page report now." |
| Below final CTA | "100% money-back guarantee. No questions asked." |
| Subscription framing | "Cancel anytime. Start with a one-time report. Upgrade anytime." |

## Technical Plan

### Files to Create (8 new)

1. **`src/components/variants/VariantBackground.tsx`** -- Renders cosmic starfield for A/B, clean warm gradient for C. Extracts the background div currently hardcoded in Index.tsx (lines 135-178).

2. **`src/components/variants/variant-c/ReportPreviewSection.tsx`** -- "A Glimpse Inside" horizontal scrollable gallery of 3-4 warm-styled report page mockups (personality overview, trait breakdown, zodiac section, keepsake quote). Blurred edges, sharp center card. Below: three delivery icons (lightning "Delivered instantly", download "Downloadable PDF", printer "Printable keepsake").

3. **`src/components/variants/variant-c/VideoTestimonials.tsx`** -- "See Why Pet Parents Can't Stop Sharing" grid. 2 columns mobile, 3 desktop. Each card: video thumbnail with play overlay, name, pet name, one-line quote. Placeholder state with friendly "Videos coming soon" design until you record UGC videos. Supports YouTube embeds. Click opens lightbox modal.

4. **`src/components/variants/variant-c/PerfectForSection.tsx`** -- Four warm pills in a row: "Pet birthdays", "Gotcha days", "Memorial keepsakes", "Surprise gifts". Simple, clean, activates occasion-based buying intent.

5. **`src/components/variants/variant-c/PricingPreview.tsx`** -- Three tier cards. Basic ($35, outline CTA). Premium ($50, coral "Most Popular" badge, "+Custom AI Pet Portrait" highlighted, solid coral CTA, card 5-8% larger). Subscription ($4.99/mo, sage "Best Value" badge, "Cancel anytime" text). Below all cards: trust reinforcement strip with checkmark icons (Secure checkout / Delivered instantly / 100% money-back guarantee).

6. **`src/components/variants/variant-c/HowItWorksVariantC.tsx`** -- Three warm cards: "Tell us about your pet" (2 min) / "We create something beautiful" (instant) / "Read, share, and treasure" (forever). Sage green icon backgrounds, coral step numbers, soft shadow cards.

7. **`src/components/variants/variant-c/FAQVariantC.tsx`** -- Clean warm accordion. White card, warm charcoal text, coral active state on accordion trigger.

8. **`src/components/variants/variant-c/MicroFAQ.tsx`** -- Single objection-buster positioned just below the hero: "Do I need my pet's birth time?" / "No -- we only need their birthday." Small, subtle, removes the #1 hesitation point.

### Files to Rewrite (3)

9. **`src/components/variants/variant-c/HeroVariantC.tsx`** -- Complete rewrite. Transformation headline on cream background. Pattern interrupt bullet strip with sage checkmarks. Gold star rating "4.9 from 2,347 reviews" above fold. Micro pet excerpt card ("Bella -- Golden Retriever, Age 4..."). Coral CTA button (only coral element). No emojis, no meme language, no gradient text, no bouncing elements.

10. **`src/components/variants/variant-c/TestimonialsVariantC.tsx`** -- Complete rewrite. Replaces meme-style social media cards with clean white testimonial cards using existing customer photos from `src/assets/testimonials/`. Bold emotional highlight quotes, verified badges in sage green. No emoji engagement metrics, no fake handles.

11. **`src/components/variants/variant-c/CTAVariantC.tsx`** -- Complete rewrite. Mid variant: "Your pet already knows who they are. It's time you did too." Final variant: "Create their personalized 15+ page report now." Coral button, trust text below. No floating emojis, no bouncing elements.

### Files to Modify (4)

12. **`src/index.css`** -- Add `.variant-c` block after line 91 with warm HSL CSS variable overrides for all shadcn tokens (background, foreground, card, primary, muted, border, etc.). Add `.warm-card` and `.warm-shadow` utility classes.

13. **`src/contexts/ABTestContext.tsx`** -- Add `useEffect` after line 57 that applies/removes `variant-a`, `variant-b`, or `variant-c` class on `document.body`. Cleanup function removes previous class.

14. **`src/components/Navbar.tsx`** -- Import `useABTest`. For variant C: white bg instead of `bg-background/80`, dark charcoal text, coral CTA button, warm hover colors instead of `hover:text-gold`. Mobile sheet gets light background. Variants A/B unchanged.

15. **`src/pages/Index.tsx`** -- Replace hardcoded cosmic background (lines 135-178) with `<VariantBackground />`. Use `VariantOnly` component (already exists in VariantRenderer.tsx) to add C-only sections: MicroFAQ after hero, ReportPreviewSection, VideoTestimonials, PerfectForSection, PricingPreview. Wrap HowItWorks and FAQ in `VariantRenderer` (A/B get current, C gets warm versions). Update options cards for variant C (replace "Get the Tea" with "For My Pet", white cards, coral primary button, no meme language). Update footer for variant C (warm text, coral hover links).

### What Does NOT Change
- Variant A and B -- completely untouched
- Admin pages -- internal tools, stay dark
- Backend / database -- no changes needed
- No new dependencies -- built with existing Tailwind + Framer Motion + shadcn

### Implementation Sequence
All 15 file changes will be implemented in order: CSS foundation first, then context update, then new components, then page assembly. The warm theme cascades automatically via the body class, so all shadcn UI components inherit the palette without individual overrides.

