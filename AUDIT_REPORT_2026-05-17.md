# Pawtraits / Little Souls — Full System Audit (2026-05-17)

Commit: `43457f3` · Scope: frontend, backend, webhooks, payments, API, security,
reliability, customer-promise. Method: 5 independent Claude sub-agents + Codex
independent audit + live safe probes, cross-compared. All testing read-only;
**$0 spent**, no prod data mutated, no real charges.

Confidence key: **[3×]** found by ≥3 independent passes · **[2×]** by 2 ·
**[1×]** single pass (still verified by file:line).

---

## VERDICT

Happy path works. **Not safe to take real money at scale yet.** Revenue can be
drained (price tamper, free gift cards, free-credit farm, free paid-gen), some
paid orders can silently never ship or ship the wrong image, and there is an
unauthenticated SSRF + cost-burn hole. Every issue is fixable; fix patterns
already exist in the codebase. Prioritised plan at the bottom.

---

## CRITICAL

### C1 — Client controls price on custom-priced lines [3×]
`api/cart/checkout.ts` (Soul Edition ~417-434; gift-card discount 287-329)
Soul Edition price (`soulEditionPriceMajor`) and gift-card `appliedDiscountPct`
are taken from the request body and forwarded to the Shopify draft order
unvalidated. PoC: buy the £40 Soul Edition for £0.01, or a £129 gift card at
100% off. Standard SKUs (canvas/mug/tee) are safe — Shopify catalog governs
those. Only the custom-priced/discount paths are open.
**Fix:** hard-code `SOUL_EDITION_PRICE_GBP=40` server-side; remove
`appliedDiscountPct` from public input (server-issued signed promo only); reject
discount >0 unless from a trusted flow.

### C2 — Refunded canvas still prints & ships [2×]
`api/shopify.ts` refunds/create handler (~566-712)
Refund handler only looks at `soul_reading_jobs`; never touches `print_orders`,
no Gelato cancel call exists anywhere. Refund inside the window → customer keeps
the money AND receives the canvas. Loss = print+ship per incident.
**Fix:** in refunds/create, look up `print_orders` by (order,line). If
pending → set `canceled`. If submitted/printed → call Gelato cancel API + ops
alert. If shipped/delivered → log only.

### C3 — Unauthenticated SSRF + unlimited cost burn [3×]
`api/portraits.ts` handleMockup (~567-612), handleComposite (~2425-2451),
handlePreview (~673-708); cutout HF fallback (~2311)
`mockup`/`composite`/`preview` fetch caller-supplied URLs server-side with no
auth and no allowlist → SSRF to `http://169.254.169.254/` (AWS metadata) etc.
Same endpoints unauthenticated = anyone can run unlimited fal.ai/Photoroom
calls on our key (direct $$ burn).
**Fix:** require Bearer JWT on mockup/composite/preview; apply the existing
`validateImageUrlOrigin()` before every user-URL fetch (incl. cutout HF path);
enforce content-type + max-bytes before Sharp.

### C4 — Gelato webhook drops events on first-delivery failure [3×]
`api/gelato/webhook.ts` (~168-214)
Dedupe row is written BEFORE `processGelatoEvent`. If processing throws (DB
blip) we 500; Gelato's retry hits the replay branch and 200s without ever
applying the status update / shipped-delivered touchpoint. Order state drifts
from reality permanently, no alert.
**Fix:** add `status` (processing/processed/failed) to `gelato_webhook_events`,
only mark processed after side-effects; reprocess failed/stale on retry. (Or
delete the dedupe row in the catch before 500, like the Stripe webhook does.)

### C5 — Two parallel Stripe webhook handlers, no coordination [1×]
`api/stripe/webhook.ts` and `supabase/functions/stripe-webhook/index.ts`
Both handle `checkout.session.completed` with separate dedupe stores. Depending
on Stripe dashboard registration → double credit grants, double emails,
orphaned canvas touchpoints for non-canvas orders.
**Fix:** audit the Stripe dashboard endpoint→event registration NOW; consolidate
to one handler or add a shared events table both check.

### C6 — Paid canvas can have NO print master → ships wrong/low-q image [1× Codex]
`api/cart/checkout.ts` (~370-382); `api/shopify/_lib/extractCanvas.ts`
(~217-227)
Checkout requires a print master for template & digital lines but **not** for
AI physical canvas. `extractCanvas` then falls back to legacy URL → source
photo → preview. A crafted/edge checkout pays for a canvas that prints the
customer's raw uploaded snapshot or a low-res preview.
**Fix:** require `printMasterPath` for `canvas`/`framed-canvas`; remove
source/preview fallback for paid canvas; missing → manual review before pay.

### C7 — Cron timeout doesn't cancel in-flight Gelato → duplicate prints [3×]
`api/cron/gelato-worker.ts` (~153-201); `api/_lib/canvasFulfillment.ts` (~150)
Row kept `pending` while claimed; 60s `Promise.race` doesn't abort the
in-flight pipeline; next tick re-claims and can submit a 2nd Gelato order for
the same line. Also: if Gelato submit succeeds but the `submitted` DB write
fails, next tick re-submits. Customer can get 2 canvases / double prod cost.
**Fix:** atomic claim `pending→processing` with `locked_until` lease;
AbortSignal through AuraSR/Gelato; re-read & check no `gelato_order_id` before
POST; treat duplicate-reference Gelato response as success.

---

## HIGH

### H1 — Free-credit farm: disposable-email block is client-only [2×]
`src/lib/auth/disposableEmailDomains.ts`; server `action=instant-signup`
Block runs only in React. Live-probed: `yopmail.com` → server 200, OTP issued,
1 free credit minted. List is also incomplete (~105 domains).
**Fix:** enforce server-side in `handleInstantSignup` using a maintained list
(npm `disposable-email-domains`) before Supabase OTP.

### H2 — Shipped/delivered emails sent with null recipient [1×]
`api/gelato/webhook.ts` (~311-318)
Reads `metadata.customerEmail`; the email is actually written at
`metadata.cron.customerEmail` (`api/shopify.ts:214`). Every touchpoint row gets
`email=null` → customer never told it shipped/arrived.
**Fix:** `const email = (meta.cron as any)?.customerEmail ?? null;`

### H3 — Double-refund races [1×]
`api/portraits.ts` handleGenerationStatus (~2219-2257);
`api/cron/generation-recovery.ts` (~79-147)
Concurrent polls / overlapping cron ticks both call `grant_credits` for one
failed gen → 2 tokens refunded for 1 spend. No atomic claim.
**Fix:** gate terminal transition with `UPDATE…WHERE status='pending'
RETURNING id`; refund only if the claim succeeded; add claim step to recovery
cron.

### H4 — gelato-worker has no Vercel fallback / no maxDuration [2×]
`vercel.json`; `api/cron/gelato-worker.ts`
Only pg_cron triggers it; if pg_cron drops, paid canvases queue forever with no
backstop. No `maxDuration` set → may be SIGKILL'd mid-row on plan default.
**Fix:** add a Vercel cron fallback + `"maxDuration": 300` for the cron routes;
add a daily Shopify-paid-vs-print_orders reconciliation with Telegram alert.

### H5 — Digital delivery failure is terminal, never retried [1× Codex]
`api/cron/gelato-worker.ts` (~125); `api/_lib/digitalFulfillment.ts`
(~153-169)
A transient Resend/network failure after payment sets `status='failed'`; worker
only drains `pending` → customer paid, no delivery, no auto-retry.
**Fix:** keep transient failures retryable (`pending`+attempts or `retry_at`),
manual_review only after MAX_ATTEMPTS; idempotent email send key.

### H6 — printMaster_submit = unmetered paid generation [1× Codex]
`api/portraits.ts` (~3270-3371)
Auth'd but consumes no credit, no rate limit, no ownership check vs an approved
generation → any account scripts unlimited high-quality fal jobs.
**Fix:** require an approved generation owned by the caller; per-user rate
limit; meter/refund an entitlement.

### H7 — Generate button enabled at 0 credits [1×]
`src/components/portraits/StudioFlow.tsx` (~839)
`canGenerate` ignores `balance`. 0-credit user clicks, waits a full round-trip,
gets an error toast. Flow dies.
**Fix:** add `&& (balance==null||balance>0)`; relabel button "Top up to
generate →" at 0.

### H8 — Cart lightbox is a keyboard trap (a11y) [1×]
`src/components/portraits/CartDrawer.tsx` (~473-531)
`role=dialog` with no Escape handler, no focus trap, no autofocus → keyboard/SR
users stuck, can't reach checkout.
**Fix:** Escape handler + focus trap + autofocus close button.

---

## MEDIUM (summary — full detail in agent logs)

- **M1 Prompt-injection mitigation shallow** — `sanitiseAddDetails` blocks 10
  crude words; semantic NSFW/injection passes to fal. Add ~50-term list +
  OpenAI Moderation (free) pre-pass. Vision pre-pass is safe (role+JSON).
- **M2 Consent not enforced server-side** — direct API checkout can omit
  consent for personalised/immediate-delivery items (legal record gap).
- **M3 create-payment-intent** unauth creates ≤10 `pet_reports` rows/req, no
  rate limit → prod-data spam.
- **M4 Static type/build gates RED** — `typecheck:api` has real errors
  (api/portraits.ts, api/stripe/webhook.ts, api/soul-reading.ts,
  useCredits.ts, PortraitsStudio.tsx). Type drift may already ship bugs. Add
  CI gate.
- **M5 Error messages leak internals** — many `detail:(err).message` return
  Supabase/Sharp/path text to clients.
- **M6 Library list exposes `prompt`/`negative_prompt`** unauth.
- **M7 Action enumeration** — unknown-action 400 lists the full API surface.
- **M8 Currency hardcoded GBP** — every non-UK visitor sees £; USD path is
  dead code (conversion loss, not a security issue).
- **M9 updatePrintOrder read-modify-write race** on attempts/metadata (no
  lock/txn); can downgrade `shipped`→`failed`.
- **M10 No timeouts** on Photoroom/HF/legacy fal `preview` fetches → 300s slot
  hangs.
- **M11 OG/canonical** point to non-www; live is www (SEO split).
- **M12 studioStatePersistence TTL** comment says 4h, code is 24h.

## LOW (summary)

return_url trusts Origin header (post-pay redirect) · admin session in
localStorage · fal queue URLs returned to client · UploadStudio ~530 lines dead
code · ApprovalGate effectively bypassed (auto-approve) · pet-name 40-char
unbounded on print · generation-recovery rehosts to PUBLIC bucket · Gelato
non-HMAC token (acceptable, add 401-surge alert) · Telegram stuck-row alert cap
hides true count.

---

## PRIORITISED FIX PLAN

**P0 — revenue/security, do first (all small, low-risk):**
1. C1 server-side price/discount lock (`checkout.ts`)
2. C3 auth + `validateImageUrlOrigin` on mockup/composite/preview
3. H1 server-side disposable-email block
4. C5 audit Stripe dashboard webhook registration (config, not code)

**P1 — paid-but-broken fulfilment:**
5. C4 Gelato webhook dedupe-after-process
6. C2 refund → cancel print_orders/Gelato
7. C6 require print master for paid canvas
8. H2 fix shipped/delivered email recipient path
9. C7 atomic lease on gelato-worker + idempotent Gelato submit

**P2 — reliability/UX:**
10. H3 double-refund atomic claim · H4 cron fallback+maxDuration+reconcile ·
    H5 digital retry · H6 meter printMaster_submit · H7 0-credit button ·
    H8 lightbox a11y · M4 fix red type gates + CI

**P3:** remaining MEDIUM/LOW.

Nothing here requires rebuilding anything. P0+P1 ≈ a focused day; they close
the money-loss and silent-no-canvas holes.
