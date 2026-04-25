# Little Souls — DESIGN.md

> Source of truth for every visual decision on littlesouls.app.
> Read this BEFORE editing any page, component, email, or marketing surface.
> When the `frontend-design` skill activates, this file is the brief.

---

## 0. Brand thesis

Little Souls sells **transformation**, not a product. A reading is a **sacred cinematic reveal** — paid for, anticipated, opened like a letter from the cosmos. The site must feel like the brand of someone who takes the astrology seriously (VSOP87 rigor) AND treats the pet bond with reverence (memorial, new pet, soul bond).

Reference vibe: **Granola × Criterion** — premium warmth with rigor. Magazine-grade editorial calm for product surfaces; full-bleed cinematic dark only at named reveal moments.

Mood words: **considered, warm, honest, reverent, slightly literary, never plastic.**

Two failure modes to avoid:
- **AI-slop SaaS** — purple gradients on white, Inter everywhere, bento grids, glassmorphism, scale-on-hover, generic 3-column features
- **Mystical kitsch** — cartoon stars/moons, Comic Sans-mystic, neon purple cosmos, "your stars say…" clip-art energy, fortune-cookie tone

---

## 1. Aesthetic direction (locked)

**Primary system: Warm Editorial.** Cream canvas, ink type, rose action, gold ceremonial accent, serif headlines, generous whitespace, flat surfaces, depth from tone shifts and hairline borders — not shadows.

**Secondary system: Cosmic Reveal (Dark).** Midnight canvas, oversized serif display, soft gold + rose glows, slow motion, gradients allowed. Used **only** at:
- Hero of homepage (above the fold can go cinematic)
- Wait-screen / processing reveal
- The reading view itself (the cinematic delivery experience)
- Memorial-product surfaces (grief tone benefits from depth)

Everywhere else (checkout, intake, blog, account, emails, marketing pages, FAQ): Warm Editorial only.

**Never mix the two systems on the same fold.** A section is either warm or cosmic, never both.

---

## 2. Color tokens

These match the live `tailwind.config.ts` — do not invent new tokens, extend these.

### Warm Editorial (default everywhere)
```
--cream:           #FFFDF5   /* page bg */
--cream-2:         #faf6ef   /* surface lift */
--cream-3:         #f5efe6   /* tonal divider */
--sand:            #e8ddd0   /* hairline border */
--ink:             #3d2f2a   /* heading + body */  (also memory: #141210 for ultra-bold display)
--warm:            #5a4a42   /* body secondary */
--muted:           #9a8578 / #958779   /* meta, captions */
--rose:            #bf524a   /* primary CTA, link underline, single accent */
--rose-hover:      #a8473f
--gold:            #c4a265   /* ceremonial accent — frames, dividers, pricing tier seals */
--gold-dark:       #8b6f3a
--earth:           #6b4c3b   /* tertiary illustration */
--success:         #6b7a3d
--danger:          #a53e2a
```

### Cosmic Reveal (named moments only)
```
--cosmos-bg:       #0d0a14   /* near-black, slight violet undertone — NOT pure black */
--cosmos-surface:  #1a1420
--cosmos-text:     #f5efe6   /* cream, NOT pure white */
--cosmos-text-dim: #b8a89c
--cosmos-rose:     #d97268   /* rose lifts on dark */
--cosmos-gold:     #d4b67a   /* gold lifts on dark */
--cosmos-glow:     0 0 80px rgba(212, 182, 122, 0.25)   /* soft gold halo, never pink-purple */
--cosmos-gradient: radial-gradient(ellipse at top, #2a1f3a 0%, #0d0a14 60%)   /* deep cosmos, NEVER neon */
```

### Hard rules
- **One accent per viewport.** Rose is the call-to-action; gold is the ceremonial frame. They never both shout. If gold is heavy in a section, rose retreats to ghost. If rose CTA is loud, gold is hairline only.
- **Never tint body text with accent.** Ink, warm, or muted. Rose is for links and CTAs only.
- **Never use shadcn defaults straight.** The default slate/zinc neutrals MUST be replaced with cream/sand/ink before any component ships. Re-theme `--background`, `--foreground`, `--border`, `--primary`, `--muted` in `index.css`.
- **Banned colors:** pure white (#FFFFFF), pure black (#000000), default Tailwind gray-*, any purple gradient. Cosmos uses warm-violet undertone, never bright purple.

---

## 3. Typography

Stack already in `tailwind.config.ts`:
- **Display headlines:** `Playfair Display`, fallback `Georgia`. Weight 400/500/600. For hero & section openers.
- **Editorial / long-form headlines:** `DM Serif Display`, fallback `Georgia`. Heavier ceremonial moments (pricing tier names, reading section titles).
- **Inline accent serif:** `Cormorant`, fallback `Georgia`. For pull-quotes, italicised one-liners inside body, attribution lines.
- **Script accent:** `Caveat`. Used **once per page maximum**, for handwritten signature moments only (never headlines, never body).
- **Body & UI:** `Lato`, fallback `system-ui`. Weight 400 body, 500 UI labels.

### Type scale (modular 1.25, in px)
```
13 / 15 / 17 / 21 / 26 / 32 / 40 / 50 / 62 / 84
```

Hero headline: 62 desktop → 36 mobile. Long-form body: 18 desktop, 18 mobile (NOT 16 — readability is sacred).

### Rules
- **Headlines:** `text-wrap: balance`, letter-spacing −1.5% at 40px+, weight 400 or 500. Never 700+ for serifs.
- **Body:** `text-wrap: pretty`, line-height 1.6, measure 65–72 characters, weight 400.
- **UI labels / eyebrows:** Lato 13px, uppercase, letter-spacing +8%, weight 500. Used sparingly above section titles.
- **Numerals on prices, ages, dates:** `font-variant-numeric: tabular-nums`. Money never reflows.
- **Mix at most 2 font families per page** (one serif + Lato). Cormorant and Caveat are accents inside that — used sparingly.
- **Never use Inter.** Lato is the body. Period.
- **Never use bold sans for headlines.** Headlines are serif.

### Eyebrow pattern
```
ASTROLOGY               <- 13px Lato uppercase +8% tracking, muted
The Soul Reading        <- 50px Playfair Display 500, ink, balance
A cosmic delivery…      <- 21px Cormorant italic, warm
```

---

## 4. Layout & spacing

- **8px baseline.** All spacing on 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128.
- **Section break:** 96px desktop, 64px mobile.
- **Max width:** 680px for long-form copy, 1080px for marketing pages, 1280px for app shells.
- **12-column grid, 24px gutter** desktop, 16px mobile.
- **Asymmetry encouraged** for editorial pages (off-center hero, sidenote pull-quotes, image bleed). Symmetry is for product/checkout where trust matters.
- **Generous whitespace is the brand.** When in doubt, double the padding. Never tighten to fit "more above the fold."

---

## 5. Components

### Buttons
- **Primary CTA:** rose fill (`#bf524a`), cream text, radius 8px, padding 12/24, Lato 500. Hover: `--rose-hover`, no scale, no lift, no shadow.
- **Secondary:** 1px sand border, ink text, transparent fill. Hover: `--cream-2` background.
- **Ghost:** ink text, underline appears on hover.
- **Cosmic CTA** (only on cosmos surfaces): cosmos-gold fill, ink text, radius 999 (pill OK on dark), soft gold glow on hover.
- **Banned:** gradient-fill buttons, scale(1.02) hover, drop-shadow on rest, two saturated buttons side-by-side, emoji in label.

### Cards
- Background `--cream-2` on `--cream` page, no border, no shadow, radius 8px, padding 24–32.
- Hover: 1px `--sand` border appears. **Never** scale, lift, translate, or shadow.
- For pricing/tier cards: 1px gold hairline border + small gold seal (16px) top-right; never gold fill.
- Memorial cards: 1px ink hairline, padding 32, optional Cormorant italic header.

### Inputs
- 1px sand border, radius 6px, padding 12/16. Focus: 2px rose outline with 2px offset.
- **Never** glow, never shadow on focus. White-text-on-cream is banned.

### Navigation
- Horizontal, transparent on cream. Underline-on-hover, rose underline on active. **No pill backgrounds.**
- Mobile: 2–3 primary links shown, hamburger only after that. Never hamburger-only on desktop.

### Tables / lists
- Hairline `--sand` between rows, header in 13px Lato uppercase eyebrow.
- Tabular figures on numbers.
- Never zebra-stripe with saturated color — use `--cream-2`.

### Photos & imagery
- **Pet photos:** circular frame, 2px gold hairline border, soft cream backdrop. Never rectangular drop-shadow boxes.
- **Cosmic imagery:** real astrophotography (NASA, ESO public domain) or commissioned warm-watercolor — never AI-generic-cosmos clipart, never neon nebulae stock.
- **Illustration style:** if introduced, hand-drawn ink line + cream wash, gold highlights. Never flat geometric SaaS illustrations, never Lottie cartoon.

---

## 6. Depth & motion

### Depth
- **Flat by default.** Depth from cream tone shifts (`--cream-2` over `--cream`) and 1px sand borders.
- **Shadows:** modals only, single soft shadow `0 12px 32px rgba(61, 47, 42, 0.08)`. Cosmos modals use `0 24px 64px rgba(0, 0, 0, 0.6)`.
- **Never:** card-lift shadows, neumorphism, glassmorphism, frosted-blur over warm backgrounds (it muddies cream).

### Motion
- **Default duration:** 200ms ease-out. Slow ceremonial: 600ms ease-in-out (reveals only).
- **Allowed:** opacity fades, color transitions, border appears, text-wrap balance settling.
- **Banned everywhere except cosmos reveals:** scale on hover, translate-y on hover, parallax, autoplay video, infinite loops, marquee, carousel auto-advance.
- **Cosmic reveals can:** fade-in oversized serif (1200ms), soft gold glow pulse (3s), slow zoom-out on hero photo (8s, single play, never loop), staggered text reveal on the reading delivery.

### Loading states
- Skeleton: `--cream-2` with subtle `--sand` shimmer. Not gray.
- Reveal/wait-screen: cosmos surface, single line of Cormorant italic ("We're consulting the stars…" — but ALWAYS check `feedback_honour_the_astrology.md` for tone), slow gold pulse, no progress bar.

---

## 7. Voice in UI copy

(See `feedback_honour_the_astrology.md`, `feedback_quoted_copy_is_context.md`, `feedback_transformation_not_product.md` and run `/copy-quality-check` before shipping.)

- **Microcopy = full sentences with periods.** Never "Click here." Always "See your reading."
- **Never reference AI** in user-facing copy.
- **Never use the word "report"** as the product noun. It's a "reading" or the tier name.
- **Never write "we'll email you"** or "check your inbox." It's a reveal, not a delivery.
- **Never cheapen with** "love carries the distance," "it's the thought that counts," "accuracy isn't the whole story."
- **Never use emojis in UI chrome.** Emojis are fine in marketing copy where genuine, never in buttons, nav, or labels.

---

## 8. Page-by-page surface assignment

| Surface | System | Notes |
|---------|--------|-------|
| Homepage hero | Cosmic Reveal | Full-bleed, oversized Playfair, slow gold glow, single rose CTA |
| Homepage below-fold | Warm Editorial | Cream, ink type, rose accents only on CTAs |
| Pricing tiers | Warm Editorial | Gold hairline + seal on premium tier card |
| Intake / quiz | Warm Editorial | Cream, rose CTA, never dark, never glassy |
| Checkout | Warm Editorial | Trust-first, hairline borders, payment badges in muted, NO experimentation |
| Wait-screen | Cosmic Reveal | Slow gold pulse, single Cormorant italic line |
| The Reading viewer | Cosmic Reveal opening → Warm Editorial body | Cinematic open, then long-form magazine |
| Memorial flows | Cosmic Reveal (muted) | Deeper, slower, no rose — gold + ink only |
| Account / settings | Warm Editorial | Quiet, flat, app-shell |
| Blog | Warm Editorial | New Yorker-grade long-form, 680px measure |
| Email | Warm Editorial | Cream bg, Georgia body, gold pet-photo frame, single rose CTA |
| FAQ / legal | Warm Editorial | Editorial body, no decoration |

---

## 9. Pre-ship checklist (run on every PR touching design)

Quick test: would this look at home in **Kinfolk magazine** (warm) or in a **Criterion Collection film opener** (cosmic)? If neither — it's wrong.

Then verify:
- [ ] No Inter, no Roboto, no system-ui-only fallback
- [ ] No purple gradients, no glassmorphism, no neon
- [ ] No scale-on-hover or lift-on-hover (except cosmos)
- [ ] No drop-shadow on cards (modals only)
- [ ] No pure white, no pure black
- [ ] One accent per viewport (rose OR gold loud, not both)
- [ ] Tabular numerals on prices/dates
- [ ] Tap targets ≥ 44px
- [ ] WCAG AA contrast (run `accessibility-audit` skill)
- [ ] Mobile body text ≥ 18px on long-form
- [ ] Microcopy passes `/copy-quality-check`
- [ ] Tier names verified (don't ship wrong product name)
- [ ] No "AI", no "report", no "we'll email you"

---

## 10. When this file conflicts with itself or with a request

DESIGN.md wins over Tailwind defaults, shadcn defaults, and any inherited component library.
DESIGN.md does NOT override `feedback_honour_the_astrology.md`, `feedback_transformation_not_product.md`, `feedback_quoted_copy_is_context.md`, or the sacred-product copy rules in `~/.claude/rules/littlesouls.md` — those are upstream.

If a request asks for something that breaks this file (e.g. "add a purple gradient hero"), surface the conflict and propose the on-aesthetic alternative before implementing.

---

*Last updated: 2026-04-25. Aesthetic family ref: Warm Editorial (Claude/Notion/Resend) × Cosmic Reveal (Runway/Criterion). Tailwind tokens already present in `tailwind.config.ts`.*
