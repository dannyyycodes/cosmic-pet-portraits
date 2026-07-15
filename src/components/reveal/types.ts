// Shared types for the Reveal ("Starlight Scroll") experience.

export interface Placement {
  sign: string;
  degree: number;
  symbol?: string;
}

export type ChartPlacements = Record<string, Placement>;

/** The payload returned by the get-report edge function. */
export interface RevealReport {
  petName: string;
  species?: string;
  breed?: string;
  gender?: string;
  reportId?: string;
  shareToken?: string;
  petPhotoUrl?: string;
  portraitUrl?: string;
  occasionMode?: string;      // 'discover' | 'memorial' | 'gift' | ...
  hasActiveHoroscope?: boolean;
  ownerAnswers?: Record<string, unknown>;
  // the ~48 reading sections
  report: Record<string, any>;
}

/** A normalized content block inside an expanded card. */
export type Block =
  | { kind: 'para'; text: string; lead?: boolean }
  | { kind: 'quote'; text: string; cite?: string }
  | { kind: 'labeled'; label: string; text: string }
  | { kind: 'list'; label?: string; items: string[]; ordered?: boolean }
  | { kind: 'chips'; items: { label: string; value: string; swatch?: string }[] }
  | { kind: 'bars'; items: { label: string; value: number; color: string }[] }
  | { kind: 'exchange'; groups: { time: string; turns: { who: 'pet' | 'human'; text: string }[] }[] };

export type GlyphType = 'astro' | 'icon';
export type CardTier = 'hero' | 'card' | 'delight';
export type CardTone = 'default' | 'tender' | 'playful';

/** A fully normalized card ready to render. */
export interface CardModel {
  key: string;
  tier: CardTier;
  tone: CardTone;
  glyph: string;          // astro char OR icon name
  glyphType: GlyphType;
  kicker?: string;
  title: string;
  essence: string;        // collapsed one-liner
  blocks: Block[];
  accentHex?: string;
  signLabel?: string;     // for hero cards: "Gemini Sun" style headline
}

export interface ChapterMotif {
  el: 'fire' | 'earth' | 'air' | 'water';
  label: string;          // one word, e.g. "Fire"
  line: string;           // one short evocative line
}

export interface ChapterModel {
  id: string;
  index: number;          // 1..7
  numeral: string;        // "I".."VII"
  title: string;
  subtitle: string;
  washA: string;
  washB: string;
  accent: string;         // active-chapter accent hue
  hero: string;           // hero image base name (assets.CHAPTER_HERO)
  motif?: ChapterMotif;   // optional element interlude woven mid-chapter
  cards: CardModel[];
  special?: 'invocation' | 'legacy';
}
