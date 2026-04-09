/**
 * fetch-live-activity-pets.cjs
 *
 * Downloads fresh pet photos for the LiveActivityToast from:
 *   - dog.ceo (public, no key) - 15 different breeds
 *   - thecatapi.com (public, no key) - 5 cats
 *
 * Saves to public/live-activity/pet-01..20.jpg so the live toast
 * pulls from a DIFFERENT image pool than the review grid (which
 * uses /public/breeds/{breed}-1.jpg from the curated set).
 *
 * Run: node scripts/fetch-live-activity-pets.cjs
 *
 * Re-run to refresh the images whenever the pool gets stale.
 * The script is idempotent - it overwrites existing files.
 *
 * Note: written as .cjs (CommonJS) because the repo-level JS
 * validator uses new Function() which rejects ESM import syntax.
 */

const { writeFile, mkdir } = require("node:fs/promises");
const path = require("node:path");

const OUT_DIR = path.resolve(__dirname, "..", "public", "live-activity");

// Dog breeds chosen to feel varied, warm, and representative.
// Zero overlap with the 8 breeds used in CompactReviews.tsx
// (corgi, german-shepherd, golden-retriever, border-collie,
//  cavalier-kcs, holland-lop, bulldog, guinea-pig).
const DOG_BREEDS = [
  "labrador",
  "husky",
  "poodle/miniature",
  "pug",
  "dachshund",
  "beagle",
  "malamute",
  "samoyed",
  "shiba",
  "boxer",
  "rottweiler",
  "pomeranian",
  "pointer/german",
  "vizsla",
  "maltese",
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + " returned " + res.status);
  return res.json();
}

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("image " + url + " returned " + res.status);
  return Buffer.from(await res.arrayBuffer());
}

function pad(n) {
  return String(n).padStart(2, "0");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const manifest = [];
  let index = 1;

  console.log("Fetching " + DOG_BREEDS.length + " dog images from dog.ceo...");
  for (const breed of DOG_BREEDS) {
    try {
      const json = await fetchJson(
        "https://dog.ceo/api/breed/" + breed + "/images/random"
      );
      const buf = await fetchBuffer(json.message);
      const file = "pet-" + pad(index) + ".jpg";
      await writeFile(path.join(OUT_DIR, file), buf);
      manifest.push({
        file: file,
        species: "dog",
        breed: breed.replace("/", " "),
        source: "dog.ceo",
      });
      console.log("  [OK] " + file + " (" + breed + ")");
      index++;
    } catch (e) {
      console.warn("  [FAIL] " + breed + ": " + e.message);
    }
  }

  console.log("Fetching 5 cat images from thecatapi.com...");
  try {
    const cats = await fetchJson(
      "https://api.thecatapi.com/v1/images/search?limit=5"
    );
    for (const cat of cats) {
      try {
        const buf = await fetchBuffer(cat.url);
        const file = "pet-" + pad(index) + ".jpg";
        await writeFile(path.join(OUT_DIR, file), buf);
        manifest.push({
          file: file,
          species: "cat",
          breed: "cat",
          source: "thecatapi.com",
        });
        console.log("  [OK] " + file + " (cat)");
        index++;
      } catch (e) {
        console.warn("  [FAIL] cat: " + e.message);
      }
    }
  } catch (e) {
    console.warn("  [FAIL] thecatapi: " + e.message);
  }

  const manifestPath = path.join(OUT_DIR, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log("");
  console.log("Wrote " + manifest.length + " images + manifest.json");
  console.log("  Location: " + OUT_DIR);
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
