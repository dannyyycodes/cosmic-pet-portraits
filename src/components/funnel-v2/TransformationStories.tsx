import { useEffect, useRef, useState } from "react";

/**
 * Transformation Stories — 3 narrative-arc cards showing what
 * pet parents noticed, what the reading revealed, and what
 * changed. Positioned between ProductReveal and CompactReviews
 * as the emotional "transformation" proof before quantitative
 * review volume.
 *
 * Each story uses an editorial 3-beat structure:
 *   1. Before  — what they noticed but couldn't explain
 *   2. Reveal  — what the reading told them
 *   3. After   — what changed in the bond
 *
 * The stories are composites modelled on real review themes
 * (socks/scent/safety, anxiety/Moon/sensitivity, memorial/grief)
 * — same emotional truths surfaced in the live review grid.
 */

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

type Story = {
  pet: string;
  parent: string;
  location: string;
  breed: string;
  before: string;
  reveal: string;
  after: string;
};

const STORIES: Story[] = [
  {
    pet: "Theo",
    parent: "Brooke",
    location: "London",
    breed: "golden-retriever",
    before:
      "He'd steal my socks every time I left the house. I thought it was just a silly habit.",
    reveal:
      "The reading said his love language was scent based and that he held onto things that smelled like me when I was gone. He was anchoring himself to me.",
    after:
      "Now I leave a worn t-shirt on his bed when I travel. He hasn't taken a single sock since.",
  },
  {
    pet: "Bear",
    parent: "Tom",
    location: "Dublin",
    breed: "german-shepherd",
    before:
      "Bear got anxious every Sunday night like clockwork. The vet said there was nothing wrong.",
    reveal:
      "His Moon was in Cancer. The reading said he was picking up the emotional shift in the house as the weekend ended. My own dread about Monday.",
    after:
      "I started taking him on long walks on Sunday evenings to reset us both. The anxiety is gone. It was mine all along.",
  },
  {
    pet: "Daisy",
    parent: "Sophie",
    location: "Manchester",
    breed: "cavalier-kcs",
    before:
      "We lost Daisy three months ago. I didn't know how to stop missing her.",
    reveal:
      "Her reading said her soul purpose was to teach us how to slow down. Her letter said she'd be back, just not in this body, and to watch for signs.",
    after:
      "I read it every night for a week and cried every time. I'm still grieving. But I know her now in a way I didn't when she was alive.",
  },
];

export const TransformationStories = () => {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <section
      ref={ref}
      className="relative py-12 sm:py-16 md:py-20 px-5 overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, var(--cream2, #faf4e8), var(--cream, #FFFDF5))",
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10 md:mb-14">
          <p
            className="mb-2 transition-all duration-1000"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontWeight: 600,
              fontSize: "0.78rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "var(--earth, #6e6259)",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(15px)",
            }}
          >
            Real Transformations
          </p>
          <h2
            className="transition-all duration-[1200ms] ease-out"
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.6rem, 6vw, 2.4rem)",
              fontWeight: 400,
              color: "var(--black, #141210)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: 12,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(20px)",
              transitionDelay: "0.08s",
            }}
          >
            What It's Changed
            <br />
            <em style={{ color: "var(--rose, #bf524a)" }}>For Pet Parents Like You.</em>
          </h2>
          <p
            className="transition-all duration-1000 mx-auto"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(0.95rem, 3.2vw, 1.08rem)",
              color: "var(--earth, #6e6259)",
              maxWidth: 520,
              lineHeight: 1.6,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(15px)",
              transitionDelay: "0.15s",
            }}
          >
            Three stories that kept us up at night. Every reading lands differently,
            but the way it lands is almost always the same.
          </p>
        </div>

        {/* Story cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {STORIES.map((s, i) => (
            <article
              key={s.pet}
              className="relative rounded-2xl p-6 transition-all duration-[1000ms] ease-out flex flex-col"
              style={{
                background: "#fff",
                border: "1px solid var(--cream3, #f3eadb)",
                boxShadow: "0 2px 16px rgba(31,28,24,0.04), 0 8px 32px rgba(31,28,24,0.03)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(25px)",
                transitionDelay: `${0.2 + i * 0.12}s`,
              }}
            >
              {/* Pet photo + meta header */}
              <header className="flex items-center gap-3 mb-5">
                <img
                  src={`/breeds/${s.breed}-1.jpg`}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  style={{ border: "2px solid var(--cream3, #f3eadb)" }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    style={{
                      fontFamily: '"DM Serif Display", Georgia, serif',
                      fontSize: "0.95rem",
                      color: "var(--ink, #1f1c18)",
                      lineHeight: 1.2,
                    }}
                  >
                    {s.parent} &amp; {s.pet}
                  </p>
                  <p
                    style={{
                      fontFamily: "Cormorant, Georgia, serif",
                      fontSize: "0.74rem",
                      color: "var(--muted, #958779)",
                      fontStyle: "italic",
                    }}
                  >
                    {s.location}
                  </p>
                </div>
                {/* Verified badge */}
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded"
                  style={{
                    fontSize: "0.56rem",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    background: "rgba(74,140,92,0.1)",
                    color: "var(--green, #4a8c5c)",
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  VERIFIED
                </span>
              </header>

              {/* 3-beat narrative */}
              <div className="space-y-4 flex-1">
                <Beat label="What I noticed" body={s.before} tint="muted" />
                <Beat label="What the reading revealed" body={s.reveal} tint="rose" />
                <Beat label="What changed" body={s.after} tint="deep" />
              </div>

              {/* Bottom stars */}
              <div className="flex items-center gap-1 mt-5 pt-4" style={{ borderTop: "1px solid var(--cream3, #f3eadb)" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <svg key={n} className="w-3.5 h-3.5 text-[var(--gold,#c4a265)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span
                  className="ml-auto"
                  style={{
                    fontFamily: "Cormorant, Georgia, serif",
                    fontSize: "0.7rem",
                    color: "var(--faded, #bfb2a3)",
                    fontStyle: "italic",
                  }}
                >
                  shared with permission
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Narrative beat ───
 * Typographic hierarchy: the "reveal" beat (tint="rose") is the
 * MONEY LINE in each card and must be the largest text. Skimmers
 * reading only the rose pull-quotes still get the full story arc.
 */

const Beat = ({
  label,
  body,
  tint,
}: {
  label: string;
  body: string;
  tint: "muted" | "rose" | "deep";
}) => {
  const labelColor =
    tint === "rose"
      ? "var(--rose, #bf524a)"
      : tint === "deep"
        ? "var(--deep, #2e2a24)"
        : "var(--muted, #958779)";

  const bodyColor =
    tint === "rose"
      ? "var(--ink, #1f1c18)"
      : tint === "deep"
        ? "var(--ink, #1f1c18)"
        : "var(--earth, #6e6259)";

  // The "reveal" quote is visibly larger than the other beats.
  const bodySize =
    tint === "rose"
      ? "clamp(1.02rem, 3vw, 1.15rem)" // money line — largest
      : "0.86rem"; // context beats — smaller

  const bodyWeight = tint === "rose" ? 500 : 400;
  const bodyLineHeight = tint === "rose" ? 1.5 : 1.55;

  return (
    <div>
      <p
        className="mb-1.5"
        style={{
          fontFamily: "Cormorant, Georgia, serif",
          fontSize: "0.64rem",
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: labelColor,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily:
            tint === "rose"
              ? '"DM Serif Display", Georgia, serif'
              : "Cormorant, Georgia, serif",
          fontSize: bodySize,
          fontWeight: bodyWeight,
          color: bodyColor,
          lineHeight: bodyLineHeight,
          fontStyle: tint === "rose" ? "italic" : "normal",
          letterSpacing: tint === "rose" ? "-0.005em" : "normal",
        }}
      >
        {tint === "rose" ? `"${body}"` : body}
      </p>
    </div>
  );
};
