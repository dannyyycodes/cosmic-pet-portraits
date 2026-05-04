/**
 * /unlimited — subscription landing page (Pass / Elite / Pack).
 *
 * Used as the destination for video CTAs (TikTok / IG / YT bio links). Subs
 * cannot be sold inside TikTok Shop / Meta Shops / YT Shopping — they're
 * product-only. So the bio link points here.
 *
 * Anonymous users see Subscribe buttons that redirect to /auth?next=/unlimited
 * before firing the Stripe Checkout. Authed users go straight to checkout.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PortraitsNav } from "@/components/portraits/PortraitsNav";
import { PortraitsFooter } from "@/components/portraits/PortraitsFooter";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCredits } from "@/components/portraits/useCredits";
import { PALETTE } from "@/components/portraits/tokens";

interface Plan {
  sku: "pass" | "elite" | "pack";
  label: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: string;
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    sku: "pass",
    label: "Pass",
    price: "£8.99",
    cadence: "/month",
    tagline: "25 portraits a month. Worth it after one print.",
    features: [
      "25 portraits a month (4 variants each)",
      "Every Style × Theme combo unlocked",
      "Re-download anytime",
      "Cancel any time",
    ],
    cta: "Start Pass",
  },
  {
    sku: "elite",
    label: "Elite",
    price: "£17.99",
    cadence: "/month",
    tagline: "75 portraits a month. For serious portrait obsessives.",
    features: [
      "75 portraits a month (4 variants each)",
      "Priority generation queue",
      "Every Style × Theme + freeform details",
      "Re-download anytime",
      "Cancel any time",
    ],
    cta: "Start Elite",
    recommended: true,
  },
  {
    sku: "pack",
    label: "Pack of 5",
    price: "£4.99",
    cadence: "one-off",
    tagline: "Top up without committing.",
    features: [
      "5 portraits (4 variants each)",
      "Never expire",
      "No subscription",
    ],
    cta: "Buy Pack",
  },
];

export default function PortraitsUnlimited() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { balance, tier } = useCredits();
  const [busySku, setBusySku] = useState<string | null>(null);

  async function handleStart(sku: Plan["sku"]) {
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent("/unlimited?sku=" + sku)}`);
      return;
    }
    setBusySku(sku);
    try {
      // Use Supabase session token (same as the rest of the app).
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("No active session");
      const res = await fetch("/api/stripe?action=checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ sku }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout creation failed");
      window.location.href = data.url;
    } catch (e) {
      toast.error((e as Error).message);
      setBusySku(null);
    }
  }

  return (
    <div style={{ background: PALETTE.cream, minHeight: "100vh" }}>
      <PortraitsNav />

      <main className="pt-[88px] pb-24">
        <section className="px-5 md:px-8" style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Hero */}
          <div className="text-center mt-8 mb-12">
            <p
              className="uppercase mb-4"
              style={{ color: PALETTE.muted, letterSpacing: "0.16em", fontSize: 12, fontWeight: 600 }}
            >
              Unlimited AI portraits · UK VAT included
            </p>
            <h1
              className="font-serif"
              style={{ fontSize: "clamp(36px, 5vw, 56px)", color: PALETTE.ink, lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              Make portraits all day. <br />
              <span style={{ color: PALETTE.rose }}>Print the favourites.</span>
            </h1>
            <p
              className="mt-4 mx-auto font-cormorant italic"
              style={{ fontSize: 20, color: PALETTE.warm, maxWidth: 560 }}
            >
              Studio-as-toy. Print only what you love. Cancel any time.
            </p>
            {balance !== null && (
              <p className="mt-6 text-sm" style={{ color: PALETTE.muted }}>
                You currently have <strong style={{ color: PALETTE.ink }}>{balance} credits</strong>
                {tier ? ` · ${tier === "elite" ? "Elite" : "Pass"} subscriber` : ""}.
              </p>
            )}
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.sku}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl p-6 flex flex-col"
                style={{
                  background: "#fff",
                  border: plan.recommended ? `2px solid ${PALETTE.rose}` : `1px solid ${PALETTE.sand}`,
                  boxShadow: plan.recommended ? "0 12px 32px rgba(191, 82, 74, 0.18)" : "0 4px 14px rgba(60,36,18,0.06)",
                  position: "relative",
                }}
              >
                {plan.recommended && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] uppercase"
                    style={{ background: PALETTE.rose, color: "#fff", letterSpacing: "0.12em", fontWeight: 700 }}
                  >
                    Most loved
                  </span>
                )}
                <h2 className="font-serif" style={{ fontSize: 22, color: PALETTE.ink }}>{plan.label}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-serif" style={{ fontSize: 40, color: PALETTE.ink, fontWeight: 700 }}>
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: PALETTE.muted }}>{plan.cadence}</span>
                </div>
                <p className="mt-3 text-sm font-cormorant italic" style={{ color: PALETTE.warm }}>{plan.tagline}</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm flex gap-2" style={{ color: PALETTE.earth }}>
                      <span style={{ color: PALETTE.rose }}>✦</span> <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleStart(plan.sku)}
                  disabled={busySku === plan.sku}
                  className="mt-6 w-full px-6 py-3 rounded-full text-sm font-medium transition-opacity disabled:opacity-50"
                  style={{
                    background: plan.recommended ? PALETTE.rose : PALETTE.ink,
                    color: "#fff",
                    letterSpacing: "0.04em",
                  }}
                >
                  {busySku === plan.sku ? "Redirecting…" : plan.cta}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Trust strip */}
          <div className="mt-12 grid md:grid-cols-3 gap-4 text-center">
            <Trust label="Cancel any time" copy="Self-serve cancel from your account, no support ticket needed." />
            <Trust label="UK VAT included" copy="Stripe Tax handles it automatically." />
            <Trust label="Worth it after one print" copy="Generate first, print only what you love." />
          </div>
        </section>
      </main>

      <PortraitsFooter />
    </div>
  );
}

function Trust({ label, copy }: { label: string; copy: string }) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "#fff", border: `1px solid ${PALETTE.sand}` }}
    >
      <p className="font-serif text-sm" style={{ color: PALETTE.ink }}>{label}</p>
      <p className="mt-1 text-xs" style={{ color: PALETTE.muted, lineHeight: 1.5 }}>{copy}</p>
    </div>
  );
}
