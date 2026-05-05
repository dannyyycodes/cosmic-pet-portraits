/**
 * Local end-to-end test for /api/shopify/order-paid.
 *
 * What it does:
 *   1. Constructs a sample Shopify orders/paid payload (canvas line + Soul
 *      Reading line with valid pet_name/dob/location properties).
 *   2. Computes a valid X-Shopify-Hmac-Sha256 from the raw JSON bytes using
 *      a known test secret.
 *   3. POSTs to http://localhost:3000/api/shopify/order-paid with the headers
 *      Shopify sends.
 *   4. Asserts a 200 response and the expected accepted/dryRun shape.
 *   5. RE-POSTs the SAME payload — asserts second call is idempotent
 *      (accepted=0, duplicates>=1).
 *
 * Intended to run against `npm run dev` localhost. NEVER runs against
 * production. If localhost is unreachable, prints clear how-to-run
 * instructions and exits 0 — so this script is also a doc.
 *
 * Required env (set inline for the test):
 *   SHOPIFY_WEBHOOK_SECRET — anything; must be set in BOTH the dev server's
 *     env AND this script. Default below: "test-webhook-secret-do-not-use-in-prod".
 *
 * Run:
 *   # In one terminal:
 *   SHOPIFY_WEBHOOK_SECRET=test-webhook-secret-do-not-use-in-prod npm run dev
 *
 *   # In another:
 *   SHOPIFY_WEBHOOK_SECRET=test-webhook-secret-do-not-use-in-prod \
 *     npx tsx scripts/test-order-paid-webhook.ts
 */

import crypto from "node:crypto";

const TARGET_URL = process.env.TEST_TARGET_URL || "http://localhost:3000/api/shopify/order-paid";
const SECRET =
  process.env.SHOPIFY_WEBHOOK_SECRET || "test-webhook-secret-do-not-use-in-prod";

// Numeric Soul Reading product ID from soul_reading_product.json
const SOUL_READING_PRODUCT_ID = 16176281190749;

const SAMPLE_ORDER = {
  id: 7777000000111,
  email: "test-customer@littlesouls.app",
  test: true, // dry_run path — handler INSERTs row but skips n8n
  financial_status: "paid",
  currency: "GBP",
  created_at: new Date().toISOString(),
  line_items: [
    {
      id: 8888000000001,
      product_id: 16173633765725, // Cosmic Pet Portrait — Framed Canvas (existing)
      variant_id: 1,
      title: "Cosmic Pet Portrait — Framed Canvas (8x10, Black)",
      quantity: 1,
      properties: [
        { name: "Pet Name", value: "Bella" },
        { name: "_pet_name", value: "Bella" },
        { name: "_pet_dob", value: "2019-03-12" },
        { name: "_pet_birth_location", value: "Bristol, UK" },
        { name: "_pet_photo_url", value: "https://cdn.fal.media/test-portrait.png" },
      ],
    },
    {
      id: 8888000000002,
      product_id: SOUL_READING_PRODUCT_ID,
      variant_id: 64601427640669,
      title: "Soul Reading — Personalised Pet Astrology",
      quantity: 1,
      properties: [
        { name: "Pet Name", value: "Bella" },
        { name: "_pet_name", value: "Bella" },
        { name: "_pet_dob", value: "2019-03-12" },
        { name: "_pet_birth_location", value: "Bristol, UK" },
        { name: "_canvas_order_ref", value: "8888000000001" },
        { name: "_source", value: "cart-drawer-upsell" },
      ],
    },
  ],
};

function computeHmac(rawBody: Buffer, secret: string): string {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
}

interface PostResult {
  ok: boolean;
  status: number;
  body: unknown;
}

async function postWebhook(rawBody: Buffer): Promise<PostResult> {
  const hmac = computeHmac(rawBody, SECRET);
  const resp = await fetch(TARGET_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Hmac-Sha256": hmac,
      "X-Shopify-Topic": "orders/paid",
      "X-Shopify-Shop-Domain": "littlesouls-3.myshopify.com",
      "X-Shopify-Webhook-Id": "test-webhook-id-aaaa-bbbb-cccc",
      "X-Shopify-API-Version": "2025-10",
    },
    body: rawBody,
  });
  const text = await resp.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* keep as text */
  }
  return { ok: resp.ok, status: resp.status, body };
}

function printUsageInstructions() {
  console.log("Usage:");
  console.log();
  console.log("  # Terminal 1 — start dev server with the test secret:");
  console.log(`  $env:SHOPIFY_WEBHOOK_SECRET="${SECRET}"   # PowerShell`);
  console.log(`  export SHOPIFY_WEBHOOK_SECRET="${SECRET}" # bash`);
  console.log("  npm run dev");
  console.log();
  console.log("  # Terminal 2 — run this test:");
  console.log(`  $env:SHOPIFY_WEBHOOK_SECRET="${SECRET}"   # PowerShell`);
  console.log(`  export SHOPIFY_WEBHOOK_SECRET="${SECRET}" # bash`);
  console.log("  npx tsx scripts/test-order-paid-webhook.ts");
  console.log();
  console.log("Env overrides:");
  console.log("  TEST_TARGET_URL  — default http://localhost:3000/api/shopify/order-paid");
  console.log("  SHOPIFY_WEBHOOK_SECRET — must MATCH the dev server's env var");
  console.log();
}

async function main() {
  console.log("== test-order-paid-webhook ==");
  console.log("target:", TARGET_URL);
  console.log("secret length:", SECRET.length);
  console.log();

  const rawBody = Buffer.from(JSON.stringify(SAMPLE_ORDER), "utf8");
  console.log(`[step 1/3] body bytes=${rawBody.length}, hmac=${computeHmac(rawBody, SECRET).slice(0, 12)}...`);

  // First POST — preflight reachability check
  let first: PostResult;
  try {
    first = await postWebhook(rawBody);
  } catch (err) {
    console.error("[ERR] could not reach", TARGET_URL);
    console.error("      ", err instanceof Error ? err.message : String(err));
    console.log();
    printUsageInstructions();
    process.exit(0);
  }

  console.log(`[step 2/3] first POST -> ${first.status}`);
  console.log("           body:", JSON.stringify(first.body));
  if (first.status !== 200) {
    console.error("[FAIL] expected 200, got", first.status);
    process.exit(1);
  }
  const firstBody = first.body as { ok?: boolean; accepted?: number; dryRun?: boolean };
  if (firstBody.ok !== true) {
    console.error("[FAIL] expected ok=true");
    process.exit(1);
  }
  if (firstBody.dryRun !== true) {
    console.error("[FAIL] expected dryRun=true (sample payload sets test:true)");
    process.exit(1);
  }
  if (typeof firstBody.accepted !== "number") {
    console.error("[FAIL] expected accepted to be a number");
    process.exit(1);
  }

  // Second POST — idempotency
  let second: PostResult;
  try {
    second = await postWebhook(rawBody);
  } catch (err) {
    console.error("[ERR] second POST network error:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  console.log(`[step 3/3] second POST -> ${second.status}`);
  console.log("           body:", JSON.stringify(second.body));
  if (second.status !== 200) {
    console.error("[FAIL] expected 200 on second call, got", second.status);
    process.exit(1);
  }
  const secondBody = second.body as { ok?: boolean; accepted?: number; duplicates?: number };
  if (secondBody.ok !== true) {
    console.error("[FAIL] expected ok=true on second call");
    process.exit(1);
  }
  if ((secondBody.accepted ?? 0) !== 0) {
    console.error("[FAIL] expected accepted=0 on idempotent replay, got", secondBody.accepted);
    process.exit(1);
  }
  if ((secondBody.duplicates ?? 0) < 1) {
    console.error(
      "[FAIL] expected duplicates>=1 on idempotent replay, got",
      secondBody.duplicates,
    );
    process.exit(1);
  }

  console.log();
  console.log("== PASS ==");
  console.log("  first  call: accepted=", firstBody.accepted, " dryRun=", firstBody.dryRun);
  console.log("  second call: accepted=", secondBody.accepted, " duplicates=", secondBody.duplicates);
  console.log();
  console.log("Note: row(s) inserted into soul_reading_jobs with status='dry_run' (test:true).");
  console.log("      n8n was NOT triggered (dry_run guard).");
  console.log("      Clean up via Supabase admin if needed.");
}

main().catch((err) => {
  console.error("test-order-paid-webhook crashed:", err);
  process.exit(1);
});
