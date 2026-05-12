/**
 * Intake-request email — sent post-payment when a Soul Reading was bought
 * via the "Quick add (fill in later)" path. Customer clicks the link to
 * land on /reading/intake/<token>, fills the pet name + DOB + birth
 * location, and the reading job kicks off.
 *
 * Brand parity with readingReadyEmail.ts (same palette + Georgia serif).
 */

export interface IntakeRequestEmailInput {
  /** Pre-built `https://littlesouls.app/reading/intake/<token>` URL. */
  intakeUrl: string;
  /** Short order ref (last 6 chars of Shopify order id). */
  orderRef: string;
  /** Site base for footer links. Defaults to https://littlesouls.app */
  siteBaseUrl?: string;
}

export interface IntakeRequestEmail {
  subject: string;
  from: string;
  replyTo: string;
  html: string;
  text: string;
}

const DEFAULT_SITE = "https://littlesouls.app";
const FROM_ADDRESS = "Little Souls <hello@littlesouls.app>";
const REPLY_TO_ADDRESS = "hello@littlesouls.app";

export function renderIntakeRequestEmail(input: IntakeRequestEmailInput): IntakeRequestEmail {
  const intakeUrl = input.intakeUrl;
  const orderRef = input.orderRef;
  const site = (input.siteBaseUrl ?? DEFAULT_SITE).replace(/\/$/, "");

  const subject = "Tell us about your pet — your Soul Reading is waiting ✦";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFDF5; font-family: Georgia, 'Times New Roman', serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <p style="font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c4a265; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Little Souls
      </p>
    </div>

    <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e8ddd0; padding: 40px 28px; text-align: center; box-shadow: 0 4px 20px rgba(35,40,30,0.06);">
      <p style="font-size: 40px; margin: 0 0 16px 0; line-height: 1;">&#10024;</p>

      <p style="font-size: 11px; font-weight: 600; letter-spacing: 2.5px; text-transform: uppercase; color: #c4a265; margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        Your reading is waiting
      </p>

      <h1 style="color: #141210; font-size: 26px; font-weight: 400; margin: 0 0 18px 0; line-height: 1.3; font-family: Georgia, 'Times New Roman', serif;">
        Tell us about your pet
      </h1>

      <p style="color: #5a4a42; font-size: 15px; line-height: 1.8; margin: 0 0 24px 0;">
        Thank you for your order. To bring your pet's Soul Reading to life, we need three quick details — their name, when they came into your life, and where. Click below and you're 60 seconds away.
      </p>

      <div style="margin: 0 0 28px 0;">
        <a href="${escapeAttr(intakeUrl)}" style="display: inline-block; background: #bf524a; color: #ffffff; padding: 16px 36px; border-radius: 999px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; font-weight: 600; letter-spacing: 0.04em; text-decoration: none; box-shadow: 0 4px 14px rgba(191,82,74,0.25);">
          Add my pet's details →
        </a>
      </div>

      <p style="color: #958779; font-size: 13px; line-height: 1.6; margin: 0;">
        Once we have those, the reading typically lands in your inbox within an hour.
      </p>
    </div>

    <div style="margin-top: 36px; text-align: center;">
      <p style="font-size: 12px; color: #958779; margin: 0 0 6px 0; font-family: Georgia, 'Times New Roman', serif;">
        Order reference: <code style="font-family: Menlo, monospace; background: rgba(196,162,101,0.10); padding: 2px 8px; border-radius: 4px; color: #5a4a42;">${escapeHtml(orderRef)}</code>
      </p>
      <p style="font-size: 12px; color: #958779; margin: 0 0 4px 0;">
        Questions? Just reply to this email — a real person reads them.
      </p>
      <p style="font-size: 11px; color: #c4a265; margin: 14px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; letter-spacing: 2px; text-transform: uppercase;">
        Little Souls · ${escapeHtml(site.replace(/^https?:\/\//, ""))}
      </p>
    </div>
  </div>
</body>
</html>`;

  const text = `Little Souls

Tell us about your pet

Thank you for your order. To bring your pet's Soul Reading to life, we need three quick details — their name, when they came into your life, and where. Click below and you're 60 seconds away.

Add my pet's details: ${intakeUrl}

Once we have those, the reading typically lands in your inbox within an hour.

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
