import { useEffect, useRef, useState } from "react";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ──────── Charity data ──────── */

export type CharityId = "ifaw" | "world-land-trust" | "eden-reforestation";

interface Charity {
  id: CharityId;
  name: string;
  shortName: string;
  mission: string;
  tagline: string;
  website: string;
}

const CHARITIES: Charity[] = [
  {
    id: "ifaw",
    name: "International Fund for Animal Welfare",
    shortName: "IFAW",
    mission: "Rescuing and rehabilitating animals in crisis across 40 countries — from disaster zones to wildlife rehab.",
    tagline: "because every rescue is a second chance",
    website: "https://www.ifaw.org",
  },
  {
    id: "world-land-trust",
    name: "World Land Trust",
    shortName: "World Land Trust",
    mission: "Buying and protecting real habitat in Latin America, Africa, and Asia. Attenborough is their patron.",
    tagline: "because wild souls need wild places",
    website: "https://www.worldlandtrust.org",
  },
  {
    id: "eden-reforestation",
    name: "Eden Reforestation Projects",
    shortName: "Eden Reforestation",
    mission: "Planting trees and employing locals in ten countries. One of the most efficient reforestation charities on earth.",
    tagline: "because their world is our world too",
    website: "https://www.edenprojects.org",
  },
];

const DEFAULT_CHARITY: CharityId = "ifaw";

/* ──────── Charity icons (hand-drawn, fallback if no logo asset) ──────── */

const IFAWIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="14" rx="2.4" ry="3" />
    <ellipse cx="28" cy="14" rx="2.4" ry="3" />
    <ellipse cx="8" cy="22" rx="2" ry="2.6" />
    <ellipse cx="32" cy="22" rx="2" ry="2.6" />
    <path d="M13 30c0-3.5 3-6.5 7-6.5s7 3 7 6.5c0 3-2.5 5-7 5s-7-2-7-5z" />
  </svg>
);

const WorldLandTrustIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="20" cy="20" r="13" />
    <path d="M7 20h26" />
    <path d="M20 7c3 4 5 8 5 13s-2 9-5 13" />
    <path d="M20 7c-3 4-5 8-5 13s2 9 5 13" />
  </svg>
);

const EdenIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 36V16" />
    <path d="M20 22c-6-2-10-8-8-16 6 0 12 4 12 12" />
    <path d="M20 26c4-1.5 7-5 6-11-4.5 0-8.5 3-8 9" />
    <path d="M14 36h12" />
  </svg>
);

const CHARITY_ICONS: Record<CharityId, () => JSX.Element> = {
  "ifaw": IFAWIcon,
  "world-land-trust": WorldLandTrustIcon,
  "eden-reforestation": EdenIcon,
};

/* ──────── Component ──────── */

interface CharityPledgeProps {
  /** The base price of the selected tier (29 or 49) */
  selectedPrice?: number;
  /** Callback when charity selection changes — parent stores it for checkout */
  onChange?: (data: { charityId: CharityId; bonusAmount: number }) => void;
}

export const CharityPledge = ({ selectedPrice = 29, onChange }: CharityPledgeProps) => {
  const { ref, visible } = useScrollReveal(0.1);
  const [selected, setSelected] = useState<CharityId>(DEFAULT_CHARITY);

  const estimatedDonation = +(selectedPrice * 0.1).toFixed(2);
  const selectedCharity = CHARITIES.find((c) => c.id === selected)!;

  useEffect(() => {
    onChange?.({ charityId: selected, bonusAmount: 0 });
  }, [selected, onChange]);

  return (
    <section
      ref={ref}
      aria-labelledby="charity-pledge-heading"
      className="relative py-10 sm:py-14 md:py-20 px-5 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--cream, #FFFDF5), var(--cream2, #faf4e8))",
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Gold divider top */}
        <div
          className="mx-auto mb-8"
          style={{
            width: visible ? 80 : 0,
            height: 1,
            background: "var(--gold, #c4a265)",
            opacity: 0.5,
            transition: "width 1s ease",
          }}
        />

        {/* Header — concise, global */}
        <div
          className="text-center mb-6 sm:mb-8"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 1s ease, transform 1s ease",
          }}
        >
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--gold, #c4a265)",
              marginBottom: 10,
            }}
          >
            10% of every order
          </p>

          <h2
            id="charity-pledge-heading"
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.4rem, 5.2vw, 1.9rem)",
              fontWeight: 400,
              color: "var(--black, #141210)",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              marginBottom: 10,
            }}
          >
            Choose where it goes.
          </h2>
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "clamp(0.95rem, 3.3vw, 1.05rem)",
              color: "var(--earth, #6e6259)",
              lineHeight: 1.55,
              maxWidth: 440,
              margin: "0 auto",
            }}
          >
            Three globally trusted charities. One tap to pick — we handle the donation every month.
          </p>
        </div>

        {/* Charity cards — mobile: stacked 1-col, desktop: 3-col */}
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6"
          role="radiogroup"
          aria-label="Choose a charity"
        >
          {CHARITIES.map((charity, i) => {
            const isSelected = selected === charity.id;
            const Icon = CHARITY_ICONS[charity.id];
            return (
              <button
                key={charity.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelected(charity.id)}
                className="relative text-left rounded-xl p-4 sm:p-5 transition-all duration-300 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  background: isSelected ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.7)",
                  border: isSelected
                    ? "2px solid var(--gold, #c4a265)"
                    : "1px solid var(--sand, #e8ddd0)",
                  boxShadow: isSelected
                    ? "0 4px 20px rgba(196,162,101,0.18)"
                    : "0 1px 8px rgba(0,0,0,0.03)",
                  transform: isSelected ? "scale(1.015)" : "scale(1)",
                  opacity: visible ? 1 : 0,
                  transitionDelay: `${0.12 + i * 0.07}s`,
                  minHeight: 52,
                }}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div
                    className="absolute top-3 right-3"
                    style={{ color: "var(--gold, #c4a265)" }}
                    aria-hidden="true"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                )}

                {/* Icon + name row on mobile, stacked on desktop */}
                <div className="flex items-center gap-3 sm:block">
                  <div
                    className="w-11 h-11 sm:w-12 sm:h-12 sm:mb-3 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: isSelected
                        ? "rgba(196,162,101,0.14)"
                        : "rgba(196,162,101,0.06)",
                      color: isSelected
                        ? "var(--rose, #bf524a)"
                        : "var(--earth, #6e6259)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div style={{ width: 26, height: 26 }}>
                      <Icon />
                    </div>
                  </div>

                  <h3
                    style={{
                      fontFamily: '"DM Serif Display", Georgia, serif',
                      fontSize: "1rem",
                      color: "var(--ink, #1f1c18)",
                      marginBottom: 0,
                      paddingRight: isSelected ? 22 : 0,
                    }}
                    className="sm:pr-0"
                  >
                    {charity.shortName}
                  </h3>
                </div>

                <p
                  className="mt-2 sm:mt-0"
                  style={{
                    fontFamily: "Cormorant, Georgia, serif",
                    fontSize: "0.85rem",
                    color: "var(--muted, #958779)",
                    lineHeight: 1.5,
                  }}
                >
                  {charity.mission}
                </p>
              </button>
            );
          })}
        </div>

        {/* Donation confirmation line */}
        <div
          className="text-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s",
          }}
        >
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "clamp(0.92rem, 3.1vw, 1.02rem)",
              color: "var(--earth, #6e6259)",
              lineHeight: 1.6,
            }}
          >
            Your order sends about{" "}
            <span style={{ color: "var(--rose, #bf524a)", fontWeight: 600 }}>
              ${estimatedDonation.toFixed(2)}
            </span>
            {" to "}
            <span style={{ color: "var(--rose, #bf524a)", fontWeight: 600 }}>
              {selectedCharity.shortName}
            </span>
            {" — "}
            <em style={{ color: "var(--muted, #958779)" }}>
              {selectedCharity.tagline}
            </em>
          </p>
          <p
            className="mt-1.5"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "0.78rem",
              fontStyle: "italic",
              color: "var(--faded, #bfb2a3)",
            }}
          >
            Exact amount = 10% of what you actually pay (after any discounts).
          </p>
        </div>

        {/* Gold divider bottom */}
        <div
          className="mx-auto mt-8"
          style={{
            width: visible ? 80 : 0,
            height: 1,
            background: "var(--gold, #c4a265)",
            opacity: 0.5,
            transition: "width 1s ease 0.5s",
          }}
        />
      </div>
    </section>
  );
};
