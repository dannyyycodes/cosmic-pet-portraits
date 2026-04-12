/**
 * Test: timezone resolution + astronomical correctness for non-UTC pets.
 *
 * For Mochi the Shiba Inu (Tokyo, 2022-10-28, 08:15 local), verify:
 *  - current buggy behaviour would compute for UTC 08:15 → wrong Moon
 *  - new helper resolves to UTC 23:15 Oct 27 → correct Moon
 */

import { resolveBirthUTC } from "./timezone.ts";
import { calculateAllPositions } from "./ephemeris-v2.ts";

interface Case {
  label: string;
  birthDate: string;
  birthTime: string | null;
  lat?: number;
  lon?: number;
  expectedTz: string | null;
  expectedOffsetHours: number;
}

const cases: Case[] = [
  {
    label: "Mochi (Tokyo, 2022-10-28 08:15)",
    birthDate: "2022-10-28",
    birthTime: "08:15",
    lat: 35.6762, lon: 139.6503,
    expectedTz: "Asia/Tokyo",
    expectedOffsetHours: 9,
  },
  {
    label: "Bear (Manchester, 2020-03-22 11:00 — GMT, pre-BST)",
    birthDate: "2020-03-22",
    birthTime: "11:00",
    lat: 53.4808, lon: -2.2426,
    expectedTz: "Europe/London",
    expectedOffsetHours: 0,
  },
  {
    label: "Willow (Brighton, 2021-06-15 14:30 — BST DST active)",
    birthDate: "2021-06-15",
    birthTime: "14:30",
    lat: 50.8225, lon: -0.1372,
    expectedTz: "Europe/London",
    expectedOffsetHours: 1,
  },
  {
    label: "Ziggy (Portland OR, 2023-07-22 — no birth time)",
    birthDate: "2023-07-22",
    birthTime: null,
    lat: 45.5152, lon: -122.6784,
    expectedTz: "America/Los_Angeles",
    expectedOffsetHours: -7,  // PDT
  },
  {
    label: "No location — fallback to UTC",
    birthDate: "2020-01-01",
    birthTime: "10:00",
    expectedTz: null,
    expectedOffsetHours: 0,
  },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const r = resolveBirthUTC(c.birthDate, c.birthTime, c.lat, c.lon);
  const tzOk = r.ianaTz === c.expectedTz;
  const offOk = Math.abs(r.offsetHours - c.expectedOffsetHours) < 0.01;
  const status = (tzOk && offOk) ? "✓ PASS" : "✗ FAIL";
  console.log(`\n${status}  ${c.label}`);
  console.log(`  tz:     got=${r.ianaTz}  expected=${c.expectedTz}`);
  console.log(`  offset: got=${r.offsetHours}  expected=${c.expectedOffsetHours}`);
  console.log(`  UTC:    ${r.utcDate.toISOString()}`);
  console.log(`  note:   ${r.noteForPrompt}`);
  if (tzOk && offOk) pass++; else fail++;
}

// Integration — what does the Mochi chart compute as with and without TZ?
console.log("\n━━━ INTEGRATION: Mochi's Moon — buggy vs fixed ━━━");
const mochiBirthDate = "2022-10-28";
const mochiBirthTime = "08:15";

// Buggy legacy path: parse date as UTC midnight, setHours in local = 08:15 UTC (assuming server is UTC)
const buggyDob = new Date(mochiBirthDate);
buggyDob.setUTCHours(8, 15, 0, 0);   // emulates what the OLD worker would produce on a UTC host
const buggyPositions = calculateAllPositions(buggyDob, 35.6762, 139.6503);
console.log(`  BUGGY (treated as 08:15 UTC = 17:15 Tokyo):`);
console.log(`    Moon     = ${buggyPositions.moon.sign} ${buggyPositions.moon.degree}°`);
console.log(`    Ascendant = ${buggyPositions.ascendant?.sign} ${buggyPositions.ascendant?.degree}°`);

// Correct path
const fixed = resolveBirthUTC(mochiBirthDate, mochiBirthTime, 35.6762, 139.6503);
const fixedPositions = calculateAllPositions(fixed.utcDate, 35.6762, 139.6503);
console.log(`  FIXED (correctly 08:15 Tokyo = 23:15 Oct 27 UTC):`);
console.log(`    Moon     = ${fixedPositions.moon.sign} ${fixedPositions.moon.degree}°`);
console.log(`    Ascendant = ${fixedPositions.ascendant?.sign} ${fixedPositions.ascendant?.degree}°`);

console.log(`\n━━━ SUMMARY ━━━`);
console.log(`  PASS: ${pass}, FAIL: ${fail}`);
if (fail > 0) Deno.exit(1);
