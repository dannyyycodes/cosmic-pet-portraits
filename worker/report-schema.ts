/**
 * Zod schema for the cosmic report returned by Claude.
 *
 * The schema is DELIBERATELY STRICT on the fields where drift has bitten us
 * in production — section content length, required sub-fields, array sizes.
 * Optional fields stay optional (if the model skips quirkDecoder, we don't
 * fail the whole report), but REQUIRED fields must meet a minimum bar or
 * the worker triggers a targeted regeneration of that section.
 *
 * Import from esm.sh so Deno can consume it without npm: specifiers (the
 * existing worker uses esm.sh for astronomia — same registry for consistency).
 */

import { z } from "https://esm.sh/zod@3.23.8";

// ─── Shared primitives ───────────────────────────────────────────────────────

const chartPlacement = z.object({
  sign: z.string().min(2),
  degree: z.number().min(0).max(30),
  symbol: z.string().min(1),
});

const minSentence = (chars: number) =>
  z.string().min(chars, { message: `must be at least ${chars} chars` });

// Content sections with a mandatory narrative body. The min-length numbers
// are deliberately below "good" to allow variance but above "obviously thin".
// Thin-section drift was the #1 failure mode in the Biscuit sample audit.
const sectionContent = z.object({
  title: z.string().min(2),
  content: minSentence(140),
  planetExplanation: z.string().optional(),
  practicalTip: z.string().optional(),
  funFact: z.string().optional(),
  relatable_moment: z.string().optional(),
  cosmicQuote: z.string().optional(),
}).passthrough(); // allow additional fields so we don't block harmless extras

// ─── Report schema ───────────────────────────────────────────────────────────

export const reportSchema = z.object({
  // ─── Locked-by-override fields (we overwrite these anyway, but we still
  //     validate shape so the save call doesn't explode if AI drops one). ───

  chartPlacements: z.record(z.string(), chartPlacement),
  elementalBalance: z.record(z.string(), z.number().min(0).max(100)),
  dominantElement: z.enum(["Fire", "Earth", "Air", "Water"]),
  crystal: z.object({
    name: z.string(),
    meaning: z.string(),
    color: z.string(),
  }),
  aura: z.object({
    primary: z.string(),
    secondary: z.string(),
    meaning: z.string(),
  }),
  archetype: z.object({
    name: z.string(),
    description: z.string(),
  }),

  // ─── Opening (Chapter 1) ───

  prologue: minSentence(220),

  cosmicNickname: z.object({
    nickname: z.string().min(2).max(60),
    explanation: z.string().min(40),
  }).optional(),

  firstMeeting: z.object({
    title: z.string(),
    paragraph: minSentence(140),
  }).optional(),

  nameMeaning: z.object({
    title: z.string(),
    origin: z.string().min(40),
    cosmicSignificance: z.string().min(60),
    nameVibration: z.number().int().min(1).max(9),
    numerologyMeaning: z.string().min(40),
    funFact: z.string().min(20),
  }).optional(),

  // ─── Twelve planetary readings (Chapter 2) ───

  solarSoulprint: sectionContent,
  lunarHeart: sectionContent,
  cosmicCuriosity: sectionContent,
  harmonyHeartbeats: sectionContent,
  spiritOfMotion: sectionContent,
  starlitGaze: sectionContent,
  destinyCompass: sectionContent,
  gentleHealer: sectionContent,
  wildSpirit: sectionContent,
  cosmicExpansion: sectionContent,
  cosmicLessons: sectionContent,
  elementalNature: sectionContent,
  celestialChoreography: sectionContent,
  earthlyExpression: sectionContent,
  luminousField: sectionContent,
  celestialGem: sectionContent.extend({
    crystalName: z.string(),
  }),
  eternalArchetype: sectionContent.extend({
    archetypeName: z.string(),
    archetypeDescription: z.string(),
    archetypeStory: minSentence(200),
  }),
  keepersBond: sectionContent,

  // ─── Fun & shareable (Chapter 3) ── all optional so single missing one
  //     doesn't fail the whole report. Their content IS length-checked. ───

  memePersonality: z.object({
    title: z.string(),
    type: z.string().min(3),
    description: z.string().min(80),
    signatureMove: z.string().optional(),
    relatableQuote: z.string().optional(),
  }).passthrough().optional(),

  topFiveCrimes: z.object({
    title: z.string(),
    crimes: z.array(z.string().min(40)).min(3).max(5),
    verdict: z.string().optional(),
  }).optional(),

  datingProfile: z.object({
    title: z.string(),
    headline: z.string().min(3).max(120),
    bio: z.string().min(120),
    greenFlags: z.array(z.string()).optional(),
    redFlags: z.array(z.string()).optional(),
  }).passthrough().optional(),

  dreamJob: z.object({
    title: z.string(),
    job: z.string().min(6),
    description: z.string().min(200),
    salary: z.string().min(6),
  }).optional(),

  villainOriginStory: z.object({
    title: z.string().optional(),
    trigger: z.string(),
    dramaticResponse: z.string(),
    secretMotivation: z.string(),
    redemptionArc: z.string(),
  }).passthrough().optional(),

  quirkDecoder: z.object({
    title: z.string().optional(),
    quirk1: z.object({
      behavior: z.string(),
      cosmicExplanation: z.string(),
      whatItReallyMeans: z.string(),
    }),
    quirk2: z.object({
      behavior: z.string(),
      cosmicExplanation: z.string(),
      whatItReallyMeans: z.string(),
    }),
  }).optional(),

  // ─── Chapter 4 — emotional peak ───

  petMonologue: z.object({
    title: z.string().optional(),
    monologue: minSentence(500), // 8-12 sentences minimum; this is the tear-jerk
    postScript: z.string().optional(),
  }),

  // New (2026-04-17) — 3-line pullquote from pet
  directMessage: z.object({
    title: z.string().optional(),
    preamble: z.string().optional(),
    message: z.string().min(80), // must have real content, not a one-liner
    signoff: z.string().optional(),
  }).optional(),

  // New — Chiron/Saturn wound synthesis
  shadowSelf: z.object({
    title: z.string().optional(),
    preamble: z.string().optional(),
    petShadow: minSentence(160),
    mirrorInYou: minSentence(160),
    healingPath: minSentence(100),
  }).optional(),

  // ─── Chapter 5 — the bond ───

  compatibilityNotes: z.object({
    bestPlaymates: z.array(z.string().min(10)).min(1).max(4),
    challengingEnergies: z.array(z.string()).optional(),
    humanCompatibility: minSentence(200),
    relationshipGift: z.string().optional(),
  }),

  // New — chart-grounded friction
  petOwnerFriction: z.object({
    title: z.string().optional(),
    preamble: z.string().optional(),
    clashPattern: minSentence(160),
    whyItHappens: minSentence(100),
    repairRitual: minSentence(100),
    reframe: z.string().optional(),
  }).optional(),

  // Pet-Parent Soul Bond — premium upgrade, may or may not be present
  petParentSoulBond: z.object({}).passthrough().optional(),

  // ─── Keepsake + closing ───

  luckyElements: z.object({
    luckyNumber: z.union([z.string(), z.number()]),
    luckyDay: z.string(),
    luckyColor: z.string(),
    powerTime: z.string(),
  }),

  shareableCard: z.object({}).passthrough().optional(),
  basedOnYourAnswers: z.object({}).passthrough().optional(),

  accuracyMoments: z.object({
    title: z.string().optional(),
    predictions: z.array(z.string().min(60)).min(3).max(5),
    callToAction: z.string().optional(),
  }).optional(),

  epilogue: minSentence(300),

  // ─── Fun extras — all optional ───
  cosmicRecipe: z.object({}).passthrough().optional(),
  textMessages: z.object({}).passthrough().optional(),
  googleSearches: z.union([z.array(z.string()), z.object({}).passthrough()]).optional(),
  humanProfile: z.object({}).passthrough().optional(),
  yelpReviews: z.array(z.object({}).passthrough()).optional(),
  cosmicAwards: z.array(z.object({}).passthrough()).optional(),
  ifICouldTalk: z.array(z.object({}).passthrough()).optional(),
  cosmicPlaylist: z.array(z.object({}).passthrough()).optional(),
}).passthrough(); // tolerate extra keys — we only care that required ones are present

export type ReportShape = z.infer<typeof reportSchema>;

// ─── Validation helper used by worker ────────────────────────────────────────

export interface SchemaValidationResult {
  valid: boolean;
  /** Section path like "solarSoulprint" or "petMonologue.monologue" — used to
   *  drive targeted regeneration. Only top-level section names end up here. */
  failedSections: string[];
  errors: string[];
}

export function validateReport(raw: unknown): SchemaValidationResult {
  const parsed = reportSchema.safeParse(raw);
  if (parsed.success) {
    return { valid: true, failedSections: [], errors: [] };
  }
  const failedSections = new Set<string>();
  const errors: string[] = [];
  for (const issue of parsed.error.issues) {
    const section = typeof issue.path[0] === "string" ? issue.path[0] : "unknown";
    failedSections.add(section);
    errors.push(`${issue.path.join(".")}: ${issue.message}`);
  }
  return {
    valid: false,
    failedSections: Array.from(failedSections),
    errors,
  };
}
