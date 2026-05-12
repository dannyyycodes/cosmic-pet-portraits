/**
 * PostPurchaseGiftUpsell — modal/section shown after a successful checkout.
 *
 * Renders on the post-purchase thank-you page (e.g. /pawtraits/thanks). The
 * customer just paid for a portrait — capitalises on the buying-mode peak
 * by offering a 20% discount on a gift card to send to a friend.
 *
 * Flow:
 *   1. Customer lands here after Shopify checkout (Shopify redirect / return_url)
 *   2. Sees: "Loved your portrait? Send one to a friend — 20% off"
 *   3. Picks amount + recipient details, clicks Send
 *   4. We open a NEW Shopify draft order with just the discounted gift card,
 *      redirect to the new invoice URL for the friend's portion
 *
 * The 20% discount is applied as a custom price on the draft order line item.
 * (Shopify's discount-code system would also work, but custom-price is simpler
 * for a one-shot upsell — no need to create+revoke discount codes.)
 *
 * Source of truth for variant IDs:
 *   src/components/portraits/gelatoFramedCanvas.ts → GIFT_CARD_VARIANTS
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Check, X, Sparkles } from "lucide-react";
import { PALETTE } from "./tokens";
import { GIFT_CARD_VARIANTS, GIFT_CARD_DENOMINATIONS_GBP } from "./gelatoFramedCanvas";

const DISCOUNT_PCT = 20;

const HINT_PER_AMOUNT: Record<number, string> = {
  19:  "Covers 1 digital download",
  39:  "Covers 8×10 unframed canvas",
  79:  "Covers 18×24 unframed canvas",
  129: "Covers a framed canvas",
};

export function PostPurchaseGiftUpsell() {
  const [stage, setStage] = useState<"pitch" | "form" | "submitting" | "done" | "skipped">("pitch");
  const [amount, setAmount] = useState<number>(GIFT_CARD_DENOMINATIONS_GBP[1] ?? 39);
  // 2026-05-12 update per Danny: gift code is emailed to BUYER, who shares
  // with the friend personally. recipientName is optional and only used for
  // the order memo. No recipientEmail anymore.
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const denomination = GIFT_CARD_VARIANTS[amount];
  const discountedPrice = Math.round(amount * (1 - DISCOUNT_PCT / 100));
  const savedAmount = amount - discountedPrice;

  async function handleSend() {
    setError(null);
    if (!denomination || denomination.variantId === 0) {
      return setError("Gift cards aren't available yet — coming soon");
    }

    setStage("submitting");
    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: "GBP",
          items: [
            {
              productType: "gift-card",
              sizeKey: "default",
              variantId: denomination.variantId,
              packId: "post-purchase-gift",
              packName: `Gift card · £${amount} (${DISCOUNT_PCT}% off)`,
              // Variant ID stays set so Shopify's native gift-card auto-code
              // generation runs. The discount is applied per-line via
              // applied_discount (Shopify draft order feature) — keeps the
              // native flow intact AND applies the percentage off cleanly.
              // Code goes to BUYER's email; no recipient_email property.
              appliedDiscountPct: DISCOUNT_PCT,
              properties: {
                ...(recipientName.trim() ? { _gift_for: recipientName.trim() } : {}),
                ...(message.trim() ? { _gift_message: message.trim() } : {}),
              },
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.invoiceUrl) throw new Error(data.error || "Checkout failed");
      // Hand off to Shopify-hosted checkout for the gift card.
      window.location.href = data.invoiceUrl;
    } catch (err) {
      setError((err as Error).message);
      setStage("form");
    }
  }

  if (stage === "skipped") {
    return null;
  }

  return (
    <section
      className="mx-auto max-w-md rounded-3xl overflow-hidden"
      style={{
        background: PALETTE.cream,
        border: `1px solid ${PALETTE.sand}`,
        boxShadow: "0 14px 32px rgba(20, 18, 16, 0.08)",
      }}
      aria-labelledby="post-purchase-gift-title"
    >
      {/* Pitch state */}
      {stage === "pitch" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="px-6 py-7 text-center"
        >
          <div
            className="mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{
              width: 56,
              height: 56,
              background: PALETTE.roseSoft,
            }}
          >
            <Gift className="w-7 h-7" style={{ color: PALETTE.rose }} aria-hidden />
          </div>
          <p
            style={{
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: PALETTE.gold,
              margin: 0,
              marginBottom: 8,
            }}
          >
            One more thing
          </p>
          <h2
            id="post-purchase-gift-title"
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: 26,
              fontWeight: 500,
              color: PALETTE.ink,
              margin: 0,
              marginBottom: 10,
              lineHeight: 1.25,
            }}
          >
            Loved it? Send one to a friend.
          </h2>
          <p
            style={{
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 14,
              lineHeight: 1.6,
              color: PALETTE.earth,
              margin: 0,
              marginBottom: 18,
            }}
          >
            Pick an amount, we'll email them a code. They choose the pet, the style, the size — and you get
            <strong style={{ color: PALETTE.rose, fontWeight: 700 }}> {DISCOUNT_PCT}% off</strong> for being a customer.
          </p>
          <button
            type="button"
            onClick={() => setStage("form")}
            className="w-full px-6 py-3.5 rounded-full"
            style={{
              background: PALETTE.rose,
              color: PALETTE.cream,
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.02em",
              boxShadow: "0 12px 28px rgba(191, 82, 74, 0.28)",
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" aria-hidden />
              Send a gift — {DISCOUNT_PCT}% off
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStage("skipped")}
            className="mt-3 px-3 py-2"
            style={{
              background: "transparent",
              border: "none",
              color: PALETTE.earthMuted,
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            No thanks, just the order →
          </button>
        </motion.div>
      )}

      {/* Form state */}
      {(stage === "form" || stage === "submitting") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-6 py-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: 22,
                fontWeight: 500,
                color: PALETTE.ink,
                margin: 0,
              }}
            >
              Send a portrait
            </h3>
            <button
              type="button"
              onClick={() => setStage("pitch")}
              aria-label="Back"
              style={{
                background: "transparent",
                border: "none",
                color: PALETTE.earthMuted,
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Amount */}
          <p
            className="mb-2"
            style={{
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 10.5,
              fontWeight: 700,
              color: PALETTE.earthMuted,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Amount
          </p>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {GIFT_CARD_DENOMINATIONS_GBP.map((d) => {
              const active = amount === d;
              const dPrice = Math.round(d * (1 - DISCOUNT_PCT / 100));
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setAmount(d)}
                  aria-pressed={active}
                  className="rounded-lg px-2 py-2 text-center transition-all"
                  style={{
                    background: active ? PALETTE.rose : PALETTE.cream2,
                    color: active ? PALETTE.cream : PALETTE.ink,
                    border: `1px solid ${active ? PALETTE.rose : PALETTE.sand}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "Asap, system-ui, sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    £{d}
                  </div>
                  <div
                    style={{
                      fontFamily: "Assistant, system-ui, sans-serif",
                      fontSize: 10,
                      opacity: 0.85,
                      textDecoration: "line-through",
                    }}
                  >
                    was £{d}
                  </div>
                </button>
              );
            })}
          </div>
          <p
            className="mb-3"
            style={{
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 12,
              color: PALETTE.earthMuted,
            }}
          >
            {HINT_PER_AMOUNT[amount]} · You pay <strong style={{ color: PALETTE.ink }}>£{discountedPrice}</strong> (save £{savedAmount})
          </p>

          {/* Inputs — name optional, no email (buyer receives the code) */}
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Who's it for? (optional)"
            maxLength={80}
            className="w-full px-3 py-2.5 rounded-lg mb-2"
            style={{
              background: PALETTE.cream2,
              border: `1px solid ${PALETTE.sand}`,
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 14,
              color: PALETTE.ink,
            }}
          />
          <p
            style={{
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 11.5,
              color: PALETTE.earthMuted,
              margin: "0 0 10px 2px",
              lineHeight: 1.4,
            }}
          >
            We'll email the code to you — text it, post it, or tuck it in a card.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Personal message (optional)"
            maxLength={240}
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg mb-3 resize-none"
            style={{
              background: PALETTE.cream2,
              border: `1px solid ${PALETTE.sand}`,
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 14,
              color: PALETTE.ink,
            }}
          />

          {error && (
            <p
              className="flex items-center gap-1.5 mb-3"
              style={{
                fontFamily: "Assistant, system-ui, sans-serif",
                fontSize: 12.5,
                color: PALETTE.rose,
              }}
            >
              <X className="w-3.5 h-3.5" aria-hidden /> {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={stage === "submitting"}
            className="w-full px-4 py-3.5 rounded-full transition-all disabled:opacity-60"
            style={{
              background: PALETTE.rose,
              color: PALETTE.cream,
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            <span className="inline-flex items-center gap-2">
              {stage === "submitting" ? "Opening checkout…" : (
                <>
                  <Check className="w-4 h-4" aria-hidden />
                  Send for £{discountedPrice}
                </>
              )}
            </span>
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {stage === "done" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-7 text-center"
          >
            <Check className="w-10 h-10 mx-auto mb-3" style={{ color: PALETTE.rose }} aria-hidden />
            <p
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: 20,
                color: PALETTE.ink,
                margin: 0,
              }}
            >
              On its way to {recipientName.trim()} ✦
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
