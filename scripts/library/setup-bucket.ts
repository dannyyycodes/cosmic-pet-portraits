#!/usr/bin/env bun
/**
 * One-off setup: creates the `pawtrait-library` Supabase Storage bucket
 * and applies the public-read policy. Run once after the migration lands:
 *
 *   bun scripts/library/setup-bucket.ts
 *
 * Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env or environment.
 * Idempotent — re-running is safe.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const BUCKET = 'pawtrait-library';

async function main() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  // 1. Create bucket if missing
  const { data: list, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) { console.error('listBuckets failed:', listErr); process.exit(1); }
  const exists = (list ?? []).some(b => b.name === BUCKET);

  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 1024 * 1024 * 25, // 25 MB per file (high-res webp ~3-8 MB)
      allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg'],
    });
    if (error) { console.error('createBucket failed:', error); process.exit(1); }
    console.log(`✓ Created bucket "${BUCKET}" (public, 25 MB limit, image/* only)`);
  } else {
    const { error } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: 1024 * 1024 * 25,
      allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg'],
    });
    if (error) { console.error('updateBucket failed:', error); process.exit(1); }
    console.log(`✓ Bucket "${BUCKET}" already exists, updated config`);
  }

  // 2. Folder convention check — write a .keep object so the structure is visible in admin
  const { error: keepErr } = await supabase.storage
    .from(BUCKET)
    .upload('.keep', new Blob(['library root\n'], { type: 'text/plain' }), {
      upsert: true,
    });
  if (keepErr && !keepErr.message.includes('Duplicate')) {
    console.error('keep object upload failed:', keepErr);
  }

  console.log('\nFolder convention used by Maker:');
  console.log('  pawtrait-library/');
  console.log('    YYYY-MM/dog/<art-style>/<row-id>.webp');
  console.log('    YYYY-MM/dog/<art-style>/<row-id>-thumb.webp');
  console.log('    YYYY-MM/cat/<art-style>/<row-id>.webp');
  console.log('\nNext: run `bun scripts/library/maker.ts --count=1` to add the first row.');
}

main().catch(err => { console.error(err); process.exit(1); });
