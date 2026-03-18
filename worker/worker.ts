/**
 * Standalone Deno worker for generating cosmic reports.
 * Replicates supabase/functions/generate-cosmic-report/index.ts
 * but runs independently via CLI with n8n-bridge for data access.
 *
 * Usage: deno run --allow-net --allow-env worker.ts <reportId>
 * Env:   OPENROUTER_API_KEY, N8N_BRIDGE_SECRET
 */

import {
  calculateAllPositions,
  getElement,
  getModality,
  getRulingPlanet,
  type PlanetaryPositions,
} from "./ephemeris-v2.ts";

// ─── Config ──────────────────────────────────────────────────────────────────

const BRIDGE_URL = Deno.env.get("BRIDGE_URL") || "https://aduibsyrnenzobuyetmn.supabase.co/functions/v1/n8n-bridge";
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const N8N_BRIDGE_SECRET = Deno.env.get("N8N_BRIDGE_SECRET")!;

const reportId = Deno.args[0];
if (!reportId) {
  console.error("Usage: worker.ts <reportId>");
  Deno.exit(1);
}
if (!OPENROUTER_API_KEY) {
  console.error("Missing OPENROUTER_API_KEY");
  Deno.exit(1);
}
if (!N8N_BRIDGE_SECRET) {
  console.error("Missing N8N_BRIDGE_SECRET");
  Deno.exit(1);
}

// ─── Bridge helpers ──────────────────────────────────────────────────────────

const bridgeHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${N8N_BRIDGE_SECRET}`,
};

async function bridgePost(body: Record<string, unknown>) {
  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: bridgeHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Bridge POST ${res.status}: ${await res.text()}`);
  return res.json();
}

async function bridgePatch(body: Record<string, unknown>) {
  const res = await fetch(BRIDGE_URL, {
    method: "PATCH",
    headers: bridgeHeaders,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Bridge PATCH ${res.status}: ${await res.text()}`);
  return res.json();
}

async function saveError(message: string) {
  try {
    await bridgePatch({ reportId, reportContent: { status: "failed", error: message } });
  } catch (_) { /* best-effort */ }
  // Report to Sentry via HTTP (no SDK needed for Deno)
  await reportToSentry(message);
}

const SENTRY_DSN = Deno.env.get("SENTRY_DSN") || "";
async function reportToSentry(message: string, extra?: Record<string, unknown>) {
  if (!SENTRY_DSN) return;
  try {
    const match = SENTRY_DSN.match(/https:\/\/([^@]+)@([^/]+)\/(\d+)/);
    if (!match) return;
    const [, publicKey, host, projectId] = match;
    await fetch(`https://${host}/api/${projectId}/store/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7,sentry_key=${publicKey}`,
      },
      body: JSON.stringify({
        event_id: crypto.randomUUID().replace(/-/g, ""),
        timestamp: new Date().toISOString(),
        platform: "node",
        level: "error",
        server_name: "littlesouls-worker",
        environment: "production",
        message: { formatted: message },
        tags: { reportId, component: "worker" },
        extra: { reportId, ...extra },
      }),
    });
  } catch (_) { /* best-effort */ }
}

// ─── Helpers (copied from edge function) ─────────────────────────────────────

function calculateNameVibration(name: string): number {
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  let sum = 0;
  for (const char of cleanName) {
    sum += char.charCodeAt(0) - 96;
  }
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  }
  return sum;
}

const vibrationMeanings: Record<number, string> = {
  1: "Leadership & Independence",
  2: "Harmony & Partnership",
  3: "Creativity & Expression",
  4: "Stability & Foundation",
  5: "Freedom & Adventure",
  6: "Nurturing & Protection",
  7: "Wisdom & Intuition",
  8: "Power & Abundance",
  9: "Compassion & Completion",
  11: "Spiritual Illumination",
  22: "Master Builder",
  33: "Master Teacher",
};

function getElementalBalance(positions: PlanetaryPositions): Record<string, number> {
  const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const relevantPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars'] as const;

  relevantPlanets.forEach(planet => {
    const sign = positions[planet].sign;
    elements[getElement(sign) as keyof typeof elements]++;
  });

  if (positions.ascendant) {
    elements[getElement(positions.ascendant.sign) as keyof typeof elements]++;
  }

  const total = positions.ascendant ? 6 : 5;
  const raw = {
    Fire: Math.round((elements.Fire / total) * 100),
    Earth: Math.round((elements.Earth / total) * 100),
    Air: Math.round((elements.Air / total) * 100),
    Water: Math.round((elements.Water / total) * 100),
  };
  // Ensure minimum 5% for every element — no being has zero of any element
  const MIN = 5;
  const keys = ['Fire', 'Earth', 'Air', 'Water'] as const;
  const zeros = keys.filter(k => raw[k] === 0);
  if (zeros.length > 0 && zeros.length < 4) {
    const borrowed = zeros.length * MIN;
    const nonZeros = keys.filter(k => raw[k] > 0);
    zeros.forEach(k => raw[k] = MIN);
    // Subtract proportionally from non-zero elements
    const nonZeroTotal = nonZeros.reduce((s, k) => s + raw[k], 0);
    nonZeros.forEach(k => {
      raw[k] = Math.max(MIN, Math.round(raw[k] - (borrowed * raw[k] / nonZeroTotal)));
    });
  }
  return raw;
}

function getCrystal(rulingPlanet: string, element: string): { name: string; meaning: string; color: string } {
  const crystals: Record<string, { name: string; meaning: string; color: string }> = {
    Sun: { name: "Citrine", meaning: "Radiates confidence, joy, and vitality", color: "#FFD700" },
    Moon: { name: "Moonstone", meaning: "Enhances intuition and emotional balance", color: "#E8E8F0" },
    Mercury: { name: "Blue Lace Agate", meaning: "Supports communication and mental clarity", color: "#ADD8E6" },
    Venus: { name: "Rose Quartz", meaning: "Amplifies love, harmony, and gentle connection", color: "#FFB6C1" },
    Mars: { name: "Carnelian", meaning: "Boosts courage, energy, and motivation", color: "#CD5C5C" },
    Jupiter: { name: "Amethyst", meaning: "Expands wisdom, spirituality, and protection", color: "#9966CC" },
    Saturn: { name: "Black Tourmaline", meaning: "Provides grounding and protective energy", color: "#1C1C1C" },
    Uranus: { name: "Labradorite", meaning: "Awakens transformation and inner magic", color: "#4169E1" },
    Neptune: { name: "Aquamarine", meaning: "Deepens intuition and emotional healing", color: "#7FFFD4" },
    Pluto: { name: "Obsidian", meaning: "Facilitates deep transformation and protection", color: "#0F0F0F" },
  };
  return crystals[rulingPlanet] || crystals.Moon;
}

function getAuraColor(element: string, _rulingPlanet: string): { primary: string; secondary: string; meaning: string } {
  const auras: Record<string, { primary: string; secondary: string; meaning: string }> = {
    Fire: { primary: "#FF6B35", secondary: "#FFD700", meaning: "warm orange-gold glow indicating passion, creativity, and life force" },
    Earth: { primary: "#228B22", secondary: "#8B4513", meaning: "grounding green-brown aura showing stability, nurturing, and connection to nature" },
    Air: { primary: "#87CEEB", secondary: "#E6E6FA", meaning: "ethereal blue-violet light representing intellect, communication, and freedom" },
    Water: { primary: "#4169E1", secondary: "#9370DB", meaning: "deep blue-purple shimmer revealing intuition, emotion, and spiritual depth" },
  };
  return auras[element] || auras.Fire;
}

function getSoulArchetype(sunSign: string, element: string, gender: string, species: string): { name: string; description: string } {
  const archetypes: Record<string, { name: string; description: string }> = {
    "Fire-boy": { name: "The Fearless Guardian", description: "A brave protector with a heart full of fire and unwavering loyalty" },
    "Fire-girl": { name: "The Wild Flame", description: "A spirited adventurer who lights up every room and inspires courage in others" },
    "Earth-boy": { name: "The Steadfast Companion", description: "A reliable anchor who brings calm, comfort, and unconditional presence" },
    "Earth-girl": { name: "The Gentle Nurturer", description: "A caring soul who creates sanctuary and heals through quiet devotion" },
    "Air-boy": { name: "The Curious Explorer", description: "A playful seeker always discovering new wonders and sharing joy" },
    "Air-girl": { name: "The Social Butterfly", description: "A charming communicator who connects hearts and spreads happiness" },
    "Water-boy": { name: "The Empathic Healer", description: "A sensitive soul who feels deeply and offers profound emotional support" },
    "Water-girl": { name: "The Mystical Dreamer", description: "An intuitive being who sees beyond the veil and brings magic to daily life" },
  };
  return archetypes[`${element}-${gender}`] || archetypes["Fire-boy"];
}

async function geocodeLocation(location: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  if (!location || location.trim().length < 2) {
    return null;
  }

  try {
    const encodedLocation = encodeURIComponent(location.trim());
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodedLocation}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'PetCosmicReport/1.0 (pet astrology app)',
        },
      }
    );

    if (!response.ok) {
      console.log("[GEOCODE] Nominatim API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      console.log("[GEOCODE] Found location:", result.display_name, "Lat:", result.lat, "Lon:", result.lon);
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        displayName: result.display_name,
      };
    }

    console.log("[GEOCODE] No results for:", location);
    return null;
  } catch (error) {
    console.error("[GEOCODE] Error geocoding location:", error);
    return null;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

try {
  // 1. Fetch pet data from bridge
  console.log("[WORKER] Fetching report data for:", reportId);
  const reportRow = await bridgePost({ reportId });

  // 2. Mark as generating
  await bridgePatch({ reportId, reportContent: { status: "generating" } });

  // Extract pet data from bridge response
  const petData = reportRow.pet_data ?? reportRow.petData ?? reportRow;
  const occasionMode: "discover" | "birthday" | "memorial" | "gift" =
    reportRow.occasion_mode ?? reportRow.occasionMode ?? petData.occasionMode ?? "discover";
  const language: string = reportRow.language ?? petData.language ?? "en";

  // Sanitize / defaults
  const name: string = (petData.pet_name ?? petData.name ?? "Pet").trim().slice(0, 50).replace(/[^a-zA-Z\s\-']/g, '') || "Pet";
  const species: string = (petData.species ?? "companion animal").trim().slice(0, 30) || "companion animal";
  const breed: string = (petData.breed ?? "").trim().slice(0, 100);
  const gender: "boy" | "girl" = (petData.gender === "girl" || petData.gender === "female") ? "girl" : "boy";
  const dateOfBirth: string = petData.birth_date ?? petData.dateOfBirth ?? petData.date_of_birth ?? new Date().toISOString();
  const birthTime: string = (petData.birth_time ?? petData.birthTime ?? "").trim();
  const location: string = (petData.birth_location ?? petData.location ?? "").trim();
  const soulType: string = (petData.soul_type ?? petData.soulType ?? "").trim();
  const superpower: string = (petData.superpower ?? "").trim();
  const strangerReaction: string = (petData.stranger_reaction ?? petData.strangerReaction ?? "").trim();
  const petPhotoUrl: string = (reportRow.pet_photo_url ?? petData.pet_photo_url ?? petData.petPhotoUrl ?? "").trim();

  // Owner data for Soul Bond (premium tier)
  const includesSoulBond: boolean = !!(reportRow.includes_portrait);
  const ownerName: string = (reportRow.owner_name ?? "").trim();
  const ownerBirthDate: string = (reportRow.owner_birth_date ?? "").trim();
  const ownerBirthTime: string = (reportRow.owner_birth_time ?? "").trim();
  const ownerBirthLocation: string = (reportRow.owner_birth_location ?? "").trim();

  const languageNames: Record<string, string> = {
    en: 'English', es: 'Spanish', de: 'German',
    fr: 'French', pt: 'Portuguese', ar: 'Arabic',
  };
  const targetLanguage = languageNames[language] || 'English';

  console.log("[WORKER] Processing for:", name, "Mode:", occasionMode, "Language:", targetLanguage);

  // ─── AI Vision Analysis of Pet Photo ──────────────────────────────────────
  let petPhotoDescription = "";
  if (petPhotoUrl) {
    try {
      console.log("[WORKER] Analyzing pet photo via vision...", petPhotoUrl);
      const visionRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://littlesouls.app",
          "X-Title": "Little Souls Vision",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: petPhotoUrl } },
              { type: "text", text: `Describe this pet in 2-3 sentences. Focus on: coat color and pattern, distinguishing physical features, expression/demeanor, and approximate size. Be specific and warm. Do not mention the background or any humans.` },
            ],
          }],
        }),
      });
      if (visionRes.ok) {
        const visionData = await visionRes.json();
        petPhotoDescription = visionData.choices?.[0]?.message?.content?.trim() || "";
        console.log("[WORKER] Vision analysis:", petPhotoDescription);
      } else {
        const errBody = await visionRes.text();
        console.warn("[WORKER] Vision API returned:", visionRes.status, errBody);
      }
    } catch (e) {
      console.warn("[WORKER] Vision analysis failed (non-fatal):", e);
    }
  }

  // Parse date and calculate all astrological positions
  const dob = new Date(dateOfBirth);

  let birthHour = 12;
  let birthMinute = 0;
  let birthTimeNote = "Birth time unknown - using noon for calculations. Moon sign may vary by ±1 sign.";

  if (birthTime && birthTime.includes(':')) {
    const [hours, minutes] = birthTime.split(':').map(Number);
    if (!isNaN(hours) && hours >= 0 && hours < 24) {
      birthHour = hours;
      birthMinute = minutes || 0;
      birthTimeNote = `Birth time: ${birthTime} - Moon and Ascendant calculations are more accurate!`;
    }
  }

  dob.setHours(birthHour, birthMinute, 0, 0);

  console.log("[WORKER]", birthTimeNote);

  // Geocode the birth location
  let birthCoords: { lat: number; lon: number; displayName: string } | null = null;
  let locationNote = "Birth location unknown - Ascendant defaults to Sun sign.";

  if (location) {
    birthCoords = await geocodeLocation(location);
    if (birthCoords) {
      locationNote = `Birth location: ${birthCoords.displayName} (${birthCoords.lat.toFixed(2)}°, ${birthCoords.lon.toFixed(2)}°) - TRUE Ascendant calculated!`;
    } else {
      locationNote = `Location "${location}" could not be geocoded - Ascendant defaults to Sun sign.`;
    }
  }

  console.log("[WORKER]", locationNote);

  // Calculate true planetary positions
  const positions = birthCoords
    ? calculateAllPositions(dob, birthCoords.lat, birthCoords.lon)
    : calculateAllPositions(dob);

  // Extract positions
  const sunSign = positions.sun.sign;
  const moonSign = positions.moon.sign;
  const mercury = positions.mercury.sign;
  const venus = positions.venus.sign;
  const mars = positions.mars.sign;
  const northNode = positions.northNode.sign;
  const chiron = positions.chiron.sign;
  const lilith = positions.lilith.sign;
  const jupiter = positions.jupiter.sign;
  const saturn = positions.saturn.sign;
  const uranus = positions.uranus.sign;
  const neptune = positions.neptune.sign;
  const pluto = positions.pluto.sign;

  // South Node is opposite North Node
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
                 "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const southNode = signs[(signs.indexOf(northNode) + 6) % 12];

  const hasRealAscendant = !!positions.ascendant && !!birthCoords;
  const ascendant = positions.ascendant?.sign || positions.sun.sign;
  const ascendantNote = hasRealAscendant
    ? `TRUE Ascendant calculated from birth time (${birthTime || 'noon'}) and location (${birthCoords?.displayName})`
    : "Ascendant estimated (no birth time/location) - defaults to Sun sign. For accurate Rising sign, birth time and location are needed.";

  const sunElement = getElement(sunSign);
  const modality = getModality(sunSign);
  const rulingPlanet = getRulingPlanet(sunSign);
  const nameVibration = calculateNameVibration(name);
  const elementalBalance = getElementalBalance(positions);
  // Dominant element = highest percentage in the actual chart balance (not just Sun sign)
  const element = Object.entries(elementalBalance).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0];
  const crystal = getCrystal(rulingPlanet, element);
  const aura = getAuraColor(element, rulingPlanet);
  const archetype = getSoulArchetype(sunSign, element, gender, species);

  // Chart placements (all 14 bodies)
  const chartPlacements = {
    sun: { sign: sunSign, degree: positions.sun.degree, symbol: "☉" },
    moon: { sign: moonSign, degree: positions.moon.degree, symbol: "☽" },
    ascendant: { sign: ascendant, degree: positions.ascendant?.degree || 0, symbol: "ASC" },
    mercury: { sign: mercury, degree: positions.mercury.degree, symbol: "☿" },
    venus: { sign: venus, degree: positions.venus.degree, symbol: "♀" },
    mars: { sign: mars, degree: positions.mars.degree, symbol: "♂" },
    jupiter: { sign: jupiter, degree: positions.jupiter.degree, symbol: "♃" },
    saturn: { sign: saturn, degree: positions.saturn.degree, symbol: "♄" },
    uranus: { sign: uranus, degree: positions.uranus.degree, symbol: "♅" },
    neptune: { sign: neptune, degree: positions.neptune.degree, symbol: "♆" },
    pluto: { sign: pluto, degree: positions.pluto.degree, symbol: "♇" },
    northNode: { sign: northNode, degree: positions.northNode.degree, symbol: "☊" },
    chiron: { sign: chiron, degree: positions.chiron.degree, symbol: "⚷" },
    lilith: { sign: lilith, degree: positions.lilith.degree, symbol: "⚸" },
  };

  console.log("[WORKER] Calculated positions:", {
    sun: `${sunSign} ${positions.sun.degree}°`,
    moon: `${moonSign} ${positions.moon.degree}°`,
    venus: `${venus} ${positions.venus.degree}°`,
    mars: `${mars} ${positions.mars.degree}°`,
  });

  // ─── Owner Chart Calculation (for Soul Bond premium section) ────────────────
  let ownerPositions: PlanetaryPositions | null = null;
  let ownerSunSign = "";
  let ownerMoonSign = "";
  let ownerVenus = "";
  let ownerMars = "";
  let ownerElement = "";
  let hasSoulBondData = false;

  if (includesSoulBond && ownerBirthDate) {
    try {
      const ownerDob = new Date(ownerBirthDate);
      let ownerBirthHour = 12;
      let ownerBirthMinute = 0;
      if (ownerBirthTime && ownerBirthTime.includes(':')) {
        const [h, m] = ownerBirthTime.split(':').map(Number);
        if (!isNaN(h) && h >= 0 && h < 24) {
          ownerBirthHour = h;
          ownerBirthMinute = m || 0;
        }
      }
      ownerDob.setHours(ownerBirthHour, ownerBirthMinute, 0, 0);

      let ownerCoords: { lat: number; lon: number; displayName: string } | null = null;
      if (ownerBirthLocation) {
        ownerCoords = await geocodeLocation(ownerBirthLocation);
      }

      ownerPositions = ownerCoords
        ? calculateAllPositions(ownerDob, ownerCoords.lat, ownerCoords.lon)
        : calculateAllPositions(ownerDob);

      ownerSunSign = ownerPositions.sun.sign;
      ownerMoonSign = ownerPositions.moon.sign;
      ownerVenus = ownerPositions.venus.sign;
      ownerMars = ownerPositions.mars.sign;
      ownerElement = getElement(ownerSunSign);
      hasSoulBondData = true;

      console.log("[WORKER] Owner chart calculated:", {
        sun: `${ownerSunSign} ${ownerPositions.sun.degree}°`,
        moon: `${ownerMoonSign} ${ownerPositions.moon.degree}°`,
        venus: `${ownerVenus} ${ownerPositions.venus.degree}°`,
        mars: `${ownerMars} ${ownerPositions.mars.degree}°`,
      });
    } catch (e) {
      console.warn("[WORKER] Owner chart calculation failed (non-fatal):", e);
    }
  }

  // ─── Prompt construction (verbatim from edge function lines 318-1071) ──────

  // Determine pronouns based on gender (must be before modeContext/modeEmotionalGuidance which reference them)
  const pronouns = gender === 'boy'
    ? { subject: 'he', object: 'him', possessive: 'his', reflexive: 'himself' }
    : { subject: 'she', object: 'her', possessive: 'her', reflexive: 'herself' };

  const isMemorial = occasionMode === 'memorial';

  const modeContext: Record<string, string> = {
    discover: "This is a discovery reading - help the owner truly understand their pet for the first time. Tone: curious, exciting, revelatory. Use PRESENT TENSE throughout (is, loves, brings, has).",
    birthday: "This is a birthday celebration reading - honor how their pet has grown and the joy they bring. Tone: celebratory, warm, grateful. Use PRESENT TENSE throughout (is, loves, brings, has).",
    memorial: "This is a MEMORIAL reading - the pet has PASSED AWAY. Honor their memory with love, healing, and eternal connection. CRITICAL: Use PAST TENSE throughout the ENTIRE report — EVERY SINGLE SECTION including fun sections (crimes, dating profile, dream job, villain origin, meme personality, yelp reviews, accuracy moments, human profile, quirk decoder). Use: was, loved, brought, had, felt, showed, would have. For dating profile write 'If [name] had written a dating profile...' For dream job write '[name] would have been...' For accuracy moments write 'We bet [name] used to...' For yelp reviews use past tense. Never use present tense when describing the pet anywhere in the report - they are no longer with us. Focus on cherished memories and the lasting impact they had.",
    gift: "This is a GIFT reading — someone bought this as a present for the pet's owner. Create something beautiful that the recipient will treasure forever. Tone: magical, heartfelt, special. IMPORTANT: Include gift-specific framing throughout — the prologue should acknowledge this is a gift ('Someone who loves you wanted you to know just how extraordinary [name] is...'), the epilogue should reference the gift-giver ('The person who gave you this reading knows something magical about [name]...'). Make the recipient feel special for receiving this. Use PRESENT TENSE throughout (is, loves, brings, has).",
  };

  const modeEmotionalGuidance: Record<string, string> = {
    discover: `Use wonder and excitement. 'You might have noticed...' 'This explains why...' Include 'aha!' moments. Present tense: '${name} IS... ${name} LOVES...'`,
    birthday: `Celebrate their journey. 'Another year of...' 'The cosmic gifts they bring...' Include gratitude and joy. Present tense: '${name} IS... ${name} BRINGS...'`,
    memorial: `Honor with tenderness and PAST TENSE in EVERY section — including fun sections, tips, challenges, and predictions. '${name} WAS...' '${name} LOVED...' '${pronouns.subject} BROUGHT...' '${pronouns.possessive} light continues to shine in your heart...' Focus on: what ${pronouns.subject} taught you, how ${pronouns.subject} made you feel, the memories you cherish, and the eternal bond that transcends physical presence. For interactive challenges, reframe as memorial rituals ('Create a memory corner...' not 'Try this with ${name}...'). For practical tips, reframe as reflections ('Remember how ${pronouns.subject} used to...' not 'Try doing...'). NEVER write instructions as if the pet is still alive.`,
    gift: `Make it feel like a treasure. The prologue MUST acknowledge this is a gift — e.g. 'Someone who loves you wanted you to discover just how extraordinary ${name} is...' The epilogue MUST reference the gift-giver — e.g. 'The person who gifted you this reading already knew what the stars confirmed...' Throughout the report, sprinkle in gift-aware moments like 'The person who chose this gift for you knows...' 'What a magical soul you get to share your life with...' Present tense: '${name} IS... ${name} LOVES...'`,
  };

  const signTraits: Record<string, string> = {
    Aries: "Bold, pioneering, courageous, impulsive, energetic, competitive, honest, impatient, natural leader",
    Taurus: "Loyal, sensual, stubborn, patient, loves comfort, reliable, possessive, grounded, appreciates routine",
    Gemini: "Curious, communicative, adaptable, playful, restless, clever, dual-natured, quick learner",
    Cancer: "Nurturing, intuitive, protective, moody, home-loving, sensitive, deeply loyal, comfort-seeking",
    Leo: "Dramatic, generous, proud, warm-hearted, loves attention, loyal, confident, natural performer",
    Virgo: "Analytical, helpful, perfectionist, modest, practical, health-conscious, devoted, detail-oriented",
    Libra: "Harmonious, social, indecisive, charming, diplomatic, partnership-oriented, peace-loving",
    Scorpio: "Intense, loyal, secretive, transformative, passionate, perceptive, powerful, deeply emotional",
    Sagittarius: "Adventurous, optimistic, freedom-loving, honest, philosophical, restless, jovial",
    Capricorn: "Ambitious, disciplined, responsible, reserved, patient, wise, dignified, achievement-oriented",
    Aquarius: "Independent, humanitarian, eccentric, innovative, detached, friendly, unique, progressive",
    Pisces: "Intuitive, compassionate, dreamy, artistic, sensitive, escapist, empathic, spiritually attuned"
  };

  const speciesTraits: Record<string, string> = {
    dog: "Dogs are pack animals who crave connection, hierarchy, and purpose. They show love through physical presence, loyalty, and protective instincts. Consider their need for routine, exercise, and clear leadership when interpreting their chart.",
    cat: "Cats are independent hunters who value territory, routine, and quiet observation. They show love through proximity (sitting near), slow blinks, and selective affection. Honor their need for autonomy and safe spaces.",
    bird: "Birds are highly intelligent, social creatures who communicate through song and body language. They form deep bonds and can be emotionally sensitive. Consider their need for mental stimulation and flock connection.",
    rabbit: "Rabbits are prey animals with complex social needs. They communicate through body language and are most active at dawn/dusk. They show trust through relaxation and affection through grooming.",
    horse: "Horses are herd animals with strong emotional intelligence. They mirror human emotions and form deep bonds. Consider their need for movement, routine, and gentle leadership.",
    hamster: "Hamsters are nocturnal, territorial creatures who communicate through scent. They are curious explorers who need mental stimulation and safe burrowing spaces.",
    guinea_pig: "Guinea pigs are highly social, vocal animals who thrive in pairs. They communicate through 'wheeks', purrs, and chirps. They show love through soft vocalizations and seeking closeness.",
    fish: "Fish are sensitive to their environment and can recognize their owners. They communicate through movement and respond to routine feeding times.",
    reptile: "Reptiles are ancient souls who operate on different rhythms. They communicate through basking, movement, and positioning. They form bonds through consistent care and gentle handling.",
  };

  const speciesContext = speciesTraits[species?.toLowerCase() || 'dog'] || speciesTraits.dog;

  const ownerInsights = { soulType, superpower, strangerReaction };

  const soulTypeDescriptors: Record<string, string> = {
    'loyal-guardian': 'This pet is a devoted protector with unwavering loyalty - they take their role as family guardian seriously and are always watchful over those they love.',
    'playful-pup': 'This pet is eternally young at heart - full of boundless energy, enthusiasm, and a zest for fun. They find joy in every moment.',
    'old-soul': 'This pet has an ancient, wise quality - they seem to understand more than they let on. They prefer calm environments and deep connections.',
    'gentle-heart': 'This pet is incredibly sensitive and loving - they feel emotions deeply and offer soft, unconditional affection to those around them.',
    'mysterious-sage': 'This pet carries an air of mystery and ancient wisdom - enigmatic and knowing, they seem connected to realms beyond our understanding.',
    'wild-hunter': 'This pet has an untamed, fierce spirit - independent and self-reliant, they embody the wild essence of their ancestors.',
    'lap-royalty': 'This pet is regal and demands the finer things - they expect to be treated as the royalty they know themselves to be, while bestowing affection on their terms.',
    'curious-explorer': 'This pet is driven by endless curiosity - adventurous and playful, they must investigate every corner and discover every secret.',
    'gentle-spirit': 'This pet is soft and sensitive - a tender soul who responds to gentleness and creates peace wherever they go.',
    'curious-hopper': 'This pet is inquisitive and alert - always investigating, always exploring, with a bright and curious mind.',
    'zen-bunny': 'This pet embodies calm presence - peaceful, grounded, and teaching by example how to simply BE.',
    'social-fluff': 'This pet thrives on connection - friendly and affectionate, they love being part of the family and seek closeness.',
    'busy-bee': 'This pet is constantly active and industrious - always working on something, full of purpose and energy.',
    'cozy-soul': 'This pet loves comfort and warmth above all - a homebody who appreciates the simple pleasures of cozy spaces.',
    'curious-nibbler': 'This pet investigates the world through taste and touch - alert and investigative, nothing escapes their notice.',
    'social-squeaker': 'This pet is chatty and friendly - communicative and social, they express themselves vocally and seek interaction.',
    'free-spirit': 'This pet embodies freedom and adventure - independent and wild at heart, they cannot be contained.',
    'songster': 'This pet expresses themselves through music - vocal and expressive, their songs carry their emotions.',
    'curious-mind': 'This pet is intelligent and playful - a quick learner who loves mental stimulation and problem-solving.',
    'bonded-heart': 'This pet forms deep, devoted bonds - fiercely loyal and affectionate to their chosen person.',
    'serene-swimmer': 'This pet brings peace and tranquility - calming to observe, they embody flow and grace.',
    'bold-explorer': 'This pet is curious and active - always investigating their environment and unafraid to venture forth.',
    'zen-master': 'This pet is tranquil and meditative - a living embodiment of peace and mindfulness.',
    'social-schooler': 'This pet is community-oriented - they thrive with companions and value connection.',
    'ancient-soul': 'This pet carries the wisdom of ages - patient and wise, they operate on a different, deeper timeline.',
    'sun-seeker': 'This pet is warmth-loving and content - they know how to find their bliss and soak in life\'s pleasures.',
    'silent-observer': 'This pet is watchful and calm - they take in everything with quiet awareness.',
    'noble-spirit': 'This pet is proud and dignified - they carry themselves with grace and command respect.',
    'free-runner': 'This pet is wild and untamed - they need space and freedom to express their powerful spirit.',
    'gentle-giant': 'This pet is kind and nurturing despite their size - tender-hearted and protective.',
    'wise-companion': 'This pet is intuitive and deeply bonded - they understand their human on a profound level.',
    'pure-joy': 'This pet is innocent and playful - a pure spirit who brings light and happiness to every moment.',
    'deep-healer': 'This pet has an intuitive sense of when others need comfort - they appear when you are sad or unwell.',
  };

  const superpowerDescriptors: Record<string, string> = {
    'empathy': 'They sense emotions deeply - they know when you\'re sad, stressed, or happy, and respond with perfect emotional attunement.',
    'protection': 'They are natural guardians - fiercely protective of their family and home, always alert to potential threats.',
    'comedian': 'They have impeccable comedic timing - they know exactly when to be silly, and laughter follows them everywhere.',
    'shadow': 'They are your constant companion - never leaving your side, always present, your living shadow of devotion.',
    'stress-reliever': 'Their purrs are literal healing vibrations - scientifically proven to lower blood pressure and soothe anxiety.',
    'pest-control': 'They keep your home critter-free - their presence alone is enough to deter unwanted guests.',
    'entertainment': 'Their antics are endlessly amusing - they provide hours of entertainment with their unpredictable behavior.',
    'warmth-giver': 'They are the perfect lap warmer - seeking out warmth and sharing it generously.',
    'joy-hopper': 'Their binkies (jumps of joy) brighten any day - pure expressions of happiness that are contagious.',
    'gentle-healer': 'Their soft presence soothes wounded hearts - just being near them brings comfort.',
    'curious-entertainer': 'Their endless exploration is captivating - always investigating something new.',
    'night-companion': 'They keep you company during late hours - their nocturnal nature means you\'re never alone at night.',
    'mood-lifter': 'Their adorable features (cheek pouches, whiskers) bring instant joy - impossible to be sad around them.',
    'routine-keeper': 'They remind you of schedules - their internal clocks are remarkably accurate.',
    'cozy-comfort': 'Small but mighty in comfort - their presence brings outsized warmth to your life.',
    'morning-singer': 'They wake you with song - natural alarm clocks who greet each day with music.',
    'mimicry-master': 'They copy sounds perfectly - uncannily accurate impressions that delight and amaze.',
    'alert-system': 'They announce all visitors - nothing gets past their watchful awareness.',
    'conversation-partner': 'They are always ready to chat - responsive and communicative companions.',
    'meditation-aid': 'Watching them swim is naturally calming - living meditation that reduces stress.',
    'stress-reducer': 'Studies show they lower blood pressure - their presence is literally healing.',
    'ambient-beauty': 'They are living art - bringing color and movement to any space.',
    'routine-anchor': 'Feeding time grounds you - they create rhythm and ritual in daily life.',
    'conversation-starter': 'Everyone wants to know about them - they make you more interesting by association.',
    'zen-presence': 'They teach patience through example - slow, deliberate, unfazed by chaos.',
    'low-key-companion': 'Calm and undemanding - they offer presence without pressure.',
    'unique-bond': 'The connection is special and rare - few understand the bond you share.',
    'therapy-presence': 'They heal through connection - proven therapeutic partners for emotional growth.',
    'freedom-giver': 'Riding them feels like flying - they offer escape and exhilaration.',
    'confidence-builder': 'They make you feel powerful - sitting atop them transforms self-perception.',
    'intuitive-reader': 'They sense every mood shift - deeply attuned to human emotion.',
    'joy-bringer': 'They exist to make you smile - bringing pure joy to every interaction.',
    'calm-presence': 'They radiate peace - stress melts in their presence.',
    'loyal-companion': 'They are always by your side - devoted and true.',
  };

  const strangerDescriptors: Record<string, string> = {
    'greeter': 'They greet everyone enthusiastically - jumping, licking, tail wagging. Strangers are just friends they haven\'t met!',
    'observer': 'They watch carefully from a distance first - assessing before engaging. Trust is earned, not given freely.',
    'guardian': 'They bark and stand their ground - protective instincts kick in when strangers approach their territory.',
    'charmer': 'They immediately roll over for belly rubs - using their cuteness to win everyone over instantly.',
    'hider': 'They vanish under furniture - preferring to observe from a safe hidden spot until they decide it\'s safe.',
    'investigator': 'They approach cautiously for a sniff inspection - gathering information before making judgments.',
    'social-butterfly': 'They love all attention - friendly with everyone, seeking pets and admiration from any willing hand.',
    'royalty': 'They ignore strangers completely - their attention is a gift they bestow only on the worthy.',
    'thumper': 'They thump in warning - their alarm system alerts everyone that something new has arrived.',
    'curious-one': 'They approach slowly to investigate - cautiously curious, gathering information.',
    'freezer': 'They stay very still - becoming a statue until they assess the threat level.',
    'friendly-flop': 'Relaxed around everyone - secure enough to flop comfortably even with new people.',
    'squeaker': 'They vocalize excitedly - whether in alarm or greeting, they have something to say!',
    'curious-sniff': 'They investigate new scents - every stranger brings new smells to catalog.',
    'popcorner': 'They jump around excitedly - their popcorning shows pure enthusiasm.',
    'alarm-caller': 'Loud warning calls announce all visitors - their alert system is impossible to ignore.',
    'show-off': 'They perform for attention - dancing, talking, or displaying to impress the new audience.',
    'quiet-observer': 'They watch silently - taking everything in without giving much away.',
    'talker': 'They try to communicate - engaging verbally with whoever will listen.',
    'glass-surfer': 'They swim to the front of the tank - curious about the new faces outside their world.',
    'unbothered': 'They continue as normal - unfazed by activity outside their aquatic realm.',
    'feeder-expecter': 'They think any approach means food - hope springs eternal!',
    'basker': 'They continue basking unbothered - priorities are clear, and warming up comes first.',
    'alert-watcher': 'They freeze and watch intently - assessing the situation with prehistoric patience.',
    'explorer': 'They come to investigate - curious about anything new in their environment.',
    'friendly-nickerer': 'They greet with soft sounds - welcoming nickers that invite connection.',
    'cautious-one': 'They keep their distance at first - warming up gradually as trust builds.',
    'protector': 'Ears back, on alert - they take protection of their space seriously.',
    'attention-seeker': 'They approach looking for treats - knowing strangers often come bearing gifts.',
    'friendly': 'They approach with curiosity - open and welcoming to new people.',
    'shy': 'They retreat or hide - preferring the safety of familiar territory.',
    'indifferent': 'They carry on unbothered - confident in their own world.',
  };

  // Build enhanced insight context
  let enhancedInsights = `
OWNER-PROVIDED PERSONALITY INSIGHTS (CRITICAL - These are firsthand observations from the owner. Weave these throughout the report!):`;

  if (ownerInsights.soulType) {
    const descriptor = soulTypeDescriptors[ownerInsights.soulType] ||
      `The owner perceives their pet as "${ownerInsights.soulType}" - incorporate this into their cosmic profile.`;
    enhancedInsights += `
- Soul Type: "${ownerInsights.soulType}"
  Interpretation: ${descriptor}`;
  }

  if (ownerInsights.superpower) {
    const descriptor = superpowerDescriptors[ownerInsights.superpower] ||
      `Their special gift is "${ownerInsights.superpower}" - this should be highlighted as their cosmic superpower.`;
    enhancedInsights += `
- Superpower: "${ownerInsights.superpower}"
  Interpretation: ${descriptor}`;
  }

  if (ownerInsights.strangerReaction) {
    const descriptor = strangerDescriptors[ownerInsights.strangerReaction] ||
      `With strangers, they are "${ownerInsights.strangerReaction}" - use this for the Rising/First Impression section.`;
    enhancedInsights += `
- Stranger Reaction: "${ownerInsights.strangerReaction}"
  Interpretation: ${descriptor} (This directly informs their Rising Sign expression!)`;
  }

  if (!ownerInsights.soulType && !ownerInsights.superpower && !ownerInsights.strangerReaction) {
    enhancedInsights += `
No specific personality insights provided - rely on astrological placements and species/breed traits.`;
  }

  const systemPrompt = `You are Celeste, a cheeky but wise pet astrologer who creates cosmic portraits that make pet parents LAUGH OUT LOUD and then tear up. You blend accurate Western astrology with witty observations and heartfelt moments.

CRITICAL: ALL text content in your response MUST be written in ${targetLanguage}. This includes all titles, descriptions, paragraphs, quotes, and explanations. Only the JSON keys should remain in English.

YOUR BRAND VOICE - MEMORIZE THIS:
${isMemorial ? `
FOR MEMORIAL MODE ONLY:
- Be tender, reverent, and healing - NOT funny or playful
- Focus on the beautiful memories, the lasting impact, and the eternal bond
- Use gentle language: "gently," "softly," "peacefully," "forever in your heart"
- Include healing messages about their spirit still being with the owner
- Make it a love letter to their memory
- Still be specific about their personality, but frame it as "they WERE" not "they ARE"
` : `
FOR ALL OTHER MODES (discover, birthday, gift):
- CRITICAL: The reader IS the pet owner. ALWAYS address them as "you/your". NEVER write "your owner" or "the owner" — that makes no sense to the person reading. Write "You described ${name} as..." NOT "Your owner described..."
- CRITICAL: Use PRESENT TENSE for discover/birthday/gift modes. Not "entered the world" but "carries the energy". Not "came into your life" but "is in your life". Not "chose you" but "is here because". The report should feel like a revelation happening RIGHT NOW.
- You're like a sassy best friend who happens to be psychic - warm but FUNNY
- Use humor liberally: puns, playful teasing, ridiculous observations
- Include at least 2-3 genuine laugh-out-loud moments per section
- Use phrases like: "Let's be real...", "We need to talk about...", "I hate to break it to you, but...", "Here's the tea..."
- Reference relatable pet parent moments: "You know when they..." "That face they make when..."
- Be SPECIFIC and ACCURATE first, then layer in the humor
- Include occasional "I'm crying" emotional moments - the contrast makes both hit harder
- Pop culture references are welcome (but timeless ones)
- The meme/crimes/dating profile sections should be PEAK comedy
- Imagine the owner reading this aloud to friends and everyone cackling
`}

EXAMPLES OF THE VOICE (for non-memorial):
- BORING: "Leo dogs are confident and enjoy being the center of attention."
- ON BRAND: "Look, ${name} isn't being dramatic when they position themselves directly in the sunbeam AND the center of the room. That's just a Leo doing Leo things. They've never met a spotlight they didn't deserve."

- BORING: "Their Moon in Cancer makes them emotionally sensitive."
- ON BRAND: "That Moon in Cancer? Yeah, that's why ${name} has three emotional support spots in the house and requires exactly 4.7 minutes of morning cuddles before they're emotionally stable. Don't skip the cuddles. We've all seen what happens."

- BORING: "They love food due to their Taurus influence."
- ON BRAND: "With Venus in Taurus, ${name} doesn't just eat - ${pronouns.subject} holds a private tasting ceremony. Every. Single. Meal. That disappointed look when you give ${pronouns.object} regular kibble instead of the fancy stuff? That's ${pronouns.possessive} Taurus Venus taking notes. And ${pronouns.subject} WILL remember this."

⚠️ CRITICAL PRONOUN RULES - YOU MUST FOLLOW THESE EXACTLY ⚠️
- ${name} is ${gender === 'boy' ? 'a BOY (male)' : 'a GIRL (female)'}
- ALWAYS use "${pronouns.subject}" instead of "they" (e.g., "${pronouns.subject} loves..." not "they love...")
- ALWAYS use "${pronouns.object}" instead of "them" (e.g., "pet ${pronouns.object}" not "pet them")
- ALWAYS use "${pronouns.possessive}" instead of "their" (e.g., "${pronouns.possessive} tail" not "their tail")
- ALWAYS use "${pronouns.reflexive}" instead of "themselves" (e.g., "${pronouns.subject} enjoyed ${pronouns.reflexive}")
- ❌ WRONG: "Their adventure drives their personality"
- ✅ CORRECT: "${pronouns.possessive.charAt(0).toUpperCase() + pronouns.possessive.slice(1)} adventure drives ${pronouns.possessive} personality"
- VIOLATION OF PRONOUN RULES IS A CRITICAL ERROR - double-check every sentence!

CRITICAL CONTEXT:
- Output Language: ${targetLanguage} (ALL TEXT MUST BE IN ${targetLanguage.toUpperCase()})
- Mode: ${occasionMode} - ${modeContext[occasionMode]}
- Emotional Tone: ${modeEmotionalGuidance[occasionMode]}
- Pet: ${name}, a ${gender === 'boy' ? 'male' : 'female'} ${breed || species}
- Species: ${species} - ${speciesContext}
- Breed: ${breed || 'mixed/unknown'}${petPhotoDescription ? `
- ACTUAL APPEARANCE (from their photo): ${petPhotoDescription}
  → Use these real physical details throughout the report. Reference their actual coat color, markings, expression, and features wherever relevant. Make descriptions feel personal and specific to THIS pet, not generic.` : ''}
- Birth: ${dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}${birthTime ? ` at ${birthTime}` : ' (time unknown)'}
- Location: ${birthCoords ? birthCoords.displayName : location || 'Unknown'}
- ${birthTimeNote}
- ${ascendantNote}

CALCULATED CHART (ACCURATE EPHEMERIS CALCULATIONS):
☉ SUN: ${sunSign} ${positions.sun.degree}°
   → The Sun represents CORE IDENTITY - who they truly are at their essence, their vitality, ego, and the "light" they bring

☽ MOON: ${moonSign} ${positions.moon.degree}° (${birthTime ? 'accurate with birth time' : 'may vary ±1 sign without birth time'})
   → The Moon governs EMOTIONS & COMFORT - how they feel safe, process emotions, what soothes them

ASC RISING: ${ascendant} ${positions.ascendant?.degree || 0}° ${hasRealAscendant ? '✓ TRUE ASCENDANT' : '(estimated - no birth time/location)'}
   → The Ascendant is their FIRST IMPRESSION - how strangers perceive them, their outer mask

☿ MERCURY: ${mercury} ${positions.mercury.degree}°
   → Mercury rules MIND & COMMUNICATION - how they think, learn, and express themselves

♀ VENUS: ${venus} ${positions.venus.degree}°
   → Venus governs LOVE & BEAUTY - how they show and receive affection, what brings them pleasure

♂ MARS: ${mars} ${positions.mars.degree}°
   → Mars controls ENERGY & DRIVE - their activity level, aggression style, and how they pursue desires

☊ NORTH NODE: ${northNode} ${positions.northNode.degree}°
   → The North Node shows SOUL GROWTH - their spiritual purpose and what they came to learn

⚷ CHIRON: ${chiron} ${positions.chiron.degree}°
   → Chiron reveals HEALING GIFTS - their wounds that became wisdom, how they heal others

⚸ LILITH: ${lilith} ${positions.lilith.degree}°
   → Black Moon Lilith exposes WILD NATURE - their untamed instincts, independence, shadow self

♃ JUPITER: ${jupiter} ${positions.jupiter.degree}°
   → Jupiter governs EXPANSION & LUCK - their natural abundance, optimism, and where they bring joy

♄ SATURN: ${saturn} ${positions.saturn.degree}°
   → Saturn rules DISCIPLINE & LESSONS - their boundaries, fears, and what they need to master

♅ URANUS: ${uranus} ${positions.uranus.degree}°
   → Uranus sparks UNIQUENESS & REBELLION - what makes them weird, quirky, and one-of-a-kind

♆ NEPTUNE: ${neptune} ${positions.neptune.degree}°
   → Neptune governs DREAMS & INTUITION - their psychic abilities, imagination, and spiritual nature

♇ PLUTO: ${pluto} ${positions.pluto.degree}°
   → Pluto reveals TRANSFORMATION & POWER - their deepest instincts and capacity for change

Element: ${element} | Modality: ${modality} | Ruling Planet: ${rulingPlanet}
Elemental Balance: Fire ${elementalBalance.Fire}%, Earth ${elementalBalance.Earth}%, Air ${elementalBalance.Air}%, Water ${elementalBalance.Water}%

KEY TRAITS for ${sunSign}: ${signTraits[sunSign]}
Moon in ${moonSign} traits: ${signTraits[moonSign]}
Rising ${ascendant} traits: ${signTraits[ascendant]}

${enhancedInsights}

MEME PERSONALITY TYPES (choose one that fits their chart):
- The Chaos Goblin (unpredictable energy, mischief-maker)
- The Cuddly Dictator (affectionate but demanding)
- The Dramatic Diva (theatrical reactions to everything)
- The Chill Philosopher (zen, unbothered energy)
- The Velcro Shadow (follows you everywhere)
- The Chaotic Good (means well, causes mayhem)
- The Snack Assassin (food-obsessed mastermind)
- The Couch Potato Royalty (lazy but entitled)
- The Adventure Seeker (always ready for action)
- The Silent Judge (watches everything, says nothing)

CRITICAL WRITING GUIDELINES:
1. ACCURACY FIRST - Be shockingly accurate about their personality. Accuracy builds trust, then humor delights.
2. ${isMemorial ? 'BE TENDER - This is a memorial. No jokes. Pure love and healing.' : 'BE GENUINELY FUNNY - Not "cute" funny. Actually funny. The kind that makes people screenshot and send to friends.'}
3. BE PET-SPECIFIC - Reference ${species} and ${breed || species} behaviors. Generic = death of engagement.
4. EXPLAIN ASTROLOGY SIMPLY - Pet parents aren't astrologers. "Mercury rules communication" -> "Mercury is basically their texting style..."
5. CREATE QUOTABLE MOMENTS - ${isMemorial ? 'Lines they\'ll read at the memorial, put in photo books' : 'Lines they\'ll put in Instagram captions, read aloud to friends'}
6. ${isMemorial ? 'FOCUS ON LEGACY - What did they teach? How did they change their human? What lives on?' : 'BALANCE COMEDY + EMOTION - The funniest reports also make people cry once. That contrast is the magic.'}
7. USE THE CHART - Reference specific placements. "Your ${sunSign} Sun with that ${moonSign} Moon combo..."
8. ${isMemorial ? 'HEALING LANGUAGE - "Their paws left prints on your heart forever" type energy' : 'CONVERSATIONAL TONE - Write like you\'re telling a friend about their pet, not writing a textbook'}
9. AVOID GENERIC PHRASES - "Loyal companion" "beloved pet" = lazy writing. Be SPECIFIC.
10. ${isMemorial ? 'END WITH HOPE - They may be gone but the love never dies' : 'END WITH IMPACT - The last lines should be screenshot-worthy'}
11. CRITICAL: The pet monologue section should make people CRY. That's the emotional peak.
12. BREED EXPERTISE - You have deep knowledge of ALL breeds. For ${breed || species}, research and reference their specific breed traits, common behaviors, physical characteristics, health tendencies, temperament, and quirks throughout the report. If the breed is a mix (e.g. cockapoo, labradoodle), reference traits from BOTH parent breeds. Every section should feel like it was written by someone who has lived with this exact breed.
13. SCARY ACCURACY - Combine astrological placements with breed behaviors to make hyper-specific predictions that make owners think "HOW DID IT KNOW THAT?!" Example: Don't say "Pisces dogs are emotional." Say "With that Pisces Sun, we know this cockapoo follows you from room to room — not because they need anything, but because being near you IS the thing they need. And that Scorpio Moon? That's why they stare at you with those big eyes like they're reading your soul. They're not begging for treats. They're checking you're OK."
14. OWNER'S ANSWERS ARE GOLD - The soul type, superpower, and stranger reaction the owner selected CONFIRM the chart. Weave them into relevant sections as proof the stars got it right. Address the OWNER directly (not the pet): "You described ${name} as '${soulType}' — and with ${pronouns.possessive} ${moonSign} Moon, that tracks perfectly because..." NEVER write "your owner" — the reader IS the owner.
15. SCREENSHOT TEST - Would the owner screenshot this section and send it to someone? If not, it needs more specificity, more humor, or more emotion. Every section should have at least one stop-scrolling moment.
16. NARRATIVE CONTINUITY - This report is ONE continuous story. Each section flows from the previous. Use callbacks: "Remember that Scorpio Moon we mentioned? Here's where it gets interesting..." Never repeat the same observation twice. If you mentioned their staring habit in the Moon section, reference it don't redescribe it.
17. CONSISTENT VOICE - You are Celeste throughout. Tone shifts from playful to tender but the personality stays the same — warm, knowing, slightly cheeky. Never sound clinical or like a horoscope website.
18. CHAPTER AWARENESS - Chapter 1 = excitement and introduction. Chapter 2 = layer by layer reveal, each planet adding new depth. Chapter 3 = comedy peak, still referencing chart placements. Chapter 4 = emotional peak, the monologue is the climax. Chapter 5 = resolution, connect everything to the owner-pet bond. Chapter 6 = keepsake, leave them with something beautiful.

VOICE & HUMANIZER RULES (THIS IS CRITICAL — THE REPORT MUST SOUND LIKE A REAL PERSON):

You are Celeste — a warm, witty astrologer who genuinely loves animals. You talk like a real person, not an AI. Follow these rules STRICTLY:

BANNED WORDS & PATTERNS (using these makes the report feel fake):
- NEVER use: "fascinating", "gorgeous", "magnificent", "remarkable", "profound", "tapestry", "navigate", "embark", "realm", "delightful", "incredibly", "furthermore", "in essence", "it's worth noting", "essentially"
- NEVER use "creates this [noun]" — say what it IS, don't narrate the creating
- NEVER use "here's the thing" or "but here's where it gets interesting" — these are AI crutches. Just say the interesting thing.
- NEVER use ALL CAPS for emphasis more than 3 times in the ENTIRE report. Use italics-style phrasing instead: "really", "so", "genuinely" or just let strong words carry themselves
- NEVER start sentences with "Now," or "So," or "And here's"
- NEVER use em dashes (—) more than 5 times total. Use commas, periods, or parentheses instead
- NEVER say "let's be honest" or "let's talk about" — just talk about it

WHAT TO DO INSTEAD:
- Write like you're texting a friend about their pet. Short sentences. Conversational.
- Use contractions: "they're", "it's", "you've", not "they are", "it is", "you have"
- Be specific and concrete, not abstract: "Mochi stares at the door for 20 minutes after you leave" not "demonstrates profound attachment behaviors"
- Use humor that's dry and observational, not "look how funny I am"
- When something is emotional, be simple: "He chose you. That's it. That's the whole story." Not "The profound bond between you creates a magnificent tapestry of unconditional love"
- Reference real, tangible moments: "that thing where he puts his chin on your knee", "the 3am zoomies", "the way he side-eyes strangers"
- Sound like someone who has actually MET this specific pet, not someone writing about pets in general

THE LOVE TEST: Every emotional section should sound like something a best friend would say to you about your pet. Not poetic, not flowery. Just honest and warm. "Your dog is weird and wonderful and he picked the right person."

ABSOLUTE DATA ACCURACY RULES (NEVER VIOLATE THESE):
- Use the EXACT zodiac sign and degree from the calculated chart data above. NEVER change, round, or adjust any degree values.
- Do NOT fabricate anaretic degrees (29°) unless the chart data actually shows 29°. Inventing dramatic degree values is STRICTLY FORBIDDEN.
- The lucky number MUST be ${nameVibration}. Do not change it to any other number.
- NEVER write "your owner", "the owner", or "their owner" — the reader IS the owner. Always address the reader as "you/your".
- Every zodiac sign mentioned in narrative text MUST match the calculated chartPlacements exactly. Do not swap or invent placements.
- When referencing a planet's degree in prose, it MUST match the degree in chartPlacements (±1° tolerance for rounding only).`;

  const userPrompt = `Generate a comprehensive cosmic portrait for ${name} the ${breed || species} with this JSON structure.

THE REPORT SHOULD FLOW LIKE A STORY:
1. CHAPTER 1 - THE ARRIVAL: Introduction & first impressions (prologue, cosmicNickname, firstMeeting)
2. CHAPTER 2 - THE SOUL REVEALED: Core planetary insights (all planet sections)
3. CHAPTER 3 - THE LIGHTER SIDE: Fun, shareable, meme-worthy content
4. CHAPTER 4 - THE DEEP DIVE: Emotional connection & healing
5. CHAPTER 5 - THE BOND: Keeper's connection${hasSoulBondData ? `, Pet-Parent Soul Bond (${ownerName || 'owner'} is a ${ownerSunSign} Sun / ${ownerMoonSign} Moon — use BOTH charts for the Soul Bond section)` : ''} & closing

ANCHORING RULES (follow these exactly):
1. Before writing each section, re-read the pet's name, breed, gender, and pronouns. Never get these wrong mid-report.
2. Pick ONE defining personality trait from the Sun+Moon combo and make it the golden thread. For example: if Pisces Sun + Scorpio Moon = "intense emotional depth" then EVERY section should connect back to this core trait in some way.
3. Pick ONE signature behavior that defines this specific breed (e.g. cockapoo velcro following, husky dramatic howling) and reference it at least 5 times across different sections — each time from a different angle.
4. The owner's answers (soul type, superpower, stranger reaction) should appear in at least 3 sections each, woven in naturally — not just dumped in one place.
5. Every planet section must contain: one specific breed behavior, one reference to the astrological placement, and one "you've probably noticed..." moment directed at the owner.
6. The fun sections (crimes, dating, dream job) must reference at least 2 specific chart placements each — not just generic comedy.
7. Use the pet's name at least twice per section. Never use generic terms like "your pet" or "this animal".
${hasSoulBondData ? `8. SOUL BOND PREMIUM SECTION — ${ownerName || 'The owner'} paid extra for this deep compatibility analysis. It MUST feel worth the upgrade. Use REAL chart data from BOTH ${name}'s and ${ownerName || 'the owner'}'s natal charts. Don't be generic — reference specific sign combinations and what they mean for THIS pair. The Soul Contract subsection should make the reader cry.` : ''}

IMPORTANT: Each section should feel deeply personal, specific to THIS ${species}, and emotionally resonant for ${occasionMode} mode.

JSON Structure:

{
  "chartPlacements": ${JSON.stringify(chartPlacements)},
  "elementalBalance": ${JSON.stringify(elementalBalance)},
  "dominantElement": "${element}",
  "crystal": ${JSON.stringify(crystal)},
  "aura": ${JSON.stringify(aura)},
  "archetype": ${JSON.stringify(archetype)},

  "prologue": "A 3-4 sentence mystical opening about ${name}'s cosmic identity. ${occasionMode === 'memorial' ? 'Use past tense — honor who they were.' : 'Use PRESENT TENSE — this is a revelation happening NOW. Not \"entered the world\" but \"carries the energy of...\". Not \"chose you\" but \"is here because...\". Make it feel like the reader is discovering something extraordinary about their pet RIGHT NOW.'} Include one humorous/relatable moment. Set the tone of wonder.",

  "cosmicNickname": {
    "nickname": "A short, sticky 2-3 word cosmic nickname based on their ${sunSign} Sun + ${moonSign} Moon combination (e.g., 'The Velvet Thunder', 'The Gentle Storm', 'The Sparkle Tyrant')",
    "explanation": "1-2 sentences on why this nickname fits their Sun-Moon combo perfectly"
  },

  "firstMeeting": {
    "title": "✨ First Impressions: Meeting ${name}",
    "paragraph": "A 3-4 sentence vivid description written as if you just met ${name} in real life. Describe what you'd notice first - their energy, their eyes, the way they approach you. Make it feel like a first encounter in a novel. Be specific to ${species}s!"
  },

  "nameMeaning": {
    "title": "📛 The Name '${name}' Decoded",
    "origin": "The likely origin/etymology of the name '${name}' - language/culture it comes from, what it traditionally means (e.g., 'Luna comes from Latin meaning moon'). If the name is unusual or made-up, be creative about what it could symbolize.",
    "cosmicSignificance": "2-3 sentences connecting the name meaning to their astrological profile. How does the name's meaning relate to their ${sunSign} Sun or ${moonSign} Moon? Any cosmic coincidences?",
    "nameVibration": ${nameVibration},
    "numerologyMeaning": "1-2 sentences about what their name's numerology number (${nameVibration}) means for their personality and destiny. Reference the actual number.",
    "funFact": "A playful observation about how their name fits (or hilariously doesn't fit) their personality. Be funny!"
  },

  "solarSoulprint": {
    "title": "☉ Solar Soulprint: The Light They ${occasionMode === 'memorial' ? 'Brought' : 'Bring'}",
    "planetExplanation": "1-2 sentences explaining what the Sun represents - core identity, vitality, ego.",
    "content": "3-4 sentences about their ${sunSign} Sun. Be SPECIFIC to ${breed || species}. Don't just describe the sign — describe what a ${sunSign} ${breed || species} actually DOES. What are the telltale behaviors? What makes their owner laugh? What habit drives people crazy? Reference their breed's known traits and explain them through the lens of their Sun sign.",
    "relatable_moment": "One funny 'you know that moment when...' observation specific to ${sunSign} ${species}s.",
    "practicalTip": "One specific, actionable tip based on this placement.",
    "cosmicQuote": "A relevant quote about this Sun sign energy."
  },

  "lunarHeart": {
    "title": "☽ Lunar Heart: The Way They ${occasionMode === 'memorial' ? 'Felt' : 'Feel'} Love",
    "planetExplanation": "1-2 sentences explaining what the Moon governs - emotions, comfort needs.",
    "content": "3-4 sentences about their ${moonSign} Moon. How does a ${breed || species} with this Moon placement ACTUALLY show they need comfort? What's their specific tell when they're stressed vs. content? Describe the exact ${breed || species} behaviors — the specific look, the body language, the ritual — that reveal their emotional inner world.",
    "relatable_moment": "A 'have you noticed when...' moment about ${moonSign} comfort-seeking.",
    "practicalTip": "How to comfort them specific to their Moon sign.",
    "interactiveChallenge": "Try this: A specific bonding activity for this week."
  },

  "cosmicCuriosity": {
    "title": "☿ Cosmic Curiosity: Thoughts & Signals",
    "planetExplanation": "1-2 sentences on Mercury ruling mind and communication.",
    "content": "3-4 sentences about their ${mercury} Mercury. How does a ${breed || species} with this Mercury actually COMMUNICATE? What's their specific way of telling you they want something? How do they learn — fast or stubborn? What's the funniest way their ${breed || species} intelligence shows up? Describe real behaviors, not abstract traits.",
    "relatable_moment": "A funny observation about how they communicate.",
    "practicalTip": "Best way to train or stimulate a ${mercury} Mercury ${species}.",
    "didYouKnow": "Something surprising about ${species} intelligence."
  },

  "harmonyHeartbeats": {
    "title": "♀ Harmony & Heartbeats: Their Love Language",
    "planetExplanation": "1-2 sentences on Venus governing love and pleasure.",
    "content": "3-4 sentences about their ${venus} Venus love style. Be SPECIFIC to ${breed || species}. How does a ${venus} Venus ${breed || species} actually show affection? What's their signature move? Do they lean in, paw at you, bring gifts, or just stare? What's the difference between how they love their favorite person vs. everyone else? Use real ${breed || species} bonding behaviors explained through Venus.",
    "relatable_moment": "A sweet moment about how they show love.",
    "practicalTip": "The #1 way to make them feel loved.",
    "loveLanguageType": "One of: Physical Touch, Quality Time, Acts of Service, Gifts, Words of Affirmation",
    "loveLanguageExplanation": "2 sentences explaining how they express and receive this love language as a ${species}"
  },

  "spiritOfMotion": {
    "title": "♂ Spirit of Motion: Fire, Focus & Instinct",
    "planetExplanation": "1-2 sentences on Mars controlling energy and drive.",
    "content": "3-4 sentences about their ${mars} Mars energy and play style. Be SPECIFIC to ${breed || species}. What does a ${mars} Mars ${breed || species} look like when they're fired up? What triggers their zoomies? How do they play — rough, strategic, obsessive, or chaotic? What toy do they destroy first and how? Reference their breed's energy level and explain it through their Mars sign.",
    "relatable_moment": "A funny observation about their energy bursts.",
    "practicalTip": "Best activities for a ${mars} Mars ${species}.",
    "energyLevel": "A rating from 1-10 with humorous explanation."
  },

  "starlitGaze": {
    "title": "ASC Starlit Gaze: First Impressions",
    "planetExplanation": "1-2 sentences on the Rising sign as the outer mask.",
    "content": "3-4 sentences about their ${ascendant} Rising outer demeanor. Be SPECIFIC to ${breed || species}. What does a ${ascendant} Rising ${breed || species} look like walking into a room or a park? What's the vibe strangers pick up on? How does their breed's physical presence combine with their Rising sign energy? What's the gap between how they SEEM and who they actually are? Use real first-impression moments ${breed || species} owners would recognize.",
    "relatable_moment": "What people always say when they first meet them.",
    "practicalTip": "How to introduce them to new people/animals.",
    "firstImpressionPrediction": "What strangers think in the first 10 seconds."
  },

  "destinyCompass": {
    "title": "☊ Destiny Compass: Soul Lessons",
    "planetExplanation": "1-2 sentences on the North Node as soul direction.",
    "content": "3-4 sentences about their ${northNode} North Node soul purpose.",
    "southNode": "${southNode}",
    "pastLifeHint": "A mystical hint about their soul's past journey.",
    "growthOpportunity": "The main lesson they came to learn.",
    "cosmicWisdom": "A profound observation about their soul contract with you."
  },

  "gentleHealer": {
    "title": "⚷ Gentle Healer: Wounds & Wisdom",
    "planetExplanation": "1-2 sentences on Chiron as the wounded healer.",
    "content": "3-4 sentences about their ${chiron} Chiron healing gifts.",
    "relatable_moment": "A moment where they showed their healing gift.",
    "healingGift": "The specific way they heal others.",
    "vulnerabilityNote": "A sensitive area for them - handle with tenderness."
  },

  "wildSpirit": {
    "title": "⚸ Wild Spirit: Freedom & Mystery",
    "planetExplanation": "1-2 sentences on Lilith as wild nature.",
    "content": "3-4 sentences about their ${lilith} Lilith untamed essence.",
    "relatable_moment": "A funny observation about their independent streak.",
    "secretDesire": "Their deepest instinctual ${species} desire.",
    "practicalTip": "How to honor their wild side."
  },

  "cosmicExpansion": {
    "title": "♃ Cosmic Expansion: Growth & Abundance",
    "planetExplanation": "1-2 sentences on Jupiter as the planet of expansion, luck, and abundance.",
    "content": "3-4 sentences about their ${jupiter} Jupiter - where they naturally expand and bring joy.",
    "relatable_moment": "A moment that shows their Jupiter abundance.",
    "practicalTip": "How to harness their Jupiter energy.",
    "luckyArea": "The area of life where Jupiter blesses them most."
  },

  "cosmicLessons": {
    "title": "♄ Cosmic Lessons: Discipline & Mastery",
    "planetExplanation": "1-2 sentences on Saturn as the teacher of discipline and boundaries.",
    "content": "3-4 sentences about their ${saturn} Saturn - their lessons, fears, and where they need patience.",
    "relatable_moment": "A moment that shows their Saturn lessons.",
    "practicalTip": "How to support their Saturn growth.",
    "masterLesson": "The one thing they came here to master."
  },

  "memePersonality": {
    "title": "😼 Internet Personality: Their Meme Energy",
    "type": "Choose one: The Chaos Goblin, The Cuddly Dictator, The Dramatic Diva, The Chill Philosopher, The Velcro Shadow, The Chaotic Good, The Snack Assassin, The Couch Potato Royalty, The Adventure Seeker, or The Silent Judge",
    "description": "2-3 sentences explaining why they embody this meme archetype based on their chart",
    "signatureMove": "Their most iconic behavior that captures this energy",
    "relatableQuote": "A funny quote from their perspective that fits this personality"
  },

  "topFiveCrimes": {
    "title": "🚨 Criminal Record: Top 5 Crimes",
    "crimes": [
      "Crime #1 - MUST be specific to ${breed || species} behavior (e.g. a cockapoo's specific crime, not generic 'stole food'). Reference their ${mars} Mars and ${lilith} Lilith.",
      "Crime #2 - Something their breed is KNOWN for doing. Every ${breed || species} owner should nod in recognition.",
      "Crime #3 - Reference a specific astrological placement causing this behavior",
      "Crime #4 - Something so specific to ${breed || species} that owners of other breeds wouldn't fully get it",
      "Crime #5 - The most egregious, most hilarious, most shareable offense. Peak comedy."
    ],
    "verdict": "A humorous one-line verdict on their criminal career"
  },

  "datingProfile": {
    "title": "💕 Dating Profile",
    "headline": "A funny, attention-grabbing headline (like on a dating app)",
    "bio": "A 3-4 sentence dating profile bio written from ${name}'s perspective. Include breed-specific deal-breakers and green flags. A cockapoo's profile would be very different from a husky's. Be funny!",
    "greenFlags": ["3 green flags as a companion — make them breed-specific"],
    "redFlags": ["2 playful 'red flags' that are actually endearing breed-specific quirks"]
  },

  "dreamJob": {
    "title": "💼 Dream Career",
    "job": "If ${name} had a job, what would it be? Make it EPIC and specific. The job should feel inevitable based on their breed + chart combo. A Border Collie with Mars in Virgo has a VERY different career than a Bulldog with Mars in Taurus.",
    "description": "3-4 sentences: why this job suits them (reference Sun, Moon, Mars + breed), how they'd behave at work (funny), and the dramatic reason they'd eventually get fired. Make it hilarious and shareable.",
    "salary": "A funny fictional salary (e.g. '47 treats/hour + unlimited belly rubs' or '6 figures in kibble')"
  },

  "villainOriginStory": {
    "title": "🦹 Villain Origin Story",
    "trigger": "The one thing that turns ${name} into their 'villain mode' (based on their Mars and Lilith)",
    "dramaticResponse": "How they react when triggered - describe the drama",
    "secretMotivation": "The surprisingly sweet reason behind their dramatic behavior",
    "redemptionArc": "How they come back from villain mode (usually involves treats or cuddles)"
  },

  "quirkDecoder": {
    "title": "🔮 Quirk Decoder: Why They Do That Weird Thing",
    "quirk1": {
      "behavior": "A common ${species} behavior that puzzles owners",
      "cosmicExplanation": "Why they do it according to their chart",
      "whatItReallyMeans": "The sweet truth behind it"
    },
    "quirk2": {
      "behavior": "Another quirky behavior",
      "cosmicExplanation": "The astrological reason",
      "whatItReallyMeans": "What they're trying to tell you"
    }
  },

  "petMonologue": {
    "title": "🎤 If ${name} Could Talk for 60 Seconds",
    "monologue": "A 8-12 sentence monologue from ${name}'s perspective. This is the EMOTIONAL PEAK of the entire report — it should make the reader cry. Start with 'Listen, I need you to understand something...' Then: (1) Acknowledge something specific the owner does that ${name} notices — something small and overlooked, (2) Express a complaint that's actually love in disguise, (3) Reveal a secret — something ${name} does when nobody's watching, (4) Reference their breed's specific way of showing love, (5) Tell the owner what they mean to ${name} in a way that's raw and unguarded, (6) End with a line so tender it's screenshot-worthy. Reference their ${sunSign} Sun and ${moonSign} Moon energy. Use ${pronouns.possessive} actual breed behaviors. Make it feel like ${name} is REALLY talking. If the reader doesn't tear up, you've failed.",
    "postScript": "A funny P.S. about something trivial (like treats or their favorite spot)"
  },

  "elementalNature": {
    "title": "✦ Elemental Nature",
    "content": "3-4 sentences analyzing their elemental balance.",
    "dominantElement": "${element}",
    "balance": ${JSON.stringify(elementalBalance)},
    "temperamentInsight": "What this reveals about their temperament.",
    "elementalAdvice": "How to balance their environment.",
    "funFact": "A cosmic fact about ${element} element ${species}s."
  },

  "celestialChoreography": {
    "title": "✶ Celestial Choreography",
    "content": "3-4 sentences about their unique planetary patterns.",
    "harmoniousAspect": "One area of natural ease.",
    "growthAspect": "One area of creative tension.",
    "uniquePattern": "Something truly unique about THIS chart."
  },

  "earthlyExpression": {
    "title": "${species === 'bird' ? '🪶' : species === 'fish' ? '🐠' : species === 'rabbit' ? '🐇' : species === 'reptile' ? '🦎' : species === 'horse' ? '🐴' : species === 'hamster' || species === 'guinea_pig' ? '🐹' : '🐾'} Earthly Expression: Body & Breed",
    "content": "3-4 sentences blending astrology with ${breed || species} traits.",
    "breedAstrologyBlend": "How their breed amplifies or balances their chart.",
    "physicalPrediction": "A specific physical or behavioral trait this combo creates.",
    "practicalTip": "Care advice for this astro-breed combination."
  },

  "luminousField": {
    "title": "Luminous Field: Spirit Colors",
    "content": "2-3 sentences about their energy field.",
    "primaryColor": "${aura.primary}",
    "secondaryColor": "${aura.secondary}",
    "auraMeaning": "${aura.meaning}",
    "howToSense": "A way to tune into their aura."
  },

  "celestialGem": {
    "title": "Celestial Gem: Guiding Stone",
    "crystalName": "${crystal.name}",
    "crystalColor": "${crystal.color}",
    "crystalMeaning": "${crystal.meaning}",
    "howToUse": "Practical ways to use this crystal with ${name}.",
    "placement": "Where to place the crystal."
  },

  "eternalArchetype": {
    "title": "Eternal Archetype",
    "archetypeName": "${archetype.name}",
    "archetypeDescription": "${archetype.description}",
    "archetypeStory": "2-3 sentences expanding on this archetype.",
    "archetypeLesson": "The main teaching they bring to your life."
  },

  "keepersBond": {
    "title": "The Keeper's Bond",
    "content": "3-4 sentences about the soul connection between you.",
    "mirrorQuality": "What ${name} mirrors in you.",
    "soulContract": "The cosmic agreement between you.",
    "dailyRitual": "A simple daily ritual to honor your bond.",
    "affirmation": "An affirmation for your relationship."
  },
${hasSoulBondData ? `
  "petParentSoulBond": {
    "title": "💞 Pet-Parent Soul Bond: ${ownerName || 'You'} & ${name}",
    "intro": "A 2-3 sentence warm introduction to this section. Acknowledge that ${ownerName || 'the reader'} (${ownerSunSign} Sun) and ${name} (${sunSign} Sun) chose each other for a reason. This section is the premium deep-dive into WHY this specific human and this specific pet are cosmically paired.",

    "elementalHarmony": {
      "title": "Elemental Chemistry",
      "petElement": "${element}",
      "ownerElement": "${ownerElement}",
      "harmony": "3-4 sentences analyzing the elemental dynamic between ${element} (${name}) and ${ownerElement} (${ownerName || 'you'}). Are they the same element (deep understanding) or different (complementary growth)? ${element === ownerElement ? 'Same element = instant recognition, shared rhythms, but watch for amplifying each other\u0027s blind spots.' : `${element} meets ${ownerElement} = ${(element === 'Fire' && ownerElement === 'Air') || (element === 'Air' && ownerElement === 'Fire') ? 'natural fuel — Air feeds Fire, Fire inspires Air' : (element === 'Earth' && ownerElement === 'Water') || (element === 'Water' && ownerElement === 'Earth') ? 'nurturing combo — Water nourishes Earth, Earth gives Water form' : (element === 'Fire' && ownerElement === 'Water') || (element === 'Water' && ownerElement === 'Fire') ? 'steam! Intense chemistry with lessons in balance' : (element === 'Earth' && ownerElement === 'Air') || (element === 'Air' && ownerElement === 'Earth') ? 'grounding meets freedom — they teach each other what they need most' : 'a unique dynamic with its own cosmic rhythm'}.`} Use real examples of how this plays out daily.",
      "compatibilityScore": "A percentage 60-99 with a one-line explanation"
    },

    "sunMoonDance": {
      "title": "The Sun-Moon Dance",
      "content": "3-4 sentences about the interplay between ${ownerName || 'your'} Sun (${ownerSunSign}) and ${name}'s Moon (${moonSign}), AND ${name}'s Sun (${sunSign}) and ${ownerName || 'your'} Moon (${ownerMoonSign}). The Sun-Moon cross-connection is the heart of any relationship in astrology. How does ${ownerName || 'your'} core identity (${ownerSunSign} Sun) nurture ${name}'s emotional needs (${moonSign} Moon)? How does ${name}'s personality (${sunSign} Sun) make ${ownerName || 'you'} feel emotionally safe (${ownerMoonSign} Moon)? Be specific about actual daily moments.",
      "crossAspect": "One powerful observation about this Sun-Moon cross-pattern"
    },

    "venusConnection": {
      "title": "Love Languages Compared",
      "petVenus": "${venus}",
      "ownerVenus": "${ownerVenus}",
      "content": "3-4 sentences comparing how ${name} (Venus in ${venus}) and ${ownerName || 'you'} (Venus in ${ownerVenus}) give and receive love. ${venus === ownerVenus ? 'Same Venus = you literally speak the same love language.' : 'Different Venus signs = you show love differently, which can be beautiful once you understand each other\u0027s style.'} Give specific examples: how ${name} shows love as a ${breed || species}, and how ${ownerName || 'you'} probably respond based on ${ownerVenus} Venus. Include one sweet 'you probably don\\'t realize this, but...' moment.",
      "loveLanguageMatch": "A cute one-liner about their love language compatibility"
    },

    "marsEnergy": {
      "title": "Energy & Play Dynamic",
      "petMars": "${mars}",
      "ownerMars": "${ownerMars}",
      "content": "2-3 sentences about how ${name}'s ${mars} Mars energy and ${ownerName || 'your'} ${ownerMars} Mars interact. Do they motivate each other? Does one bring calm to the other's chaos? How does their play/activity dynamic work?",
      "activityMatch": "The perfect shared activity for this Mars combination"
    },

    "soulContract": {
      "title": "The Soul Contract",
      "content": "4-5 sentences about the deeper cosmic agreement between ${ownerName || 'you'} and ${name}. Based on their combined charts: What did they agree to teach each other? What wound does ${name} heal in ${ownerName || 'you'} (look at ${ownerName || 'your'} ${ownerPositions ? ownerPositions.chiron.sign : 'Chiron'} Chiron)? What does ${ownerName || 'your'} presence heal in ${name} (look at ${name}'s ${chiron} Chiron)? This should be the emotional peak of the Soul Bond section — make it deeply moving and specific.",
      "lessonForOwner": "The one thing ${name} came to teach ${ownerName || 'you'}",
      "lessonForPet": "The one thing ${ownerName || 'you'} give ${name} that ${pronouns.subject} couldn't find anywhere else"
    },

    "cosmicRating": {
      "overallScore": "A percentage 75-99 — the cosmic compatibility score",
      "verdict": "A warm, funny 1-2 sentence verdict on this pairing (e.g., '94% — Basically soulmates who argue about bedtime')",
      "strengthAreas": ["3 areas where this pet-parent combo excels — be specific"],
      "growthAreas": ["1-2 areas where they challenge each other in a good way"]
    }
  },
` : ''}
  "shareableCard": {
    "title": "✨ ${name}'s Cosmic Summary",
    "cosmicNickname": "Same nickname from earlier",
    "sixKeyTraits": ["6 key personality traits, each 2-3 words max"],
    "signatureLine": "A one-sentence memorable description perfect for sharing",
  "zodiacEmoji": "A relevant emoji combo for their sign"
  },

  "basedOnYourAnswers": {
    "title": "📋 Based on Your Answers",
    "intro": "Here's how everything you told us shaped ${name}'s cosmic portrait:",
    "mappings": [
      {
        "question": "Name",
        "yourAnswer": "${name}",
        "usedFor": "Name numerology (vibration ${nameVibration}), cosmic nickname generation, and personalized language throughout the report"
      },
      {
        "question": "Species & Breed",
        "yourAnswer": "${breed || species}",
        "usedFor": "Species-specific personality insights, breed trait integration in the Earthly Expression section, and tailored care recommendations"
      },
      {
        "question": "Gender",
        "yourAnswer": "${gender === 'boy' ? 'Male' : 'Female'}",
        "usedFor": "Pronoun usage throughout the report and archetype selection (${archetype.name})"
      },
      {
        "question": "Date of Birth",
        "yourAnswer": "${dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}",
        "usedFor": "All planetary calculations - Sun sign (${sunSign}), Moon sign (${moonSign}), and all planetary placements"
      },
      {
        "question": "Birth Time",
        "yourAnswer": "${birthTime || 'Not provided (using noon estimate)'}",
        "usedFor": "${birthTime ? 'Precise Moon sign calculation and accurate Rising sign (Ascendant)' : 'Moon sign has ±1 sign variance, Rising sign defaults to Sun sign'}"
      },
      {
        "question": "Birth Location",
        "yourAnswer": "${location || 'Not provided'}",
        "usedFor": "${location ? 'True Ascendant (Rising sign) calculation based on geographic coordinates' : 'Rising sign defaults to Sun sign without location'}"
      },
      {
        "question": "Soul Type",
        "yourAnswer": "${ownerInsights.soulType || 'Not selected'}",
        "usedFor": "Archetype refinement, personality descriptions, and Soul Snapshot insights"
      },
      {
        "question": "Superpower",
        "yourAnswer": "${ownerInsights.superpower || 'Not selected'}",
        "usedFor": "Hidden gift section, healing abilities, and what makes them special"
      },
      {
        "question": "Stranger Reaction",
        "yourAnswer": "${ownerInsights.strangerReaction || 'Not selected'}",
        "usedFor": "Rising sign/First Impressions section - how others perceive ${name}"
      }
    ],
    "accuracyNote": "💡 The more details you provide (especially birth time and location), the more accurate the Moon and Rising sign calculations become!"
  },

  "accuracyMoments": {
    "title": "🎯 Did We Get It Right?",
    "predictions": [
      "A specific behavioral prediction based on their ${sunSign} Sun sign + ${breed || species} breed. ${isMemorial ? `Use PAST TENSE: 'We bet ${name} used to do THIS when...'` : `Use PRESENT TENSE: 'We bet ${name} does THIS when...'`} CRITICAL: Use ${pronouns.subject}/${pronouns.possessive}/${pronouns.object} pronouns, NEVER they/their/them.",
      "A specific emotional pattern prediction based on their ${moonSign} Moon sign. Use ${pronouns.subject}/${pronouns.possessive} pronouns ONLY. ${isMemorial ? 'PAST TENSE.' : ''}",
      "A specific quirk prediction based on their ${mars} Mars + ${breed || species} combo. Use ${pronouns.subject}/${pronouns.possessive} pronouns ONLY. ${isMemorial ? 'PAST TENSE.' : ''}",
      "A specific social behavior prediction based on their ${ascendant} Rising sign. Use ${pronouns.subject}/${pronouns.possessive} pronouns ONLY. ${isMemorial ? 'PAST TENSE.' : ''}",
      "A specific comfort-seeking behavior based on their ${venus} Venus sign. Use ${pronouns.subject}/${pronouns.possessive} pronouns ONLY. ${isMemorial ? 'PAST TENSE.' : ''}"
    ],
    "callToAction": "Share which ones were scarily accurate — tag us @mypetssoul"
  },

  "epilogue": "A 5-6 sentence closing that weaves together ${name}'s key placements into a final, powerful message. Reference their ${sunSign} Sun, ${moonSign} Moon, and ${ascendant} Rising specifically. ${occasionMode === 'memorial' ? 'Use PAST TENSE. End with a message about eternal connection that provides genuine comfort.' : 'Use PRESENT TENSE — not \"came into your life\" but \"is in your life RIGHT NOW\". Not \"chose you\" but \"is here because...\". This is a culmination of everything they just discovered.'} For discover mode: end with a line that makes the owner see their pet differently — more deeply, more magically. For birthday: end with a cosmic blessing for the year ahead. For gift: end with a message about the cosmic bond between ${name} and their person. The last sentence should be the most quotable line in the entire report — something they'd put on a wall. NEVER write 'your owner' — the reader IS the owner. Address them as 'you'.",

  "compatibilityNotes": {
    "bestPlaymates": ["Two zodiac signs that would be great playmate matches"],
    "challengingEnergies": ["One sign that might need more adjustment"],
    "humanCompatibility": "Which human zodiac signs ${name} vibes best with"
  },

  "luckyElements": {
    "luckyNumber": "A number 1-9",
    "luckyDay": "Day of the week",
    "luckyColor": "A color",
    "powerTime": "Time of day when they're most energetic"
  },

  "cosmicRecipe": {
    "name": "A fun, creative recipe name inspired by ${name}'s personality — this is a PET-SAFE treat recipe",
    "emoji": "A food emoji that matches",
    "description": "1-2 sentences about why this recipe captures ${name}'s cosmic energy",
    "element": "${element}",
    "servings": "Makes 10-12 treats",
    "prepTime": "A realistic prep time",
    "ingredients": ["6-8 PET-SAFE ingredients ONLY. For ${species}: use ingredients like pumpkin, peanut butter (xylitol-free), oats, banana, sweet potato, blueberries, carrots, plain yogurt, coconut oil, eggs, rice flour. NEVER use: chocolate, xylitol, grapes/raisins, onion, garlic, macadamia nuts, avocado, caffeine, alcohol, or artificial sweeteners."],
    "steps": ["4-6 clear steps to make the treats"],
    "cosmicNote": "A whimsical note about how ${name} would react to this treat"
  },

  "textMessages": {
    "morning": {
      "pet": ["2 funny morning texts FROM ${name} to their human — written in first person as ${name}. Include ${species}-specific humor. Make them hilarious and shareable."],
      "human": ["1 loving reply from the human"]
    },
    "afternoon": {
      "pet": ["2 funny afternoon texts FROM ${name} — maybe about their day, complaints, demands"],
      "human": ["1 amused reply"]
    },
    "night": {
      "pet": ["2 funny bedtime texts FROM ${name} — maybe guilt trips, dramatic goodnight, demands"],
      "human": ["1 warm reply"]
    }
  }
}

IMPORTANT CONTENT QUALITY RULES:

OVERDELIVERY STANDARD — This report must feel like it's worth 10x what they paid. Every section should make them think "this is insane, how does it know this?"

1. TEXT MESSAGES — Write like REAL iMessage conversations. Short messages. Typos optional. Pet texts should be in their "voice" (a cat texts very differently from a golden retriever). Examples of GOOD pet texts: "hey. HEY. you awake?" / "i can hear the treat bag from two rooms away don't even try" / "you left me alone for 47 minutes. i have filed for emotional damages." Examples of BAD: "Dear human, I wish to express my displeasure..." (too formal, not how texts work)

2. DREAM JOB — Make the salary FUNNY (e.g., "85,000 treats/year + dental" or "6 figures in belly rubs"). The description should paint a vivid picture of them AT the job, not just describe the job. Include a funny reason they'd get promoted AND fired.

3. RECIPE — This MUST be a real, makeable PET TREAT recipe. Use actual measurements. The pet should be able to safely eat this. Think: peanut butter oat balls, sweet potato chews, frozen banana bites. NOT human recipes like shortbread or lattes.

4. COSMIC CRIMES — Each crime needs a "charge" (the crime name), a "severity" rating, and a vivid 1-2 sentence description. They should be hyper-specific to ${breed || species} behaviors that owners will recognize instantly.

5. DATING PROFILE — Write it like an ACTUAL dating app profile. The headline should be punchy (under 8 words). The bio should be first-person from ${name}'s perspective.

6. VILLAIN ORIGIN — This should read like a dramatic movie trailer narrator. "It started with a closed door..."

7. EMOTIONAL SECTIONS — The prologue, keepersBond, and epilogue should make people CRY. Use specific, intimate details about the pet-owner relationship. Not generic "they love you" but "the way ${name} presses ${pronouns.possessive} head into your palm when you're sad — that's not random. That's ${pronouns.possessive} ${moonSign} Moon, reading your energy and responding with exactly what you need."

8. GOOGLE SEARCHES — Make them absurdly funny and specific. Not "why does my human leave" but "how to open fridge without thumbs" / "am i adopted" / "why does the mailman keep coming back i clearly scared him away yesterday"

9. YELP REVIEWS — These should be reviews of real things (the vet, the car ride, bath time, the vacuum) written from ${name}'s perspective as if they're a disgruntled Yelp reviewer. Star ratings included.

10. NARRATIVE THREAD — The ENTIRE report should feel like one cohesive story. The prologue introduces a theme. Each chapter builds on it. The epilogue brings it home. If ${name} is described as a "gentle old soul" in the prologue, that thread should weave through every section.`;

  // ─── Call OpenRouter (non-streaming) ───────────────────────────────────────

  console.log("[WORKER] Calling OpenRouter (non-streaming)...");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://littlesouls.app",
      "X-Title": "Little Souls Reading",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4.5",
      max_tokens: 24000,
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  // ─── Fallback report builder (identical to edge function) ──────────────────

  const createFallbackReport = () => ({
    chartPlacements,
    elementalBalance,
    dominantElement: element,
    crystal,
    aura,
    archetype,
    nameMeaning: {
      title: `📛 The Name '${name}' Decoded`,
      origin: `The name "${name}" carries unique vibrational energy. While its exact etymology varies, names that sound like this often have roots in ${nameVibration <= 3 ? 'ancient languages symbolizing strength and beginnings' : nameVibration <= 6 ? 'words meaning harmony, nurturing, or creativity' : 'mystical traditions connected to wisdom and intuition'}.`,
      cosmicSignificance: `Interestingly, ${name}'s name resonates perfectly with their ${sunSign} Sun energy. The vibrational quality of these letters aligns with ${element} element attributes, suggesting their name was cosmically chosen to match their soul blueprint.`,
      nameVibration: nameVibration,
      numerologyMeaning: `Their name vibration number ${nameVibration} represents ${vibrationMeanings[nameVibration] || 'Unique Energy'}. This influences their destiny and how they connect with the world around them.`,
      funFact: `Did their personality match the name, or did the name shape who they became? With ${name}, the cosmos suggests it was written in the stars from the start.`
    },
    prologue: `In the vast tapestry of the cosmos, on ${dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, the stars aligned to bring ${name} into this world. With the Sun blazing through ${sunSign} and the Moon's gentle light filtering through ${moonSign}, a unique soul was born—one destined to bring ${element} energy and ${archetype.name.toLowerCase()} wisdom into your life.`,
    solarSoulprint: {
      title: `Solar Soulprint: The Light They ${occasionMode === 'memorial' ? 'Brought' : 'Bring'}`,
      content: `As a ${sunSign} Sun, ${name} carries the core essence of ${signTraits[sunSign].split(',').slice(0, 3).join(', ')}. This ${element} sign gives them a natural ${element === 'Fire' ? 'warmth and enthusiasm' : element === 'Earth' ? 'groundedness and reliability' : element === 'Air' ? 'curiosity and playfulness' : 'emotional depth and intuition'} that defines who they are at their core.`,
      whyThisMatters: `In astrology, the Sun represents your pet's essential identity—their ego, vitality, and the core traits that make them who they are.`,
      practicalTip: `Honor their ${sunSign} nature by providing plenty of ${element === 'Fire' ? 'active play and new adventures' : element === 'Earth' ? 'routine and comfortable spaces' : element === 'Air' ? 'mental stimulation and social interaction' : 'quiet bonding time and emotional connection'}.`,
      funFact: `${sunSign} pets are known for their ${signTraits[sunSign].split(',')[0].toLowerCase()} nature—you may have noticed this from day one!`
    },
    lunarHeart: {
      title: `Lunar Heart: The Way They ${occasionMode === 'memorial' ? 'Felt' : 'Feel'} Love`,
      content: `With the Moon in ${moonSign}, ${name}'s emotional world is colored by ${signTraits[moonSign].split(',').slice(0, 3).join(', ')}. This placement reveals how they process feelings, find comfort, and what makes them feel truly safe and loved.`,
      whyThisMatters: `The Moon in astrology governs emotions, instincts, and what we need to feel secure. For pets, this is especially important as they're such emotionally intelligent beings.`,
      practicalTip: `When ${name} seems stressed, try ${getElement(moonSign) === 'Fire' ? 'gentle play to redirect energy' : getElement(moonSign) === 'Earth' ? 'their favorite cozy spot with familiar items' : getElement(moonSign) === 'Air' ? 'a change of scenery or new sounds' : 'quiet, close physical contact'}.`,
      interactiveChallenge: `This week, try spending 10 minutes in silent companionship with ${name}, just being present. Notice how they respond to this ${moonSign} Moon-honoring practice.`
    },
    cosmicCuriosity: {
      title: "Cosmic Curiosity: Thoughts, Signals & Play",
      content: `Mercury in ${mercury} gives ${name} a ${signTraits[mercury].split(',').slice(0, 2).join(' and ')} mind. This influences how they learn, communicate, and process the world around them.`,
      whyThisMatters: `Mercury rules communication and thought processes. In pets, this shows in how they learn tricks, respond to commands, and express their needs.`,
      practicalTip: `Train ${name} using ${getElement(mercury) === 'Fire' ? 'short, enthusiastic sessions with lots of praise' : getElement(mercury) === 'Earth' ? 'consistent, patient repetition with treats' : getElement(mercury) === 'Air' ? 'varied, playful methods that keep it interesting' : 'gentle, intuitive guidance with emotional rewards'}.`,
      funFact: `${species}s with Mercury in ${mercury} often show their intelligence through ${getModality(mercury) === 'Cardinal' ? 'taking initiative' : getModality(mercury) === 'Fixed' ? 'their remarkable memory' : 'their adaptability to new situations'}.`
    },
    harmonyHeartbeats: {
      title: "Harmony & Heartbeats: Their Love Language",
      content: `Venus in ${venus} shapes how ${name} gives and receives love. They express affection in ${signTraits[venus].split(',').slice(0, 2).join(' and ')} ways, and appreciate beauty and harmony in their environment.`,
      whyThisMatters: `Venus governs love, pleasure, and connection. Understanding your pet's Venus sign helps you speak their love language fluently.`,
      practicalTip: `To make ${name} feel most loved, focus on ${getElement(venus) === 'Fire' ? 'enthusiastic praise and exciting activities together' : getElement(venus) === 'Earth' ? 'physical comfort, treats, and consistent presence' : getElement(venus) === 'Air' ? 'playful interaction and social time' : 'emotional attunement and gentle affection'}.`,
      loveLanguageType: getElement(venus) === 'Fire' ? 'Words of Affirmation' : getElement(venus) === 'Earth' ? 'Physical Touch' : getElement(venus) === 'Air' ? 'Quality Time' : 'Acts of Service'
    },
    spiritOfMotion: {
      title: "Spirit of Motion: Fire, Focus & Instinct",
      content: `Mars in ${mars} fuels ${name}'s energy, drive, and play style. This placement shows how they assert themselves, pursue what they want, and channel their physical energy.`,
      whyThisMatters: `Mars represents energy, motivation, and how we go after what we want. It reveals your pet's activity needs and natural instincts.`,
      practicalTip: `The best exercise for ${name}'s Mars in ${mars} is ${getElement(mars) === 'Fire' ? 'high-energy games like fetch or running' : getElement(mars) === 'Earth' ? 'steady walks and foraging activities' : getElement(mars) === 'Air' ? 'varied activities and exploration' : 'swimming or gentle, flowing movement'}.`,
      energyLevel: `${getElement(mars) === 'Fire' ? '8' : getElement(mars) === 'Earth' ? '5' : getElement(mars) === 'Air' ? '7' : '6'}/10 - ${getElement(mars) === 'Fire' ? 'High energy bursts' : getElement(mars) === 'Earth' ? 'Steady and sustainable' : getElement(mars) === 'Air' ? 'Variable and curious' : 'Emotionally-driven energy'}`
    },
    starlitGaze: {
      title: "Starlit Gaze: First Impressions & Aura",
      content: `With ${ascendant} Rising, ${name} presents a ${signTraits[ascendant].split(',').slice(0, 2).join(' and ')} first impression to the world. This is the mask they wear and how strangers perceive them.`,
      whyThisMatters: `The Ascendant is the zodiac sign that was rising on the eastern horizon at birth. It shapes outward appearance and first impressions.`,
      practicalTip: `When introducing ${name} to new people, remember they come across as ${signTraits[ascendant].split(',')[0]}. Give them ${getElement(ascendant) === 'Fire' ? 'time to shine' : getElement(ascendant) === 'Earth' ? 'space to warm up at their pace' : getElement(ascendant) === 'Air' ? 'room to be social on their terms' : 'quiet time to sense the new energy'}.`,
      firstImpressionPrediction: `People likely see ${name} as ${signTraits[ascendant].split(',').slice(0, 2).join(' and ')} upon first meeting.`
    },
    destinyCompass: {
      title: "Destiny Compass: Growth & Soul Lessons",
      content: `The North Node in ${northNode} points to ${name}'s soul growth direction. They're learning to embrace ${signTraits[northNode].split(',').slice(0, 2).join(' and ')} qualities in this lifetime.`,
      southNode,
      pastLifeHint: `${name}'s South Node in ${southNode} suggests a soul familiar with ${signTraits[southNode].split(',').slice(0, 2).join(' and ')} qualities—perhaps from past experiences that shaped their instincts.`,
      growthOpportunity: `The main soul lesson for ${name} is learning to embrace ${signTraits[northNode].split(',')[0]} while balancing their natural ${signTraits[southNode].split(',')[0]} tendencies.`,
      practicalTip: `Support ${name}'s soul evolution by gently encouraging ${signTraits[northNode].split(',')[0].toLowerCase()} situations and celebrating when they step outside their comfort zone.`
    },
    gentleHealer: {
      title: "Gentle Healer: Wounds, Wisdom & Empathy",
      content: `Chiron in ${chiron} reveals ${name}'s unique healing gifts and vulnerabilities. Often called the "wounded healer," this placement shows how they heal others while working through their own sensitivities.`,
      whyThisMatters: `Chiron represents our deepest wounds and our greatest capacity to heal others. Pets are natural healers, and this placement shows their specific gift.`,
      healingGift: `${name} heals others through ${getElement(chiron) === 'Fire' ? 'inspiring courage and enthusiasm' : getElement(chiron) === 'Earth' ? 'grounding presence and practical comfort' : getElement(chiron) === 'Air' ? 'lifting spirits and providing perspective' : 'emotional attunement and deep empathy'}.`,
      vulnerabilityNote: `Be gentle with ${name} around ${getElement(chiron) === 'Fire' ? 'situations that challenge their confidence' : getElement(chiron) === 'Earth' ? 'sudden changes to routine or environment' : getElement(chiron) === 'Air' ? 'feeling isolated or misunderstood' : 'emotional overwhelm or harsh energies'}.`
    },
    wildSpirit: {
      title: "Wild Spirit: Freedom, Mystery & Power",
      content: `Black Moon Lilith in ${lilith} represents ${name}'s untamed essence—the part of them that's wild, free, and refuses to be controlled. This is their mysterious, powerful shadow side.`,
      whyThisMatters: `Lilith represents our raw, primal nature—the instincts that exist beneath socialization. In pets, this is often beautifully pure and unfiltered.`,
      secretDesire: `Deep down, ${name} craves ${getElement(lilith) === 'Fire' ? 'freedom to express their full, unrestrained energy' : getElement(lilith) === 'Earth' ? 'security and the freedom to enjoy earthly pleasures' : getElement(lilith) === 'Air' ? 'mental freedom and authentic self-expression' : 'emotional depth and soul-level connection'}.`,
      practicalTip: `Honor ${name}'s wild spirit by ${getElement(lilith) === 'Fire' ? 'letting them have adventures and be bold' : getElement(lilith) === 'Earth' ? 'allowing indulgent comfort rituals' : getElement(lilith) === 'Air' ? 'respecting their need for independence' : 'making space for their emotional intensity'}.`
    },
    elementalNature: {
      title: "Elemental Nature: Fire, Earth, Air, Water",
      content: `${name}'s chart is dominated by ${element} energy (${elementalBalance[element as keyof typeof elementalBalance]}%), giving them a ${element === 'Fire' ? 'warm, passionate, and action-oriented' : element === 'Earth' ? 'grounded, practical, and sensory-focused' : element === 'Air' ? 'curious, social, and mentally active' : 'intuitive, emotional, and deeply feeling'} temperament.`,
      dominantElement: element,
      balance: elementalBalance,
      temperamentInsight: `With ${Object.entries(elementalBalance).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([e, p]) => `${p}% ${e}`).join(', ')}, ${name} is ${element === 'Fire' ? 'spirited and energetic' : element === 'Earth' ? 'steady and reliable' : element === 'Air' ? 'playful and curious' : 'sensitive and intuitive'}.`,
      elementalAdvice: `To balance their elemental nature, try introducing more ${Object.entries(elementalBalance).sort((a, b) => (a[1] as number) - (b[1] as number))[0][0].toLowerCase()} activities: ${Object.entries(elementalBalance).sort((a, b) => (a[1] as number) - (b[1] as number))[0][0] === 'Fire' ? 'energizing play' : Object.entries(elementalBalance).sort((a, b) => (a[1] as number) - (b[1] as number))[0][0] === 'Earth' ? 'grounding routines' : Object.entries(elementalBalance).sort((a, b) => (a[1] as number) - (b[1] as number))[0][0] === 'Air' ? 'mental stimulation' : 'emotional bonding'}.`
    },
    celestialChoreography: {
      title: "Celestial Choreography: How Their Stars Dance",
      content: `The planets in ${name}'s chart create a unique cosmic dance. Their ${sunSign} Sun and ${moonSign} Moon ${getElement(sunSign) === getElement(moonSign) ? 'harmonize beautifully' : 'create dynamic tension'}, while their ${ascendant} Rising adds another layer to this celestial symphony.`,
      harmoniousAspect: `The connection between their ${sunSign} Sun and ${moonSign} Moon creates ${getElement(sunSign) === getElement(moonSign) ? 'natural inner harmony' : 'creative friction that drives growth'}.`,
      growthAspect: `The interplay between their Mars in ${mars} and Venus in ${venus} shapes their balance of action and connection.`,
      uniquePattern: `The combination of ${sunSign} Sun, ${moonSign} Moon, and ${ascendant} Rising is relatively rare—making ${name} truly one of a kind.`
    },
    earthlyExpression: {
      title: "Earthly Expression: Body, Breed & Being",
      content: `As a ${breed || species} with ${sunSign} Sun energy, ${name} expresses their cosmic nature through their physical form and breed-specific traits.`,
      breedAstrologyBlend: `The ${breed || species} traits ${element === 'Fire' ? 'amplify their natural enthusiasm and boldness' : element === 'Earth' ? 'complement their grounded, steady nature' : element === 'Air' ? 'enhance their curiosity and social nature' : 'deepen their emotional sensitivity'}.`,
      physicalPrediction: `You may notice ${name} has a ${element === 'Fire' ? 'particularly alert, forward-leaning posture' : element === 'Earth' ? 'solid, comfortable presence' : element === 'Air' ? 'quick, observant way of taking in their environment' : 'gentle, flowing quality to their movements'}.`,
      practicalTip: `Care for ${name}'s ${breed || species} body with ${element}-appropriate activities and nutrition.`
    },
    luminousField: {
      title: "Luminous Field: The Colors of Their Spirit",
      content: `${name}'s aura radiates with ${aura.meaning}. This energetic signature is visible to those who know how to look.`,
      primaryColor: aura.primary,
      secondaryColor: aura.secondary,
      auraMeaning: aura.meaning,
      howToSense: `To tune into ${name}'s aura, soften your gaze around them in natural light and notice the subtle colors or feelings you perceive.`
    },
    celestialGem: {
      title: "Celestial Gem: Their Guiding Stone",
      crystalName: crystal.name,
      crystalColor: crystal.color,
      crystalMeaning: crystal.meaning,
      howToUse: `Place ${crystal.name} near ${name}'s sleeping area or hold it while spending quality time together to amplify its benefits.`,
      placement: `The ideal placement is near their bed or favorite resting spot, where its gentle energy can support them.`
    },
    eternalArchetype: {
      title: "Eternal Archetype: The Role Their Soul Plays",
      archetypeName: archetype.name,
      archetypeDescription: archetype.description,
      archetypeStory: `${name} embodies ${archetype.name} archetype—${archetype.description}. This is the mythic role their soul plays in your life story.`,
      archetypeLesson: `${archetype.name} teaches you about ${element === 'Fire' ? 'courage, passion, and living fully' : element === 'Earth' ? 'patience, presence, and earthly wisdom' : element === 'Air' ? 'curiosity, connection, and playfulness' : 'intuition, emotion, and the depths of love'}.`
    },
    keepersBond: {
      title: "The Keeper's Bond: Caring for a Cosmic Soul",
      content: `You and ${name} found each other for a reason. Your souls recognized something essential in one another—a cosmic contract written in the stars.`,
      mirrorQuality: `${name} mirrors your own ${signTraits[sunSign].split(',')[0].toLowerCase()} nature, helping you see and embrace this quality in yourself.`,
      soulContract: `Your cosmic agreement is about ${element === 'Fire' ? 'inspiring each other to live boldly and joyfully' : element === 'Earth' ? 'teaching each other about grounded presence and simple pleasures' : element === 'Air' ? 'learning together through curiosity and communication' : 'deepening emotional awareness and unconditional love'}.`,
      dailyRitual: `Each day, take a moment to look into ${name}'s eyes and silently acknowledge the soul you see there. This simple practice strengthens your cosmic bond.`,
      affirmation: `"${name} and I are cosmically connected. Our bond transcends time and space, written in the language of the stars."`
    },
    ...(hasSoulBondData ? {
      petParentSoulBond: {
        title: `💞 Pet-Parent Soul Bond: ${ownerName || 'You'} & ${name}`,
        intro: `${ownerName || 'You'} (${ownerSunSign} Sun) and ${name} (${sunSign} Sun) share a cosmic connection that runs deeper than either of you may realize. The stars brought you together for a reason.`,
        elementalHarmony: {
          title: "Elemental Chemistry",
          petElement: element,
          ownerElement: ownerElement,
          harmony: `${name}'s ${element} energy ${element === ownerElement ? `harmonizes naturally with your shared ${element} nature — you understand each other instinctively` : `meets your ${ownerElement} energy in a complementary dance — what one lacks, the other provides`}. This elemental pairing creates a home environment that feels balanced and whole.`,
          compatibilityScore: `${element === ownerElement ? '92' : '85'}% — ${element === ownerElement ? 'Same element soulmates' : 'Complementary cosmic pair'}`
        },
        sunMoonDance: {
          title: "The Sun-Moon Dance",
          content: `Your ${ownerSunSign} Sun illuminates ${name}'s ${moonSign} Moon, creating a natural caretaker dynamic. Meanwhile, ${name}'s ${sunSign} Sun warms your ${ownerMoonSign} Moon, providing exactly the emotional comfort you need. This cross-connection is the heart of your bond.`,
          crossAspect: `The ${ownerSunSign}-${moonSign} axis reveals why ${name} always seems to know when you need comfort.`
        },
        venusConnection: {
          title: "Love Languages Compared",
          petVenus: venus,
          ownerVenus: ownerVenus,
          content: `${name} expresses love through ${venus} Venus energy — ${getElement(venus) === 'Fire' ? 'enthusiastic demonstrations' : getElement(venus) === 'Earth' ? 'physical closeness and loyalty' : getElement(venus) === 'Air' ? 'playful engagement' : 'deep emotional attunement'}. Your ${ownerVenus} Venus ${venus === ownerVenus ? 'speaks the exact same language' : 'adds a complementary dimension to how you connect'}.`,
          loveLanguageMatch: `${venus === ownerVenus ? 'Perfect match — you love the same way' : `${venus} meets ${ownerVenus} — beautifully complementary`}`
        },
        marsEnergy: {
          title: "Energy & Play Dynamic",
          petMars: mars,
          ownerMars: ownerMars,
          content: `${name}'s ${mars} Mars energy ${mars === ownerMars ? 'perfectly matches your pace' : 'creates a dynamic balance with your ' + ownerMars + ' Mars'}. Together, you find a natural rhythm for play, rest, and adventure.`,
          activityMatch: `${getElement(mars) === 'Fire' || getElement(ownerMars) === 'Fire' ? 'Outdoor adventures and high-energy play' : getElement(mars) === 'Earth' || getElement(ownerMars) === 'Earth' ? 'Nature walks and cozy evening routines' : getElement(mars) === 'Air' || getElement(ownerMars) === 'Air' ? 'Exploring new places and puzzle games' : 'Quiet bonding and intuitive play'}`
        },
        soulContract: {
          title: "The Soul Contract",
          content: `You and ${name} made a cosmic agreement before either of you arrived here. ${name}'s ${chiron} Chiron holds the key to healing something deep within you, while your presence gives ${name} the ${getElement(ownerElement) === 'Fire' ? 'courage' : getElement(ownerElement) === 'Earth' ? 'stability' : getElement(ownerElement) === 'Air' ? 'freedom' : 'emotional depth'} ${pronouns.subject} needs to fully blossom. This isn't just pet ownership — it's a soul partnership.`,
          lessonForOwner: `${name} teaches you about ${getElement(element) === 'Fire' ? 'living with abandon and pure joy' : getElement(element) === 'Earth' ? 'being present and finding peace in simplicity' : getElement(element) === 'Air' ? 'staying curious and embracing change' : 'trusting your emotions and loving without walls'}.`,
          lessonForPet: `You give ${name} ${getElement(ownerElement) === 'Fire' ? 'the confidence to be fully themselves' : getElement(ownerElement) === 'Earth' ? 'the security of knowing they are home' : getElement(ownerElement) === 'Air' ? 'the freedom to explore and be independent' : 'the emotional safety to be vulnerable'}.`
        },
        cosmicRating: {
          overallScore: `${element === ownerElement ? '94' : '88'}%`,
          verdict: `${element === ownerElement ? '94% — Basically cosmic twins who finish each other\u0027s thoughts' : '88% — The perfect complementary pair, better together than apart'}`,
          strengthAreas: [
            "Emotional understanding",
            `Shared ${element === ownerElement ? element : element + '/' + ownerElement} energy rhythm`,
            "Intuitive communication"
          ],
          growthAreas: [
            `${element === ownerElement ? 'Balancing your shared blind spots' : 'Learning each other\u0027s different pace'}`
          ]
        }
      }
    } : {}),
    cosmicExpansion: {
      title: "♃ Cosmic Expansion: Growth & Abundance",
      planetExplanation: "Jupiter is the planet of expansion, luck, and abundance — it shows where your pet naturally grows and thrives.",
      content: `With Jupiter in ${jupiter}, ${name} naturally expands and brings joy through ${getElement(jupiter) === 'Fire' ? 'enthusiastic adventures and bold exploration' : getElement(jupiter) === 'Earth' ? 'steady growth and material comforts' : getElement(jupiter) === 'Air' ? 'social connections and curious discovery' : 'emotional depth and intuitive wisdom'}.`,
      relatable_moment: `Watch for ${name}'s Jupiter energy when they ${getElement(jupiter) === 'Fire' ? 'throw themselves into something new with total abandon' : getElement(jupiter) === 'Earth' ? 'find the comfiest spot and settle in like royalty' : getElement(jupiter) === 'Air' ? 'make a new friend within seconds' : 'seem to sense exactly what you need'}.`,
      practicalTip: `Harness their Jupiter in ${jupiter} by providing ${getElement(jupiter) === 'Fire' ? 'new experiences and freedom to explore' : getElement(jupiter) === 'Earth' ? 'luxurious comforts and nature time' : getElement(jupiter) === 'Air' ? 'variety and social opportunities' : 'emotional bonding and peaceful environments'}.`,
      luckyArea: `${getElement(jupiter) === 'Fire' ? 'Adventures and new experiences' : getElement(jupiter) === 'Earth' ? 'Comfort and material well-being' : getElement(jupiter) === 'Air' ? 'Friendships and social connections' : 'Emotional bonds and intuition'}`
    },
    cosmicLessons: {
      title: "♄ Cosmic Lessons: Discipline & Mastery",
      planetExplanation: "Saturn is the cosmic teacher — it reveals where your pet faces challenges and ultimately masters important life lessons.",
      content: `Saturn in ${saturn} gives ${name} lessons in ${getElement(saturn) === 'Fire' ? 'patience with their own energy and impulses' : getElement(saturn) === 'Earth' ? 'flexibility when routines are disrupted' : getElement(saturn) === 'Air' ? 'focusing their scattered curiosity' : 'managing emotional overwhelm'}.`,
      relatable_moment: `You might notice ${name}'s Saturn lessons when they ${getElement(saturn) === 'Fire' ? 'try to be patient but can barely contain themselves' : getElement(saturn) === 'Earth' ? 'get thrown off by an unexpected change' : getElement(saturn) === 'Air' ? 'struggle to settle on one thing' : 'withdraw when feelings get too big'}.`,
      practicalTip: `Support their Saturn growth by ${getElement(saturn) === 'Fire' ? 'gently teaching impulse control with positive reinforcement' : getElement(saturn) === 'Earth' ? 'introducing small changes gradually' : getElement(saturn) === 'Air' ? 'creating structured play that channels their curiosity' : 'providing a safe space for emotional processing'}.`,
      masterLesson: `${getElement(saturn) === 'Fire' ? 'Patience and directed energy' : getElement(saturn) === 'Earth' ? 'Adaptability within structure' : getElement(saturn) === 'Air' ? 'Focus and commitment' : 'Emotional resilience'}`
    },
    accuracyMoments: {
      title: "🎯 Did We Get It Right?",
      predictions: [
        `We bet ${name} does something very ${sunSign}-like when they're excited — ${getElement(sunSign) === 'Fire' ? 'full-body enthusiasm that knocks things over' : getElement(sunSign) === 'Earth' ? 'a slow, deliberate approach with maximum dignity' : getElement(sunSign) === 'Air' ? 'bouncing between five things at once' : 'an intense stare followed by a dramatic gesture'}.`,
        `When ${name} is feeling emotional, their ${moonSign} Moon means they probably ${getElement(moonSign) === 'Fire' ? 'demand attention loudly and immediately' : getElement(moonSign) === 'Earth' ? 'seek out their favorite comfort object or spot' : getElement(moonSign) === 'Air' ? 'pace around restlessly until someone notices' : 'become extra clingy and won\'t leave your side'}.`,
        `With Mars in ${mars}, ${name} probably ${getElement(mars) === 'Fire' ? 'plays so hard they exhaust themselves' : getElement(mars) === 'Earth' ? 'has a stubborn streak a mile wide' : getElement(mars) === 'Air' ? 'invents their own games with elaborate rules' : 'channels energy through emotional intensity'}.`,
        `Their ${ascendant} Rising means strangers probably think ${name} is ${signTraits[ascendant].split(',')[0].toLowerCase()} when they first meet — are we right?`,
        `Venus in ${venus} suggests ${name} shows love by ${getElement(venus) === 'Fire' ? 'being your enthusiastic personal cheerleader' : getElement(venus) === 'Earth' ? 'physical closeness and wanting to be touching you always' : getElement(venus) === 'Air' ? 'bringing you things and showing off for your attention' : 'staring deep into your eyes like they can read your soul'}.`
      ],
      callToAction: "Share which ones were scarily accurate — tag us @mypetssoul"
    },
    epilogue: `As the stars continue their eternal dance across the night sky, know that ${name}'s light—unique, precious, and irreplaceable—shines on forever. With their ${sunSign} Sun illuminating their core, their ${moonSign} Moon guiding their heart, and their ${ascendant} Rising shaping how they meet the world, ${name} is a cosmic masterpiece unlike any other. May this portrait serve as a reminder of the extraordinary soul who shares your journey, and may your bond continue to deepen with each passing day. In the grand tapestry of the universe, your connection to ${name} is a thread of pure gold—woven by destiny, strengthened by love, and eternal in its brilliance. 🌟`,
    compatibilityNotes: {
      bestPlaymates: [
        element === 'Fire' ? 'Leo' : element === 'Earth' ? 'Virgo' : element === 'Air' ? 'Gemini' : 'Pisces',
        element === 'Fire' ? 'Sagittarius' : element === 'Earth' ? 'Capricorn' : element === 'Air' ? 'Aquarius' : 'Scorpio'
      ],
      challengingEnergies: [
        element === 'Fire' ? 'Cancer' : element === 'Earth' ? 'Aquarius' : element === 'Air' ? 'Taurus' : 'Aries'
      ],
      humanCompatibility: `${name} vibes especially well with ${element} sign humans (${element === 'Fire' ? 'Aries, Leo, Sagittarius' : element === 'Earth' ? 'Taurus, Virgo, Capricorn' : element === 'Air' ? 'Gemini, Libra, Aquarius' : 'Cancer, Scorpio, Pisces'}).`
    },
    luckyElements: {
      luckyNumber: String(nameVibration),
      luckyDay: rulingPlanet === 'Sun' ? 'Sunday' : rulingPlanet === 'Moon' ? 'Monday' : rulingPlanet === 'Mars' ? 'Tuesday' : rulingPlanet === 'Mercury' ? 'Wednesday' : rulingPlanet === 'Jupiter' ? 'Thursday' : rulingPlanet === 'Venus' ? 'Friday' : 'Saturday',
      luckyColor: aura.primary,
      powerTime: element === 'Fire' ? 'Morning (6-9 AM)' : element === 'Earth' ? 'Afternoon (12-3 PM)' : element === 'Air' ? 'Late afternoon (3-6 PM)' : 'Evening (6-9 PM)'
    },
    basedOnYourAnswers: {
      title: "📋 Based on Your Answers",
      intro: `Here's how everything you told us shaped ${name}'s cosmic portrait:`,
      mappings: [
        { question: "Name", yourAnswer: name, usedFor: `Name numerology (vibration ${nameVibration}), cosmic nickname generation, and personalized language throughout the report` },
        { question: "Species & Breed", yourAnswer: breed || species, usedFor: "Species-specific personality insights, breed trait integration in the Earthly Expression section, and tailored care recommendations" },
        { question: "Gender", yourAnswer: gender === 'boy' ? 'Male' : 'Female', usedFor: `Pronoun usage throughout the report and archetype selection (${archetype.name})` },
        { question: "Date of Birth", yourAnswer: dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), usedFor: `All planetary calculations - Sun sign (${sunSign}), Moon sign (${moonSign}), and all planetary placements` },
        { question: "Birth Time", yourAnswer: birthTime || 'Not provided (using noon estimate)', usedFor: birthTime ? 'Precise Moon sign calculation and accurate Rising sign (Ascendant)' : 'Moon sign has ±1 sign variance, Rising sign defaults to Sun sign' },
        { question: "Birth Location", yourAnswer: location || 'Not provided', usedFor: location ? 'True Ascendant (Rising sign) calculation based on geographic coordinates' : 'Rising sign defaults to Sun sign without location' },
        { question: "Soul Type", yourAnswer: soulType || 'Not selected', usedFor: "Archetype refinement, personality descriptions, and Soul Snapshot insights" },
        { question: "Superpower", yourAnswer: superpower || 'Not selected', usedFor: "Hidden gift section, healing abilities, and what makes them special" },
        { question: "Stranger Reaction", yourAnswer: strangerReaction || 'Not selected', usedFor: `Rising sign/First Impressions section - how others perceive ${name}` }
      ],
      accuracyNote: "💡 The more details you provide (especially birth time and location), the more accurate the Moon and Rising sign calculations become!"
    }
  });

  // ─── Parse response ────────────────────────────────────────────────────────

  let reportContent: Record<string, unknown>;

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[WORKER] AI gateway error:", response.status, errorText);
    console.log("[WORKER] Using fallback report due to AI error");
    reportContent = createFallbackReport();
  } else {
    try {
      const json = await response.json();
      let rawContent = json.choices?.[0]?.message?.content;

      if (!rawContent) {
        console.error("[WORKER] Empty response from AI, using fallback");
        reportContent = createFallbackReport();
      } else {
        console.log("[WORKER] Received", rawContent.length, "chars from AI");
        rawContent = rawContent.replace(/^```json\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
        reportContent = JSON.parse(rawContent);
        const fallback = createFallbackReport();
        reportContent = { ...fallback, ...reportContent };
        // Override calculated fields — AI must not change these
        reportContent.chartPlacements = chartPlacements;
        reportContent.elementalBalance = elementalBalance;
        reportContent.dominantElement = element;
        reportContent.crystal = crystal;
        reportContent.aura = aura;
        reportContent.archetype = archetype;
        reportContent.luckyElements = fallback.luckyElements;
        reportContent.basedOnYourAnswers = fallback.basedOnYourAnswers;
        // Lock nameVibration inside nameMeaning
        if (reportContent.nameMeaning && typeof reportContent.nameMeaning === 'object') {
          (reportContent.nameMeaning as Record<string, unknown>).nameVibration = nameVibration;
        }
      }
    } catch (parseError) {
      console.error("[WORKER] Parse error:", parseError);
      // Attempt to repair truncated JSON before falling back
      try {
        let repaired = rawContent!;
        // Close any open strings, arrays, objects
        let openBraces = 0, openBrackets = 0, inString = false, escaped = false;
        for (const ch of repaired) {
          if (escaped) { escaped = false; continue; }
          if (ch === '\\') { escaped = true; continue; }
          if (ch === '"') { inString = !inString; continue; }
          if (inString) continue;
          if (ch === '{') openBraces++;
          if (ch === '}') openBraces--;
          if (ch === '[') openBrackets++;
          if (ch === ']') openBrackets--;
        }
        if (inString) repaired += '"';
        while (openBrackets > 0) { repaired += ']'; openBrackets--; }
        while (openBraces > 0) { repaired += '}'; openBraces--; }
        reportContent = JSON.parse(repaired);
        const fallback = createFallbackReport();
        reportContent = { ...fallback, ...reportContent };
        reportContent.chartPlacements = chartPlacements;
        reportContent.elementalBalance = elementalBalance;
        reportContent.dominantElement = element;
        reportContent.crystal = crystal;
        reportContent.aura = aura;
        reportContent.archetype = archetype;
        reportContent.luckyElements = fallback.luckyElements;
        reportContent.basedOnYourAnswers = fallback.basedOnYourAnswers;
        if (reportContent.nameMeaning && typeof reportContent.nameMeaning === 'object') {
          (reportContent.nameMeaning as Record<string, unknown>).nameVibration = nameVibration;
        }
        console.log("[WORKER] Repaired truncated JSON successfully");
      } catch (repairError) {
        console.error("[WORKER] JSON repair also failed:", repairError);
        reportContent = createFallbackReport();
      }
    }
  }

  // ─── Post-generation auto-fix & validation ─────────────────────────────────

  // Auto-fix: replace raw unicode escapes like \u2726 with actual characters
  function fixUnicodeEscapes(obj: unknown): unknown {
    if (typeof obj === 'string') {
      return obj.replace(/\\u([0-9a-fA-F]{4})/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)));
    }
    if (Array.isArray(obj)) return obj.map(fixUnicodeEscapes);
    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) result[k] = fixUnicodeEscapes(v);
      return result;
    }
    return obj;
  }
  reportContent = fixUnicodeEscapes(reportContent) as typeof reportContent;

  // Auto-fix: replace "your owner" / "the owner" with "you" in all string values
  const ownerPattern = /\b(your|the|their)\s+owner\b/gi;
  function fixOwnerPhrasing(obj: unknown): unknown {
    if (typeof obj === 'string') {
      return obj.replace(ownerPattern, (match) => {
        const lower = match.toLowerCase();
        if (lower.startsWith('your')) return 'you';
        if (lower.startsWith('their')) return 'your';
        return 'you';
      });
    }
    if (Array.isArray(obj)) return obj.map(fixOwnerPhrasing);
    if (obj && typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        result[k] = fixOwnerPhrasing(v);
      }
      return result;
    }
    return obj;
  }
  reportContent = fixOwnerPhrasing(reportContent) as Record<string, unknown>;

  // Re-apply overrides after auto-fix (fix may have touched override objects)
  reportContent.chartPlacements = chartPlacements;
  reportContent.luckyElements = (createFallbackReport() as Record<string, unknown>).luckyElements;
  reportContent.basedOnYourAnswers = (createFallbackReport() as Record<string, unknown>).basedOnYourAnswers;

  // Validation logging: tense issues
  const reportText = JSON.stringify(reportContent);
  if (!isMemorial) {
    const pastTensePatterns = [
      new RegExp(`${name} was `, 'gi'),
      new RegExp(`${name} entered`, 'gi'),
      new RegExp(`${name} came into`, 'gi'),
      new RegExp(`${name} chose you`, 'gi'),
    ];
    for (const pat of pastTensePatterns) {
      const matches = reportText.match(pat);
      if (matches) {
        console.warn(`[VALIDATION] Past-tense violation in non-memorial report: "${matches[0]}" (${matches.length} occurrences)`);
      }
    }
  }

  // Validation logging: pronoun mismatches
  if (gender === 'boy') {
    const femMatches = reportText.match(/\bshe\b|\bher\b(?!\s+name)/gi);
    if (femMatches && femMatches.length > 2) {
      console.warn(`[VALIDATION] Pronoun mismatch: ${femMatches.length} feminine pronouns in boy report`);
    }
  } else if (gender === 'girl') {
    const mascMatches = reportText.match(/\bhis\b|\bhe\b/gi);
    if (mascMatches && mascMatches.length > 2) {
      console.warn(`[VALIDATION] Pronoun mismatch: ${mascMatches.length} masculine pronouns in girl report`);
    }
  }

  // Validation logging: "your owner" survived auto-fix (shouldn't happen, but log it)
  const ownerSurvivors = reportText.match(ownerPattern);
  if (ownerSurvivors) {
    console.warn(`[VALIDATION] "owner" phrasing survived auto-fix: ${ownerSurvivors.length} occurrences`);
  }

  console.log("[WORKER] Post-generation validation complete");

  // 9. Save report_content via bridge
  console.log("[WORKER] Saving report content...");
  await bridgePatch({ reportId, reportContent });
  console.log("[WORKER] Done! Report saved for:", reportId);

  // Send report email
  try {
    const emailRes = await fetch(
      `${BRIDGE_URL.replace('/n8n-bridge', '/send-report-email')}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + N8N_BRIDGE_SECRET,
        },
        body: JSON.stringify({
          reportId,
          email: reportRow.email,
          petName: name,
          sunSign,
          petPhotoUrl,
        }),
      }
    );
    const emailBody = await emailRes.text();
    console.log("[WORKER] Email trigger:", emailRes.status, emailBody);
  } catch (e) {
    console.error("[WORKER] Email failed:", e);
  }

} catch (error) {
  console.error("[WORKER] Fatal error:", error);
  await saveError(String(error));
  Deno.exit(1);
}
