# Work In Progress

This file is updated by Claude Code as we work. If your computer crashes, share this with Claude to pick up where we left off.

---

## Completed: Report Accuracy Overhaul (Ephemeris + AI Guardrails)

**Status:** DONE — deployed and verified with 2 test reports (17-point audit, 100% pass)

**Branch:** fix-json-and-stub-sections

### What was done:

1. **Replaced ephemeris engine** (`worker/ephemeris-v2.ts`)
   - Old engine computed heliocentric positions without geocentric conversion — Mercury, Venus, Chiron were wrong by entire zodiac signs
   - New engine uses `astronomia` library (VSOP87 full theory) via esm.sh for Sun through Neptune
   - Proper heliocentric-to-geocentric conversion for inner planets
   - 48/48 test cases passing across 6 dates spanning 1995-2023

2. **Created Chiron lookup table** (`worker/chiron-table.ts`)
   - 492 monthly entries 1990-2030 with linear interpolation
   - Chiron's high eccentricity (0.379) makes analytical calculation unreliable

3. **Created test suite** (`worker/test-ephemeris.ts`)
   - 6 test cases verified against Swiss Ephemeris / astro.com
   - Run with: `deno run --allow-net test-ephemeris.ts`

4. **Hardened worker.ts against AI hallucination**
   - Import swapped to `ephemeris-v2.ts`
   - Added "ABSOLUTE DATA ACCURACY RULES" to system prompt (no degree fabrication, no sign changes, locked lucky number, no "your owner")
   - Expanded override list: now locks chartPlacements, elementalBalance, dominantElement, crystal, aura, archetype, luckyElements, basedOnYourAnswers, nameMeaning.nameVibration
   - Post-generation auto-fix: replaces "your owner"/"the owner"/"their owner" with "you"/"your" in all string values
   - Validation logging: past-tense violations, pronoun mismatches, owner phrasing survivors

### Verified with test reports:
- **Luna** (Golden Retriever, girl, discover mode, March 15 2020, London): All correct — Pisces Sun, Sagittarius Moon, correct pronouns (she=225, he=0), present tense, 0 owner references
- **Biscuit** (Holland Lop rabbit, boy, birthday mode, Nov 8 2021 07:30, Melbourne): All correct — Scorpio Sun, Capricorn Moon, 81/81 sign references correct, correct pronouns (he=188, she=0), rabbit-specific language (rabbit 36x, lop 46x, binky 5x), 0 owner references, nameVibration=luckyNumber=11

### Report links:
- Luna: `96cde229-f434-4550-b9c8-23e927ca721b`
- Biscuit: `d1bec946-46f7-4efd-9e25-aa8c29c74091`

---

## Previous: SoulSpeak Chat Membership ("Soul Bond") + Stripe Integration

**Status:** Functions deployed, webhook secret updated — needs end-to-end Stripe test

### What's been done:
- Stripe webhook handles checkout.session.completed, subscription.deleted, invoice.paid
- Chat purchase endpoint: small=30/$7.99, medium=100/$19.99, membership=40/week/$12.99/mo
- refresh-chat-credits edge function for weekly cron
- DB migrations applied (stripe_subscription_id, weekly_credits, next_credit_refresh columns)
- STRIPE_WEBHOOK_SECRET updated to correct whsec_ value
- create-chat-purchase SDK upgraded from v13 to v18

### Still needs:
- [ ] Verify Stripe Dashboard webhook endpoint URL + event types
- [ ] Test Stripe webhook end-to-end (make a test purchase)
- [ ] Commit and push all changes

---

## Production-Readiness Progress

### Phase 1 (P0 Critical Fixes) — DONE
- [x] P0-1: Replaced horoscope ephemeris with ephemeris-v2 (VSOP87) — deployed
- [x] P0-2: Fixed worker email auth (was 401, now passes auth with bridge secret) — 502 is Resend delivery issue, not auth
- [x] P0-3: Created email nurture cron jobs (process-email-nurture every 30min, abandoned-cart every 6hr) — migration applied
- [x] P1-1: Moved horoscope delivery to Sunday 9am UTC — migration applied
- [x] P1-6: Added 4 more ephemeris edge cases — 74/74 passing (1990-2029 coverage)

### Phase 2 (In Progress)
- [x] P1-2: Horoscope content quality — upgraded system prompts with anti-hallucination rules, breed-specific NLP, heartwarming voice guidelines for both standard and memorial modes. Updated SoulSpeak CTA in horoscope email.
- [x] P1-3: SoulSpeak paywall marketing upgrade — Soul Engine card with chart data, occasion-mode NLP copy, upgraded pricing descriptions, birthday mode support
- [x] P1-7: Horoscope subscriber welcome email — sends on subscription creation with Sunday delivery schedule, SoulSpeak cross-sell, beautiful template
- [x] Fixed: Sunday delivery references (nextMonday → nextSunday in stripe-webhook, Monday → Sunday in nurture email)
- [x] Upgraded sidebar pricing cards with heartwarming language ("credits" → "messages", warmer descriptions)
- [x] Added SoulSpeak cross-sell to post-purchase nurture email
- [x] P1-4: Free lead magnet ("Pet Zodiac Snapshot") — `/free-chart` page with Sun+Moon calculation, personality snapshot, email capture into nurture sequence, upsell to full reading
- [ ] P1-5: End-to-end Stripe flow testing
- [ ] Investigate Resend 502 — needs Resend dashboard check (domain verification for littlesouls.co)

### Phase 3 (Later)
- [ ] P2-1: Horoscope archive UI
- [ ] P2-2: Generation error monitoring
- [ ] P2-3: Horoscope subscriber email sequence

### Remaining
- [ ] P1-5: End-to-end Stripe flow testing (10 purchase paths)
- [ ] Resend 502: Check Resend dashboard — verify `littlesouls.co` domain, confirm RESEND_API_KEY is valid
- [ ] Deploy new/updated edge functions: generate-free-snapshot, stripe-webhook, generate-weekly-horoscopes, process-email-nurture
- [ ] Push code and deploy frontend (free-chart.html, soul-chat.html, App.tsx)

---

## Current Session: Pet Photo + Email + Test Run (2026-03-14)

**Status:** Test report generating, email template deployed

### What's been done:

1. **Client-side image compression** (`PetPhotoUpload.tsx`, `MultiPetPhotoUpload.tsx`)
   - Added `browser-image-compression` — auto-compresses to 800KB/JPEG
   - Handles HEIC/HEIF (iPhone photos), accepts up to 50MB input
   - Cache bumped from 1hr to 1yr (pet photos never change)
   - Updated both single and multi-pet upload components

2. **AI Vision Analysis** (`worker/worker.ts`)
   - Worker now calls Claude Haiku vision on the pet photo before report generation
   - Extracts: coat color, markings, expression, size, distinguishing features
   - Description injected into system prompt so report prose references ACTUAL appearance
   - Cost: ~$0.003 per report (negligible)
   - Non-fatal: if vision fails, report generates normally without photo description

3. **Pet photo in CinematicReveal** (`CinematicReveal.tsx`)
   - Added circular pet photo with gold border + breathing ring animation
   - Appears in Stage 2 (name reveal) — photo fades in above the pet's name
   - Prop passed from ViewReport via `petPhotoUrl`

4. **Green active dot on SoulSpeak avatars** (`soul-chat.html`)
   - Header avatar already had green dot — fixed `overflow:hidden` clipping
   - Added green dot to welcome icon (88px) and sidebar avatar (52px)
   - `has-photo` class added to sidebar when photo loaded

5. **Email template upgrade** (`send-report-email/index.ts`)
   - Rewrote with deeply loving, grateful language
   - Added pet photo in circular frame with gold border + glow
   - Sun sign badge, warmer "what awaits inside" section
   - Subject: "Thank you for choosing Little Souls — {name}'s reading is ready"
   - Footer: "With love and gratitude, The Little Souls family"
   - Worker now passes `petPhotoUrl` to email function
   - Deployed to Supabase

6. **Test report: Teddy the Cockapoo**
   - Report ID: `a415952a-3e98-4fe5-ba02-711b2b5069d0`
   - Email: testreports1.pacifier967@passmail.net
   - Details: boy, Cockapoo, DOB March 3 2019, London UK, discover mode
   - Soul type: old-soul, Superpower: empathy, Stranger: charmer
   - Photo uploaded to Supabase storage
   - Worker deployed to DO droplet, generation triggered

7. **Pluto ephemeris fix** (`ephemeris-v2.ts`)
   - Old formula gave Scorpio 28° — completely wrong for 2019
   - Replaced with pre-computed lookup table (monthly 1990-2030, verified vs Swiss Ephemeris)
   - March 2019 now correctly gives Capricorn 21°

8. **Vision model fix** — Claude Haiku via Bedrock doesn't support images
   - Switched to Gemini 2.0 Flash (`google/gemini-2.0-flash-001`) — fast, cheap, great at image description

9. **Email colors aligned to landing page**
   - Background: #FFFDF5 (cream), CTA: #bf524a (rose), Accent: #c4a265 (gold)
   - Headings: #141210, Body: #5a4a42, Inner card: #faf4e8 with #e8ddd0 border

### Audit results (final report fa6806fe):
- Pluto: Capricorn 21° — FIXED
- Vision refs: silver 6x, curl 7x, gray 6x, expressive eyes 1x, gentle 20x
- Pronouns: he=123, she=0 — perfect
- Teddy 115x, Cockapoo 19x — consistent
- All sections present, lucky number matches name vibration

### Deployed:
- [x] worker.ts + ephemeris-v2.ts → DO droplet (scp)
- [x] send-report-email → Supabase (npx supabase functions deploy)

### Still needs (pick up tomorrow):
- [ ] Apply warm email style to ALL nurture emails (process-email-nurture 8 templates)
- [ ] Mobile optimization pass (landing → checkout → report → SoulSpeak)
- [ ] Push code to git + deploy frontend to Vercel (compression, CinematicReveal photo changes)
- [ ] End-to-end Stripe flow testing (10 purchase paths)
- [ ] Phase 3: Horoscope archive UI, generation error monitoring

---

## Current Session: March 15 — Lead Magnet, Emails, Mobile, Routing

### Completed:
- Free mini reading lead magnet (`/free-chart.html`) with zodiac JSON, celebrity birthdays, Wikipedia photos
- Email sequence redesign: smart upsells, SoulSpeak links, pet photos, 30%+ discounts
- Removed all em-dashes from emails, rewrote Welcome 2 + Abandoned Cart + Win-back
- Fixed Vercel routing (static HTML pages weren't being served)
- Fixed checkout-v3 mobile: hero text, toggle buttons, show more reviews
- Added free reading link to checkout hero
- Improved free reading upsell copy with "1 of 14 placements" depth showcase

### Known issues to fix:
- [ ] Email asked twice (free-chart captures it, then intake asks again) — need to skip email step if already captured
- [ ] Old promotional content at end of intake form (testimonials, cosmic card, reviews) — user has already paid, remove these
- [ ] "Discover your bond" page has white text on light bg — need screenshot to identify
- [ ] Free chart page design could be more polished
- [ ] Menu/nav with login link
- [ ] Dark mode toggle
- [ ] Create Stripe promotion codes: COSMIC30, GIFTLOVE30, COMEBACK35
- [ ] ManyChat integration for lead magnet

*Last updated: 2026-03-15*
