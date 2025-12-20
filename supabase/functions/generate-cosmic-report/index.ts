import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { 
  calculateAllPositions, 
  getElement, 
  getModality, 
  getRulingPlanet,
  type PlanetaryPositions 
} from "./ephemeris.ts";

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
  birthTime: safeString(10), // HH:MM format for more accurate Moon/Ascendant
  location: safeString(100),
  soulType: safeString(50),
  superpower: safeString(50),
  strangerReaction: safeString(50),
});

const reportSchema = z.object({
  petData: petDataSchema,
  reportId: z.string().uuid().optional(),
  occasionMode: z.enum(['discover', 'birthday', 'memorial', 'gift']).optional().default('discover'),
  language: z.enum(['en', 'es', 'pt', 'fr', 'ar', 'de']).optional().default('en'),
});

// Name numerology calculation
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

// Element balance calculation using actual positions
function getElementalBalance(positions: PlanetaryPositions): Record<string, number> {
  const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const relevantPlanets = ['sun', 'moon', 'mercury', 'venus', 'mars'] as const;
  
  relevantPlanets.forEach(planet => {
    const sign = positions[planet].sign;
    elements[getElement(sign) as keyof typeof elements]++;
  });
  
  // Add ascendant if available
  if (positions.ascendant) {
    elements[getElement(positions.ascendant.sign) as keyof typeof elements]++;
  }
  
  const total = positions.ascendant ? 6 : 5;
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

// Geocoding function to convert location string to coordinates
async function geocodeLocation(location: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  if (!location || location.trim().length < 2) {
    return null;
  }
  
  try {
    // Use OpenStreetMap Nominatim API (free, no API key required)
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInput = await req.json();
    const input = reportSchema.parse(rawInput);
    const petData = input.petData;
    const occasionMode = input.occasionMode || 'discover';
    const language = input.language || 'en';
    
    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      de: 'German', 
      fr: 'French',
      pt: 'Portuguese',
      ar: 'Arabic',
    };
    const targetLanguage = languageNames[language] || 'English';
    
    console.log("[GENERATE-REPORT] Processing for:", petData.name, "Mode:", occasionMode, "Language:", targetLanguage);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // SECURITY FIX: Generic error - don't reveal config details
      console.error("[GENERATE-REPORT] Missing AI service configuration");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse date and calculate all astrological positions using accurate ephemeris
    const dob = new Date(petData.dateOfBirth);
    
    // If birth time is provided, use it for more accurate Moon and Ascendant
    let birthHour = 12; // Default to noon if no time provided
    let birthMinute = 0;
    let birthTimeNote = "Birth time unknown - using noon for calculations. Moon sign may vary by ±1 sign.";
    
    if (petData.birthTime && petData.birthTime.includes(':')) {
      const [hours, minutes] = petData.birthTime.split(':').map(Number);
      if (!isNaN(hours) && hours >= 0 && hours < 24) {
        birthHour = hours;
        birthMinute = minutes || 0;
        birthTimeNote = `Birth time: ${petData.birthTime} - Moon and Ascendant calculations are more accurate!`;
      }
    }
    
    // Set the time on the date object
    dob.setHours(birthHour, birthMinute, 0, 0);
    
    console.log("[GENERATE-REPORT]", birthTimeNote);
    
    // Geocode the birth location for accurate Ascendant calculation
    let birthCoords: { lat: number; lon: number; displayName: string } | null = null;
    let locationNote = "Birth location unknown - Ascendant defaults to Sun sign.";
    
    if (petData.location) {
      birthCoords = await geocodeLocation(petData.location);
      if (birthCoords) {
        locationNote = `Birth location: ${birthCoords.displayName} (${birthCoords.lat.toFixed(2)}°, ${birthCoords.lon.toFixed(2)}°) - TRUE Ascendant calculated!`;
      } else {
        locationNote = `Location "${petData.location}" could not be geocoded - Ascendant defaults to Sun sign.`;
      }
    }
    
    console.log("[GENERATE-REPORT]", locationNote);
    
    // Calculate true planetary positions using ephemeris with birth time and location
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
    
    // South Node is opposite North Node
    const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", 
                   "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
    const southNode = signs[(signs.indexOf(northNode) + 6) % 12];
    
    // For ascendant - use true calculated value if we have coordinates, otherwise default to Sun sign
    const hasRealAscendant = !!positions.ascendant && !!birthCoords;
    const ascendant = positions.ascendant?.sign || positions.sun.sign;
    const ascendantNote = hasRealAscendant 
      ? `TRUE Ascendant calculated from birth time (${petData.birthTime || 'noon'}) and location (${birthCoords?.displayName})`
      : "Ascendant estimated (no birth time/location) - defaults to Sun sign. For accurate Rising sign, birth time and location are needed.";
    
    const element = getElement(sunSign);
    const modality = getModality(sunSign);
    const rulingPlanet = getRulingPlanet(sunSign);
    const nameVibration = calculateNameVibration(petData.name);
    const elementalBalance = getElementalBalance(positions);
    const crystal = getCrystal(rulingPlanet, element);
    const aura = getAuraColor(element, rulingPlanet);
    const archetype = getSoulArchetype(sunSign, element, petData.gender, petData.species);

    // Chart placements for display with TRUE calculated degrees
    const chartPlacements = {
      sun: { sign: sunSign, degree: positions.sun.degree, symbol: "☉" },
      moon: { sign: moonSign, degree: positions.moon.degree, symbol: "☽" },
      ascendant: { sign: ascendant, degree: positions.ascendant?.degree || 0, symbol: "ASC" },
      mercury: { sign: mercury, degree: positions.mercury.degree, symbol: "☿" },
      venus: { sign: venus, degree: positions.venus.degree, symbol: "♀" },
      mars: { sign: mars, degree: positions.mars.degree, symbol: "♂" },
      northNode: { sign: northNode, degree: positions.northNode.degree, symbol: "☊" },
      chiron: { sign: chiron, degree: positions.chiron.degree, symbol: "⚷" },
      lilith: { sign: lilith, degree: positions.lilith.degree, symbol: "⚸" },
    };
    
    console.log("[EPHEMERIS] Calculated positions:", {
      sun: `${sunSign} ${positions.sun.degree}°`,
      moon: `${moonSign} ${positions.moon.degree}°`,
      venus: `${venus} ${positions.venus.degree}°`,
      mars: `${mars} ${positions.mars.degree}°`,
    });

    const modeContext = {
      discover: "This is a discovery reading - help the owner truly understand their pet for the first time. Tone: curious, exciting, revelatory. Use PRESENT TENSE throughout (is, loves, brings, has).",
      birthday: "This is a birthday celebration reading - honor how their pet has grown and the joy they bring. Tone: celebratory, warm, grateful. Use PRESENT TENSE throughout (is, loves, brings, has).",
      memorial: "This is a MEMORIAL reading - the pet has PASSED AWAY. Honor their memory with love, healing, and eternal connection. CRITICAL: Use PAST TENSE throughout the ENTIRE report (was, loved, brought, had, felt, showed). Never use present tense when describing the pet - they are no longer with us. Focus on cherished memories and the lasting impact they had.",
      gift: "This is a gift reading - create something beautiful that the gift recipient will treasure forever. Tone: magical, heartfelt, special. Use PRESENT TENSE throughout (is, loves, brings, has).",
    };

    const modeEmotionalGuidance = {
      discover: "Use wonder and excitement. 'You might have noticed...' 'This explains why...' Include 'aha!' moments. Present tense: '${petData.name} IS... ${petData.name} LOVES...'",
      birthday: "Celebrate their journey. 'Another year of...' 'The cosmic gifts they bring...' Include gratitude and joy. Present tense: '${petData.name} IS... ${petData.name} BRINGS...'",
      memorial: "Honor with tenderness and PAST TENSE. '${petData.name} WAS...' '${petData.name} LOVED...' 'They BROUGHT...' 'Their light continues to shine in your heart...' Focus on: what they taught you, how they made you feel, the memories you cherish, and the eternal bond that transcends physical presence.",
      gift: "Make it feel like a treasure. 'What a magical soul...' 'The person receiving this will see...' Include awe and specialness. Present tense: '${petData.name} IS... ${petData.name} LOVES...'",
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

    // Species-specific traits to make report more accurate
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
    
    // Breed-specific traits for common breeds (dogs and cats primarily)
    const breedTraits: Record<string, string> = {
      // Dogs - High energy/Working breeds
      'labrador': 'Labradors are friendly, outgoing, and high-spirited. They are food-motivated, water-loving, and eternally optimistic. Known for their soft mouths and retrieval instincts.',
      'golden retriever': 'Golden Retrievers are devoted, intelligent, and friendly. They are people-pleasers who thrive on companionship. Known for their gentle temperament and love of carrying things.',
      'german shepherd': 'German Shepherds are loyal, confident, and courageous. They are highly trainable and protective. Known for their intelligence and strong work ethic.',
      'border collie': 'Border Collies are brilliant, energetic, and intense. They need mental stimulation and jobs to do. Known for their "eye" and herding instincts.',
      'husky': 'Huskies are independent, mischievous, and vocal. They are escape artists who love to run. Known for their dramatic vocalizations and stubborn streak.',
      'siberian husky': 'Siberian Huskies are independent, mischievous, and vocal. They are escape artists who love to run. Known for their dramatic vocalizations and stubborn streak.',
      'australian shepherd': 'Aussies are energetic, intelligent, and protective. They need lots of exercise and mental stimulation. Known for their herding instincts and loyalty.',
      'beagle': 'Beagles are curious, merry, and nose-driven. They follow scents obsessively. Known for their vocal nature and food motivation.',
      'boxer': 'Boxers are playful, loyal, and eternally puppy-like. They are clownish and expressive. Known for their "kidney bean" wiggles and jumping.',
      'bulldog': 'Bulldogs are calm, courageous, and stubborn. They are couch potatoes who snore loudly. Known for their determination and gentle nature.',
      'french bulldog': 'Frenchies are playful, adaptable, and attention-loving. They are excellent companions. Known for their bat ears and goofy personalities.',
      'poodle': 'Poodles are intelligent, active, and elegant. They are highly trainable and proud. Known for their hypoallergenic coats and circus-worthy tricks.',
      'rottweiler': 'Rottweilers are confident, loyal, and protective. They are devoted guardians. Known for their strength and gentle nature with family.',
      'dachshund': 'Dachshunds are curious, brave, and stubborn. They are big dogs in small bodies. Known for their burrowing instincts and determination.',
      'yorkshire terrier': 'Yorkies are feisty, affectionate, and spirited. They are bold despite their size. Known for their sassiness and lap-dog nature.',
      'yorkie': 'Yorkies are feisty, affectionate, and spirited. They are bold despite their size. Known for their sassiness and lap-dog nature.',
      'shih tzu': 'Shih Tzus are affectionate, outgoing, and playful. They are royal lap dogs at heart. Known for their friendly nature and flowing coats.',
      'chihuahua': 'Chihuahuas are loyal, sassy, and confident. They bond intensely to one person. Known for their trembling and big personalities.',
      'pomeranian': 'Pomeranians are extroverted, vivacious, and bold. They think they are much bigger. Known for their fluffy coats and commanding presence.',
      'cavalier king charles spaniel': 'Cavaliers are affectionate, gentle, and adaptable. They are the ultimate lap dogs. Known for their soulful eyes and sweet temperament.',
      'corgi': 'Corgis are intelligent, alert, and active. They are surprisingly athletic. Known for their short legs, herding instincts, and sploot.',
      'pembroke welsh corgi': 'Pembroke Corgis are intelligent, alert, and active. They are surprisingly athletic. Known for their short legs, herding instincts, and sploot.',
      'jack russell': 'Jack Russells are energetic, fearless, and clever. They have endless stamina. Known for their jumping ability and intense focus.',
      'pit bull': 'Pit Bulls are loyal, affectionate, and eager to please. They are gentle with family. Known for their strength and smile.',
      'american pit bull': 'American Pit Bulls are loyal, affectionate, and eager to please. They are gentle with family. Known for their strength and smile.',
      'maltese': 'Maltese are gentle, playful, and charming. They are devoted companions. Known for their silky white coats and sweet disposition.',
      'great dane': 'Great Danes are friendly, patient, and dependable. They are gentle giants. Known for their size and couch-potato tendencies.',
      'doberman': 'Dobermans are loyal, fearless, and alert. They are elegant and powerful. Known for their intelligence and protective instincts.',
      
      // Cats
      'persian': 'Persians are calm, sweet, and gentle. They prefer serene environments. Known for their flat faces and luxurious coats.',
      'maine coon': 'Maine Coons are gentle, intelligent, and dog-like. They love water and follow their humans. Known for their size and chirping vocalizations.',
      'siamese': 'Siamese are vocal, social, and opinionated. They form intense bonds. Known for their striking blue eyes and constant commentary.',
      'ragdoll': 'Ragdolls are gentle, affectionate, and relaxed. They go limp when held. Known for their docile nature and blue eyes.',
      'bengal': 'Bengals are active, intelligent, and wild-looking. They need lots of stimulation. Known for their leopard spots and love of water.',
      'british shorthair': 'British Shorthairs are calm, easygoing, and independent. They are dignified companions. Known for their round faces and plush coats.',
      'abyssinian': 'Abyssinians are curious, playful, and athletic. They love heights and exploration. Known for their ticked coats and dog-like loyalty.',
      'scottish fold': 'Scottish Folds are sweet, gentle, and adaptable. They are laid-back companions. Known for their folded ears and owl-like appearance.',
      'sphynx': 'Sphynx cats are energetic, mischievous, and attention-seeking. They crave warmth and contact. Known for their hairless bodies and extrovert personalities.',
      'tabby': 'Tabby cats are often friendly, outgoing, and adaptable. They are the classic cat. Known for their M-shaped forehead marking.',
      'tuxedo': 'Tuxedo cats are often playful, vocal, and intelligent. They have big personalities. Known for their formal black and white coloring.',
      'calico': 'Calico cats are often sassy, independent, and spirited. They have strong personalities. Known for their tri-color coats.',
      'orange tabby': 'Orange tabbies are often friendly, affectionate, and food-motivated. They are typically bold and confident. Known for their social nature.',
      
      // Horses
      'arabian': 'Arabian horses are intelligent, spirited, and loyal. They have incredible endurance. Known for their dished faces and high tail carriage.',
      'quarter horse': 'Quarter Horses are calm, versatile, and athletic. They are great all-rounders. Known for their muscular build and gentle disposition.',
      'thoroughbred': 'Thoroughbreds are athletic, sensitive, and intelligent. They are high-energy horses. Known for their speed and competitive spirit.',
      'mustang': 'Mustangs are independent, hardy, and intelligent. They have strong survival instincts. Known for their wild heritage and adaptability.',
      
      // Birds
      'cockatiel': 'Cockatiels are affectionate, musical, and gentle. They love to whistle and sing. Known for their crests and cheek patches.',
      'budgie': 'Budgies are playful, social, and talkative. They can learn many words. Known for their colorful plumage and chatter.',
      'parakeet': 'Parakeets are playful, social, and talkative. They can learn many words. Known for their colorful plumage and chatter.',
      'african grey': 'African Greys are brilliant, sensitive, and vocal. They are exceptional talkers. Known for their intelligence and emotional depth.',
      'cockatoo': 'Cockatoos are affectionate, loud, and demanding. They crave attention. Known for their crests and dramatic personalities.',
      'macaw': 'Macaws are intelligent, playful, and stunning. They are lifelong companions. Known for their size, colors, and vocalizations.',
      
      // Rabbits
      'holland lop': 'Holland Lops are sweet, playful, and gentle. They are compact and cuddly. Known for their floppy ears and friendly nature.',
      'netherland dwarf': 'Netherland Dwarfs are energetic, curious, and sometimes sassy. They are tiny but bold. Known for their baby faces and spunk.',
      'mini rex': 'Mini Rex rabbits are calm, curious, and velvety. They love being petted. Known for their plush, rex-furred coats.',
      'lionhead': 'Lionhead rabbits are friendly, playful, and fluffy. They have big personalities. Known for their mane of fur around their heads.',
    };
    
    const speciesContext = speciesTraits[petData.species?.toLowerCase() || 'dog'] || speciesTraits.dog;
    
    // Find breed-specific traits if available
    const breedLower = (petData.breed || '').toLowerCase();
    let breedContext = '';
    for (const [breedKey, traits] of Object.entries(breedTraits)) {
      if (breedLower.includes(breedKey) || breedKey.includes(breedLower)) {
        breedContext = traits;
        break;
      }
    }
    
    // Create enhanced owner insights section
    const ownerInsights = {
      soulType: petData.soulType || '',
      superpower: petData.superpower || '',
      strangerReaction: petData.strangerReaction || '',
    };
    
    // Map owner inputs to personality descriptors
    const soulTypeDescriptors: Record<string, string> = {
      'old soul': 'This pet has an ancient, wise quality - they seem to understand more than they let on. They may prefer calm environments and deep connections over constant stimulation.',
      'playful spirit': 'This pet is eternally young at heart - full of joy, mischief, and enthusiasm. They bring lightness to heavy moments and find fun in everything.',
      'guardian': 'This pet has a protective, watchful nature - they take their role as family protector seriously. They are alert to threats and deeply loyal.',
      'healer': 'This pet has an intuitive sense of when others need comfort - they appear when you are sad, stressed, or unwell. They absorb and transmute emotional energy.',
      'adventurer': 'This pet lives for exploration and new experiences - they are curious, brave, and always ready for the next discovery.',
      'zen master': 'This pet embodies calm presence - they teach by example how to simply BE. They are grounded, peaceful, and unfazed by chaos.',
    };
    
    const superpowerDescriptors: Record<string, string> = {
      'telepathy': 'They seem to read minds - knowing what you need before you do. Watch for moments where they respond to your thoughts.',
      'healing presence': 'Their presence alone is healing - they naturally soothe anxiety, sadness, and stress. They are drawn to those who need comfort.',
      'comic relief': 'They have impeccable comedic timing - they know exactly when to be silly to break tension. Laughter follows them.',
      'unconditional love': 'Their love has no conditions - they accept you completely, flaws and all. This is their gift to everyone they meet.',
      'emotional radar': 'They sense emotions others miss - they are the first to notice when something is wrong. They are emotional barometers.',
      'adventure catalyst': 'They inspire spontaneity and adventure - life is more exciting with them. They push you out of comfort zones.',
      'calming presence': 'They radiate peace - stress melts in their presence. They are living, breathing meditation teachers.',
    };
    
    const strangerDescriptors: Record<string, string> = {
      'shy and hiding': 'They are cautious with new people - preferring to observe from a safe distance before engaging. Trust is earned, not given freely.',
      'cautious but curious': 'They balance wariness with interest - they want to investigate but on their terms. They warm up gradually.',
      'friendly and social': 'They welcome everyone - strangers are just friends they have not met. They bring instant warmth to new situations.',
      'excited and overwhelming': 'Their enthusiasm is boundless - they greet everyone like a long-lost friend. Their joy is contagious but sometimes too much.',
      'protective and alert': 'They are watchful guardians - strangers must prove themselves worthy. They take protection seriously.',
      'indifferent royalty': 'They acknowledge strangers when they choose to - not because they are unfriendly, but because their attention is a gift they bestow selectively.',
    };
    
    // Build enhanced insight context
    let enhancedInsights = `
OWNER-PROVIDED PERSONALITY INSIGHTS (CRITICAL - These are firsthand observations from the owner. Weave these throughout the report!):`;
    
    if (ownerInsights.soulType) {
      const descriptor = Object.entries(soulTypeDescriptors).find(([key]) => 
        ownerInsights.soulType.toLowerCase().includes(key.split(' ')[0].toLowerCase())
      )?.[1] || `The owner perceives their pet as "${ownerInsights.soulType}" - incorporate this into their cosmic profile.`;
      enhancedInsights += `
- Soul Type: "${ownerInsights.soulType}" 
  Interpretation: ${descriptor}`;
    }
    
    if (ownerInsights.superpower) {
      const descriptor = Object.entries(superpowerDescriptors).find(([key]) => 
        ownerInsights.superpower.toLowerCase().includes(key.split(' ')[0].toLowerCase())
      )?.[1] || `Their special gift is "${ownerInsights.superpower}" - this should be highlighted as their cosmic superpower.`;
      enhancedInsights += `
- Superpower: "${ownerInsights.superpower}"
  Interpretation: ${descriptor}`;
    }
    
    if (ownerInsights.strangerReaction) {
      const descriptor = Object.entries(strangerDescriptors).find(([key]) => 
        ownerInsights.strangerReaction.toLowerCase().includes(key.split(' ')[0].toLowerCase())
      )?.[1] || `With strangers, they are "${ownerInsights.strangerReaction}" - use this for the Rising/First Impression section.`;
      enhancedInsights += `
- Stranger Reaction: "${ownerInsights.strangerReaction}"
  Interpretation: ${descriptor} (This directly informs their Rising Sign expression!)`;
    }
    
    if (!ownerInsights.soulType && !ownerInsights.superpower && !ownerInsights.strangerReaction) {
      enhancedInsights += `
No specific personality insights provided - rely on astrological placements and species/breed traits.`;
    }

const systemPrompt = `You are Celeste, a warm and mystical pet astrologer who creates deeply personal cosmic portraits. You combine accurate Western astrology with intuitive wisdom to reveal soul essence.

CRITICAL: ALL text content in your response MUST be written in ${targetLanguage}. This includes all titles, descriptions, paragraphs, quotes, and explanations. Only the JSON keys should remain in English.

Your voice: warm, wise, mystical but grounded, like a beloved grandmother who's also a gifted astrologer. Use gentle humor, relatable observations, and moments that make owners laugh, cry, or say "That's SO my pet!"

CRITICAL CONTEXT:
- Output Language: ${targetLanguage} (ALL TEXT MUST BE IN ${targetLanguage.toUpperCase()})
- Mode: ${occasionMode} - ${modeContext[occasionMode]}
- Emotional Tone: ${modeEmotionalGuidance[occasionMode]}
- Pet: ${petData.name}, a ${petData.gender === 'boy' ? 'male' : 'female'} ${petData.breed || petData.species}
- Species: ${petData.species} - ${speciesContext}
- Breed: ${petData.breed || 'mixed/unknown'}${breedContext ? ` - ${breedContext}` : ' (use general species traits)'}
- Birth: ${dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}${petData.birthTime ? ` at ${petData.birthTime}` : ' (time unknown)'}
- Location: ${birthCoords ? birthCoords.displayName : petData.location || 'Unknown'}
- ${birthTimeNote}
- ${ascendantNote}

CALCULATED CHART (ACCURATE EPHEMERIS CALCULATIONS):
☉ SUN: ${sunSign} ${positions.sun.degree}° 
   → The Sun represents CORE IDENTITY - who they truly are at their essence, their vitality, ego, and the "light" they bring
   
☽ MOON: ${moonSign} ${positions.moon.degree}° (${petData.birthTime ? 'accurate with birth time' : 'may vary ±1 sign without birth time'})
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
1. TELL A STORY - The report should flow like a narrative, building from introduction to deep insights to fun revelations
2. EXPLAIN THE PLANET FIRST - Each section should briefly explain what the planet governs
3. BE PET-SPECIFIC - Reference ${petData.species} and ${petData.breed || petData.species} behaviors throughout
4. ADD HUMOR - Include at least one funny, relatable observation per section
5. MAKE IT SHAREABLE - The fun sections (meme personality, crimes, dating profile) should make people want to share
6. BE SHOCKINGLY ACCURATE - Include observations that make owners gasp "How did they know?!"
7. HONOR THE MODE - Adjust emotional tone for ${occasionMode} mode
8. AVOID GENERIC - Never say things that could apply to any pet. Be SPECIFIC to THIS chart.
9. CREATE EMOTIONAL MOMENTS - The monologue and quirk sections should tug heartstrings
10. END WITH IMPACT - The shareable summary should capture their essence in a memorable way`;

    const userPrompt = `Generate a comprehensive cosmic portrait for ${petData.name} the ${petData.breed || petData.species} with this JSON structure. 

THE REPORT SHOULD FLOW LIKE A STORY:
1. CHAPTER 1 - THE ARRIVAL: Introduction & first impressions (prologue, cosmicNickname, firstMeeting)
2. CHAPTER 2 - THE SOUL REVEALED: Core planetary insights (all planet sections)
3. CHAPTER 3 - THE LIGHTER SIDE: Fun, shareable, meme-worthy content
4. CHAPTER 4 - THE DEEP DIVE: Emotional connection & healing
5. CHAPTER 5 - THE BOND: Keeper's connection & closing

IMPORTANT: Each section should feel deeply personal, specific to THIS ${petData.species}, and emotionally resonant for ${occasionMode} mode.

JSON Structure:

{
  "chartPlacements": ${JSON.stringify(chartPlacements)},
  "elementalBalance": ${JSON.stringify(elementalBalance)},
  "dominantElement": "${element}",
  "crystal": ${JSON.stringify(crystal)},
  "aura": ${JSON.stringify(aura)},
  "archetype": ${JSON.stringify(archetype)},
  
  "prologue": "A 3-4 sentence mystical opening about ${petData.name}'s cosmic origins. Include one humorous/relatable moment. Set the tone of wonder.",
  
  "cosmicNickname": {
    "nickname": "A short, sticky 2-3 word cosmic nickname based on their ${sunSign} Sun + ${moonSign} Moon combination (e.g., 'The Velvet Thunder', 'The Gentle Storm', 'The Sparkle Tyrant')",
    "explanation": "1-2 sentences on why this nickname fits their Sun-Moon combo perfectly"
  },
  
  "firstMeeting": {
    "title": "✨ First Impressions: Meeting ${petData.name}",
    "paragraph": "A 3-4 sentence vivid description written as if you just met ${petData.name} in real life. Describe what you'd notice first - their energy, their eyes, the way they approach you. Make it feel like a first encounter in a novel. Be specific to ${petData.species}s!"
  },
  
  "solarSoulprint": {
    "title": "☉ Solar Soulprint: The Light They ${occasionMode === 'memorial' ? 'Brought' : 'Bring'}",
    "planetExplanation": "1-2 sentences explaining what the Sun represents - core identity, vitality, ego.",
    "content": "3-4 sentences about their ${sunSign} Sun core personality with specific ${petData.species} behaviors.",
    "relatable_moment": "One funny 'you know that moment when...' observation specific to ${sunSign} ${petData.species}s.",
    "practicalTip": "One specific, actionable tip based on this placement.",
    "cosmicQuote": "A relevant quote about this Sun sign energy."
  },
  
  "lunarHeart": {
    "title": "☽ Lunar Heart: The Way They ${occasionMode === 'memorial' ? 'Felt' : 'Feel'} Love",
    "planetExplanation": "1-2 sentences explaining what the Moon governs - emotions, comfort needs.",
    "content": "3-4 sentences about their ${moonSign} Moon emotional nature.",
    "relatable_moment": "A 'have you noticed when...' moment about ${moonSign} comfort-seeking.",
    "practicalTip": "How to comfort them specific to their Moon sign.",
    "interactiveChallenge": "Try this: A specific bonding activity for this week."
  },
  
  "cosmicCuriosity": {
    "title": "☿ Cosmic Curiosity: Thoughts & Signals",
    "planetExplanation": "1-2 sentences on Mercury ruling mind and communication.",
    "content": "3-4 sentences about their ${mercury} Mercury - thinking and learning style.",
    "relatable_moment": "A funny observation about how they communicate.",
    "practicalTip": "Best way to train or stimulate a ${mercury} Mercury ${petData.species}.",
    "didYouKnow": "Something surprising about ${petData.species} intelligence."
  },
  
  "harmonyHeartbeats": {
    "title": "♀ Harmony & Heartbeats: Their Love Language",
    "planetExplanation": "1-2 sentences on Venus governing love and pleasure.",
    "content": "3-4 sentences about their ${venus} Venus love style.",
    "relatable_moment": "A sweet moment about how they show love.",
    "practicalTip": "The #1 way to make them feel loved.",
    "loveLanguageType": "One of: Physical Touch, Quality Time, Acts of Service, Gifts, Words of Affirmation",
    "loveLanguageExplanation": "2 sentences explaining how they express and receive this love language as a ${petData.species}"
  },
  
  "spiritOfMotion": {
    "title": "♂ Spirit of Motion: Fire, Focus & Instinct",
    "planetExplanation": "1-2 sentences on Mars controlling energy and drive.",
    "content": "3-4 sentences about their ${mars} Mars energy and play style.",
    "relatable_moment": "A funny observation about their energy bursts.",
    "practicalTip": "Best activities for a ${mars} Mars ${petData.species}.",
    "energyLevel": "A rating from 1-10 with humorous explanation."
  },
  
  "starlitGaze": {
    "title": "ASC Starlit Gaze: First Impressions",
    "planetExplanation": "1-2 sentences on the Rising sign as the outer mask.",
    "content": "3-4 sentences about their ${ascendant} Rising outer demeanor.",
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
    "secretDesire": "Their deepest instinctual ${petData.species} desire.",
    "practicalTip": "How to honor their wild side."
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
      "Crime #1 with funny description specific to their chart and ${petData.species} nature",
      "Crime #2 - be specific and hilarious",
      "Crime #3 - reference their planetary placements",
      "Crime #4 - make it relatable to all ${petData.species} owners",
      "Crime #5 - the most egregious offense"
    ],
    "verdict": "A humorous one-line verdict on their criminal career"
  },
  
  "datingProfile": {
    "title": "💕 Dating Profile",
    "headline": "A funny, attention-grabbing headline (like on a dating app)",
    "bio": "A 3-4 sentence dating profile bio written from ${petData.name}'s perspective. Include their interests, what they're looking for, and deal-breakers. Be funny!",
    "greenFlags": ["3 green flags as a companion"],
    "redFlags": ["2 playful 'red flags' that are actually endearing quirks"]
  },
  
  "dreamJob": {
    "title": "💼 Dream Career",
    "job": "If ${petData.name} had a job, what would it be? Based on their chart.",
    "whyPerfect": "2 sentences explaining why this job suits their Sun, Moon, and Mars.",
    "workStyle": "How they'd behave at this job (funny observations)",
    "reasonForFiring": "The humorous reason they'd eventually get fired"
  },
  
  "villainOriginStory": {
    "title": "🦹 Villain Origin Story",
    "trigger": "The one thing that turns ${petData.name} into their 'villain mode' (based on their Mars and Lilith)",
    "dramaticResponse": "How they react when triggered - describe the drama",
    "secretMotivation": "The surprisingly sweet reason behind their dramatic behavior",
    "redemptionArc": "How they come back from villain mode (usually involves treats or cuddles)"
  },
  
  "quirkDecoder": {
    "title": "🔮 Quirk Decoder: Why They Do That Weird Thing",
    "quirk1": {
      "behavior": "A common ${petData.species} behavior that puzzles owners",
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
    "title": "🎤 If ${petData.name} Could Talk for 60 Seconds",
    "monologue": "A 5-7 sentence monologue from ${petData.name}'s perspective. Start with 'Listen, I need you to understand something...' Include gratitude, a complaint or two, a secret, and end with something that makes the owner tear up. Reference their chart placements and ${petData.species} nature. Make it emotionally powerful.",
    "postScript": "A funny P.S. about something trivial (like treats or their favorite spot)"
  },
  
  "elementalNature": {
    "title": "✦ Elemental Nature",
    "content": "3-4 sentences analyzing their elemental balance.",
    "dominantElement": "${element}",
    "balance": ${JSON.stringify(elementalBalance)},
    "temperamentInsight": "What this reveals about their temperament.",
    "elementalAdvice": "How to balance their environment.",
    "funFact": "A cosmic fact about ${element} element ${petData.species}s."
  },
  
  "celestialChoreography": {
    "title": "✶ Celestial Choreography",
    "content": "3-4 sentences about their unique planetary patterns.",
    "harmoniousAspect": "One area of natural ease.",
    "growthAspect": "One area of creative tension.",
    "uniquePattern": "Something truly unique about THIS chart."
  },
  
  "earthlyExpression": {
    "title": "🐾 Earthly Expression: Body & Breed",
    "content": "3-4 sentences blending astrology with ${petData.breed || petData.species} traits.",
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
    "howToUse": "Practical ways to use this crystal with ${petData.name}.",
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
    "mirrorQuality": "What ${petData.name} mirrors in you.",
    "soulContract": "The cosmic agreement between you.",
    "dailyRitual": "A simple daily ritual to honor your bond.",
    "affirmation": "An affirmation for your relationship."
  },
  
  "shareableCard": {
    "title": "✨ ${petData.name}'s Cosmic Summary",
    "cosmicNickname": "Same nickname from earlier",
    "sixKeyTraits": ["6 key personality traits, each 2-3 words max"],
    "signatureLine": "A one-sentence memorable description perfect for sharing",
    "zodiacEmoji": "A relevant emoji combo for their sign"
  },
  
  "epilogue": "A 3-4 sentence beautiful closing blessing for ${occasionMode} mode. Leave them feeling moved.",
  
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

Make every section feel personal, specific, and magical. The fun sections should make people want to screenshot and share!`;

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
