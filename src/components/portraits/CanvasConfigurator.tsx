/**
 * CanvasConfigurator — the post-approval configurator for /pawtraits.
 *
 * Rebuilt 2026-06-01 to Danny's spec, replacing the messy collapsed-picker:
 *   1. Show the portrait on a framed canvas (the tangible preview).
 *   2. STEP 1 — pick a SIZE (clear, big tap targets, selected obvious).
 *   3. STEP 2 — pick a CANVAS (frame), shown with real frame photos.
 *   4. Add to cart  ·  + Add another.  (Soul-Reading upsell lives in the cart.)
 *
 * All state lives in StudioFlow; this is a presentational step UI.
 */
import { Loader2, Check, Plus, ArrowLeft } from "lucide-react";
import { VariantGallery, type Variant } from "@/components/portraits/styles/VariantGallery";
import {
  FRAME_COLORS,
  FRAME_UPGRADE_GBP,
  DIGITAL_VARIANT,
  type FrameColor,
  type CanvasSizeMeta,
} from "@/components/portraits/gelatoFramedCanvas";
import { PALETTE, tabularPrice } from "@/components/portraits/tokens";
import frameUnframed from "@/assets/frames/frame-unframed.webp";
import frameBlack from "@/assets/frames/frame-black.webp";
import frameNatural from "@/assets/frames/frame-natural.webp";
import frameDark from "@/assets/frames/frame-dark.webp";

// Real frame corner-crop photos for the "choose your canvas" tiles.
const FRAME_IMG: Record<string, string> = {
  unframed: frameUnframed,
  black: frameBlack,
  "natural-wood": frameNatural,
  "dark-wood": frameDark,
};

interface CanvasConfiguratorProps {
  imageUrl: string | null;
  variants: Variant[];
  onSelectVariant: (url: string) => void;
  mode: "ai" | "asis";
  deliveryType: "physical" | "digital";
  onDeliveryChange: (d: "physical" | "digital") => void;
  sizes: CanvasSizeMeta[];
  sizeKey: string;
  onSizeChange: (uid: string) => void;
  frameColor: FrameColor | null;
  onFrameChange: (f: FrameColor | null) => void;
  asisSizePpi: (s: CanvasSizeMeta) => number | null;
  asisPpiClean: number;
  variant: { priceMajor: number } | null;
  canAdd: boolean;
  onAdd: () => void;
  preparing: boolean;
  preparingText: string;
  preparingElapsed: number;
  onCancelPreparing: () => void;
  cartAddCount: number;
  onAddAnother: () => void;
  /** Back to compose (change photo / switch to AI portraits). */
  onStartOver: () => void;
}

const STEP_LABEL: React.CSSProperties = {
  fontFamily: "Asap, system-ui, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  color: PALETTE.earthMuted,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  margin: "0 0 10px",
};

export function CanvasConfigurator({
  imageUrl,
  variants,
  onSelectVariant,
  mode,
  deliveryType,
  onDeliveryChange,
  sizes,
  sizeKey,
  onSizeChange,
  frameColor,
  onFrameChange,
  asisSizePpi,
  asisPpiClean,
  variant,
  canAdd,
  onAdd,
  preparing,
  preparingText,
  preparingElapsed,
  onCancelPreparing,
  cartAddCount,
  onAddAnother,
  onStartOver,
}: CanvasConfiguratorProps) {
  const physical = deliveryType === "physical";
  const frameUpgrade = FRAME_UPGRADE_GBP[sizeKey] ?? 0;
  const price = variant?.priceMajor ?? 0;

  return (
    <div
      className="rounded-2xl p-4 md:p-5"
      style={{
        background: PALETTE.cream,
        border: `1px solid ${PALETTE.sand}`,
        boxShadow: "0 24px 48px rgba(20, 18, 16, 0.06), 0 4px 12px rgba(20, 18, 16, 0.03)",
      }}
    >
      {/* Back to compose — change photo or switch to AI portraits. */}
      <button
        type="button"
        onClick={onStartOver}
        className="inline-flex items-center gap-1.5 mb-3 transition-colors hover:opacity-80"
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: "Asap, system-ui, sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: PALETTE.earthMuted,
        }}
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2.2} />
        Start over · change photo or style
      </button>

      {/* AI variants: pick which generated portrait (skip for single/as-is). */}
      {variants.length > 1 && (
        <div className="mb-4">
          <VariantGallery variants={variants} selectedUrl={imageUrl} onSelect={onSelectVariant} compact />
        </div>
      )}

      {/* Delivery toggle — AI only (as-is is always a physical canvas). */}
      {mode !== "asis" && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {([
            { uid: "physical" as const, label: "Canvas", sub: "Printed & framed" },
            { uid: "digital" as const, label: "Digital", sub: `£${DIGITAL_VARIANT.priceMajor} · download` },
          ]).map((d) => {
            const active = deliveryType === d.uid;
            return (
              <button
                key={d.uid}
                type="button"
                onClick={() => onDeliveryChange(d.uid)}
                aria-pressed={active}
                className="rounded-xl px-3 py-2.5 text-center transition-all"
                style={{
                  background: active ? PALETTE.roseSoft : PALETTE.cream,
                  border: active ? `2px solid ${PALETTE.rose}` : `1px solid ${PALETTE.sand}`,
                }}
              >
                <div style={{ fontFamily: "Asap, system-ui, sans-serif", fontSize: 14, fontWeight: active ? 700 : 600, color: active ? PALETTE.rose : PALETTE.ink }}>
                  {d.label}
                </div>
                <div style={{ fontFamily: "Assistant, system-ui, sans-serif", fontSize: 11, color: PALETTE.earthMuted, marginTop: 1 }}>
                  {d.sub}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {physical ? (
        <>
          {/* Your photo — plain (the framed mockup was removed per Danny 2026-06-01). */}
          {imageUrl && (
            <div className="mb-5 mx-auto" style={{ maxWidth: 280 }}>
              <img
                src={imageUrl}
                alt="Your pawtrait"
                className="block w-full rounded-xl"
                style={{ border: `1px solid ${PALETTE.sandDeep}`, boxShadow: "0 10px 28px -12px rgba(20,18,16,0.35)" }}
              />
            </div>
          )}

          {/* ── STEP 1 · SIZE ─────────────────────────────────────────── */}
          <p style={STEP_LABEL}>Step 1 · Choose your size</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
            {sizes.map((s) => {
              const active = sizeKey === s.uid;
              const ppi = mode === "asis" ? asisSizePpi(s) : null;
              const tier = ppi === null ? null : ppi >= asisPpiClean ? "Sharp" : ppi >= 100 ? "Good" : "Soft";
              return (
                <button
                  key={s.uid}
                  type="button"
                  onClick={() => onSizeChange(s.uid)}
                  aria-pressed={active}
                  className="relative rounded-xl px-3 py-3 text-left transition-all"
                  style={{
                    background: active ? PALETTE.rose : PALETTE.cream,
                    border: active ? `2px solid ${PALETTE.rose}` : `1px solid ${PALETTE.sandDeep}`,
                    boxShadow: active ? "0 10px 24px rgba(191,82,74,0.30)" : "0 1px 3px rgba(20,18,16,0.04)",
                    minHeight: 60,
                  }}
                >
                  {active && (
                    <span
                      className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full"
                      style={{ width: 20, height: 20, background: PALETTE.cream, boxShadow: "0 2px 6px rgba(20,18,16,0.18)" }}
                    >
                      <Check className="w-3 h-3" strokeWidth={3} style={{ color: PALETTE.rose }} />
                    </span>
                  )}
                  <div style={{ fontFamily: "Asap, system-ui, sans-serif", fontSize: 14, fontWeight: 700, color: active ? PALETTE.cream : PALETTE.ink }}>
                    {s.label}
                  </div>
                  <div className="tabular-nums" style={{ fontSize: 12.5, marginTop: 1, color: active ? "rgba(255,253,245,0.9)" : PALETTE.earthMuted }}>
                    £{s.priceGBP}
                    {tier && (
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: active ? "rgba(255,253,245,0.95)" : tier === "Sharp" ? "#1f7a3d" : tier === "Good" ? PALETTE.goldDeep : PALETTE.earthMuted }}>
                        {tier}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── STEP 2 · CANVAS (frame, with real frame photos) ───────── */}
          <p style={STEP_LABEL}>Step 2 · Choose your canvas</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {([{ uid: null as FrameColor | null, label: "Unframed", img: FRAME_IMG.unframed, delta: 0 },
              ...FRAME_COLORS.map((c) => ({ uid: c.uid as FrameColor | null, label: c.label, img: FRAME_IMG[c.uid], delta: frameUpgrade }))]
            ).map((f) => {
              const active = frameColor === f.uid;
              return (
                <button
                  key={f.uid ?? "unframed"}
                  type="button"
                  onClick={() => onFrameChange(f.uid)}
                  aria-pressed={active}
                  className="rounded-xl p-2 text-center transition-all"
                  style={{
                    background: active ? PALETTE.roseSoft : PALETTE.cream,
                    border: active ? `2px solid ${PALETTE.rose}` : `1px solid ${PALETTE.sand}`,
                  }}
                >
                  <span
                    className="block overflow-hidden mx-auto"
                    style={{ width: "100%", aspectRatio: "1 / 1", borderRadius: 8, marginBottom: 6, background: PALETTE.cream2 }}
                  >
                    <img src={f.img} alt={`${f.label} frame`} className="w-full h-full" style={{ objectFit: "cover", display: "block" }} loading="lazy" decoding="async" />
                  </span>
                  <div style={{ fontFamily: "Assistant, system-ui, sans-serif", fontSize: 12.5, fontWeight: active ? 700 : 600, color: active ? PALETTE.rose : PALETTE.earth, lineHeight: 1.2 }}>
                    {f.label}
                  </div>
                  <div className="tabular-nums" style={{ fontSize: 11, color: PALETTE.earthMuted, marginTop: 1 }}>
                    {f.delta > 0 ? `+£${f.delta}` : "Included"}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        // Digital-only summary (AI digital path).
        <div className="rounded-xl px-4 py-4 mb-5" style={{ background: PALETTE.cream2, border: `1px solid ${PALETTE.sand}` }}>
          {imageUrl && (
            <img src={imageUrl} alt="Your pawtrait" className="w-full rounded-lg mb-3" style={{ maxWidth: 240, margin: "0 auto 12px", display: "block" }} />
          )}
          <p style={{ fontFamily: "Asap, system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: PALETTE.ink, margin: "0 0 4px" }}>
            Digital download · £{DIGITAL_VARIANT.priceMajor}
          </p>
          <p style={{ fontFamily: "Assistant, system-ui, sans-serif", fontSize: 12.5, color: PALETTE.earthMuted, margin: 0, lineHeight: 1.5 }}>
            High-resolution 3000×3000 PNG, emailed within minutes of checkout. No shipping. Print at any size at home.
          </p>
        </div>
      )}

      {/* ── Add to cart ───────────────────────────────────────────────── */}
      <button
        onClick={onAdd}
        disabled={!canAdd}
        className="w-full rounded-xl py-4 transition-all disabled:opacity-40 inline-flex items-center justify-center gap-2"
        style={{
          background: PALETTE.ink,
          color: PALETTE.cream,
          fontFamily: "Asap, system-ui, sans-serif",
          fontSize: 15.5,
          fontWeight: 700,
          letterSpacing: "0.02em",
          boxShadow: canAdd ? "0 14px 32px rgba(20,18,16,0.18), 0 2px 6px rgba(20,18,16,0.08)" : "none",
        }}
      >
        {preparing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
            Preparing your canvas…
          </>
        ) : (
          <>
            Add to cart{variant ? ` · £${price}` : ""}
          </>
        )}
      </button>

      {/* Add another (only once something's in the cart). */}
      {cartAddCount > 0 && !preparing && (
        <button
          type="button"
          onClick={onAddAnother}
          className="w-full rounded-xl py-3 mt-2.5 transition-all inline-flex items-center justify-center gap-2"
          style={{
            background: "transparent",
            border: `1.5px solid ${PALETTE.sandDeep}`,
            color: PALETTE.ink,
            fontFamily: "Asap, system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Plus className="w-4 h-4" strokeWidth={2.4} />
          Add another pawtrait
        </button>
      )}

      {/* Preparing progress */}
      {preparing && (
        <div className="rounded-xl mt-3 px-4 py-4" aria-live="polite" style={{ background: PALETTE.cream2, border: `1px solid ${PALETTE.sand}` }}>
          <div className="flex items-center gap-3 mb-1.5">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" strokeWidth={2.4} style={{ color: PALETTE.rose }} />
            <p style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 16, fontStyle: "italic", color: PALETTE.ink, lineHeight: 1.3, margin: 0 }}>
              {preparingText}…
            </p>
          </div>
          <p className="tabular-nums" style={{ fontFamily: "Assistant, system-ui, sans-serif", fontSize: 12, color: PALETTE.earthMuted, margin: "0 0 0 28px" }}>
            {preparingElapsed < 60
              ? `${preparingElapsed}s elapsed · this usually takes 30–60s`
              : `${Math.floor(preparingElapsed / 60)}m ${preparingElapsed % 60}s · running long — hang tight`}
          </p>
          {preparingElapsed >= 90 && (
            <button
              type="button"
              onClick={onCancelPreparing}
              className="mt-2 ml-7"
              style={{ background: "transparent", border: "none", padding: "4px 0", fontFamily: "Assistant, system-ui, sans-serif", fontSize: 12, color: PALETTE.rose, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer" }}
            >
              Cancel and retry →
            </button>
          )}
        </div>
      )}

      {cartAddCount > 0 && !preparing && (
        <p className="text-center mt-3" style={{ fontFamily: "Assistant, system-ui, sans-serif", fontSize: 12.5, color: PALETTE.earthMuted, lineHeight: 1.5 }}>
          {cartAddCount} in your cart — open it to check out, or add another.
        </p>
      )}
    </div>
  );
}

export default CanvasConfigurator;
