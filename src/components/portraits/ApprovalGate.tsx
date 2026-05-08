/**
 * ApprovalGate — Reveal step between generation and cart-add.
 *
 * After the API returns variants[0].url we PAUSE before letting the customer
 * commit to a SKU. This matches the Crown & Paw / proven-player "preview &
 * approve before print" pattern (vault: research-2026-05-07-multipet-
 * orientation-ux.md, Screen 5 — Reveal). It also stops customers wasting a
 * size-pick + cart-add motion on a generation they're going to redo anyway.
 *
 * Three actions:
 *   1. Continue with this →   (primary, rose) → parent flips approved=true
 *   2. Try again (1 credit)   → parent re-runs generate with same inputs
 *   3. Tweak the prompt       → collapses gate, returns to prompt editor
 *                               (no credit burned)
 */
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw, Pencil } from "lucide-react";
import { PALETTE, EASE, display } from "@/components/portraits/tokens";

interface ApprovalGateProps {
  /** Generated preview URL — fal Kontext output. */
  previewUrl: string;
  /** Tracks how many times we've burned credit so we can warn before retry. */
  generationCount: number;
  /** Active credit balance — gates the "Try again" button. Null = unknown. */
  creditsRemaining: number | null;
  /** Whether a regeneration is currently inflight. Disables buttons. */
  busy: boolean;
  /** Continue → unlock size/frame picker + cart UI. */
  onApprove: () => void;
  /** Try again → re-runs generate with same photos + prompt. */
  onTryAgain: () => void;
  /** Tweak the prompt → collapses gate, scrolls back to prompt editor. */
  onTweak: () => void;
}

export function ApprovalGate({
  previewUrl,
  generationCount,
  creditsRemaining,
  busy,
  onApprove,
  onTryAgain,
  onTweak,
}: ApprovalGateProps) {
  // "Try again" cost: 1 credit per attempt. We disable when balance hits 0.
  const canTryAgain = (creditsRemaining ?? 1) > 0 && !busy;

  return (
    <motion.div
      key="approval-gate"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: EASE.out }}
      className="rounded-2xl p-4 md:p-5"
      style={{
        background: PALETTE.cream,
        border: `1px solid ${PALETTE.sand}`,
        boxShadow:
          "0 24px 48px rgba(20, 18, 16, 0.06), 0 4px 12px rgba(20, 18, 16, 0.03)",
      }}
      aria-live="polite"
    >
      <div className="text-center mb-4">
        <h3
          style={{
            ...display("clamp(20px, 2.4vw, 26px)"),
            color: PALETTE.ink,
          }}
        >
          How does this look?
        </h3>
        <p
          className="mx-auto mt-2"
          style={{
            fontFamily: "Assistant, system-ui, sans-serif",
            fontSize: 13,
            color: PALETTE.earthMuted,
            lineHeight: 1.4,
            maxWidth: 380,
          }}
        >
          Take your time. If it's right, lock it in below.
          {generationCount > 1 ? ` This is take #${generationCount}.` : ""}
        </p>
      </div>

      {/* Big preview — square frame so portrait/landscape gens both look right */}
      <div
        className="mx-auto rounded-xl overflow-hidden relative"
        style={{
          maxWidth: 360,
          aspectRatio: "1 / 1",
          background: PALETTE.cosmos,
          border: `1px solid ${PALETTE.sandDeep}`,
          boxShadow:
            "0 18px 38px rgba(20, 18, 16, 0.10), inset 0 0 0 1px rgba(196,162,101,.14)",
        }}
      >
        <img
          src={previewUrl}
          alt="Generated portrait preview"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Action stack — primary first, regen + tweak as secondary affordances */}
      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="w-full rounded-xl py-3.5 transition-all disabled:opacity-50 active:scale-[0.99] inline-flex items-center justify-center gap-2"
          style={{
            background: PALETTE.rose,
            color: PALETTE.cream,
            fontFamily: "Asap, system-ui, sans-serif",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.02em",
            boxShadow: "0 12px 28px rgba(191, 82, 74, 0.30), 0 2px 6px rgba(191, 82, 74, 0.14)",
          }}
        >
          Continue with this
          <ArrowRight className="w-[18px] h-[18px]" strokeWidth={2.4} />
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onTryAgain}
            disabled={!canTryAgain}
            className="rounded-xl py-3 transition-all disabled:opacity-50 active:scale-[0.99] inline-flex items-center justify-center gap-2"
            style={{
              background: PALETTE.cream2,
              color: PALETTE.ink,
              border: `1.5px solid ${PALETTE.sandDeep}`,
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 600,
            }}
            title={
              canTryAgain
                ? "Re-runs the generation. Costs 1 credit."
                : "No credits remaining"
            }
          >
            <RefreshCw
              className={`w-[16px] h-[16px] ${busy ? "animate-spin" : ""}`}
              strokeWidth={2.2}
            />
            {busy ? "Generating…" : "Try again (1 credit)"}
          </button>

          <button
            type="button"
            onClick={onTweak}
            disabled={busy}
            className="rounded-xl py-3 transition-all disabled:opacity-50 active:scale-[0.99] inline-flex items-center justify-center gap-2"
            style={{
              background: "transparent",
              color: PALETTE.earth,
              border: `1px solid ${PALETTE.sand}`,
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 600,
            }}
            title="Edit the prompt — no credit burned."
          >
            <Pencil className="w-[15px] h-[15px]" strokeWidth={2.2} />
            Tweak the prompt
          </button>
        </div>

        {creditsRemaining != null && (
          <p
            className="text-center mt-1"
            style={{
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 12,
              color: PALETTE.earthMuted,
            }}
          >
            {creditsRemaining} credit{creditsRemaining === 1 ? "" : "s"} remaining
          </p>
        )}
      </div>
    </motion.div>
  );
}
