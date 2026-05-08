/**
 * /share/thanks — confirmation screen after a UGC photo has been submitted.
 *
 * Sacred copy:
 *   • No "report" word.
 *   • No reference to AI.
 *   • Transformation framing — they joined a community, not "uploaded a file".
 *
 * The submission sits as `pending` in ugc_submissions until the moderation
 * team flips it to `approved`; the n8n workflow then picks it up on the
 * next M/W/F 09:00 cron.
 */
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";

const PALETTE = {
  cream: "#FFFDF5",
  cream2: "#faf4e8",
  rose: "#bf524a",
  gold: "#c4a265",
  ink: "#141210",
  ink2: "#3d2f2a",
  body: "#5a4a42",
  muted: "#958779",
  sand: "#e8ddd0",
} as const;

export default function ShareThanks() {
  return (
    <>
      <Helmet>
        <title>Thank you — Little Souls</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <main style={{ background: PALETTE.cream, minHeight: "100vh", color: PALETTE.body }}>
        <div className="max-w-xl mx-auto px-4 py-20 md:py-28 text-center">
          <p
            className="text-xs uppercase tracking-[0.18em] mb-6"
            style={{ color: PALETTE.gold, fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}
          >
            Pawtraits · A community of souls
          </p>

          <h1
            className="text-3xl md:text-4xl mb-6"
            style={{
              fontFamily: "Georgia, 'DM Serif Display', serif",
              color: PALETTE.ink,
              fontWeight: 400,
              letterSpacing: "-0.01em",
            }}
          >
            Thank you for letting us hold their story.
          </h1>

          <Card
            className="p-8 md:p-10 text-left"
            style={{
              background: "white",
              border: `1px solid ${PALETTE.sand}`,
            }}
          >
            <p style={{ fontFamily: "Georgia, serif", fontSize: 18, lineHeight: 1.7, color: PALETTE.ink2 }}>
              Your photo is with our team now. We read every one ourselves before anything goes near the public channels — that part is on us.
            </p>
            <p
              className="mt-4"
              style={{ fontFamily: "Georgia, serif", fontSize: 17, lineHeight: 1.7, color: PALETTE.body }}
            >
              When it&apos;s their turn, you&apos;ll see them on our community feeds with first-name credit only. No AI, no surname, no inbox spam.
            </p>
            <p
              className="mt-4 italic"
              style={{ fontFamily: "Georgia, serif", fontSize: 16, lineHeight: 1.7, color: PALETTE.muted }}
            >
              Change your mind, anytime. Email <a href="mailto:consent@littlesouls.app" style={{ color: PALETTE.rose }}>consent@littlesouls.app</a> — we aim to take the photo down within thirty days.
            </p>
          </Card>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-block rounded-md px-6 py-3 text-sm"
              style={{
                background: PALETTE.rose,
                color: PALETTE.cream,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textDecoration: "none",
              }}
            >
              Back to littlesouls.app
            </Link>
            <Link
              to="/account"
              className="inline-block px-6 py-3 text-sm underline"
              style={{
                color: PALETTE.ink2,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              See your account
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
