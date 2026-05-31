/**
 * /reading/intake/:token — magic-link Soul Reading intake page.
 *
 * Customer arrives here from the intake-request email after buying a Soul
 * Reading via the cart's "Quick add (fill in later)" option. Page validates
 * the token, presents the same intake form (pet name + DOB + birth location)
 * that used to live in the cart upsell, and submits to
 * /api/soul-reading?action=submit-intake. On success → /reading/<token>
 * (the existing viewer route which will show the reading once n8n completes).
 *
 * Token gating prevents random URLs from triggering reading generation.
 * Re-submission is rejected server-side (410 already-submitted).
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

type LoadState = "loading" | "ready" | "already-submitted" | "invalid" | "error";

export default function SoulReadingIntake() {
  const { token: tokenParam } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const token = (tokenParam ?? "").trim();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [petName, setPetName] = useState("");
  const [petDob, setPetDob] = useState("");
  const [petBirthLocation, setPetBirthLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Validate the token on mount.
  useEffect(() => {
    if (!token) {
      setLoadState("invalid");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/soul-reading?action=intake-status&token=${encodeURIComponent(token)}`);
        if (cancelled) return;
        if (r.status === 200) {
          setLoadState("ready");
        } else if (r.status === 410) {
          setLoadState("already-submitted");
        } else if (r.status === 404 || r.status === 400) {
          setLoadState("invalid");
        } else {
          setLoadState("error");
        }
      } catch {
        if (!cancelled) setLoadState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Today + 60 years ago for the DOB input bounds.
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const minDobIso = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 60);
    return d.toISOString().slice(0, 10);
  }, []);

  async function handleSubmit() {
    setErrorMsg(null);
    if (!petName.trim()) return setErrorMsg("Please enter your pet's name.");
    if (!petDob) return setErrorMsg("Please enter your pet's date of birth.");
    if (!petBirthLocation.trim()) return setErrorMsg("Please enter where they were born.");
    setSubmitting(true);
    try {
      const r = await fetch("/api/soul-reading?action=submit-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          petName: petName.trim(),
          petDob,
          petBirthLocation: petBirthLocation.trim(),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErrorMsg(data?.error ?? `Submit failed (${r.status})`);
        setSubmitting(false);
        return;
      }
      // Success — n8n is generating. Redirect to the viewer; it will show a
      // "still generating" placeholder until n8n completes.
      navigate(`/reading/${encodeURIComponent(token)}`);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Your pet's details · Little Souls</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <main
        className="min-h-screen"
        style={{
          background: "#0d0a14",
          paddingTop: "clamp(56px, 9vh, 100px)",
          paddingBottom: "clamp(80px, 12vh, 160px)",
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 480 }}>
          <p
            className="text-center"
            style={{
              fontFamily: "Lato, system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#d4b67a",
              margin: 0,
              marginBottom: 28,
            }}
          >
            Little Souls
          </p>

          <section
            className="rounded-3xl px-6 py-9"
            style={{
              background: "rgba(245,239,230,0.05)",
              border: `1px solid rgba(212,182,122,0.22)`,
              boxShadow: "0 16px 40px rgba(20, 18, 16, 0.06)",
            }}
          >
            {loadState === "loading" && (
              <p className="text-center" style={{ color: "#9d8d7f", fontFamily: "\"Playfair Display\", Georgia, serif" }}>
                Looking up your order…
              </p>
            )}

            {loadState === "invalid" && (
              <>
                <h1 style={titleStyle}>This link isn't valid</h1>
                <p style={bodyStyle}>
                  We couldn't find your reading. Check the link in your email is complete —
                  the magic link is long and sometimes wraps across lines.
                </p>
              </>
            )}

            {loadState === "already-submitted" && (
              <>
                <h1 style={titleStyle}>You're all set ✦</h1>
                <p style={bodyStyle}>
                  Your pet's details are already with us. Your reading should land in your
                  inbox shortly — usually within an hour.
                </p>
                <button
                  onClick={() => navigate(`/reading/${encodeURIComponent(token)}`)}
                  style={primaryButtonStyle}
                >
                  Check on my reading →
                </button>
              </>
            )}

            {loadState === "error" && (
              <>
                <h1 style={titleStyle}>Something went wrong</h1>
                <p style={bodyStyle}>
                  We couldn't load your reading right now. Refresh the page in a minute, or
                  reply to your order email and we'll sort it for you.
                </p>
              </>
            )}

            {loadState === "ready" && (
              <>
                <p
                  style={{
                    fontFamily: "Lato, system-ui, sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#d4b67a",
                    margin: "0 0 12px 0",
                  }}
                >
                  Tell us about your pet
                </p>
                <h1 style={titleStyle}>Three quick details ✦</h1>
                <p style={bodyStyle}>
                  Their name, when they came into your life, and where. We'll generate your
                  reading and email it to you — usually within an hour.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  className="mt-4"
                >
                  <Field
                    label="Pet name"
                    value={petName}
                    onChange={setPetName}
                    placeholder="e.g. Bella"
                    maxLength={40}
                    autoFocus
                  />
                  <Field
                    label="Date of birth (best guess is fine)"
                    type="date"
                    value={petDob}
                    onChange={setPetDob}
                    max={todayIso}
                    min={minDobIso}
                  />
                  <Field
                    label="Where were they born or first found?"
                    value={petBirthLocation}
                    onChange={setPetBirthLocation}
                    placeholder="e.g. Bristol, UK"
                    maxLength={200}
                  />

                  {errorMsg && (
                    <p
                      style={{
                        color: "#f0d99f",
                        fontFamily: "Lato, system-ui, sans-serif",
                        fontSize: 13,
                        margin: "0 0 10px 0",
                      }}
                    >
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ ...primaryButtonStyle, opacity: submitting ? 0.6 : 1 }}
                  >
                    {submitting ? "Sending…" : "Generate my reading →"}
                  </button>
                  <p
                    style={{
                      textAlign: "center",
                      fontFamily: "Lato, system-ui, sans-serif",
                      fontSize: 12,
                      color: "#9d8d7f",
                      marginTop: 12,
                      marginBottom: 0,
                    }}
                  >
                    Your details stay with us — never shared.
                  </p>
                </form>
              </>
            )}
          </section>

          <p
            className="text-center mt-8"
            style={{
              fontFamily: "Lato, system-ui, sans-serif",
              fontSize: 13,
              color: "#9d8d7f",
            }}
          >
            Questions? Reply to your order email — a real person reads them.
          </p>
        </div>
      </main>
    </>
  );
}

const titleStyle: React.CSSProperties = {
  fontFamily: "\"Playfair Display\", Georgia, serif",
  fontSize: "clamp(24px, 4vw, 32px)",
  fontWeight: 500,
  color: "#f5efe6",
  margin: "0 0 14px 0",
  lineHeight: 1.25,
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "\"Playfair Display\", Georgia, serif",
  fontSize: 15,
  lineHeight: 1.7,
  color: "#cfc1b1",
  margin: "0 0 22px 0",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "#d4b67a",
  color: "#141210",
  fontFamily: "Lato, system-ui, sans-serif",
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: "0.02em",
  border: "none",
  borderRadius: 999,
  padding: "14px 22px",
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(212, 182, 122, 0.28)",
};

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  maxLength?: number;
  autoFocus?: boolean;
  max?: string;
  min?: string;
}

function Field({ label, value, onChange, placeholder, type = "text", maxLength, autoFocus, max, min }: FieldProps) {
  return (
    <label className="block mb-3">
      <span
        style={{
          fontFamily: "Lato, system-ui, sans-serif",
          fontSize: 10.5,
          fontWeight: 700,
          color: "#9d8d7f",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        max={max}
        min={min}
        className="w-full px-3 py-2.5 rounded-lg"
        style={{
          background: "rgba(5,4,7,0.6)",
          border: `1px solid rgba(212,182,122,0.34)`,
          fontFamily: "Lato, system-ui, sans-serif",
          fontSize: 15,
          color: "#f5efe6",
          colorScheme: "dark",
        }}
      />
    </label>
  );
}
