

# 6 Changes: Green Banner, Remove MicroFAQ, Move Trustpilot, Remove Navbar/Branding, Add Decorations, Heartfelt Language

---

## 1. Gift Banner → Green

**File: `src/components/Navbar.tsx` (line 55)**

Change `bg-[hsl(330_60%_30%)]` to `bg-[#2D7D46]` (forest green).

---

## 2. Remove MicroFAQ

**File: `src/pages/Index.tsx` (lines 165-168)**

Remove the entire MicroFAQ `VariantOnly` block. The "Do I need my pet's birth time?" question is already covered in `FAQVariantC.tsx` (FAQ item #3).

---

## 3. Move Trustpilot Below CTA Button

**File: `src/components/variants/variant-c/HeroVariantC.tsx`**

- Remove the Trustpilot badge from the top of the hero (lines 17-38)
- Insert it between the CTA button and the "Instant delivery" text (inside the CTA motion.div, lines 80-96), rendered as a compact inline row: 5 green squares + "Excellent on ★ Trustpilot"

---

## 4. Remove Navbar for Variant C, Remove "AstroPets" Branding, Keep Language Selector in Footer

**File: `src/components/Navbar.tsx`**

- For Variant C: hide the entire `<nav>` element. Only the green gift banner remains visible above the page.
- Remove "AstroPets" from the mobile sheet title (line 162) — replace with empty or generic text for non-C variants too.

**File: `src/pages/Index.tsx` (footer, lines 350-371)**

- For Variant C: add `LanguageSelector` and a `Blog` link into the footer alongside existing Terms/Privacy/Contact/Affiliate links
- Remove the copyright text that says "The Cosmic Pet Report" for Variant C (or make it generic)

**File: `src/components/StickyMobileCTA.tsx`**

- Update the gradient background from `hsl(35,33%,98%)` to the buttery yellow `#FFF4D2` to match the Variant C background

---

## 5. Add Floating Hearts & Paw Decorations

**New file: `src/components/variants/variant-c/FloatingDecorations.tsx`**

- 10-12 scattered decorative elements: paw prints (🐾) and hearts (❤️)
- Semi-transparent (opacity 0.06-0.12), warm orange/gold/brown tones
- Gentle floating animation using framer-motion (slow Y drift, slight rotation)
- `fixed inset-0 pointer-events-none z-[5]` so they don't block interaction
- Hidden on mobile via `hidden md:block` to avoid clutter on small screens

**File: `src/pages/Index.tsx`**

- Import and render `FloatingDecorations` inside a `VariantOnly variants="C"` block

---

## 6. More Heartfelt Language Throughout

Update copy across all Variant C sections to use warmer, more emotional language:

**HeroVariantC.tsx:**
- Subheadline: "A 15+ page personalized report that captures who your companion really is" → "A beautifully crafted report that reveals the soul of your beloved companion — their quirks, their love language, and why they chose you."
- Bullet points:
  - "Understand why they do what they do" → "Finally understand what's behind those eyes"
  - "Discover their emotional blueprint" → "Discover how deeply they love you"
  - "Keep a beautifully designed memory forever" → "A keepsake you'll treasure forever"
- CTA button: "Meet My Pet's True Self" → "Discover Who They Really Are"

**CTAVariantC.tsx:**
- Mid CTA heading: "Your pet already knows who they are..." → "The bond you share is deeper than you know."
- Mid CTA subtext: "Discover their personality, quirks..." → "Uncover the beautiful, hidden layers of your relationship in a keepsake you'll treasure forever."
- Final CTA heading: "Create their personalized 15+ page report now." → "Give them the love letter they deserve."
- Final CTA subtext: "100% money-back guarantee. No questions asked." → "A beautiful keepsake that captures everything you love about them. 100% money-back guarantee."
- Mid button: "Create My Pet's Report" → "Discover Our Bond"
- Final button: "Start Now — It Takes 60 Seconds" → "Create Their Story Now"

**TestimonialsVariantC.tsx:**
- Section heading: "Real Stories from Real Pet Parents" → "They Changed Our Lives. We Captured Theirs."
- Subheading: "Join thousands of pet parents who've discovered something special" → "Hear from pet parents who finally understood the depth of their bond"

**PerfectForSection.tsx:**
- Occasion labels more emotional:
  - "Pet birthdays" → "Celebrating their special day"
  - "Gotcha days" → "Honoring the day you found each other"
  - "Memorial keepsakes" → "Keeping their memory alive"
  - "Surprise gifts" → "A gift that says 'I see you'"

**PricingPreview.tsx:**
- Heading: "Choose How You Want to Remember Them" → "Choose How You Want to Celebrate Them"
- Subheading: "Every option includes a beautiful, personalized report" → "Every option is a love letter to your best friend"

**VideoTestimonials.tsx:**
- Section heading: "See Why Pet Parents Can't Stop Sharing" → "These Moments Made Pet Parents Cry"
- Subheading: "Real stories from real pet parents" → "The moment you realize how deeply they've touched your life"

**FAQVariantC.tsx:**
- FAQ intro answer: "Think of it as a love letter to your pet" → "Think of it as a love letter to your best friend — written with real insight into who they truly are"

**Index.tsx (Two Options Cards):**
- "Two Ways to Start" → "Two Ways to Celebrate Your Bond"
- "Whether for yourself or as a gift they'll never forget" → "Whether for yourself or as a heartfelt gift they'll never forget"
- "For My Pet" subtext: "Get a beautiful personalized personality report" → "Discover the beautiful soul behind those eyes"
- "For a Friend" subtext: "A unique, personalized gift — delivered instantly" → "Give the most meaningful gift a pet lover could receive"

**StickyMobileCTA.tsx:**
- Button text: "Get My Pet's Report" → "Discover Their Soul"

---

## Section Order After Changes (Variant C)

```text
[Green Gift Banner - dismissible]
(no navbar)
Hero (Trustpilot below CTA button, heartfelt copy)
UGC Video Testimonials (emotional heading)
Written Testimonials (emotional heading)
Perfect For (emotional labels)
Pricing ($27 / $35, heartfelt heading)
Two Options Cards (heartfelt copy)
Mid CTA (heartfelt copy)
FAQ
Final CTA (heartfelt copy)
Footer (Terms · Privacy · Contact · Blog · Affiliate · Language Selector)
[Floating hearts & paws decoration layer]
```

## Files Modified

| File | Change |
|------|--------|
| `src/components/Navbar.tsx` | Green banner, hide nav for Variant C |
| `src/components/variants/variant-c/HeroVariantC.tsx` | Move Trustpilot below button, heartfelt copy |
| `src/pages/Index.tsx` | Remove MicroFAQ, add FloatingDecorations, footer updates, heartfelt copy in options cards |
| `src/components/variants/variant-c/FloatingDecorations.tsx` | **NEW** — floating hearts & paws |
| `src/components/variants/variant-c/CTAVariantC.tsx` | Heartfelt copy |
| `src/components/variants/variant-c/TestimonialsVariantC.tsx` | Heartfelt heading, update accent colors from green to orange |
| `src/components/variants/variant-c/PerfectForSection.tsx` | Heartfelt occasion labels |
| `src/components/variants/variant-c/PricingPreview.tsx` | Heartfelt heading/subheading |
| `src/components/variants/variant-c/VideoTestimonials.tsx` | Heartfelt heading |
| `src/components/variants/variant-c/FAQVariantC.tsx` | Minor wording tweak |
| `src/components/StickyMobileCTA.tsx` | Heartfelt button text, fix gradient bg |

No new dependencies. No database changes. Variants A and B untouched.

