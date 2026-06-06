# Codex FB Content Scripts

Daily Facebook content generation for Little Souls. Layered on top of the existing pawtraits ingest system (see `../CODEX_PROMPT.md` for the broader Pinterest/IG/TT/YT caption rules — this is the FB-specific extension).

## What this is

Six slot templates, one per day of the week (Mon–Sat, Sun off). Each slot tells Codex CLI exactly what to generate: 3 image variations, an FB caption, a first-comment with link, a self-reply for the algo thread-depth signal.

The captions inherit the **`littlesouls-angle-prompt` storytelling skill** — character-sheet narrator, witness position, un-inventable detail, Wisdom Snippet beat, connector grammar at the bridge, discovery vocabulary in CTAs.

## Folder map

```
codex/
├── README.md                           ← this file
├── prompts/
│   ├── _voice-rules.md                 ← brand voice + storytelling formula (read first)
│   ├── _cast.json                      ← 5 founding pets: Clover, Atlas, Hazel, Beans, Mochi
│   ├── _styles.json                    ← canvas style library
│   ├── _ethics-gate.md                 ← Five Love Test (memorial only)
│   └── slots/
│       ├── reveal-monday.md
│       ├── breed-pride-tuesday.md
│       ├── aesthetic-drop-wednesday.md
│       ├── caption-this-thursday.md
│       ├── bridge-friday.md
│       └── transformation-story-saturday.md
└── lib/
    └── voice-check.js                  ← regex pass — run on output before posting
```

## How to test all six slots in Codex CLI

Open Codex terminal in the project root:

```bash
cd C:\Users\danie\cosmic-pet-portraits
codex
```

Then for each slot, paste this command (replacing `<slot>`):

```
Read scripts/library/codex/prompts/_voice-rules.md, scripts/library/codex/prompts/_cast.json, scripts/library/codex/prompts/_styles.json, and scripts/library/codex/prompts/slots/<slot>.md. Then execute the slot brief — generate 3 image variations + the FB caption + first-comment + self-reply. Save outputs to ~/pet-portraits/incoming/2026-05-09-fb-test/<slot>/ with manifest.json containing all the text fields and image filenames.
```

Replace `<slot>` with one of:
- `reveal-monday`
- `breed-pride-tuesday`
- `aesthetic-drop-wednesday`
- `caption-this-thursday`
- `bridge-friday`
- `transformation-story-saturday`

For Reveal Monday and Transformation Story Saturday, Codex should reference the existing master image at `C:\Users\danie\vault\01-projects\little-souls\pet-portraits\clover-reference.png` (or `~/pet-portraits/incoming/2026-05-09-test-B/processed/img_001.png`) for Clover's identity lock.

## Validation after generation

```bash
node scripts/library/codex/lib/voice-check.js ~/pet-portraits/incoming/2026-05-09-fb-test/<slot>/manifest.json
```

Flags any voice violations (first-person Little Souls, engagement bait, body-text links, etc.) before approval.

## Approval flow

1. Open the per-slot folder, review the 3 image variations + caption
2. Pick the winning image (rename to `final.png` or note the filename)
3. Run voice-check; fix any flags
4. (Manual for v1) Post via Blotato or schedule via n8n
5. (Phase 3 — later) n8n cron auto-routes approved manifests to FB

## Outputs land at

```
~/pet-portraits/incoming/2026-05-09-fb-test/
├── reveal-monday/
│   ├── img_001.png
│   ├── img_002.png
│   ├── img_003.png
│   └── manifest.json
├── breed-pride-tuesday/
├── aesthetic-drop-wednesday/
├── caption-this-thursday/
├── bridge-friday/
└── transformation-story-saturday/
```

Each `manifest.json`:

```json
{
  "slot": "reveal-monday",
  "cast_member": "Clover",
  "style": "watercolour-floral",
  "story_anchor": "the rescue who took three months to bond",
  "wisdom_snippet": "...",
  "images": ["img_001.png", "img_002.png", "img_003.png"],
  "caption": "...",
  "first_comment": "...",
  "self_reply": "...",
  "generated_at": "2026-05-09T...",
  "status": "awaiting_review"
}
```
