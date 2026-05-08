/**
 * VariantGallery — 2×2 grid of 4 generated variants. Customer clicks one to
 * pick their favourite for the print order.
 */
import { motion } from "framer-motion";
import { PALETTE } from "../tokens";

export interface Variant {
  url: string;
  composition: string; // "close-up" | "medium" | "full-body" | "three-quarter"
}

const COMPOSITION_LABELS: Record<string, string> = {
  "close-up": "Close-up",
  "medium": "Medium shot",
  "full-body": "Full body",
  "three-quarter": "Hero shot",
};

interface VariantGalleryProps {
  variants: Variant[];
  selectedUrl: string | null;
  onSelect: (url: string) => void;
  compact?: boolean;
}

export function VariantGallery({ variants, selectedUrl, onSelect, compact = false }: VariantGalleryProps) {
  return (
    <div className={`grid ${compact ? "grid-cols-2 sm:grid-cols-4 gap-2" : "grid-cols-2 gap-3"}`}>
      {variants.map((v, i) => {
        const selected = v.url === selectedUrl;
        return (
          <motion.button
            key={v.url}
            onClick={() => onSelect(v.url)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-lg overflow-hidden relative"
            style={{
              border: selected ? `${compact ? 2 : 3}px solid ${PALETTE.rose}` : `1px solid ${PALETTE.sand}`,
              boxShadow: selected
                ? compact
                  ? "0 6px 18px rgba(191, 82, 74, 0.22)"
                  : "0 8px 28px rgba(191, 82, 74, 0.3)"
                : "0 4px 14px rgba(60, 36, 18, 0.08)",
              aspectRatio: compact ? "1 / 1" : "2/3",
            }}
          >
            <img
              src={v.url}
              alt={`Variant ${COMPOSITION_LABELS[v.composition] ?? v.composition}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div
              className={`absolute bottom-0 left-0 right-0 uppercase ${compact ? "px-2 py-1 text-[9px]" : "px-3 py-1.5 text-[11px]"}`}
              style={{
                background: "linear-gradient(180deg, transparent, rgba(20,18,16,0.7))",
                color: "#FFFDF5",
                letterSpacing: compact ? "0.08em" : "0.12em",
                textAlign: "left",
              }}
            >
              {COMPOSITION_LABELS[v.composition] ?? v.composition}
            </div>
            {selected && (
              <div
                className={`absolute rounded-full flex items-center justify-center ${compact ? "top-1.5 right-1.5 w-5 h-5" : "top-2 right-2 w-7 h-7"}`}
                style={{ background: PALETTE.rose, color: "#fff", fontSize: compact ? 11 : 14, fontWeight: 700 }}
              >
                ✓
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
