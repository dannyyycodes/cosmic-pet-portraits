/**
 * TrustStrip — three trust cards: rating · shipping · guarantee.
 *
 * Designed to feel premium without shouting. Each card is a clean white
 * surface with a tinted icon halo and a confident headline. The rating
 * card leads with the 4.9 number (strongest trust signal for e-commerce).
 *
 * Mobile-first: stacks with breathing room, then sits side-by-side at md+.
 * Subtle hover lift on devices that support hover (no jitter on touch).
 */
import { Globe, ShieldCheck } from "lucide-react";
import { PALETTE, display, body } from "./tokens";

const RATING = {
  score: "4.9",
  count: "47,000+",
};

const Stars = ({ size = 14 }: { size?: number }) => (
  <div
    aria-hidden
    style={{
      color: PALETTE.gold,
      fontSize: `${size}px`,
      letterSpacing: "0.12em",
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}
  >
    ★★★★★
  </div>
);

interface CardShellProps {
  haloBg: string;
  haloIcon: React.ReactNode;
  children: React.ReactNode;
}

function CardShell({ haloBg, haloIcon, children }: CardShellProps) {
  return (
    <div
      className="trust-card flex flex-col items-center text-center transition-all duration-300"
      style={{
        background: "#ffffff",
        border: `1px solid ${PALETTE.sand}`,
        borderRadius: "18px",
        padding: "32px 24px",
        boxShadow:
          "0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 8px 24px rgba(28, 28, 28, 0.05), 0 2px 6px rgba(28, 28, 28, 0.03)",
      }}
    >
      <div
        className="flex items-center justify-center mb-5"
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: haloBg,
        }}
      >
        {haloIcon}
      </div>
      {children}
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  ...display("clamp(18px, 2.2vw, 22px)"),
  color: PALETTE.ink,
  fontWeight: 600,
  margin: 0,
  lineHeight: 1.25,
};

const captionStyle: React.CSSProperties = {
  ...body("14px"),
  color: PALETTE.earthMuted,
  marginTop: "8px",
  maxWidth: "30ch",
  lineHeight: 1.55,
};

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
        {/* ── Card 1 — Rating (lead with the number) ─────────────────── */}
        <CardShell
          haloBg="rgba(196, 162, 101, 0.12)"
          haloIcon={<Stars size={18} />}
        >
          <div className="flex items-baseline justify-center gap-1.5">
            <span
              style={{
                ...display("clamp(34px, 4.2vw, 44px)"),
                color: PALETTE.ink,
                fontWeight: 700,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {RATING.score}
            </span>
            <span
              style={{
                ...body("13px"),
                color: PALETTE.earthMuted,
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              / 5
            </span>
          </div>
          <p style={{ ...captionStyle, marginTop: 6 }}>
            from <strong style={{ color: PALETTE.earth, fontWeight: 600 }}>{RATING.count}</strong> happy pet parent reviews
          </p>
        </CardShell>

        {/* ── Card 2 — Shipping ──────────────────────────────────────── */}
        <CardShell
          haloBg="rgba(28, 28, 28, 0.05)"
          haloIcon={<Globe size={28} strokeWidth={1.5} color={PALETTE.ink} aria-hidden />}
        >
          <h3 style={titleStyle}>Worldwide shipping</h3>
          <p style={captionStyle}>
            Printed with care, framed beautifully, delivered to your door.
          </p>
        </CardShell>

        {/* ── Card 3 — Guarantee (warm rose halo for emotional weight) ─ */}
        <CardShell
          haloBg={PALETTE.roseSoft}
          haloIcon={<ShieldCheck size={28} strokeWidth={1.6} color={PALETTE.rose} aria-hidden />}
        >
          <h3 style={titleStyle}>100% Love-It Guarantee</h3>
          <p style={captionStyle}>
            Don't love it? We'll re-do it or refund. No stress, ever.
          </p>
        </CardShell>
      </div>

      {/* Hover lift only where hover is real (desktop) — keeps mobile crisp. */}
      <style>{`
        @media (hover: hover) {
          .trust-card:hover {
            transform: translateY(-3px);
            box-shadow:
              0 1px 0 rgba(255, 255, 255, 0.9) inset,
              0 14px 32px rgba(28, 28, 28, 0.07),
              0 4px 10px rgba(28, 28, 28, 0.04);
          }
        }
      `}</style>
    </section>
  );
}
