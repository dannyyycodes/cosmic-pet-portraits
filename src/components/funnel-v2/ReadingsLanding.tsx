import { useEffect, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Heart,
  MessageCircle,
  Moon,
  ShieldCheck,
  Stars,
} from "lucide-react";
import { InlineCheckout } from "./InlineCheckout";

const C = {
  ink: "#141210",
  cream: "#f5efe6",
  creamDim: "#cfc1b1",
  muted: "#9d8d7f",
  gold: "#d4b67a",
  goldSoft: "#f0d99f",
  goldDeep: "#8b6f3a",
  cosmos: "#0d0a14",
  cosmos2: "#15101c",
  cosmos3: "#201722",
  line: "rgba(212, 182, 122, 0.22)",
  lineSoft: "rgba(245, 239, 230, 0.10)",
};

const PLACEHOLDERS = [
  {
    key: "hero-doberman-galaxy-eyes.png",
    title: "Doberman puppy",
    note: "Galaxy eyes hero",
  },
  {
    key: "hero-black-cat-galaxy-eyes.png",
    title: "Black cat",
    note: "Galaxy eyes hero",
  },
  {
    key: "hero-cockapoo-ipad-reading.png",
    title: "Cockapoo and iPad",
    note: "Reading in hand",
  },
  {
    key: "reading-on-phone-live-view.png",
    title: "Phone reading",
    note: "Private reveal",
  },
  {
    key: "birth-chart-tablet-pet-nearby.png",
    title: "Birth sky",
    note: "Chart and pet nearby",
  },
  {
    key: "quiet-keepsake-reading-moment.png",
    title: "Quiet keepsake",
    note: "At home with them",
  },
] as const;

const PROCESS = [
  {
    title: "Share the clues.",
    body: "Their name, face, birthday and the little things only you notice.",
  },
  {
    title: "We read their sky.",
    body: "Their birth chart gives the reading its spine: Moon, planets, rising and pattern.",
  },
  {
    title: "You feel the click.",
    body: "Their habits, needs and love language start to sound like the pet you know.",
  },
];

const READING_DETAILS = [
  {
    icon: Heart,
    title: "The emotional blueprint",
    body: "How they love, what soothes them, and what they are always asking for.",
  },
  {
    icon: Moon,
    title: "Their birth sky",
    body: "Moon, rising and planets read together, not a one-line zodiac label.",
  },
  {
    icon: MessageCircle,
    title: "SoulSpeak",
    body: "Ask from inside the same world of their chart and personality.",
  },
  {
    icon: BookOpen,
    title: "A keepsake you return to",
    body: "A quiet place to revisit when you need to feel close to them.",
  },
];

const AUTHORITY_ITEMS = [
  {
    icon: ShieldCheck,
    title: "VSOP87",
    body: "Precise planetary positions.",
  },
  {
    icon: Clock3,
    title: "Calculated with care",
    body: "Birth date, time and place matter.",
  },
  {
    icon: Stars,
    title: "13 celestial bodies",
    body: "Sun through Pluto, plus Chiron, Node and Lilith.",
  },
  {
    icon: Check,
    title: "Specific, not generic",
    body: "Their chart gives the reading shape.",
  },
];

const CHART_PREVIEW_ITEMS = [
  ["Moon", "Emotional body"],
  ["Rising", "How they meet the world"],
  ["Venus", "How they ask for love"],
  ["Mars", "Instinct and courage"],
  ["Jupiter", "Their trust pattern"],
  ["Saturn", "What makes them feel safe"],
  ["Full moon", "The phase imprint"],
  ["All planets", "Sun through Pluto"],
] as const;

type ChartBody = {
  sign: string;
  degree?: number;
  element?: string;
  modality?: string;
  ruler?: string;
};

type PetBirthChart = {
  sun?: ChartBody;
  moon?: ChartBody;
  ascendant?: ChartBody | null;
  mercury?: ChartBody;
  venus?: ChartBody;
  mars?: ChartBody;
  jupiter?: ChartBody;
  saturn?: ChartBody;
  uranus?: ChartBody;
  neptune?: ChartBody;
  pluto?: ChartBody;
  chiron?: ChartBody;
  northNode?: ChartBody;
  lilith?: ChartBody;
  dominantElement?: string;
  ascendantNote?: string;
};

const BIRTH_CHART_ENDPOINT = "https://aduibsyrnenzobuyetmn.supabase.co/functions/v1/pet-birth-chart";

const FAQ = [
  {
    q: "What if I do not know their exact birthday?",
    a: "Use the closest date you have. Rescue and adopted pets are welcome. The reading works with honest uncertainty and keeps the astrology grounded.",
  },
  {
    q: "Is this only for dogs and cats?",
    a: "No. Dogs and cats are common, but any beloved pet can have a reading when you can share their story and the details you know.",
  },
  {
    q: "Is this separate from Pawtraits?",
    a: "Yes. Pawtraits are the portrait studio. This page is for the soul reading: the emotional, astrological story behind who they are.",
  },
];

export function ReadingsLanding() {
  const pageRef = useRef<HTMLElement>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);
  const [selectedPrice, setSelectedPrice] = useState(0);
  useCosmicParallax(pageRef);

  const scrollToCheckout = () => {
    checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main ref={pageRef} className="ls-cosmic-page min-h-screen overflow-hidden" style={{ background: C.cosmos, color: C.cream }}>
      <CosmicStyles />
      <CosmicBackdrop />
      <HeroSection onBegin={scrollToCheckout} />
      <SignalStrip />
      <BirthChartPreviewSection />
      <ProcessSection />
      <InsideReadingSection />
      <AuthoritySection />
      <CheckoutSection
        checkoutRef={checkoutRef}
        selectedPrice={selectedPrice}
        onSelectedPriceChange={setSelectedPrice}
      />
      <QuietMomentSection />
      <FaqSection />
    </main>
  );
}

function useCosmicParallax(pageRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const page = pageRef.current;
    if (!page || typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const setScroll = () => {
      frame = 0;
      if (reduced.matches) return;
      page.style.setProperty("--ls-scroll-y", `${window.scrollY.toFixed(0)}`);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(setScroll);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reduced.matches || window.innerWidth < 900) return;
      const x = (event.clientX / window.innerWidth - 0.5).toFixed(3);
      const y = (event.clientY / window.innerHeight - 0.5).toFixed(3);
      page.style.setProperty("--ls-pointer-x", x);
      page.style.setProperty("--ls-pointer-y", y);
    };

    setScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [pageRef]);
}

function HeroSection({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="ls-parallax-band relative isolate min-h-[860px] px-5 pb-24 pt-28 sm:pt-34 lg:flex lg:min-h-[920px] lg:items-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_8%,rgba(212,182,122,0.20),transparent_30%),radial-gradient(ellipse_at_12%_18%,rgba(94,70,122,0.20),transparent_28%),linear-gradient(140deg,#21152b_0%,#0d0a14_48%,#08060b_100%)]" />
      <ShootingStar />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[0.86fr_1.14fr]">
        <div className="max-w-2xl">
          <h1 className="mt-6 text-balance" style={heroTitleStyle}>
            See the little soul behind the eyes.
          </h1>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button onClick={onBegin} className="ls-gold-button">
              Begin Their Reading <ArrowRight size={17} />
            </button>
            <a href="#how-it-works" className="ls-ghost-button">
              See how it works
            </a>
          </div>
          <p className="mt-8 max-w-lg text-pretty" style={whisperStyle}>
            For the look you never needed translated until now.
          </p>
        </div>

        <div className="ls-hero-orbit">
          <PlaceholderFrame item={PLACEHOLDERS[0]} className="ls-orbit-card ls-orbit-a aspect-[4/5]" />
          <PlaceholderFrame item={PLACEHOLDERS[1]} className="ls-orbit-card ls-orbit-b aspect-square" />
          <PlaceholderFrame item={PLACEHOLDERS[2]} className="ls-orbit-card ls-orbit-c aspect-[16/9]" />
          <div className="ls-video-seed">
            <span>Future hero motion slot</span>
            <strong>Cat watching a shooting star</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function SignalStrip() {
  const items = [
    ["The bond", "The way they read you."],
    ["The sky", "The moment they arrived."],
    ["The reveal", "Words for what you already felt."],
  ];

  return (
    <section className="relative px-5 py-12">
      <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-[8px]" style={{ border: `1px solid ${C.line}`, background: C.line }}>
        <div className="grid gap-px md:grid-cols-3">
          {items.map(([title, body]) => (
            <article key={title} className="ls-panel p-6 md:p-8">
              <p style={eyebrowStyle(C.gold)}>{title}</p>
              <p className="mt-4 text-pretty" style={panelLeadStyle}>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BirthChartPreviewSection() {
  const [date, setDate] = useState("");
  const [chart, setChart] = useState<PetBirthChart | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");

  const previewItems = chart
    ? [
        ["Sun", describeBody(chart.sun)],
        ["Moon", describeBody(chart.moon)],
        ["Mercury", describeBody(chart.mercury)],
        ["Venus", describeBody(chart.venus)],
        ["Mars", describeBody(chart.mars)],
        ["Jupiter", describeBody(chart.jupiter)],
        ["Saturn", describeBody(chart.saturn)],
        ["Dominant", chart.dominantElement ? `${chart.dominantElement} element` : "Calculated pattern"],
      ]
    : CHART_PREVIEW_ITEMS;

  const handlePreview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!date) {
      setStatus("error");
      setMessage("Choose their birth date or adoption date first.");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      const url = `${BIRTH_CHART_ENDPOINT}?date=${encodeURIComponent(date)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Birth chart request failed: ${response.status}`);
      const data = (await response.json()) as PetBirthChart;
      if (!data?.sun) throw new Error("Birth chart response was incomplete.");
      setChart(data);
      setStatus("ready");
      setMessage(data.ascendantNote || "Full planetary preview calculated from the same sky engine as the paid reading.");
    } catch (error) {
      console.warn("[Little Souls] birth chart preview failed", error);
      setChart(null);
      setStatus("error");
      setMessage("The chart did not open. Please try again in a moment.");
    }
  };

  return (
    <section className="ls-parallax-band relative px-5 py-18 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p style={eyebrowStyle(C.gold)}>Free birth-chart preview</p>
          <h2 className="mt-5 text-balance" style={sectionTitleStyle}>
            Show them the sky they came in with.
          </h2>
        </div>

        <div className="ls-chart-shell">
          <div className="ls-chart-orb" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p style={eyebrowStyle(C.gold)}>Computed sky</p>
                <h3 className="mt-4 text-balance" style={chartTitleStyle}>
                  Their birth sky preview
                </h3>
              </div>
              <Stars size={28} style={{ color: C.gold }} />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {previewItems.map(([label, detail]) => (
                <article key={label} className="ls-chart-pill">
                  <span>{label}</span>
                  <small>{detail}</small>
                </article>
              ))}
            </div>

            <div className="mt-8 border-t pt-6" style={{ borderColor: C.line }}>
              <p className="text-pretty" style={bodyStyle}>
                Enter a birth date or adoption date. See the first placements,
                then open the full interpretation.
              </p>
              <form className="ls-chart-form mt-6" onSubmit={handlePreview}>
                <label htmlFor="birth-chart-date">Birth or adoption date</label>
                <div>
                  <input
                    id="birth-chart-date"
                    type="date"
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value);
                      if (status === "error") {
                        setStatus("idle");
                        setMessage("");
                      }
                    }}
                    max="2030-12-31"
                  />
                  <button type="submit" className="ls-gold-button" disabled={status === "loading"}>
                    {status === "loading" ? "Reading Their Sky..." : "Preview Their Birth Chart"}
                  </button>
                </div>
              </form>
              {message && (
                <p className={`ls-chart-message ${status === "error" ? "is-error" : ""}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function describeBody(body?: ChartBody | null) {
  if (!body?.sign) return "Waiting for date";
  const degree = typeof body.degree === "number" ? `${Math.round(body.degree)}deg ` : "";
  return `${degree}${body.sign}`;
}

function ProcessSection() {
  return (
    <section id="how-it-works" className="ls-parallax-band relative px-5 py-18 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionIntro
          eyebrow="Three steps"
          title="A few details. A reading that feels like them."
          body="The chart gives structure. Your memories give it a heartbeat."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PROCESS.map((item, index) => (
            <article key={item.title} className="ls-process-card">
              <span className="ls-process-number">0{index + 1}</span>
              <h3 className="mt-10 text-balance" style={cardTitleStyle}>{item.title}</h3>
              <p className="mt-5 text-pretty" style={bodyStyle}>{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InsideReadingSection() {
  return (
    <section id="inside-reading" className="ls-parallax-band relative px-5 py-18 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative">
          <PlaceholderFrame item={PLACEHOLDERS[3]} className="aspect-[4/5]" />
          <div className="ls-device-caption">
            Private reveal interface placeholder
          </div>
        </div>
        <div>
          <p style={eyebrowStyle(C.gold)}>What opens</p>
          <h2 className="mt-5 text-balance" style={sectionTitleStyle}>
            Finally, words for that look.
          </h2>
          <p className="mt-6 text-pretty" style={sectionBodyStyle}>
            Why they choose you. What they protect. How they ask for love.
            The reading turns familiar moments into something you can hold.
          </p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {READING_DETAILS.map(({ icon: Icon, title, body }) => (
              <article key={title} className="ls-detail-card">
                <Icon size={19} style={{ color: C.gold }} />
                <h3 className="mt-4" style={smallTitleStyle}>{title}</h3>
                <p className="mt-3 text-pretty" style={smallBodyStyle}>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthoritySection() {
  return (
    <section className="ls-parallax-band relative px-5 py-18 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="ls-authority-stage">
          <div className="grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p style={eyebrowStyle(C.gold)}>The calculation underneath</p>
              <h2 className="mt-5 text-balance" style={sectionTitleStyle}>
                Tender, but not vague.
              </h2>
            </div>
            <p className="max-w-2xl text-pretty" style={sectionBodyStyle}>
              The emotion is yours. The sky underneath is calculated.
            </p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {AUTHORITY_ITEMS.map(({ icon: Icon, title, body }) => (
              <article key={title} className="ls-authority-card">
                <Icon size={20} style={{ color: C.gold }} />
                <h3 className="mt-5" style={smallTitleStyle}>{title}</h3>
                <p className="mt-3 text-pretty" style={smallBodyStyle}>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckoutSection({
  checkoutRef,
  selectedPrice,
  onSelectedPriceChange,
}: {
  checkoutRef: RefObject<HTMLDivElement>;
  selectedPrice: number;
  onSelectedPriceChange: (price: number) => void;
}) {
  return (
    <section className="ls-parallax-band relative px-5 py-18 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p style={eyebrowStyle(C.gold)}>Begin</p>
          <h2 className="mt-5 text-balance" style={sectionTitleStyle}>
            Choose their reading.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty" style={sectionBodyStyle}>
            Start with their soul reading, or add the deeper bond layer between
            your chart and theirs.
          </p>
        </div>

        <div className="ls-checkout-shell mx-auto max-w-6xl p-3 sm:p-5">
          <div className="ls-checkout-vars">
            <InlineCheckout
              ref={checkoutRef}
              ctaLabel="Begin Their Reading"
              charityId="ifaw"
              charityBonus={0}
              onSelectedPriceChange={onSelectedPriceChange}
              memorialDefaultExpanded={false}
              memorialOnly={false}
              path="discover"
              visualMode="cosmic"
            />
          </div>
        </div>
        <span className="sr-only">Selected price {selectedPrice}</span>
      </div>
    </section>
  );
}

function QuietMomentSection() {
  return (
    <section className="ls-parallax-band relative px-5 py-18 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
        <div>
          <p style={eyebrowStyle(C.gold)}>The keepsake</p>
          <h2 className="mt-5 text-balance" style={sectionTitleStyle}>
            Made for the quiet moments.
          </h2>
          <p className="mt-6 text-pretty" style={sectionBodyStyle}>
            Open it when they are beside you, when you miss them, or when you
            want to remember exactly who they are to you.
          </p>
          <div className="mt-9 border-l pl-6" style={{ borderColor: C.gold }}>
            <p style={quoteStyle}>
              "I knew that look meant something. I just never had words for it before."
            </p>
          </div>
        </div>
        <PlaceholderFrame item={PLACEHOLDERS[4]} className="aspect-[16/10]" />
      </div>
      <div className="mx-auto mt-10 max-w-6xl">
        <PlaceholderFrame item={PLACEHOLDERS[5]} className="aspect-[16/7]" />
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="ls-parallax-band relative px-5 py-18 sm:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionIntro
          eyebrow="Questions"
          title="Before you begin."
          body="A few honest answers before you open their reading."
          centered
        />
        <div className="mt-12 divide-y" style={{ borderColor: C.line }}>
          {FAQ.map((item) => (
            <article key={item.q} className="py-8">
              <h3 style={faqTitleStyle}>{item.q}</h3>
              <p className="mt-4 text-pretty" style={bodyStyle}>{item.a}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p style={eyebrowStyle(C.gold)}>{eyebrow}</p>
      <h2 className="mt-5 text-balance" style={sectionTitleStyle}>{title}</h2>
      <p className={`${centered ? "mx-auto" : ""} mt-6 max-w-2xl text-pretty`} style={sectionBodyStyle}>
        {body}
      </p>
    </div>
  );
}

function PlaceholderFrame({
  item,
  className = "",
}: {
  item: (typeof PLACEHOLDERS)[number];
  className?: string;
}) {
  return (
    <figure className={`ls-placeholder relative overflow-hidden ${className}`} aria-label={`${item.title} image placeholder`}>
      <div className="ls-placeholder-core" aria-hidden="true" />
      <figcaption className="absolute bottom-4 left-4 right-4">
        <span className="block text-[11px] font-medium uppercase tracking-[0.16em]" style={{ color: C.gold }}>
          Image slot
        </span>
        <span className="mt-1 block text-sm" style={{ color: C.cream }}>{item.title}</span>
        <span className="block text-xs" style={{ color: C.muted }}>{item.note}</span>
      </figcaption>
    </figure>
  );
}

function CosmicBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(65,47,88,0.55),transparent_42%),radial-gradient(ellipse_at_88%_18%,rgba(212,182,122,0.12),transparent_26%),radial-gradient(ellipse_at_10%_70%,rgba(94,70,122,0.16),transparent_32%)]" />
      <svg className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
        <g stroke="rgba(212,182,122,0.15)" strokeWidth="1" fill="none">
          <path d="M110 220 188 174 275 238 360 188" />
          <path d="M810 126 902 196 1010 156 1078 245" />
          <path d="M704 662 780 602 856 678 942 624" />
          <path d="M130 720 236 650 304 742" />
        </g>
        {[
          [110, 220, 2], [188, 174, 2.8], [275, 238, 2.2], [360, 188, 2],
          [810, 126, 2.4], [902, 196, 3], [1010, 156, 2], [1078, 245, 2.2],
          [704, 662, 2], [780, 602, 2.6], [856, 678, 2.1], [942, 624, 2.5],
          [510, 118, 1.4], [592, 322, 1.6], [110, 620, 1.5], [1090, 712, 1.4],
          [130, 720, 1.8], [236, 650, 2.2], [304, 742, 1.8],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="rgba(245,239,230,0.72)" />
        ))}
      </svg>
    </div>
  );
}

function ShootingStar() {
  return <span className="ls-shooting-star" aria-hidden="true" />;
}

function CosmicStyles() {
  return (
    <style>{`
      .ls-cosmic-page > section {
        position: relative;
        z-index: 1;
      }
      .ls-cosmic-page {
        --ls-scroll-y: 0;
        --ls-pointer-x: 0;
        --ls-pointer-y: 0;
      }
      .ls-parallax-band {
        isolation: isolate;
      }
      .ls-parallax-band::before {
        content: "";
        position: absolute;
        z-index: -1;
        inset: -18% -10%;
        pointer-events: none;
        background:
          radial-gradient(circle at 22% 28%, rgba(212,182,122,0.055), transparent 18%),
          radial-gradient(circle at 78% 62%, rgba(94,70,122,0.12), transparent 22%);
        opacity: 0.72;
        transform:
          translate3d(
            calc(var(--ls-pointer-x) * 18px),
            calc((var(--ls-scroll-y) * -0.018px) + (var(--ls-pointer-y) * 16px)),
            0
          );
        will-change: transform;
      }
      .ls-panel,
      .ls-process-card,
      .ls-detail-card,
      .ls-authority-stage,
      .ls-authority-card,
      .ls-checkout-shell {
        background: linear-gradient(180deg, rgba(245,239,230,0.055), rgba(245,239,230,0.025));
        border: 1px solid ${C.line};
        border-radius: 8px;
        box-shadow: inset 0 1px 0 rgba(245,239,230,0.05);
      }
      .ls-process-card {
        min-height: 360px;
        padding: 32px;
      }
      .ls-process-number {
        color: ${C.gold};
        font-family: "Playfair Display", Georgia, serif;
        font-size: 4.6rem;
        line-height: 1;
        opacity: 0.86;
      }
      .ls-detail-card,
      .ls-authority-card {
        padding: 22px;
      }
      .ls-authority-stage {
        padding: clamp(28px, 5vw, 56px);
        background:
          radial-gradient(ellipse at 18% 0%, rgba(212,182,122,0.14), transparent 34%),
          linear-gradient(180deg, rgba(245,239,230,0.06), rgba(245,239,230,0.025));
      }
      .ls-chart-shell {
        position: relative;
        overflow: hidden;
        min-height: 560px;
        border: 1px solid rgba(212,182,122,0.34);
        border-top-color: rgba(212,182,122,0.62);
        border-radius: 8px;
        padding: clamp(24px, 4vw, 42px);
        background:
          radial-gradient(ellipse at 50% -12%, rgba(212,182,122,0.18), transparent 42%),
          radial-gradient(ellipse at 18% 82%, rgba(94,70,122,0.28), transparent 34%),
          linear-gradient(180deg, rgba(245,239,230,0.07), rgba(245,239,230,0.025));
        box-shadow: inset 0 1px 0 rgba(245,239,230,0.06), 0 28px 90px rgba(0,0,0,0.28);
      }
      .ls-chart-orb {
        position: absolute;
        inset: 34px;
        display: grid;
        place-items: center;
        opacity: 0.58;
      }
      .ls-chart-orb span {
        position: absolute;
        border: 1px solid rgba(212,182,122,0.22);
        border-radius: 50%;
      }
      .ls-chart-orb span:nth-child(1) {
        width: min(82%, 380px);
        aspect-ratio: 1;
      }
      .ls-chart-orb span:nth-child(2) {
        width: min(58%, 268px);
        aspect-ratio: 1;
        transform: rotate(22deg);
        border-style: dashed;
      }
      .ls-chart-orb span:nth-child(3) {
        width: min(24%, 112px);
        aspect-ratio: 1;
        background: radial-gradient(circle, rgba(212,182,122,0.30), rgba(212,182,122,0.05) 58%, transparent 70%);
        border-color: rgba(212,182,122,0.32);
      }
      .ls-chart-pill {
        position: relative;
        display: grid;
        gap: 6px;
        min-height: 82px;
        border: 1px solid rgba(245,239,230,0.10);
        border-radius: 8px;
        background: rgba(5,4,7,0.46);
        padding: 16px;
      }
      .ls-chart-pill span {
        color: ${C.cream};
        font-family: "Playfair Display", Georgia, serif;
        font-size: 1.16rem;
        line-height: 1.1;
      }
      .ls-chart-pill small {
        color: ${C.muted};
        font-family: Lato, system-ui, sans-serif;
        font-size: 0.78rem;
        line-height: 1.35;
      }
      .ls-chart-form {
        display: grid;
        gap: 10px;
      }
      .ls-chart-form label {
        color: ${C.gold};
        font-family: Lato, system-ui, sans-serif;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .ls-chart-form > div {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
      }
      .ls-chart-form input {
        min-height: 48px;
        width: 100%;
        border: 1px solid rgba(212,182,122,0.34);
        border-radius: 8px;
        background: rgba(5,4,7,0.62);
        color: ${C.cream};
        padding: 0 14px;
        font-family: Lato, system-ui, sans-serif;
        color-scheme: dark;
      }
      .ls-chart-form .ls-gold-button {
        white-space: nowrap;
      }
      .ls-chart-message {
        margin: 12px 0 0;
        color: ${C.creamDim};
        font-family: Lato, system-ui, sans-serif;
        font-size: 0.84rem;
        line-height: 1.45;
      }
      .ls-chart-message.is-error {
        color: ${C.goldSoft};
      }
      .ls-checkout-shell {
        background:
          radial-gradient(ellipse at 50% 0%, rgba(212,182,122,0.13), transparent 40%),
          linear-gradient(180deg, rgba(245,239,230,0.07), rgba(245,239,230,0.025));
        border-top: 1px solid rgba(212,182,122,0.46);
      }
      .ls-checkout-vars {
        --black: ${C.cream};
        --ink: ${C.cream};
        --earth: ${C.creamDim};
        --muted: ${C.muted};
        --cream: transparent;
        --cream2: rgba(245,239,230,0.06);
        --cream3: rgba(212,182,122,0.22);
        --sand: rgba(212,182,122,0.30);
        --rose: ${C.gold};
        --rose-hover: ${C.goldSoft};
        --gold: ${C.gold};
      }
      .ls-gold-button,
      .ls-ghost-button {
        min-height: 48px;
        align-items: center;
        justify-content: center;
        display: inline-flex;
        gap: 10px;
        border-radius: 8px;
        padding: 0 24px;
        font-family: Lato, system-ui, sans-serif;
        font-size: 14px;
        font-weight: 600;
        transition: background 180ms ease, border-color 180ms ease, color 180ms ease;
      }
      .ls-gold-button {
        background: ${C.gold};
        color: ${C.ink};
        border: 1px solid ${C.goldSoft};
      }
      .ls-gold-button:hover {
        background: ${C.goldSoft};
      }
      .ls-gold-button:disabled {
        cursor: default;
        opacity: 0.74;
      }
      .ls-ghost-button {
        color: ${C.cream};
        border: 1px solid ${C.line};
      }
      .ls-ghost-button:hover {
        border-color: rgba(212,182,122,0.56);
        background: rgba(245,239,230,0.04);
      }
      .ls-hero-orbit {
        position: relative;
        min-height: 610px;
        transform: translate3d(
          calc(var(--ls-pointer-x) * -18px),
          calc(var(--ls-scroll-y) * -0.012px),
          0
        );
        will-change: transform;
      }
      .ls-orbit-card {
        position: absolute;
      }
      .ls-orbit-a {
        left: 0;
        top: 110px;
        width: 37%;
      }
      .ls-orbit-b {
        right: 0;
        top: 0;
        width: 45%;
      }
      .ls-orbit-c {
        bottom: 38px;
        left: 22%;
        width: 72%;
      }
      .ls-video-seed {
        position: absolute;
        left: 9%;
        top: 0;
        width: 33%;
        min-height: 92px;
        border-left: 1px solid rgba(212,182,122,0.34);
        padding-left: 16px;
        color: ${C.muted};
        font-family: Lato, system-ui, sans-serif;
        font-size: 12px;
      }
      .ls-video-seed strong {
        display: block;
        color: ${C.cream};
        font-family: "Cormorant", Georgia, serif;
        font-size: 1.25rem;
        font-weight: 400;
        font-style: italic;
        line-height: 1.18;
        margin-top: 6px;
      }
      .ls-placeholder {
        background: #050407;
        border: 1px solid rgba(212,182,122,0.34);
        border-radius: 8px;
      }
      .ls-placeholder::before {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(245,239,230,0.045), transparent 38%);
      }
      .ls-placeholder-core {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 50% 42%, rgba(212,182,122,0.20), transparent 22%),
          radial-gradient(circle at 50% 42%, rgba(94,70,122,0.14), transparent 34%);
        opacity: 0.72;
        transform: translate3d(
          calc(var(--ls-pointer-x) * 10px),
          calc(var(--ls-pointer-y) * 10px),
          0
        );
      }
      .ls-device-caption {
        position: absolute;
        bottom: 18px;
        right: -18px;
        max-width: 210px;
        border: 1px solid ${C.line};
        border-radius: 8px;
        background: rgba(13,10,20,0.86);
        color: ${C.cream};
        font-family: "Cormorant", Georgia, serif;
        font-style: italic;
        font-size: 1.15rem;
        line-height: 1.28;
        padding: 16px 18px;
      }
      .ls-shooting-star {
        position: absolute;
        top: 18%;
        right: 22%;
        z-index: 0;
        width: 180px;
        height: 1px;
        background: linear-gradient(90deg, rgba(245,239,230,0), rgba(245,239,230,0.86), rgba(212,182,122,0));
        transform: rotate(-28deg);
        opacity: 0.7;
      }
      @media (min-width: 900px) {
        .ls-placeholder {
          transform: translate3d(0, 0, 0);
        }
        .ls-orbit-a { animation: lsFloatA 9s ease-in-out infinite; }
        .ls-orbit-b { animation: lsFloatB 10s ease-in-out infinite; }
        .ls-orbit-c { animation: lsFloatC 11s ease-in-out infinite; }
      }
      @keyframes lsFloatA { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-14px); } }
      @keyframes lsFloatB { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(12px); } }
      @keyframes lsFloatC { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-10px); } }
      @media (max-width: 899px) {
        .ls-parallax-band::before {
          opacity: 0.42;
          transform: translate3d(0, calc(var(--ls-scroll-y) * -0.004px), 0);
        }
        .ls-hero-orbit {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          min-height: 0;
          transform: none;
        }
        .ls-orbit-card {
          position: relative;
          width: auto;
          inset: auto;
        }
        .ls-orbit-c {
          grid-column: 1 / -1;
        }
        .ls-video-seed {
          position: relative;
          grid-column: 1 / -1;
          width: auto;
          min-height: 0;
          top: auto;
          left: auto;
          order: -1;
        }
        .ls-device-caption {
          bottom: 12px;
          right: 12px;
          max-width: 180px;
        }
        .ls-chart-form > div {
          grid-template-columns: 1fr;
        }
        .ls-chart-form .ls-gold-button {
          width: 100%;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .ls-parallax-band::before,
        .ls-hero-orbit,
        .ls-placeholder-core {
          transform: none !important;
        }
        .ls-orbit-a,
        .ls-orbit-b,
        .ls-orbit-c {
          animation: none !important;
        }
      }
    `}</style>
  );
}

const heroTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "clamp(3.4rem, 8vw, 6.35rem)",
  fontWeight: 500,
  lineHeight: 0.92,
  letterSpacing: "-0.018em",
} as const;

const sectionTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "clamp(2.55rem, 6vw, 4.9rem)",
  fontWeight: 500,
  lineHeight: 0.98,
  letterSpacing: "-0.018em",
} as const;

const sectionBodyStyle = {
  color: C.creamDim,
  fontFamily: "Lato, system-ui, sans-serif",
  fontSize: "1.08rem",
  lineHeight: 1.74,
} as const;

const bodyStyle = {
  color: C.creamDim,
  fontFamily: "Lato, system-ui, sans-serif",
  fontSize: "0.98rem",
  lineHeight: 1.68,
} as const;

const smallBodyStyle = {
  color: C.muted,
  fontFamily: "Lato, system-ui, sans-serif",
  fontSize: "0.92rem",
  lineHeight: 1.62,
} as const;

const panelLeadStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "1.42rem",
  fontWeight: 500,
  lineHeight: 1.18,
} as const;

const cardTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "1.92rem",
  fontWeight: 500,
  lineHeight: 1.06,
} as const;

const chartTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "clamp(2rem, 4vw, 3.2rem)",
  fontWeight: 500,
  lineHeight: 1,
} as const;

const smallTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "1.25rem",
  fontWeight: 500,
  lineHeight: 1.12,
} as const;

const faqTitleStyle = {
  color: C.cream,
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: "1.55rem",
  fontWeight: 500,
  lineHeight: 1.18,
} as const;

const whisperStyle = {
  color: C.creamDim,
  fontFamily: '"Cormorant", Georgia, serif',
  fontSize: "1.48rem",
  fontStyle: "italic",
  lineHeight: 1.42,
} as const;

const quoteStyle = {
  color: C.cream,
  fontFamily: '"Cormorant", Georgia, serif',
  fontSize: "1.65rem",
  fontStyle: "italic",
  lineHeight: 1.42,
} as const;

function eyebrowStyle(color: string) {
  return {
    color,
    fontFamily: "Lato, system-ui, sans-serif",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
  };
}

export default ReadingsLanding;
