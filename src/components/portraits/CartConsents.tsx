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

  // Consent state — timestamps stored on tick.
  const [canvasAt, setCanvasAt] = useState<string | null>(null);
  const [readingAt, setReadingAt] = useState<string | null>(null);

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

  return (
    <fieldset
      aria-labelledby="cart-consents-legend"
      style={{
        margin: "0 0 14px 0",
        padding: "12px 14px",
        border: `1px solid ${PALETTE.sand}`,
        borderRadius: 10,
        background: "#fff",
      }}
    >
      <legend
        id="cart-consents-legend"
        style={{
          padding: "0 6px",
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: PALETTE.earthMuted,
        }}
      >
        Before you continue
      </legend>

      {hasCanvas && (
        <ConsentRow
          id="consent-canvas"
          checked={canvasAt !== null}
          onChange={(checked) =>
            setCanvasAt(checked ? new Date().toISOString() : null)
          }
          label={
            "I understand my canvas is uniquely created for me and is exempt from the standard 14-day cancellation right under Consumer Contracts Regulations 2013 reg 28(1)(b)."
          }
        />
      )}

      {hasSoulReading && (
        <ConsentRow
          id="consent-reading"
          checked={readingAt !== null}
          onChange={(checked) =>
            setReadingAt(checked ? new Date().toISOString() : null)
          }
          label={
            "I consent to immediate delivery of my Soul Reading and acknowledge I waive my 14-day right to cancel under CCR Reg 37."
          }
        />
      )}

      <a
        href={REFUND_POLICY_HREF}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          marginTop: 4,
          marginLeft: 26,
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 12,
          color: PALETTE.earthMuted,
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        Read full refund policy →
      </a>
    </fieldset>
  );
}

interface ConsentRowProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function ConsentRow({ id, checked, onChange, label }: ConsentRowProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3"
      style={{
        cursor: "pointer",
        padding: "8px 0",
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          flexShrink: 0,
          marginTop: 2,
          width: 18,
          height: 18,
          cursor: "pointer",
          accentColor: PALETTE.rose,
        }}
      />
      <span
        style={{
          fontFamily: "Assistant, system-ui, sans-serif",
          fontSize: 12.5,
          lineHeight: 1.5,
          color: PALETTE.ink,
        }}
      >
        {label}
      </span>
    </label>
  );
}

export default CartConsents;
