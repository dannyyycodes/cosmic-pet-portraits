/**
 * FramedCanvasPreview — shows the customer's portrait as a real framed canvas
 * on a wall, live-reflecting the selected size (aspect ratio) and frame tone.
 *
 * This is the "canvas image in the flow" — it makes the product tangible while
 * the customer configures it, instead of a bare cropped thumbnail.
 *
 * Frame = real photoreal wood TEXTURE (public/portraits/frames/frame-tex-*.webp,
 * Codex gpt-image-1) applied via border-image so the corners + edges show actual
 * grain, plus an inner bevel lip + soft mat + wall backdrop + drop shadow. Falls
 * back to a solid stain colour if a texture asset fails to load.
 *
 * Rebuilt 2026-06-01 (configurator pass); textured 2026-06-04.
 */
import { CANVAS_SIZES, type FrameColor } from "./gelatoFramedCanvas";
import { PALETTE } from "./tokens";

interface FramedCanvasPreviewProps {
  imageUrl: string;
  sizeKey: string;
  /** null = unframed slim canvas. */
  frameColor: FrameColor | null;
  /** Max rendered width in px (keeps tall portraits in-frame on mobile). */
  maxWidth?: number;
}

// Real wood texture per stain (Codex gpt-image-1, seamless 1024² planks).
const FRAME_TEX: Record<FrameColor, string> = {
  black: "/portraits/frames/frame-tex-black.webp",
  "natural-wood": "/portraits/frames/frame-tex-natural.webp",
  "dark-wood": "/portraits/frames/frame-tex-dark.webp",
};
// Solid stain fallback (shown only if the texture asset 404s).
const FRAME_EDGE: Record<FrameColor, string> = {
  black: "#15110f",
  "natural-wood": "#b98c5a",
  "dark-wood": "#4a2c18",
};

export function FramedCanvasPreview({
  imageUrl,
  sizeKey,
  frameColor,
  maxWidth = 320,
}: FramedCanvasPreviewProps) {
  const size = CANVAS_SIZES.find((s) => s.uid === sizeKey) ?? CANVAS_SIZES[3];
  const aspect = `${size.inches.w} / ${size.inches.h}`;

  // Frame thickness scales a little with the print's long edge so a Statement
  // canvas reads heftier than a Small one.
  const longEdge = Math.max(size.inches.w, size.inches.h);
  const frameW = frameColor === null ? 0 : Math.round(13 + (longEdge / 36) * 15); // 13–28px
  const matW = frameColor === null ? 0 : 6;

  const framed = frameColor !== null;

  return (
    <div
      className="relative mx-auto w-full"
      style={{
        maxWidth,
        // Warm wall backdrop with a hint of window light from the left.
        background: `radial-gradient(120% 90% at 20% 10%, #fffaf2 0%, ${PALETTE.cream2} 55%, ${PALETTE.paper} 100%)`,
        borderRadius: 14,
        padding: "clamp(20px, 6vw, 40px)",
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.6)",
      }}
    >
      {/* soft cast shadow under the canvas */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "8%",
          width: "64%",
          height: 20,
          background: "rgba(20,18,16,0.20)",
          filter: "blur(17px)",
          borderRadius: "50%",
        }}
      />
      <div
        className="relative mx-auto"
        style={{
          width: "100%",
          maxWidth: maxWidth - 56,
          aspectRatio: aspect,
          boxSizing: "border-box",
          // The frame itself — real wood texture via border-image, solid-stain fallback.
          ...(framed
            ? {
                borderStyle: "solid",
                borderWidth: frameW,
                borderColor: FRAME_EDGE[frameColor],
                borderImage: `url("${FRAME_TEX[frameColor]}") 33% round`,
                // outer float + inner bevel lip (light top-left, dark bottom-right)
                boxShadow:
                  "0 24px 52px -14px rgba(20,18,16,0.5), 0 4px 12px rgba(20,18,16,0.24)," +
                  "inset 2px 2px 1px rgba(255,255,255,0.18), inset -3px -3px 5px rgba(0,0,0,0.42)",
              }
            : {
                border: `1px solid ${PALETTE.sandDeep}`,
                boxShadow:
                  "0 14px 34px -12px rgba(20,18,16,0.34), 0 2px 6px rgba(20,18,16,0.14)",
              }),
          borderRadius: 2,
          background: "#fff",
          transition: "border-width 220ms ease, aspect-ratio 260ms ease",
        }}
      >
        {/* mat + image */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#fff",
            padding: matW,
            boxShadow: framed
              ? "inset 0 0 0 1px rgba(20,18,16,0.10), inset 0 1px 3px rgba(20,18,16,0.12)"
              : "none",
          }}
        >
          <img
            src={imageUrl}
            alt="Your pawtrait shown on a framed canvas"
            className="block w-full h-full"
            style={{ objectFit: "cover", display: "block" }}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}

export default FramedCanvasPreview;
