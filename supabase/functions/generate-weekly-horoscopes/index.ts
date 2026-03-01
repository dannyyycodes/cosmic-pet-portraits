import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { calculateAllPositions, longitudeToZodiac } from "./ephemeris.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

// ── Transit helpers ─────────────────────────────────────────────
function getCurrentTransits(): string {
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

  // Note any notable aspects (conjunctions within 8°)
  const aspects: string[] = [];
  const keys = planets.map((p) => p.key);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const diff = Math.abs(
        positions[keys[i]].longitude - positions[keys[j]].longitude
      );
      const normalizedDiff = diff > 180 ? 360 - diff : diff;
      if (normalizedDiff < 8) {
        aspects.push(
          `${planets[i].label} conjunct ${planets[j].label} in ${positions[keys[i]].sign}`
        );
      } else if (Math.abs(normalizedDiff - 180) < 8) {
        aspects.push(
          `${planets[i].label} opposite ${planets[j].label}`
        );
      } else if (Math.abs(normalizedDiff - 90) < 6) {
        aspects.push(
          `${planets[i].label} square ${planets[j].label}`
        );
      } else if (Math.abs(normalizedDiff - 120) < 6) {
        aspects.push(
          `${planets[i].label} trine ${planets[j].label}`
        );
      }
    }
  }

  if (aspects.length > 0) {
    lines.push(`\nKey Aspects: ${aspects.join(", ")}`);
  }

  return lines.join("\n");
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
    { "sender": "pet", "text": "Short funny text from ${petName} about the week" },
    { "sender": "human", "text": "Owner reply" },
    { "sender": "pet", "text": "Pet comeback" },
    { "sender": "human", "text": "Owner reply" },
    { "sender": "pet", "text": "Final ${petName} text" }
  ],
  "googleSearches": [
    "Funny Google search ${petName} would make about this week",
    "Another search",
    "Another search"
  ],
  "petParentSync": "One-liner about how the owner will mirror ${petName}'s energy this week",
  "memePersonality": "Which meme ${petName} IS this week (format: 'That meme where...')",
  "powerMove": "The most dramatic thing ${petName} will do this week"
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
    { "sender": "pet", "text": "Sweet message from ${petName} from beyond ✨" },
    { "sender": "human", "text": "Tender reply" },
    { "sender": "pet", "text": "${petName}'s comforting response" },
    { "sender": "human", "text": "Reply" },
    { "sender": "pet", "text": "Final message from ${petName}" }
  ],
  "googleSearches": [
    "Bittersweet search about missing ${petName}",
    "Another tender search",
    "Another search"
  ],
  "petParentSync": "How ${petName}'s energy still guides their human this week",
  "memePersonality": "Tender version — 'That moment when...' about feeling their presence",
  "powerMove": "The most powerful sign ${petName} will send this week"
}

Make it warm, comforting, and full of continued connection. Never sad — always hopeful.`;
}

// ── Email template ──────────────────────────────────────────────
function generateHoroscopeEmail(
  petName: string,
  content: any,
  sunSign: string,
  element: string,
  occasionMode: string
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
    : `Sent with cosmic love from My Pet's Soul`;

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

    <!-- Header -->
    <div style="text-align:center; padding:40px 20px 30px; background:linear-gradient(135deg, ${cream2} 0%, ${cream} 100%); border-radius:20px 20px 0 0; border-bottom:1px solid ${cream3};">
      <div style="font-size:42px; margin-bottom:8px;">${headerEmoji}</div>
      <h1 style="color:${ink}; margin:0; font-size:26px; font-family:Georgia,'Times New Roman',serif;">${headerTitle}</h1>
      <p style="color:${gold}; margin:8px 0 0; font-size:13px; text-transform:uppercase; letter-spacing:2px;">${sunSign} · ${element} Energy</p>
    </div>

    <!-- Theme Badge -->
    <div style="background:${cream2}; padding:20px; text-align:center; border-bottom:1px solid ${cream3};">
      <p style="color:${muted}; margin:0 0 4px; font-size:11px; text-transform:uppercase; letter-spacing:2px;">This Week's Theme</p>
      <h2 style="color:${gold}; margin:0; font-size:30px; font-weight:bold; font-family:Georgia,'Times New Roman',serif;">${content.theme || "Cosmic"}</h2>
    </div>

    <!-- Overview -->
    <div style="background:white; padding:28px 24px; border-bottom:1px solid ${cream3};">
      <p style="color:${warm}; line-height:1.85; font-size:15px; margin:0;">${content.overview || ""}</p>
    </div>

    <!-- Mood Predictions -->
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

    <!-- Lucky & Unlucky Days -->
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

    <!-- Daily Energy -->
    <div style="background:${cream2}; padding:24px; border-bottom:1px solid ${cream3};">
      <h3 style="color:${ink}; margin:0 0 14px; font-size:15px; font-family:Georgia,'Times New Roman',serif;">📅 Daily Energy Guide</h3>
      ${Object.entries(content.energyForecast || {}).map(([day, energy]) => `
        <div style="display:flex; padding:10px 0; border-bottom:1px solid ${cream3};">
          <span style="color:${gold}; width:90px; font-size:13px; text-transform:capitalize; font-weight:bold;">${day}</span>
          <span style="color:${warm}; font-size:13px; flex:1;">${energy}</span>
        </div>
      `).join("")}
    </div>

    <!-- Text Messages -->
    ${textMessages.length > 0 ? `
    <div style="background:white; padding:24px; border-bottom:1px solid ${cream3};">
      <h3 style="color:${ink}; margin:0 0 14px; font-size:15px; font-family:Georgia,'Times New Roman',serif;">💬 Texts From ${petName}</h3>
      ${textMessages.map((msg: any) => {
        const isPet = msg.sender === "pet";
        return `<div style="margin-bottom:8px; text-align:${isPet ? "left" : "right"};">
          <span style="display:inline-block; max-width:80%; padding:10px 14px; border-radius:18px; font-size:13px; line-height:1.5; background:${isPet ? cream2 : gold}; color:${isPet ? warm : "white"};">
            ${msg.text}
          </span>
        </div>`;
      }).join("")}
    </div>
    ` : ""}

    <!-- Google Searches -->
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

    <!-- Pet-Parent Sync -->
    ${content.petParentSync ? `
    <div style="background:white; padding:20px 24px; border-bottom:1px solid ${cream3}; text-align:center;">
      <p style="color:${muted}; margin:0 0 4px; font-size:10px; text-transform:uppercase; letter-spacing:2px;">Pet-Parent Sync</p>
      <p style="color:${ink}; margin:0; font-size:14px; font-style:italic; line-height:1.6;">"${content.petParentSync}"</p>
    </div>
    ` : ""}

    <!-- Meme + Power Move row -->
    ${content.memePersonality || content.powerMove ? `
    <table style="width:100%; border-collapse:collapse; background:${cream2}; border-bottom:1px solid ${cream3};">
      <tr>
        ${content.memePersonality ? `
        <td style="padding:20px; vertical-align:top; ${content.powerMove ? `border-right:1px solid ${cream3};` : ""} width:50%;">
          <p style="color:${muted}; margin:0 0 4px; font-size:10px; text-transform:uppercase; letter-spacing:1px;">😂 Meme Energy</p>
          <p style="color:${warm}; margin:0; font-size:13px; line-height:1.5;">${content.memePersonality}</p>
        </td>
        ` : ""}
        ${content.powerMove ? `
        <td style="padding:20px; vertical-align:top; width:50%;">
          <p style="color:${muted}; margin:0 0 4px; font-size:10px; text-transform:uppercase; letter-spacing:1px;">⚡ Power Move</p>
          <p style="color:${warm}; margin:0; font-size:13px; line-height:1.5;">${content.powerMove}</p>
        </td>
        ` : ""}
      </tr>
    </table>
    ` : ""}

    <!-- Bonus Insight -->
    ${content.bonusInsight ? `
    <div style="background:white; padding:20px 24px; border-left:3px solid ${gold}; border-bottom:1px solid ${cream3};">
      <h3 style="color:${gold}; margin:0 0 6px; font-size:13px;">💡 Cosmic Insight</h3>
      <p style="color:${warm}; margin:0; font-size:14px; line-height:1.65;">${content.bonusInsight}</p>
    </div>
    ` : ""}

    <!-- Compatibility Tip -->
    ${content.compatibilityTip ? `
    <div style="background:${cream2}; padding:20px 24px; border-bottom:1px solid ${cream3};">
      <h3 style="color:${ink}; margin:0 0 6px; font-size:13px;">💕 Social Forecast</h3>
      <p style="color:${warm}; margin:0; font-size:14px; line-height:1.65;">${content.compatibilityTip}</p>
    </div>
    ` : ""}

    <!-- Cosmic Advice -->
    <div style="background:white; padding:24px; border-bottom:1px solid ${cream3};">
      <h3 style="color:${ink}; margin:0 0 8px; font-size:13px;">💫 Cosmic Advice for ${petName}'s Human</h3>
      <p style="color:${warm}; margin:0; font-size:15px; line-height:1.65;">${content.cosmicAdvice || ""}</p>
    </div>

    <!-- Photo Challenge -->
    ${content.photoPrompt ? `
    <div style="background:${cream2}; padding:20px 24px; text-align:center; border-bottom:1px solid ${cream3};">
      <h3 style="color:${gold}; margin:0 0 6px; font-size:13px;">📸 Photo Challenge</h3>
      <p style="color:${warm}; margin:0; font-size:14px; font-style:italic;">"${content.photoPrompt}"</p>
    </div>
    ` : ""}

    <!-- Affirmation -->
    <div style="background:white; padding:30px 24px; text-align:center; border-radius:0 0 20px 20px;">
      <p style="color:${muted}; margin:0 0 8px; font-size:11px; text-transform:uppercase; letter-spacing:2px;">Weekly Affirmation</p>
      <p style="color:${ink}; margin:0; font-size:17px; font-style:italic; font-family:Georgia,'Times New Roman',serif;">"${content.affirmation || ""}"</p>
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

    // Calculate current transits once (shared across all pets)
    const transits = getCurrentTransits();
    console.log("[WEEKLY-HOROSCOPE] Current transits:\n", transits);

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    const weekStartStr = weekStart.toISOString().split("T")[0];

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

        // Build prompt based on occasion mode
        const userPrompt = occasionMode === "memorial"
          ? buildMemorialPrompt(sub.pet_name, species, breed, sunSign, moonSign, element, archetype, superpower, transits)
          : buildStandardPrompt(sub.pet_name, species, breed, sunSign, moonSign, element, archetype, superpower, transits);

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
          occasionMode
        );

        const { error: emailError } = await resend.emails.send({
          from: "My Pet's Soul <hello@mypetssoul.com>",
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
