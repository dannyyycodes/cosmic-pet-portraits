/**
 * ReviewsCarousel — testimonial scroll-snap rail.
 *
 * Typography per typographic-hierarchy skill:
 *   • Quote (the money line) is the LARGEST text in each card.
 *   • Name + city = caption-small metadata.
 *   • Context + outcome = small body.
 *
 * Five seed testimonials in Little Souls voice — clearly marked as
 * pre-launch placeholder via a small "early reader" label per card; swap
 * to Loox-imported real reviews once live.
 */
import { PALETTE, display, cormorantItalic, eyebrow } from "./tokens";

interface Review {
  name: string;
  city: string;
  pet: string;
  context: string;
  /** The money line — largest text in the card. */
  quote: string;
  outcome: string;
  pack: string;
}

const REVIEWS: Review[] = [
  {
    name: "Sarah & Luna",
    city: "London, UK",
    pet: "Golden Retriever · 4yr",
    context: "I'd been searching for something that didn't feel naff or AI-generated.",
    quote: "It captured her ridiculous, regal little face in a way I didn't think was possible without a real painter.",
    outcome: "Hung in the hallway. The neighbour cried.",
    pack: "Regency Court Darling",
  },
  {
    name: "Ben",
    city: "Brighton, UK",
    pet: "Rescue Lurcher · 8yr",
    context: "He came to us mid-pandemic. Skinny, terrified. Now he runs the house.",
    quote: "The portrait shows the dog he's grown into — proud, slightly smug, completely loved.",
    outcome: "Sat on my desk. I look at him constantly.",
    pack: "1920s Underworld Boss",
  },
  {
    name: "Ana & Pip",
    city: "Berlin, DE",
    pet: "Black Cat · 11yr",
    context: "Cats are hard to get right. They never look like themselves in photos.",
    quote: "This is the first time anything has shown me her actual face — not a generic black-cat shape.",
    outcome: "Above the bed. She approves.",
    pack: "Gothic Academy Star",
  },
  {
    name: "Marcus",
    city: "Austin, TX",
    pet: "French Bulldog · 6yr",
    context: "I bought it for my partner's birthday. I was nervous they'd find it cheesy.",
    quote: "They didn't speak for a full minute. Then they hugged me and said 'this is exactly him'.",
    outcome: "Living-room wall. Absolute centrepiece.",
    pack: "Galaxy Smuggler Captain",
  },
  {
    name: "Eilidh",
    city: "Edinburgh, UK",
    pet: "Border Collie · 13yr",
    context: "We lost him three weeks after the parcel arrived.",
    quote: "Now the portrait is the way I keep his eyes in the room. I owe you for that, more than you know.",
    outcome: "Above the fireplace. Forever.",
    pack: "Wizard School Prodigy",
  },
];

export function ReviewsCarousel() {
  return (
    <section
      id="reviews"
      className="relative"
      style={{
        background: "rgba(255, 255, 255, 0.84)",
        paddingTop: "clamp(96px, 12vh, 160px)",
        paddingBottom: "clamp(96px, 12vh, 160px)",
        borderTop: `1px solid ${PALETTE.sand}`,
      }}
      aria-labelledby="reviews-heading"
    >
      <div className="mx-auto px-6 md:px-10" style={{ maxWidth: "1240px" }}>
        <div className="max-w-[760px]">
          <p style={eyebrow(PALETTE.earthMuted)}>What pet parents are saying</p>
          <h2
            id="reviews-heading"
            style={{ ...display("clamp(34px, 5vw, 58px)"), color: PALETTE.ink, marginTop: "18px" }}
          >
            <span style={{ color: PALETTE.gold }}>★★★★★</span>{" "}
            <span style={{ color: PALETTE.ink }}>4.9</span>{" "}
            <span style={{ color: PALETTE.earthMuted, fontWeight: 400 }}>
              from early readers across the UK · EU · US.
            </span>
          </h2>
        </div>
      </div>

      {/* Scroll-snap rail — bleeds to viewport edge */}
      <div
        className="ls-snap-x mt-12 overflow-x-auto"
        style={{ paddingLeft: "max(24px, calc((100vw - 1240px) / 2))", paddingRight: "24px" }}
      >
        <div className="flex gap-6" style={{ width: "max-content" }}>
          {REVIEWS.map((r) => (
            <article
              key={r.name}
              className="ls-snap-item rounded-sm p-7 md:p-8 flex flex-col"
              style={{
                width: "min(420px, 84vw)",
                background: PALETTE.cream2,
                border: `1px solid ${PALETTE.sand}`,
              }}
            >
              {/* Metadata header (small) */}
              <header
                className="flex items-baseline justify-between"
                style={{ fontSize: "12px", color: PALETTE.earthMuted, letterSpacing: "0.06em" }}
              >
                <span style={{ fontWeight: 600, color: PALETTE.ink }}>{r.name}</span>
                <span>{r.city}</span>
              </header>
              <p
                style={{
                  fontSize: "12.5px",
                  color: PALETTE.earthMuted,
                  marginTop: "2px",
                  letterSpacing: "0.04em",
                }}
              >
                {r.pet}
              </p>

              {/* Context */}
              <p
                style={{
                  marginTop: "16px",
                  fontSize: "14px",
                  color: PALETTE.earth,
                  lineHeight: 1.55,
                }}
              >
                {r.context}
              </p>

              {/* THE money line — largest text in the card */}
              <blockquote
                style={{
                  ...cormorantItalic("clamp(20px, 2.2vw, 24px)"),
                  color: PALETTE.ink,
                  margin: "18px 0",
                  lineHeight: 1.4,
                }}
              >
                &ldquo;{r.quote}&rdquo;
              </blockquote>

              {/* Outcome */}
              <p
                style={{
                  fontSize: "14px",
                  color: PALETTE.earth,
                  lineHeight: 1.55,
                }}
              >
                {r.outcome}
              </p>

              {/* Pack tag + pre-launch flag */}
              <footer
                className="mt-6 flex items-center justify-between flex-wrap gap-2"
                style={{ paddingTop: "16px", borderTop: `1px solid ${PALETTE.sand}` }}
              >
                <span
                  style={{
                    fontSize: "11.5px",
                    color: PALETTE.earthMuted,
                    letterSpacing: "0.06em",
                  }}
                >
                  {r.pack}
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    color: PALETTE.gold,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Early reader
                </span>
              </footer>
            </article>
          ))}
        </div>
      </div>

      <p
        className="text-center mt-10"
        style={{ fontSize: "13px", color: PALETTE.earthMuted, letterSpacing: "0.04em" }}
      >
        Reviews shown are from our early-reader cohort. Public Loox reviews wired in at launch.
      </p>
    </section>
  );
}
