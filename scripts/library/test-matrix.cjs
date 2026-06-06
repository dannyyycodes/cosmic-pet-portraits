/**
 * Test matrix runner — exercises the locked photo-anchored + Vision-reinforced
 * prompt across 8 breeds × 6 styles + 4 multi-pet pairs.
 *
 * Calls fal openai/gpt-image-2/edit directly with FAL_KEY (bypasses Vercel auth).
 * Calls OpenRouter Sonnet 4.5 for the Vision pre-pass.
 *
 * Output: writes test-matrix-results.md + .json to project root for review.
 *
 * Usage: node scripts/library/test-matrix.js
 */

const fs = require('node:fs');

// ── Env loading ─────────────────────────────────────────────────────────────
function loadEnv(path) {
  try {
    const txt = fs.readFileSync(path, 'utf8');
    for (const line of txt.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  } catch (e) { /* fine */ }
}
loadEnv('.env');
loadEnv('.env.local');

const FAL_KEY = process.env.FAL_KEY;
const OR_KEY = process.env.OPENROUTER_API_KEY;
if (!FAL_KEY || !OR_KEY) { console.error('Need FAL_KEY + OPENROUTER_API_KEY'); process.exit(1); }

// ── Breeds (8) ──────────────────────────────────────────────────────────────
const BREEDS = [
  { name: 'German Shepherd', petName: 'Rex',      url: 'https://aduibsyrnenzobuyetmn.supabase.co/storage/v1/object/public/pet-photos/admin-test/german-shepherd-1778145655837.webp' },
  { name: 'French Bulldog',  petName: 'Bella',    url: 'https://images.pexels.com/photos/33766745/pexels-photo-33766745.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { name: 'Golden Retriever',petName: 'Milo',     url: 'https://images.pexels.com/photos/35439661/pexels-photo-35439661.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { name: 'Dachshund',       petName: 'Daisy',    url: 'https://images.pexels.com/photos/35297038/pexels-photo-35297038.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { name: 'Husky',           petName: 'Luna',     url: 'https://images.pexels.com/photos/27073914/pexels-photo-27073914.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { name: 'Persian Cat',     petName: 'Mochi',    url: 'https://images.pexels.com/photos/36563775/pexels-photo-36563775.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { name: 'Tabby Cat',       petName: 'Whiskers', url: 'https://images.pexels.com/photos/7556880/pexels-photo-7556880.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { name: 'Maine Coon',      petName: 'Cooper',   url: 'https://images.pexels.com/photos/32126021/pexels-photo-32126021.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
];

// ── Styles (6) ──────────────────────────────────────────────────────────────
const STYLES = [
  { id: 'watercolour', label: 'Watercolour Floral',   prompt: 'watercolour floral pet portrait with soft botanical wreath frame and pastel washes' },
  { id: 'renaissance', label: 'Renaissance Royal',    prompt: 'renaissance oil painting of the pet in noble royal regalia, chiaroscuro lighting, museum quality' },
  { id: 'cowboy',      label: 'Cowboy Western',       prompt: 'vintage western wanted-poster style, sepia tones, distressed paper texture, hand-stamped serif typography' },
  { id: 'popart',      label: 'Pop Art Lichtenstein', prompt: '1960s Lichtenstein-style pop art with bold black outlines, Ben-Day dots, flat primary colours' },
  { id: 'pixar',       label: 'Pixar 3D',             prompt: 'Pixar-style 3D-animated film hero shot with soft global illumination and expressive eyes' },
  { id: 'magazine',    label: 'Vogue Magazine',       prompt: 'editorial vogue magazine cover with bold typography and dramatic studio lighting' },
];

// ── Multi-pet pairs (4) ─────────────────────────────────────────────────────
const MULTI_PAIRS = [
  { label: 'Two dogs (Shepherd + Golden)',           pets: [BREEDS[0], BREEDS[2]],            style: STYLES[0] },
  { label: 'Two cats (Persian + Tabby)',             pets: [BREEDS[5], BREEDS[6]],            style: STYLES[1] },
  { label: 'Mixed (Dachshund + Maine Coon)',         pets: [BREEDS[3], BREEDS[7]],            style: STYLES[2] },
  { label: 'Three pets (Husky + Frenchie + Tabby)',  pets: [BREEDS[4], BREEDS[1], BREEDS[6]], style: STYLES[4] },
];

// ── Vision pre-pass ─────────────────────────────────────────────────────────
async function visionExtract(imageUrl) {
  const system = 'You are a pet-breed identification specialist. Return STRICT JSON: {"species":"dog|cat|rabbit|bird|horse|other|none","breed":"<specific>","furColor":"<markings>","eyeColor":"<...>","earShape":"<erect triangular|drop|etc>","distinguishing":"<one phrase>"}. If no pet present set species:"none" and breed:null. JSON only, no markdown.';
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OR_KEY}` },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: [
          { type: 'text', text: 'Identify this pet. Return JSON.' },
          { type: 'image_url', image_url: { url: imageUrl } },
        ]},
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300, temperature: 0.1,
    }),
  });
  if (!r.ok) return { species: 'pet' };
  const d = await r.json();
  const c = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
  const cleaned = c.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  try { return JSON.parse(cleaned); } catch { return { species: 'pet' }; }
}

// ── Prompt builders ────────────────────────────────────────────────────────
function buildSinglePetPrompt(subject, style, petName) {
  const keeps = [];
  if (subject.breed) keeps.push('the ' + subject.breed + ' silhouette and breed characteristics');
  if (subject.furColor) keeps.push(subject.furColor + ' fur pattern');
  if (subject.eyeColor) keeps.push(subject.eyeColor + ' eyes');
  if (subject.earShape) keeps.push(subject.earShape + ' ear shape');
  if (subject.distinguishing) keeps.push(subject.distinguishing);
  const keepLine = keeps.length ? 'Specifically preserve: ' + keeps.join(', ') + '.' : '';
  const lines = [
    'Use the exact pet shown in the source image. Preserve their breed, markings, fur pattern, eye colour, ear shape, and all unique features exactly as they appear in the photo. Do not change the breed. Do not invent new features. Do not redesign the pet.',
    'The source image is the ground truth: if any listed descriptor conflicts with the visible pet, follow the source image.',
    keepLine,
    '',
    'Apply this artistic transformation: ' + style.prompt + '.',
    '',
    petName ? 'Render the name "' + petName + '" in elegant clean serif typography along the lower margin of the canvas, centered, readable, no spelling errors, no other text on the canvas.' : '',
    '',
    'Output: vertical 4:5 canvas composition, painterly cinematic finish, premium polish for framed wall art.',
  ];
  return lines.filter(Boolean).join('\n');
}

function buildMultiPetPrompt(petInfos, style) {
  const petBlocks = petInfos.map(function (p, i) {
    const keeps = [];
    if (p.subject.breed) keeps.push('a ' + p.subject.breed);
    if (p.subject.furColor) keeps.push(p.subject.furColor);
    if (p.subject.eyeColor) keeps.push(p.subject.eyeColor + ' eyes');
    if (p.subject.distinguishing) keeps.push(p.subject.distinguishing);
    const keepLine = keeps.length ? ': ' + keeps.join(', ') : '';
    return 'Pet ' + (i + 1) + ' (named "' + p.name + '")' + keepLine + '.';
  }).join('\n');
  const namesSection = petInfos.map(function (p) { return '"' + p.name + '"'; }).join(' and ');
  return [
    'Use the exact pets shown across the source images. Create a single canvas portrait featuring all ' + petInfos.length + ' pets together, each rendered with their own breed, markings, eye colour, and unique features preserved exactly as in the source photos. Do not merge them into hybrids. Do not change any of their breeds.',
    'The source images are the ground truth: if any listed descriptor conflicts with the visible pet, follow the source image.',
    '',
    petBlocks,
    '',
    'Apply this artistic transformation: ' + style.prompt + '.',
    '',
    'Render the names ' + namesSection + ' in elegant clean serif typography along the lower margin of the canvas, each name beneath its respective pet, readable, no spelling errors, no other text on the canvas.',
    '',
    'Output: vertical 4:5 canvas composition, painterly cinematic finish, premium polish for framed wall art.',
  ].join('\n');
}

// ── fal call ────────────────────────────────────────────────────────────────
async function falGenerate(args) {
  const r = await fetch('https://fal.run/openai/gpt-image-2/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + FAL_KEY },
    body: JSON.stringify({
      prompt: args.prompt,
      image_urls: args.imageUrls,
      image_size: { width: 1024, height: 1280 },
      quality: 'medium',
      num_images: 1,
      output_format: 'png',
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    return { error: r.status + ': ' + t.slice(0, 300) };
  }
  const d = await r.json();
  return { url: (d.images && d.images[0] && d.images[0].url) || null };
}

// ── Concurrency limiter ─────────────────────────────────────────────────────
async function pmap(items, fn, concurrency) {
  concurrency = concurrency || 4;
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try { results[i] = await fn(items[i], i); }
      catch (e) { results[i] = { error: String(e) }; }
    }
  }
  const workers = [];
  for (let i = 0; i < concurrency; i++) workers.push(worker());
  await Promise.all(workers);
  return results;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Pre-running Vision for all 8 breeds (parallel)…');
  const breedSubjects = await pmap(BREEDS, async function (b) {
    const s = await visionExtract(b.url);
    console.log('  ' + b.name + ' → ' + s.species + '/' + (s.breed || '—'));
    return s;
  }, 4);

  const singleJobs = [];
  for (let bi = 0; bi < BREEDS.length; bi++) {
    for (let si = 0; si < STYLES.length; si++) {
      singleJobs.push({ breed: BREEDS[bi], subject: breedSubjects[bi], style: STYLES[si] });
    }
  }
  console.log('\nRunning ' + singleJobs.length + ' single-pet generations (parallel-of-5)…');
  const singleResults = await pmap(singleJobs, async function (j, idx) {
    const prompt = buildSinglePetPrompt(j.subject, j.style, j.breed.petName);
    const t0 = Date.now();
    const out = await falGenerate({ imageUrls: [j.breed.url], prompt });
    const dt = Date.now() - t0;
    console.log('  [' + (idx + 1) + '/' + singleJobs.length + '] ' + j.breed.name + ' × ' + j.style.label + ' — ' + (out.url ? '✓' : '✗') + ' (' + dt + 'ms)');
    return { breed: j.breed.name, style: j.style.label, styleId: j.style.id, url: out.url || null, error: out.error || null, prompt: prompt };
  }, 5);

  console.log('\nRunning ' + MULTI_PAIRS.length + ' multi-pet generations (parallel-of-2)…');
  const multiResults = await pmap(MULTI_PAIRS, async function (pair, idx) {
    const petInfos = pair.pets.map(function (p) { return { name: p.petName, subject: breedSubjects[BREEDS.indexOf(p)] }; });
    const prompt = buildMultiPetPrompt(petInfos, pair.style);
    const t0 = Date.now();
    const out = await falGenerate({ imageUrls: pair.pets.map(function (p) { return p.url; }), prompt });
    const dt = Date.now() - t0;
    console.log('  [' + (idx + 1) + '/' + MULTI_PAIRS.length + '] ' + pair.label + ' — ' + (out.url ? '✓' : '✗') + ' (' + dt + 'ms)');
    return { label: pair.label, count: pair.pets.length, breeds: pair.pets.map(function (p) { return p.name; }), names: pair.pets.map(function (p) { return p.petName; }), style: pair.style.label, url: out.url || null, error: out.error || null, prompt: prompt };
  }, 2);

  const md = [];
  md.push('# Pawtraits Test Matrix Results\n\nGenerated ' + new Date().toISOString() + '\n');
  md.push('## Single-pet matrix (8 breeds × 6 styles = ' + singleResults.length + ' generations)\n');
  md.push('### Source photos\n');
  for (let i = 0; i < BREEDS.length; i++) {
    md.push('- **' + BREEDS[i].name + '** ("' + BREEDS[i].petName + '") — Vision said: ' + (breedSubjects[i].breed || '—') + ', ' + (breedSubjects[i].furColor || '—'));
    md.push('  - Source: ' + BREEDS[i].url);
  }
  md.push('\n### Generations\n');
  md.push('| Breed | ' + STYLES.map(function (s) { return s.label; }).join(' | ') + ' |');
  md.push('|---|' + STYLES.map(function () { return '---'; }).join('|') + '|');
  for (const breed of BREEDS) {
    const row = ['**' + breed.name + '**'];
    for (const style of STYLES) {
      const r = singleResults.find(function (rr) { return rr.breed === breed.name && rr.styleId === style.id; });
      row.push(r && r.url ? '[view](' + r.url + ')' : '❌ ' + ((r && r.error && r.error.slice(0, 60)) || 'fail'));
    }
    md.push('| ' + row.join(' | ') + ' |');
  }
  md.push('\n## Multi-pet matrix (' + multiResults.length + ' pairs)\n');
  for (const r of multiResults) {
    md.push('### ' + r.label + ' — ' + r.style);
    md.push('Pets: ' + r.names.map(function (n, i) { return n + ' (' + r.breeds[i] + ')'; }).join(', '));
    md.push('- Result: ' + (r.url ? '[view](' + r.url + ')' : '❌ ' + r.error));
    md.push('');
  }
  const okSingle = singleResults.filter(function (r) { return r.url; }).length;
  const okMulti = multiResults.filter(function (r) { return r.url; }).length;
  md.push('\n## Summary\n');
  md.push('- Single-pet: ' + okSingle + '/' + singleResults.length + ' ✓ — cost ≈ $' + (okSingle * 0.045).toFixed(2));
  md.push('- Multi-pet: ' + okMulti + '/' + multiResults.length + ' ✓ — cost ≈ $' + (okMulti * 0.045).toFixed(2));

  fs.writeFileSync('test-matrix-results.md', md.join('\n'));
  fs.writeFileSync('test-matrix-results.json', JSON.stringify({ breedSubjects: breedSubjects, singleResults: singleResults, multiResults: multiResults }, null, 2));
  console.log('\nDone. Wrote test-matrix-results.md and .json.');
  console.log('Single: ' + okSingle + '/' + singleResults.length + ' ✓ — Multi: ' + okMulti + '/' + multiResults.length + ' ✓');
}

main().catch(function (err) { console.error(err); process.exit(1); });
