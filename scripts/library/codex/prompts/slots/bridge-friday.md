# Bridge Friday — Codex slot brief

> **Slot type:** Memorial. Highest-converting content type for £79+ portraits but ALSO the hardest to write — the bar is the post must pass the Five Love Test before any image generation begins.
> **Pattern:** B (Story-Native Placement). Concept named ONCE inside the caption at the BRIDGE beat.
> **Format:** Carousel (4 slides, square 1:1) — soft, slow, gentle aesthetic.

## Pre-flight — non-negotiable

Read in this exact order:
1. `prompts/_ethics-gate.md` — the Five Love Test (read FIRST, internalize before writing)
2. `prompts/_voice-rules.md`
3. `prompts/_cast.json`
4. `prompts/_styles.json`

## Source priority — real customer FIRST

Before generating anything, check `~/pet-portraits/incoming/_customer-memorial-inbox/`. If a real customer memorial submission is queued and approved for this week, ROUTE TO THAT INSTEAD. Real grief beats fictional every time.

If inbox is empty, fall back to **Hazel** (senior lab mix, soft pastel) — the gentlest archetype.

For testing today (2026-05-09): inbox empty → use Hazel. Generate Hazel's master first if not exists.

## Image generation — 4-slide carousel (1:1 square, 1080×1080)

The aesthetic is gentle. Soft pastel colours, lots of negative space, never anything sharp.

**Slide 1 — Hero portrait:**
Hazel rendered in soft pastel canvas style. Tight composition, eyes carrying soulful detail (slight cataracts). Cream-pink background. Pet name handwritten cursive at bottom left.

**Slide 2 — Quiet domestic moment:**
Photoreal but pastel-toned. Hazel from one of her story_anchors — sleeping under the kitchen table, head in someone's lap, soft window light on her grey muzzle. The kind of moment a phone catches accidentally and the owner keeps forever.

**Slide 3 — Empty space + one detail:**
The bowl by the door. The collar on the hook. The dog-bed at the foot of the human-bed, empty but pressed-in. ONE detail in soft pastel light. Negative space dominates the frame.

**Slide 4 — The painting on the wall:**
The pastel canvas of Hazel hung in a real living room, warm late-afternoon light hitting it. A book on the side table, a tea mug. Real-life-keeps-going aesthetic.

For all four: 1:1, 1080×1080. Quiet, slow, never bright.

## Caption — 5-beat formula (Pattern B), 100–150 words

This caption is the post. Take time on it.

**Beat 1 — HOOK** (1 sentence): name what the reader feels but doesn't have a name for.
*Locked starting line:* "There's a quiet kind of grief that doesn't have a name."

**Beat 2 — ANCHOR** (2–3 sentences): un-inventable specifics of the absence. Customer-pointed possessives ("the bowl you walk past", "your hand that drops to the side of the bed").
*Example:* "The pause when you walk past where their bowl used to be. The hand that still drops to the side of the bed for a head that isn't there. Calling out before you remember."

**Beat 3 — DESCENT** (1–2 sentences): the truth nobody warned them about.
*Example:* "Nobody tells you it lasts. It just gets quieter — like a song that doesn't end, just turns down."

**Beat 4 — BRIDGE** (1 sentence): connector grammar pattern. Concept named ONCE if it lands gently.
*Recommended pattern:* #9 ("I remember how lost she looked. But [a portrait of him] became her ritual on Sunday evenings.") OR pattern #6 ("Her family had a portrait done quietly afterwards.")
*Or simpler:* "If you've lost one, we're sorry. They're still here, in the things you keep doing without meaning to."

**Beat 5 — QUESTION CLOSE** (1 sentence): low, gentle, real.
*Example:* "What was their name?"

## Five Love Test — RUN BEFORE SAVING MANIFEST

After writing the caption, run through `_ethics-gate.md`. Annotate each test result. If ANY fails, do NOT save as `awaiting_review`. Save as `flagged_for_human_rewrite` and stop.

## first_comment (Pattern B link, gentle)

```
When you're ready — gently, no rush — your boy or girl, on canvas, where you can see them every day. → https://www.littlesouls.app/pawtraits
```

NEVER:
- "Click here" / "Buy now"
- "Shop our memorial collection"
- "Limited time offer"

The link is offered as permission, never urgency.

## self_reply (+30min — the line that makes people screenshot)

This is the line readers send to friends. Quiet, not performative.

```
Reading every name below. Take as long as you need. There's no order, no rush, no thread to keep up with.
```

That line specifically — or a close variant — works. The "no order, no rush, no thread to keep up" is the permission piece.

## Output — manifest.json at `~/pet-portraits/incoming/2026-05-09-fb-test/bridge-friday/`

Include the full `ethics_gate` block per `_ethics-gate.md` schema. Status:
- `awaiting_review` only if all 5 tests pass
- `flagged_for_human_rewrite` if any fail

## Self-check
- [ ] Five Love Test annotated — all 5 PASS
- [ ] No "closure" / "heal" / "move on" language
- [ ] No invented stats, no fake testimonials
- [ ] Composite witness ("a woman I sat with") is the only personal-story frame
- [ ] First-comment link is permission-shaped, not urgency-shaped
- [ ] Caption closes on real question
- [ ] Aesthetic of all 4 slides is gentle (pastel, soft light, negative space)
- [ ] Word count 100–150
