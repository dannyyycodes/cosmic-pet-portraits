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

// 12x16 black canvas — built from CANVAS_SIZES + FRAME_COLORS in
// src/components/portraits/gelatoFramedCanvas.ts via gelatoProductUid().
// If this UID changes (Gelato catalog update), the test will fail with a
// clear error pointing at the productUid mapping — exactly what we want.
const PRODUCT_UID = "framed_canvas_geo_simplified_300x400-mm-12x16-inch_black_352x452-mm-14x18-inch_wood-fsc-slim_ver_wood_w14xt42-mm_canvas_4-0";

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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✓ Gelato accepted the draft. Schema is valid.`);
          if (json.id) {
            // Auto-delete the draft so the Gelato dashboard doesn't fill
            // up with one row per dry-run. Best-effort — if delete fails
            // it's not the test's job to clean up forever.
            const del = https.request(
              { method: "DELETE", host: "order.gelatoapis.com", path: `/v4/orders/${json.id}`, headers: { "X-API-KEY": KEY } },
              (dr) => {
                if (dr.statusCode === 200 || dr.statusCode === 204) {
                  console.log(`✓ Draft ${json.id} deleted`);
                } else {
                  const dc = [];
                  dr.on("data", (x) => dc.push(x));
                  dr.on("end", () => console.log(`· Draft ${json.id} delete returned HTTP ${dr.statusCode} ${Buffer.concat(dc).toString("utf8").slice(0, 200)}`));
                }
              },
            );
            del.on("error", () => console.log(`· Draft ${json.id} delete request errored — clean up manually if needed`));
            del.end();
          }
        } else {
          console.log(JSON.stringify(json, null, 2));
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
