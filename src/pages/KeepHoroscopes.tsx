import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Stars, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * KeepHoroscopes — gift-trial → paid conversion landing page.
 *
 * Visitor lands here from a reminder email (week 3 or week 4 of their
 * 28-day gift horoscope trial). The URL token is the
 * horoscope_subscriptions row id; start-recipient-horoscope-sub does
 * the validation + creates a NEW Stripe customer using the recipient's
 * email so the recipient's card gets billed, never the original gifter's.
 *
 * After Stripe checkout, recipient is redirected back here with
 * ?status=success or ?status=cancelled. Webhook updates the local sub
 * row with the new stripe_subscription_id + clears trial_ends_at, so
 * the weekly batch keeps sending forever (until they cancel).
 */
const C = {
  cream: "#FFFDF5",
  ink: "#141210",
  earth: "#5a4a42",
  rose: "#bf524a",
  gold: "#c4a265",
  sand: "#e8ddd0",
  muted: "#958779",
};

export default function KeepHoroscopes() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!subscriptionId) return;
    setError(null);
    setIsLoading(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "start-recipient-horoscope-sub",
        { body: { subscriptionId } },
      );
      if (invokeError) throw invokeError;
      if (data?.alreadySubscribed) {
        setError("You're already subscribed — your horoscopes will keep arriving.");
        setIsLoading(false);
        return;
      }
      if (data?.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (e) {
      console.error("[KeepHoroscopes]", e);
      setError("Something went wrong. Please try again or email hello@littlesouls.app.");
      setIsLoading(false);
    }
  };

  // Auto-trigger on mount only if no Stripe-redirect status param is set.
  // We DON'T auto-trigger because that would steal the user's first
  // chance to read what they're signing up for.
  useEffect(() => {
    document.title = "Keep their cosmic guidance — Little Souls";
  }, []);

  if (status === "success") {
    return (
      <Shell>
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <CheckCircle style={{ width: 56, height: 56, color: C.rose, margin: "0 auto 16px" }} />
          <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(1.8rem, 6vw, 2.4rem)", color: C.ink, lineHeight: 1.1, marginBottom: 14 }}>
            Their stars keep arriving.
          </h1>
          <p style={{ fontFamily: "Cormorant, Georgia, serif", fontSize: "1.05rem", color: C.earth, lineHeight: 1.55, marginBottom: 24, maxWidth: 380, margin: "0 auto 24px" }}>
            Your card is on file. Next horoscope drops Sunday. Cancel anytime in two clicks from any horoscope email.
          </p>
          <Link to="/" style={{ display: "inline-block", padding: "12px 28px", background: C.rose, color: "#fff", borderRadius: 50, textDecoration: "none", fontFamily: "Cormorant, Georgia, serif", fontWeight: 700, letterSpacing: "0.04em" }}>
            Back to Little Souls
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 50, background: "rgba(196,162,101,0.12)", border: `1px solid rgba(196,162,101,0.25)`, marginBottom: 20 }}>
          <Stars style={{ width: 13, height: 13, color: C.gold }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.gold, letterSpacing: "0.16em" }}>YOUR FREE MONTH IS ENDING</span>
        </div>

        <h1 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: "clamp(2rem, 7vw, 2.8rem)", color: C.ink, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 18 }}>
          Keep their cosmic guidance arriving every week.
        </h1>

        <p style={{ fontFamily: "Cormorant, Georgia, serif", fontStyle: "italic", color: C.earth, fontSize: "clamp(1.05rem, 3.4vw, 1.18rem)", lineHeight: 1.55, marginBottom: 26, maxWidth: 440, margin: "0 auto 26px" }}>
            The free month came with the gift. After that, weekly horoscopes are £4.99/month — billed to your card, not the gifter's.
        </p>

        {status === "cancelled" && (
          <p style={{ fontFamily: "Cormorant, Georgia, serif", color: C.muted, fontSize: "0.92rem", marginBottom: 18 }}>
            No worries — you can come back anytime before your trial ends.
          </p>
        )}

        {error && (
          <p style={{ fontFamily: "Cormorant, Georgia, serif", color: C.rose, fontSize: "0.95rem", marginBottom: 18 }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubscribe}
          disabled={isLoading}
          style={{
            display: "inline-block",
            padding: "16px 40px",
            background: isLoading ? C.muted : C.rose,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            fontFamily: "Cormorant, Georgia, serif",
            fontSize: "1.05rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: isLoading ? "wait" : "pointer",
            boxShadow: "0 4px 24px rgba(191,82,74,0.25)",
            minHeight: 56,
            minWidth: 240,
          }}
        >
          {isLoading ? "Taking you to checkout…" : "Add card · Keep them coming"}
        </button>

        <p style={{ fontFamily: "Cormorant, Georgia, serif", color: C.muted, fontSize: "0.84rem", marginTop: 18, lineHeight: 1.5 }}>
          £4.99/month · Cancel anytime, two clicks · Card billed in your name
        </p>

        <ul style={{ listStyle: "none", padding: 0, margin: "32px auto 0", maxWidth: 380, textAlign: "left" }}>
          {[
            "Weekly cosmic guidance, written for them — every Sunday",
            "Their year ahead, transit by transit",
            "Pause or cancel anytime from any email — no calls, no forms",
          ].map((line, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", color: C.earth, fontFamily: "Cormorant, Georgia, serif", fontSize: "0.95rem", lineHeight: 1.5 }}>
              <span style={{ color: C.gold, fontSize: "1.05rem", lineHeight: 1, marginTop: 1 }}>✦</span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: C.cream, fontFamily: "Cormorant, Georgia, serif", padding: "32px 16px 60px" }}>
      <div style={{ maxWidth: 540, margin: "0 auto" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.muted, textDecoration: "none", fontSize: "0.85rem", marginBottom: 28 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back
        </Link>
        <div style={{ background: "rgba(255,253,245,0.92)", border: `1px solid ${C.sand}`, borderRadius: 24, padding: "40px 28px 36px", boxShadow: "0 10px 36px rgba(31,28,24,0.06)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
