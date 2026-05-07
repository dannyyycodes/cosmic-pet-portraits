/**
 * /trust-preview — temp page showing 4 distinct trust-strip designs side by side.
 *
 * Goal: pick one. After Danny chooses, the winning variant moves into
 * src/components/portraits/TrustStrip.tsx and this file gets deleted.
 *
 * Same wording in every variant — only the structure / aesthetic changes.
 *   A. Colophon       — single vertical column, all type
 *   B. Billboard      — one giant editorial quote
 *   C. Wax Seals      — three circular hand-stamped badges
 *   D. Marquee        — one continuous flowing line, slow auto-scroll
 */
import { Globe, ShieldCheck } from "lucide-react";
import {
  PALETTE,
  display,
  body,
  cormorantItalic,
  eyebrow,
} from "@/components/portraits/tokens";

// ── Shared atoms ────────────────────────────────────────────────────────
function Star({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={PALETTE.gold}
      aria-hidden
      style={{ display: "block" }}
    >
      <path d="M12 1.7l3.18 7.05 7.62.85-5.7 5.21 1.6 7.49L12 18.6l-6.7 3.7 1.6-7.49-5.7-5.21 7.62-.85L12 1.7z" />
    </svg>
  );
}

function FiveStars({ size = 14 }: { size?: number }) {
  return (
    <div
      role="img"
      aria-label="Five out of five stars"
      style={{ display: "inline-flex", gap: size * 0.32 }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={size} />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// VARIANT A — COLOPHON. Single narrow vertical column, all type, magazine
// end-page feel. No icons in headers; small marks above each block.
// ────────────────────────────────────────────────────────────────────────
function ColophonVariant() {
  return (
    <section
      style={{
        background: "#ffffff",
        paddingTop: "clamp(80px, 10vw, 120px)",
        paddingBottom: "clamp(80px, 10vw, 120px)",
      }}
    >
      <div
        className="mx-auto px-6 text-center"
        style={{ maxWidth: 560 }}
      >
        {/* Block I */}
        <div className="flex justify-center"><FiveStars size={15} /></div>
        <h3 style={{ ...display("clamp(22px, 2.4vw, 26px)"), marginTop: 24, color: PALETTE.ink }}>
          Rated 4.9 from 47K+
        </h3>
        <p style={{ ...cormorantItalic("clamp(16px, 1.7vw, 18px)"), color: PALETTE.earthMuted, marginTop: 8 }}>
          happy pet parent reviews
        </p>

        <div style={{ height: "clamp(56px, 7vw, 88px)" }} aria-hidden />

        {/* Block II */}
        <div className="flex justify-center">
          <Globe size={28} strokeWidth={1.2} color={PALETTE.ink} aria-hidden />
        </div>
        <h3 style={{ ...display("clamp(22px, 2.4vw, 26px)"), marginTop: 24, color: PALETTE.ink }}>
          Worldwide Shipping
        </h3>
        <p
          style={{
            ...cormorantItalic("clamp(16px, 1.7vw, 18px)"),
            color: PALETTE.earthMuted,
            marginTop: 8,
            maxWidth: "38ch",
            margin: "8px auto 0",
          }}
        >
          printed with care · framed beautifully · delivered to your door
        </p>

        <div style={{ height: "clamp(56px, 7vw, 88px)" }} aria-hidden />

        {/* Block III */}
        <div className="flex justify-center">
          <ShieldCheck size={28} strokeWidth={1.3} color={PALETTE.rose} aria-hidden />
        </div>
        <h3 style={{ ...display("clamp(22px, 2.4vw, 26px)"), marginTop: 24, color: PALETTE.ink }}>
          100% Love-It Guarantee
        </h3>
        <p
          style={{
            ...cormorantItalic("clamp(16px, 1.7vw, 18px)"),
            color: PALETTE.earthMuted,
            marginTop: 8,
            maxWidth: "38ch",
            margin: "8px auto 0",
          }}
        >
          we'll make it right · re-do or refund · no stress
        </p>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// VARIANT B — BILLBOARD. One giant editorial quote weaving the three
// trust phrases together. Captions condensed into a small italic footer.
// ────────────────────────────────────────────────────────────────────────
function BillboardVariant() {
  return (
    <section
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #faf6ed 30%, #faf6ed 70%, #f5f5f5 100%)",
        paddingTop: "clamp(96px, 11vw, 140px)",
        paddingBottom: "clamp(96px, 11vw, 140px)",
      }}
    >
      <div className="mx-auto px-6 text-center" style={{ maxWidth: 980 }}>
        <div className="flex justify-center">
          <FiveStars size={17} />
        </div>

        <h2
          style={{
            ...cormorantItalic("clamp(34px, 5.8vw, 68px)"),
            color: PALETTE.ink,
            lineHeight: 1.1,
            margin: "44px 0 0",
            fontWeight: 500,
            position: "relative",
            display: "inline-block",
            textAlign: "center",
          }}
        >
          {/* Decorative gold quote glyphs */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: "-0.55em",
              top: "-0.05em",
              color: PALETTE.gold,
              fontSize: "0.85em",
              opacity: 0.55,
            }}
          >
            &ldquo;
          </span>
          <span style={{ display: "block" }}>Rated 4.9 from 47K+.</span>
          <span style={{ display: "block" }}>Worldwide Shipping.</span>
          <span style={{ display: "block" }}>100% Love-It Guarantee.</span>
          <span
            aria-hidden
            style={{
              position: "absolute",
              right: "-0.45em",
              bottom: "-0.55em",
              color: PALETTE.gold,
              fontSize: "0.85em",
              opacity: 0.55,
            }}
          >
            &rdquo;
          </span>
        </h2>

        <p
          style={{
            ...body("clamp(13px, 1.3vw, 14.5px)"),
            fontStyle: "italic",
            color: PALETTE.earthMuted,
            marginTop: "clamp(40px, 5vw, 64px)",
            maxWidth: 780,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.7,
            letterSpacing: "0.005em",
          }}
        >
          happy pet parent reviews · printed with care · framed beautifully ·
          delivered to your door · we'll make it right · re-do or refund · no stress
        </p>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// VARIANT C — WAX SEALS. Three circular hand-stamped badges in a row,
// slight rotation on each for hand-craft feel. Captions below in italic.
// ────────────────────────────────────────────────────────────────────────
function SealBadge({
  rotation,
  children,
}: {
  rotation: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mx-auto flex flex-col items-center justify-center"
      style={{
        width: 168,
        height: 168,
        borderRadius: "50%",
        // Two-tone radial fill suggests pressed wax depth.
        background:
          "radial-gradient(circle at 35% 30%, #fbf3e1 0%, #efdfba 65%, #d8c192 100%)",
        // Outer ring + inner hairline ring (double-stamp impression).
        boxShadow: [
          `inset 0 0 0 2px ${PALETTE.gold}`,
          `inset 0 0 0 8px #fbf3e1`,
          `inset 0 0 0 9px ${PALETTE.gold}66`,
          `0 6px 16px rgba(28, 28, 28, 0.10)`,
          `0 1px 0 rgba(255, 255, 255, 0.7) inset`,
        ].join(", "),
        transform: `rotate(${rotation})`,
        textAlign: "center",
        padding: 12,
      }}
    >
      {children}
    </div>
  );
}

function SealVariant() {
  return (
    <section
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #faf6ed 25%, #faf6ed 75%, #f5f5f5 100%)",
        paddingTop: "clamp(80px, 10vw, 120px)",
        paddingBottom: "clamp(80px, 10vw, 120px)",
      }}
    >
      <div
        className="mx-auto px-6 grid grid-cols-1 md:grid-cols-3"
        style={{ maxWidth: 1080, gap: "44px 24px" }}
      >
        {/* Seal I — Rating */}
        <div className="flex flex-col items-center">
          <SealBadge rotation="-2deg">
            <FiveStars size={11} />
            <div
              style={{
                ...cormorantItalic("48px"),
                color: PALETTE.goldDeep,
                fontWeight: 600,
                lineHeight: 1,
                marginTop: 6,
              }}
            >
              4.9
            </div>
            <div
              style={{
                ...eyebrow(PALETTE.goldDeep),
                fontSize: 9,
                marginTop: 4,
              }}
            >
              from 47K+
            </div>
          </SealBadge>
          <p
            style={{
              ...cormorantItalic("clamp(15px, 1.55vw, 17px)"),
              color: PALETTE.earth,
              marginTop: 22,
              textAlign: "center",
              maxWidth: "26ch",
            }}
          >
            happy pet parent reviews
          </p>
        </div>

        {/* Seal II — Shipping */}
        <div className="flex flex-col items-center">
          <SealBadge rotation="0.8deg">
            <Globe size={32} strokeWidth={1.3} color={PALETTE.goldDeep} aria-hidden />
            <div
              style={{
                ...display("13px"),
                color: PALETTE.goldDeep,
                marginTop: 10,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                lineHeight: 1.2,
              }}
            >
              Worldwide
              <br />
              Shipping
            </div>
          </SealBadge>
          <p
            style={{
              ...cormorantItalic("clamp(15px, 1.55vw, 17px)"),
              color: PALETTE.earth,
              marginTop: 22,
              textAlign: "center",
              maxWidth: "30ch",
            }}
          >
            printed with care · framed beautifully · delivered to your door
          </p>
        </div>

        {/* Seal III — Guarantee */}
        <div className="flex flex-col items-center">
          <SealBadge rotation="2.5deg">
            <ShieldCheck size={32} strokeWidth={1.3} color={PALETTE.goldDeep} aria-hidden />
            <div
              style={{
                ...display("12px"),
                color: PALETTE.goldDeep,
                marginTop: 10,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                lineHeight: 1.2,
              }}
            >
              100% Love-It
              <br />
              Guarantee
            </div>
          </SealBadge>
          <p
            style={{
              ...cormorantItalic("clamp(15px, 1.55vw, 17px)"),
              color: PALETTE.earth,
              marginTop: 22,
              textAlign: "center",
              maxWidth: "28ch",
            }}
          >
            we'll make it right · re-do or refund · no stress
          </p>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────
// VARIANT D — MARQUEE. One continuous horizontal flowing line that slow-
// scrolls left. Pauses on hover. Static if reduced-motion is preferred.
// ────────────────────────────────────────────────────────────────────────
function MarqueeOrnament() {
  return (
    <span
      aria-hidden
      style={{
        color: PALETTE.gold,
        fontSize: 14,
        opacity: 0.7,
        margin: "0 4px",
      }}
    >
      ✦
    </span>
  );
}

function MarqueeRun() {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 28,
        whiteSpace: "nowrap",
        paddingRight: 60,
      }}
    >
      <FiveStars size={14} />
      <span style={{ ...display("clamp(18px, 1.7vw, 20px)"), color: PALETTE.ink }}>
        Rated 4.9 from 47K+
      </span>
      <span style={{ ...cormorantItalic("clamp(15.5px, 1.5vw, 17.5px)"), color: PALETTE.earthMuted }}>
        happy pet parent reviews
      </span>

      <MarqueeOrnament />

      <Globe size={20} strokeWidth={1.4} color={PALETTE.ink} aria-hidden />
      <span style={{ ...display("clamp(18px, 1.7vw, 20px)"), color: PALETTE.ink }}>
        Worldwide Shipping
      </span>
      <span style={{ ...cormorantItalic("clamp(15.5px, 1.5vw, 17.5px)"), color: PALETTE.earthMuted }}>
        printed with care · framed beautifully · delivered to your door
      </span>

      <MarqueeOrnament />

      <ShieldCheck size={20} strokeWidth={1.4} color={PALETTE.rose} aria-hidden />
      <span style={{ ...display("clamp(18px, 1.7vw, 20px)"), color: PALETTE.ink }}>
        100% Love-It Guarantee
      </span>
      <span style={{ ...cormorantItalic("clamp(15.5px, 1.5vw, 17.5px)"), color: PALETTE.earthMuted }}>
        we'll make it right · re-do or refund · no stress
      </span>

      <MarqueeOrnament />
    </div>
  );
}

function MarqueeVariant() {
  return (
    <section
      style={{
        background: "#faf6ed",
        paddingTop: "clamp(40px, 5vw, 64px)",
        paddingBottom: "clamp(40px, 5vw, 64px)",
        overflow: "hidden",
      }}
    >
      <div
        className="trust-marquee"
        style={{
          // Edge fade so the line dissolves at the section margins.
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
          maskImage:
            "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
          overflow: "hidden",
        }}
      >
        <div
          className="trust-marquee-track"
          style={{
            display: "inline-flex",
            width: "max-content",
            willChange: "transform",
          }}
        >
          {/* Two identical runs side by side give a seamless loop. */}
          <MarqueeRun />
          <MarqueeRun />
        </div>
      </div>

      <style>{`
        .trust-marquee-track {
          animation: trust-scroll 60s linear infinite;
        }
        .trust-marquee:hover .trust-marquee-track {
          animation-play-state: paused;
        }
        @keyframes trust-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .trust-marquee-track { animation: none; }
        }
      `}</style>
    </section>
  );
}

// ── Page ────────────────────────────────────────────────────────────────
function VariantHeader({ letter, name, summary }: { letter: string; name: string; summary: string }) {
  return (
    <div
      style={{
        background: "#1c1c1c",
        color: "#ffffff",
        padding: "20px 24px",
      }}
    >
      <div className="mx-auto flex items-baseline gap-4" style={{ maxWidth: 1080 }}>
        <span style={{ ...display("28px"), color: PALETTE.gold }}>{letter}</span>
        <span style={{ ...display("18px") }}>{name}</span>
        <span style={{ ...body("14px"), color: "#bababa", marginLeft: "auto" }}>
          {summary}
        </span>
      </div>
    </div>
  );
}

export default function TrustStripPreview() {
  return (
    <main style={{ background: "#ffffff", minHeight: "100vh" }}>
      <header
        style={{
          background: "#0e0e0e",
          color: "#ffffff",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ ...eyebrow("#c4a265"), fontSize: 11 }}>Trust strip — design previews</p>
        <h1 style={{ ...display("32px"), color: "#ffffff", marginTop: 12 }}>
          Pick the one that feels right
        </h1>
        <p style={{ ...body("15px"), color: "#bababa", marginTop: 10, maxWidth: 640, margin: "10px auto 0" }}>
          Same wording in every variant. Tell me the letter (A / B / C / D) and I'll drop it into TrustStrip.tsx and ship it.
        </p>
      </header>

      <VariantHeader letter="A" name="Colophon" summary="Single vertical column · all type · magazine end-page" />
      <ColophonVariant />

      <VariantHeader letter="B" name="Billboard" summary="One giant editorial quote · captions as small footer" />
      <BillboardVariant />

      <VariantHeader letter="C" name="Wax Seals" summary="Three circular hand-stamped badges · vintage hand-craft" />
      <SealVariant />

      <VariantHeader letter="D" name="Marquee" summary="One continuous flowing line · slow auto-scroll · pauses on hover" />
      <MarqueeVariant />

      <footer
        style={{
          background: "#0e0e0e",
          color: "#bababa",
          padding: "32px 24px",
          textAlign: "center",
          ...body("14px"),
        }}
      >
        Reply with the letter you like — the rest get deleted.
      </footer>
    </main>
  );
}
