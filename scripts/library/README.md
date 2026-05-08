# Pawtraits Library — Ingest Workflow

The "Maker" robot is **you, with Codex CLI.** This folder is everything that
happens after you've generated a batch of images. The ingest script:

1. converts to webp + thumbnail (sharp)
2. uploads both to the public `pawtrait-library` Supabase bucket
3. asks Claude Sonnet 4.5 (via OpenRouter) for a backstory + per-platform captions
4. inserts a `pawtrait_library` row, marked approved
5. moves the source file to `processed/` so re-running is safe

## One-time setup

Add to `cosmic-pet-portraits/.env.local` (these never get committed):

```
SUPABASE_SERVICE_ROLE_KEY=<paste from Supabase Settings → API>
OPENROUTER_API_KEY=<paste from openrouter.ai dashboard>
```

(`VITE_SUPABASE_URL` is already in `.env`.)

## Per-batch workflow

1. **Generate in Codex CLI.** Save outputs into a fresh folder, e.g.
   `~/pet-portraits/incoming/2026-05-06-watercolour-goldens/`. Filenames don't
   matter — the manifest names them.

2. **Drop a `manifest.json`** in that folder. Use `manifest.example.json` here
   as a template. Set `defaults` to the attributes shared by the whole batch
   (image_style, pet_kind, art_style, aspect_ratio); list one `items` entry
   per file, overriding any field per-item.

3. **Run ingest:**
   ```bash
   bun scripts/library/ingest.ts ~/pet-portraits/incoming/2026-05-06-watercolour-goldens
   ```

   You'll see one line per file as it processes (~5-10s per item — most of that
   is the Sonnet caption call). Done message at the end with success count.

## Image-style routing (decides who posts each image)

**Updated 2026-05-07** — Type A (portrait) now goes to all socials too, not just
Pinterest. See `vault/03-resources/memory/feedback/feedback_pawtraits_content_production_rules.md`.

| Surface | Type A `portrait` | Type B `scene` |
|---|---|---|
| `/pawtraits/gallery` (library page) | ✅ | ❌ |
| Pinterest | ✅ | ❌ |
| Instagram | ✅ | ✅ |
| TikTok | ✅ | ✅ |
| Facebook | ✅ | ✅ |

- **Library gallery API** (`op:gallery`) is hard-filtered to portraits only.
- **Pinterest poster** must pass `image_style: portrait` to `op:list`.
- **Instagram / TikTok / Facebook posters** pass NO `image_style` filter (both types
  flow through), or run twice for an even mix.

Sonnet writes captions per type:
- Type A: title + description + hashtags + destination_url for **pinterest, instagram,
  tiktok, facebook**.
- Type B: review-style narrative caption + hashtags for **instagram, tiktok, facebook** only.

## What captions look like

For a `portrait` ingest, Sonnet returns:
```json
{
  "backstory": "Rosie has the patience of a saint and the schedule of a CEO…",
  "captions": {
    "pinterest": {
      "board": "golden-retriever-portraits",
      "variations": [
        {
          "title": "Golden retriever watercolor portrait — custom AI pet art on canvas",
          "description": "Soft watercolor pet portrait of a golden retriever, hand-finished and ready to print on canvas. Perfect for dog lovers who want something one-of-a-kind. Make yours at littlesouls.app.",
          "destination_url": "https://www.littlesouls.app/pawtraits/breed/golden-retriever?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=<library_id>-v1",
          "alt_text": "Smiling golden retriever with floppy ears, painted in soft watercolor with warm cream background, custom pet portrait."
        },
        { "title": "...", "description": "...", "destination_url": "...-v2", "alt_text": "..." },
        { "title": "...", "description": "...", "destination_url": "...-v3", "alt_text": "..." }
      ],

      // Backwards-compat (mirrored from variations[0] by the ingest script).
      // Existing posters reading captions.pinterest.title etc keep working.
      "title": "Golden retriever watercolor portrait — custom AI pet art on canvas",
      "description": "Soft watercolor pet portrait...",
      "destination_url": "https://www.littlesouls.app/pawtraits/breed/golden-retriever?...&utm_content=<library_id>-v1",
      "alt_text": "Smiling golden retriever with floppy ears..."
    },
    "youtube": { "title": "…", "description": "…", "hashtags": [...] }
  }
}
```

### Pinterest schema (2026-05-08, post-SEO playbook)

- **board**: One slug from the locked 24-board list (`pinterest-playbook-2026-05-02.md`). Posters look this up to get the real Pinterest board ID.
- **variations**: Exactly 3 fresh-pin variations. Pinterest treats `same image + new title + new description + new URL` as new content, so the rotating poster (n8n `zSxvYwR8aAKTp8JN`) cycles through V1 → V2 → V3 across separate posts.
- **Variation angles**: V1 breed-led, V2 gift/occasion-led (or style-led if no occasion fits), V3 emotional/benefit-led.
- **Title**: 80–95 chars, sentence case, primary keyword in the first 40 chars.
- **Description**: 220–250 chars, no hashtags in the body, keyword + value prop in the first 50 chars, subtle CTA at the end.
- **Alt text**: 100–125 chars, specific (breed, coat, pose, expression, art style, mood).
- **destination_url**: `/pawtraits/breed/<breed-slug>?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=<library_id>-v{1,2,3}`. Ingest script substitutes the real UUID into the `__LIBRARY_ID__` placeholder Sonnet returns.

For a `scene` ingest, Sonnet returns:
```json
{
  "backstory": "Biscuit has zero impulse control around postmen…",
  "captions": {
    "facebook": {
      "caption": "We finally got round to ordering Biscuit's pawtrait — he's been the family menace since day one (a fact the postman knows well). The canvas arrived two weeks later and… [400-700 chars review-style narrative]. We made it with Pawtraits — littlesouls.app."
    },
    "instagram": { "caption": "…", "hashtags": [...] },
    "tiktok":    { "caption": "…", "hashtags": [...] }
  }
}
```

## Recovering from failure

The script is idempotent per file: if step 4 (DB insert) fails, the bucket
uploads are rolled back. If steps 1-3 fail, nothing is uploaded. Re-run the
same command; only un-processed files (still in the batch folder, not in
`processed/`) get retried.

## Posters

Posters are separate n8n workflows on Droplet 2 — they pull approved rows
from `op:list&platform=<name>` and post via Blotato. Each platform has its
own cron schedule. Building these is the next phase.

## See also

- Architecture + decisions: `vault/01-projects/little-souls/pet-portraits/pawtraits-content-engine-2026-05-06.md`
- Image-gen rule: `vault/03-resources/memory/feedback/feedback_pawtraits_image_gen_uses_codex.md`
- 1-image-per-generation rule: `vault/03-resources/memory/feedback/feedback_pawtraits_one_image_per_generation.md`
