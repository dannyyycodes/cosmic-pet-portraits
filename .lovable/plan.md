

# A/B Testing System: 3 High-Converting Funnel Variants

## Overview

Building 3 completely different sales funnel experiences with unique vibes, copywriting, buttons, layouts, and report delivery. Each variant is based on proven high-converting sales funnel psychology.

---

## The 3 Variants

### **VARIANT A: "Premium Mystical" (Control)**
*Current experience - keeps what's working*

- **Headline:** "Finally Understand Your Pet's Soul"
- **Vibe:** Elegant, mystical, trust-focused
- **Colors:** Deep purples, cosmic gradients, gold accents
- **Buttons:** Purple cosmic glow, "Discover My Pet's Personality →"
- **Report Delivery:** Cinematic star reveal, elegant animations

---

### **VARIANT B: "Urgent & Emotional" (Direct Response)**
*High-urgency, scarcity-driven, direct-response marketing*

- **Headline:** "WARNING: You're Missing 90% of What Your Pet Is Trying to Tell You"
- **Vibe:** Urgent, emotional, FOMO-driven
- **Colors:** Bold reds/oranges for urgency, high contrast
- **Buttons:** Red pulsing "CLAIM MY REPORT NOW →" with countdown timer
- **Key Elements:**
  - Countdown timer at top ("67% OFF ends in 2:47:32")
  - "Only 7 spots left at this price" scarcity counter
  - Before/After transformation testimonials
  - Pain-point focused copy
  - Exit-intent popup with discount
- **Report Delivery:** Confetti explosion, "CONGRATULATIONS!" celebration, aggressive upsell

---

### **VARIANT C: "Friendly & Fun" (Lifestyle/Viral)**
*Casual, playful, meme-forward, Gen-Z/millennial focused*

- **Headline:** "Congratulations, You've Just Found One of the Best Places on the Internet 🐾✨"
- **Vibe:** Playful, casual, funny, shareable
- **Colors:** Bright gradients, pastel accents, bouncy animations
- **Buttons:** Gradient with bounce animation, "Get the Tea on My Pet 🍵"
- **Key Elements:**
  - Fun bouncy animations throughout
  - Meme-style sample cards
  - TikTok-style vertical scroll testimonials
  - "This will break your group chat" messaging
  - Instagram-worthy visual design
- **Report Delivery:** "OMG wait till you see this..." tease, share-to-unlock features, Instagram/TikTok templates

---

## Implementation Steps

### Step 1: Core Infrastructure
- `ABTestContext.tsx` - Random variant assignment (33% each)
- `useABTest.ts` hook - Access current variant anywhere
- `VariantRenderer.tsx` - Conditional component rendering
- localStorage persistence (users always see same variant)
- URL override (`?variant=B`) for testing

### Step 2: Variant B Landing Page (Urgent)
- Countdown timer component with urgency styling
- Red/orange color scheme and pulsing buttons
- Scarcity messaging ("Only X left!")
- Before/after testimonial format
- Pain-point focused hero copy

### Step 3: Variant C Landing Page (Fun)
- Your "Congratulations" headline with playful styling
- Bouncy animations and bright gradients
- Meme-style testimonial cards
- Casual, conversational copy throughout
- "Get the Tea" button styling

### Step 4: Checkout & Intake Variants
- Variant B: Countdown timer, "SECURE YOUR READING" urgency
- Variant C: "Treat yourself & your bestie" casual vibe
- Variant-specific progress bar styling
- Different question wording per variant

### Step 5: Report Delivery Variants
- Variant B: Confetti celebration, aggressive horoscope upsell
- Variant C: Shareable card focus, "Share to unlock villain origin story"
- Variant-specific social sharing templates

### Step 6: Admin Dashboard & Analytics
- Track `ab_variant` in all analytics events
- Store variant in Stripe metadata for revenue attribution
- Admin page showing conversion rates by variant
- Statistical significance calculator

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/contexts/ABTestContext.tsx` | Core A/B test provider |
| `src/hooks/useABTest.ts` | Variant access hook |
| `src/components/ab-test/VariantRenderer.tsx` | Conditional rendering |
| `src/components/variants/variant-b/*` | Urgent variant components |
| `src/components/variants/variant-c/*` | Fun variant components |
| `src/pages/AdminABTest.tsx` | Results dashboard |

---

## Variant Copy Summary

| Element | Variant A | Variant B | Variant C |
|---------|-----------|-----------|-----------|
| **Headline** | "Finally Understand Your Pet's Soul" | "WARNING: You're Missing 90%..." | "Congratulations, You've Just Found One of the Best Places on the Internet 🐾✨" |
| **CTA Button** | "Discover My Pet's Personality →" | "CLAIM MY REPORT NOW →" | "Get the Tea on My Pet 🍵" |
| **Trust Line** | Trustpilot + verified testimonials | "97% of pet parents say this changed everything" | "12,847 pets roasted this week" |
| **Checkout** | "Choose Your Reading" | "SECURE YOUR READING (Only 7 left!)" | "Treat Yourself & Your Bestie" |

---

## Testing Your Variants

Once live, you can force any variant for testing:
- `yourdomain.com/?variant=A` - Control (current)
- `yourdomain.com/?variant=B` - Urgent/Emotional
- `yourdomain.com/?variant=C` - Fun/Playful

---

## Expected Outcome

After running traffic to all 3 variants, your admin dashboard will show exactly which vibe converts best - then you can double down on the winner or iterate on the top performer.

