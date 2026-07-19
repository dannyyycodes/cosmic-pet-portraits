import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocalizedPrice } from '@/hooks/useLocalizedPrice';
import { REVIEWS } from '@/components/funnel-v2/DossierCheckout';

/* ═══════════════════════════════════════════════════════════════════
   GIFT PAGE v10 — cosmic purple + white, matched to the live readings
   funnel (funnel-v2 design system). Fraunces display / Newsreader
   body. Violet metal CTAs. Star gold appears ONLY as review-star
   fills.

   v10 life pass (Danny, 2026-07-17): echo sentences cut page-wide
   (one sentence lands, no explainer after it); occasion picker
   reimagined as four scene cards with bespoke scene SVGs; aurora
   nebula layer + alternating tint bands + glow-lifted hover/press
   states for depth. Entrances 550-600ms ease-out, feedback under
   250ms, no bounce, reduced-motion kill intact.
   · ZERO stock icons — every mark is a bespoke inline SVG drawn for
     this page (one stroke system: 1.6 weight, round caps, celestial
     geometry, currentColor; scenes on a 120×88 grid).
   · Layered depth: aurora plane + three-plane parallax star field via
     CSS scroll-driven animation (@supports gated, reduced-motion off).
   · The emotional argument arrives beat by beat on scroll — four
     short lines rising one at a time, never a paragraph wall.
   · No em-dashes in visible copy (the localized-billing note is
     preserved byte-identical by mandate).

   v11 alternating-bands pass (Danny, 2026-07-18): warm cream light
   sections (how-it-works, reviews, FAQ) between the dark cosmic
   ones. Opaque envelope-paper grounds with crisp letterpress seams;
   aubergine ink + darkened violet accents on cream. ScenesBand
   rebuilt as full-bleed envelope photo breaks. Dark zones tinted
   along a temperature arc (early indigo, late plum) so the checkout
   reads as deep night again. No gold/amber chrome anywhere; star
   fills stay the one gold exception.

   The interactive purchase funnel (occasion picker → tier cards →
   3-step flow → purchase-gift-certificate) is preserved
   byte-compatible; only the presentation shell changes.
   ═══════════════════════════════════════════════════════════════════ */

type DeliveryMethod = 'email' | 'link';

type GiftOccasion = 'discover' | 'new' | 'memorial' | 'birthday';

interface GiftRecipient {
  id: string;
  name: string;
  email: string;
  // Gifter can pre-specify what kind of reading this recipient gets.
  // Defaults to 'discover' so legacy behaviour is unchanged; buyer changes
  // it per recipient if they're gifting a new-pet or memorial reading.
  occasion?: GiftOccasion;
}

/* ═══ BESPOKE GLYPH SET ═════════════════════════════════════════════
   One geometry system for every mark on the page: 24-unit grid,
   1.6 stroke, round caps and joins, currentColor. Micro-stars and
   dots are the only fills. Drawn for this page — no icon library. ═══ */

type GlyphProps = { className?: string };

const glyphBase: React.SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

/** Fine left arrow — nav + step backs. */
function GlyphArrow({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M19.5 12H4.8" />
      <path d="M11 5.6 4.6 12l6.4 6.4" />
    </svg>
  );
}

/** Fine right chevron — continue affordances. */
function GlyphChevron({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M9.3 5.4 15.9 12l-6.6 6.6" />
    </svg>
  );
}

function GlyphPlus({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M12 5.2v13.6M5.2 12h13.6" />
    </svg>
  );
}

function GlyphCross({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M6.6 6.6l10.8 10.8M17.4 6.6 6.6 17.4" />
    </svg>
  );
}

function GlyphCheck({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M5.4 12.8l4.1 4.3 9.1-10.2" />
    </svg>
  );
}

/** The soul star — the page's four-point celestial mark. */
function GlyphStar({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M12 3.2c.55 3.7 2.2 5.9 8.2 8.8-6 2.9-7.65 5.1-8.2 8.8-.55-3.7-2.2-5.9-8.2-8.8 6-2.9 7.65-5.1 8.2-8.8z" />
    </svg>
  );
}

/** Bespoke double-quote mark — the review spotlight watermark. Filled,
   drawn for this page (not from the stroke grid; a solid display glyph). */
function GlyphQuote({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 32" className={className} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M0 32V18.4C0 8.7 5.5 1.9 15.8 0l1.9 4.4C12.1 6.5 9.4 9.6 9.1 13.8h6.5V32H0zm22.5 0V18.4C22.5 8.7 28 1.9 38.3 0L40.2 4.4C34.6 6.5 31.9 9.6 31.6 13.8h6.5V32H22.5z" />
    </svg>
  );
}

/** A small constellation of souls — the multi-gift mark. */
function GlyphSoulFew({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M9.6 8.6c.4 2.6 1.6 4.2 5.9 6.3-4.3 2.1-5.5 3.7-5.9 6.3-.4-2.6-1.6-4.2-5.9-6.3 4.3-2.1 5.5-3.7 5.9-6.3z" />
      <path d="M17.8 3.2c.22 1.5.9 2.4 3.2 3.5-2.3 1.1-2.98 2-3.2 3.5-.22-1.5-.9-2.4-3.2-3.5 2.3-1.1 2.98-2 3.2-3.5z" />
    </svg>
  );
}

/** Moon-dial clock — "ready in minutes". */
function GlyphMoonClock({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4v4.9l3.2 1.9" />
    </svg>
  );
}

/** Comet with motion trails — arrives instantly, nothing to ship. */
function GlyphComet({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M15.4 5.2c.4 2.5 1.6 4.1 5.4 5.9-3.8 1.8-5 3.4-5.4 5.9-.4-2.5-1.6-4.1-5.4-5.9 3.8-1.8 5-3.4 5.4-5.9z" />
      <path d="M3.2 8.6h4.4M2.6 12.4h5.6M4.4 16.2h4" />
    </svg>
  );
}

/** Keepsake lock — private, no price shown. */
function GlyphLock({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <rect x="6.4" y="10.6" width="11.2" height="9" rx="2.2" />
      <path d="M8.8 10.6V8.2a3.2 3.2 0 0 1 6.4 0v2.4" />
      <circle cx="12" cy="15.1" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Planet in orbit with its moon — the real chart. */
function GlyphOrbit({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <circle cx="12" cy="12" r="4.1" />
      <ellipse cx="12" cy="12" rx="9.6" ry="3.6" transform="rotate(-18 12 12)" />
      <circle cx="20" cy="8.1" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Calendar with a soul star — valid a full year. */
function GlyphCalendar({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <rect x="3.8" y="5.6" width="16.4" height="14.2" rx="2.4" />
      <path d="M3.8 10.2h16.4M8.3 3.4v3.4M15.7 3.4v3.4" />
      <path d="M12 12.1l.75 1.85 1.85.75-1.85.75L12 17.3l-.75-1.85-1.85-.75 1.85-.75z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Ribboned gift box. */
function GlyphGift({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <rect x="4.4" y="11.2" width="15.2" height="8.6" rx="1.8" />
      <rect x="3.6" y="7.6" width="16.8" height="3.6" rx="1.2" />
      <path d="M12 7.6v12.2" />
      <path d="M12 7.6C11 4.9 8.9 3.6 7.5 4.6c-1.5 1.1.3 3 4.5 3zM12 7.6c1-2.7 3.1-4 4.5-3 1.5 1.1-.3 3-4.5 3z" />
    </svg>
  );
}

/** Two threads joined — the magic link. */
function GlyphThread({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M10.6 13.4a3.9 3.9 0 0 1 0-5.5l2.4-2.4a3.9 3.9 0 0 1 5.5 5.5l-1.7 1.7" />
      <path d="M13.4 10.6a3.9 3.9 0 0 1 0 5.5l-2.4 2.4a3.9 3.9 0 0 1-5.5-5.5l1.7-1.7" />
    </svg>
  );
}

/** Sealed envelope — direct gift email. */
function GlyphEnvelope({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <rect x="3.4" y="5.8" width="17.2" height="12.6" rx="2.2" />
      <path d="M4.2 7l7.8 6.2L19.8 7" />
    </svg>
  );
}

/** Guardian seal — the guarantee. */
function GlyphSeal({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M12 3.1 19.2 6v5.3c0 4.7-2.9 7.8-7.2 9.6-4.3-1.8-7.2-4.9-7.2-9.6V6L12 3.1z" />
      <path d="M12 8.4l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Paw — four toes and a pad, drawn in the house stroke. */
function GlyphPaw({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <circle cx="7.1" cy="10.1" r="1.5" />
      <circle cx="10.3" cy="7.5" r="1.55" />
      <circle cx="13.7" cy="7.5" r="1.55" />
      <circle cx="16.9" cy="10.1" r="1.5" />
      <path d="M12 11.7c2.8 0 5 2.1 5 4.2 0 1.6-1.4 2.7-2.9 2.3-.9-.2-1.4-.55-2.1-.55s-1.2.35-2.1.55c-1.5.4-2.9-.7-2.9-2.3 0-2.1 2.2-4.2 5-4.2z" />
    </svg>
  );
}

/** New growth — the just-arrived soul. */
function GlyphSprout({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M12 20.4v-7.2" />
      <path d="M12 13.2c0-3.5-2.7-6.3-6.2-6.3 0 3.5 2.7 6.3 6.2 6.3z" />
      <path d="M12 13.2c0-3.5 2.7-6.3 6.2-6.3 0 3.5-2.7 6.3-6.2 6.3z" />
    </svg>
  );
}

/** A candle held lit — memorial. */
function GlyphCandle({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <path d="M12 3.4c1.5 1.9 2.3 3.2 2.3 4.4a2.3 2.3 0 1 1-4.6 0c0-1.2.8-2.5 2.3-4.4z" />
      <path d="M12 10.1v1.7" />
      <rect x="9.2" y="12.6" width="5.6" height="7.6" rx="1.1" />
    </svg>
  );
}

/** One candle on the cake — birthday. */
function GlyphCake({ className }: GlyphProps) {
  return (
    <svg {...glyphBase} className={className}>
      <rect x="4.6" y="12.6" width="14.8" height="6.9" rx="1.5" />
      <path d="M4.6 15.9c1.2 1.15 2.35 1.15 3.55 0s2.35-1.15 3.55 0 2.35 1.15 3.55 0 2.35-1.15 3.55 0" />
      <path d="M12 9.2v3.4" />
      <path d="M12 4.3c.8 1.05 1.2 1.75 1.2 2.4a1.2 1.2 0 1 1-2.4 0c0-.65.4-1.35 1.2-2.4z" />
    </svg>
  );
}

/* ═══ OCCASION SCENES ═══════════════════════════════════════════════
   Four larger scene drawings for the occasion cards — same house
   geometry (round caps, currentColor, star fills only), drawn on a
   120×88 scene grid so each occasion gets real art, not a list row. ═══ */

const sceneBase: React.SVGProps<SVGSVGElement> = {
  viewBox: '0 0 120 88',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

type GlyphComponent = (props: GlyphProps) => JSX.Element;

type GiftOccasionOption = { value: GiftOccasion; Glyph: GlyphComponent; label: string; hint: string };

const GIFT_OCCASION_OPTIONS: GiftOccasionOption[] = [
  { value: 'discover', Glyph: GlyphPaw, label: 'Discover', hint: 'For a pet they already have' },
  { value: 'new', Glyph: GlyphSprout, label: 'New Pet', hint: 'They just got a new pet' },
  { value: 'memorial', Glyph: GlyphCandle, label: 'Memorial', hint: 'They lost a beloved pet' },
  { value: 'birthday', Glyph: GlyphCake, label: 'Birthday', hint: 'Celebrating their pet' },
];

// Prices come from useLocalizedPrice() at render time — this const only
// holds static copy. Price mapping: essential → prices.basic/wasBasic,
// portrait → prices.premium/wasPremium.
const TIERS = {
  essential: {
    label: 'Soul Reading',
    tagline: 'The reading they\'ll keep coming back to.',
    badge: null as string | null,
    features: [
      'A 30-section reading written for their pet',
      'Their pet\'s photo, woven into the reveal',
      'Theirs forever, on any device',
    ],
  },
  portrait: {
    label: 'Soul Bond',
    tagline: 'Them and their pet, read side by side.',
    badge: 'MOST CHOSEN' as string | null,
    popular: true,
    features: [
      'Everything in Soul Reading, plus:',
      'Their chart against their pet\'s: why the universe paired them',
      'The soul-reasons they found each other',
    ],
  },
} as const;

// ─── Occasion-specific tier overrides ─────────────────────────────────
//
// Different occasions call for different tier framing. Memorial
// intentionally has NO `essential` entry — the memorial product is one
// single offering at the Soul Bond price, matching the main funnel.
type TierContent = {
  label: string;
  tagline: string;
  badge: string | null;
  features: readonly string[];
};
type OccasionTiers = Partial<Record<TierKey, TierContent>>;

const OCCASION_TIERS: Record<GiftOccasion, OccasionTiers> = {
  new: {
    essential: {
      label: 'The Welcome Reading',
      tagline: 'For the new soul they just brought home.',
      badge: null,
      features: [
        'Who this pet actually is, before they even know themselves',
        'Why this pet landed in their life now',
        'Theirs forever, on any device',
      ],
    },
    portrait: {
      label: 'The Welcome Bond',
      tagline: 'The pairing the universe just made, written in full.',
      badge: 'MOST GIFTED',
      features: [
        'Everything in the Welcome Reading, plus:',
        'Their chart × their pet\'s: why the stars paired them now',
        'The first-chapter bond, written in full',
      ],
    },
  },
  discover: {
    essential: {
      label: 'The Discover Reading',
      tagline: 'The pet they\'ve loved for years, finally written down.',
      badge: null,
      features: [
        'The quirks they\'ve always sensed, finally named',
        'Their pet\'s photo, woven into the reveal',
        'Theirs forever, on any device',
      ],
    },
    portrait: {
      label: 'The Discover Bond',
      tagline: 'Them and their pet, read side by side. The proof it was meant to be.',
      badge: 'MOST GIFTED',
      features: [
        'Everything in the Discover Reading, plus:',
        'Their chart × their pet\'s: the cosmic reason this bond exists',
        'The answer to the question they\'ve always wondered',
      ],
    },
  },
  memorial: {
    portrait: {
      label: 'The Memorial Reading',
      tagline: 'For the pet who\'s gone, and the person still talking to them.',
      badge: 'A TRIBUTE',
      features: [
        'Honours the pet they lost. Not the loss.',
        'Their chart × their pet\'s: the bond that didn\'t end',
        'Theirs forever, a keepsake for the hard days',
      ],
    },
  },
  birthday: {
    essential: {
      label: 'The Birthday Reading',
      tagline: 'For the pet whose birthday matters more than their own.',
      badge: null,
      features: [
        'A reading written for who their pet actually is',
        'The year ahead, written by the stars',
        'Theirs forever, on any device',
      ],
    },
    portrait: {
      label: 'The Birthday Bond',
      tagline: 'Birthday gift + soulmate proof. Them and their pet, side by side.',
      badge: 'MOST GIFTED',
      features: [
        'Everything in the Birthday Reading, plus:',
        'Their chart × their pet\'s: how their souls celebrate together',
        'The cosmic reason this bond began',
      ],
    },
  },
};

// Desire-framed kicker above tier cards. Tells the gifter what the
// recipient will DO with it — not what it is.
const OCCASION_TIER_KICKER: Record<GiftOccasion, string> = {
  new:      'What they\'ll open first',
  discover: "What they'll read twice",
  memorial: 'What they\'ll return to on the hard days',
  birthday: 'What makes this birthday the one',
};

// Subtle visual accent per occasion — a soft coloured ring that frames
// the tier cards per occasion. Memorial resolves to moon silver (the
// page palette is violet + white only; no gold chrome anywhere).
const OCCASION_ACCENT: Record<GiftOccasion, { ring: string; badge: string }> = {
  new:      { ring: 'rgba(154,126,230,0.30)', badge: '#9a7ee6' }, // violet soft (fresh beginning)
  discover: { ring: 'rgba(154,126,230,0.32)', badge: '#9a7ee6' }, // violet (mystery/reveal)
  memorial: { ring: 'rgba(200,196,216,0.30)', badge: '#b8b2cc' }, // moon silver (honouring)
  birthday: { ring: 'rgba(185,165,240,0.32)', badge: '#b9a5f0' }, // violet bright (celebration)
};

type TierKey = keyof typeof TIERS;

const getVolumeDiscount = (count: number): number => {
  if (count >= 5) return 0.30;
  if (count >= 4) return 0.25;
  if (count >= 3) return 0.20;
  if (count >= 2) return 0.15;
  return 0;
};

/* ── The wall of love. Sanctioned set ONLY — every quote is verbatim
   from the approved reviews (REVIEWS in DossierCheckout + the landing
   ReviewsWall). Curated for the gift audience: gifter voices first, then
   the strongest recognition and accuracy proofs, honest four-star voices
   kept in so the wall reads real. The gift spotlight (Mo) is rendered
   separately above, so it never repeats here. Never write new ones,
   never invent a name, star count, or number. ── */
type GifterReview = { img: string; alt: string; stars: number; quote: string; attr: string };
const GIFTER_CARDS: GifterReview[] = [
  {
    img: '/reviews/review-16.webp', alt: 'Loki', stars: 5,
    quote: "Sam was openly dismissive when I ordered Loki's reading, mainly because astrology is not their thing. Then the reading described a fixed, territorial streak around shared spaces, and Loki had spent that same week blocking our other cat from the Manchester flat's hallway rug. Sam went quiet, read that paragraph twice, and has mentioned Loki's Mars placement more than I have.",
    attr: 'Ben H. · Loki, Maine Coon cat',
  },
  {
    img: '/reviews/review-7.webp', alt: 'Marmite', stars: 5,
    quote: "I ordered Marmite's reading for the anniversary of the day we brought him back to Leeds in a borrowed blanket. It picked up his restless little Mars rhythm by the front door at about 6pm, which is exactly the hour he still starts pacing every October as if the car is coming again. Too specific to brush off, really.",
    attr: 'Freya H. · Marmite, cockapoo',
  },
  {
    img: '/reviews/review-11.webp', alt: 'Fig and Norm', stars: 5,
    quote: "We ordered Fig and Norm's readings together, assuming two dogs in the same Glasgow house would come out much the same. Fig's was all bright Mars, cupboard doors and sudden decisions, while Norm's had this older Beagle patience and a Moon that sounded exactly like him refusing the rain at the back step. Same sofa, same walks, totally different souls.",
    attr: 'Isla M. · Fig and Norm, sprocker spaniel and beagle',
  },
  {
    img: '/reviews/review-1.webp', alt: 'Nell', stars: 5,
    quote: "I thought it was money-for-grief nonsense, if I am honest. Then it mentioned Nell guarding the stairs whenever Saturn feelings show up, and that is exactly where she plants herself when anyone raises a voice, one white sock hanging over the top step. I read that bit twice before I showed my husband.",
    attr: 'Hannah P. · Nell, whippet-lurcher',
  },
  {
    img: '/reviews/review-8.webp', alt: 'Otis', stars: 5,
    quote: "otis spent his first three months under our bed in Cardiff, only coming out after midnight for biscuits. The reading described a guarded Moon placement and a creature who watches the room from a border before choosing anyone. I had not written anything about him being formerly feral, so that line stayed with me.",
    attr: 'Grace O. · Otis, rescue shorthair cat',
  },
  {
    img: '/reviews/review-3.webp', alt: 'Alfie', stars: 5,
    quote: "alfie has a habit of dropping one toy on your foot and then pretending he has nothing to do with it. The reading called out his Venus charm and the little performance before asking to play, which made me laugh in the queue at Tesco. Sent it straight to the family chat.",
    attr: 'Tom W. · Alfie, cocker spaniel',
  },
  {
    img: '/reviews/review-6.webp', alt: 'Tilly', stars: 5,
    quote: "We came back for Tilly six months after doing our first reading for Pip. Pip's is framed in the hallway and I still notice new lines in it when I am putting my shoes on, especially the bit about his Moon softening with age. Tilly's felt different in exactly the way she is different: steadier, slower, still checking every room for us...",
    attr: 'Sarah K. · Tilly, chocolate Labrador',
  },
  {
    img: '/reviews/review-12.webp', alt: 'Bracken', stars: 5,
    quote: "I was not sure a reading would make sense for a horse, especially Bracken, who has opinions about everything at the Devon yard. Then it mentioned a stubborn Saturn edge around thresholds and moving boxes, which is exactly his trailer-loading face on a wet Tuesday. The yard owner laughed because only the people here would know that.",
    attr: 'Emily F. · Bracken, cob-type horse',
  },
  {
    img: '/reviews/review-13.webp', alt: 'Willow', stars: 5,
    quote: "weeks after Willow died, I ordered her reading during a rough patch when the house in Nottingham felt very quiet. It gave me a way to talk with my kids about her little routines, the radiator spot, the paw on the newspaper, the way she chose one person at a time. Nothing overblown. Just enough shape around the missing.",
    attr: 'Daniel K. · Willow, senior cat',
  },
  {
    img: '/reviews/review-9.webp', alt: 'Meg', stars: 4,
    quote: "Meg is fourteen now, grey round the muzzle and slower on the lane behind our house near Sheffield. Her reading did not try to make her sound young again, it spoke about Saturn steadiness and the comfort of doing the same small jobs well. I was glad of that. Only niggle is that it took closer to a day to arrive, rather than the couple of hours I had expected.",
    attr: 'Alan R. · Meg, border collie, fourteen',
  },
  {
    img: '/reviews/review-14.webp', alt: 'Nugget', stars: 4,
    quote: "I did roll my eyes at spending money on a guinea pig of all things, but Nugget's reading had his number. The bit about comfort-seeking Venus and always choosing the covered end of the run was bang on, right down to him ignoring the parsley until he has dragged it under the little red shelter. For less than we paid last month for bedding and hay, it was fair value. I would have liked a cheaper way to add our second guinea pig afterwards.",
    attr: 'Colin B. · Nugget, guinea pig',
  },
];

/* ── Review stars — the ONE gold exception: star fills only. ── */
const STAR_PATH = 'M12 2l2.9 6.26 6.9.6-5.2 4.5 1.55 6.74L12 16.9 5.85 20.1l1.55-6.74-5.2-4.5 6.9-.6L12 2z';

function StarDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        <linearGradient id="gp-star-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8cf8f" />
          <stop offset="55%" stopColor="#c4a265" />
          <stop offset="100%" stopColor="#9a7b4f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StarsRow({ n = 5, size = 15 }: { n?: number; size?: number }) {
  return (
    <span className="gp-stars" aria-label={`${n} out of 5 stars`} role="img">
      {[...Array(5)].map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true"
          style={{ filter: i < n ? 'drop-shadow(0 0 5px rgba(196,162,101,0.28))' : 'none' }}>
          <path d={STAR_PATH} fill={i < n ? 'url(#gp-star-g)' : 'rgba(196,190,220,0.22)'} />
        </svg>
      ))}
    </span>
  );
}

/* ── Fixed cosmos backdrop — three planes of violet star field.
   The far and near planes drift at different rates as the page
   scrolls (CSS scroll-driven animation, @supports gated), so the sky
   has depth without ever touching the text plane. ── */
function CosmicSky() {
  return (
    <div className="gp-sky" aria-hidden="true">
      <div className="gp-sky-base" />
      <div className="gp-sky-aurora" />
      <div className="gp-sky-far" />
      <div className="gp-sky-near" />
    </div>
  );
}

function GiftNav() {
  return (
    <div className="gp-wrap gp-nav">
      <Link to="/" className="gp-back">
        <GlyphArrow /> Back
      </Link>
      <Link to="/" className="gp-wordmark">Little Souls</Link>
      <span className="gp-nav-spacer" aria-hidden="true" />
    </div>
  );
}

/* ── HERO — outcome first. CTA + price + the three gift-fear killers.
   The photo sits inside a depth stack: violet halo, a fine orbit
   ornament drifting slower than the scroll, then the image plane. ── */
function Hero({ fmt, prices, onCta, heroRef }: {
  fmt: (c: number) => string;
  prices: { basic: number };
  onCta: () => void;
  heroRef: React.RefObject<HTMLElement>;
}) {
  return (
    <header className="gp-wrap gp-hero" ref={heroRef as React.RefObject<HTMLElement>}>
      <div className="gp-hero-copy">
        <h1 className="gp-h1 gp-rev">
          We all know how good it feels to get someone <em>a gift they love</em>.
        </h1>
        <p className="gp-turn gp-rev" style={{ ['--d' as string]: '120ms' }}>
          This is one of those.
        </p>
        <p className="gp-lead gp-rev" style={{ ['--d' as string]: '200ms' }}>
          A reading of the soul they love most, built from their pet's <strong>real birth chart</strong>.
        </p>
        <div className="gp-cta-row gp-rev" style={{ ['--d' as string]: '240ms' }}>
          <button type="button" className="gp-cta" onClick={onCta}>Create their gift</button>
          <p className="gp-price-note">from <span>{fmt(prices.basic)}</span></p>
        </div>
      </div>
      <div className="gp-hero-visual gp-rev" style={{ ['--d' as string]: '200ms' }}>
        <svg className="gp-hero-orbit" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
          <ellipse cx="200" cy="200" rx="194" ry="70" transform="rotate(-16 200 200)"
            fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="356" cy="132" r="5" fill="#cfc0f4" stroke="none" />
          <path d="M52 300l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6 1.6-4z" fill="rgba(207,192,244,0.7)" stroke="none" />
          <path d="M340 322l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3 1.3-3.2z" fill="rgba(185,165,240,0.55)" stroke="none" />
        </svg>
        <HeroRotator />
      </div>
    </header>
  );
}

/* ── HERO ROTATOR — every gifting scene, slow crossfade. Envelope
   scenes (the real object: a sealed reveal) lead; box scenes follow.
   Reduced-motion or missing IntersectionObserver just shows frame 1. ── */
const HERO_FRAMES = [
  { src: '/gift-scene-partner-env.webp', alt: 'A woman breaking the violet wax seal of a Little Souls envelope beside her partner, their tabby cat curled against her' },
  { src: '/gift-scene-family-env.webp', alt: 'A daughter kissing her laughing mum at the kitchen table, a wax-sealed Little Souls envelope beside her mug, their golden retriever resting at her side' },
  { src: '/gift-scene-friend-env.webp', alt: 'Two friends on a doorstep at dusk, one holding a wax-sealed Little Souls envelope, their border collie looking up' },
  { src: '/gift-hero-v2.webp', alt: 'Two men on a porch opening a violet Little Souls gift box, their little terrier between them' },
  { src: '/gift-scene-family.webp', alt: 'A father and his daughter opening a Little Souls gift box together, their shaggy dog across their laps' },
  { src: '/gift-scene-friend.webp', alt: 'Two friends opening a violet Little Souls gift box together, their fluffy cat beside them' },
];

function HeroRotator() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setFrame((f) => (f + 1) % HERO_FRAMES.length), 6000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="gp-hero-photo">
      {HERO_FRAMES.map((f, i) => (
        <img
          key={f.src}
          src={f.src}
          alt={i === frame ? f.alt : ''}
          aria-hidden={i !== frame}
          className={`gp-hero-frame ${i === frame ? 'is-front' : ''}`}
          width={1536}
          height={1024}
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={i === 0 ? 'high' : undefined}
        />
      ))}
      <span className="gp-hero-scrim" aria-hidden="true" />
    </div>
  );
}

const CHARITIES = [
  { src: '/badges/ifaw.png', alt: 'IFAW, the International Fund for Animal Welfare', does: 'Rescues animals in crisis worldwide', h: 24, mono: true },
  { src: '/badges/wlt-white.svg', alt: 'World Land Trust', does: 'Buys and protects threatened habitat', h: 46, mono: false },
  { src: '/badges/eden-white.svg', alt: 'Eden, People and Planet', does: 'Plants forests, employs local people', h: 40, mono: false },
];

function TrustStrip() {
  return (
    <section className="gp-wrap gp-trust">
      <p className="gp-give-lead gp-rev">Every reading gives back</p>
      <ul className="gp-give-grid gp-rev" style={{ ['--d' as string]: '90ms' }}>
        {CHARITIES.map((c, i) => (
          <li key={c.src} style={{ ['--d' as string]: `${120 + i * 80}ms` }}>
            <span className={`gp-give-logo ${c.mono ? 'is-mono' : ''}`}><img src={c.src} alt={c.alt} style={{ height: c.h }} loading="lazy" decoding="async" /></span>
            <span className="gp-give-does">{c.does}</span>
          </li>
        ))}
      </ul>
      <a
        className="gp-tp-strip gp-rev"
        style={{ ['--d' as string]: '360ms' }}
        href="https://uk.trustpilot.com/review/littlesouls.app"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Review Little Souls on Trustpilot"
      >
        <span className="gp-tp-lead">Review us on</span>
        <img src="/badges/trustpilot-white.svg" alt="Trustpilot" height={20} loading="lazy" decoding="async" />
      </a>
    </section>
  );
}

/* ── HOW IT WORKS — gift mechanics on the page, not at checkout.
   Each step wears a bespoke icon plaque (no icon libraries). The
   delivery step frames the two real, backend-verified ways to give
   it: emailed with your message, or a private link you present. ── */
function HowItWorks() {
  const steps = [
    { Icon: GlyphStar, n: '01', t: 'Choose their reading', s: 'Pick the occasion and the depth, then write the message they will read the moment it opens.' },
    { Icon: GlyphEnvelope, n: '02', t: 'Give it two ways', s: 'Have us email it to them with your message, at the exact moment you choose. Or take the private link yourself: text it, tuck it in a card, wrap it, or hand it over.' },
    { Icon: GlyphGift, n: '03', t: 'They open the reveal', s: 'They add their pet’s name and birth date. The sky computes, and their reading unfolds like nothing they have opened before.' },
  ];
  return (
    <section className="gp-wrap gp-band gp-cream">
      <div className="gp-shead gp-rev">
        <h2 className="gp-h2">How it works.</h2>
        <p className="gp-support">You need <strong>no pet details</strong>.</p>
      </div>
      <div className="gp-steps">
        {steps.map((st, i) => (
          <div className="gp-step gp-panel gp-rev" key={st.n} style={{ ['--d' as string]: `${i * 90}ms` }}>
            <span className="gp-step-icon" aria-hidden="true"><st.Icon /></span>
            <p className="gp-step-n">Step {st.n}</p>
            <h3>{st.t}</h3>
            <p className="gp-step-s">{st.s}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── PROOF — gifter-voice reviews, verbatim from the sanctioned set. ── */
function GifterProof() {
  const spot = REVIEWS.gift;
  return (
    <section className="gp-wrap gp-band gp-cream gp-cream-deep gp-proof">
      <div className="gp-shead gp-rev">
        <p className="gp-kicker">In their own words</p>
        <h2 className="gp-h2">After they gave it.</h2>
      </div>

      {/* Rating banner — authority up front, no fabricated number. */}
      <div className="gp-rate gp-rev" style={{ ['--d' as string]: '40ms' }}>
        <StarsRow n={5} size={26} />
        <p className="gp-rate-line">Real readings. Real people. Every word below is from someone who loves their pet.</p>
      </div>

      {/* Featured spotlight — the gift review they read first. */}
      <figure className="gp-spotlight gp-rev" style={{ ['--d' as string]: '80ms' }}>
        <span className="gp-spot-quote" aria-hidden="true"><GlyphQuote /></span>
        <StarsRow n={spot.stars} size={20} />
        <blockquote>{spot.quote}</blockquote>
        <figcaption>
          <img src={spot.img} alt={spot.alt} width={52} height={52} loading="lazy" decoding="async" />
          <span>{spot.attr}</span>
        </figcaption>
      </figure>

      {/* The wall — every voice, masonry-packed. */}
      <div className="gp-wall">
        {GIFTER_CARDS.map((r, i) => (
          <figure className="gp-wall-card gp-rev" key={r.attr} style={{ ['--d' as string]: `${Math.min(i, 6) * 70}ms` }}>
            <StarsRow n={r.stars} size={15} />
            <blockquote>{r.quote}</blockquote>
            <figcaption>
              <img src={r.img} alt={r.alt} width={44} height={44} loading="lazy" decoding="async" />
              <span>{r.attr}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <ul className="gp-proof-trust gp-rev" style={{ ['--d' as string]: '120ms' }}>
        <li><GlyphLock /> Secure checkout with Stripe</li>
        <li><GlyphSeal /> If the reading does not feel like them, we refund every cent</li>
        <li><GlyphOrbit /> Built on their pet's real chart</li>
      </ul>
    </section>
  );
}

/* ── THE ARGUMENT — four beats, one at a time, paced by their own
   scroll. Never a paragraph wall. ── */
/* ── SCENES — full-bleed cinematic photo breaks. Each envelope scene
   spans the whole viewport width (the envelope is the true product
   object), one caption line per frame, staggered reveal on scroll.
   Recognition beat: the buyer sees exactly who they're buying for
   right before the funnel. Three labels, zero body copy. ── */
function ScenesBand() {
  const scenes = [
    { src: '/gift-scene-family-env.webp', label: 'For a parent.', alt: 'A daughter kissing her laughing mum at the kitchen table, a wax-sealed Little Souls envelope beside her mug, their golden retriever resting at her side' },
    { src: '/gift-scene-partner-env.webp', label: 'For a partner.', alt: 'A woman breaking the violet wax seal of a Little Souls envelope beside her partner, their tabby cat curled against her' },
    { src: '/gift-scene-friend-env.webp', label: 'For a friend.', alt: 'Two friends on a doorstep at dusk, one holding a wax-sealed Little Souls envelope, their border collie looking up' },
  ];
  return (
    <section className="gp-breaks" aria-label="Who to gift it to">
      {scenes.map((s, i) => (
        <figure className="gp-rev gp-break" style={{ ['--d' as string]: `${i * 90}ms` }} key={s.label}>
          <img src={s.src} alt={s.alt} loading="lazy" decoding="async" width={1536} height={1024} />
          <figcaption>{s.label}</figcaption>
        </figure>
      ))}
    </section>
  );
}

/* ── SUBSTANCE — the honest proof language: real astronomy. ── */
function RigorBand() {
  const items = [
    { v: 'VSOP87', l: 'Ephemeris model' },
    { v: '13', l: 'Celestial bodies' },
    { v: 'J2000', l: 'Reference epoch' },
    { v: '< 0.01°', l: 'Geometric precision' },
  ];
  return (
    <section className="gp-wrap gp-band gp-rigor gp-night-late">
      <div className="gp-shead gp-rev">
        <h2 className="gp-h2">Real astronomy underneath.</h2>
      </div>
      <div className="gp-rigor-stage">
        <svg className="gp-rigor-orbit" viewBox="0 0 760 240" aria-hidden="true" focusable="false">
          <ellipse cx="380" cy="120" rx="356" ry="82" transform="rotate(-6 380 120)"
            fill="none" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="380" cy="120" rx="292" ry="56" transform="rotate(-6 380 120)"
            fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.55" />
          <circle cx="700" cy="66" r="4.5" fill="#cfc0f4" stroke="none" />
          <circle cx="92" cy="176" r="2.5" fill="rgba(185,165,240,0.8)" stroke="none" />
          <path d="M148 44l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6 1.6-4z" fill="rgba(207,192,244,0.7)" stroke="none" />
          <path d="M628 196l1.3 3.2 3.2 1.3-3.2 1.3-1.3 3.2-1.3-3.2-3.2-1.3 3.2-1.3 1.3-3.2z" fill="rgba(185,165,240,0.55)" stroke="none" />
        </svg>
        <div className="gp-rigor-row">
          {items.map((it, i) => (
            <div className="gp-rigor-item gp-rev" style={{ ['--d' as string]: `${80 + i * 90}ms` }} key={it.v}>
              <p className="gp-rigor-v">{it.v}</p>
              <p className="gp-rigor-l">{it.l}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="gp-rigor-line gp-rev" style={{ ['--d' as string]: '440ms' }}>
        Every placement is computed from their own chart.
      </p>
      <ul className="gp-rigor-sources gp-rev" style={{ ['--d' as string]: '520ms' }}>
        <li>
          <span className="gp-src-name">VSOP87 planetary theory</span>
          <span className="gp-src-org">Bretagnon &amp; Francou, Bureau des Longitudes, Paris</span>
        </li>
        <li>
          <span className="gp-src-name">J2000.0 reference epoch</span>
          <span className="gp-src-org">International Astronomical Union standard</span>
        </li>
        <li>
          <span className="gp-src-name">True geocentric sky</span>
          <span className="gp-src-org">The same math professional planetarium software runs</span>
        </li>
      </ul>
    </section>
  );
}

/* ── FAQ — the real gift objections, answered from the real flow. ── */
function FaqSection() {
  const faq = [
    { q: 'Do I need their pet’s details?', a: 'No. They add their pet’s name, birth date and photo when they open it.' },
    { q: 'How does it reach them?', a: 'The moment you pay, you get a private gift link. Text it, tuck it in a card, or have us email it to them.' },
    { q: 'What if the birth date is unknown?', a: 'Their chart can be cast from the day their pet arrived home. A real astrological convention, worked to the same precision.' },
    { q: 'What if they have more than one pet?', a: 'Add a reading for each. Two save 15%, three save 20%, four save 25%, five or more save 30%.' },
    { q: 'When does it expire?', a: 'A full year from the day you buy it.' },
    { q: 'What if it misses?', a: 'If the reading does not feel like them, we refund every cent.' },
  ];
  return (
    <section className="gp-wrap gp-band gp-faq gp-cream">
      <div className="gp-shead gp-rev">
        <h2 className="gp-h2">Before you ask.</h2>
      </div>
      <dl className="gp-faq-list gp-rev" style={{ ['--d' as string]: '100ms' }}>
        {faq.map((f) => (
          <div className="gp-faq-item" key={f.q}>
            <dt>{f.q}</dt>
            <dd>{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ClosingCta({ fmt, prices, onCta }: { fmt: (c: number) => string; prices: { basic: number }; onCta: () => void }) {
  return (
    <section className="gp-wrap gp-band gp-closing gp-night-late">
      <h2 className="gp-h2 gp-rev">Give the reading written in their stars.</h2>
      <div className="gp-cta-row gp-closing-row gp-rev" style={{ ['--d' as string]: '100ms' }}>
        <button type="button" className="gp-cta" onClick={onCta}>Create their gift</button>
        <p className="gp-price-note">from <span>{fmt(prices.basic)}</span></p>
      </div>
      <p className="gp-guarantee gp-rev" style={{ ['--d' as string]: '160ms' }}>
        If the reading does not feel like them, we refund every cent.
      </p>
    </section>
  );
}

function GiftFooter() {
  return (
    <footer className="gp-wrap gp-foot">
      <span>Little Souls</span>
      <span className="gp-foot-hair" aria-hidden="true" />
      <span>read from the day their soul arrived</span>
    </footer>
  );
}

/* ── TIER CARD — violet glass, occasion accent ring, clean price. ── */
function TierCard({
  tierKey, selected, onClick, fmt, cents, wasCents, override, accent: occAccent,
}: {
  tierKey: TierKey; selected: boolean; onClick: () => void;
  fmt: (cents: number) => string;
  cents: number;
  wasCents?: number;
  override?: TierContent;
  accent?: { ring: string; badge: string };
}) {
  const base = TIERS[tierKey];
  const tier = override ?? base;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`gp-tier ${selected ? 'is-selected' : ''}`}
      style={{
        boxShadow: selected
          ? `0 6px 24px rgba(124,92,214,0.35)${occAccent ? `, 0 0 0 5px ${occAccent.ring}` : ''}`
          : `0 2px 12px rgba(0,0,0,0.35)${occAccent ? `, inset 0 0 0 1px ${occAccent.ring}` : ''}`,
      }}
    >
      {tier.badge && (
        <span className="gp-tier-badge" style={{ background: occAccent?.badge ?? '#9a7ee6' }}>
          {tier.badge}
        </span>
      )}

      <div className="gp-tier-head">
        <div className="gp-tier-names">
          <p className="gp-tier-label">{tier.label}</p>
          <p className="gp-tier-tag">{tier.tagline}</p>
        </div>
        <div className="gp-tier-price-wrap">
          {typeof wasCents === 'number' && wasCents > cents && (
            <p className="gp-tier-was">{fmt(wasCents)}</p>
          )}
          <p className="gp-tier-price">{fmt(cents)}</p>
          <p className="gp-tier-once">one-time</p>
        </div>
      </div>

      <div className="gp-tier-features">
        {tier.features.map((f, idx) => {
          const isDivider = f.endsWith(':');
          return (
            <p key={idx} className={isDivider ? 'gp-tier-div' : 'gp-tier-feat'}>
              {!isDivider && <GlyphCheck />}
              <span>{f}</span>
            </p>
          );
        })}
      </div>

      {selected && (
        <div className="gp-tier-selected">
          <p>Selected. Continue below</p>
        </div>
      )}
    </motion.button>
  );
}

export default function GiftPurchase() {
  const [searchParams] = useSearchParams();
  const { fmt, code: currencyCode, currency, isLocalized, prices } = useLocalizedPrice();
  // Map tier key → current-currency cents (mirrors the backend pricing table)
  const TIER_CENTS: Record<TierKey, { cents: number; wasCents: number }> = {
    essential: { cents: prices.basic, wasCents: prices.wasBasic },
    portrait:  { cents: prices.premium, wasCents: prices.wasPremium },
  };
  const [selectedTier, setSelectedTier] = useState<TierKey | null>(null);
  // Top-level gift occasion — memorial/new/discover/birthday. This is the
  // PRIMARY product choice on the page. Defaults to 'discover' so the tier
  // cards and their prices are visible in the natural scroll; the picker
  // still lets the gifter switch occasion.
  const [selectedOccasion, setSelectedOccasion] = useState<GiftOccasion | null>('discover');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('link');
  const [giftType, setGiftType] = useState<'single' | 'multiple' | null>(null);
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_value: number } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [singleRecipient, setSingleRecipient] = useState<GiftRecipient>({ id: crypto.randomUUID(), name: '', email: '', occasion: 'discover' });
  const [recipients, setRecipients] = useState<GiftRecipient[]>([{ id: crypto.randomUUID(), name: '', email: '', occasion: 'discover' }]);

  // Sticky CTA visibility: shown once the hero has scrolled away and the
  // purchase funnel is not on screen.
  const heroRef = useRef<HTMLElement>(null);
  const funnelRef = useRef<HTMLElement>(null);
  const [heroInView, setHeroInView] = useState(true);
  const [funnelInView, setFunnelInView] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const hero = heroRef.current;
    const funnel = funnelRef.current;
    if (!hero || !funnel) return;
    const ioHero = new IntersectionObserver(([e]) => setHeroInView(e.isIntersecting), { threshold: 0.05 });
    const ioFunnel = new IntersectionObserver(([e]) => setFunnelInView(e.isIntersecting), { rootMargin: '0px 0px -10% 0px' });
    ioHero.observe(hero);
    ioFunnel.observe(funnel);
    return () => { ioHero.disconnect(); ioFunnel.disconnect(); };
  }, []);

  // Scroll-reveal for the marketing shell. Reduced motion handled in CSS.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.gp-rev'));
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // When the primary occasion is picked, propagate it to all recipient
  // rows as the default so downstream steps start in the right tone.
  // Per-recipient picker stays editable afterwards for mixed gifts.
  // Also clear the tier selection if switching to Memorial (which only
  // has portrait) — keeps the flow from getting into impossible states.
  const handleOccasionSelect = useCallback((occ: GiftOccasion) => {
    setSelectedOccasion(occ);
    setSingleRecipient(r => ({ ...r, occasion: occ }));
    setRecipients(rs => rs.map(r => ({ ...r, occasion: occ })));
    setSelectedTier((prev) => {
      if (prev === null) return null;
      if (occ === 'memorial' && prev !== 'portrait') return null;
      return prev;
    });
  }, []);

  // Auto-apply promo from URL
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !appliedCoupon) {
      setPromoCode(urlCode.toUpperCase());
      (async () => {
        try {
          const { data } = await supabase.from('coupons').select('id,code,discount_type,discount_value,expires_at,max_uses,current_uses').eq('code', urlCode.toUpperCase()).eq('is_active', true).single();
          if (data && (!data.expires_at || new Date(data.expires_at) >= new Date()) && (!data.max_uses || data.current_uses < data.max_uses)) {
            setAppliedCoupon({ id: data.id, code: data.code, discount_value: data.discount_value });
            setPromoCode('');
          }
        } catch { /* ignore */ }
      })();
    }
  }, [searchParams]);

  const handleTierSelect = (tier: TierKey) => {
    setSelectedTier(tier);
    setStep(1);
    setGiftType(null);
    // Small delay then scroll to flow section
    setTimeout(() => {
      document.getElementById('gift-flow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Hero / closing CTAs drop the visitor onto the first real choice:
  // the occasion picker (which then gates the tier cards + flow).
  const scrollToPicker = useCallback(() => {
    const el = document.querySelector('[role="radiogroup"][aria-label="Gift occasion"]');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const activeRecipients = giftType === 'single' ? [singleRecipient] : recipients;
  const giftCount = activeRecipients.length;
  const discount = getVolumeDiscount(giftCount);

  const pricing = useMemo(() => {
    if (!selectedTier) return { baseTotal: 0, discountAmount: 0, promoAmount: 0, finalTotal: 0 };
    const tierCents = TIER_CENTS[selectedTier].cents;
    const baseTotal = activeRecipients.reduce((sum) => sum + tierCents, 0);
    const discountAmount = Math.round(baseTotal * discount);
    const afterVolume = baseTotal - discountAmount;
    const promoAmount = appliedCoupon ? Math.round(afterVolume * (appliedCoupon.discount_value / 100)) : 0;
    return { baseTotal, discountAmount, promoAmount, finalTotal: afterVolume - promoAmount };
  }, [selectedTier, activeRecipients, discount, appliedCoupon]);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsValidatingPromo(true);
    setPromoError('');
    try {
      const { data } = await supabase.from('coupons').select('id,code,discount_type,discount_value,expires_at,max_uses,current_uses').eq('code', promoCode.trim().toUpperCase()).eq('is_active', true).single();
      if (!data) { setPromoError('Invalid promo code'); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromoError('This code has expired'); return; }
      if (data.max_uses && data.current_uses >= data.max_uses) { setPromoError('This code has reached its limit'); return; }
      setAppliedCoupon({ id: data.id, code: data.code, discount_value: data.discount_value });
      setPromoCode('');
    } catch { setPromoError('Something went wrong'); }
    finally { setIsValidatingPromo(false); }
  };

  const updateSingleRecipient = (field: keyof GiftRecipient, value: string) => {
    setSingleRecipient(r => ({ ...r, [field]: value }));
  };
  const updateRecipient = (id: string, field: keyof GiftRecipient, value: string) => {
    setRecipients(rs => rs.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const canProceedStep2 = () => {
    if (deliveryMethod === 'link') return true;
    if (giftType === 'single') return singleRecipient.email.includes('@');
    return recipients.every(r => r.email.includes('@'));
  };

  const handlePurchase = async () => {
    if (!purchaserEmail.includes('@')) { toast.error('Please enter your email address'); return; }
    if (!selectedTier) return;
    setIsLoading(true);
    try {
      const body = {
        purchaserEmail,
        recipientEmail: giftType === 'single' && deliveryMethod === 'email' ? singleRecipient.email : '',
        recipientName: giftType === 'single' ? (singleRecipient.name || '') : '',
        giftMessage: giftMessage || '',
        giftPets: activeRecipients.map(r => ({
          id: r.id, tier: selectedTier,
          recipientName: r.name || '',
          recipientEmail: deliveryMethod === 'email' ? r.email : null,
          horoscopeAddon: 'none',
          occasion: r.occasion ?? 'discover',
        })),
        deliveryMethod,
        multiRecipient: giftType === 'multiple',
        couponId: appliedCoupon?.id || null,
        currency,
      };

      const { data, error } = await supabase.functions.invoke('purchase-gift-certificate', { body });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      console.error('Gift purchase error:', err);
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const stepCount = 3;
  const stickyVisible = !heroInView && !funnelInView;

  return (
    <div className="gp">
      <CosmicSky />
      <StarDefs />

      <main className="gp-main">
        <GiftNav />

        <Hero fmt={fmt} prices={prices} onCta={scrollToPicker} heroRef={heroRef} />
        <TrustStrip />

        <hr className="gp-hr" />
        {/* cream bands carry their own crisp seams; no violet hr at
            a dark/cream boundary */}
        <HowItWorks />

        <ScenesBand />

        {/* ── CREATE THEIR GIFT — the interactive purchase funnel.
             Occasion picker gates the tier cards, which drive
             handleTierSelect and the preserved 3-step flow. All
             logic/state/handlers unchanged; presentation is new. ── */}
        <section className="gp-wrap gp-band gp-funnel gp-night-late" id="tiers" ref={funnelRef as React.RefObject<HTMLElement>}>
          <div className="gp-shead gp-rev">
            <h2 className="gp-h2">Choose their reading.</h2>
            <p className="gp-support">
              Soul Reading {fmt(prices.basic)} &middot; Soul Bond {fmt(prices.premium)}
            </p>
          </div>

          <div className="gp-funnel-col">

            {/* ── OCCASION PICKER ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 }}
              style={{ marginBottom: 40 }}
            >
              <div className="gp-occ-card">
                <p className="gp-kicker">Start here</p>
                <p className="gp-occ-q">Who's it for?</p>

                <div
                  role="radiogroup"
                  aria-label="Gift occasion"
                  className="gp-occ-grid"
                >
                  {([
                    { value: 'new',      art: '/gift-occ-new.webp',      label: 'They just got a new pet' },
                    { value: 'discover', art: '/gift-occ-years.webp',    label: "They've had their pet for years" },
                    { value: 'memorial', art: '/gift-occ-memorial.webp', label: 'Their pet has passed' },
                    { value: 'birthday', art: '/gift-occ-birthday.webp', label: "It's their pet's birthday" },
                  ] as Array<{ value: GiftOccasion; art: string; label: string }>).map(({ value, art, label }, i) => {
                    const active = selectedOccasion === value;
                    return (
                      <div key={value} className="gp-occ-cell gp-rev" style={{ ['--d' as string]: `${i * 70}ms` }}>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => handleOccasionSelect(value)}
                          className={`gp-occ-cardbtn ${active ? 'is-active' : ''} ${value === 'memorial' ? 'is-mem' : ''}`}
                        >
                          <span className="gp-occ-scene" aria-hidden="true">
                            <img src={art} alt="" width={512} height={512} loading="lazy" decoding="async" />
                          </span>
                          <span className="gp-occ-name">{label}</span>
                          <span className="gp-occ-tick" aria-hidden="true"><GlyphCheck /></span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* ── TIER CARDS — gated on occasion pick. Memorial is
                portrait-only; other occasions render both tiers. ── */}
            <AnimatePresence>
              {selectedOccasion && (
                <motion.div
                  key={`tiers-${selectedOccasion}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="gp-kicker" style={{ marginBottom: 22 }}>
                    {OCCASION_TIER_KICKER[selectedOccasion]}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {(() => {
                      const occTiers = OCCASION_TIERS[selectedOccasion];
                      const accent = OCCASION_ACCENT[selectedOccasion];
                      const visibleKeys: TierKey[] = selectedOccasion === 'memorial'
                        ? ['portrait']
                        : ['essential', 'portrait'];

                      return visibleKeys.map((key) => (
                        <TierCard
                          key={key}
                          tierKey={key}
                          selected={selectedTier === key}
                          onClick={() => handleTierSelect(key)}
                          fmt={fmt}
                          cents={TIER_CENTS[key].cents}
                          wasCents={TIER_CENTS[key].wasCents}
                          override={occTiers?.[key]}
                          accent={accent}
                        />
                      ));
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── FLOW (appears after tier selection) ── */}
            <div id="gift-flow">
              <AnimatePresence>
                {selectedTier && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="gp-flow"
                  >
                    {/* Selected tier reminder */}
                    <div className="gp-flow-reminder">
                      <span>{TIERS[selectedTier].label}</span>
                      <span>{fmt(TIER_CENTS[selectedTier].cents)}</span>
                      <button onClick={() => { setSelectedTier(null); setStep(1); }} className="gp-change">
                        change
                      </button>
                    </div>

                    {/* Step indicator */}
                    <div className="gp-stepper" aria-hidden="true">
                      {[...Array(stepCount)].map((_, idx) => {
                        const s = idx + 1;
                        return (
                          <div key={s} className="gp-stepper-seg">
                            <div className={`gp-stepper-dot ${step >= s ? 'is-on' : ''}`}>
                              {step > s ? <GlyphCheck /> : s}
                            </div>
                            {s < stepCount && <div className={`gp-stepper-bar ${step > s ? 'is-on' : ''}`} />}
                          </div>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait">

                      {/* ── STEP 1: Who? ── */}
                      {step === 1 && (
                        <motion.div key="ds1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                          className="gp-step-col">

                          <p className="gp-flow-q">One gift or a few?</p>

                          <div className="gp-two-col">
                            {[
                              { key: 'single' as const, Glyph: GlyphStar, title: 'One Soul', sub: 'For one cherished pet parent' },
                              { key: 'multiple' as const, Glyph: GlyphSoulFew, title: 'A Few Souls', sub: 'For several gifts at once' },
                            ].map(opt => (
                              <button key={opt.key}
                                onClick={() => {
                                  setGiftType(opt.key);
                                  // Group gifts are link-delivery only: the gift
                                  // email goes to one recipient, so several people
                                  // need their own links to pass on.
                                  if (opt.key === 'multiple') setDeliveryMethod('link');
                                }}
                                className={`gp-choice ${giftType === opt.key ? 'is-on' : ''}`}>
                                {opt.key === 'multiple' && (
                                  <span className="gp-save-chip">SAVE UP TO 30%</span>
                                )}
                                <opt.Glyph className="gp-choice-icon" />
                                <p className="gp-choice-t">{opt.title}</p>
                                <p className="gp-choice-s">{opt.sub}</p>
                              </button>
                            ))}
                          </div>

                          {giftType && (
                            <motion.button
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              onClick={() => setStep(2)}
                              className="gp-cta gp-cta-full"
                            >
                              Continue <GlyphChevron />
                            </motion.button>
                          )}

                          <TrustRow items={['Secure checkout', 'Ready in minutes', 'Valid a full year']} glyphs={[GlyphSeal, GlyphMoonClock, GlyphGift]} />
                        </motion.div>
                      )}

                      {/* ── STEP 2: Delivery + recipient details ── */}
                      {step === 2 && (
                        <motion.div key="ds2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                          className="gp-step-col">

                          <div className="gp-step-head">
                            <button onClick={() => setStep(1)} className="gp-ghost">
                              <GlyphArrow /> Back
                            </button>
                            <p>{giftType === 'single' ? 'Their Details' : 'Add Recipients'}</p>
                            <div style={{ width: 48 }} />
                          </div>

                          {/* Delivery method. Group gifts are link-only: the
                              gift email reaches one recipient, so promising
                              per-person emails on a group order would be
                              false. Each person gets their own link instead. */}
                          <div className="gp-panel gp-pad">
                            <p className="gp-field-label">How should we deliver it?</p>
                            <div className="gp-two-col" style={giftType === 'multiple' ? { gridTemplateColumns: '1fr' } : undefined}>
                              {(giftType === 'multiple'
                                ? [
                                    { key: 'link' as const, Glyph: GlyphThread, title: 'Magic links', sub: 'One link per person. Share each by text, card, or in person', badge: 'How group gifts arrive' },
                                  ]
                                : [
                                    { key: 'link' as const, Glyph: GlyphThread, title: 'Magic link', sub: 'Share via text, card, or in person', badge: 'Most flexible' },
                                    { key: 'email' as const, Glyph: GlyphEnvelope, title: 'Email directly', sub: 'We send a beautiful gift email', badge: null },
                                  ]
                              ).map(opt => (
                                <button key={opt.key} onClick={() => setDeliveryMethod(opt.key)}
                                  className={`gp-choice gp-choice-left ${deliveryMethod === opt.key ? 'is-on' : ''}`}>
                                  {opt.badge && (
                                    <span className="gp-flex-chip">{opt.badge}</span>
                                  )}
                                  <opt.Glyph className="gp-choice-icon gp-choice-icon-sm" />
                                  <p className="gp-choice-t">{opt.title}</p>
                                  <p className="gp-choice-s">{opt.sub}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Single recipient */}
                          {giftType === 'single' && (
                            <div className="gp-panel gp-pad">
                              <p className="gp-field-label">Who's the lucky pet parent?</p>
                              <div className="gp-field-col">
                                <input type="text" className="gp-field" value={singleRecipient.name} onChange={e => updateSingleRecipient('name', e.target.value)} placeholder="Their name (optional)" />
                                {deliveryMethod === 'email' && (
                                  <input type="email" className="gp-field" value={singleRecipient.email} onChange={e => updateSingleRecipient('email', e.target.value)} placeholder="Their email address" />
                                )}
                                <div>
                                  <p className="gp-field-sub">What's this reading for?</p>
                                  <div className="gp-occ-mini-grid">
                                    {GIFT_OCCASION_OPTIONS.map((opt) => {
                                      const selected = (singleRecipient.occasion ?? 'discover') === opt.value;
                                      const isMem = opt.value === 'memorial';
                                      return (
                                        <button
                                          key={opt.value}
                                          type="button"
                                          onClick={() => setSingleRecipient(r => ({ ...r, occasion: opt.value }))}
                                          className={`gp-occ-mini ${selected ? (isMem ? 'is-on-mem' : 'is-on') : ''}`}
                                        >
                                          <span className="gp-occ-mini-t">
                                            <opt.Glyph />
                                            {opt.label}
                                          </span>
                                          <span className="gp-occ-mini-h">{opt.hint}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <p className="gp-help">
                                    Not sure? Leave it on Discover.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Multiple recipients */}
                          {giftType === 'multiple' && (
                            <div className="gp-field-col">
                              {recipients.map((r, idx) => (
                                <div key={r.id} className="gp-panel gp-pad-sm">
                                  <div className="gp-recip-head">
                                    <div className="gp-recip-id">
                                      <span className="gp-recip-n">{idx + 1}</span>
                                      <span className="gp-recip-name">{r.name || `Recipient ${idx + 1}`}</span>
                                    </div>
                                    {recipients.length > 1 && (
                                      <button onClick={() => setRecipients(rs => rs.filter(x => x.id !== r.id))} className="gp-ghost" aria-label={`Remove recipient ${idx + 1}`}>
                                        <GlyphCross />
                                      </button>
                                    )}
                                  </div>
                                  <div className={`gp-recip-fields ${deliveryMethod === 'email' ? 'has-email' : ''}`}>
                                    <input type="text" className="gp-field gp-field-sm" value={r.name} onChange={e => updateRecipient(r.id, 'name', e.target.value)} placeholder="Name" />
                                    {deliveryMethod === 'email' && (
                                      <input type="email" className="gp-field gp-field-sm" value={r.email} onChange={e => updateRecipient(r.id, 'email', e.target.value)} placeholder="Email" />
                                    )}
                                  </div>
                                  <div style={{ marginTop: 10 }}>
                                    <p className="gp-field-sub">What's their reading for?</p>
                                    <div className="gp-occ-chip-row">
                                      {GIFT_OCCASION_OPTIONS.map((opt) => {
                                        const selected = (r.occasion ?? 'discover') === opt.value;
                                        const isMem = opt.value === 'memorial';
                                        return (
                                          <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setRecipients(rs => rs.map(x => x.id === r.id ? { ...x, occasion: opt.value } : x))}
                                            className={`gp-occ-chip ${selected ? (isMem ? 'is-on-mem' : 'is-on') : ''}`}
                                          >
                                            <opt.Glyph />
                                            <span>{opt.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {recipients.length < 10 && (
                                <button
                                  onClick={() => setRecipients(rs => [...rs, { id: crypto.randomUUID(), name: '', email: '', occasion: selectedOccasion ?? 'discover' }])}
                                  className="gp-add-row"
                                >
                                  <GlyphPlus /> Add another person
                                  {discount < 0.30 && (
                                    <span className="gp-add-bonus">
                                      +{Math.round((getVolumeDiscount(recipients.length + 1) - discount) * 100)}% off
                                    </span>
                                  )}
                                </button>
                              )}
                            </div>
                          )}

                          <button onClick={() => setStep(3)} disabled={!canProceedStep2()} className="gp-cta gp-cta-full">
                            Continue to Checkout <GlyphChevron />
                          </button>
                        </motion.div>
                      )}

                      {/* ── STEP 3: Checkout ── */}
                      {step === 3 && (
                        <motion.div key="ds3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                          className="gp-step-col">

                          <div className="gp-step-head">
                            <button onClick={() => setStep(2)} className="gp-ghost">
                              <GlyphArrow /> Back
                            </button>
                            <p>Almost Done</p>
                            <div style={{ width: 48 }} />
                          </div>

                          {/* Gift message first — emotional anchor */}
                          <div>
                            <label className="gp-field-label" htmlFor="gp-message">
                              Write them a message
                            </label>
                            <p className="gp-field-sub" style={{ marginBottom: 8 }}>They'll see this the moment they open their gift.</p>
                            <textarea
                              id="gp-message"
                              className="gp-field"
                              value={giftMessage}
                              onChange={e => setGiftMessage(e.target.value)}
                              placeholder={`From the moment I saw you with your pet, I knew you two were meant to be...`}
                              rows={3}
                              maxLength={500}
                              style={{ resize: 'none' }}
                            />
                          </div>

                          {/* Purchaser email */}
                          <div>
                            <label className="gp-field-label" htmlFor="gp-email">
                              Your email
                              <span className="gp-field-note"> (for your receipt and gift link)</span>
                            </label>
                            <input id="gp-email" type="email" className="gp-field" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} placeholder="your@email.com" />
                          </div>

                          {/* Order summary */}
                          <div className="gp-panel gp-pad">
                            <div className="gp-summary-head">
                              <GlyphGift />
                              <p>Order Summary</p>
                            </div>
                            {activeRecipients.map((r, idx) => (
                              <div key={r.id} className={`gp-summary-row ${idx < activeRecipients.length - 1 ? 'has-hair' : ''}`}>
                                <div className="gp-summary-item">
                                  <GlyphPaw />
                                  <div>
                                    <p className="gp-summary-tier">{TIERS[selectedTier!].label}</p>
                                    {r.name && <p className="gp-summary-for">for {r.name}</p>}
                                  </div>
                                </div>
                                <span className="gp-summary-price">{fmt(TIER_CENTS[selectedTier!].cents)}</span>
                              </div>
                            ))}
                            <div className="gp-summary-totals">
                              {discount > 0 && (
                                <div className="gp-summary-disc">
                                  <span><GlyphStar />{Math.round(discount * 100)}% volume discount</span>
                                  <span>&minus;{fmt(pricing.discountAmount)}</span>
                                </div>
                              )}
                              {pricing.promoAmount > 0 && appliedCoupon && (
                                <div className="gp-summary-disc">
                                  <span><GlyphStar />{appliedCoupon.code} ({appliedCoupon.discount_value}% off)</span>
                                  <span>&minus;{fmt(pricing.promoAmount)}</span>
                                </div>
                              )}
                              <div className="gp-summary-total">
                                <span>Total</span>
                                <span className="gp-summary-total-v">{fmt(pricing.finalTotal)}</span>
                              </div>
                              {isLocalized && (
                                <p className="gp-summary-note">
                                  Shown in {currencyCode} — billed in USD at checkout.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Promo code */}
                          {appliedCoupon ? (
                            <div className="gp-promo-chip">
                              <span>{appliedCoupon.code} applied &middot; {appliedCoupon.discount_value}% off</span>
                              <button onClick={() => setAppliedCoupon(null)} aria-label="Remove promo code">&times;</button>
                            </div>
                          ) : (
                            <div>
                              <div className="gp-promo-row">
                                <input
                                  className="gp-field"
                                  value={promoCode}
                                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                  placeholder="PROMO CODE"
                                  onKeyDown={e => e.key === 'Enter' && applyPromo()}
                                  style={{ flex: 1, textTransform: 'uppercase' }}
                                />
                                <button
                                  onClick={applyPromo}
                                  disabled={!promoCode.trim() || isValidatingPromo}
                                  className="gp-apply"
                                >
                                  {isValidatingPromo ? '...' : 'Apply'}
                                </button>
                              </div>
                              {promoError && <p className="gp-promo-err">{promoError}</p>}
                            </div>
                          )}

                          {/* Risk reversal — directly against the money decision */}
                          <div className="gp-refund">
                            <GlyphSeal />
                            <p>If the reading does not feel like them, we refund every cent.</p>
                          </div>

                          {/* Pay button */}
                          <button
                            onClick={handlePurchase}
                            disabled={isLoading || !purchaserEmail.includes('@')}
                            className="gp-cta gp-cta-full gp-cta-pay"
                          >
                            {isLoading
                              ? <><SpinnerInline />Processing...</>
                              : <><GlyphGift />Send This Gift &middot; {fmt(pricing.finalTotal)}</>
                            }
                          </button>

                          <TrustRow items={['Secure checkout', 'Ready in minutes', 'Valid a full year']} glyphs={[GlyphSeal, GlyphMoonClock, GlyphGift]} />
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>{/* /.gp-funnel-col */}
        </section>

        <GifterProof />

        <hr className="gp-hr" />
        <RigorBand />
        <FaqSection />
        <ClosingCta fmt={fmt} prices={prices} onCta={scrollToPicker} />
        <GiftFooter />
      </main>

      {/* Sticky CTA — appears once the hero scrolls away, hides over the funnel */}
      <div className={`gp-sticky ${stickyVisible ? 'is-shown' : ''}`} aria-hidden={!stickyVisible}>
        <p className="gp-sticky-price">from <span>{fmt(prices.basic)}</span></p>
        <button type="button" className="gp-cta gp-cta-sticky" onClick={scrollToPicker} tabIndex={stickyVisible ? 0 : -1}>
          Create their gift
        </button>
      </div>

      <style>{GP_CSS}</style>
    </div>
  );
}

function SpinnerInline() {
  return (
    <span className="gp-spin" aria-hidden="true" />
  );
}

function TrustRow({ items, glyphs }: { items: string[]; glyphs: GlyphComponent[] }) {
  return (
    <div className="gp-trust-mini">
      {items.map((t, i) => {
        const Glyph = glyphs[i];
        return (
          <span key={i}>
            <Glyph />{t}
          </span>
        );
      })}
    </div>
  );
}

/* ═══ Design system — cosmic purple + white (funnel-v2 tokens).
   Surfaces: sky #0d0a14 · glass violet gradient over #15101c · panel
   #15101c→#110d18. Violet family #b9a5f0/#9a7ee6/#7c5cd6. Star gold
   ONLY on review-star fills. Fraunces display / Newsreader body.
   Motion: --ease-settle entrances via IntersectionObserver, one
   constellation ceremony, parallax sky planes via CSS scroll-driven
   animation (@supports + reduced-motion gated). ═══ */
const GP_CSS = `
.gp{
  --bg:#0d0a14;
  --white:#ffffff;
  --body:#ececf2;
  --muted:#c8c8d2;
  --dim:#9b93b8;
  --vio:#7c5cd6;
  --vio-soft:#9a7ee6;
  --vio-bright:#b9a5f0;
  --vio-pale:#cfc0f4;
  --line:rgba(154,126,230,0.22);
  --line-bright:rgba(185,165,240,0.35);
  --ease-stage:cubic-bezier(0.22,0.7,0.2,1);
  --ease-settle:cubic-bezier(0.16,1,0.3,1);
  position:relative;min-height:100vh;background:var(--bg);overflow-x:hidden;
  color:var(--body);
  font-family:'Newsreader',Georgia,serif;font-weight:400;
  font-size:clamp(18px,1vw + 14px,19px);line-height:1.7;
  -webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;
}
.gp *{box-sizing:border-box;margin:0}
.gp-main{position:relative;z-index:1}
.gp :focus-visible{outline:2px solid #9a7ee6;outline-offset:2px;border-radius:4px}
.gp strong{font-weight:600;color:var(--white)}
.gp button{font:inherit;color:inherit}
.gp input,.gp textarea{font:inherit}

/* ── backdrop: three planes. Base holds the nebula; far and near
   star fields drift upward at different rates as the page scrolls
   (scroll-driven, transform-only, gated). ── */
.gp-sky{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.gp-sky-base{position:absolute;inset:0;background:
  radial-gradient(900px 620px at 82% 0%, rgba(124,92,214,.14), transparent 70%),
  radial-gradient(760px 560px at 6% 8%, rgba(93,71,160,.16), transparent 72%),
  linear-gradient(180deg,#15101c 0%,#100c18 24%,#0d0a14 50%,#0d0a14 100%)}
.gp-sky-aurora{position:absolute;inset:-24% -12%;pointer-events:none;
  filter:blur(46px);mix-blend-mode:screen;
  background:
    radial-gradient(46% 34% at 20% 26%, rgba(124,92,214,.22), transparent 70%),
    radial-gradient(40% 30% at 82% 14%, rgba(185,165,240,.15), transparent 70%),
    radial-gradient(52% 38% at 62% 74%, rgba(98,67,176,.20), transparent 72%)}
.gp-sky-far{position:absolute;inset:-10vh 0;background:
  radial-gradient(1px 1px at 18% 14%, rgba(236,236,242,.34), transparent 60%),
  radial-gradient(1px 1px at 72% 9%, rgba(185,165,240,.28), transparent 60%),
  radial-gradient(1px 1px at 41% 24%, rgba(236,236,242,.26), transparent 60%),
  radial-gradient(1px 1px at 9% 46%, rgba(185,165,240,.22), transparent 60%),
  radial-gradient(1px 1px at 60% 54%, rgba(236,236,242,.2), transparent 60%),
  radial-gradient(1px 1px at 30% 72%, rgba(236,236,242,.18), transparent 60%),
  radial-gradient(1px 1px at 84% 66%, rgba(185,165,240,.2), transparent 60%),
  radial-gradient(1px 1px at 52% 90%, rgba(236,236,242,.16), transparent 60%)}
.gp-sky-near{position:absolute;inset:-16vh 0;background:
  radial-gradient(1.5px 1.5px at 26% 10%, rgba(236,236,242,.5), transparent 60%),
  radial-gradient(1.3px 1.3px at 66% 20%, rgba(185,165,240,.44), transparent 60%),
  radial-gradient(1.4px 1.4px at 88% 34%, rgba(236,236,242,.36), transparent 60%),
  radial-gradient(1.3px 1.3px at 12% 58%, rgba(185,165,240,.34), transparent 60%),
  radial-gradient(1.5px 1.5px at 44% 44%, rgba(236,236,242,.3), transparent 60%),
  radial-gradient(1.3px 1.3px at 78% 74%, rgba(185,165,240,.3), transparent 60%),
  radial-gradient(1.4px 1.4px at 34% 88%, rgba(236,236,242,.26), transparent 60%)}
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    .gp-sky-far{animation:gpSkyFar linear both;animation-timeline:scroll(root)}
    .gp-sky-near{animation:gpSkyNear linear both;animation-timeline:scroll(root)}
    .gp-sky-aurora{animation:gpAurora linear both;animation-timeline:scroll(root)}
  }
}
@keyframes gpSkyFar{to{transform:translateY(-7vh)}}
@keyframes gpSkyNear{to{transform:translateY(-13vh)}}
@keyframes gpAurora{from{transform:translateY(4vh) rotate(0deg)}to{transform:translateY(-9vh) rotate(3deg)}}

/* layout */
.gp-wrap{max-width:1080px;margin:0 auto;padding-left:22px;padding-right:22px}
.gp-band{padding-top:clamp(64px,9vw,104px);padding-bottom:clamp(64px,9vw,104px)}
.gp-hr{height:1px;border:0;max-width:1080px;margin:0 auto;
  background:linear-gradient(90deg,transparent,rgba(154,126,230,0.30) 35%,rgba(185,165,240,0.42) 50%,rgba(154,126,230,0.30) 65%,transparent)}

/* ── temperature arc: dark zones tint along the scroll. Early dark
   (hero + sample) leans indigo night; late dark (funnel, rigor,
   closing) leans deeper plum, so the buy moment reads as a different
   hour of the same night. ── */
.gp-night-early,.gp-night-late{position:relative}
.gp-night-early::before,.gp-night-late::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:100vw;
  transform:translateX(-50%);z-index:-1;pointer-events:none}
.gp-night-early::before{background:linear-gradient(180deg,transparent,rgba(21,16,32,.40) 14%,rgba(15,11,22,.46) 86%,transparent)}
.gp-night-late::before{background:
  radial-gradient(720px 420px at 80% 8%, rgba(124,92,214,.10), transparent 70%),
  linear-gradient(180deg,transparent,rgba(21,16,30,.44) 12%,rgba(15,11,22,.52) 88%,transparent)}

/* ── cream bands: the envelope-paper light sections. Opaque grounds
   (the fixed star sky must never show through), aubergine ink,
   darkened violet accents, crisp letterpress seams top and bottom.
   Texture is pure CSS gradient noise; no image files. ── */
.gp-cream{position:relative;
  --cream:#15101c;--cream-2:#1a1420}
.gp-cream-deep{--cream:#1a1420;--cream-2:#201722}
.gp-cream::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:100vw;
  transform:translateX(-50%);z-index:-1;pointer-events:none;
  background:
    radial-gradient(1100px 520px at 50% 0%, rgba(167,139,250,.10), transparent 72%),
    linear-gradient(180deg,var(--cream),var(--cream-2));
  border-top:1px solid rgba(185,165,240,.26);border-bottom:1px solid rgba(185,165,240,.26);
  box-shadow:inset 0 1px 0 rgba(207,192,244,.12),inset 0 -1px 0 rgba(8,5,18,.7),
    inset 0 30px 46px -30px rgba(167,139,250,.10),inset 0 -30px 46px -30px rgba(8,5,18,.55)}
.gp-cream + .gp-cream::before{border-top:0;
  box-shadow:inset 0 -1px 0 rgba(8,5,18,.7),inset 0 -30px 46px -30px rgba(8,5,18,.55)}
.gp-cream .gp-panel{background:linear-gradient(180deg,#1c1629,#17111f);
  border:1px solid rgba(185,165,240,.20);
  box-shadow:0 1px 2px rgba(8,5,18,.4),0 16px 34px -18px rgba(8,5,18,.7)}
.gp-cream .gp-glass{background:linear-gradient(180deg,#1c1629,#17111f);
  border:1px solid rgba(185,165,240,.20);
  box-shadow:0 1px 2px rgba(8,5,18,.4),0 18px 36px -18px rgba(8,5,18,.7)}
@media (hover:hover){
  .gp-cream .gp-step:hover{border-color:rgba(185,165,240,.42);
    box-shadow:0 18px 36px -16px rgba(124,92,214,.35)}
}

/* type */
.gp-h1{font-family:'Asap',system-ui,sans-serif;font-weight:700;color:var(--white);
  font-size:clamp(2rem,4.8vw,3.25rem);line-height:1.13;letter-spacing:-.017em;text-wrap:balance}
.gp-h1 em{font-style:normal;color:inherit}
.gp-turn{font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:500;color:#d7c9ff;
  font-size:clamp(1.6rem,3.5vw,2.35rem);line-height:1.08;margin-top:14px}
.gp-h2{font-family:'Fraunces',Georgia,serif;font-weight:500;color:var(--white);
  font-size:clamp(1.9rem,4.8vw,3rem);line-height:1.02;letter-spacing:-.018em;text-wrap:balance}
.gp-eyebrow{font-weight:600;font-size:clamp(14px,1.2vw + 9px,15px);letter-spacing:.14em;
  text-transform:uppercase;color:var(--vio-bright)}
.gp-kicker{font-weight:600;font-size:clamp(14px,1.2vw + 9px,15px);letter-spacing:.14em;
  text-transform:uppercase;color:var(--vio-bright);text-align:center}
.gp-lead{font-size:clamp(1.05rem,2.1vw,1.3rem);line-height:1.5;color:var(--body);max-width:34em}
.gp-support{color:var(--muted);font-size:clamp(18px,1vw + 14px,19px);margin-top:12px}
.gp-shead{text-align:center;max-width:720px;margin:0 auto clamp(34px,5vw,52px)}
.gp-shead::after{content:"";display:block;width:56px;height:2px;margin:18px auto 0;border-radius:2px;
  background:linear-gradient(90deg,transparent,#9a7ee6,transparent)}

/* reveal */
.gp-rev{opacity:0;transform:translateY(16px);
  transition:opacity .55s var(--ease-settle),transform .55s var(--ease-settle);
  transition-delay:var(--d,0ms)}
.gp-rev.is-in{opacity:1;transform:none}
@media (prefers-reduced-motion: reduce){
  .gp-rev{opacity:1 !important;transform:none !important;filter:none !important;transition:none !important}
  .gp *,.gp *::before,.gp *::after{animation:none !important;transition:none !important}
}

/* surfaces */
.gp-glass{border-radius:18px;
  background:linear-gradient(180deg,rgba(124,92,214,.13),rgba(124,92,214,.05)),#15101c;
  border:1px solid rgba(154,126,230,.28);
  box-shadow:0 2px 6px rgba(0,0,0,.4),0 14px 34px rgba(0,0,0,.35)}
.gp-panel{border-radius:18px;background:linear-gradient(180deg,#15101c,#110d18);
  border:1px solid rgba(154,126,230,.20)}
.gp-pad{padding:20px}
.gp-pad-sm{padding:16px}

/* CTA — violet metal ramp */
.gp-cta{position:relative;overflow:hidden;display:inline-flex;align-items:center;justify-content:center;gap:10px;
  border:0;cursor:pointer;border-radius:12px;min-height:56px;padding:0 30px;
  font-family:'Newsreader',Georgia,serif;font-weight:600;font-size:clamp(18px,1vw + 14px,19px);letter-spacing:.02em;color:#fff;
  background:linear-gradient(180deg,#9a7ee6 0%,#9a7ee6 18%,#7c5cd6 40%,#5d47a0 56%,#6243b0 80%,#47307f 100%);
  box-shadow:0 1px 0 rgba(255,255,255,.4) inset,0 -1px 0 rgba(0,0,0,.28) inset,0 6px 18px -6px rgba(124,92,214,.45);
  transition:transform .18s var(--ease-stage),box-shadow .18s var(--ease-stage)}
.gp-cta svg{width:19px;height:19px}
.gp-cta::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 42%,rgba(255,255,255,.32) 50%,transparent 58%);
  transform:translateX(-130%);transition:transform .6s ease}
.gp-cta:hover{transform:translateY(-1px);
  box-shadow:0 1px 0 rgba(255,255,255,.4) inset,0 -1px 0 rgba(0,0,0,.28) inset,0 12px 34px -8px rgba(124,92,214,.65)}
.gp-cta:hover::after{transform:translateX(130%)}
.gp-cta:active{transform:scale(.98) translateY(1px);transition-duration:.06s}
.gp-cta:disabled{cursor:default;color:var(--dim);background:rgba(124,92,214,.16);box-shadow:none;transform:none}
.gp-cta:disabled::after{display:none}
.gp-cta-full{width:100%}
.gp-cta-pay{min-height:60px}
.gp-spin{width:18px;height:18px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;
  border-radius:50%;animation:gpspin 1s linear infinite;flex-shrink:0;display:inline-block}
@keyframes gpspin{to{transform:rotate(360deg)}}

/* nav */
.gp-nav{display:flex;align-items:center;justify-content:space-between;padding-top:20px}
.gp-back{display:inline-flex;align-items:center;gap:6px;color:var(--muted);text-decoration:none;
  font-size:16px;transition:color .2s}
.gp-back:hover{color:var(--white)}
.gp-back svg{width:16px;height:16px}
.gp-wordmark{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:21px;letter-spacing:-.01em;
  color:var(--white);text-decoration:none}
.gp-nav-spacer{width:58px}

/* hero */
.gp-hero{display:grid;gap:clamp(30px,5vw,56px);align-items:center;
  padding-top:clamp(40px,7vw,84px);padding-bottom:clamp(48px,7vw,84px)}
@media (min-width:880px){.gp-hero{grid-template-columns:1.05fr .95fr}}
.gp-hero-copy .gp-h1{margin:16px 0 18px}
.gp-cta-row{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:26px}
.gp-price-note{color:var(--muted);font-size:17px}
.gp-price-note span{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:1.25em;color:var(--white)}
.gp-badges{display:flex;flex-wrap:wrap;gap:8px 22px;list-style:none;padding:0;margin-top:22px}
.gp-badges li{display:inline-flex;align-items:center;gap:7px;font-size:15.5px;color:var(--muted)}
.gp-badges svg{width:16px;height:16px;color:var(--vio-soft);flex-shrink:0}
.gp-hero-visual{position:relative}
.gp-hero-visual::before{content:"";position:absolute;inset:-14%;pointer-events:none;
  background:radial-gradient(closest-side, rgba(124,92,214,.30), transparent 72%)}
.gp-hero-orbit{position:absolute;left:-12%;top:-9%;width:124%;height:118%;
  color:rgba(154,126,230,.4);pointer-events:none}
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .gp-hero-orbit{animation:gpOrbDrift linear both;animation-timeline:view();
      animation-range:entry 0% exit 100%}
  }
}
@keyframes gpOrbDrift{from{transform:translateY(16px)}to{transform:translateY(-16px)}}
.gp-hero-photo{position:relative;border-radius:20px;overflow:hidden;
  border:1px solid rgba(154,126,230,.28);
  box-shadow:0 2px 6px rgba(0,0,0,.4),0 24px 54px rgba(0,0,0,.45)}
.gp-hero-photo img{display:block;width:100%;height:auto;max-width:100%}
.gp-hero-photo .gp-hero-frame{position:absolute;inset:0;height:100%;object-fit:cover;opacity:0;
  transition:opacity 1.4s ease}
.gp-hero-photo .gp-hero-frame:first-child{position:relative}
.gp-hero-photo .gp-hero-frame.is-front{opacity:1}
@media (prefers-reduced-motion: reduce){.gp-hero-photo .gp-hero-frame{transition:none}}
.gp-hero-scrim{position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(180deg,rgba(13,10,20,0) 55%,rgba(13,10,20,.55) 100%)}

/* trust strip */
.gp-trust{padding-bottom:clamp(40px,6vw,64px)}
.gp-give-lead{text-align:center;font-weight:600;font-size:13.5px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--vio-bright)}
.gp-give-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px 30px;
  max-width:820px;margin:26px auto 0;list-style:none;padding:0}
.gp-give-grid li{display:flex;flex-direction:column;align-items:center;text-align:center;gap:13px}
.gp-give-logo{display:flex;align-items:center;justify-content:center;height:48px}
.gp-give-logo img{display:block;width:auto;max-width:160px;
  opacity:.9;transition:opacity .25s var(--ease-settle)}
.gp-give-logo.is-mono img{filter:brightness(0) invert(1)}
.gp-give-grid li:hover .gp-give-logo img{opacity:1}
.gp-give-does{font-size:13.5px;line-height:1.4;color:var(--dim);max-width:190px}
.gp-tp-strip{display:flex;align-items:center;justify-content:center;gap:9px;
  width:fit-content;margin:34px auto 0;padding:11px 20px;border-radius:26px;text-decoration:none;
  border:1px solid var(--line);background:rgba(124,92,214,.07);
  transition:border-color .25s var(--ease-settle),background .25s var(--ease-settle)}
.gp-tp-strip:hover{border-color:var(--line-bright);background:rgba(124,92,214,.12)}
.gp-tp-lead{font-size:14px;color:var(--dim)}
.gp-tp-strip img{display:block;height:20px;width:auto}
@media (max-width:560px){
  .gp-give-grid{grid-template-columns:1fr;gap:22px;max-width:280px}
}
.gp-trust-row{display:flex;flex-wrap:wrap;justify-content:center;gap:12px 14px;list-style:none;padding:0}
.gp-trust-row li{display:inline-flex;align-items:center;gap:9px;font-size:16.5px;color:var(--body);
  padding:10px 18px;border-radius:999px;border:1px solid var(--line);
  background:linear-gradient(180deg,rgba(124,92,214,.12),rgba(124,92,214,.04))}
.gp-trust-row svg{width:18px;height:18px;color:var(--vio-bright);flex-shrink:0}

/* sample reading */
/* steps */
.gp-steps{display:grid;gap:16px}
@media (min-width:760px){.gp-steps{grid-template-columns:repeat(3,1fr)}}
.gp-step{padding:clamp(26px,3.4vw,34px);
  transition:transform .25s var(--ease-settle),border-color .2s ease,box-shadow .25s ease}
@media (hover:hover){
  .gp-step:hover{transform:translateY(-4px);border-color:var(--line-bright);
    box-shadow:0 14px 34px -12px rgba(124,92,214,.4)}
  .gp-step:hover .gp-step-icon{transform:translateY(-2px);
    box-shadow:0 12px 28px -10px rgba(124,92,214,.55)}
}
.gp-step-icon{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:15px;
  background:linear-gradient(165deg,rgba(154,126,230,.24),rgba(124,92,214,.10));
  border:1px solid rgba(185,165,240,.30);box-shadow:0 8px 22px -12px rgba(124,92,214,.5);
  transition:transform .25s var(--ease-settle),box-shadow .25s ease}
.gp-step-icon svg{width:26px;height:26px;color:var(--vio-pale)}
.gp-step-n{font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:500;
  font-size:1rem;color:var(--vio-bright);margin:16px 0 6px}
.gp-step h3{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:1.35rem;line-height:1.15;color:var(--white)}
.gp-step-s{margin-top:10px;font-size:16.5px;line-height:1.6;color:var(--muted)}

/* proof */
.gp-stars{display:inline-flex;gap:3px}
.gp-proof .gp-kicker{margin-bottom:13px}

/* featured spotlight — the review they read first, framed on its own
   lifted violet panel with a bespoke quote watermark. */
.gp-rate{text-align:center;max-width:640px;margin:0 auto clamp(28px,4vw,42px)}
.gp-rate .gp-stars{justify-content:center}
.gp-rate-line{margin-top:12px;font-family:'Newsreader',Georgia,serif;font-style:italic;
  font-size:clamp(1.05rem,2.4vw,1.32rem);line-height:1.45;color:#e7dffb}
.gp-spotlight{position:relative;max-width:840px;margin:0 auto clamp(30px,4.4vw,46px);
  padding:clamp(32px,4.6vw,52px) clamp(24px,4.4vw,54px);text-align:center;border-radius:24px;overflow:hidden;
  background:
    radial-gradient(130% 92% at 50% -8%, rgba(167,139,250,.30), transparent 62%),
    linear-gradient(180deg,#221a35,#181221);
  border:1px solid rgba(197,178,255,.40);
  box-shadow:0 1px 0 rgba(207,192,244,.20) inset,0 26px 62px -26px rgba(8,5,18,.92),
    0 0 60px -10px rgba(139,102,246,.42)}
.gp-spotlight::before,.gp-wall-card::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,transparent,#b9a5f0 30%,#e3d9ff 50%,#b9a5f0 70%,transparent);
  opacity:.9}
.gp-spot-quote{position:absolute;top:16px;left:clamp(18px,4vw,40px);line-height:0;
  color:rgba(197,178,255,.26);pointer-events:none}
.gp-spot-quote svg{width:clamp(38px,5.6vw,58px);height:auto}
.gp-spotlight .gp-stars{position:relative}
.gp-spotlight blockquote{position:relative;font-family:'Fraunces',Georgia,serif;font-style:italic;
  font-weight:400;font-size:clamp(1.38rem,2.9vw,1.9rem);line-height:1.42;color:#faf8ff;
  margin:18px auto 24px;max-width:34ch;text-wrap:pretty}
.gp-spotlight figcaption{display:inline-flex;align-items:center;gap:13px;color:var(--vio-pale);
  font-size:17px;letter-spacing:.02em}
.gp-spotlight figcaption img{width:52px;height:52px;border-radius:14px;object-fit:cover;
  border:1px solid rgba(197,178,255,.45);box-shadow:0 6px 16px -8px rgba(8,5,18,.85)}

/* the wall of love — masonry columns of rich violet glass, packed by
   quote length. Big readable body, brighter names, glow-lift on hover. */
.gp-wall{column-count:1;column-gap:18px}
@media (min-width:600px){.gp-wall{column-count:2}}
@media (min-width:1000px){.gp-wall{column-count:3}}
.gp-wall-card{position:relative;overflow:hidden;break-inside:avoid;-webkit-column-break-inside:avoid;
  margin:0 0 18px;padding:24px 22px 21px;border-radius:18px;
  background:
    radial-gradient(120% 78% at 50% -12%, rgba(167,139,250,.26), transparent 60%),
    linear-gradient(180deg,#1d1730,#17111f);
  border:1px solid rgba(167,139,250,.38);
  box-shadow:0 1px 0 rgba(207,192,244,.14) inset,0 18px 42px -22px rgba(8,5,18,.9);
  transition:transform .28s var(--ease-settle),border-color .25s ease,box-shadow .3s ease}
@media (hover:hover){
  .gp-wall-card:hover{transform:translateY(-4px);border-color:rgba(197,178,255,.55);
    box-shadow:0 1px 0 rgba(207,192,244,.16) inset,0 24px 54px -18px rgba(8,5,18,.95),
      0 0 34px -6px rgba(139,102,246,.48)}
}
.gp-wall-card .gp-stars{margin-bottom:2px}
.gp-wall-card blockquote{margin:13px 0 16px;font-size:18px;line-height:1.62;color:#efeaff}
.gp-wall-card figcaption{display:flex;align-items:center;gap:11px;color:var(--vio-pale);
  font-size:15px;line-height:1.4}
.gp-wall-card figcaption img{width:44px;height:44px;border-radius:12px;object-fit:cover;
  border:1px solid rgba(197,178,255,.4);flex:none}

/* the argument — beat by beat */

/* scenes — full-bleed cinematic photo breaks, envelope frames */
.gp-breaks{display:grid;gap:clamp(3px,.5vw,6px)}
.gp-break{position:relative;margin:0;overflow:hidden}
.gp-break img{display:block;width:100%;max-height:62vh;min-height:280px;object-fit:cover;object-position:50% 42%}
.gp-break figcaption{position:absolute;left:0;right:0;bottom:0;
  padding:clamp(70px,11vw,130px) clamp(22px,5vw,64px) clamp(18px,3.2vw,36px);
  font-family:'Fraunces',Georgia,serif;font-style:italic;
  font-size:clamp(1.45rem,3.4vw,2.3rem);line-height:1.1;color:#fff;
  background:linear-gradient(180deg,transparent,rgba(11,7,18,.42) 45%,rgba(11,7,18,.78));
  text-shadow:0 1px 14px rgba(8,5,18,.8)}

/* rigor */
.gp-rigor-sources{list-style:none;margin:34px auto 0;padding:22px 0 0;max-width:860px;
  border-top:1px solid rgba(185,165,240,.18);
  display:flex;justify-content:center;gap:clamp(18px,4vw,52px);flex-wrap:wrap}
.gp-rigor-sources li{display:flex;flex-direction:column;gap:3px;max-width:250px}
.gp-src-name{font-weight:600;font-size:13.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--vio-pale)}
.gp-src-org{font-size:13.5px;color:var(--dim);line-height:1.4}
/* reviews trust row */
.gp-proof-trust{list-style:none;margin:30px auto 0;padding:18px 0 0;max-width:920px;
  border-top:1px solid rgba(185,165,240,.16);
  display:flex;justify-content:center;gap:clamp(14px,3vw,38px);flex-wrap:wrap;
  font-size:14px;color:var(--dim)}
.gp-proof-trust li{display:inline-flex;align-items:center;gap:7px;text-align:left}
.gp-proof-trust svg{width:15px;height:15px;flex:none;color:var(--vio-soft)}
.gp-rigor{text-align:center}
.gp-rigor-stage{position:relative;max-width:760px;margin:0 auto}
.gp-rigor-stage::before{content:"";position:absolute;left:50%;top:50%;width:min(820px,108%);height:190%;
  transform:translate(-50%,-50%);z-index:-1;pointer-events:none;filter:blur(34px);
  background:radial-gradient(closest-side, rgba(124,92,214,.16), transparent 74%)}
.gp-rigor-orbit{position:absolute;left:50%;top:50%;width:min(880px,116%);height:auto;
  transform:translate(-50%,-50%);z-index:-1;pointer-events:none;color:rgba(154,126,230,.34)}
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .gp-rigor-orbit{animation:gpRigorDrift linear both;animation-timeline:view();
      animation-range:entry 0% exit 100%}
  }
}
@keyframes gpRigorDrift{from{transform:translate(-50%,-46%) rotate(2deg)}to{transform:translate(-50%,-54%) rotate(-2deg)}}
.gp-rigor-row{position:relative;display:grid;grid-template-columns:repeat(2,1fr);gap:26px 16px}
@media (min-width:700px){.gp-rigor-row{grid-template-columns:repeat(4,1fr)}}
.gp-rigor-item{position:relative;padding:8px 2px}
.gp-rigor-item::before{content:"";position:absolute;left:50%;top:50%;width:130px;height:110px;
  transform:translate(-50%,-50%);z-index:-1;pointer-events:none;filter:blur(20px);
  background:radial-gradient(closest-side, rgba(124,92,214,.28), transparent 72%)}
.gp-rigor-v{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:clamp(1.5rem,3vw,1.9rem);color:var(--vio-pale);
  background:linear-gradient(180deg,#ffffff 15%,#cfc0f4 85%);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.gp-rigor-l{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin-top:6px}
.gp-rigor-line{font-style:italic;color:var(--muted);margin-top:clamp(26px,4vw,36px);font-size:17.5px}

/* faq */
.gp-faq-list{max-width:720px;margin:0 auto;border-top:1px solid var(--line)}
.gp-faq-item{padding:20px 4px;border-bottom:1px solid var(--line)}
.gp-faq-item dt{font-weight:600;color:var(--white);font-size:19px}
.gp-faq-item dd{margin-top:8px;color:var(--muted);font-size:17.5px;line-height:1.65}

/* closing */
.gp-closing{text-align:center}
.gp-closing-row{justify-content:center}
.gp-guarantee{font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:18px;color:var(--white);margin-top:26px}

/* footer */
.gp-foot{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;
  padding-top:8px;padding-bottom:44px;color:var(--dim);font-size:15px}
.gp-foot-hair{width:34px;height:1px;background:var(--line)}

/* sticky bar */
.gp-sticky{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;align-items:center;justify-content:center;gap:16px;
  padding:12px 18px calc(12px + env(safe-area-inset-bottom));
  background:rgba(13,10,20,.93);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  border-top:1px solid var(--line);box-shadow:0 -10px 34px rgba(124,92,214,.18);
  transform:translateY(110%);transition:transform .35s var(--ease-settle)}
.gp-sticky.is-shown{transform:translateY(0)}
.gp-sticky-price{color:var(--muted);font-size:15.5px;white-space:nowrap}
.gp-sticky-price span{font-family:'Fraunces',Georgia,serif;font-size:1.2em;color:var(--white)}
.gp-cta-sticky{min-height:48px;padding:0 26px;font-size:17px}
@media (prefers-reduced-motion: reduce){.gp-sticky{transition:none}}

/* ── funnel ── */
.gp-funnel-col{max-width:560px;margin:0 auto}
.gp-occ-card{padding:6px 0 4px;text-align:center}
.gp-occ-q{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:clamp(1.5rem,3.4vw,1.8rem);
  color:var(--white);text-align:center;margin:10px 0 26px}

/* occasion cards — four scene cards, 2×2, depth + glow */
.gp-occ-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;max-width:520px;margin:0 auto}
.gp-occ-cell{display:flex}
.gp-occ-cardbtn{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;gap:12px;
  padding:clamp(18px,3.4vw,26px) 12px clamp(16px,3vw,22px);border-radius:20px;cursor:pointer;text-align:center;
  border:1.5px solid var(--line);
  background:radial-gradient(130% 100% at 50% 0%,rgba(124,92,214,.17),rgba(124,92,214,.03) 62%),#15101c;
  box-shadow:0 2px 10px rgba(0,0,0,.35);
  transition:transform .18s var(--ease-stage),border-color .2s ease,box-shadow .25s ease;
  -webkit-tap-highlight-color:transparent}
.gp-occ-cardbtn::before{content:"";position:absolute;left:50%;top:-18%;width:120%;height:70%;
  transform:translateX(-50%);border-radius:50%;pointer-events:none;
  background:radial-gradient(closest-side,rgba(154,126,230,.30),transparent 72%);
  opacity:0;transition:opacity .25s ease}
@media (hover:hover){
  .gp-occ-cardbtn:hover{transform:translateY(-3px);border-color:var(--line-bright);
    box-shadow:0 12px 32px -10px rgba(124,92,214,.45)}
  .gp-occ-cardbtn:hover::before{opacity:1}
  .gp-occ-cardbtn:hover .gp-occ-scene{color:var(--vio-bright)}
}
.gp-occ-cardbtn:active{transform:scale(.97);transition-duration:.06s}
.gp-occ-scene img{display:block;width:100%;height:auto;border-radius:14px;
  filter:saturate(.92) brightness(.94);transition:filter .35s var(--ease-settle),transform .35s var(--ease-settle)}
.gp-occ-cardbtn:hover .gp-occ-scene img{filter:saturate(1.05) brightness(1.06);transform:scale(1.03)}
.gp-occ-cardbtn.is-active .gp-occ-scene img{filter:saturate(1.1) brightness(1.12)}
.gp-occ-scene{display:block;width:min(132px,62%);color:var(--vio-soft);
  filter:drop-shadow(0 0 12px rgba(124,92,214,.28));
  transition:color .22s ease}
.gp-occ-scene svg{display:block;width:100%;height:auto}
.gp-occ-name{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:clamp(1.02rem,2.8vw,1.18rem);
  line-height:1.22;color:var(--body);text-wrap:balance;transition:color .2s ease}
.gp-occ-tick{position:absolute;top:10px;right:10px;width:24px;height:24px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;color:#fff;
  background:linear-gradient(180deg,#9a7ee6,#5d47a0);
  opacity:0;transform:scale(.5);transition:opacity .18s ease,transform .18s var(--ease-settle)}
.gp-occ-tick svg{width:13px;height:13px}
.gp-occ-cardbtn.is-active{border-color:#9a7ee6;
  background:radial-gradient(130% 100% at 50% 0%,rgba(124,92,214,.30),rgba(124,92,214,.08) 62%),#171126;
  box-shadow:0 0 0 4px rgba(154,126,230,.20),0 14px 36px -12px rgba(124,92,214,.55)}
.gp-occ-cardbtn.is-active::before{opacity:1}
.gp-occ-cardbtn.is-active .gp-occ-scene{color:var(--vio-pale)}
.gp-occ-cardbtn.is-active .gp-occ-name{color:var(--white)}
.gp-occ-cardbtn.is-active .gp-occ-tick{opacity:1;transform:scale(1)}
.gp-occ-cardbtn.is-mem.is-active{border-color:#b8b2cc;
  box-shadow:0 0 0 4px rgba(200,196,216,.16),0 14px 36px -12px rgba(148,140,180,.5)}
.gp-occ-cardbtn.is-mem.is-active .gp-occ-scene{color:#d8d4e8}
.gp-occ-cardbtn.is-mem.is-active .gp-occ-tick{background:linear-gradient(180deg,#c9c4dd,#948caa)}

/* tier cards */
.gp-tier{width:100%;text-align:left;padding:24px 22px;border-radius:20px;cursor:pointer;position:relative;
  border:2px solid var(--line);
  background:linear-gradient(180deg,rgba(124,92,214,.13),rgba(124,92,214,.05)),#15101c;
  transition:border-color .2s,background .2s,box-shadow .2s}
.gp-tier::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:radial-gradient(120% 80% at 50% 0%,rgba(154,126,230,.14),transparent 60%);
  opacity:0;transition:opacity .2s ease}
@media (hover:hover){
  .gp-tier:hover{border-color:var(--line-bright)}
  .gp-tier:hover::after{opacity:1}
}
.gp-tier.is-selected{border-color:#9a7ee6;
  background:linear-gradient(180deg,rgba(124,92,214,.20),rgba(124,92,214,.08)),#15101c}
.gp-tier.is-selected::after{opacity:1}
.gp-tier-badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);color:#0d0a14;
  font-size:12px;font-weight:700;padding:3px 14px;border-radius:20px;letter-spacing:.1em;white-space:nowrap}
.gp-tier-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:14px}
.gp-tier-names{flex:1;min-width:0}
.gp-tier-label{font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:1.4rem;color:var(--white);
  margin-bottom:4px;line-height:1.12}
.gp-tier-tag{font-style:italic;font-size:16px;color:var(--muted);line-height:1.4}
.gp-tier-price-wrap{text-align:right;flex-shrink:0}
.gp-tier-was{font-size:15px;color:var(--dim);text-decoration:line-through;margin-bottom:2px}
.gp-tier-price{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:2.1rem;line-height:1;color:var(--vio-pale)}
.gp-tier-once{font-size:13px;color:var(--dim);margin-top:3px}
.gp-tier-features{display:flex;flex-direction:column;gap:8px}
.gp-tier-feat{display:flex;align-items:flex-start;gap:9px;font-size:16px;line-height:1.45;color:var(--body)}
.gp-tier-feat svg{width:14px;height:14px;color:var(--vio-soft);flex-shrink:0;margin-top:4px}
.gp-tier-feat span{flex:1}
.gp-tier-div{font-style:italic;font-weight:600;font-size:16px;color:var(--vio-bright)}
.gp-tier-selected{margin-top:14px;padding-top:12px;border-top:1px solid var(--line);text-align:center}
.gp-tier-selected p{font-size:15px;font-weight:700;color:var(--vio-bright)}

/* flow */
.gp-flow{margin-top:36px;padding-top:32px;border-top:2px solid var(--line)}
.gp-flow-reminder{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:24px;
  font-family:'Fraunces',Georgia,serif;font-size:1.05rem;color:var(--white)}
.gp-change{margin-left:4px;font-size:14px;color:var(--dim);background:none;border:none;cursor:pointer;
  text-decoration:underline;font-family:'Newsreader',Georgia,serif}
.gp-stepper{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:28px}
.gp-stepper-seg{display:flex;align-items:center;gap:8px}
.gp-stepper-dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:14px;font-weight:700;background:rgba(154,126,230,.16);color:var(--dim);transition:all .3s}
.gp-stepper-dot.is-on{background:linear-gradient(180deg,#9a7ee6,#5d47a0);color:#fff;
  box-shadow:0 0 14px rgba(167,139,250,.45)}
.gp-stepper-dot svg{width:14px;height:14px}
.gp-stepper-bar{width:28px;height:2px;background:rgba(154,126,230,.16);border-radius:2px;transition:background .3s}
.gp-stepper-bar.is-on{background:var(--vio-soft)}
.gp-step-col{display:flex;flex-direction:column;gap:18px}
.gp-flow-q{text-align:center;font-family:'Fraunces',Georgia,serif;font-weight:500;font-size:1.4rem;color:var(--white)}
.gp-two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.gp-choice{position:relative;padding:22px 14px;border-radius:18px;cursor:pointer;text-align:center;
  border:2px solid var(--line);background:rgba(124,92,214,.05);transition:all .2s}
@media (hover:hover){
  .gp-choice:hover{transform:translateY(-2px);border-color:var(--line-bright);
    box-shadow:0 10px 26px -10px rgba(124,92,214,.4)}
}
.gp-choice:active{transform:scale(.98);transition-duration:.06s}
.gp-choice.is-on{border-color:#9a7ee6;background:rgba(124,92,214,.14);
  box-shadow:0 0 0 3px rgba(154,126,230,.16)}
.gp-choice-left{text-align:left;padding:16px 14px}
.gp-choice-icon{width:30px;height:30px;margin:0 auto 10px;color:var(--dim);display:block}
.gp-choice-left .gp-choice-icon{margin:0 0 8px}
.gp-choice-icon-sm{width:21px;height:21px}
.gp-choice.is-on .gp-choice-icon{color:var(--vio-bright)}
.gp-choice-t{font-weight:700;font-size:16.5px;color:var(--white)}
.gp-choice-s{font-size:14.5px;color:var(--dim);margin-top:3px;line-height:1.35}
.gp-save-chip{position:absolute;top:-9px;right:12px;font-size:11px;font-weight:700;
  background:linear-gradient(180deg,#9a7ee6,#7c5cd6);color:#fff;padding:2px 8px;border-radius:20px;letter-spacing:.04em}
.gp-flex-chip{position:absolute;top:-9px;left:12px;font-size:11.5px;font-weight:700;
  background:linear-gradient(180deg,#9a7ee6,#7c5cd6);color:#fff;padding:2px 9px;border-radius:20px}
.gp-trust-mini{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;font-size:14px;color:var(--dim)}
.gp-trust-mini span{display:inline-flex;align-items:center;gap:5px}
.gp-trust-mini svg{width:14px;height:14px}
.gp-step-head{display:flex;align-items:center;justify-content:space-between}
.gp-step-head p{font-weight:700;font-size:17.5px;color:var(--white)}
.gp-ghost{background:none;border:none;color:var(--dim);cursor:pointer;display:inline-flex;
  align-items:center;gap:5px;font-size:15px;padding:4px}
.gp-ghost:hover{color:var(--body)}
.gp-ghost svg{width:15px;height:15px}

/* fields */
.gp-field{width:100%;padding:13px 16px;border-radius:10px;min-height:48px;
  border:1px solid rgba(139,123,216,.38);background:rgba(11,8,18,.55);
  font-size:17px;color:var(--body);outline:none;transition:border-color .2s}
.gp-field::placeholder{color:var(--dim)}
.gp-field:focus{border-color:#9a7ee6;box-shadow:0 0 0 3px rgba(167,139,250,.16)}
.gp-field-sm{padding:10px 14px;min-height:44px;font-size:16px}
.gp-field-col{display:flex;flex-direction:column;gap:10px}
.gp-field-label{font-size:16.5px;font-weight:600;color:var(--white);display:block;margin-bottom:10px}
.gp-field-note{font-weight:400;color:var(--dim)}
.gp-field-sub{font-weight:600;color:var(--body);font-size:15px;margin-bottom:8px}
.gp-help{font-size:14px;color:var(--dim);margin-top:8px}

/* per-recipient occasion pickers */
.gp-occ-mini-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.gp-occ-mini{padding:9px 10px;border-radius:10px;text-align:left;cursor:pointer;
  border:1px solid var(--line);background:rgba(124,92,214,.05)}
.gp-occ-mini.is-on{border:1.5px solid #9a7ee6;background:rgba(124,92,214,.16)}
.gp-occ-mini.is-on-mem{border:1.5px solid #b8b2cc;background:rgba(200,196,216,.14)}
.gp-occ-mini-t{display:flex;align-items:center;gap:7px;font-size:15.5px;font-weight:600;color:var(--white)}
.gp-occ-mini-t svg{width:16px;height:16px;flex-shrink:0;color:var(--vio-soft)}
.gp-occ-mini.is-on-mem .gp-occ-mini-t svg{color:#b8b2cc}
.gp-occ-mini-h{display:block;font-size:13px;color:var(--dim);margin-top:2px}
.gp-occ-chip-row{display:flex;flex-wrap:wrap;gap:6px}
.gp-occ-chip{padding:6px 12px;border-radius:14px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;
  border:1px solid var(--line);background:rgba(124,92,214,.05);font-size:14.5px;font-weight:600;color:var(--body)}
.gp-occ-chip svg{width:15px;height:15px;flex-shrink:0;color:var(--vio-soft)}
.gp-occ-chip.is-on{border:1.5px solid #9a7ee6;background:rgba(124,92,214,.16);color:var(--white)}
.gp-occ-chip.is-on-mem{border:1.5px solid #b8b2cc;background:rgba(200,196,216,.14);color:var(--white)}
.gp-occ-chip.is-on-mem svg{color:#b8b2cc}

/* multi recipients */
.gp-recip-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.gp-recip-id{display:flex;align-items:center;gap:8px}
.gp-recip-n{width:24px;height:24px;border-radius:50%;background:linear-gradient(180deg,#9a7ee6,#5d47a0);
  color:#fff;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700}
.gp-recip-name{font-weight:600;font-size:15.5px;color:var(--white)}
.gp-recip-fields{display:grid;grid-template-columns:1fr;gap:8px}
.gp-recip-fields.has-email{grid-template-columns:1fr 1fr}
.gp-add-row{padding:14px;border-radius:14px;border:2px dashed rgba(154,126,230,.4);
  background:rgba(124,92,214,.08);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;
  color:var(--vio-bright);font-weight:600;font-size:15.5px;
  transition:border-color .2s ease,background-color .2s ease}
@media (hover:hover){
  .gp-add-row:hover{border-color:rgba(185,165,240,.7);background:rgba(124,92,214,.15)}
}
.gp-add-row svg{width:18px;height:18px}
.gp-add-bonus{font-size:13px;color:var(--vio-pale);margin-left:4px}

/* summary */
.gp-summary-head{display:flex;align-items:center;gap:8px;padding-bottom:12px;
  border-bottom:1px solid var(--line);margin-bottom:12px}
.gp-summary-head svg{width:17px;height:17px;color:var(--vio-bright)}
.gp-summary-head p{font-weight:700;color:var(--white);font-size:15.5px}
.gp-summary-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0}
.gp-summary-row.has-hair{border-bottom:1px solid var(--line)}
.gp-summary-item{display:flex;align-items:center;gap:8px}
.gp-summary-item svg{width:15px;height:15px;color:var(--vio-soft);flex-shrink:0}
.gp-summary-tier{font-weight:600;font-size:15.5px;color:var(--white)}
.gp-summary-for{font-size:13.5px;color:var(--vio-bright)}
.gp-summary-price{font-size:15.5px;color:var(--muted)}
.gp-summary-totals{margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}
.gp-summary-disc{display:flex;justify-content:space-between;margin-bottom:6px;font-size:15px;color:var(--vio-pale)}
.gp-summary-disc span{display:flex;align-items:center;gap:4px}
.gp-summary-disc svg{width:12px;height:12px}
.gp-summary-total{display:flex;justify-content:space-between;font-size:1.25rem;font-weight:700;color:var(--white)}
.gp-summary-total-v{font-family:'Fraunces',Georgia,serif}
.gp-summary-note{font-size:13px;color:var(--dim);margin-top:6px;text-align:right}

/* promo */
.gp-promo-row{display:flex;gap:8px}
.gp-apply{padding:0 20px;border-radius:10px;min-height:48px;border:none;cursor:pointer;
  background:linear-gradient(180deg,#9a7ee6,#5d47a0);color:#fff;font-weight:600;font-size:15px;white-space:nowrap}
.gp-apply:disabled{opacity:.5;cursor:default}
@media (hover:hover){.gp-apply:not(:disabled):hover{filter:brightness(1.1)}}
.gp-apply:not(:disabled):active{transform:scale(.97)}
.gp-promo-err{color:var(--body);font-size:14px;margin-top:6px;padding-left:10px;border-left:2px solid var(--vio-soft)}
.gp-promo-chip{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;
  border-radius:10px;background:rgba(124,92,214,.12);border:1px solid rgba(185,165,240,.35)}
.gp-promo-chip span{font-size:15px;color:var(--vio-pale);font-weight:600}
.gp-promo-chip button{background:none;border:none;color:var(--vio-pale);cursor:pointer;font-size:1.1rem;line-height:1}

/* refund line */
.gp-refund{display:flex;align-items:center;gap:12px;padding:16px;border-radius:16px;
  background:rgba(124,92,214,.07);border:1px solid var(--line)}
.gp-refund svg{width:21px;height:21px;color:var(--vio-bright);flex-shrink:0}
.gp-refund p{font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:17px;color:var(--white);line-height:1.45}

@media (max-width:520px){
  .gp-two-col{grid-template-columns:1fr 1fr}
  .gp-recip-fields.has-email{grid-template-columns:1fr}
  .gp-sticky-price{display:none}
  .gp-cta-sticky{width:100%;max-width:420px}
}
`;
