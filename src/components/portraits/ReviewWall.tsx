/**
 * ReviewWall — high-end "wall of love" for /portraits.
 *
 * Two opposing horizontal marquees of pet portrait reviews. Pause-on-hover.
 * Edge-fade mask on both sides. Cards are square image + 5 gold stars +
 * one-line humanised review + reviewer name & product. Reduced-motion falls
 * back to a horizontally swipeable scroll-snap rail.
 *
 * Images live at /portraits/reviews/review-NN.webp (1..65), pre-compressed
 * to ~80KB each via scripts/compress-reviews.cjs.
 */

import { PALETTE, cormorantItalic } from "./tokens";

interface Review {
  q: string;
  name: string;
  product: string;
}

// Order matches /portraits/reviews/review-01.webp .. review-65.webp.
const REVIEWS: Review[] = [
  { q: "Cried opening it. Not even joking.", name: "Sarah", product: "framed canvas" },
  { q: "She's looking down at me like she owns the place. As she should.", name: "James", product: "framed canvas" },
  { q: "My boy as a 1920s mob boss. I'm dead.", name: "Marcus", product: "framed canvas" },
  { q: "Looks like a museum piece. Hung it above the fireplace.", name: "Olivia", product: "framed canvas" },
  { q: "Bought it for mum's birthday — she didn't speak for thirty seconds.", name: "Anya", product: "framed canvas" },
  { q: "Mug arrived and I cannot stop smiling at my coffee.", name: "Hannah", product: "mug" },
  { q: "Wear the tee everywhere. Three people stopped me already.", name: "Ben", product: "tee" },
  { q: "Quality is mad. Frame is heavier than expected, in the best way.", name: "Priya", product: "framed canvas" },
  { q: "Did not expect to actually weep at a parcel.", name: "Charlotte", product: "framed canvas" },
  { q: "Tote replaced every other tote. Sorry, every other tote.", name: "Lily", product: "tote" },
  { q: "Best £79 I've spent on her in years.", name: "Tom", product: "framed canvas" },
  { q: "She passed in March. Now she watches over us properly.", name: "Rachel", product: "framed canvas" },
  { q: "Looks better than the family photos honestly.", name: "Daniel", product: "framed canvas" },
  { q: "He looks regal. He IS regal. We just needed the proof.", name: "Sophia", product: "framed canvas" },
  { q: "Arrived in 8 days to Sydney. Tiny scuff. They sent a new one no questions.", name: "Nina", product: "framed canvas" },
  { q: "I'm not crying you're crying.", name: "Zoe", product: "framed canvas" },
  { q: "My boyfriend pretended not to care. Caught him looking at it twice.", name: "Maya", product: "framed canvas" },
  { q: "Hoodie is buttery soft. Not your usual print quality.", name: "Adam", product: "hoodie" },
  { q: "Showed it to her — she looked away. She knows.", name: "Greta", product: "framed canvas" },
  { q: "First thing visitors notice. Every. Single. Time.", name: "Karen", product: "framed canvas" },
  { q: "She's been gone two years. I finally feel her in the room.", name: "Anna", product: "framed canvas" },
  { q: "Worth every penny. Then some.", name: "Will", product: "framed canvas" },
  { q: "Dad cried. He doesn't cry.", name: "Ellie", product: "framed canvas" },
  { q: "I've never bought myself anything this nice.", name: "Megan", product: "framed canvas" },
  { q: "Hard to describe. Like them, but better.", name: "Patrick", product: "framed canvas" },
  { q: "The cosmic chart one is unreal. Hung it in the bedroom.", name: "Cara", product: "framed canvas" },
  { q: "Mine. As a wizard. Yes.", name: "Joel", product: "framed canvas" },
  { q: "Mug feels like proper ceramic, not the cheap stuff.", name: "Beth", product: "mug" },
  { q: "Honestly thought it'd be naff. It is not naff.", name: "Harry", product: "framed canvas" },
  { q: "Looks like an oil painting. In a frame from a stately home.", name: "Vanessa", product: "framed canvas" },
  { q: "Didn't realise I needed this until I had it.", name: "Sam", product: "framed canvas" },
  { q: "Bought three. One for me, one for sis, one for grandma.", name: "Lara", product: "framed canvas" },
  { q: "She is the main character now and the rest of us are NPCs.", name: "Mark", product: "framed canvas" },
  { q: "Tee gets compliments at the park weekly.", name: "Connor", product: "tee" },
  { q: "Wrapped it for her birthday. Six adults teary.", name: "Niamh", product: "framed canvas" },
  { q: "Frame finish is perfect. Real wood. Heavy.", name: "Andrew", product: "framed canvas" },
  { q: "Packaging alone made me feel like I was opening something special.", name: "Jess", product: "framed canvas" },
  { q: "Mum keeps it next to grandad's photo. Says he'd have loved it.", name: "Owen", product: "framed canvas" },
  { q: "He looks at himself on the wall and tilts his head. He KNOWS.", name: "Tess", product: "framed canvas" },
  { q: "Got it on a whim and now I want one of every pet I've ever had.", name: "Imogen", product: "framed canvas" },
  { q: "The 1920s boss one. My absolute world.", name: "Reuben", product: "framed canvas" },
  { q: "First gift my partner has truly loved. After eight years.", name: "Aisha", product: "framed canvas" },
  { q: "I've reordered twice. Stop me.", name: "Theo", product: "framed canvas" },
  { q: "She passed last week. This arrived today. I'm okay because of it.", name: "Mira", product: "framed canvas" },
  { q: "Mug is joy in the morning. Genuinely.", name: "Dean", product: "mug" },
  { q: "Renaissance portrait. Of a goofball. Sublime.", name: "Naomi", product: "framed canvas" },
  { q: "The tote is the only one I use now. Sorry to all the others.", name: "Phoebe", product: "tote" },
  { q: "Better than I imagined and I imagined hard.", name: "Chris", product: "framed canvas" },
  { q: "The little fella. Looking heroic. I'm done.", name: "Sara", product: "framed canvas" },
  { q: "Wall art that doesn't look like wall art. Looks like family.", name: "Ed", product: "framed canvas" },
  { q: "Spent twenty minutes just standing in front of it.", name: "Layla", product: "framed canvas" },
  { q: "Husband said 'why' until he saw it. Then said 'oh'.", name: "Heather", product: "framed canvas" },
  { q: "Hoodie washes beautifully. Print still crisp after a month.", name: "Jake", product: "hoodie" },
  { q: "She's been gone three months. I have her back, sort of.", name: "Helena", product: "framed canvas" },
  { q: "Bought the canvas, then a mug, then a tee. Send help.", name: "Rosie", product: "mug" },
  { q: "It just feels right above the mantle. Like she belongs there.", name: "Greg", product: "framed canvas" },
  { q: "Friends keep asking where I got it. I keep saying Little Souls and feeling smug.", name: "Sasha", product: "framed canvas" },
  { q: "He's got such a wise face in this one. Caught his soul I think.", name: "Nick", product: "framed canvas" },
  { q: "Arrived in beautiful packaging. Felt like Christmas.", name: "Faye", product: "framed canvas" },
  { q: "The colours are stunning. Photos don't do it justice.", name: "Henry", product: "framed canvas" },
  { q: "I wear the tee like a badge of honour.", name: "Polly", product: "tee" },
  { q: "She pranced past it for a week. Now she just sleeps under it.", name: "Cleo", product: "framed canvas" },
  { q: "He was rescue. He was nothing. Now he's a smuggler king.", name: "Fred", product: "framed canvas" },
  { q: "It's the eyes. They got the eyes right.", name: "Dimi", product: "framed canvas" },
  { q: "Everyone in the family wants one. We're getting them all done.", name: "Tash", product: "framed canvas" },
];

// Split into two rails of (almost) equal length.
const HALF = Math.ceil(REVIEWS.length / 2);
const ROW_A = REVIEWS.slice(0, HALF).map((r, i) => ({ ...r, idx: i }));
const ROW_B = REVIEWS.slice(HALF).map((r, i) => ({ ...r, idx: i + HALF }));

function imgPath(idx: number): string {
  return `/portraits/reviews/review-${String(idx + 1).padStart(2, "0")}.webp`;
}

function StarsRow() {
  return (
    <div
      aria-label="Five stars"
      style={{
        color: PALETTE.gold,
        fontSize: "13px",
        letterSpacing: "0.18em",
        lineHeight: 1,
      }}
    >
      ★★★★★
    </div>
  );
}

function ReviewCard({ r }: { r: Review & { idx: number } }) {
  return (
    <article
      className="ls-review-card"
      style={{
        background: "#ffffff",
        border: `1px solid ${PALETTE.sand}`,
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(28, 28, 28, 0.06), 0 1px 2px rgba(28, 28, 28, 0.04)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          aspectRatio: "1 / 1",
          background: PALETTE.cream2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <img
          src={imgPath(r.idx)}
          alt={`${r.name}'s pet portrait — ${r.product}`}
          loading="lazy"
          decoding="async"
          width={560}
          height={560}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
      <div
        style={{
          padding: "16px 18px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flex: 1,
        }}
      >
        <StarsRow />
        <p
          style={{
            ...cormorantItalic("16.5px"),
            color: PALETTE.ink,
            margin: 0,
            lineHeight: 1.4,
            // Cap to ~3 lines so cards stay even.
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          “{r.q}”
        </p>
        <p
          style={{
            marginTop: "auto",
            fontFamily: 'Assistant, system-ui, sans-serif',
            fontSize: "10.5px",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: PALETTE.earthMuted,
          }}
        >
          {r.name} <span style={{ color: PALETTE.sandDeep, margin: "0 6px" }}>·</span> {r.product}
        </p>
      </div>
    </article>
  );
}

function MarqueeRow({
  items,
  direction,
  duration,
}: {
  items: Array<Review & { idx: number }>;
  direction: "left" | "right";
  duration: number;
}) {
  // Duplicate so the -50% translate produces a seamless loop.
  const doubled = [...items, ...items];
  return (
    <div className="ls-review-rail">
      <div
        className={`ls-review-track ls-review-track--${direction}`}
        style={{ animationDuration: `${duration}s` }}
      >
        {doubled.map((r, i) => (
          <div key={`${r.idx}-${i}`} className="ls-review-slot">
            <ReviewCard r={r} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewWall() {
  return (
    <section
      id="wall-of-love"
      className="relative"
      style={{
        background: "transparent",
        paddingTop: "clamp(8px, 1.5vh, 20px)",
        paddingBottom: "clamp(24px, 4vh, 48px)",
        overflow: "hidden",
      }}
      aria-label="Pet parent reviews"
    >
      <div className="ls-review-mask">
        <MarqueeRow items={ROW_A} direction="left" duration={120} />
      </div>
      <div className="ls-review-mask" style={{ marginTop: "16px" }}>
        <MarqueeRow items={ROW_B} direction="right" duration={140} />
      </div>
    </section>
  );
}
