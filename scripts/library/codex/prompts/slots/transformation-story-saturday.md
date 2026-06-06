# Transformation Story Saturday — Codex slot brief

> **Slot type:** AI-generated photoreal transformation arc — puppy → adult → canvas portrait. Pure FB content (NOT a SKU, NOT a customer offering). People love transformations on FB; this exploits that without selling.
> **Pattern:** B (Story-Native Placement). Concept named ONCE inside the caption at the BRIDGE beat.
> **Format:** Carousel (3 slides, 4:5 tall, 1080×1350) — ONE pet's life journey condensed.

## Pre-flight

Read `_voice-rules.md`, `_cast.json`, `_styles.json`.

## Source priority — real customer Then & Now FIRST

Before generating anything AI, check `~/pet-portraits/incoming/_customer-then-and-now-inbox/`. If a real customer Then & Now submission is queued and approved for this week, ROUTE TO `then-and-now-saturday.md` instead (real beats fictional). If inbox is empty, fall back to AI Transformation Story (this brief).

For testing today (2026-05-09): inbox empty → AI Transformation Story with **Clover** (master locked).

## Cast selection (rotation)

Rotate weekly across cast members:
- Week 1: **Clover** (Golden Retriever, watercolour-floral)
- Week 2: **Atlas** (black DSH, oil-on-linen)
- Week 3: **Beans** (French Bulldog, royal-oil)
- Week 4: **Mochi** (Maine Coon, renaissance oil)
- Week 5: **Hazel** (Senior lab mix, soft pastel) — but only with strict ethics-gate, "senior life arc" framing, never "loss"

For testing: **Clover**.

## Image generation — 3 photoreal slides (4:5 tall, 1080×1350)

The arc: puppy → adult → canvas. All three feel like the SAME pet, photographed by the SAME family at three life moments. Phone-photo realism for slides 1 and 2; the canvas in slide 3 is a real artifact in a real room.

**Identity lock — non-negotiable:**
- PASS the master image (`cast.master_image`) AS REFERENCE for all 3 slides.
- KEEP list (verbatim from `cast.keep_list`) — same coat, same eyes, same key markings.
- This is `{{cast.name}}` at three ages. State this in every prompt.

**Slide 1 — Puppy (8–12 weeks):**
Photoreal phone photo. {{cast.name}} as a young puppy — same coat pattern, same eye colour, same ear shape as the master, but scaled to puppy proportions: head-too-big-for-body, larger paws, softer features, fluffier coat. Setting: real domestic scene tied to one of `cast.story_anchors` (e.g. for Clover: asleep against the kitchen radiator she claimed within an hour). Soft warm window light. Slight phone-camera aesthetic — a little imperfect, like a parent's snap.

**Slide 2 — Adult (present day, photoreal):**
Photoreal phone photo. Same pet, fully grown. Different room or angle than slide 1 but same warm domestic feel — like the same family's home, a few years later. Reference master + KEEP list. Pet doing one of their adult Habit Pool details (e.g. Clover at her kitchen window, watchful, in the soft light she always finds).

**Slide 3 — Canvas (the artifact):**
The painted canvas of the adult version, hung in a real living room or bedroom. Style = `cast.signature_style` per `_styles.json`. Frame visible. Natural ambient light. Pet name on canvas in handwritten cursive serif. Optional: a corner of furniture in frame for context (a couch arm, a side table).

For all three: 4:5 tall, 1080×1350. Slides 1+2 photoreal phone aesthetic; slide 3 is the painted artifact in a real room.

## Caption — 5-beat formula (Pattern B), 100–140 words

**Beat 1 — HOOK** (1 sentence): un-inventable puppy-era specific. Numbers, weight, sensory.
*Example (Clover):* "This is Clover at ten weeks — three kilos, mostly fur, asleep against a kitchen radiator she'd claimed within an hour of getting home."

**Beat 2 — ANCHOR** (1–2 sentences): the kind-of-puppy-she-was, drawn from `cast.story_anchors`.
*Example:* "She was the kind of puppy who didn't whine the first night. Just blinked at the new dark like she was already counting it as hers."

**Beat 3 — DESCENT / WISDOM SNIPPET** (2–3 sentences): the journey from puppy to adult, present tense. Embed ONE wisdom snippet from `cast.breed_facts`.
*Example:* "Goldens hit their adult coat around fourteen months — the soft puppy down replaced with the feathered legs and sable-and-gold layering that's the breed standard. By two years, she had it. The same quiet, just heavier. The same watchfulness, just from further away."

**Beat 4 — BRIDGE** (1 sentence): connector grammar pattern. Concept ("a portrait", "a canvas") named ONCE.
*Recommended pattern:* #6 ("Her family had a portrait done quietly afterwards") OR #12 ("And then one Sunday the canvas went up").
*Example:* "Her family had a portrait done quietly afterwards — watercolour-floral, in the soft light she always finds — and now she sleeps under it on Sundays."

**Beat 5 — QUESTION CLOSE** (1 sentence): rescue/owner-recognisable.
*Example:* "What's the earliest photo you have of yours?"

## first_comment (Pattern B link)

```
✨ Yours, painted from a single phone photo — the soft light they always find, on canvas. Start here → https://www.littlesouls.app/pawtraits
```

## self_reply (+30min — DISCLOSURE)

This is critical for Transformation Story. The puppy image is AI-imagined — that's fine, but the audience deserves honest disclosure. Not as the lede; as a footnote that turns the post from "fake reveal" into "honest storytelling".

```
PS — this is Clover. The photo of her at ten weeks is imagined; the canvas in the third frame is the real one. We just wanted to show you what one looks like, all the way through.
```

The "we just wanted to show you what one looks like" line is the permission frame — the audience knows we're showing range, not faking a customer.

## Output — manifest.json at `~/pet-portraits/incoming/2026-05-09-fb-test/transformation-story-saturday/`

```json
{
  "slot": "transformation-story-saturday",
  "cast_member": "Clover",
  "style": "watercolour-floral",
  "story_anchor": "<the anchor used>",
  "wisdom_snippet": "<the breed fact embedded>",
  "connector_pattern_used": "<which of the 12>",
  "images": ["puppy.png", "adult.png", "canvas.png"],
  "image_prompts": ["<exact prompt for puppy>", "<for adult>", "<for canvas>"],
  "caption": "<full caption>",
  "caption_word_count": <int>,
  "first_comment": "<text>",
  "self_reply": "<text — must include disclosure>",
  "ai_disclosure_in_self_reply": true,
  "generated_at": "<ISO-8601>",
  "status": "awaiting_review"
}
```

## Self-check
- [ ] Three images form a coherent arc — same pet, three moments
- [ ] Slides 1+2 photoreal phone aesthetic; slide 3 is the painted artifact
- [ ] Caption uses 5-beat formula, 100–140 words
- [ ] Wisdom snippet embedded naturally in DESCENT
- [ ] Concept named ONCE via connector pattern at BRIDGE
- [ ] Closes on real question
- [ ] self_reply DISCLOSES that puppy image is imagined
- [ ] No "buy now", no engagement bait, no body link, no "!"
- [ ] Identity lock applied — same pet, three slides
