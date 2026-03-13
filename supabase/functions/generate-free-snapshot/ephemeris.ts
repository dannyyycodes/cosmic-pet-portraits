/**
 * Accurate Ephemeris Calculations v2
 * Uses the `astronomia` library (VSOP87 + ELP2000 full theories) for planets and Moon.
 * Uses lookup table for Chiron (high eccentricity makes analytical calculation unreliable).
 * Preserves the same exported interface as ephemeris.ts for drop-in replacement.
 */

import { Planet } from "https://esm.sh/astronomia@4.1.1/planetposition";
import * as solar from "https://esm.sh/astronomia@4.1.1/solar";
import * as moonposition from "https://esm.sh/astronomia@4.1.1/moonposition";
import * as julian from "https://esm.sh/astronomia@4.1.1/julian";
import * as base from "https://esm.sh/astronomia@4.1.1/base";
import * as nutation from "https://esm.sh/astronomia@4.1.1/nutation";
import * as coord from "https://esm.sh/astronomia@4.1.1/coord";

// VSOP87B data for each planet (heliocentric ecliptic, equinox of date)
import vsop87BMercury from "https://esm.sh/astronomia@4.1.1/data/vsop87Bmercury";
import vsop87BVenus from "https://esm.sh/astronomia@4.1.1/data/vsop87Bvenus";
import vsop87BEarth from "https://esm.sh/astronomia@4.1.1/data/vsop87Bearth";
import vsop87BMars from "https://esm.sh/astronomia@4.1.1/data/vsop87Bmars";
import vsop87BJupiter from "https://esm.sh/astronomia@4.1.1/data/vsop87Bjupiter";
import vsop87BSaturn from "https://esm.sh/astronomia@4.1.1/data/vsop87Bsaturn";
import vsop87BUranus from "https://esm.sh/astronomia@4.1.1/data/vsop87Buranus";
import vsop87BNeptune from "https://esm.sh/astronomia@4.1.1/data/vsop87Bneptune";

import { getChironLongitude as getChironFromTable } from "./chiron-table.ts";

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

// Planet instances (lazy-init to avoid import overhead if not used)
let mercury: Planet, venus: Planet, earth: Planet, mars: Planet;
let jupiter: Planet, saturn: Planet, uranus: Planet, neptune: Planet;

function initPlanets() {
  if (earth) return;
  mercury = new Planet(vsop87BMercury);
  venus = new Planet(vsop87BVenus);
  earth = new Planet(vsop87BEarth);
  mars = new Planet(vsop87BMars);
  jupiter = new Planet(vsop87BJupiter);
  saturn = new Planet(vsop87BSaturn);
  uranus = new Planet(vsop87BUranus);
  neptune = new Planet(vsop87BNeptune);
}

// ─── Zodiac helpers ──────────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function normalizeAngle(angle: number): number {
  let result = angle % 360;
  if (result < 0) result += 360;
  return result;
}

export function longitudeToZodiac(longitude: number): { sign: string; degree: number } {
  const norm = normalizeAngle(longitude);
  const signIndex = Math.floor(norm / 30) % 12;
  const degree = Math.floor(norm % 30);
  return { sign: ZODIAC_SIGNS[signIndex], degree };
}

// ─── Julian Day ──────────────────────────────────────────────────────────────

export function dateToJD(date: Date): number {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400;
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) +
         Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function julianCenturies(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

// ─── Geocentric ecliptic longitude from heliocentric VSOP87 ─────────────────

/**
 * Convert a heliocentric planet position to geocentric ecliptic longitude.
 * This is the key fix — the old ephemeris skipped this conversion entirely,
 * which is why Mercury and Venus were off by multiple zodiac signs.
 */
function geocentricLongitude(planet: Planet, jd: number): number {
  initPlanets();

  // Heliocentric position of the planet
  const planetPos = planet.position2000(jd);
  // Heliocentric position of Earth
  const earthPos = earth.position2000(jd);

  // Convert to rectangular coordinates
  const planetL = planetPos.lon;
  const planetB = planetPos.lat;
  const planetR = planetPos.range;

  const earthL = earthPos.lon;
  const earthB = earthPos.lat;
  const earthR = earthPos.range;

  // Planet heliocentric rectangular
  const xP = planetR * Math.cos(planetB) * Math.cos(planetL);
  const yP = planetR * Math.cos(planetB) * Math.sin(planetL);
  const zP = planetR * Math.sin(planetB);

  // Earth heliocentric rectangular
  const xE = earthR * Math.cos(earthB) * Math.cos(earthL);
  const yE = earthR * Math.cos(earthB) * Math.sin(earthL);
  const zE = earthR * Math.sin(earthB);

  // Geocentric rectangular
  const x = xP - xE;
  const y = yP - yE;
  const z = zP - zE;

  // Geocentric ecliptic longitude
  let lon = Math.atan2(y, x) * RAD_TO_DEG;
  lon = normalizeAngle(lon);

  return lon;
}

// ─── Individual planet functions (matching old interface) ────────────────────

export function getSunLongitude(jd: number): number {
  initPlanets();
  // Sun's geocentric position = Earth's heliocentric position + 180°
  const earthPos = earth.position2000(jd);
  let sunLon = earthPos.lon * RAD_TO_DEG + 180;
  return normalizeAngle(sunLon);
}

export function getMoonLongitude(jd: number): number {
  // astronomia moonposition gives geocentric directly
  const pos = moonposition.position(jd);
  return normalizeAngle(pos.lon * RAD_TO_DEG);
}

export function getMercuryLongitude(jd: number): number {
  initPlanets();
  return geocentricLongitude(mercury, jd);
}

export function getVenusLongitude(jd: number): number {
  initPlanets();
  return geocentricLongitude(venus, jd);
}

export function getMarsLongitude(jd: number): number {
  initPlanets();
  return geocentricLongitude(mars, jd);
}

export function getJupiterLongitude(jd: number): number {
  initPlanets();
  return geocentricLongitude(jupiter, jd);
}

export function getSaturnLongitude(jd: number): number {
  initPlanets();
  return geocentricLongitude(saturn, jd);
}

export function getUranusLongitude(jd: number): number {
  initPlanets();
  return geocentricLongitude(uranus, jd);
}

export function getNeptuneLongitude(jd: number): number {
  initPlanets();
  return geocentricLongitude(neptune, jd);
}

// Pluto: Use simplified mean longitude (astronomia doesn't include Pluto in VSOP87)
// This gives sign-level accuracy for Pluto's very slow orbit
export function getPlutoLongitude(jd: number): number {
  const T = julianCenturies(jd);
  // Improved Pluto mean elements from Meeus
  const L = normalizeAngle(238.958116 + 144.9600341 * T);
  const M = normalizeAngle(238.956785 + 144.9600341 * T);
  const Mrad = M * DEG_TO_RAD;
  // Pluto eccentricity ~0.2488
  const e = 0.2488;
  const C = (2 * e) * Math.sin(Mrad) + (5 * e * e / 4) * Math.sin(2 * Mrad);
  return normalizeAngle(L + C * RAD_TO_DEG);
}

// North Node: Meeus formula (standard, accurate)
export function getNorthNodeLongitude(jd: number): number {
  const T = julianCenturies(jd);
  return normalizeAngle(125.0445479 - 1934.1362891 * T +
    0.0020754 * T * T + T * T * T / 467441 - T * T * T * T / 60616000);
}

// Chiron: Lookup table with interpolation (high eccentricity = 0.379)
export function getChironLongitude(jd: number): number {
  // Convert JD to Date for the lookup table
  const date = new Date((jd - 2440587.5) * 86400000);
  const tableLon = getChironFromTable(date);

  if (tableLon !== null) return tableLon;

  // Fallback for dates outside 1990-2030: use simplified calculation
  console.warn("[EPHEMERIS] Chiron date outside lookup table range, using simplified calculation");
  const T = julianCenturies(jd);
  const L = normalizeAngle(209.0 + 259.83 * T);
  const M = normalizeAngle(339.0 + 259.83 * T);
  const Mrad = M * DEG_TO_RAD;
  const e = 0.3786;
  const C = (2 * e) * Math.sin(Mrad) + (5 * e * e / 4) * Math.sin(2 * Mrad);
  return normalizeAngle(L + C * RAD_TO_DEG);
}

// Black Moon Lilith (mean lunar apogee): Meeus formula (standard, accurate)
export function getLilithLongitude(jd: number): number {
  const T = julianCenturies(jd);
  return normalizeAngle(83.3532430 + 4069.0137111 * T -
    0.0103238 * T * T - T * T * T / 80053 + T * T * T * T / 18999000);
}

// Ascendant: Preserved from original (standard spherical trigonometry)
export function getAscendant(jd: number, latitude: number, longitude: number): number {
  const T = julianCenturies(jd);
  let GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T - T * T * T / 38710000;
  GMST = normalizeAngle(GMST);
  const LST = normalizeAngle(GMST + longitude);
  const LSTrad = LST * DEG_TO_RAD;
  const eps = 23.439291 - 0.0130042 * T;
  const epsRad = eps * DEG_TO_RAD;
  const latRad = latitude * DEG_TO_RAD;
  const y = -Math.cos(LSTrad);
  const x = Math.sin(epsRad) * Math.tan(latRad) + Math.cos(epsRad) * Math.sin(LSTrad);
  return normalizeAngle(Math.atan2(y, x) * RAD_TO_DEG);
}

// ─── PlanetaryPositions interface ────────────────────────────────────────────

export interface PlanetaryPositions {
  sun: { longitude: number; sign: string; degree: number };
  moon: { longitude: number; sign: string; degree: number };
  mercury: { longitude: number; sign: string; degree: number };
  venus: { longitude: number; sign: string; degree: number };
  mars: { longitude: number; sign: string; degree: number };
  jupiter: { longitude: number; sign: string; degree: number };
  saturn: { longitude: number; sign: string; degree: number };
  uranus: { longitude: number; sign: string; degree: number };
  neptune: { longitude: number; sign: string; degree: number };
  pluto: { longitude: number; sign: string; degree: number };
  northNode: { longitude: number; sign: string; degree: number };
  chiron: { longitude: number; sign: string; degree: number };
  lilith: { longitude: number; sign: string; degree: number };
  ascendant?: { longitude: number; sign: string; degree: number };
}

export function calculateAllPositions(
  date: Date,
  latitude?: number,
  longitude?: number
): PlanetaryPositions {
  const jd = dateToJD(date);

  const sunLon = getSunLongitude(jd);
  const moonLon = getMoonLongitude(jd);
  const mercuryLon = getMercuryLongitude(jd);
  const venusLon = getVenusLongitude(jd);
  const marsLon = getMarsLongitude(jd);
  const jupiterLon = getJupiterLongitude(jd);
  const saturnLon = getSaturnLongitude(jd);
  const uranusLon = getUranusLongitude(jd);
  const neptuneLon = getNeptuneLongitude(jd);
  const plutoLon = getPlutoLongitude(jd);
  const northNodeLon = getNorthNodeLongitude(jd);
  const chironLon = getChironLongitude(jd);
  const lilithLon = getLilithLongitude(jd);

  const positions: PlanetaryPositions = {
    sun: { longitude: sunLon, ...longitudeToZodiac(sunLon) },
    moon: { longitude: moonLon, ...longitudeToZodiac(moonLon) },
    mercury: { longitude: mercuryLon, ...longitudeToZodiac(mercuryLon) },
    venus: { longitude: venusLon, ...longitudeToZodiac(venusLon) },
    mars: { longitude: marsLon, ...longitudeToZodiac(marsLon) },
    jupiter: { longitude: jupiterLon, ...longitudeToZodiac(jupiterLon) },
    saturn: { longitude: saturnLon, ...longitudeToZodiac(saturnLon) },
    uranus: { longitude: uranusLon, ...longitudeToZodiac(uranusLon) },
    neptune: { longitude: neptuneLon, ...longitudeToZodiac(neptuneLon) },
    pluto: { longitude: plutoLon, ...longitudeToZodiac(plutoLon) },
    northNode: { longitude: northNodeLon, ...longitudeToZodiac(northNodeLon) },
    chiron: { longitude: chironLon, ...longitudeToZodiac(chironLon) },
    lilith: { longitude: lilithLon, ...longitudeToZodiac(lilithLon) },
  };

  if (latitude !== undefined && longitude !== undefined) {
    const ascLon = getAscendant(jd, latitude, longitude);
    positions.ascendant = { longitude: ascLon, ...longitudeToZodiac(ascLon) };
  }

  // Sanity checks
  const warnings = validatePositions(positions, sunLon);
  if (warnings.length > 0) {
    console.warn("[EPHEMERIS] Position warnings:", warnings);
  }

  return positions;
}

// ─── Validation ──────────────────────────────────────────────────────────────

function angularDistance(a: number, b: number): number {
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
}

function validatePositions(positions: PlanetaryPositions, sunLon: number): string[] {
  const warnings: string[] = [];

  // Mercury must be within 28° of the Sun (max elongation)
  const mercDist = angularDistance(positions.mercury.longitude, sunLon);
  if (mercDist > 30) {
    warnings.push(`Mercury ${mercDist.toFixed(1)}° from Sun (max ~28°)`);
  }

  // Venus must be within 47° of the Sun (max elongation)
  const venusDist = angularDistance(positions.venus.longitude, sunLon);
  if (venusDist > 50) {
    warnings.push(`Venus ${venusDist.toFixed(1)}° from Sun (max ~47°)`);
  }

  // All longitudes must be 0-360
  for (const [name, body] of Object.entries(positions)) {
    if (body && typeof body === 'object' && 'longitude' in body) {
      const lon = (body as { longitude: number }).longitude;
      if (lon < 0 || lon >= 360 || isNaN(lon)) {
        warnings.push(`${name} longitude out of range: ${lon}`);
      }
    }
  }

  return warnings;
}

// ─── Utility exports (preserved from original) ──────────────────────────────

export function getElement(sign: string): string {
  const fire = ["Aries", "Leo", "Sagittarius"];
  const earth = ["Taurus", "Virgo", "Capricorn"];
  const air = ["Gemini", "Libra", "Aquarius"];
  if (fire.includes(sign)) return "Fire";
  if (earth.includes(sign)) return "Earth";
  if (air.includes(sign)) return "Air";
  return "Water";
}

export function getModality(sign: string): string {
  const cardinal = ["Aries", "Cancer", "Libra", "Capricorn"];
  const fixed = ["Taurus", "Leo", "Scorpio", "Aquarius"];
  if (cardinal.includes(sign)) return "Cardinal";
  if (fixed.includes(sign)) return "Fixed";
  return "Mutable";
}

export function getRulingPlanet(sign: string): string {
  const rulers: Record<string, string> = {
    Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
    Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Pluto",
    Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Uranus", Pisces: "Neptune"
  };
  return rulers[sign] || "Sun";
}
