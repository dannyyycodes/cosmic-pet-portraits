# Reveal Monday — Codex slot brief

> **Slot type:** Customer reveal UGC (Type B scene). The spine of the FB calendar — pet next to their own canvas in a real home.
> **Pattern:** B (Story-Native Placement). Concept named ONCE inside the caption at the BRIDGE beat via connector grammar.
> **Format:** Reel (9:16 vertical) — 3 image variations.

## Pre-flight

Before generating, you must have read:
1. `prompts/_voice-rules.md` — full storytelling formula
2. `prompts/_cast.json` — pick today's cast member
3. `prompts/_styles.json` — pick the canvas style for that cast member's signature

## Cast selection (rotation)

Rotate weekly across cast members whose `primary_slots` includes `reveal-monday`:

- Week 1, 3, 5: **Clover** (Golden Retriever, watercolour-floral) — master locked at `clover-reference.png`
- Week 2, 4, 6: **Atlas** (black DSH, oil-on-linen) — once master is generated

When the master_image field in _cast.json is null, generate the master first (3 variations, pick the best, save as `cast-masters/<name>.png` for reuse).

For testing today (2026-05-09): use **Clover**, master locked.

## Image generation — 3 variations (9:16, 1024×1820)

All three are Type B scenes: cast member sitting next to their own framed canvas in a real home interior. Phone-photo realism, warm window light, lived-in room feel.

**Identity lock — non-negotiable for all 3 images:**
- PASS the master image at `cast.master_image` AS REFERENCE INPUT.
- KEEP list (verbatim from cast.keep_list): use the exact phrases.
- This is `{{cast.name}}`, NOT a generic `{{cast.breed}}`. State this in the prompt.

**Image 1 — hero (close framing):**
Soft window light from camera-left, real living room background. Cast member sitting in her favourite spot (use one of `cast.story_anchors` for placement context — e.g. "she's by the kitchen radiator she claimed within an hour"). Framed canvas of her on the wall behind her, slightly out of focus but legible — the painting style is `cast.signature_style` per `_styles.json`. Pet name `{{cast.name}}` written in the canvas (handwritten cursive serif). Shot at slight angle to feel unposed.

**Image 2 — wider room context:**
Same scene, pulled back. Show more of the real living room — couch corner visible, plant, rug, window light pouring in. Cast member fully visible, canvas clearly framed on wall above eye level. Real-home aesthetic — slightly imperfect framing, like the owner took it on their phone after hanging the canvas.

**Image 3 — canvas-only:**
Just the framed canvas on the wall, slight angle. Soft natural light hitting it. The frame, the painting, the wall. Optional: a corner of furniture visible at frame edge for context. No pet in this shot — this is the artifact.

For all three: aspect ratio 9:16, target 1024×1820, sRGB, photoreal phone aesthetic — NOT painterly (the canvas inside the photo is painterly; the photo itself is real).

## Caption — 5-beat formula (Pattern B), 80–130 words

Apply `_voice-rules.md` exactly. Witness narrator. Customer-pointed.

**Beat 1 — HOOK** (1 sentence): un-inventable specific. Open on a category the reader recognises (rescues, wary pets, late-bonders) — NOT a specific dog Little Souls owns.
*Example shape:* "Some pets come home wary."

**Beat 2 — ANCHOR** (1–2 sentences): concrete sensory detail from the cast Habit Pool. Customer-pointed possessives.
*Example shape:* "They sleep in the corner of the kitchen for months, watching the door. They take what feels like forever to be yours."

**Beat 3 — DESCENT / MICRO-STORY** (2–3 sentences): present tense, what was watched in the room. Embed ONE Wisdom Snippet from `cast.breed_facts` naturally.
*Example shape:* "And then one Sunday the canvas goes up — them, painted in the soft light they always find — and they sit in front of it for forty minutes. Like they finally see what you've always seen."

**Beat 4 — BRIDGE** (1 sentence): use one of the 12 connector grammar patterns from `_voice-rules.md`. Concept named ONCE here.
*Recommended for this slot:* pattern #6 ("Her family had a portrait done quietly afterwards") OR pattern #12 ("And then one Sunday the canvas went up — a portrait of her — and she sat in front of it for forty minutes").

**Beat 5 — QUESTION CLOSE** (1 sentence): real question. No CTA, no "DM us".
*Example shape:* "What was your pet's first night home like?"

## first_comment (Pattern B link drop)

Format:
```
✨ [visual promise]. Start here → https://www.littlesouls.app/pawtraits
```

Examples:
- "Yours, painted from a single phone photo. Soft fur, soft light, on canvas."
- "Painted from your photo. Framed. On your wall."

Discovery vocabulary only. NEVER "buy yours", "shop", "order".

## self_reply (+30min after publish)

Cast disclosure + credibility detail. 1–2 sentences. Honest about the workflow.

Format:
```
PS — this is {{cast.name}}. [credibility detail — could be: how the master was generated, what the family asked for, a sensory hook from the canvas, the wisdom snippet that didn't make the caption]
```

Example (Clover):
> PS — this is Clover. Her family sent in one phone photo and asked for the watercolour-floral. The wildflowers around her in the painting are real ones from her garden.

## Output — manifest.json

Write to `~/pet-portraits/incoming/2026-05-09-fb-test/reveal-monday/manifest.json`:

```json
{
  "slot": "reveal-monday",
  "cast_member": "Clover",
  "style": "watercolour-floral",
  "story_anchor": "<the anchor used in the caption>",
  "wisdom_snippet": "<the verifiable fact embedded in DESCENT>",
  "connector_pattern_used": "<which of the 12 patterns at the bridge>",
  "images": ["img_001.png", "img_002.png", "img_003.png"],
  "image_prompts": ["<exact prompt fed for img_001>", "<for img_002>", "<for img_003>"],
  "caption": "<full caption text>",
  "caption_word_count": <integer>,
  "first_comment": "<text>",
  "self_reply": "<text>",
  "generated_at": "<ISO-8601>",
  "status": "awaiting_review"
}
```

## Self-check before saving

Read the caption aloud. Confirm:
- [ ] Sounds like a friend at 11pm, not marketing copy
- [ ] First specific detail makes a reader nod
- [ ] Witness narrator throughout (no "my", no "we sleep")
- [ ] Concept named ONCE via connector pattern at bridge
- [ ] Wisdom snippet embedded naturally (not lectured)
- [ ] Closes on real question
- [ ] Word count 80–130
- [ ] No engagement bait, no "!", no body link
