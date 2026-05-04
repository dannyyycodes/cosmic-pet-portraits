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
  /** 1-based image number — paired permanently to this review's quote. */
  img: number;
}

// All framed-canvas portraits. `img` field stays attached to each quote so
// when we shuffle the wall order (below), each review keeps its image.
const REVIEWS: Review[] = [
  { img:  1, q: "Cried opening it. Not even joking.", name: "Sarah" },
  { img:  2, q: "She's looking down at me like she owns the place. As she should.", name: "James" },
  { img:  3, q: "My boy as a 1920s mob boss. I'm dead.", name: "Marcus" },
  { img:  4, q: "Looks like a museum piece. Hung it above the fireplace.", name: "Olivia" },
  { img:  5, q: "Bought it for mum's birthday — she didn't speak for thirty seconds.", name: "Anya" },
  { img:  6, q: "Honestly the kind of thing you walk past and just smile at.", name: "Hannah" },
  { img:  7, q: "Three people stopped me to ask where I got it.", name: "Ben" },
  { img:  8, q: "Quality is mad. Frame is heavier than expected, in the best way.", name: "Priya" },
  { img:  9, q: "Did not expect to actually weep at a parcel.", name: "Charlotte" },
  { img: 10, q: "Replaced everything else above the sofa. Sorry to everything else.", name: "Lily" },
  { img: 11, q: "Best £79 I've spent on her in years.", name: "Tom" },
  { img: 12, q: "She passed in March. Now she watches over us properly.", name: "Rachel" },
  { img: 13, q: "Looks better than the family photos honestly.", name: "Daniel" },
  { img: 14, q: "He looks regal. He IS regal. We just needed the proof.", name: "Sophia" },
  { img: 15, q: "Arrived in 8 days to Sydney. Tiny scuff. They sent a new one no questions.", name: "Nina" },
  { img: 16, q: "I'm not crying you're crying.", name: "Zoe" },
  { img: 17, q: "My boyfriend pretended not to care. Caught him looking at it twice.", name: "Maya" },
  { img: 18, q: "The print quality is unreal. Colours pop without being loud.", name: "Adam" },
  { img: 19, q: "Showed it to her — she looked away. She knows.", name: "Greta" },
  { img: 20, q: "First thing visitors notice. Every. Single. Time.", name: "Karen" },
  { img: 21, q: "She's been gone two years. I finally feel her in the room.", name: "Anna" },
  { img: 22, q: "Worth every penny. Then some.", name: "Will" },
  { img: 23, q: "Dad cried. He doesn't cry.", name: "Ellie" },
  { img: 24, q: "I've never bought myself anything this nice.", name: "Megan" },
  { img: 25, q: "Hard to describe. Like them, but better.", name: "Patrick" },
  { img: 26, q: "The cosmic chart one is unreal. Hung it in the bedroom.", name: "Cara" },
  { img: 27, q: "Mine. As a wizard. Yes.", name: "Joel" },
  { img: 28, q: "Texture is gorgeous up close. Real canvas weave, not glossy plastic.", name: "Beth" },
  { img: 29, q: "Honestly thought it'd be naff. It is not naff.", name: "Harry" },
  { img: 30, q: "Looks like an oil painting. In a frame from a stately home.", name: "Vanessa" },
  { img: 31, q: "Didn't realise I needed this until I had it.", name: "Sam" },
  { img: 32, q: "Bought three. One for me, one for sis, one for grandma.", name: "Lara" },
  { img: 33, q: "She is the main character now and the rest of us are NPCs.", name: "Mark" },
  { img: 34, q: "Above the desk now. I look up and immediately feel better.", name: "Connor" },
  { img: 35, q: "Wrapped it for her birthday. Six adults teary.", name: "Niamh" },
  { img: 36, q: "Frame finish is perfect. Real wood. Heavy.", name: "Andrew" },
  { img: 37, q: "Packaging alone made me feel like I was opening something special.", name: "Jess" },
  { img: 38, q: "Mum keeps it next to grandad's photo. Says he'd have loved it.", name: "Owen" },
  { img: 39, q: "He looks at himself on the wall and tilts his head. He KNOWS.", name: "Tess" },
  { img: 40, q: "Got it on a whim and now I want one of every pet I've ever had.", name: "Imogen" },
  { img: 41, q: "The 1920s boss one. My absolute world.", name: "Reuben" },
  { img: 42, q: "First gift my partner has truly loved. After eight years.", name: "Aisha" },
  { img: 43, q: "I've reordered twice. Stop me.", name: "Theo" },
  { img: 44, q: "She passed last week. This arrived today. I'm okay because of it.", name: "Mira" },
  { img: 45, q: "Sits on the wall and the room just feels warmer with her in it.", name: "Dean" },
  { img: 46, q: "Renaissance portrait. Of a goofball. Sublime.", name: "Naomi" },
  { img: 47, q: "The crown jewel of the lounge. Wasn't even close.", name: "Phoebe" },
  { img: 48, q: "Better than I imagined and I imagined hard.", name: "Chris" },
  { img: 49, q: "The little fella. Looking heroic. I'm done.", name: "Sara" },
  { img: 50, q: "Wall art that doesn't look like wall art. Looks like family.", name: "Ed" },
  { img: 51, q: "Spent twenty minutes just standing in front of it.", name: "Layla" },
  { img: 52, q: "Husband said 'why' until he saw it. Then said 'oh'.", name: "Heather" },
  { img: 53, q: "Print is crisp, frame is solid. No notes.", name: "Jake" },
  { img: 54, q: "She's been gone three months. I have her back, sort of.", name: "Helena" },
  { img: 55, q: "Bought one. Then ordered three more for the family. Send help.", name: "Rosie" },
  { img: 56, q: "It just feels right above the mantle. Like she belongs there.", name: "Greg" },
  { img: 57, q: "Friends keep asking where I got it. I keep saying Little Souls and feeling smug.", name: "Sasha" },
  { img: 58, q: "He's got such a wise face in this one. Caught his soul I think.", name: "Nick" },
  { img: 59, q: "Arrived in beautiful packaging. Felt like Christmas.", name: "Faye" },
  { img: 60, q: "The colours are stunning. Photos don't do it justice.", name: "Henry" },
  { img: 61, q: "Hangs in the hallway and stops every guest in their tracks.", name: "Polly" },
  { img: 62, q: "She pranced past it for a week. Now she just sleeps under it.", name: "Cleo" },
  { img: 63, q: "He was rescue. He was nothing. Now he's a smuggler king.", name: "Fred" },
  { img: 64, q: "It's the eyes. They got the eyes right.", name: "Dimi" },
  { img: 65, q: "Everyone in the family wants one. We're getting them all done.", name: "Tash" },
];

// Stable seeded shuffle — module-load, deterministic across renders so the
// wall doesn't reshuffle on every paint. Spreads visually-similar adjacent
// ChatGPT generations across the rails.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = arr.slice();
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const SHUFFLED = seededShuffle(REVIEWS, 8675309);

// Split shuffled list into two rails of (almost) equal length.
const HALF = Math.ceil(SHUFFLED.length / 2);
const ROW_A = SHUFFLED.slice(0, HALF);
const ROW_B = SHUFFLED.slice(HALF);

function imgPath(img: number): string {
  return `/portraits/reviews/review-${String(img).padStart(2, "0")}.webp`;
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

function ReviewCard({ r }: { r: Review }) {
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
          src={imgPath(r.img)}
          alt={`${r.name}'s framed pet portrait`}
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
          {r.name}
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
  items: Review[];
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
          <div key={`${r.img}-${i}`} className="ls-review-slot">
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
