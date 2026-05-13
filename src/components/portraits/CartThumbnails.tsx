/**
 * Inline thumbnails for cart upsell rows.
 *
 * - SoulReadingThumb: 3D shooting-star (Microsoft Fluent Emoji, MIT). Used
 *   for the Soul Reading line under the canvas.
 * - GiftCardThumb: 3D heart-with-ribbon (Microsoft Fluent Emoji, MIT). Used
 *   inside the expanded "Send a portrait to a friend" upsell.
 *
 * Assets live in /public/portraits/cart/ — self-hosted, no CDN dependency.
 * Wrapped in a cream-tinted panel so they sit cleanly next to real
 * portrait thumbnails in the cart drawer.
 */
import { PALETTE } from "./tokens";

interface ThumbProps {
  width?: number;
  height?: number;
  ariaLabel?: string;
}

export function SoulReadingThumb({
  width = 72,
  height = 90,
  ariaLabel = "Soul Reading",
}: ThumbProps) {
  return (
    <div
      style={{
        width,
        height,
        background: "#FFFDF5",
        border: `1px solid ${PALETTE.sandDeep}`,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <img
        src="/portraits/cart/shooting-star-3d.png"
        alt={ariaLabel}
        width={Math.round(width * 0.78)}
        height={Math.round(width * 0.78)}
        style={{
          width: `${Math.round(width * 0.78)}px`,
          height: `${Math.round(width * 0.78)}px`,
          objectFit: "contain",
          display: "block",
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export function GiftCardThumb({
  width = 72,
  height = 90,
  ariaLabel = "Gift card",
}: ThumbProps) {
  return (
    <div
      style={{
        width,
        height,
        background: "#FFFDF5",
        border: `1px solid ${PALETTE.sandDeep}`,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <img
        src="/portraits/cart/heart-with-ribbon-3d.png"
        alt={ariaLabel}
        width={Math.round(width * 0.78)}
        height={Math.round(width * 0.78)}
        style={{
          width: `${Math.round(width * 0.78)}px`,
          height: `${Math.round(width * 0.78)}px`,
          objectFit: "contain",
          display: "block",
        }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

/* ─── Backwards-compatible aliases (old SVG component names) ──────────── */
export const NatalChartThumb = SoulReadingThumb;
export const WrappedGiftThumb = GiftCardThumb;
