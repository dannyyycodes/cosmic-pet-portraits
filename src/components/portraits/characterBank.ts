/**
 * Character bank — single source of truth for every character world we offer.
 *
 * Used by:
 *   • CharacterPacks (homepage section — picks 6 highlights)
 *   • UploadStudio character picker (full bank, filtered by category)
 *   • MasterPortraitPlaceholder (palette per character)
 *   • api/portraits/preview.ts MUST mirror this list (its SCENES map is server-side)
 *
 * Naming rules (per vault/01-projects/little-souls/pet-portraits/handoff-2026-05-02):
 *   - Public-facing names are original archetypal labels.
 *   - No franchise names, no living-celebrity names on labels.
 *   - Visual identity in prompts can gesture at era/genre without copying tells.
 *
 * Adding a new character: write the entry here, add a SCENES entry in
 * api/portraits/preview.ts with the same id, ship.
 */

export type CharacterCategory =
  | "Cosmic"
  | "Fantasy"
  | "Cinema"
  | "Royalty"
  | "Sci-Fi"
  | "Music"
  | "Sport";

export interface CharacterPack {
  id: string;
  name: string;
  category: CharacterCategory;
  /** One-line painterly tagline (Cormorant italic, premium). */
  tagline: string;
  /** Three short scene descriptors that ship inside the pack at order time. */
  scenes: [string, string, string];
  /** Palette for placeholder gradient + emblem, before real image lands. */
  palette: { from: string; to: string; accent: string; emblem: EmblemKind };
  /** Set true to surface this character in the homepage highlight strip. */
  highlight?: boolean;
}

export type EmblemKind =
  | "tophat" | "moon" | "raven" | "star" | "rose" | "chart"
  | "crown" | "sword" | "wand" | "wing" | "halo" | "anchor"
  | "diamond" | "lyre" | "gear" | "bolt";

export const CHARACTER_BANK: CharacterPack[] = [
  // ─── Cosmic ─────────────────────────────────────────────────────────
  {
    id: "cosmic-chart",
    name: "Cosmic Birth Chart",
    category: "Cosmic",
    tagline: "Their natal chart, painted around them. The Soul Edition signature.",
    scenes: ["Chart wheel halo", "Constellation veil", "Soul-centre portrait"],
    palette: { from: "#0d0a14", to: "#2a1f3a", accent: "#d4b67a", emblem: "chart" },
    highlight: true,
  },
  {
    id: "moonlight-mystic",
    name: "Moonlight Mystic",
    category: "Cosmic",
    tagline: "Silver moonlight on fur, tarot cards, soft enchantment.",
    scenes: ["Crescent halo", "Tarot table", "Moon-silver portrait"],
    palette: { from: "#0e1424", to: "#2a2840", accent: "#c9d4e8", emblem: "moon" },
  },
  {
    id: "constellation-guardian",
    name: "Constellation Guardian",
    category: "Cosmic",
    tagline: "Standing watch among the stars. Quiet keeper of the night sky.",
    scenes: ["Star-trail halo", "Galactic horizon", "Aurora close-up"],
    palette: { from: "#0a1424", to: "#1f2a4a", accent: "#9cc4ff", emblem: "star" },
  },
  {
    id: "oracle-of-spring",
    name: "Oracle of Spring",
    category: "Cosmic",
    tagline: "Crowned in wildflowers. Reading the season's omens.",
    scenes: ["Wildflower crown", "Garden grotto", "Soft-bloom portrait"],
    palette: { from: "#1a2818", to: "#3a4628", accent: "#e8d480", emblem: "halo" },
  },

  // ─── Fantasy ────────────────────────────────────────────────────────
  {
    id: "wizard-school",
    name: "Wizard School Prodigy",
    category: "Fantasy",
    tagline: "Velvet robe. Floating spell book. Candlelight on fur.",
    scenes: ["Ancient library", "Stained-glass moonlight", "Spell-cast portrait"],
    palette: { from: "#1a1f2e", to: "#2c2f1f", accent: "#d4b67a", emblem: "wand" },
    highlight: true,
  },
  {
    id: "forest-elf",
    name: "Forest Elf Warrior",
    category: "Fantasy",
    tagline: "Mossy cloak. Bone-white bow. Eyes that read the woods.",
    scenes: ["Sun-pierced canopy", "River-bank stance", "Bow-ready portrait"],
    palette: { from: "#1c2818", to: "#3a4a28", accent: "#c4a265", emblem: "wing" },
  },
  {
    id: "dragon-tamer",
    name: "Dragon Tamer",
    category: "Fantasy",
    tagline: "A dragon's eye in the firelight. Quiet command, no leash.",
    scenes: ["Cave hearth", "Dragon-side portrait", "Mountain summit"],
    palette: { from: "#2a1410", to: "#4a2418", accent: "#e8a020", emblem: "bolt" },
  },
  {
    id: "knight-of-realm",
    name: "Knight of the Realm",
    category: "Fantasy",
    tagline: "Silver plate. Crimson sash. Sworn to something quiet and true.",
    scenes: ["Sworn-vow chapel", "Mounted portrait", "Standard-bearer"],
    palette: { from: "#1c1c20", to: "#2a2c34", accent: "#bf524a", emblem: "sword" },
  },
  {
    id: "tiny-adventurer",
    name: "Tiny Adventurer",
    category: "Fantasy",
    tagline: "Map in their teeth. Off to find treasure, or breakfast.",
    scenes: ["Hill-summit map", "Forest path", "Tavern-night portrait"],
    palette: { from: "#241c14", to: "#3c3020", accent: "#d4b67a", emblem: "anchor" },
  },

  // ─── Cinema (era / genre, NOT named films/people) ───────────────────
  {
    id: "1920s-boss",
    name: "1920s Underworld Boss",
    category: "Cinema",
    tagline: "Tiny don. Enormous gravitas. Rain on cobblestones.",
    scenes: ["Smoky private room", "Brass-lamp close-up", "Rainy alleyway"],
    palette: { from: "#2a221d", to: "#4a3528", accent: "#c4a265", emblem: "tophat" },
    highlight: true,
  },
  {
    id: "noir-detective",
    name: "Noir Detective",
    category: "Cinema",
    tagline: "Trench coat, shadow on the venetian blinds, half a cigarette.",
    scenes: ["Backlit office", "Rain-on-window", "Interrogation chair"],
    palette: { from: "#14141a", to: "#2a2a32", accent: "#a8a8a8", emblem: "raven" },
  },
  {
    id: "western-outlaw",
    name: "Western Outlaw",
    category: "Cinema",
    tagline: "Dust on the boots. A standoff sun. Quiet, dangerous, fair.",
    scenes: ["Saloon doorway", "Canyon high-noon", "Campfire portrait"],
    palette: { from: "#2c1d12", to: "#52331e", accent: "#d4a04a", emblem: "star" },
  },
  {
    id: "old-hollywood",
    name: "Old Hollywood Glamour",
    category: "Cinema",
    tagline: "Pearls. Marabou stole. The sigh of a soft-focus close-up.",
    scenes: ["Vanity mirror", "Stage curtain reveal", "Black-tie portrait"],
    palette: { from: "#241c1c", to: "#3c2c2c", accent: "#e8d480", emblem: "diamond" },
  },
  {
    id: "gothic-academy",
    name: "Gothic Academy Star",
    category: "Cinema",
    tagline: "Deadpan brilliance. Rain on stained glass. Quiet menace.",
    scenes: ["Candle-lit study", "Ribbon collar close-up", "Storm-window full"],
    palette: { from: "#14141c", to: "#2c1f2c", accent: "#bf524a", emblem: "raven" },
    highlight: true,
  },

  // ─── Royalty ────────────────────────────────────────────────────────
  {
    id: "regency-court",
    name: "Regency Court Darling",
    category: "Royalty",
    tagline: "Ivory silk. Witty grace. Ballroom candlelight.",
    scenes: ["Gilded mirror", "Garden promenade", "Court portrait"],
    palette: { from: "#2a1f24", to: "#4a3a32", accent: "#c4a265", emblem: "rose" },
    highlight: true,
  },
  {
    id: "renaissance-painter",
    name: "Renaissance Subject",
    category: "Royalty",
    tagline: "Cracked oil glaze. Dignified gaze. Sat for an old master.",
    scenes: ["Studio easel", "Patron's portrait", "Window-light close-up"],
    palette: { from: "#1f1812", to: "#3a2c20", accent: "#c4a265", emblem: "halo" },
  },
  {
    id: "tudor-monarch",
    name: "Tudor Monarch",
    category: "Royalty",
    tagline: "Brocade. Heavy chains of office. The weight of a small crown.",
    scenes: ["Throne-room", "Royal seal", "Coronation portrait"],
    palette: { from: "#2a1814", to: "#4a2c20", accent: "#d4b67a", emblem: "crown" },
  },
  {
    id: "ancient-egyptian-royal",
    name: "Ancient Royal",
    category: "Royalty",
    tagline: "Gold collar, kohl-lined eyes, sun on sandstone walls.",
    scenes: ["Temple courtyard", "Throne side-profile", "Sunset desert horizon"],
    palette: { from: "#2c1f10", to: "#4a3418", accent: "#e8c060", emblem: "crown" },
  },

  // ─── Sci-Fi ─────────────────────────────────────────────────────────
  {
    id: "galaxy-smuggler",
    name: "Galaxy Smuggler Captain",
    category: "Sci-Fi",
    tagline: "Worn leather. Charming roguery. Hyperspace at the window.",
    scenes: ["Cockpit hero", "Cantina low-light", "Console reflection"],
    palette: { from: "#1a1620", to: "#3a2418", accent: "#d4b67a", emblem: "star" },
    highlight: true,
  },
  {
    id: "cyber-hacker",
    name: "Underground Net Operative",
    category: "Sci-Fi",
    tagline: "Neon alley reflections. Round shades. Six firewalls deep.",
    scenes: ["Server-room glow", "Tokyo-rain alley", "Holo-terminal"],
    palette: { from: "#0e1418", to: "#1a2438", accent: "#22d4a8", emblem: "bolt" },
  },
  {
    id: "station-commander",
    name: "Space Station Commander",
    category: "Sci-Fi",
    tagline: "Pressed uniform. Earth out the porthole. Quiet authority.",
    scenes: ["Bridge command", "Earth-rise portrait", "Helm console"],
    palette: { from: "#0c1224", to: "#1a2440", accent: "#c0d4e8", emblem: "gear" },
  },
  {
    id: "mech-pilot",
    name: "Mech Pilot",
    category: "Sci-Fi",
    tagline: "Helmet under one arm. Hangar lights overhead. Ready for the drop.",
    scenes: ["Hangar floor", "Cockpit close-up", "Battle-ready stance"],
    palette: { from: "#1a1c24", to: "#2c2e3c", accent: "#d4a040", emblem: "gear" },
  },

  // ─── Music ──────────────────────────────────────────────────────────
  {
    id: "disco-diva",
    name: "Disco Diva",
    category: "Music",
    tagline: "Sequins. Mirror-ball glow. Dance-floor royalty.",
    scenes: ["Mirror-ball stage", "Booth close-up", "Sparkle-portrait"],
    palette: { from: "#2a1024", to: "#4a1c40", accent: "#e040a0", emblem: "diamond" },
  },
  {
    id: "rock-icon",
    name: "Rock Icon",
    category: "Music",
    tagline: "Leather jacket. Stage smoke. The soul of a stadium tour.",
    scenes: ["Spotlight stage", "Backstage portrait", "Encore-bow"],
    palette: { from: "#14141a", to: "#28282e", accent: "#bf524a", emblem: "bolt" },
  },
  {
    id: "jazz-vocalist",
    name: "Jazz Vocalist",
    category: "Music",
    tagline: "Slow-swing smoke. Brass mic. A note held long enough to break you.",
    scenes: ["Speakeasy stage", "Mic close-up", "Solo-spotlight"],
    palette: { from: "#1c1410", to: "#34241c", accent: "#d4a040", emblem: "lyre" },
  },
  {
    id: "opera-diva",
    name: "Opera Diva",
    category: "Music",
    tagline: "Velvet curtain. Final aria. The whole house holding its breath.",
    scenes: ["Curtain reveal", "Stage portrait", "Bouquet bow"],
    palette: { from: "#1a0e1c", to: "#2c1c34", accent: "#e8a040", emblem: "rose" },
  },

  // ─── Sport ──────────────────────────────────────────────────────────
  {
    id: "boxing-champion",
    name: "Boxing Champion",
    category: "Sport",
    tagline: "Robe over the shoulders. Ring-light glow. Belt earned.",
    scenes: ["Ring corner", "Title-belt portrait", "Locker-room calm"],
    palette: { from: "#1c1010", to: "#34201c", accent: "#d4b67a", emblem: "halo" },
  },
  {
    id: "mountain-summit",
    name: "Mountain Summit Climber",
    category: "Sport",
    tagline: "Ice on the goggles. The world below. Earned it.",
    scenes: ["Summit flag", "Cliff-edge stance", "Tent-window portrait"],
    palette: { from: "#1c2030", to: "#2c3450", accent: "#d4d8e0", emblem: "wing" },
  },
  {
    id: "race-driver",
    name: "Race Driver",
    category: "Sport",
    tagline: "Helmet at the hip. Track lights overhead. Pole position.",
    scenes: ["Starting grid", "Cockpit suit-up", "Trophy podium"],
    palette: { from: "#181818", to: "#2c2c2c", accent: "#bf524a", emblem: "bolt" },
  },
];

/** Convenience: 6 hero highlights for the homepage section. */
export const CHARACTER_HIGHLIGHTS = CHARACTER_BANK.filter((c) => c.highlight);

/** Ordered list of categories in the order we want tabs to appear. */
export const CATEGORY_ORDER: CharacterCategory[] = [
  "Cosmic",
  "Fantasy",
  "Cinema",
  "Royalty",
  "Sci-Fi",
  "Music",
  "Sport",
];

/** Quick lookup. */
export function getPack(id: string): CharacterPack | undefined {
  return CHARACTER_BANK.find((c) => c.id === id);
}
