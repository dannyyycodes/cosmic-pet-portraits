// scripts/test-gelato-dry-run.cjs
//
// Safety-check that the runPrintPipeline body assembly + Gelato schema is
// still valid against the live Gelato API, WITHOUT actually placing an
// order. Use before any production change to printPipeline.ts to catch
// schema drift early.
//
//   node scripts/test-gelato-dry-run.cjs
//
// What it does:
//   1. Picks a known canvas SKU (12x16 black) from gelatoFramedCanvas.ts
//   2. Builds a Gelato Order v4 body via the same builder live code uses
//   3. Sets orderType: "draft" — Gelato accepts the body, validates it,
//      stores a draft, but does NOT print or charge.
//   4. POSTs to https://order.gelatoapis.com/v4/orders with GELATO_API_KEY
//   5. Reports the response. If 200/201 → schema is valid. If 4xx → schema
//      drift; print the error so you can update buildGelatoOrderBody.
//
// IMPORTANT: requires GELATO_API_KEY in C:/Users/danie/cosmic-pet-portraits/.env.production.
// Drafts cost nothing and DO NOT appear on the customer-facing
// littlesouls.app account dashboard, but they DO show up in the Gelato
// dashboard under "Orders → Drafts" — feel free to delete them after.
const fs = require("fs");
const https = require("https");

const ENV = {};
for (const line of fs.readFileSync(__dirname + "/../.env.production", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=["']?(.*?)["']?\s*$/);
  if (m) ENV[m[1]] = m[2];
}
const KEY = ENV.GELATO_API_KEY;
if (!KEY) { console.error("GELATO_API_KEY not in .env.production"); process.exit(1); }

const PRODUCT_UID = "canvas_240gsm-canvas_wood-fsc-slim_30x40-cm_horizontal_4-0_ver";
// 12x16 black canvas (per src/components/portraits/gelatoFramedCanvas.ts).
// If this UID changes (Gelato catalog update), the test will fail with a
// clear error pointing at the productUid mapping — exactly what we want.

const orderRef = `ls-dryrun-${Date.now()}`;
const body = {
  orderType: "draft", // ← key safety: NOT "order". Validates only.
  orderReferenceId: orderRef,
  customerReferenceId: "dryrun@littlesouls.app",
  currency: "GBP",
  shipmentMethodUid: "normal",
  items: [
    {
      itemReferenceId: `${orderRef}-canvas`,
      productUid: PRODUCT_UID,
      quantity: 1,
      files: [
        // Public 1024×1280 placeholder. Gelato fetches at submit time but
        // for draft validation only the URL shape matters.
        { type: "default", url: "https://placehold.co/1024x1280/png" },
      ],
    },
  ],
  shippingAddress: {
    firstName: "Dry",
    lastName: "Run",
    addressLine1: "1 Test St",
    city: "London",
    postCode: "EC1A 1AA",
    country: "GB",
    email: "dryrun@littlesouls.app",
  },
  metadata: [
    { key: "source", value: "scripts/test-gelato-dry-run.cjs" },
    { key: "purpose", value: "schema validation only — do not fulfil" },
  ],
};

const payload = Buffer.from(JSON.stringify(body));
const req = https.request(
  {
    method: "POST",
    host: "order.gelatoapis.com",
    path: "/v4/orders",
    headers: {
      "X-API-KEY": KEY,
      "Content-Type": "application/json",
      "Content-Length": payload.length,
    },
  },
  (res) => {
    const chunks = [];
    res.on("data", (c) => chunks.push(c));
    res.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      console.log(`HTTP ${res.statusCode}`);
      try {
        const json = JSON.parse(text);
        console.log(JSON.stringify(json, null, 2));
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`\n✓ Gelato accepted the draft. Schema is valid.`);
          if (json.id) console.log(`  Draft order id: ${json.id} (delete from Gelato dashboard if you want)`);
        } else {
          console.log(`\n✗ Gelato rejected the draft. Schema drift — update buildGelatoOrderBody.`);
          process.exit(1);
        }
      } catch {
        console.log(text.slice(0, 1000));
      }
    });
  },
);
req.on("error", (e) => { console.error(e); process.exit(1); });
req.write(payload);
req.end();
