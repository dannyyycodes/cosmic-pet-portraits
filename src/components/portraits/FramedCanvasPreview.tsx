/**
 * FramedCanvasPreview — shows the customer's portrait as a real framed canvas
 * on a wall, live-reflecting the selected size (aspect ratio) and frame tone.
 *
 * This is the "canvas image in the flow" — it makes the product tangible while
 * the customer configures it, instead of a bare cropped thumbnail. Pure CSS
 * (no per-size mockup images): a wood-tone frame border + thin mat + soft wall
 * backdrop + drop shadow, sized to the true print aspect ratio.
 *
 * Rebuilt 2026-06-01 (ground-up configurator pass).
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

// Wood-tone gradients approximating each frame stain (no texture assets needed).
const FRAME_FACE: Record<FrameColor, string> = {
  black: "linear-gradient(135deg, #2a2724 0%, #14110f 55%, #2a2724 100%)",
  "natural-wood": "linear-gradient(135deg, #d8b486 0%, #b98c5a 50%, #cfa878 100%)",
  "dark-wood": "linear-gradient(135deg, #6b4226 0%, #4a2c18 55%, #6b4226 100%)",
};
const FRAME_EDGE: Record<FrameColor, string> = {
  black: "#0c0a09",
  "natural-wood": "#8a6437",
  "dark-wood": "#321d10",
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
  const frameW = frameColor === null ? 0 : Math.round(10 + (longEdge / 36) * 14); // 10–24px
  const matW = frameColor === null ? 0 : 6;

  return (
    <div
      className="relative mx-auto w-full"
      style={{
        maxWidth,
        // Warm wall backdrop with a hint of window light from the left.
        background: `radial-gradient(120% 90% at 20% 10%, #fffaf2 0%, ${PALETTE.cream2} 55%, ${PALETTE.paper} 100%)`,
        borderRadius: 14,
        padding: "clamp(20px, 6vw, 36px)",
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.6)",
      }}
    >
      {/* soft cast shadow under the canvas */}
      <div
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "10%",
          width: "62%",
          height: 18,
          background: "rgba(20,18,16,0.18)",
          filter: "blur(16px)",
          borderRadius: "50%",
        }}
      />
      <div
        className="relative mx-auto"
        style={{
          width: "100%",
          maxWidth: maxWidth - 56,
          aspectRatio: aspect,
          // The frame itself.
          background: frameColor === null ? "transparent" : FRAME_FACE[frameColor],
          border:
            frameColor === null
              ? `1px solid ${PALETTE.sandDeep}`
              : `1px solid ${FRAME_EDGE[frameColor]}`,
          padding: frameW,
          borderRadius: 2,
          boxShadow:
            frameColor === null
              ? "0 14px 34px -12px rgba(20,18,16,0.34), 0 2px 6px rgba(20,18,16,0.14)"
              : "0 22px 48px -14px rgba(20,18,16,0.45), 0 3px 10px rgba(20,18,16,0.22)",
          transition: "padding 220ms ease, background 220ms ease, aspect-ratio 260ms ease",
        }}
      >
        {/* mat + image */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#fff",
            padding: matW,
            boxShadow: frameColor === null ? "none" : "inset 0 0 0 1px rgba(20,18,16,0.08)",
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
