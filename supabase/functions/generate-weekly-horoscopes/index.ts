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

ASTROLOGICAL PROFILE
- Sun Sign: ${sunSign}
- Moon Sign: ${moonSign}
- Dominant Element: ${element}
- Soul Archetype: ${archetype}
- Superpower: ${superpower}

THIS WEEK'S PLANETARY TRANSITS (real astronomical data)
${transits}

Use the transits above to ground your reading in actual celestial movements. Reference specific planets and signs when explaining why certain days feel a certain way.

Species/breed context: Weave in ${species}-specific behaviours. A ${breed || species} has breed-typical quirks — reference these naturally (e.g. a Labrador's obsession with water, a cat's midnight zoomies, a rabbit's binky hops).

Return a JSON object with these fields:
{
  "theme": "One evocative word for the week",
  "overview": "3-4 sentences grounded in this week's transits, specific to this pet (max 120 words)",
  "luckyDay": "Best day of the week",
  "luckyActivity": "Specific activity perfect for this pet this week",
  "unluckyDay": "Day to be extra gentle with them",
  "moodPredictions": {
    "overall": "Mood tendency (playful/calm/adventurous/cuddly/independent)",
    "peakEnergy": "Day and time when energy peaks",
    "restNeeds": "When they'll need extra rest"
  },
  "energyForecast": {
    "monday": "1-sentence energy with emoji, reference relevant transit",
    "tuesday": "1-sentence energy with emoji",
    "wednesday": "1-sentence energy with emoji",
    "thursday": "1-sentence energy with emoji",
    "friday": "1-sentence energy with emoji",
    "saturday": "1-sentence energy with emoji",
    "sunday": "1-sentence energy with emoji"
  },
  "cosmicAdvice": "Specific personalised advice for the pet owner (max 60 words)",
  "bonusInsight": "A surprising observation about ${petName}'s cosmic nature this week",
  "photoPrompt": "Fun photo challenge to capture ${petName}'s cosmic energy",
  "compatibilityTip": "How ${petName} will interact with other pets/humans this week",
  "affirmation": "A magical pet-themed affirmation for the week",
  "textMessages": [
    {
      "time": "Tuesday 7:12 AM",
      "messages": [
        "first funny text from ${petName}",
        "second message continuing the thought",
        "third message with emoji"
      ]
    },
    {
      "time": "Thursday 11:47 PM",
      "messages": [
        "late-night text from ${petName}",
        "another message about how the week is going",
        "sweet/funny sign-off message with emoji"
      ]
    }
  ],
  "googleSearches": [
    "Funny Google search ${petName} would make about this week",
    "Another search",
    "Another search"
  ],
  "petParentSync": {
    "syncLevel": 4,
    "syncEmoji": "🔗🔗🔗🔗░",
    "description": "3 sentences about how the pet's chart interacts with general human energy this week. Be specific about what the owner will notice."
  },
  "memePersonality": {
    "vibe": "This week ${petName} is giving: '[funny internet personality description in quotes]'",
    "energyLevel": "Energy level emoji rating (e.g. 🔋🔋🔋░░) with a parenthetical like (running on treats and audacity)"
  },
  "powerMove": {
    "title": "One specific thing to do with ${petName} (5-15 words)",
    "description": "Why this day/activity aligns with their transits (2 sentences max)",
    "bestDay": "Which day to do it"
  }
}

IMPORTANT WRITING GUIDELINES:
- Every sentence should feel like it was written specifically for ${petName} — not a generic horoscope with a name swapped in.
- Use ${species}-specific language: how a ${breed || species} actually moves, plays, sleeps, loves. Reference real breed traits (e.g. a Golden's soft mouth, a cat's slow blink, a rabbit's nose twitches).
- The text messages should sound exactly like how ${petName} would text — funny, specific to their personality, with their quirks showing through.
- Google searches should be hilarious and hyper-specific to this pet's cosmic blueprint.
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

function generateHoroscopeEmail(
  petName: string,
  content: any,
  sunSign: string,
  element: string,
  occasionMode: string,
  reportId: string,
  weekDateRange: string,
  petPhotoUrl?: string
): string {
  const isMemorial = occasionMode === "memorial";

  // Warm earthy palette (matching landing page variant-c)
  const gold = "#c4a265";
  const ink = "#141210";
  const warm = "#5a4a42";
  const muted = "#958779";
  const cream = "#FFFDF5";
  const cream2 = "#faf4e8";
  const cream3 = "#e8ddd0";
  const rose = "#bf524a";

  const headerTitle = isMemorial
    ? `Signs From ${petName} This Week`
    : `${petName}'s Weekly Forecast`;
  const footerText = isMemorial
    ? `Sent with love from beyond the stars`
    : `Sent with cosmic love from Little Souls`;

  // Daily guide rows — supports both new array format and legacy energyForecast object
  const dailyGuideRows = (() => {
    if (Array.isArray(content.dailyGuide) && content.dailyGuide.length > 0) {
      return content.dailyGuide.map((d: any) => `
        <tr>
          <td style="padding:10px 0; color:${gold}; font-size:13px; font-weight:bold; width:90px; vertical-align:top;">${d.day || ""}</td>
          <td style="padding:10px 0; font-size:16px; width:28px; vertical-align:top;">${d.emoji || ""}</td>
          <td style="padding:10px 0; color:${warm}; font-size:13px; line-height:1.55; border-bottom:1px solid ${cream3};">${d.energy || ""}</td>
        </tr>
      `).join("");
    }
    // Legacy fallback
    return Object.entries(content.energyForecast || {}).map(([day, energy]) => `
      <tr>
        <td style="padding:10px 0; color:${gold}; font-size:13px; font-weight:bold; width:90px; vertical-align:top;">${day}</td>
        <td style="padding:10px 0; color:${warm}; font-size:13px; line-height:1.55; border-bottom:1px solid ${cream3};" colspan="2">${energy}</td>
      </tr>
    `).join("");
  })();

  // Cosmic moment block
  const cosmicMoment = content.cosmicMoment;
  const cosmicMomentHtml = cosmicMoment ? `
    <!-- Cosmic Moment -->
    <div style="background:${cream2}; padding:24px; border-bottom:1px solid ${cream3};">
      <p style="color:${muted}; margin:0 0 6px; font-size:10px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">⭐ The Moment That Matters</p>
      <p style="color:${ink}; margin:0 0 4px; font-size:16px; font-weight:bold; font-family:Georgia,'Times New Roman',serif;">
        ${cosmicMoment.day || ""}${cosmicMoment.time ? ` · ${cosmicMoment.time}` : ""}
        ${cosmicMoment.planet ? ` <span style="color:${gold}; font-size:13px; font-weight:normal;">(${cosmicMoment.planet})</span>` : ""}
      </p>
      ${cosmicMoment.what ? `<p style="color:${warm}; margin:8px 0 4px; font-size:14px; font-weight:600; line-height:1.5;">${cosmicMoment.what}</p>` : ""}
      ${cosmicMoment.why ? `<p style="color:${warm}; margin:0; font-size:13px; line-height:1.65; font-style:italic;">${cosmicMoment.why}</p>` : ""}
    </div>
  ` : "";

  // Bond ritual block
  const bondRitual = content.bondRitual;
  const bondRitualHtml = bondRitual ? `
    <!-- Bond Ritual -->
    <div style="background:white; padding:24px; border-left:3px solid ${gold}; border-bottom:1px solid ${cream3};">
      <p style="color:${muted}; margin:0 0 4px; font-size:10px; text-transform:uppercase; letter-spacing:2px; font-weight:bold;">🕯️ This Week's Ritual</p>
      <p style="color:${ink}; margin:0 0 6px; font-size:16px; font-weight:bold; font-family:Georgia,'Times New Roman',serif;">${typeof bondRitual === 'object' ? (bondRitual.title || "") : bondRitual}</p>
      ${typeof bondRitual === 'object' && bondRitual.action ? `<p style="color:${warm}; margin:0 0 6px; font-size:14px; line-height:1.65;">${bondRitual.action}</p>` : ""}
      ${typeof bondRitual === 'object' && bondRitual.why ? `<p style="color:${muted}; margin:0; font-size:12px; font-style:italic; line-height:1.6;">${bondRitual.why}</p>` : ""}
    </div>
  ` : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:${cream}; font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px; margin:0 auto; padding:20px;">

    <!-- 1. Header with pet photo -->
    <div style="text-align:center; padding:40px 20px 32px; background:linear-gradient(160deg, ${cream2} 0%, ${cream} 100%); border-radius:20px 20px 0 0; border-bottom:1px solid ${cream3};">
      ${petPhotoUrl ? `
      <div style="margin-bottom:18px;">
        <img src="${petPhotoUrl}" alt="${petName}" width="96" height="96"
          style="width:96px; height:96px; border-radius:50%; object-fit:cover; border:3px solid ${gold}; display:inline-block;" />
      </div>
      ` : ""}
      <h1 style="color:${ink}; margin:0; font-size:26px; font-family:Georgia,'Times New Roman',serif;">${headerTitle}</h1>
      <p style="color:${gold}; margin:8px 0 0; font-size:12px; text-transform:uppercase; letter-spacing:2px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${sunSign} · ${element} Energy</p>
      <p style="color:${muted}; margin:6px 0 0; font-size:11px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${weekDateRange}</p>
    </div>

    <!-- 2. Hook Line -->
    <div style="background:${ink}; padding:22px 28px; text-align:center;">
      <p style="color:#FFFDF5; margin:0; font-size:17px; font-style:italic; line-height:1.55;">"${content.hookLine || content.theme || ""}"</p>
    </div>

    <!-- 3. Overview -->
    <div style="background:white; padding:30px 26px; border-bottom:1px solid ${cream3};">
      <p style="color:${warm}; line-height:1.85; font-size:15px; margin:0 0 14px;">${typeof content.overview === 'object' ? (content.overview.para1 || "") : (content.overview || "")}</p>
      ${typeof content.overview === 'object' && content.overview.para2 ? `<p style="color:${warm}; line-height:1.85; font-size:15px; margin:0;">${content.overview.para2}</p>` : ""}
    </div>

    ${cosmicMomentHtml}

    <!-- 4. Daily Guide -->
    <div style="background:${cream2}; padding:24px; border-bottom:1px solid ${cream3};">
      <p style="color:${muted}; margin:0 0 14px; font-size:10px; text-transform:uppercase; letter-spacing:2px; font-weight:bold; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">📅 ${isMemorial ? "Where to Feel " + petName + " Each Day" : "Daily Guide"}</p>
      <table style="width:100%; border-collapse:collapse;">
        ${dailyGuideRows}
      </table>
    </div>

    ${bondRitualHtml}

    <!-- 5. Affirmation — from the pet -->
    <div style="background:white; padding:32px 26px; text-align:center; border-bottom:1px solid ${cream3};">
      <p style="color:${muted}; margin:0 0 10px; font-size:10px; text-transform:uppercase; letter-spacing:2px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${isMemorial ? "From " + petName + "'s Soul" : petName + " Says"}</p>
      <p style="color:${ink}; margin:0; font-size:18px; font-style:italic; line-height:1.6;">"${content.affirmation || ""}"</p>
    </div>

    <!-- 6. Next Week Teaser -->
    ${content.nextWeekTeaser ? `
    <div style="background:${cream2}; padding:18px 24px; border-bottom:1px solid ${cream3}; text-align:center;">
      <p style="color:${muted}; margin:0 0 4px; font-size:10px; text-transform:uppercase; letter-spacing:2px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Coming Next Week</p>
      <p style="color:${warm}; margin:0; font-size:13px; font-style:italic; line-height:1.55;">${content.nextWeekTeaser}</p>
    </div>
    ` : ""}

    <!-- 7. SoulSpeak CTA -->
    <div style="text-align:center; padding:32px 26px; background:white; border-bottom:1px solid ${cream3};">
      <p style="color:${warm}; font-size:15px; margin:0 0 8px; font-style:italic;">
        ${isMemorial
          ? `"${petName} has more to say than any horoscope can hold."`
          : `"Reading about ${petName} is one thing. Hearing ${petName} speak? That's something else."`}
      </p>
      <p style="color:${muted}; font-size:13px; margin:0 0 18px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        ${isMemorial
          ? `Their soul is still here, waiting. Say what you need to say.`
          : `Ask ${petName} anything \u2014 what they dream about, how they really feel about you.`}
      </p>
      <a href="https://littlesouls.app/soul-chat.html?id=${reportId}" style="display:inline-block; padding:14px 38px; background:${rose}; color:#ffffff; text-decoration:none; border-radius:50px; font-size:14px; font-weight:600; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; letter-spacing:0.3px;">${isMemorial ? `Talk to ${petName}` : `Talk to ${petName}'s Soul`}</a>
      <p style="color:${gold}; font-size:11px; margin:12px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">SoulSpeak by Little Souls \u2014 powered by ${petName}'s birth chart</p>
    </div>

    <!-- 8. Reply Invite -->
    ${content.replyPrompt ? `
    <div style="background:${cream2}; padding:20px 26px; border-bottom:1px solid ${cream3}; text-align:center;">
      <p style="color:${warm}; margin:0; font-size:13px; line-height:1.6; font-style:italic;">${content.replyPrompt} Just hit reply \u2014 we read every one.</p>
    </div>
    ` : ""}

    <!-- Footer -->
    <div style="text-align:center; padding:28px 20px;">
      <p style="color:${muted}; font-size:12px; margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${footerText} ✨</p>
      <p style="color:${muted}; font-size:11px; margin:8px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <a href="https://littlesouls.app/unsubscribe?id=${reportId}" style="color:${muted}; text-decoration:underline;">Unsubscribe</a>
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
      // Belt-and-braces: also drop any sub whose joined pet_reports row says
      // memorial — handles the case where the sub was seeded before
      // occasion_mode was stamped on it, or where the owner flipped the pet
      // to memorial after the sub was created and the sub row is stale.
      subscriptions = (subs || []).filter((s: { pet_reports?: { occasion_mode?: string } | null; occasion_mode?: string }) => {
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
            max_tokens: 2000,
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
          const content = aiData.choices[0].message.content;
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          horoscopeContent = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
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
