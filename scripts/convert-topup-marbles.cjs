const sharp = require("sharp");
const { mkdirSync } = require("node:fs");
const { join } = require("node:path");

const SRC = "C:/Users/danie/Downloads/topup-preview";
const OUT = join(process.cwd(), "public", "pawtraits");
mkdirSync(OUT, { recursive: true });

const TIERS = ["pack", "pass", "elite"];

(async () => {
  for (const tier of TIERS) {
    await sharp(join(SRC, tier + ".png"))
      .resize(680, 1200, { fit: "cover", position: "center" })
      .blur(2.4)
      .modulate({ brightness: 1.10, saturation: 0.82 })
      .webp({ quality: 80, effort: 5 })
      .toFile(join(OUT, "topup-" + tier + ".webp"));
    console.log("OK topup-" + tier + ".webp");
  }
})();
