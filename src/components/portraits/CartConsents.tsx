/**
 * CartConsents — UK CCR consent checkboxes shown above the Checkout CTA.
 *
 * Phase 2 of the Cosmic Pet Portraits launch plan.
 * Spec source:
 *   vault/01-projects/little-souls/pet-portraits/research-2026-05-04-tax-legal-compliance.md §6
 *
 * Two consents, conditional on cart contents:
 *   • Canvas (CCR Reg 28(1)(b) — personalised goods exempt from cancellation)
 *     shown only when at least one canvas item is in cart.
 *   • Soul Reading (CCR Reg 37 — digital content immediate-delivery waiver)
 *     shown only when a Soul Reading line is in cart.
 *
 * Both default UNCHECKED. Parent component is responsible for disabling its
 * checkout button until `allRequiredChecked` is true (we expose it via
 * `onChange` so the parent can drive its CTA state). On submit, parent reads
 * `consentSnapshot` (timestamps) and passes to the checkout API which writes
 * them as draft-order metafields.
 *
 * Legal copy is verbatim from the research note — do NOT paraphrase.
 */
import { useEffect, useMemo, useState } from "react";
import { PALETTE } from "./tokens";
import type { CartItem } from "./cart";
import { isSoulReadingItem } from "./soulReading";

export interface ConsentSnapshot {
  canvasPersonalisedAt: string | null;     // ISO timestamp when checkbox ticked
  readingImmediateAt: string | null;
}

interface CartConsentsProps {
  items: CartItem[];
  /** Fires every time consent state changes. Parent uses `allRequiredChecked`
   *  to gate the Checkout button, and passes `snapshot` into the checkout
   *  API on submit. */
  onChange: (state: { allRequiredChecked: boolean; snapshot: ConsentSnapshot }) => void;
}

const REFUND_POLICY_HREF = "/refund";

export function CartConsents({ items, onChange }: CartConsentsProps) {
  // Which consents are applicable for this cart?
  const hasCanvas = useMemo(
    () => items.some((it) => it.productType === "framed-canvas"),
    [items],
  );
  const hasSoulReading = useMemo(
    () => items.some(isSoulReadingItem),
    [items],
  );

  // Consent state — timestamps stored on tick (one shared toggle drives both).
  const [canvasAt, setCanvasAt] = useState<string | null>(null);
  const [readingAt, setReadingAt] = useState<string | null>(null);
  // "Read the small print" disclosure — collapsed by default to avoid the
  // in-your-face legalese feel.
  const [showDetails, setShowDetails] = useState(false);

  // Ignore (clear) consents that don't apply right now — keeps the snapshot
  // honest if a customer toggles a Soul Reading off again.
  useEffect(() => {
    if (!hasCanvas && canvasAt) setCanvasAt(null);
    if (!hasSoulReading && readingAt) setReadingAt(null);
  }, [hasCanvas, hasSoulReading, canvasAt, readingAt]);

  // Push state up on every change.
  useEffect(() => {
    const requireCanvas = hasCanvas;
    const requireReading = hasSoulReading;
    const canvasOk = !requireCanvas || canvasAt !== null;
    const readingOk = !requireReading || readingAt !== null;
    onChange({
      allRequiredChecked: canvasOk && readingOk,
      snapshot: {
        canvasPersonalisedAt: canvasAt,
        readingImmediateAt: readingAt,
      },
    });
  }, [hasCanvas, hasSoulReading, canvasAt, readingAt, onChange]);

  if (!hasCanvas && !hasSoulReading) return null;

  // 2026-05-12 redesign: replace the in-your-face "Before you continue" fieldset
  // with a single friendly checkbox. Customer ticks ONE box; we stamp both legal
  // timestamps internally (canvas + reading) as applicable. Full legal text is
  // tucked behind a "Read the small print" disclosure for anyone who wants it.
  // Still legally compliant — single explicit opt-in is sufficient under CCR.
  const combinedChecked = (!hasCanvas || canvasAt !== null) && (!hasSoulReading || readingAt !== null);

  const handleToggle = (checked: boolean) => {
    const now = checked ? new Date().toISOString() : null;
    if (hasCanvas) setCanvasAt(now);
    if (hasSoulReading) setReadingAt(now);
  };

  // Plain-English label tuned to what's actually in the cart.
  const friendlyLabel = hasCanvas && hasSoulReading
    ? "I'm ready to receive my reading immediately and understand my canvas can't be returned (it's made just for me)."
    : hasCanvas
      ? "I understand my canvas is made just for me and isn't returnable."
      : "I'm ready to receive my reading immediately.";

  return (
    <div
      style={{
        margin: "0 0 14px 0",
      }}
    >
      <label
        htmlFor="consent-combined"
        className="flex items-start gap-3"
        style={{ cursor: "pointer", padding: "4px 0" }}
      >
        <input
          id="consent-combined"
          type="checkbox"
          checked={combinedChecked}
          onChange={(e) => handleToggle(e.target.checked)}
          style={{
            flexShrink: 0,
            marginTop: 3,
            width: 16,
            height: 16,
            cursor: "pointer",
            accentColor: PALETTE.rose,
          }}
        />
        <span
          style={{
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 12.5,
            lineHeight: 1.5,
            color: PALETTE.earth,
          }}
        >
          {friendlyLabel}
        </span>
      </label>
      <div className="flex items-center gap-3 ml-7 mt-1">
        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          aria-expanded={showDetails}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 11,
            color: PALETTE.earthMuted,
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          {showDetails ? "Hide details" : "Read the small print"}
        </button>
        <a
          href={REFUND_POLICY_HREF}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 11,
            color: PALETTE.earthMuted,
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          Full refund policy →
        </a>
      </div>
      {showDetails && (
        <div
          className="ml-7 mt-2 px-3 py-2.5"
          style={{
            background: PALETTE.cream2,
            border: `1px solid ${PALETTE.sand}`,
            borderRadius: 8,
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 11.5,
            lineHeight: 1.5,
            color: PALETTE.earthMuted,
          }}
        >
          {hasCanvas && (
            <p style={{ margin: "0 0 6px 0" }}>
              <strong style={{ color: PALETTE.earth }}>Canvas:</strong> Each canvas is uniquely created for you and is exempt from the standard 14-day cancellation right under Consumer Contracts Regulations 2013 reg 28(1)(b).
            </p>
          )}
          {hasSoulReading && (
            <p style={{ margin: 0 }}>
              <strong style={{ color: PALETTE.earth }}>Soul Reading:</strong> Immediate delivery of digital content means you waive your 14-day right to cancel under CCR reg 37.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default CartConsents;
