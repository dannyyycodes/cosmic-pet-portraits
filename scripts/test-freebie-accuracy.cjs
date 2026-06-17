// Accuracy QA for the free pet birth-chart. Hits the live edge function and
// asserts: Sun sign matches the tropical date, Sun element is correct, every body
// returns a valid sign + degree, and the dominant element is sane. Also checks the
// front-end has every sign clip + sign line so the journey never falls back.
const fs = require("fs");
const path = require("path");

const ENDPOINT = "https://aduibsyrnenzobuyetmn.supabase.co/functions/v1/pet-birth-chart";
const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const ELEMENT = { Aries:"Fire", Leo:"Fire", Sagittarius:"Fire", Taurus:"Earth", Virgo:"Earth", Capricorn:"Earth", Gemini:"Air", Libra:"Air", Aquarius:"Air", Cancer:"Water", Scorpio:"Water", Pisces:"Water" };
const BODIES = ["sun","moon","mercury","venus","mars","jupiter","saturn","uranus","neptune","pluto","chiron","northNode","lilith"];
// Clearly mid-sign dates (month is 1-based here for readability).
const MID = { Aries:[4,5], Taurus:[5,6], Gemini:[6,6], Cancer:[7,8], Leo:[8,8], Virgo:[9,8], Libra:[10,8], Scorpio:[11,7], Sagittarius:[12,7], Capricorn:[1,8], Aquarius:[2,5], Pisces:[3,7] };
const YEARS = [1998, 2001, 2012, 2024];

async function chart(date) {
  const r = await fetch(`${ENDPOINT}?date=${date}`, { headers: { Origin: "https://www.littlesouls.app" } });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${date}`);
  return r.json();
}
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

(async () => {
  let n = 0;
  // 1) Sun sign + element across all 12 signs x several years
  for (const y of YEARS) {
    for (const sign of SIGNS) {
      const [m, d] = MID[sign];
      const date = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const c = await chart(date); n++;
      ok(c.sun && c.sun.sign === sign, `SUN SIGN ${date}: expected ${sign}, got ${c.sun && c.sun.sign}`);
      ok(c.sun && c.sun.element === ELEMENT[sign], `SUN ELEMENT ${date} (${sign}): expected ${ELEMENT[sign]}, got ${c.sun && c.sun.element}`);
    }
  }
  // 2) Structural integrity across a broad sweep (1st + 15th of each month, 3 years)
  for (const y of [1990, 2007, 2023]) {
    for (let m = 1; m <= 12; m++) {
      for (const d of [1, 15]) {
        const date = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        const c = await chart(date); n++;
        for (const b of BODIES) {
          const body = c[b];
          ok(body && SIGNS.includes(body.sign), `${b.toUpperCase()} bad sign ${date}: ${JSON.stringify(body)}`);
          ok(body && typeof body.degree === "number" && body.degree >= 0 && body.degree < 30, `${b.toUpperCase()} bad degree ${date}: ${JSON.stringify(body)}`);
        }
        ok(["Fire","Earth","Air","Water"].includes(c.dominantElement), `dominantElement bad ${date}: ${c.dominantElement}`);
      }
    }
  }
  // 3) Determinism: same date twice => identical
  const a1 = await chart("2010-06-15"); const a2 = await chart("2010-06-15"); n += 2;
  ok(JSON.stringify(a1.sun) === JSON.stringify(a2.sun), "DETERMINISM: 2010-06-15 sun differs across calls");

  // 4) Front-end completeness: every sign clip + sign line exists
  const voiceDir = path.join(__dirname, "..", "public", "readings", "voice", "k3");
  const src = fs.readFileSync(path.join(__dirname, "..", "src", "components", "funnel-v2", "ReadingsLanding.tsx"), "utf8");
  for (const planet of ["sun","moon","venus"]) {
    for (const sign of SIGNS) {
      const slug = `${planet}-${sign.toLowerCase()}`;
      ok(fs.existsSync(path.join(voiceDir, `${slug}.mp3`)), `MISSING CLIP ${slug}.mp3`);
      ok(src.includes(`${sign}:`), `SIGN_LINES maybe missing ${sign} (grep)`);
    }
  }
  for (const el of ["fire","earth","water","air"]) {
    ok(fs.existsSync(path.join(voiceDir, `el-${el}.mp3`)), `MISSING el-${el}.mp3`);
    ok(fs.existsSync(path.join(voiceDir, `s6b-${el}.mp3`)), `MISSING s6b-${el}.mp3`);
  }

  console.log(`\nRan ${n} live chart requests + front-end checks.`);
  if (fails.length === 0) { console.log("ALL ACCURACY CHECKS PASSED ✅"); }
  else { console.log(`FAILURES (${fails.length}):`); fails.slice(0, 60).forEach((f) => console.log("  ✗ " + f)); process.exit(1); }
})().catch((e) => { console.error("TEST ERROR", e.message); process.exit(1); });
