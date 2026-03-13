/**
 * Ephemeris v2 verification script.
 * Tests planetary positions against known-good data from Swiss Ephemeris / astro.com.
 *
 * Usage: deno run --allow-net worker/test-ephemeris.ts
 */

import { calculateAllPositions, dateToJD, longitudeToZodiac } from "./ephemeris-v2.ts";

interface TestCase {
  label: string;
  date: Date;
  expected: Record<string, string>; // planet -> expected sign
  expectedDegrees?: Record<string, number>; // planet -> expected degree (approx)
}

// Known positions verified against astro.com / Swiss Ephemeris
const TEST_CASES: TestCase[] = [
  {
    label: "July 22, 2023 (Ziggy — Cancer/Leo cusp)",
    date: new Date("2023-07-22T12:00:00Z"),
    expected: {
      sun: "Cancer",
      moon: "Virgo",
      mercury: "Leo",
      venus: "Leo",
      mars: "Virgo",
      jupiter: "Taurus",
      saturn: "Pisces",
      uranus: "Taurus",
      neptune: "Pisces",
      chiron: "Aries",
      northNode: "Aries",
    },
    expectedDegrees: {
      sun: 29,      // Late Cancer
      mercury: 7,   // Leo ~5-10
      venus: 27,    // Leo ~25-28
      mars: 28,     // Virgo ~27-29
      jupiter: 12,  // Taurus ~11-13
      saturn: 6,    // Pisces ~5-7
    },
  },
  {
    label: "January 1, 2000 (J2000 epoch)",
    date: new Date("2000-01-01T12:00:00Z"),
    expected: {
      sun: "Capricorn",
      moon: "Scorpio",
      mercury: "Capricorn",
      venus: "Sagittarius",
      mars: "Aquarius",
      jupiter: "Aries",
      saturn: "Taurus",
      uranus: "Aquarius",
      neptune: "Aquarius",
      chiron: "Sagittarius",
    },
  },
  {
    label: "March 20, 2020 (Vernal Equinox)",
    date: new Date("2020-03-20T12:00:00Z"),
    expected: {
      sun: "Aries",    // Equinox was ~03:50 UTC, by noon Sun is 0° Aries
      mercury: "Pisces",
      venus: "Taurus",
      mars: "Capricorn",
      jupiter: "Capricorn",
      saturn: "Capricorn",  // Saturn entered Aquarius March 21-22, 2020
      chiron: "Aries",
    },
  },
  {
    label: "December 21, 2020 (Great Conjunction)",
    date: new Date("2020-12-21T18:00:00Z"),
    expected: {
      sun: "Capricorn",  // Solstice was ~10:02 UTC, by 18:00 Sun is 0° Cap
      jupiter: "Aquarius",
      saturn: "Aquarius",
      mercury: "Capricorn",
      venus: "Sagittarius",
      mars: "Aries",
    },
  },
  {
    label: "April 15, 2010 (random mid-date)",
    date: new Date("2010-04-15T12:00:00Z"),
    expected: {
      sun: "Aries",
      mercury: "Taurus",
      venus: "Taurus",
      mars: "Leo",
      jupiter: "Pisces",
      saturn: "Virgo",
      chiron: "Aquarius",  // Chiron was in late Aquarius / Pisces cusp area
    },
  },
  {
    label: "August 1, 1995 (older date test)",
    date: new Date("1995-08-01T12:00:00Z"),
    expected: {
      sun: "Leo",
      mercury: "Leo",
      venus: "Leo",
      mars: "Libra",
      jupiter: "Sagittarius",
      saturn: "Pisces",
      chiron: "Libra",  // ~1 Libra
    },
  },
  {
    label: "January 15, 1990 (near start of Chiron table)",
    date: new Date("1990-01-15T12:00:00Z"),
    expected: {
      sun: "Capricorn",
      mercury: "Capricorn",
      venus: "Aquarius",
      mars: "Sagittarius",
      jupiter: "Cancer",
      saturn: "Capricorn",
      chiron: "Cancer",
    },
  },
  {
    label: "June 15, 2029 (near end of Chiron table)",
    date: new Date("2029-06-15T12:00:00Z"),
    expected: {
      sun: "Gemini",
      mercury: "Gemini",
      venus: "Cancer",
      mars: "Libra",
      jupiter: "Libra",
      saturn: "Taurus",
      chiron: "Taurus",
    },
  },
  {
    label: "January 20, 2024 (Pluto enters Aquarius)",
    date: new Date("2024-01-20T18:00:00Z"),
    expected: {
      sun: "Capricorn",  // Sun at 29° Cap at 18:00 UTC, enters Aquarius later
      mercury: "Capricorn",
      venus: "Sagittarius",
      mars: "Capricorn",
      jupiter: "Taurus",
      saturn: "Pisces",
    },
  },
  {
    label: "December 13, 2023 (Mercury retrograde in Capricorn)",
    date: new Date("2023-12-13T12:00:00Z"),
    expected: {
      sun: "Sagittarius",
      mercury: "Capricorn",  // Mercury retrograde stationed in Cap
      venus: "Scorpio",
      mars: "Sagittarius",
      jupiter: "Taurus",
      saturn: "Pisces",
    },
  },
];

// Run tests
let totalTests = 0;
let passed = 0;
let failed = 0;
const failures: string[] = [];

for (const tc of TEST_CASES) {
  console.log(`\n--- ${tc.label} ---`);
  console.log(`  Date: ${tc.date.toISOString()}`);

  const positions = calculateAllPositions(tc.date);

  for (const [planet, expectedSign] of Object.entries(tc.expected)) {
    totalTests++;
    const pos = (positions as Record<string, { sign: string; degree: number; longitude: number }>)[planet];
    if (!pos) {
      failures.push(`${tc.label}: ${planet} - position not found`);
      failed++;
      continue;
    }

    const signMatch = pos.sign === expectedSign;
    const status = signMatch ? "PASS" : "FAIL";

    if (!signMatch) {
      failed++;
      const msg = `${tc.label}: ${planet} — got ${pos.sign} ${pos.degree}° (${pos.longitude.toFixed(1)}°), expected ${expectedSign}`;
      failures.push(msg);
      console.log(`  ${status}: ${planet} = ${pos.sign} ${pos.degree}° — EXPECTED ${expectedSign}`);
    } else {
      passed++;
      let degreeNote = "";
      if (tc.expectedDegrees?.[planet] !== undefined) {
        const degDiff = Math.abs(pos.degree - tc.expectedDegrees[planet]);
        degreeNote = degDiff <= 3 ? ` (degree ±${degDiff}°)` : ` (degree off by ${degDiff}°!)`;
      }
      console.log(`  ${status}: ${planet} = ${pos.sign} ${pos.degree}°${degreeNote}`);
    }
  }

  // Print all positions for reference
  console.log(`  ---`);
  for (const [planet, body] of Object.entries(positions)) {
    if (body && typeof body === 'object' && 'sign' in body) {
      const b = body as { sign: string; degree: number; longitude: number };
      console.log(`  ${planet.padEnd(10)} ${b.sign.padEnd(12)} ${b.degree}° (${b.longitude.toFixed(1)}°)`);
    }
  }
}

console.log("\n" + "=".repeat(60));
console.log(`RESULTS: ${passed}/${totalTests} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log("\nFAILURES:");
  for (const f of failures) {
    console.log(`  ✗ ${f}`);
  }
}
console.log("=".repeat(60));

if (failed > 0) {
  Deno.exit(1);
}
