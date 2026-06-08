/**
 * Style × Theme prompt library for Tier 1+ AI generator.
 *
 * 8 styles × 8 themes = 64 baseline combos. Customer can also add freeform
 * "extra details" text. Each generation runs `num_images: 4` with 4
 * micro-varied compositions (close-up / medium / full-body / 3⁄4 angle).
 *
 * Prompt format (locked):
 *   Transform this {species} into a {THEME_DESC}, rendered in {STYLE_DESC}.
 *   Preserve the exact facial features, fur colour and pattern, eye colour,
 *   and breed characteristics of the original {species}. {ADD_DETAILS}
 *
 * Critical: "Preserve facial features…" tail is what FLUX Kontext was trained
 * to honour (BFL prompting guide). Removing it tanks identity preservation.
 *
 * Source: vault/01-projects/little-souls/pet-portraits/build-plan-locked-2026-05-04.md
 */

export interface StyleDef {
  id: string;
  label: string;
  /** Slot into the prompt template — descriptive, not a directive. */
  prompt: string;
  /** Negative prompt fragments specific to this style. */
  negative?: string;
  /** Display tagline. */
  tagline: string;
}

export interface ThemeDef {
  id: string;
  label: string;
  prompt: string;
  negative?: string;
  tagline: string;
}

export const STYLES: StyleDef[] = [
  {
    id: "watercolour",
    label: "Watercolour",
    tagline: "Soft pastel washes, loose brushwork.",
    prompt:
      "a soft watercolour painting with loose brushwork, pastel washes and visible paper grain, gentle bleeding edges",
    negative: "harsh photo finish, plastic 3d, neon",
  },
  {
    id: "renaissance",
    label: "Renaissance Oil",
    tagline: "Museum-grade chiaroscuro.",
    prompt:
      "a Renaissance oil painting with chiaroscuro lighting, cracked-varnish texture, dark museum background and rich umber tones",
    negative: "cartoon, anime, neon, modern, flat",
  },
  {
    id: "pop-art",
    label: "Pop Art",
    tagline: "1960s Lichtenstein punch.",
    prompt:
      "1960s Lichtenstein-style pop art with bold black outlines, Ben-Day dots, flat primary colours and high-contrast graphic composition",
    negative: "photorealistic, soft, muted",
  },
  {
    id: "photoreal",
    label: "Photoreal Studio",
    tagline: "Editorial studio lighting.",
    prompt:
      "a photorealistic studio portrait with cinematic rim lighting, shallow depth of field, polished editorial fashion-photography finish",
    negative: "cartoon, anime, illustration, painted look",
  },
  {
    id: "pixar",
    label: "Pixar 3D",
    tagline: "Hero-shot animated film still.",
    prompt:
      "a Pixar-style 3D-animated film still with soft global illumination, expressive eyes, plush surfaces and a hero-shot composition",
    negative: "photorealistic, gritty, low-res",
  },
  {
    id: "pencil",
    label: "Pencil Sketch",
    tagline: "Confident graphite linework.",
    prompt:
      "a confident graphite pencil sketch with crosshatch shading, expressive contour lines and toned beige paper background",
    negative: "colourful, photorealistic, painted",
  },
  {
    id: "ghibli",
    label: "Studio Ghibli",
    tagline: "Hand-painted animated wonder.",
    prompt:
      "a hand-painted Studio Ghibli animation cel with soft watercolour backdrops, expressive lineart, warm amber and cyan palette and a sense of wonder",
    negative: "harsh contrast, photorealistic, plastic",
  },
  {
    id: "pixel-art",
    label: "Pixel Art",
    tagline: "Retro 16-bit hero portrait.",
    prompt:
      "a retro 16-bit pixel art portrait with limited palette, crisp pixel edges, JRPG-style hero composition",
    negative: "smooth, photorealistic, painted",
  },
];

export const THEMES: ThemeDef[] = [
  {
    id: "royal",
    label: "Royal Monarch",
    tagline: "Velvet crown, ermine cloak.",
    prompt: "a regal monarch wearing a velvet crown and ermine cloak, holding a golden sceptre",
    negative: "modern clothing",
  },
  {
    id: "astronaut",
    label: "Astronaut",
    tagline: "NASA suit, moonlight.",
    prompt: "an astronaut in a white NASA spacesuit, helmet visor reflecting the moon, deep starry space background",
  },
  {
    id: "wizard",
    label: "Wizard",
    tagline: "Star-embroidered robe.",
    prompt: "a wise wizard wearing a star-embroidered indigo robe and pointed hat, holding a glowing wooden staff",
    negative: "harry-potter logos, hogwarts crest",
  },
  {
    id: "knight",
    label: "Knight in Armour",
    tagline: "Polished plate, banner.",
    prompt: "a medieval knight in polished plate armour holding a heraldic banner, castle courtyard backdrop",
    negative: "blood, weapons, gore",
  },
  {
    id: "superhero",
    label: "Superhero",
    tagline: "Cape, dramatic lighting.",
    prompt: "a noble superhero in a flowing cape and crest emblem chest plate, dramatic city-skyline silhouette behind, golden-hour rim lighting",
    negative: "marvel-logo, dc-logo, gore",
  },
  {
    id: "detective",
    label: "Noir Detective",
    tagline: "Trench coat, rainy alley.",
    prompt: "a noir 1940s detective in a tan trench coat and felt fedora, smoking-pipe in mouth, rainy neon-lit alley backdrop, moody chiaroscuro",
    negative: "modern clothing, bright daylight",
  },
  {
    id: "pirate",
    label: "Pirate Captain",
    tagline: "Tricorn hat, ship deck.",
    prompt: "a swashbuckling pirate captain in a tricorn hat and gold-trimmed coat, parrot on shoulder, sailing ship deck at sunset",
    negative: "modern clothing",
  },
  {
    id: "christmas",
    label: "Christmas Sweater",
    tagline: "Cosy holiday warmth.",
    prompt: "wearing a cosy red and cream Fair Isle Christmas sweater, holding a steaming cocoa mug, warm crackling-fireplace backdrop with twinkling string lights",
  },
];

export function getStyle(id: string) {
  return STYLES.find((s) => s.id === id);
}
export function getTheme(id: string) {
  return THEMES.find((t) => t.id === id);
}

/**
 * VIBES — the single pre-Generate "how should this look" selector.
 *
 * Deliberately NOT an art-medium picker (oil/watercolour/anime…). The axis that
 * actually controls slop + honours user intent is TASTE DIRECTION: how serious,
 * whimsical, playful, dramatic, or graphic the portrait should be. The customer
 * still types ANY subject/scene in the freeform box — the vibe only steers how
 * far and in which tonal direction the server-side enhancer is allowed to push.
 *
 * "auto" is the default: the enhancer reads the typed idea and picks the most
 * fitting treatment itself, so power users / people who don't care are never
 * boxed in. The other five give explicit control.
 *
 *   label/emoji/blurb → client UI (the cards)
 *   guidance          → injected into the enhancer's system prompt (server)
 *   fallbackSuffix    → appended to the raw prompt when the enhancer LLM is
 *                       unavailable, so output still degrades gracefully.
 *
 * Added 2026-06-08 (slop-fix: freeform prompt + intent selector + enhancer).
 */
export interface VibeDef {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
  guidance: string;
  fallbackSuffix: string;
}

export const VIBES: VibeDef[] = [
  {
    id: "auto",
    label: "Auto",
    emoji: "✨",
    blurb: "We pick the perfect look",
    guidance:
      "Choose the single art treatment that best fits the customer's idea — match its natural tone, whether that is elegant, whimsical, playful, dramatic, or graphic. Commit to ONE coherent medium and mood; do not blend treatments.",
    fallbackSuffix:
      "rendered as a tasteful, gallery-grade portrait with a coherent medium, controlled palette, and a clear focal point.",
  },
  {
    id: "classic",
    label: "Classic Portrait",
    emoji: "🖼️",
    blurb: "Timeless gallery oil",
    guidance:
      "Render as a timeless, elegant fine-art portrait — oil-on-canvas or refined painterly finish, restrained museum palette, soft directional light, dignified and gallery-grade. Tasteful, never garish or busy.",
    fallbackSuffix:
      "rendered as a timeless oil-on-canvas fine-art portrait, restrained museum palette, soft directional light, gallery-grade and dignified.",
  },
  {
    id: "storybook",
    label: "Storybook",
    emoji: "📖",
    blurb: "Soft, whimsical, charming",
    guidance:
      "Render as a warm hand-painted storybook illustration — soft watercolour or gouache, gentle light, whimsical and charming, with the polish of a beloved children's-book cover. Cosy, never cluttered.",
    fallbackSuffix:
      "rendered as a warm hand-painted storybook illustration, soft watercolour and gouache, gentle light, children's-book-cover polish.",
  },
  {
    id: "funny",
    label: "Funny Costume",
    emoji: "😄",
    blurb: "Playful, cute, polished",
    guidance:
      "Render as a playful, characterful portrait with a light comedic touch — cute, expressive and endearing, but cleanly composed and well-lit. Polished and frame-worthy, never crude or low-effort meme.",
    fallbackSuffix:
      "rendered as a playful, polished character portrait with a light comedic touch, cute and expressive, cleanly composed and frame-worthy.",
  },
  {
    id: "epic",
    label: "Epic Fantasy",
    emoji: "⚔️",
    blurb: "Dramatic & cinematic",
    guidance:
      "Render as a dramatic cinematic fantasy portrait — rich directional lighting, atmosphere and depth, high detail, heroic mood. Still a refined, composed portrait with a clear subject, not chaotic concept art.",
    fallbackSuffix:
      "rendered as a dramatic cinematic fantasy portrait, rich directional lighting, atmosphere and depth, heroic mood, refined composition.",
  },
  {
    id: "poster",
    label: "Modern Poster",
    emoji: "🎨",
    blurb: "Bold, clean, graphic",
    guidance:
      "Render as a clean modern graphic art print — bold confident shapes, a strong limited palette, flat or lightly textured colour, striking contemporary composition suitable for a framed wall print. Crisp and uncluttered.",
    fallbackSuffix:
      "rendered as a clean modern graphic art print, bold shapes, strong limited palette, striking contemporary composition.",
  },
];

export function getVibe(id: string | undefined | null): VibeDef | undefined {
  if (!id) return undefined;
  return VIBES.find((v) => v.id === id);
}

/** True when `id` names a real vibe. Used to validate the client-sent value. */
export function isValidVibeId(id: unknown): id is string {
  return typeof id === "string" && VIBES.some((v) => v.id === id);
}

/** 4 micro-varied composition prompts — same identity, 4 different framings. */
export const COMPOSITIONS = [
  { id: "close-up",   suffix: "Close-up portrait, head and shoulders only, eye-level eye contact." },
  { id: "medium",     suffix: "Medium shot, waist-up composition, environmental backdrop in soft focus." },
  { id: "full-body",  suffix: "Full-body composition, full character pose visible, environmental scene around them." },
  { id: "three-quarter", suffix: "Three-quarter angle hero shot, slight low angle, cinematic dynamic pose." },
] as const;

export interface BuildPromptInput {
  species: string;          // "dog" | "cat" | etc — from Vision pre-call
  breed?: string;           // optional specific breed (e.g. "German Shepherd")
  furColor?: string;        // optional fur descriptor (e.g. "black saddle with tan markings")
  eyeColor?: string;        // optional (e.g. "amber", "dark brown")
  earShape?: string;        // optional (e.g. "erect triangular", "drop pendulous")
  distinguishing?: string;  // optional one-phrase identifier (e.g. "white sock on left front paw")
  styleId: string;
  themeId: string;
  addDetails?: string;      // freeform user input, sanitised upstream
  petName?: string;         // optional, sanitised upstream
  compositionIdx: 0 | 1 | 2 | 3;
}

/**
 * Builds the gpt-image-2 prompt for the Style×Theme path. Same Keep/Add/Don't-
 * redesign 3-block structure as the customer-facing freeform path in
 * api/portraits.ts handleGenerate — the only difference is ADD = chosen
 * style + theme + optional addDetails (instead of customer's freeform prompt).
 *
 * Identity preservation only works if the KEEP block names the breed literally.
 * Generic "preserve the breed characteristics" without naming it = no-op for
 * gpt-image-2. Vision must extract breed and we slot it in.
 */
export function buildPrompt(input: BuildPromptInput): { prompt: string; negative: string } | null {
  const style = getStyle(input.styleId);
  const theme = getTheme(input.themeId);
  if (!style || !theme) return null;

  const subject = [input.breed, input.species].filter(Boolean).join(" ") || input.species;

  // KEEP block — the literal physical descriptors that pin identity.
  const keeps: string[] = [];
  if (input.breed) keeps.push(`the ${input.breed} silhouette and breed characteristics`);
  keeps.push(`exact facial features and head shape`);
  if (input.furColor) keeps.push(`${input.furColor} fur pattern`);
  if (input.eyeColor) keeps.push(`${input.eyeColor} eyes`);
  if (input.earShape) keeps.push(`${input.earShape} ear shape`);
  if (input.distinguishing) keeps.push(input.distinguishing);
  const keepBlock = keeps.join(", ");

  // ADD block — the chosen artistic transformation.
  const addBlock = `${theme.prompt}, rendered in ${style.prompt}${input.addDetails?.trim() ? `. Additional detail: ${input.addDetails.trim()}` : ''}`;

  // Composition hint — folds into ADD as a directive on framing.
  const composition = COMPOSITIONS[input.compositionIdx]?.suffix ?? "";

  const promptParts: string[] = [
    `Pet: ${subject}${input.distinguishing ? `, ${input.distinguishing}` : ''}.`,
    `Source image is the ground truth: if any listed descriptor conflicts with the visible pet, follow the source image.`,
    ``,
    `KEEP (do not change): ${keepBlock}. Do NOT change the breed. Do NOT redesign the ${input.species}.`,
    ``,
    `ADD (the artistic transformation): ${addBlock}.${composition ? ` ${composition}` : ''}`,
    ``,
    `HEADWEAR RULE: If the transformation includes a hat, helmet, hood, crown, or costume that covers the head, render the headwear naturally OVER the pet's head — ears should be tucked under or hidden by the headwear if it covers that area. Do NOT draw ears poking through fabric, helmet metal, or costume material.`,
    ``,
    input.petName
      ? `TEXT: render the name "${input.petName.trim().slice(0, 40)}" in elegant clean serif typography along the lower margin of the canvas, centered, readable, no spelling errors, no other text on the canvas.`
      : '',
    ``,
    `Output: vertical 2:3 canvas composition, painterly cinematic finish, premium polish for framed wall art.`,
  ];
  const prompt = promptParts.filter(p => p !== '').join('\n');

  // Style/theme negatives + name reinforcement.
  const baseNeg = [style.negative, theme.negative].filter(Boolean).join(", ");
  const negative = input.petName
    ? `${baseNeg}, misspelled text, garbled letters, illegible typography, gibberish text, multiple names`
    : baseNeg;

  return { prompt, negative };
}

/** Light NSFW-trigger sanitiser for the freeform "add details" field. */
const NSFW_TRIGGERS = [
  "blood", "gore", "weapon", "gun", "knife", "kill", "naked", "nude", "sexual", "porn",
];
export function sanitiseAddDetails(input: string): string {
  if (!input) return "";
  const lower = input.toLowerCase();
  for (const trigger of NSFW_TRIGGERS) {
    if (lower.includes(trigger)) return ""; // strip entirely if any trigger
  }
  return input.slice(0, 200);
}
