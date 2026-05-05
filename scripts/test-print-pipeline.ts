/**
 * Dry-run test for api/portraits/printPipeline.ts.
 *
 * Usage (loads env from ~/.codex/global.env or shell):
 *
 *   FAL_KEY=... npx tsx scripts/test-print-pipeline.ts \
 *       [sourceImageUrl] [sizeKey] [frameColor]
 *
 * Defaults to a small public test image and the 8x10 SKU. Runs in dryRun mode
 * — AuraSR + pre-flight execute for real, Gelato POST is skipped and the
 * assembled body is logged.
 *
 * Auto-loads ~/.codex/global.env if present so we don't need to bash-export
 * for every run.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { runPrintPipeline } from "../api/_lib/printPipeline.js";

// ─── env loader (best-effort) ───────────────────────────────────────────────
function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(path.join(os.homedir(), ".codex", "global.env"));
loadEnv(path.join(process.cwd(), ".env"));
loadEnv(path.join(process.cwd(), ".env.local"));

// ─── args ───────────────────────────────────────────────────────────────────
const [, , argSource, argSize, argFrame] = process.argv;

// Fallback test image — a public Pexels pet photo (Pexels CDN is allowlisted in
// CSP and serves CORS-safe images). Replace with any fal-generated CDN URL
// when iterating.
const DEFAULT_SOURCE_IMAGE =
  "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1024&h=1280";

const sourceImageUrl = argSource ?? DEFAULT_SOURCE_IMAGE;
const sizeKey = argSize ?? "8x10";
const frameColor = (argFrame ?? "black") as "black" | "natural-wood" | "dark-wood";

// Optional override for verification runs — pass --bypass-preflight to drop
// the variance threshold so we exercise the SUCCESS path and inspect the
// assembled Gelato body even on Pexels-grade test images.
if (process.argv.includes("--bypass-preflight")) {
  process.env.PREFLIGHT_BYPASS = "1";
}

// ─── go ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("== test-print-pipeline (dry run) ==");
  console.log("source:", sourceImageUrl);
  console.log("sizeKey:", sizeKey);
  console.log("frameColor:", frameColor);
  console.log("FAL_KEY set:", Boolean(process.env.FAL_KEY));
  console.log("GELATO_API_KEY set:", Boolean(process.env.GELATO_API_KEY));
  console.log("");

  const t0 = Date.now();
  const result = await runPrintPipeline({
    sourceImageUrl,
    sizeKey,
    frameColor,
    shippingAddress: {
      firstName: "Test",
      lastName: "Customer",
      addressLine1: "1 Soul Lane",
      city: "London",
      postCode: "SW1A 1AA",
      country: "GB",
      email: "test@littlesouls.app",
    },
    customerEmail: "test@littlesouls.app",
    shopifyOrderId: 999000111,
    shopifyLineItemId: 999000222,
    petName: "Luna",
    dryRun: true,
  });
  const elapsedMs = Date.now() - t0;

  console.log("");
  console.log("== result ==");
  console.log("elapsedMs:", elapsedMs);
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("test-print-pipeline crashed:", err);
  process.exit(1);
});
