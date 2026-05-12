/**
 * CartGiftUpsell — "🎁 Make it a gift" section in the cart drawer.
 *
 * Renders between the line items list and the checkout footer (mirrors
 * SoulReadingUpsell positioning). Customer enters a recipient name/email +
 * optional message, picks an amount, and clicks Add → a gift-card line item
 * is pushed onto the cart with the recipient details as Shopify line-item
 * properties.
 *
 * Shopify's native gift card flow takes over from there:
 *   1. Customer checks out → pays
 *   2. Shopify auto-generates a unique gift code per gift-card line item
 *   3. Shopify auto-emails the recipient with the code + the customer's message
 *   4. Recipient redeems the code at checkout like any discount code (built-in)
 *
 * No custom backend code needed — everything past add-to-cart is native Shopify.
 *
 * Source of truth for variant IDs:
 *   src/components/portraits/gelatoFramedCanvas.ts → GIFT_CARD_VARIANTS
 * Run scripts/shopify-launch/create_gift_card_product.py once to populate.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Check, X, ChevronDown } from "lucide-react";
import { PALETTE } from "./tokens";
import type { CartItem } from "./cart";
import {
  GIFT_CARD_VARIANTS,
  GIFT_CARD_DENOMINATIONS_GBP,
} from "./gelatoFramedCanvas";

interface CartGiftUpsellProps {
  /** Called when the user adds a gift card. Parent injects into cart. */
  onAdd: (item: CartItem) => void;
}

const HINT_PER_AMOUNT: Record<number, string> = {
  19:  "Covers 1 digital download",
  39:  "Covers 8×10 unframed canvas",
  79:  "Covers 18×24 unframed canvas",
  129: "Covers a framed canvas",
};

export function CartGiftUpsell({ onAdd }: CartGiftUpsellProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(GIFT_CARD_DENOMINATIONS_GBP[0]);
  // 2026-05-12 update per Danny: code is emailed to the BUYER, who shares it
  // themselves (more personal, lets them text/whatsapp the friend directly).
  // recipientName is OPTIONAL — only used for the message wording on the buyer's
  // receipt ("Gift for Sarah"). No recipientEmail field anymore.
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const denomination = GIFT_CARD_VARIANTS[amount];

  function handleSubmit() {
    setError(null);
    if (!denomination || denomination.variantId === 0) {
      return setError("Gift cards aren't available yet — coming soon");
    }

    // Build a synthetic CartItem for the gift card. Shopify gift card products
    // don't generate a print master — the variant itself is the deliverable.
    // Recipient details ride as line-item properties; Shopify reads `recipient_name`,
    // `recipient_email`, `message` natively and auto-emails the recipient.
    const item: CartItem = {
      id: `gift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "ai",
      productType: "gift-card" as const,
      sizeKey: "default",
      variantId: denomination.variantId,
      packId: "gift-card",
      packName: `Gift card · £${amount}`,
      style: "photographic",
      sourcePhotoUrl: "",
      previewUrl: "",
      soulEdition: false,
      productLabel: `Cosmic Pet Portrait — Gift Card £${amount}`,
      productShortLabel: "Gift card",
      sizeLabel: `£${amount}`,
      priceMajor: amount,
      // Properties: NO recipient_email — Shopify sends gift code to the BUYER
      // who shares it manually with the friend. recipient_name + message are
      // kept (with underscore-prefix to hide from customer order page) as
      // memo-only data for analytics and the buyer's records.
      properties: {
        ...(recipientName.trim() ? { _gift_for: recipientName.trim() } : {}),
        ...(message.trim() ? { _gift_message: message.trim() } : {}),
      },
    };
    onAdd(item);

    // Reset + collapse
    setRecipientName("");
    setMessage("");
    setAmount(GIFT_CARD_DENOMINATIONS_GBP[0]);
    setOpen(false);
  }

  return (
    <section
      className="mx-4 mb-4 rounded-2xl overflow-hidden"
      style={{
        background: PALETTE.cream,
        border: `1px solid ${PALETTE.sand}`,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        style={{ background: PALETTE.cream }}
      >
        <span className="flex items-center gap-2.5">
          <Gift className="w-4 h-4" style={{ color: PALETTE.rose }} aria-hidden />
          <span
            style={{
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: PALETTE.ink,
            }}
          >
            Send a portrait to a friend
          </span>
        </span>
        <ChevronDown
          className="w-4 h-4 transition-transform"
          style={{
            color: PALETTE.earthMuted,
            transform: open ? "rotate(180deg)" : undefined,
          }}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24 }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 pt-1">
              <p
                style={{
                  fontFamily: "Assistant, system-ui, sans-serif",
                  fontSize: 12.5,
                  lineHeight: 1.55,
                  color: PALETTE.earthMuted,
                  marginBottom: 12,
                }}
              >
                We'll email you a unique code to share — text it, post it, slip it in a card.
                Your friend picks the pet, the style, and the size. The code never expires.
              </p>

              {/* Amount picker */}
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
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {GIFT_CARD_DENOMINATIONS_GBP.map((d) => {
                  const active = amount === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAmount(d)}
                      aria-pressed={active}
                      className="rounded-lg px-2 py-2 transition-all"
                      style={{
                        background: active ? PALETTE.rose : PALETTE.cream2,
                        color: active ? PALETTE.cream : PALETTE.ink,
                        border: `1px solid ${active ? PALETTE.rose : PALETTE.sand}`,
                        fontFamily: "Asap, system-ui, sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      £{d}
                    </button>
                  );
                })}
              </div>
              <p
                style={{
                  fontFamily: "Assistant, system-ui, sans-serif",
                  fontSize: 11.5,
                  color: PALETTE.earthMuted,
                  marginBottom: 14,
                  marginTop: -4,
                }}
              >
                {HINT_PER_AMOUNT[amount]}
              </p>

              {/* Recipient name (optional — just for the buyer's records) */}
              <label
                htmlFor="gift-recipient-name"
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: PALETTE.earthMuted,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Who's it for? <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500, color: PALETTE.earthSubtle }}>(optional)</span>
              </label>
              <input
                id="gift-recipient-name"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                maxLength={80}
                placeholder="e.g. Sarah"
                className="w-full px-3 py-2 rounded-lg mb-3"
                style={{
                  background: PALETTE.cream2,
                  border: `1px solid ${PALETTE.sand}`,
                  fontFamily: "Assistant, system-ui, sans-serif",
                  fontSize: 13.5,
                  color: PALETTE.ink,
                }}
              />

              {/* Optional message — for the buyer's records, also kept on the order */}
              <label
                htmlFor="gift-message"
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: PALETTE.earthMuted,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Message (optional)
              </label>
              <textarea
                id="gift-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={240}
                rows={2}
                placeholder="Thinking of you and Bella ✦"
                className="w-full px-3 py-2 rounded-lg mb-3 resize-none"
                style={{
                  background: PALETTE.cream2,
                  border: `1px solid ${PALETTE.sand}`,
                  fontFamily: "Assistant, system-ui, sans-serif",
                  fontSize: 13.5,
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
                  <X className="w-3.5 h-3.5" aria-hidden />
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                className="w-full px-4 py-3 rounded-full transition-all"
                style={{
                  background: PALETTE.ink,
                  color: PALETTE.cream,
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Check className="w-4 h-4" aria-hidden />
                  Add £{amount} gift card
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
