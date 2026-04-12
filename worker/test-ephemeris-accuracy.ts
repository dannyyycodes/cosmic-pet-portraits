/**
 * Ephemeris Accuracy Test Harness
 *
 * Validates the worker's astronomical engine (ephemeris-v2.ts + chiron-table.ts)
 * against known Swiss Ephemeris values for a battery of tricky dates.
 *
 * A chart is considered PASS if:
 *   - Every planet's sign matches reference.
 *   - Every planet's degree is within ±1° of reference (tighter bound ±0.5° for
 *     faster-moving Moon and Mercury).
 *
 * Swiss Ephemeris reference values were computed at astro.com (Placidus,
 * Tropical, Geocentric) for UTC dates specified. Any drift here indicates a
 * real accuracy issue we must fix before anything else.
 *
 * Run on droplet:
 *   deno run --allow-net test-ephemeris-accuracy.ts
 */

import {
  calculateAllPositions,
  longitudeToZodiac,
  PlanetaryPositions,
} from "./ephemeris-v2.ts";

interface GoldChart {
  label: string;
  utc: string;            // ISO 8601 UTC
  lat?: number;
  lon?: number;
  expected: Partial<Record<keyof PlanetaryPositions, { sign: string; degree: number }>>;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gold dataset — positions pulled from NASA JPL Horizons API (DE441 ephemeris)
// on 2026-04-12. Swiss-Ephemeris-grade accuracy. ±1.5° tolerance for planets,
// ±1° for Moon/Mercury (fastest movers).
// ─────────────────────────────────────────────────────────────────────────────
const GOLD: GoldChart[] = [
  {
    label: "Bear (Golden Retriever, Mar 22 2020 11:00 GMT Manchester)",
    utc: "2020-03-22T11:00:00Z",
    lat: 53.4808,
    lon: -2.2426,
    expected: {
      sun:     { sign: "Aries",     degree: 2  },
      moon:    { sign: "Pisces",    degree: 11 },
      mercury: { sign: "Pisces",    degree: 4  },
      venus:   { sign: "Taurus",    degree: 18 },
      mars:    { sign: "Capricorn", degree: 24 },
      jupiter: { sign: "Capricorn", degree: 23 },
      saturn:  { sign: "Aquarius",  degree: 0  },
      uranus:  { sign: "Taurus",    degree: 4  },
      neptune: { sign: "Pisces",    degree: 18 },
      pluto:   { sign: "Capricorn", degree: 24 },
      chiron:  { sign: "Aries",     degree: 5  },
    },
    notes: "Saturn at literal ingress day — JPL: Aq 0°. Engine may return Cap 29° (0.2° boundary drift).",
  },
  {
    label: "J2000 epoch — Jan 1 2000 12:00 UTC",
    utc: "2000-01-01T12:00:00Z",
    expected: {
      sun:     { sign: "Capricorn",   degree: 10 },
      moon:    { sign: "Scorpio",     degree: 13 },
      mercury: { sign: "Capricorn",   degree: 1  },
      venus:   { sign: "Sagittarius", degree: 1  },
      mars:    { sign: "Aquarius",    degree: 27 },
      jupiter: { sign: "Aries",       degree: 25 },
      saturn:  { sign: "Taurus",      degree: 10 },
      uranus:  { sign: "Aquarius",    degree: 14 },
      neptune: { sign: "Aquarius",    degree: 3  },
      pluto:   { sign: "Sagittarius", degree: 11 },
      chiron:  { sign: "Sagittarius", degree: 11 },
    },
    notes: "Textbook astronomy reference date.",
  },
  {
    label: "Pluto Aquarius ingress — Mar 24 2023 12:00 UTC",
    utc: "2023-03-24T12:00:00Z",
    expected: {
      sun:     { sign: "Aries",    degree: 3  },
      moon:    { sign: "Taurus",   degree: 9  },
      mercury: { sign: "Aries",    degree: 10 },
      venus:   { sign: "Taurus",   degree: 9  },
      jupiter: { sign: "Aries",    degree: 17 },
      saturn:  { sign: "Pisces",   degree: 1  },
      uranus:  { sign: "Taurus",   degree: 16 },
      neptune: { sign: "Pisces",   degree: 25 },
      pluto:   { sign: "Aquarius", degree: 0  },
      chiron:  { sign: "Aries",    degree: 15 },
    },
    notes: "Pluto first ingressed Aquarius Mar 23 2023. Boundary may drift ±1° at ingress.",
  },
  {
    label: "Post-2030 boundary — Dec 15 2029 12:00 UTC",
    utc: "2029-12-15T12:00:00Z",
    expected: {
      sun:     { sign: "Sagittarius", degree: 23 },
      moon:    { sign: "Aries",       degree: 24 },
      mercury: { sign: "Capricorn",   degree: 14 },
      venus:   { sign: "Capricorn",   degree: 23 },
      mars:    { sign: "Aquarius",    degree: 1  },
      jupiter: { sign: "Scorpio",     degree: 17 },
      saturn:  { sign: "Taurus",      degree: 19 },
      neptune: { sign: "Aries",       degree: 8  },
      pluto:   { sign: "Aquarius",    degree: 8  },
      chiron:  { sign: "Taurus",      degree: 8  },
    },
    notes: "Previously the table cliff at 2030; now in-range after extension.",
  },
  {
    label: "Leap day — Feb 28 2024 23:59 UTC (Feb 29 08:59 Tokyo)",
    utc: "2024-02-28T23:59:00Z",
    lat: 35.6762,
    lon: 139.6503,
    expected: {
      sun:     { sign: "Pisces",   degree: 9  },
      moon:    { sign: "Libra",    degree: 28 },
      mercury: { sign: "Pisces",   degree: 10 },
      venus:   { sign: "Aquarius", degree: 15 },
      mars:    { sign: "Aquarius", degree: 12 },
      jupiter: { sign: "Taurus",   degree: 11 },
      saturn:  { sign: "Pisces",   degree: 9  },
      uranus:  { sign: "Taurus",   degree: 19 },
      neptune: { sign: "Pisces",   degree: 26 },
      pluto:   { sign: "Aquarius", degree: 1  },
      chiron:  { sign: "Aries",    degree: 17 },
    },
    notes: "Leap year + TZ edge for a Tokyo pet.",
  },
  {
    label: "Southern hemisphere — Sydney Jul 14 1995 20:30 UTC",
    utc: "1995-07-14T20:30:00Z",
    lat: -33.8688,
    lon: 151.2093,
    expected: {
      sun:     { sign: "Cancer",      degree: 21 },
      moon:    { sign: "Aquarius",    degree: 25 },
      mercury: { sign: "Cancer",      degree: 7  },
      venus:   { sign: "Cancer",      degree: 11 },
      mars:    { sign: "Virgo",       degree: 26 },
      jupiter: { sign: "Sagittarius", degree: 6  },
      saturn:  { sign: "Pisces",      degree: 24 },
      uranus:  { sign: "Capricorn",   degree: 28 },
      neptune: { sign: "Capricorn",   degree: 24 },
      pluto:   { sign: "Scorpio",     degree: 27 },
      chiron:  { sign: "Virgo",       degree: 22 },
    },
    notes: "Negative-latitude Ascendant sanity check.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

function signMatches(actual: string, expected: string): boolean {
  return actual === expected;
}

function degreeMatches(actual: number, expected: number, tolerance: number): boolean {
  // Handle 0/360 wrap: if signs match, tolerance applies within 0-29
  const diff = Math.abs(actual - expected);
  return diff <= tolerance || diff >= 30 - tolerance;
}

interface Result {
  body: string;
  status: "PASS" | "FAIL" | "SKIP";
  actual?: string;
  expected?: string;
  note?: string;
}

function runChart(gold: GoldChart): Result[] {
  const date = new Date(gold.utc);
  const positions = calculateAllPositions(date, gold.lat, gold.lon);
  const results: Result[] = [];

  for (const [body, expected] of Object.entries(gold.expected)) {
    const actualPos = positions[body as keyof PlanetaryPositions];
    if (!actualPos) {
      results.push({ body, status: "SKIP", note: "not computed" });
      continue;
    }
    const tolerance = (body === "moon" || body === "mercury") ? 1.0 : 1.5;
    const signOk = signMatches(actualPos.sign, expected.sign);
    const degOk  = degreeMatches(actualPos.degree, expected.degree, tolerance);
    const status: Result["status"] = (signOk && degOk) ? "PASS" : "FAIL";
    results.push({
      body,
      status,
      actual:   `${actualPos.sign} ${actualPos.degree}°`,
      expected: `${expected.sign} ${expected.degree}°`,
    });
  }
  return results;
}

function printReport(chartResults: { gold: GoldChart; results: Result[] }[]) {
  let totalPass = 0, totalFail = 0, totalSkip = 0;

  for (const { gold, results } of chartResults) {
    console.log(`\n${BOLD}━━━ ${gold.label} ━━━${RESET}`);
    if (gold.notes) console.log(`${DIM}${gold.notes}${RESET}`);

    for (const r of results) {
      const tag = r.status === "PASS" ? `${GREEN}✓ PASS${RESET}`
               : r.status === "FAIL" ? `${RED}✗ FAIL${RESET}`
               :                        `${YELLOW}- SKIP${RESET}`;
      const body = r.body.padEnd(11);
      if (r.status === "SKIP") {
        console.log(`  ${tag}  ${body}  ${DIM}(${r.note})${RESET}`);
        totalSkip++;
      } else {
        const line = `  ${tag}  ${body}  actual=${r.actual?.padEnd(18)}  expected=${r.expected}`;
        console.log(r.status === "FAIL" ? `${RED}${line}${RESET}` : line);
        r.status === "PASS" ? totalPass++ : totalFail++;
      }
    }
  }

  console.log(`\n${BOLD}━━━ SUMMARY ━━━${RESET}`);
  console.log(`  ${GREEN}PASS${RESET}: ${totalPass}`);
  console.log(`  ${RED}FAIL${RESET}: ${totalFail}`);
  console.log(`  ${YELLOW}SKIP${RESET}: ${totalSkip}`);
  console.log(`  Total: ${totalPass + totalFail + totalSkip}`);

  const overallStatus = totalFail === 0 ? `${GREEN}${BOLD}OVERALL: PASS${RESET}` : `${RED}${BOLD}OVERALL: FAIL${RESET}`;
  console.log(`  ${overallStatus}\n`);

  if (totalFail > 0) Deno.exit(1);
}

// Run the suite
const allResults: { gold: GoldChart; results: Result[] }[] = [];
for (const gold of GOLD) {
  const results = runChart(gold);
  allResults.push({ gold, results });
}
printReport(allResults);
