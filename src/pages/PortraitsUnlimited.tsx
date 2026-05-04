/**
 * /unlimited — premium subscription page (Pass / Elite / Pack).
 *
 * Cinematic hero + shared <TopUpPlans> component (same plan cards used inline
 * on /portraits below the studio). Single source of truth for plan layout
 * and Stripe checkout wiring.
 */
import { motion } from "framer-motion";
import { Sparkles, Check, ShieldCheck } from "lucide-react";
import { PortraitsNav } from "@/components/portraits/PortraitsNav";
import { PortraitsFooter } from "@/components/portraits/PortraitsFooter";
import { TopUpPlans } from "@/components/portraits/TopUpPlans";
import { useCredits } from "@/components/portraits/useCredits";
import { PALETTE, display, cormorantItalic, eyebrow, EASE } from "@/components/portraits/tokens";

export default function PortraitsUnlimited() {
  const { balance, tier } = useCredits();
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

          {/* ── Plan cards (shared) ───────────────────────────────────── */}
          <TopUpPlans variant="section" showHeader={false} authRedirect="/unlimited" />

          {/* ── Trust strip ──────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-16 grid md:grid-cols-3 gap-5"
          >
            <Trust icon={ShieldCheck} label="Cancel any time" copy="Self-serve in your account, no support ticket needed." />
            <Trust icon={Check} label="UK VAT included" copy="Stripe Tax handles it automatically — what you see is what you pay." />
            <Trust icon={Sparkles} label="Worth it after one print" copy="Generate first. Print only what you love. Print pricing applies separately." />
          </motion.div>

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
