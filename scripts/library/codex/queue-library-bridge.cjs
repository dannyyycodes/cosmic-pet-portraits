/**
 * queue-library-bridge.cjs — adapter that takes an FB-shape Codex manifest
 * and routes the same images into pawtrait_library via ingest.ts.
 *
 * Invoked from queue-post.cjs after a successful fb_posts insert.
 *
 * Usage:
 *   node queue-library-bridge.cjs <path-to-fb-manifest.json>
 *
 * Steps:
 *   1. Reads FB manifest (slot, cast_member, style, images, image_prompts)
 *   2. Looks up cast_member in prompts/_cast.json → breed, pet_kind, pet_name
 *   3. Builds an ingest-shape manifest with the same image files
 *   4. Stages a sibling .library-staging/ folder with image copies + manifest
 *   5. Spawns `npx tsx scripts/library/ingest.ts <staging>` (webp + Pinterest
 *      captions via OpenRouter + pawtrait_library insert)
 *   6. Cleans up staging on success
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const CAST_PATH = path.join(REPO_ROOT, 'scripts', 'library', 'codex', 'prompts', '_cast.json');
const INGEST_SCRIPT = path.join(REPO_ROOT, 'scripts', 'library', 'ingest.ts');

// Env loader (matches queue-post.cjs / paste-sheet.ts pattern)
function loadEnv(p) {
  try {
    const t = fs.readFileSync(p, 'utf8');
    for (const line of t.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv(path.join(REPO_ROOT, '.env'));
loadEnv(path.join(REPO_ROOT, '.env.local'));

const args = process.argv.slice(2);
const fbManifestArg = args[0];
if (!fbManifestArg) {
  console.error('Usage: node queue-library-bridge.cjs <fb-manifest.json>');
  process.exit(1);
}
const fbManifestPath = path.resolve(fbManifestArg);
if (!fs.existsSync(fbManifestPath)) {
  console.error(`Manifest not found: ${fbManifestPath}`);
  process.exit(1);
}

const fbDir = path.dirname(fbManifestPath);
const fbManifest = JSON.parse(fs.readFileSync(fbManifestPath, 'utf8'));

if (!fbManifest.cast_member) {
  console.log('ℹ FB manifest has no cast_member — skipping library insert (no breed/pet_kind to infer).');
  process.exit(0);
}

const cast = JSON.parse(fs.readFileSync(CAST_PATH, 'utf8'));
const castKey = String(fbManifest.cast_member).toLowerCase();
const castEntry = cast[castKey];
if (!castEntry) {
  console.warn(`⚠ Cast member "${fbManifest.cast_member}" not found in _cast.json — skipping library insert.`);
  process.exit(0);
}
if (!castEntry.pet_kind) {
  console.warn(`⚠ Cast member "${castEntry.name}" missing pet_kind in _cast.json — skipping library insert.`);
  process.exit(0);
}

const artStyle =
  fbManifest.style ||
  castEntry.signature_style ||
  (castEntry.signature_style_rotation && castEntry.signature_style_rotation[0]) ||
  'mixed-media';
const aspectRatio = '4:5';
const imageStyle = 'portrait';

const images = fbManifest.images || [];
if (images.length === 0) {
  console.warn('⚠ FB manifest has no images[] — skipping library insert.');
  process.exit(0);
}

const stagingDir = path.join(fbDir, '.library-staging');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

for (const f of images) {
  const src = path.join(fbDir, f);
  if (!fs.existsSync(src)) {
    console.error(`Image not found: ${src}`);
    process.exit(1);
  }
  fs.copyFileSync(src, path.join(stagingDir, f));
}

const ingestManifest = {
  defaults: {
    pet_kind: castEntry.pet_kind,
    image_style: imageStyle,
    art_style: String(artStyle).replace(/\s+/g, '-').toLowerCase(),
    aspect_ratio: aspectRatio,
    approved: true,
  },
  items: images.map((file, idx) => ({
    file,
    breed: castEntry.breed,
    pet_name: castEntry.name,
    prompt:
      (fbManifest.image_prompts && fbManifest.image_prompts[idx]) ||
      '(prompt not captured at queue time)',
  })),
};
fs.writeFileSync(
  path.join(stagingDir, 'manifest.json'),
  JSON.stringify(ingestManifest, null, 2),
  'utf8',
);

console.log(`\n📚 Routing ${images.length} image(s) to pawtrait_library (${castEntry.name} / ${castEntry.breed})...`);

const r = spawnSync('npx', ['tsx', INGEST_SCRIPT, stagingDir], {
  cwd: REPO_ROOT,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

const code = r.status ?? 1;
if (code !== 0) {
  console.error(`\n✗ Library ingest failed (exit ${code}). Staging folder kept at: ${stagingDir}`);
  process.exit(code);
}

fs.rmSync(stagingDir, { recursive: true, force: true });
console.log(`\n✓ Library insert complete.`);
