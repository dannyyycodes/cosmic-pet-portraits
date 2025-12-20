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
  breedInsight: string;
  ownerInsight: string;
  personalityType: string;
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

  let result = sum;
  while (result > 9 && result !== 11 && result !== 22 && result !== 33) {
    result = String(result).split('').reduce((a, b) => a + parseInt(b), 0);
  }
  return result || 1;
}

// Comprehensive breed traits database (matching backend)
const breedTraits: Record<string, { traits: string; cosmicNote: string }> = {
  // Dogs
  'labrador': { traits: 'friendly, outgoing, high-spirited, food-motivated', cosmicNote: 'Their eternal optimism is written in the stars—Labradors radiate pure joy.' },
  'golden retriever': { traits: 'devoted, intelligent, friendly, people-pleaser', cosmicNote: 'Born to love unconditionally—their hearts are as golden as their coats.' },
  'german shepherd': { traits: 'loyal, confident, courageous, protective', cosmicNote: 'Natural guardians with noble souls—they take their cosmic duty seriously.' },
  'border collie': { traits: 'brilliant, energetic, intense, work-focused', cosmicNote: 'The Einsteins of the dog world—their minds never stop exploring.' },
  'husky': { traits: 'independent, mischievous, vocal, escape-artist', cosmicNote: 'Wild spirits who answer to the call of the moon—drama is their native tongue.' },
  'siberian husky': { traits: 'independent, mischievous, vocal, stubborn', cosmicNote: 'Wild spirits who answer to the call of the moon—drama is their native tongue.' },
  'beagle': { traits: 'curious, merry, nose-driven, food-obsessed', cosmicNote: 'Their nose is their cosmic compass—following scent trails through dimensions.' },
  'boxer': { traits: 'playful, loyal, eternally puppy-like, clownish', cosmicNote: 'Forever young at heart—their wiggle-butt joy is cosmically contagious.' },
  'bulldog': { traits: 'calm, courageous, stubborn, gentle', cosmicNote: 'Zen masters disguised as couch potatoes—their snores are meditative mantras.' },
  'french bulldog': { traits: 'playful, adaptable, attention-loving, goofy', cosmicNote: 'Comedians of the cosmos—their bat ears tune into frequencies of fun.' },
  'poodle': { traits: 'intelligent, active, elegant, proud', cosmicNote: 'Aristocrats of the animal kingdom—their brains sparkle like cosmic diamonds.' },
  'dachshund': { traits: 'curious, brave, stubborn, big-dog-attitude', cosmicNote: 'Fearless warriors in small packages—their determination moves mountains.' },
  'yorkshire terrier': { traits: 'feisty, affectionate, spirited, sassy', cosmicNote: 'Royal souls in compact forms—their attitude could rule empires.' },
  'yorkie': { traits: 'feisty, affectionate, spirited, sassy', cosmicNote: 'Royal souls in compact forms—their attitude could rule empires.' },
  'shih tzu': { traits: 'affectionate, outgoing, playful, royal', cosmicNote: 'Ancient palace companions—their destiny is to be adored.' },
  'chihuahua': { traits: 'loyal, sassy, confident, one-person-focused', cosmicNote: 'Mighty spirits in tiny vessels—their love is fierce and eternal.' },
  'pomeranian': { traits: 'extroverted, vivacious, bold, fluffy', cosmicNote: 'Balls of cosmic energy wrapped in fluff—they demand the spotlight.' },
  'corgi': { traits: 'intelligent, alert, athletic, sploot-master', cosmicNote: 'Royal herders with magical butts—their sploot is a form of meditation.' },
  'pit bull': { traits: 'loyal, affectionate, eager-to-please, strong', cosmicNote: 'Hearts of pure gold—their love breaks through all barriers.' },
  'maltese': { traits: 'gentle, playful, charming, devoted', cosmicNote: 'Angelic companions wrapped in silk—their sweetness is cosmic.' },
  'great dane': { traits: 'friendly, patient, dependable, gentle-giant', cosmicNote: 'Gentle giants who think they are lap dogs—their hearts are vast as galaxies.' },
  
  // Cats
  'persian': { traits: 'calm, sweet, gentle, serene', cosmicNote: 'Ancient royalty reborn—their flat faces hold secrets of the cosmos.' },
  'maine coon': { traits: 'gentle, intelligent, dog-like, chirpy', cosmicNote: 'Forest spirits in domestic form—their size matches their hearts.' },
  'siamese': { traits: 'vocal, social, opinionated, intense-bonder', cosmicNote: 'They have OPINIONS and will share them—their blue eyes see into souls.' },
  'ragdoll': { traits: 'gentle, affectionate, relaxed, floppy', cosmicNote: 'Living cuddle clouds—their limpness is trust made physical.' },
  'bengal': { traits: 'active, intelligent, wild-looking, water-loving', cosmicNote: 'Jungle spirits in spotted coats—their energy is untamed cosmic fire.' },
  'british shorthair': { traits: 'calm, easygoing, independent, dignified', cosmicNote: 'Stoic philosophers in plush coats—their round faces radiate wisdom.' },
  'sphynx': { traits: 'energetic, mischievous, attention-seeking, warm', cosmicNote: 'Aliens disguised as cats—their hairless bodies hide cosmic secrets.' },
  'tabby': { traits: 'friendly, outgoing, adaptable, classic', cosmicNote: 'The M on their forehead marks them as chosen by the moon.' },
  'orange tabby': { traits: 'friendly, affectionate, food-motivated, bold', cosmicNote: 'One brain cell, infinite charm—their orange glow is pure sunshine.' },
  'calico': { traits: 'sassy, independent, spirited, strong-willed', cosmicNote: 'Three-colored magic—each patch carries different cosmic energy.' },
  
  // Horses
  'arabian': { traits: 'intelligent, spirited, loyal, endurance', cosmicNote: 'Desert wind made flesh—their dished faces catch cosmic breezes.' },
  'quarter horse': { traits: 'calm, versatile, athletic, gentle', cosmicNote: 'All-American souls—they adapt to any cosmic challenge.' },
  'thoroughbred': { traits: 'athletic, sensitive, intelligent, competitive', cosmicNote: 'Born to run with the stars—their speed transcends physical limits.' },
  
  // Birds
  'cockatiel': { traits: 'affectionate, musical, gentle, whistler', cosmicNote: 'Their crests are cosmic antennae—they whistle messages from the stars.' },
  'budgie': { traits: 'playful, social, talkative, colorful', cosmicNote: 'Chatter machines of joy—their colors reflect rainbow dimensions.' },
  'african grey': { traits: 'brilliant, sensitive, vocal, emotional', cosmicNote: 'Possibly smarter than us—their grey feathers hide Einstein brains.' },
  
  // Rabbits
  'holland lop': { traits: 'sweet, playful, gentle, floppy-eared', cosmicNote: 'Their floppy ears catch whispers from the moon—pure sweetness.' },
  'lionhead': { traits: 'friendly, playful, fluffy, big-personality', cosmicNote: 'Lions in bunny bodies—their manes crown them as royalty.' },
};

// Get breed-specific insight
function getBreedInsight(breed: string, name: string): string {
  if (!breed) return '';
  
  const breedLower = breed.toLowerCase();
  for (const [key, data] of Object.entries(breedTraits)) {
    if (breedLower.includes(key) || key.includes(breedLower.split(' ')[0])) {
      return `As a ${breed}, ${name} naturally embodies ${data.traits}. ${data.cosmicNote}`;
    }
  }
  return '';
}

// Soul type descriptors (matching backend)
const soulTypeDescriptors: Record<string, string> = {
  'old soul': 'carries ancient wisdom—they understand more than they let on',
  'old-soul': 'carries ancient wisdom—they understand more than they let on',
  'playful spirit': 'is eternally young at heart—finding fun in everything',
  'playful-forever': 'is eternally young at heart—finding fun in everything',
  'guardian': 'has a protective, watchful nature—your loyal sentinel',
  'healer': 'intuitively knows when you need comfort—a natural therapist',
  'wise-healer': 'intuitively knows when you need comfort—a natural therapist',
  'adventurer': 'lives for exploration—always ready for the next discovery',
  'zen master': 'embodies calm presence—teaching you to simply BE',
};

// Superpower descriptors (matching backend)
const superpowerDescriptors: Record<string, string> = {
  'telepathy': 'seems to read your mind—knowing what you need before you do',
  'healing presence': 'their presence alone is healing—anxiety melts around them',
  'comic relief': 'has impeccable comedic timing—laughter follows them everywhere',
  'unconditional love': 'loves without conditions—accepting you completely, flaws and all',
  'emotional radar': 'senses emotions others miss—an emotional barometer for the home',
  'calming presence': 'radiates peace—stress dissolves in their presence',
};

// Stranger reaction descriptors (matching backend)
const strangerDescriptors: Record<string, string> = {
  'shy': 'cautious with new people—trust is earned, not freely given',
  'hiding': 'cautious with new people—trust is earned, not freely given',
  'cautious': 'balances wariness with curiosity—warming up gradually',
  'friendly': 'welcomes everyone—strangers are just friends they haven\'t met',
  'excited': 'greets everyone with boundless enthusiasm',
  'overwhelming': 'greets everyone with boundless enthusiasm',
  'protective': 'is a watchful guardian—strangers must prove themselves worthy',
  'indifferent': 'acknowledges strangers when they choose—their attention is a gift',
  'aloof': 'acknowledges strangers when they choose—their attention is a gift',
};

// Generate owner insight from provided data
function getOwnerInsight(petData: PetData): string {
  const { name, soulType, superpower, strangerReaction } = petData;
  const insights: string[] = [];
  
  // Check soul type
  if (soulType) {
    const soulLower = soulType.toLowerCase();
    for (const [key, desc] of Object.entries(soulTypeDescriptors)) {
      if (soulLower.includes(key.split(' ')[0]) || soulLower.includes(key.split('-')[0])) {
        insights.push(`${name} ${desc}`);
        break;
      }
    }
  }
  
  // Check superpower
  if (superpower) {
    const powerLower = superpower.toLowerCase();
    for (const [key, desc] of Object.entries(superpowerDescriptors)) {
      if (powerLower.includes(key.split(' ')[0])) {
        insights.push(`${name} ${desc}`);
        break;
      }
    }
  }
  
  // Check stranger reaction
  if (strangerReaction) {
    const reactionLower = strangerReaction.toLowerCase();
    for (const [key, desc] of Object.entries(strangerDescriptors)) {
      if (reactionLower.includes(key)) {
        insights.push(`With strangers, ${name} ${desc}`);
        break;
      }
    }
  }
  
  return insights.join(' ') || '';
}

// Meme personality types based on chart energy
function getPersonalityType(element: string, soulType: string, strangerReaction: string): string {
  const types = {
    'Fire-friendly': 'The Adventure Seeker',
    'Fire-shy': 'The Secret Enthusiast',
    'Fire-protective': 'The Fearless Guardian',
    'Earth-friendly': 'The Cuddly Dictator',
    'Earth-shy': 'The Couch Potato Royalty',
    'Earth-protective': 'The Silent Judge',
    'Air-friendly': 'The Chaos Goblin',
    'Air-shy': 'The Curious Observer',
    'Air-protective': 'The Chaotic Good',
    'Water-friendly': 'The Velcro Shadow',
    'Water-shy': 'The Mystical Dreamer',
    'Water-protective': 'The Empath Guardian',
  };
  
  const strangerKey = strangerReaction?.toLowerCase().includes('shy') || strangerReaction?.toLowerCase().includes('hiding') 
    ? 'shy' 
    : strangerReaction?.toLowerCase().includes('protect') 
      ? 'protective' 
      : 'friendly';
  
  const key = `${element}-${strangerKey}`;
  return types[key as keyof typeof types] || 'The Unique Soul';
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
  guinea_pig: [
    "To teach you that vocal expression brings communities together.",
    "To show you the joy of simple pleasures and fresh vegetables.",
    "To remind you that companionship makes everything better.",
    "To bring gentle energy and happy sounds to your home.",
    "To demonstrate that popcorning is the purest expression of joy.",
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
    "An uncanny ability to find the one person who doesn't like cats.",
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
    "The gift of entertainment through endless wheel running.",
    "The power to make any tube a grand adventure.",
    "An internal body clock perfectly tuned to twilight hours.",
  ],
  guinea_pig: [
    "The power of wheeks that can be heard rooms away.",
    "An ability to recognize their human's footsteps.",
    "The gift of popcorning that spreads contagious joy.",
    "A social intelligence that craves herd connection.",
    "The power to melt hearts with their round, curious faces.",
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
  const { name, gender, species, breed, soulType } = petData;
  const pronoun = gender === 'girl' ? 'she' : gender === 'boy' ? 'he' : 'they';
  const possessive = gender === 'girl' ? 'her' : gender === 'boy' ? 'his' : 'their';
  
  // Use owner-provided soul type if available
  const soulDescription = soulType 
    ? soulTypeDescriptors[soulType.toLowerCase()] || soulType
    : `${archetype.toLowerCase()} nature`;
  
  const breedMention = breed ? ` As a ${breed},` : '';
  
  const essences = [
    `${name} carries ${possessive} ${element} energy with natural grace.${breedMention} ${pronoun} brings unique gifts that complement your own energy perfectly—a ${soulDescription}.`,
    `At ${possessive} core, ${name} is driven by ${element} energy—making ${pronoun} both grounded and intuitive.${breedMention} ${possessive.charAt(0).toUpperCase() + possessive.slice(1)} ${archetype.toLowerCase()} nature means ${pronoun} will always seek to balance your energy.`,
    `${name}'s ${element} soul radiates through everything ${pronoun} does.${breedMention} The ${archetype.toLowerCase()} within ${pronoun} seeks meaning in every interaction with you.`,
    `Born under ${element} influence, ${name} possesses wisdom that goes beyond ordinary understanding.${breedMention} ${possessive.charAt(0).toUpperCase() + possessive.slice(1)} ${archetype.toLowerCase()} nature is a gift meant specifically for you.`,
  ];
  
  const index = calculateNameVibration(name) % essences.length;
  return essences[index];
}

// Generate cosmic advice based on pet data (now uses owner inputs)
function getCosmicAdvice(petData: PetData, element: string): string {
  const { name, soulType, superpower, strangerReaction } = petData;
  
  const advices: string[] = [];
  
  // Superpower-based advice
  if (superpower?.toLowerCase().includes('healing') || superpower?.toLowerCase().includes('healer')) {
    advices.push(`Let ${name} be near when you're stressed—they actively absorb negative energy to help heal you.`);
  } else if (superpower?.toLowerCase().includes('telepathy')) {
    advices.push(`Pay attention when ${name} acts unusual—they're often responding to thoughts you haven't voiced yet.`);
  } else if (superpower?.toLowerCase().includes('love')) {
    advices.push(`${name}'s unconditional love is their superpower—accept it fully without feeling you must earn it.`);
  }
  
  // Stranger-based advice
  if (strangerReaction?.toLowerCase().includes('shy') || strangerReaction?.toLowerCase().includes('hiding')) {
    advices.push(`Give ${name} space with new people—their trust is a precious gift that must be earned slowly.`);
  } else if (strangerReaction?.toLowerCase().includes('protect')) {
    advices.push(`Honor ${name}'s protective instincts—they take their guardian role seriously.`);
  }
  
  // Soul type advice
  if (soulType?.toLowerCase().includes('old')) {
    advices.push(`Respect ${name}'s quiet wisdom. They don't need constant entertainment—they value peaceful presence.`);
  } else if (soulType?.toLowerCase().includes('playful')) {
    advices.push(`Never stop playing with ${name}! Their youthful spirit is their greatest gift to you.`);
  }
  
  // Fall back to element-based advice
  if (advices.length === 0) {
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
  }
  
  return advices[0] || `Trust your bond with ${name}. Your connection transcends ordinary understanding.`;
}

/**
 * Generate a unique cosmic report for a specific pet
 * Now uses ALL user inputs for maximum accuracy
 */
export function generateCosmicReport(petData: PetData): CosmicReport {
  const { name, dateOfBirth, species, breed, soulType, strangerReaction } = petData;
  
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
  
  // Get breed-specific insight
  const breedInsight = getBreedInsight(breed || '', name);
  
  // Get owner-provided insight
  const ownerInsight = getOwnerInsight(petData);
  
  // Get meme personality type based on inputs
  const personalityType = getPersonalityType(element, soulType || '', strangerReaction || '');
  
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
    breedInsight,
    ownerInsight,
    personalityType,
  };
}

function getModality(dateOfBirth: Date | null): string {
  if (!dateOfBirth) return 'Mutable';
  
  const month = dateOfBirth.getMonth() + 1;
  const cardinalMonths = [1, 4, 7, 10];
  const fixedMonths = [2, 5, 8, 11];
  
  if (cardinalMonths.includes(month)) return 'Cardinal';
  if (fixedMonths.includes(month)) return 'Fixed';
  return 'Mutable';
}