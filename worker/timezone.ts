/**
 * Timezone helper — converts local birth time at a geographic location
 * into the correct UTC Date for astronomical calculations.
 *
 * Problem solved: native `new Date('2022-10-28').setHours(8, 15)` uses the
 * SERVER's local timezone (usually UTC on Linux hosts), not the birth
 * location's timezone. For a pet born at 08:15 Tokyo time, that creates
 * a 9-hour error → Moon can shift ~4.5° → wrong sign near boundaries.
 *
 * This module:
 *   1. Looks up IANA timezone from lat/lon via tz-lookup (polygon-based).
 *   2. Converts local-time components to UTC via Luxon (handles DST).
 */

import tzlookup from "https://esm.sh/tz-lookup@6.1.25";
import { DateTime } from "https://esm.sh/luxon@3.4.4";

export interface ResolvedBirthUTC {
  utcDate: Date;
  ianaTz: string | null;
  offsetHours: number;
  noteForPrompt: string;
}

/**
 * Resolve a customer-entered birth date + time + coordinates into a true UTC Date.
 *
 * @param birthDate  "YYYY-MM-DD" from the pet_reports row
 * @param birthTime  "HH:MM" or empty/null
 * @param lat        Birth location latitude (nullable if unknown)
 * @param lon        Birth location longitude (nullable if unknown)
 * @returns UTC Date suitable for calculateAllPositions().
 */
export function resolveBirthUTC(
  birthDate: string,
  birthTime: string | null | undefined,
  lat?: number,
  lon?: number,
): ResolvedBirthUTC {
  // Parse date components from ISO-8601 YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!m) {
    // Fallback: current behaviour — parse as Date, but log loudly.
    console.warn("[TZ] Unrecognised birthDate format, fallback:", birthDate);
    const d = new Date(birthDate);
    return {
      utcDate: d,
      ianaTz: null,
      offsetHours: 0,
      noteForPrompt: "Birth date parsing fallback — accuracy may be reduced.",
    };
  }
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);

  // Parse time components — default to noon local if unknown
  let hour = 12;
  let minute = 0;
  let haveTime = false;
  if (birthTime && /^\d{1,2}:\d{2}/.test(birthTime)) {
    const [h, mm] = birthTime.split(":").map(Number);
    if (!isNaN(h) && h >= 0 && h < 24 && !isNaN(mm) && mm >= 0 && mm < 60) {
      hour = h;
      minute = mm;
      haveTime = true;
    }
  }

  // Resolve timezone — prefer geographic lookup
  let ianaTz: string | null = null;
  if (typeof lat === "number" && typeof lon === "number") {
    try {
      ianaTz = tzlookup(lat, lon);
    } catch (e) {
      console.warn("[TZ] tz-lookup failed for", lat, lon, e);
    }
  }

  if (!ianaTz) {
    // No coords — fall back to UTC (documented)
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    return {
      utcDate,
      ianaTz: null,
      offsetHours: 0,
      noteForPrompt: haveTime
        ? `Birth time: ${birthTime} (assumed UTC — no location provided)`
        : "Birth time unknown — using noon UTC. Moon sign may vary by ±1 sign.",
    };
  }

  // Build a Luxon DateTime in the birth location's local timezone
  const local = DateTime.fromObject(
    { year, month, day, hour, minute, second: 0 },
    { zone: ianaTz },
  );

  if (!local.isValid) {
    console.warn("[TZ] Luxon invalid:", local.invalidReason, local.invalidExplanation);
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    return {
      utcDate,
      ianaTz,
      offsetHours: 0,
      noteForPrompt: "Birth time fallback — invalid local time.",
    };
  }

  const utcDate = local.toUTC().toJSDate();
  const offsetHours = local.offset / 60;

  const noteForPrompt = haveTime
    ? `Birth time: ${birthTime} ${ianaTz} (UTC${offsetHours >= 0 ? "+" : ""}${offsetHours}) → Moon & Ascendant calculated precisely.`
    : `Birth time unknown — using noon ${ianaTz}. Moon sign may vary by ±1 sign. (Provide birth time for exact Moon & Rising.)`;

  return { utcDate, ianaTz, offsetHours, noteForPrompt };
}
