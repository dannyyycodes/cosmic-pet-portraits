# Caption This Thursday — Codex slot brief

> **Slot type:** Engagement post. Comment-volume drives the algorithmic next-3-day boost. Soft conversion: "we'll paint our favourite, free."
> **Pattern:** A (Parasocial Invisible). Concept never named in caption body.
> **Format:** Single square photo (1:1, 1080×1080) — 3 image variations.

## Pre-flight

Read `_voice-rules.md`, `_cast.json`.

## Cast selection (rotation)

Rotate across the comedic-photogenic cast members:
- Week 1, 3, 5: **Beans** (French Bulldog) — costume-friendly, comedic face
- Week 2, 4, 6: **Atlas** (black DSH) — judgmental cat energy

For testing today (2026-05-09): use **Beans**. Beans's master is `master_pending` — generate the master first if not exists.

## Image generation — 3 variations (1:1 square, 1080×1080)

The funny pet image. Photoreal, single subject, comedic moment. Each variation is a DIFFERENT comedic scenario — these aren't 3 angles of the same shot.

**Identity lock applies on all three:**
- PASS Beans's master if it exists, else generate from `cast.keep_list`.
- KEEP the underbite, the bat ears, the brindle paws — every shot.

**Image 1 — funny scenario A:**
Beans staring directly at camera with a stolen sock hanging from her mouth. Living room background, slight motion blur on the sock, perfect focus on her face. Underbite visible. The expression is "you saw nothing".

**Image 2 — funny scenario B:**
Beans wedged into a too-small cardboard box (Amazon, etc.) with only her head and shoulders visible. Her bat ears at full alert, eyes wide. The lower half of her body clearly not fitting.

**Image 3 — funny scenario C:**
Beans wearing a tiny chef hat (or a knit sweater, or sat in front of a Christmas tree pulling at an ornament). One photoreal, well-lit, comedic moment.

For all three: 1:1 square, 1080×1080, photoreal phone aesthetic. Beans must be RECOGNISABLY Beans across all three — same dog, three moments.

## Caption — short, 2-beat (Pattern A), 25–50 words

This slot is intentionally short. The CAPTION is the prompt to the audience.

**Beat 1 — THE PROMPT** (1 sentence): the activation-energy-lowering ask.
*Locked text:* "Caption this in three words."

**Beat 2 — THE PRIZE** (1 sentence): the soft-conversion mechanic. "We'll paint our favourite, free."
*Locked text:* "We'll paint our favourite from photo to canvas, free, for next week's winner."

That's it. 2 sentences. ~25 words.

## first_comment (Pattern A)

Quiet link drop. NOT the prize description (that's in the caption). Just a way for non-entrants to find the studio.

```
🐾 More from the studio → https://www.littlesouls.app/pawtraits
```

## self_reply (+30min) — SEED THE FORMAT

This is critical. Without a seed, comments default to "so cute!" The self_reply is one EXAMPLE three-word caption to show what kind of reply is wanted.

*Example (Beans + sock):*
```
to start you off: "mood: 95% bread"
```

The seed must be:
- Three words exactly (model what's wanted)
- Specific to the image
- Funny
- Cite-style format with quotes

For different image variants, the seed changes:
- Box scenario: "to start you off: 'free shipping included'"
- Chef hat: "to start you off: 'reservation under disaster'"

## Output — manifest.json at `~/pet-portraits/incoming/2026-05-09-fb-test/caption-this-thursday/`

Note: include all 3 different scenario prompts AND the matching self_reply seeds (one per scenario).

## Self-check
- [ ] Caption is 25–50 words (intentionally short)
- [ ] No question mark needed (the imperative IS the question)
- [ ] Pattern A — concept not named in body
- [ ] Self-reply seed is exactly 3 words in quotes
- [ ] Each image is a DIFFERENT comedic scenario, not 3 angles of one shot
- [ ] Cast member is recognisably the same dog/cat across all 3
