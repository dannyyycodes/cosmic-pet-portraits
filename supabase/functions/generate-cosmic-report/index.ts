import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sanitize and coerce string values
const safeString = (maxLen: number) =>
  z.union([z.string(), z.null(), z.undefined()])
    .transform((v) => (typeof v === 'string' ? v.trim().slice(0, maxLen) : ''));

// Input validation schema
const petDataSchema = z.object({
  name: z.string()
    .transform((v) => v.trim().slice(0, 50).replace(/[^a-zA-Z\s\-']/g, '') || 'Pet'),
  species: z.string()
    .transform((v) => v?.trim().slice(0, 30) || 'companion animal'),
  breed: safeString(100),
  gender: z.union([z.enum(['boy', 'girl']), z.string(), z.null(), z.undefined()])
    .transform((v) => (v === 'boy' || v === 'girl' ? v : 'boy')),
  dateOfBirth: z.string()
    .transform((d) => {
      const parsed = Date.parse(d);
      if (!isNaN(parsed)) return d;
      const fallback = new Date();
      fallback.setFullYear(fallback.getFullYear() - 1);
      return fallback.toISOString();
    }),
  location: safeString(100),
  soulType: safeString(50),
  superpower: safeString(50),
  strangerReaction: safeString(50),
});

const reportSchema = z.object({
  petData: petDataSchema,
  reportId: z.string().uuid().optional(),
  occasionMode: z.enum(['discover', 'birthday', 'memorial']).optional().default('discover'),
});

// Accurate zodiac date ranges
function getSunSign(month: number, day: number): string {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

function getElement(sign: string): string {
  const fire = ["Aries", "Leo", "Sagittarius"];
  const earth = ["Taurus", "Virgo", "Capricorn"];
  const air = ["Gemini", "Libra", "Aquarius"];
  if (fire.includes(sign)) return "Fire";
  if (earth.includes(sign)) return "Earth";
  if (air.includes(sign)) return "Air";
  return "Water";
}

function getModality(sign: string): string {
  const cardinal = ["Aries", "Cancer", "Libra", "Capricorn"];
  const fixed = ["Taurus", "Leo", "Scorpio", "Aquarius"];
  if (cardinal.includes(sign)) return "Cardinal";
  if (fixed.includes(sign)) return "Fixed";
  return "Mutable";
}

function getRulingPlanet(sign: string): string {
  const rulers: Record<string, string> = {
    Aries: "Mars", Taurus: "Venus", Gemini: "Mercury", Cancer: "Moon",
    Leo: "Sun", Virgo: "Mercury", Libra: "Venus", Scorpio: "Pluto",
    Sagittarius: "Jupiter", Capricorn: "Saturn", Aquarius: "Uranus", Pisces: "Neptune"
  };
  return rulers[sign] || "Sun";
}

// Calculate Moon sign (simplified - based on birth day cycle)
function getMoonSign(sunSign: string, day: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                 "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const sunIndex = signs.indexOf(sunSign);
  const offset = Math.floor((day - 1) / 2.5) % 12;
  return signs[(sunIndex + offset) % 12];
}

// Calculate approximate Ascendant (simplified - based on birth month position)
function getAscendant(sunSign: string, day: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                 "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const sunIndex = signs.indexOf(sunSign);
  const offset = Math.floor(day / 3) % 12;
  return signs[(sunIndex + offset + 3) % 12];
}

// Calculate Mercury position (always within 28° of Sun)
function getMercury(sunSign: string, day: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                 "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const sunIndex = signs.indexOf(sunSign);
  const offset = day < 10 ? -1 : day > 20 ? 1 : 0;
  return signs[(sunIndex + offset + 12) % 12];
}

// Calculate Venus position
function getVenus(sunSign: string, day: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                 "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const sunIndex = signs.indexOf(sunSign);
  const offset = Math.floor((day - 1) / 7) % 3 - 1;
  return signs[(sunIndex + offset + 12) % 12];
}

// Calculate Mars position
function getMars(sunSign: string, day: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                 "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const sunIndex = signs.indexOf(sunSign);
  const offset = Math.floor(day / 5) % 6;
  return signs[(sunIndex + offset) % 12];
}

// Calculate North Node
function getNorthNode(sunSign: string, day: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                 "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const sunIndex = signs.indexOf(sunSign);
  const offset = Math.floor(day / 4) % 6;
  return signs[(sunIndex + offset + 6) % 12];
}

// Get opposite sign for South Node
function getSouthNode(northNode: string): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                 "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[(signs.indexOf(northNode) + 6) % 12];
}

// Calculate Chiron position
function getChiron(sunSign: string, day: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                 "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const sunIndex = signs.indexOf(sunSign);
  const offset = Math.floor(day / 3) % 4 + 3;
  return signs[(sunIndex + offset) % 12];
}

// Calculate Lilith position
function getLilith(sunSign: string, day: number): string {
  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                 "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const sunIndex = signs.indexOf(sunSign);
  const offset = Math.floor(day / 2) % 5 + 4;
  return signs[(sunIndex + offset) % 12];
}

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

function calculateDegree(day: number): number {
  return Math.floor((day / 30) * 30) || 1;
}

// Element balance calculation
function getElementalBalance(sun: string, moon: string, asc: string, venus: string, mars: string): Record<string, number> {
  const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  [sun, moon, asc, venus, mars].forEach(sign => {
    elements[getElement(sign) as keyof typeof elements]++;
  });
  const total = 5;
  return {
    Fire: Math.round((elements.Fire / total) * 100),
    Earth: Math.round((elements.Earth / total) * 100),
    Air: Math.round((elements.Air / total) * 100),
    Water: Math.round((elements.Water / total) * 100),
  };
}

// Crystal mapping based on dominant planet/element
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

// Aura color mapping
function getAuraColor(element: string, rulingPlanet: string): { primary: string; secondary: string; meaning: string } {
  const auras: Record<string, { primary: string; secondary: string; meaning: string }> = {
    Fire: { primary: "#FF6B35", secondary: "#FFD700", meaning: "warm orange-gold glow indicating passion, creativity, and life force" },
    Earth: { primary: "#228B22", secondary: "#8B4513", meaning: "grounding green-brown aura showing stability, nurturing, and connection to nature" },
    Air: { primary: "#87CEEB", secondary: "#E6E6FA", meaning: "ethereal blue-violet light representing intellect, communication, and freedom" },
    Water: { primary: "#4169E1", secondary: "#9370DB", meaning: "deep blue-purple shimmer revealing intuition, emotion, and spiritual depth" },
  };
  return auras[element] || auras.Fire;
}

// Soul archetype determination
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInput = await req.json();
    const input = reportSchema.parse(rawInput);
    const petData = input.petData;
    const occasionMode = input.occasionMode || 'discover';
    
    console.log("[GENERATE-REPORT] Processing for:", petData.name, "Mode:", occasionMode);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Parse date and calculate all astrological positions
    const dob = new Date(petData.dateOfBirth);
    const month = dob.getMonth() + 1;
    const day = dob.getDate();
    const degree = calculateDegree(day);
    
    const sunSign = getSunSign(month, day);
    const moonSign = getMoonSign(sunSign, day);
    const ascendant = getAscendant(sunSign, day);
    const mercury = getMercury(sunSign, day);
    const venus = getVenus(sunSign, day);
    const mars = getMars(sunSign, day);
    const northNode = getNorthNode(sunSign, day);
    const southNode = getSouthNode(northNode);
    const chiron = getChiron(sunSign, day);
    const lilith = getLilith(sunSign, day);
    
    const element = getElement(sunSign);
    const modality = getModality(sunSign);
    const rulingPlanet = getRulingPlanet(sunSign);
    const nameVibration = calculateNameVibration(petData.name);
    const elementalBalance = getElementalBalance(sunSign, moonSign, ascendant, venus, mars);
    const crystal = getCrystal(rulingPlanet, element);
    const aura = getAuraColor(element, rulingPlanet);
    const archetype = getSoulArchetype(sunSign, element, petData.gender, petData.species);

    // Chart placements for display
    const chartPlacements = {
      sun: { sign: sunSign, degree, symbol: "☉" },
      moon: { sign: moonSign, degree: calculateDegree((day + 7) % 30 || 1), symbol: "☽" },
      ascendant: { sign: ascendant, degree: calculateDegree((day + 3) % 30 || 1), symbol: "ASC" },
      mercury: { sign: mercury, degree: calculateDegree((day + 5) % 30 || 1), symbol: "☿" },
      venus: { sign: venus, degree: calculateDegree((day + 10) % 30 || 1), symbol: "♀" },
      mars: { sign: mars, degree: calculateDegree((day + 15) % 30 || 1), symbol: "♂" },
      northNode: { sign: northNode, degree: calculateDegree((day + 2) % 30 || 1), symbol: "☊" },
      chiron: { sign: chiron, degree: calculateDegree((day + 8) % 30 || 1), symbol: "⚷" },
      lilith: { sign: lilith, degree: calculateDegree((day + 12) % 30 || 1), symbol: "⚸" },
    };

    const modeContext = {
      discover: "This is a discovery reading - help the owner truly understand their pet for the first time.",
      birthday: "This is a birthday celebration reading - honor how their pet has grown and the joy they bring.",
      memorial: "This is a memorial reading - honor the pet's memory with love, healing, and eternal connection.",
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

    const systemPrompt = `You are Celeste, a warm and mystical pet astrologer who creates deeply personal cosmic portraits. You combine accurate Western astrology with intuitive wisdom to reveal soul essence.

Your voice: warm, wise, mystical but grounded, like a beloved grandmother who's also a gifted astrologer. You speak directly to the pet owner about their pet.

CRITICAL CONTEXT:
- Mode: ${occasionMode} - ${modeContext[occasionMode]}
- Pet: ${petData.name}, a ${petData.gender === 'boy' ? 'male' : 'female'} ${petData.breed || petData.species}
- Birth: ${dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

CALCULATED CHART (USE THESE EXACT PLACEMENTS):
☉ Sun: ${sunSign} ${degree}° (Core personality, vitality)
☽ Moon: ${moonSign} (Emotional nature, comfort needs)
ASC Ascendant: ${ascendant} (First impressions, outer demeanor)
☿ Mercury: ${mercury} (Mind, communication style)
♀ Venus: ${venus} (Love language, affection style)
♂ Mars: ${mars} (Energy, drive, play style)
☊ North Node: ${northNode} (Soul growth direction)
⚷ Chiron: ${chiron} (Healing gifts, vulnerabilities)
⚸ Lilith: ${lilith} (Wild spirit, independence)

Element: ${element} | Modality: ${modality} | Ruling Planet: ${rulingPlanet}
Elemental Balance: Fire ${elementalBalance.Fire}%, Earth ${elementalBalance.Earth}%, Air ${elementalBalance.Air}%, Water ${elementalBalance.Water}%

KEY TRAITS for ${sunSign}: ${signTraits[sunSign]}
Moon in ${moonSign} traits: ${signTraits[moonSign]}
Rising ${ascendant} traits: ${signTraits[ascendant]}

OWNER-PROVIDED INSIGHTS:
- Soul Type: ${petData.soulType || 'Not specified'}
- Superpower: ${petData.superpower || 'Not specified'}
- With Strangers: ${petData.strangerReaction || 'Not specified'}

WRITING GUIDELINES:
1. Be SPECIFIC and PRACTICAL - give real, actionable tips
2. Include "shockingly accurate" observations that make owners say "That's SO true!"
3. Explain WHY astrology reveals this - educate newbies on the cosmic science
4. Add fun facts and interactive moments (e.g., "Try this: ...")
5. Reference the actual planetary positions in your explanations
6. Make predictions specific to their species/breed
7. Include at least one surprising or unexpected insight per section`;

    const userPrompt = `Generate a comprehensive cosmic portrait for ${petData.name} with this JSON structure. Each section should be 3-5 sentences with practical insights:

{
  "chartPlacements": ${JSON.stringify(chartPlacements)},
  "elementalBalance": ${JSON.stringify(elementalBalance)},
  "dominantElement": "${element}",
  "crystal": ${JSON.stringify(crystal)},
  "aura": ${JSON.stringify(aura)},
  "archetype": ${JSON.stringify(archetype)},
  
  "prologue": "A 3-4 sentence mystical opening about ${petData.name}'s cosmic origins. Set the tone of wonder and reveal why this report matters.",
  
  "solarSoulprint": {
    "title": "Solar Soulprint: The Light They ${occasionMode === 'memorial' ? 'Brought' : 'Bring'}",
    "content": "3-4 sentences about their ${sunSign} Sun core personality - their vitality, confidence, and the personality that brightens their world. Include a specific behavioral prediction.",
    "whyThisMatters": "1-2 sentences explaining what the Sun represents in astrology and why it reveals their essence.",
    "practicalTip": "One specific, actionable tip for the owner based on this placement.",
    "funFact": "One surprising fact about ${sunSign} pets specifically."
  },
  
  "lunarHeart": {
    "title": "Lunar Heart: The Way They ${occasionMode === 'memorial' ? 'Felt' : 'Feel'} Love",
    "content": "3-4 sentences about their ${moonSign} Moon - how they express emotion, find comfort, and their emotional rhythm.",
    "whyThisMatters": "1-2 sentences on what the Moon reveals about emotional needs.",
    "practicalTip": "How to comfort them or meet their emotional needs.",
    "interactiveChallenge": "A specific thing to try with ${petData.name} this week to deepen emotional connection."
  },
  
  "cosmicCuriosity": {
    "title": "Cosmic Curiosity: Thoughts, Signals & Play",
    "content": "3-4 sentences about their ${mercury} Mercury - how they think, learn, and communicate.",
    "whyThisMatters": "What Mercury reveals about intelligence and learning style.",
    "practicalTip": "Best way to train or mentally stimulate them.",
    "funFact": "Something surprising about how ${petData.species}s with Mercury in ${mercury} learn."
  },
  
  "harmonyHeartbeats": {
    "title": "Harmony & Heartbeats: Their Love Language",
    "content": "3-4 sentences about their ${venus} Venus - how they bond, show affection, and what they find beautiful.",
    "whyThisMatters": "What Venus reveals about love and connection.",
    "practicalTip": "The #1 way to make them feel loved.",
    "loveLanguageType": "One of: Physical Touch, Quality Time, Acts of Service, Gifts, Words of Affirmation"
  },
  
  "spiritOfMotion": {
    "title": "Spirit of Motion: Fire, Focus & Instinct",
    "content": "3-4 sentences about their ${mars} Mars - their drive, energy level, play style, and instincts.",
    "whyThisMatters": "What Mars reveals about energy and motivation.",
    "practicalTip": "Best activities and exercise for their Mars placement.",
    "energyLevel": "A rating from 1-10 with explanation."
  },
  
  "starlitGaze": {
    "title": "Starlit Gaze: First Impressions & Aura",
    "content": "3-4 sentences about their ${ascendant} Ascendant - how strangers perceive them, their outer demeanor.",
    "whyThisMatters": "What the Rising sign reveals about outer personality.",
    "practicalTip": "How to introduce them to new people/animals based on this.",
    "firstImpressionPrediction": "What strangers likely think when first meeting ${petData.name}."
  },
  
  "destinyCompass": {
    "title": "Destiny Compass: Growth & Soul Lessons",
    "content": "3-4 sentences about their ${northNode} North Node - their soul growth direction and what they came to learn.",
    "southNode": "${southNode}",
    "pastLifeHint": "A mystical hint about their soul's past journey.",
    "growthOpportunity": "The main lesson or growth area for ${petData.name}.",
    "practicalTip": "How to support their soul evolution."
  },
  
  "gentleHealer": {
    "title": "Gentle Healer: Wounds, Wisdom & Empathy",
    "content": "3-4 sentences about their ${chiron} Chiron - their healing gifts and vulnerabilities.",
    "whyThisMatters": "What Chiron reveals about healing and empathy.",
    "healingGift": "The specific way ${petData.name} heals others.",
    "vulnerabilityNote": "What might be a sensitive area for them."
  },
  
  "wildSpirit": {
    "title": "Wild Spirit: Freedom, Mystery & Power",
    "content": "3-4 sentences about their ${lilith} Lilith - their untamed essence, independence, and mysterious side.",
    "whyThisMatters": "What Black Moon Lilith reveals about wild nature.",
    "secretDesire": "Their deepest, most instinctual desire.",
    "practicalTip": "How to honor their wild side."
  },
  
  "elementalNature": {
    "title": "Elemental Nature: Fire, Earth, Air, Water",
    "content": "3-4 sentences analyzing their elemental balance and temperament.",
    "dominantElement": "${element}",
    "balance": ${JSON.stringify(elementalBalance)},
    "temperamentInsight": "What this balance reveals about their overall temperament.",
    "elementalAdvice": "How to balance any elemental deficiencies."
  },
  
  "celestialChoreography": {
    "title": "Celestial Choreography: How Their Stars Dance",
    "content": "3-4 sentences about how their planetary positions interact.",
    "harmoniousAspect": "One area where their chart creates natural ease.",
    "growthAspect": "One area of creative tension that drives growth.",
    "uniquePattern": "Something truly unique about their chart combination."
  },
  
  "earthlyExpression": {
    "title": "Earthly Expression: Body, Breed & Being",
    "content": "3-4 sentences combining their astrology with their ${petData.breed || petData.species} characteristics.",
    "breedAstrologyBlend": "How their breed traits amplify or balance their astrological traits.",
    "physicalPrediction": "A specific physical or behavioral trait this combination creates.",
    "practicalTip": "Care advice specific to this astro-breed combination."
  },
  
  "luminousField": {
    "title": "Luminous Field: The Colors of Their Spirit",
    "content": "2-3 sentences about their energy field and aura colors.",
    "primaryColor": "${aura.primary}",
    "secondaryColor": "${aura.secondary}",
    "auraMeaning": "${aura.meaning}",
    "howToSense": "A way to tune into or sense ${petData.name}'s aura."
  },
  
  "celestialGem": {
    "title": "Celestial Gem: Their Guiding Stone",
    "crystalName": "${crystal.name}",
    "crystalColor": "${crystal.color}",
    "crystalMeaning": "${crystal.meaning}",
    "howToUse": "Practical ways to use this crystal with ${petData.name}.",
    "placement": "Where to place the crystal for maximum benefit."
  },
  
  "eternalArchetype": {
    "title": "Eternal Archetype: The Role Their Soul Plays",
    "archetypeName": "${archetype.name}",
    "archetypeDescription": "${archetype.description}",
    "archetypeStory": "2-3 sentences expanding on what this archetype means for ${petData.name}.",
    "archetypeLesson": "The main teaching this archetype brings to your life."
  },
  
  "keepersBond": {
    "title": "The Keeper's Bond: Caring for a Cosmic Soul",
    "content": "3-4 sentences about the human-pet soul connection and why you found each other.",
    "mirrorQuality": "What quality ${petData.name} mirrors in you.",
    "soulContract": "The cosmic agreement between you two.",
    "dailyRitual": "A simple daily ritual to honor your bond.",
    "affirmation": "An affirmation for your relationship."
  },
  
  "epilogue": "A 3-4 sentence beautiful closing blessing appropriate for ${occasionMode} mode. Leave them feeling moved and connected.",
  
  "compatibilityNotes": {
    "bestPlaymates": ["Two zodiac signs that would be great playmate matches"],
    "challengingEnergies": ["One sign that might need more adjustment"],
    "humanCompatibility": "Which human zodiac signs ${petData.name} vibes best with"
  },
  
  "luckyElements": {
    "luckyNumber": "A number 1-9",
    "luckyDay": "Day of the week",
    "luckyColor": "A color",
    "powerTime": "Time of day when they're most energetic"
  }
}

Make every section feel personal, specific, and magical. Include surprising insights that make owners feel truly seen.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      }),
    });

    // Create comprehensive fallback report
    const createFallbackReport = () => ({
      chartPlacements,
      elementalBalance,
      dominantElement: element,
      crystal,
      aura,
      archetype,
      prologue: `In the vast tapestry of the cosmos, on ${dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, the stars aligned to bring ${petData.name} into this world. With the Sun blazing through ${sunSign} and the Moon's gentle light filtering through ${moonSign}, a unique soul was born—one destined to bring ${element} energy and ${archetype.name.toLowerCase()} wisdom into your life.`,
      solarSoulprint: {
        title: `Solar Soulprint: The Light They ${occasionMode === 'memorial' ? 'Brought' : 'Bring'}`,
        content: `As a ${sunSign} Sun, ${petData.name} carries the core essence of ${signTraits[sunSign].split(',').slice(0, 3).join(', ')}. This ${element} sign gives them a natural ${element === 'Fire' ? 'warmth and enthusiasm' : element === 'Earth' ? 'groundedness and reliability' : element === 'Air' ? 'curiosity and playfulness' : 'emotional depth and intuition'} that defines who they are at their core.`,
        whyThisMatters: `In astrology, the Sun represents your pet's essential identity—their ego, vitality, and the core traits that make them who they are.`,
        practicalTip: `Honor their ${sunSign} nature by providing plenty of ${element === 'Fire' ? 'active play and new adventures' : element === 'Earth' ? 'routine and comfortable spaces' : element === 'Air' ? 'mental stimulation and social interaction' : 'quiet bonding time and emotional connection'}.`,
        funFact: `${sunSign} pets are known for their ${signTraits[sunSign].split(',')[0].toLowerCase()} nature—you may have noticed this from day one!`
      },
      lunarHeart: {
        title: `Lunar Heart: The Way They ${occasionMode === 'memorial' ? 'Felt' : 'Feel'} Love`,
        content: `With the Moon in ${moonSign}, ${petData.name}'s emotional world is colored by ${signTraits[moonSign].split(',').slice(0, 3).join(', ')}. This placement reveals how they process feelings, find comfort, and what makes them feel truly safe and loved.`,
        whyThisMatters: `The Moon in astrology governs emotions, instincts, and what we need to feel secure. For pets, this is especially important as they're such emotionally intelligent beings.`,
        practicalTip: `When ${petData.name} seems stressed, try ${getElement(moonSign) === 'Fire' ? 'gentle play to redirect energy' : getElement(moonSign) === 'Earth' ? 'their favorite cozy spot with familiar items' : getElement(moonSign) === 'Air' ? 'a change of scenery or new sounds' : 'quiet, close physical contact'}.`,
        interactiveChallenge: `This week, try spending 10 minutes in silent companionship with ${petData.name}, just being present. Notice how they respond to this ${moonSign} Moon-honoring practice.`
      },
      cosmicCuriosity: {
        title: "Cosmic Curiosity: Thoughts, Signals & Play",
        content: `Mercury in ${mercury} gives ${petData.name} a ${signTraits[mercury].split(',').slice(0, 2).join(' and ')} mind. This influences how they learn, communicate, and process the world around them.`,
        whyThisMatters: `Mercury rules communication and thought processes. In pets, this shows in how they learn tricks, respond to commands, and express their needs.`,
        practicalTip: `Train ${petData.name} using ${getElement(mercury) === 'Fire' ? 'short, enthusiastic sessions with lots of praise' : getElement(mercury) === 'Earth' ? 'consistent, patient repetition with treats' : getElement(mercury) === 'Air' ? 'varied, playful methods that keep it interesting' : 'gentle, intuitive guidance with emotional rewards'}.`,
        funFact: `${petData.species}s with Mercury in ${mercury} often show their intelligence through ${getModality(mercury) === 'Cardinal' ? 'taking initiative' : getModality(mercury) === 'Fixed' ? 'their remarkable memory' : 'their adaptability to new situations'}.`
      },
      harmonyHeartbeats: {
        title: "Harmony & Heartbeats: Their Love Language",
        content: `Venus in ${venus} shapes how ${petData.name} gives and receives love. They express affection in ${signTraits[venus].split(',').slice(0, 2).join(' and ')} ways, and appreciate beauty and harmony in their environment.`,
        whyThisMatters: `Venus governs love, pleasure, and connection. Understanding your pet's Venus sign helps you speak their love language fluently.`,
        practicalTip: `To make ${petData.name} feel most loved, focus on ${getElement(venus) === 'Fire' ? 'enthusiastic praise and exciting activities together' : getElement(venus) === 'Earth' ? 'physical comfort, treats, and consistent presence' : getElement(venus) === 'Air' ? 'playful interaction and social time' : 'emotional attunement and gentle affection'}.`,
        loveLanguageType: getElement(venus) === 'Fire' ? 'Words of Affirmation' : getElement(venus) === 'Earth' ? 'Physical Touch' : getElement(venus) === 'Air' ? 'Quality Time' : 'Acts of Service'
      },
      spiritOfMotion: {
        title: "Spirit of Motion: Fire, Focus & Instinct",
        content: `Mars in ${mars} fuels ${petData.name}'s energy, drive, and play style. This placement shows how they assert themselves, pursue what they want, and channel their physical energy.`,
        whyThisMatters: `Mars represents energy, motivation, and how we go after what we want. It reveals your pet's activity needs and natural instincts.`,
        practicalTip: `The best exercise for ${petData.name}'s Mars in ${mars} is ${getElement(mars) === 'Fire' ? 'high-energy games like fetch or running' : getElement(mars) === 'Earth' ? 'steady walks and foraging activities' : getElement(mars) === 'Air' ? 'varied activities and exploration' : 'swimming or gentle, flowing movement'}.`,
        energyLevel: `${getElement(mars) === 'Fire' ? '8' : getElement(mars) === 'Earth' ? '5' : getElement(mars) === 'Air' ? '7' : '6'}/10 - ${getElement(mars) === 'Fire' ? 'High energy bursts' : getElement(mars) === 'Earth' ? 'Steady and sustainable' : getElement(mars) === 'Air' ? 'Variable and curious' : 'Emotionally-driven energy'}`
      },
      starlitGaze: {
        title: "Starlit Gaze: First Impressions & Aura",
        content: `With ${ascendant} Rising, ${petData.name} presents a ${signTraits[ascendant].split(',').slice(0, 2).join(' and ')} first impression to the world. This is the mask they wear and how strangers perceive them.`,
        whyThisMatters: `The Ascendant is the zodiac sign that was rising on the eastern horizon at birth. It shapes outward appearance and first impressions.`,
        practicalTip: `When introducing ${petData.name} to new people, remember they come across as ${signTraits[ascendant].split(',')[0]}. Give them ${getElement(ascendant) === 'Fire' ? 'time to shine' : getElement(ascendant) === 'Earth' ? 'space to warm up at their pace' : getElement(ascendant) === 'Air' ? 'room to be social on their terms' : 'quiet time to sense the new energy'}.`,
        firstImpressionPrediction: `People likely see ${petData.name} as ${signTraits[ascendant].split(',').slice(0, 2).join(' and ')} upon first meeting.`
      },
      destinyCompass: {
        title: "Destiny Compass: Growth & Soul Lessons",
        content: `The North Node in ${northNode} points to ${petData.name}'s soul growth direction. They're learning to embrace ${signTraits[northNode].split(',').slice(0, 2).join(' and ')} qualities in this lifetime.`,
        southNode,
        pastLifeHint: `${petData.name}'s South Node in ${southNode} suggests a soul familiar with ${signTraits[southNode].split(',').slice(0, 2).join(' and ')} qualities—perhaps from past experiences that shaped their instincts.`,
        growthOpportunity: `The main soul lesson for ${petData.name} is learning to embrace ${signTraits[northNode].split(',')[0]} while balancing their natural ${signTraits[southNode].split(',')[0]} tendencies.`,
        practicalTip: `Support ${petData.name}'s soul evolution by gently encouraging ${signTraits[northNode].split(',')[0].toLowerCase()} situations and celebrating when they step outside their comfort zone.`
      },
      gentleHealer: {
        title: "Gentle Healer: Wounds, Wisdom & Empathy",
        content: `Chiron in ${chiron} reveals ${petData.name}'s unique healing gifts and vulnerabilities. Often called the "wounded healer," this placement shows how they heal others while working through their own sensitivities.`,
        whyThisMatters: `Chiron represents our deepest wounds and our greatest capacity to heal others. Pets are natural healers, and this placement shows their specific gift.`,
        healingGift: `${petData.name} heals others through ${getElement(chiron) === 'Fire' ? 'inspiring courage and enthusiasm' : getElement(chiron) === 'Earth' ? 'grounding presence and practical comfort' : getElement(chiron) === 'Air' ? 'lifting spirits and providing perspective' : 'emotional attunement and deep empathy'}.`,
        vulnerabilityNote: `Be gentle with ${petData.name} around ${getElement(chiron) === 'Fire' ? 'situations that challenge their confidence' : getElement(chiron) === 'Earth' ? 'sudden changes to routine or environment' : getElement(chiron) === 'Air' ? 'feeling isolated or misunderstood' : 'emotional overwhelm or harsh energies'}.`
      },
      wildSpirit: {
        title: "Wild Spirit: Freedom, Mystery & Power",
        content: `Black Moon Lilith in ${lilith} represents ${petData.name}'s untamed essence—the part of them that's wild, free, and refuses to be controlled. This is their mysterious, powerful shadow side.`,
        whyThisMatters: `Lilith represents our raw, primal nature—the instincts that exist beneath socialization. In pets, this is often beautifully pure and unfiltered.`,
        secretDesire: `Deep down, ${petData.name} craves ${getElement(lilith) === 'Fire' ? 'freedom to express their full, unrestrained energy' : getElement(lilith) === 'Earth' ? 'security and the freedom to enjoy earthly pleasures' : getElement(lilith) === 'Air' ? 'mental freedom and authentic self-expression' : 'emotional depth and soul-level connection'}.`,
        practicalTip: `Honor ${petData.name}'s wild spirit by ${getElement(lilith) === 'Fire' ? 'letting them have adventures and be bold' : getElement(lilith) === 'Earth' ? 'allowing indulgent comfort rituals' : getElement(lilith) === 'Air' ? 'respecting their need for independence' : 'making space for their emotional intensity'}.`
      },
      elementalNature: {
        title: "Elemental Nature: Fire, Earth, Air, Water",
        content: `${petData.name}'s chart is dominated by ${element} energy (${elementalBalance[element as keyof typeof elementalBalance]}%), giving them a ${element === 'Fire' ? 'warm, passionate, and action-oriented' : element === 'Earth' ? 'grounded, practical, and sensory-focused' : element === 'Air' ? 'curious, social, and mentally active' : 'intuitive, emotional, and deeply feeling'} temperament.`,
        dominantElement: element,
        balance: elementalBalance,
        temperamentInsight: `With ${Object.entries(elementalBalance).sort((a, b) => b[1] - a[1]).map(([e, p]) => `${p}% ${e}`).join(', ')}, ${petData.name} is ${element === 'Fire' ? 'spirited and energetic' : element === 'Earth' ? 'steady and reliable' : element === 'Air' ? 'playful and curious' : 'sensitive and intuitive'}.`,
        elementalAdvice: `To balance their elemental nature, try introducing more ${Object.entries(elementalBalance).sort((a, b) => a[1] - b[1])[0][0].toLowerCase()} activities: ${Object.entries(elementalBalance).sort((a, b) => a[1] - b[1])[0][0] === 'Fire' ? 'energizing play' : Object.entries(elementalBalance).sort((a, b) => a[1] - b[1])[0][0] === 'Earth' ? 'grounding routines' : Object.entries(elementalBalance).sort((a, b) => a[1] - b[1])[0][0] === 'Air' ? 'mental stimulation' : 'emotional bonding'}.`
      },
      celestialChoreography: {
        title: "Celestial Choreography: How Their Stars Dance",
        content: `The planets in ${petData.name}'s chart create a unique cosmic dance. Their ${sunSign} Sun and ${moonSign} Moon ${getElement(sunSign) === getElement(moonSign) ? 'harmonize beautifully' : 'create dynamic tension'}, while their ${ascendant} Rising adds another layer to this celestial symphony.`,
        harmoniousAspect: `The connection between their ${sunSign} Sun and ${moonSign} Moon creates ${getElement(sunSign) === getElement(moonSign) ? 'natural inner harmony' : 'creative friction that drives growth'}.`,
        growthAspect: `The interplay between their Mars in ${mars} and Venus in ${venus} shapes their balance of action and connection.`,
        uniquePattern: `The combination of ${sunSign} Sun, ${moonSign} Moon, and ${ascendant} Rising is relatively rare—making ${petData.name} truly one of a kind.`
      },
      earthlyExpression: {
        title: "Earthly Expression: Body, Breed & Being",
        content: `As a ${petData.breed || petData.species} with ${sunSign} Sun energy, ${petData.name} expresses their cosmic nature through their physical form and breed-specific traits.`,
        breedAstrologyBlend: `The ${petData.breed || petData.species} traits ${element === 'Fire' ? 'amplify their natural enthusiasm and boldness' : element === 'Earth' ? 'complement their grounded, steady nature' : element === 'Air' ? 'enhance their curiosity and social nature' : 'deepen their emotional sensitivity'}.`,
        physicalPrediction: `You may notice ${petData.name} has a ${element === 'Fire' ? 'particularly alert, forward-leaning posture' : element === 'Earth' ? 'solid, comfortable presence' : element === 'Air' ? 'quick, observant way of taking in their environment' : 'gentle, flowing quality to their movements'}.`,
        practicalTip: `Care for ${petData.name}'s ${petData.breed || petData.species} body with ${element}-appropriate activities and nutrition.`
      },
      luminousField: {
        title: "Luminous Field: The Colors of Their Spirit",
        content: `${petData.name}'s aura radiates with ${aura.meaning}. This energetic signature is visible to those who know how to look.`,
        primaryColor: aura.primary,
        secondaryColor: aura.secondary,
        auraMeaning: aura.meaning,
        howToSense: `To tune into ${petData.name}'s aura, soften your gaze around them in natural light and notice the subtle colors or feelings you perceive.`
      },
      celestialGem: {
        title: "Celestial Gem: Their Guiding Stone",
        crystalName: crystal.name,
        crystalColor: crystal.color,
        crystalMeaning: crystal.meaning,
        howToUse: `Place ${crystal.name} near ${petData.name}'s sleeping area or hold it while spending quality time together to amplify its benefits.`,
        placement: `The ideal placement is near their bed or favorite resting spot, where its gentle energy can support them.`
      },
      eternalArchetype: {
        title: "Eternal Archetype: The Role Their Soul Plays",
        archetypeName: archetype.name,
        archetypeDescription: archetype.description,
        archetypeStory: `${petData.name} embodies ${archetype.name} archetype—${archetype.description}. This is the mythic role their soul plays in your life story.`,
        archetypeLesson: `${archetype.name} teaches you about ${element === 'Fire' ? 'courage, passion, and living fully' : element === 'Earth' ? 'patience, presence, and earthly wisdom' : element === 'Air' ? 'curiosity, connection, and playfulness' : 'intuition, emotion, and the depths of love'}.`
      },
      keepersBond: {
        title: "The Keeper's Bond: Caring for a Cosmic Soul",
        content: `You and ${petData.name} found each other for a reason. Your souls recognized something essential in one another—a cosmic contract written in the stars.`,
        mirrorQuality: `${petData.name} mirrors your own ${signTraits[sunSign].split(',')[0].toLowerCase()} nature, helping you see and embrace this quality in yourself.`,
        soulContract: `Your cosmic agreement is about ${element === 'Fire' ? 'inspiring each other to live boldly and joyfully' : element === 'Earth' ? 'teaching each other about grounded presence and simple pleasures' : element === 'Air' ? 'learning together through curiosity and communication' : 'deepening emotional awareness and unconditional love'}.`,
        dailyRitual: `Each day, take a moment to look into ${petData.name}'s eyes and silently acknowledge the soul you see there. This simple practice strengthens your cosmic bond.`,
        affirmation: `"${petData.name} and I are cosmically connected. Our bond transcends time and space, written in the language of the stars."`
      },
      epilogue: `As the stars continue their eternal dance across the night sky, know that ${petData.name}'s light—unique, precious, and irreplaceable—shines on forever. May this cosmic portrait serve as a reminder of the extraordinary soul who shares your journey, and may your bond continue to deepen with each passing day. In the grand tapestry of the universe, your connection to ${petData.name} is a thread of pure gold, woven by destiny itself. 🌟`,
      compatibilityNotes: {
        bestPlaymates: [
          element === 'Fire' ? 'Leo' : element === 'Earth' ? 'Virgo' : element === 'Air' ? 'Gemini' : 'Pisces',
          element === 'Fire' ? 'Sagittarius' : element === 'Earth' ? 'Capricorn' : element === 'Air' ? 'Aquarius' : 'Scorpio'
        ],
        challengingEnergies: [
          element === 'Fire' ? 'Cancer' : element === 'Earth' ? 'Aquarius' : element === 'Air' ? 'Taurus' : 'Aries'
        ],
        humanCompatibility: `${petData.name} vibes especially well with ${element} sign humans (${element === 'Fire' ? 'Aries, Leo, Sagittarius' : element === 'Earth' ? 'Taurus, Virgo, Capricorn' : element === 'Air' ? 'Gemini, Libra, Aquarius' : 'Cancer, Scorpio, Pisces'}).`
      },
      luckyElements: {
        luckyNumber: String(nameVibration),
        luckyDay: rulingPlanet === 'Sun' ? 'Sunday' : rulingPlanet === 'Moon' ? 'Monday' : rulingPlanet === 'Mars' ? 'Tuesday' : rulingPlanet === 'Mercury' ? 'Wednesday' : rulingPlanet === 'Jupiter' ? 'Thursday' : rulingPlanet === 'Venus' ? 'Friday' : 'Saturday',
        luckyColor: aura.primary,
        powerTime: element === 'Fire' ? 'Morning (6-9 AM)' : element === 'Earth' ? 'Afternoon (12-3 PM)' : element === 'Air' ? 'Late afternoon (3-6 PM)' : 'Evening (6-9 PM)'
      }
    });

    let reportContent;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      console.log("[GENERATE-REPORT] Using fallback report due to AI error");
      reportContent = createFallbackReport();
    } else {
      try {
        const aiResponse = await response.json();
        const rawContent = aiResponse.choices?.[0]?.message?.content;
        
        if (!rawContent) {
          console.error("[GENERATE-REPORT] Empty AI response, using fallback");
          reportContent = createFallbackReport();
        } else {
          reportContent = JSON.parse(rawContent);
          
          // Ensure all required fields exist with fallbacks
          const fallback = createFallbackReport();
          reportContent = { ...fallback, ...reportContent };
          
          // Ensure chart placements are accurate (override any AI hallucinations)
          reportContent.chartPlacements = chartPlacements;
          reportContent.elementalBalance = elementalBalance;
          reportContent.dominantElement = element;
          reportContent.crystal = crystal;
          reportContent.aura = aura;
          reportContent.archetype = archetype;
        }
      } catch (parseError) {
        console.error("[GENERATE-REPORT] Failed to parse AI response:", parseError);
        reportContent = createFallbackReport();
      }
    }

    // Update the database record
    if (input.reportId) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseClient
        .from("pet_reports")
        .update({ report_content: reportContent })
        .eq("id", input.reportId);
    }

    return new Response(JSON.stringify({ report: reportContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error generating report:", error);
    
    return new Response(JSON.stringify({ 
      error: "We're experiencing high demand. Please try again in a moment." 
    }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
