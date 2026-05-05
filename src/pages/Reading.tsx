import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CosmicReportViewer } from "@/components/report/CosmicReportViewer";
import type { ReportContent } from "@/components/report/types";
import { ReportLoadingSkeleton } from "@/components/report/ReportSkeletons";
import { CosmicButton } from "@/components/cosmic/CosmicButton";

/**
 * /reading/<token> — Soul Reading viewer for the Shopify-fulfilled flow.
 *
 * Token is the URL-safe HMAC stored on soul_reading_jobs.viewer_token.
 * The customer hits this URL from their reading-ready email; we resolve
 * via /api/reading/<token> and render the same CosmicReportViewer used
 * by the existing direct-to-quiz flow.
 *
 * Status states (from /api/reading/[token].ts):
 *   - "ready"       → render CosmicReportViewer
 *   - "preparing"   → cosmic loader + auto-poll every pollIntervalMs (cap 10 min)
 *   - "error"       → friendly "reply to order email" CTA
 *   - "cancelled"   → friendly cancellation copy
 *   - "not_found" / 404 → "this link doesn't appear to be valid"
 *   - "server_error" → retry button
 *
 * Source of truth:
 *   • [[research-2026-05-04-soul-reading-fulfilment]] §5 (viewer page spec)
 *   • [[launch-plan-2026-05-05]] Phase 6
 */

type ApiStatus = "preparing" | "ready" | "error" | "cancelled" | "not_found" | "server_error";

interface ApiPayload {
  status: ApiStatus;
  petName?: string;
  petDob?: string;
  petBirthLocation?: string;
  message?: string;
  pollIntervalMs?: number;
  reading?: ReportContent;
  reportId?: string;
  shareToken?: string;
  petPhotoUrl?: string;
  portraitUrl?: string;
  occasionMode?: string;
  species?: string;
  breed?: string;
  gender?: string;
}

const POLL_CAP_MS = 10 * 60 * 1000; // stop polling after 10 minutes

export default function Reading() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ApiPayload | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollStartRef = useRef<number>(Date.now());

  const fetchOnce = async (): Promise<ApiPayload | null> => {
    if (!token) return null;
    try {
      const r = await fetch(`/api/reading/${encodeURIComponent(token)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "omit",
        cache: "no-store",
      });
      setHttpStatus(r.status);
      const json = (await r.json().catch(() => null)) as ApiPayload | null;
      return json;
    } catch (err) {
      // Network error — let caller decide whether to retry.
      console.error("[Reading] fetch failed:", (err as Error).message);
      setError("Could not reach the server. Check your connection and try again.");
      return null;
    }
  };

  // Initial load + polling loop.
  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      setLoading(true);
      setError(null);
      const json = await fetchOnce();
      if (cancelled) return;
      setLoading(false);

      if (!json) return; // network error already set

      setData(json);

      // Schedule next poll if status is still "preparing" and we're under the 10-min cap.
      if (json.status === "preparing") {
        const elapsed = Date.now() - pollStartRef.current;
        if (elapsed < POLL_CAP_MS) {
          const interval = Math.max(15_000, Math.min(json.pollIntervalMs ?? 30_000, 60_000));
          pollTimer = setTimeout(() => {
            if (!cancelled) tick();
          }, interval);
        }
      }
    };

    pollStartRef.current = Date.now();
    tick();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ─── Head tags (every state) ────────────────────────────────────────────
  const petName = data?.petName ?? "Your Pet";
  const head = (
    <Helmet>
      <title>{`${petName}'s Soul Reading · Little Souls`}</title>
      <meta
        name="description"
        content={`A personalised astrological reading for ${petName}, decoded from the moment they came into the world.`}
      />
      {/* Personalised + private. Never index. */}
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
      <meta property="og:title" content={`${petName}'s Soul Reading · Little Souls`} />
      <meta property="og:description" content="A personalised soul reading by Little Souls." />
      <meta property="og:site_name" content="Little Souls" />
      <meta property="og:url" content="https://littlesouls.app" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
    </Helmet>
  );

  // ─── 1. Initial load (no data yet) ───────────────────────────────────────
  if (loading && !data) {
    return (
      <>
        {head}
        <ReportLoadingSkeleton />
      </>
    );
  }

  // ─── 2. Network error before any data arrived ────────────────────────────
  if (!data && error) {
    return (
      <>
        {head}
        <ErrorState
          title="Could not load your reading"
          message={error}
          ctaLabel="Try again"
          onCta={() => {
            setError(null);
            setLoading(true);
            fetchOnce().then((json) => {
              setLoading(false);
              if (json) setData(json);
            });
          }}
        />
      </>
    );
  }

  // ─── 3. Server returned a payload ────────────────────────────────────────
  if (data) {
    if (data.status === "not_found" || httpStatus === 404) {
      return (
        <>
          {head}
          <NotFoundState />
        </>
      );
    }

    if (data.status === "server_error") {
      return (
        <>
          {head}
          <ErrorState
            title="We hit a snag"
            message={data.message ?? "Could not load your reading. Please try again shortly."}
            ctaLabel="Try again"
            onCta={() => {
              setLoading(true);
              fetchOnce().then((json) => {
                setLoading(false);
                if (json) setData(json);
              });
            }}
          />
        </>
      );
    }

    if (data.status === "preparing") {
      return (
        <>
          {head}
          <PreparingState petName={data.petName ?? "your pet"} message={data.message} />
        </>
      );
    }

    if (data.status === "error") {
      return (
        <>
          {head}
          <ErrorState
            title="Reading not available"
            message={data.message ?? "Something went wrong. Please reply to your order email."}
            ctaLabel="Reply to order email"
            ctaHref="mailto:hello@littlesouls.app?subject=My Soul Reading"
            tone="rose"
          />
        </>
      );
    }

    if (data.status === "cancelled") {
      return (
        <>
          {head}
          <ErrorState
            title="This reading was cancelled"
            message={data.message ?? "If this is a mistake, reply to your order email and we'll sort it."}
            ctaLabel="Reply to order email"
            ctaHref="mailto:hello@littlesouls.app?subject=My Soul Reading"
            tone="rose"
          />
        </>
      );
    }

    if (data.status === "ready" && data.reading) {
      return (
        <>
          {head}
          <CosmicReportViewer
            petName={data.petName ?? "Your Pet"}
            report={data.reading as ReportContent}
            reportId={data.reportId}
            shareToken={data.shareToken}
            portraitUrl={data.portraitUrl}
            petPhotoUrl={data.petPhotoUrl}
            occasionMode={data.occasionMode ?? "discover"}
            species={data.species}
          />
        </>
      );
    }
  }

  // Last-resort fallback — shouldn't reach here.
  return (
    <>
      {head}
      <ErrorState
        title="Something unexpected happened"
        message="Please refresh the page or reply to your order email."
        ctaLabel="Refresh"
        onCta={() => window.location.reload()}
      />
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function PreparingState({ petName, message }: { petName: string; message?: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#FFFDF5" }}
    >
      <div className="max-w-md w-full text-center">
        <div className="relative mx-auto mb-8 w-24 h-24" aria-hidden="true">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(196,162,101,0.35), rgba(196,162,101,0))",
              animation: "soulReadingPulse 2.6s ease-in-out infinite",
            }}
          />
          <div
            className="absolute inset-3 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(165deg, #f5f0e0 0%, #ede5c8 100%)",
              border: "1px solid rgba(196,162,101,0.35)",
              boxShadow: "0 8px 32px rgba(196,162,101,0.22)",
            }}
          >
            <span style={{ fontSize: 32 }} role="img" aria-label="sparkles">
              ✦
            </span>
          </div>
        </div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#c4a265",
            margin: "0 0 12px 0",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          Little Souls
        </p>
        <h1
          style={{
            color: "#141210",
            fontSize: 28,
            fontWeight: 400,
            lineHeight: 1.3,
            margin: "0 0 16px 0",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          Preparing {petName}'s Soul Reading…
        </h1>
        <p style={{ color: "#5a4a42", fontSize: 16, lineHeight: 1.7, margin: "0 0 24px 0" }}>
          {message ?? "We're consulting the stars. This usually takes a few minutes — feel free to leave the page open or come back from your email."}
        </p>
        <p style={{ color: "#958779", fontSize: 13, fontStyle: "italic", margin: 0 }}>
          You'll also get an email the moment it's ready.
        </p>
        <style>{`
          @keyframes soulReadingPulse {
            0%, 100% { transform: scale(1); opacity: 0.55; }
            50%      { transform: scale(1.18); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  title: string;
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
  tone?: "rose" | "neutral";
}

function ErrorState({ title, message, ctaLabel, ctaHref, onCta, tone = "neutral" }: ErrorStateProps) {
  const iconBg = tone === "rose" ? "rgba(191,82,74,0.15)" : "rgba(196,162,101,0.15)";
  const iconBorder = tone === "rose" ? "rgba(191,82,74,0.3)" : "rgba(196,162,101,0.35)";
  const icon = tone === "rose" ? "♡" : "✦";

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#FFFDF5" }}>
      <div className="max-w-md w-full text-center">
        <div
          className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: iconBg,
            border: `1px solid ${iconBorder}`,
            color: tone === "rose" ? "#bf524a" : "#c4a265",
            fontSize: 28,
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
        <h1
          style={{
            color: "#141210",
            fontSize: 26,
            fontWeight: 400,
            lineHeight: 1.3,
            margin: "0 0 16px 0",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          {title}
        </h1>
        <p style={{ color: "#5a4a42", fontSize: 15, lineHeight: 1.7, margin: "0 0 28px 0" }}>{message}</p>
        {ctaLabel && (
          ctaHref ? (
            <a
              href={ctaHref}
              style={{
                display: "inline-block",
                background: "#bf524a",
                color: "#ffffff",
                textDecoration: "none",
                padding: "14px 32px",
                borderRadius: 50,
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: 0.4,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                boxShadow: "0 4px 16px rgba(191,82,74,0.25)",
              }}
            >
              {ctaLabel}
            </a>
          ) : (
            <CosmicButton onClick={onCta}>{ctaLabel}</CosmicButton>
          )
        )}
        <p style={{ color: "#958779", fontSize: 12, marginTop: 24 }}>
          Back to <Link to="/" style={{ color: "#5a4a42", textDecoration: "underline" }}>littlesouls.app</Link>
        </p>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#FFFDF5" }}>
      <div className="max-w-md w-full text-center">
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#c4a265",
            margin: "0 0 16px 0",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          Little Souls
        </p>
        <h1
          style={{
            color: "#141210",
            fontSize: 26,
            fontWeight: 400,
            lineHeight: 1.3,
            margin: "0 0 16px 0",
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          This link doesn't appear to be valid
        </h1>
        <p style={{ color: "#5a4a42", fontSize: 15, lineHeight: 1.7, margin: "0 0 28px 0" }}>
          Double-check the link in your reading-ready email, or reply to your order
          confirmation and we'll re-send the link to you.
        </p>
        <Link
          to="/"
          style={{
            display: "inline-block",
            background: "#bf524a",
            color: "#ffffff",
            textDecoration: "none",
            padding: "14px 32px",
            borderRadius: 50,
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: 0.4,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            boxShadow: "0 4px 16px rgba(191,82,74,0.25)",
          }}
        >
          Back to littlesouls.app
        </Link>
      </div>
    </div>
  );
}
