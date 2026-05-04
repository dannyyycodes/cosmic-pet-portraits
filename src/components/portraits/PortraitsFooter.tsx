/**
 * PortraitsFooter — page-specific outro band.
 *
 * Newsletter capture ("monthly soul letters") + small links + brand mark.
 * NOT the global site footer — this is a per-page closer that still leaves
 * a CTA on screen at the end of the scroll journey.
 */
import { useState } from "react";
import { PALETTE, display, cormorantItalic } from "./tokens";

export function PortraitsFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "err">("idle");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setStatus("err");
      return;
    }
    setStatus("submitting");
    // Phase 2: wire to Klaviyo / Supabase. For now we accept and confirm UI-only.
    setTimeout(() => setStatus("ok"), 350);
  };

  return (
    <footer
      className="relative px-6 md:px-10"
      style={{
        background: PALETTE.cosmos,
        color: PALETTE.cream,
        paddingTop: "clamp(80px, 10vh, 130px)",
        paddingBottom: "60px",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "1080px" }}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-start">
          <div className="md:col-span-7">
            <h2 style={{ ...display("clamp(28px, 3.4vw, 42px)"), color: PALETTE.cream }}>
              One letter a month.{" "}
              <span style={{ color: PALETTE.goldSoft, fontStyle: "italic" }}>
                No noise.
              </span>
            </h2>
            <p style={{ ...cormorantItalic("18px"), color: "#bdb0a3", marginTop: "12px" }}>
              New character worlds, behind-the-scenes from the studio, the occasional cosmic
              note about your pet's sign of the moon. Unsubscribe in one click.
            </p>

            <form
              onSubmit={onSubmit}
              className="mt-7 flex flex-col sm:flex-row gap-3 max-w-[480px]"
            >
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status !== "idle") setStatus("idle");
                }}
                placeholder="your@email.com"
                aria-label="Email address"
                className="flex-1 rounded-full px-5 py-3 transition-all"
                style={{
                  background: "rgba(245, 239, 230, 0.08)",
                  color: PALETTE.cream,
                  border: "1px solid rgba(196, 162, 101, 0.32)",
                  fontSize: "15px",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={status === "submitting" || status === "ok"}
                className="rounded-full px-6 py-3 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{
                  background: PALETTE.goldSoft,
                  color: PALETTE.cosmos,
                  fontSize: "15px",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                }}
              >
                {status === "ok" ? "Welcome ✦" : status === "submitting" ? "Sending…" : "Subscribe"}
              </button>
            </form>
            {status === "err" && (
              <p style={{ marginTop: "10px", fontSize: "13px", color: "#e8a59f" }}>
                That email looks off — try again?
              </p>
            )}
          </div>

          <nav className="md:col-span-5 grid grid-cols-2 gap-y-3 gap-x-8" aria-label="Page links">
            <a href="/contact" className="ls-link" style={{ color: "#c9b9ad" }}>
              Contact
            </a>
            <a href="#faq" className="ls-link" style={{ color: "#c9b9ad" }}>
              FAQ
            </a>
            <a href="/privacy" className="ls-link" style={{ color: "#c9b9ad" }}>
              Privacy
            </a>
            <a href="/terms" className="ls-link" style={{ color: "#c9b9ad" }}>
              Terms
            </a>
            <a href="https://instagram.com/littlesoulsapp" rel="noopener noreferrer" target="_blank" className="ls-link" style={{ color: "#c9b9ad" }}>
              Instagram
            </a>
            <a href="https://pinterest.com/littlesoulsapp" rel="noopener noreferrer" target="_blank" className="ls-link" style={{ color: "#c9b9ad" }}>
              Pinterest
            </a>
          </nav>
        </div>

        <div
          className="mt-16 pt-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(196, 162, 101, 0.18)" }}
        >
          <p style={{ ...cormorantItalic("16px"), color: PALETTE.goldSoft }}>
            ✦ &nbsp;Little Souls &nbsp;✦
          </p>
          <p style={{ fontSize: "12.5px", color: "#7a6e62", letterSpacing: "0.05em" }}>
            © {new Date().getFullYear()} Little Souls · Printed locally · Hand-finished · Built with love
          </p>
        </div>
      </div>
    </footer>
  );
}
