/**
 * Targeted re-test: Husky + Frenchie × Watercolour Floral, using the
 * /edit sub-route fix Codex shipped. Validates that the endpoint correction
 * solves the blue-eye + asymmetric-face failures.
 *
 * Cost: 2 generations × $0.045 ≈ $0.09.
 *
 * Run: node scripts/library/retest-failures.cjs
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

const TARGETS = [
  {
    label: 'Husky × Watercolour (was: brown eyes — should be blue)',
    petName: 'Luna',
    url: 'https://images.pexels.com/photos/27073914/pexels-photo-27073914.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
  {
    label: 'French Bulldog × Watercolour (was: symmetric grey — should be asymmetric grey/white)',
    petName: 'Bella',
    url: 'https://images.pexels.com/photos/33766745/pexels-photo-33766745.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
  },
];

const STYLE_PROMPT = 'watercolour floral pet portrait with soft botanical wreath frame and pastel washes';

async function visionExtract(imageUrl) {
  const system = 'You are a pet-breed identification specialist. Pay SPECIAL ATTENTION to: EYE COLOR (note specifically: blue, amber, heterochromia/odd-eyed, green); ASYMMETRIC MARKINGS (different colours on left vs right side of face — VERY IMPORTANT, do not assume symmetry); UNIQUE FEATURES that distinguish THIS pet (white socks, blazes, masks, ear tufts). If markings are asymmetric, describe each side separately. If eyes are blue or odd-coloured, this is the FIRST thing you mention. Return STRICT JSON: {"species":"dog|cat|other|none","breed":"<specific>","furColor":"<exact markings, mention asymmetry if present>","eyeColor":"<exact, blue/amber/etc>","earShape":"<...>","distinguishing":"<one phrase>"}. JSON only.';
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + OR_KEY },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: [
          { type: 'text', text: 'Identify this pet, focusing on eye colour and asymmetric markings.' },
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

function buildPrompt(subject, petName) {
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
    'Apply this artistic transformation: ' + STYLE_PROMPT + '.',
    '',
    'Render the name "' + petName + '" in elegant clean serif typography along the lower margin of the canvas, centered, readable, no spelling errors, no other text on the canvas.',
    '',
    'Output: vertical 4:5 canvas composition, painterly cinematic finish, premium polish for framed wall art.',
  ].filter(Boolean).join('\n');
}

async function fal(imageUrl, prompt) {
  const r = await fetch('https://fal.run/openai/gpt-image-2/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Key ' + FAL_KEY },
    body: JSON.stringify({
      prompt: prompt,
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
  console.log('Endpoint: https://fal.run/openai/gpt-image-2/edit (the FIX)');
  console.log('Vision: Sonnet 4.5 with eye-colour + asymmetry emphasis\n');
  for (const t of TARGETS) {
    console.log('=== ' + t.label + ' ===');
    const subj = await visionExtract(t.url);
    console.log('Vision: ' + JSON.stringify(subj));
    const prompt = buildPrompt(subj, t.petName);
    console.log('Generating…');
    const out = await fal(t.url, prompt);
    if (out.url) {
      console.log('✓ ' + out.url);
    } else {
      console.log('✗ ' + out.error);
    }
    console.log('');
  }
})();
