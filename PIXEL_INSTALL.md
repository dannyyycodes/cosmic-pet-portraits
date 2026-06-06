# Meta Pixel + Conversion API — install instructions

Code is already merged. The install is a no-op until env vars are set in Vercel — safe to deploy without breaking anything.

## What was added

| File | Change |
|---|---|
| `index.html` | Meta Pixel base script (env-gated via `%VITE_META_PIXEL_ID%`) |
| `src/lib/metaPixel.ts` | Typed wrapper + `<MetaPixelRouteTracker />` SPA route fire |
| `src/App.tsx` | Mounts `<MetaPixelRouteTracker />` inside `BrowserRouter` |
| `api/_lib/metaCapi.ts` | Server-side CAPI Purchase helper |
| `api/stripe/webhook.ts` | Calls `capiPurchase()` on `checkout.session.completed` |

## Step 1 — Get the credentials from Meta Business Manager (5 min)

1. Open Meta Business Manager → **Events Manager** → click your Pixel (or create one).
2. Copy the **Pixel ID** (digits only, e.g. `1234567890123456`).
3. Settings tab → **Generate access token** under "Conversions API". Copy it.
4. (Optional, for testing) Settings → **Test Events** tab → copy the test event code (e.g. `TEST12345`).

If you don't have a Pixel yet:
- Events Manager → **Connect data sources** → Web → Meta Pixel → Connect → name it "Little Souls" → enter `https://www.littlesouls.app` → use **Conversions API and Meta Pixel** (both, not just Pixel).

## Step 2 — Add to Vercel env vars (2 min)

Vercel project for `littlesouls.app` → Settings → Environment Variables → add to **Production** (and Preview if you want testing on PRs):

| Name | Value | Notes |
|---|---|---|
| `VITE_META_PIXEL_ID` | digits | Inlined at build time into the HTML. Required for client-side Pixel. |
| `META_PIXEL_ID` | digits (same) | Used server-side by CAPI. |
| `META_CAPI_TOKEN` | the access token | Long string. Server-side only — don't expose to client. |
| `META_CAPI_TEST_EVENT_CODE` | TEST12345 | OPTIONAL. Set during initial verification, remove for production. |

## Step 3 — Redeploy

`git push` (or trigger a manual deploy in Vercel) — Vite rebuilds with `VITE_META_PIXEL_ID` baked into `index.html`.

## Step 4 — Verify (10 min)

### Browser pixel firing
1. Install the [Meta Pixel Helper Chrome extension](https://chromewebstore.google.com/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc).
2. Visit `https://www.littlesouls.app/pawtraits` — extension should show your Pixel ID + `PageView` event.
3. Navigate to another page (e.g. `/`) — extension should fire another `PageView` (proves the SPA route tracker works).

### CAPI firing
1. Events Manager → your Pixel → **Test Events** tab → enter the test event code (must match `META_CAPI_TEST_EVENT_CODE` env var).
2. Make a £0.50 test purchase via Stripe test mode (or use a refundable real one).
3. Within ~30s the Test Events tab should show:
   - `PageView` (browser)
   - `Purchase` (server, marked "Server" badge)
4. **Browser+server dedup:** since `event_id` is the Stripe session ID, FB will dedupe — confirm only one Purchase appears, not two.

### Production cutover
After verification works:
- Remove `META_CAPI_TEST_EVENT_CODE` env var
- Redeploy
- Real purchases will now flow to Pixel attribution

## Step 5 — Set the ad URL

In Facebook Ads Manager, set the v3.1 ad's destination URL to exactly:

```
https://www.littlesouls.app/pawtraits
```

(NOT `littlesouls.app/pawtraits` or `/portraits` — those add a redirect hop that can break attribution and slows TTFB.)

## What this gets you on day 1

- **PageView** on every route (client + server-side noscript fallback)
- **Purchase** server-side via CAPI on every Stripe checkout completion
- Browser+server dedup via stable `event_id` (Stripe session ID)
- Hashed PII (email, name, phone, city, country) so FB can match users back to their accounts for conversion attribution

## What's deliberately NOT installed yet (add later if needed)

- `ViewContent` on Pawtraits page mount — useful for retargeting
- `AddToCart` on add-to-cart click — useful but not critical for cold-traffic optimization
- `InitiateCheckout` on Stripe redirect — same
- `fbp` / `fbc` cookie capture for CAPI dedup — currently passed via Stripe metadata if available; needs frontend wiring to set them. Without it dedup still works via `event_id` but match quality is slightly lower.

These take ~30 min each to add. Pixel base + Purchase via CAPI is the minimum viable install — gets FB the optimization signal it needs to make `£500` ad spend efficient.

## Other launch-blocker fixes (separate from Pixel)

1. **Fix `shop.littlesouls.app` 403:** Cloudflare DNS → find `shop` CNAME → click orange cloud to grey-cloud (DNS only — Shopify doesn't work behind Cloudflare proxy).
2. **Confirm `/pawtraits` page renders correctly in production** — open `https://www.littlesouls.app/pawtraits` in an incognito window, verify the React route loads the Portraits page (not a blank/404 fallback).
