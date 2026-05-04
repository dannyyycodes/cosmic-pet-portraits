/**
 * MasterPortraitPlaceholder — designed-on-purpose stand-in for the real
 * generated character master portraits.
 *
 * Reads as intentional concept art: dark cosmic backdrop in the pack's tonal
 * palette, layered cosmic dust, a stylised silhouette emblem unique to each
 * archetype, gold hairline frame, Cormorant italic caption.
 *
 * Swap with real fal.ai-generated master imagery as it lands per pack —
 * just point `imageUrl` at a CDN URL and the placeholder layers fade out.
 */
import { PALETTE, cormorantItalic } from "./tokens";

interface MasterPortraitPlaceholderProps {
  packId: string;
  /** Once a real master portrait exists, pass its URL — replaces the silhouette. */
  imageUrl?: string | null;
  className?: string;
  /** Hide the "coming soon" caption (e.g. inside the hero rotator). */
  hideCaption?: boolean;
}

/** Pack-specific painterly palettes — each gets its own atmosphere. */
const PALETTES: Record<string, { from: string; to: string; accent: string; emblem: string }> = {
  "1920s-boss":      { from: "#2a221d", to: "#4a3528", accent: "#c4a265", emblem: "tophat" },
  "wizard-school":   { from: "#1a1f2e", to: "#2c2f1f", accent: "#d4b67a", emblem: "moon" },
  "gothic-academy":  { from: "#14141c", to: "#2c1f2c", accent: "#bf524a", emblem: "raven" },
  "galaxy-smuggler": { from: "#1a1620", to: "#3a2418", accent: "#d4b67a", emblem: "star" },
  "regency-court":   { from: "#2a1f24", to: "#4a3a32", accent: "#c4a265", emblem: "rose" },
  "cosmic-chart":    { from: "#0d0a14", to: "#2a1f3a", accent: "#d4b67a", emblem: "chart" },
};

const Emblem = ({ kind, color }: { kind: string; color: string }) => {
  const stroke = { stroke: color, strokeWidth: 1.5, fill: "none", opacity: 0.85 };
  switch (kind) {
    case "tophat":
      return (
        <svg viewBox="0 0 80 80" className="w-20 h-20" aria-hidden>
          <ellipse cx="40" cy="58" rx="28" ry="3" {...stroke} />
          <rect x="22" y="20" width="36" height="36" rx="1" {...stroke} />
          <line x1="22" y1="32" x2="58" y2="32" {...stroke} />
        </svg>
      );
    case "moon":
      return (
        <svg viewBox="0 0 80 80" className="w-20 h-20" aria-hidden>
          <path d="M52 40 a18 18 0 1 1 -18 -18 a14 14 0 0 0 18 18 z" {...stroke} />
          <circle cx="58" cy="22" r="1.4" fill={color} opacity="0.9" />
          <circle cx="22" cy="58" r="1" fill={color} opacity="0.7" />
        </svg>
      );
    case "raven":
      return (
        <svg viewBox="0 0 80 80" className="w-20 h-20" aria-hidden>
          <path d="M16 50 Q40 18 64 50 Q40 38 16 50 z" {...stroke} />
          <line x1="40" y1="50" x2="40" y2="64" {...stroke} />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 80 80" className="w-20 h-20" aria-hidden>
          <path d="M40 14 L46 34 L66 34 L50 46 L56 66 L40 54 L24 66 L30 46 L14 34 L34 34 z" {...stroke} />
        </svg>
      );
    case "rose":
      return (
        <svg viewBox="0 0 80 80" className="w-20 h-20" aria-hidden>
          <circle cx="40" cy="36" r="14" {...stroke} />
          <circle cx="40" cy="36" r="8"  {...stroke} />
          <circle cx="40" cy="36" r="3"  {...stroke} />
          <path d="M40 50 Q44 60 50 64" {...stroke} />
          <path d="M40 50 Q36 60 30 64" {...stroke} />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 80 80" className="w-20 h-20" aria-hidden>
          <circle cx="40" cy="40" r="22" {...stroke} />
          <circle cx="40" cy="40" r="14" {...stroke} />
          <line x1="18" y1="40" x2="62" y2="40" {...stroke} />
          <line x1="40" y1="18" x2="40" y2="62" {...stroke} />
          <line x1="24" y1="24" x2="56" y2="56" {...stroke} />
          <line x1="56" y1="24" x2="24" y2="56" {...stroke} />
        </svg>
      );
    default:
      return null;
  }
};

export function MasterPortraitPlaceholder({
  packId,
  imageUrl,
  className,
  hideCaption,
}: MasterPortraitPlaceholderProps) {
  const palette = PALETTES[packId] ?? PALETTES["1920s-boss"];

  if (imageUrl) {
    return (
      <div className={`relative overflow-hidden ${className ?? ""}`}>
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ls-grain ${className ?? ""}`}
      style={{
        background: `linear-gradient(155deg, ${palette.from} 0%, ${palette.to} 100%)`,
        boxShadow: "inset 0 0 60px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(196, 162, 101, 0.18)",
      }}
      role="img"
      aria-label="Master portrait — concept placeholder"
    >
      {/* Cosmic dust */}
      <div className="ls-dust ls-twinkle" aria-hidden />

      {/* Soft halo behind emblem */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        <div
          className="ls-breathe"
          style={{
            width: "62%",
            height: "62%",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${palette.accent}22 0%, transparent 65%)`,
            filter: "blur(8px)",
          }}
        />
      </div>

      {/* Emblem */}
      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <Emblem kind={palette.emblem} color={palette.accent} />
      </div>

      {/* Bottom hairline + caption */}
      {!hideCaption && (
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
          <span style={{ ...cormorantItalic("13px"), color: PALETTE.cream, opacity: 0.72 }}>
            Master portrait · arriving this week
          </span>
          <span
            style={{
              width: "32px",
              height: "1px",
              background: `linear-gradient(90deg, transparent 0%, ${palette.accent} 100%)`,
              opacity: 0.6,
            }}
          />
        </div>
      )}
    </div>
  );
}
