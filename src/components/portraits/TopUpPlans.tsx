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
    label: "Business Runner",
    price: "£17.99",
    cadence: "per month",
    generations: "75 pawtraits/mo",
    tagline: "Built for creators and resellers.",
    features: [
      "75 full-size pawtraits per month",
      "Priority generation queue",
      "Freeform prompt details",
      "Re-download anytime",
      "Cancel any time",
    ],
    cta: "Start Business",
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
  heading = "Need more pawtraits?",
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
        @keyframes topupBandDrift {
          0%   { background-position: 30% 35%; }
          100% { background-position: 70% 65%; }
        }
        @keyframes topupCtaDrift {
          0%   { background-position: 25% 50%; }
          100% { background-position: 75% 50%; }
        }
        .topup-hero-bg {
          animation: topupBandDrift 28s ease-in-out infinite alternate;
          transition: filter 0.6s ease, transform 0.7s cubic-bezier(.2,.7,.2,1);
          background-size: 130% auto;
        }
        .topup-cta-bg {
          animation: topupCtaDrift 20s ease-in-out infinite alternate;
          transition: filter 0.5s ease;
          background-size: 180% auto;
        }
        .topup-cta-shine {
          background-position: -120% 0;
          transition: background-position 1.2s cubic-bezier(.4,.1,.4,1);
        }
        .topup-rule-line {
          flex: 0 0 28px;
          height: 1px;
          transition: flex-basis 0.6s cubic-bezier(.2,.7,.2,1);
        }
        .topup-card:hover .topup-hero-bg { filter: saturate(1.15); transform: scale(1.04); }
        .topup-card:hover .topup-rule-line { flex-basis: 56px; }
        .topup-cta-marble:hover .topup-cta-bg { filter: saturate(1.4) brightness(1.05); transform: scale(1.06); }
        .topup-cta-marble:hover .topup-cta-shine { background-position: 220% 0; }
        .topup-cta-bg { transform-origin: center; }
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
            {/* Marble hero band — fills top of card, fades to white above the price */}
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden"
              style={{
                height: 220,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }}
            >
              <div
                className="topup-hero-bg absolute inset-0"
                style={{
                  backgroundImage: `url(/pawtraits/topup-${plan.sku}-text.webp?v=3)`,
                  backgroundPosition: "center",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.55) 75%, rgba(255,255,255,0.95) 92%, rgba(255,255,255,1) 100%)",
                }}
              />
            </div>

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

            <div className="relative z-10 flex flex-col flex-1">

            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
              style={{
                background: PALETTE.cream2,
                border: `1px solid ${PALETTE.sand}`,
                boxShadow: "0 2px 8px rgba(20,18,16,0.06)",
              }}
            >
              <Icon className="w-5 h-5" style={{ color: PALETTE.earth }} />
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

            {/* Ornamented gold rule */}
            <div className="flex items-center gap-1.5 mt-1 mb-3">
              <span
                className="topup-rule-line"
                style={{
                  background: `linear-gradient(90deg, ${PALETTE.goldDeep}, ${PALETTE.gold})`,
                }}
              />
              <span
                aria-hidden
                style={{
                  width: 5,
                  height: 5,
                  background: PALETTE.gold,
                  transform: "rotate(45deg)",
                  boxShadow: "0 0 0 1px rgba(196,162,101,0.3)",
                }}
              />
              <span
                className="topup-rule-line"
                style={{
                  background: `linear-gradient(90deg, ${PALETTE.gold}, ${PALETTE.goldDeep})`,
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
              className="topup-cta-marble relative overflow-hidden mt-7 w-full rounded-xl py-3.5 transition-all disabled:opacity-50"
              style={{
                boxShadow: plan.recommended
                  ? "0 10px 26px rgba(191, 82, 74, 0.32)"
                  : "0 8px 20px rgba(20, 18, 16, 0.18)",
                isolation: "isolate",
              }}
            >
              <div
                aria-hidden
                className="topup-cta-bg absolute inset-0"
                style={{
                  backgroundImage: `url(/pawtraits/topup-${plan.sku}-text.webp?v=3)`,
                  backgroundPosition: "center",
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(20,18,16,0.10) 0%, rgba(20,18,16,0.45) 100%)",
                }}
              />
              <div
                aria-hidden
                className="topup-cta-shine absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(110deg, transparent 30%, rgba(255,250,235,0.55) 50%, transparent 70%)",
                  backgroundSize: "220% 100%",
                  mixBlendMode: "screen",
                }}
              />
              <span
                className="relative z-10"
                style={{
                  color: PALETTE.cream,
                  fontFamily: 'Asap, system-ui, sans-serif',
                  fontSize: 14.5,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textShadow: "0 1px 3px rgba(20,18,16,0.85), 0 0 8px rgba(20,18,16,0.6)",
                }}
              >
                {busySku === plan.sku ? "Redirecting…" : plan.cta}
              </span>
            </button>
            </div>
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
