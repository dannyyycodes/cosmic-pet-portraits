// Generate 3 OG images (1200x630) using the Pawtraits brand mark
// (white paw on rose #bf524a from public/favicon.svg) + page-specific title.
// Run: node scripts/og/generate-og.cjs

const sharp = require("sharp");
const { mkdirSync } = require("node:fs");
const { join } = require("node:path");

const outDir = join(__dirname, "..", "..", "public", "og");
mkdirSync(outDir, { recursive: true });

const ROSE = "#bf524a";
const CREAM = "#FFFDF5";
const GOLD = "#c4a265";

// Matches public/favicon.svg (viewBox 0 0 32 32). Centered around (14.5, 14)
// inside the source viewBox; we offset to that origin so cx/cy in the call
// is the visual centre of the paw on the OG canvas.
function pawMark(cx, cy, scale) {
  // shift so favicon's (14.5, 14) lands at (cx, cy) after scale
  const tx = cx - 14.5 * scale;
  const ty = cy - 14 * scale;
  return [
    '<g transform="translate(' + tx + ' ' + ty + ') scale(' + scale + ')">',
    '<circle cx="10.5" cy="10" r="2.8" fill="' + CREAM + '" />',
    '<circle cx="17" cy="8.5" r="2.8" fill="' + CREAM + '" />',
    '<circle cx="22.5" cy="11.5" r="2.5" fill="' + CREAM + '" />',
    '<circle cx="6.5" cy="14" r="2.5" fill="' + CREAM + '" />',
    '<ellipse cx="14.5" cy="20" rx="6.5" ry="5.5" fill="' + CREAM + '" />',
    "</g>",
  ].join("");
}

function makeSvg(card) {
  const kicker = card.kicker;
  const title = card.title;
  const tagline = card.tagline;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">',
    "<defs>",
    '<radialGradient id="bloom" cx="50%" cy="42%" r="65%">',
    '<stop offset="0%" stop-color="#d56d5d" />',
    '<stop offset="55%" stop-color="' + ROSE + '" />',
    '<stop offset="100%" stop-color="#9a3f38" />',
    "</radialGradient>",
    '<linearGradient id="goldShine" x1="0%" y1="0%" x2="100%" y2="0%">',
    '<stop offset="0%" stop-color="#d8b574" />',
    '<stop offset="50%" stop-color="' + GOLD + '" />',
    '<stop offset="100%" stop-color="#a98549" />',
    "</linearGradient>",
    "</defs>",
    '<rect width="1200" height="630" fill="url(#bloom)" />',
    '<rect x="36" y="36" width="1128" height="558" rx="24" fill="none" stroke="' +
      CREAM +
      '" stroke-opacity="0.18" stroke-width="2" />',
    pawMark(600, 215, 7),
    '<text x="600" y="360" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="22" letter-spacing="6" font-weight="600" fill="url(#goldShine)">' +
      kicker +
      "</text>",
    '<text x="600" y="430" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="58" font-weight="600" fill="' +
      CREAM +
      '">' +
      title +
      "</text>",
    '<text x="600" y="490" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="26" font-style="italic" fill="' +
      CREAM +
      '" fill-opacity="0.85">' +
      tagline +
      "</text>",
    '<text x="600" y="565" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="18" letter-spacing="3" font-weight="500" fill="' +
      CREAM +
      '" fill-opacity="0.7">LITTLESOULS.APP</text>',
    "</svg>",
  ].join("");
}

const cards = [
  {
    file: "pawtraits-default.jpg",
    kicker: "PAWTRAITS",
    title: "Custom AI Pet Portraits",
    tagline: "Watercolor, Renaissance, Royal &amp; 20+ styles",
  },
  {
    file: "pawtraits-gallery.jpg",
    kicker: "GALLERY",
    title: "Browse 100+ Pet Portraits",
    tagline: "Every breed, every style, ready to inspire",
  },
  {
    file: "pawtraits-studio.jpg",
    kicker: "STUDIO",
    title: "Create Your Pet's Pawtrait",
    tagline: "Upload a photo, pick a style, watch the magic",
  },
];

(async function main() {
  for (const c of cards) {
    const svg = makeSvg(c);
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(join(outDir, c.file));
    console.log("wrote " + c.file);
  }
})();
