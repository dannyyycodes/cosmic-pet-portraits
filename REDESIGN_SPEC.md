# Soul Reading — Redesign Spec (v1)

Source: Codex vision art-direction pass (gpt-5.5, on 9 live frames) + 6-lens deep research
(gamified/scrollytelling UX, premium astrology apps, planet/NASA presentation, text-density,
data-viz quality, iconography). Both converged. Date: 2026-06-05.

**HARD CONSTRAINT:** Copy is sacred (rules/littlesouls.md). This is a STRUCTURAL + VISUAL
redesign only. No copy rewrites without Danny's sign-off.

## Direction (one line)
Turn the wall-of-text report into a gamified, premium, "discovered-not-scrolled" experience:
one idea per screen, real NASA planets, designed data-viz, custom iconography, progress + reveals.

## 9 pillars

1. **Kill the essay column.** Alternate module types every ~1.5 screens:
   ChapterCover → BigReveal/pull-moment → VisualModule → 3 InsightCards → Expandable deep reading → Milestone.
2. **Progressive disclosure.** Each reading = headline takeaway + 1-line "signal" + 3 short blocks
   (Core Pattern / How It Shows Up / What To Know). Full text behind "Read full interpretation."
   First view ≤ ~160 words.
3. **Planet system rebuild (biggest win).**
   - `PlanetIndex`: sticky scannable rail (desktop top/side; mobile swipe-snap). Each item = NASA
     thumb from `/planets/` + `Venus · Pisces · 5th` + status dot. Active = gold ring, others dim 60%.
   - `PlanetReadingCard`: NASA photo as hero orb, content beside (stacked mobile). Per-planet distinct
     accent + motion (Sun gold pulse, Moon silver tide, Mars red edge, Saturn rings, Neptune blur-to-focus…).
   - Reuses existing `/planets/*.jpg|png` (all 12 present).
4. **Birth chart wheel → real SVG instrument.** Concentric rings (zodiac/house/planet/aspect),
   5°/30° degree ticks, house wedges, aspect lines (trine gold / square red / opp violet), sequenced
   draw-in animation, hover-highlight one planet + dim rest. Not CSS fan-art.
5. **Elemental balance → 4 tactile tiles.** Water (liquid wave) / Fire (embers) / Earth (segmented blocks)
   / Air (drift currents), animated fills, dominant element as larger feature tile.
6. **Iconography.** Replace cheap unicode glyphs (☉ ☽ ✦ 🐾) with a cohesive custom SVG astro set
   (`src/components/icons/astro/`, 1.5px stroke, gold/violet duotone). Zodiac/planet as drawn vectors.
7. **Gamification.** Chapter progress rail + chapter nav; discovery states (muted→gold once viewed);
   milestone beats ("3 of 7 discoveries unlocked"); reveal-on-scroll (transform/opacity, CSS
   scroll-driven + IntersectionObserver fallback); extras (dossier/dating/recipe/playlist) as a
   collectible "soul deck" of share-shaped cards.
8. **Contrast/readability.** Body never low-opacity gold-on-plum. Gold/violet = accents + headings only.
   Fewer quote moments, bigger type, more breathing room.
9. **Type scale.** Chapter 40–56 / pull 32–44 / card title 20–24 / body 15–17 (lh 1.65) /
   labels 11 uppercase tracked.

## Build order (phased, sign-off gates)
- **P0 Foundations:** astro SVG icon set, design tokens + type scale, reveal-on-scroll primitive,
  progress rail + chapter nav.
- **P1 Planet system:** PlanetIndex + PlanetReadingCard + per-planet presets. ← most visible
- **P2 Data-viz:** birth chart wheel SVG + elemental tiles.
- **P3 Rhythm:** progressive disclosure on the 12 readings + collectible extras.
- **P4 Polish:** milestones, contrast/spacing sweep, QC, deploy.

## De-risk: prototype first
Build ONE planet card + the new chart wheel + elemental tiles on `/dev/report`, deploy, Danny eyes it,
THEN roll out to all 12 + the rest. Avoids a big wrong-direction rebuild.

## Codex second-thoughts (folded in)
- **Ownable device:** add a recurring "soul constellation / bond signature" (pet silhouette orbit, constellation overlay on chart) — more ownable than generic astrology UI.
- **Gamification = a loop**, not "viewed→gold": unlock → collect → revisit → share → complete. Each beat answers: what did I earn / what changed / what next.
- **Emotional climax — FINAL SOUL SEAL:** late ceremony moment that assembles planet+element+modality+archetype into ONE unique shareable emblem/card. Biggest creative opportunity.
- **Don't bury sacred copy in cheap accordions** — use a "premium reading room" treatment (dimmed panel, slow reveal, margin glyphs, quote pins). Copy is the product.
- **Strict section templates** so progressive disclosure doesn't make every section "headline+cards+accordion".
- **Planet cards:** masked orbital crops + rim-light + per-planet lighting + tiny metadata rings + subtle parallax + real surface texture. NOT image-in-circle-with-glow-blob.
- **Chart wheel:** instrument-grade SVG, precomputed geometry, mobile focus mode (tap planet → highlight slice/aspects + compact legend).
- **Elemental tiles tactile:** water waves / fire particles / earth segmented plates / air drifting linework — not SaaS progress bars.
- **Motion = meaningful, fewer:** orbit draw, card ignition, chart calibration, deck unlock, line tracing. Not fade-up everywhere.
- **Gold restraint:** reward/status/precision only — not backgrounds, borders, body, every icon.
- **Tech:** one `Reveal` primitive + one `useActiveSection`; precompute SVG polar math; lazy-load NASA (preload active only); lock heights (no CLS); sticky rail must not live inside transform parents; reduced-motion real; a11y non-colour cues + keyboard/tap chart.
- **Highest leverage / build first:** ONE complete `PlanetReadingCard` + `PlanetIndex` + the transition into it. If that slice feels expensive, roll out the rest.

## Already shipped (this session, live)
- soul-chat + report viewer recolored to cosmic.
- Emergency: cream bands killed (PullQuote/DawnFade/DirectMessage/SoulSpeakTeaser), low-contrast fixed,
  "the The Empathic Healer" copy bug fixed, pink avatar + green pill recolored.
