/**
 * Fire-and-forget POST to the n8n Soul Reading webhook.
 *
 * Bounded with AbortSignal.timeout so a hung n8n doesn't blow our 5-second
 * Shopify ack budget when called inside the orders/paid handler. The caller
 * additionally wraps the whole batch in Promise.race against a 4.5s deadline.
 *
 * Spec: research-2026-05-04-soul-reading-fulfilment §4.1 (HTTP shape).
 */
import { N8N_SOUL_READING_WEBHOOK_URL } from "../../_lib/soulReadingConfig.js";
import { markTriggered, markPendingFailure, type SoulReadingJobRow } from "./jobsRepo.js";

const N8N_TIMEOUT_MS = 8_000;

export interface TriggerN8nResult {
  ok: boolean;
  status?: number;
  detail?: unknown;
  error?: string;
}

/**
 * POST a single job to the n8n webhook. Updates the job row on success or
 * failure. Does NOT throw — returns a typed result so callers can iterate.
 */
export async function triggerN8nForJob(row: SoulReadingJobRow): Promise<TriggerN8nResult> {
  const siteBaseUrl = process.env.PUBLIC_SITE_URL ?? "https://littlesouls.app";
  const viewerUrl = row.viewer_token
    ? `${siteBaseUrl}/reading/${row.viewer_token}`
    : null;

  const body = {
    jobId: row.id,
    orderId: row.shopify_order_id,
    lineItemId: row.shopify_line_item_id,
    customerEmail: row.customer_email,
    petName: row.pet_name,
    petDob: row.pet_dob,
    petBirthLocation: row.pet_birth_location,
    viewerToken: row.viewer_token,
    viewerUrl,
    source: "shopify-order-paid",
    eventId: row.shopify_event_id,
  };

  let resp: Response;
  try {
    resp = await fetch(N8N_SOUL_READING_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Source": "shopify-order-paid",
        "X-Idempotency-Key": `${row.shopify_event_id}:${row.shopify_line_item_id}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await safeMark(() => markPendingFailure({ jobId: row.id, errorText: `n8n network: ${message}` }));
    return { ok: false, error: message };
  }

  if (!resp.ok) {
    const text = await safeText(resp);
    await safeMark(() =>
      markPendingFailure({
        jobId: row.id,
        errorText: `n8n ${resp.status}: ${text.slice(0, 500)}`,
      }),
    );
    return { ok: false, status: resp.status, detail: text };
  }

  let payload: unknown = null;
  try {
    const text = await resp.text();
    if (text.length > 0) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text.slice(0, 1000) };
      }
    }
  } catch {
    payload = null;
  }

  await safeMark(() => markTriggered({ jobId: row.id, responseJson: payload }));
  return { ok: true, status: resp.status, detail: payload };
}

async function safeText(r: Response): Promise<string> {
  try {
    return await r.text();
  } catch {
    return "";
  }
}

async function safeMark(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    // Logging here is best-effort — the row may simply not get its status
    // updated this cycle. The cron will pick it up.
    console.error(
      "[triggerN8n] status update failed",
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
    );
  }
}
