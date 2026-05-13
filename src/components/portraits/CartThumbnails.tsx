/**
 * Inline-SVG thumbnails for cart upsell rows.
 *
 * - NatalChartThumb: small painted-style chart wheel for Soul Reading lines /
 *   upsell card. Replaces the previous dark-cosmos-with-tiny-Sparkles box.
 * - WrappedGiftThumb: small canvas-on-easel mock with rose ribbon + gold tag
 *   for the "Send a portrait to a friend" upsell.
 *
 * Both render at the supplied width/height with the cream brand background
 * so they sit neatly next to real portrait thumbnails in the cart drawer.
 */
import { PALETTE } from "./tokens";

interface ThumbProps {
  width?: number;
  height?: number;
  ariaLabel?: string;
}

export function NatalChartThumb({
  width = 72,
  height = 90,
  ariaLabel = "Soul Reading natal chart wheel",
}: ThumbProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 72 90"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      style={{ display: "block" }}
    >
      {/* Cream background panel with soft sand border */}
      <rect
        x="0.5"
        y="0.5"
        width="71"
        height="89"
        rx="3"
        fill={PALETTE.cream}
        stroke={PALETTE.sand}
        strokeWidth="1"
      />

      {/* Soft warm halo behind the wheel */}
      <circle cx="36" cy="42" r="28" fill={PALETTE.roseSoft} opacity="0.55" />

      {/* Outer ring */}
      <circle
        cx="36"
        cy="42"
        r="22"
        fill="none"
        stroke={PALETTE.gold}
        strokeWidth="1.2"
      />
      {/* Middle ring */}
      <circle
        cx="36"
        cy="42"
        r="16"
        fill="none"
        stroke={PALETTE.gold}
        strokeWidth="0.8"
        opacity="0.85"
      />
      {/* Inner ring */}
      <circle
        cx="36"
        cy="42"
        r="8"
        fill="none"
        stroke={PALETTE.goldDeep}
        strokeWidth="0.8"
      />

      {/* Cross spokes — the 4 angles (ASC / DSC / MC / IC) */}
      <line
        x1="36"
        y1="20"
        x2="36"
        y2="64"
        stroke={PALETTE.gold}
        strokeWidth="0.8"
        opacity="0.7"
      />
      <line
        x1="14"
        y1="42"
        x2="58"
        y2="42"
        stroke={PALETTE.gold}
        strokeWidth="0.8"
        opacity="0.7"
      />
      {/* Diagonal house cusps */}
      <line
        x1="20.5"
        y1="26.5"
        x2="51.5"
        y2="57.5"
        stroke={PALETTE.gold}
        strokeWidth="0.5"
        opacity="0.4"
      />
      <line
        x1="51.5"
        y1="26.5"
        x2="20.5"
        y2="57.5"
        stroke={PALETTE.gold}
        strokeWidth="0.5"
        opacity="0.4"
      />

      {/* Centre rose dot */}
      <circle cx="36" cy="42" r="2" fill={PALETTE.rose} />

      {/* Rose sparkles at cardinal points (inside the rings) */}
      <Sparkle cx="36" cy="22.5" size={2.5} fill={PALETTE.rose} />
      <Sparkle cx="55" cy="42" size={2.2} fill={PALETTE.rose} />
      <Sparkle cx="36" cy="61.5" size={2.5} fill={PALETTE.rose} />
      <Sparkle cx="17" cy="42" size={2.2} fill={PALETTE.rose} />

      {/* Tiny gold sparkles scattered outside the wheel */}
      <Sparkle cx="10" cy="14" size={1.8} fill={PALETTE.gold} />
      <Sparkle cx="62" cy="16" size={1.6} fill={PALETTE.gold} />
      <Sparkle cx="62" cy="70" size={1.8} fill={PALETTE.gold} />
      <Sparkle cx="8" cy="72" size={1.6} fill={PALETTE.gold} />

      {/* Thin gold rule along the bottom */}
      <line
        x1="14"
        y1="80"
        x2="58"
        y2="80"
        stroke={PALETTE.gold}
        strokeWidth="0.6"
        opacity="0.55"
      />
    </svg>
  );
}

export function WrappedGiftThumb({
  width = 72,
  height = 90,
  ariaLabel = "Wrapped pet portrait with ribbon",
}: ThumbProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 72 90"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={ariaLabel}
      style={{ display: "block" }}
    >
      {/* Cream background panel */}
      <rect
        x="0.5"
        y="0.5"
        width="71"
        height="89"
        rx="3"
        fill={PALETTE.cream}
        stroke={PALETTE.sand}
        strokeWidth="1"
      />

      {/* Soft warm halo behind canvas */}
      <ellipse cx="36" cy="48" rx="28" ry="32" fill={PALETTE.roseSoft} opacity="0.35" />

      {/* Drop shadow */}
      <rect x="15.5" y="17.5" width="41" height="55" rx="1.5" fill="#000" opacity="0.08" />

      {/* Canvas — warm interior with soft pet-suggesting form */}
      <rect
        x="14"
        y="16"
        width="44"
        height="54"
        rx="1.5"
        fill="#f5e9d6"
        stroke={PALETTE.goldDeep}
        strokeWidth="0.6"
      />

      {/* Stylised painted pet inside the canvas — soft warm blob + ear hints */}
      <g opacity="0.78">
        {/* Head/body */}
        <ellipse cx="36" cy="48" rx="13" ry="14" fill={PALETTE.goldSoft} />
        {/* Ears */}
        <path
          d="M 25 36 Q 24 28 30 30 Q 30 36 28 40 Z"
          fill={PALETTE.goldDeep}
          opacity="0.7"
        />
        <path
          d="M 47 36 Q 48 28 42 30 Q 42 36 44 40 Z"
          fill={PALETTE.goldDeep}
          opacity="0.7"
        />
        {/* Snout shadow */}
        <ellipse cx="36" cy="54" rx="6" ry="4" fill={PALETTE.goldDeep} opacity="0.35" />
        {/* Eyes */}
        <circle cx="32" cy="46" r="1.3" fill={PALETTE.ink} />
        <circle cx="40" cy="46" r="1.3" fill={PALETTE.ink} />
        {/* Nose */}
        <ellipse cx="36" cy="51.5" rx="1.5" ry="1" fill={PALETTE.ink} />
      </g>

      {/* Rose ribbon — horizontal band across the canvas */}
      <rect x="11" y="40" width="50" height="6" fill={PALETTE.rose} />
      {/* Ribbon highlight stripe */}
      <rect x="11" y="40.5" width="50" height="1" fill="#fff" opacity="0.3" />
      {/* Ribbon shadow stripe */}
      <rect x="11" y="44.5" width="50" height="1" fill={PALETTE.roseDeep} opacity="0.45" />

      {/* Bow knot centre (top of canvas) */}
      <g transform="translate(36, 14)">
        <path
          d="M -6 0 Q -10 -4 -6 -7 Q -3 -5 0 0 Q 3 -5 6 -7 Q 10 -4 6 0 Z"
          fill={PALETTE.rose}
        />
        <rect x="-2" y="-2" width="4" height="4" rx="0.5" fill={PALETTE.roseDeep} />
        {/* Ribbon tails coming down to top of canvas */}
        <path
          d="M -1.5 1 L -3 5 L -1 5 Z"
          fill={PALETTE.roseDeep}
          opacity="0.85"
        />
        <path
          d="M 1.5 1 L 3 5 L 1 5 Z"
          fill={PALETTE.roseDeep}
          opacity="0.85"
        />
      </g>

      {/* Gold gift tag dangling from top-right corner */}
      <g transform="translate(53, 12) rotate(15)">
        <line x1="0" y1="0" x2="0" y2="6" stroke={PALETTE.goldDeep} strokeWidth="0.6" />
        <path
          d="M -5 6 L 5 6 L 7 10 L 5 14 L -5 14 L -7 10 Z"
          fill={PALETTE.gold}
          stroke={PALETTE.goldDeep}
          strokeWidth="0.5"
        />
        <circle cx="0" cy="6.5" r="0.8" fill={PALETTE.cream} stroke={PALETTE.goldDeep} strokeWidth="0.4" />
        {/* Tiny "for you" lines */}
        <line x1="-3" y1="9.5" x2="3" y2="9.5" stroke={PALETTE.goldDeep} strokeWidth="0.4" />
        <line x1="-3" y1="11" x2="2" y2="11" stroke={PALETTE.goldDeep} strokeWidth="0.4" />
      </g>

      {/* Tiny gold sparkles for magic */}
      <Sparkle cx="9" cy="22" size={1.6} fill={PALETTE.gold} />
      <Sparkle cx="64" cy="74" size={1.8} fill={PALETTE.gold} />
      <Sparkle cx="11" cy="80" size={1.4} fill={PALETTE.gold} />
    </svg>
  );
}

/** Small 4-point sparkle — used by both thumbnails. */
function Sparkle({
  cx,
  cy,
  size,
  fill,
}: {
  cx: number;
  cy: number;
  size: number;
  fill: string;
}) {
  // 4-pointed star shape — vertical + horizontal spikes meeting at a point.
  const path = `
    M ${cx} ${cy - size}
    L ${cx + size * 0.3} ${cy - size * 0.3}
    L ${cx + size} ${cy}
    L ${cx + size * 0.3} ${cy + size * 0.3}
    L ${cx} ${cy + size}
    L ${cx - size * 0.3} ${cy + size * 0.3}
    L ${cx - size} ${cy}
    L ${cx - size * 0.3} ${cy - size * 0.3}
    Z
  `.trim();
  return <path d={path} fill={fill} />;
}
