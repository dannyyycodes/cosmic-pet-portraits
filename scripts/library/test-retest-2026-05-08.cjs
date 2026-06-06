/**
 * Retest 2026-05-08 — finishing yesterday's batch-2 testing.
 *
 * 3 jobs:
 *   1. Sphynx × Astronaut — pet name "Toby" (was "Naked", tripped fal moderator)
 *   2. Sphynx × Knight    — pet name "Toby"
 *   3. German Shepherd × Knight — fresh validation of headwear rule on prominent ears
 *
 * Mirrors the live api/portraits.ts prompt builder exactly:
 *   - photo-anchored single-pet KEEP block (line 854-857)
 *   - source-image-is-ground-truth line
 *   - headwear rule (line 918) — the ears-fix from commit 2a9b20b
 *
 * Cost: 3 × $0.045 = ~$0.14.
 *
 * Output: appends to test-batch-2-results.json under retest_2026_05_08
 *         + writes test-retest-2026-05-08-viewer.html for side-by-side review.
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
if (!FAL_KEY || !OR_KEY) { console.error('Missing FAL_KEY or OPENROUTER_API_KEY'); process.exit(1); }

// ── Test cells ──────────────────────────────────────────────────────────────
const SPHYNX_URL = 'https://images.pexels.com/photos/31644049/pexels-photo-31644049.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940';
const GSD_URL = 'https://aduibsyrnenzobuyetmn.supabase.co/storage/v1/object/public/pet-photos/admin-test/german-shepherd-1778145655837.webp';

const CELLS = [
  {
    id: 'sphynx-astronaut-rerun',
    label: 'Sphynx × Astronaut (rerun, safe pet name)',
    note: 'Yesterday: 422 content_policy_violation. Pet name "Naked" tripped fal moderator.',
    breed: 'Sphynx Cat',
    petName: 'Toby',
    sourceUrl: SPHYNX_URL,
    style: 'an astronaut in a white spacesuit with helmet visor reflecting stars, deep space backdrop with nebula colours',
  },
  {
    id: 'sphynx-knight-rerun',
    label: 'Sphynx × Knight (rerun, safe pet name)',
    note: 'Yesterday: 422 content_policy_violation. Pet name "Naked" tripped fal moderator.',
    breed: 'Sphynx Cat',
    petName: 'Toby',
    sourceUrl: SPHYNX_URL,
    style: 'a medieval knight in polished plate armour holding a heraldic banner, castle courtyard backdrop, rich oil-painting finish',
  },
  {
    id: 'gsd-knight-earsfix',
    label: 'German Shepherd × Knight (ears-fix headwear test)',
    note: 'Validates headwear rule on prominent erect ears. GSD ears are the ideal stress-test for "ears poking through helmet metal".',
    breed: 'German Shepherd',
    petName: 'Rex',
    sourceUrl: GSD_URL,
    style: 'a medieval knight in polished plate armour holding a heraldic banner, castle courtyard backdrop, rich oil-painting finish',
  },
];

// ── Vision pre-pass — mirrors api/portraits.ts extractSubject() ─────────────
async function visionExtract(imageUrl) {
  const systemPrompt = `You are a pet-breed identification specialist. Examine the photo and return STRICT JSON describing the pet's identifiable physical features.

Return shape (every field required, use null only if you genuinely cannot tell):
{
  "species": "dog" | "cat" | "rabbit" | "bird" | "horse" | "other" | "none",
  "breed": "<specific breed name>",
  "furColor": "<specific descriptor with patterns and markings>",
  "eyeColor": "<colour>",
  "earShape": "<erect triangular | drop pendulous | semi-erect | cropped | folded | tufted | rose>",
  "distinguishing": "<one short phrase>"
}

Rules:
- Be confident on real pets. "best guess" is acceptable for breed/markings.
- Specific beats vague. "Black saddle with tan markings" not "black and tan".
- Output JSON only — no prose, no markdown fences, no commentary.`;
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + OR_KEY },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: [
          { type: 'text', text: 'Identify this pet. Return the JSON shape exactly.' },
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

// ── Prompt builder — mirrors api/portraits.ts buildMultiPetCustomPrompt for totalPets=1 ─
function buildPrompt(subject, customPrompt, petName) {
  const keeps = [];
  if (subject.breed) keeps.push('the ' + subject.breed + ' silhouette and breed characteristics');
  if (subject.furColor) keeps.push(subject.furColor + ' fur pattern');
  if (subject.eyeColor) keeps.push(subject.eyeColor + ' eyes');
  if (subject.earShape) keeps.push(subject.earShape + ' ear shape');
  if (subject.distinguishing) keeps.push(subject.distinguishing);
  const keepLine = keeps.length ? 'Specifically preserve: ' + keeps.join(', ') + '.' : '';
  // The KEEP block — line-by-line identical to buildPetKeepLine(totalPets:1)
  const keepBlock = [
    'Use the exact pet shown in the source image. Preserve their breed, markings, fur pattern, eye colour, ear shape, and all unique features exactly as they appear in the photo. Do not change the breed. Do not invent new features. Do not redesign the pet.',
    'The source image is the ground truth: if any listed descriptor conflicts with the visible pet, follow the source image.',
    keepLine,
  ].filter(Boolean).join('\n');
  const nameLine = petName
    ? 'Render the name "' + petName + '" in elegant clean serif typography along the lower margin of the canvas, centered, readable, no spelling errors, no other text on the canvas.'
    : '';
  // Headwear rule — the ears-fix from commit 2a9b20b. Line-identical to api/portraits.ts:918.
  const headwearRule = 'For transformations that include headwear (hat, helmet, hood, crown, costume covering the head), render the headwear naturally OVER the head — ears should be tucked under or hidden by the headwear if it covers that area. Do NOT draw ears poking through fabric, helmet metal, or costume material.';
  const aspect = 'Output: vertical 4:5 canvas composition, painterly cinematic finish, premium polish for framed wall art.';
  return [
    keepBlock,
    '',
    'Apply this artistic transformation: ' + customPrompt + '.',
    '',
    headwearRule,
    '',
    nameLine,
    '',
    aspect,
  ].filter(p => p !== undefined).join('\n');
}

async function fal(imageUrl, prompt) {
  const r = await fetch('https://fal.run/openai/gpt-image-2/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + FAL_KEY },
    body: JSON.stringify({
      prompt,
      image_urls: [imageUrl],
      image_size: { width: 1024, height: 1280 },
      quality: 'medium',
      num_images: 1,
      output_format: 'png',
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    return { error: r.status + ': ' + t.slice(0, 400) };
  }
  const d = await r.json();
  return { url: (d.images && d.images[0] && d.images[0].url) || null };
}

(async () => {
  console.log('Retest 2026-05-08 — 3 cells, ~$0.14 total\n');
  const out = [];
  for (const c of CELLS) {
    console.log('=== ' + c.label + ' ===');
    console.log('Note: ' + c.note);
    const subject = await visionExtract(c.sourceUrl);
    console.log('Vision: ' + JSON.stringify(subject));
    const prompt = buildPrompt(subject, c.style, c.petName);
    const t0 = Date.now();
    const result = await fal(c.sourceUrl, prompt);
    const ms = Date.now() - t0;
    if (result.url) {
      console.log('  ✓ ' + result.url + ' (' + ms + 'ms)\n');
    } else {
      console.log('  ✗ ' + result.error + ' (' + ms + 'ms)\n');
    }
    out.push({
      id: c.id,
      label: c.label,
      breed: c.breed,
      petName: c.petName,
      sourceUrl: c.sourceUrl,
      style: c.style,
      subject,
      prompt,
      url: result.url || null,
      error: result.error || null,
      ms,
    });
  }
  fs.writeFileSync('test-retest-2026-05-08-results.json', JSON.stringify({ generatedAt: new Date().toISOString(), cells: out }, null, 2));
  const ok = out.filter(r => r.url).length;
  console.log('Done. ' + ok + '/' + out.length + ' ✓');
  console.log('Cost: ~$' + (ok * 0.045).toFixed(2));
  console.log('Wrote test-retest-2026-05-08-results.json');
})();
