/**
 * /pawtraits/sizes-preview — internal preview of 5 size-visualization options.
 *
 * Throwaway page to let Danny compare 5 patterns side-by-side and pick one
 * to wire into FrameSizes proper. Delete after selection.
 *
 *   1. True-scale ladder (SVG, human + sofa anchors)
 *   2. "Where it lives" interior diagram (per-setting size guidance)
 *   3. Upload-your-wall preview (drag canvas onto your wall photo)
 *   4. WebAR via <model-viewer> (point phone, see at actual size)
 *   5. AI-generated lifestyle imagery (placeholder workflow demo)
 */
import { useEffect, useRef, useState } from "react";
import { CANVAS_SIZES } from "@/components/portraits/gelatoFramedCanvas";
import { PALETTE, display, eyebrow, cormorantItalic } from "@/components/portraits/tokens";
import { PortraitsNav } from "@/components/portraits/PortraitsNav";

// ─────────────────────────────────────────────────────────────────────────────
// Option 7 — West & Willow pattern: hero shot + relative-scale swatch row
//   Direct copy of what direct pet-portrait competitors actually ship:
//   one lifestyle hero shot at top, swatch grid below with each canvas
//   sized to TRUE relative scale of the others. No SVG ladders, no bento.
// ─────────────────────────────────────────────────────────────────────────────
function Option7Swatches() {
  const [selectedUid, setSelectedUid] = useState<string>("16x20");
  const heroSize = CANVAS_SIZES.find((s) => s.uid === "16x20")!;

  // Largest dimension across all sizes — used as the scale baseline
  const maxIn = Math.max(...CANVAS_SIZES.map((s) => Math.max(s.inches.w, s.inches.h)));

  return (
    <div>
      {/* ── Hero lifestyle shot ─────────────────────────────────────── */}
      <div
        className="relative rounded-lg overflow-hidden mb-7"
        style={{
          aspectRatio: "16 / 9",
          background: PALETTE.cream2,
          border: `1px solid ${PALETTE.sand}`,
          boxShadow: "0 12px 30px rgba(20, 18, 16, 0.08)",
        }}
      >
        {/* Backdrop photo */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=2000&q=92&auto=format&fit=crop)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.97) saturate(0.88)",
          }}
        />

        {/* Centered framed canvas overlay (placeholder for real product shot) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "20%",
            aspectRatio: `${heroSize.inches.w / heroSize.inches.h}`,
            background:
              "linear-gradient(135deg, #fdf6e7 0%, #f0e3c2 60%, #e6d4a8 100%)",
            border: "3px solid #8b6f3a",
            borderRadius: 1,
            boxShadow:
              "0 14px 32px rgba(0, 0, 0, 0.45), 0 4px 8px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 253, 245, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "#8b6f3a",
              fontSize: "min(48%, 32px)",
              opacity: 0.55,
              lineHeight: 1,
            }}
          >
            ✦
          </span>
        </div>

        {/* Eyebrow + caption */}
        <div className="absolute bottom-0 inset-x-0 p-6">
          <span
            className="inline-block px-2.5 py-1 rounded-full mb-2"
            style={{
              background: PALETTE.gold,
              color: PALETTE.cream,
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            ✦ Most loved
          </span>
          <p
            style={{
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: PALETTE.cream,
              textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
              letterSpacing: "-0.005em",
            }}
          >
            16×20″ — above the sofa
          </p>
        </div>
      </div>

      {/* ── Replace-with-real-shot note ─────────────────────────────── */}
      <p
        className="text-center mb-6"
        style={{
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 12,
          color: PALETTE.earthMuted,
          fontStyle: "italic",
        }}
      >
        Hero shot above is a placeholder. Production: one real product photo (or one AI-generated mockup) of 16×20 above a sofa with an actual pawtrait inside.
      </p>

      {/* ── Swatch row: 11 sizes, true-relative-scale canvas inside each button ─── */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2.5">
        {CANVAS_SIZES.map((s) => {
          const isHero = !!s.hero;
          const isSelected = selectedUid === s.uid;

          // Canvas thumb scaled to its TRUE proportion of the largest size
          const scaleFactor = Math.max(s.inches.w, s.inches.h) / maxIn;
          const baseHeight = 64; // px — biggest canvas thumb height
          const thumbH = baseHeight * scaleFactor;
          const thumbW = thumbH * (s.inches.w / s.inches.h);

          return (
            <button
              key={s.uid}
              type="button"
              onClick={() => setSelectedUid(s.uid)}
              aria-pressed={isSelected}
              className="relative rounded-md flex flex-col items-center justify-end transition-all"
              style={{
                background: isSelected ? PALETTE.cream : PALETTE.cream,
                border: isSelected
                  ? `2px solid ${PALETTE.rose}`
                  : isHero
                    ? `1.5px solid ${PALETTE.gold}`
                    : `1px solid ${PALETTE.sand}`,
                padding: "12px 6px 10px",
                boxShadow: isSelected
                  ? "0 8px 20px rgba(191, 82, 74, 0.18)"
                  : isHero
                    ? "0 4px 12px rgba(196, 162, 101, 0.16)"
                    : "0 1px 3px rgba(20, 18, 16, 0.04)",
                cursor: "pointer",
                minHeight: 130,
              }}
            >
              {/* "Most loved" tiny pill on hero */}
              {isHero && !isSelected && (
                <span
                  className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    background: PALETTE.gold,
                    color: PALETTE.cream,
                    fontFamily: "Asap, system-ui, sans-serif",
                    fontSize: 7.5,
                    fontWeight: 800,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  ✦
                </span>
              )}

              {/* Canvas thumbnail at TRUE relative scale */}
              <div
                className="flex items-end justify-center mb-2"
                style={{ height: baseHeight + 4, width: "100%" }}
              >
                <div
                  style={{
                    width: thumbW,
                    height: thumbH,
                    background:
                      "linear-gradient(135deg, #fdf6e7 0%, #f0e3c2 60%, #e6d4a8 100%)",
                    border: isHero
                      ? `1.5px solid ${PALETTE.goldDeep}`
                      : `1.25px solid ${PALETTE.ink}`,
                    borderRadius: 1,
                    boxShadow:
                      "0 3px 6px rgba(20, 18, 16, 0.18), inset 0 0 0 1px rgba(255, 253, 245, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {scaleFactor > 0.55 && (
                    <span
                      style={{
                        color: isHero ? PALETTE.gold : PALETTE.earthMuted,
                        fontSize: thumbH * 0.32,
                        opacity: 0.55,
                        lineHeight: 1,
                      }}
                    >
                      ✦
                    </span>
                  )}
                </div>
              </div>

              {/* Size label */}
              <div
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: PALETTE.ink,
                  letterSpacing: "-0.005em",
                  lineHeight: 1.1,
                }}
              >
                {s.label}
              </div>

              {/* Price */}
              <div
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: isSelected
                    ? PALETTE.rose
                    : isHero
                      ? PALETTE.goldDeep
                      : PALETTE.earthMuted,
                  marginTop: 2,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                £{s.priceGBP}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Frame swatches (unchanged from prod) ────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 mt-8">
        <span
          style={{
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 700,
            color: PALETTE.earthMuted,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Frames
        </span>
        {/* Hardcoded swatches matching FRAME_COLORS */}
        {[
          { uid: "black", label: "Black", swatch: "#1c1c1c" },
          { uid: "walnut", label: "Walnut", swatch: "#5a3e29" },
          { uid: "natural", label: "Natural Oak", swatch: "#c9a66b" },
        ].map((c) => (
          <div key={c.uid} className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="rounded-full inline-block"
              style={{
                width: 22,
                height: 22,
                background: c.swatch,
                border: `1px solid ${PALETTE.sandDeep}`,
                boxShadow:
                  "0 2px 6px rgba(20, 18, 16, 0.10), inset 0 0 0 2px rgba(255, 255, 255, 0.06)",
              }}
            />
            <span
              style={{
                fontFamily: "Asap, system-ui, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: PALETTE.earth,
              }}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>

      <p
        className="text-center mt-5"
        style={{
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 13,
          color: PALETTE.earthMuted,
        }}
      >
        Canvas + frame only — delivery is calculated at checkout.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Option 6 — Curated lifestyle context guide (RECOMMENDED)
//   Mix of "Where it lives" + lifestyle imagery. Pre-selected pro photography,
//   NOT per-pet AI gen. Each setting maps to a recommended size.
//
//   For preview we use carefully-picked Unsplash interior shots that approximate
//   the brand register. For production these get replaced with a real product
//   photoshoot of Little Souls canvases on actual walls (~£600 one-off, owned
//   forever, no recurring AI cost, brand-perfect).
// ─────────────────────────────────────────────────────────────────────────────
// Each setting includes a `frame` block: { top, left, widthPct, aspect }
// that positions a CSS-rendered framed canvas overlay on the photo, so the
// customer always SEES a frame on the wall (not just an empty room).
type Setting = {
  id: string;
  img: string;
  setting: string;
  size: string;
  sizeUid: string;
  price: number;
  pitch: string;
  span: "narrow" | "wide";
  isHero?: boolean;
  frame: { top: string; left: string; widthPct: number; aspect: number };
};

const LIFESTYLE_SETTINGS: Setting[] = [
  {
    id: "bedside",
    img: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1400&q=88&auto=format&fit=crop",
    setting: "Bedside · shelf · desk",
    size: "8×10″",
    sizeUid: "8x10",
    price: 39,
    pitch: "Quiet companion. Pairs in 2s.",
    span: "narrow",
    frame: { top: "22%", left: "50%", widthPct: 18, aspect: 8 / 10 },
  },
  {
    id: "hero",
    img: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1800&q=92&auto=format&fit=crop",
    setting: "Above the sofa · headboard",
    size: "16×20″",
    sizeUid: "16x20",
    price: 65,
    pitch: "Most loved. Hero of the room.",
    span: "wide",
    isHero: true,
    frame: { top: "20%", left: "50%", widthPct: 22, aspect: 16 / 20 },
  },
  {
    id: "console",
    img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1400&q=88&auto=format&fit=crop",
    setting: "Hallway console · entryway",
    size: "12×18″",
    sizeUid: "12x18",
    price: 55,
    pitch: "Welcoming first impression.",
    span: "narrow",
    frame: { top: "18%", left: "50%", widthPct: 24, aspect: 12 / 18 },
  },
  {
    id: "gallery",
    img: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1400&q=88&auto=format&fit=crop",
    setting: "Gallery wall · staircase",
    size: "8×10″ × 3",
    sizeUid: "8x10",
    price: 39,
    pitch: "Three at this size. Layered story.",
    span: "narrow",
    frame: { top: "22%", left: "50%", widthPct: 16, aspect: 8 / 10 },
  },
  {
    id: "statement",
    img: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1800&q=92&auto=format&fit=crop",
    setting: "Statement wall · centerpiece",
    size: "24×36″",
    sizeUid: "24x36",
    price: 119,
    pitch: "Stops you walking past.",
    span: "wide",
    frame: { top: "16%", left: "50%", widthPct: 26, aspect: 24 / 36 },
  },
  {
    id: "desk",
    img: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1400&q=88&auto=format&fit=crop",
    setting: "Desk · home office",
    size: "12×16″",
    sizeUid: "12x16",
    price: 49,
    pitch: "Eye-line companion at the desk.",
    span: "narrow",
    frame: { top: "20%", left: "50%", widthPct: 20, aspect: 12 / 16 },
  },
];

/** CSS-overlay framed canvas — visible on every photo regardless of source. */
function CanvasOverlay({
  frame,
  isHero,
  count = 1,
}: {
  frame: Setting["frame"];
  isHero?: boolean;
  count?: number;
}) {
  const frameBorder = isHero ? "#8b6f3a" : "#1c1c1c";
  const matBg = "linear-gradient(135deg, #fdf6e7 0%, #f0e3c2 60%, #e6d4a8 100%)";

  // Single canvas
  if (count === 1) {
    return (
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: frame.top,
          left: frame.left,
          transform: "translateX(-50%)",
          width: `${frame.widthPct}%`,
          aspectRatio: `${frame.aspect}`,
          background: matBg,
          border: `${isHero ? 3 : 2.5}px solid ${frameBorder}`,
          borderRadius: 1,
          boxShadow: isHero
            ? "0 14px 32px rgba(0, 0, 0, 0.45), 0 4px 8px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 253, 245, 0.3)"
            : "0 10px 22px rgba(0, 0, 0, 0.40), 0 3px 6px rgba(0, 0, 0, 0.22), inset 0 0 0 1px rgba(255, 253, 245, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: isHero ? "#8b6f3a" : "#7a6e62",
            fontSize: "min(38%, 24px)",
            opacity: 0.55,
            lineHeight: 1,
          }}
        >
          ✦
        </span>
      </div>
    );
  }

  // Triptych (gallery)
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: frame.top,
        left: frame.left,
        transform: "translateX(-50%)",
        width: `${frame.widthPct * 3 + 6}%`,
        display: "flex",
        gap: "3%",
        justifyContent: "center",
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: `${frame.widthPct * 3}%`,
            aspectRatio: `${frame.aspect}`,
            background: matBg,
            border: `2.5px solid ${frameBorder}`,
            borderRadius: 1,
            boxShadow:
              "0 10px 22px rgba(0, 0, 0, 0.40), 0 3px 6px rgba(0, 0, 0, 0.22), inset 0 0 0 1px rgba(255, 253, 245, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              color: "#7a6e62",
              fontSize: "min(38%, 16px)",
              opacity: 0.55,
              lineHeight: 1,
            }}
          >
            ✦
          </span>
        </div>
      ))}
    </div>
  );
}

function Option6LifestyleGuide() {
  return (
    <div>
      {/* Section sub-header */}
      <div className="text-center mx-auto mb-8" style={{ maxWidth: 560 }}>
        <p
          style={{
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: PALETTE.earth,
            lineHeight: 1.55,
          }}
        >
          Six rooms. Six recommendations. Tap a card to scroll to that size in the studio.
        </p>
      </div>

      {/* Bento-style grid: hero photo span-2, the rest 1-up */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 auto-rows-[260px] md:auto-rows-[300px]">
        {LIFESTYLE_SETTINGS.map((s) => {
          const isHero = !!s.isHero;
          const isWide = s.span === "wide";
          return (
            <article
              key={s.id}
              className={`group relative overflow-hidden rounded-lg ${
                isWide ? "col-span-2 row-span-1 md:row-span-2" : ""
              }`}
              style={{
                background: PALETTE.cream,
                border: isHero ? `1px solid ${PALETTE.gold}` : `1px solid ${PALETTE.sand}`,
                boxShadow: isHero
                  ? "0 14px 38px rgba(196, 162, 101, 0.20), 0 2px 6px rgba(20, 18, 16, 0.06)"
                  : "0 6px 18px rgba(20, 18, 16, 0.06), 0 1px 3px rgba(20, 18, 16, 0.04)",
                cursor: "pointer",
              }}
            >
              {/* Photo (subtle desaturation so the overlaid canvas reads as the hero) */}
              <div
                className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
                style={{
                  backgroundImage: `url(${s.img})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "brightness(0.96) saturate(0.85)",
                }}
              />

              {/* Framed canvas overlay — the visible hero of every tile */}
              <CanvasOverlay
                frame={s.frame}
                isHero={isHero}
                count={s.id === "gallery" ? 3 : 1}
              />

              {/* Bottom gradient for legibility */}
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  height: "62%",
                  background:
                    "linear-gradient(180deg, rgba(20, 18, 16, 0) 0%, rgba(20, 18, 16, 0.55) 60%, rgba(20, 18, 16, 0.85) 100%)",
                }}
              />

              {/* Hero pill */}
              {isHero && (
                <span
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full"
                  style={{
                    background: PALETTE.gold,
                    color: PALETTE.cream,
                    fontFamily: "Asap, system-ui, sans-serif",
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  ✦ Most loved
                </span>
              )}

              {/* Size badge — top right */}
              <div
                className="absolute top-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-md"
                style={{
                  background: "rgba(255, 253, 245, 0.92)",
                  border: `1px solid rgba(20, 18, 16, 0.06)`,
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: PALETTE.ink,
                  letterSpacing: "-0.005em",
                  boxShadow: "0 4px 12px rgba(20, 18, 16, 0.16)",
                }}
              >
                {s.size}
                <span style={{ color: PALETTE.earthMuted, fontWeight: 500, marginLeft: 6 }}>
                  £{s.price}
                </span>
              </div>

              {/* Footer copy */}
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                <p
                  style={{
                    fontFamily: "Assistant, system-ui, sans-serif",
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "rgba(255, 253, 245, 0.78)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  {s.setting}
                </p>
                <p
                  className="mt-1.5"
                  style={{
                    fontFamily: isHero
                      ? '"Cormorant", "Cormorant Garamond", Georgia, serif'
                      : "Asap, system-ui, sans-serif",
                    fontStyle: isHero ? "italic" : "normal",
                    fontSize: isHero ? 22 : 16,
                    fontWeight: isHero ? 600 : 600,
                    color: PALETTE.cream,
                    lineHeight: 1.25,
                    letterSpacing: "-0.005em",
                    textShadow: "0 1px 8px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  {s.pitch}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {/* Production note */}
      <div
        className="mt-6 rounded-md p-4"
        style={{
          background: "rgba(196, 162, 101, 0.08)",
          border: "1px solid rgba(196, 162, 101, 0.22)",
        }}
      >
        <p
          style={{
            fontFamily: "Asap, system-ui, sans-serif",
            fontSize: 11,
            fontWeight: 700,
            color: PALETTE.goldDeep,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Production note
        </p>
        <p
          className="mt-1.5"
          style={{
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 13.5,
            color: PALETTE.earth,
            lineHeight: 1.55,
          }}
        >
          The framed canvas on each tile is rendered in CSS so it always shows — you actually see a frame in every shot, not an empty wall to imagine. Demo uses Unsplash interiors as the room backdrop. <strong>For ship</strong>: one half-day product photoshoot with real Little Souls canvases on styled walls (~£500–700 one-off via local stylist). Owned forever, brand-perfect, zero recurring per-customer cost.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared scale: 1 inch = SCALE px. Used by SVG-based options (1, 2).
// ─────────────────────────────────────────────────────────────────────────────
const SCALE = 5; // 1 inch = 5px → 36" = 180px, 84" sofa = 420px

// Ergonomic anchor dimensions
const HUMAN_HEIGHT_IN = 68; // 5'8" / 173cm
const SOFA_WIDTH_IN = 84;
const SOFA_HEIGHT_IN = 30;
const EYE_LEVEL_IN = 57; // standard hanging height: canvas centre at 57"
const FLOOR_PAD = 10; // px below floor for shadow

// ─────────────────────────────────────────────────────────────────────────────
// Option 1 — True-scale ladder
// ─────────────────────────────────────────────────────────────────────────────
function Option1Ladder() {
  // Sort smallest → largest by area
  const sizes = [...CANVAS_SIZES].sort(
    (a, b) => a.inches.w * a.inches.h - b.inches.w * b.inches.h,
  );

  // Layout: human on left, all 11 frames in a row at eye level, sofa on right
  const humanW = 18 * SCALE; // ~18" shoulder width
  const humanH = HUMAN_HEIGHT_IN * SCALE;
  const sofaW = SOFA_WIDTH_IN * SCALE;
  const sofaH = SOFA_HEIGHT_IN * SCALE;

  const gap = 18;
  const framesRowW = sizes.reduce((acc, s) => acc + s.inches.w * SCALE + gap, -gap);
  const totalW = humanW + 36 + framesRowW + 36 + sofaW + 40;

  const ceiling = 96 * SCALE; // 8ft = 480px
  const floorY = ceiling + FLOOR_PAD;
  const eyeY = ceiling - EYE_LEVEL_IN * SCALE; // top-of-svg coords; floor=ceiling

  // Each frame: centre at eyeY, top = eyeY - height/2
  let cursorX = humanW + 36;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${floorY + 20}`}
      role="img"
      aria-label="All 11 canvas sizes drawn at true scale next to a human and a sofa"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      {/* Wall background */}
      <rect x={0} y={0} width={totalW} height={floorY} fill="#fbf9f4" />
      {/* Floor */}
      <rect x={0} y={floorY} width={totalW} height={20} fill="#e8ddc9" />
      {/* Floor shadow line */}
      <line x1={0} y1={floorY} x2={totalW} y2={floorY} stroke={PALETTE.sandDeep} strokeWidth={0.6} />

      {/* Eye-level guide (subtle) */}
      <line
        x1={0}
        y1={eyeY}
        x2={totalW}
        y2={eyeY}
        stroke={PALETTE.gold}
        strokeWidth={0.4}
        strokeDasharray="3 5"
        opacity={0.4}
      />
      <text
        x={6}
        y={eyeY - 4}
        fontFamily="Assistant, system-ui, sans-serif"
        fontSize={9}
        fill={PALETTE.goldDeep}
        opacity={0.6}
      >
        Eye level (57″ / 145cm)
      </text>

      {/* Human silhouette — anchored to floor */}
      <g transform={`translate(0, ${floorY - humanH})`} opacity={0.85}>
        {/* Head */}
        <circle cx={humanW / 2} cy={11 * SCALE * 0.5} r={5 * SCALE} fill={PALETTE.earthMuted} />
        {/* Body */}
        <path
          d={`
            M ${humanW / 2 - 9 * SCALE * 0.4} ${5 * SCALE + 1}
            Q ${humanW / 2} ${5 * SCALE - 2}, ${humanW / 2 + 9 * SCALE * 0.4} ${5 * SCALE + 1}
            L ${humanW / 2 + 11 * SCALE * 0.4} ${30 * SCALE}
            L ${humanW / 2 + 6 * SCALE * 0.6} ${humanH - 4 * SCALE}
            L ${humanW / 2 + 4 * SCALE * 0.4} ${humanH}
            L ${humanW / 2 - 4 * SCALE * 0.4} ${humanH}
            L ${humanW / 2 - 6 * SCALE * 0.6} ${humanH - 4 * SCALE}
            L ${humanW / 2 - 11 * SCALE * 0.4} ${30 * SCALE}
            Z
          `}
          fill={PALETTE.earthMuted}
        />
        <text
          x={humanW / 2}
          y={humanH + 14}
          textAnchor="middle"
          fontFamily="Assistant, system-ui, sans-serif"
          fontSize={9}
          fontWeight={600}
          fill={PALETTE.earth}
        >
          5′8″ · 173cm
        </text>
      </g>

      {/* Frames ladder — eye-level row */}
      {sizes.map((s) => {
        const w = s.inches.w * SCALE;
        const h = s.inches.h * SCALE;
        const x = cursorX;
        const y = eyeY - h / 2;
        cursorX += w + gap;
        const isHero = !!s.hero;
        return (
          <g key={s.uid}>
            {/* Hanging hook (subtle nail) */}
            <circle cx={x + w / 2} cy={y - 4} r={1.4} fill={PALETTE.earthMuted} opacity={0.7} />
            {/* Frame */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={`url(#canvasGradient-${s.uid})`}
              stroke={isHero ? PALETTE.goldDeep : PALETTE.ink}
              strokeWidth={isHero ? 1.6 : 1.2}
              rx={1}
              style={{
                filter: isHero
                  ? "drop-shadow(0 4px 6px rgba(196, 162, 101, 0.30))"
                  : "drop-shadow(0 2px 3px rgba(20, 18, 16, 0.18))",
              }}
            />
            <defs>
              <linearGradient id={`canvasGradient-${s.uid}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={isHero ? "#fff7e8" : "#ffffff"} />
                <stop offset="100%" stopColor={isHero ? "#f3e5cb" : "#f4ecdf"} />
              </linearGradient>
            </defs>
            {/* Hero star */}
            {isHero && (
              <text
                x={x + w / 2}
                y={y + h / 2 + 4}
                textAnchor="middle"
                fontSize={11}
                fill={PALETTE.gold}
                opacity={0.55}
              >
                ✦
              </text>
            )}
            {/* Size label below floor */}
            <text
              x={x + w / 2}
              y={floorY + 14}
              textAnchor="middle"
              fontFamily="Asap, system-ui, sans-serif"
              fontSize={9.5}
              fontWeight={700}
              fill={isHero ? PALETTE.goldDeep : PALETTE.earth}
            >
              {s.label}
            </text>
          </g>
        );
      })}

      {/* Sofa silhouette — far right, anchored to floor */}
      <g transform={`translate(${totalW - sofaW - 20}, ${floorY - sofaH})`}>
        {/* Sofa body */}
        <rect
          x={0}
          y={sofaH * 0.18}
          width={sofaW}
          height={sofaH * 0.82}
          fill={PALETTE.earth}
          opacity={0.78}
          rx={6}
        />
        {/* Backrest */}
        <rect
          x={4}
          y={0}
          width={sofaW - 8}
          height={sofaH * 0.55}
          fill={PALETTE.earth}
          opacity={0.85}
          rx={5}
        />
        {/* Cushion lines */}
        <line
          x1={sofaW / 3}
          y1={sofaH * 0.18}
          x2={sofaW / 3}
          y2={sofaH * 0.95}
          stroke={PALETTE.cream}
          strokeOpacity={0.15}
          strokeWidth={1}
        />
        <line
          x1={(sofaW * 2) / 3}
          y1={sofaH * 0.18}
          x2={(sofaW * 2) / 3}
          y2={sofaH * 0.95}
          stroke={PALETTE.cream}
          strokeOpacity={0.15}
          strokeWidth={1}
        />
        <text
          x={sofaW / 2}
          y={sofaH + 14}
          textAnchor="middle"
          fontFamily="Assistant, system-ui, sans-serif"
          fontSize={9}
          fontWeight={600}
          fill={PALETTE.earth}
        >
          84″ sofa
        </text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Option 2 — "Where it lives" room settings
// ─────────────────────────────────────────────────────────────────────────────
function Option2WhereItLives() {
  const settings = [
    {
      title: "Bedside · shelf · desk",
      sub: "Quiet companion",
      sizeUid: "8x10",
      sizeLabel: "8×10″",
      caption: "Sized for arm's length. Pairs in 2s or 3s.",
      furniture: "table",
    },
    {
      title: "Above a console / hallway",
      sub: "Welcoming first impression",
      sizeUid: "12x18",
      sizeLabel: "12×18″",
      caption: "Eye-level focal point. Sits well above a 36″ console.",
      furniture: "console",
    },
    {
      title: "Above a bed or sofa",
      sub: "Hero of the room",
      sizeUid: "16x20",
      sizeLabel: "16×20″",
      caption: "Most loved. ~70% of a 24″ headboard. Pair two for a king bed.",
      furniture: "sofa",
      isHero: true,
    },
    {
      title: "Statement wall",
      sub: "Centerpiece",
      sizeUid: "24x36",
      sizeLabel: "24×36″",
      caption: "Stops you walking past. Anchors a 60–80″ wall on its own.",
      furniture: "wall",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {settings.map((s) => {
        const size = CANVAS_SIZES.find((c) => c.uid === s.sizeUid)!;
        const fScale = 3.4; // tighter scale per tile
        const fW = size.inches.w * fScale;
        const fH = size.inches.h * fScale;
        return (
          <article
            key={s.sizeUid}
            className="rounded-lg p-6 flex gap-5 items-center"
            style={{
              background: PALETTE.cream,
              border: s.isHero ? `1px solid ${PALETTE.gold}` : `1px solid ${PALETTE.sand}`,
              boxShadow: s.isHero
                ? "0 12px 28px rgba(196, 162, 101, 0.16)"
                : "0 2px 8px rgba(20, 18, 16, 0.04)",
            }}
          >
            <div
              className="flex-shrink-0 flex items-end justify-center"
              style={{ width: 130, height: 130 }}
            >
              <FurnitureSilhouette type={s.furniture as never} frameW={fW} frameH={fH} isHero={s.isHero} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: "Assistant, system-ui, sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: s.isHero ? PALETTE.goldDeep : PALETTE.earthMuted,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {s.sub}
              </p>
              <h3
                className="mt-1.5"
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 19,
                  fontWeight: 700,
                  color: PALETTE.ink,
                  letterSpacing: "-0.005em",
                  lineHeight: 1.2,
                }}
              >
                {s.title}
              </h3>
              <p
                className="mt-1.5"
                style={{
                  fontFamily: "Assistant, system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: PALETTE.earth,
                  lineHeight: 1.5,
                }}
              >
                {s.caption}
              </p>
              <p
                className="mt-2"
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: s.isHero ? PALETTE.goldDeep : PALETTE.rose,
                  letterSpacing: "0.02em",
                }}
              >
                Recommended: {s.sizeLabel}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function FurnitureSilhouette({
  type,
  frameW,
  frameH,
  isHero,
}: {
  type: "table" | "console" | "sofa" | "wall";
  frameW: number;
  frameH: number;
  isHero?: boolean;
}) {
  const stroke = isHero ? PALETTE.goldDeep : PALETTE.ink;
  const fill = isHero ? "#f7eed7" : "#fbf6e9";
  const W = 130;
  const H = 130;

  if (type === "table") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* Frame */}
        <rect x={(W - frameW) / 2} y={H - 90 - frameH} width={frameW} height={frameH} fill={fill} stroke={stroke} strokeWidth={1.4} />
        {/* Bedside table */}
        <rect x={20} y={H - 32} width={W - 40} height={32} fill={PALETTE.earth} opacity={0.78} rx={2} />
        <rect x={28} y={H - 26} width={W - 56} height={3} fill={PALETTE.cream} opacity={0.2} />
      </svg>
    );
  }
  if (type === "console") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <rect x={(W - frameW) / 2} y={H - 50 - frameH} width={frameW} height={frameH} fill={fill} stroke={stroke} strokeWidth={1.4} />
        {/* Console table */}
        <rect x={8} y={H - 25} width={W - 16} height={6} fill={PALETTE.earth} opacity={0.85} />
        <rect x={14} y={H - 19} width={4} height={19} fill={PALETTE.earth} opacity={0.8} />
        <rect x={W - 18} y={H - 19} width={4} height={19} fill={PALETTE.earth} opacity={0.8} />
      </svg>
    );
  }
  if (type === "sofa") {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <rect x={(W - frameW) / 2} y={H - 50 - frameH} width={frameW} height={frameH} fill={fill} stroke={stroke} strokeWidth={1.4} />
        {/* Sofa */}
        <rect x={4} y={H - 30} width={W - 8} height={28} fill={PALETTE.earth} opacity={0.78} rx={4} />
        <rect x={8} y={H - 38} width={W - 16} height={20} fill={PALETTE.earth} opacity={0.85} rx={3} />
      </svg>
    );
  }
  // wall
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
      {/* Tall canvas centred */}
      <rect x={(W - frameW) / 2} y={(H - frameH) / 2 - 6} width={frameW} height={frameH} fill={fill} stroke={stroke} strokeWidth={1.6} />
      <line x1={5} y1={H - 4} x2={W - 5} y2={H - 4} stroke={PALETTE.sandDeep} strokeWidth={1} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Option 3 — Upload-your-wall preview (drag canvas onto your photo)
// ─────────────────────────────────────────────────────────────────────────────
function Option3UploadWall() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [sizeUid, setSizeUid] = useState<string>("16x20");
  const [drag, setDrag] = useState({ x: 50, y: 50 });
  const [pxPerInch, setPxPerInch] = useState<number>(8); // user-tunable scale

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const size = CANVAS_SIZES.find((c) => c.uid === sizeUid)!;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, px: drag.x, py: drag.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDrag({ x: dragStartRef.current.px + dx, y: dragStartRef.current.py + dy });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  const frameW = size.inches.w * pxPerInch;
  const frameH = size.inches.h * pxPerInch;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all hover:scale-[1.02]"
          style={{
            background: PALETTE.ink,
            color: PALETTE.cream,
            fontFamily: "Asap, system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {photoUrl ? "Change wall photo" : "Upload your wall photo"}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>

        {photoUrl && (
          <>
            <select
              value={sizeUid}
              onChange={(e) => setSizeUid(e.target.value)}
              className="rounded-full px-3 py-2"
              style={{
                background: PALETTE.cream,
                border: `1px solid ${PALETTE.sand}`,
                fontFamily: "Asap, system-ui, sans-serif",
                fontSize: 13,
                color: PALETTE.ink,
              }}
            >
              {CANVAS_SIZES.map((s) => (
                <option key={s.uid} value={s.uid}>
                  {s.label}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-2" style={{ fontFamily: "Assistant, system-ui, sans-serif", fontSize: 12, color: PALETTE.earth }}>
              Scale
              <input
                type="range"
                min={3}
                max={20}
                step={0.5}
                value={pxPerInch}
                onChange={(e) => setPxPerInch(Number(e.target.value))}
                style={{ width: 100 }}
              />
              <span style={{ fontFamily: "Asap, system-ui, sans-serif", fontWeight: 600 }}>{pxPerInch.toFixed(1)} px/in</span>
            </label>
          </>
        )}
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative rounded-md overflow-hidden"
        style={{
          width: "100%",
          aspectRatio: "16/10",
          background: photoUrl ? "transparent" : PALETTE.cream2,
          border: `1px solid ${PALETTE.sand}`,
          backgroundImage: photoUrl ? `url(${photoUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          touchAction: "none",
          userSelect: "none",
        }}
      >
        {!photoUrl && (
          <div
            className="absolute inset-0 flex items-center justify-center text-center px-6"
            style={{ color: PALETTE.earthMuted }}
          >
            <p style={{ fontFamily: "Assistant, system-ui, sans-serif", fontSize: 14 }}>
              Upload a photo of your wall — drag the canvas to position it, slide to adjust scale.
            </p>
          </div>
        )}
        {photoUrl && (
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              position: "absolute",
              left: drag.x,
              top: drag.y,
              width: frameW,
              height: frameH,
              cursor: "grab",
              background: "rgba(255, 253, 245, 0.85)",
              border: `2px solid ${PALETTE.ink}`,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.2)",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: PALETTE.ink,
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.02em",
              textShadow: "0 1px 2px rgba(255, 253, 245, 0.6)",
            }}
          >
            {size.label}
          </div>
        )}
      </div>

      <p
        className="mt-3"
        style={{
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 12,
          color: PALETTE.earthMuted,
          fontStyle: "italic",
        }}
      >
        Use a known reference (door = 80″, light switch = ~3.5″ from floor) to calibrate the scale slider.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Option 4 — WebAR via <model-viewer>
// Loads model-viewer once, renders a placeholder GLB with AR launch buttons.
// ─────────────────────────────────────────────────────────────────────────────
function Option4AR() {
  const [loaded, setLoaded] = useState(false);
  const [sizeUid, setSizeUid] = useState<string>("16x20");
  const size = CANVAS_SIZES.find((c) => c.uid === sizeUid)!;

  useEffect(() => {
    if (customElements.get("model-viewer")) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Convert size to metres (model-viewer scale="" expects metres)
  const wM = (size.inches.w * 0.0254).toFixed(3);
  const hM = (size.inches.h * 0.0254).toFixed(3);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={sizeUid}
          onChange={(e) => setSizeUid(e.target.value)}
          className="rounded-full px-3 py-2"
          style={{
            background: PALETTE.cream,
            border: `1px solid ${PALETTE.sand}`,
            fontFamily: "Asap, system-ui, sans-serif",
            fontSize: 13,
            color: PALETTE.ink,
          }}
        >
          {CANVAS_SIZES.map((s) => (
            <option key={s.uid} value={s.uid}>
              {s.label} · £{s.priceGBP}
            </option>
          ))}
        </select>
        <span
          style={{
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 12,
            color: PALETTE.earthMuted,
          }}
        >
          {wM}m × {hM}m at true physical scale
        </span>
      </div>

      <div
        className="rounded-md overflow-hidden relative"
        style={{
          background: PALETTE.cream2,
          border: `1px solid ${PALETTE.sand}`,
          width: "100%",
          height: 460,
        }}
      >
        {loaded ? (
          // @ts-expect-error custom element
          <model-viewer
            src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
            alt="Demo placeholder model — real implementation would be a GLB of the framed pawtrait"
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="fixed"
            camera-controls
            touch-action="pan-y"
            shadow-intensity="1"
            scale={`${wM} ${hM} 0.025`}
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: PALETTE.cream2,
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ color: PALETTE.earthMuted }}>
            Loading <code>&lt;model-viewer&gt;</code>…
          </div>
        )}
      </div>

      <p
        className="mt-3"
        style={{
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 12,
          color: PALETTE.earthMuted,
          fontStyle: "italic",
        }}
      >
        Tap the AR button (bottom-right of viewer) on iOS Safari or Android Chrome to place the canvas in your room at true size. Demo uses Google's astronaut GLB as a placeholder — production would render an actual framed canvas with the customer's pawtrait baked into the texture.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Option 5 — AI-generated lifestyle imagery (workflow demo with placeholders)
// ─────────────────────────────────────────────────────────────────────────────
function Option5AILifestyle() {
  // Use Unsplash placeholder images for the visual demo
  const mockups = [
    {
      sizeUid: "8x10",
      label: "8×10″",
      caption: "Bedside · pair · gallery wall starter",
      img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop",
    },
    {
      sizeUid: "16x20",
      label: "16×20″ · most loved",
      caption: "Above headboard · console focal",
      img: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop",
    },
    {
      sizeUid: "24x36",
      label: "24×36″",
      caption: "Statement wall · centerpiece",
      img: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop",
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockups.map((m) => (
          <figure
            key={m.sizeUid}
            className="rounded-md overflow-hidden"
            style={{
              background: PALETTE.cream,
              border: `1px solid ${PALETTE.sand}`,
              boxShadow: "0 8px 24px rgba(20, 18, 16, 0.08)",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "4/5",
                backgroundImage: `url(${m.img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <figcaption className="p-4">
              <p
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: PALETTE.ink,
                }}
              >
                {m.label}
              </p>
              <p
                className="mt-1"
                style={{
                  fontFamily: "Assistant, system-ui, sans-serif",
                  fontSize: 12.5,
                  color: PALETTE.earthMuted,
                }}
              >
                {m.caption}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
      <p
        className="mt-4"
        style={{
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 12,
          color: PALETTE.earthMuted,
          fontStyle: "italic",
        }}
      >
        Demo uses Unsplash interior photos as placeholders. Production: GPT-image-1 / Imagen / SDXL generates a photoreal mockup of <strong>each pet pawtrait</strong> on a styled wall per size. ~£0.20–0.40 per mockup × 11 sizes × N hero placements; need to recompute on every catalog change. Static and not interactive.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page wrapper
// ─────────────────────────────────────────────────────────────────────────────
export default function SizesPreview() {
  const sections = [
    {
      n: 7,
      title: "Hero shot + relative-scale swatches (West & Willow pattern)",
      sub: "Direct copy of what direct pet-portrait competitors actually ship",
      pros: "Proven pattern from Crown & Paw, West & Willow, Mixtiles. Fast to scan all 11 sizes at true relative scale. Only ONE hero photo asset to produce. Selectable buttons feel native to product configurators.",
      cons: "Hero shot needs one real product photo or AI mockup (single image, not 11). Less editorial than bento grid.",
      Component: Option7Swatches,
      recommended: true,
    },
    {
      n: 6,
      title: "Lifestyle context guide",
      sub: "Curated photography × per-setting size guidance — pre-selected, not per-pet",
      pros: "Real lifestyle imagery + clear size guidance in one. Pre-shot once → owned forever, no per-customer cost.",
      cons: "Needs 6 real product photos for ship (~£500–700 photoshoot). Demo uses curated Unsplash placeholders with CSS-overlay frames.",
      Component: Option6LifestyleGuide,
    },
    {
      n: 1,
      title: "True-scale ladder",
      sub: "All 11 sizes drawn beside a 5′8″ silhouette and an 84″ sofa",
      pros: "Honest, brand-consistent, infinite resolution, free, fast",
      cons: "Static — doesn't show personalised image or actual room context",
      Component: Option1Ladder,
    },
    {
      n: 2,
      title: "Where it lives",
      sub: "Per-setting size guidance with stylised furniture",
      pros: "Most actionable — tells customer which size for which spot",
      cons: "Curated rather than exhaustive; doesn't show all 11 in one view",
      Component: Option2WhereItLives,
    },
    {
      n: 3,
      title: "Upload-your-wall",
      sub: "Drop your wall photo, drag the canvas onto it, calibrate scale",
      pros: "Personal — customer sees THEIR space, drives confidence + reduces returns",
      cons: "Scale calibration needs known reference; mid-effort to maintain",
      Component: Option3UploadWall,
    },
    {
      n: 4,
      title: "AR Quick Look",
      sub: "Point your phone at the wall — canvas appears at actual size",
      pros: "Highest conversion-lift signal in print/furniture e-commerce; no upload friction",
      cons: "Requires a GLB + USDZ asset per size × frame finish; iOS/Android only (no desktop AR)",
      Component: Option4AR,
    },
    {
      n: 5,
      title: "AI lifestyle mockups",
      sub: "Photoreal AI-rendered scenes of each pawtrait in styled rooms",
      pros: "Aspirational, shareable, marketing-asset reuse",
      cons: "Cost recurs per pet × per size; static; consistency drift between gens",
      Component: Option5AILifestyle,
    },
  ];

  return (
    <main style={{ background: PALETTE.cream, minHeight: "100vh" }}>
      <PortraitsNav />
      <div style={{ height: 62 }} aria-hidden />

      <section className="px-5 md:px-10 pt-10 pb-6">
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          <p style={eyebrow(PALETTE.goldDeep)}>Internal · pick one</p>
          <h1
            style={{
              ...display("clamp(34px, 5vw, 48px)"),
              color: PALETTE.ink,
              marginTop: 14,
            }}
          >
            Five ways to visualise size.
          </h1>
          <p
            style={{
              ...cormorantItalic("clamp(16px, 1.8vw, 18px)"),
              color: PALETTE.earth,
              marginTop: 10,
              maxWidth: 640,
              lineHeight: 1.5,
            }}
          >
            Top of page = Option 7, the West & Willow / Crown & Paw pattern that direct competitors actually ship. The rest stay below for reference.
          </p>
        </div>
      </section>

      {sections.map(({ n, title, sub, pros, cons, Component, recommended }, idx) => (
        <section
          key={n}
          className="px-5 md:px-10 py-12"
          style={{
            borderTop: `1px solid ${PALETTE.sand}`,
            background: recommended
              ? `linear-gradient(180deg, rgba(196, 162, 101, 0.06) 0%, ${PALETTE.cream} 100%)`
              : idx % 2 === 0
                ? PALETTE.cream
                : PALETTE.cream2,
          }}
        >
          <div className="mx-auto" style={{ maxWidth: 1100 }}>
            {recommended && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
                style={{
                  background: PALETTE.gold,
                  color: PALETTE.cream,
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  boxShadow: "0 6px 16px rgba(196, 162, 101, 0.32)",
                }}
              >
                ✦ Your pick — refined draft
              </div>
            )}
            {/* Header */}
            <div className="flex items-baseline gap-4 mb-2">
              <span
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 36,
                  fontWeight: 800,
                  color: PALETTE.gold,
                  opacity: recommended ? 0.85 : 0.7,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1,
                }}
              >
                {String(n).padStart(2, "0")}
              </span>
              <div>
                <h2
                  style={{
                    fontFamily: "Asap, system-ui, sans-serif",
                    fontSize: "clamp(22px, 2.6vw, 30px)",
                    fontWeight: 700,
                    color: PALETTE.ink,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.15,
                  }}
                >
                  {title}
                </h2>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: "Assistant, system-ui, sans-serif",
                    fontSize: 14,
                    color: PALETTE.earth,
                    lineHeight: 1.45,
                  }}
                >
                  {sub}
                </p>
              </div>
            </div>

            {/* Demo */}
            <div className="mt-7">
              <Component />
            </div>

            {/* Pros / Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-7">
              <div
                className="rounded-md p-4"
                style={{
                  background: "rgba(34, 99, 70, 0.05)",
                  border: "1px solid rgba(34, 99, 70, 0.15)",
                }}
              >
                <p
                  style={{
                    fontFamily: "Asap, system-ui, sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#226346",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Pros
                </p>
                <p
                  className="mt-1.5"
                  style={{
                    fontFamily: "Assistant, system-ui, sans-serif",
                    fontSize: 13.5,
                    color: PALETTE.earth,
                    lineHeight: 1.55,
                  }}
                >
                  {pros}
                </p>
              </div>
              <div
                className="rounded-md p-4"
                style={{
                  background: "rgba(191, 82, 74, 0.05)",
                  border: "1px solid rgba(191, 82, 74, 0.18)",
                }}
              >
                <p
                  style={{
                    fontFamily: "Asap, system-ui, sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: PALETTE.roseDeep,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Tradeoffs
                </p>
                <p
                  className="mt-1.5"
                  style={{
                    fontFamily: "Assistant, system-ui, sans-serif",
                    fontSize: 13.5,
                    color: PALETTE.earth,
                    lineHeight: 1.55,
                  }}
                >
                  {cons}
                </p>
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="px-5 md:px-10 py-16 text-center">
        <p
          style={{
            ...cormorantItalic("18px"),
            color: PALETTE.earthMuted,
            maxWidth: 540,
            margin: "0 auto",
          }}
        >
          Tell me which number to ship — I'll wire it into FrameSizes and remove this preview page.
        </p>
      </section>
    </main>
  );
}
