# Codex task — SCOPE a full audit + live-test plan for this repo

This repo (`cosmic-pet-portraits`, deployed at littlesouls.app) sells AI/hand-
painted pet portrait canvases: upload photo → describe → see portrait →
approve → pay → framed canvas delivered ~3-5 days.

You and Claude are BOTH going to audit this independently then cross-compare.
First, produce the **master test plan** — all-inclusive, nothing missed.

Write your plan to `.assetstaging/AUDIT_PLAN_CODEX.md`. Cover:

1. **Architecture map** — frontend entry/routes, backend (`api/*`, supabase
   functions, droplet worker), webhooks (Stripe, n8n bridge, Gelato), external
   APIs (OpenRouter, Gelato, Supabase, image gen), the full money + fulfilment
   path.
2. **Test matrix** by domain, each as concrete checks:
   - Frontend: studio flow, multi-pet, approval gate, auth gate, checkout,
     currency, broken/empty/error states, mobile.
   - Backend: generate + printMaster endpoints, recovery cron, error paths,
     idempotency, timeouts.
   - Payments: Stripe flow, price integrity vs `gelatoFramedCanvas.ts`,
     client-side price tamper, currency rounding, double-charge, refund.
   - Webhooks: signature verification, replay, out-of-order, failure retry.
   - Security: secret exposure, auth/RLS, **prompt-injection via the studio
     prompt box**, SSRF via image URLs, disposable-email bypass, rate limiting,
     IDOR on orders/portraits, XSS.
   - Reliability: retry/backoff, partial-failure recovery, queue stuck.
   - Customer-promise: does every step actually deliver end-to-end.
3. **Weird/unique prompt cases** to actually run (≥10): injection, absurd,
   empty, huge, non-English, NSFW, non-pet photo, multi-pet, emoji-only, etc.
4. **Risk/cost guardrails** — what is SAFE to run against prod vs must be
   test-mode/dry-run (real Stripe charges, paid gen calls, webhook spam).
   Explicitly mark anything that costs money or mutates prod data.
5. **Severity rubric** (Critical/High/Med/Low) + report format.

Be exhaustive and specific (file paths, endpoints). This plan must be good
enough that nothing important is missed. Report when written.
