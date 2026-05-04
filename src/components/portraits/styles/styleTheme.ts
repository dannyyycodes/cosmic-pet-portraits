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

/** 4 micro-varied composition prompts — same identity, 4 different framings. */
export const COMPOSITIONS = [
  { id: "close-up",   suffix: "Close-up portrait, head and shoulders only, eye-level eye contact." },
  { id: "medium",     suffix: "Medium shot, waist-up composition, environmental backdrop in soft focus." },
  { id: "full-body",  suffix: "Full-body composition, full character pose visible, environmental scene around them." },
  { id: "three-quarter", suffix: "Three-quarter angle hero shot, slight low angle, cinematic dynamic pose." },
] as const;

export interface BuildPromptInput {
  species: string;       // "dog" | "cat" | etc — from Gemini Vision pre-call
  breed?: string;        // optional breed extracted by Vision
  furColor?: string;     // optional fur descriptor
  styleId: string;
  themeId: string;
  addDetails?: string;   // freeform user input, sanitised upstream
  compositionIdx: 0 | 1 | 2 | 3;
}

export function buildPrompt(input: BuildPromptInput): { prompt: string; negative: string } | null {
  const style = getStyle(input.styleId);
  const theme = getTheme(input.themeId);
  if (!style || !theme) return null;

  const subject = [input.breed, input.species].filter(Boolean).join(" ") || input.species;
  const furNote = input.furColor ? `, with ${input.furColor} fur` : "";
  const composition = COMPOSITIONS[input.compositionIdx]?.suffix ?? "";
  const addDetails = input.addDetails?.trim() ? ` ${input.addDetails.trim()}` : "";

  const prompt = [
    `Transform this ${subject}${furNote} into ${theme.prompt}, rendered in ${style.prompt}.`,
    `Preserve the exact facial features, fur colour and pattern, eye colour, ear shape and breed characteristics of the original ${input.species}.`,
    composition,
    addDetails,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const negative = [style.negative, theme.negative].filter(Boolean).join(", ");

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
