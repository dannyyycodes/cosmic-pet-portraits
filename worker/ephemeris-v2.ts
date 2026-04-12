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

// Pluto: Pre-computed longitudes from JPL Horizons (astronomia doesn't include Pluto)
// Pre-computed Pluto ecliptic longitudes (geocentric, apparent, degrees 0-360)
// Monthly positions from 1990-01 to 2050-12 (732 samples)
// Source: NASA JPL Horizons API (DE441 ephemeris, body 999 Pluto)
// Fetched: 2026-04-12. Fully captures retrograde loops and sign-ingress boundaries.
//
// Format: [year, month, longitude_degrees]
const PLUTO_TABLE: [number, number, number][] = [
  [1990, 1,227.08],[1990, 2,227.69],[1990, 3,227.76],[1990, 4,227.33],[1990, 5,226.57],[1990, 6,225.73],
  [1990, 7,225.14],[1990, 8,224.98],[1990, 9,225.35],[1990,10,226.17],[1990,11,227.33],[1990,12,228.53],
  [1991, 1,229.59],[1991, 2,230.24],[1991, 3,230.36],[1991, 4,229.98],[1991, 5,229.25],[1991, 6, 228.4],
  [1991, 7,227.78],[1991, 8,227.57],[1991, 9,227.89],[1991,10,228.67],[1991,11, 229.8],[1991,12, 231.0],
  [1992, 1,232.09],[1992, 2,232.79],[1992, 3,232.95],[1992, 4,232.59],[1992, 5,231.88],[1992, 6,231.03],
  [1992, 7,230.39],[1992, 8,230.15],[1992, 9,230.44],[1992,10,231.19],[1992,11,232.31],[1992,12,233.51],
  [1993, 1,234.61],[1993, 2,235.33],[1993, 3,235.52],[1993, 4,235.21],[1993, 5,234.52],[1993, 6,233.67],
  [1993, 7,233.01],[1993, 8,232.72],[1993, 9,232.96],[1993,10,233.67],[1993,11,234.76],[1993,12,235.95],
  [1994, 1,237.07],[1994, 2,237.83],[1994, 3,238.07],[1994, 4,237.81],[1994, 5,237.15],[1994, 6,236.31],
  [1994, 7,235.62],[1994, 8,235.28],[1994, 9,235.47],[1994,10,236.14],[1994,11, 237.2],[1994,12,238.39],
  [1995, 1,239.52],[1995, 2,240.32],[1995, 3, 240.6],[1995, 4,240.39],[1995, 5,239.76],[1995, 6,238.92],
  [1995, 7,238.21],[1995, 8,237.83],[1995, 9,237.97],[1995,10,238.59],[1995,11,239.62],[1995,12, 240.8],
  [1996, 1,241.95],[1996, 2,242.78],[1996, 3,243.11],[1996, 4,242.92],[1996, 5,242.32],[1996, 6,241.48],
  [1996, 7,240.76],[1996, 8,240.36],[1996, 9,240.46],[1996,10,241.06],[1996,11,242.06],[1996,12,243.23],
  [1997, 1,244.39],[1997, 2,245.24],[1997, 3,245.59],[1997, 4,245.45],[1997, 5,244.88],[1997, 6,244.05],
  [1997, 7,243.31],[1997, 8,242.87],[1997, 9,242.92],[1997,10,243.47],[1997,11,244.45],[1997,12, 245.6],
  [1998, 1,246.76],[1998, 2,247.64],[1998, 3,248.03],[1998, 4,247.94],[1998, 5, 247.4],[1998, 6,246.59],
  [1998, 7,245.84],[1998, 8,245.36],[1998, 9,245.36],[1998,10,245.87],[1998,11,246.81],[1998,12,247.95],
  [1999, 1,249.11],[1999, 2,250.02],[1999, 3,250.45],[1999, 4, 250.4],[1999, 5, 249.9],[1999, 6, 249.1],
  [1999, 7,248.34],[1999, 8,247.83],[1999, 9,247.78],[1999,10,248.24],[1999,11,249.14],[1999,12,250.26],
  [2000, 1,251.44],[2000, 2,252.37],[2000, 3,252.84],[2000, 4,252.83],[2000, 5,252.35],[2000, 6,251.56],
  [2000, 7,250.79],[2000, 8,250.26],[2000, 9,250.19],[2000,10,250.61],[2000,11,251.49],[2000,12, 252.6],
  [2001, 1,253.77],[2001, 2,254.71],[2001, 3, 255.2],[2001, 4,255.23],[2001, 5,254.78],[2001, 6,254.02],
  [2001, 7,253.24],[2001, 8,252.68],[2001, 9,252.56],[2001,10,252.94],[2001,11,253.78],[2001,12,254.87],
  [2002, 1,256.04],[2002, 2, 257.0],[2002, 3,257.52],[2002, 4,257.59],[2002, 5,257.19],[2002, 6,256.44],
  [2002, 7,255.66],[2002, 8,255.07],[2002, 9,254.91],[2002,10,255.24],[2002,11,256.05],[2002,12,257.11],
  [2003, 1,258.28],[2003, 2,259.26],[2003, 3,259.81],[2003, 4,259.93],[2003, 5,259.56],[2003, 6,258.84],
  [2003, 7,258.06],[2003, 8,257.44],[2003, 9,257.24],[2003,10,257.53],[2003,11,258.29],[2003,12,259.33],
  [2004, 1, 260.5],[2004, 2, 261.5],[2004, 3,262.09],[2004, 4,262.23],[2004, 5,261.89],[2004, 6,261.18],
  [2004, 7, 260.4],[2004, 8,259.77],[2004, 9,259.54],[2004,10,259.81],[2004,11,260.54],[2004,12,261.57],
  [2005, 1,262.72],[2005, 2,263.73],[2005, 3,264.33],[2005, 4,264.51],[2005, 5, 264.2],[2005, 6,263.52],
  [2005, 7,262.74],[2005, 8,262.09],[2005, 9,261.83],[2005,10,262.04],[2005,11,262.74],[2005,12,263.74],
  [2006, 1,264.89],[2006, 2,265.91],[2006, 3,266.53],[2006, 4,266.75],[2006, 5,266.49],[2006, 6,265.83],
  [2006, 7,265.06],[2006, 8,264.38],[2006, 9,264.08],[2006,10,264.26],[2006,11,264.91],[2006,12,265.89],
  [2007, 1,267.03],[2007, 2,268.06],[2007, 3,268.71],[2007, 4,268.97],[2007, 5,268.74],[2007, 6,268.11],
  [2007, 7,267.34],[2007, 8,266.65],[2007, 9,266.31],[2007,10,266.45],[2007,11,267.06],[2007,12,268.01],
  [2008, 1,269.14],[2008, 2,270.18],[2008, 3,270.87],[2008, 4,271.15],[2008, 5,270.94],[2008, 6,270.33],
  [2008, 7,269.57],[2008, 8,268.87],[2008, 9,268.51],[2008,10,268.62],[2008,11,269.21],[2008,12,270.14],
  [2009, 1,271.26],[2009, 2, 272.3],[2009, 3,272.98],[2009, 4, 273.3],[2009, 5,273.12],[2009, 6,272.54],
  [2009, 7,271.79],[2009, 8,271.08],[2009, 9,270.69],[2009,10,270.76],[2009,11,271.31],[2009,12, 272.2],
  [2010, 1,273.31],[2010, 2,274.36],[2010, 3,275.06],[2010, 4,275.41],[2010, 5,275.27],[2010, 6,274.72],
  [2010, 7,273.98],[2010, 8,273.26],[2010, 9,272.83],[2010,10,272.86],[2010,11,273.37],[2010,12,274.24],
  [2011, 1,275.33],[2011, 2,276.38],[2011, 3,277.11],[2011, 4,277.49],[2011, 5,277.39],[2011, 6,276.86],
  [2011, 7,276.13],[2011, 8, 275.4],[2011, 9,274.95],[2011,10,274.94],[2011,11,275.41],[2011,12,276.25],
  [2012, 1,277.32],[2012, 2,278.38],[2012, 3,279.14],[2012, 4,279.54],[2012, 5,279.46],[2012, 6,278.95],
  [2012, 7,278.23],[2012, 8,277.49],[2012, 9,277.03],[2012,10, 277.0],[2012,11,277.44],[2012,12,278.26],
  [2013, 1,279.32],[2013, 2,280.37],[2013, 3,281.12],[2013, 4,281.55],[2013, 5, 281.5],[2013, 6,281.03],
  [2013, 7,280.32],[2013, 8,279.58],[2013, 9,279.09],[2013,10,279.02],[2013,11,279.42],[2013,12,280.21],
  [2014, 1,281.26],[2014, 2,282.31],[2014, 3,283.07],[2014, 4,283.53],[2014, 5,283.52],[2014, 6,283.07],
  [2014, 7,282.37],[2014, 8,281.63],[2014, 9,281.11],[2014,10,281.01],[2014,11,281.38],[2014,12,282.14],
  [2015, 1,283.16],[2015, 2,284.22],[2015, 3,284.99],[2015, 4,285.48],[2015, 5, 285.5],[2015, 6,285.08],
  [2015, 7, 284.4],[2015, 8,283.66],[2015, 9,283.12],[2015,10,282.98],[2015,11,283.31],[2015,12,284.04],
  [2016, 1,285.05],[2016, 2, 286.1],[2016, 3,286.91],[2016, 4,287.41],[2016, 5,287.45],[2016, 6,287.05],
  [2016, 7,286.38],[2016, 8,285.63],[2016, 9,285.09],[2016,10,284.93],[2016,11,285.24],[2016,12,285.95],
  [2017, 1,286.94],[2017, 2,287.99],[2017, 3,288.78],[2017, 4, 289.3],[2017, 5,289.37],[2017, 6, 289.0],
  [2017, 7,288.35],[2017, 8,287.61],[2017, 9,287.04],[2017,10,286.86],[2017,11,287.13],[2017,12, 287.8],
  [2018, 1,288.78],[2018, 2,289.82],[2018, 3,290.62],[2018, 4,291.17],[2018, 5,291.27],[2018, 6,290.93],
  [2018, 7, 290.3],[2018, 8,289.55],[2018, 9,288.97],[2018,10,288.76],[2018,11,288.99],[2018,12,289.64],
  [2019, 1,290.59],[2019, 2,291.63],[2019, 3,292.44],[2019, 4,293.01],[2019, 5,293.14],[2019, 6,292.83],
  [2019, 7,292.22],[2019, 8,291.48],[2019, 9,290.88],[2019,10,290.63],[2019,11,290.84],[2019,12,291.45],
  [2020, 1,292.39],[2020, 2,293.42],[2020, 3,294.26],[2020, 4,294.84],[2020, 5,294.99],[2020, 6,294.69],
  [2020, 7,294.09],[2020, 8,293.35],[2020, 9,292.75],[2020,10,292.49],[2020,11,292.67],[2020,12,293.27],
  [2021, 1,294.19],[2021, 2,295.21],[2021, 3,296.03],[2021, 4,296.63],[2021, 5,296.81],[2021, 6,296.54],
  [2021, 7,295.96],[2021, 8,295.23],[2021, 9,294.61],[2021,10,294.32],[2021,11,294.47],[2021,12,295.04],
  [2022, 1,295.93],[2022, 2,296.95],[2022, 3,297.77],[2022, 4, 298.4],[2022, 5, 298.6],[2022, 6,298.36],
  [2022, 7, 297.8],[2022, 8,297.07],[2022, 9,296.44],[2022,10,296.13],[2022,11,296.25],[2022,12,296.78],
  [2023, 1,297.66],[2023, 2,298.66],[2023, 3,299.49],[2023, 4,300.14],[2023, 5,300.36],[2023, 6,300.16],
  [2023, 7,299.62],[2023, 8,298.89],[2023, 9,298.25],[2023,10,297.92],[2023,11, 298.0],[2023,12, 298.5],
  [2024, 1,299.36],[2024, 2,300.35],[2024, 3,301.22],[2024, 4,301.87],[2024, 5, 302.1],[2024, 6,301.91],
  [2024, 7,301.38],[2024, 8,300.66],[2024, 9,300.02],[2024,10,299.67],[2024,11,299.74],[2024,12,300.23],
  [2025, 1,301.06],[2025, 2,302.05],[2025, 3,302.89],[2025, 4,303.55],[2025, 5,303.82],[2025, 6,303.65],
  [2025, 7,303.14],[2025, 8,302.43],[2025, 9,301.78],[2025,10,301.41],[2025,11,301.44],[2025,12, 301.9],
  [2026, 1,302.72],[2026, 2, 303.7],[2026, 3,304.53],[2026, 4,305.22],[2026, 5, 305.5],[2026, 6,305.36],
  [2026, 7,304.88],[2026, 8,304.18],[2026, 9,303.51],[2026,10,303.12],[2026,11,303.13],[2026,12,303.56],
  [2027, 1,304.35],[2027, 2,305.32],[2027, 3,306.16],[2027, 4,306.86],[2027, 5,307.17],[2027, 6,307.05],
  [2027, 7,306.59],[2027, 8, 305.9],[2027, 9,305.23],[2027,10,304.82],[2027,11,304.79],[2027,12,305.19],
  [2028, 1,305.97],[2028, 2,306.92],[2028, 3,307.79],[2028, 4,308.49],[2028, 5,308.81],[2028, 6,308.71],
  [2028, 7,308.26],[2028, 8,307.57],[2028, 9, 306.9],[2028,10,306.48],[2028,11,306.45],[2028,12,306.83],
  [2029, 1,307.59],[2029, 2,308.54],[2029, 3,309.37],[2029, 4,310.09],[2029, 5,310.43],[2029, 6,310.36],
  [2029, 7,309.92],[2029, 8,309.25],[2029, 9,308.57],[2029,10,308.14],[2029,11,308.07],[2029,12,308.43],
  [2030, 1,309.16],[2030, 2, 310.1],[2030, 3,310.94],[2030, 4,311.67],[2030, 5,312.03],[2030, 6,311.98],
  [2030, 7,311.57],[2030, 8,310.91],[2030, 9,310.23],[2030,10,309.77],[2030,11,309.68],[2030,12,310.01],
  [2031, 1,310.72],[2031, 2,311.65],[2031, 3,312.48],[2031, 4,313.22],[2031, 5,313.61],[2031, 6,313.59],
  [2031, 7,313.19],[2031, 8,312.54],[2031, 9,311.86],[2031,10,311.39],[2031,11,311.28],[2031,12,311.58],
  [2032, 1,312.27],[2032, 2,313.18],[2032, 3,314.04],[2032, 4,314.78],[2032, 5,315.17],[2032, 6,315.16],
  [2032, 7,314.78],[2032, 8,314.14],[2032, 9,313.46],[2032,10,312.98],[2032,11,312.86],[2032,12,313.14],
  [2033, 1,313.82],[2033, 2,314.72],[2033, 3,315.55],[2033, 4, 316.3],[2033, 5,316.71],[2033, 6,316.73],
  [2033, 7,316.37],[2033, 8,315.74],[2033, 9,315.06],[2033,10,314.57],[2033,11,314.41],[2033,12,314.68],
  [2034, 1,315.33],[2034, 2,316.21],[2034, 3,317.04],[2034, 4,317.81],[2034, 5,318.23],[2034, 6,318.27],
  [2034, 7,317.93],[2034, 8,317.32],[2034, 9,316.63],[2034,10,316.13],[2034,11,315.95],[2034,12,316.19],
  [2035, 1,316.82],[2035, 2,317.69],[2035, 3,318.52],[2035, 4,319.29],[2035, 5,319.73],[2035, 6, 319.8],
  [2035, 7,319.48],[2035, 8,318.87],[2035, 9,318.19],[2035,10,317.68],[2035,11,317.47],[2035,12,317.69],
  [2036, 1,318.29],[2036, 2,319.15],[2036, 3, 320.0],[2036, 4,320.77],[2036, 5,321.22],[2036, 6,321.29],
  [2036, 7,320.99],[2036, 8,320.39],[2036, 9,319.71],[2036,10,319.19],[2036,11,318.98],[2036,12,319.18],
  [2037, 1,319.77],[2037, 2,320.62],[2037, 3,321.44],[2037, 4,322.22],[2037, 5,322.68],[2037, 6,322.78],
  [2037, 7,322.49],[2037, 8,321.91],[2037, 9,321.23],[2037,10, 320.7],[2037,11,320.47],[2037,12,320.64],
  [2038, 1,321.21],[2038, 2,322.04],[2038, 3,322.86],[2038, 4,323.64],[2038, 5,324.13],[2038, 6,324.24],
  [2038, 7,323.98],[2038, 8,323.41],[2038, 9,322.73],[2038,10,322.19],[2038,11,321.94],[2038,12,322.09],
  [2039, 1,322.63],[2039, 2,323.45],[2039, 3,324.26],[2039, 4,325.06],[2039, 5,325.55],[2039, 6,325.69],
  [2039, 7,325.44],[2039, 8,324.89],[2039, 9,324.22],[2039,10,323.67],[2039,11,323.39],[2039,12,323.52],
  [2040, 1,324.04],[2040, 2,324.84],[2040, 3,325.68],[2040, 4,326.47],[2040, 5,326.98],[2040, 6,327.12],
  [2040, 7,326.88],[2040, 8,326.34],[2040, 9,325.67],[2040,10,325.11],[2040,11,324.83],[2040,12,324.95],
  [2041, 1,325.46],[2041, 2,326.25],[2041, 3,327.06],[2041, 4,327.86],[2041, 5,328.37],[2041, 6,328.54],
  [2041, 7,328.32],[2041, 8,327.79],[2041, 9,327.13],[2041,10,326.56],[2041,11,326.26],[2041,12,326.36],
  [2042, 1,326.85],[2042, 2,327.62],[2042, 3,328.42],[2042, 4,329.23],[2042, 5,329.76],[2042, 6,329.94],
  [2042, 7,329.75],[2042, 8,329.23],[2042, 9,328.57],[2042,10, 328.0],[2042,11,327.68],[2042,12,327.75],
  [2043, 1,328.22],[2043, 2,328.98],[2043, 3,329.78],[2043, 4,330.58],[2043, 5,331.13],[2043, 6,331.33],
  [2043, 7,331.16],[2043, 8,330.66],[2043, 9, 330.0],[2043,10,329.43],[2043,11,329.09],[2043,12,329.14],
  [2044, 1,329.58],[2044, 2,330.33],[2044, 3,331.15],[2044, 4,331.95],[2044, 5, 332.5],[2044, 6,332.71],
  [2044, 7,332.54],[2044, 8,332.05],[2044, 9, 331.4],[2044,10,330.82],[2044,11,330.48],[2044,12,330.52],
  [2045, 1,330.95],[2045, 2,331.69],[2045, 3,332.47],[2045, 4,333.28],[2045, 5,333.84],[2045, 6,334.07],
  [2045, 7,333.93],[2045, 8,333.45],[2045, 9,332.81],[2045,10,332.22],[2045,11,331.86],[2045,12,331.88],
  [2046, 1,332.29],[2046, 2,333.01],[2046, 3,333.79],[2046, 4, 334.6],[2046, 5,335.17],[2046, 6,335.42],
  [2046, 7, 335.3],[2046, 8,334.84],[2046, 9, 334.2],[2046,10,333.61],[2046,11,333.23],[2046,12,333.23],
  [2047, 1,333.62],[2047, 2,334.32],[2047, 3,335.09],[2047, 4,335.91],[2047, 5,336.49],[2047, 6,336.76],
  [2047, 7,336.65],[2047, 8,336.21],[2047, 9,335.57],[2047,10,334.98],[2047,11,334.59],[2047,12,334.56],
  [2048, 1,334.93],[2048, 2,335.62],[2048, 3,336.41],[2048, 4,337.22],[2048, 5,337.81],[2048, 6,338.08],
  [2048, 7,337.98],[2048, 8,337.54],[2048, 9,336.91],[2048,10,336.32],[2048,11,335.92],[2048,12,335.89],
  [2049, 1,336.25],[2049, 2,336.93],[2049, 3,337.69],[2049, 4, 338.5],[2049, 5,339.09],[2049, 6,339.38],
  [2049, 7, 339.3],[2049, 8,338.88],[2049, 9,338.26],[2049,10,337.66],[2049,11,337.25],[2049,12,337.19],
  [2050, 1,337.53],[2050, 2, 338.2],[2050, 3,338.95],[2050, 4,339.76],[2050, 5,340.37],[2050, 6,340.67],
  [2050, 7,340.61],[2050, 8, 340.2],[2050, 9,339.59],[2050,10,338.98],[2050,11,338.56],[2050,12,338.49]
];

export function getPlutoLongitude(jd: number): number {
  const date = new Date((jd - 2440587.5) * 86400000);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const idx = PLUTO_TABLE.findIndex(([y, m]) => y === year && m === month);
  if (idx === -1) {
    // Outside table range: use nearest endpoint (graceful degrade)
    if (year < PLUTO_TABLE[0][0]) return PLUTO_TABLE[0][2];
    return PLUTO_TABLE[PLUTO_TABLE.length - 1][2];
  }

  const lon1 = PLUTO_TABLE[idx][2];
  const nextIdx = idx + 1;
  if (nextIdx >= PLUTO_TABLE.length) return lon1;
  const lon2 = PLUTO_TABLE[nextIdx][2];

  const daysInMonth = new Date(year, month, 0).getDate();
  const frac = (day - 1) / daysInMonth;

  // Handle 0/360 wrap (won't happen for Pluto in this range but safe)
  let diff = lon2 - lon1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  let result = lon1 + diff * frac;
  if (result < 0) result += 360;
  if (result >= 360) result -= 360;
  return normalizeAngle(result);
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
