/**
 * POST /api/email/reading-ready — send the Soul Reading reading-ready email
 * via Resend, using the Phase 6 brand-locked template.
 *
 * Auth: shared bearer token in `READING_EMAIL_SECRET` (separate from Shopify
 * webhook secret). The droplet worker calls this AFTER successfully writing
 * the generated reading to pet_reports + flipping soul_reading_jobs to
 * 'generated'. On 200 the worker flips the row to 'delivered'.
 *
 * Body:
 *   {
 *     jobId:           string,         // soul_reading_jobs.id (audit only)
 *     customerEmail:   string,
 *     petName:         string,
 *     readingUrl:      string,         // https://littlesouls.app/reading/<token>
 *     petPhotoUrl?:    string,
 *     sunSign?:        string
 *   }
 *
 * Spec sources:
 *   - launch-plan-2026-05-05 Phase 7
 *   - research-2026-05-04-soul-reading-fulfilment §5
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { renderReadingReadyEmail } from "../_lib/email/readingReadyEmail.js";

interface SendInput {
  jobId?: string;
  customerEmail: string;
  petName: string;
  readingUrl: string;
  petPhotoUrl?: string;
  sunSign?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 1. Auth — shared bearer token
  const auth = req.headers.authorization ?? "";
  const expected = process.env.READING_EMAIL_SECRET;
  if (!expected) {
    console.error("[email/reading-ready] READING_EMAIL_SECRET not configured");
    return res.status(500).json({ error: "secret_not_configured" });
  }
  if (auth !== `Bearer ${expected}`) {
    console.warn("[email/reading-ready] auth_failed");
    return res.status(401).json({ error: "unauthorized" });
  }

  // 2. Parse + validate body
  const body = (req.body ?? {}) as Partial<SendInput>;
  const customerEmail = (body.customerEmail ?? "").trim();
  const petName = (body.petName ?? "").trim();
  const readingUrl = (body.readingUrl ?? "").trim();

  if (!customerEmail || !petName || !readingUrl) {
    return res.status(400).json({
      error: "missing_required_fields",
      required: ["customerEmail", "petName", "readingUrl"],
    });
  }
  if (!/^https:\/\/[^/]+\/reading\/[A-Za-z0-9_-]+/.test(readingUrl)) {
    return res.status(400).json({ error: "invalid_reading_url" });
  }

  // 3. Render
  const rendered = renderReadingReadyEmail({
    petName,
    readingUrl,
    petPhotoUrl: body.petPhotoUrl,
    sunSign: body.sunSign,
  });

  // 4. Send via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[email/reading-ready] RESEND_API_KEY not configured");
    return res.status(500).json({ error: "resend_not_configured" });
  }

  let sendStatus: number;
  let sendBody: unknown;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: rendered.from,
        to: customerEmail,
        reply_to: rendered.replyTo,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    sendStatus = r.status;
    const text = await r.text();
    try {
      sendBody = JSON.parse(text);
    } catch {
      sendBody = { raw: text.slice(0, 500) };
    }
  } catch (err) {
    console.error(
      "[email/reading-ready] resend_network_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
    return res.status(502).json({ error: "resend_network_failed" });
  }

  if (sendStatus < 200 || sendStatus >= 300) {
    console.error(
      "[email/reading-ready] resend_send_failed",
      JSON.stringify({ status: sendStatus, body: sendBody, jobId: body.jobId }),
    );
    return res.status(502).json({ error: "resend_send_failed", status: sendStatus, detail: sendBody });
  }

  console.log(
    "[email/reading-ready] sent",
    JSON.stringify({
      jobId: body.jobId,
      customerEmail: maskEmail(customerEmail),
      petName,
      resendId: (sendBody as { id?: string } | undefined)?.id,
    }),
  );

  return res.status(200).json({
    ok: true,
    resendId: (sendBody as { id?: string } | undefined)?.id ?? null,
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}
