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
- [ ] P1-2: Horoscope content quality review
- [ ] P1-3: SoulSpeak paywall marketing upgrade
- [ ] P1-4: Free lead magnet ("Pet Zodiac Snapshot")
- [ ] P1-5: End-to-end Stripe flow testing
- [ ] P1-7: Horoscope subscriber welcome email
- [ ] Investigate Resend 502 — may need domain/API key verification

### Phase 3 (Later)
- [ ] P2-1: Horoscope archive UI
- [ ] P2-2: Generation error monitoring
- [ ] P2-3: Horoscope subscriber email sequence

*Last updated: 2026-03-13*
