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
}

export function VariantGallery({ variants, selectedUrl, onSelect }: VariantGalleryProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
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
              border: selected ? `3px solid ${PALETTE.rose}` : `1px solid ${PALETTE.sand}`,
              boxShadow: selected
                ? "0 8px 28px rgba(191, 82, 74, 0.3)"
                : "0 4px 14px rgba(60, 36, 18, 0.08)",
              aspectRatio: "4/5",
            }}
          >
            <img
              src={v.url}
              alt={`Variant ${COMPOSITION_LABELS[v.composition] ?? v.composition}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div
              className="absolute bottom-0 left-0 right-0 px-3 py-1.5 text-[11px] uppercase"
              style={{
                background: "linear-gradient(180deg, transparent, rgba(20,18,16,0.7))",
                color: "#FFFDF5",
                letterSpacing: "0.12em",
                textAlign: "left",
              }}
            >
              {COMPOSITION_LABELS[v.composition] ?? v.composition}
            </div>
            {selected && (
              <div
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: PALETTE.rose, color: "#fff", fontSize: 14, fontWeight: 700 }}
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
