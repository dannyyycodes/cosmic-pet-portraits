/**
 * Inline-SVG thumbnails for cart upsell rows.
 *
 * - NatalChartThumb: bold-and-simple painted chart wheel for Soul Reading lines.
 * - WrappedGiftThumb: canvas-on-stand mock with a thick rose ribbon + gold tag
 *   for the "Send a portrait to a friend" upsell.
 *
 * Designed for legibility at 72×90 — bold strokes, generous cream space,
 * minimal element overlap. Earlier versions used thin 0.6–1.2px strokes that
 * anti-aliased into a solid gold blob on non-retina displays.
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
      {/* Cream/white panel */}
      <rect
        x="0.5"
        y="0.5"
        width="71"
        height="89"
        rx="3"
        fill="#FFFDF5"
        stroke={PALETTE.sandDeep}
        strokeWidth="1"
      />

      {/* Soft rose halo behind the wheel — gives warmth without dominating */}
      <circle cx="36" cy="44" r="24" fill={PALETTE.roseSoft} />

      {/* Outer gold ring — single, bold */}
      <circle
        cx="36"
        cy="44"
        r="22"
        fill="none"
        stroke={PALETTE.gold}
        strokeWidth="2.2"
      />

      {/* Inner gold ring */}
      <circle
        cx="36"
        cy="44"
        r="10"
        fill="none"
        stroke={PALETTE.goldDeep}
        strokeWidth="1.4"
      />

      {/* Centre rose star — the visual hero */}
      <BoldSparkle cx={36} cy={44} size={6.5} fill={PALETTE.rose} />

      {/* 4 cardinal accent dots inside the outer ring */}
      <circle cx="36" cy="22" r="1.8" fill={PALETTE.rose} />
      <circle cx="58" cy="44" r="1.8" fill={PALETTE.rose} />
      <circle cx="36" cy="66" r="1.8" fill={PALETTE.rose} />
      <circle cx="14" cy="44" r="1.8" fill={PALETTE.rose} />

      {/* Small gold sparkles in the corners — magical accents */}
      <BoldSparkle cx={10} cy={12} size={2.8} fill={PALETTE.gold} />
      <BoldSparkle cx={62} cy={78} size={2.8} fill={PALETTE.gold} />

      {/* Thin gold rule across the bottom */}
      <line
        x1="14"
        y1="82"
        x2="58"
        y2="82"
        stroke={PALETTE.gold}
        strokeWidth="1"
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
      {/* Cream/white panel */}
      <rect
        x="0.5"
        y="0.5"
        width="71"
        height="89"
        rx="3"
        fill="#FFFDF5"
        stroke={PALETTE.sandDeep}
        strokeWidth="1"
      />

      {/* Drop shadow under canvas */}
      <rect x="16" y="20" width="40" height="50" rx="2" fill="#000" opacity="0.06" />

      {/* Canvas board — warm parchment with bold gold frame */}
      <rect
        x="14"
        y="18"
        width="40"
        height="50"
        rx="2"
        fill="#f5e9d6"
        stroke={PALETTE.goldDeep}
        strokeWidth="1.4"
      />

      {/* Stylised pet inside the canvas — single bold silhouette */}
      <g>
        {/* Head circle */}
        <circle cx="34" cy="38" r="9" fill={PALETTE.goldSoft} />
        {/* Ears */}
        <path
          d="M 27 32 L 25 26 L 30 29 Z"
          fill={PALETTE.goldDeep}
        />
        <path
          d="M 41 32 L 43 26 L 38 29 Z"
          fill={PALETTE.goldDeep}
        />
        {/* Eyes */}
        <circle cx="31" cy="37" r="1.2" fill={PALETTE.ink} />
        <circle cx="37" cy="37" r="1.2" fill={PALETTE.ink} />
        {/* Nose */}
        <ellipse cx="34" cy="41" rx="1.4" ry="1" fill={PALETTE.ink} />
      </g>

      {/* Rose ribbon — thick, bold horizontal band */}
      <rect x="10" y="44" width="48" height="8" fill={PALETTE.rose} />
      {/* Ribbon highlight stripe */}
      <rect x="10" y="44.5" width="48" height="1.2" fill="#fff" opacity="0.35" />
      {/* Ribbon shadow stripe */}
      <rect x="10" y="50" width="48" height="1.5" fill={PALETTE.roseDeep} opacity="0.5" />

      {/* Bow knot at top centre of ribbon */}
      <g transform="translate(34, 44)">
        {/* Left bow loop */}
        <ellipse cx="-5" cy="0" rx="4" ry="3" fill={PALETTE.rose} />
        {/* Right bow loop */}
        <ellipse cx="5" cy="0" rx="4" ry="3" fill={PALETTE.rose} />
        {/* Centre knot */}
        <rect x="-2" y="-2.5" width="4" height="5" rx="0.5" fill={PALETTE.roseDeep} />
      </g>

      {/* Gold gift tag dangling from top-right corner of canvas */}
      <g transform="translate(50, 14) rotate(20)">
        {/* String */}
        <line x1="0" y1="0" x2="0" y2="5" stroke={PALETTE.goldDeep} strokeWidth="0.8" />
        {/* Tag body */}
        <path
          d="M -6 5 L 6 5 L 9 11 L 6 17 L -6 17 L -9 11 Z"
          fill={PALETTE.gold}
          stroke={PALETTE.goldDeep}
          strokeWidth="0.8"
        />
        {/* String hole */}
        <circle cx="0" cy="6" r="1" fill="#FFFDF5" stroke={PALETTE.goldDeep} strokeWidth="0.6" />
        {/* Tag lines */}
        <line x1="-4" y1="11" x2="4" y2="11" stroke={PALETTE.goldDeep} strokeWidth="0.7" />
        <line x1="-4" y1="13.5" x2="3" y2="13.5" stroke={PALETTE.goldDeep} strokeWidth="0.7" />
      </g>

      {/* Subtle "easel base" — small horizontal line below canvas */}
      <line
        x1="18"
        y1="71"
        x2="50"
        y2="71"
        stroke={PALETTE.sandDeep}
        strokeWidth="1"
      />
    </svg>
  );
}

/**
 * Bold 4-pointed sparkle — chunkier than the previous version so it stays
 * legible at small render sizes.
 */
function BoldSparkle({
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
  // Concave 4-point star — tips at top/bottom/left/right, narrower waist.
  const waist = size * 0.28;
  const path = [
    `M ${cx} ${cy - size}`,
    `L ${cx + waist} ${cy - waist}`,
    `L ${cx + size} ${cy}`,
    `L ${cx + waist} ${cy + waist}`,
    `L ${cx} ${cy + size}`,
    `L ${cx - waist} ${cy + waist}`,
    `L ${cx - size} ${cy}`,
    `L ${cx - waist} ${cy - waist}`,
    "Z",
  ].join(" ");
  return <path d={path} fill={fill} />;
}
