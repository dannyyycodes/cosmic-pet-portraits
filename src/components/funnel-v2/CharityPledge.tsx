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

type CharityId = "dogs-trust" | "ecologi" | "wwf";

interface Charity {
  id: CharityId;
  name: string;
  mission: string;
  tagline: string;
  color: string;
}

const CHARITIES: Charity[] = [
  {
    id: "dogs-trust",
    name: "Dogs Trust",
    mission: "UK's largest dog welfare charity — rescue, rehoming, and a promise to never put a healthy dog down.",
    tagline: "because every soul deserves love",
    color: "#FFD700",
  },
  {
    id: "ecologi",
    name: "Ecologi",
    mission: "Funding verified tree planting and climate projects worldwide. Over 80 million trees planted.",
    tagline: "because their world is our world too",
    color: "#2ECC71",
  },
  {
    id: "wwf",
    name: "WWF",
    mission: "Protecting wildlife and wild places across 100+ countries for over 60 years.",
    tagline: "because wild souls need protecting",
    color: "#000",
  },
];

const BONUS_AMOUNTS = [1, 3, 5];

/* ──────── Charity icons (hand-drawn style) ──────── */

const DogsTrustIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 35c-4-3-14-9-14-18a7 7 0 0114-1 7 7 0 0114 1c0 9-10 15-14 18z" />
    <circle cx="14" cy="16" r="1.2" fill="currentColor" />
    <circle cx="26" cy="16" r="1.2" fill="currentColor" />
    <path d="M17 22c1.5 1.5 4.5 1.5 6 0" />
  </svg>
);

const EcologiIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 36V18" />
    <path d="M20 24c-6-2-10-8-8-16 6 0 12 4 12 12" />
    <path d="M20 28c4-1.5 7-5 6-11-4.5 0-8.5 3-8 9" />
    <path d="M15 36h10" />
  </svg>
);

const WWFIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="20" cy="18" r="12" />
    <path d="M14 14a2.5 2.5 0 015 0M21 14a2.5 2.5 0 015 0" />
    <circle cx="15" cy="19" r="1.5" fill="currentColor" />
    <circle cx="25" cy="19" r="1.5" fill="currentColor" />
    <ellipse cx="20" cy="23" rx="3" ry="2" />
    <path d="M11 30c2 3 5.5 5 9 5s7-2 9-5" />
  </svg>
);

const CHARITY_ICONS: Record<CharityId, () => JSX.Element> = {
  "dogs-trust": DogsTrustIcon,
  "ecologi": EcologiIcon,
  "wwf": WWFIcon,
};

/* ──────── Component ──────── */

interface CharityPledgeProps {
  /** The base price of the selected tier (27 or 35) */
  selectedPrice?: number;
  /** Callback when charity or bonus changes — parent can store for checkout */
  onChange?: (data: { charityId: CharityId; bonusAmount: number }) => void;
}

export const CharityPledge = ({ selectedPrice = 27, onChange }: CharityPledgeProps) => {
  const { ref, visible } = useScrollReveal(0.1);
  const [selected, setSelected] = useState<CharityId>("dogs-trust");
  const [bonus, setBonus] = useState(0);

  const donationBase = +(selectedPrice * 0.1).toFixed(2);
  const donationTotal = +(donationBase + bonus).toFixed(2);
  const selectedCharity = CHARITIES.find((c) => c.id === selected)!;

  useEffect(() => {
    onChange?.({ charityId: selected, bonusAmount: bonus });
  }, [selected, bonus, onChange]);

  return (
    <section
      ref={ref}
      className="relative py-14 sm:py-16 md:py-24 px-5 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, var(--cream, #FFFDF5), var(--cream2, #faf4e8))",
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Gold divider top */}
        <div
          className="mx-auto mb-10 transition-all duration-1000"
          style={{
            width: visible ? 80 : 0,
            height: 1,
            background: "var(--gold, #c4a265)",
            opacity: 0.5,
          }}
        />

        {/* Header */}
        <div
          className="text-center mb-8 transition-all duration-1000"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
          }}
        >
          {/* Decorative paw */}
          <div className="mb-4" style={{ color: "var(--gold, #c4a265)", opacity: 0.5 }}>
            <svg className="w-6 h-6 mx-auto" viewBox="0 0 24 24" fill="currentColor">
              <ellipse cx="7" cy="7" rx="2.2" ry="2.8" />
              <ellipse cx="17" cy="7" rx="2.2" ry="2.8" />
              <ellipse cx="4" cy="13" rx="2" ry="2.5" />
              <ellipse cx="20" cy="13" rx="2" ry="2.5" />
              <path d="M7 17c0-2.5 2-5 5-5s5 2.5 5 5c0 2.5-2 4.5-5 4.5S7 19.5 7 17z" />
            </svg>
          </div>

          <h2
            style={{
              fontFamily: '"DM Serif Display", Georgia, serif',
              fontSize: "clamp(1.5rem, 5.5vw, 2.1rem)",
              fontWeight: 400,
              color: "var(--black, #141210)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Every Portrait,
            <br />
            <em style={{ color: "var(--rose, #bf524a)" }}>a Little Kindness.</em>
          </h2>
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "clamp(1rem, 3.5vw, 1.12rem)",
              color: "var(--earth, #6e6259)",
              lineHeight: 1.55,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            10% of every order goes directly to protecting animals, planting trees,
            and conserving wildlife — and you choose where.
          </p>
        </div>

        {/* Charity cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          {CHARITIES.map((charity, i) => {
            const isSelected = selected === charity.id;
            const Icon = CHARITY_ICONS[charity.id];
            return (
              <button
                key={charity.id}
                onClick={() => setSelected(charity.id)}
                aria-pressed={isSelected}
                className="relative text-left rounded-xl p-4 sm:p-5 transition-all duration-300 active:scale-[0.98]"
                style={{
                  background: isSelected ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.7)",
                  border: isSelected
                    ? "2px solid var(--gold, #c4a265)"
                    : "1px solid var(--sand, #e8ddd0)",
                  boxShadow: isSelected
                    ? "0 4px 20px rgba(196,162,101,0.15)"
                    : "0 1px 8px rgba(0,0,0,0.03)",
                  transform: isSelected ? "scale(1.02)" : "scale(1)",
                  opacity: visible ? 1 : 0,
                  transitionDelay: `${0.15 + i * 0.08}s`,
                }}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div
                    className="absolute top-3 right-3"
                    style={{ color: "var(--gold, #c4a265)" }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 7.2H22l-6 4.4 2.4 7.4L12 17l-6.4 4 2.4-7.4-6-4.4h7.6z" />
                    </svg>
                  </div>
                )}

                {/* Icon */}
                <div
                  className="w-12 h-12 mb-3 rounded-xl flex items-center justify-center"
                  style={{
                    background: isSelected
                      ? "rgba(196,162,101,0.12)"
                      : "rgba(196,162,101,0.06)",
                    color: isSelected
                      ? "var(--rose, #bf524a)"
                      : "var(--earth, #6e6259)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ width: 28, height: 28 }}>
                    <Icon />
                  </div>
                </div>

                {/* Name */}
                <h3
                  style={{
                    fontFamily: '"DM Serif Display", Georgia, serif',
                    fontSize: "1rem",
                    color: "var(--ink, #1f1c18)",
                    marginBottom: 4,
                  }}
                >
                  {charity.name}
                </h3>

                {/* Mission */}
                <p
                  style={{
                    fontFamily: "Cormorant, Georgia, serif",
                    fontSize: "0.82rem",
                    color: "var(--muted, #958779)",
                    lineHeight: 1.45,
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
          className="text-center mb-6 transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transitionDelay: "0.4s",
          }}
        >
          <p
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontSize: "clamp(0.98rem, 3.3vw, 1.08rem)",
              color: "var(--earth, #6e6259)",
              lineHeight: 1.55,
            }}
          >
            <span style={{ color: "var(--rose, #bf524a)", fontWeight: 600 }}>
              ${donationTotal.toFixed(2)}
            </span>
            {" from your order goes to "}
            <span style={{ color: "var(--rose, #bf524a)", fontWeight: 600 }}>
              {selectedCharity.name}
            </span>
            {" — "}
            <em style={{ color: "var(--muted, #958779)" }}>
              {selectedCharity.tagline}
            </em>
          </p>
        </div>

        {/* Bonus donation */}
        <div
          className="text-center transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transitionDelay: "0.5s",
          }}
        >
          <p
            className="mb-3"
            style={{
              fontFamily: "Cormorant, Georgia, serif",
              fontStyle: "italic",
              fontSize: "0.92rem",
              color: "var(--muted, #958779)",
            }}
          >
            Want to add a little extra?
          </p>
          <div className="flex items-center justify-center gap-3">
            {BONUS_AMOUNTS.map((amount) => {
              const isActive = bonus === amount;
              return (
                <button
                  key={amount}
                  onClick={() => setBonus(isActive ? 0 : amount)}
                  className="transition-all duration-200 active:scale-[0.95]"
                  style={{
                    fontFamily: "Cormorant, Georgia, serif",
                    fontSize: "0.92rem",
                    fontWeight: 600,
                    padding: "8px 22px",
                    borderRadius: 100,
                    border: isActive
                      ? "1.5px solid var(--rose, #bf524a)"
                      : "1.5px solid var(--sand, #e8ddd0)",
                    background: isActive
                      ? "var(--rose, #bf524a)"
                      : "transparent",
                    color: isActive
                      ? "#fff"
                      : "var(--earth, #6e6259)",
                    cursor: "pointer",
                  }}
                >
                  +${amount}
                </button>
              );
            })}
          </div>

          {/* Running total when bonus selected */}
          {bonus > 0 && (
            <p
              className="mt-3"
              style={{
                fontFamily: "Cormorant, Georgia, serif",
                fontSize: "0.82rem",
                color: "var(--muted, #958779)",
                animation: "charityFadeIn 0.3s ease",
              }}
            >
              Total going to {selectedCharity.name}:{" "}
              <strong style={{ color: "var(--ink, #1f1c18)" }}>
                ${donationTotal.toFixed(2)}
              </strong>
            </p>
          )}
        </div>

        {/* Gold divider bottom */}
        <div
          className="mx-auto mt-10 transition-all duration-1000"
          style={{
            width: visible ? 80 : 0,
            height: 1,
            background: "var(--gold, #c4a265)",
            opacity: 0.5,
            transitionDelay: "0.6s",
          }}
        />
      </div>

      <style>{`
        @keyframes charityFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};
