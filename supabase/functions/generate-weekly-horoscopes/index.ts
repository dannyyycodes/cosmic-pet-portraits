import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { calculateAllPositions } from "./ephemeris.ts";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

// ── Transit helpers ─────────────────────────────────────────────

function getGlobalTransits(): { text: string; positions: ReturnType<typeof calculateAllPositions> } {
  const now = new Date();
  const positions = calculateAllPositions(now);

  const lines: string[] = [];
  const planets = [
    { key: "sun", label: "Sun" },
    { key: "moon", label: "Moon" },
    { key: "mercury", label: "Mercury" },
    { key: "venus", label: "Venus" },
    { key: "mars", label: "Mars" },
    { key: "jupiter", label: "Jupiter" },
    { key: "saturn", label: "Saturn" },
  ] as const;

  for (const p of planets) {
    const pos = positions[p.key];
    lines.push(`${p.label}: ${pos.sign} ${pos.degree}°`);
  }

  // Note aspects between transiting planets
  const aspects: string[] = [];
  const keys = planets.map((p) => p.key);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const diff = Math.abs(positions[keys[i]].longitude - positions[keys[j]].longitude);
      const d = diff > 180 ? 360 - diff : diff;
      if (d < 8) {
        aspects.push(`${planets[i].label} conjunct ${planets[j].label} in ${positions[keys[i]].sign}`);
      } else if (Math.abs(d - 180) < 8) {
        aspects.push(`${planets[i].label} opposite ${planets[j].label}`);
      } else if (Math.abs(d - 90) < 6) {
        aspects.push(`${planets[i].label} square ${planets[j].label}`);
      } else if (Math.abs(d - 120) < 6) {
        aspects.push(`${planets[i].label} trine ${planets[j].label}`);
      }
    }
  }

  if (aspects.length > 0) {
    lines.push(`\nKey Aspects: ${aspects.join(", ")}`);
  }

  return { text: lines.join("\n"), positions };
}

// FIX 3: Calculate natal chart aspects against current transits
function getNatalAspects(
  transitPositions: ReturnType<typeof calculateAllPositions>,
  natalPositions: { sun: number; moon: number; mercury?: number; venus?: number; mars?: number }
): string {
  const aspects: string[] = [];

  const transitPlanets = [
    { key: "sun", label: "Transiting Sun", lon: transitPositions.sun.longitude },
    { key: "moon", label: "Transiting Moon", lon: transitPositions.moon.longitude },
    { key: "mercury", label: "Transiting Mercury", lon: transitPositions.mercury.longitude },
    { key: "venus", label: "Transiting Venus", lon: transitPositions.venus.longitude },
    { key: "mars", label: "Transiting Mars", lon: transitPositions.mars.longitude },
    { key: "jupiter", label: "Transiting Jupiter", lon: transitPositions.jupiter.longitude },
    { key: "saturn", label: "Transiting Saturn", lon: transitPositions.saturn.longitude },
  ];

  const natalPoints: Array<{ label: string; lon: number }> = [
    { label: "natal Sun", lon: natalPositions.sun },
    { label: "natal Moon", lon: natalPositions.moon },
  ];
  if (natalPositions.mercury) natalPoints.push({ label: "natal Mercury", lon: natalPositions.mercury });
  if (natalPositions.venus) natalPoints.push({ label: "natal Venus", lon: natalPositions.venus });
  if (natalPositions.mars) natalPoints.push({ label: "natal Mars", lon: natalPositions.mars });

  for (const transit of transitPlanets) {
    for (const natal of natalPoints) {
      const diff = Math.abs(transit.lon - natal.lon);
      const d = diff > 180 ? 360 - diff : diff;

      if (d < 8) aspects.push(`${transit.label} conjunct ${natal.label} (powerful alignment — core energy activated)`);
      else if (Math.abs(d - 60) < 5) aspects.push(`${transit.label} sextile ${natal.label} (opportunity for growth)`);
      else if (Math.abs(d - 90) < 6) aspects.push(`${transit.label} square ${natal.label} (tension, but productive tension)`);
      else if (Math.abs(d - 120) < 6) aspects.push(`${transit.label} trine ${natal.label} (natural harmony and flow)`);
      else if (Math.abs(d - 180) < 8) aspects.push(`${transit.label} opposite ${natal.label} (awareness and balance needed)`);
    }
  }

  return aspects.length > 0
    ? `\nNatal Aspects (transits hitting ${natalPoints.length > 2 ? "the pet's" : "their"} chart):\n  - ${aspects.join("\n  - ")}`
    : "\nNo major natal aspects this week — a neutral, steady period.";
}

// ── AI prompt builders ──────────────────────────────────────────

function buildStandardPrompt(
  petName: string,
  species: string,
  breed: string,
  sunSign: string,
  moonSign: string,
  element: string,
  archetype: string,
  superpower: string,
  transits: string
): string {
  return `You are writing this week's cosmic reading for ${petName}, a ${breed || species}. The person reading this adores this animal completely. Your job is to make them feel — not just informed.

THEIR CHART
- Sun Sign: ${sunSign} | Moon Sign: ${moonSign}
- Dominant Element: ${element}
- Soul Archetype: ${archetype}
- Core Superpower: ${superpower}
- Species: ${species}${breed ? ` (${breed})` : ""}

THIS WEEK'S REAL PLANETARY DATA
${transits}

---

WHAT GOOD LOOKS LIKE — read these examples carefully before writing:

BAD hook: "This is a powerful week for your little one full of love and connection."
GOOD hook: "Venus is sitting on ${petName}'s natal Moon this week. You might notice them seeking you out more than usual — positioning themselves in your line of sight, asking quietly to be seen."

BAD daily: "Thursday is a great day for adventure and play!"
GOOD daily: "Thursday — the Moon moves into their sign and trines Jupiter. If you've been wanting to try something new together, this is the window. Don't overthink it."

BAD bond ritual: "Spend quality time with your pet this week!"
GOOD bond ritual: "Sit with them on the floor tonight — no phone, no TV. Just your hand on their side. With Saturn slowing through their 4th house right now, they are processing something quiet and deep. They don't need you to fix it. They just need you present."

BAD affirmation: "I am loved and cherished by the universe!"
GOOD affirmation: "I already know where you are in every room. I always have."

The difference: specificity, emotional truth, and restraint. No exclamation marks on serious moments. No filler. Every sentence earns its place.

---

Return ONLY valid JSON with exactly these fields:

{
  "theme": "One word — the emotional spine of this week for ${petName}. Not generic (not 'growth' or 'love') — specific to their chart and the transits.",
  "hookLine": "One sentence. Name a specific planet and what it's doing in or near ${petName}'s chart. Make it feel like a secret the owner didn't know but immediately recognises as true.",
  "overview": "Two paragraphs separated by a blank line. First paragraph: what's happening in the sky this week and what it means specifically for a ${sunSign} ${species} with ${moonSign} moon. Second paragraph: what the owner will likely notice — behaviour, mood, small moments. Be concrete. No vague cosmic language. Max 160 words total.",
  "cosmicMoment": {
    "day": "The single most significant day this week for ${petName}",
    "timeOfDay": "morning / afternoon / evening",
    "what": "One sentence: exactly what to watch for or do. Specific and actionable.",
    "why": "One sentence: the transit reason. Name the planet and sign."
  },
  "dailyGuide": {
    "monday": "One sentence + one emoji. Reference a transit or the week's theme. No filler.",
    "tuesday": "One sentence + one emoji.",
    "wednesday": "One sentence + one emoji.",
    "thursday": "One sentence + one emoji.",
    "friday": "One sentence + one emoji.",
    "saturday": "One sentence + one emoji.",
    "sunday": "One sentence + one emoji."
  },
  "bondRitual": {
    "title": "5-8 words. Specific, not generic.",
    "instruction": "2-3 sentences. What to do, when, and why this week's transits make it the right moment. Write it like advice from someone who genuinely knows this animal.",
    "bestDay": "Which day, and why briefly."
  },
  "affirmation": "One sentence from ${petName}'s perspective. Warm, specific to their archetype, not cheesy. No exclamation marks. Should make the owner go quiet for a second.",
  "nextWeekTeaser": "One sentence. Name a real upcoming transit and why it will matter for ${petName}. Specific enough to feel earned, vague enough to create anticipation. Do NOT give the full reading — just the hook.",
  "replyPrompt": "One casual question tied to something specific in this week's reading — a behaviour to watch for, a moment to notice. Sounds like it's from a person, not a system. Max 20 words."
}

Use the transits above to ground your reading in actual celestial movements. Reference specific planets and signs when explaining why certain days feel a certain way.

Species/breed context: Weave in ${species}-specific behaviours. A ${breed || species} has breed-typical quirks — reference these naturally (e.g. a Labrador's obsession with water, a cat's midnight zoomies, a rabbit's binky hops).

IMPORTANT WRITING GUIDELINES:
- Every sentence should feel like it was written specifically for ${petName} — not a generic horoscope with a name swapped in.
- Use ${species}-specific language: how a ${breed || species} actually moves, plays, sleeps, loves. Reference real breed traits (e.g. a Golden's soft mouth, a cat's slow blink, a rabbit's nose twitches).
- Make it warm, magical, deeply personal, grounded in the actual transits, and shareable — the kind of thing someone screenshots and sends to everyone they know.
- Write with genuine love. This person adores this animal. Honour that.`;
}

function buildMemorialPrompt(
  petName: string,
  species: string,
  breed: string,
  sunSign: string,
  moonSign: string,
  element: string,
  archetype: string,
  superpower: string,
  transits: string
): string {
  return `You are writing this week's "Signs From Beyond" reading for ${petName}, a ${breed || species} who has died. The person reading this misses them every single day. Your job is to make them feel held.

BANNED PHRASES (never use, never imply): "rainbow bridge", "crossed over", "watching over you", "in a better place", "paw prints on your heart", "furry angel", "at the gates of heaven". These phrases are hollow — they flatten real grief into greeting-card sentiment. Speak plainly about death and tenderly about what ${petName} meant.

THEIR CHART
- Sun Sign: ${sunSign} | Moon Sign: ${moonSign}
- Dominant Element: ${element}
- Soul Archetype: ${archetype}
- Core Superpower: ${superpower}
- Species: ${species}${breed ? ` (${breed})` : ""}

THIS WEEK'S REAL PLANETARY DATA
${transits}

---

WHAT GOOD LOOKS LIKE:

BAD: "Your little one is sending you love from beyond the stars this week!"
GOOD: "Venus is moving through the part of the sky where ${petName}'s Moon lives. If you find yourself thinking of them at an unexpected moment this week — while making coffee, or just before sleep — that's not random. That's the chart doing what it does."

BAD: "Watch for signs from ${petName} on Tuesday."
GOOD: "Tuesday, the Moon crosses the degree where ${petName}'s Sun sat. It's a quiet thing, astrologically. But grief moves in quiet things. Be gentle with yourself that day."

BAD affirmation: "I am always with you, forever and always!"
GOOD affirmation: "I still follow you from room to room. I just do it differently now."

The tone is: warm, grounded, honest. This person doesn't need to be told everything is fine. They need to feel accompanied. Never performatively cheerful. Never hollow. Write like someone who has also loved an animal and lost them.

---

Return ONLY valid JSON with exactly these fields:

{
  "theme": "One word — the emotional quality of this week's sky for ${petName}'s human. Specific to the transits, not generic.",
  "hookLine": "One sentence. Name a specific planet and what it's doing near ${petName}'s chart. Should feel like a moment of recognition — the kind that makes someone put their phone down.",
  "overview": "Two paragraphs separated by a blank line. First: what's in the sky this week and what it stirs for people grieving a ${sunSign} ${species}. Second: what ${petName}'s human might notice or feel — a moment, a memory, a sensation. Grounded and true. Max 160 words.",
  "cosmicMoment": {
    "day": "The single day this week when ${petName}'s presence might feel closest",
    "timeOfDay": "morning / afternoon / evening",
    "what": "One sentence: something specific to do or notice in that moment.",
    "why": "One sentence: the transit reason. Name the planet and what it's crossing."
  },
  "dailyGuide": {
    "monday": "One sentence + one emoji. A sign to watch for, or a feeling to allow.",
    "tuesday": "One sentence + one emoji.",
    "wednesday": "One sentence + one emoji.",
    "thursday": "One sentence + one emoji.",
    "friday": "One sentence + one emoji.",
    "saturday": "One sentence + one emoji.",
    "sunday": "One sentence + one emoji."
  },
  "bondRitual": {
    "title": "5-8 words. Something tender and specific.",
    "instruction": "2-3 sentences. A simple thing to do this week to feel close to ${petName}. Reference their breed/species — how they sounded, how they felt, what they loved. The transits should make this the right week for it.",
    "bestDay": "Which day, and why briefly."
  },
  "affirmation": "One sentence from ${petName}. Spoken from wherever they are now. Warm, specific to their archetype. Should make the person reading it go still for a moment.",
  "nextWeekTeaser": "One sentence. Name a real upcoming transit and why it will matter for ${petName}'s human. Gentle anticipation — not hype.",
  "replyPrompt": "One honest question. Did something happen this week that felt like ${petName}? Something small and true. Max 20 words."
}`;
}

// ── Email template ──────────────────────────────────────────────

// Gift trial → paid conversion email. Sent on weeks 3 + 4 of a gift
// recipient's free trial, after their weekly horoscope. Two stages:
//   - "halfway" (~14 days left): soft prompt
//   - "final" (~7 days left): last-chance, harder CTA
function renderGiftReminderEmail(opts: {
  petName: string;
  daysLeft: number;
  subscriptionId: string;
  stage: "halfway" | "final";
}): string {
  const { petName, daysLeft, subscriptionId, stage } = opts;
  const url = `https://www.littlesouls.app/keep-horoscopes/${subscriptionId}`;
  // Violet celestial palette (matches the shipped funnel + nurture emails)
  const mist = '#f3f0fb', card = '#ffffff', ink = '#241a3d', body2 = '#4a4363',
        muted = '#6b6488', violet = '#6a55c0', soft = '#b9a5f0', cta2 = '#5a3ec8', line = '#e9e2f7';
  const SIG = 'https://content.littlesouls.app/viral-pet-media/grace-signature.png';
  const headline = stage === "final"
    ? `${petName}'s last forecast arrives soon.`
    : `${daysLeft} weeks of ${petName}'s stars still to come.`;
  const bodyText = stage === "final"
    ? `Their gift month ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. The next forecast is the last one, unless you keep them arriving. &pound;4.99 a month. Cancel any time.`
    : `You are halfway through the free month that came with the gift. Want ${petName}'s weekly forecast to keep arriving after that? &pound;4.99 a month. Cancel any time.`;
  const cta = stage === "final" ? "Keep their stars arriving" : "Keep their stars arriving";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${mist};font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <!-- Brand logo -->
    <div style="text-align:center;margin-bottom:22px;">
      <a href="https://www.littlesouls.app" style="text-decoration:none;display:inline-block;">
        <img src="https://content.littlesouls.app/viral-pet-media/little-souls-logo-email.png" alt="Little Souls" width="200" style="display:block;width:200px;height:auto;margin:0 auto 12px;border:0;outline:none;" />
      </a>
      <p style="font-size:12px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;color:${violet};margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">Little Souls</p>
    </div>
    <div style="background:${card};border-radius:18px;border:1px solid ${line};padding:38px 28px;text-align:center;box-shadow:0 10px 34px rgba(90,62,200,0.08);">
      <p style="font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${violet};margin:0 0 14px 0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">Their Gift &middot; Weekly Stars</p>
      <h1 style="color:${ink};font-size:24px;font-weight:400;margin:0 0 14px 0;line-height:1.35;">${headline}</h1>
      <p style="color:${body2};font-size:15px;line-height:1.75;margin:0 0 26px 0;">${bodyText}</p>
      <div style="margin:8px 0 18px 0;">
        <a href="${url}" style="display:inline-block;background:${cta2};color:#ffffff;text-decoration:none;padding:16px 38px;border-radius:999px;font-weight:600;font-size:15px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:0.4px;box-shadow:0 6px 20px rgba(90,62,200,0.28);">${cta}</a>
      </div>
      <p style="color:${muted};font-size:12px;line-height:1.6;margin:0 0 26px;">No card on file yet. You would be subscribing on yours, not the gifter's. Cancel any time in two clicks.</p>
      <div style="width:44px;height:1px;background:linear-gradient(90deg,transparent,${soft},transparent);margin:0 auto 20px;"></div>
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-style:italic;color:${body2};margin:0 0 8px;">With love,</p>
      <img src="${SIG}" alt="Grace" width="112" style="display:inline-block;width:112px;height:auto;margin:0 0 3px;">
      <p style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${muted};margin:0;">Grace &middot; Little Souls</p>
    </div>
    <p style="text-align:center;color:${muted};font-size:11px;margin:20px 0 0 0;">Little Souls &middot; <a href="https://www.littlesouls.app" style="color:${muted};text-decoration:none;">littlesouls.app</a></p>
  </div>
</body></html>`;
}

// Bundled/reading-buyer trial-ending reminder. Sent ~2-3 days before the
// day-30 auto-charge on subscriptions created at purchase (stripe-webhook).
// UNLIKE the gift reminder this is OPT-OUT: the card is already on file and the
// sub auto-continues at £4.99/mo unless the buyer cancels — so this is a gentle
// heads-up (never a surprise charge) with a one-click cancel link, not an
// opt-in upsell. The cancel link hits /unsubscribe?email= which cancels the
// linked Stripe sub + flips the DB row.
function renderTrialEndingEmail(opts: {
  petName: string;
  daysLeft: number;
  email: string;
}): string {
  const { petName, daysLeft, email } = opts;
  const cancelUrl = `https://littlesouls.app/unsubscribe?email=${encodeURIComponent(email)}`;
  const mist = '#f3f0fb', card = '#ffffff', ink = '#241a3d', body2 = '#4a4363',
        muted = '#6b6488', violet = '#6a55c0', soft = '#b9a5f0', line = '#e9e2f7';
  const SIG = 'https://content.littlesouls.app/viral-pet-media/grace-signature.png';
  const daysLabel = `${daysLeft} day${daysLeft === 1 ? "" : "s"}`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${mist};font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:22px;">
      <a href="https://www.littlesouls.app" style="text-decoration:none;display:inline-block;">
        <img src="https://content.littlesouls.app/viral-pet-media/little-souls-logo-email.png" alt="Little Souls" width="200" style="display:block;width:200px;height:auto;margin:0 auto 12px;border:0;outline:none;" />
      </a>
      <p style="font-size:12px;font-weight:700;letter-spacing:3.5px;text-transform:uppercase;color:${violet};margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">Little Souls</p>
    </div>
    <div style="background:${card};border-radius:18px;border:1px solid ${line};padding:38px 28px;text-align:center;box-shadow:0 10px 34px rgba(90,62,200,0.08);">
      <p style="font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:${violet};margin:0 0 14px 0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">A Quick Heads-Up</p>
      <h1 style="color:${ink};font-size:24px;font-weight:400;margin:0 0 14px 0;line-height:1.35;">${petName}'s free month ends in ${daysLabel}.</h1>
      <p style="color:${body2};font-size:15px;line-height:1.75;margin:0 0 22px 0;">
        We hope ${petName}'s weekly cosmic forecasts have been a little bright spot in your week. Your free month is nearly up. After it ends, ${petName}'s horoscopes simply keep arriving for &pound;4.99 a month &mdash; nothing else to do.
      </p>
      <p style="color:${body2};font-size:15px;line-height:1.75;margin:0 0 26px 0;">
        Rather not continue? No hard feelings &mdash; you can stop it in one click and you won't be charged.
      </p>
      <div style="margin:8px 0 18px 0;">
        <a href="${cancelUrl}" style="display:inline-block;background:#ffffff;color:${violet};text-decoration:none;padding:15px 34px;border-radius:999px;font-weight:600;font-size:14px;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:0.4px;border:1.5px solid ${violet};">Cancel ${petName}'s horoscopes</a>
      </div>
      <p style="color:${muted};font-size:12px;line-height:1.6;margin:0 0 26px;">Keep them coming? You don't need to do a thing &mdash; ${petName}'s stars will just keep arriving every Sunday.</p>
      <div style="width:44px;height:1px;background:linear-gradient(90deg,transparent,${soft},transparent);margin:0 auto 20px;"></div>
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-style:italic;color:${body2};margin:0 0 8px;">With love,</p>
      <img src="${SIG}" alt="Grace" width="112" style="display:inline-block;width:112px;height:auto;margin:0 0 3px;">
      <p style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${muted};margin:0;">Grace &middot; Little Souls</p>
    </div>
    <p style="text-align:center;color:${muted};font-size:11px;margin:20px 0 0 0;">Little Souls &middot; <a href="https://www.littlesouls.app" style="color:${muted};text-decoration:none;">littlesouls.app</a></p>
  </div>
</body></html>`;
}

function generateHoroscopeEmail(
  petName: string,
  content: any,
  sunSign: string,
  element: string,
  occasionMode: string,
  reportId: string,
  weekDateRange: string,
  subscriberEmail: string,
  petPhotoUrl?: string
): string {
  const isMemorial = occasionMode === "memorial";

  // Violet celestial palette (matches the shipped funnel + nurture emails)
  const mist = "#f3f0fb";
  const card = "#ffffff";
  const panel = "#f6f3fd";
  const ink = "#241a3d";
  const body = "#4a4363";
  const muted = "#6b6488";
  const violet = "#6a55c0";
  const soft = "#b9a5f0";
  const cta = "#5a3ec8";
  const line = "#e9e2f7";
  const band = "#2a1f47";
  const SIG = "https://content.littlesouls.app/viral-pet-media/grace-signature.png";

  const headerTitle = isMemorial
    ? `Signs From ${petName} This Week`
    : `${petName}'s Weekly Forecast`;

  const label = (t: string) =>
    `<p style="color:${violet}; margin:0 0 6px; font-size:11px; text-transform:uppercase; letter-spacing:2px; font-weight:700; font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">${t}</p>`;

  // Daily guide: CURRENT schema is an object { monday..sunday: "sentence + emoji" }.
  // Falls back to the legacy array shape and the older energyForecast object.
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayRow = (dayLabel: string, sentence: string) => `
        <tr>
          <td style="padding:11px 0; color:${violet}; font-size:13px; font-weight:700; width:96px; vertical-align:top; font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">${dayLabel}</td>
          <td style="padding:11px 0; color:${body}; font-size:14px; line-height:1.6; border-bottom:1px solid ${line};">${sentence}</td>
        </tr>`;
  const dailyGuideRows = (() => {
    const dg = content.dailyGuide;
    if (Array.isArray(dg) && dg.length > 0) {
      return dg.map((d: any) => dayRow(d.day || "", `${d.energy || ""}${d.emoji ? " " + d.emoji : ""}`)).join("");
    }
    if (dg && typeof dg === "object") {
      return DAY_ORDER.filter((k) => dg[k]).map((k) => dayRow(cap(k), String(dg[k]))).join("");
    }
    return Object.entries(content.energyForecast || {})
      .map(([day, energy]) => dayRow(cap(day), String(energy)))
      .join("");
  })();

  // Cosmic moment: CURRENT schema { day, timeOfDay, what, why }.
  const cm = content.cosmicMoment;
  const cmTime = cm ? (cm.timeOfDay || cm.time || "") : "";
  const cosmicMomentHtml = cm ? `
    <div style="background:${panel}; padding:24px 26px; border-bottom:1px solid ${line};">
      ${label(isMemorial ? "The Moment To Watch For" : "The Moment That Matters")}
      <p style="color:${ink}; margin:0 0 8px; font-size:17px; font-weight:700; font-family:Georgia,'Times New Roman',serif;">
        ${cm.day || ""}${cmTime ? ` <span style="color:${violet}; font-size:14px; font-weight:normal;">&middot; ${cmTime}</span>` : ""}
      </p>
      ${cm.what ? `<p style="color:${body}; margin:6px 0 4px; font-size:14px; font-weight:600; line-height:1.6;">${cm.what}</p>` : ""}
      ${cm.why ? `<p style="color:${muted}; margin:0; font-size:13px; line-height:1.65; font-style:italic;">${cm.why}</p>` : ""}
    </div>` : "";

  // Bond ritual: CURRENT schema { title, instruction, bestDay }.
  const br = content.bondRitual;
  const brTitle = br ? (typeof br === "object" ? (br.title || "") : String(br)) : "";
  const brInstruction = br && typeof br === "object" ? (br.instruction || br.action || "") : "";
  const brBestDay = br && typeof br === "object" ? (br.bestDay || br.why || "") : "";
  const bondRitualHtml = br ? `
    <div style="background:${card}; padding:24px 26px; border-left:3px solid ${violet}; border-bottom:1px solid ${line};">
      ${label("This Week's Ritual")}
      <p style="color:${ink}; margin:0 0 6px; font-size:17px; font-weight:700; font-family:Georgia,'Times New Roman',serif;">${brTitle}</p>
      ${brInstruction ? `<p style="color:${body}; margin:0 0 8px; font-size:14px; line-height:1.7;">${brInstruction}</p>` : ""}
      ${brBestDay ? `<p style="color:${muted}; margin:0; font-size:12px; font-style:italic; line-height:1.6;">Best day: ${brBestDay}</p>` : ""}
    </div>` : "";

  // Overview: CURRENT schema is a two-paragraph string (blank-line separated).
  const overviewRaw = typeof content.overview === "object"
    ? [content.overview.para1, content.overview.para2].filter(Boolean).join("\n\n")
    : String(content.overview || "");
  const overviewHtml = overviewRaw.split(/\n\s*\n/).filter((s) => s.trim()).map((para) =>
    `<p style="color:${body}; line-height:1.85; font-size:15px; margin:0 0 14px;">${para.trim()}</p>`
  ).join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:${mist}; font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px; margin:0 auto; padding:24px 16px;">

    <!-- Brand logo -->
    <div style="text-align:center; margin-bottom:20px;">
      <a href="https://www.littlesouls.app" style="text-decoration:none; display:inline-block;">
        <img src="https://content.littlesouls.app/viral-pet-media/little-souls-logo-email.png" alt="Little Souls" width="200" style="display:block; width:200px; height:auto; margin:0 auto 12px; border:0; outline:none;" />
      </a>
      <p style="font-size:12px; font-weight:700; letter-spacing:3.5px; text-transform:uppercase; color:${violet}; margin:0; font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">Little Souls</p>
    </div>

   <div style="background:${card}; border:1px solid ${line}; border-radius:18px; overflow:hidden; box-shadow:0 10px 34px rgba(90,62,200,0.08);">

    <!-- 1. Header -->
    <div style="text-align:center; padding:38px 22px 30px; background:linear-gradient(160deg, ${panel} 0%, ${card} 100%); border-bottom:1px solid ${line};">
      ${petPhotoUrl ? `
      <div style="margin-bottom:16px;">
        <img src="${petPhotoUrl}" alt="${petName}" width="92" height="92"
          style="width:92px; height:92px; border-radius:50%; object-fit:cover; border:3px solid ${soft}; display:inline-block;" />
      </div>` : ""}
      <h1 style="color:${ink}; margin:12px 0 6px; font-size:26px; font-family:Georgia,'Times New Roman',serif; font-weight:normal;">${headerTitle}</h1>
      <p style="color:${violet}; margin:0; font-size:12px; text-transform:uppercase; letter-spacing:2px; font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">${sunSign} &middot; ${element} Energy</p>
      <p style="color:${muted}; margin:6px 0 0; font-size:11px; font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">${weekDateRange}</p>
    </div>

    <!-- 2. Hook Line -->
    <div style="background:${band}; padding:24px 30px; text-align:center;">
      <p style="color:#efe9ff; margin:0; font-size:17px; font-style:italic; line-height:1.6; font-family:Georgia,'Times New Roman',serif;">&ldquo;${content.hookLine || content.theme || ""}&rdquo;</p>
    </div>

    <!-- 3. Overview -->
    <div style="background:${card}; padding:30px 26px; border-bottom:1px solid ${line};">
      ${overviewHtml}
    </div>

    ${cosmicMomentHtml}

    <!-- 4. Daily Guide -->
    <div style="background:${panel}; padding:24px 26px; border-bottom:1px solid ${line};">
      ${label(isMemorial ? `Where To Feel ${petName} Each Day` : "Your Week, Day By Day")}
      <table style="width:100%; border-collapse:collapse;">
        ${dailyGuideRows}
      </table>
    </div>

    ${bondRitualHtml}

    <!-- 5. Affirmation -->
    <div style="background:${card}; padding:32px 26px; text-align:center; border-bottom:1px solid ${line};">
      ${label(isMemorial ? `From ${petName}` : `${petName} Says`)}
      <p style="color:${ink}; margin:0; font-size:19px; font-style:italic; line-height:1.6; font-family:Georgia,'Times New Roman',serif;">&ldquo;${content.affirmation || ""}&rdquo;</p>
    </div>

    <!-- 6. Next Week Teaser -->
    ${content.nextWeekTeaser ? `
    <div style="background:${panel}; padding:20px 26px; border-bottom:1px solid ${line}; text-align:center;">
      ${label("Coming Next Week")}
      <p style="color:${body}; margin:0; font-size:13px; font-style:italic; line-height:1.6;">${content.nextWeekTeaser}</p>
    </div>` : ""}

    <!-- 7. SoulSpeak CTA -->
    <div style="text-align:center; padding:32px 26px; background:${card}; border-bottom:1px solid ${line};">
      <p style="color:${body}; font-size:15px; margin:0 0 8px; font-style:italic; font-family:Georgia,'Times New Roman',serif;">
        ${isMemorial
          ? `&ldquo;${petName} has more to say than any forecast can hold.&rdquo;`
          : `&ldquo;Reading about ${petName} is one thing. Hearing ${petName} answer is another.&rdquo;`}
      </p>
      <p style="color:${muted}; font-size:13px; margin:0 0 18px; font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
        ${isMemorial
          ? `Their soul is still here, waiting. Say what you need to say.`
          : `Ask ${petName} anything. What they dream about. How they really feel about you.`}
      </p>
      <a href="https://littlesouls.app/soul-chat.html?id=${reportId}" style="display:inline-block; padding:15px 40px; background:${cta}; color:#ffffff; text-decoration:none; border-radius:999px; font-size:14px; font-weight:600; font-family:system-ui,-apple-system,'Segoe UI',sans-serif; letter-spacing:0.3px;">${isMemorial ? `Talk to ${petName}` : `Talk to ${petName}'s soul`}</a>
      <p style="color:${violet}; font-size:11px; margin:14px 0 0; font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">SoulSpeak by Little Souls &middot; guided by ${petName}'s birth chart</p>
    </div>

    <!-- 8. Reply Invite -->
    ${content.replyPrompt ? `
    <div style="background:${panel}; padding:20px 26px; border-bottom:1px solid ${line}; text-align:center;">
      <p style="color:${body}; margin:0; font-size:13px; line-height:1.65; font-style:italic;">${content.replyPrompt} Just hit reply. I read every one.</p>
    </div>` : ""}

    <!-- 9. Grace sign-off -->
    <div style="background:${card}; padding:30px 26px 8px; text-align:center;">
      <p style="font-family:Georgia,'Times New Roman',serif; font-size:15px; font-style:italic; color:${body}; margin:0 0 8px;">${isMemorial ? "Thinking of you both," : "Until next week,"}</p>
      <img src="${SIG}" alt="Grace" width="112" style="display:inline-block; width:112px; height:auto; margin:0 0 3px;">
      <p style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif; font-size:11px; letter-spacing:1.6px; text-transform:uppercase; color:${muted}; margin:0;">Grace &middot; Little Souls</p>
    </div>

   </div>

    <!-- Footer -->
    <div style="text-align:center; padding:22px 20px 6px;">
      <p style="color:${muted}; font-size:11px; margin:0; font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
        <a href="https://littlesouls.app/unsubscribe?email=${encodeURIComponent(subscriberEmail)}" style="color:${muted}; text-decoration:underline;">Unsubscribe from ${petName}'s weekly stars</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ── Main handler ────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Parse optional test body
  let testReportId: string | null = null;
  let testEmail: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    testReportId = body.testReportId || null;
    testEmail = body.testEmail || null;
  } catch (_) { /* no body is fine */ }

  try {
    console.log("[WEEKLY-HOROSCOPE] Starting weekly horoscope generation...");

    // Test mode: send directly to a specific report+email, skip subscription table
    let subscriptions: any[];
    if (testReportId && testEmail) {
      console.log(`[WEEKLY-HOROSCOPE] TEST MODE — report ${testReportId} → ${testEmail}`);
      const { data: report } = await supabase
        .from("pet_reports")
        .select("*")
        .eq("id", testReportId)
        .single();
      if (!report) throw new Error(`Report ${testReportId} not found`);
      subscriptions = [{
        id: `test-${Date.now()}`,
        pet_name: report.pet_name,
        email: testEmail,
        pet_report_id: testReportId,
        occasion_mode: report.occasion_mode || "discover",
        pet_reports: report,
        _testMode: true,
      }];
    } else {
      // Get all active subscriptions (include plan & occasion_mode).
      // Subscription-level filter: skip anything flagged memorial at the sub
      // row itself. Horoscopes are forward-looking ("what's ahead this week");
      // sending that to a grieving owner is a category-level care failure.
      const { data: subs, error: subError } = await supabase
        .from("horoscope_subscriptions")
        .select("*, pet_reports(*)")
        .eq("status", "active")
        .or("occasion_mode.is.null,occasion_mode.neq.memorial");
      if (subError) throw subError;

      // Gift trial cap: drop rows where trial_ends_at has passed AND no
      // Stripe subscription has been linked. Recipient stops receiving
      // horoscopes until they convert via keep-horoscopes. Paid subs
      // (trial_ends_at IS NULL) are unaffected.
      const nowMs = Date.now();
      const expiredGiftIds: string[] = [];
      const liveSubs = (subs || []).filter((s: { trial_ends_at?: string | null; stripe_subscription_id?: string | null; id?: string }) => {
        if (!s.trial_ends_at) return true; // paid sub, no cap
        if (s.stripe_subscription_id) return true; // already converted
        if (new Date(s.trial_ends_at).getTime() < nowMs) {
          if (s.id) expiredGiftIds.push(s.id);
          return false;
        }
        return true;
      });
      if (expiredGiftIds.length > 0) {
        console.log(`[WEEKLY-HOROSCOPE] Skipping ${expiredGiftIds.length} expired gift trials (no conversion):`, expiredGiftIds);
      }
      // Belt-and-braces: also drop any sub whose joined pet_reports row says
      // memorial — handles the case where the sub was seeded before
      // occasion_mode was stamped on it, or where the owner flipped the pet
      // to memorial after the sub was created and the sub row is stale.
      subscriptions = liveSubs.filter((s: { pet_reports?: { occasion_mode?: string } | null; occasion_mode?: string }) => {
        const subOcc = s.occasion_mode;
        const petOcc = s.pet_reports?.occasion_mode;
        const effective = subOcc || petOcc;
        if (effective === "memorial") {
          console.warn(
            "[WEEKLY-HOROSCOPE] skipping memorial sub — should not have passed query filter",
            { subOcc, petOcc, reportId: (s as { pet_report_id?: string }).pet_report_id },
          );
          return false;
        }
        return true;
      });
    }

    console.log(`[WEEKLY-HOROSCOPE] Found ${subscriptions.length} active subscriptions`);

    // Calculate global transits once (shared across all pets)
    const { text: globalTransits, positions: currentPositions } = getGlobalTransits();
    console.log("[WEEKLY-HOROSCOPE] Current transits:\n", globalTransits);

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // FIX 9: Calculate week date range
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekDateRange = `${weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${weekEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    const results = [];

    for (const sub of subscriptions || []) {
      try {
        console.log(`[WEEKLY-HOROSCOPE] Processing ${sub.pet_name}...`);

        // Check if horoscope already generated for this week (skip in test mode)
        if (!sub._testMode) {
          const { data: existing } = await supabase
            .from("weekly_horoscopes")
            .select("id")
            .eq("subscription_id", sub.id)
            .eq("week_start", weekStartStr)
            .single();

          if (existing) {
            console.log(`[WEEKLY-HOROSCOPE] Already generated for ${sub.pet_name} this week`);
            continue;
          }
        }

        const petReport = sub.pet_reports;
        if (!petReport?.report_content) {
          console.log(`[WEEKLY-HOROSCOPE] No report content for ${sub.pet_name}`);
          results.push({ pet: sub.pet_name, status: "skipped", reason: "no_report_content" });
          continue;
        }

        const reportContent = petReport.report_content;
        const sunSign = reportContent.chartPlacements?.sun?.sign || "Aries";
        const moonSign = reportContent.chartPlacements?.moon?.sign || "Cancer";
        const element = reportContent.dominantElement || "Fire";
        const archetype = reportContent.archetype?.name || "Cosmic Soul";
        const superpower = reportContent.superpower || "intuition";
        const species = petReport.species || "pet";
        const breed = petReport.breed || "";
        const occasionMode = sub.occasion_mode || petReport.occasion_mode || "discover";

        // FIX 3: Build per-pet transit text with natal aspects
        let petTransits = globalTransits;
        const petDob = new Date(petReport.birth_date);
        if (!isNaN(petDob.getTime())) {
          const natalPositions = calculateAllPositions(petDob);
          const natalAspectText = getNatalAspects(currentPositions, {
            sun: natalPositions.sun.longitude,
            moon: natalPositions.moon.longitude,
            mercury: natalPositions.mercury.longitude,
            venus: natalPositions.venus.longitude,
            mars: natalPositions.mars.longitude,
          });
          petTransits += natalAspectText;
        }

        // Build prompt based on occasion mode
        const userPrompt = occasionMode === "memorial"
          ? buildMemorialPrompt(sub.pet_name, species, breed, sunSign, moonSign, element, archetype, superpower, petTransits)
          : buildStandardPrompt(sub.pet_name, species, breed, sunSign, moonSign, element, archetype, superpower, petTransits);

        // Generate horoscope using Claude Sonnet via OpenRouter
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("OPENROUTER_API_KEY")}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://littlesouls.app",
            "X-Title": "Little Souls",
          },
          body: JSON.stringify({
            model: "anthropic/claude-sonnet-4-5",
            max_tokens: 3500,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: occasionMode === "memorial"
                  ? `You are a deeply intuitive, tender pet astrologer creating weekly "Signs From Beyond" readings for beloved pets who have died. Your tone is warm, grounded, and quietly honest — never saccharine, never clinical, never performatively cheerful. You write like someone who has also loved an animal and lost them.

ACCURACY RULES (never violate):
- Use ONLY the planetary transit data provided. Never fabricate positions, degrees, or aspects.
- Every transit reference must match the data given. Do not invent conjunctions, squares, or trines.
- Do not use generic sun sign horoscope language. Every sentence must feel specific to THIS pet.
- Reference the pet's breed/species naturally — their mannerisms, sounds, habits, the way they moved through the world.

BANNED PHRASES (never use, never imply): "rainbow bridge", "crossed over", "watching over you", "in a better place", "paw prints on your heart", "furry angel", "at the gates of heaven". These phrases flatten real grief into greeting-card sentiment. Speak plainly about death and tenderly about what the pet meant.

VOICE: Write like someone who genuinely believes this soul is still present. Use sensory language — "you might feel a warmth beside you," "a familiar weight on the bed," "a scent that arrives from nowhere." The reader is grieving — honour that with truth and beauty, not platitudes.

Return only valid JSON.`
                  : `You are a gifted, warm-hearted pet astrologer who creates deeply personalised weekly horoscopes that feel like love letters from the cosmos. You write with genuine wonder, tenderness, and a touch of playful magic — as though you can truly see this pet's soul shining through their birth chart.

ACCURACY RULES (never violate):
- Use ONLY the planetary transit data provided. Never fabricate positions, degrees, or aspects.
- Every transit reference must match the data given. Do not invent conjunctions, squares, or trines.
- Do not use generic sun sign horoscope language. Every sentence must feel specific to THIS pet.
- Reference the pet's breed/species naturally — their quirks, body language, the little things that make this breed uniquely themselves.

VOICE: Write like someone who is genuinely in awe of this animal's soul. Use sensory, emotionally resonant language. Make the owner feel seen — like you understand their bond. Every horoscope should make them smile, tear up a little, and screenshot it to send to someone they love. This isn't just astrology — it's a weekly reminder of why this little soul matters so much.

Return only valid JSON.`,
              },
              {
                role: "user",
                content: userPrompt,
              },
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`[WEEKLY-HOROSCOPE] AI error for ${sub.pet_name}:`, errorText);
          results.push({ pet: sub.pet_name, status: "error", reason: "ai_failed", detail: errorText.slice(0, 200) });
          continue;
        }

        const aiData = await aiResponse.json();
        let horoscopeContent;

        try {
          const rawContent = aiData?.choices?.[0]?.message?.content;
          if (typeof rawContent !== "string" || rawContent.trim() === "") {
            throw new Error(`empty AI content (finish_reason: ${aiData?.choices?.[0]?.finish_reason ?? "unknown"})`);
          }
          // Robust parse: strip markdown fences, then JSON.parse. On failure,
          // fall back to extracting the outermost { ... } block.
          let cleaned = rawContent.trim();
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          try {
            horoscopeContent = JSON.parse(cleaned);
          } catch (_) {
            const start = cleaned.indexOf("{");
            const end = cleaned.lastIndexOf("}");
            if (start === -1 || end === -1 || end <= start) {
              throw new Error(`no JSON object found in AI content (length ${cleaned.length}): ${cleaned.slice(0, 200)}`);
            }
            horoscopeContent = JSON.parse(cleaned.slice(start, end + 1));
          }
        } catch (parseError: any) {
          console.error(`[WEEKLY-HOROSCOPE] Parse error for ${sub.pet_name}:`, parseError);
          results.push({ pet: sub.pet_name, status: "error", reason: "parse_failed", detail: parseError?.message });
          continue;
        }

        // Save horoscope to database (skip in test mode)
        if (!sub._testMode) {
          const { error: insertError } = await supabase
            .from("weekly_horoscopes")
            .insert({
              subscription_id: sub.id,
              week_start: weekStartStr,
              content: horoscopeContent,
            });
          if (insertError) throw insertError;
        }

        // Send email
        const emailSubject = occasionMode === "memorial"
          ? `🕊️ Signs From ${sub.pet_name} This Week`
          : `✨ ${sub.pet_name}'s Weekly Cosmic Forecast`;

        const emailHtml = generateHoroscopeEmail(
          sub.pet_name,
          horoscopeContent,
          sunSign,
          element,
          occasionMode,
          sub.pet_report_id,
          weekDateRange,
          sub.email,
          petReport.pet_photo_url || undefined
        );

        // LAST-MILE SAFETY GATE: outright refusal for memorial. The two
        // earlier guards (subscription INSERT, batch SELECT) should already
        // have excluded any memorial sub by the time we reach this point,
        // but belt-and-braces — forward-looking weekly emails for a deceased
        // pet are unacceptable under any circumstance. If we ever reach
        // here with occasionMode === 'memorial', skip the send and log loud.
        if (occasionMode === "memorial") {
          console.error(
            `[WEEKLY-HOROSCOPE] REFUSING to send memorial horoscope for ${sub.pet_name} (${sub.pet_report_id}) — prior guards failed, investigate.`,
          );
          continue;
        }

        const { error: emailError } = await resend.emails.send({
          from: "Little Souls <hello@littlesouls.app>",
          to: [sub.email],
          subject: emailSubject,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`[WEEKLY-HOROSCOPE] Email error for ${sub.pet_name}:`, emailError);
        } else {
          // Mark as sent and update next_send_at
          if (!sub._testMode) {
            const nextSend = new Date();
            nextSend.setDate(nextSend.getDate() + 7);
            nextSend.setHours(9, 0, 0, 0);

            await supabase
              .from("weekly_horoscopes")
              .update({ sent_at: new Date().toISOString() })
              .eq("subscription_id", sub.id)
              .eq("week_start", weekStartStr);

            await supabase
              .from("horoscope_subscriptions")
              .update({ next_send_at: nextSend.toISOString() })
              .eq("id", sub.id);
          }
        }

        // Gift conversion reminders — fire after the horoscope is sent
        // so the recipient sees the value first, then the upsell. Two
        // touchpoints, both gated by once-only flags so the cron firing
        // multiple times in a window doesn't spam.
        if (!sub._testMode && sub.is_gift && sub.trial_ends_at && !sub.stripe_subscription_id) {
          try {
            const trialEndsMs = new Date(sub.trial_ends_at).getTime();
            const daysLeft = Math.ceil((trialEndsMs - Date.now()) / (24 * 60 * 60 * 1000));
            const isWeek3Window = daysLeft <= 14 && daysLeft > 7 && !sub.reminder_sent_at_week3;
            const isWeek4Window = daysLeft <= 7 && daysLeft > 0 && !sub.reminder_sent_at_week4;

            if (isWeek3Window || isWeek4Window) {
              const reminderHtml = renderGiftReminderEmail({
                petName: sub.pet_name,
                daysLeft,
                subscriptionId: sub.id,
                stage: isWeek4Window ? "final" : "halfway",
              });
              const subject = isWeek4Window
                ? `${sub.pet_name}'s last cosmic guidance arrives soon`
                : `${sub.pet_name}'s weekly horoscope — keep it coming?`;

              await resend.emails.send({
                from: "Little Souls <hello@littlesouls.app>",
                to: [sub.email],
                subject,
                html: reminderHtml,
              });

              const stamp: Record<string, string> = {};
              if (isWeek4Window) stamp.reminder_sent_at_week4 = new Date().toISOString();
              else stamp.reminder_sent_at_week3 = new Date().toISOString();
              await supabase
                .from("horoscope_subscriptions")
                .update(stamp)
                .eq("id", sub.id);

              console.log(`[WEEKLY-HOROSCOPE] Sent ${isWeek4Window ? "week4" : "week3"} gift reminder to ${sub.email}`);
            }
          } catch (reminderErr) {
            console.error(`[WEEKLY-HOROSCOPE] Gift reminder failed for ${sub.email}:`, reminderErr);
          }
        }

        // Bundled/reading-buyer trial-ending reminder — fire ~2-3 days before
        // the day-30 auto-charge so the £4.99/mo is NEVER a surprise (protects
        // against chargebacks and is the right thing for a trial-to-paid).
        // These subs are the mirror image of gift trials: NOT is_gift, and they
        // DO have a stripe_subscription_id (created at purchase with a 30-day
        // trial that auto-charges). We reuse reminder_sent_at_week4 as the
        // once-only "trial-ending reminder sent" flag — bundled subs never enter
        // the gift block above (is_gift=false), so the column is free here.
        if (!sub._testMode && !sub.is_gift && sub.stripe_subscription_id && sub.trial_ends_at && !sub.reminder_sent_at_week4) {
          try {
            const trialEndsMs = new Date(sub.trial_ends_at).getTime();
            const daysLeft = Math.ceil((trialEndsMs - Date.now()) / (24 * 60 * 60 * 1000));
            // Fire in the final stretch of the trial (1-3 days left).
            if (daysLeft <= 3 && daysLeft > 0) {
              const reminderHtml = renderTrialEndingEmail({
                petName: sub.pet_name,
                daysLeft,
                email: sub.email,
              });
              await resend.emails.send({
                from: "Little Souls <hello@littlesouls.app>",
                to: [sub.email],
                subject: `${sub.pet_name}'s free month ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
                html: reminderHtml,
              });
              await supabase
                .from("horoscope_subscriptions")
                .update({ reminder_sent_at_week4: new Date().toISOString() })
                .eq("id", sub.id);
              console.log(`[WEEKLY-HOROSCOPE] Sent trial-ending reminder to ${sub.email} (${daysLeft}d left)`);
            }
          } catch (trialReminderErr) {
            console.error(`[WEEKLY-HOROSCOPE] Trial-ending reminder failed for ${sub.email}:`, trialReminderErr);
          }
        }

        results.push({ pet: sub.pet_name, status: "success" });
        console.log(`[WEEKLY-HOROSCOPE] Completed ${sub.pet_name}`);

      } catch (petError: any) {
        console.error(`[WEEKLY-HOROSCOPE] Error for ${sub.pet_name}:`, petError);
        results.push({ pet: sub.pet_name, status: "error", error: petError?.message || "Unknown error" });
      }
    }

    return new Response(JSON.stringify({ success: true, results, subCount: subscriptions.length }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[WEEKLY-HOROSCOPE] Fatal error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
