const sharp = require("sharp");
const { mkdirSync } = require("node:fs");
const { join } = require("node:path");

const SRC = "C:/Users/danie/Downloads/topup-preview";
const OUT = join(process.cwd(), "public", "pawtraits");
mkdirSync(OUT, { recursive: true });

const TIERS = ["pack", "pass", "elite"];

const TEXT_TINT = {
  pack:  null,
  pass:  null,
  elite: null,
};
const TEXT_SAT = { pack: 1.10, pass: 1.10, elite: 1.10 };
const TEXT_BRI = { pack: 0.96, pass: 0.98, elite: 0.96 };

(async () => {
  for (const tier of TIERS) {
    await sharp(join(SRC, tier + ".png"))
      .resize(680, 1200, { fit: "cover", position: "center" })
      .blur(2.4)
      .modulate({ brightness: 1.10, saturation: 0.82 })
      .webp({ quality: 80, effort: 5 })
      .toFile(join(OUT, "topup-" + tier + ".webp"));
    console.log("OK topup-" + tier + ".webp (background)");
  }

  for (const tier of TIERS) {
    let pipeline = sharp(join(SRC, tier + ".png"))
      .resize(700, 700, { fit: "cover", position: "center" });
    if (TEXT_TINT[tier]) pipeline = pipeline.tint(TEXT_TINT[tier]);
    await pipeline
      .modulate({ saturation: TEXT_SAT[tier], brightness: TEXT_BRI[tier] })
      .webp({ quality: 88, effort: 5 })
      .toFile(join(OUT, "topup-" + tier + "-text.webp"));
    console.log("OK topup-" + tier + "-text.webp (typography fill)");
  }
})();
