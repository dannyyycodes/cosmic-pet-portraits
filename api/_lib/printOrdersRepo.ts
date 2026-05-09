/**
 * print_orders + print_order_alerts repository.
 *
 * Schema reference: supabase/migrations/20260508_120000_print_orders_and_pawtrait_touchpoints.sql
 *
 * Idempotency: composite UNIQUE (shopify_order_id, shopify_line_item_id).
 * Insert with `ignoreDuplicates` and check whether a row was returned. If
 * not — Shopify is replaying a webhook we already processed, so we look up
 * the existing row and act on it (the orchestrator may want to retry the
 * Gelato submit on a row that's still 'pending').
 */
import { getSupabaseAdmin } from "./supabaseAdmin.js";

export type PrintOrderStatus =
  | "pending"
  | "submitted"
  | "printed"
  | "shipped"
  | "delivered"
  | "failed"
  | "manual_review"
  | "canceled";

export interface PrintOrderRow {
  id: string;
  shopify_order_id: string;
  shopify_line_item_id: string | null;
  gelato_order_id: string | null;
  gelato_order_reference: string | null;
  user_id: string | null;
  sku: string | null;
  size_key: string | null;
  frame_color: string | null;
  source_image_url: string | null;
  print_master_url: string | null;
  status: PrintOrderStatus;
  attempts: number;
  last_error: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
}

export interface UpsertPrintOrderInput {
  shopifyOrderId: string;
  shopifyLineItemId: string;
  userId?: string | null;
  sku?: string | null;
  sizeKey?: string | null;
  frameColor?: string | null;
  sourceImageUrl?: string | null;
  printMasterUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface UpsertResult {
  row: PrintOrderRow;
  /** True if a NEW row was inserted; false if the (order, line) already had a row. */
  inserted: boolean;
}

/**
 * Idempotent upsert. On duplicate (order_id, line_item_id) returns the
 * existing row with inserted:false — caller decides whether to retry the
 * Gelato submit (still 'pending' or 'failed') or skip ('submitted'+).
 */
export async function upsertPrintOrder(input: UpsertPrintOrderInput): Promise<UpsertResult> {
  const sb = getSupabaseAdmin();

  const payload = {
    shopify_order_id: input.shopifyOrderId,
    shopify_line_item_id: input.shopifyLineItemId,
    user_id: input.userId ?? null,
    sku: input.sku ?? null,
    size_key: input.sizeKey ?? null,
    frame_color: input.frameColor ?? null,
    source_image_url: input.sourceImageUrl ?? null,
    print_master_url: input.printMasterUrl ?? null,
    metadata: input.metadata ?? {},
    status: "pending" as PrintOrderStatus,
    attempts: 0,
  };

  const { data: insData, error: insErr } = await sb
    .from("print_orders")
    .upsert(payload, {
      onConflict: "shopify_order_id,shopify_line_item_id",
      ignoreDuplicates: true,
    })
    .select("*");

  if (insErr) {
    throw new Error(`print_orders insert failed: ${insErr.message}`);
  }

  if (insData && insData.length > 0) {
    return { row: insData[0] as PrintOrderRow, inserted: true };
  }

  // Duplicate — fetch existing row.
  const { data: existing, error: lookupErr } = await sb
    .from("print_orders")
    .select("*")
    .eq("shopify_order_id", input.shopifyOrderId)
    .eq("shopify_line_item_id", input.shopifyLineItemId)
    .maybeSingle();

  if (lookupErr) {
    throw new Error(`print_orders dedupe lookup failed: ${lookupErr.message}`);
  }
  if (!existing) {
    throw new Error("print_orders upsert returned no row and no existing row found");
  }
  return { row: existing as PrintOrderRow, inserted: false };
}

export interface UpdatePrintOrderInput {
  printOrderId: string;
  status?: PrintOrderStatus;
  gelatoOrderId?: string | null;
  gelatoOrderReference?: string | null;
  printMasterUrl?: string | null;
  lastError?: string | null;
  /** Increments the attempts counter by 1 in the same update. */
  bumpAttempts?: boolean;
  metadataMerge?: Record<string, unknown>;
}

export async function updatePrintOrder(input: UpdatePrintOrderInput): Promise<PrintOrderRow> {
  const sb = getSupabaseAdmin();

  // Read-modify-write for attempts + metadata merge. Same approach as
  // jobsRepo.markTriggered — only the webhook + cron touch any single row.
  const { data: cur, error: readErr } = await sb
    .from("print_orders")
    .select("attempts,metadata")
    .eq("id", input.printOrderId)
    .maybeSingle();
  if (readErr) {
    throw new Error(`print_orders read failed: ${readErr.message}`);
  }
  const currentAttempts = (cur?.attempts ?? 0) as number;
  const currentMetadata =
    (cur?.metadata && typeof cur.metadata === "object" ? (cur.metadata as Record<string, unknown>) : {}) ?? {};

  const update: Record<string, unknown> = {};
  if (input.status !== undefined) update.status = input.status;
  if (input.gelatoOrderId !== undefined) update.gelato_order_id = input.gelatoOrderId;
  if (input.gelatoOrderReference !== undefined) update.gelato_order_reference = input.gelatoOrderReference;
  if (input.printMasterUrl !== undefined) update.print_master_url = input.printMasterUrl;
  if (input.lastError !== undefined) update.last_error = input.lastError ? String(input.lastError).slice(0, 2000) : null;
  if (input.bumpAttempts) update.attempts = currentAttempts + 1;
  if (input.metadataMerge) update.metadata = { ...currentMetadata, ...input.metadataMerge };

  const { data, error } = await sb
    .from("print_orders")
    .update(update)
    .eq("id", input.printOrderId)
    .select("*")
    .maybeSingle();
  if (error) {
    throw new Error(`print_orders update failed: ${error.message}`);
  }
  if (!data) {
    throw new Error(`print_orders update returned no row (id=${input.printOrderId})`);
  }
  return data as PrintOrderRow;
}

export async function getPrintOrderByGelatoId(gelatoOrderId: string): Promise<PrintOrderRow | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("print_orders")
    .select("*")
    .eq("gelato_order_id", gelatoOrderId)
    .maybeSingle();
  if (error) {
    throw new Error(`getPrintOrderByGelatoId failed: ${error.message}`);
  }
  return (data ?? null) as PrintOrderRow | null;
}

export async function getPrintOrderByGelatoReference(ref: string): Promise<PrintOrderRow | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("print_orders")
    .select("*")
    .eq("gelato_order_reference", ref)
    .maybeSingle();
  if (error) {
    throw new Error(`getPrintOrderByGelatoReference failed: ${error.message}`);
  }
  return (data ?? null) as PrintOrderRow | null;
}

// ─── Alerts ────────────────────────────────────────────────────────────────

export type AlertSeverity = "low" | "medium" | "high";

export interface InsertAlertInput {
  printOrderId: string | null;
  severity: AlertSeverity;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Insert an alert row. If severity='high' the caller should additionally fire
 * the Telegram alert via sendTelegramPrintAlert(). They're separate so the
 * Telegram failure path doesn't poison the DB write.
 */
export async function insertPrintOrderAlert(input: InsertAlertInput): Promise<{ id: string }> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("print_order_alerts")
    .insert({
      print_order_id: input.printOrderId,
      severity: input.severity,
      message: input.message.slice(0, 2000),
      details: input.details ?? {},
    })
    .select("id")
    .maybeSingle();
  if (error) {
    throw new Error(`print_order_alerts insert failed: ${error.message}`);
  }
  if (!data?.id) {
    throw new Error("print_order_alerts insert returned no id");
  }
  return { id: data.id as string };
}

// ─── Telegram alert ────────────────────────────────────────────────────────
// Mirrors worker/worker.ts sendTelegramAlert pattern. Never throws — alerting
// failures must never mask the underlying print failure.

const TELEGRAM_CHAT_ID = "8006830504"; // Danny — see ~/.claude/rules/telegram.md

export interface TelegramAlertOpts {
  printOrderId?: string | null;
  shopifyOrderId?: string | null;
  shopifyLineItemId?: string | null;
  sku?: string | null;
  stage?: string;
  reason: string;
}

export async function sendTelegramPrintAlert(opts: TelegramAlertOpts): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[print_orders] TELEGRAM_BOT_TOKEN unset — skipping high-severity alert");
    return;
  }
  try {
    const text =
      `🚨 *Pawtrait print failure*\n\n` +
      `*Stage:* ${escMd(opts.stage ?? "unknown")}\n` +
      (opts.shopifyOrderId ? `*Shopify order:* \`${escMd(opts.shopifyOrderId)}\`\n` : "") +
      (opts.shopifyLineItemId ? `*Line item:* \`${escMd(opts.shopifyLineItemId)}\`\n` : "") +
      (opts.sku ? `*SKU:* ${escMd(opts.sku)}\n` : "") +
      (opts.printOrderId ? `*print_orders.id:* \`${escMd(opts.printOrderId)}\`\n` : "") +
      `\n*Reason:*\n${escMd(opts.reason.slice(0, 800))}\n\n` +
      `Customer was charged. Resolve in Supabase → \`print_orders\`.`;

    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      console.error(
        "[print_orders] telegram_alert_non_2xx",
        JSON.stringify({ status: r.status, body: body.slice(0, 300) }),
      );
    }
  } catch (err) {
    console.error(
      "[print_orders] telegram_alert_threw",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
  }
}

/** Escape Telegram MarkdownV1 special chars (we use plain Markdown, not v2). */
function escMd(s: string): string {
  return s.replace(/([_*`\[])/g, "\\$1");
}

// ─── Convenience: alert + Telegram in one call ─────────────────────────────

export async function recordHighSeverityFailure(args: {
  printOrderId: string;
  shopifyOrderId?: string | null;
  shopifyLineItemId?: string | null;
  sku?: string | null;
  stage: string;
  message: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  // Dedup: if we've already alerted on this (print_order_id, stage)
  // combination, skip the alert + Telegram. Without this the cron worker
  // re-fires the same alert every minute as long as the row stays pending,
  // which floods the ops Telegram channel and trains them to mute it.
  const sb = getSupabaseAdmin();
  try {
    const { data: existing } = await sb
      .from("print_order_alerts")
      .select("id")
      .eq("print_order_id", args.printOrderId)
      .eq("severity", "high")
      .eq("details->>stage", args.stage)
      .limit(1);
    if (existing && existing.length > 0) {
      console.log(
        "[print_orders] alert_deduped",
        JSON.stringify({ printOrderId: args.printOrderId, stage: args.stage }),
      );
      return;
    }
  } catch (err) {
    // Fall through to insert if the lookup fails — over-alerting is
    // strictly safer than missing a real failure.
    console.warn(
      "[print_orders] alert_dedup_lookup_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
  }

  try {
    await insertPrintOrderAlert({
      printOrderId: args.printOrderId,
      severity: "high",
      message: args.message,
      details: { stage: args.stage, ...(args.details ?? {}) },
    });
  } catch (err) {
    console.error(
      "[print_orders] alert_insert_failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
    // continue — Telegram is the more important channel for ops
  }
  await sendTelegramPrintAlert({
    printOrderId: args.printOrderId,
    shopifyOrderId: args.shopifyOrderId,
    shopifyLineItemId: args.shopifyLineItemId,
    sku: args.sku,
    stage: args.stage,
    reason: args.message,
  });
}

// ─── Gelato webhook dedupe ─────────────────────────────────────────────────

/**
 * Atomic dedupe via PK on event_id. Returns true if this is the first time
 * we've processed this event, false if it's a replay.
 */
export async function recordGelatoWebhookEvent(args: {
  eventId: string;
  eventName: string;
  payload: unknown;
}): Promise<{ firstTime: boolean }> {
  const sb = getSupabaseAdmin();
  const { error, data } = await sb
    .from("gelato_webhook_events")
    .upsert(
      {
        event_id: args.eventId,
        event_name: args.eventName,
        raw_payload: args.payload as Record<string, unknown>,
      },
      { onConflict: "event_id", ignoreDuplicates: true },
    )
    .select("event_id");
  if (error) {
    throw new Error(`gelato_webhook_events upsert failed: ${error.message}`);
  }
  return { firstTime: Array.isArray(data) && data.length > 0 };
}

// ─── pawtrait_touchpoints ──────────────────────────────────────────────────

export type PawtraitTouchpointType =
  | "shipped"
  | "delivered"
  | "unboxing_followup"
  | "review_request"
  | "reorder_nudge";

export interface InsertPawtraitTouchpointInput {
  printOrderId: string;
  userId?: string | null;
  touchpointType: PawtraitTouchpointType;
  scheduledFor: Date;
  email?: string | null;
  petName?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Idempotent on (print_order_id, touchpoint_type). Returns whether a new row
 * was inserted (so the Gelato webhook handler can log accurately).
 *
 * Note: writes to `account_id` (the column name from the lifecycle migration
 * — the union schema we settled on after touchpoints-unify migration
 * 20260509000000). The repo's input field is named `userId` for callsite
 * symmetry with print_orders.user_id; we map it across.
 */
export async function insertPawtraitTouchpoint(
  input: InsertPawtraitTouchpointInput,
): Promise<{ inserted: boolean }> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("pawtrait_touchpoints")
    .upsert(
      {
        print_order_id: input.printOrderId,
        account_id: input.userId ?? null,
        touchpoint_type: input.touchpointType,
        scheduled_for: input.scheduledFor.toISOString(),
        email: input.email ?? null,
        pet_name: input.petName ?? null,
        metadata: input.metadata ?? {},
      },
      {
        onConflict: "print_order_id,touchpoint_type",
        ignoreDuplicates: true,
      },
    )
    .select("id");
  if (error) {
    throw new Error(`pawtrait_touchpoints insert failed: ${error.message}`);
  }
  return { inserted: Array.isArray(data) && data.length > 0 };
}
