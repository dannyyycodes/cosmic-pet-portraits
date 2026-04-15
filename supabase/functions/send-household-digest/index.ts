import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

/**
 * Fans out a single weekly digest email per household.
 *
 * Contract:
 *   - Intended to run AFTER `generate-weekly-horoscopes` has created
 *     `weekly_horoscopes` rows for each active subscription.
 *   - For every household with `weekly_digest_enabled = true`, this function
 *     collects the latest unsent horoscope per pet (via household_id),
 *     composes a single email grouped by pet, and marks each included
 *     horoscope as sent.
 *
 * Call patterns:
 *   - Cron: a scheduled Supabase function triggers POST with no body →
 *     processes every active household.
 *   - One-off test: POST { householdId: "..." } to send for one household.
 */

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];
function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

interface HoroscopeRow {
  id: string;
  subscription_id: string;
  content: any;
  week_start: string;
}

interface HouseholdRow {
  id: string;
  email: string;
  display_name: string | null;
}

interface SubRow {
  id: string;
  pet_name: string;
  pet_report_id: string | null;
  household_id: string;
}

// ── Email template (household-wide; per-pet sections inside) ──────────────

function renderDigestEmail(params: {
  household: HouseholdRow;
  items: Array<{ petName: string; horoscope: any }>;
}): { subject: string; html: string } {
  const { household, items } = params;
  const petList = items.length === 1
    ? items[0].petName
    : items.length === 2
      ? `${items[0].petName} & ${items[1].petName}`
      : `${items.slice(0, -1).map(i => i.petName).join(', ')} & ${items[items.length - 1].petName}`;

  const subject = `Your Cosmic Household — this week for ${petList}`;

  // Match the email design system: cream #FFFDF5, rose CTA #bf524a,
  // gold accent #c4a265, Georgia serif.
  const styles = {
    body: `background:#FFFDF5;margin:0;padding:0;font-family:Georgia,serif;color:#141210;`,
    wrap: `max-width:560px;margin:0 auto;padding:32px 24px;`,
    h1: `font-family:Georgia,serif;font-size:28px;color:#141210;margin:0 0 8px;`,
    lede: `color:#5a4a42;font-size:15px;line-height:1.6;margin:0 0 28px;`,
    petCard: `background:#faf4e8;border:1px solid #e8ddd0;border-radius:16px;padding:22px;margin:0 0 18px;`,
    petName: `font-family:Georgia,serif;font-size:20px;color:#bf524a;margin:0 0 10px;`,
    petBody: `color:#3d2f2a;font-size:14.5px;line-height:1.75;margin:0 0 12px;white-space:pre-line;`,
    label: `color:#958779;text-transform:uppercase;letter-spacing:0.12em;font-size:10.5px;margin:0 0 4px;`,
    cta: `display:inline-block;background:#bf524a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-family:system-ui;font-size:14px;`,
    footer: `color:#958779;font-size:12px;line-height:1.6;text-align:center;margin-top:32px;`,
  };

  const sections = items.map(({ petName, horoscope }) => {
    const headline = horoscope?.headline || horoscope?.title || `${petName}'s week ahead`;
    const body = horoscope?.body || horoscope?.content || horoscope?.horoscope || '';
    const tip = horoscope?.tip || horoscope?.ritual;
    return `
      <div style="${styles.petCard}">
        <div style="${styles.label}">${escapeHtml(petName)}</div>
        <h2 style="${styles.petName}">${escapeHtml(headline)}</h2>
        <p style="${styles.petBody}">${escapeHtml(body)}</p>
        ${tip ? `<p style="${styles.petBody};font-style:italic;color:#5a4a42;">✦ ${escapeHtml(tip)}</p>` : ''}
      </div>
    `;
  }).join('\n');

  const html = `
    <!doctype html>
    <html><head><meta charset="utf-8"></head>
    <body style="${styles.body}">
      <div style="${styles.wrap}">
        <h1 style="${styles.h1}">✦ Cosmic Household</h1>
        <p style="${styles.lede}">
          This week's energies for ${escapeHtml(petList)}. Read each section aloud to them tonight — they understand more than they let on.
        </p>
        ${sections}
        <div style="text-align:center;margin-top:28px;">
          <a href="https://littlesouls.app/account" style="${styles.cta}">Open your household</a>
        </div>
        <p style="${styles.footer}">
          You can pause, add pets, or unsubscribe anytime in your account.
        </p>
      </div>
    </body></html>
  `;

  return { subject, html };
}

function escapeHtml(input: unknown): string {
  const str = typeof input === 'string' ? input : JSON.stringify(input ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Main ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({} as { householdId?: string }));
    const householdId = body?.householdId;

    const householdsQuery = supabase
      .from("cosmic_households")
      .select("id, email, display_name")
      .eq("status", "active")
      .eq("weekly_digest_enabled", true);
    const { data: households, error: hhErr } = householdId
      ? await householdsQuery.eq("id", householdId)
      : await householdsQuery;

    if (hhErr) throw hhErr;
    if (!households || households.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No active households" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 200,
      });
    }

    const results: Array<{ email: string; pets: number; ok: boolean; error?: string }> = [];

    for (const hh of households as HouseholdRow[]) {
      // Pull active per-pet subscriptions linked to this household.
      const { data: subs } = await supabase
        .from("horoscope_subscriptions")
        .select("id, pet_name, pet_report_id, household_id")
        .eq("household_id", hh.id)
        .eq("status", "active");

      const subList = (subs ?? []) as SubRow[];
      if (subList.length === 0) {
        results.push({ email: hh.email, pets: 0, ok: false, error: "No pets" });
        continue;
      }

      // For each subscription, grab the most recent unsent weekly_horoscope row.
      const items: Array<{ petName: string; horoscope: any; horoscopeId: string }> = [];
      for (const sub of subList) {
        const { data: horoscopeRows } = await supabase
          .from("weekly_horoscopes")
          .select("id, subscription_id, content, week_start, sent_at")
          .eq("subscription_id", sub.id)
          .is("sent_at", null)
          .order("week_start", { ascending: false })
          .limit(1);
        const row = (horoscopeRows ?? [])[0] as HoroscopeRow | undefined;
        if (row) {
          items.push({ petName: sub.pet_name, horoscope: row.content, horoscopeId: row.id });
        }
      }

      if (items.length === 0) {
        results.push({ email: hh.email, pets: subList.length, ok: false, error: "Nothing new to send" });
        continue;
      }

      const { subject, html } = renderDigestEmail({ household: hh, items });

      try {
        await resend.emails.send({
          from: "Little Souls <hello@littlesouls.app>",
          to: [hh.email],
          subject,
          html,
        });

        // Mark each included horoscope as sent so it won't ride the next digest.
        const horoscopeIds = items.map(i => i.horoscopeId);
        await supabase
          .from("weekly_horoscopes")
          .update({ sent_at: new Date().toISOString() })
          .in("id", horoscopeIds);

        await supabase
          .from("cosmic_households")
          .update({ last_digest_sent_at: new Date().toISOString() })
          .eq("id", hh.id);

        results.push({ email: hh.email, pets: items.length, ok: true });
      } catch (err) {
        console.error("[HOUSEHOLD-DIGEST] Send failed for", hh.email, err);
        results.push({ email: hh.email, pets: items.length, ok: false, error: (err as Error).message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("[HOUSEHOLD-DIGEST] Fatal error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message || "An unexpected error occurred" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
