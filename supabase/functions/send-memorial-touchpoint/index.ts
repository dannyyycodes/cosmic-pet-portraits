// send-memorial-touchpoint
//
// Sender for the public.memorial_touchpoints table (migration
// 20260417000000_memorial_touchpoints.sql).
//
// Trigger modes:
//   1. Cron / scheduled: POST with empty body (or {}) — processes up to
//      BATCH_SIZE rows where sent_at IS NULL AND scheduled_for <= now().
//   2. Manual resend: POST { "touchpointId": "<uuid>" } — sends that single
//      row regardless of sent_at (useful for retries / QA).
//
// Auth: service-role key OR N8N_BRIDGE_SECRET. Anon rejected.
//
// Schema notes (from migration):
//   • scheduled_for (NOT scheduled_send_at)
//   • touchpoint_type (NOT type) — 'thirty_day' | 'anniversary_birth' | 'anniversary_passing'
//   • Denormalised: email, pet_name, pronoun_subject, pet_birth_date, pet_passed_date
//   • No last_error column yet — recommend adding (see report).
//     For now errors are written to metadata.last_error + logged.
//
// For anniversary rows, after a successful send this function advances
// scheduled_for by exactly 1 year so the row fires again next year, and
// leaves sent_at = NULL. For thirty_day, sent_at is set and the row is done.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import {
  htmlFor,
  subjectFor,
  textFor,
  type TouchpointType,
} from "./_templates.ts";

const BATCH_SIZE = 50;

const ALLOWED_ORIGINS = [
  "https://littlesouls.app",
  "https://www.littlesouls.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

interface TouchpointRow {
  id: string;
  report_id: string;
  touchpoint_type: TouchpointType;
  scheduled_for: string;
  sent_at: string | null;
  email: string | null;
  pet_name: string | null;
  pronoun_subject: string | null;
  pet_birth_date: string | null;
  pet_passed_date: string | null;
  metadata: Record<string, unknown> | null;
}

interface SendOutcome {
  id: string;
  type: TouchpointType;
  status: "sent" | "skipped" | "error";
  reason?: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function yearsBetween(fromIso: string, toIso: string): number {
  // Integer years between two ISO dates (clamped to >= 1).
  const from = new Date(fromIso);
  const to = new Date(toIso);
  let y = to.getUTCFullYear() - from.getUTCFullYear();
  const monthDiff = to.getUTCMonth() - from.getUTCMonth();
  const dayDiff = to.getUTCDate() - from.getUTCDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) y -= 1;
  return Math.max(1, y);
}

function addOneYear(iso: string): string {
  const d = new Date(iso);
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString();
}

async function fetchReportLinks(
  supabaseUrl: string,
  serviceRoleKey: string,
  reportId: string,
): Promise<{ readLink: string; soulSpeakLink: string }> {
  // Pull share_token (creating one if missing) so the link bypasses email
  // verification — mirrors send-report-email's approach.
  let shareToken: string | undefined;
  try {
    const rows = await fetch(
      `${supabaseUrl}/rest/v1/pet_reports?id=eq.${reportId}&select=share_token`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      },
    ).then((r) => r.json());
    shareToken = rows?.[0]?.share_token;
  } catch (err) {
    console.warn(
      "[send-memorial-touchpoint] share_token lookup failed:",
      (err as Error).message,
    );
  }

  if (!shareToken) {
    shareToken = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    try {
      await fetch(`${supabaseUrl}/rest/v1/pet_reports?id=eq.${reportId}`, {
        method: "PATCH",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ share_token: shareToken }),
      });
    } catch (err) {
      console.warn(
        "[send-memorial-touchpoint] share_token write failed:",
        (err as Error).message,
      );
    }
  }

  const readLink =
    `https://littlesouls.app/report?id=${reportId}&token=${shareToken}`;
  const soulSpeakLink =
    `https://littlesouls.app/soul-chat?id=${reportId}&token=${shareToken}`;
  return { readLink, soulSpeakLink };
}

async function sendOne(
  row: TouchpointRow,
  deps: {
    supabase: ReturnType<typeof createClient>;
    resend: Resend;
    supabaseUrl: string;
    serviceRoleKey: string;
  },
): Promise<SendOutcome> {
  const { supabase, resend, supabaseUrl, serviceRoleKey } = deps;

  if (!row.email) {
    return { id: row.id, type: row.touchpoint_type, status: "skipped", reason: "missing_email" };
  }
  if (!row.pet_name) {
    return { id: row.id, type: row.touchpoint_type, status: "skipped", reason: "missing_pet_name" };
  }

  const { readLink, soulSpeakLink } = await fetchReportLinks(
    supabaseUrl,
    serviceRoleKey,
    row.report_id,
  );

  // For anniversaries, figure out which year this is.
  let yearsSince = 1;
  const today = new Date().toISOString();
  if (row.touchpoint_type === "anniversary_birth" && row.pet_birth_date) {
    yearsSince = yearsBetween(row.pet_birth_date, today);
  } else if (row.touchpoint_type === "anniversary_passing" && row.pet_passed_date) {
    yearsSince = yearsBetween(row.pet_passed_date, today);
  }

  const ctx = {
    petName: row.pet_name,
    readLink,
    soulSpeakLink,
    yearsSince,
  };

  const subject = subjectFor(row.touchpoint_type, ctx);
  const html = htmlFor(row.touchpoint_type, ctx);
  const text = textFor(row.touchpoint_type, ctx);

  const result = await resend.emails.send({
    from: "Little Souls <hello@littlesouls.app>",
    to: [row.email],
    subject,
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": row.id,
    },
  });

  const err = (result as { error?: unknown }).error;
  if (err) {
    const msg = typeof err === "string" ? err : JSON.stringify(err);
    console.error(
      `[send-memorial-touchpoint] resend error id=${row.id} type=${row.touchpoint_type}: ${msg}`,
    );
    // Persist error hint into metadata so it survives retries.
    const nextMeta = {
      ...(row.metadata ?? {}),
      last_error: msg,
      last_error_at: new Date().toISOString(),
    };
    await supabase
      .from("memorial_touchpoints")
      .update({ metadata: nextMeta })
      .eq("id", row.id);
    return { id: row.id, type: row.touchpoint_type, status: "error", reason: msg };
  }

  // Success. Update row.
  const nowIso = new Date().toISOString();
  const cleanMeta = { ...(row.metadata ?? {}) } as Record<string, unknown>;
  delete cleanMeta.last_error;
  delete cleanMeta.last_error_at;
  cleanMeta.last_sent_at = nowIso;
  cleanMeta.last_years_since = yearsSince;

  if (row.touchpoint_type === "thirty_day") {
    // One-shot. Mark sent.
    await supabase
      .from("memorial_touchpoints")
      .update({ sent_at: nowIso, metadata: cleanMeta })
      .eq("id", row.id);
  } else {
    // Annual — roll scheduled_for forward, leave sent_at NULL so it fires again.
    const nextScheduled = addOneYear(row.scheduled_for);
    await supabase
      .from("memorial_touchpoints")
      .update({
        scheduled_for: nextScheduled,
        sent_at: null,
        metadata: cleanMeta,
      })
      .eq("id", row.id);
  }

  console.log(
    `[send-memorial-touchpoint] sent id=${row.id} type=${row.touchpoint_type} yearsSince=${yearsSince}`,
  );
  return { id: row.id, type: row.touchpoint_type, status: "sent" };
}

// ─── handler ────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const bridgeSecret = Deno.env.get("N8N_BRIDGE_SECRET") || "";
  const authHeader = req.headers.get("Authorization") || "";

  const isServiceRole =
    serviceRoleKey.length > 0 && authHeader.includes(serviceRoleKey);
  const isBridgeAuth =
    bridgeSecret.length > 0 && authHeader.includes(bridgeSecret);

  if (!isServiceRole && !isBridgeAuth) {
    console.error(
      "[send-memorial-touchpoint] unauthorized — missing or invalid auth",
    );
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "application/json",
      },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const resendKey = Deno.env.get("RESEND_API_KEY") || "";
  if (!supabaseUrl || !serviceRoleKey || !resendKey) {
    console.error(
      "[send-memorial-touchpoint] missing env — SUPABASE_URL / SERVICE_ROLE / RESEND_API_KEY",
    );
    return new Response(
      JSON.stringify({ error: "Service misconfigured" }),
      {
        status: 500,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json",
        },
      },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const resend = new Resend(resendKey);

  // Optional manual override.
  let touchpointId: string | undefined;
  try {
    if (req.method === "POST") {
      const bodyText = await req.text();
      if (bodyText) {
        const parsed = JSON.parse(bodyText);
        touchpointId = parsed?.touchpointId;
      }
    }
  } catch {
    // ignore — empty/invalid body means "cron mode"
  }

  let rows: TouchpointRow[] = [];
  if (touchpointId) {
    const { data, error } = await supabase
      .from("memorial_touchpoints")
      .select("*")
      .eq("id", touchpointId)
      .limit(1);
    if (error) {
      console.error(
        "[send-memorial-touchpoint] single-row fetch failed:",
        error.message,
      );
      return new Response(
        JSON.stringify({ error: "Fetch failed", detail: error.message }),
        {
          status: 500,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }
    rows = (data ?? []) as TouchpointRow[];
  } else {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("memorial_touchpoints")
      .select("*")
      .is("sent_at", null)
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true })
      .limit(BATCH_SIZE);
    if (error) {
      console.error(
        "[send-memorial-touchpoint] batch fetch failed:",
        error.message,
      );
      return new Response(
        JSON.stringify({ error: "Fetch failed", detail: error.message }),
        {
          status: 500,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }
    rows = (data ?? []) as TouchpointRow[];
  }

  const outcomes: SendOutcome[] = [];
  for (const row of rows) {
    try {
      const out = await sendOne(row, {
        supabase,
        resend,
        supabaseUrl,
        serviceRoleKey,
      });
      outcomes.push(out);
    } catch (err) {
      const msg = (err as Error).message ?? String(err);
      console.error(
        `[send-memorial-touchpoint] exception id=${row.id}: ${msg}`,
      );
      outcomes.push({
        id: row.id,
        type: row.touchpoint_type,
        status: "error",
        reason: msg,
      });
    }
  }

  const summary = {
    fetched: rows.length,
    sent: outcomes.filter((o) => o.status === "sent").length,
    skipped: outcomes.filter((o) => o.status === "skipped").length,
    errored: outcomes.filter((o) => o.status === "error").length,
    outcomes,
  };

  console.log(
    `[send-memorial-touchpoint] summary fetched=${summary.fetched} sent=${summary.sent} skipped=${summary.skipped} errored=${summary.errored}`,
  );

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: {
      ...getCorsHeaders(req),
      "Content-Type": "application/json",
    },
  });
});
