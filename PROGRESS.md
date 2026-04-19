# Work In Progress

This file is updated by Claude Code as we work. If your computer crashes, share this with Claude to pick up where we left off.

---

## 2026-04-15 — Blog engine Phase 3 shipped + homepage AEO upgrade

**Status:** DEPLOYED + verified end-to-end. Deep-dive context lives at `~/.claude/projects/C--Users-danie/memory/project_littlesouls_seo_aeo_plan.md`. Strategic docs at `cosmic-pet-portraits/docs/phase*.md`.

### What went live (commits `9a2f22c` → `eb39877`)

**The blog engine**
- DB schema extended: `authors` table + 5 characters + `blog_posts`/`blog_topics` enriched (cluster, author_slug, tags, tldr, faq, anchor_variants, sources, featured_image_url, etc.)
- Editorial calendar seeded: Months 1-3 (36 scheduled topics through Jul 10) + 100 backfill = 136 topics / ~10 months runway
- Edge function `auto-generate-blogs` rewritten — OpenRouter Claude Sonnet 4.5, character-voiced, TL;DR + 4-6 H2 + 3-5 FAQ + inline citation + middle/end CTA + auto-linking
- Vercel Cron Mon/Wed/Fri 10:00 UTC
- 3 posts shipped: `dog-birthday-personality-astrology-guide`, `dog-zodiac-signs`, `cat-zodiac-signs-meanings`

**Images**
- 5 author portraits generated via Kie.ai nano-banana-2, uploaded to **Supabase Storage** bucket `author-portraits` (permanent; earlier tempfile URLs expired within hours)
- Hero + 2 inline section images per post via **Pexels** (Claude picks 2-4 word search query per section, `afterHeading` targeting). Dedupe vs hero URL. 3-stage fallback query.
- Backfill scripts at `scripts/backfill-inline-images.py` + `scripts/dedupe-inline-images.py`

**Frontend**
- `src/pages/BlogPost.tsx` — breadcrumb, byline, visible hero image, TL;DR, FAQ block, cluster-aware CTAs, author bio card, inline `<figure>` images with captions
- `src/pages/AuthorPage.tsx` NEW — /author/:slug with Person+CollectionPage schema
- `src/pages/Blog.tsx` — listing cards with hero thumbnail + author byline
- UTM attribution on every CTA click (`utm_source=blog&utm_medium=cta&utm_campaign=<slug>&utm_content=(middle|end|inline)`)
- All blog CTAs now point to `/` (new funnel); `/checkout` links purged

**Discovery & AI search**
- `/api/blog-ssr` — bot-only SSR endpoint. vercel.json `has` user-agent rewrite routes 20+ crawlers (GPTBot, ClaudeBot, PerplexityBot, Googlebot, bingbot, Applebot, Amazonbot, meta-external, anthropic-ai, etc.) to pre-rendered HTML. Humans continue on SPA.
- `/api/sitemap` dynamic — static routes + posts + authors (16 URLs current)
- `/api/cron/indexnow-ping` — fires 30min after each blog cron, broadcasts to Bing/Yandex/Seznam/Naver (reaches Perplexity + ChatGPT search via Bing)
- IndexNow key file `public/cafaa0c1a857d082b02b0015353028fc.txt`
- `robots.txt` confirmed allows 22 UAs including all AI crawlers
- `llms.txt` enriched (80+ lines) with 4.9/5 header, 10 reviewer quotes, author bios, differentiators, "is it legit" block
- Google Search Console verified via DNS TXT + sitemap submitted

**Homepage schema (Apr 15)**
- Added `AggregateRating 4.9/5, 71 reviews` to Organization + Service
- Added 10 structured `Review` nodes (real reviewer names/text from `MassiveReviews.tsx`)
- Swapped stale `/checkout` Offer URLs → `/`

### Dependencies that can break the autopilot
1. **OpenRouter credit** — powers blog + horoscopes + reports. Only recurring maintenance.
2. Topic queue (10-month runway, alert when <30 remain)
3. Working Supabase PAT — primary `sbp_c42487...` died mid-session; fallback `sbp_aa46d3c653a36fe9f8cad763f989778a5fbdfbea` verified active w/ admin scope

### Cost per post (verified)
~$0.05-0.06 per post (Claude Sonnet 4.5 via OpenRouter). Annual autopilot: **~$9-14**. Pexels + Supabase + Vercel all free-tier.

### Next-session queue (biggest levers first)
1. **Phase 3 social repurposing** — wire existing n8n content workflows to auto-post each new blog as IG carousel + TikTok + Pinterest + Twitter thread. Biggest compounding effect.
2. **Stripe UTM→metadata bridge** — attribute checkout purchases to source blog posts via the UTM params already being appended.
3. **AdminBlogStats enhancements** — 30-day trend chart, top-referrer breakdown.
4. **Guest post ghostwrites** — draft 3 pieces as Elena/Callum for Daily Paws / Dogster / PetMD pitches.
5. **Data-study post** — analysis of real report data ("happiest zodiac signs") → journalist bait for earned backlinks.
6. **Months 4-12 calendar seed** — run when topic queue <30.
7. **SSG migration** — full pre-render via vite-react-ssg (currently only bots get SSR). 2-4 hrs.

### Requires Danny manually
- Trustpilot profile + invite customers (biggest external review signal)
- Reddit organic mentions in r/dogs/r/cats/r/astrology
- Bing Webmaster Tools import (optional — IndexNow already covers indexing)
- HARO/Qwoted signup as Elena/Callum for press quotes

### Verification quickies (next session warm-up)
```
curl -sSL "https://littlesouls.app/blog/<slug>" -A "GPTBot/1.0" | grep -c "ls-tldr-label"  # expect 2
curl -sSL "https://www.littlesouls.app/" -A "Googlebot" | grep -c "aggregateRating"        # expect 2
curl -sSL "https://littlesouls.app/sitemap.xml?v=$(date +%s)" | grep -c "<loc>"             # expect >= 16
```

---

## 2026-04-12 (overnight) — SoulSpeak WhatsApp-style redesign

**Status:** DEPLOYED. Commit `7f26c9c` on `main`. Frontend auto-deploys via Vercel.

### What to test when you wake up
1. Open `https://littlesouls.app/soul-chat.html?id=2e47a0a6-06a4-49cc-a0da-58cdb53357d6` (needs email in sessionStorage — go via normal report view flow first)
2. Look at the messages area — wallpaper should be visible in the background
3. Tap the **palette icon** in the header (left of menu) — opens a bottom-sheet popover
4. Try all 3 wallpapers (animals / constellations / hearts) — instant switch
5. Toggle **Light / Dark** — everything should recolour, mobile browser chrome changes too
6. Close + reopen — selected wallpaper + mode persists via localStorage
7. Trigger the paywall (deplete credits or tap "Maybe later" then force it) — new cream + gold cards, no brown clash
8. Open the sidebar (hamburger icon) → Credits tab — 3 pricing cards also redesigned

### What changed (single file: `public/soul-chat.html`)
- **3 wallpapers** as inline SVG data URLs on a fixed `.chat-wallpaper` layer
  - Animals: scattered gold paw prints + hearts (your funnel review wallpaper vibe)
  - Constellations: connected star patterns in gold
  - Hearts: rose hearts scattered (matches CTA colour)
- **Dark mode** full coverage via `[data-theme="dark"]` CSS var overrides
- **Theme picker** — palette icon in header → bottom-sheet popover with 3 wallpaper thumbnails + Light/Dark toggle. Saved to `localStorage.soulspeak_wallpaper` + `localStorage.soulspeak_mode`. Applied before first paint (no flash).
- **User bubbles** — brown gradient → rose gradient (matches brand)
- **Send button** — brown → rose
- **Paywall cards** (overlay + sidebar both): removed dark brown/black gradients. Cream + gold + rose palette throughout.
  - BEST VALUE card: gold-washed background + soft glow
  - Soul Bond membership: gold halo line on top + rose CTA badge
- **Meta theme-color** switches with mode so mobile browser chrome matches

### Untouched
- All pricing numbers (400 starter / 50 per msg / Top Up 750 / Deep Talk 2,500 / Soul Bond 1,000 per week)
- Edge functions (Sonnet + validator + RLS + server credit gate — all from previous commit)
- Report generation pipeline
- Stripe webhook logic

### Deferred (nothing blocking)
- Cross-session conversation memory (still in backlog from yesterday's commit)
- Owner name in intake
- Phrase-variance tracker

---

## 2026-04-12 — SoulSpeak pricing + security overhaul

**Status:** Code changes applied locally. Pending deploy: `supabase functions deploy soul-chat create-chat-purchase stripe-webhook` + migration `20260412120000_soul_chat_secure.sql`.

### Final pricing (locked)
- Cost per message: **50 credits** flat (no first-message-free hack)
- Starter grant: **400 credits = 8 messages**
- Top Up: 750 credits / $7.99 (15 msgs)
- Deep Talk: 2,500 credits / $19.99 (50 msgs) — renamed from "Deep Bond"
- Soul Bond membership: 1,000 credits/week / $12.99/mo (20 msgs/week)

### Bugs fixed
1. **RLS exposure** — anon could PATCH `credits_remaining: 999999`. New migration drops anon INSERT/UPDATE; credits now mutate only via service role in edge function.
2. **Client-side first-message-free bypass** — removed `isFirstMessage` flag; first-message detection now derived server-side from message count.
3. **Membership credit math** — was granting 400 credits/wk while advertising "40 messages". Now grants 1,000 credits/wk = 20 messages, copy reframed honestly.

### Files touched
- `public/soul-chat.html` — pricing UI, removed client PATCH, server balance sync on reply
- `supabase/functions/soul-chat/index.ts` — server-side credit gate + atomic decrement + memorial temperature tweak
- `supabase/functions/create-chat-purchase/index.ts` — new tiers + metadata
- `supabase/functions/stripe-webhook/index.ts` — `weekly_credits` fallbacks 400 → 1000
- `supabase/migrations/20260412120000_soul_chat_secure.sql` — RLS lockdown + `decrement_chat_credits` RPC

### Additional intelligence upgrades (same session)
- **Wider petData** — chart placement degrees, full elementalBalance, compatibility (bestPlaymates + challengingEnergies + humanCompatibility), full luckyElements (number/day/colour/powerTime), nameMeaning (origin + vibration + numerology), crystal reason, aura description, cosmic nickname reason, meme description, dream job reason, owner's first name
- **Model swap** — Haiku 4.5 → Sonnet 4.5 (main generation). Haiku 4.5 kept for validator.
- **Prompt caching** — system prompt marked `cache_control: ephemeral` via OpenRouter content-array format. Drops subsequent-message input cost ~90% within 5-min window.
- **Validator pass** — after Sonnet reply, Haiku fact-checks for invented specifics (events, dates, named humans, contradicting traits). One regenerate max on fail. JSON-mode response.
- **Memorial temperature** — 0.6 (was 0.8) for more consistent gentle tone.

### Deferred (next session)
- Cross-session conversation memory (summarise past sessions into a `chat_memory` column, inject at prompt top)
- Add `owner_name` field to intake schema + worker (currently pulled from `ownerAnswers.ownerName` if present)
- Dead code at stripe-webhook:656-663 writes to non-existent columns `report_id/email/plan` on chat_credits — investigate whether horoscope-subscriber grant is actually working
- Phrase-variance tracker to stop Sonnet repeating "zoomies"/"my favourite human" on long chats

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

### Fixed later in session:
- [x] Routing overhaul: all CTAs → /checkout-v3, /intake redirects to /checkout-v3 (gift flow preserved)
- [x] Yellow background → cream #FFFDF5 (VariantBackground.tsx)
- [x] "Discover Your Bond" white text → dark readable text with gold/green accents
- [x] Photo upload text updated in CheckoutPanel + PostPurchaseIntake
- [x] Old petreports.co email → hello@littlesouls.app
- [x] Stripe cancel URL → /checkout-v3
- [x] Vercel routing: static HTML pages served before SPA catch-all
- [x] Free reading upsell: "1 of 14 placements" depth showcase, CTA → /checkout-v3

### Remaining for next session:
- [x] Menu/nav with login (subtle, in ticker bar area)
- [x] Dark mode toggle (warm dark theme)
- [x] Create Stripe promotion codes: COSMIC30, GIFTLOVE30, COMEBACK35
- [x] End-to-end Stripe flow test (audit)
- [x] Mobile optimization pass (broader)
- [x] ManyChat integration for lead magnet

---

## Current Session: March 15 late — Nav, Dark Mode, Stripe, E2E Audit

### Completed:
1. **Variant C nav bar** — Replaced hidden navbar with slim bar: "Little Souls" logo + dark mode toggle + Sign In/My Account
   - React: `Navbar.tsx` shows ticker-style bar for variant C with auth-aware dropdown
   - checkout-v3: Added logo, dark toggle, account link to ticker bar
   - Auth detection via localStorage token in checkout-v3.html

2. **Warm dark mode** — Full dark theme across all pages
   - React: New CSS variables in `index.css` for `.dark` and `.variant-c.dark`
   - EmotionalJourney: `useColors()` hook swaps LIGHT_COLORS/DARK_COLORS reactively
   - checkout-v3: CSS custom properties redefined under `html.dark`, dark overrides for cards/inputs/floating CTA
   - Toggle persists via `ls-dark-mode` in localStorage
   - Footer links now use Tailwind classes (dark-mode aware)

3. **Stripe promotion codes** — `allow_promotion_codes: true` added to both checkout sessions
   - Quick checkout (line 222) and standard checkout (line 581) in create-checkout
   - **Still needed**: Create COSMIC30 (30%), GIFTLOVE30 (30%), COMEBACK35 (35%) in Stripe Dashboard > Products > Coupons > Promotion Codes

4. **E2E Stripe flow audit** — Full pipeline verified working:
   - checkout-v3 → create-checkout → Stripe session → webhook → generate-report-background → n8n → worker → send-report-email
   - All URLs correct, metadata flowing, auth working
   - **Still needed**: Manual browser test with test card 4242424242424242

5. **Mobile optimization** — All pages responsive, dark mode overrides for floating CTA, mini cards, inputs
   - Touch targets 44px+ on mobile
   - Testimonials scroll-snap, toggle buttons stack vertically

6. **ManyChat** — Placeholder snippet added to `free-chart.html` (commented out)
   - **Still needed**: Create ManyChat account, set up Growth Tool, get widget ID, uncomment snippet

### Files changed:
- `src/components/Navbar.tsx` — Variant C slim nav with dark mode toggle + auth
- `src/index.css` — Warm dark mode CSS variables
- `src/pages/Index.tsx` — Dark-mode-aware bg + footer
- `src/components/variants/variant-c/EmotionalJourney.tsx` — useColors() hook, removed internal GiftBanner/TickerBar
- `public/checkout-v3.html` — Logo, dark toggle, account link in ticker, dark CSS overrides
- `public/free-chart.html` — ManyChat placeholder
- `supabase/functions/create-checkout/index.ts` — allow_promotion_codes: true

### Deploy checklist:
- [ ] Push code to git
- [ ] Deploy frontend to Vercel (auto on push)
- [ ] Deploy create-checkout edge function: `npx supabase functions deploy create-checkout`
- [ ] Create Stripe promotion codes in dashboard
- [ ] Activate ManyChat widget
- [ ] Run E2E test with test card

*Last updated: 2026-03-15 late evening*

---

## Completed: Frontend Audit & Launch Prep (March 16)

**Status:** DONE — deployed, all endpoints tested live, site ready for orders

### What was done:

1. **Pricing alignment (CRITICAL FIX)**
   - Server `create-checkout` TIERS were $35/$50 (old Lovable values) — fixed to $27/$35
   - Server GIFT_TIERS were $17.50/$25 — fixed to $13.50/$17.50
   - React CheckoutPanel volume discounts were 50/40/30/20% — fixed to 30/25/20/15% (matches server + checkout.html)
   - All three pricing sources (checkout.html frontend, React CheckoutPanel, server edge function) now aligned

2. **Renamed checkout-v3 → checkout**
   - `public/checkout-v3.html` → `public/checkout.html`
   - Updated 15+ references across src/pages, src/components, vercel.json, free-chart.html
   - Backward-compat rewrite in vercel.json: `/checkout-v3` → `/checkout.html`
   - Canonical URL and og:url updated in HTML

3. **Error boundary added**
   - Installed `react-error-boundary`
   - Wraps all routes in App.tsx with friendly "Something went wrong" fallback + Try Again button
   - Prevents white-screen crashes from lazy-loaded pages

4. **Security headers added (vercel.json)**
   - `X-Frame-Options: DENY` (clickjacking protection)
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

5. **Edge function deployed**
   - `create-checkout` redeployed to Supabase with corrected pricing

### Live site test results (all passing):
- All 13 routes return HTTP 200
- `create-checkout` creates correct Stripe sessions ($27 basic, $35 premium, volume discounts work)
- `redeem-free-code` validates codes correctly
- `verify-payment` responds correctly
- `get-report` returns full report data (tested with Monty)
- `purchase-gift-certificate` endpoint live
- `send-report-email` endpoint live
- n8n webhook responds HTTP 200
- Worker on DO droplet active
- Stripe in live mode (cs_live_ sessions)

### Files changed:
- `supabase/functions/create-checkout/index.ts` — Fixed TIERS, GIFT_TIERS pricing
- `public/checkout.html` — Renamed from checkout-v3.html, updated canonical/og URLs
- `src/App.tsx` — Error boundary, checkout redirect path update
- `src/components/intake/CheckoutPanel.tsx` — Volume discount fix
- `src/components/Navbar.tsx` — /checkout links
- `src/components/CTASection.tsx` — /checkout links
- `src/components/report/AllReportsComplete.tsx` — /checkout links
- `src/pages/Intake.tsx` — /checkout redirect
- `src/pages/Account.tsx`, `Blog.tsx`, `BlogPost.tsx`, `MyReports.tsx` — /checkout links
- `public/free-chart.html` — /checkout upsell link
- `vercel.json` — Rewrites + security headers
- `package.json` — Added react-error-boundary

*Last updated: 2026-03-16*

---

## Session: March 16 (continued) — Report Quality Overhaul & Final Polish

### Completed:
1. **Report content fixes** (worker prompt)
   - Dominant element now uses actual chart balance math (not just Sun sign element)
   - Pet-safe recipe (real treats with pumpkin, oats, sweet potato — not human food)
   - Text messages section added (morning/afternoon/night iMessage-style)
   - Dream job fields aligned with viewer (description + funny salary)
   - 10-point overdelivery content quality standard

2. **Humanizer anti-slop rules** in worker prompt
   - Banned 15+ AI crutch words (fascinating, gorgeous, profound, tapestry, etc.)
   - Banned patterns: "creates this", "here's the thing", excessive ALL CAPS
   - "Love test": emotional sections sound like a best friend, not an AI
   - Result: 51% reduction in AI markers (76 → 37)

3. **Report viewer upgrades**
   - Share button in sticky chapter progress bar (always visible)
   - Per-section share hints on 7 viral sections
   - Better section labels: "If X Was on Tinder...", "What X Googles When You're Asleep"
   - Cosmic card stats boosted (floor 75, base 82-97)

4. **Email link fix** — shareToken auto-generated, included in report email link (bypasses email verification wall)

5. **SEO & analytics** — OG tags + GA4 placeholder on checkout.html and free-chart.html

6. **Stripe webhook idempotency** — prevents duplicate payment processing

7. **UI polish** — Removed "Little Souls" text from nav bar, reviews scroll vertically on mobile

### Test reports generated:
- Willow (Ragdoll, pre-humanizer): `f319bf43-e004-4520-a64d-d18294806e1c`
- Mochi (Shiba Inu, post-quality): `93e11511-19de-44cb-8b80-d08eeee1e8a6`
- Bear (Golden Retriever, post-humanizer): `8f4f5501-fd53-4590-9b29-45e2890c5505`

### Before launch — next session:
- [ ] E2E Stripe test purchase with test card in browser
- [ ] Create Stripe promo codes: COSMIC30 (30%), GIFTLOVE30 (30%), COMEBACK35 (35%)
- [ ] Set up GA4 (analytics.google.com) — replace G-XXXXXXXXXX in checkout.html + free-chart.html
- [ ] Create OG image (1200x630px) → public/og-image.png
- [ ] Activate ManyChat widget on free-chart
- [ ] Final content quality review of Bear's report

*Last updated: 2026-03-16 evening*

---

## Session: March 16 (late) — Intake Form Overhaul & Tier Restructure

### Completed:

**Strategic Change:** Photo upload is now FREE for all tiers. Premium upsell is now "Pet-Parent Soul Bond" (compatibility analysis) instead of portrait/keepsake card. Same pricing ($27 base, +$8 for Soul Bond).

1. **checkout.html (sales page)**
   - "Add Portrait" toggle → "Add Pet-Parent Soul Bond" with heart icon + description
   - Added "Upload your pet's photo — Included" badge for all tiers
   - Order summary label: "Portrait" → "Pet-Parent Soul Bond"

2. **CheckoutPanel.tsx (IntakeWizard checkout)**
   - Basic tier: "Full Reading" → "Soul Reading", benefits mention pet photo included
   - Premium tier: "Keepsake Card" → "Soul Bond" with "Deep pet-parent compatibility"
   - Photo upload ungated — available for ALL tiers (not just premium)
   - Photo section shows "INCLUDED" badge
   - Tier changes no longer clear photos
   - Gift tier names: "Cosmic Pet Reading"/"Portrait Edition" → "Soul Reading"/"Soul Bond Edition"

3. **PostPurchaseIntake.tsx (main post-checkout form — what regular purchasers see)**
   - **Date picker rebuilt**: month/year dropdowns + day grid, OR "estimate age" toggle
   - No more scrolling through native date picker — tap month, tap year, tap day
   - **Location improved**: MapPin icon, loading spinner, "Use my current location" GPS button
   - Quick-select cities: New York, London, Sydney, Toronto, Dubai, Paris
   - Photo upload copy updated: "We'll weave it into every page of the report"

4. **IntakeStepOwnerDetails.tsx (owner birth details for compatibility)**
   - Rebranded: "Optional: Cosmic Connection" → "Pet-Parent Soul Bond"
   - CTA: "Reveal Our Cosmic Connection" → "Reveal Our Soul Bond"
   - **Location autocomplete added** — Nominatim search with dropdown (was plain text input)

5. **IntakeStepLocation.tsx (pet location in IntakeWizard)**
   - Quick-select cities expanded: 6 → 8, more globally diverse (added Toronto, Mumbai, Berlin, São Paulo)

6. **IntakeWizard.tsx (gift flow)**
   - Photo upload now shown for ALL gift recipients (not just portrait tier)
   - Multi-pet photo selection works for all gifts

### Files changed:
- `public/checkout.html` — Soul Bond upsell, photo included badge
- `src/components/intake/CheckoutPanel.tsx` — Tier rename, photo ungated
- `src/components/intake/PostPurchaseIntake.tsx` — Date picker, location improvements
- `src/components/intake/IntakeStepOwnerDetails.tsx` — Soul Bond branding, location autocomplete
- `src/components/intake/IntakeStepLocation.tsx` — More global cities
- `src/components/intake/IntakeWizard.tsx` — Photo upload for all gift recipients

### Build: Clean ✓ (tsc + vite build pass)

### Still needed:
- [x] **Worker prompt: Pet-Parent Soul Bond section** — DONE (see March 17 session below)
- [ ] **create-checkout edge function** — verify labels still work (internal tier names `basic`/`premium` unchanged, should be fine)
- [ ] E2E Stripe test purchase with test card in browser
- [ ] Create Stripe promo codes: COSMIC30, GIFTLOVE30, COMEBACK35
- [ ] Set up GA4
- [ ] Create OG image (1200x630px)
- [ ] Activate ManyChat widget
- [ ] Push code + deploy (includes Soul Bond + all intake changes)

*Last updated: 2026-03-16 late night*

---

## Session: March 17 — Pet-Parent Soul Bond (Premium Section)

### Completed:

1. **Worker: Owner chart calculation** (`worker/worker.ts`)
   - Extracts `owner_name`, `owner_birth_date`, `owner_birth_time`, `owner_birth_location` from bridge data
   - Detects premium tier via `includes_portrait` flag
   - Calculates full natal chart for the owner (Sun, Moon, Venus, Mars, etc.) using same ephemeris-v2
   - Geocodes owner birth location for accurate positions
   - Non-fatal: if owner chart fails, report generates normally without Soul Bond

2. **Worker: Soul Bond prompt section** (`worker/worker.ts`)
   - Conditionally injected into the JSON schema ONLY when `includesSoulBond && ownerBirthDate`
   - 6 subsections: Elemental Harmony, Sun-Moon Dance, Venus Connection, Mars Energy, Soul Contract, Cosmic Rating
   - Uses REAL chart data from both pet and owner natal charts
   - Includes compatibility scores, strength areas, growth areas
   - Prompt instructs AI to make Soul Contract subsection the emotional peak
   - Added to Chapter 5 story flow and anchoring rules

3. **Fallback Soul Bond** (`worker/worker.ts`)
   - Full fallback report builder includes Soul Bond section when data available
   - All subsections populated with elemental-logic-based defaults

4. **Report viewer: Soul Bond renderer** (`CosmicReportViewer.tsx`)
   - Premium "Soul Bond" badge in top-right corner (gold gradient)
   - Elemental harmony with element pills and compatibility score
   - Sun-Moon Dance with italic cross-aspect insight
   - Venus Connection with love language match
   - Mars Energy with activity recommendation
   - Soul Contract with gold left-border, "What they teach you" / "What you give them" sub-blocks
   - Cosmic Rating with large score, verdict, and strength area pills
   - Warm rose-to-cream gradient background, matches Chapter 5 aesthetic

5. **TypeScript types** (`types.ts`)
   - Added `petParentSoulBond` interface with all 6 subsections

### Build: Clean ✓ (tsc + vite build pass)

### How it works end-to-end:
1. User selects "Soul Bond" (+$8) on checkout → `includes_portrait: true` saved to DB
2. User fills in their birth details on IntakeStepOwnerDetails → `owner_birth_date`, `owner_birth_time`, `owner_birth_location` saved
3. Worker fetches report row via bridge → detects `includes_portrait` + `owner_birth_date`
4. Worker calculates owner natal chart → injects `petParentSoulBond` section into AI prompt
5. AI generates deep compatibility analysis using both charts
6. Report viewer renders Soul Bond section in Chapter 5 (after Keeper's Bond)

### Still needed:
- [ ] Deploy worker to DO droplet (`scp worker.ts` + restart service)
- [ ] Deploy frontend to Vercel (push to git)
- [ ] Test with a premium purchase that includes owner birth details
- [ ] Verify `create-checkout` labels still work
- [ ] E2E Stripe test, promo codes, GA4, OG image, ManyChat

*Last updated: 2026-03-17*

---

## 2026-04-19 · Premium Report Viewer + Cosmic Waiting Room

**What shipped**
- Intake: dropped duplicate email step; `clearIntakeProgress()` on payment-success (closes the back-button re-report loop)
- `/dev/report` route loads `src/fixtures/report-monty.json` into the viewer — no API calls, preview any stage via `?stage=generating|reveal|viewer`; gated behind `DEV` or `?devkey=littlesouls`
- `scripts/dump-report.cjs <reportId> [name]` produces fresh fixtures from Supabase
- Lenis smooth scroll wraps the viewer; top gold hairline + side-rail chapter dots (with focus ring + aria-current) + desktop-only "~X min left" pill
- Signature moments: `ConstellationChart` (chart wheel draws itself, keyboard-reachable planets), `AuraPortrait` (pet photo in cosmic frame with 48 orbital particles), `SoulLetterUnfurl` (wax-seal break), `DawnFadeReveal` (single cross-fade before the letter)
- `QuoteCard` replaces 6 `StaticPassage` calls (same words, editorial pull-quote treatment)
- `ConstellationBreak` chapter-ceremony dividers (3 uses)
- Ghost Roman numerals behind every `ChapterTitle`; drop cap on the prologue; asterism-trio `SectionDivider`
- Per-section `PlanetOrb` with real Wikimedia imagery (sun_sdo, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune, earth) + symbolic shapes for chiron/ascendant; `PlanetSection` alternates left/right per index
- Cosmic waiting room `ReportGenerating` rewrite: starfield + nebula + constellation anchors, 4-stage pipeline (Casting → Consulting → Writing → Sealing), memorial-tone copy for grief reports, gold confetti burst on reveal mount

**Audit pass (tier 1 + 2 + 3)**
- `sunSign?.toLowerCase()` + `report.aura &&` guards protect legacy reports from crashing the viewer
- `petName` escaped via `escapeHtml` before any `dangerouslySetInnerHTML`
- `prefers-reduced-motion` respected across `AuraPortrait`, `PlanetOrb`, `ReportGenerating`, `DawnFadeReveal`, `SoulLetterUnfurl`
- `AuraPortrait` 48-particle array memoised; `ReportGenerating` cosmic frame uses `min(380px, 85vw)` so it fits iPhone SE
- Planet assets re-downloaded at 256px — total `public/planets/` dropped from 2.2MB to 684KB
- `SectionDivider` dead variants removed (~60 lines)
- `ReportScrollProgress` keyboard-focusable with visible focus ring; `SoulLetterUnfurl` auto-break pauses while the seal button has focus

**Key files**
- `src/components/report/` — all new components live here
- `public/planets/` — NASA / Wikimedia imagery
- `src/fixtures/report-monty.json` — dev preview seed
- `src/pages/DevReport.tsx` — dev-only preview route
