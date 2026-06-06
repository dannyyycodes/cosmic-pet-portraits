const fs = require("fs");
const https = require("https");
const KEY = JSON.parse(fs.readFileSync("C:/Users/danie/vault/.secrets/keys.json", "utf8")).secrets.gemini.api_key;
const MODEL = process.env.PMODEL || "gemini-3-pro-image";
const OUT = process.env.POUT || "C:/Users/danie/cosmic-pet-portraits/public/readings/penguin.png";
const PROMPT = `A single adorable kawaii cartoon mascot: a chubby happy baby penguin wizard for a magical cosmic kids brand. Soft rounded shapes, thick clean dark outlines, smooth flat cel-shaded cartoon style like a polished mobile-game / Pixar-cute mascot. Deep navy-blue head and back, big creamy off-white round belly, soft rosy pink cheeks, huge sparkly friendly dark eyes with little white highlights, a tiny smiling orange beak, small chubby flippers (one raised in a friendly wave), little orange webbed feet. It wears a tall deep-violet wizard hat with small glowing gold stars and a cutely droopy curled tip. Cheerful, wholesome, cuddly, high quality. Centered, facing the viewer. The background MUST be fully transparent (PNG alpha, no background, no scene, no floor, no shadow on the ground) so only the penguin is visible.`;

const body = JSON.stringify({
  contents: [{ parts: [{ text: PROMPT }] }],
  generationConfig: { responseModalities: ["IMAGE"] },
});
const req = https.request(
  {
    hostname: "generativelanguage.googleapis.com",
    path: `/v1beta/models/${MODEL}:generateContent?key=${KEY}`,
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
  },
  (res) => {
    const chunks = [];
    res.on("data", (c) => chunks.push(c));
    res.on("end", () => {
      try {
        const j = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        const parts = j?.candidates?.[0]?.content?.parts || [];
        const img = parts.find((p) => p.inlineData?.data);
        if (!img) { console.error("no image. resp:", JSON.stringify(j).slice(0, 600)); process.exit(1); }
        fs.writeFileSync(OUT, Buffer.from(img.inlineData.data, "base64"));
        console.log("wrote", OUT, fs.statSync(OUT).size, "bytes, mime", img.inlineData.mimeType);
      } catch (e) { console.error("parse err", e.message, Buffer.concat(chunks).toString("utf8").slice(0, 400)); process.exit(1); }
    });
  }
);
req.on("error", (e) => { console.error(e.message); process.exit(1); });
req.write(body);
req.end();
