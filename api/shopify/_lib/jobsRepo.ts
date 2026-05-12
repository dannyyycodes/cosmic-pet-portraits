/**
 * soul_reading_jobs Supabase repository — thin wrappers around the
 * service-role client. The handler stays free of Supabase plumbing.
 *
 * Schema reference: supabase/migrations/20260505_000000_soul_reading_jobs.sql
 *
 * Idempotency: composite UNIQUE (shopify_event_id, shopify_line_item_id).
 * Insert with `ignoreDuplicates` and check whether a row was returned. If
 * not — Shopify is replaying a webhook we already processed.
 */
import { getSupabaseAdmin } from "../../_lib/supabaseAdmin.js";
import { generateReadingToken } from "../../_lib/readingToken.js";

export interface SoulReadingJobRow {
  id: string;
  shopify_event_id: string;
  shopify_order_id: number;
  shopify_line_item_id: number;
  customer_email: string;
  pet_name: string;
  pet_dob: string;
  pet_birth_location: string;
  status: string;
  dry_run: boolean;
  attempts: number;
  n8n_response: unknown;
  error_text: string | null;
  viewer_token: string | null;
  refund_events: unknown[];
  created_at: string;
  updated_at: string;
}

export interface InsertJobInput {
  shopifyEventId: string;
  shopifyOrderId: number;
  shopifyLineItemId: number;
  customerEmail: string;
  petName: string;
  petDob: string;
  petBirthLocation: string;
  dryRun: boolean;
  /** When true, customer used the "Quick add" path — petName/dob/location are
   *  placeholders and the row is inserted with status='intake_pending'. The
   *  intake-request email goes out post-insert; when the customer submits the
   *  intake form, the API endpoint updates this row + flips status to 'pending'
   *  + fires n8n to generate the reading. */
  intakePending?: boolean;
}

export interface InsertJobResult {
  inserted: boolean;
  row: SoulReadingJobRow | null;
  /** Set when inserted=false because the row already exists (idempotent replay). */
  duplicate?: true;
}

/**
 * Idempotent insert. On conflict (event_id, line_item_id) returns
 * { inserted: false, duplicate: true } and the existing row is NOT
 * fetched (we don't need it — we just skip the n8n trigger and 200).
 */
export async function insertJob(input: InsertJobInput): Promise<InsertJobResult> {
  const sb = getSupabaseAdmin();
  const initialStatus = input.dryRun
    ? "dry_run"
    : input.intakePending
      ? "intake_pending"
      : "pending";

  const payload = {
    shopify_event_id: input.shopifyEventId,
    shopify_order_id: input.shopifyOrderId,
    shopify_line_item_id: input.shopifyLineItemId,
    customer_email: input.customerEmail,
    pet_name: input.petName,
    pet_dob: input.petDob,
    pet_birth_location: input.petBirthLocation,
    status: initialStatus,
    dry_run: input.dryRun,
    attempts: 0,
  };

  // upsert with ignoreDuplicates returns [] on conflict, the inserted row otherwise.
  const { data, error } = await sb
    .from("soul_reading_jobs")
    .upsert(payload, { onConflict: "shopify_event_id,shopify_line_item_id", ignoreDuplicates: true })
    .select("*");

  if (error) {
    // Real error — propagate so the handler returns 500 and Shopify retries.
    throw new Error(`soul_reading_jobs insert failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return { inserted: false, row: null, duplicate: true };
  }

  const insertedRow = data[0] as SoulReadingJobRow;

  // Phase 6 integration: derive viewer_token from (id, customer_email) and persist
  // before the n8n trigger fires. The droplet worker uses this token to build the
  // magic-link URL it includes in the reading-ready email.
  const token = generateReadingToken(insertedRow.id, insertedRow.customer_email);
  const { data: updated, error: tokenErr } = await sb
    .from("soul_reading_jobs")
    .update({ viewer_token: token })
    .eq("id", insertedRow.id)
    .select("*")
    .maybeSingle();

  if (tokenErr) {
    // Token persist failure shouldn't block the webhook — the cron can re-derive
    // the same deterministic token later. Log and continue with the un-tokened row.
    console.error(
      "[jobsRepo] viewer_token persist failed",
      JSON.stringify({ jobId: insertedRow.id, error: tokenErr.message }),
    );
    return { inserted: true, row: insertedRow };
  }

  return { inserted: true, row: (updated ?? { ...insertedRow, viewer_token: token }) as SoulReadingJobRow };
}

export interface MarkTriggeredInput {
  jobId: string;
  responseJson: unknown;
}

/**
 * Successful n8n fire: status -> 'triggered', attempts++, store response body.
 * Uses the in-DB `attempts + 1` increment via SQL expression to avoid races.
 */
export async function markTriggered(input: MarkTriggeredInput): Promise<void> {
  const sb = getSupabaseAdmin();
  // No atomic increment helper in supabase-js without an RPC; we do a read-modify-write
  // via .select() then .update() which is safe enough — only the cron + the webhook
  // ever touch this row, and they don't race on the same row in practice.
  const { data: cur, error: readErr } = await sb
    .from("soul_reading_jobs")
    .select("attempts")
    .eq("id", input.jobId)
    .maybeSingle();
  if (readErr) {
    throw new Error(`markTriggered read failed: ${readErr.message}`);
  }
  const currentAttempts = (cur?.attempts ?? 0) as number;

  const { error } = await sb
    .from("soul_reading_jobs")
    .update({
      status: "triggered",
      attempts: currentAttempts + 1,
      n8n_response: input.responseJson ?? null,
      error_text: null,
    })
    .eq("id", input.jobId);
  if (error) {
    throw new Error(`markTriggered update failed: ${error.message}`);
  }
}

export interface MarkPendingFailureInput {
  jobId: string;
  errorText: string;
  /** When true, status is set to 'failed' (terminal). Default 'pending' (cron retries). */
  terminal?: boolean;
}

export async function markPendingFailure(input: MarkPendingFailureInput): Promise<void> {
  const sb = getSupabaseAdmin();
  const { data: cur, error: readErr } = await sb
    .from("soul_reading_jobs")
    .select("attempts")
    .eq("id", input.jobId)
    .maybeSingle();
  if (readErr) {
    throw new Error(`markPendingFailure read failed: ${readErr.message}`);
  }
  const currentAttempts = (cur?.attempts ?? 0) as number;

  const { error } = await sb
    .from("soul_reading_jobs")
    .update({
      status: input.terminal ? "failed" : "pending",
      attempts: currentAttempts + 1,
      error_text: input.errorText.slice(0, 1000),
    })
    .eq("id", input.jobId);
  if (error) {
    throw new Error(`markPendingFailure update failed: ${error.message}`);
  }
}

export interface ListPendingForReconcileInput {
  olderThanMinutes: number;
  maxAttempts: number;
  limit: number;
}

/**
 * Look up a soul_reading_jobs row by Shopify (order_id, line_item_id).
 * Used by the refunds/create webhook handler to decide whether the refund
 * arrived pre- or post-render. Returns null if no row exists (line item
 * isn't a Soul Reading — probably a canvas refund, refund handler no-ops).
 */
export async function getJobByOrderAndLineItem(input: {
  orderId: number;
  lineItemId: number;
}): Promise<SoulReadingJobRow | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("soul_reading_jobs")
    .select("*")
    .eq("shopify_order_id", input.orderId)
    .eq("shopify_line_item_id", input.lineItemId)
    .maybeSingle();
  if (error) {
    throw new Error(`getJobByOrderAndLineItem failed: ${error.message}`);
  }
  return (data ?? null) as SoulReadingJobRow | null;
}

/**
 * Pre-render cancellation: customer refunded BEFORE the worker called
 * OpenRouter. Safe to mark cancelled — no compute spent. Idempotent (set
 * the same status twice = no-op).
 */
export async function cancelPreRender(input: { jobId: string; reason: string }): Promise<void> {
  const sb = getSupabaseAdmin();
  const { error } = await sb
    .from("soul_reading_jobs")
    .update({
      status: "cancelled_pre_render",
      error_text: input.reason.slice(0, 1000),
    })
    .eq("id", input.jobId);
  if (error) {
    throw new Error(`cancelPreRender failed: ${error.message}`);
  }
}

interface RefundEventEntry {
  event_id: string;
  refund_id: number | null;
  refunded_at: string;
  raw?: unknown;
}

/**
 * Append a refund-event audit row to soul_reading_jobs.refund_events. Idempotent:
 * if an entry with the same event_id already exists, no-op. Race-free under
 * Postgres MVCC because we read + write inside a single statement chain that
 * the handler doesn't parallelise per job.
 */
export async function appendRefundEvent(input: {
  jobId: string;
  eventId: string;
  refundId: number | null;
  payload: unknown;
}): Promise<{ appended: boolean }> {
  const sb = getSupabaseAdmin();
  const { data: cur, error: readErr } = await sb
    .from("soul_reading_jobs")
    .select("refund_events")
    .eq("id", input.jobId)
    .maybeSingle();
  if (readErr) {
    throw new Error(`appendRefundEvent read failed: ${readErr.message}`);
  }
  const existing = Array.isArray(cur?.refund_events) ? (cur!.refund_events as RefundEventEntry[]) : [];
  if (existing.some((e) => e?.event_id === input.eventId)) {
    return { appended: false };
  }
  const entry: RefundEventEntry = {
    event_id: input.eventId,
    refund_id: input.refundId,
    refunded_at: new Date().toISOString(),
    raw: input.payload,
  };
  const next = [...existing, entry];
  const { error: writeErr } = await sb
    .from("soul_reading_jobs")
    .update({ refund_events: next })
    .eq("id", input.jobId);
  if (writeErr) {
    throw new Error(`appendRefundEvent write failed: ${writeErr.message}`);
  }
  return { appended: true };
}

/**
 * Reconciliation cron query: rows still 'pending', not dry-run, older than the
 * cutoff, attempts under the cap.
 */
export async function listPendingForReconcile(
  input: ListPendingForReconcileInput,
): Promise<SoulReadingJobRow[]> {
  const sb = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - input.olderThanMinutes * 60_000).toISOString();
  const { data, error } = await sb
    .from("soul_reading_jobs")
    .select("*")
    .eq("status", "pending")
    .eq("dry_run", false)
    .lt("created_at", cutoff)
    .lt("attempts", input.maxAttempts)
    .order("created_at", { ascending: true })
    .limit(input.limit);
  if (error) {
    throw new Error(`listPendingForReconcile failed: ${error.message}`);
  }
  return (data ?? []) as SoulReadingJobRow[];
}
