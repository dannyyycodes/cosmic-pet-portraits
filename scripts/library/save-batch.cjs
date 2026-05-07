/**
 * save-batch.cjs — persist a test-batch results JSON to long-term storage.
 *
 * Reads a results JSON (e.g. test-batch-2-results.json) and:
 *   1. Downloads the source photo + every fal output PNG to local disk
 *      under ~/pet-portraits/incoming/<batch-name>/<pet-slug>/<style-slug>.png
 *      (organised by pet so all variations of one pet sit together)
 *   2. Uploads each PNG to Supabase Storage (pawtrait-library bucket) under
 *      <batch-name>/<pet-slug>/<style-slug>.png
 *   3. Writes a _manifest.json with all metadata: vision output, prompts,
 *      source URLs, fal URLs, local paths, supabase URLs — full audit trail.
 *
 * NO new API spend. Just downloads existing fal CDN URLs (before they expire)
 * + uploads to Supabase Storage. Costs only the time + ~1 MB / image bandwidth.
 *
 * Usage:
 *   node scripts/library/save-batch.cjs <results-json> <batch-name>
 *   node scripts/library/save-batch.cjs test-batch-2-results.json 2026-05-07-batch-2-validation
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function loadEnv(p) {
  try {
    const t = fs.readFileSync(p, 'utf8');
    for (const line of t.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv('.env'); loadEnv('.env.local');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const argv = process.argv.slice(2);
if (argv.length < 2) {
  console.error('Usage: node scripts/library/save-batch.cjs <results-json> <batch-name>');
  process.exit(1);
}
const RESULTS_FILE = argv[0];
const BATCH_NAME = argv[1];

const HOME = os.homedir();
const LOCAL_BASE = path.join(HOME, 'pet-portraits', 'incoming', BATCH_NAME);

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

async function downloadToBuffer(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('fetch ' + r.status + ' for ' + url);
  return Buffer.from(await r.arrayBuffer());
}

async function uploadToSupabase(remotePath, bytes, contentType) {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  const r = await fetch(SUPABASE_URL + '/storage/v1/object/pawtrait-library/' + remotePath, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Content-Type': contentType,
      'x-upsert': 'true',
      'cache-control': '31536000',
    },
    body: bytes,
  });
  if (!r.ok) {
    const t = await r.text();
    console.warn('  ! supabase upload failed: ' + r.status + ' ' + t.slice(0, 100));
    return null;
  }
  return SUPABASE_URL + '/storage/v1/object/public/pawtrait-library/' + remotePath;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

(async () => {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.error('Results file not found: ' + RESULTS_FILE);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));

  // The two batches we have differ slightly in structure. Normalise.
  // batch-1 (test-matrix-results.json): { breedSubjects, singleResults, multiResults }
  //   singleResults rows: { breed, style, styleId, url, error, prompt }
  //   sources are in BREEDS const inside the script — not in the JSON. We'll need to
  //   reconstruct from `breedSubjects` ordering. Actually breedSubjects is just the vision
  //   output array — we need names. Let me fall back to known mapping or skip if missing.
  // batch-2 (test-batch-2-results.json): same shape PLUS { breeds, styles, multiPairs }
  //   so we have full source URLs. Use this when present.

  const breedsList = data.breeds || null;
  const stylesList = data.styles || null;
  const multiPairsList = data.multiPairs || null;

  if (!breedsList) {
    console.warn('NOTE: this batch JSON does not contain breeds[]. We can still save outputs by name.');
  }

  ensureDir(LOCAL_BASE);
  console.log('Saving to: ' + LOCAL_BASE);
  console.log('Supabase prefix: pawtrait-library/' + BATCH_NAME + '/');
  console.log('');

  const manifest = {
    batchName: BATCH_NAME,
    sourceFile: RESULTS_FILE,
    savedAt: new Date().toISOString(),
    pets: [],
    multiPet: [],
  };

  // Group single results by breed
  const byBreed = {};
  for (const row of data.singleResults || []) {
    if (!byBreed[row.breed]) byBreed[row.breed] = [];
    byBreed[row.breed].push(row);
  }

  let i = 0;
  for (const breedName of Object.keys(byBreed)) {
    i++;
    const breedSlug = slugify(breedName);
    const sourceObj = breedsList ? breedsList.find(b => b.name === breedName) : null;
    const petSlug = sourceObj ? slugify(sourceObj.petName) + '-' + breedSlug : breedSlug;
    const localDir = path.join(LOCAL_BASE, petSlug);
    ensureDir(localDir);
    console.log('[' + i + '] ' + breedName + ' → ' + petSlug);

    const petManifest = {
      breed: breedName,
      petName: sourceObj ? sourceObj.petName : null,
      sourceUrl: sourceObj ? sourceObj.url : null,
      vision: null,
      generations: [],
    };

    // vision lookup
    if (data.breedSubjects && breedsList) {
      const idx = breedsList.findIndex(b => b.name === breedName);
      if (idx >= 0) petManifest.vision = data.breedSubjects[idx];
    }

    // download + upload source
    if (sourceObj && sourceObj.url) {
      try {
        const buf = await downloadToBuffer(sourceObj.url);
        // detect ext from content-type or default to jpg
        const ext = sourceObj.url.includes('.webp') ? 'webp' : 'jpeg';
        const localPath = path.join(localDir, 'source.' + ext);
        fs.writeFileSync(localPath, buf);
        const supaPath = BATCH_NAME + '/' + petSlug + '/source.' + ext;
        const supaUrl = await uploadToSupabase(supaPath, buf, 'image/' + ext);
        petManifest.sourceLocal = localPath;
        petManifest.sourceSupabase = supaUrl;
        console.log('  · source saved');
      } catch (e) {
        console.warn('  ! source download failed: ' + e.message);
      }
    }

    // download + upload each generation
    for (const row of byBreed[breedName]) {
      if (!row.url) {
        petManifest.generations.push({ style: row.style, styleId: row.styleId, error: row.error });
        console.log('  · ' + row.style + ' — skipped (failed)');
        continue;
      }
      try {
        const buf = await downloadToBuffer(row.url);
        const styleSlug = slugify(row.styleId || row.style);
        const localPath = path.join(localDir, styleSlug + '.png');
        fs.writeFileSync(localPath, buf);
        const supaPath = BATCH_NAME + '/' + petSlug + '/' + styleSlug + '.png';
        const supaUrl = await uploadToSupabase(supaPath, buf, 'image/png');
        petManifest.generations.push({
          style: row.style,
          styleId: row.styleId,
          falUrl: row.url,
          localPath,
          supabaseUrl: supaUrl,
          prompt: row.prompt,
        });
        console.log('  · ' + row.style + ' saved');
      } catch (e) {
        console.warn('  ! ' + row.style + ' failed: ' + e.message);
        petManifest.generations.push({ style: row.style, styleId: row.styleId, falUrl: row.url, error: e.message });
      }
    }

    manifest.pets.push(petManifest);
  }

  // Multi-pet results
  if (data.multiResults && data.multiResults.length > 0) {
    const multiDir = path.join(LOCAL_BASE, 'multi-pet');
    ensureDir(multiDir);
    console.log('\nMulti-pet:');
    let mi = 0;
    for (const row of data.multiResults) {
      mi++;
      const labelSlug = slugify(row.label);
      const styleSlug = slugify(row.style || 'unknown');
      const filename = labelSlug + '.png';
      const m = { label: row.label, breeds: row.breeds, names: row.names, style: row.style, falUrl: row.url, prompt: row.prompt };
      if (!row.url) {
        m.error = row.error;
        manifest.multiPet.push(m);
        console.log('  · ' + row.label + ' — skipped (failed)');
        continue;
      }
      try {
        const buf = await downloadToBuffer(row.url);
        const localPath = path.join(multiDir, filename);
        fs.writeFileSync(localPath, buf);
        const supaPath = BATCH_NAME + '/multi-pet/' + filename;
        const supaUrl = await uploadToSupabase(supaPath, buf, 'image/png');
        m.localPath = localPath;
        m.supabaseUrl = supaUrl;
        manifest.multiPet.push(m);
        console.log('  · ' + row.label + ' saved');
      } catch (e) {
        m.error = e.message;
        manifest.multiPet.push(m);
        console.warn('  ! ' + row.label + ' failed: ' + e.message);
      }
    }
  }

  fs.writeFileSync(path.join(LOCAL_BASE, '_manifest.json'), JSON.stringify(manifest, null, 2));
  // Also push manifest to supabase for cross-machine access
  await uploadToSupabase(BATCH_NAME + '/_manifest.json',
    Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'),
    'application/json');

  const okSingle = manifest.pets.reduce((n, p) => n + p.generations.filter(g => g.localPath).length, 0);
  const okMulti = manifest.multiPet.filter(m => m.localPath).length;
  console.log('\n✓ Saved ' + okSingle + ' single-pet + ' + okMulti + ' multi-pet generations');
  console.log('  Local:    ' + LOCAL_BASE);
  console.log('  Supabase: pawtrait-library/' + BATCH_NAME + '/');
  console.log('  Manifest: ' + path.join(LOCAL_BASE, '_manifest.json'));
})();
