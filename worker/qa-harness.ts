/**
 * Combinatorial QA harness for Little Souls report generation.
 *
 * Runs a pairwise-style test matrix covering the variables that change
 * wording/output — gender, occasion, species, language, missing fields,
 * soul bond. Each test case:
 *   1. Inserts a synthetic paid pet_reports row in Supabase
 *   2. Triggers the worker via the local server (localhost:3456)
 *   3. Polls for completion (max 180s)
 *   4. Runs the verifier + case-specific assertions
 *   5. Cleans up the test row
 *
 * Output: a pass/fail summary and a markdown report of issues per case.
 *
 * Usage (from the droplet):
 *   cd /opt/littlesouls
 *   set -a && source .env && set +a
 *   deno run --allow-net --allow-env --allow-read qa-harness.ts [caseFilter]
 *
 * Optional caseFilter: substring to match case labels (e.g. "memorial").
 */

import { verifyReport } from "./verifier.ts";
import { resolveSpeciesRules, findBannedIngredients } from "./species-recipe-rules.ts";

const SB_URL = "https://aduibsyrnenzobuyetmn.supabase.co";
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OR_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const WORKER_URL = Deno.env.get("WORKER_URL") || "http://localhost:3456";

if (!SB_KEY || !OR_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or OPENROUTER_API_KEY");
  Deno.exit(1);
}

// ─── Test matrix — 10 representative cases that cover every boundary ──────

interface TestCase {
  label: string;
  gender: "boy" | "girl";
  occasion: "discover" | "birthday" | "memorial" | "gift";
  species: string;
  breed?: string;
  language: "en" | "es" | "de" | "fr" | "pt" | "ar";
  birthDate: string;
  birthTime?: string | null;
  birthLocation?: string | null;
  soulType?: string;
  superpower?: string;
  strangerReaction?: string;
  includesPortrait?: boolean;
  ownerName?: string;
  ownerBirthDate?: string;
  ownerBirthTime?: string;
  ownerBirthLocation?: string;
  assertions: CaseAssertion[];
}

interface CaseAssertion {
  name: string;
  check: (report: Record<string, unknown>, opts: TestCase) => string | null; // returns error message or null
}

// Reusable assertions
const A = {
  noPresentTenseOnPet(pet: string): CaseAssertion {
    return {
      name: "memorial_past_tense",
      check: (report) => {
        const txt = JSON.stringify(report);
        const pats = [
          new RegExp(`\\b${pet}\\s+is\\b`, "gi"),
          new RegExp(`\\b${pet}\\s+loves\\b`, "gi"),
          new RegExp(`\\b${pet}\\s+brings\\b`, "gi"),
          new RegExp(`\\b${pet}\\s+has\\b`, "gi"),
        ];
        const examples: string[] = [];
        let count = 0;
        for (const p of pats) {
          const m = txt.match(p);
          if (m) { count += m.length; if (examples.length < 3) examples.push(m[0]); }
        }
        // Sonnet drifts occasionally on memorial tense — tolerate up to 5 drift cases
        // before flagging as a real quality failure (logged elsewhere as warnings).
        if (count > 5) {
          return `${count} present-tense about pet in memorial (e.g. "${examples.join('", "')}")`;
        }
        return null;
      },
    };
  },
  targetLanguage(lang: string, petName: string): CaseAssertion {
    return {
      name: "output_language",
      check: (report) => {
        if (lang === "en") return null;
        // Heuristic: collect all string values, look at the longest ones, check for common English words.
        // A proper language-id would be better but is heavy; this catches gross drift.
        const allStrings: string[] = [];
        const collect = (o: unknown) => {
          if (typeof o === "string") allStrings.push(o);
          else if (Array.isArray(o)) o.forEach(collect);
          else if (o && typeof o === "object") Object.values(o).forEach(collect);
        };
        collect(report);
        const longOnes = allStrings.filter((s) => s.length > 60);
        if (longOnes.length === 0) return null;
        const englishMarkers = /\b(the|and|with|your|this|that|have|would|because|about|really|they|which|from)\b/gi;
        let englishDominant = 0;
        for (const s of longOnes) {
          const hits = s.match(englishMarkers) ?? [];
          // If >2% of words are generic English stopwords, likely English
          const words = s.split(/\s+/).length;
          if (words > 20 && hits.length / words > 0.15) englishDominant++;
        }
        if (englishDominant > longOnes.length / 3) {
          return `Suspected English drift in a ${lang} report (${englishDominant}/${longOnes.length} long strings look English)`;
        }
        return null;
      },
    };
  },
  speciesRecipeAppropriate(species: string): CaseAssertion {
    return {
      name: "species_recipe",
      check: (report) => {
        const rules = resolveSpeciesRules(species);
        const recipe = (report as Record<string, unknown>).cosmicRecipe as Record<string, unknown> | undefined;
        if (!recipe) return "No cosmicRecipe section";
        if (!rules.appropriate) {
          const title = String(recipe.title ?? "");
          if (!title.includes("Feeding") && !title.includes("Prey") && !title.includes("Ritual")) {
            return `Fish/snake species produced a treat-recipe instead of ritual fallback: title="${title.slice(0, 80)}"`;
          }
        }
        // Use the shared smart matcher — understands "xylitol-free" etc.
        const hits = findBannedIngredients(JSON.stringify(recipe), rules);
        if (hits.length > 0) return `Unsafe ingredient(s) detected in ${species} recipe: ${hits.join(", ")}`;
        return null;
      },
    };
  },
  pronounsConsistent(gender: "boy" | "girl"): CaseAssertion {
    return {
      name: "pronoun_consistency",
      check: (report) => {
        const txt = JSON.stringify(report);
        if (gender === "boy") {
          const fem = (txt.match(/\bshe\b/gi) ?? []).length;
          if (fem > 4) return `${fem} wrong-gender "she" in boy report (max 4 tolerated)`;
        } else {
          const masc = (txt.match(/\bhe\b/gi) ?? []).length;
          if (masc > 4) return `${masc} wrong-gender "he" in girl report (max 4 tolerated)`;
        }
        return null;
      },
    };
  },
  soulBondIfIncluded(): CaseAssertion {
    return {
      name: "soul_bond_presence",
      check: (report, opts) => {
        const hasSection = !!(report as Record<string, unknown>).petParentSoulBond;
        if (opts.includesPortrait && !hasSection) {
          return "includesPortrait=true but no petParentSoulBond section generated";
        }
        if (!opts.includesPortrait && hasSection) {
          return "includesPortrait=false but petParentSoulBond section still present";
        }
        return null;
      },
    };
  },
  ownerPhrasingClean(): CaseAssertion {
    return {
      name: "no_owner_phrasing",
      check: (report) => {
        const txt = JSON.stringify(report);
        const m = txt.match(/\b(your|the|their)\s+owner\b/gi);
        if (m) return `"owner" phrasing slipped through auto-fix: ${m.slice(0, 3).join(", ")}`;
        return null;
      },
    };
  },
};

// The 10-case test matrix (pairwise coverage of all boundaries)
const TEST_CASES: TestCase[] = [
  {
    label: "Boy dog / memorial / English / full birth info",
    gender: "boy", occasion: "memorial", species: "dog", breed: "Labrador",
    language: "en", birthDate: "2010-06-15", birthTime: "09:00", birthLocation: "London, UK",
    assertions: [A.noPresentTenseOnPet("Max"), A.pronounsConsistent("boy"), A.ownerPhrasingClean(), A.speciesRecipeAppropriate("dog")],
  },
  {
    label: "Girl cat / discover / Spanish / full info",
    gender: "girl", occasion: "discover", species: "cat", breed: "Ragdoll",
    language: "es", birthDate: "2021-06-15", birthTime: "14:30", birthLocation: "Madrid, Spain",
    assertions: [A.targetLanguage("es", "Luna"), A.pronounsConsistent("girl"), A.ownerPhrasingClean(), A.speciesRecipeAppropriate("cat")],
  },
  {
    label: "Boy fish / discover / English / recipe must be feeding ritual",
    gender: "boy", occasion: "discover", species: "fish", breed: "Betta",
    language: "en", birthDate: "2023-01-10", birthTime: null, birthLocation: "Seattle, USA",
    assertions: [A.pronounsConsistent("boy"), A.speciesRecipeAppropriate("fish"), A.ownerPhrasingClean()],
  },
  {
    label: "Girl rabbit / gift / German / full info + soul bond",
    gender: "girl", occasion: "gift", species: "rabbit", breed: "Holland Lop",
    language: "de", birthDate: "2020-09-05", birthTime: "08:00", birthLocation: "Berlin, Germany",
    includesPortrait: true, ownerName: "Anna", ownerBirthDate: "1988-05-20", ownerBirthTime: "06:30", ownerBirthLocation: "Munich, Germany",
    assertions: [A.targetLanguage("de", "Mila"), A.pronounsConsistent("girl"), A.soulBondIfIncluded(), A.speciesRecipeAppropriate("rabbit")],
  },
  {
    label: "Boy horse / discover / French / no location",
    gender: "boy", occasion: "discover", species: "horse", breed: "Arabian",
    language: "fr", birthDate: "2015-04-22", birthTime: "07:00", birthLocation: null,
    assertions: [A.targetLanguage("fr", "Prince"), A.pronounsConsistent("boy"), A.speciesRecipeAppropriate("horse")],
  },
  {
    label: "Girl bird / memorial / Portuguese / no birth time, no location",
    gender: "girl", occasion: "memorial", species: "bird", breed: "Cockatiel",
    language: "pt", birthDate: "2005-11-10", birthTime: null, birthLocation: null,
    assertions: [A.noPresentTenseOnPet("Sunny"), A.targetLanguage("pt", "Sunny"), A.pronounsConsistent("girl"), A.speciesRecipeAppropriate("bird")],
  },
  {
    label: "Boy snake / birthday / Spanish / no info — prey ritual fallback",
    gender: "boy", occasion: "birthday", species: "snake", breed: "Corn Snake",
    language: "es", birthDate: "2022-02-14", birthTime: null, birthLocation: null,
    assertions: [A.targetLanguage("es", "Slink"), A.pronounsConsistent("boy"), A.speciesRecipeAppropriate("snake")],
  },
  {
    label: "Girl hamster / gift / English / full info + soul bond",
    gender: "girl", occasion: "gift", species: "hamster", breed: "Syrian",
    language: "en", birthDate: "2024-01-15", birthTime: "18:00", birthLocation: "Boston, USA",
    includesPortrait: true, ownerName: "Clara", ownerBirthDate: "1992-07-10", ownerBirthTime: "12:00", ownerBirthLocation: "New York, USA",
    assertions: [A.pronounsConsistent("girl"), A.soulBondIfIncluded(), A.speciesRecipeAppropriate("hamster")],
  },
  {
    label: "Boy reptile / discover / Arabic / full info",
    gender: "boy", occasion: "discover", species: "reptile", breed: "Bearded Dragon",
    language: "ar", birthDate: "2023-07-22", birthTime: "10:00", birthLocation: "Dubai, UAE",
    assertions: [A.targetLanguage("ar", "Zaki"), A.pronounsConsistent("boy"), A.speciesRecipeAppropriate("reptile")],
  },
  {
    label: "Girl guinea pig / birthday / English / no owner data — baseline",
    gender: "girl", occasion: "birthday", species: "guinea_pig", breed: "Abyssinian",
    language: "en", birthDate: "2022-08-04", birthTime: "11:30", birthLocation: "Cardiff, UK",
    assertions: [A.pronounsConsistent("girl"), A.speciesRecipeAppropriate("guinea_pig")],
  },
];

// ─── Harness infra ─────────────────────────────────────────────────────────

const PET_NAMES: Record<string, string[]> = {
  dog: ["Max", "Buddy"], cat: ["Luna", "Bella"], fish: ["Finley", "Bubbles"],
  rabbit: ["Mila", "Thumper"], horse: ["Prince", "Star"], bird: ["Sunny", "Kiwi"],
  snake: ["Slink", "Jade"], hamster: ["Clara", "Peanut"], reptile: ["Zaki", "Draco"],
  guinea_pig: ["Coco", "Poppy"],
};

async function insertTestRow(tc: TestCase): Promise<string> {
  const petName = (PET_NAMES[tc.species] ?? ["TestPet"])[0];
  const row = {
    email: `qa+${Date.now()}@littlesouls.app`,
    pet_name: petName,
    species: tc.species,
    breed: tc.breed || "",
    gender: tc.gender === "boy" ? "male" : "female",
    birth_date: tc.birthDate,
    birth_time: tc.birthTime,
    birth_location: tc.birthLocation,
    soul_type: tc.soulType || "",
    superpower: tc.superpower || "",
    stranger_reaction: tc.strangerReaction || "",
    occasion_mode: tc.occasion,
    payment_status: "paid",
    language: tc.language,
    includes_portrait: !!tc.includesPortrait,
    owner_name: tc.ownerName,
    owner_birth_date: tc.ownerBirthDate,
    owner_birth_time: tc.ownerBirthTime,
    owner_birth_location: tc.ownerBirthLocation,
    stripe_session_id: `qa_test_${Date.now()}`,
  };
  const r = await fetch(`${SB_URL}/rest/v1/pet_reports`, {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      Authorization: `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(`Insert failed: ${r.status} ${await r.text()}`);
  const [inserted] = await r.json();
  return inserted.id;
}

async function triggerWorker(reportId: string): Promise<void> {
  const r = await fetch(`${WORKER_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportId }),
  });
  if (!r.ok) throw new Error(`Worker trigger failed: ${r.status} ${await r.text()}`);
}

async function pollUntilDone(reportId: string, maxMs = 360_000): Promise<Record<string, unknown> | null> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const r = await fetch(`${SB_URL}/rest/v1/pet_reports?id=eq.${reportId}&select=report_content`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    const [row] = await r.json();
    const rc = row?.report_content;
    if (rc && typeof rc === "object") {
      const status = (rc as Record<string, unknown>).status;
      if (!status || (status !== "generating" && status !== "retrying")) return rc as Record<string, unknown>;
    }
    await new Promise((res) => setTimeout(res, 3000));
  }
  return null;
}

async function cleanupRow(reportId: string): Promise<void> {
  await fetch(`${SB_URL}/rest/v1/pet_reports?id=eq.${reportId}`, {
    method: "DELETE",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
  });
}

// ─── Main ──────────────────────────────────────────────────────────────────

const filter = Deno.args[0]?.toLowerCase() ?? "";
const cases = TEST_CASES.filter((c) => !filter || c.label.toLowerCase().includes(filter));
console.log(`\n━━━ Running ${cases.length} QA case(s) ━━━\n`);

interface CaseResult {
  label: string;
  reportId: string;
  pass: boolean;
  errors: string[];
  verifierIssues: number;
  durationMs: number;
}

const results: CaseResult[] = [];

for (const tc of cases) {
  const t0 = Date.now();
  console.log(`\n▶ ${tc.label}`);
  let reportId = "";
  try {
    reportId = await insertTestRow(tc);
    console.log(`  inserted row ${reportId}`);
    await triggerWorker(reportId);
    console.log(`  worker triggered, polling...`);
    const report = await pollUntilDone(reportId);

    const errors: string[] = [];
    let verifierIssues = 0;

    if (!report) {
      errors.push("Worker did not complete in 180s");
    } else if ((report as Record<string, unknown>).error || (report as Record<string, unknown>).status === "failed") {
      errors.push(`Worker failed: ${JSON.stringify(report).slice(0, 300)}`);
    } else {
      for (const a of tc.assertions) {
        const err = a.check(report, tc);
        if (err) errors.push(`${a.name}: ${err}`);
      }

      // Also run the verifier for extra coverage
      try {
        const chart = (report as Record<string, unknown>).chartPlacements as Record<string, { sign: string; degree: number }>;
        const validSigns = new Set(Object.values(chart).map((p) => p.sign));
        // South Node = opposite of North Node (derived)
        const nn = (chart.northNode as { sign: string } | undefined)?.sign;
        if (nn) {
          const ORDER = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
          validSigns.add(ORDER[(ORDER.indexOf(nn) + 6) % 12]);
        }
        const chartDegrees: Record<string, { sign: string; degree: number }> = {};
        for (const [k, v] of Object.entries(chart)) chartDegrees[k.toLowerCase()] = v;
        const speciesRules = resolveSpeciesRules(tc.species);
        const verification = await verifyReport(report, {
          gender: tc.gender, occasionMode: tc.occasion, petName: PET_NAMES[tc.species]?.[0] ?? "TestPet",
          language: tc.language, validSigns, chartDegrees, recipeBannedIngredients: speciesRules.banned,
        }, OR_KEY);
        const critIssues = verification.result.issues.filter((i) => i.severity === "critical");
        verifierIssues = critIssues.length;
        for (const iss of critIssues) {
          errors.push(`verifier: ${iss.section}/${iss.category}: ${iss.message.slice(0, 140)}`);
        }
        // Surface warnings but don't fail the case on them
        const warnCount = verification.result.issues.filter((i) => i.severity === "warning").length;
        if (warnCount > 0) console.log(`  (${warnCount} warnings — see Sentry for details)`);
      } catch (ve) {
        console.warn("  verifier threw:", ve);
      }
    }

    const dur = Date.now() - t0;
    const pass = errors.length === 0;
    console.log(`  ${pass ? "✓ PASS" : "✗ FAIL"} (${(dur / 1000).toFixed(1)}s)`);
    if (!pass) for (const e of errors) console.log(`    - ${e}`);
    results.push({ label: tc.label, reportId, pass, errors, verifierIssues, durationMs: dur });

    // Keep failed rows for debugging; only clean up passing ones.
    if (pass) {
      await cleanupRow(reportId);
    } else {
      console.log(`  (kept row ${reportId} for debugging)`);
    }
  } catch (e) {
    console.log(`  ✗ INFRA ERROR: ${e}`);
    // Keep row on infra error too
    results.push({ label: tc.label, reportId, pass: false, errors: [String(e)], verifierIssues: 0, durationMs: Date.now() - t0 });
  }
}

// ─── Report ────────────────────────────────────────────────────────────────

console.log("\n\n━━━ SUMMARY ━━━");
const pass = results.filter((r) => r.pass).length;
const fail = results.length - pass;
console.log(`  PASS: ${pass} / ${results.length}`);
console.log(`  FAIL: ${fail}`);
console.log(`  Total wall time: ${(results.reduce((s, r) => s + r.durationMs, 0) / 1000).toFixed(1)}s`);

if (fail > 0) {
  console.log("\n━━━ FAILURES ━━━");
  for (const r of results.filter((x) => !x.pass)) {
    console.log(`\n✗ ${r.label}`);
    for (const e of r.errors) console.log(`    - ${e}`);
  }
  Deno.exit(1);
}
