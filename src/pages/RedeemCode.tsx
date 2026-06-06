import { FormEvent, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Compass, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// What the reading reveals. Occasion is NOT asked here on purpose: the
// post-purchase intake asks it once (Screen 0), so asking it here too would
// double up the flow.
const INSIDE = [
  { icon: Sparkles, label: "Read from their real birth chart" },
  { icon: Compass, label: "Their nature, instincts and quirks" },
  { icon: Heart, label: "What the stars say about your bond" },
];

export default function RedeemCode() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlCode = searchParams.get("code")?.trim() ?? "";
  const hasUrlCode = Boolean(urlCode);

  const [code, setCode] = useState(urlCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const submitLabel = hasUrlCode ? "Unlock my free reading" : "Claim my free reading";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const redeemCode = code.trim();
    if (!redeemCode) {
      toast.error("Enter your invite code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-free-code", {
        body: { code: redeemCode },
      });
      if (error) throw error;

      const reportId = data?.report_id ?? data?.reportId ?? data?.report?.id;
      if (!reportId) throw new Error("Missing report id.");

      setIsSuccess(true);
      toast.success("Your free reading is unlocked.");
      navigate(
        `/payment-success?session_id=redeem_${reportId}&report_id=${reportId}&quick=true`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "We could not redeem that code.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="min-h-screen overflow-hidden px-5 py-6 text-[#f5efe6] sm:px-8 lg:px-10"
      style={{
        background:
          "radial-gradient(circle at 18% 18%, rgba(191, 82, 74, 0.24), transparent 28%), radial-gradient(circle at 78% 12%, rgba(212, 182, 122, 0.18), transparent 24%), #0d0a14",
      }}
    >
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.04fr_0.96fr]">
        {/* Hero */}
        <div className="relative flex min-h-[520px] items-center justify-center rounded-[28px] border border-[#d4b67a]/20 bg-[#f5efe6]/[0.035] p-6 shadow-2xl shadow-black/30 sm:p-10">
          <div className="absolute inset-5 rounded-[24px] border border-[#d4b67a]/10" />
          <div className="absolute left-10 top-10 h-2 w-2 rounded-full bg-[#d4b67a]" />
          <div className="absolute right-14 top-20 h-1.5 w-1.5 rounded-full bg-[#f5efe6]/70" />
          <div className="absolute bottom-20 left-16 h-1.5 w-1.5 rounded-full bg-[#bf524a]" />
          <div className="absolute bottom-12 right-20 h-2 w-2 rounded-full bg-[#d4b67a]/80" />

          <div className="relative grid place-items-center text-center">
            <div className="absolute h-[360px] w-[360px] rounded-full border border-[#d4b67a]/15" />
            <div className="absolute h-[270px] w-[270px] rounded-full border border-[#bf524a]/20" />
            <div className="absolute h-[200px] w-[200px] rounded-full bg-[#d4b67a]/[0.06] blur-2xl" />

            <div className="relative flex h-48 w-48 items-center justify-center rounded-full border border-[#d4b67a]/35 bg-[#0d0a14] shadow-[0_0_80px_rgba(212,182,122,0.22)]">
              <img
                src="/apple-touch-icon.png"
                alt="Little Souls"
                className="h-28 w-28 rounded-[32px] object-cover"
              />
            </div>

            <div className="relative mt-10 max-w-md">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#d4b67a]">
                Complimentary creator invite
              </p>
              <h1
                className="text-5xl leading-[0.95] text-[#f5efe6] sm:text-6xl lg:text-7xl"
                style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                Claim your free pet soul reading
              </h1>
              <p className="mx-auto mt-5 max-w-sm text-base leading-7 text-[#bcae9b]">
                Real astrology, mapped from your pet's birth chart.
              </p>
            </div>
          </div>
        </div>

        {/* Claim panel */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-[#d4b67a]/20 bg-[#0d0a14]/80 p-6 shadow-2xl shadow-black/35 backdrop-blur sm:p-8"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d4b67a]">
            Free reading
          </p>
          <h2
            className="mt-2 text-3xl leading-tight text-[#f5efe6] sm:text-4xl"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            A reading made for your pet
          </h2>

          <ul className="mt-7 space-y-4">
            {INSIDE.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d4b67a]/25 bg-[#d4b67a]/10">
                  <Icon className="h-5 w-5 text-[#d4b67a]" />
                </span>
                <span className="text-base text-[#f5efe6]">{label}</span>
              </li>
            ))}
          </ul>

          {hasUrlCode ? (
            <div className="mt-7 rounded-2xl border border-[#d4b67a]/20 bg-[#d4b67a]/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4b67a]">
                Invite code found
              </p>
              <p className="mt-1 text-lg font-semibold tracking-[0.18em] text-[#f5efe6]">
                {urlCode}
              </p>
            </div>
          ) : (
            <label className="mt-7 block">
              <span className="mb-2 block text-sm font-medium text-[#f5efe6]">Invite code</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Enter your code"
                className="h-14 w-full rounded-2xl border border-[#d4b67a]/25 bg-[#f5efe6]/[0.06] px-4 text-base font-semibold uppercase tracking-[0.16em] text-[#f5efe6] outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-[#9d8d7f]/70 focus:border-[#d4b67a] focus:ring-2 focus:ring-[#d4b67a]/20"
                autoComplete="off"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isSuccess}
            className="mt-7 h-14 w-full rounded-2xl bg-[#d4b67a] px-5 text-base font-bold text-[#0d0a14] shadow-[0_18px_48px_rgba(212,182,122,0.24)] transition hover:bg-[#e0c58d] disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isSuccess ? "Reading unlocked" : isSubmitting ? "Unlocking..." : submitLabel}
          </button>

          <p className="mt-4 text-center text-sm text-[#9d8d7f]">No payment needed.</p>
        </form>
      </section>
    </main>
  );
}
