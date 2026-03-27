import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const N8N_BRIDGE_SECRET = Deno.env.get("N8N_BRIDGE_SECRET") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  // Auth — same secret the worker uses
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.includes(N8N_BRIDGE_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { email, petName, reportId } = await req.json();
    if (!email) return new Response("Missing email", { status: 400 });

    const name = petName || "your pet";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#FFFDF5;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#c4a265;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Little Souls</p>
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border-radius:16px;border:1px solid #e8ddd0;padding:40px 28px;text-align:center;box-shadow:0 4px 20px rgba(35,40,30,0.06);">

      <p style="font-size:36px;margin:0 0 20px;">🐾</p>

      <p style="font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#c4a265;margin:0 0 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        A Note From Us
      </p>

      <h1 style="color:#141210;font-size:24px;font-weight:400;margin:0 0 16px;line-height:1.4;font-family:Georgia,'Times New Roman',serif;">
        We're so sorry — something went wrong with ${name}'s reading.
      </h1>

      <p style="color:#5a4a42;font-size:0.92rem;line-height:1.7;margin:0 0 24px;">
        We know how much this means, and we're truly sorry for the hiccup.
        Our team has been automatically notified and we'll have ${name}'s reading
        ready for you as soon as possible — usually within the hour.
      </p>

      <p style="color:#5a4a42;font-size:0.92rem;line-height:1.7;margin:0 0 28px;">
        If you'd like us to sort this out immediately, just reply to this email
        or tap the button below — we'll personally make sure ${name}'s reading
        reaches you.
      </p>

      <!-- CTA Button -->
      <a href="mailto:hello@littlesouls.app?subject=My%20reading%20didn't%20arrive%20(${encodeURIComponent(name)})&body=Hi%2C%20my%20pet%20${encodeURIComponent(name)}'s%20reading%20didn't%20arrive.%20Report%20ID%3A%20${reportId}"
         style="display:inline-block;background:#bf524a;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:0.9rem;font-weight:600;letter-spacing:0.05em;text-decoration:none;padding:14px 32px;border-radius:50px;margin-bottom:24px;">
        Contact Us — We'll Fix This
      </a>

      <p style="color:#958779;font-size:0.78rem;margin:0;">
        Or reply to this email. We respond within a few hours, every day.
      </p>

    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;">
      <p style="color:#958779;font-size:0.72rem;margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        Little Souls · hello@littlesouls.app
      </p>
      <p style="color:#c4a265;font-size:0.72rem;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        You will not be charged again. Your reading will be delivered.
      </p>
    </div>

  </div>
</body>
</html>`;

    await resend.emails.send({
      from: "Little Souls <hello@littlesouls.app>",
      to: [email],
      subject: `We're so sorry — ${name}'s reading hit a snag`,
      html,
      reply_to: "hello@littlesouls.app",
    });

    console.log("[FAILURE-EMAIL] Sent to:", email, "for pet:", name);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[FAILURE-EMAIL] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
