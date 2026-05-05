/**
 * Reading-ready email template — sent by the Phase 7 droplet worker
 * (`/opt/littlesouls/worker.ts` on 159.65.169.204) immediately after the
 * Soul Reading is generated and `soul_reading_jobs.status = 'generated'`.
 *
 * This file is the SOURCE OF TRUTH for the Shopify-flow reading-ready
 * email. The worker imports it via `scp` + a tiny Deno-compatible shim,
 * OR copy-pastes the rendered output into a Resend send. Either way, the
 * brand styling is locked here so any future tweak ships in one place.
 *
 * Brand parity:
 *   - Cream background #FFFDF5, rose CTA #bf524a, gold accent #c4a265
 *   - Heading ink #141210, body warm #5a4a42, muted #958779
 *   - Sand border #e8ddd0, cream2 inner #faf4e8
 *   - Georgia serif for body, system-ui for CTA + labels
 *   - Same shape as the existing send-report-email function (variant-c palette).
 *
 * Plain-text fallback included — Gmail and Outlook show it when HTML is
 * stripped, and it's required for spam-score parity.
 *
 * Source of truth:
 *   • [[research-2026-05-04-soul-reading-fulfilment]] §5.2 (email content)
 *   • [[launch-plan-2026-05-05]] Phase 7 (transactional flows)
 */

export interface ReadingReadyEmailInput {
  petName: string;
  /** Pre-built `https://littlesouls.app/reading/<token>` URL (already includes the token). */
  readingUrl: string;
  /** Optional pet photo (square crop) — circle-framed in the email if present. */
  petPhotoUrl?: string;
  /** Optional sun sign for the kicker line ("A Leo Soul"). */
  sunSign?: string;
  /** Site base for unsubscribe / footer links. Defaults to https://littlesouls.app */
  siteBaseUrl?: string;
}

export interface ReadingReadyEmail {
  subject: string;
  from: string;
  replyTo: string;
  html: string;
  text: string;
}

const DEFAULT_SITE = "https://littlesouls.app";
const FROM_ADDRESS = "Little Souls <hello@littlesouls.app>";
const REPLY_TO_ADDRESS = "hello@littlesouls.app";

export function renderReadingReadyEmail(input: ReadingReadyEmailInput): ReadingReadyEmail {
  const petName = (input.petName ?? "your pet").trim() || "your pet";
  const readingUrl = input.readingUrl;
  const petPhotoUrl = input.petPhotoUrl;
  const sunSign = input.sunSign;
  const site = (input.siteBaseUrl ?? DEFAULT_SITE).replace(/\/$/, "");

  const subject = `${petName}'s Soul Reading is ready ✦`;

  const photoBlock = petPhotoUrl
    ? `
      <div style="margin: 0 auto 24px; width: 120px; height: 120px;">
        <img src="${escapeAttr(petPhotoUrl)}" alt="${escapeAttr(petName)}" width="120" height="120" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #c4a265; box-shadow: 0 0 0 6px rgba(196,162,101,0.12), 0 8px 24px rgba(196,162,101,0.15);" />
      </div>`
    : `<p style="font-size: 40px; margin: 0 0 16px 0; line-height: 1;">&#10024;</p>`;

  const kicker = sunSign ? `A ${escapeHtml(sunSign)} Soul` : "Your Soul Reading is Ready";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF5; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">

    <!-- Brand header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c4a265; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

    <!-- Main card -->
    <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e8ddd0; padding: 40px 28px; text-align: center; box-shadow: 0 4px 20px rgba(35,40,30,0.06);">
      ${photoBlock}

      <p style="font-size: 11px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: #c4a265; margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        ${kicker}
      </p>

      <h1 style="color: #141210; font-size: 28px; font-weight: 400; margin: 0 0 18px 0; line-height: 1.3; font-family: Georgia, 'Times New Roman', serif;">
        ${escapeHtml(petName)}'s Soul Reading
      </h1>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 12px 0;">
        We took the moment ${escapeHtml(petName)} arrived in this world, asked the stars
        what they had to say, and the answer moved us. We poured everything into this reading
        — and we hope it moves you too.
      </p>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 28px 0;">
        Your reading is waiting whenever you're ready to read it.
      </p>

      <!-- Primary CTA — rose, matches landing page -->
      <div style="margin: 28px 0;">
        <a href="${escapeAttr(readingUrl)}"
           style="display: inline-block; background: #bf524a; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 50px; font-weight: 600; font-size: 15px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 0.5px; box-shadow: 0 4px 16px rgba(191,82,74,0.25);">
          Open ${escapeHtml(petName)}'s Reading &#10024;
        </a>
      </div>

      <!-- Inner cream card — what's inside -->
      <div style="text-align: left; background: #faf4e8; border-radius: 12px; padding: 24px 26px; margin: 24px 0 0 0; border: 1px solid #e8ddd0;">
        <p style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #c4a265; margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          What's inside
        </p>
        <p style="color: #4d443b; font-size: 14px; line-height: 2.1; margin: 0;">
          &#10024; ${escapeHtml(petName)}'s complete cosmic birth chart, decoded with care<br>
          &#128156; How they love you (and what they need to feel it back)<br>
          &#127775; The cosmic reasons behind every adorable quirk<br>
          &#128140; A letter written from ${escapeHtml(petName)}'s soul to yours
        </p>
      </div>

      <p style="color: #6e6259; font-size: 13px; line-height: 1.7; margin: 28px 0 0 0; font-style: italic;">
        "Some souls choose us before we're ready to understand why.
        ${escapeHtml(petName)} chose you. The stars know exactly why."
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 28px 12px 0;">
      <p style="color: #958779; font-size: 12px; line-height: 1.6; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Reply to this email any time — we read every one.
      </p>
      <p style="color: #b0a596; font-size: 11px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls · <a href="${escapeAttr(site)}" style="color: #b0a596; text-decoration: underline;">littlesouls.app</a>
        &nbsp;·&nbsp;
        <a href="${escapeAttr(site)}/unsubscribe" style="color: #b0a596; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>`;

  const text = [
    `${petName}'s Soul Reading is ready.`,
    "",
    `We took the moment ${petName} arrived in this world, asked the stars`,
    "what they had to say, and the answer moved us. Your reading is waiting.",
    "",
    `Open ${petName}'s reading:`,
    readingUrl,
    "",
    "What's inside:",
    `· ${petName}'s complete cosmic birth chart`,
    "· How they love you (and what they need to feel it back)",
    "· The cosmic reasons behind every adorable quirk",
    `· A letter written from ${petName}'s soul to yours`,
    "",
    "—",
    "Little Souls · littlesouls.app",
    "Reply to this email any time — we read every one.",
    `Unsubscribe: ${site}/unsubscribe`,
  ].join("\n");

  return {
    subject,
    from: FROM_ADDRESS,
    replyTo: REPLY_TO_ADDRESS,
    html,
    text,
  };
}

// ─── tiny escape helpers (no HTML lib needed for our controlled inputs) ────
function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  // For attribute values we additionally avoid newlines and tabs.
  return escapeHtml(s).replace(/[\r\n\t]/g, " ");
}
