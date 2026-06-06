/**
 * queue-post.cjs — upload a Codex-generated FB content manifest to Supabase fb_posts queue.
 *
 * Usage:
 *   node scripts/library/codex/queue-post.cjs <path-to-manifest.json> [--auto-approve] [--schedule=<ISO-8601>]
 *
 * What it does:
 *   1. Reads the manifest.json
 *   2. Runs voice-check.js (blocks on hard fails)
 *   3. Uploads each image to Supabase storage bucket `pawtrait-library` at fb-posts/<uuid>/<filename>
 *   4. Inserts an fb_posts row with public URLs and status='pending_approval'
 *      (or 'approved' if --auto-approve flag is set, useful for initial test posts)
 *   5. Prints the inserted row ID
 *
 * Env (from .env.local):
 *   VITE_SUPABASE_URL       (already in .env per existing repo convention)
 *   SUPABASE_SERVICE_ROLE_KEY (in .env.local)
 *
 * Exit codes:
 *   0 — queued successfully
 *   1 — manifest invalid / voice-check hard fail / Supabase error
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');

// ============== env loader (matches save-batch.cjs pattern) ==============
function loadEnv(p) {
  try {
    const t = fs.readFileSync(p, 'utf8');
    for (const line of t.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  } catch {}
}
// Try CWD first (back-compat) then repo root (lets the user invoke from any folder).
const __repoRoot = path.resolve(__dirname, '..', '..', '..');
loadEnv('.env');
loadEnv('.env.local');
loadEnv(path.join(__repoRoot, '.env'));
loadEnv(path.join(__repoRoot, '.env.local'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('✗ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (check .env.local)');
  process.exit(1);
}
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];

// ============== args ==============
const args = process.argv.slice(2);
const manifestPath = args.find(a => !a.startsWith('--'));
const autoApprove = args.includes('--auto-approve');
const scheduleArg = args.find(a => a.startsWith('--schedule='));
const scheduledFor = scheduleArg ? scheduleArg.split('=')[1] : null;
const skipLibrary = args.includes('--skip-library');
const skipPasteSheet = args.includes('--skip-paste-sheet');

if (!manifestPath) {
  console.error('Usage: node queue-post.cjs <path-to-manifest.json> [--auto-approve] [--schedule=<ISO-8601>]');
  process.exit(1);
}

const absManifestPath = path.resolve(manifestPath);
if (!fs.existsSync(absManifestPath)) {
  console.error(`✗ Manifest not found: ${absManifestPath}`);
  process.exit(1);
}

const manifestDir = path.dirname(absManifestPath);
const manifest = JSON.parse(fs.readFileSync(absManifestPath, 'utf8'));

// ============== voice-check first ==============
console.log(`\n━━━ Queueing ${manifest.slot} (${manifest.cast_member || 'real-customer'}) ━━━`);

const voiceCheckPath = path.join(__dirname, 'lib', 'voice-check.cjs');
if (fs.existsSync(voiceCheckPath)) {
  const vc = spawnSync('node', [voiceCheckPath, absManifestPath], { encoding: 'utf8' });
  process.stdout.write(vc.stdout);
  if (vc.status === 1) {
    console.error('✗ Voice check hard-failed. Fix the caption before queueing.');
    process.exit(1);
  }
} else {
  console.warn('⚠ voice-check.js not found — skipping voice check');
}

// ============== upload images to Supabase storage ==============
const postId = crypto.randomUUID();
const bucket = 'pawtrait-library';
const imageFiles = manifest.images || [];
if (imageFiles.length === 0) {
  console.error('✗ Manifest has no images[]');
  process.exit(1);
}

async function uploadImage(filename) {
  const localPath = path.join(manifestDir, filename);
  if (!fs.existsSync(localPath)) {
    throw new Error(`Image not found: ${localPath}`);
  }
  const buf = fs.readFileSync(localPath);
  const storagePath = `fb-posts/${postId}/${filename}`;
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${storagePath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'image/png',
      'x-upsert': 'true',
    },
    body: buf,
  });
  if (!res.ok) {
    throw new Error(`upload failed (${res.status}): ${await res.text()}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${storagePath}`;
}

async function insertRow(imageUrls) {
  // determine format from slot or manifest
  const slotToFormat = {
    'reveal-monday': 'reel',
    'breed-pride-tuesday': 'carousel',
    'aesthetic-drop-wednesday': 'photo',
    'caption-this-thursday': 'photo',
    'bridge-friday': 'carousel',
    'transformation-story-saturday': 'carousel',
    'then-and-now-saturday': 'album',
  };
  const format = manifest.format || slotToFormat[manifest.slot] || 'photo';

  const status = manifest.status === 'flagged_for_human_rewrite' ? 'flagged'
              : autoApprove ? 'approved'
              : 'pending_approval';

  const row = {
    slot: manifest.slot,
    cast_member: manifest.cast_member ? manifest.cast_member.toLowerCase() : null,
    style: manifest.style || null,
    format,
    status,
    caption: manifest.caption,
    first_comment: manifest.first_comment,
    self_reply: manifest.self_reply || null,
    image_urls: imageUrls,
    story_anchor: manifest.story_anchor || null,
    wisdom_snippet: manifest.wisdom_snippet || null,
    connector_pattern: manifest.connector_pattern_used || null,
    ethics_gate: manifest.ethics_gate || null,
    scheduled_for: scheduledFor,
    voice_check_passed: true,
    manifest_path: absManifestPath,
  };

  // override id so storage path matches DB row
  row.id = postId;
  if (status === 'approved') {
    row.approved_at = new Date().toISOString();
    row.approved_by = autoApprove ? 'cli_auto_approve' : null;
  }

  const url = `${SUPABASE_URL}/rest/v1/fb_posts`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    throw new Error(`insert failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json())[0];
}

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

function runNodeCjs(scriptPath, scriptArgs) {
  const r = spawnSync('node', [scriptPath, ...scriptArgs], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });
  return r.status ?? 1;
}

function runTsx(scriptPath, scriptArgs) {
  const r = spawnSync('npx', ['tsx', scriptPath, ...scriptArgs], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  return r.status ?? 1;
}

(async () => {
  try {
    console.log(`\n📤 Uploading ${imageFiles.length} images to Supabase storage...`);
    const imageUrls = [];
    for (const f of imageFiles) {
      const url = await uploadImage(f);
      console.log(`  ✓ ${f}`);
      imageUrls.push(url);
    }

    console.log(`\n📝 Inserting fb_posts row...`);
    const inserted = await insertRow(imageUrls);
    console.log(`  ✓ id=${inserted.id} status=${inserted.status}`);

    // ============== library + Pinterest are OPT-IN only ==============
    // FB slot content (photoreal comedy, reels, scenes) is NOT canvas art.
    // Library is for painted/canvas portraits only. To opt-in, pass --library.
    const optInLibrary = args.includes('--library');
    if (optInLibrary) {
      const bridgePath = path.join(__dirname, 'queue-library-bridge.cjs');
      if (fs.existsSync(bridgePath)) {
        const libCode = runNodeCjs(bridgePath, [absManifestPath]);
        if (libCode !== 0) {
          console.warn(`⚠ Library bridge exited ${libCode} — fb_posts row was created OK, but library insert failed.`);
        }
      }
      const pasteSheetPath = path.join(REPO_ROOT, 'scripts', 'library', 'paste-sheet.ts');
      if (fs.existsSync(pasteSheetPath)) {
        console.log(`\n📋 Generating Pinterest paste-sheet...`);
        runTsx(pasteSheetPath, []);
      }
    }

    console.log(`\n━━━ Done ━━━`);
    console.log(`Slot:       ${inserted.slot}`);
    console.log(`Cast:       ${inserted.cast_member || 'real-customer'}`);
    console.log(`Status:     ${inserted.status}`);
    if (inserted.scheduled_for) console.log(`Scheduled:  ${inserted.scheduled_for}`);
    console.log(`Images:     ${imageUrls.length}`);
    console.log(`First image: ${imageUrls[0]}`);
    console.log(`\nNext: n8n FB Auto-Poster will pick this up via the fb_posts_${inserted.status === 'approved' ? 'due' : 'pending'} view.`);
    process.exit(0);
  } catch (err) {
    console.error(`\n✗ ${err.message}`);
    process.exit(1);
  }
})();
