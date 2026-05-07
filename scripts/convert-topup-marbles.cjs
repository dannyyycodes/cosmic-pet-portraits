const sharp = require("sharp");
const { mkdirSync } = require("node:fs");
const { join } = require("node:path");

// Single rose-gold marble base. Three tier outputs derived via sharp:
//   pack  -> rose-gold (raw, slight darken)
//   pass  -> platinum/silver (heavy desaturate + warm grey tint)
//   elite -> gold (hue rotated 30deg pink->amber + boosted saturation)
// Precious metals palette: warm-warm-warm, cohesive, escalating richness.
const SRC = "C:/Users/danie/Downloads/topup-preview/pack.png";
const OUT = join(process.cwd(), "public", "pawtraits");
mkdirSync(OUT, { recursive: true });

const TIERS = [
  {
    name: "pack",
    modulate: { saturation: 1.05, brightness: 0.97 },
    tint: null,
  },
  {
    name: "pass",
    modulate: { saturation: 0.16, brightness: 0.96 },
    tint: "#cac6bd",
  },
  {
    name: "elite",
    modulate: { saturation: 1.15, brightness: 0.94, hue: 30 },
    tint: null,
  },
];

(async () => {
  for (const tier of TIERS) {
    let bg = sharp(SRC)
      .resize(680, 1200, { fit: "cover", position: "center" })
      .blur(2.0)
      .modulate(tier.modulate);
    if (tier.tint) bg = bg.tint(tier.tint);
    await bg.webp({ quality: 80, effort: 5 }).toFile(join(OUT, "topup-" + tier.name + ".webp"));
    console.log("OK topup-" + tier.name + ".webp (background)");
  }

  for (const tier of TIERS) {
    let txt = sharp(SRC)
      .resize(700, 700, { fit: "cover", position: "center" })
      .modulate(tier.modulate);
    if (tier.tint) txt = txt.tint(tier.tint);
    await txt.webp({ quality: 88, effort: 5 }).toFile(join(OUT, "topup-" + tier.name + "-text.webp"));
    console.log("OK topup-" + tier.name + "-text.webp (typography)");
  }
})();
