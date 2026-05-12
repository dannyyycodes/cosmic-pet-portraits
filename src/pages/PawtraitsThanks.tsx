/**
 * /pawtraits/thanks — post-purchase landing page.
 *
 * Customer arrives here after a successful Shopify checkout (configure Shopify
 * Settings → Checkout → Order status → Additional scripts to redirect here, OR
 * pass `return_url` on the draft order create). Page shows:
 *
 *   1. Confirmation message (your portrait is on its way / check your email)
 *   2. PostPurchaseGiftUpsell — "Loved it? Send one to a friend, 20% off"
 *   3. Soft brand reminder + footer
 *
 * The upsell creates a NEW draft order (just the discounted gift card line)
 * and redirects to that invoice URL — handed off to Shopify checkout.
 */

import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { PostPurchaseGiftUpsell } from "@/components/portraits/PostPurchaseGiftUpsell";
import { PALETTE } from "@/components/portraits/tokens";

export default function PawtraitsThanks() {
  const [params] = useSearchParams();
  const orderRef = params.get("order") ?? params.get("order_number") ?? null;
  const customerName = params.get("name") ?? null;

  // Clear the cart on arrival — the order is paid, the local cart is stale.
  useEffect(() => {
    try { window.localStorage.removeItem("ls.portraits.cart.v1"); } catch { /* private mode */ }
  }, []);

  return (
    <>
      <Helmet>
        <title>Thank you · Little Souls</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <main
        className="min-h-screen"
        style={{
          background: PALETTE.cream,
          paddingTop: "clamp(64px, 10vh, 120px)",
          paddingBottom: "clamp(80px, 12vh, 160px)",
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 560 }}>
          {/* Brand mark */}
          <p
            className="text-center"
            style={{
              fontFamily: "Asap, system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: PALETTE.gold,
              margin: 0,
              marginBottom: 32,
            }}
          >
            Little Souls
          </p>

          {/* Confirmation card */}
          <section
            className="rounded-3xl px-6 py-10 text-center"
            style={{
              background: "#ffffff",
              border: `1px solid ${PALETTE.sand}`,
              boxShadow: "0 16px 40px rgba(20, 18, 16, 0.06)",
              marginBottom: 24,
            }}
          >
            <p
              style={{
                fontFamily: "Asap, system-ui, sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: PALETTE.gold,
                margin: 0,
                marginBottom: 14,
              }}
            >
              {customerName ? `Thank you, ${customerName}` : "Thank you"}
            </p>
            <h1
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(28px, 4vw, 36px)",
                fontWeight: 500,
                color: PALETTE.ink,
                margin: 0,
                marginBottom: 16,
                lineHeight: 1.2,
              }}
            >
              Your portrait is on its way ✦
            </h1>
            <p
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 16,
                lineHeight: 1.7,
                color: PALETTE.earth,
                margin: 0,
                marginBottom: 12,
              }}
            >
              We've kicked off the print pipeline. Check your email for the order
              confirmation and (for digital downloads) the link to your high-resolution file.
            </p>
            <p
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 14,
                color: PALETTE.earthMuted,
                margin: 0,
              }}
            >
              Canvas orders typically arrive in 3–5 days.
            </p>
            {orderRef && (
              <p
                className="mt-5"
                style={{
                  fontFamily: "Asap, system-ui, sans-serif",
                  fontSize: 12,
                  color: PALETTE.earthMuted,
                  margin: 0,
                }}
              >
                Order reference:{" "}
                <code
                  style={{
                    fontFamily: "Menlo, Consolas, monospace",
                    background: PALETTE.cream2,
                    padding: "3px 8px",
                    borderRadius: 4,
                    color: PALETTE.ink,
                  }}
                >
                  {orderRef}
                </code>
              </p>
            )}
          </section>

          {/* Post-purchase gift upsell */}
          <PostPurchaseGiftUpsell />

          {/* Footer */}
          <p
            className="text-center mt-10"
            style={{
              fontFamily: "Assistant, system-ui, sans-serif",
              fontSize: 13,
              color: PALETTE.earthMuted,
            }}
          >
            Questions? Reply to your order email — a real person reads them.
          </p>
        </div>
      </main>
    </>
  );
}
