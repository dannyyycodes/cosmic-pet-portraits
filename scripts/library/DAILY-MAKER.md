# Daily Library Maker - Codex brief

> Paste-once-per-day brief. Codex CLI runs this end-to-end. Generates 10 Pawtraits examples, ingests into pawtrait_library, and builds the Pinterest paste-sheet. No user intervention after the paste.

---

## Step 1 - pick today's combos

Run this in your shell:

```bash
node scripts/library/make-library-batch.cjs --new
```

It writes today's batch brief at:
`C:/Users/danie/pet-portraits/incoming/YYYY-MM-DD-library-batch-1/codex-brief.md`

The brief lists today's 10 random `breed x life-stage x presentation x art-style x creative direction` combos, avoiding recent breeds where possible.

## Step 2 - read the brief AND the schema

Open and read these THREE files in order:

1. `C:/Users/danie/pet-portraits/incoming/YYYY-MM-DD-library-batch-1/codex-brief.md`
2. `scripts/library/CODEX_PROMPT.md`
3. `scripts/library/codex/prompts/_styles.json`

## Step 3 - generate 10 images + manifest

For each of the 10 combos in today's brief:

- Use your image gen tool to produce a single Type A portrait: pet-only, full-frame, no room or canvas in shot.
- Aspect 2:3 vertical, 1000x1500 or higher.
- Match the style's `render_brief` exactly from `_styles.json`.
- Follow the brief's `life_stage` and `presentation`. The gallery must include puppies, kittens, adults, seniors, realistic character portraits, and stylised art pieces.
- Photoreal/realistic output is allowed only when the pet is clearly a character/archetype. Do not make plain realistic studio portraits for the library.
- For realistic character presentation, make a premium canvas-ready pet portrait with believable fur, eyes, lighting, anatomy, and tasteful costume/role detail. No phone snapshot comedy, people, hands, room mockup, or physical canvas object in shot.
- Combine the style with the brief's `concept_type` and `creative direction`. Each output should feel like a distinct character/world idea, not a generic centred breed sample.
- For `concept_type=character`, make the animal clearly read as an archetype with role, costume, silhouette, and props-as-ornament: astronaut, superhero, detective, wizard, pilot, explorer, knight, sea captain, inventor, etc.
- For `concept_type=art-object`, make the portrait feel like a collectible art piece: stamp, matchbox label, tapestry, tarot card, book cover, shop sign, stained glass, seed packet, poster, theatre card, packaging, editorial illustration.
- Use visual culture broadly as the idea bank. Transform the inspiration; never copy a living artist, brand, IP character, logo, franchise costume, or recognisable copyrighted work.
- Photoreal is allowed only when character-led. These examples help customers imagine their own pet on canvas without becoming plain stock-style pet photos.
- Generic breed example: pick a sensible pet name that fits the breed, or omit `pet_name`. Never use cast members like Mochi, Beans, Clover, Atlas, or Hazel.
- Save as `img_001.png` ... `img_010.png` in the output folder.

After all 10 images are written, write `manifest.json` in the same folder, matching the schema in `CODEX_PROMPT.md` exactly. Each item ships with:

- `file`, `breed`, `pet_kind`, `art_style`, `aspect_ratio`, `prompt`, `pet_name` optional.
- `prompt` is public copy shown in the gallery copy box. It must be short, clear, useful for customers to copy: 12-28 words, one sentence, no internal labels, no negative prompt, no "use case", no "constraints".
- `backstory`: 1-2 sentence character note.
- `captions.pinterest`: `{ board, variations: [V1, V2, V3] }` with exactly 3 fresh-pin variations per `CODEX_PROMPT.md`.
- `captions.instagram`, `captions.tiktok`, `captions.youtube` per `CODEX_PROMPT.md`.

## Step 4 - ingest to library

After the manifest is written, run this in your shell:

```bash
node scripts/library/make-library-batch.cjs --ingest
```

This auto-detects today's folder, runs `ingest.ts`, then runs `paste-sheet.ts`.

## Done

Report back to the user in one line: how many images were ingested, the gallery URL (`https://littlesouls.app/pawtraits/gallery`), and the paste-sheet path.

## Hard rules - DO NOT deviate

1. Photoreal is allowed only when the brief asks for a realistic character portrait. Plain photoreal/studio pet portraits are not allowed in the library.
2. Never use named cast members: Mochi, Beans, Clover, Atlas, Hazel.
3. Always run Step 1 and Step 4 via the `node` commands above. Do not hand-edit the live library or skip the bridge scripts.
4. If a realistic image is not clearly character-led, regenerate. If it looks glossy/plastic or like a phone snapshot, regenerate.
5. Voice rules from `CODEX_PROMPT.md` are non-negotiable. No AI references, no "report", no exclamation overkill.
6. Reject style-only outputs. If the pet is just centred on a background with a thin art-style filter, regenerate with a stronger character/world direction before writing the manifest.
7. Reject samey batch composition. Across the 10 images, vary crop, silhouette, costume/object format, border system, breed, life stage, realism level, colour family, and medium texture.
8. Do not keep repeating the same breeds. Preserve the listed breeds and include puppy/kitten items whenever the brief asks for them.
