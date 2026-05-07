/**
 * TopUpPlans — reusable 3-card pricing block (Pack / Pass / Elite).
 *
 * Rendered inline on /portraits below the StudioFlow (so customers never
 * leave the page). The standalone /unlimited page was removed 2026-05-05 —
 * single-page funnel: studio + pricing + checkout all on /portraits.
 *
 * Anonymous users get redirected to /auth?next=... before Stripe checkout.
 * Authed users hit Stripe Checkout directly.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Check, Star, Crown, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCredits } from "@/components/portraits/useCredits";
import { PALETTE, display, cormorantItalic, eyebrow, tabularPrice, EASE } from "@/components/portraits/tokens";

interface Plan {
  sku: "pass" | "elite" | "pack";
  label: string;
  price: string;
  cadence: string;
  generations: string;
  tagline: string;
  features: string[];
  cta: string;
  recommended?: boolean;
  icon: typeof Sparkles;
}

const PLANS: Plan[] = [
  {
    sku: "pack",
    label: "Pack of 5",
    price: "£4.99",
    cadence: "one-off",
    generations: "5 pawtraits",
    tagline: "Top up without committing.",
    features: [
      "5 full-size pawtraits · download instantly",
      "Credits never expire",
      "No subscription",
    ],
    cta: "Buy Pack",
    icon: Gift,
  },
  {
    sku: "pass",
    label: "Pass",
    price: "£8.99",
    cadence: "per month",
    generations: "25 pawtraits/mo",
    tagline: "Worth it after one print.",
    features: [
      "25 full-size pawtraits per month",
      "All styles & themes",
      "Re-download anytime",
      "Cancel any time",
    ],
    cta: "Start Pass",
    recommended: true,
    icon: Star,
  },
  {
    sku: "elite",
    label: "Enthusiast",
    price: "£17.99",
    cadence: "per month",
    generations: "75 pawtraits/mo",
    tagline: "For the seriously obsessed.",
    features: [
      "75 full-size pawtraits per month",
      "Priority generation queue",
      "Freeform prompt details",
      "Re-download anytime",
      "Cancel any time",
    ],
    cta: "Start Enthusiast",
    icon: Crown,
  },
];

interface TopUpPlansProps {
  variant?: "section" | "inline";
  showHeader?: boolean;
  /** Override the heading shown above the cards. Only used if showHeader is true. */
  heading?: string;
  /** When user clicks while not logged in, where to redirect them after auth. */
  authRedirect?: string;
}

export function TopUpPlans({
  variant = "section",
  showHeader = true,
  heading = "Need more generations?",
  authRedirect = "/pawtraits#topup",
}: TopUpPlansProps) {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { balance, tier } = useCredits();
  const [busySku, setBusySku] = useState<string | null>(null);

  async function handleStart(sku: Plan["sku"]) {
    if (!user) {
      navigate(`/auth?next=${encodeURIComponent(authRedirect + "?sku=" + sku)}`);
      return;
    }
    setBusySku(sku);
    try {
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
      // Read text first so non-JSON responses (HTML error pages, gateway 500s)
      // surface a useful message instead of "JSON.parse: unexpected character".
      const raw = await res.text();
      let data: { url?: string; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(`Checkout failed (${res.status}): ${raw.slice(0, 140) || "no response body"}`);
      }
      if (!res.ok || !data.url) throw new Error(data.error || `Checkout failed (${res.status})`);
      window.location.href = data.url;
    } catch (e) {
      toast.error((e as Error).message);
      setBusySku(null);
    }
  }

  const generationsRemaining = balance ?? null;

  const cards = (
    <div className="grid md:grid-cols-3 gap-5 md:gap-6 items-stretch">
      <style>{`
        @keyframes topupIconSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .topup-icon-disc {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          position: relative;
          overflow: hidden;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 0 0 1px rgba(196,162,101,0.4),
            0 0 0 4px rgba(255,255,255,0.96),
            0 0 0 5px rgba(196,162,101,0.22),
            0 6px 14px rgba(20,18,16,0.12);
          transition: box-shadow 0.6s ease;
        }
        .topup-icon-bg {
          position: absolute;
          inset: 0;
          background-size: 220% auto;
          background-position: center;
          animation: topupIconSpin 32s linear infinite;
          transition: animation-duration 0.5s ease, filter 0.5s ease;
        }
        .topup-rule-line {
          width: 32px;
          height: 1px;
          transition: width 0.6s cubic-bezier(.2,.7,.2,1);
        }
        .topup-card:hover .topup-icon-bg {
          animation-duration: 7s;
          filter: saturate(1.2);
        }
        .topup-card:hover .topup-icon-disc {
          box-shadow:
            0 0 0 1px rgba(196,162,101,0.6),
            0 0 0 4px rgba(255,255,255,0.96),
            0 0 0 5px rgba(196,162,101,0.36),
            0 10px 20px rgba(20,18,16,0.16);
        }
        .topup-card:hover .topup-rule-line { width: 56px; }
      `}</style>
      {PLANS.map((plan, i) => {
        const Icon = plan.icon;
        return (
          <motion.div
            key={plan.sku}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: EASE.out }}
            className="topup-card relative rounded-2xl p-7 md:p-8 flex flex-col"
            style={{
              background: PALETTE.cream,
              border: plan.recommended
                ? `1.5px solid ${PALETTE.ink}`
                : `1px solid ${PALETTE.sand}`,
              boxShadow: plan.recommended
                ? `0 24px 56px rgba(20, 18, 16, 0.14), 0 4px 12px rgba(20, 18, 16, 0.05)`
                : `0 16px 38px rgba(20, 18, 16, 0.06), 0 2px 6px rgba(20, 18, 16, 0.03)`,
            }}
          >
            {plan.recommended && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full"
                style={{
                  background: PALETTE.ink,
                  color: PALETTE.cream,
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  boxShadow: "0 6px 16px rgba(20, 18, 16, 0.32)",
                  zIndex: 20,
                }}
              >
                Most loved
              </span>
            )}

            {/* Marble icon disc — animated, the only marble on the card */}
            <div className="topup-icon-disc">
              <div
                aria-hidden
                className="topup-icon-bg"
                style={{
                  backgroundImage: `url(/pawtraits/topup-${plan.sku}-text.webp?v=4)`,
                }}
              />
              <Icon
                className="relative"
                style={{
                  width: 22,
                  height: 22,
                  color: PALETTE.ink,
                  strokeWidth: 2.4,
                  zIndex: 2,
                  filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.85))",
                }}
              />
            </div>

            <h3
              style={{
                ...display("28px"),
                color: PALETTE.ink,
                textShadow: "0 1px 0 rgba(255,255,255,0.7)",
              }}
            >
              {plan.label}
            </h3>

            {/* Single gold rule — restrained */}
            <div className="mt-1 mb-3">
              <span
                className="topup-rule-line block"
                style={{
                  background: `linear-gradient(90deg, ${PALETTE.goldDeep}, ${PALETTE.gold}, ${PALETTE.goldDeep})`,
                }}
              />
            </div>

            <div className="mt-3 flex items-baseline gap-1.5">
              <span style={{ ...tabularPrice("38px"), color: PALETTE.ink, fontWeight: 700 }}>
                {plan.price}
              </span>
              <span
                style={{
                  fontFamily: 'Assistant, system-ui, sans-serif',
                  fontSize: 13,
                  color: PALETTE.earthMuted,
                }}
              >
                {plan.cadence}
              </span>
            </div>

            <p
              className="mt-1"
              style={{
                fontFamily: 'Asap, system-ui, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: PALETTE.earth,
              }}
            >
              {plan.generations}
            </p>

            <p style={{ ...cormorantItalic("16px"), color: PALETTE.earth, marginTop: 14, lineHeight: 1.5 }}>
              {plan.tagline}
            </p>

            <div className="my-6" style={{ height: 1, background: PALETTE.sand }} />

            <ul className="space-y-3 flex-1">
              {plan.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2.5"
                  style={{
                    fontFamily: 'Assistant, system-ui, sans-serif',
                    fontSize: 14,
                    color: PALETTE.earth,
                    lineHeight: 1.5,
                  }}
                >
                  <Check
                    className="flex-shrink-0 mt-0.5"
                    style={{
                      width: 16,
                      height: 16,
                      color: PALETTE.earthMuted,
                      strokeWidth: 2.5,
                    }}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleStart(plan.sku)}
              disabled={busySku === plan.sku}
              className="mt-7 w-full rounded-xl py-3.5 transition-all hover:translate-y-[-1px] disabled:opacity-50"
              style={{
                background: PALETTE.ink,
                color: PALETTE.cream,
                fontFamily: 'Asap, system-ui, sans-serif',
                fontSize: 14.5,
                fontWeight: 600,
                letterSpacing: "0.04em",
                boxShadow: "0 8px 20px rgba(20, 18, 16, 0.18)",
              }}
            >
              {busySku === plan.sku ? "Redirecting…" : plan.cta}
            </button>
          </motion.div>
        );
      })}
    </div>
  );

  if (variant === "inline") {
    return (
      <section
        id="topup"
        className="relative px-4 md:px-8"
        style={{
          background: PALETTE.cream,
          paddingTop: "clamp(56px, 7vh, 96px)",
          paddingBottom: "clamp(72px, 9vh, 120px)",
          borderTop: `1px solid ${PALETTE.sand}`,
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 1100 }}>
          {showHeader && (
            <div className="text-center mb-12">
              <p style={eyebrow(PALETTE.earthMuted)}>Top up</p>
              <h2 style={{ ...display("clamp(30px, 4vw, 44px)"), color: PALETTE.ink, marginTop: 14, marginBottom: 14 }}>
                {heading}
              </h2>
              <p style={{ ...cormorantItalic("clamp(16px, 1.8vw, 19px)"), color: PALETTE.earth, maxWidth: 540, margin: "0 auto" }}>
                Generate as many as you like. Print only the favourites.
              </p>
              {generationsRemaining !== null && (
                <div
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{
                    background: PALETTE.cream2,
                    border: `1px solid ${PALETTE.sand}`,
                    fontFamily: 'Assistant, system-ui, sans-serif',
                    fontSize: 13,
                    color: PALETTE.earth,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: PALETTE.rose }} />
                  <strong style={{ color: PALETTE.ink }}>{generationsRemaining}</strong> generation{generationsRemaining === 1 ? "" : "s"} left
                  {tier && (
                    <span style={{ color: PALETTE.earthMuted, marginLeft: 6 }}>
                      · {tier === "elite" ? "Elite" : "Pass"} subscriber
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          {cards}
        </div>
      </section>
    );
  }

  // Default: full-page section variant (legacy bio-link entry; now mostly used inline on /portraits)
  return cards;
}
