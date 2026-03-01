import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { calculateAllPositions } from "./ephemeris.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  return `Create a deeply personalised weekly horoscope for a ${species}${breed ? ` (${breed})` : ""} named "${petName}".

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

Make it warm, magical, deeply personal, specific to the transits, and shareable!`;
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
  return `Create a tender weekly "Signs From ${petName}" reading for a beloved ${species}${breed ? ` (${breed})` : ""} who has crossed the rainbow bridge.

THEIR ASTROLOGICAL PROFILE
- Sun Sign: ${sunSign}
- Moon Sign: ${moonSign}
- Dominant Element: ${element}
- Soul Archetype: ${archetype}
- Superpower: ${superpower}

THIS WEEK'S PLANETARY TRANSITS (real astronomical data)
${transits}

TONE: Tender, comforting, hopeful — never sad. Frame everything as signs, visits, and continued connection. This is about a soul who is still present in starlight, dreams, and quiet moments.

Species/breed context: Reference ${breed || species}-specific behaviours as "signs" — e.g. "You might feel a phantom weight on the bed where they used to sleep" or "A ${breed || species} in the park might pause and look at you — that's ${petName} saying hello."

Return a JSON object with these fields:
{
  "theme": "One comforting word for the week",
  "overview": "3-4 tender sentences about how ${petName}'s spirit connects through this week's transits (max 120 words)",
  "luckyDay": "Day when ${petName}'s presence will feel strongest",
  "luckyActivity": "Something to do to feel close to ${petName} this week",
  "unluckyDay": "Day grief might visit — and that's okay",
  "moodPredictions": {
    "overall": "Emotional forecast for the human (gentle/reflective/warm/peaceful)",
    "peakEnergy": "Moment when ${petName}'s presence feels closest",
    "restNeeds": "When to be extra gentle with yourself"
  },
  "energyForecast": {
    "monday": "1-sentence about signs to watch for + emoji",
    "tuesday": "1-sentence + emoji",
    "wednesday": "1-sentence + emoji",
    "thursday": "1-sentence + emoji",
    "friday": "1-sentence + emoji",
    "saturday": "1-sentence + emoji",
    "sunday": "1-sentence + emoji"
  },
  "cosmicAdvice": "Comforting guidance for ${petName}'s human (max 60 words)",
  "bonusInsight": "A beautiful observation about how ${petName}'s cosmic energy lingers",
  "photoPrompt": "A gentle prompt — look through old photos, or photograph a sign from ${petName}",
  "compatibilityTip": "How ${petName}'s spirit will show up through other animals this week",
  "affirmation": "A comforting affirmation about eternal bonds",
  "textMessages": [
    {
      "time": "Tuesday morning",
      "messages": [
        "Sweet message from ${petName} from beyond ✨",
        "Another tender message",
        "Comforting sign-off"
      ]
    },
    {
      "time": "Saturday night",
      "messages": [
        "Late-night message from ${petName}",
        "Comforting words about always being near",
        "Final sweet message with emoji"
      ]
    }
  ],
  "googleSearches": [
    "Bittersweet search about missing ${petName}",
    "Another tender search",
    "Another search"
  ],
  "petParentSync": {
    "syncLevel": 5,
    "syncEmoji": "🔗🔗🔗🔗🔗",
    "description": "3 sentences about how ${petName}'s energy still guides their human this week. Eternal bond framing."
  },
  "memePersonality": {
    "vibe": "This week ${petName}'s spirit is giving: '[tender internet moment description]'",
    "energyLevel": "Presence level: ✨✨✨✨✨ (always here, always watching)"
  },
  "powerMove": {
    "title": "The most powerful sign ${petName} will send this week",
    "description": "Why this moment connects to the transits (2 sentences max)",
    "bestDay": "When to watch for it"
  }
}

Make it warm, comforting, and full of continued connection. Never sad — always hopeful.`;
}

// ── Email template ──────────────────────────────────────────────

function generateHoroscopeEmail(
  petName: string,
  content: any,
  sunSign: string,
  element: string,
  occasionMode: string,
  reportId: string,
  weekDateRange: string
): string {
  const isMemorial = occasionMode === "memorial";

  // Warm earthy palette
  const gold = "#c4a265";
  const ink = "#3d2f2a";
  const warm = "#5a4a42";
  const muted = "#9a8578";
  const cream = "#f5efe6";
  const cream2 = "#faf6ef";
  const cream3 = "#e8ddd0";

  const headerEmoji = isMemorial ? "🕊️" : "✨";
  const headerTitle = isMemorial
    ? `Signs From ${petName} This Week`
    : `${petName}'s Weekly Forecast`;
  const footerText = isMemorial
    ? `Sent with love from beyond the stars`
    : `Sent with cosmic love from Little Souls`;

  const textMessages = content.textMessages || [];
  const googleSearches = content.googleSearches || [];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:${cream}; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <div style="max-width:600px; margin:0 auto; padding:20px;">

    <!-- 1. Header -->
    <div style="text-align:center; padding:40px 20px 30px; background:linear-gradient(135deg, ${cream2} 0%, ${cream} 100%); border-radius:20px 20px 0 0; border-bottom:1px solid ${cream3};">
      <div style="font-size:42px; margin-bottom:8px;">${headerEmoji}</div>
      <h1 style="color:${ink}; margin:0; font-size:26px; font-family:Georgia,'Times New Roman',serif;">${headerTitle}</h1>
      <p style="color:${gold}; margin:8px 0 0; font-size:13px; text-transform:uppercase; letter-spacing:2px;">${sunSign} · ${element} Energy</p>
      <p style="color:${muted}; margin:6px 0 0; font-size:11px; opacity:0.6;">${weekDateRange}</p>
    </div>

    <!-- 2. Transit accuracy intro -->
    <div style="padding:14px 20px; background:${cream2}; border-bottom:1px solid ${cream3};">
      <table style="width:100%;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:30px; vertical-align:top; padding-top:2px; font-size:14px;">🔭</td>
          <td style="color:${muted}; font-size:11px; line-height:1.5;">
            <strong style="color:${ink};">Based on real planetary transits.</strong> This reading is calculated from ${petName}'s exact birth chart against this week's sky positions — not generic sun sign predictions.
          </td>
        </tr>
      </table>
    </div>

    <!-- 3. Theme Badge -->
    <div style="background:${cream2}; padding:20px; text-align:center; border-bottom:1px solid ${cream3};">
      <p style="color:${muted}; margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:2px;">This Week's Theme</p>
      <h2 style="color:${gold}; margin:0; font-size:30px; font-weight:bold; font-family:Georgia,'Times New Roman',serif;">${content.theme || "Cosmic"}</h2>
    </div>

    <!-- 4. This Week Is Giving (meme personality) -->
    ${content.memePersonality ? `
    <div style="background:white; padding:18px 22px; text-align:center; border-bottom:1px solid ${cream3};">
      <p style="color:${muted}; margin:0 0 2px; font-size:9px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold;">This Week ${petName} Is Giving</p>
      <p style="color:${ink}; margin:0; font-size:17px; font-family:Georgia,'Times New Roman',serif; font-style:italic;">${typeof content.memePersonality === 'object' ? content.memePersonality.vibe : content.memePersonality}</p>
      ${typeof content.memePersonality === 'object' && content.memePersonality.energyLevel ? `<p style="color:${muted}; margin:8px 0 0; font-size:11px;">${content.memePersonality.energyLevel}</p>` : ''}
    </div>
    ` : ""}

    <!-- 5. Overview -->
    <div style="background:white; padding:28px 24px; border-bottom:1px solid ${cream3};">
      <p style="color:${warm}; line-height:1.85; font-size:15px; margin:0;">${content.overview || ""}</p>
    </div>

    <!-- 6. Lucky Day / Go Easy Day / Lucky Activity (TABLE not flexbox) -->
    <table style="width:100%; border-collapse:collapse; background:white; border-bottom:1px solid ${cream3};">
      <tr>
        <td style="padding:20px; text-align:center; border-right:1px solid ${cream3}; width:33%;">
          <p style="color:${muted}; margin:0 0 4px; font-size:10px; text-transform:uppercase; letter-spacing:1px;">Lucky Day</p>
          <p style="color:${gold}; margin:0; font-size:16px; font-weight:bold;">🌟 ${content.luckyDay || ""}</p>
        </td>
        <td style="padding:20px; text-align:center; border-right:1px solid ${cream3}; width:33%;">
          <p style="color:${muted}; margin:0 0 4px; font-size:10px; text-transform:uppercase; letter-spacing:1px;">Go Easy Day</p>
          <p style="color:${warm}; margin:0; font-size:16px; font-weight:bold;">🌸 ${content.unluckyDay || ""}</p>
        </td>
        <td style="padding:20px; text-align:center; width:33%;">
          <p style="color:${muted}; margin:0 0 4px; font-size:10px; text-transform:uppercase; letter-spacing:1px;">Lucky Activity</p>
          <p style="color:${ink}; margin:0; font-size:14px; font-weight:bold;">🎯 ${content.luckyActivity || ""}</p>
        </td>
      </tr>
    </table>

    <!-- 7. Power Move -->
    ${content.powerMove ? `
    <div style="background:${cream2}; padding:18px 22px; border-left:3px solid ${gold}; border-bottom:1px solid ${cream3};">
      <p style="color:${gold}; margin:0 0 4px; font-size:10px; text-transform:uppercase; letter-spacing:1.5px; font-weight:bold;">⚡ This Week's Power Move</p>
      <p style="color:${ink}; margin:0; font-size:15px; font-weight:bold; line-height:1.4;">${typeof content.powerMove === 'object' ? `${content.powerMove.bestDay || ''}: ${content.powerMove.title}` : content.powerMove}</p>
      ${typeof content.powerMove === 'object' && content.powerMove.description ? `<p style="color:${muted}; margin:6px 0 0; font-size:12px; font-style:italic;">${content.powerMove.description}</p>` : ''}
    </div>
    ` : ""}

    <!-- 8. Mood Predictions -->
    ${content.moodPredictions ? `
    <div style="background:${cream2}; padding:20px 24px; border-bottom:1px solid ${cream3};">
      <h3 style="color:${ink}; margin:0 0 14px; font-size:15px; font-family:Georgia,'Times New Roman',serif;">🌙 Mood Forecast</h3>
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="padding:8px 12px; background:white; border-radius:8px; color:${muted}; font-size:13px;">Overall Vibe</td>
          <td style="padding:8px 12px; background:white; border-radius:8px; color:${gold}; font-size:13px; font-weight:bold; text-align:right;">${content.moodPredictions.overall || ""}</td>
        </tr>
        <tr><td style="padding:3px;"></td><td></td></tr>
        <tr>
          <td style="padding:8px 12px; background:white; border-radius:8px; color:${muted}; font-size:13px;">⚡ Peak Energy</td>
          <td style="padding:8px 12px; background:white; border-radius:8px; color:${ink}; font-size:13px; text-align:right;">${content.moodPredictions.peakEnergy || ""}</td>
        </tr>
        <tr><td style="padding:3px;"></td><td></td></tr>
        <tr>
          <td style="padding:8px 12px; background:white; border-radius:8px; color:${muted}; font-size:13px;">😴 Rest Needed</td>
          <td style="padding:8px 12px; background:white; border-radius:8px; color:${ink}; font-size:13px; text-align:right;">${content.moodPredictions.restNeeds || ""}</td>
        </tr>
      </table>
    </div>
    ` : ""}

    <!-- 9. Daily Energy (TABLE not flexbox) -->
    <div style="background:${cream2}; padding:24px; border-bottom:1px solid ${cream3};">
      <h3 style="color:${ink}; margin:0 0 14px; font-size:15px; font-family:Georgia,'Times New Roman',serif;">📅 ${isMemorial ? 'Where to Feel ' + petName + ' This Week' : 'Daily Energy Guide'}</h3>
      <table style="width:100%; border-collapse:collapse;">
        ${Object.entries(content.energyForecast || {}).map(([day, energy]) => `
          <tr>
            <td style="padding:10px 0; color:${gold}; font-size:13px; text-transform:capitalize; font-weight:bold; width:90px; vertical-align:top;">${day}</td>
            <td style="padding:10px 0; color:${warm}; font-size:13px; border-bottom:1px solid ${cream3};">${energy}</td>
          </tr>
        `).join("")}
      </table>
    </div>

    <!-- 10. Pet-Parent Cosmic Sync -->
    ${content.petParentSync ? `
    <div style="background:white; padding:22px 24px; border-bottom:1px solid ${cream3};">
      <h3 style="color:${ink}; margin:0 0 6px; font-size:15px; font-family:Georgia,'Times New Roman',serif;">💫 Pet-Parent Cosmic Sync</h3>
      <div style="padding:12px 14px; background:${cream2}; border-radius:10px;">
        <p style="color:${ink}; margin:0 0 6px; font-size:13px; font-weight:bold;">Sync Level: ${typeof content.petParentSync === 'object' ? content.petParentSync.syncEmoji || '🔗🔗🔗░░' : '🔗🔗🔗░░'} (${typeof content.petParentSync === 'object' && content.petParentSync.syncLevel >= 4 ? 'Strong' : 'Moderate'})</p>
        <p style="color:${warm}; margin:0; font-size:13px; line-height:1.6;">${typeof content.petParentSync === 'object' ? content.petParentSync.description : content.petParentSync}</p>
      </div>
    </div>
    ` : ""}

    <!-- 11. Bonus Insight -->
    ${content.bonusInsight ? `
    <div style="background:white; padding:20px 24px; border-left:3px solid ${gold}; border-bottom:1px solid ${cream3};">
      <h3 style="color:${gold}; margin:0 0 6px; font-size:13px;">💡 Cosmic Insight</h3>
      <p style="color:${warm}; margin:0; font-size:14px; line-height:1.65;">${content.bonusInsight}</p>
    </div>
    ` : ""}

    <!-- 12. Text Messages (iMessage style with timestamps) -->
    ${Array.isArray(textMessages) && textMessages.length > 0 ? `
    <div style="background:white; padding:24px; border-bottom:1px solid ${cream3};">
      <h3 style="color:${ink}; margin:0 0 14px; font-size:15px; font-family:Georgia,'Times New Roman',serif;">💬 ${isMemorial ? 'A Message From ' + petName : 'What ' + petName + ' Would Text You This Week'}</h3>
      ${textMessages.map((segment: any) => {
        // Handle new format [{time, messages}]
        if (segment.time && Array.isArray(segment.messages)) {
          return `
            <p style="text-align:center; color:${muted}; font-size:10px; margin:12px 0 8px;">${segment.time}</p>
            ${segment.messages.map((msg: string) => `
              <div style="margin-bottom:4px;">
                <div style="background:#e9e9eb; color:#1a1a1a; padding:10px 14px; border-radius:18px 18px 18px 6px; font-size:13px; line-height:1.4; max-width:80%; display:inline-block;">${msg}</div>
              </div>
            `).join('')}
          `;
        // Backward compat with old format [{sender, text}]
        } else if (segment.sender && segment.text) {
          const isPet = segment.sender === 'pet';
          return `<div style="margin-bottom:6px; text-align:${isPet ? 'left' : 'right'};">
            <div style="display:inline-block; max-width:80%; padding:10px 14px; border-radius:${isPet ? '18px 18px 18px 6px' : '18px 18px 6px 18px'}; font-size:13px; line-height:1.4; background:${isPet ? '#e9e9eb' : gold}; color:${isPet ? '#1a1a1a' : 'white'};">${segment.text}</div>
          </div>`;
        }
        return '';
      }).join('')}
    </div>
    ` : ""}

    <!-- 13. Google Searches -->
    ${googleSearches.length > 0 ? `
    <div style="background:${cream2}; padding:24px; border-bottom:1px solid ${cream3};">
      <h3 style="color:${ink}; margin:0 0 14px; font-size:15px; font-family:Georgia,'Times New Roman',serif;">🔍 ${petName}'s Search History</h3>
      ${googleSearches.map((q: string) => `
        <div style="background:white; border:1px solid ${cream3}; border-radius:20px; padding:10px 16px; margin-bottom:8px; font-size:13px; color:${warm};">
          ${q}
        </div>
      `).join("")}
    </div>
    ` : ""}

    <!-- 14. Social Forecast -->
    ${content.compatibilityTip ? `
    <div style="background:${cream2}; padding:20px 24px; border-bottom:1px solid ${cream3};">
      <h3 style="color:${ink}; margin:0 0 6px; font-size:13px;">💕 Social Forecast</h3>
      <p style="color:${warm}; margin:0; font-size:14px; line-height:1.65;">${content.compatibilityTip}</p>
    </div>
    ` : ""}

    <!-- 15. Cosmic Advice -->
    <div style="background:white; padding:24px; border-bottom:1px solid ${cream3};">
      <h3 style="color:${ink}; margin:0 0 8px; font-size:13px;">💫 Cosmic Advice for ${petName}'s Human</h3>
      <p style="color:${warm}; margin:0; font-size:15px; line-height:1.65;">${content.cosmicAdvice || ""}</p>
    </div>

    <!-- 16. Photo Challenge -->
    ${content.photoPrompt ? `
    <div style="background:${cream2}; padding:20px 24px; text-align:center; border-bottom:1px solid ${cream3};">
      <h3 style="color:${gold}; margin:0 0 6px; font-size:13px;">📸 Photo Challenge</h3>
      <p style="color:${warm}; margin:0; font-size:14px; font-style:italic;">"${content.photoPrompt}"</p>
    </div>
    ` : ""}

    <!-- 17. Affirmation -->
    <div style="background:white; padding:30px 24px; text-align:center; border-bottom:1px solid ${cream3};">
      <p style="color:${muted}; margin:0 0 8px; font-size:11px; text-transform:uppercase; letter-spacing:2px;">Weekly Affirmation</p>
      <p style="color:${ink}; margin:0; font-size:17px; font-style:italic; font-family:Georgia,'Times New Roman',serif;">"${content.affirmation || ""}"</p>
    </div>

    <!-- 18. SoulSpeak CTA -->
    <div style="text-align:center; padding:24px 20px; background:white; border-bottom:1px solid ${cream3}; border-radius:0 0 20px 20px;">
      <p style="color:${muted}; font-size:12px; margin:0 0 10px;">${isMemorial ? `${petName}'s soul is always here to talk` : `Want to hear what ${petName} thinks about this week?`}</p>
      <a href="https://littlesouls.co/soul-chat.html?id=${reportId}" style="display:inline-block; padding:12px 28px; background:linear-gradient(135deg, ${ink}, #5a3e2e); color:${gold}; text-decoration:none; border-radius:12px; font-size:14px; font-weight:bold;">${isMemorial ? `🕊️ Talk to ${petName}` : `⭐ Talk to ${petName}'s Soul`}</a>
      <p style="color:${gold}; font-size:11px; margin:8px 0 0;">SoulSpeak by Little Souls — 15 free credits</p>
    </div>

    <!-- Footer -->
    <div style="text-align:center; padding:28px 20px;">
      <p style="color:${muted}; font-size:12px; margin:0;">${footerText} ✨</p>
      <p style="color:${muted}; font-size:11px; margin:8px 0 0;">
        <a href="{{{unsubscribe_url}}}" style="color:${muted}; text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ── Main handler ────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    console.log("[WEEKLY-HOROSCOPE] Starting weekly horoscope generation...");

    // Get all active subscriptions (include plan & occasion_mode)
    const { data: subscriptions, error: subError } = await supabase
      .from("horoscope_subscriptions")
      .select("*, pet_reports(*)")
      .eq("status", "active");

    if (subError) throw subError;

    console.log(`[WEEKLY-HOROSCOPE] Found ${subscriptions?.length || 0} active subscriptions`);

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

        // Check if horoscope already generated for this week
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

        const petReport = sub.pet_reports;
        if (!petReport?.report_content) {
          console.log(`[WEEKLY-HOROSCOPE] No report content for ${sub.pet_name}`);
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

        // Generate horoscope using Claude Sonnet
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "anthropic/claude-sonnet-4-20250514",
            messages: [
              {
                role: "system",
                content: occasionMode === "memorial"
                  ? `You are a tender, comforting pet astrologer creating weekly "Signs From Beyond" readings for beloved pets who have crossed the rainbow bridge. Write in a warm, hopeful, never-sad tone. Ground readings in real planetary transits. Return only valid JSON.`
                  : `You are a mystical pet astrologer creating deeply personalised weekly horoscopes. Write in a warm, engaging, magical tone. Ground readings in real planetary transits. Each horoscope should feel unique and personal to this specific pet's cosmic blueprint. Return only valid JSON.`,
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
          continue;
        }

        const aiData = await aiResponse.json();
        let horoscopeContent;

        try {
          const content = aiData.choices[0].message.content;
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          horoscopeContent = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        } catch (parseError) {
          console.error(`[WEEKLY-HOROSCOPE] Parse error for ${sub.pet_name}:`, parseError);
          continue;
        }

        // Save horoscope to database
        const { error: insertError } = await supabase
          .from("weekly_horoscopes")
          .insert({
            subscription_id: sub.id,
            week_start: weekStartStr,
            content: horoscopeContent,
          });

        if (insertError) throw insertError;

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
          weekDateRange
        );

        const { error: emailError } = await resend.emails.send({
          from: "Little Souls <hello@littlesouls.co>",
          to: [sub.email],
          subject: emailSubject,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`[WEEKLY-HOROSCOPE] Email error for ${sub.pet_name}:`, emailError);
        } else {
          // Mark as sent and update next_send_at
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

        results.push({ pet: sub.pet_name, status: "success" });
        console.log(`[WEEKLY-HOROSCOPE] Completed ${sub.pet_name}`);

      } catch (petError: any) {
        console.error(`[WEEKLY-HOROSCOPE] Error for ${sub.pet_name}:`, petError);
        results.push({ pet: sub.pet_name, status: "error", error: petError?.message || "Unknown error" });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[WEEKLY-HOROSCOPE] Fatal error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
