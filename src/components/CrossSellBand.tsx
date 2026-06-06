/**
 * CrossSellBand — the bridge between the two Little Souls products.
 *
 * Lives on BOTH pages so each upsells the other and the site feels like one
 * place, not two:
 *   variant="to-pawtraits"  → shown on the readings homepage, sends to /pawtraits
 *   variant="to-readings"   → shown on /pawtraits, sends to /
 *
 * Pawtraits visual register (white-led, Asap/Assistant, Rose CTA) so it reads
 * identical on either page. No em-dashes, no "AI", no "report".
 */
import { Link } from "react-router-dom";
import { Brush, Sparkles } from "lucide-react";
import { PALETTE } from "@/components/portraits/tokens";

type Variant = "to-pawtraits" | "to-readings";

const COPY: Record<Variant, { eyebrow: string; title: string; sub: string; cta: string; href: string; Icon: typeof Brush }> = {
  "to-pawtraits": {
    eyebrow: "The other half of the bond",
    title: "You know their soul. Now hang it on your wall.",
    sub: "Turn the soul you just discovered into a hand finished portrait, made from your own photo.",
    cta: "Explore Pawtraits",
    href: "/pawtraits",
    Icon: Brush,
  },
  "to-readings": {
    eyebrow: "The other half of the bond",
    title: "Love their portrait? Meet the soul inside it.",
    sub: "A full soul reading drawn from your pet's real birth chart. The story behind every look they give you.",
    cta: "Get their soul reading",
    href: "/",
    Icon: Sparkles,
  },
};

export function CrossSellBand({ variant }: { variant: Variant }) {
  const { eyebrow, title, sub, cta, href, Icon } = COPY[variant];

  return (
    <section className="px-5 py-14 sm:py-20" style={{ background: PALETTE.cream2 }}>
      <div
        className="mx-auto flex flex-col items-center text-center gap-4"
        style={{ maxWidth: "720px" }}
      >
        <span style={{ fontFamily: "Assistant, system-ui, sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: PALETTE.rose }}>
          {eyebrow}
        </span>
        <h2 style={{ fontFamily: "Asap, system-ui, sans-serif", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em", color: PALETTE.ink, lineHeight: 1.12, textWrap: "balance" }}>
          {title}
        </h2>
        <p style={{ fontFamily: "Assistant, system-ui, sans-serif", fontSize: "1.02rem", color: PALETTE.earth, lineHeight: 1.55, maxWidth: "34rem" }}>
          {sub}
        </p>
        <Link
          to={href}
          className="inline-flex items-center gap-2 rounded-full mt-2 transition-all hover:scale-[1.02]"
          style={{
            background: PALETTE.rose,
            color: "#fff",
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: "14.5px",
            fontWeight: 700,
            letterSpacing: "0.02em",
            padding: "12px 24px",
            boxShadow: "0 6px 16px rgba(191, 82, 74, 0.25)",
          }}
        >
          <Icon className="w-4 h-4" />
          {cta}
        </Link>
      </div>
    </section>
  );
}
