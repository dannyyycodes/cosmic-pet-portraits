/**
 * compress-reviews.cjs — one-shot: takes the 64 ChatGPT pet portraits
 * out of Downloads, squashes them into 800px-wide WebP @ q80, drops them
 * into public/portraits/reviews/review-NN.webp, prints a size report.
 *
 * Run: node scripts/compress-reviews.cjs
 */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC_FILES = [
  "ChatGPT Image May 4, 2026, 09_19_48 PM.png",
  "ChatGPT Image May 4, 2026, 09_19_42 PM.png",
  "ChatGPT Image May 4, 2026, 09_17_48 PM.png",
  "ChatGPT Image May 4, 2026, 09_12_32 PM.png",
  "ChatGPT Image May 4, 2026, 09_12_12 PM.png",
  "ChatGPT Image May 4, 2026, 09_12_02 PM.png",
  "ChatGPT Image May 4, 2026, 09_09_30 PM.png",
  "ChatGPT Image May 4, 2026, 09_06_35 PM.png",
  "ChatGPT Image May 4, 2026, 09_03_21 PM.png",
  "ChatGPT Image May 4, 2026, 09_01_07 PM.png",
  "ChatGPT Image May 4, 2026, 08_56_57 PM (4).png",
  "ChatGPT Image May 4, 2026, 08_56_56 PM (2).png",
  "ChatGPT Image May 4, 2026, 08_56_57 PM (3).png",
  "ChatGPT Image May 4, 2026, 08_56_56 PM (1).png",
  "ChatGPT Image May 4, 2026, 08_54_15 PM.png",
  "ChatGPT Image May 4, 2026, 08_54_01 PM.png",
  "ChatGPT Image May 4, 2026, 08_49_05 PM.png",
  "ChatGPT Image May 4, 2026, 08_48_53 PM.png",
  "ChatGPT Image May 4, 2026, 08_48_41 PM.png",
  "ChatGPT Image May 4, 2026, 08_37_20 PM.png",
  "ChatGPT Image May 4, 2026, 08_37_23 PM.png",
  "ChatGPT Image May 4, 2026, 08_37_08 PM.png",
  "ChatGPT Image May 4, 2026, 08_36_59 PM.png",
  "ChatGPT Image May 4, 2026, 08_33_57 PM (4).png",
  "ChatGPT Image May 4, 2026, 08_33_56 PM (2).png",
  "ChatGPT Image May 4, 2026, 08_33_57 PM (3).png",
  "ChatGPT Image May 4, 2026, 08_33_56 PM (1).png",
  "ChatGPT Image May 4, 2026, 08_25_35 PM (4).png",
  "ChatGPT Image May 4, 2026, 08_25_34 PM (2).png",
  "ChatGPT Image May 4, 2026, 08_25_35 PM (3).png",
  "ChatGPT Image May 4, 2026, 08_25_34 PM (1).png",
  "ChatGPT Image May 4, 2026, 08_10_28 PM.png",
  "ChatGPT Image May 4, 2026, 08_10_22 PM.png",
  "ChatGPT Image May 4, 2026, 08_10_15 PM.png",
  "ChatGPT Image May 4, 2026, 08_08_12 PM (4).png",
  "ChatGPT Image May 4, 2026, 08_08_11 PM (1).png",
  "ChatGPT Image May 4, 2026, 08_08_11 PM (2).png",
  "ChatGPT Image May 4, 2026, 08_08_12 PM (3).png",
  "ChatGPT Image May 4, 2026, 08_04_54 PM (3).png",
  "ChatGPT Image May 4, 2026, 08_04_55 PM (4).png",
  "ChatGPT Image May 4, 2026, 08_04_53 PM (1).png",
  "ChatGPT Image May 4, 2026, 08_04_54 PM (2).png",
  "ChatGPT Image May 4, 2026, 08_02_28 PM (4).png",
  "ChatGPT Image May 4, 2026, 08_02_27 PM (3).png",
  "ChatGPT Image May 4, 2026, 08_02_26 PM (2).png",
  "ChatGPT Image May 4, 2026, 08_02_26 PM (1).png",
  "ChatGPT Image May 4, 2026, 07_40_26 PM (4).png",
  "ChatGPT Image May 4, 2026, 07_40_25 PM (2).png",
  "ChatGPT Image May 4, 2026, 07_40_26 PM (3).png",
  "ChatGPT Image May 4, 2026, 07_40_25 PM (1).png",
  "ChatGPT Image May 4, 2026, 07_38_03 PM (4).png",
  "ChatGPT Image May 4, 2026, 07_38_02 PM (2).png",
  "ChatGPT Image May 4, 2026, 07_38_03 PM (3).png",
  "ChatGPT Image May 4, 2026, 07_38_01 PM (1).png",
  "ChatGPT Image May 4, 2026, 07_19_44 PM (4).png",
  "ChatGPT Image May 4, 2026, 07_19_43 PM (3).png",
  "ChatGPT Image May 4, 2026, 07_19_42 PM (1).png",
  "ChatGPT Image May 4, 2026, 07_19_43 PM (2).png",
  "ChatGPT Image May 4, 2026, 07_17_09 PM (3).png",
  "ChatGPT Image May 4, 2026, 07_17_10 PM (4).png",
  "ChatGPT Image May 4, 2026, 07_17_08 PM (1).png",
  "ChatGPT Image May 4, 2026, 07_17_09 PM (2).png",
  "ChatGPT Image May 4, 2026, 07_14_34 PM.png",
  "ChatGPT Image May 4, 2026, 07_14_25 PM.png",
  "ChatGPT Image May 4, 2026, 07_14_11 PM.png",
];

const DOWNLOADS = "C:/Users/danie/Downloads";
const OUT_DIR = path.join(__dirname, "..", "public", "portraits", "reviews");
const MAX_DIM = 900;
const QUALITY = 80;

(async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let totalIn = 0;
  let totalOut = 0;
  let ok = 0;
  let missing = 0;

  for (let idx = 0; idx < SRC_FILES.length; idx++) {
    const filename = SRC_FILES[idx];
    const src = path.join(DOWNLOADS, filename);
    const num = String(idx + 1).padStart(2, "0");
    const dest = path.join(OUT_DIR, `review-${num}.webp`);

    if (!fs.existsSync(src)) {
      console.log(`[MISS] ${num}  ${filename}`);
      missing++;
      continue;
    }

    const inSize = fs.statSync(src).size;
    totalIn += inSize;

    try {
      await sharp(src)
        .rotate()
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
        .webp({ quality: QUALITY, effort: 5 })
        .toFile(dest);
      const outSize = fs.statSync(dest).size;
      totalOut += outSize;
      ok++;
      console.log(`[OK]   review-${num}.webp  ${(inSize / 1024).toFixed(0)}KB → ${(outSize / 1024).toFixed(0)}KB  (${Math.round((1 - outSize / inSize) * 100)}% smaller)`);
    } catch (err) {
      console.log(`[ERR]  review-${num}  ${err.message}`);
    }
  }

  console.log("");
  console.log("─".repeat(60));
  console.log(`Compressed: ${ok}/${SRC_FILES.length} files`);
  if (missing) console.log(`Missing:    ${missing}`);
  console.log(`In total:   ${(totalIn / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Out total:  ${(totalOut / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Saved:      ${Math.round((1 - totalOut / totalIn) * 100)}%`);
  console.log(`Wrote to:   ${OUT_DIR}`);
})();
