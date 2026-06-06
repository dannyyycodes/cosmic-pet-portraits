# Codex inline-caption brief — Pawtraits library

> **What this is:** the schema and SEO/engagement rules Codex must follow when writing per-portrait captions **into the same `manifest.json`** that ships the images. When `backstory` + `captions` are both present on an item, `ingest.ts` skips the OpenRouter Sonnet call → **$0 marginal cost per portrait**.

## Daily flow (paste this brief to Codex once per batch)

For each portrait you generate, after saving the image, append an item to `manifest.json` with **both** the image metadata **and** a fully-written `backstory` + `captions` block, following the schemas below exactly.

After the whole batch is generated:

```bash
cd ~/cosmic-pet-portraits && bun scripts/library/ingest.ts ~/pet-portraits/incoming/<batch-folder>
```

Ingest validates char limits, board slugs, and UTM params, warns on drift (does not fail), substitutes the real library UUID into the URL placeholders, mirrors `variations[0]` into the flat compat fields, and inserts the row.

---

## Brand voice — sacred rules

- Never reference AI, GPT, model, prompt, or "generated"
- Never say "report" — these are **pawtraits / portraits / canvases**
- Voice: warm, sincere, honouring the pet, customer-feeling — never hypey, never AI-jargon
- The product is **transformation / a forever piece**, not a digital file
- Hashtags only on Instagram / TikTok / YouTube — **never** in Pinterest description body or Facebook narrative
- No emojis in Pinterest titles, alt text, or YouTube titles. Sparingly elsewhere.
- No fake review counts, star ratings, "thousands of customers", or made-up numbers
- No exclamation overkill (max 1 per caption)

---

## Two image types — different copy strategies

The library has two image types and they use **different copy frames** because they serve different jobs:

| Type | What it shows | Goes to | Copy frame |
|---|---|---|---|
| **A — `portrait`** | Pet-only, full-frame, art style. No room, no canvas in shot. | Gallery + Pinterest + IG + TT + FB | **Search-led + art-led.** No customer review (no canvas to review). Backstory = character moment. |
| **B — `scene`** | Customer-style phone photo of a real home with the canvas of the same pet on the wall. | IG + TT + FB only (no Pinterest, no gallery) | **Review-led UGC.** A `review` field anchors all platforms — IG/TT hooks quote from it, FB caption IS it. |

Both types share the `backstory` field (1–2 sentence character note that anchors the gallery card and provides shared texture). Type B adds a `review` field on top.

## Manifest item shape — Type A (portrait)

```jsonc
{
  "file": "img_001.png",
  "breed": "golden retriever",
  "pet_name": "Rosie",
  "image_style": "portrait",
  "art_style": "watercolour-floral",
  "aspect_ratio": "2:3",
  "prompt": "<short customer-facing style prompt to copy, 12-28 words>",

  "backstory": "Rosie waits by the window every 4pm — patient, sun-warmed, the calmest member of the house.",

  "captions": {
    "pinterest": { /* 3 fresh-pin variations — see Pinterest schema */ },
    "instagram": { /* art-led caption, hook in line 1 */ },
    "tiktok":    { /* hook in first 3 words, art-led */ },
    "facebook":  { /* short art-led narrative — NOT review-style for Type A */ },
    "youtube":   { /* Shorts title + description */ }
  }
}
```

## Manifest item shape — Type B (scene)

```jsonc
{
  "file": "img_024.png",
  "breed": "french bulldog",
  "pet_name": "Biscuit",
  "image_style": "scene",
  "home_setting": "narrow entryway with shoes and coats",
  "pet_action": "being held up with paws dangling",
  "canvas_format": "small square canvas on wall",
  "aspect_ratio": "9:16",
  "prompt": "<short customer-facing style prompt to copy, 12-28 words>",

  "backstory": "Biscuit has zero impulse control around postmen — and a small square canvas on the entryway wall to prove it.",

  "review": "We finally got round to ordering Biscuit's pawtrait. He's been the family menace since day one — a fact our postman knows well. The canvas arrived two weeks later in this lovely soft watercolour, and somehow it captured the exact face he pulls when he hears the letterbox go. It's small, square, framed in dark wood, hung in the entryway. Visitors stop at it on the way in. We made it with Pawtraits — littlesouls.app.",

  "captions": {
    "instagram": { /* hook quotes from review */ },
    "tiktok":    { /* hook from review's most scroll-stopping line */ },
    "facebook":  { /* the full review verbatim — caption: review */ }
    // NO pinterest, NO youtube on Type B
  }
}
```

### Backstory rules (both types)

- 1–2 sentences, present tense
- Mention the pet name if given
- Suggest one specific trait, habit, or moment — not generic ("loves walks") but specific ("waits at the window every 4pm")
- This shows on the gallery card and provides shared texture across platforms

### Public prompt rules (both types)

- The `prompt` field is shown to customers in `/pawtraits/gallery` and copied by the **Copy this style** button.
- It is **not** the internal generation prompt. Do not paste use-case blocks, constraints, negative prompts, size specs, or "as fed" imagegen text here.
- Write one short, copyable style sentence: **12-28 words**, plain English, no internal labels.
- Good: "Turn my calico cat into a layered editorial collage with torn-paper texture, warm neutrals, and bright watchful eyes."
- Bad: "Use case: illustration-story / Asset type: Pawtraits public gallery Type A portrait / Constraints: no photorealism..."

### Visual inspiration bar

- The library should spark creative aspiration: book-cover energy, posters, textiles, folk art, museum plates, toy theatre, packaging, editorial collage, animation stills.
- The library may show realistic canvas outcomes only when they are character-led. Do not create plain photoreal/studio pet portraits for the library.
- Do not make every subject an adult. Include puppies, kittens, and seniors when the brief asks for those life stages.
- Do not keep repeating the same popular breeds. Preserve the brief's breed list and use under-represented breeds as seriously as common SEO breeds.
- Transform inspiration into a distinct pet-safe character/world direction. Never copy a living artist, brand, IP character, logo, or recognisable copyrighted work.
- Reject "style-only" outputs. If the image is just a centred pet with an art filter, regenerate with a stronger concept before ingest.
- Reject generic realistic outputs too. A photoreal image should have a clear character/archetype, premium canvas polish, believable fur/anatomy/eyes/lighting, and no phone snapshot or glossy plastic render feel.
- Half of each daily library batch should be **character-led** where the animal reads as an archetype: astronaut, superhero, detective, wizard, pilot, explorer, knight, pirate, sea captain, inventor, etc.
- Character-led does **not** mean copying movie, TV, game, comic, or franchise characters. Avoid recognisable costumes, logos, symbols, names, colour-coded suits, weapons, or sidekicks.
- The other half should be **art-object-led**: stamp, matchbox label, tapestry, tarot card, book cover, shop sign, stained glass, seed packet, poster, packaging, theatre card, album-cover style, museum plate.
- Fight the samey AI look: vary silhouette, crop, border system, costume shape, medium texture, colour family, and object format across the batch.

### Review rules (Type B only — the content-creation engine)

- **300–700 characters**, first-person, past tense, written as if a real customer wrote it
- Reference the **specific moment from the backstory** — that's what makes it feel real
- Include three beats: the **order** ("we finally got round to..."), the **pet trait/moment** (the specific habit), the **canvas reveal/result** (where it hangs, what visitors do)
- End with a soft "We made it with Pawtraits — littlesouls.app." nod
- **No exclamation overkill** (max 1)
- **No fake review stars or "5/5" garbage**
- **No AI / report mentions**
- Voice: a friend posting about a thing they ordered, NOT a brand ad
- This is the **canonical anchor** — IG/TT/FB captions all draw from it. Same voice everywhere = it reads as authentic UGC across platforms.

### How Type B captions draw from the review

| Platform | Pattern |
|---|---|
| **Instagram** | First line = the most curiosity-gap line from the review (everything after line 1 is hidden behind "...more"). Body can quote 1–2 sentences. End with soft CTA. |
| **TikTok** | Hook in first 3 words = the punchiest moment from the review. e.g. review says "He immediately tried to lick it" → TT caption: "He licked the canvas. Of his own face." |
| **Facebook** | The `caption` field IS the review verbatim (or near-verbatim). 400–700 chars, no edits needed. |

---

## Pinterest schema — **Type A (portrait) only**

**Why Pinterest matters most:** highest-intent traffic in pet niche, search-engine algo, fresh-pin model rewards 3 distinct variations per image.

```jsonc
"pinterest": {
  "board": "<one slug from locked list — see below>",
  "variations": [
    {
      "title":           "<80–95 chars, sentence case, primary keyword in first 40 chars>",
      "description":     "<220–250 chars, keyword + value prop in first 50 chars, NO hashtags, ends with subtle CTA>",
      "destination_url": "https://www.littlesouls.app/pawtraits?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=__LIBRARY_ID__-v1",
      "alt_text":        "<100–125 chars: breed + coat + pose + expression + art style + mood>"
    },
    { /* V2 — same shape, ...&utm_content=__LIBRARY_ID__-v2 */ },
    { /* V3 — same shape, ...&utm_content=__LIBRARY_ID__-v3 */ }
  ]
}
```

### Locked 24-board list (pick exactly one)

Choose by breed first, then occasion (if backstory implies one), then style.

```
golden-retriever-portraits, french-bulldog-portraits, labrador-portraits,
dachshund-portraits, doodle-portraits, border-collie-portraits, pug-portraits,
german-shepherd-portraits, cat-portraits-tabby-tuxedo,
cat-portraits-black-maine-coon, memorial-pet-portraits, christmas-pet-gifts,
mothers-day-pet-gifts, adoption-pet-portraits, new-pet-celebration,
pet-birthday-art, wedding-pet-portraits, renaissance-pet-portraits,
royal-pet-portraits, modern-minimalist-pet-art, watercolor-pet-portraits,
cosmic-astrology-pet-art, vintage-victorian-pet-art, pop-art-pet-portraits
```

### Board-pick decision tree (follow in order)

1. **Occasion override** — if the backstory implies memorial / anniversary / birthday / adoption / Christmas / Mother's Day / wedding, use the matching occasion board. This always wins.
2. **Exact breed board** — if the breed has its own slug, use it (e.g. `dachshund-portraits` for any dachshund variant, `border-collie-portraits`, `pug-portraits`).
3. **Cat without a breed board** — `cat-portraits-tabby-tuxedo` is the **default** for cats. **Only use `cat-portraits-black-maine-coon` if the cat is a Maine Coon OR is solid black.** Common mis-pick: Scottish Fold → tabby-tuxedo, NOT Maine Coon. Russian Blue / Tonkinese / Siamese → tabby-tuxedo. Sphynx → renaissance-pet-portraits if art style is classical, else tabby-tuxedo.
4. **Dog without a breed board** — first check art style. Renaissance / royal / oil painting → `renaissance-pet-portraits` or `royal-pet-portraits`. Watercolor → `watercolor-pet-portraits`. Pop-art → `pop-art-pet-portraits`. Vintage / Victorian → `vintage-victorian-pet-art`. Cosmic / astrology → `cosmic-astrology-pet-art`. Otherwise → `modern-minimalist-pet-art`.
5. **Last resort** — `modern-minimalist-pet-art` (the catch-all).

**Anti-pattern to avoid:** sending every breed-without-a-board to `modern-minimalist-pet-art`. That board gets saturated and your pins compete with each other. Prefer style-led boards when the art medium has a strong identity (linocut → folk → renaissance? probably renaissance-pet-portraits).

**Worked board examples:**
- Toller (Nova Scotia Duck Tolling Retriever) in risograph → no breed board, art-style is bright/modern → `modern-minimalist-pet-art`
- Scottish Fold cat in ceramic-tile-folk-art → not a Maine Coon, not solid black → `cat-portraits-tabby-tuxedo`
- Lagotto Romagnolo in felted wool → no breed board, cosy/handmade style → `modern-minimalist-pet-art` (no perfect style match)
- Maine Coon in folk linocut → exact breed match → `cat-portraits-black-maine-coon`
- Sphynx in Renaissance chalk pastel → no breed board, classical style → `renaissance-pet-portraits`
- Border Collie in neon → exact breed match → `border-collie-portraits`
- Memorial backstory of any breed → `memorial-pet-portraits` (occasion overrides everything)

### Variation angles (each MUST take a distinct angle)

| | Angle | Lead with | Sample title open |
|---|---|---|---|
| **V1** | Breed-led | breed + art style | "Golden retriever watercolor portrait — …" |
| **V2** | Gift / occasion-led (if backstory supports) — fall back to style-led | gift, occasion, audience ("for dog lovers") | "Memorial pet portrait gift — …" / "Watercolor pet art for dog lovers — …" |
| **V3** | Emotional / benefit-led | the transformation, not the product | "Capture their soul in custom hand-painted pet art — …" |

### Pinterest title rules (per variation)

- **Aim for 82–90 characters** (target middle of the 80–95 range — natural sentences come in around 64–78 chars and that's TOO SHORT for the algo. Pad deliberately.)
- **Sentence case** — not Title Case, not ALL CAPS
- **Primary keyword in first 40 characters** — that's all the algo indexes hardest
- **No emojis, no clickbait punctuation**
- Format that wins in 2026: `<breed> <art-style> portrait — <intent + benefit + keyword tail>`
- **Padding strategies** (use to reach 82–90 chars without sounding stuffed):
  - Add `for canvas prints` / `for home wall art` / `gift idea` to the tail
  - Add `from your photo` to anchor the personalisation angle
  - Add `custom` + `pet wall art` together not separately
- Include long-tail keyword variants people actually type:
  - "custom pet portrait", "personalized pet art", "from photo", "canvas pet art", "pet portrait gift", "memorial pet portrait", "<breed> wall art"

### Pinterest description rules (per variation)

- **Aim for 225–240 characters** (target middle of 220–250 — natural drafts come in at ~190–215 and warn)
- **First 50 characters MUST contain the keyword + value prop** (that's all that shows in the feed before clicking)
- **No hashtags in the body** — Pinterest 2026 deprioritises them
- **End with a full CTA URL** to add length naturally — `Make yours at littlesouls.app/pawtraits.` (40 chars) > `Make yours at littlesouls.app.` (30 chars). Vary per variation.
- **Padding strategies**:
  - Add one buying-intent phrase: `made from your favourite photo`, `printed on premium canvas`, `framed and ready to hang`
  - Add a second sentence describing the moment from the backstory
  - End with the full path CTA (`littlesouls.app/pawtraits` not just `littlesouls.app`)
- Conversational, search-ready prose — write like the Pinterest search bar phrases people type
- Include 1–2 buying-intent words: custom, personalized, made from your photo, keepsake, gift, framed, wall art

### Pinterest alt_text rules

- **Aim for 105–118 characters** (target middle of 100–125 — natural drafts come in at ~92–99 and warn)
- Include ALL six elements: breed + coat colour/markings + pose + expression + art style + mood/background. Skipping one drops you below 100.
- Specific over generic: "Smiling copper-red Toller with white blaze and lifted paw in bright risograph print, playful canvas pet portrait."
- **Padding strategy**: add a coat-marking detail (`white blaze`, `cream cheeks`, `tan eyebrows`, `mismatched eyes`) and a mood word (`mellow`, `playful`, `regal`, `cozy`, `theatrical`)

### Pinterest destination_url

Always use this exact pattern for ALL pins (the literal `__LIBRARY_ID__` stays — ingest substitutes the real UUID at insert time):

```
https://www.littlesouls.app/pawtraits?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=__LIBRARY_ID__-v{1,2,3}
```

**No breed slug in the path.** Decision 2026-05-09: all Pinterest traffic lands on the polished `/pawtraits` parallax funnel page (the conversion-optimised landing) regardless of breed. Per-pin attribution is preserved via `utm_content=<library_id>-v{1,2,3}`. The breed-specific pSEO pages will be revisited later once they have richer galleries and SSR rendering.

---

## Instagram schema — Type A and Type B

```jsonc
"instagram": {
  "caption": "<≤280 chars. First line is a hook (truncated point). Warm, ends with one soft CTA.>",
  "hashtags": ["#petportrait", "#custompetart", "#<breed>", "#dogsofinstagram", "#littlesouls"]
}
```

- **First line = hook** (everything after the first line is hidden behind "...more"). Make line 1 a scroll-stopper or a curiosity gap.
- **Max 5 hashtags** (Blotato Instagram returns HTTP 422 above 5)
- Hashtag mix: 1 broad (`#petportrait`), 1 medium (`#custompetart`), 1 breed-specific (no spaces, lowercase: `#goldenretriever`), 1 community (`#dogsofinstagram` or `#catsofinstagram`), 1 brand (`#littlesouls`)

## TikTok schema — Type A and Type B

```jsonc
"tiktok": {
  "caption": "<≤180 chars, hook in the FIRST 3 WORDS, scroll-stopping, no fluff>",
  "hashtags": ["#petportrait", "#fyp", "#<breed>"]
}
```

- TikTok algo rewards a hook in the **first 3 words** (caption + the visual together)
- Use curiosity gaps, contrast statements, or specific numbers
- 3–5 hashtags max. Always include `#fyp`.

## Facebook schema — Type A and Type B (review-style)

```jsonc
"facebook": {
  "caption": "<400–700 chars. First-person review-style narrative as if a real customer ordered this pawtrait. Mention the pet name + a specific habit/moment from the backstory. End with a soft 'we made it with Pawtraits — littlesouls.app' nod.>"
}
```

- Reads like a friend posting about a thing they ordered, not a brand ad
- One specific moment > general gushing ("She does this thing where she paws the air when she's dreaming")
- No exclamation marks beyond one
- No fake star ratings, no review boilerplate

## YouTube schema — Type A only (Shorts)

```jsonc
"youtube": {
  "title": "<≤70 chars, hook + breed + style>",
  "description": "<≤300 chars, 1–2 sentence narrative + url + utm>",
  "hashtags": ["#shorts", "#petportrait", "#<breed>"]
}
```

---

## Engagement boosters (use across all platforms where they fit)

1. **Search-as-you-type phrasing** — write like the actual queries: "golden retriever portrait ideas", "memorial cat keepsake", "pet portrait Christmas gift"
2. **Long-tail variants** — V1 hits the head term, V2/V3 should pick up long-tail ("watercolor golden retriever wall art for nursery", "memorial frenchie portrait keepsake gift")
3. **Buying-intent words on V1/V2** — custom, personalized, made from photo, keepsake, gift, hand-painted, canvas, framed, wall art
4. **Emotional triggers on V3** — capture, honour, forever, soul, the way they look at you, the small details
5. **Specific over generic** — "his uneven ears" beats "his cute face"; "the postman knows him well" beats "he's playful"
6. **Open loops** — Pinterest titles can hint without revealing: "The watercolor pet portrait that has dog lovers ordering two"
7. **Occasion stacking** — when seasonal, mention it: "a Christmas gift they'll keep on the wall every year"

---

## Hard validation (ingest will warn on these)

| Field | Target | Warns if |
|---|---|---|
| `pinterest.variations.length` | exactly 3 | ≠ 3 |
| `pinterest.board` | one of the 24 locked slugs | not in list (will be coerced to breed-portraits) |
| `pinterest.variations[i].title` | 80–95 chars | <80 or >95 |
| `pinterest.variations[i].description` | 220–250 chars | <220 or >250 |
| `pinterest.variations[i].description` | no `#` | contains `#` |
| `pinterest.variations[i].alt_text` | 100–125 chars | <100 or >125 |
| `pinterest.variations[i].destination_url` | contains `utm_source=pinterest` | missing |
| `instagram.caption` | ≤280 chars | >280 |
| `instagram.hashtags` | ≤5 | >5 (HTTP 422 from Blotato) |
| `tiktok.caption` | ≤180 chars | >180 |
| `tiktok.hashtags` | ≤5 | >5 |
| `facebook.caption` | 400–700 chars | <400 or >700 |
| `youtube.title` | ≤70 chars | >70 |
| `youtube.description` | ≤300 chars | >300 |
| `review` (Type B only) | 300–700 chars | missing on scene, or <300 / >700 |

Warnings don't fail the ingest — they print so you can spot drift after a batch and tighten future generations.

---

## Worked example (Type A portrait)

```jsonc
{
  "file": "img_001.png",
  "breed": "golden retriever",
  "pet_name": "Rosie",
  "art_style": "watercolour-floral",
  "prompt": "Turn my golden retriever into a soft watercolour floral portrait with pastel washes and a loose botanical wreath.",

  "backstory": "Rosie waits by the window every 4pm — patient, sun-warmed, the calmest member of the house.",

  "captions": {
    "pinterest": {
      "board": "golden-retriever-portraits",
      "variations": [
        {
          "title": "Golden retriever watercolor portrait — custom pet wall art on canvas",
          "description": "Custom golden retriever pet portrait, hand-finished in soft watercolor and printed on canvas. A keepsake made from your favourite photo of them. Make yours at littlesouls.app.",
          "destination_url": "https://www.littlesouls.app/pawtraits?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=__LIBRARY_ID__-v1",
          "alt_text": "Golden retriever with soft floppy ears, painted in pastel watercolor with botanical wreath, sun-warm cream background, custom pet portrait."
        },
        {
          "title": "Watercolor pet portrait gift for dog lovers — handcrafted from your photo",
          "description": "A soft watercolor pet portrait, hand-finished and ready to frame — the kind of gift that lives on the wall, not in the drawer. Order yours — littlesouls.app.",
          "destination_url": "https://www.littlesouls.app/pawtraits?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=__LIBRARY_ID__-v2",
          "alt_text": "Calm golden retriever portrait in pastel watercolor with botanical wreath frame, museum-grade detail, ready for canvas print."
        },
        {
          "title": "Capture their soul in custom hand-painted pet art on canvas",
          "description": "The way they wait by the window. The light on their fur. We turn your favourite photo into a watercolor portrait worth framing. Designed for canvas — littlesouls.app/pawtraits.",
          "destination_url": "https://www.littlesouls.app/pawtraits?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=__LIBRARY_ID__-v3",
          "alt_text": "Sun-warmed golden retriever in soft watercolor portrait, calm three-quarter pose, botanical wreath frame, warm cream mood."
        }
      ]
    },
    "instagram": {
      "caption": "Rosie, by the window again at 4pm sharp. Her watercolor canvas is on the way — finally something on the wall that captures the look. Make yours at littlesouls.app.",
      "hashtags": ["#petportrait", "#custompetart", "#goldenretriever", "#dogsofinstagram", "#littlesouls"]
    },
    "tiktok": {
      "caption": "She waits at 4pm sharp. We turned that look into a watercolor canvas. Pawtraits — littlesouls.app",
      "hashtags": ["#petportrait", "#fyp", "#goldenretriever"]
    },
    "facebook": {
      "caption": "We finally ordered Rosie's pawtrait. Anyone who's met her knows the 4pm window thing — she's been doing it since she was a puppy, sat there sun-warmed and patient like she's running a meeting. The canvas arrived two weeks later in soft watercolor with a botanical wreath, and honestly, it captured the look better than any photo we've ever taken. It's hanging in the hallway now, and every visitor stops at it on the way in. We made it with Pawtraits — littlesouls.app.",
    },
    "youtube": {
      "title": "Golden retriever watercolor pet portrait — custom canvas",
      "description": "Soft watercolor pet portrait, hand-finished from your favourite photo. A keepsake made for canvas. littlesouls.app/pawtraits",
      "hashtags": ["#shorts", "#petportrait", "#goldenretriever"]
    }
  }
}
```

---

## Worked example (Type B scene — review-led, IG/TT/FB only)

```jsonc
{
  "file": "img_024.png",
  "breed": "french bulldog",
  "pet_name": "Biscuit",
  "image_style": "scene",
  "home_setting": "narrow entryway with shoes and coats",
  "pet_action": "being held up with paws dangling",
  "canvas_format": "small square canvas on wall",
  "aspect_ratio": "9:16",
  "prompt": "<short customer-facing style prompt to copy, 12-28 words>",

  "backstory": "Biscuit has zero impulse control around postmen — and a small square canvas on the entryway wall to prove it.",

  "review": "We finally got round to ordering Biscuit's pawtrait. He's been the family menace since day one — a fact our postman knows well, and one his small square canvas now captures perfectly. The piece arrived two weeks later in soft watercolour, framed unfussy in dark wood, and somehow it caught the exact face he pulls when he hears the letterbox go. It's hanging in the entryway now. Every visitor stops at it on the way in. We made it with Pawtraits — littlesouls.app.",

  "captions": {
    "instagram": {
      "caption": "He licked the canvas. Of his own face. Hung Biscuit's pawtrait in the entryway last week — every visitor stops at it now. Made ours at littlesouls.app.",
      "hashtags": ["#petportrait", "#frenchie", "#dogsofinstagram", "#custompetart", "#littlesouls"]
    },
    "tiktok": {
      "caption": "He licked the canvas. Of his own face. Pawtraits — littlesouls.app",
      "hashtags": ["#petportrait", "#fyp", "#frenchie"]
    },
    "facebook": {
      "caption": "We finally got round to ordering Biscuit's pawtrait. He's been the family menace since day one — a fact our postman knows well, and one his small square canvas now captures perfectly. The piece arrived two weeks later in soft watercolour, framed unfussy in dark wood, and somehow it caught the exact face he pulls when he hears the letterbox go. It's hanging in the entryway now. Every visitor stops at it on the way in. We made it with Pawtraits — littlesouls.app."
    }
  }
}
```

Note in this example: **the `facebook.caption` is the `review` verbatim**, the **TikTok hook is the punchiest line from the review** ("He licked the canvas. Of his own face."), and the **Instagram caption opens with that same hook then summarises** the review's reveal beat. Same voice across all three platforms = authentic UGC, not three different brand attempts.

---

## Anti-patterns (don't do these)

- ❌ Same title formula across V1/V2/V3 with one swapped word — Pinterest treats as duplicates
- ❌ Hashtags in Pinterest description body
- ❌ "Made with AI" / "AI-generated" / "GPT-Image" / "report" anywhere
- ❌ Generic adjectives — "beautiful", "amazing", "stunning" without specifics
- ❌ Star ratings, review counts, fake testimonials
- ❌ Title Case in Pinterest titles
- ❌ Emojis in Pinterest title / alt / YouTube title
- ❌ More than 5 IG hashtags
- ❌ Forgetting the `__LIBRARY_ID__` placeholder in destination URLs
- ❌ Inventing board slugs not on the locked list

---

## See also

- `scripts/library/ingest.ts` — uploader (validates and inserts pre-baked captions)
- `scripts/library/manifest.example.json` — manifest shape
- `vault/03-resources/memory/feedback/feedback_pawtraits_content_production_rules.md` — locked production rules (image side)
- `vault/01-projects/little-souls/pet-portraits/pinterest-playbook-2026-05-02.md` — full board playbook
