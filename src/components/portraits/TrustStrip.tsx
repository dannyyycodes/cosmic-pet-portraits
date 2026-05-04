/**
 * TrustStrip — three trust cards: rating · shipping · guarantee.
 * Native HTML so each card stays sharp at any width.
 * Stacks on mobile, sits side-by-side on tablet and up.
 */
import { Globe, ShieldCheck } from "lucide-react";
import { PALETTE, display, body } from "./tokens";

interface Card {
  icon: React.ReactNode;
  title: string;
  caption: string;
}

const StarsRow = () => (
  <div
    aria-hidden
    style={{
      color: PALETTE.gold,
      fontSize: "22px",
      letterSpacing: "0.08em",
      lineHeight: 1,
    }}
  >
    ★★★★★
  </div>
);

const CARDS: Card[] = [
  {
    icon: <StarsRow />,
    title: "Rated 4.9 from 47K+",
    caption: "happy pet parent reviews",
  },
  {
    icon: <Globe size={32} strokeWidth={1.4} color={PALETTE.gold} aria-hidden />,
    title: "Worldwide Shipping",
    caption: "printed with care · framed beautifully · delivered to your door",
  },
  {
    icon: <ShieldCheck size={32} strokeWidth={1.4} color={PALETTE.gold} aria-hidden />,
    title: "100% Love-It Guarantee",
    caption: "we'll make it right · re-do or refund · no stress",
  },
];

export function TrustStrip() {
  return (
    <section
      className="relative px-6 md:px-10"
      style={{
        background: "rgba(255, 255, 255, 0.84)",
        paddingTop: "56px",
        paddingBottom: "56px",
        borderBottom: `1px solid ${PALETTE.sand}`,
      }}
      aria-label="What pet parents trust us with"
    >
      <div
        className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        style={{ maxWidth: "1080px" }}
      >
        {CARDS.map((c) => (
          <div
            key={c.title}
            className="flex flex-col items-center text-center"
            style={{
              background: "#FBF6EC",
              border: `1px solid ${PALETTE.sand}`,
              borderRadius: "14px",
              padding: "28px 24px",
              boxShadow: "0 4px 14px rgba(28, 28, 28, 0.03)",
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: "56px",
                height: "56px",
                marginBottom: "16px",
              }}
            >
              {c.icon}
            </div>
            <h3
              style={{
                ...display("clamp(18px, 2.2vw, 22px)"),
                color: PALETTE.ink,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {c.title}
            </h3>
            <p
              style={{
                ...body("14px"),
                color: PALETTE.earth,
                marginTop: "8px",
                maxWidth: "30ch",
              }}
            >
              {c.caption}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
