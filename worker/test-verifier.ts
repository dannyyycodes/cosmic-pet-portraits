/**
 * Test: run the verifier against Bear's REAL production report (pulled from
 * Supabase). This is the honesty check — if the verifier flags a production
 * report as failing, either the verifier is too strict or the production
 * report has real issues we should know about.
 */

import { verifyReport } from "./verifier.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY") || "";
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SB_KEY) {
  console.error("Need SUPABASE_SERVICE_ROLE_KEY in env");
  Deno.exit(1);
}

// Fetch Bear's report from Supabase
const r = await fetch(
  "https://aduibsyrnenzobuyetmn.supabase.co/rest/v1/pet_reports?id=eq.8f4f5501-fd53-4590-9b29-45e2890c5505&select=*",
  { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
);
const [bearRow] = await r.json();
if (!bearRow) {
  console.error("Could not fetch Bear's row");
  Deno.exit(1);
}

const reportContent = bearRow.report_content as Record<string, unknown>;
const chartPlacements = reportContent.chartPlacements as Record<string, { sign: string; degree: number }>;

const validSigns = new Set<string>(Object.values(chartPlacements).map((p) => p.sign));
console.log("Bear chart signs:", Array.from(validSigns).join(", "));

const chartDegrees: Record<string, { sign: string; degree: number }> = {};
for (const [k, v] of Object.entries(chartPlacements)) {
  chartDegrees[k.toLowerCase()] = v;
}

const { result, report } = await verifyReport(
  reportContent,
  {
    gender: bearRow.gender === "girl" ? "girl" : "boy",
    occasionMode: bearRow.occasion_mode,
    petName: bearRow.pet_name,
    language: bearRow.language || "en",
    validSigns,
    chartDegrees,
    recipeBannedIngredients: [],
  },
  OPENROUTER_API_KEY,
);

console.log("\n━━━ VERIFICATION RESULT ━━━");
console.log(`Overall pass: ${result.overallPass}`);
console.log(`Auto-fixes applied: ${result.autoFixesApplied}`);
console.log(`Total issues: ${result.issues.length}`);
console.log(`Sections to regenerate: ${result.sectionsToRegenerate.length ? result.sectionsToRegenerate.join(", ") : "(none)"}`);
console.log("\n━━━ ISSUES BY SEVERITY ━━━");
const bySev: Record<string, number> = {};
for (const i of result.issues) bySev[i.severity] = (bySev[i.severity] ?? 0) + 1;
for (const [sev, count] of Object.entries(bySev)) console.log(`  ${sev}: ${count}`);

console.log("\n━━━ SAMPLE ISSUES (first 10) ━━━");
for (const i of result.issues.slice(0, 10)) {
  console.log(`  [${i.severity}] ${i.section} / ${i.category}: ${i.message.slice(0, 140)}`);
}
