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

- `image_style: "portrait"` → goes to **Library gallery + Pinterest** (full-frame
  artistic; clicking in the gallery reveals the prompt)
- `image_style: "scene"` → goes to **Facebook + Instagram + TikTok** (customer-style
  phone photo with the canvas in the room; Sonnet writes a review-style narrative
  caption)

The same image is never on every platform — Sonnet only writes captions for the
platforms the image_style is suited to. The Library gallery API (`op:gallery`) is
hard-filtered to portraits only.

## What captions look like

For a `portrait` ingest, Sonnet returns:
```json
{
  "backstory": "Rosie has the patience of a saint and the schedule of a CEO…",
  "captions": {
    "pinterest": {
      "title": "Watercolour Floral Pet Portrait",
      "description": "…ends with: Made with Pawtraits at littlesouls.app",
      "destination_url": "https://www.littlesouls.app/pawtraits/studio",
      "hashtags": ["#PetPortraits", "#CustomPetArt", "#GoldenRetrieverArt"]
    },
    "youtube": { "title": "…", "description": "…", "hashtags": [...] }
  }
}
```

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
