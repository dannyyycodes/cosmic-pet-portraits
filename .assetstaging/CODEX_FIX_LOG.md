# Codex Fix Log - 2026-05-17

## Step 0

Split accepted. The assigned tasks are contained in the Codex-owned files listed in `.assetstaging/COLLAB_FIX_PLAN.md`; no swaps proposed before editing.

## Step 2

### C1 - server-side price lock

- `api/cart/checkout.ts:46` added `SOUL_EDITION_PRICE_GBP = 40`.
- `api/cart/checkout.ts:211` and `api/cart/checkout.ts:215` detect client-supplied `appliedDiscountPct` and `soulEditionPriceMajor`.
- `api/cart/checkout.ts:256` rejects any public client discount with 400; `api/cart/checkout.ts:259` rejects any client Soul Edition price with 400.
- `api/cart/checkout.ts:347` to `api/cart/checkout.ts:359` no longer builds Shopify draft-order discounts for gift cards.
- `api/cart/checkout.ts:458` prices Soul Edition from the server constant only.

### C3 - auth, SSRF, and image fetch hardening

- `api/portraits.ts:69` added shared Bearer JWT validation helper.
- `api/portraits.ts:587`, `api/portraits.ts:701`, and `api/portraits.ts:2499` require Bearer JWT on `mockup`, `preview`, and `composite`.
- `api/portraits.ts:1603` and `api/portraits.ts:1630` added content-type and max-byte guarded image fetching before Sharp or HF fallback processing.
- `api/portraits.ts:609`, `api/portraits.ts:712`, `api/portraits.ts:2381`, `api/portraits.ts:2424`, and `api/portraits.ts:2509` route user-supplied image URLs through the existing origin allowlist and guarded fetch path, including the cutout HuggingFace fallback.
- `api/portraits.ts:597` pins mockup base product images to the canonical site instead of using request host headers.

### C6 - require print master for paid canvas

- `api/cart/checkout.ts:413` now rejects both `canvas` and `framed-canvas` checkout lines without `printMasterPath` or legacy `printMasterUrl`, regardless of template/AI kind.
- `api/shopify/_lib/extractCanvas.ts:117` documents that paid canvas fulfilment has no source-photo/preview fallback.
- `api/shopify/_lib/extractCanvas.ts:227` sets legacy `sourceImageUrl` only from explicit print-master URL.
- `api/shopify/_lib/extractCanvas.ts:232` logs missing print masters as `MISSING_PRINT_MASTER_MANUAL_REVIEW` instead of falling back to source/preview.

### H1 - disposable email block

- `api/portraits.ts:44` imports the existing maintained disposable-domain helper.
- `api/portraits.ts:2922` blocks disposable emails server-side in `instant-signup` before Supabase OTP issuance.

### H6 - printMaster_submit guard

- `api/portraits.ts:57` added a 12/hour per-user `printMaster_submit` limit.
- `api/portraits.ts:2839` added a reusable user rate-limit helper using the existing `rate_limits` table pattern.
- `api/portraits.ts:3385` added the ownership check for a successful generation owned by the caller; it supports an explicit `generationId` for future clients and preserves the current happy path by matching a recent successful generation for the same user, source photos, and prompt.
- `api/portraits.ts:3487` enforces rate limiting before submitting paid fal work.
- `api/portraits.ts:3502` to `api/portraits.ts:3511` rejects print-master submission without a matching owned successful generation.
- Limitation: there is no persisted server-side "approved" flag today; approval is client state only. The implemented server-verifiable equivalent is owned `status='success'` generation plus exact source photo/prompt match.

### M2 - checkout consent enforcement

- `api/cart/checkout.ts:252` to `api/cart/checkout.ts:276` detects personalised physical canvas and immediate Soul Reading contents and rejects missing required consent timestamps with 400.
- Existing consent metafield/note creation remains unchanged at `api/cart/checkout.ts:480` and `api/cart/checkout.ts:492`.

### LOW return_url - canonical origin pin

- `api/cart/checkout.ts:47` to `api/cart/checkout.ts:51` added the canonical/allowlisted return origins.
- `api/cart/checkout.ts:223` normalises configured return origin defensively.
- `api/cart/checkout.ts:518` builds Shopify `returnUrl` from the allowlisted canonical origin, not request `Origin` or `Host`.

### M4 - typecheck:api fixes

- `api/vercel-node.d.ts:1` adds a local `@vercel/node` type declaration because the installed workspace is missing `node_modules/@vercel/node`.
- `api/_lib/stripe.ts:17` updates the Stripe SDK `apiVersion` to the installed SDK literal.
- `api/stripe/webhook.ts:199` and `api/stripe/webhook.ts:218` handle Stripe type drift for subscription periods and invoice subscription IDs.
- `api/soul-reading.ts:21` imports `SoulReadingJobRow` type used by the intake submit path.
- `api/portraits.ts:2642` fixes the typed library-row filter without weakening runtime behavior.
- Frontend files named by `typecheck:api` fixed mechanically: `src/components/portraits/tokens.ts:32`, `src/components/portraits/templates/TemplatePreview.tsx:114`, `src/components/portraits/useCredits.ts:27`, `src/components/report/BirthChartTable.tsx:1`, `src/components/report/ReadingTransition.tsx:1`, `src/components/report/PokemonStyleCard.tsx:68`, `src/components/report/StoryCardExport.tsx:43`, `src/components/report/ViralPetCard.tsx:58`, and `src/pages/BlogPost.tsx:115`.
- Used `unknown` casts only where generated Supabase/Stripe types are stale relative to live tables or SDK runtime shapes; no `any` or `@ts-ignore` was added.

### Verification

- `npm run typecheck:api` failed on the first run with existing M4 errors plus two checkout cast errors.
- After fixes, `npm run typecheck:api` passed cleanly.
- No migrations were needed.
- No deploy was run.
