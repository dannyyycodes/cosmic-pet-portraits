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
if (!OPENROUTER_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY required for caption generation.');
  process.exit(1);
}

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
}

interface Manifest {
  defaults?: Partial<ItemDef>;
  items: ItemDef[];
}

interface Captions {
  pinterest?: { title: string; description: string; destination_url: string; hashtags: string[] };
  facebook?:  { caption: string };  // review-style narrative
  instagram?: { caption: string; hashtags: string[] };
  tiktok?:    { caption: string; hashtags: string[] };
  youtube?:   { title: string; description: string; hashtags: string[] };
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

async function generateCaptions(item: ItemDef): Promise<CaptionsBundle> {
  const isScene = item.image_style === 'scene';
  const platforms = isScene
    ? ['facebook', 'instagram', 'tiktok']                       // scene-mode = social/review angle
    : ['pinterest', 'youtube'];                                  // portrait-mode = catalog/discovery
  const petLabel = item.pet_name ? `${item.pet_name} the ${item.breed}` : `a ${item.breed}`;
  const styleLabel = (item.art_style ?? '').replace(/-/g, ' ');

  const system = `You write per-platform marketing copy for the "Pawtraits" brand by Little Souls — custom AI-generated pet portraits printed on canvas.

Brand voice: warm, sincere, never AI-jargon. Never reference AI, never reference "report" — these are pawtraits / portraits / canvases. Customer-feeling. Honour the pet.

You will receive ONE pet's details. Return STRICT JSON with:
- backstory: 1-2 sentence character note, present tense, mentions the pet name if given
- captions: object with one key per platform requested

Per-platform caption rules:

${platforms.includes('pinterest') ? `- pinterest: { "title": "<60 chars catchy", "description": "<200 chars, search-ready, ends with 'Made with Pawtraits at littlesouls.app'", "destination_url": "${PUBLIC_SITE_URL}/pawtraits/studio", "hashtags": ["#PetPortraits","#CustomPetArt","#${item.breed.replace(/ /g,'')}Art"] }` : ''}
${platforms.includes('facebook') ? `- facebook: { "caption": "<400-700 chars REVIEW-STYLE first-person narrative — pretend a real customer ordered this pawtrait and is sharing why they love it; mention their pet's name + a tiny detail (a habit, a moment); end with a soft 'we made it with Pawtraits — littlesouls.app' nod, no exclamation overkill" }` : ''}
${platforms.includes('instagram') ? `- instagram: { "caption": "<280 chars, warm, ends with a single soft CTA line about the canvas", "hashtags": ["#petportrait","#custompetart","#${item.breed.replace(/ /g,'').toLowerCase()}", "#dogsofinstagram or #catsofinstagram", "#littlesouls"] (max 5) }` : ''}
${platforms.includes('tiktok') ? `- tiktok: { "caption": "<180 chars, hook-first, scroll-stopper", "hashtags": ["#petportrait","#fyp","#${item.breed.replace(/ /g,'').toLowerCase()}"] (max 5) }` : ''}
${platforms.includes('youtube') ? `- youtube: { "title": "<70 chars", "description": "<300 chars", "hashtags": ["#shorts","#petportrait","#${item.breed.replace(/ /g,'')}"] }` : ''}

Hard rules:
- No AI / model / prompt mentions
- No "report" — say pawtrait or canvas
- No fake reviews stars or numbers
- No emojis in pinterest title or yt title
- Hashtags are arrays of strings starting with #

Return ONLY the JSON object — no prose, no markdown fences.`;

  const user = JSON.stringify({
    pet: petLabel,
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
      max_tokens: 1100,
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

    // 2. Generate captions
    console.log(`  · captions via ${OPENROUTER_MODEL}…`);
    const bundle = await generateCaptions(merged);

    // 3. Upload to bucket — keys are deterministic by row id, so generate id first.
    //    We use crypto.randomUUID() for the ID; the row INSERT will use the same id.
    const id = crypto.randomUUID();
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
      generated_by: 'codex-cli-manual',
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
