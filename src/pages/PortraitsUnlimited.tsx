/**
 * /unlimited — premium subscription page (Pass / Elite / Pack).
 *
 * Cinematic hero, refined card stack, gold-seal hero plan, hairline trust strip.
 * Targets the high-intent paid-tier customer flow (TikTok / IG / YT bio links).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Check, Infinity as InfinityIcon, Zap, ShieldCheck } from "lucide-react";
import { PortraitsNav } from "@/components/portraits/PortraitsNav";
import { PortraitsFooter } from "@/components/portraits/PortraitsFooter";
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
    generations: "5 portraits",
    tagline: "Top up without committing.",
    features: [
      "5 generations · 4 variants each",
      "Credits never expire",
      "No subscription",
    ],
    cta: "Buy Pack",
    icon: Sparkles,
  },
  {
    sku: "pass",
    label: "Pass",
    price: "£8.99",
    cadence: "per month",
    generations: "25 portraits/mo",
    tagline: "Worth it after one print.",
    features: [
      "25 generations · 4 variants each",
      "All styles & themes",
      "Re-download anytime",
      "Cancel any time",
    ],
    cta: "Start Pass",
    recommended: true,
    icon: InfinityIcon,
  },
  {
    sku: "elite",
    label: "Elite",
    price: "£17.99",
    cadence: "per month",
    generations: "75 portraits/mo",
    tagline: "For serious portrait obsessives.",
    features: [
      "75 generations · 4 variants each",
      "Priority generation queue",
      "Freeform prompt details",
      "Re-download anytime",
      "Cancel any time",
    ],
    cta: "Start Elite",
    icon: Zap,
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

  const generationsRemaining = balance != null ? Math.floor(balance / 4) : null;

  return (
    <div
      style={{
        background: `radial-gradient(ellipse at top, ${PALETTE.cream} 0%, ${PALETTE.cream2} 60%, ${PALETTE.paper} 100%)`,
        minHeight: "100vh",
      }}
    >
      <PortraitsNav />

      <main className="pt-[88px] pb-24">
        <section className="px-5 md:px-8" style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* ── Cinematic hero ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE.out }}
            className="text-center mt-10 md:mt-16 mb-14 md:mb-20"
          >
            <p style={eyebrow(PALETTE.earthMuted)}>Unlimited AI Portraits</p>
            <h1
              style={{
                ...display("clamp(40px, 6vw, 64px)"),
                color: PALETTE.ink,
                marginTop: 18,
                marginBottom: 18,
              }}
            >
              Make portraits all day.<br />
              <span style={{ color: PALETTE.rose }}>Print the favourites.</span>
            </h1>
            <p
              className="mx-auto"
              style={{
                ...cormorantItalic("clamp(18px, 2.2vw, 22px)"),
                color: PALETTE.earth,
                maxWidth: 580,
              }}
            >
              Studio-as-toy. Print only what you love. Cancel any time.
            </p>

            {generationsRemaining !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-7 inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: PALETTE.cream,
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
              </motion.div>
            )}
          </motion.div>

          {/* ── Plan cards ───────────────────────────────────────────── */}
          <div className="grid md:grid-cols-3 gap-5 md:gap-6 items-stretch">
            {PLANS.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.sku}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: EASE.out }}
                  className="relative rounded-2xl p-7 md:p-8 flex flex-col"
                  style={{
                    background: PALETTE.cream,
                    border: plan.recommended
                      ? `1.5px solid ${PALETTE.rose}`
                      : `1px solid ${PALETTE.sand}`,
                    boxShadow: plan.recommended
                      ? `0 24px 56px rgba(191, 82, 74, 0.18), 0 4px 12px rgba(20, 18, 16, 0.04)`
                      : `0 16px 38px rgba(20, 18, 16, 0.06), 0 2px 6px rgba(20, 18, 16, 0.03)`,
                  }}
                >
                  {plan.recommended && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full"
                      style={{
                        background: PALETTE.rose,
                        color: PALETTE.cream,
                        fontFamily: 'Asap, system-ui, sans-serif',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        boxShadow: "0 6px 16px rgba(191, 82, 74, 0.32)",
                      }}
                    >
                      Most loved
                    </span>
                  )}

                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center mb-5"
                    style={{
                      background: plan.recommended ? PALETTE.roseSoft : PALETTE.cream2,
                      border: `1px solid ${plan.recommended ? "rgba(191, 82, 74, 0.18)" : PALETTE.sand}`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: plan.recommended ? PALETTE.rose : PALETTE.earth }} />
                  </div>

                  <h2 style={{ ...display("24px"), color: PALETTE.ink }}>{plan.label}</h2>

                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span style={{ ...tabularPrice("44px"), color: PALETTE.ink, fontWeight: 700 }}>
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
                      color: plan.recommended ? PALETTE.rose : PALETTE.earth,
                    }}
                  >
                    {plan.generations}
                  </p>

                  <p style={{ ...cormorantItalic("16px"), color: PALETTE.earth, marginTop: 14, lineHeight: 1.5 }}>
                    {plan.tagline}
                  </p>

                  <div
                    className="my-6"
                    style={{ height: 1, background: PALETTE.sand }}
                  />

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
                            color: plan.recommended ? PALETTE.rose : PALETTE.earthMuted,
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
                    className="mt-7 w-full rounded-xl py-3.5 transition-all disabled:opacity-50"
                    style={{
                      background: plan.recommended ? PALETTE.rose : PALETTE.ink,
                      color: PALETTE.cream,
                      fontFamily: 'Asap, system-ui, sans-serif',
                      fontSize: 14.5,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      boxShadow: plan.recommended
                        ? "0 10px 26px rgba(191, 82, 74, 0.32)"
                        : "0 8px 20px rgba(20, 18, 16, 0.18)",
                    }}
                  >
                    {busySku === plan.sku ? "Redirecting…" : plan.cta}
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* ── Trust strip ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-16 grid md:grid-cols-3 gap-5"
          >
            <Trust icon={ShieldCheck} label="Cancel any time" copy="Self-serve in your account, no support ticket needed." />
            <Trust icon={Check} label="UK VAT included" copy="Stripe Tax handles it automatically — what you see is what you pay." />
            <Trust icon={Sparkles} label="Worth it after one print" copy="Generate first. Print only what you love. Print pricing applies separately." />
          </motion.div>

          {/* ── Compare strip ────────────────────────────────────────── */}
          <div className="mt-12 mx-auto text-center" style={{ maxWidth: 640 }}>
            <p style={{ ...cormorantItalic("17px"), color: PALETTE.earth, lineHeight: 1.6 }}>
              All tiers print on the same museum-quality framed canvas. Subscriptions only cover unlimited <em>generations</em>; physical prints are sold separately at the canvas-size price.
            </p>
          </div>
        </section>
      </main>

      <PortraitsFooter />
    </div>
  );
}

function Trust({
  icon: Icon,
  label,
  copy,
}: {
  icon: typeof Sparkles;
  label: string;
  copy: string;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: PALETTE.cream,
        border: `1px solid ${PALETTE.sand}`,
        boxShadow: "0 6px 16px rgba(20, 18, 16, 0.04)",
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center mb-3"
        style={{
          background: PALETTE.cream2,
          border: `1px solid ${PALETTE.sand}`,
        }}
      >
        <Icon className="w-[18px] h-[18px]" style={{ color: PALETTE.rose }} />
      </div>
      <p style={{ fontFamily: 'Asap, system-ui, sans-serif', fontSize: 14.5, fontWeight: 600, color: PALETTE.ink }}>
        {label}
      </p>
      <p
        className="mt-1.5"
        style={{
          fontFamily: 'Assistant, system-ui, sans-serif',
          fontSize: 13,
          color: PALETTE.earthMuted,
          lineHeight: 1.55,
        }}
      >
        {copy}
      </p>
    </div>
  );
}
