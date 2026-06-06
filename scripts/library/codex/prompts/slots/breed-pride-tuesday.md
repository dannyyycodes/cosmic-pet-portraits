# Breed Pride Tuesday — Codex slot brief

> **Slot type:** Single-breed appreciation showcase. Breed pride is the #1 portrait-buyer trigger.
> **Pattern:** A (Parasocial Invisible). Concept never named in caption body; first_comment carries link.
> **Format:** Carousel (5 slides, square 1:1). Carousels lead engagement at 6.9% per Buffer 2026.

## Pre-flight

Read `_voice-rules.md`, `_cast.json`, `_styles.json`.

## Cast / breed selection (rotation)

Rotate breed weekly. 12-week cycle:

| Week | Breed | Cast member |
|---|---|---|
| 1 | Golden Retriever | Clover |
| 2 | French Bulldog | Beans |
| 3 | Maine Coon | Mochi |
| 4 | Black domestic shorthair | Atlas |
| 5 | Lab mix | Hazel |
| 6 | Dachshund | (open — generate new master) |
| 7 | Border Collie | (open) |
| 8 | German Shepherd | (open) |
| 9 | Cocker Spaniel | (open) |
| 10 | Cavalier King Charles | (open) |
| 11 | Whippet | (open) |
| 12 | British Shorthair | (open) |

For testing today (2026-05-09): use **Clover (Golden Retriever)**.

## Image generation — 5-slide carousel (1:1 square, 1080×1080)

The carousel is a saved-worthy guide. Slides should swipe through breed lore + product visualisation.

**Slide 1 — Hero portrait:**
The cast member as a portrait painting in their signature style. Tight composition, head and chest filling frame. PASS master image as reference. KEEP list applies. This is `{{cast.name}}`, not generic.

**Slide 2 — Title slide:**
Typography-led. Cream paper background. Heading in warm serif: "FOR EVERY GOLDEN OWNER" (or breed equivalent). Sub-line in italic: "the soft mouth, the watchfulness, the courage on a Tuesday". Small line at bottom: "—Little Souls". Minimal — this is the slot's visual anchor.

**Slide 3 — Breed origin fact:**
Photoreal or stylised image of the breed in a setting that nods to its history (Goldens in Scottish Highlands; Frenchies in Paris lace shop; Maine Coons by a stone hearth). Caption text overlay (1-2 sentences) about breed origin — the Wisdom Snippet from `cast.breed_facts`.

**Slide 4 — What they actually do for you:**
Photoreal scene of the cast member in a quiet domestic moment — the Habit Pool detail rendered as image. e.g. for Clover: sitting at the kitchen window in soft light. For Beans: stealing a sock. For Mochi: watching from the top of a wardrobe.

**Slide 5 — Customer canvas hint:**
A different real customer's canvas of the same breed, framed in a different real living room. Or a rotation of 4 small canvas thumbnails of the breed. Quiet text overlay: "yours, painted like this". Frame style varies to show range.

## Caption — 5-beat formula (Pattern A — concept NOT named in body), 80–130 words

**Beat 1 — HOOK** (1 sentence): un-inventable specific that hooks any owner of the breed.
*Example (Goldens):* "Goldens were bred to retrieve, gently."

**Beat 2 — ANCHOR** (1–2 sentences): the cultural-shorthand observation only owners know.
*Example:* "To hold a bird in the mouth without breaking the feathers."

**Beat 3 — DESCENT / WISDOM-DRIVEN** (2–3 sentences): the breed truth, reframed. Embed ONE wisdom snippet from `cast.breed_facts`.
*Example:* "Look at any Golden in the room and you'll find the same thing — the soft mouth carrying socks, slippers, the courage you forgot you had on a Tuesday. They're the only breed that returns the favour without being asked."

**Beat 4 — BRIDGE** (1 sentence): a soft pivot to the reader, NO concept reveal.
*Example:* "It's the kind of soft you only really clock when it's gone quiet next to you."

**Beat 5 — QUESTION CLOSE** (1 sentence): breed-specific question.
*Example:* "What does yours bring you when you've had a hard day?"

## first_comment (Pattern A — link only, breed-specific visual promise)

```
🐾 Your golden, painted like this — soft fur, soft eyes, on canvas. Start with a photo → https://www.littlesouls.app/pawtraits
```

For other breeds, swap the visual promise: "Your Frenchie, with all the underbite intact" / "Your Maine Coon, painted properly aristocratic" / "Your black cat, the green eyes lit just right."

## self_reply (+30min)

Drop the second wisdom snippet from `cast.breed_facts` — the one not used in the caption. This is the saveable comment.

*Example (Goldens):*
> Lord Tweedmouth bred the first one in the Scottish Highlands in 1865. He wanted a retriever that wouldn't break the bird. The fact that we now use them to break our hearts — different story.

## Output — manifest.json at `~/pet-portraits/incoming/2026-05-09-fb-test/breed-pride-tuesday/`

Same schema as reveal-monday — adjust the slot field to `breed-pride-tuesday`.

## Self-check
- [ ] Pattern A — concept never named in caption body
- [ ] Two wisdom snippets used: one in caption DESCENT, one in self_reply
- [ ] Witness narrator throughout
- [ ] No "tag a friend"
- [ ] Carousel slides have visual variety (portrait + typography + breed-history + habit + customer canvas)
- [ ] Word count 80–130
