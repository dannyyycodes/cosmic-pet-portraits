// The 7-chapter architecture + section normalizer.
// Maps the REAL ~48 keys the get-report payload returns into ordered,
// progressively-disclosed cards. Never invents keys. Honours the copy —
// presentation only, no rewriting of the reading itself.

import type { Block, CardModel, CardTier, CardTone, ChapterModel, ChapterMotif, GlyphType, RevealReport } from './types';
import { CHAPTER_HERO } from './assets';

/* -------------------------------------------------------------------------- */
/* text helpers                                                               */
/* -------------------------------------------------------------------------- */

/** strip a leading emoji / sigil / punctuation run from a title. */
function cleanTitle(s: string): string {
  if (!s) return '';
  return s.replace(/^[^\p{L}\p{N}"'“]+/u, '').trim();
}

function stripQuotes(s: string): string {
  return (s || '').trim().replace(/^["“”]+|["“”]+$/g, '').trim();
}

function firstSentence(s: string, max = 155): string {
  if (!s) return '';
  const txt = s.trim();
  const m = txt.match(/^[\s\S]*?[.!?](\s|$)/);
  let out = (m ? m[0] : txt).trim();
  if (out.length > max) {
    out = out.slice(0, max);
    const lastSpace = out.lastIndexOf(' ');
    if (lastSpace > 40) out = out.slice(0, lastSpace);
    out = out.replace(/[,;:.\s]+$/, '') + '…';
  }
  return out;
}

function titleCase(k: string): string {
  return k
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

/* -------------------------------------------------------------------------- */
/* per-field presentation                                                     */
/* -------------------------------------------------------------------------- */

const FIELD_LABELS: Record<string, string> = {
  practicalTip: 'Try this',
  relatable_moment: "You'll recognise this",
  interactiveChallenge: 'A small ritual',
  didYouKnow: 'Did you know',
  secretDesire: 'What they secretly want',
  energyLevel: 'Their energy',
  luckyArea: 'Where luck finds them',
  masterLesson: 'The lesson they teach',
  howToSense: 'How to feel it',
  pastLifeHint: 'An older echo',
  healingGift: 'Their healing gift',
  vulnerabilityNote: 'Handle with care',
  firstImpressionPrediction: 'First impression',
  physicalPrediction: 'In the body',
  breedAstrologyBlend: 'Breed meets stars',
  growthOpportunity: 'Room to grow',
  cosmicWisdom: 'Cosmic wisdom',
  southNode: "What they're releasing",
  loveLanguageType: 'Their love language',
  loveLanguageExplanation: 'How they love you',
  temperamentInsight: 'Temperament',
  elementalAdvice: 'For balance',
  funFact: 'Fun fact',
  dailyRitual: 'Daily ritual',
  soulContract: 'Your soul contract',
  mirrorQuality: 'The mirror in you',
  mirrorInYou: 'The mirror in you',
  healingPath: 'The healing path',
  origin: 'Where the name comes from',
  numerologyMeaning: 'Numerology',
  nameVibration: 'Name vibration',
  cosmicSignificance: 'Written in the stars',
  reframe: 'The reframe',
  whyItHappens: 'Why it happens',
  repairRitual: 'The repair',
  clashPattern: 'Where you clash',
  dramaticResponse: 'The dramatic response',
  redemptionArc: 'The redemption',
  secretMotivation: 'The secret motive',
  archetypeLesson: 'What they came to teach',
  archetypeDescription: 'In a line',
  soulSignature: 'Soul signature',
  auraMeaning: 'What the colours mean',
  shadowShimmer: 'When the light dims',
  relationshipGift: 'Their gift to you',
  humanCompatibility: 'Your match',
  crystalMeaning: 'Why this stone',
  crystalName: 'The stone',
  howToUse: 'How to use it',
  placement: 'Where to place it',
  headline: 'Headline',
  bio: 'Bio',
  job: 'The role',
  salary: 'The pay',
  description: 'The story',
  petShadow: 'Their shadow',
  trigger: 'The trigger',
  quirk: 'The quirk',
  behavior: 'The behaviour',
  cosmicExplanation: 'What the stars say',
  whatItReallyMeans: 'What it really means',
  signatureMove: 'Signature move',
  type: 'Their type',
  accuracyNote: 'A note on accuracy',
  balance: 'Elemental balance',
  dominantElement: 'Dominant element',
  planetExplanation: 'What this placement governs',
};

// fields treated as a lead / body paragraph
const BODY_FIELDS = new Set([
  'content', 'paragraph', 'description', 'message', 'monologue', 'story',
  'archetypeStory', 'petShadow', 'bio', 'crystalMeaning',
]);
const LEAD_FIELDS = new Set(['preamble', 'intro', 'headline']);
// fields rendered as a closing pull-quote
const QUOTE_FIELDS = new Set([
  'cosmicQuote', 'affirmation', 'signatureLine', 'relatableQuote',
  'cosmicWisdom', 'signoff', 'verdict', 'cosmicNote', 'relatableQuote',
]);
// fields held to the very end of the card
const CLOSING_FIELDS = new Set(['postScript', 'signoff', 'verdict', 'cosmicNote', 'accuracyNote']);
// never surfaced generically
const SKIP_FIELDS = new Set([
  'title', 'symbol', 'emoji', 'zodiacEmoji', 'color', 'primaryColor',
  'secondaryColor', 'crystalColor', 'luckyColor', 'element',
]);

function fieldLabel(k: string): string {
  return FIELD_LABELS[k] ?? titleCase(k);
}

/** Generic object -> blocks. Preserves JSON key order, defers closing fields. */
function genericBlocks(obj: Record<string, any>): { blocks: Block[]; essence: string } {
  const blocks: Block[] = [];
  const closing: Block[] = [];
  let essence = '';

  const push = (b: Block, isClosing = false) => (isClosing ? closing : blocks).push(b);

  for (const [k, v] of Object.entries(obj)) {
    if (SKIP_FIELDS.has(k) || k.startsWith('_')) continue;
    if (v == null || v === '') continue;

    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      if (typeof v[0] === 'string') {
        push({ kind: 'list', label: fieldLabel(k), items: v as string[] });
      }
      continue; // arrays of objects handled by bespoke normalizers
    }
    if (typeof v === 'object') continue; // nested objects -> bespoke

    const text = typeof v === 'number' ? String(v) : String(v);
    const isClosing = CLOSING_FIELDS.has(k);

    if (LEAD_FIELDS.has(k)) {
      push({ kind: 'para', text, lead: true }, isClosing);
      if (!essence) essence = firstSentence(text);
    } else if (BODY_FIELDS.has(k)) {
      push({ kind: 'para', text }, isClosing);
      if (!essence) essence = firstSentence(text);
    } else if (QUOTE_FIELDS.has(k)) {
      push({ kind: 'quote', text: stripQuotes(text) }, isClosing);
    } else {
      push({ kind: 'labeled', label: fieldLabel(k), text }, isClosing);
      if (!essence) essence = firstSentence(text);
    }
  }
  return { blocks: [...blocks, ...closing], essence };
}

/* -------------------------------------------------------------------------- */
/* section meta (kicker + glyph)                                              */
/* -------------------------------------------------------------------------- */

interface Meta { kicker?: string; glyph: string; glyphType: GlyphType; tone?: CardTone; }

const META: Record<string, Meta> = {
  // planet sections — real astrological sigils
  solarSoulprint: { kicker: 'The Sun', glyph: '☉', glyphType: 'astro' },
  lunarHeart: { kicker: 'The Moon', glyph: '☽', glyphType: 'astro' },
  starlitGaze: { kicker: 'Rising Sign', glyph: 'Asc', glyphType: 'astro' },
  cosmicCuriosity: { kicker: 'Mercury', glyph: '☿', glyphType: 'astro' },
  harmonyHeartbeats: { kicker: 'Venus', glyph: '♀', glyphType: 'astro' },
  spiritOfMotion: { kicker: 'Mars', glyph: '♂', glyphType: 'astro' },
  cosmicExpansion: { kicker: 'Jupiter', glyph: '♃', glyphType: 'astro' },
  cosmicLessons: { kicker: 'Saturn', glyph: '♄', glyphType: 'astro' },
  wildSpirit: { kicker: 'Uranus', glyph: '♅', glyphType: 'astro' },
  luminousField: { kicker: 'Neptune', glyph: '♆', glyphType: 'astro' },
  shadowSelf: { kicker: 'Pluto & Chiron', glyph: '♇', glyphType: 'astro', tone: 'tender' },
  gentleHealer: { kicker: 'Chiron', glyph: '⚷', glyphType: 'astro', tone: 'tender' },
  destinyCompass: { kicker: 'The Lunar Nodes', glyph: '☊', glyphType: 'astro' },
  celestialChoreography: { kicker: 'The Aspects', glyph: 'orbit', glyphType: 'icon' },
  earthlyExpression: { kicker: 'Body & Breed', glyph: 'paw', glyphType: 'icon' },
  elementalNature: { kicker: 'The Elements', glyph: 'balance', glyphType: 'icon' },

  // recognition / essence
  archetype: { kicker: 'Their Archetype', glyph: 'crown', glyphType: 'icon' },
  eternalArchetype: { kicker: 'Eternal Archetype', glyph: 'crown', glyphType: 'icon' },
  firstMeeting: { kicker: 'First Impressions', glyph: 'sparkle', glyphType: 'icon' },
  basedOnYourAnswers: { kicker: 'How We Read Them', glyph: 'checklist', glyphType: 'icon' },
  accuracyMoments: { kicker: 'Did We Get It Right', glyph: 'target', glyphType: 'icon' },
  nameMeaning: { kicker: 'The Name', glyph: 'tag', glyphType: 'icon' },

  // inner world / play
  quirkDecoder: { kicker: 'Quirk Decoder', glyph: 'key', glyphType: 'icon', tone: 'playful' },
  memePersonality: { kicker: 'Their Meme Energy', glyph: 'spark', glyphType: 'icon', tone: 'playful' },
  datingProfile: { kicker: 'If They Had a Profile', glyph: 'heart', glyphType: 'icon', tone: 'playful' },
  topFiveCrimes: { kicker: 'Criminal Record', glyph: 'gavel', glyphType: 'icon', tone: 'playful' },
  villainOriginStory: { kicker: 'Villain Origin', glyph: 'mask', glyphType: 'icon', tone: 'playful' },
  dreamJob: { kicker: 'Dream Career', glyph: 'briefcase', glyphType: 'icon', tone: 'playful' },
  cosmicRecipe: { kicker: 'A Recipe For Them', glyph: 'bowl', glyphType: 'icon', tone: 'playful' },
  textMessages: { kicker: 'If They Could Text', glyph: 'chat', glyphType: 'icon', tone: 'playful' },
  luckyElements: { kicker: 'Lucky Charms', glyph: 'clover', glyphType: 'icon' },
  celestialGem: { kicker: 'Their Grounding Stone', glyph: 'gem', glyphType: 'icon' },

  // social soul / bond
  keepersBond: { kicker: 'The Keeper’s Bond', glyph: 'paw', glyphType: 'icon' },
  petOwnerFriction: { kicker: 'When You Clash', glyph: 'spark', glyphType: 'icon' },
  compatibilityNotes: { kicker: 'Who Fits Their Soul', glyph: 'link', glyphType: 'icon' },

  // legacy
  prologue: { kicker: 'The Opening', glyph: 'quill', glyphType: 'icon' },
  epilogue: { kicker: 'The Whole Soul', glyph: 'quill', glyphType: 'icon' },
  petMonologue: { kicker: 'In Their Own Words', glyph: 'mic', glyphType: 'icon' },
  directMessage: { kicker: 'The One Thing', glyph: 'envelope', glyphType: 'icon' },
};

/* -------------------------------------------------------------------------- */
/* bespoke normalizers                                                        */
/* -------------------------------------------------------------------------- */

function bespoke(key: string, v: any, ctx: RevealReport): { blocks: Block[]; essence: string } | null {
  switch (key) {
    case 'elementalNature': {
      const bal = ctx.report.elementalBalance || v.balance;
      const blocks: Block[] = [];
      if (v.content) blocks.push({ kind: 'para', text: v.content });
      if (bal && typeof bal === 'object') {
        const colors: Record<string, string> = { Fire: '#E0724E', Earth: '#8FB56B', Air: '#BBA7FF', Water: '#5AA9D6' };
        const items = Object.entries(bal)
          .map(([label, value]) => ({ label, value: Number(value) || 0, color: colors[label] || '#BBA7FF' }))
          .sort((a, b) => b.value - a.value);
        blocks.push({ kind: 'bars', items });
      }
      if (v.dominantElement) blocks.push({ kind: 'labeled', label: 'Dominant element', text: String(v.dominantElement) });
      if (v.temperamentInsight) blocks.push({ kind: 'labeled', label: fieldLabel('temperamentInsight'), text: v.temperamentInsight });
      if (v.elementalAdvice) blocks.push({ kind: 'labeled', label: fieldLabel('elementalAdvice'), text: v.elementalAdvice });
      if (v.funFact) blocks.push({ kind: 'labeled', label: 'Fun fact', text: v.funFact });
      return { blocks, essence: firstSentence(v.content || '') };
    }

    case 'luckyElements': {
      const items = [
        v.luckyDay && { label: 'Lucky day', value: String(v.luckyDay) },
        v.powerTime && { label: 'Power hours', value: String(v.powerTime) },
        v.luckyNumber && { label: 'Number', value: String(v.luckyNumber) },
        v.luckyColor && { label: 'Colour', value: String(v.luckyColor), swatch: String(v.luckyColor) },
      ].filter(Boolean) as { label: string; value: string; swatch?: string }[];
      return { blocks: [{ kind: 'chips', items }], essence: `Their charmed day is ${v.luckyDay || 'coming'}, at their best in the ${String(v.powerTime || '').toLowerCase()}.` };
    }

    case 'basedOnYourAnswers': {
      const blocks: Block[] = [];
      if (v.intro) blocks.push({ kind: 'para', text: v.intro, lead: true });
      if (Array.isArray(v.mappings)) {
        for (const m of v.mappings) {
          blocks.push({ kind: 'labeled', label: `${m.question} · ${m.yourAnswer}`, text: m.usedFor });
        }
      }
      if (v.accuracyNote) blocks.push({ kind: 'para', text: stripQuotes(v.accuracyNote) });
      return { blocks, essence: firstSentence(v.intro || 'Everything you told us shaped their portrait.') };
    }

    case 'quirkDecoder': {
      const blocks: Block[] = [];
      for (const qk of ['quirk1', 'quirk2']) {
        const q = v[qk];
        if (!q) continue;
        if (q.behavior) blocks.push({ kind: 'quote', text: q.behavior });
        if (q.cosmicExplanation) blocks.push({ kind: 'labeled', label: 'What the stars say', text: q.cosmicExplanation });
        if (q.whatItReallyMeans) blocks.push({ kind: 'para', text: q.whatItReallyMeans });
      }
      return { blocks, essence: firstSentence(v.quirk1?.behavior || 'Why they do that weird, wonderful thing.') };
    }

    case 'compatibilityNotes': {
      const blocks: Block[] = [];
      if (v.humanCompatibility) blocks.push({ kind: 'para', text: v.humanCompatibility });
      if (v.relationshipGift) blocks.push({ kind: 'labeled', label: fieldLabel('relationshipGift'), text: v.relationshipGift });
      if (Array.isArray(v.bestPlaymates)) blocks.push({ kind: 'list', label: 'Best playmates', items: v.bestPlaymates });
      if (Array.isArray(v.challengingEnergies)) blocks.push({ kind: 'list', label: 'Trickier matches', items: v.challengingEnergies });
      return { blocks, essence: firstSentence(v.humanCompatibility || 'Who truly fits their soul.') };
    }

    case 'textMessages': {
      const order: { time: string; key: string }[] = [
        { time: 'Morning', key: 'morning' },
        { time: 'Afternoon', key: 'afternoon' },
        { time: 'Night', key: 'night' },
      ];
      const groups = order
        .map(({ time, key: k }) => {
          const block = v[k];
          if (!block) return null;
          const turns: { who: 'pet' | 'human'; text: string }[] = [];
          const pet = block.pet || [];
          const human = block.human || [];
          const maxLen = Math.max(pet.length, human.length);
          for (let i = 0; i < maxLen; i++) {
            if (pet[i]) turns.push({ who: 'pet', text: pet[i] });
            if (human[i]) turns.push({ who: 'human', text: human[i] });
          }
          return { time, turns };
        })
        .filter(Boolean) as { time: string; turns: { who: 'pet' | 'human'; text: string }[] }[];
      return { blocks: [{ kind: 'exchange', groups }], essence: 'A day in texts, if they had thumbs.' };
    }

    case 'cosmicRecipe': {
      const blocks: Block[] = [];
      if (v.description) blocks.push({ kind: 'para', text: v.description });
      if (Array.isArray(v.ingredients)) blocks.push({ kind: 'list', label: 'You will need', items: v.ingredients });
      if (Array.isArray(v.steps)) blocks.push({ kind: 'list', label: 'Method', items: v.steps, ordered: true });
      if (v.cosmicNote) blocks.push({ kind: 'quote', text: stripQuotes(v.cosmicNote) });
      const meta = [v.prepTime, v.servings].filter(Boolean).join(' · ');
      if (meta) blocks.push({ kind: 'labeled', label: v.name || 'Recipe', text: meta });
      return { blocks, essence: firstSentence(v.description || `Bake them ${v.name || 'a little something'}.`) };
    }

    case 'petMonologue': {
      const blocks: Block[] = [];
      if (v.monologue) {
        // split the long monologue into breathable beats
        const parts = v.monologue.split(/(?<=[.!?])\s+(?=[A-Z])/).reduce((acc: string[], s: string) => {
          const last = acc[acc.length - 1];
          if (last && (last.length < 180)) acc[acc.length - 1] = `${last} ${s}`;
          else acc.push(s);
          return acc;
        }, []);
        for (const p of parts) blocks.push({ kind: 'para', text: p });
      }
      if (v.postScript) blocks.push({ kind: 'quote', text: stripQuotes(v.postScript) });
      return { blocks, essence: 'Sixty seconds, if they could talk.' };
    }

    case 'directMessage': {
      const blocks: Block[] = [];
      if (v.preamble) blocks.push({ kind: 'para', text: v.preamble, lead: true });
      if (v.message) blocks.push({ kind: 'quote', text: stripQuotes(v.message), cite: v.signoff ? cleanTitle(v.signoff.replace(/^—\s*/, '')) : undefined });
      return { blocks, essence: firstSentence(v.message || 'The one thing they most want you to know.') };
    }

    case 'celestialGem': {
      const blocks: Block[] = [];
      if (v.crystalName) blocks.push({ kind: 'chips', items: [{ label: 'The stone', value: v.crystalName, swatch: v.crystalColor }] });
      if (v.crystalMeaning) blocks.push({ kind: 'para', text: v.crystalMeaning });
      if (v.howToUse) blocks.push({ kind: 'labeled', label: fieldLabel('howToUse'), text: v.howToUse });
      if (v.placement) blocks.push({ kind: 'labeled', label: fieldLabel('placement'), text: v.placement });
      return { blocks, essence: v.crystalName ? `${v.crystalName}. ${firstSentence(v.crystalMeaning || '', 90)}` : firstSentence(v.crystalMeaning || '') };
    }

    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/* normalize one section into a card                                          */
/* -------------------------------------------------------------------------- */

function normalize(key: string, tier: CardTier, ctx: RevealReport): CardModel | null {
  const v = ctx.report[key];
  if (v == null) return null;

  const meta = META[key] || { glyph: 'sparkle', glyphType: 'icon' as GlyphType };
  const isString = typeof v === 'string';

  let blocks: Block[];
  let essence: string;
  let title: string;

  if (isString) {
    title = meta.kicker || titleCase(key);
    blocks = [{ kind: 'para', text: v, lead: true }];
    essence = firstSentence(v);
  } else {
    const b = bespoke(key, v, ctx) ?? genericBlocks(v);
    blocks = b.blocks;
    essence = b.essence || firstSentence(String(v.content || v.description || ''));
    title = cleanTitle(v.title || '') || meta.kicker || titleCase(key);
  }

  if (!blocks.length) return null;

  // hero sign label (Sun/Moon/Rising)
  let signLabel: string | undefined;
  const planetMap: Record<string, string> = { solarSoulprint: 'sun', lunarHeart: 'moon', starlitGaze: 'ascendant' };
  if (planetMap[key]) {
    const pl = ctx.report.chartPlacements?.[planetMap[key]];
    if (pl?.sign) {
      const noun = key === 'starlitGaze' ? 'Rising' : key === 'lunarHeart' ? 'Moon' : 'Sun';
      signLabel = `${pl.sign} ${noun}`;
    }
  }

  const accentHex = key === 'celestialGem'
    ? (v.crystalColor as string)
    : key === 'luminousField'
      ? (v.primaryColor as string)
      : undefined;

  return {
    key,
    tier,
    tone: meta.tone || 'default',
    glyph: meta.glyph,
    glyphType: meta.glyphType,
    kicker: meta.kicker,
    title,
    essence,
    blocks,
    accentHex,
    signLabel,
  };
}

/* -------------------------------------------------------------------------- */
/* the 7 chapters                                                             */
/* -------------------------------------------------------------------------- */

interface ChapterDef {
  id: string;
  numeral: string;
  title: string;
  subtitle: string;
  memorialSubtitle?: string;
  washA: string;
  washB: string;
  accent: string;
  motif?: ChapterMotif;
  special?: 'invocation' | 'legacy';
  sections: [string, CardTier][];
}

const DEFS: ChapterDef[] = [
  {
    id: 'invocation', numeral: 'I', title: 'Invocation',
    subtitle: 'Before the reading begins, the sky settles into a shape only they were born under.',
    memorialSubtitle: 'Before we remember, the sky settles into the shape they were born under.',
    washA: '#241a4d', washB: '#0b0616', accent: '#6E45D8', special: 'invocation',
    sections: [['prologue', 'hero'], ['firstMeeting', 'card'], ['nameMeaning', 'delight']],
  },
  {
    id: 'essence', numeral: 'II', title: 'Essence',
    subtitle: 'Sun, Moon and Rising. The three lights that make them unmistakably themselves.',
    washA: '#3a2170', washB: '#150f33', accent: '#8a5cf0',
    sections: [
      ['solarSoulprint', 'hero'], ['lunarHeart', 'hero'], ['starlitGaze', 'hero'],
      ['eternalArchetype', 'card'], ['elementalNature', 'card'], ['basedOnYourAnswers', 'delight'],
    ],
  },
  {
    id: 'inner-world', numeral: 'III', title: 'Inner World',
    subtitle: 'How they think, how they love, and how they move through an ordinary afternoon.',
    washA: '#5a2585', washB: '#1a1038', accent: '#b054d6',
    motif: { el: 'fire', label: 'Fire', line: 'The spark that sets them moving.' },
    sections: [
      ['cosmicCuriosity', 'hero'], ['harmonyHeartbeats', 'hero'], ['spiritOfMotion', 'hero'],
      ['quirkDecoder', 'card'], ['memePersonality', 'delight'], ['datingProfile', 'delight'],
    ],
  },
  {
    id: 'social-soul', numeral: 'IV', title: 'Social Soul',
    subtitle: 'How they grew, what they teach you, and the quiet contract you two have kept.',
    washA: '#2d2a72', washB: '#120f30', accent: '#6E45D8',
    motif: { el: 'earth', label: 'Earth', line: 'The ground they hold you to.' },
    sections: [
      ['cosmicExpansion', 'hero'], ['cosmicLessons', 'hero'], ['keepersBond', 'hero'],
      ['earthlyExpression', 'card'], ['dreamJob', 'delight'], ['cosmicRecipe', 'delight'],
    ],
  },
  {
    id: 'hidden-depths', numeral: 'V', title: 'Hidden Depths',
    subtitle: 'The parts kept below the surface. The dream, the shadow, and the wound they came to heal.',
    memorialSubtitle: 'The parts kept below the surface. The dream, the shadow, and the tender wound they carried.',
    washA: '#3d1c52', washB: '#0f0a22', accent: '#9a4fbf',
    motif: { el: 'water', label: 'Water', line: 'The deep they feel everything from.' },
    sections: [
      ['wildSpirit', 'hero'], ['luminousField', 'hero'], ['shadowSelf', 'hero'],
      ['gentleHealer', 'hero'], ['celestialGem', 'card'], ['luckyElements', 'delight'],
    ],
  },
  {
    id: 'crossroads', numeral: 'VI', title: 'Crossroads',
    subtitle: 'Where the paths crossed, and why the two of you found each other at all.',
    washA: '#6a2a6a', washB: '#1a1030', accent: '#c25aa8',
    motif: { el: 'air', label: 'Air', line: 'The current that carried you together.' },
    sections: [
      ['destinyCompass', 'hero'], ['celestialChoreography', 'card'], ['petOwnerFriction', 'card'],
      ['compatibilityNotes', 'card'], ['villainOriginStory', 'delight'], ['topFiveCrimes', 'delight'],
      ['accuracyMoments', 'delight'], ['textMessages', 'delight'],
    ],
  },
  {
    id: 'legacy', numeral: 'VII', title: 'Legacy',
    subtitle: 'Everything the stars said, gathered into one soul, and a keepsake to hold them close.',
    memorialSubtitle: 'Everything the stars said, gathered into one soul, carried with you always.',
    washA: '#5c3aa0', washB: '#1c1440', accent: '#D4AF37', special: 'legacy',
    sections: [['epilogue', 'hero'], ['petMonologue', 'hero'], ['directMessage', 'hero']],
  },
];

export function buildChapters(data: RevealReport): ChapterModel[] {
  return DEFS.map((def, i) => {
    const isMemorial = data.occasionMode === 'memorial';
    const cards = def.sections
      .map(([key, tier]) => normalize(key, tier, data))
      .filter(Boolean) as CardModel[];
    return {
      id: def.id,
      index: i + 1,
      numeral: def.numeral,
      title: def.title,
      subtitle: (isMemorial && def.memorialSubtitle) ? def.memorialSubtitle : def.subtitle,
      washA: def.washA,
      washB: def.washB,
      accent: def.accent,
      hero: CHAPTER_HERO[def.id] || 'ch1-invocation',
      motif: def.motif,
      cards,
      special: def.special,
    };
  });
}
