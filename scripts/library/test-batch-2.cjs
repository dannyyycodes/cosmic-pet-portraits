/**
 * Second batch test — 5 fresh breeds × 5 fresh styles + 3 multi-pet combos.
 * Uses the /edit endpoint fix Codex shipped + improved Vision prompt.
 *
 * Cost: 28 generations × $0.045 ≈ $1.26 + tiny Vision cost.
 *
 * Outputs: test-batch-2-results.json + test-batch-2-viewer.html
 */
const fs = require('node:fs');

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

const FAL_KEY = process.env.FAL_KEY;
const OR_KEY = process.env.OPENROUTER_API_KEY;
if (!FAL_KEY || !OR_KEY) { console.error('Missing keys'); process.exit(1); }

const BREEDS = [
  { name: 'Border Collie', petName: 'Scout',  url: 'https://images.pexels.com/photos/34363704/pexels-photo-34363704.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { name: 'Pug',           petName: 'Otis',   url: 'https://images.pexels.com/photos/27401425/pexels-photo-27401425.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { name: 'Dalmatian',     petName: 'Pongo',  url: 'https://images.pexels.com/photos/7800865/pexels-photo-7800865.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { name: 'Sphynx Cat',    petName: 'Naked',  url: 'https://images.pexels.com/photos/31644049/pexels-photo-31644049.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
  { name: 'Bengal Cat',    petName: 'Spots',  url: 'https://images.pexels.com/photos/30189391/pexels-photo-30189391.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940' },
];

const STYLES = [
  { id: 'astronaut',   label: 'Astronaut in Space',     prompt: 'an astronaut in a white spacesuit with helmet visor reflecting stars, deep space backdrop with nebula colours' },
  { id: 'knight',      label: 'Medieval Knight',        prompt: 'a medieval knight in polished plate armour holding a heraldic banner, castle courtyard backdrop, rich oil-painting finish' },
  { id: 'pencil',      label: 'Pencil Sketch',          prompt: 'a confident graphite pencil sketch with crosshatch shading, expressive contour lines, toned beige paper background' },
  { id: 'christmas',   label: 'Christmas Sweater',      prompt: 'wearing a cosy red and cream Fair Isle Christmas sweater, holiday lights backdrop, warm cinematic lighting' },
  { id: 'detective',   label: 'Noir Detective',         prompt: 'a noir 1940s detective in tan trench coat and felt fedora, rainy neon-lit alley, moody chiaroscuro' },
];

const MULTI_PAIRS = [
  { label: 'Border Collie + Pug — Wizard',          pets: [BREEDS[0], BREEDS[1]], style: { id: 'wizard',    label: 'Wizard Scene',     prompt: 'wise wizards in star-embroidered indigo robes and pointed hats, glowing wooden staffs, magical library backdrop' } },
  { label: 'Sphynx + Bengal — Astronauts',          pets: [BREEDS[3], BREEDS[4]], style: { id: 'astronaut', label: 'Astronauts',        prompt: 'two astronauts in white spacesuits, helmet visors reflecting stars, deep space backdrop with nebula' } },
  { label: 'Dalmatian + Bengal — Christmas Sweater', pets: [BREEDS[2], BREEDS[4]], style: { id: 'christmas', label: 'Christmas Sweaters', prompt: 'wearing matching cosy red and cream Christmas sweaters, holiday lights backdrop, fireside warmth' } },
];

async function visionExtract(imageUrl) {
  const system = 'You are a pet-breed identification specialist. Pay SPECIAL ATTENTION to: EYE COLOR (specifically: blue, amber, heterochromia/odd-eyed, green); ASYMMETRIC MARKINGS (different colours on left vs right side of face — VERY IMPORTANT, do not assume symmetry); UNIQUE FEATURES that distinguish THIS pet (white socks, blazes, masks, ear tufts, spot patterns). If markings are asymmetric, describe each side separately. If eyes are blue or odd-coloured, this is the FIRST thing you mention. Return STRICT JSON: {"species":"dog|cat|other|none","breed":"<specific>","furColor":"<exact markings, mention asymmetry if present>","eyeColor":"<exact, blue/amber/etc>","earShape":"<...>","distinguishing":"<one phrase>"}. JSON only.';
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + OR_KEY },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: [
          { type: 'text', text: 'Identify this pet, focusing on eye colour, asymmetric markings, and any unique features.' },
          { type: 'image_url', image_url: { url: imageUrl } },
        ]},
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400, temperature: 0.1,
    }),
  });
  if (!r.ok) return { species: 'pet' };
  const d = await r.json();
  const c = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
  const cleaned = c.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  try { return JSON.parse(cleaned); } catch { return { species: 'pet' }; }
}

function buildSinglePetPrompt(subject, style, petName) {
  const keeps = [];
  if (subject.breed) keeps.push('the ' + subject.breed + ' silhouette and breed characteristics');
  if (subject.furColor) keeps.push(subject.furColor + ' fur pattern');
  if (subject.eyeColor) keeps.push(subject.eyeColor + ' eyes');
  if (subject.earShape) keeps.push(subject.earShape + ' ear shape');
  if (subject.distinguishing) keeps.push(subject.distinguishing);
  const keepLine = keeps.length ? 'Specifically preserve: ' + keeps.join(', ') + '.' : '';
  return [
    'Use the exact pet shown in the source image. Preserve their breed, markings, fur pattern, eye colour, ear shape, and all unique features exactly as they appear in the photo. Do not change the breed. Do not invent new features. Do not redesign the pet. The source image is authoritative — preserve any visible features even if not explicitly listed below.',
    keepLine,
    '',
    'Apply this artistic transformation: ' + style.prompt + '.',
    '',
    'Render the name "' + petName + '" in elegant clean serif typography along the lower margin of the canvas, centered, readable, no spelling errors, no other text on the canvas.',
    '',
    'Output: vertical 4:5 canvas composition, painterly cinematic finish, premium polish for framed wall art.',
  ].filter(Boolean).join('\n');
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
    'Use the exact pets shown across the source images. Create a single canvas portrait featuring all ' + petInfos.length + ' pets together, each rendered with their own breed, markings, eye colour, and unique features preserved exactly as in the source photos. Do not merge them into hybrids. Do not change any of their breeds. The source images are authoritative.',
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

async function fal(args) {
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
  const ws = []; for (let i = 0; i < concurrency; i++) ws.push(worker());
  await Promise.all(ws);
  return results;
}

(async () => {
  console.log('Pre-running Vision for 5 breeds…');
  const subjects = await pmap(BREEDS, async (b) => {
    const s = await visionExtract(b.url);
    console.log('  ' + b.name + ' → ' + s.species + '/' + (s.breed || '—') + ' / eyes:' + (s.eyeColor || '?') + ' / fur:' + ((s.furColor || '').slice(0, 70)));
    return s;
  }, 4);

  // Single-pet matrix: 5×5 = 25
  const jobs = [];
  for (let bi = 0; bi < BREEDS.length; bi++) {
    for (let si = 0; si < STYLES.length; si++) {
      jobs.push({ breed: BREEDS[bi], subject: subjects[bi], style: STYLES[si] });
    }
  }
  console.log('\nRunning ' + jobs.length + ' single-pet generations (parallel-of-5)…');
  const singleResults = await pmap(jobs, async (j, idx) => {
    const prompt = buildSinglePetPrompt(j.subject, j.style, j.breed.petName);
    const t0 = Date.now();
    const out = await fal({ imageUrls: [j.breed.url], prompt });
    console.log('  [' + (idx + 1) + '/' + jobs.length + '] ' + j.breed.name + ' × ' + j.style.label + ' — ' + (out.url ? '✓' : '✗') + ' (' + (Date.now() - t0) + 'ms)');
    return { breed: j.breed.name, style: j.style.label, styleId: j.style.id, url: out.url || null, error: out.error || null, prompt };
  }, 5);

  console.log('\nRunning ' + MULTI_PAIRS.length + ' multi-pet generations…');
  const multiResults = await pmap(MULTI_PAIRS, async (pair, idx) => {
    const petInfos = pair.pets.map(p => ({ name: p.petName, subject: subjects[BREEDS.indexOf(p)] }));
    const prompt = buildMultiPetPrompt(petInfos, pair.style);
    const t0 = Date.now();
    const out = await fal({ imageUrls: pair.pets.map(p => p.url), prompt });
    console.log('  [' + (idx + 1) + '/' + MULTI_PAIRS.length + '] ' + pair.label + ' — ' + (out.url ? '✓' : '✗') + ' (' + (Date.now() - t0) + 'ms)');
    return { label: pair.label, breeds: pair.pets.map(p => p.name), names: pair.pets.map(p => p.petName), style: pair.style.label, url: out.url || null, error: out.error || null, prompt };
  }, 2);

  fs.writeFileSync('test-batch-2-results.json', JSON.stringify({ subjects, singleResults, multiResults, breeds: BREEDS, styles: STYLES, multiPairs: MULTI_PAIRS }, null, 2));

  // Build viewer
  const viewer = fs.readFileSync('test-matrix-viewer.html', 'utf8')
    .replace(/const SOURCES = \[[\s\S]*?\];/, 'const SOURCES = ' + JSON.stringify(BREEDS.map(b => ({ name: b.name, petName: b.petName, url: b.url })), null, 2) + ';')
    .replace(/const STYLES_ORDER = \[[^\]]*\];/, 'const STYLES_ORDER = ' + JSON.stringify(STYLES.map(s => s.id)) + ';')
    .replace(/const STYLE_LABELS = \{[\s\S]*?\};/, 'const STYLE_LABELS = ' + JSON.stringify(STYLES.reduce((acc, s) => { acc[s.id] = s.label; return acc; }, {})) + ';')
    .replace(/const EMBEDDED_DATA = .*?;\nasync function load/s, 'const EMBEDDED_DATA = ' + JSON.stringify({ breedSubjects: subjects, singleResults, multiResults }) + ';\nasync function load')
    .replace('Pawtraits Test Matrix — Side-by-Side', 'Pawtraits Test Batch 2 — Endpoint Fix Validation');

  fs.writeFileSync('test-batch-2-viewer.html', viewer);

  const okSingle = singleResults.filter(r => r.url).length;
  const okMulti = multiResults.filter(r => r.url).length;
  console.log('\nDone. Single: ' + okSingle + '/' + singleResults.length + ' ✓ · Multi: ' + okMulti + '/' + multiResults.length + ' ✓');
  console.log('Cost: ~$' + ((okSingle + okMulti) * 0.045).toFixed(2));
  console.log('\nOpen test-batch-2-viewer.html to review side-by-side.');
})();
