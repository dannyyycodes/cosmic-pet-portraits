import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, ArrowLeft, Send, LinkIcon, CheckCircle, Plus, Trash2,
  ChevronRight, Users, User, Sparkles, Star, Shield, Clock,
  Cat, Dog, Fish, Rabbit, Bird, Turtle, PawPrint, Bone, Feather,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocalizedPrice } from '@/hooks/useLocalizedPrice';

type DeliveryMethod = 'email' | 'link';
type GiftTier = 'essential' | 'portrait';

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

const GIFT_OCCASION_OPTIONS: Array<{ value: GiftOccasion; emoji: string; label: string; hint: string }> = [
  { value: 'discover', emoji: '🔮', label: 'Discover', hint: 'For a pet they already have' },
  { value: 'new', emoji: '🌱', label: 'New Pet', hint: 'They just got a new pet' },
  { value: 'memorial', emoji: '🕊️', label: 'Memorial', hint: 'They lost a beloved pet' },
  { value: 'birthday', emoji: '🎂', label: 'Birthday', hint: 'Celebrating their pet' },
];

const C = {
  cream: '#FFFDF5', cream2: '#faf4e8', cream3: '#f3eadb',
  ink: '#1f1c18', deep: '#2e2a24', warm: '#4d443b', earth: '#6e6259', muted: '#958779',
  rose: '#bf524a', roseGlow: 'rgba(191,82,74,0.10)',
  gold: '#c4a265', goldSoft: 'rgba(196,162,101,0.15)',
  green: '#4a8c5c',
};

// Prices come from useLocalizedPrice() at render time — this const only
// holds static copy. Price mapping: essential → prices.basic/wasBasic,
// portrait → prices.premium/wasPremium.
const TIERS = {
  essential: {
    label: 'Soul Reading',
    tagline: 'The reading they\'ll read aloud to their pet — and probably cry doing it.',
    badge: null as string | null,
    badgeColor: C.rose,
    features: [
      'Full astrological breakdown — 30+ sections (works for any pet)',
      'How their pet loves, learns, heals, what they hope for, what they fear — and what makes them feel most themselves',
      'Their pet\'s photo becomes part of the reveal',
      'SoulSpeak — they can ask their pet anything',
      'Plus bonus sections — little surprises written just for them',
      'Theirs forever — they can revisit anytime, from any device',
      '1 month of weekly horoscopes — included free',
    ],
  },
  portrait: {
    label: 'Soul Bond',
    tagline: 'For the bond worth understanding — them and their pet, read side by side.',
    badge: 'MOST CHOSEN' as string | null,
    badgeColor: C.rose,
    popular: true,
    features: [
      'Everything in Soul Reading, plus:',
      'Their chart against their pet\'s — where they align, where they challenge each other, and why the universe paired them',
      'Where their energies meet, mirror, and balance',
      'The soul-reasons they found each other',
    ],
  },
} as const;

// ─── Occasion-specific tier overrides ─────────────────────────────────
//
// Different occasions call for different tier framing — Memorial isn't
// about "bonding" language, a gift for a new pet leans into "welcome
// them into the family", birthday leans celebratory, etc. This table
// overrides the default TIERS copy at render time so each occasion
// presents its own version of the same underlying product.
//
// Memorial intentionally has NO `essential` entry — the memorial product
// is one single offering at the Soul Bond price (£49), matching the
// main funnel which never shows a tier choice for memorial either.
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
      label: 'Welcome Reading',
      tagline: 'For the first chapter of their new bond — the pet they just brought home.',
      badge: null,
      features: [
        'Written for a pet they just welcomed into their life',
        'How this new soul wants to be loved, trained, and understood',
        'What their new pet needs to feel at home — from day one',
        'Their pet\'s photo becomes part of the reveal',
        'SoulSpeak — they can talk to their new pet whenever they want',
        '1 month of weekly horoscopes — included free',
        'Theirs forever — revisit anytime, from any device',
      ],
    },
    portrait: {
      label: 'Welcome Soul Bond',
      tagline: 'The new-pet reading + the cosmic story of why this soul found them.',
      badge: 'MOST CHOSEN',
      features: [
        'Everything in the Welcome Reading, plus:',
        'Their chart against their new pet\'s — why THIS soul landed in their life',
        'Where their energies mirror, balance, and align',
        'The soul-reasons the universe paired them at this exact moment',
      ],
    },
  },
  discover: {
    essential: {
      label: 'Discover Reading',
      tagline: 'Finally understand the pet they\'ve known and loved for years.',
      badge: null,
      features: [
        '30+ sections that reveal the pet they already love, deeply',
        'The quiet truths they\'ve sensed but never had words for',
        'How their pet loves, learns, heals, hopes, fears — fully decoded',
        'Their pet\'s photo becomes part of the reveal',
        'SoulSpeak — ask their pet the questions they\'ve always wondered',
        '1 month of weekly horoscopes — included free',
        'Theirs forever — revisit anytime, from any device',
      ],
    },
    portrait: {
      label: 'Discover Soul Bond',
      tagline: 'The reading + the cosmic proof of why they were always meant to be together.',
      badge: 'MOST CHOSEN',
      features: [
        'Everything in the Discover Reading, plus:',
        'Their chart against their pet\'s — read side by side',
        'Where they align, where they challenge, why the stars paired them',
        'The soul-reasons this bond exists at all',
      ],
    },
  },
  memorial: {
    portrait: {
      label: 'Memorial Reading',
      tagline: 'A remembrance written for a pet who has crossed the rainbow bridge — honouring the soul they loved.',
      badge: 'A TRIBUTE',
      features: [
        'Honours the pet they lost with the respect their soul deserves',
        'Their chart against their pet\'s — the bond that didn\'t end when the body did',
        'What their pet came to teach them, what they leave behind, what stays',
        'Their pet\'s photo becomes part of the memorial reveal',
        'SoulSpeak — a sacred space to still talk to them, one more time',
        'Theirs forever — a keepsake they\'ll return to on the hard days',
        'No weekly horoscopes — memorial readings honour the life that was',
      ],
    },
  },
  birthday: {
    essential: {
      label: 'Birthday Reading',
      tagline: 'A reading to celebrate another year of the soul they love most.',
      badge: null,
      features: [
        'A celebration of the pet whose birthday it is',
        '30+ sections decoding their pet\'s personality, love language, and year ahead',
        'Their pet\'s photo becomes part of the reveal',
        'SoulSpeak — they can ask their pet anything, on their special day',
        '1 month of weekly horoscopes — the year ahead, read by the stars',
        'Theirs forever — a birthday gift that keeps giving',
      ],
    },
    portrait: {
      label: 'Birthday Soul Bond',
      tagline: 'The birthday reading + the full bond story — them and their pet, read together.',
      badge: 'MOST CHOSEN',
      features: [
        'Everything in the Birthday Reading, plus:',
        'Their chart against their pet\'s — how their souls dance together',
        'Where they mirror, balance, and bring out the best in each other',
        'The cosmic reason this bond began, celebrated on this birthday',
      ],
    },
  },
};

// Short prompt line above the tier cards that reframes per occasion.
const OCCASION_TIER_KICKER: Record<GiftOccasion, string> = {
  new:      'Choose their Welcome Reading',
  discover: 'Choose their Discover Reading',
  memorial: 'The Memorial Reading',
  birthday: 'Choose their Birthday Reading',
};

// Subtle visual accent per occasion — a soft coloured hairline that
// frames the tier cards so they don't feel like carbon copies across
// occasions. Kept minimal so the cream/rose/gold brand palette still
// dominates.
const OCCASION_ACCENT: Record<GiftOccasion, { ring: string; badge: string }> = {
  new:      { ring: 'rgba(74,140,92,0.28)',   badge: '#4a8c5c' }, // green (fresh beginning)
  discover: { ring: 'rgba(139,92,172,0.28)',  badge: '#8b5cac' }, // violet (mystery/reveal)
  memorial: { ring: 'rgba(196,162,101,0.42)', badge: '#c4a265' }, // gold (sacred, honouring)
  birthday: { ring: 'rgba(217,119,60,0.30)',  badge: '#d9773c' }, // amber (celebration)
};

type TierKey = keyof typeof TIERS;

const getVolumeDiscount = (count: number): number => {
  if (count >= 5) return 0.30;
  if (count >= 4) return 0.25;
  if (count >= 3) return 0.20;
  if (count >= 2) return 0.15;
  return 0;
};

function StarRow({ n = 5 }: { n?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[...Array(n)].map((_, i) => <Star key={i} style={{ width: 13, height: 13, fill: C.gold, color: C.gold }} />)}
    </div>
  );
}

/* ── Wallpaper — scattered Lucide pet icons matching the landing page ── */
type PetItem = { x: number; y: number; size: number; rot: number; op: number; Icon: typeof Cat };
const WALLPAPER_PETS: PetItem[] = [
  { x: 4,  y: 6,  size: 30, rot: -12, op: 0.16, Icon: Cat },
  { x: 18, y: 4,  size: 22, rot: 10,  op: 0.13, Icon: PawPrint },
  { x: 32, y: 9,  size: 28, rot: 6,   op: 0.15, Icon: Rabbit },
  { x: 46, y: 3,  size: 26, rot: -8,  op: 0.14, Icon: Bird },
  { x: 60, y: 8,  size: 32, rot: 14,  op: 0.17, Icon: Dog },
  { x: 74, y: 4,  size: 24, rot: -14, op: 0.13, Icon: Feather },
  { x: 88, y: 9,  size: 28, rot: 8,   op: 0.15, Icon: Fish },
  { x: 10, y: 22, size: 34, rot: 6,   op: 0.17, Icon: Turtle },
  { x: 26, y: 28, size: 22, rot: -10, op: 0.13, Icon: Bone },
  { x: 42, y: 22, size: 30, rot: 16,  op: 0.16, Icon: Cat },
  { x: 58, y: 26, size: 26, rot: -6,  op: 0.14, Icon: Bird },
  { x: 74, y: 22, size: 28, rot: 12,  op: 0.15, Icon: PawPrint },
  { x: 92, y: 28, size: 24, rot: -16, op: 0.13, Icon: Rabbit },
  { x: 6,  y: 44, size: 26, rot: -10, op: 0.14, Icon: Dog },
  { x: 22, y: 48, size: 32, rot: 14,  op: 0.17, Icon: PawPrint },
  { x: 38, y: 42, size: 24, rot: -8,  op: 0.13, Icon: Fish },
  { x: 54, y: 48, size: 30, rot: 10,  op: 0.16, Icon: Cat },
  { x: 70, y: 44, size: 28, rot: -14, op: 0.15, Icon: Feather },
  { x: 86, y: 48, size: 26, rot: 6,   op: 0.14, Icon: Rabbit },
  { x: 4,  y: 64, size: 22, rot: 12,  op: 0.13, Icon: Bone },
  { x: 18, y: 68, size: 28, rot: -8,  op: 0.15, Icon: Bird },
  { x: 32, y: 64, size: 24, rot: 14,  op: 0.13, Icon: Turtle },
  { x: 48, y: 70, size: 30, rot: -12, op: 0.16, Icon: Dog },
  { x: 64, y: 64, size: 26, rot: 8,   op: 0.14, Icon: PawPrint },
  { x: 78, y: 68, size: 28, rot: -6,  op: 0.15, Icon: Cat },
  { x: 94, y: 64, size: 22, rot: 10,  op: 0.12, Icon: Fish },
  { x: 8,  y: 86, size: 28, rot: 10,  op: 0.15, Icon: Rabbit },
  { x: 24, y: 90, size: 22, rot: -12, op: 0.13, Icon: PawPrint },
  { x: 42, y: 86, size: 30, rot: 6,   op: 0.16, Icon: Bird },
  { x: 60, y: 92, size: 26, rot: -8,  op: 0.14, Icon: Dog },
  { x: 78, y: 88, size: 32, rot: 14,  op: 0.17, Icon: Cat },
  { x: 92, y: 92, size: 24, rot: -6,  op: 0.13, Icon: Bone },
];

function WallpaperBackdrop() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 90% 80% at 50% 0%, ${C.cream2} 0%, ${C.cream} 60%)`,
      }}
    >
      {WALLPAPER_PETS.map((p, i) => (
        <p.Icon
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            color: C.muted,
            opacity: p.op,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

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
  const accent = C.rose;
  const accentGlow = C.roseGlow;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2, boxShadow: `0 8px 28px ${accentGlow}` }}
      transition={{ duration: 0.15 }}
      style={{
        width: '100%', textAlign: 'left', padding: '24px 22px', borderRadius: 20, cursor: 'pointer',
        border: `2px solid ${selected ? accent : C.cream3}`,
        background: selected ? 'rgba(255,253,245,0.96)' : 'rgba(255,253,245,0.92)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        boxShadow: selected
          ? `0 6px 24px ${accentGlow}${occAccent ? `, 0 0 0 5px ${occAccent.ring}` : ''}`
          : `0 2px 12px rgba(0,0,0,0.04)${occAccent ? `, inset 0 0 0 1px ${occAccent.ring}` : ''}`,
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
        position: 'relative',
      }}
    >
      {/* Badge — occasion overrides provide their own label; when an
          override is in play, use the occasion's badge accent colour
          so it reads as part of that occasion's visual language. */}
      {tier.badge && (
        <span style={{
          position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
          background: occAccent?.badge ?? base.badgeColor,
          color: '#fff',
          fontSize: '0.58rem', fontWeight: 800, padding: '3px 14px', borderRadius: 20, letterSpacing: '0.1em',
          whiteSpace: 'nowrap',
        }}>
          {tier.badge}
        </span>
      )}

      {/* Header row — landing-page style: name + price baseline-aligned */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontWeight: 400, fontSize: '1.3rem', color: C.ink, marginBottom: 4, lineHeight: 1.15,
          }}>
            {tier.label}
          </p>
          <p style={{
            fontFamily: 'Cormorant, Georgia, serif', fontStyle: 'italic',
            fontSize: '0.86rem', color: C.earth, lineHeight: 1.4,
          }}>
            {tier.tagline}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {wasCents && (
            <p style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: '1rem', lineHeight: 1,
              color: C.muted,
              textDecoration: 'line-through',
              textDecorationColor: 'rgba(191,82,74,0.55)',
              textDecorationThickness: '1.5px',
              marginBottom: 3,
            }}>
              {fmt(wasCents)}
            </p>
          )}
          <p style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: '2rem', lineHeight: 1,
            color: C.ink,
            transition: 'color 0.2s',
          }}>
            {fmt(cents)}
          </p>
          <p style={{ fontSize: '0.65rem', color: C.muted, marginTop: 2 }}>one-time</p>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {tier.features.map((f, idx) => {
          const isDivider = f.endsWith(':');
          return (
            <p key={idx} style={{
              fontSize: '0.85rem',
              color: isDivider ? C.gold : C.warm,
              fontStyle: isDivider ? 'italic' : 'normal',
              fontWeight: isDivider ? 600 : 400,
              display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4,
            }}>
              {!isDivider && (
                <CheckCircle style={{ width: 13, height: 13, color: C.green, flexShrink: 0, marginTop: 2 }} />
              )}
              <span style={{ flex: 1 }}>{f}</span>
            </p>
          );
        })}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.cream3}`, textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, color: accent }}>✓ Selected — continue below ↓</p>
        </div>
      )}
    </motion.button>
  );
}

/* ── Gift-specific reviews — written in a human voice. Avatar images
   are fetched live from dog.ceo + thecatapi.com on mount so every
   visitor sees a fresh pet. ── */
type GiftReview = {
  name: string; location: string;
  /** Avatar source. If `src` is set we skip the API and use that image
   *  directly (stable across reloads). Otherwise we pull a random photo
   *  from dog.ceo / thecatapi.com. Omit avatar for a text-only card. */
  avatar?: { src?: string; pet?: 'dog' | 'cat'; breed?: string };
  quote: string;
};

const GIFT_REVIEWS: GiftReview[] = [
  {
    name: 'Dave',
    location: 'Manchester',
    quote: 'Got this for the wife\'s birthday — her cat does the 3am keyboard walk and the reading called it out. She just nodded and carried on reading.',
  },
  {
    name: 'Emily',
    location: 'Toronto',
    avatar: { src: 'https://images.pexels.com/photos/35130989/pexels-photo-35130989.jpeg?auto=compress&cs=tinysrgb&w=160&h=160&fit=crop' },
    quote: 'Gave it to my sister for her golden retriever puppy. The reading described how he bonds by pressing against your leg on walks. She mentioned it the next morning over coffee.',
  },
  {
    name: 'Liam',
    location: 'Cork',
    quote: 'Wasn\'t expecting much when I got it for my da\'s sheepdog. He read the personality section and said how do they know that. First time he\'s been impressed by a gift.',
  },
  {
    name: 'Sophie',
    location: 'Brisbane',
    quote: 'Bought a few for the family do — one each for mum\'s poodle, dad\'s kelpie and my brother\'s staffy. Now the group chat\'s full of them quoting bits about their pets.',
  },
  {
    name: 'Anna',
    location: 'Portland',
    avatar: { src: 'https://images.pexels.com/photos/7176277/pexels-photo-7176277.jpeg?auto=compress&cs=tinysrgb&w=160&h=160&fit=crop' },
    quote: 'Sent this to my sister after her collie passed. It caught how he always did a final check of the room before bed. She said it felt like someone remembered him too.',
  },
  {
    name: 'Finn',
    location: 'Glasgow',
    quote: 'Got one for my mate\'s parrot — the one that copies the doorbell. The love-language bit said something about attention seeking and the bird started ringing right then. Had us in stitches.',
  },
  {
    name: 'Ryan',
    location: 'Austin',
    quote: 'I bought this for my wife and her siamese cat. The part about their bond through quiet evening sits has her showing me the phone every time the cat curls up.',
  },
  {
    name: 'Claire',
    location: 'Dublin',
    quote: 'Went with this instead of flowers or a gift card for my best mate and her new puppy. She loved how it got the zoomies after dinner thing. Reckon it\'s a winner.',
  },
];

async function fetchPetImage(pet: 'dog' | 'cat', breed?: string): Promise<string | null> {
  try {
    if (pet === 'dog') {
      const url = breed
        ? `https://dog.ceo/api/breed/${breed}/images/random`
        : 'https://dog.ceo/api/breeds/image/random';
      const r = await fetch(url);
      const j = await r.json();
      return j?.message ?? null;
    }
    const r = await fetch('https://api.thecatapi.com/v1/images/search');
    const j = await r.json();
    return Array.isArray(j) ? (j[0]?.url ?? null) : null;
  } catch {
    return null;
  }
}

function GiftReviewCard({ r, image }: { r: GiftReview; image?: string }) {
  const showAvatar = Boolean(r.avatar);
  return (
    <div
      style={{
        padding: '14px 16px 16px',
        borderRadius: 14,
        background: 'rgba(255,253,245,0.88)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid rgba(196,162,101,0.18)',
        boxShadow: '0 2px 10px rgba(31,28,24,0.04)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        {showAvatar && (
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            flexShrink: 0,
            background: C.cream2,
            border: `2px solid ${C.cream3}`,
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {image && (
              <img
                src={image}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <StarRow />
          <p style={{
            fontSize: '0.68rem', color: C.muted, fontWeight: 600,
            letterSpacing: '0.04em', margin: '3px 0 0',
          }}>
            {r.name}, {r.location}
          </p>
        </div>
      </div>
      <p style={{
        margin: 0,
        fontFamily: 'Cormorant, Georgia, serif',
        fontStyle: 'italic',
        fontSize: '0.88rem',
        color: C.warm,
        lineHeight: 1.5,
      }}>
        &ldquo;{r.quote}&rdquo;
      </p>
    </div>
  );
}

function GiftReviewStrip() {
  const [images, setImages] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    const initial: Record<number, string> = {};
    GIFT_REVIEWS.forEach((r, i) => {
      if (r.avatar?.src) initial[i] = r.avatar.src;
    });
    if (Object.keys(initial).length) setImages(initial);

    GIFT_REVIEWS.forEach(async (r, i) => {
      if (!r.avatar || r.avatar.src || !r.avatar.pet) return;
      const url = await fetchPetImage(r.avatar.pet, r.avatar.breed);
      if (!cancelled && url) {
        setImages(prev => ({ ...prev, [i]: url }));
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Duplicate the list so the translateX(-50%) loop is seamless.
  const loop = [...GIFT_REVIEWS, ...GIFT_REVIEWS];

  return (
    <div style={{ margin: '4px 0' }}>
      <p style={{
        textAlign: 'center',
        fontFamily: 'Cormorant, Georgia, serif',
        fontStyle: 'italic',
        fontSize: '0.82rem',
        color: C.earth,
        letterSpacing: '0.04em',
        margin: '0 0 14px',
      }}>
        from people who've gifted it
      </p>

      <div
        className="gift-review-marquee-viewport"
        style={{
          overflow: 'hidden',
          // Break out of the narrow 540px parent column on desktop so the
          // marquee spans the full viewport width — looks generous and
          // shows several cards at once. On mobile this reduces to the
          // viewport width too, which is what we want.
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          width: '100vw',
          maxWidth: '100vw',
          maskImage: 'linear-gradient(to right, transparent 0, #000 48px, #000 calc(100% - 48px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, #000 48px, #000 calc(100% - 48px), transparent 100%)',
        }}
      >
        <div
          className="gift-review-marquee-track"
          style={{
            display: 'flex',
            gap: 12,
            width: 'max-content',
            animation: 'gift-review-scroll 55s linear infinite',
            paddingLeft: 16,
          }}
        >
          {loop.map((r, i) => (
            <div
              key={i}
              style={{ flex: '0 0 auto', width: 300 }}
              aria-hidden={i >= GIFT_REVIEWS.length}
            >
              <GiftReviewCard r={r} image={images[i % GIFT_REVIEWS.length]} />
            </div>
          ))}
        </div>
      </div>
    </div>
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
  // PRIMARY product choice on the page (the real products we ship), with
  // Soul Reading / Soul Bond as depth-of-reading picks underneath it.
  // Null on first render — the occasion picker above the tier cards
  // forces the visitor to frame what kind of gift this is first.
  const [selectedOccasion, setSelectedOccasion] = useState<GiftOccasion | null>(null);
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

  // When the primary occasion is picked, propagate it to all recipient
  // rows as the default so downstream steps start in the right tone.
  // Per-recipient picker stays editable afterwards for mixed gifts.
  // Also clear the tier selection if switching to Memorial (which only
  // has portrait) or away from a tier that isn't offered on the new
  // occasion — keeps the flow from getting into impossible states.
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 14,
    border: `1px solid ${C.cream3}`, background: C.cream2,
    fontSize: '0.95rem', color: C.ink, fontFamily: 'Cormorant, Georgia, serif', outline: 'none',
    boxSizing: 'border-box',
  };

  const stepCount = 3;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 80px', fontFamily: 'Cormorant, Georgia, serif', background: C.cream }}>
      <WallpaperBackdrop />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 540 }}>

        {/* Back */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.muted, textDecoration: 'none', fontSize: '0.85rem', marginBottom: 28 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back
        </Link>

        {/* ── HERO — wrapped in a soft cream panel so the wallpaper
            doesn't interfere with the text ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center', marginBottom: 40,
            padding: '32px 24px 34px',
            borderRadius: 24,
            background: 'rgba(255,253,245,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(196,162,101,0.18)',
            boxShadow: '0 10px 36px rgba(31,28,24,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 16px', borderRadius: 50, background: C.roseGlow, border: `1px solid rgba(191,82,74,0.15)`, marginBottom: 18 }}>
            <Gift style={{ width: 13, height: 13, color: C.rose }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.rose, letterSpacing: '0.1em' }}>THE GIFT EVERY PET PARENT SECRETLY WANTS</span>
          </div>

          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontWeight: 400, fontSize: 'clamp(2rem, 8vw, 3rem)', color: C.ink, lineHeight: 1.02, letterSpacing: '-0.025em', marginBottom: 18 }}>
            The Best Gift<br />
            You'll Ever Give<br />
            <em style={{ color: C.rose }}>a Pet Parent.</em>
          </h1>

          <p style={{ fontFamily: 'Cormorant, Georgia, serif', fontStyle: 'italic', color: C.earth, fontSize: 'clamp(1.05rem, 3.6vw, 1.2rem)', lineHeight: 1.55, maxWidth: 440, margin: '0 auto 14px' }}>
            A cosmic portrait of the soul they love most. Everything about their pet — personality, love language, the quiet truths only the stars know — written for the one person who'd read it aloud through tears.
          </p>

          <p style={{ fontFamily: 'Cormorant, Georgia, serif', color: C.deep, fontSize: 'clamp(0.92rem, 3vw, 1.02rem)', fontWeight: 600, lineHeight: 1.5, maxWidth: 420, margin: '0 auto' }}>
            The kind of gift they'll keep forever, show their friends, and never stop bringing up.
          </p>
        </motion.div>

        {/* ── REVIEWS (social proof before tier selection) ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ marginBottom: 36 }}
        >
          <GiftReviewStrip />
        </motion.div>

        {/* ── OCCASION PICKER ── */}
        {/* First-class product choice: what kind of gift is this? Mirrors
            the main funnel's PathPicker pill design (italic Cormorant
            labels, gold-on-cream gradient, rose active halo) but adds a
            fourth slot for Birthday and uses gift-framed copy. Tier
            selection below is gated on this. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          style={{ marginBottom: 40 }}
        >
          <p style={{ fontFamily: 'Cormorant, Georgia, serif', fontSize: '0.72rem', fontWeight: 700, color: C.gold, textAlign: 'center', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
            Who is this gift for?
          </p>
          <p style={{ fontFamily: 'Cormorant, Georgia, serif', fontStyle: 'italic', color: C.earth, fontSize: 'clamp(1rem, 3vw, 1.15rem)', textAlign: 'center', margin: '0 auto 22px', maxWidth: 420 }}>
            Each reading is written in a different voice — pick the one that fits.
          </p>

          <div
            role="radiogroup"
            aria-label="Gift occasion"
            className="gift-occasion-row"
          >
            {([
              { value: 'new',      emoji: '🌱', label: 'For a new pet' },
              { value: 'discover', emoji: '🔮', label: 'To discover their pet' },
              { value: 'memorial', emoji: '🕊️', label: 'In loving memory' },
              { value: 'birthday', emoji: '🎂', label: "For their pet's birthday" },
            ] as Array<{ value: GiftOccasion; emoji: string; label: string }>).map(({ value, emoji, label }) => {
              const active = selectedOccasion === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleOccasionSelect(value)}
                  className={`gift-occasion-pill ${active ? 'is-active' : ''}`}
                >
                  <span aria-hidden="true" className="gop-sheen" />
                  <span className="gift-occasion-label-wrap">
                    <span className="gop-emoji" aria-hidden="true">{emoji}</span>
                    <span className="gift-occasion-label">{label}</span>
                    <span aria-hidden="true" className="gift-occasion-underline" />
                  </span>
                </button>
              );
            })}
          </div>

          <style>{`
            .gift-occasion-row {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 12px;
              max-width: 500px;
              margin: 0 auto;
            }

            .gift-occasion-pill {
              position: relative;
              appearance: none;
              -webkit-appearance: none;
              cursor: pointer;
              width: 100%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background:
                radial-gradient(
                  120% 160% at 50% -20%,
                  rgba(212, 178, 107, 0.14) 0%,
                  rgba(212, 178, 107, 0) 55%
                ),
                linear-gradient(
                  180deg,
                  rgba(255, 253, 245, 0.98) 0%,
                  rgba(249, 240, 224, 0.94) 100%
                );
              border: 1px solid rgba(196, 162, 101, 0.36);
              border-radius: 9999px;
              color: ${C.ink};
              font-family: "Cormorant", Georgia, serif;
              font-style: italic;
              letter-spacing: 0.005em;
              line-height: 1.1;
              padding: 16px 24px;
              min-height: 58px;
              font-size: clamp(1rem, 3.2vw, 1.18rem);
              transition:
                background 320ms ease,
                border-color 320ms ease,
                color 320ms ease,
                box-shadow 380ms ease,
                transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
              box-shadow:
                0 1px 2px rgba(20, 15, 8, 0.04),
                0 10px 26px rgba(20, 15, 8, 0.06),
                inset 0 1px 0 rgba(255, 255, 255, 0.78),
                inset 0 -1px 0 rgba(196, 162, 101, 0.12);
              -webkit-tap-highlight-color: transparent;
              outline: none;
              white-space: nowrap;
              overflow: hidden;
            }

            .gop-sheen {
              position: absolute; top: 0; left: 0; right: 0; height: 45%;
              background: linear-gradient(180deg, rgba(212,178,107,0.14) 0%, rgba(212,178,107,0) 100%);
              pointer-events: none; z-index: 0;
            }

            .gift-occasion-pill::after {
              content: "";
              position: absolute; top: 0; left: -55%; width: 55%; height: 100%;
              background: linear-gradient(115deg, rgba(212,178,107,0) 0%, rgba(212,178,107,0.28) 50%, rgba(212,178,107,0) 100%);
              opacity: 0; transform: translateX(0);
              transition: transform 1100ms cubic-bezier(0.22,1,0.36,1), opacity 220ms ease;
              pointer-events: none; z-index: 0;
            }
            @media (hover: hover) {
              .gift-occasion-pill:hover::after { opacity: 1; transform: translateX(330%); }
              .gift-occasion-pill:hover {
                border-color: rgba(196, 162, 101, 0.62);
                transform: translateY(-2px);
                box-shadow:
                  0 2px 4px rgba(20, 15, 8, 0.04),
                  0 16px 34px rgba(20, 15, 8, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.8);
              }
              .gift-occasion-pill:hover .gift-occasion-underline { width: calc(100% - 4px); }
            }

            .gift-occasion-label-wrap {
              position: relative;
              display: inline-flex;
              align-items: center;
              gap: 12px;
              z-index: 1;
            }
            .gop-emoji {
              font-size: 1.2em;
              line-height: 1;
              filter: drop-shadow(0 1px 2px rgba(0,0,0,0.08));
            }
            .gift-occasion-label { position: relative; display: inline-block; z-index: 1; }

            .gift-occasion-underline {
              position: absolute; left: 50%; bottom: -7px; height: 1px; width: 0;
              background: linear-gradient(90deg, rgba(196,162,101,0) 0%, rgba(196,162,101,1) 20%, rgba(196,162,101,1) 80%, rgba(196,162,101,0) 100%);
              transform: translateX(-50%);
              transition: width 380ms cubic-bezier(0.22,1,0.36,1);
              pointer-events: none; opacity: 0.85;
            }

            .gift-occasion-pill:focus-visible { outline: 2px solid ${C.rose}; outline-offset: 3px; }

            .gift-occasion-pill.is-active {
              color: ${C.rose};
              background:
                radial-gradient(140% 200% at 50% -30%, rgba(212,178,107,0.18) 0%, rgba(212,178,107,0) 60%),
                linear-gradient(180deg, #FFFDF5 0%, #fbeedd 100%);
              border-color: ${C.rose};
              box-shadow:
                0 0 0 5px rgba(191,82,74,0.07),
                0 0 0 1px rgba(191,82,74,0.18),
                0 4px 10px rgba(191,82,74,0.14),
                0 20px 44px rgba(191,82,74,0.18),
                inset 0 1px 0 rgba(255,255,255,0.92),
                inset 0 -2px 6px rgba(212,178,107,0.18);
              animation: gop-halo-pulse 3.6s ease-in-out infinite;
            }
            @keyframes gop-halo-pulse {
              0%, 100% {
                box-shadow:
                  0 0 0 5px rgba(191,82,74,0.07),
                  0 0 0 1px rgba(191,82,74,0.18),
                  0 4px 10px rgba(191,82,74,0.14),
                  0 20px 44px rgba(191,82,74,0.18),
                  inset 0 1px 0 rgba(255,255,255,0.92),
                  inset 0 -2px 6px rgba(212,178,107,0.18);
              }
              50% {
                box-shadow:
                  0 0 0 7px rgba(191,82,74,0.10),
                  0 0 0 1px rgba(191,82,74,0.24),
                  0 6px 14px rgba(191,82,74,0.18),
                  0 24px 52px rgba(191,82,74,0.22),
                  inset 0 1px 0 rgba(255,255,255,0.95),
                  inset 0 -2px 8px rgba(212,178,107,0.22);
              }
            }
            .gift-occasion-pill.is-active .gift-occasion-underline {
              width: calc(100% - 4px); opacity: 1;
            }

            @media (prefers-reduced-motion: reduce) {
              .gift-occasion-pill, .gift-occasion-pill::after, .gift-occasion-underline {
                transition: none !important; transform: none !important;
              }
              .gift-occasion-pill.is-active { animation: none !important; }
            }
          `}</style>
        </motion.div>

        {/* ── TIER CARDS — gated on occasion pick, tier set + copy
            varies per occasion. Memorial is portrait-only (single
            product at the Soul Bond price, matching the main funnel);
            new/discover/birthday show both tiers with occasion-framed
            copy so they don't feel like carbon copies. ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{
            opacity: selectedOccasion ? 1 : 0.35,
            y: 0,
            filter: selectedOccasion ? 'none' : 'grayscale(0.5)',
          }}
          transition={{ delay: 0.08, duration: 0.35 }}
          style={{ pointerEvents: selectedOccasion ? 'auto' : 'none' }}
        >
          <p style={{ fontFamily: 'Cormorant, Georgia, serif', fontSize: '0.72rem', fontWeight: 700, color: C.gold, textAlign: 'center', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 22 }}>
            {selectedOccasion ? OCCASION_TIER_KICKER[selectedOccasion] : 'Pick an occasion first ↑'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {(() => {
              const occTiers = selectedOccasion ? OCCASION_TIERS[selectedOccasion] : null;
              const accent = selectedOccasion ? OCCASION_ACCENT[selectedOccasion] : undefined;
              // Memorial = single-product (portrait only at £49). Others
              // render both tiers with their occasion-specific copy.
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

        {/* ── FLOW (appears after tier selection) ── */}
        <div id="gift-flow">
          <AnimatePresence>
            {selectedTier && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{ marginTop: 36, paddingTop: 32, borderTop: `2px solid ${C.cream3}` }}
              >
                {/* Selected tier reminder */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '1rem', color: C.ink }}>{TIERS[selectedTier].label}</span>
                  <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '1rem', color: C.ink }}>{fmt(TIER_CENTS[selectedTier].cents)}</span>
                  <button
                    onClick={() => { setSelectedTier(null); setStep(1); }}
                    style={{ marginLeft: 4, fontSize: '0.72rem', color: C.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    change
                  </button>
                </div>

                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
                  {[...Array(stepCount)].map((_, idx) => {
                    const s = idx + 1;
                    return (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.78rem', fontWeight: 700,
                          background: step >= s ? C.rose : C.cream3,
                          color: step >= s ? '#fff' : C.muted,
                          transition: 'all 0.3s',
                        }}>
                          {step > s ? <CheckCircle style={{ width: 14, height: 14 }} /> : s}
                        </div>
                        {s < stepCount && (
                          <div style={{ width: 28, height: 2, background: step > s ? C.rose : C.cream3, borderRadius: 2, transition: 'background 0.3s' }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">

                  {/* ── STEP 1: Who? ── */}
                  {step === 1 && (
                    <motion.div key="ds1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                      <p style={{ textAlign: 'center', fontFamily: '"DM Serif Display", Georgia, serif', fontWeight: 400, fontSize: '1.3rem', color: C.ink }}>Who's it for?</p>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        {[
                          { key: 'single' as const, icon: User, title: 'One Soul', sub: 'For one cherished pet parent' },
                          { key: 'multiple' as const, icon: Users, title: 'A Few Souls', sub: 'For several gifts at once' },
                        ].map(opt => (
                          <button key={opt.key} onClick={() => setGiftType(opt.key)} style={{
                            padding: '22px 16px', borderRadius: 18,
                            border: `2px solid ${giftType === opt.key ? C.rose : C.cream3}`,
                            background: giftType === opt.key ? C.roseGlow : 'white',
                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', position: 'relative',
                          }}>
                            {opt.key === 'multiple' && (
                              <span style={{ position: 'absolute', top: 8, right: 8, fontSize: '0.6rem', fontWeight: 700, background: C.green, color: '#fff', padding: '2px 8px', borderRadius: 20 }}>
                                SAVE UP TO 30%
                              </span>
                            )}
                            <opt.icon style={{ width: 34, height: 34, margin: '0 auto 10px', color: giftType === opt.key ? C.rose : C.muted }} />
                            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: C.ink }}>{opt.title}</p>
                            <p style={{ fontSize: '0.8rem', color: C.muted, marginTop: 4 }}>{opt.sub}</p>
                          </button>
                        ))}
                      </div>

                      {giftType && (
                        <motion.button
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          onClick={() => setStep(2)}
                          style={{
                            width: '100%', padding: '16px 0', borderRadius: 50, background: C.rose, color: '#fff',
                            fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: `0 4px 16px ${C.roseGlow}`,
                          }}
                        >
                          Continue <ChevronRight style={{ width: 18, height: 18 }} />
                        </motion.button>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: '0.75rem', color: C.muted }}>
                        {[{ i: Shield, t: 'Secure checkout' }, { i: Clock, t: 'Instant delivery' }, { i: Gift, t: 'Valid 1 year' }].map((b, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <b.i style={{ width: 13, height: 13 }} />{b.t}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* ── STEP 2: Delivery + recipient details ── */}
                  {step === 2 && (
                    <motion.div key="ds2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                        </button>
                        <p style={{ fontWeight: 700, fontSize: '1rem', color: C.ink }}>
                          {giftType === 'single' ? 'Their Details' : 'Add Recipients'}
                        </p>
                        <div style={{ width: 48 }} />
                      </div>

                      {/* Delivery method */}
                      <div style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                        <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.92rem', marginBottom: 12 }}>How should we deliver it?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          {[
                            { key: 'link' as const, icon: LinkIcon, title: 'Magic link', sub: 'Share via text, card, or in person', badge: 'Most flexible', color: C.gold },
                            { key: 'email' as const, icon: Send, title: 'Email directly', sub: 'We send a beautiful gift email', badge: null, color: C.rose },
                          ].map(opt => (
                            <button key={opt.key} onClick={() => setDeliveryMethod(opt.key)} style={{
                              padding: 16, borderRadius: 14,
                              border: `2px solid ${deliveryMethod === opt.key ? opt.color : C.cream3}`,
                              background: deliveryMethod === opt.key ? (opt.key === 'link' ? C.goldSoft : C.roseGlow) : 'transparent',
                              cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', position: 'relative',
                            }}>
                              {opt.badge && (
                                <span style={{ position: 'absolute', top: -8, left: 12, fontSize: '0.58rem', fontWeight: 700, background: C.gold, color: '#fff', padding: '2px 8px', borderRadius: 20 }}>
                                  {opt.badge}
                                </span>
                              )}
                              <opt.icon style={{ width: 20, height: 20, color: deliveryMethod === opt.key ? opt.color : C.muted, marginBottom: 8 }} />
                              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: C.ink }}>{opt.title}</p>
                              <p style={{ fontSize: '0.75rem', color: C.muted, marginTop: 2, lineHeight: 1.3 }}>{opt.sub}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Single recipient */}
                      {giftType === 'single' && (
                        <div style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                          <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.92rem', marginBottom: 12 }}>Who's the lucky pet parent?</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <input type="text" value={singleRecipient.name} onChange={e => updateSingleRecipient('name', e.target.value)} placeholder="Their name (optional)" style={inputStyle} />
                            {deliveryMethod === 'email' && (
                              <input type="email" value={singleRecipient.email} onChange={e => updateSingleRecipient('email', e.target.value)} placeholder="Their email address" style={inputStyle} />
                            )}
                            <div>
                              <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.82rem', marginBottom: 6 }}>What's this reading for?</p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                                {GIFT_OCCASION_OPTIONS.map((opt) => {
                                  const selected = (singleRecipient.occasion ?? 'discover') === opt.value;
                                  const isMem = opt.value === 'memorial';
                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => setSingleRecipient(r => ({ ...r, occasion: opt.value }))}
                                      style={{
                                        padding: '8px 10px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                                        border: selected
                                          ? `1.5px solid ${isMem ? '#788280' : C.gold}`
                                          : `1px solid ${C.cream3}`,
                                        background: selected
                                          ? (isMem ? 'rgba(120,130,125,0.12)' : C.goldSoft)
                                          : 'white',
                                        fontFamily: 'Cormorant, Georgia, serif',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: C.ink }}>
                                        <span>{opt.emoji}</span>{opt.label}
                                      </div>
                                      <div style={{ fontSize: '0.7rem', color: C.muted, marginTop: 2 }}>{opt.hint}</div>
                                    </button>
                                  );
                                })}
                              </div>
                              <p style={{ fontSize: '0.72rem', color: C.muted, marginTop: 6 }}>
                                Don't know? Leave as Discover — they can change it when they redeem.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Multiple recipients */}
                      {giftType === 'multiple' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {recipients.map((r, idx) => (
                            <div key={r.id} style={{ padding: 16, background: 'white', borderRadius: 16, border: `1px solid ${C.cream3}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: C.rose, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{idx + 1}</span>
                                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: C.ink }}>{r.name || `Recipient ${idx + 1}`}</span>
                                </div>
                                {recipients.length > 1 && (
                                  <button onClick={() => setRecipients(rs => rs.filter(x => x.id !== r.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
                                    <Trash2 style={{ width: 16, height: 16 }} />
                                  </button>
                                )}
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: deliveryMethod === 'email' ? '1fr 1fr' : '1fr', gap: 8 }}>
                                <input type="text" value={r.name} onChange={e => updateRecipient(r.id, 'name', e.target.value)} placeholder="Name" style={{ ...inputStyle, padding: '10px 14px', fontSize: '0.88rem' }} />
                                {deliveryMethod === 'email' && (
                                  <input type="email" value={r.email} onChange={e => updateRecipient(r.id, 'email', e.target.value)} placeholder="Email" style={{ ...inputStyle, padding: '10px 14px', fontSize: '0.88rem' }} />
                                )}
                              </div>
                              <div style={{ marginTop: 10 }}>
                                <p style={{ fontWeight: 600, color: C.ink, fontSize: '0.78rem', marginBottom: 6 }}>What's their reading for?</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {GIFT_OCCASION_OPTIONS.map((opt) => {
                                    const selected = (r.occasion ?? 'discover') === opt.value;
                                    const isMem = opt.value === 'memorial';
                                    return (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setRecipients(rs => rs.map(x => x.id === r.id ? { ...x, occasion: opt.value } : x))}
                                        style={{
                                          padding: '6px 10px', borderRadius: 14, cursor: 'pointer',
                                          border: selected
                                            ? `1.5px solid ${isMem ? '#788280' : C.gold}`
                                            : `1px solid ${C.cream3}`,
                                          background: selected
                                            ? (isMem ? 'rgba(120,130,125,0.12)' : C.goldSoft)
                                            : 'white',
                                          fontFamily: 'Cormorant, Georgia, serif',
                                          fontSize: '0.78rem', fontWeight: 600, color: C.ink,
                                        }}
                                      >
                                        {opt.emoji} {opt.label}
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
                              style={{
                                padding: 14, borderRadius: 14, border: `2px dashed ${C.rose}40`, background: C.roseGlow, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: C.rose, fontWeight: 600, fontSize: '0.88rem', fontFamily: 'Cormorant, Georgia, serif',
                              }}
                            >
                              <Plus style={{ width: 18, height: 18 }} /> Add another person
                              {discount < 0.30 && (
                                <span style={{ fontSize: '0.72rem', color: C.green, marginLeft: 4 }}>
                                  +{Math.round((getVolumeDiscount(recipients.length + 1) - discount) * 100)}% off
                                </span>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      <button onClick={() => setStep(3)} disabled={!canProceedStep2()} style={{
                        width: '100%', padding: '16px 0', borderRadius: 50,
                        background: canProceedStep2() ? C.rose : C.cream3,
                        color: canProceedStep2() ? '#fff' : C.muted,
                        fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1rem',
                        border: 'none', cursor: canProceedStep2() ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: canProceedStep2() ? `0 4px 16px ${C.roseGlow}` : 'none',
                      }}>
                        Continue to Checkout <ChevronRight style={{ width: 18, height: 18 }} />
                      </button>
                    </motion.div>
                  )}

                  {/* ── STEP 3: Checkout ── */}
                  {step === 3 && (
                    <motion.div key="ds3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                          <ArrowLeft style={{ width: 14, height: 14 }} /> Back
                        </button>
                        <p style={{ fontWeight: 700, fontSize: '1rem', color: C.ink }}>Almost Done</p>
                        <div style={{ width: 48 }} />
                      </div>

                      {/* Gift message first — emotional anchor */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: 4 }}>
                          Write them a message
                        </label>
                        <p style={{ fontSize: '0.78rem', color: C.muted, marginBottom: 8 }}>They'll see this the moment they open their gift.</p>
                        <textarea
                          value={giftMessage}
                          onChange={e => setGiftMessage(e.target.value)}
                          placeholder={`From the moment I saw you with your pet, I knew you two were meant to be...`}
                          rows={3}
                          maxLength={500}
                          style={{ ...inputStyle, resize: 'none' as const }}
                        />
                      </div>

                      {/* Purchaser email */}
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: 6 }}>
                          Your email
                          <span style={{ fontWeight: 400, color: C.muted }}> (for your receipt & gift link)</span>
                        </label>
                        <input type="email" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />
                      </div>

                      {/* Order summary */}
                      <div style={{ padding: 20, background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: `1px solid ${C.cream3}`, marginBottom: 12 }}>
                          <Gift style={{ width: 16, height: 16, color: C.rose }} />
                          <p style={{ fontWeight: 700, color: C.ink, fontSize: '0.88rem' }}>Order Summary</p>
                        </div>
                        {activeRecipients.map((r, idx) => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: idx < activeRecipients.length - 1 ? `1px solid ${C.cream3}` : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <PawPrint style={{ width: 14, height: 14, color: C.gold, flexShrink: 0 }} />
                              <div>
                                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: C.ink }}>{TIERS[selectedTier!].label}</p>
                                {r.name && <p style={{ fontSize: '0.72rem', color: C.rose }}>for {r.name}</p>}
                              </div>
                            </div>
                            <span style={{ fontSize: '0.88rem', color: C.muted }}>{fmt(TIER_CENTS[selectedTier!].cents)}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.cream3}` }}>
                          {discount > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                              <span style={{ color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Sparkles style={{ width: 12, height: 12 }} />{Math.round(discount * 100)}% volume discount
                              </span>
                              <span style={{ color: C.green }}>−{fmt(pricing.discountAmount)}</span>
                            </div>
                          )}
                          {pricing.promoAmount > 0 && appliedCoupon && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                              <span style={{ color: C.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Sparkles style={{ width: 12, height: 12 }} />{appliedCoupon.code} ({appliedCoupon.discount_value}% off)
                              </span>
                              <span style={{ color: C.green }}>−{fmt(pricing.promoAmount)}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700 }}>
                            <span style={{ color: C.ink }}>Total</span>
                            <span style={{ color: C.ink, fontFamily: '"DM Serif Display", Georgia, serif' }}>
                              {fmt(pricing.finalTotal)}
                            </span>
                          </div>
                          {isLocalized && (
                            <p style={{ fontSize: '0.7rem', color: C.muted, marginTop: 6, textAlign: 'right' }}>
                              Shown in {currencyCode} — billed in USD at checkout.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Promo code */}
                      {appliedCoupon ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(74,140,92,0.1)', border: '1px solid rgba(74,140,92,0.3)' }}>
                          <span style={{ fontSize: '0.85rem', color: C.green, fontWeight: 600 }}>{appliedCoupon.code} — {appliedCoupon.discount_value}% off applied!</span>
                          <button onClick={() => setAppliedCoupon(null)} style={{ background: 'none', border: 'none', color: C.green, cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>&times;</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              value={promoCode}
                              onChange={e => setPromoCode(e.target.value.toUpperCase())}
                              placeholder="PROMO CODE"
                              onKeyDown={e => e.key === 'Enter' && applyPromo()}
                              style={{ ...inputStyle, flex: 1, textTransform: 'uppercase' as const }}
                            />
                            <button
                              onClick={applyPromo}
                              disabled={!promoCode.trim() || isValidatingPromo}
                              style={{ padding: '14px 20px', borderRadius: 14, background: C.rose, color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', opacity: (!promoCode.trim() || isValidatingPromo) ? 0.5 : 1, whiteSpace: 'nowrap' }}
                            >
                              {isValidatingPromo ? '...' : 'Apply'}
                            </button>
                          </div>
                          {promoError && <p style={{ color: C.rose, fontSize: '0.75rem', marginTop: 4 }}>{promoError}</p>}
                        </div>
                      )}

                      {/* Guarantee */}
                      <div style={{ padding: 16, borderRadius: 16, background: 'rgba(74,140,92,0.06)', border: '1px solid rgba(74,140,92,0.15)', display: 'flex', alignItems: 'start', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(74,140,92,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Shield style={{ width: 18, height: 18, color: C.green }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: C.green, marginBottom: 2 }}>100% happiness guarantee</p>
                          <p style={{ fontSize: '0.78rem', color: C.warm, lineHeight: 1.4 }}>If they don't absolutely love it, full refund — no questions asked.</p>
                        </div>
                      </div>

                      {/* Pay button */}
                      <button
                        onClick={handlePurchase}
                        disabled={isLoading || !purchaserEmail.includes('@')}
                        style={{
                          width: '100%', padding: '18px 0', borderRadius: 50,
                          background: (isLoading || !purchaserEmail.includes('@')) ? C.cream3 : C.rose,
                          color: (isLoading || !purchaserEmail.includes('@')) ? C.muted : '#fff',
                          fontFamily: 'Cormorant, Georgia, serif', fontWeight: 700, fontSize: '1.1rem', border: 'none',
                          cursor: (isLoading || !purchaserEmail.includes('@')) ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          boxShadow: `0 6px 20px ${C.roseGlow}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        {isLoading
                          ? <><SpinnerInline />Processing...</>
                          : <><Gift style={{ width: 20, height: 20 }} />Send This Gift — {fmt(pricing.finalTotal)}</>
                        }
                      </button>

                      <TrustRow items={['Secure checkout', 'Instant delivery', 'Valid 1 year']} icons={[Shield, Clock, Gift]} />
                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── FOOTER (always visible when no tier selected) ── */}
        {!selectedTier && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>

            <details style={{ cursor: 'pointer' }}>
              <summary style={{ textAlign: 'center', fontSize: '0.85rem', color: C.rose, fontWeight: 500, userSelect: 'none' }}>
                How does gifting work?
              </summary>
              <div style={{ marginTop: 14, padding: 18, background: 'white', borderRadius: 16, border: `1px solid ${C.cream3}` }}>
                {[
                  { n: '1', t: 'Choose their reading', d: 'Pick the gift, finish checkout' },
                  { n: '2', t: 'Share the link, your way', d: 'Email it, text it, slip it in a card' },
                  { n: '3', t: 'They tell us about their pet', d: 'A name, a birthday, a photo' },
                  { n: '4', t: 'A private cinematic reveal awaits them', d: 'Yours forever, theirs to revisit' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 3 ? `1px solid ${C.cream3}` : 'none' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.roseGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: C.rose, flexShrink: 0 }}>{s.n}</div>
                    <div>
                      <span style={{ fontWeight: 600, color: C.ink, fontSize: '0.88rem' }}>{s.t}</span>
                      <span style={{ color: C.muted, fontSize: '0.78rem', marginLeft: 8 }}>{s.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: '0.75rem', color: C.muted }}>
              {[{ i: Shield, t: 'Secure checkout' }, { i: Clock, t: 'Instant (digital)' }, { i: Gift, t: 'Valid 1 year' }].map((b, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <b.i style={{ width: 13, height: 13 }} />{b.t}
                </span>
              ))}
            </div>
          </motion.div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes gift-review-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .gift-review-marquee-viewport:hover .gift-review-marquee-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .gift-review-marquee-track { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function SpinnerInline() {
  return (
    <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
  );
}

function TrustRow({ items, icons }: { items: string[]; icons: React.ElementType[] }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', fontSize: '0.72rem', color: '#958779' }}>
      {items.map((t, i) => {
        const Icon = icons[i];
        return (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon style={{ width: 12, height: 12 }} />{t}
          </span>
        );
      })}
    </div>
  );
}
