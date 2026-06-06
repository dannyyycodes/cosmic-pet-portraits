# Aesthetic Drop Wednesday — Codex slot brief

> **Slot type:** Single hero portrait. The post is the product. Wednesday 1–3pm = single best algorithmic slot per Sprout 2026.
> **Pattern:** A (Parasocial Invisible). Caption is short, observational. Concept never named.
> **Format:** Single tall photo (4:5, 1080×1350) — 3 image variations.

## Pre-flight

Read `_voice-rules.md`, `_cast.json`, `_styles.json`.

## Cast selection (rotation)

Rotate weekly across cast members whose `primary_slots` includes `aesthetic-drop-wednesday`:

- Week 1, 4: **Mochi** (Maine Coon, renaissance oil)
- Week 2, 5: **Atlas** (black DSH, oil-on-linen)
- Week 3, 6: **Clover** (Golden, watercolour-floral)

For testing today (2026-05-09): use **Mochi (Maine Coon, renaissance oil)** — but Mochi's master is `master_pending` so generate her master FIRST (3 attempts, pick best, save to `cast-masters/mochi.png`), then build the 3 hero variations from that master.

## Image generation — 3 variations (4:5 tall, 1080×1350)

The hero portrait — this IS the product. Painterly, refined, magazine-quality.

**Identity lock — non-negotiable:**
- If master exists: PASS as reference + KEEP list.
- If master doesn't exist: this is the master generation. Be precise with breed-specific morphology from `cast.keep_list`.

**Image 1 — close hero portrait:**
The cast member rendered in their signature canvas style at full painterly intensity. Tight composition: head and upper chest fill the frame. Eyes carry the most detail (highlight in one eye). Background per the style brief. Pet name in style-appropriate type per `_styles.json`. NO frame visible — this is the painting itself, not the canvas in a room.

**Image 2 — same composition, alternate lighting/mood:**
Same cast member, same style, slight variation — different background colour or different one-light-source angle. Still tight composition.

**Image 3 — three-quarter angle, fuller body:**
Pull back slightly to show shoulders + paws. Slight three-quarter turn. Same painterly intensity. Same canvas style.

For all three: aspect 4:5, 1080×1350. Painterly — NOT photoreal. The painting IS the image.

## Caption — short, 5-beat compressed (Pattern A), 50–90 words

**Beat 1 — HOOK** (1 sentence): observational, almost prose-like. Hooks the eye.
*Example (Mochi/Maine Coon):* "The light in Maine Coons is older than the breed."

**Beat 2 — ANCHOR + WISDOM SNIPPET** (1–2 sentences): the verifiable fact dropped naturally.
*Example:* "Egyptian, possibly. Painted into walls four thousand years ago — and somehow into your living room, this morning."

**Beat 3 — BRIDGE** (1 sentence — there's no separate Question Close on this slot, the bridge IS the close):
*Example:* "Nothing changes. We just make it permanent."

That's it. 3 short beats. The post is the product; the caption gets out of the way.

## first_comment (Pattern A — concrete-promise link)

```
✨ Painted from your photo. Framed. On your wall. → https://www.littlesouls.app/pawtraits
```

The three concrete promises ("painted from your photo / framed / on your wall") are the conversion frame. Each phrase is a fact, not marketing speak.

## self_reply (+30min)

Drop the OTHER wisdom snippet — the one not used in the caption — as the saveable comment.

*Example (Mochi/Maine Coon):*
> A coin from 1500 BC at the British Museum has a cat on it with the same eyes, chest, and ear tufts as a Maine Coon. Same breed, four millennia ago.

## Output — manifest.json at `~/pet-portraits/incoming/2026-05-09-fb-test/aesthetic-drop-wednesday/`

Same schema. slot = `aesthetic-drop-wednesday`.

## Self-check
- [ ] Caption is 50–90 words (shorter than other slots)
- [ ] Pattern A — concept not named in caption body
- [ ] Wisdom snippet embedded in caption + different one in self_reply
- [ ] Image is painterly hero, NOT a photo of canvas in a room
- [ ] No question mark needed (bridge is the close)
- [ ] No engagement bait, no body link, no "!"
