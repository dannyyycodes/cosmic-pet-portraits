#!/usr/bin/env bun
/**
 * Pawtraits ingest tool — bulk-upload Codex CLI outputs to the content library.
 *
 * Usage:
 *   bun scripts/library/ingest.ts <folder>
 *   bun scripts/library/ingest.ts ~/pet-portraits/incoming/2026-05-06-batch1
 *
 * Folder layout:
 *   <folder>/
 *     manifest.json
 *     img_001.png   img_002.png   ...
 *
 * Manifest shape (defaults apply to every item; per-item overrides win):
 *   {
 *     "defaults": {
 *       "image_style": "portrait" | "scene",
 *       "pet_kind":    "dog" | "cat" | "small-pet" | "other",
 *       "art_style":   "watercolour-floral",
 *       "aspect_ratio":"1:1" | "2:3" | "3:4" | "9:16" | ...,
 *       "home_setting": "...",      // scene only
 *       "pet_action":   "...",      // scene only
 *       "canvas_format":"...",      // scene only
 *       "approved": true            // default true; set false to send to Filer queue
 *     },
 *     "items": [
 *       { "file": "img_001.png", "breed": "golden retriever", "pet_name": "Rosie",
 *         "prompt": "the EXACT prompt you fed Codex" },
 *       { "file": "img_002.png", "breed": "miniature dachshund", "pet_name": "Milo",
 *         "prompt": "..." }
 *     ]
 *   }
 *
 * What it does for each item:
 *   1. Validates the image file exists + has reasonable dims (>=1024 long edge)
 *   2. Generates a webp full-size + a 800px-square webp thumbnail
 *   3. Uploads both to bucket pawtrait-library at YYYY-MM/<pet_kind>/<art_style>/<id>.webp
 *   4. Calls OpenRouter Sonnet 4.5 once per image to generate
 *      backstory + per-platform captions tailored to image_style
 *   5. INSERTs a pawtrait_library row, marks approved unless set otherwise
 *   6. Moves processed file into <folder>/processed/ so re-running is safe
 *
 * Env vars required (read from .env.local or .env or shell):
 *   VITE_SUPABASE_URL                — project URL
 *   SUPABASE_SERVICE_ROLE_KEY        — service role JWT (for storage + DB writes)
 *   OPENROUTER_API_KEY               — for caption generation
 *
 * Optional:
 *   OPENROUTER_MODEL  (default: anthropic/claude-sonnet-4.5)
 *   PUBLIC_SITE_URL   (default: https://www.littlesouls.app — used in Pinterest dest URL)
 */
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFile, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Bun auto-loads .env / .env.local — no explicit dotenv import needed.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4.5';
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || 'https://www.littlesouls.app';
const BUCKET = 'pawtrait-library';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERROR: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required.');
  console.error('Add them to .env.local in cosmic-pet-portraits or export in shell.');
  process.exit(1);
}
// OPENROUTER_API_KEY is optional now: only required for items that don't ship
// with pre-baked captions in the manifest. We check at use-site, not startup.

type ImageStyle = 'portrait' | 'scene';
type PetKind = 'dog' | 'cat' | 'small-pet' | 'other';

interface ItemDef {
  file: string;
  breed: string;
  pet_name?: string;
  prompt?: string;
  // any field below overrides defaults
  image_style?: ImageStyle;
  pet_kind?: PetKind;
  art_style?: string;
  aspect_ratio?: string;
  home_setting?: string;
  pet_action?: string;
  canvas_format?: string;
  approved?: boolean;
  // Optional pre-baked captions written by the Maker (Codex) at generation time.
  // If both `backstory` and `captions` are present, ingest skips the OpenRouter call.
  // See scripts/library/CODEX_PROMPT.md for the exact SEO-optimised schema Codex must follow.
  backstory?: string;
  story_long?: string;
  captions?: Captions;
  // Type B (scene) only: first-person customer-review narrative (300-700 chars) that
  // anchors all social copy for this image. IG/TT hooks quote from it, FB caption IS it.
  // Stashed inside captions._review by ingest so no SQL migration is needed.
  review?: string;
}

interface Manifest {
  defaults?: Partial<ItemDef>;
  items: ItemDef[];
}

interface PinterestVariation {
  title: string;
  description: string;
  destination_url: string;
  alt_text: string;
}

interface PinterestCaption {
  // Board slug from the locked 24-board playbook list.
  board: string;
  // Three "fresh-pin" variations: same image, different title+description+URL.
  // Pinterest's algo treats each as new content.
  variations: PinterestVariation[];
  // Backwards-compat fallback fields (mirror variations[0]). Older posters that
  // read captions.pinterest.title/description still work without changes.
  title?: string;
  description?: string;
  destination_url?: string;
  alt_text?: string;
  hashtags?: string[];
}

interface Captions {
  pinterest?: PinterestCaption;
  facebook?:  { caption: string };  // review-style narrative
  instagram?: { caption: string; hashtags: string[] };
  tiktok?:    { caption: string; hashtags: string[] };
  youtube?:   { title: string; description: string; hashtags: string[] };
  // Type B (scene) only — canonical first-person customer review that anchors all
  // social copy for the image. IG/TT hooks quote from it, FB caption IS it.
  // Underscore-prefixed so it never gets mistaken for a platform key.
  _review?: string;
}

interface CaptionsBundle {
  backstory: string;
  story_long?: string;
  captions: Captions;
}

const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!);

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

function yearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function processImage(srcPath: string): Promise<{
  fullBuf: Buffer; thumbBuf: Buffer; width: number; height: number;
}> {
  const inBuf = await readFile(srcPath);
  const meta = await sharp(inBuf).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < 1024 || h < 1024) {
    throw new Error(`image too small: ${w}x${h} (need ≥1024 on each edge)`);
  }
  // Full-size: re-encode to webp at quality 88 (good balance for canvas-resolution images).
  // Cap long edge to 2048 to keep storage modest — high enough for site display + Pinterest.
  const fullBuf = await sharp(inBuf)
    .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88 })
    .toBuffer();
  const thumbBuf = await sharp(inBuf)
    .resize({ width: 800, height: 800, fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
  // Re-read final dims (post-resize) so the gallery aspect-ratio is accurate.
  const finalMeta = await sharp(fullBuf).metadata();
  return {
    fullBuf,
    thumbBuf,
    width: finalMeta.width ?? w,
    height: finalMeta.height ?? h,
  };
}

// Locked board slug list from the 24-board Pinterest playbook.
// See: vault/01-projects/little-souls/pet-portraits/pinterest-playbook-2026-05-02.md
const PINTEREST_BOARDS = [
  'golden-retriever-portraits',
  'french-bulldog-portraits',
  'labrador-portraits',
  'dachshund-portraits',
  'doodle-portraits',
  'border-collie-portraits',
  'pug-portraits',
  'german-shepherd-portraits',
  'cat-portraits-tabby-tuxedo',
  'cat-portraits-black-maine-coon',
  'memorial-pet-portraits',
  'christmas-pet-gifts',
  'mothers-day-pet-gifts',
  'adoption-pet-portraits',
  'new-pet-celebration',
  'pet-birthday-art',
  'wedding-pet-portraits',
  'renaissance-pet-portraits',
  'royal-pet-portraits',
  'modern-minimalist-pet-art',
  'watercolor-pet-portraits',
  'cosmic-astrology-pet-art',
  'vintage-victorian-pet-art',
  'pop-art-pet-portraits',
] as const;

function breedSlug(breed: string): string {
  return breed.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Validate Maker-supplied captions against the SEO playbook. Warns but does not throw —
// the ingest still proceeds. Use this to spot-check Codex output drift after a batch.
function validateInlineCaptions(captions: Captions, imageStyle: ImageStyle, file: string): void {
  const warn = (msg: string) => console.log(`    ⚠ ${file}: ${msg}`);
  const isPortrait = imageStyle === 'portrait';

  if (isPortrait) {
    const p = captions.pinterest;
    if (!p) { warn('portrait missing pinterest captions'); return; }
    if (!Array.isArray(p.variations) || p.variations.length !== 3) {
      warn(`pinterest.variations should be exactly 3, got ${p.variations?.length ?? 0}`);
    }
    if (p.board && !(PINTEREST_BOARDS as readonly string[]).includes(p.board)) {
      warn(`pinterest.board "${p.board}" not in locked list — will be coerced`);
    }
    (p.variations ?? []).forEach((v, i) => {
      const tag = `pinterest.variations[${i}]`;
      const tlen = (v.title ?? '').length;
      if (tlen < 80 || tlen > 95) warn(`${tag}.title is ${tlen} chars (target 80–95)`);
      const dlen = (v.description ?? '').length;
      if (dlen < 220 || dlen > 250) warn(`${tag}.description is ${dlen} chars (target 220–250)`);
      if ((v.description ?? '').includes('#')) warn(`${tag}.description contains '#' (no hashtags in body)`);
      const alen = (v.alt_text ?? '').length;
      if (alen < 100 || alen > 125) warn(`${tag}.alt_text is ${alen} chars (target 100–125)`);
      if (!v.destination_url || !/utm_source=pinterest/.test(v.destination_url)) {
        warn(`${tag}.destination_url missing utm_source=pinterest`);
      }
    });
    if (captions.youtube) {
      const y = captions.youtube;
      if ((y.title ?? '').length > 70) warn(`youtube.title > 70 chars`);
      if ((y.description ?? '').length > 300) warn(`youtube.description > 300 chars`);
    }
  }

  // Type B (scene) — review is the canonical anchor for IG/TT/FB. Validate length.
  if (!isPortrait) {
    const r = (captions._review ?? '').length;
    if (r === 0) warn('scene missing review (Type B should ship a first-person review)');
    else if (r < 300 || r > 700) warn(`review is ${r} chars (target 300–700)`);
  }

  // Both portrait and scene flow through IG/TT/FB. (Portrait may also have them in 2026-05-07+ rule.)
  if (captions.instagram) {
    const c = (captions.instagram.caption ?? '').length;
    if (c > 280) warn(`instagram.caption is ${c} chars (>280)`);
    if ((captions.instagram.hashtags ?? []).length > 5) warn(`instagram.hashtags > 5 (Blotato HTTP 422)`);
  }
  if (captions.tiktok) {
    const c = (captions.tiktok.caption ?? '').length;
    if (c > 180) warn(`tiktok.caption is ${c} chars (>180)`);
    if ((captions.tiktok.hashtags ?? []).length > 5) warn(`tiktok.hashtags > 5`);
  }
  if (captions.facebook) {
    const c = (captions.facebook.caption ?? '').length;
    if (c < 400 || c > 700) warn(`facebook.caption is ${c} chars (target 400–700 review-style)`);
  }
}

async function generateCaptions(item: ItemDef): Promise<CaptionsBundle> {
  if (!OPENROUTER_KEY) {
    throw new Error('OPENROUTER_API_KEY not set and item has no pre-baked captions in manifest. Either add captions to the manifest (see CODEX_PROMPT.md) or set OPENROUTER_API_KEY.');
  }
  const isScene = item.image_style === 'scene';
  const platforms = isScene
    ? ['facebook', 'instagram', 'tiktok']                       // scene-mode = social/review angle
    : ['pinterest', 'youtube'];                                  // portrait-mode = catalog/discovery
  const petLabel = item.pet_name ? `${item.pet_name} the ${item.breed}` : `a ${item.breed}`;
  const styleLabel = (item.art_style ?? '').replace(/-/g, ' ');
  const breedKw = breedSlug(item.breed);

  const system = `You write per-platform marketing copy for the "Pawtraits" brand by Little Souls — custom AI-generated pet portraits printed on canvas.

Brand voice: warm, sincere, never AI-jargon. Never reference AI, never reference "report" — these are pawtraits / portraits / canvases. Customer-feeling. Honour the pet.

You will receive ONE pet's details. Return STRICT JSON with:
- backstory: 1-2 sentence character note, present tense, mentions the pet name if given
- captions: object with one key per platform requested

Per-platform caption rules:

${platforms.includes('pinterest') ? `- pinterest: SEO-optimised for the 2026 Pinterest algo. Return THIS exact shape:
  {
    "board": "<one slug from the locked list>",
    "variations": [ {V1}, {V2}, {V3} ]   // exactly 3 fresh-pin variations
  }

  BOARD selection — pick ONE slug from this list (do NOT invent new ones):
  ${PINTEREST_BOARDS.join(', ')}
  Pick by breed first, then style, then occasion. If the pet's backstory implies memorial / anniversary / birthday / adoption / Christmas / Mother's Day / wedding, prefer the matching occasion board over the breed/style board.

  EACH VARIATION is an object: { "title", "description", "destination_url", "alt_text" }

  TITLE rules (per variation):
  - 80–95 characters. Sentence case (NOT Title Case).
  - Front-load the primary keyword in the first 40 chars: breed + art style + intent.
  - No emojis. No ALL CAPS. No clickbait punctuation.
  - Examples Pinterest rewards: "Golden retriever watercolor portrait — custom AI pet art on canvas" / "Memorial cat portrait in Renaissance oil painting style — keepsake gift".

  DESCRIPTION rules (per variation):
  - 220–250 characters. NOT 500. NO HASHTAGS in the body.
  - First 50 chars MUST contain the keyword + value prop (that's all that shows in the feed).
  - Natural, conversational, search-ready prose. End with a subtle CTA (e.g. "Make yours at littlesouls.app").
  - No "Made with Pawtraits at littlesouls.app" boilerplate — vary the closing line per variation.

  ALT_TEXT rules (per variation):
  - 100–125 characters. Specific and descriptive. Used by Pinterest Lens + accessibility.
  - Include: breed, coat colour/markings, pose, expression, art style, mood/background.
  - Example: "Smiling golden retriever with floppy ears, painted in soft watercolor with warm cream background, custom pet portrait."

  DESTINATION_URL — use exactly:
  V1: ${PUBLIC_SITE_URL}/pawtraits/breed/${breedKw}?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=__LIBRARY_ID__-v1
  V2: ${PUBLIC_SITE_URL}/pawtraits/breed/${breedKw}?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=__LIBRARY_ID__-v2
  V3: ${PUBLIC_SITE_URL}/pawtraits/breed/${breedKw}?utm_source=pinterest&utm_medium=organic&utm_campaign=library&utm_content=__LIBRARY_ID__-v3
  (The literal string __LIBRARY_ID__ stays as-is; the ingest script substitutes the real UUID after parsing.)

  VARIATION ANGLES (each variation MUST take a distinct angle):
  - V1 — Breed-led: lead with breed + art style. e.g. "Golden retriever watercolor portrait..."
  - V2 — Gift / occasion-led if the backstory supports one (memorial, birthday, adoption, Christmas, wedding, Mother's Day); otherwise style-led. e.g. "Memorial pet portrait gift — capture their soul in custom watercolor art" / "Watercolor pet art for dog lovers — handcrafted from your photo".
  - V3 — Emotional / benefit-led: lead with the transformation, not the product. e.g. "Capture their soul in custom hand-painted pet art" / "Turn your favourite photo of them into a forever piece".

  Pinterest is a search engine — write like search queries people actually type. No fluff, no AI references, no "report".` : ''}
${platforms.includes('facebook') ? `- facebook: { "caption": "<400-700 chars REVIEW-STYLE first-person narrative — pretend a real customer ordered this pawtrait and is sharing why they love it; mention their pet's name + a tiny detail (a habit, a moment); end with a soft 'we made it with Pawtraits — littlesouls.app' nod, no exclamation overkill" }` : ''}
${platforms.includes('instagram') ? `- instagram: { "caption": "<280 chars, warm, ends with a single soft CTA line about the canvas", "hashtags": ["#petportrait","#custompetart","#${item.breed.replace(/ /g,'').toLowerCase()}", "#dogsofinstagram or #catsofinstagram", "#littlesouls"] (max 5) }` : ''}
${platforms.includes('tiktok') ? `- tiktok: { "caption": "<180 chars, hook-first, scroll-stopper", "hashtags": ["#petportrait","#fyp","#${item.breed.replace(/ /g,'').toLowerCase()}"] (max 5) }` : ''}
${platforms.includes('youtube') ? `- youtube: { "title": "<70 chars", "description": "<300 chars", "hashtags": ["#shorts","#petportrait","#${item.breed.replace(/ /g,'')}"] }` : ''}

Hard rules:
- No AI / model / prompt mentions
- No "report" — say pawtrait or canvas
- No fake review stars or numbers
- No emojis in pinterest titles, alt text, or yt title
- Hashtags are arrays of strings starting with # (Pinterest description body must NOT contain hashtags)

Return ONLY the JSON object — no prose, no markdown fences.`;

  const user = JSON.stringify({
    pet: petLabel,
    breed: item.breed,
    breed_slug: breedKw,
    art_style: styleLabel,
    image_style: item.image_style,
    home_setting: item.home_setting,
    pet_action: item.pet_action,
    pet_name: item.pet_name ?? null,
  });

  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': PUBLIC_SITE_URL,
      'X-Title': 'Pawtraits Ingest',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1800,
      temperature: 0.7,
    }),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`openrouter ${r.status}: ${txt.slice(0, 240)}`);
  }
  const d = await r.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = d.choices?.[0]?.message?.content;
  if (!raw) throw new Error('openrouter returned empty content');
  // Robust parse: strip markdown if Sonnet returns fenced JSON despite response_format
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const parsed = JSON.parse(cleaned) as CaptionsBundle;
  if (!parsed.backstory) throw new Error('caption response missing backstory');
  if (!parsed.captions || typeof parsed.captions !== 'object') throw new Error('caption response missing captions');
  return parsed;
}

/**
 * Finalise the Pinterest caption block:
 *  - Substitute __LIBRARY_ID__ in destination URLs with the real row UUID
 *  - Validate board slug against the locked playbook list (fall back to a sensible default)
 *  - Populate flat backwards-compat fields (title/description/destination_url/alt_text)
 *    from variations[0] so existing posters reading the old shape keep working.
 */
function finalisePinterest(captions: Captions, libraryId: string, fallbackBreed: string): void {
  const p = captions.pinterest;
  if (!p) return;

  // Validate / coerce board
  const validBoards = new Set<string>(PINTEREST_BOARDS as readonly string[]);
  if (!p.board || !validBoards.has(p.board)) {
    // Soft fallback: pick the breed-portraits board if we have one, else watercolor as a generic.
    const breedBoard = `${breedSlug(fallbackBreed)}-portraits`;
    p.board = validBoards.has(breedBoard) ? breedBoard : 'watercolor-pet-portraits';
  }

  // Substitute the placeholder in every variation
  if (Array.isArray(p.variations)) {
    for (const v of p.variations) {
      if (typeof v.destination_url === 'string') {
        v.destination_url = v.destination_url.replace(/__LIBRARY_ID__/g, libraryId);
      }
    }
  }

  // Backwards-compat: mirror variations[0] into the flat fields.
  const v0 = p.variations?.[0];
  if (v0) {
    p.title = v0.title;
    p.description = v0.description;
    p.destination_url = v0.destination_url;
    p.alt_text = v0.alt_text;
  }
}

async function uploadToBucket(path: string, buf: Buffer, contentType: string): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType,
    cacheControl: '31536000',
    upsert: true,
  });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function ingestItem(folder: string, item: ItemDef, defaults: Partial<ItemDef>): Promise<{ ok: boolean; id?: string; error?: string }> {
  const merged: ItemDef = { ...defaults, ...item };
  // Required-field guard
  const required: (keyof ItemDef)[] = ['file', 'breed', 'image_style', 'pet_kind', 'art_style', 'aspect_ratio'];
  for (const k of required) {
    if (!merged[k]) return { ok: false, error: `missing required field: ${k}` };
  }

  const srcPath = join(folder, merged.file);
  if (!existsSync(srcPath)) return { ok: false, error: `file not found: ${srcPath}` };

  try {
    // 1. Process image
    console.log(`  · processing ${merged.file} (${merged.breed} / ${merged.art_style})`);
    const { fullBuf, thumbBuf, width, height } = await processImage(srcPath);

    // 2. Captions — prefer pre-baked from manifest (Codex inline-caption mode, $0
    //    marginal cost). Fall back to OpenRouter Sonnet 4.5 only if the item lacks them.
    let bundle: CaptionsBundle;
    let captionSource: 'inline' | 'openrouter';
    if (merged.backstory && merged.captions) {
      console.log(`  · using pre-baked captions from manifest`);
      // Fold top-level `review` into captions._review so it lives in the JSONB blob.
      // Top-level on the manifest is just for Codex clarity; storage is unified.
      const captions: Captions = merged.review
        ? { ...merged.captions, _review: merged.review }
        : merged.captions;
      validateInlineCaptions(captions, merged.image_style!, merged.file);
      bundle = {
        backstory: merged.backstory,
        story_long: merged.story_long,
        captions,
      };
      captionSource = 'inline';
    } else {
      console.log(`  · captions via ${OPENROUTER_MODEL}…`);
      bundle = await generateCaptions(merged);
      captionSource = 'openrouter';
    }

    // 3. Upload to bucket — keys are deterministic by row id, so generate id first.
    //    We use crypto.randomUUID() for the ID; the row INSERT will use the same id.
    const id = crypto.randomUUID();

    // 3a. Substitute the library-id placeholder into Pinterest destination URLs and
    //     populate the backwards-compat flat fields from variations[0].
    finalisePinterest(bundle.captions, id, merged.breed);

    const stem = `${yearMonth()}/${merged.pet_kind}/${slugify(merged.art_style!)}/${id}`;
    const fullPath = `${stem}.webp`;
    const thumbPath = `${stem}-thumb.webp`;
    const fullUrl = await uploadToBucket(fullPath, fullBuf, 'image/webp');
    const thumbUrl = await uploadToBucket(thumbPath, thumbBuf, 'image/webp');
    console.log(`  · uploaded → ${fullPath}`);

    // 4. Insert library row
    const approved = merged.approved !== false;  // default true
    const insertRow = {
      id,
      pet_kind: merged.pet_kind!,
      breed: merged.breed,
      pet_name: merged.pet_name ?? null,
      image_style: merged.image_style!,
      art_style: merged.art_style!,
      home_setting: merged.home_setting ?? null,
      pet_action: merged.pet_action ?? null,
      canvas_format: merged.canvas_format ?? null,
      aspect_ratio: merged.aspect_ratio!,
      prompt: merged.prompt ?? '(prompt not captured at ingest time)',
      backstory: bundle.backstory,
      story_long: bundle.story_long ?? null,
      captions: bundle.captions,
      image_path: fullPath,
      image_url: fullUrl,
      thumbnail_path: thumbPath,
      thumbnail_url: thumbUrl,
      width,
      height,
      approved,
      approved_at: approved ? new Date().toISOString() : null,
      generated_by: captionSource === 'inline' ? 'codex-cli-inline-captions' : 'codex-cli-manual',
      generation_model: 'gpt-image-1',
      generation_cost_usd: 0,  // flat-rate via Plus subscription
    };
    const { error: insErr } = await supabase.from('pawtrait_library').insert(insertRow);
    if (insErr) {
      // Best-effort cleanup: remove uploaded files
      await supabase.storage.from(BUCKET).remove([fullPath, thumbPath]).catch(() => {});
      return { ok: false, error: `db insert failed: ${insErr.message}` };
    }

    // 5. Move processed file
    const processedDir = join(folder, 'processed');
    if (!existsSync(processedDir)) await mkdir(processedDir, { recursive: true });
    const dstPath = join(processedDir, merged.file);
    await rename(srcPath, dstPath).catch(() => { /* non-fatal */ });

    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function main() {
  const folderArg = process.argv[2];
  if (!folderArg) {
    console.error('Usage: bun scripts/library/ingest.ts <folder>');
    process.exit(1);
  }

  const folder = folderArg.replace(/^~/, process.env.HOME ?? process.env.USERPROFILE ?? '~');
  if (!existsSync(folder)) {
    console.error(`folder not found: ${folder}`);
    process.exit(1);
  }
  const manifestPath = join(folder, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error(`manifest.json not found in: ${folder}`);
    console.error('See script header for the manifest shape.');
    process.exit(1);
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Manifest;
  const defaults = manifest.defaults ?? {};
  const items = manifest.items ?? [];
  if (items.length === 0) {
    console.error('manifest has no items');
    process.exit(1);
  }

  console.log(`\n  Pawtraits ingest — ${items.length} item(s) from ${folder}\n`);
  let ok = 0;
  const failures: string[] = [];
  for (const item of items) {
    const r = await ingestItem(folder, item, defaults);
    if (r.ok) {
      ok++;
      console.log(`  ✓ ${item.file} → ${r.id}\n`);
    } else {
      failures.push(`${item.file}: ${r.error}`);
      console.log(`  ✗ ${item.file}: ${r.error}\n`);
    }
  }

  console.log(`\n  Done. ${ok}/${items.length} ingested.`);
  if (failures.length > 0) {
    console.log('\n  Failures:');
    for (const f of failures) console.log(`    - ${f}`);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
