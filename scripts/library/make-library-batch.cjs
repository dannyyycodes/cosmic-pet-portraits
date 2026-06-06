/**
 * make-library-batch.cjs — one-command daily library Maker kickoff.
 *
 * Usage:
 *   node scripts/library/make-library-batch.cjs              # smart default
 *   node scripts/library/make-library-batch.cjs --new        # force-write a new brief (overwrites today)
 *   node scripts/library/make-library-batch.cjs --ingest     # force ingest today's folder (skip brief check)
 *   node scripts/library/make-library-batch.cjs --count=10   # number of items in the batch (default 10)
 *   node scripts/library/make-library-batch.cjs --batch=2    # use YYYY-MM-DD-library-batch-2
 *
 * Smart default behavior:
 *   1. Check today's folder C:\Users\danie\pet-portraits\incoming\YYYY-MM-DD-library-batch-1\
 *   2. If manifest.json exists with items[] → run ingest.ts + paste-sheet.ts
 *   3. Else → pick N random breed×style combos, write codex-brief.md, print the brief
 *
 * Daily flow:
 *   Morning      → run command → it prints today's Codex brief
 *   Paste brief  → into Codex CLI → Codex generates images + manifest.json
 *   When done    → run command again → it auto-ingests + builds paste-sheet
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
// Override on non-Windows hosts via PAWTRAIT_INCOMING_ROOT env (e.g. /root/pet-portraits/incoming on Droplet 2).
const INCOMING_ROOT = process.env.PAWTRAIT_INCOMING_ROOT || 'C:/Users/danie/pet-portraits/incoming';
const INGEST_SCRIPT = path.join(REPO_ROOT, 'scripts', 'library', 'ingest.ts');
const PASTE_SHEET_SCRIPT = path.join(REPO_ROOT, 'scripts', 'library', 'paste-sheet.ts');
const CODEX_PROMPT_DOC = path.join(REPO_ROOT, 'scripts', 'library', 'CODEX_PROMPT.md');

// ============== env (for dupe-check query) ==============
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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============== args ==============
const args = process.argv.slice(2);
const forceNew = args.includes('--new');
const forceIngest = args.includes('--ingest');
const countArg = args.find(a => a.startsWith('--count='));
const COUNT = countArg ? parseInt(countArg.split('=')[1], 10) : 10;
const batchArg = args.find(a => a.startsWith('--batch='));
const BATCH = batchArg ? parseInt(batchArg.split('=')[1], 10) : 1;
if (!Number.isFinite(BATCH) || BATCH < 1) {
  console.error('--batch must be a positive number');
  process.exit(1);
}

// ============== combo pools ==============
// Broad breed pool. Mix common searches with under-used breeds so the gallery does
// not keep circling the same spaniels, whippets, pugs, and tabbies.
const BREEDS = [
  // dogs
  { name: 'Cocker Spaniel', pet_kind: 'dog' },
  { name: 'Cavalier King Charles Spaniel', pet_kind: 'dog' },
  { name: 'Border Collie', pet_kind: 'dog' },
  { name: 'Whippet', pet_kind: 'dog' },
  { name: 'Shih Tzu', pet_kind: 'dog' },
  { name: 'Pug', pet_kind: 'dog' },
  { name: 'Labrador', pet_kind: 'dog' },
  { name: 'Jack Russell Terrier', pet_kind: 'dog' },
  { name: 'Miniature Schnauzer', pet_kind: 'dog' },
  { name: 'Cockapoo', pet_kind: 'dog' },
  { name: 'Bichon Frise', pet_kind: 'dog' },
  { name: 'Staffordshire Bull Terrier', pet_kind: 'dog' },
  { name: 'Yorkshire Terrier', pet_kind: 'dog' },
  { name: 'Greyhound', pet_kind: 'dog' },
  { name: 'Bernese Mountain Dog', pet_kind: 'dog' },
  { name: 'Vizsla', pet_kind: 'dog' },
  { name: 'Springer Spaniel', pet_kind: 'dog' },
  { name: 'Italian Greyhound', pet_kind: 'dog' },
  { name: 'Golden Retriever', pet_kind: 'dog' },
  { name: 'French Bulldog', pet_kind: 'dog' },
  { name: 'Dachshund', pet_kind: 'dog' },
  { name: 'German Shepherd', pet_kind: 'dog' },
  { name: 'Beagle', pet_kind: 'dog' },
  { name: 'West Highland Terrier', pet_kind: 'dog' },
  { name: 'Scottish Terrier', pet_kind: 'dog' },
  { name: 'Airedale Terrier', pet_kind: 'dog' },
  { name: 'Dalmatian', pet_kind: 'dog' },
  { name: 'Boxer', pet_kind: 'dog' },
  { name: 'Doberman', pet_kind: 'dog' },
  { name: 'Great Dane', pet_kind: 'dog' },
  { name: 'Newfoundland', pet_kind: 'dog' },
  { name: 'Samoyed', pet_kind: 'dog' },
  { name: 'Akita', pet_kind: 'dog' },
  { name: 'Shiba Inu', pet_kind: 'dog' },
  { name: 'Basenji', pet_kind: 'dog' },
  { name: 'Saluki', pet_kind: 'dog' },
  { name: 'Afghan Hound', pet_kind: 'dog' },
  { name: 'Borzoi', pet_kind: 'dog' },
  { name: 'Papillon', pet_kind: 'dog' },
  { name: 'Pomeranian', pet_kind: 'dog' },
  { name: 'Chihuahua', pet_kind: 'dog' },
  { name: 'Maltese', pet_kind: 'dog' },
  { name: 'Havanese', pet_kind: 'dog' },
  { name: 'Australian Shepherd', pet_kind: 'dog' },
  { name: 'Sheltie', pet_kind: 'dog' },
  { name: 'Old English Sheepdog', pet_kind: 'dog' },
  { name: 'Irish Wolfhound', pet_kind: 'dog' },
  { name: 'Rhodesian Ridgeback', pet_kind: 'dog' },
  // cats
  { name: 'British Shorthair', pet_kind: 'cat' },
  { name: 'Ragdoll', pet_kind: 'cat' },
  { name: 'Sphynx', pet_kind: 'cat' },
  { name: 'Bengal', pet_kind: 'cat' },
  { name: 'Russian Blue', pet_kind: 'cat' },
  { name: 'Norwegian Forest Cat', pet_kind: 'cat' },
  { name: 'Tabby', pet_kind: 'cat' },
  { name: 'Tuxedo Cat', pet_kind: 'cat' },
  { name: 'Calico Cat', pet_kind: 'cat' },
  { name: 'Persian', pet_kind: 'cat' },
  { name: 'Siamese', pet_kind: 'cat' },
  { name: 'Maine Coon', pet_kind: 'cat' },
  { name: 'Scottish Fold', pet_kind: 'cat' },
  { name: 'Devon Rex', pet_kind: 'cat' },
  { name: 'Cornish Rex', pet_kind: 'cat' },
  { name: 'Oriental Shorthair', pet_kind: 'cat' },
  { name: 'Abyssinian', pet_kind: 'cat' },
  { name: 'Birman', pet_kind: 'cat' },
  { name: 'Snowshoe Cat', pet_kind: 'cat' },
  { name: 'Manx', pet_kind: 'cat' },
  { name: 'Turkish Van', pet_kind: 'cat' },
  { name: 'Tortoiseshell Cat', pet_kind: 'cat' },
  { name: 'Black Cat', pet_kind: 'cat' },
];

const REALISTIC_STYLES = [
  'fine-art-photoreal',
  'studio-canvas-realism',
  'cinematic-character-realism',
  'natural-light-canvas',
];

const ILLUSTRATED_STYLES = [
  'watercolour-floral',
  'folk-linocut',
  'mid-century-gouache',
  'renaissance-oil',
  'neon-sign-portrait',
  'risograph-summer-print',
  'claymation-toy',
  'felted-wool-plush',
  'ceramic-tile-folk-art',
  'art-deco-black-gold',
  'editorial-collage',
  'renaissance-chalk-pastel',
  'pop-art',
  'royal-oil',
  'soft-pastel',
  'vintage-victorian',
  'cosmic-astrology',
  // expansion 2026-05-14 — 12 new styles for vast variety
  'lino-block-print-modern',
  'screenprint-rock-poster',
  'art-nouveau-stained-glass',
  'enamel-pin-design',
  'etching-engraving-naturalist',
  'mosaic-byzantine-gold',
  'woodblock-flat-print',
  'cyanotype-botanical',
  'storybook-watercolour',
  'paper-cut-silhouette',
  'batik-wax-resist',
  'scratchboard-noir',
];

const PAINTERLY_STYLES = [
  'watercolour-floral',
  'renaissance-oil',
  'royal-oil',
  'soft-pastel',
  'vintage-victorian',
  'renaissance-chalk-pastel',
  'storybook-watercolour',
];

const GRAPHIC_ART_OBJECT_STYLES = [
  'folk-linocut',
  'mid-century-gouache',
  'risograph-summer-print',
  'ceramic-tile-folk-art',
  'art-deco-black-gold',
  'editorial-collage',
  'pop-art',
  'cosmic-astrology',
  'neon-sign-portrait',
  'lino-block-print-modern',
  'screenprint-rock-poster',
  'enamel-pin-design',
  'cyanotype-botanical',
  'paper-cut-silhouette',
  'scratchboard-noir',
  'woodblock-flat-print',
];

const HANDMADE_CRAFT_STYLES = [
  'claymation-toy',
  'felted-wool-plush',
  'ceramic-tile-folk-art',
  'folk-linocut',
  'vintage-victorian',
  'art-nouveau-stained-glass',
  'mosaic-byzantine-gold',
  'batik-wax-resist',
  'etching-engraving-naturalist',
];

// Library styles include realistic canvas-ready examples, not only illustration.
const STYLES = [...REALISTIC_STYLES, ...ILLUSTRATED_STYLES];

// EXPANDED 2026-06-04 — draw expressive styles from the FULL _styles.json bank (1000+) for vast variety.
// Realistic modes keep the clean canvas-ready set; all other modes pull the whole bank.
let EXPRESSIVE_STYLES;
try {
  const _sj = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'scripts', 'library', 'codex', 'prompts', '_styles.json'), 'utf8'));
  const _real = new Set(REALISTIC_STYLES);
  EXPRESSIVE_STYLES = Object.keys(_sj).filter(k => k !== '_meta' && !_real.has(k));
} catch (e) { EXPRESSIVE_STYLES = [...ILLUSTRATED_STYLES]; }
if (!EXPRESSIVE_STYLES || !EXPRESSIVE_STYLES.length) EXPRESSIVE_STYLES = [...ILLUSTRATED_STYLES];


// A rotating concept layer so the gallery is an idea bank, not just breed x style.
// These are visual directions only: still Type A, pet-only, no room/canvas scene.
// Character concepts are archetypes, not recognisable film/TV/IP characters.
const CHARACTER_DIRECTIONS = [
  'retro astronaut explorer with helmet collar, mission-patch shapes, and star-map framing',
  'masked folk superhero archetype with cape shapes, bold emblem geometry, and heroic posture',
  'noir detective character with trench-coat shapes, lamplight contrast, and rain-poster mood',
  'storybook wizard companion with embroidered robe shapes, moon symbols, and spellbook ornament',
  'aviator adventurer with scarf movement, brass-goggle motifs, and cloud-map composition',
  'pirate captain archetype with weathered coat shapes, nautical trim, and treasure-map border',
  'royal court jester character, playful patterned costume, bells as abstract ornament only',
  'samurai guardian archetype with layered armour shapes, crest motifs, and calm ceremonial pose',
  'frontier ranger character with bandana colour accents, desert poster framing, and steady stare',
  'magical librarian with velvet cloak shapes, bookplate border, and candlelit scholarly mood',
  'deep-sea diver explorer with round helmet silhouette, kelp ornament, and antique expedition feel',
  'circus ringmaster archetype with red-tailcoat shapes, spotlight framing, and theatrical confidence',
  'time-traveller inventor with brass machine motifs, clockwork border, and curious expression',
  'space-opera pilot archetype with starfighter jacket shapes, graphic nebula backdrop, and brave pose',
  'enchanted forest knight with soft armour plates, leaf crest, and storybook banner composition',
  // expansion 2026-05-14 — 25 new archetypes
  'ancient oracle figure with veil-drape silhouettes, smoke-curl ornament, and prophetic still pose',
  'alchemist scholar with glass-vessel ornament, herbarium-page border, and candlelit warmth',
  'mountain hermit-sage with woven-shawl shapes, lantern glow, and snow-peak silhouette backdrop',
  'lighthouse keeper with brass-lamp ornament, fog-horn silhouette, and coastal blue-grey mood',
  'master beekeeper with hive geometry, honeycomb border, and soft summer-meadow tones',
  'station master with brass-button coat shapes, schedule-board geometry (no readable text), and warm-platform glow',
  'opera maestro with velvet-collar shapes, stage-curtain framing, and footlight warmth',
  'silent-film matinee idol with art-deco fan border, monochrome cream-and-ink palette, and theatrical poise',
  'cartographer of unknown seas with parchment-edge framing, compass-rose ornament, and ink-and-sepia mood',
  'dirigible airship captain with brass-goggle motifs, cloud-cathedral backdrop, and sky-blue palette',
  'master perfumer with apothecary-bottle ornament, atomiser silhouettes, and soft rose-and-amber palette',
  'master clockmaker with cog ornament, escapement geometry, and brass-and-walnut mood',
  'tea ceremonialist with paper-screen geometry, kettle-steam ornament, and soft matcha palette',
  'botanical illustrator-naturalist with herbarium-page border, pressed-leaf ornament, and sepia-on-cream finish',
  'storm-watcher meteorologist with rain-on-glass texture, brass-rivet ornament, and gale-blue palette',
  'dragon-keeper of folk legend with abstract scale-pattern ornament, ember-glow border, and ash-and-gold palette',
  'troubadour minstrel with lute-shape ornament, woven banner geometry, and sunset palette',
  'master gardener-monk with topiary silhouettes, walled-garden border, and dawn-green palette',
  'forgemaster smith with anvil silhouette, ember-spark ornament, and iron-and-amber palette',
  'archery champion with quiver shapes, target-ring ornament, and ranger-green palette',
  'summit mountaineer with rope-coil ornament, ice-axe silhouette, and snowfield palette',
  'lantern-festival reveller with paper-lantern ornament, blossom-branch border, and twilight palette',
  'royal falconer with leather-glove silhouette, hood-and-jess ornament, and woodland-mist palette',
  'bookbinder scribe with quill ornament, marbled-endpaper border, and library-amber palette',
  'desert caravan navigator with star-chart ornament, dune silhouette, and dusk palette',
];

const ART_OBJECT_DIRECTIONS = [
  'museum naturalist plate with specimen-like poise, numbered-shape layout but no readable text',
  'vintage matchbox label design with bold border, tiny symbolic icons, and flattened graphic colour',
  'ornate postage-stamp portrait with perforation border, heraldic corners, and miniature detail',
  'folk festival banner with patterned symmetry, textile texture, and strong central silhouette',
  'tarot-card muse with symbolic border motifs, moon phases, and mystical hand-painted ornament',
  'toy-theatre paper cutout with layered curtains, shallow stage depth, and antique card texture',
  'ceramic shop sign portrait with glazed crackle, painted border, and old-town storefront charm',
  'embroidered tapestry medallion with visible thread texture, stitched florals, and heirloom warmth',
  'pulp adventure book cover with dramatic lighting, bold title-space shapes but no readable words',
  'botanical seed-packet portrait with decorative crop marks, floral frame, and packaging nostalgia',
  'music poster portrait with screenprint texture, bold shapes, and stage-light rhythm',
  'stained-glass chapel window with leaded segments, jewel colours, and luminous pet silhouette',
  'paper lantern festival portrait with warm glow, cut-paper motifs, and night-market colour',
  'antique circus ticket portrait with engraved border, cream paper, and theatrical central pose',
  'storybook map cartouche with compass ornament, coastline shapes, and illustrated adventure tone',
  // expansion 2026-05-14 — 20 new directions
  'cinema lobby card with ornate corner geometry, dramatic-lighting framing, and two-tone palette',
  'wine-label engraving with vine border, cream paper, and copper-foil accent details',
  'apothecary jar label with classical scroll border, sepia ink, and herbal motifs',
  'railway travel poster with two-tone print, deco geometry, and faux-headline space (no readable text)',
  'enamelled brooch with cloisonné border, jewel palette, and miniature heirloom mood',
  'heraldic shield panel with quartered geometry, ornamental crest motifs, and royal palette',
  'fairground prize ribbon with rosette pleating, foil ribbon edges, and carnival palette',
  'zoetrope strip portrait with repeating-figure motif (still composition), antique paper, and mechanical-toy feel',
  'cigar-band miniature with ornate gilt border, deep ruby palette, and collector mood',
  'seaside linen postcard with scalloped border, summer-pastel palette, and soft sun feel',
  'paper-fan portrait with pleat-line geometry, lacquered-handle accent, and courtly palette',
  'festive cracker-box label with scallop border, foil-edge mood, and snow-and-pine palette',
  'vintage train-ticket with perforated edges, two-tone print, and station-clock palette',
  'weather-vane silhouette plate with cardinal-point geometry, and blackened-iron palette',
  'carved-cameo medallion with ivory-and-rose palette, and classical profile composition',
  'wood-engraving frontispiece with ornate cartouche, ink-on-cream palette, and library mood',
  'linocut concert poster with bold limited-ink palette and faux-headline space (no readable text)',
  'constellation chart plate with star-map geometry, brass-instrument ornament, and ink-and-cream palette',
  'vintage circus pennant with triangle-pennant geometry and faded-festival palette',
  'illuminated manuscript marginalia with gold-leaf ornament, vellum tone, and ivy border',
];

// Palette / mood modifier — injected per combo so two outputs with the same breed × style
// never read with the same colour story. The single biggest "stop looking the same" lever.
const PALETTE_MOODS = [
  'jewel-toned twilight — sapphire, garnet, deep emerald',
  'sun-faded vintage — bone, dust-pink, ochre, faded teal',
  'monochrome ink and bone — black, cream, charcoal grey',
  'neon nightlife glow — magenta, electric cyan, lime',
  'earthy harvest — burnt sienna, sage, terracotta, oat',
  'pastel confection — sherbet pink, cream, butter, mint',
  'tropical lagoon — turquoise, coral, palm green, sand',
  'smokey noir — graphite, ink-blue, ember-orange highlight',
  'winter blue-hour — slate, pale lavender, frosted cream',
  'warm golden hour — amber, honey, rose-gold, ivory',
  'cool storm light — pewter, mist-green, steel-blue, bone',
  'ember and ash — charcoal, ember-orange, deep crimson, smoke',
  'Mediterranean coast — ultramarine, white-wash, lemon, olive',
  'deep forest — moss, bark, fern, cream',
  'desert dusk — dune-gold, rust, lilac sky, bone-cream',
];

const LIFE_STAGES = [
  'adult',
  'adult',
  'adult',
  'young',
  'young',
  'senior',
];

const PRESENTATION_MODES = [
  'cinematic realistic character portrait',
  'cinematic realistic character portrait',
  'cinematic realistic character portrait',
  'cinematic realistic character portrait',
  'painterly illustration',
  'painterly illustration',
  'graphic art-object',
  'graphic art-object',
  'handmade craft portrait',
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchRecentLibraryCombos() {
  // Best-effort dedupe: pull last 60 days of breed+art_style pairs from the library.
  if (!SUPABASE_URL || !SERVICE_KEY) return new Set();
  try {
    const url = `${SUPABASE_URL}/rest/v1/pawtrait_library?select=breed,art_style&created_at=gte.${new Date(Date.now() - 60 * 86400000).toISOString()}`;
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
      },
    });
    if (!r.ok) return new Set();
    const rows = await r.json();
    return new Set(rows.map(row => `${String(row.breed || '').toLowerCase()}|${String(row.art_style || '').toLowerCase()}`));
  } catch {
    return new Set();
  }
}

async function fetchRecentLibraryBreeds() {
  if (!SUPABASE_URL || !SERVICE_KEY) return new Set();
  try {
    const url = `${SUPABASE_URL}/rest/v1/pawtrait_library?select=breed&created_at=gte.${new Date(Date.now() - 30 * 86400000).toISOString()}`;
    const r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
      },
    });
    if (!r.ok) return new Set();
    const rows = await r.json();
    return new Set(rows.map(row => String(row.breed || '').toLowerCase()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function pickCombos(count, recentSet, recentBreeds = new Set()) {
  const combos = [];
  const splitFreshFirst = breeds => [
    ...shuffle(breeds.filter(b => !recentBreeds.has(b.name.toLowerCase()))),
    ...shuffle(breeds.filter(b => recentBreeds.has(b.name.toLowerCase()))),
  ];
  const dogBreeds = splitFreshFirst(BREEDS.filter(b => b.pet_kind === 'dog'));
  const catBreeds = splitFreshFirst(BREEDS.filter(b => b.pet_kind === 'cat'));
  const dogTarget = count === 10 ? 7 : Math.ceil(count * 0.7);
  const catTarget = Math.max(0, count - dogTarget);
  const breedQueue = [
    ...dogBreeds.slice(0, dogTarget),
    ...catBreeds.slice(0, catTarget),
  ];
  const characterDirections = shuffle(CHARACTER_DIRECTIONS);
  const artObjectDirections = shuffle(ART_OBJECT_DIRECTIONS);
  const lifeStages = shuffle(LIFE_STAGES);
  const presentationModes = shuffle(PRESENTATION_MODES);
  const realisticStyles = shuffle(REALISTIC_STYLES);
  const painterlyStyles = shuffle(EXPRESSIVE_STYLES);
  const graphicStyles = shuffle(EXPRESSIVE_STYLES);
  const handmadeStyles = shuffle(EXPRESSIVE_STYLES);
  const paletteMoods = shuffle(PALETTE_MOODS);
  const characterTarget = Math.ceil(count / 2);
  const conceptTypes = shuffle([
    ...Array.from({ length: characterTarget }, () => 'character'),
    ...Array.from({ length: Math.max(0, count - characterTarget) }, () => 'art-object'),
  ]);
  let characterIndex = 0;
  let artObjectIndex = 0;
  let bi = 0;
  let si = 0;
  let attempts = 0;
  while (combos.length < count && attempts < count * 10) {
    attempts++;
    const breed = breedQueue[bi % breedQueue.length];
    const presentationMode = presentationModes[combos.length % presentationModes.length];
    const isCinematicRealistic = presentationMode === 'cinematic realistic character portrait';
    const stylePool = isCinematicRealistic
        ? realisticStyles
      : presentationMode === 'graphic art-object'
        ? graphicStyles
        : presentationMode === 'handmade craft portrait'
          ? handmadeStyles
          : painterlyStyles;
    const style = stylePool[si % stylePool.length];
    bi++;
    si++;
    const key = `${breed.name.toLowerCase()}|${style.toLowerCase()}`;
    if (recentSet.has(key)) continue;
    if (combos.some(c => c.breed === breed.name && c.art_style === style)) continue;
    const conceptType = isCinematicRealistic
        ? 'character'
        : presentationMode === 'graphic art-object'
          ? 'art-object'
        : (conceptTypes[combos.length] || 'art-object');
    const isCharacter = conceptType === 'character';
    const rawLifeStage = lifeStages[combos.length % lifeStages.length];
    const lifeStage = rawLifeStage === 'young'
      ? (breed.pet_kind === 'cat' ? 'kitten' : 'puppy')
      : rawLifeStage;
    combos.push({
      breed: breed.name,
      pet_kind: breed.pet_kind,
      art_style: style,
      concept_type: conceptType,
      life_stage: lifeStage,
      presentation_mode: presentationMode,
      creative_direction: isCharacter
        ? characterDirections[characterIndex++ % characterDirections.length]
        : artObjectDirections[artObjectIndex++ % artObjectDirections.length],
      palette_mood: paletteMoods[combos.length % paletteMoods.length],
    });
  }
  return shuffle(combos);
}

function writeBrief(folder, combos) {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

  const briefLines = [];
  briefLines.push(`# Library batch brief — ${todayISO()}`);
  briefLines.push('');
  briefLines.push(`Generate ${combos.length} Pawtraits examples for the public site gallery.`);
  briefLines.push('');
  briefLines.push('## Read these FIRST');
  briefLines.push('');
  briefLines.push(`1. \`scripts/library/CODEX_PROMPT.md\` — full schema, voice rules, Pinterest variation requirements, 24-board list. Follow exactly.`);
  briefLines.push(`2. \`scripts/library/codex/prompts/_styles.json\` — render_brief per style (the art direction).`);
  briefLines.push('');
  briefLines.push('## Today\'s combos (do NOT substitute)');
  briefLines.push('');
  briefLines.push('| # | Breed | Pet kind | Life stage | Presentation | Art style | Concept type | Creative direction | Palette / mood |');
  briefLines.push('|---|---|---|---|---|---|---|---|---|');
  combos.forEach((c, i) => {
    briefLines.push(`| ${i + 1} | ${c.breed} | ${c.pet_kind} | ${c.life_stage} | ${c.presentation_mode} | ${c.art_style} | ${c.concept_type} | ${c.creative_direction} | ${c.palette_mood} |`);
  });
  briefLines.push('');
  briefLines.push('## Hard rules');
  briefLines.push('');
  briefLines.push('- **Type A portrait only**. Pet-only, full-frame, NO room/canvas in shot.');
  briefLines.push('- **Photoreal is only allowed for character-led portraits.** Do not create plain realistic studio portraits. If the image is realistic, the pet must clearly be a character/archetype.');
  briefLines.push('- For realistic character items: believable pet anatomy, fur, eyes, lighting, and canvas polish, with costume/role integrated tastefully. Avoid phone snapshots, fake rooms, hands, people, watermarks, and generated-looking glossy plastic fur.');
  briefLines.push('- For illustrated items: match the style\'s `render_brief` exactly, but avoid the same generic centred composition.');
  briefLines.push('- **Generic breed examples** — do NOT use named cast members (Mochi, Beans, Clover, Atlas, Hazel).');
  briefLines.push('- **Aspect**: 2:3 vertical (1000×1500 or higher). Pinterest-optimal.');
  briefLines.push('- **No text in image** except the pet name per style brief.');
  briefLines.push('- Per-item pet_name: pick a sensible name that fits the breed (or omit — generic catalog example).');
  briefLines.push('- **Life stage matters.** If `life_stage=puppy/kitten`, clearly show a young puppy or kitten. If `senior`, show gentle senior features without making the pet look unwell.');
  briefLines.push('- **Creative direction matters.** Combine breed + life stage + presentation + art style + concept type + creative direction + palette/mood so every image has a distinct purpose. Avoid generic centred pet portraits unless the direction explicitly calls for restraint.');
  briefLines.push('- **Palette / mood is non-negotiable variety.** Apply the listed palette as the dominant colour story for the image — do not default to the style brief\'s baseline palette. This is the single biggest lever stopping two outputs with the same breed × style from looking the same.');
  briefLines.push('- For `concept_type=character`, make the animal clearly read as a character/archetype with costume, role, props-as-ornament, and a different silhouette. Use archetypes only: astronaut, superhero, detective, wizard, pilot, explorer, knight, pirate, etc.');
  briefLines.push('- **No recognisable IP.** Do not copy or name movie/TV/game/comic characters, costumes, logos, symbols, or franchises. "Space explorer" is fine; a recognisable franchise spaceman is not.');
  briefLines.push('- **The other half must be art-object-led.** For `concept_type=art-object`, make the image feel like a collectible art piece: stamp, matchbox label, tapestry, tarot card, book cover, shop sign, stained glass, seed packet, poster, etc.');
  briefLines.push('- **Reject samey AI vibe.** Regenerate if the image has the same face/crop/pose/lighting as another item, is just a centred pet on a decorated background, has glossy generic rendering, or weak costume/object identity.');
  briefLines.push('- **Breed variety matters.** Do not substitute the listed breeds. The picker is designed to avoid recent breeds where possible; preserve that variety.');
  briefLines.push('- **Public prompt field is customer-facing.** In `manifest.json`, `prompt` must be the short copyable style prompt a user sees in the gallery, NOT the long internal imagegen prompt. Aim for 12-28 words.');
  briefLines.push('');
  briefLines.push(`## Output folder`);
  briefLines.push('');
  briefLines.push(`\`${folder.replace(/\\/g, '/')}\``);
  briefLines.push('');
  briefLines.push('Files to produce:');
  briefLines.push('- `img_001.png` … `img_010.png` (one per combo above, in order)');
  briefLines.push('- `manifest.json` (ingest.ts format — see CODEX_PROMPT.md for the exact schema)');
  briefLines.push('');
  briefLines.push('## Manifest schema reminder');
  briefLines.push('');
  briefLines.push('```jsonc');
  briefLines.push('{');
  briefLines.push('  "defaults": { "image_style": "portrait", "approved": true },');
  briefLines.push('  "items": [');
  briefLines.push('    {');
  briefLines.push('      "file": "img_001.png",');
  briefLines.push('      "breed": "<breed>",');
  briefLines.push('      "pet_kind": "<dog|cat>",');
  briefLines.push('      "art_style": "<style-slug>",');
  briefLines.push('      "aspect_ratio": "2:3",');
  briefLines.push('      "pet_name": "<optional>",');
  briefLines.push('      "prompt": "<short customer-facing style prompt to copy, 12-28 words>",');
  briefLines.push('      "backstory": "<1–2 sentence character note>",');
  briefLines.push('      "captions": {');
  briefLines.push('        "pinterest": { "board": "<one slug from locked 24>", "variations": [ {V1}, {V2}, {V3} ] },');
  briefLines.push('        "instagram": { "caption": "...", "hashtags": ["#...", "..."] },');
  briefLines.push('        "tiktok":    { "caption": "...", "hashtags": ["#...", "..."] },');
  briefLines.push('        "youtube":   { "title": "...", "description": "...", "hashtags": ["#..."] }');
  briefLines.push('      }');
  briefLines.push('    }');
  briefLines.push('    /* … repeat per item */');
  briefLines.push('  ]');
  briefLines.push('}');
  briefLines.push('```');
  briefLines.push('');
  briefLines.push(`When the batch is done, exit Codex. Then back in the host terminal:`);
  briefLines.push('');
  briefLines.push('```bash');
  briefLines.push('node scripts/library/make-library-batch.cjs   # auto-detects today\'s manifest and ingests');
  briefLines.push('```');

  const briefPath = path.join(folder, 'codex-brief.md');
  fs.writeFileSync(briefPath, briefLines.join('\n'), 'utf8');
  return briefPath;
}

function runIngestAndPasteSheet(folder) {
  console.log(`\n📚 Ingesting ${folder} into pawtrait_library...`);
  const r1 = spawnSync('npx', ['tsx', INGEST_SCRIPT, folder], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  if ((r1.status ?? 1) !== 0) {
    console.error('\n✗ Ingest failed. Fix the manifest in the folder, then re-run.');
    process.exit(r1.status ?? 1);
  }
  console.log(`\n📋 Generating Pinterest paste-sheet...`);
  const r2 = spawnSync('npx', ['tsx', PASTE_SHEET_SCRIPT, todayISO()], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  if ((r2.status ?? 1) !== 0) {
    console.warn('\n⚠ Paste-sheet failed — re-run later: npx tsx scripts/library/paste-sheet.ts');
  }
  console.log(`\n✓ Daily library batch ingested. Pinterest paste-sheet ready in Downloads.`);
}

(async () => {
  const folder = path.join(INCOMING_ROOT, `${todayISO()}-library-batch-${BATCH}`);
  const manifestPath = path.join(folder, 'manifest.json');

  // Force-ingest mode: skip brief, just ingest whatever's there.
  if (forceIngest) {
    if (!fs.existsSync(manifestPath)) {
      console.error(`✗ No manifest.json in ${folder} yet. Run Codex first.`);
      process.exit(1);
    }
    runIngestAndPasteSheet(folder);
    return;
  }

  // Smart default: if manifest is present + not forcing new brief, ingest.
  if (fs.existsSync(manifestPath) && !forceNew) {
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (Array.isArray(m.items) && m.items.length > 0) {
        console.log(`✓ Found manifest with ${m.items.length} item(s) in today's folder.`);
        runIngestAndPasteSheet(folder);
        return;
      }
    } catch {
      // fall through to brief
    }
  }

  // Write a new brief.
  const recent = await fetchRecentLibraryCombos();
  const recentBreeds = await fetchRecentLibraryBreeds();
  const combos = pickCombos(COUNT, recent, recentBreeds);
  if (combos.length === 0) {
    console.error('✗ Could not pick any combos — pool exhausted?');
    process.exit(1);
  }
  const briefPath = writeBrief(folder, combos);

  console.log(`\n━━━ Library batch brief written ━━━`);
  console.log(`Date:    ${todayISO()}`);
  console.log(`Folder:  ${folder}`);
  console.log(`Combos:  ${combos.length} (${combos.filter(c => c.pet_kind === 'dog').length} dogs / ${combos.filter(c => c.pet_kind === 'cat').length} cats)`);
  console.log(`Brief:   ${briefPath}`);
  console.log(`\nToday's picks:`);
  combos.forEach((c, i) => console.log(`  ${i + 1}. ${c.breed} × ${c.art_style}`));
  console.log(`\n──────────────────────────────────────────────────────────────`);
  console.log(`Next steps:`);
  console.log(`  1. Open Codex CLI in C:\\Users\\danie\\cosmic-pet-portraits`);
  console.log(`  2. Paste this single line as the kickoff:`);
  console.log(`\n     Read and execute the brief at ${briefPath.replace(/\\/g, '/')}`);
  console.log(`\n  3. When Codex finishes, run this same command again:`);
  console.log(`     node scripts/library/make-library-batch.cjs`);
  console.log(`     (it'll detect the manifest and auto-ingest + build paste-sheet)`);
  console.log(`──────────────────────────────────────────────────────────────`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
