/**
 * Digital-ready email template — sent by the digital fulfilment pipeline
 * (api/_lib/digitalFulfillment.ts) immediately after a customer's
 * digital-download order is paid and the print master is rehosted to
 * Supabase storage.
 *
 * Brand parity (matches readingReadyEmail.ts):
 *   - Cream background #FFFDF5, rose CTA #bf524a, gold accent #c4a265
 *   - Heading ink #141210, body warm #5a4a42, muted #958779
 *   - Sand border #e8ddd0, cream2 inner #faf4e8
 *   - Georgia serif body, system-ui for CTA + labels
 *
 * Sacred-copy compliance:
 *   - No "AI" anywhere in customer-facing text
 *   - No "report" — this is a "portrait"
 *   - Transformation/cinematic language, not transactional "your file is ready"
 */

export interface DigitalReadyEmailInput {
  /** Customer-facing pet name. */
  petName: string;
  /** Signed Supabase Storage URL (30-day expiry) — the print master download. */
  downloadUrl: string;
  /** Optional preview / web-size portrait image for the email hero (circle-framed). */
  previewUrl?: string;
  /** Short order reference (last 6 chars of Shopify order id). */
  orderRef: string;
  /** Site base for footer links. Defaults to https://littlesouls.app */
  siteBaseUrl?: string;
}

export interface DigitalReadyEmail {
  subject: string;
  from: string;
  replyTo: string;
  html: string;
  text: string;
}

const DEFAULT_SITE = "https://littlesouls.app";
const FROM_ADDRESS = "Little Souls <hello@littlesouls.app>";
const REPLY_TO_ADDRESS = "hello@littlesouls.app";

export function renderDigitalReadyEmail(input: DigitalReadyEmailInput): DigitalReadyEmail {
  const petName = (input.petName ?? "your pet").trim() || "your pet";
  const downloadUrl = input.downloadUrl;
  const previewUrl = input.previewUrl;
  const orderRef = input.orderRef;
  const site = (input.siteBaseUrl ?? DEFAULT_SITE).replace(/\/$/, "");

  const subject = `${petName}'s portrait is ready ✦`;

  const photoBlock = previewUrl
    ? `
      <div style="margin: 0 auto 24px; width: 160px; height: 160px;">
        <img src="${escapeAttr(previewUrl)}" alt="${escapeAttr(petName)}" width="160" height="160" style="width: 160px; height: 160px; border-radius: 12px; object-fit: cover; border: 3px solid #c4a265; box-shadow: 0 0 0 6px rgba(196,162,101,0.12), 0 8px 24px rgba(196,162,101,0.15);" />
      </div>`
    : `<p style="font-size: 40px; margin: 0 0 16px 0; line-height: 1;">&#10024;</p>`;

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
        A Little Soul, Painted
      </p>

      <h1 style="color: #141210; font-size: 28px; font-weight: 400; margin: 0 0 18px 0; line-height: 1.3; font-family: Georgia, 'Times New Roman', serif;">
        ${escapeHtml(petName)}'s portrait is ready
      </h1>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 24px 0;">
        We poured everything we had into ${escapeHtml(petName)}'s portrait — the soft light, the small detail in the eyes, the world they walk in. It's yours now, in full resolution.
      </p>

      <!-- CTA button -->
      <div style="margin: 0 0 28px 0;">
        <a href="${escapeAttr(downloadUrl)}" style="display: inline-block; background: #bf524a; color: #ffffff; padding: 16px 36px; border-radius: 999px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.04em; text-decoration: none; box-shadow: 0 4px 14px rgba(191,82,74,0.25);">
          Download your portrait →
        </a>
      </div>

      <p style="color: #958779; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
        High-resolution 3000×3000 PNG — perfect for printing at any size.
      </p>
      <p style="color: #958779; font-size: 13px; line-height: 1.6; margin: 0;">
        This link works for 30 days. Save the file to your computer or cloud storage to keep it forever.
      </p>
    </div>

    <!-- Soft upgrade nudge — physical canvas -->
    <div style="background: #faf4e8; border-radius: 12px; border: 1px solid #e8ddd0; padding: 24px 22px; text-align: center; margin-top: 18px;">
      <p style="color: #5a4a42; font-size: 14px; line-height: 1.7; margin: 0 0 14px 0;">
        Want to see ${escapeHtml(petName)} on your wall? We can print the same portrait on gallery-stretched canvas — slim or framed — and ship it locally.
      </p>
      <a href="${escapeAttr(site)}/pawtraits/studio" style="display: inline-block; color: #bf524a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; text-decoration: none; border-bottom: 1.5px solid #bf524a; padding-bottom: 2px;">
        Order a canvas →
      </a>
    </div>

    <!-- Footer -->
    <div style="margin-top: 36px; text-align: center;">
      <p style="font-size: 12px; color: #958779; margin: 0 0 6px 0; font-family: Georgia, 'Times New Roman', serif;">
        Order reference: <code style="font-family: Menlo, monospace; background: rgba(196,162,101,0.10); padding: 2px 8px; border-radius: 4px; color: #5a4a42;">${escapeHtml(orderRef)}</code>
      </p>
      <p style="font-size: 12px; color: #958779; margin: 0 0 4px 0;">
        Questions? Just reply to this email — a real person reads them.
      </p>
      <p style="font-size: 11px; color: #c4a265; margin: 14px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 2px; text-transform: uppercase;">
        Little Souls
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Little Souls

${petName}'s portrait is ready

We poured everything we had into ${petName}'s portrait — the soft light, the small detail in the eyes, the world they walk in. It's yours now, in full resolution.

Download: ${downloadUrl}

High-resolution 3000×3000 PNG — perfect for printing at any size. This link works for 30 days. Save the file to your computer or cloud storage to keep it forever.

Want to see ${petName} on your wall? We can print the same portrait on gallery-stretched canvas — slim or framed — and ship it locally.

Order a canvas → ${site}/pawtraits/studio

Order reference: ${orderRef}

Questions? Just reply to this email — a real person reads them.

— Little Souls`;

  return {
    subject,
    from: FROM_ADDRESS,
    replyTo: REPLY_TO_ADDRESS,
    html,
    text,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
