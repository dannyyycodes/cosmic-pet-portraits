# Fulfilment chain QA — 2026-05-11

## Summary

The chain is **structurally sound and well-instrumented**. Cart → Shopify draft → orders/paid webhook → `print_orders` row → pg_cron worker → AuraSR + preflight + Gelato submit, with HMAC verification, idempotency, bounded retries, stuck-row sweeper, durable-URL rehosting, and Telegram alerting on failure. The biggest gap is on the **template/Tier-0 path** where the cart relies on `printMasterUrl` — if absent, the line still goes through but Gelato gets the unscaled `previewUrl` (low-DPI) silently. The Stripe credit-pack path correctly does not fire fulfilment.

## End-to-end trace

1. **Add to cart** — `CartItem` carries `productType`, `sizeKey`, `frameColor`, `previewUrl`, `sourcePhotoUrl`, optional `printMasterUrl` (template kind only).
2. **POST /api/cart/checkout** — `api/cart/checkout.ts:240-247` resolves variantId via composite `${sizeKey}__${frameColor}` against `PRODUCT_VARIANTS["framed-canvas"]` (lines 50-82), with legacy fallback (85-88). Properties built at `:252-262` include `Source photo`, `Preview portrait`, and (template only) `Print master (Gelato)`. Draft order created via `createDraftOrder` (`:339-345`) returns `invoiceUrl`.
3. **Customer pays on Shopify-hosted checkout.**
4. **POST /api/shopify** — `api/shopify.ts:60-83` reads raw body, HMAC-verifies (`SHOPIFY_WEBHOOK_SECRET` enforced at `:73-76`, 401 on mismatch at `:82`). Topic dispatch `:98-106`.
5. **handleOrderPaid** — `extractCanvasFulfillmentLines` (`api/shopify/_lib/extractCanvas.ts:174-223`) reverse-maps `variant_id` → `{sizeKey, frameColor, sku}` via `VARIANT_ID_TO_CANVAS` (built from `FRAMED_CANVAS_V2_VARIANTS`) + legacy v1 map (`:79-84`). `sourceImageUrl = printMasterUrl ?? sourcePhotoUrl ?? previewUrl ?? null` (`:204`).
6. **Persist** — `upsertPrintOrder` (`api/shopify.ts:190-214`) writes `status='pending'` with `metadata.cron = { customerEmail, shippingAddress, currency }` (`:208-212`) so the worker can run independently. Returns 200 to Shopify.
7. **pg_cron worker** — `api/cron/gelato-worker.ts:125-132` picks ≤5 oldest pending rows where `attempts < 3` and `needsCustomisation != true`. Optimistic lock via `attempts++ WHERE status='pending'` (`:153-159`). Stuck-row sweeper at `:69-110` flips rows untouched 5min+.
8. **runCanvasFulfillmentForRow** — `api/_lib/canvasFulfillment.ts:206-250` reconstructs args from `metadata.cron`, validates address (`shopifyAddressToGelato`, `:65-90`), then calls `runPrintPipeline`.
9. **runPrintPipeline** — `api/_lib/printPipeline.ts:145` resolves `productUid = gelatoProductUid(sizeKey, frameColor)` (catalog at `src/components/portraits/gelatoFramedCanvas.ts:129-144`). AuraSR 4× upscale with 2-attempt retry (`:167-218`), preflight gate, rehost to Supabase `pet-photos/print-masters/<orderRef>.png` (`:527-552`) so fal.media expiry can't break Gelato pull. POSTs to `https://order.gelatoapis.com/v4/orders` with single 5xx retry (`:558-625`).
10. **Status update** — `canvasFulfillment.ts:132-163` flips to `submitted` with `gelatoOrderId`; failures → `failed`/`manual_review` + `recordHighSeverityFailure` (Telegram).

## Risks

**P0**
- **Template `printMasterUrl` silently optional.** `api/cart/checkout.ts:259-261` only attaches it for `isTemplate`, and there's no validation that templates have one. Missing → Gelato is fed the 1024px `previewUrl` upscaled 4× = ~4096px, but a low-quality source. Preflight may pass on resolution while masking poor source quality. **No log distinguishes "no print master found" at extract time** (`extractCanvas.ts:204` silently falls back).

**P1**
- **Address-only failure has no customer-facing signal.** Missing shipping fields → `manual_review` + Telegram, but customer never told.
- **AuraSR 3-min timeout × 3 attempts × 2 inner retries** can monopolise a Vercel function (Hobby ~10s, Pro 60s default). The cron handler doesn't enforce a per-row deadline; with BATCH_SIZE=5, one slow row could starve the rest.
- **Idempotency on Gelato side relies on `orderReferenceId = ls-{orderId}-{lineItemId}`** (`printPipeline.ts:483`). Good — but if a webhook replay happens after `submitted`, the cron worker filters by `status='pending'|'failed'` only (`api/shopify.ts:257-260`), so duplicate Shopify webhook is safe. **No verified test that Gelato itself rejects duplicate orderReferenceId** — assumed.
- **Stripe webhook canvas detection is moot** but `detectCanvasSku` (`api/stripe/webhook.ts:282-304`) returns true on a `mode='payment'` session whose product name contains "canvas/framed/portrait/wall art". Since canvas now goes via Shopify, this never fires for canvas — but if anyone wires a Stripe Price with one of those keywords (e.g. a future canvas-via-Stripe experiment), it would schedule pawtrait touchpoints AND skip credit grant. Watch for cross-contamination.

**P2**
- `STRIPE_WEBHOOK_SECRET` check at `api/stripe/webhook.ts:53-55` returns **400** (not 401) — Stripe will retry which is correct, but log noise.
- Rehost failure is non-fatal (`printPipeline.ts:241-249`) — falls back to fal URL. Acceptable, but no alert if rehost fails repeatedly.

## Recommended actions

1. **(P0)** In `api/cart/checkout.ts`, require `printMasterUrl` for `kind === "template"` framed-canvas items; reject 400 if missing. Add a `console.warn` in `extractCanvas.ts:197-204` when neither `printMasterUrl` nor `sourcePhotoUrl` is present (only `previewUrl`).
2. **(P1)** Add a per-row deadline in `gelato-worker.ts` (e.g. `Promise.race` against ~45s) so one stuck AuraSR can't drown the batch. Stuck-sweeper already catches the row, but the function still wastes the invocation.
3. **(P1)** Surface `manual_review` rows with bad addresses to a Slack/Telegram channel that includes the customer email so ops can email them.
4. **(P1)** Add a smoke test that POSTs the same `orderReferenceId` to Gelato twice in dry-run/staging to confirm dedupe behaviour, document in `printPipeline.ts`.
5. **(P2)** Consider a Sentry alert on `[printPipeline] rehost_failed` count over time — silent fal-URL fallback is fine once, repeating means storage problems.
6. **(P2)** Audit Stripe Price names to ensure none contain canvas keywords, or add an explicit `metadata.is_canvas !== "true"` gate before keyword scan in `detectCanvasSku`.
