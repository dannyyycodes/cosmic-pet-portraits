import { getSunSign, zodiacSigns } from './zodiac';
import { PetData } from '@/components/intake/IntakeWizard';

export interface CosmicReport {
  sunSign: string;
  archetype: string;
  element: string;
  modality: string;
  nameVibration: number;
  coreEssence: string;
  soulMission: string;
  hiddenGift: string;
  loveLanguage: string;
  cosmicAdvice: string;
}

// Calculate numerology value for a name
function calculateNameVibration(name: string): number {
  const letterValues: Record<string, number> = {
    'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9,
    'j': 1, 'k': 2, 'l': 3, 'm': 4, 'n': 5, 'o': 6, 'p': 7, 'q': 8, 'r': 9,
    's': 1, 't': 2, 'u': 3, 'v': 4, 'w': 5, 'x': 6, 'y': 7, 'z': 8,
  };

  const sum = name.toLowerCase()
    .split('')
    .filter(char => letterValues[char])
    .reduce((acc, char) => acc + letterValues[char], 0);

  // Reduce to single digit (or master number)
  let result = sum;
  while (result > 9 && result !== 11 && result !== 22 && result !== 33) {
    result = String(result).split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return result || 1;
}

// Species-specific soul missions
const speciesSoulMissions: Record<string, string[]> = {
  dog: [
    "To teach you unconditional loyalty and the joy of simple pleasures.",
    "To remind you that every greeting deserves full enthusiasm.",
    "To show you how to live fully in each moment without regret.",
    "To demonstrate that trust, once earned, creates unbreakable bonds.",
    "To protect your heart and fill your home with unwavering devotion.",
  ],
  cat: [
    "To teach you the sacred art of independence within connection.",
    "To remind you that self-care is not selfish—it's essential.",
    "To show you that mystery and affection can coexist beautifully.",
    "To demonstrate that choosing to love is more meaningful than obligation.",
    "To bring ancient wisdom and quiet companionship to your life.",
  ],
  horse: [
    "To teach you the power of freedom combined with deep partnership.",
    "To carry you through life's journeys with grace and strength.",
    "To show you that vulnerability and power are not opposites.",
    "To remind you of the wild spirit that lives within all beings.",
    "To demonstrate that true connection requires mutual respect.",
  ],
  bird: [
    "To teach you that expression and song lift the spirit daily.",
    "To remind you to see life from new perspectives and heights.",
    "To show you the beauty of living colorfully and authentically.",
    "To bring melody and lightness to your everyday existence.",
    "To demonstrate that freedom and home can coexist in harmony.",
  ],
  rabbit: [
    "To teach you the balance between alertness and peaceful rest.",
    "To show you that gentleness is its own form of strength.",
    "To bring soft comfort and quiet joy to your sanctuary.",
    "To remind you that small creatures carry vast amounts of love.",
    "To demonstrate the magic found in twilight hours of dawn and dusk.",
  ],
  hamster: [
    "To teach you that boundless energy comes in small packages.",
    "To show you the joy of building cozy spaces and storing treasures.",
    "To remind you that nighttime holds its own special magic.",
    "To bring delightful entertainment and curious wonder to your days.",
    "To demonstrate that size has nothing to do with heart.",
  ],
  fish: [
    "To teach you the calming power of flowing movement.",
    "To create a living meditation in your space.",
    "To show you that beauty exists in silent, graceful moments.",
    "To remind you of the vast mysteries beneath the surface.",
    "To bring serenity and wonder to your environment.",
  ],
  reptile: [
    "To teach you patience and the wisdom of ancient beings.",
    "To show you that basking in warmth is necessary for growth.",
    "To remind you of the power of transformation and renewal.",
    "To bring prehistoric wisdom into your modern world.",
    "To demonstrate that cold-blooded doesn't mean cold-hearted.",
  ],
  guinea_pig: [
    "To teach you that vocal expression brings communities together.",
    "To show you the joy of simple pleasures and fresh vegetables.",
    "To remind you that companionship makes everything better.",
    "To bring gentle energy and happy sounds to your home.",
    "To demonstrate that popcorning is the purest expression of joy.",
  ],
  default: [
    "To teach you lessons that only they can share.",
    "To bring unique joy and wisdom to your life journey.",
    "To show you perspectives you never knew existed.",
    "To remind you of the profound bond between all living beings.",
    "To fill your days with their own special magic.",
  ],
};

// Species-specific hidden gifts
const speciesHiddenGifts: Record<string, string[]> = {
  dog: [
    "The ability to sense your emotions before you fully feel them.",
    "A sixth sense for danger that protects the entire household.",
    "The power to turn any stranger into a friend with one tail wag.",
    "An internal clock more precise than any alarm you own.",
    "The gift of making you feel like the most important person on Earth.",
  ],
  cat: [
    "The power to heal through the vibration of their purr.",
    "An uncanny ability to find the one person in the room who doesn't like cats.",
    "The gift of knowing exactly when you need comfort most.",
    "Mastery over the art of appearing in impossible places.",
    "The ability to make you laugh even on your darkest days.",
  ],
  horse: [
    "The power to sense the rider's confidence—or lack of it.",
    "An ancient connection to wind and wild spirits.",
    "The gift of grounding restless human energy.",
    "The ability to remember every trail ever traveled.",
    "A therapeutic presence that heals without words.",
  ],
  bird: [
    "The power to learn and mimic the sounds they love most.",
    "An internal compass that knows magnetic north.",
    "The gift of dawn song that transforms morning energy.",
    "The ability to see colors humans cannot perceive.",
    "A talent for knowing when a storm approaches.",
  ],
  rabbit: [
    "The power to sense vibrations through the earth itself.",
    "Nearly 360-degree vision that misses nothing.",
    "The gift of binky joy that lifts every heart nearby.",
    "An ability to create cozy spaces wherever they go.",
    "The power to communicate volumes with ear position alone.",
  ],
  hamster: [
    "Cheek pouches that hold three times their head size in treats.",
    "The ability to navigate mazes with remarkable memory.",
    "The gift of entertainment through their endless wheel running.",
    "The power to make any tube a grand adventure.",
    "An internal body clock perfectly tuned to twilight hours.",
  ],
  fish: [
    "The power to sense water pressure changes before storms.",
    "A lateral line that feels movement through walls.",
    "The gift of schooling together as one unified being.",
    "The ability to remember faces of those who feed them.",
    "The power to create hypnotic calm in those who watch.",
  ],
  reptile: [
    "A third eye (parietal eye) that senses light and shadow.",
    "The power of regeneration that few creatures possess.",
    "The gift of temperature sensitivity beyond human perception.",
    "The ability to go weeks between meals with grace.",
    "Ancient DNA carrying 300 million years of wisdom.",
  ],
  guinea_pig: [
    "The power of wheeks that can be heard rooms away.",
    "An ability to recognize their human's footsteps.",
    "The gift of popcorning that spreads contagious joy.",
    "A social intelligence that craves herd connection.",
    "The power to melt hearts with their round, curious faces.",
  ],
  default: [
    "A unique gift that science has yet to fully understand.",
    "The power to sense emotions in their environment.",
    "The gift of bringing calm to chaotic moments.",
    "An ability to form bonds that transcend species.",
    "A mysterious connection to cosmic energies.",
  ],
};

// Love languages based on element
const elementLoveLanguages: Record<string, string> = {
  Fire: "Active play and adventure. They show love through excitement and energy.",
  Earth: "Physical presence and routine. They show love through reliable companionship.",
  Air: "Verbal interaction and variety. They show love through playful engagement.",
  Water: "Deep emotional connection. They show love through intuitive understanding.",
};

// Core essences based on archetype qualities
function getCoreEssence(petData: PetData, archetype: string, element: string): string {
  const { name, gender, species } = petData;
  const pronoun = gender === 'girl' ? 'she' : gender === 'boy' ? 'he' : 'they';
  const possessive = gender === 'girl' ? 'her' : gender === 'boy' ? 'his' : 'their';
  
  const essences = [
    `${name} carries ${possessive} ${element} energy with natural grace. As a ${archetype}, ${pronoun} brings unique gifts that complement your own energy perfectly.`,
    `At ${possessive} core, ${name} is driven by ${element} energy—making ${pronoun} both grounded and intuitive. ${possessive.charAt(0).toUpperCase() + possessive.slice(1)} ${archetype} nature means ${pronoun} will always seek to balance your energy with ${possessive} own.`,
    `${name}'s ${element} soul radiates through everything ${pronoun} does. The ${archetype} within ${pronoun} seeks meaning in every interaction with you.`,
    `Born under ${element} influence, ${name} possesses wisdom that goes beyond ordinary understanding. ${possessive.charAt(0).toUpperCase() + possessive.slice(1)} ${archetype} nature is a gift meant specifically for you.`,
  ];
  
  // Use name's numeric value to select consistently
  const index = calculateNameVibration(name) % essences.length;
  return essences[index];
}

// Generate cosmic advice based on pet data
function getCosmicAdvice(petData: PetData, element: string): string {
  const { name, species, soulType, superpower, strangerReaction } = petData;
  
  const advices: string[] = [];
  
  // Add element-based advice
  switch (element) {
    case 'Fire':
      advices.push(`Give ${name} plenty of active play time—their Fire soul needs to burn bright through movement and adventure.`);
      break;
    case 'Earth':
      advices.push(`Maintain consistent routines for ${name}—their Earth soul finds security in predictable rhythms.`);
      break;
    case 'Air':
      advices.push(`Keep ${name} mentally stimulated with new experiences—their Air soul craves variety and discovery.`);
      break;
    case 'Water':
      advices.push(`Create calm, safe spaces for ${name}—their Water soul needs environments where emotions can flow freely.`);
      break;
  }
  
  // Add soul type advice if available
  if (soulType === 'old-soul') {
    advices.push(`Respect ${name}'s quiet wisdom. They don't need constant entertainment—they value peaceful presence.`);
  } else if (soulType === 'playful-forever') {
    advices.push(`Never stop playing with ${name}! Their youthful spirit is their greatest gift to you.`);
  } else if (soulType === 'wise-healer') {
    advices.push(`Let ${name} be near when you're stressed—they actively absorb negative energy to help heal you.`);
  }
  
  return advices[0] || `Trust your bond with ${name}. Your connection transcends ordinary understanding.`;
}

/**
 * Generate a unique cosmic report for a specific pet
 */
export function generateCosmicReport(petData: PetData): CosmicReport {
  const { name, dateOfBirth, species } = petData;
  
  // Calculate zodiac from DOB
  let sunSign = 'Pisces';
  let zodiacData = zodiacSigns.pisces;
  
  if (dateOfBirth) {
    const month = dateOfBirth.getMonth() + 1;
    const day = dateOfBirth.getDate();
    const signKey = getSunSign(month, day);
    sunSign = zodiacSigns[signKey]?.name || 'Pisces';
    zodiacData = zodiacSigns[signKey] || zodiacSigns.pisces;
  }
  
  const archetype = zodiacData.archetype;
  const element = zodiacData.element;
  const nameVibration = calculateNameVibration(name);
  
  // Get species-specific content
  const normalizedSpecies = species?.toLowerCase() || 'default';
  const soulMissions = speciesSoulMissions[normalizedSpecies] || speciesSoulMissions.default;
  const hiddenGifts = speciesHiddenGifts[normalizedSpecies] || speciesHiddenGifts.default;
  
  // Use name vibration and DOB to select unique content consistently
  const seed = nameVibration + (dateOfBirth?.getDate() || 1);
  const soulMissionIndex = seed % soulMissions.length;
  const hiddenGiftIndex = (seed + 1) % hiddenGifts.length;
  
  return {
    sunSign,
    archetype,
    element,
    modality: getModality(dateOfBirth),
    nameVibration,
    coreEssence: getCoreEssence(petData, archetype, element),
    soulMission: soulMissions[soulMissionIndex],
    hiddenGift: hiddenGifts[hiddenGiftIndex],
    loveLanguage: elementLoveLanguages[element] || elementLoveLanguages.Earth,
    cosmicAdvice: getCosmicAdvice(petData, element),
  };
}

function getModality(dateOfBirth: Date | null): string {
  if (!dateOfBirth) return 'Mutable';
  
  const month = dateOfBirth.getMonth() + 1;
  const cardinalMonths = [1, 4, 7, 10]; // Cap, Ari, Can, Lib starts
  const fixedMonths = [2, 5, 8, 11]; // Aqu, Tau, Leo, Sco starts
  
  if (cardinalMonths.includes(month)) return 'Cardinal';
  if (fixedMonths.includes(month)) return 'Fixed';
  return 'Mutable';
}
