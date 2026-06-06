# Collaboration — Pawtraits audit fixes (Codex ⇄ Claude)

Source of truth: `AUDIT_REPORT_2026-05-17.md` (repo root). Live revenue site.
Claude and Codex fix DISJOINT file sets in parallel, then cross-review, then a
joint final gate.

## STEP 0 — agree the split (do this first, in this file)
Read the report + the split below. If you (Codex) disagree with any assignment
on capability/risk grounds, say so at the top of `.assetstaging/CODEX_FIX_LOG.md`
and propose a swap BEFORE editing. Otherwise record "split accepted" and proceed.

## CODEX OWNS (edit only these files):
- `api/cart/checkout.ts`
- `api/portraits.ts`
- `api/shopify/_lib/extractCanvas.ts`
- `api/_lib/shopifyAdmin.ts` (only if required by C1)
- whatever files `npm run typecheck:api` flags as errored (api/* + the
  specific frontend files it names)

### Codex tasks
- **C1 (CRITICAL):** server-side hard-lock prices. Add `SOUL_EDITION_PRICE_GBP`
  const, never read `soulEditionPriceMajor` from the body. Remove
  `appliedDiscountPct` from accepted public input entirely (no client discount;
  leave a server-only path stub if one is needed later). Reject any client
  attempt with 400.
- **C3 (CRITICAL):** require Bearer JWT on `mockup`, `composite`, `preview`
  handlers (mirror `handleGenerate`/`handleCutout` auth). Apply the existing
  `validateImageUrlOrigin()` before EVERY user-supplied URL fetch incl. the
  cutout HF fallback. Enforce content-type + max bytes before Sharp.
- **C6 (CRITICAL):** in checkout, require `printMasterPath` for
  `productType` `canvas` and `framed-canvas` (return 400 if missing). In
  `extractCanvas.ts` remove the source-photo / preview fallback for normal
  paid canvas lines (route missing → manual review instead of printing).
- **H1 (HIGH):** enforce disposable-email block server-side in the
  instant-signup handler (use npm `disposable-email-domains` if available,
  else a substantially expanded list) before issuing OTP/credit.
- **H6 (HIGH):** `printMaster_submit` must require an approved generation
  owned by the caller AND a per-user rate limit (reuse existing rate-limit
  helper pattern). No unmetered paid fal jobs.
- **M2 (MED):** reject checkout bodies missing required consent for the cart
  contents (personalised physical / immediate-delivery reading).
- **LOW return_url:** pin post-payment return URL to canonical site origin
  (allowlist), not the request `Origin` header.
- **M4 (MED):** fix the real `typecheck:api` TypeScript errors so it passes
  clean. Do NOT mask with `any`/`@ts-ignore` unless genuinely unavoidable
  (justify in the log if so).

## CLAUDE OWNS (Claude edits only these):
`api/shopify.ts`, `api/gelato/webhook.ts`, `api/cron/gelato-worker.ts`,
`api/cron/generation-recovery.ts`, `api/_lib/canvasFulfillment.ts`,
`api/_lib/digitalFulfillment.ts`, `api/_lib/printOrdersRepo.ts`, `vercel.json`,
new `api/cron/*` reconcile, `src/components/portraits/*`, `src/pages/Portraits.tsx`.
(C2, C4, C5 code-guard, C7, H2, H3-recovery side, H4, H5, H7, H8, M9, OG/TTL.)

No file is in both sets → no collisions. If you find you must touch a
Claude-owned file, STOP and note it in the log instead.

## RULES (both)
- Read-only on prod DATA. Code edits OK (that's the job). Do NOT run prod
  Stripe/Gelato calls or create orders while testing.
- Preserve the working happy path — a legit user must still upload→generate→
  approve→checkout exactly as before. Security tightening must 400 only the
  abuse cases.
- Any DB schema need (e.g. `gelato_webhook_events.status`,
  `print_orders.locked_until`) → write the SQL migration to
  `supabase/migrations/` AND make code defensive if the column is absent
  (don't hard-crash pre-migration).
- After your edits, run `npm run typecheck:api` and report pass/fail in the
  log. Do not deploy — Claude runs the joint build+deploy gate.

## STEP 2 — Codex: execute your set now.
Write `.assetstaging/CODEX_FIX_LOG.md`: split accepted/changes, then per task
(C1, C3, C6, H1, H6, M2, return_url, M4): files+lines changed, what you did,
typecheck:api result, anything you couldn't safely do. Be precise.

## STEP 3 — cross-review (after both done): each reviews the other's diff.
## STEP 4 — Claude: joint final gate — typecheck:api green, build green,
deploy P0 then P1, verify live.
