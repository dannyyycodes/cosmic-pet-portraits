import { getSunSign, zodiacSigns } from './zodiac';
import { PetData } from '@/components/intake/IntakeWizard';
import { OccasionMode, occasionModeContent } from './occasionMode';

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
  occasionMode: OccasionMode;
}

// Get occasion mode from pet data or default
function getOccasionMode(petData: PetData): OccasionMode {
  const mode = petData.occasionMode as OccasionMode;
  if (mode && ['discover', 'birthday', 'memorial', 'gift'].includes(mode)) {
    return mode;
  }
  return 'discover';
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

// Verb type for tense handling
type VerbTense = { is: string; has: string; does: string; loves: string; brings: string; makes: string; feels: string; shows: string; reacts: string; greets: string; };

// Get breed-specific insight with tense
function getBreedInsight(breed: string, name: string, verb: VerbTense = { is: 'is', has: 'has', does: 'does', loves: 'loves', brings: 'brings', makes: 'makes', feels: 'feels', shows: 'shows', reacts: 'reacts', greets: 'greets' }): string {
  if (!breed) return '';
  
  const breedLower = breed.toLowerCase();
  for (const [key, data] of Object.entries(breedTraits)) {
    if (breedLower.includes(key) || key.includes(breedLower.split(' ')[0])) {
      return `As a ${breed}, ${name} naturally ${verb.is === 'was' ? 'embodied' : 'embodies'} ${data.traits}. ${data.cosmicNote}`;
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

// Generate owner insight from provided data with tense support
function getOwnerInsight(petData: PetData, verb: VerbTense = { is: 'is', has: 'has', does: 'does', loves: 'loves', brings: 'brings', makes: 'makes', feels: 'feels', shows: 'shows', reacts: 'reacts', greets: 'greets' }): string {
  const { name, soulType, superpower, strangerReaction } = petData;
  const insights: string[] = [];
  const isPast = verb.is === 'was';
  
  // Check soul type
  if (soulType) {
    const soulLower = soulType.toLowerCase();
    for (const [key, desc] of Object.entries(soulTypeDescriptors)) {
      if (soulLower.includes(key.split(' ')[0]) || soulLower.includes(key.split('-')[0])) {
        const pastDesc = desc.replace('carries', 'carried').replace('is ', 'was ').replace('has ', 'had ').replace('intuitively knows', 'intuitively knew').replace('lives', 'lived').replace('embodies', 'embodied');
        insights.push(`${name} ${isPast ? pastDesc : desc}`);
        break;
      }
    }
  }
  
  // Check superpower
  if (superpower) {
    const powerLower = superpower.toLowerCase();
    for (const [key, desc] of Object.entries(superpowerDescriptors)) {
      if (powerLower.includes(key.split(' ')[0])) {
        const pastDesc = desc.replace('seems', 'seemed').replace('is ', 'was ').replace('has ', 'had ').replace('loves', 'loved').replace('senses', 'sensed').replace('radiates', 'radiated');
        insights.push(`${name} ${isPast ? pastDesc : desc}`);
        break;
      }
    }
  }
  
  // Check stranger reaction
  if (strangerReaction) {
    const reactionLower = strangerReaction.toLowerCase();
    for (const [key, desc] of Object.entries(strangerDescriptors)) {
      if (reactionLower.includes(key)) {
        const pastDesc = desc.replace('is ', 'was ').replace('balances', 'balanced').replace('welcomes', 'welcomed').replace('greets', 'greeted').replace('acknowledges', 'acknowledged');
        insights.push(`With strangers, ${name} ${isPast ? pastDesc : desc}`);
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

// Species-specific soul missions with occasion variants
const speciesSoulMissions: Record<string, Record<string, string[]>> = {
  dog: {
    present: [
      "To teach you unconditional loyalty and the joy of simple pleasures.",
      "To remind you that every greeting deserves full enthusiasm.",
      "To show you how to live fully in each moment without regret.",
      "To demonstrate that trust, once earned, creates unbreakable bonds.",
      "To protect your heart and fill your home with unwavering devotion.",
    ],
    past: [
      "They taught you what unconditional loyalty truly means.",
      "They showed you that every moment together was worth celebrating.",
      "They demonstrated how to live fully and love without reservation.",
      "They proved that the bonds of trust last beyond this lifetime.",
      "They protected your heart and filled your home with unwavering devotion.",
    ],
    birthday: [
      "To celebrate another year of unconditional love and joyful greetings!",
      "To mark another orbit of pure enthusiasm and loyal companionship!",
      "To honor another year of living fully in every precious moment together!",
      "To celebrate the gift of trust and the unbreakable bond you share!",
      "To rejoice in another year of devotion that fills your home with love!",
    ],
  },
  cat: {
    present: [
      "To teach you the sacred art of independence within connection.",
      "To remind you that self-care is not selfish—it's essential.",
      "To show you that mystery and affection can coexist beautifully.",
      "To demonstrate that choosing to love is more meaningful than obligation.",
      "To bring ancient wisdom and quiet companionship to your life.",
    ],
    past: [
      "They taught you the sacred balance of independence and deep connection.",
      "They reminded you that taking care of yourself matters deeply.",
      "They showed you that mystery and love can coexist beautifully.",
      "They chose to love you—and that choice meant everything.",
      "They brought ancient wisdom and quiet grace into your life.",
    ],
    birthday: [
      "To celebrate another year of elegant independence and chosen affection!",
      "To honor another orbit of teaching you the art of graceful self-care!",
      "To mark another year of mysterious charm and genuine connection!",
      "To rejoice in another year of being chosen by this beautiful soul!",
      "To celebrate the ancient wisdom they bring to your modern life!",
    ],
  },
  horse: {
    present: [
      "To teach you the power of freedom combined with deep partnership.",
      "To carry you through life's journeys with grace and strength.",
      "To show you that vulnerability and power are not opposites.",
      "To remind you of the wild spirit that lives within all beings.",
      "To demonstrate that true connection requires mutual respect.",
    ],
    past: [
      "They taught you that freedom and partnership can coexist beautifully.",
      "They carried you through life's journeys with grace and unwavering strength.",
      "They showed you that being vulnerable is the truest form of power.",
      "They reminded you of the wild, free spirit that lives in us all.",
      "They demonstrated what true connection built on mutual respect looks like.",
    ],
    birthday: [
      "To celebrate another year of freedom, partnership, and wild spirit!",
      "To honor another orbit of graceful journeys together!",
      "To mark another year of powerful connection and gentle vulnerability!",
      "To rejoice in another year with this magnificent free spirit!",
      "To celebrate the mutual respect and deep bond you share!",
    ],
  },
  bird: {
    present: [
      "To teach you that expression and song lift the spirit daily.",
      "To remind you to see life from new perspectives and heights.",
      "To show you the beauty of living colorfully and authentically.",
      "To bring melody and lightness to your everyday existence.",
      "To demonstrate that freedom and home can coexist in harmony.",
    ],
    past: [
      "They taught you that expression and song can lift any spirit.",
      "They showed you life from perspectives you never imagined.",
      "They lived colorfully and authentically, inspiring you to do the same.",
      "They brought melody and lightness that still echoes in your heart.",
      "They proved that freedom and belonging can exist in perfect harmony.",
    ],
    birthday: [
      "To celebrate another year of beautiful songs and lifted spirits!",
      "To honor another orbit of seeing the world from new heights!",
      "To mark another year of colorful, authentic living!",
      "To rejoice in another year of melody and lightness!",
      "To celebrate the harmony of freedom and home they embody!",
    ],
  },
  rabbit: {
    present: [
      "To teach you the balance between alertness and peaceful rest.",
      "To show you that gentleness is its own form of strength.",
      "To bring soft comfort and quiet joy to your sanctuary.",
      "To remind you that small creatures carry vast amounts of love.",
      "To demonstrate the magic found in twilight hours of dawn and dusk.",
    ],
    past: [
      "They taught you the beautiful balance of alertness and peaceful rest.",
      "They showed you that gentleness carries its own quiet strength.",
      "They brought soft comfort and joy to your sanctuary.",
      "They proved that small creatures carry the biggest love.",
      "They shared the magic of twilight hours with you.",
    ],
    birthday: [
      "To celebrate another year of gentle binkies and peaceful presence!",
      "To honor another orbit of soft strength and quiet joy!",
      "To mark another year of comfort and sanctuary together!",
      "To rejoice in the vast love carried in this small, precious being!",
      "To celebrate the twilight magic you share!",
    ],
  },
  hamster: {
    present: [
      "To teach you that boundless energy comes in small packages.",
      "To show you the joy of building cozy spaces and storing treasures.",
      "To remind you that nighttime holds its own special magic.",
      "To bring delightful entertainment and curious wonder to your days.",
      "To demonstrate that size has nothing to do with heart.",
    ],
    past: [
      "They taught you that the smallest beings can have the biggest energy.",
      "They showed you joy in building cozy spaces and treasuring the little things.",
      "They reminded you of the magic that happens after dark.",
      "They brought endless entertainment and wonder to your life.",
      "They proved that size has nothing to do with the size of one's heart.",
    ],
    birthday: [
      "To celebrate another year of boundless energy and tiny adventures!",
      "To honor another orbit of cozy nest-building and treasure collecting!",
      "To mark another year of nighttime magic and wheel-spinning joy!",
      "To rejoice in the entertainment and wonder they bring!",
      "To celebrate the enormous heart in this tiny package!",
    ],
  },
  guinea_pig: {
    present: [
      "To teach you that vocal expression brings communities together.",
      "To show you the joy of simple pleasures and fresh vegetables.",
      "To remind you that companionship makes everything better.",
      "To bring gentle energy and happy sounds to your home.",
      "To demonstrate that popcorning is the purest expression of joy.",
    ],
    past: [
      "They taught you that expressing yourself builds beautiful connections.",
      "They showed you joy in the simplest pleasures.",
      "They reminded you how much better life is with companionship.",
      "They filled your home with gentle energy and happy wheeks.",
      "They showed you what pure joy looks like through their popcorning.",
    ],
    birthday: [
      "To celebrate another year of happy wheeks and joyful popcorning!",
      "To honor another orbit of simple pleasures and veggie treats!",
      "To mark another year of precious companionship!",
      "To rejoice in the gentle, happy energy they bring!",
      "To celebrate pure, unbridled joy in its most adorable form!",
    ],
  },
  fish: {
    present: [
      "To teach you the calming power of flowing movement.",
      "To create a living meditation in your space.",
      "To show you that beauty exists in silent, graceful moments.",
      "To remind you of the vast mysteries beneath the surface.",
      "To bring serenity and wonder to your environment.",
    ],
    past: [
      "They taught you the calming power of graceful, flowing movement.",
      "They created a living meditation that brought you peace.",
      "They showed you beauty in silent, graceful moments.",
      "They reminded you of the mysteries that exist beneath the surface.",
      "They brought serenity and wonder into your everyday life.",
    ],
    birthday: [
      "To celebrate another year of graceful swimming and peaceful presence!",
      "To honor another orbit of living meditation and calm!",
      "To mark another year of silent beauty and gentle wonder!",
      "To rejoice in the mysterious depths of this aquatic soul!",
      "To celebrate the serenity they bring to your world!",
    ],
  },
  reptile: {
    present: [
      "To teach you patience and the wisdom of ancient beings.",
      "To show you that basking in warmth is necessary for growth.",
      "To remind you of the power of transformation and renewal.",
      "To bring prehistoric wisdom into your modern world.",
      "To demonstrate that cold-blooded doesn't mean cold-hearted.",
    ],
    past: [
      "They taught you patience and shared the wisdom of ancient beings.",
      "They showed you the importance of basking in life's warmth.",
      "They reminded you of the power of transformation and renewal.",
      "They brought prehistoric wisdom into your world.",
      "They proved that a cold-blooded exterior hides a warm spirit.",
    ],
    birthday: [
      "To celebrate another year of ancient wisdom and patient grace!",
      "To honor another orbit of basking in life's warmth together!",
      "To mark another year of transformation and growth!",
      "To rejoice in the prehistoric soul who shares your modern life!",
      "To celebrate the warm heart beneath those scales!",
    ],
  },
  default: {
    present: [
      "To teach you lessons that only they can share.",
      "To bring unique joy and wisdom to your life journey.",
      "To show you perspectives you never knew existed.",
      "To remind you of the profound bond between all living beings.",
      "To fill your days with their own special magic.",
    ],
    past: [
      "They taught you lessons no one else could have shared.",
      "They brought unique joy and wisdom to your journey.",
      "They showed you perspectives you never knew existed.",
      "They reminded you of the profound bonds between all living beings.",
      "They filled your days with their own irreplaceable magic.",
    ],
    birthday: [
      "To celebrate another year of unique lessons and special bonds!",
      "To honor another orbit of joy and wisdom shared!",
      "To mark another year of new perspectives and growth together!",
      "To rejoice in the profound connection you share!",
      "To celebrate the special magic they bring to every day!",
    ],
  },
};

// Species-specific hidden gifts with occasion variants
const speciesHiddenGifts: Record<string, Record<string, string[]>> = {
  dog: {
    present: [
      "The ability to sense your emotions before you fully feel them.",
      "A sixth sense for danger that protects the entire household.",
      "The power to turn any stranger into a friend with one tail wag.",
      "An internal clock more precise than any alarm you own.",
      "The gift of making you feel like the most important person on Earth.",
    ],
    past: [
      "The ability to sense your emotions before you even felt them yourself.",
      "A sixth sense for danger that always protected your household.",
      "The power to turn any stranger into a friend with one tail wag.",
      "An internal clock more precise than any alarm you ever owned.",
      "The gift of making you feel like the most important person on Earth.",
    ],
    birthday: [
      "Another year of sensing your emotions before you even feel them!",
      "Celebrating their sixth sense that keeps protecting your household!",
      "Another year of turning strangers into friends with that magical tail wag!",
      "Honoring their internal clock that's more precise than any alarm!",
      "Celebrating the gift of always making you feel important!",
    ],
  },
  cat: {
    present: [
      "The power to heal through the vibration of their purr.",
      "An uncanny ability to find the one person who doesn't like cats.",
      "The gift of knowing exactly when you need comfort most.",
      "Mastery over the art of appearing in impossible places.",
      "The ability to make you laugh even on your darkest days.",
    ],
    past: [
      "The power to heal through the vibration of their purr.",
      "An uncanny ability to find the one person who didn't like cats.",
      "The gift of knowing exactly when you needed comfort most.",
      "Mastery over appearing in the most impossible places.",
      "The ability to make you laugh even on your darkest days.",
    ],
    birthday: [
      "Another year of healing purrs and magical vibrations!",
      "Celebrating their uncanny cat-detector abilities!",
      "Honoring their gift of knowing when you need comfort!",
      "Another year of appearing in impossible places!",
      "Celebrating the laughter they bring to every day!",
    ],
  },
  horse: {
    present: [
      "The power to sense the rider's confidence—or lack of it.",
      "An ancient connection to wind and wild spirits.",
      "The gift of grounding restless human energy.",
      "The ability to remember every trail ever traveled.",
      "A therapeutic presence that heals without words.",
    ],
    past: [
      "The power to sense your confidence—or lack of it—instantly.",
      "An ancient connection to wind and wild spirits.",
      "The gift of grounding your restless energy.",
      "The ability to remember every trail you traveled together.",
      "A therapeutic presence that healed without words.",
    ],
    birthday: [
      "Another year of sensing and responding to your every emotion!",
      "Celebrating their wild spirit and ancient wisdom!",
      "Honoring their gift of grounding your energy!",
      "Another year of remembering every trail together!",
      "Celebrating their healing presence in your life!",
    ],
  },
  default: {
    present: [
      "A unique gift that science has yet to fully understand.",
      "The power to sense emotions in their environment.",
      "The gift of bringing calm to chaotic moments.",
      "An ability to form bonds that transcend species.",
      "A mysterious connection to cosmic energies.",
    ],
    past: [
      "A unique gift that science could never fully explain.",
      "The power to sense emotions in their environment.",
      "The gift of bringing calm to the most chaotic moments.",
      "An ability to form bonds that transcended species.",
      "A mysterious connection to cosmic energies.",
    ],
    birthday: [
      "Another year of gifts that defy understanding!",
      "Celebrating their power to sense emotions around them!",
      "Honoring the calm they bring to chaos!",
      "Another year of bonds that transcend everything!",
      "Celebrating their cosmic connection!",
    ],
  },
};

// Love languages based on element AND species for maximum personalization
const speciesLoveLanguages: Record<string, Record<string, string>> = {
  dog: {
    Fire: "Energetic play sessions and outdoor adventures. Your dog shows love through excited greetings and shared activities.",
    Earth: "Loyal companionship and physical presence. Your dog shows love by always being at your feet, guarding your space.",
    Air: "Interactive games and social outings. Your dog shows love through playful engagement and meeting new friends.",
    Water: "Deep emotional bonding and quiet cuddle time. Your dog shows love by sensing your moods and staying close.",
  },
  cat: {
    Fire: "Sudden bursts of play and chase games. Your cat shows love through dramatic performances and energetic zoomies.",
    Earth: "Claiming your space as theirs. Your cat shows love by sleeping on your things, slow blinks, and routine rituals.",
    Air: "Curious exploration and conversational meows. Your cat shows love through chatty interactions and showing you interesting finds.",
    Water: "Quiet companionship and intuitive presence. Your cat shows love by appearing when you're sad and purring away your pain.",
  },
  horse: {
    Fire: "Spirited rides and groundwork challenges. Your horse shows love through eager responses and willing partnership.",
    Earth: "Calm grooming sessions and steady routines. Your horse shows love through patient presence and quiet trust.",
    Air: "Trail adventures and new experiences. Your horse shows love through curiosity about your activities and gentle nudges.",
    Water: "Deep emotional mirroring and silent understanding. Your horse shows love by sensing your energy before you speak.",
  },
  bird: {
    Fire: "Energetic songs and bold interactions. Your bird shows love through dramatic displays and eager greetings.",
    Earth: "Gentle preening and shoulder time. Your bird shows love through quiet companionship and relaxed presence near you.",
    Air: "Chatty conversations and learning new words. Your bird shows love through mimicking your voice and interactive play.",
    Water: "Soft chirps and intuitive closeness. Your bird shows love by sensing when you need gentle company.",
  },
  rabbit: {
    Fire: "Zoomy binkies and excited running circles around you. Your rabbit shows love through pure expressions of joy.",
    Earth: "Flopping contentedly near you and accepting pets. Your rabbit shows love through relaxed vulnerability in your presence.",
    Air: "Curious investigation and playful nudges. Your rabbit shows love by exploring with you and seeking your attention.",
    Water: "Gentle grooming licks and pressed-close cuddles. Your rabbit shows love through tender moments of connection.",
  },
  hamster: {
    Fire: "Enthusiastic wheel running when you're near. Your hamster shows love through excited activity in your presence.",
    Earth: "Accepting treats from your hand and building nests you can see. Your hamster shows love through growing trust.",
    Air: "Curious exploration when you let them out. Your hamster shows love through excited investigations of your space.",
    Water: "Peaceful sleep when they can see you. Your hamster shows love by feeling safe enough to rest near you.",
  },
  guinea_pig: {
    Fire: "Excited wheeks and popcorning at your arrival. Your guinea pig shows love through vocal celebrations.",
    Earth: "Relaxed munching in your presence. Your guinea pig shows love by eating comfortably around you—a sign of deep trust.",
    Air: "Chatty conversations and social squeaks. Your guinea pig shows love through constant communication with you.",
    Water: "Gentle purring and burrowing into your lap. Your guinea pig shows love through seeking comfort in your warmth.",
  },
  fish: {
    Fire: "Eager feeding time swims and active displays. Your fish shows love through excited recognition of your approach.",
    Earth: "Calm presence in their favorite spots. Your fish shows love by establishing comfortable routines around your schedule.",
    Air: "Curious investigation of anything new. Your fish shows love by interacting with your finger at the glass.",
    Water: "Graceful synchronized movements. Your fish shows love through creating peaceful beauty in your space.",
  },
  reptile: {
    Fire: "Alert engagement when you approach. Your reptile shows love through perking up at your presence.",
    Earth: "Relaxed basking in your company. Your reptile shows love by feeling secure enough to thermoregulate near you.",
    Air: "Curious tongue flicks and exploration. Your reptile shows love through investigating your scent with interest.",
    Water: "Calm stillness in your presence. Your reptile shows love by reducing defensive behavior around you.",
  },
  default: {
    Fire: "Active engagement and excited responses. They show love through energetic displays of joy.",
    Earth: "Physical closeness and routine presence. They show love through reliable companionship.",
    Air: "Curious interaction and playful engagement. They show love through exploring the world with you.",
    Water: "Deep emotional connection and intuitive sensing. They show love through understanding you.",
  },
};

// Helper to get species-specific love language with occasion support
function getLoveLanguage(species: string, element: string, occasionMode: string = 'discover'): string {
  const normalizedSpecies = species?.toLowerCase() || 'default';
  const speciesLanguages = speciesLoveLanguages[normalizedSpecies] || speciesLoveLanguages.default;
  let loveLanguage = speciesLanguages[element] || speciesLanguages.Earth || speciesLoveLanguages.default.Earth;
  
  // Convert to past tense for memorial
  if (occasionMode === 'memorial') {
    loveLanguage = loveLanguage
      .replace(/shows love/g, 'showed love')
      .replace(/Your dog shows/g, 'Your dog showed')
      .replace(/Your cat shows/g, 'Your cat showed')
      .replace(/Your horse shows/g, 'Your horse showed')
      .replace(/Your bird shows/g, 'Your bird showed')
      .replace(/Your rabbit shows/g, 'Your rabbit showed')
      .replace(/Your hamster shows/g, 'Your hamster showed')
      .replace(/Your guinea pig shows/g, 'Your guinea pig showed')
      .replace(/Your fish shows/g, 'Your fish showed')
      .replace(/Your reptile shows/g, 'Your reptile showed')
      .replace(/They show love/g, 'They showed love');
  }
  
  return loveLanguage;
}

// Species-specific core essence templates
const speciesCoreEssences: Record<string, (name: string, pronoun: string, possessive: string, element: string, archetype: string, breed: string, soulDesc: string) => string[]> = {
  dog: (name, pronoun, possessive, element, archetype, breed, soulDesc) => [
    `${name} carries the loyal heart of a ${element} dog—${possessive} devotion runs deeper than you realize.${breed ? ` As a ${breed},` : ''} ${pronoun} was born to be your faithful companion, ${soulDesc}.`,
    `At ${possessive} core, ${name} is driven by the pack instinct combined with ${element} energy. Every tail wag, every greeting, every moment ${pronoun} spends near you is ${possessive} way of saying you matter.`,
    `${name}'s ${element} canine soul radiates through every bark, every sniff, every excited spin.${breed ? ` The ${breed} in ${pronoun}` : ' Their ${archetype.toLowerCase()} nature'} means ${pronoun} will protect your heart with ${possessive} life.`,
    `Born under ${element} influence with a dog's eternal loyalty, ${name} possesses the gift of unconditional love.${breed ? ` As a ${breed},` : ''} ${possessive} ${archetype.toLowerCase()} nature makes ${pronoun} your forever companion.`,
  ],
  cat: (name, pronoun, possessive, element, archetype, breed, soulDesc) => [
    `${name} carries the mystical grace of a ${element} cat—${possessive} independence balanced with deep affection.${breed ? ` As a ${breed},` : ''} ${pronoun} chose you, not the other way around, ${soulDesc}.`,
    `At ${possessive} core, ${name} is a feline enigma wrapped in ${element} energy. The slow blinks, the headbutts, the 3 AM zoomies—all ${possessive} unique language of love.`,
    `${name}'s ${element} cat soul sees dimensions you cannot perceive.${breed ? ` As a ${breed},` : ''} ${possessive} ${archetype.toLowerCase()} nature means ${pronoun} guards both your home and your spirit.`,
    `Born under ${element} influence with a cat's ancient wisdom, ${name} understands things beyond words.${breed ? ` The ${breed} lineage in ${pronoun}` : ` Their ${archetype.toLowerCase()} nature`} connects ${pronoun} to cosmic mysteries.`,
  ],
  horse: (name, pronoun, possessive, element, archetype, breed, soulDesc) => [
    `${name} carries the wild spirit of a ${element} horse—freedom and connection woven together.${breed ? ` As a ${breed},` : ''} ${pronoun} mirrors your emotions with ${possessive} powerful presence, ${soulDesc}.`,
    `At ${possessive} core, ${name} is a partnership soul with ${element} energy flowing through every stride. The bond between you is ancient and unbreakable.`,
    `${name}'s ${element} equine soul runs free while staying tethered to your heart.${breed ? ` As a ${breed},` : ''} ${possessive} ${archetype.toLowerCase()} nature means ${pronoun} will carry you through any storm.`,
    `Born under ${element} influence with a horse's noble heart, ${name} teaches you trust and vulnerability.${breed ? ` The ${breed} spirit in ${pronoun}` : ` Their ${archetype.toLowerCase()} nature`} demands authentic connection.`,
  ],
  bird: (name, pronoun, possessive, element, archetype, breed, soulDesc) => [
    `${name} carries the song of a ${element} bird—free spirit with deep bonds.${breed ? ` As a ${breed},` : ''} ${pronoun} sees the world from heights you'll never reach, ${soulDesc}.`,
    `At ${possessive} core, ${name} is a winged soul with ${element} energy lifting every chirp and whistle. ${possessive.charAt(0).toUpperCase() + possessive.slice(1)} songs are messages from the cosmos.`,
    `${name}'s ${element} avian soul perceives colors and sounds beyond human range.${breed ? ` As a ${breed},` : ''} ${possessive} ${archetype.toLowerCase()} nature connects heaven and earth.`,
    `Born under ${element} influence with a bird's elevated perspective, ${name} brings lightness to your life.${breed ? ` The ${breed} in ${pronoun}` : ` Their ${archetype.toLowerCase()} nature`} gifts you new ways of seeing.`,
  ],
  rabbit: (name, pronoun, possessive, element, archetype, breed, soulDesc) => [
    `${name} carries the gentle magic of a ${element} rabbit—soft yet surprisingly brave.${breed ? ` As a ${breed},` : ''} ${pronoun} senses the world through whisker-fine vibrations, ${soulDesc}.`,
    `At ${possessive} core, ${name} is a twilight soul with ${element} energy. Those binkies aren't just jumps—they're pure joy made visible.`,
    `${name}'s ${element} bunny soul embodies the balance between alertness and peace.${breed ? ` As a ${breed},` : ''} ${possessive} ${archetype.toLowerCase()} nature brings gentle strength to your life.`,
    `Born under ${element} influence with a rabbit's lunar connection, ${name} thrives in the magic hours of dawn and dusk.${breed ? ` The ${breed} in ${pronoun}` : ` Their ${archetype.toLowerCase()} nature`} is pure enchantment.`,
  ],
  default: (name, pronoun, possessive, element, archetype, breed, soulDesc) => [
    `${name} carries ${possessive} ${element} energy with natural grace.${breed ? ` As a ${breed},` : ''} ${pronoun} brings unique gifts that complement your own energy perfectly—${soulDesc}.`,
    `At ${possessive} core, ${name} is driven by ${element} energy—making ${pronoun} both grounded and intuitive.${breed ? ` As a ${breed},` : ''} ${possessive.charAt(0).toUpperCase() + possessive.slice(1)} ${archetype.toLowerCase()} nature means ${pronoun} will always seek to balance your energy.`,
    `${name}'s ${element} soul radiates through everything ${pronoun} does.${breed ? ` As a ${breed},` : ''} The ${archetype.toLowerCase()} within ${pronoun} seeks meaning in every interaction with you.`,
    `Born under ${element} influence, ${name} possesses wisdom that goes beyond ordinary understanding.${breed ? ` As a ${breed},` : ''} ${possessive.charAt(0).toUpperCase() + possessive.slice(1)} ${archetype.toLowerCase()} nature is a gift meant specifically for you.`,
  ],
};

// Core essences based on archetype qualities AND species with tense support
function getCoreEssence(petData: PetData, archetype: string, element: string, verb: VerbTense = { is: 'is', has: 'has', does: 'does', loves: 'loves', brings: 'brings', makes: 'makes', feels: 'feels', shows: 'shows', reacts: 'reacts', greets: 'greets' }): string {
  const { name, gender, species, breed, soulType } = petData;
  const isPast = verb.is === 'was';
  const pronoun = gender === 'girl' ? 'she' : gender === 'boy' ? 'he' : 'they';
  const possessive = gender === 'girl' ? 'her' : gender === 'boy' ? 'his' : 'their';
  
  // Use owner-provided soul type if available
  const soulDescription = soulType 
    ? soulTypeDescriptors[soulType.toLowerCase()] || soulType
    : `${archetype.toLowerCase()} nature`;
  
  const normalizedSpecies = species?.toLowerCase() || 'default';
  const essenceGenerator = speciesCoreEssences[normalizedSpecies] || speciesCoreEssences.default;
  let essences = essenceGenerator(name, pronoun, possessive, element, archetype, breed || '', soulDescription);
  
  // Convert to past tense for memorial
  if (isPast) {
    essences = essences.map(e => e
      .replace(/ carries /g, ' carried ')
      .replace(/ is /g, ' was ')
      .replace(/ brings /g, ' brought ')
      .replace(/ sees /g, ' saw ')
      .replace(/ runs /g, ' ran ')
      .replace(/ teaches /g, ' taught ')
      .replace(/ possesses /g, ' possessed ')
      .replace(/ radiates /g, ' radiated ')
      .replace(/ embodies /g, ' embodied ')
      .replace(/ thrives /g, ' thrived ')
      .replace(/ senses /g, ' sensed ')
      .replace(/ mirrors /g, ' mirrored ')
      .replace(/ guards /g, ' guarded ')
      .replace(/ connects /g, ' connected ')
      .replace(/ understands /g, ' understood ')
      .replace(/ gifts /g, ' gifted ')
      .replace(/was born to be/g, 'was born to be')
      .replace(/will protect/g, 'protected')
      .replace(/will carry/g, 'carried')
      .replace(/will always seek/g, 'always sought')
      .replace(/makes /g, 'made ')
      .replace(/demands /g, 'demanded ')
    );
  }
  
  const index = calculateNameVibration(name) % essences.length;
  return essences[index];
}

// Generate cosmic advice based on pet data with tense support
function getCosmicAdvice(petData: PetData, element: string, verb: VerbTense = { is: 'is', has: 'has', does: 'does', loves: 'loves', brings: 'brings', makes: 'makes', feels: 'feels', shows: 'shows', reacts: 'reacts', greets: 'greets' }): string {
  const { name, soulType, superpower, strangerReaction } = petData;
  const isPast = verb.is === 'was';
  
  const advices: string[] = [];
  
  // Superpower-based advice
  if (superpower?.toLowerCase().includes('healing') || superpower?.toLowerCase().includes('healer')) {
    advices.push(isPast 
      ? `Remember how ${name} was always there when you were stressed—they actively absorbed negative energy to help heal you.`
      : `Let ${name} be near when you're stressed—they actively absorb negative energy to help heal you.`);
  } else if (superpower?.toLowerCase().includes('telepathy')) {
    advices.push(isPast
      ? `${name} always seemed to know what you were thinking—responding to thoughts you hadn't even voiced yet.`
      : `Pay attention when ${name} acts unusual—they're often responding to thoughts you haven't voiced yet.`);
  } else if (superpower?.toLowerCase().includes('love')) {
    advices.push(isPast
      ? `${name}'s unconditional love was their greatest superpower—a gift you carry in your heart forever.`
      : `${name}'s unconditional love is their superpower—accept it fully without feeling you must earn it.`);
  }
  
  // Stranger-based advice
  if (strangerReaction?.toLowerCase().includes('shy') || strangerReaction?.toLowerCase().includes('hiding')) {
    advices.push(isPast
      ? `${name}'s trust was a precious gift—you were one of the chosen few who earned it.`
      : `Give ${name} space with new people—their trust is a precious gift that must be earned slowly.`);
  } else if (strangerReaction?.toLowerCase().includes('protect')) {
    advices.push(isPast
      ? `${name} took their guardian role seriously—always watching over those they loved.`
      : `Honor ${name}'s protective instincts—they take their guardian role seriously.`);
  }
  
  // Soul type advice
  if (soulType?.toLowerCase().includes('old')) {
    advices.push(isPast
      ? `${name}'s quiet wisdom taught you things no words could express. Their peaceful presence remains with you.`
      : `Respect ${name}'s quiet wisdom. They don't need constant entertainment—they value peaceful presence.`);
  } else if (soulType?.toLowerCase().includes('playful')) {
    advices.push(isPast
      ? `${name}'s youthful spirit was contagious—they reminded you how to play and find joy in simple moments.`
      : `Never stop playing with ${name}! Their youthful spirit is their greatest gift to you.`);
  }
  
  // Fall back to element-based advice
  if (advices.length === 0) {
    switch (element) {
      case 'Fire':
        advices.push(isPast
          ? `${name}'s Fire soul burned bright through every adventure you shared—that flame lives on in your memories.`
          : `Give ${name} plenty of active play time—their Fire soul needs to burn bright through movement and adventure.`);
        break;
      case 'Earth':
        advices.push(isPast
          ? `${name}'s Earth soul found joy in your steady presence—your routines together created lasting bonds.`
          : `Maintain consistent routines for ${name}—their Earth soul finds security in predictable rhythms.`);
        break;
      case 'Air':
        advices.push(isPast
          ? `${name}'s Air soul loved every new experience you shared—their curiosity expanded your world too.`
          : `Keep ${name} mentally stimulated with new experiences—their Air soul craves variety and discovery.`);
        break;
      case 'Water':
        advices.push(isPast
          ? `${name}'s Water soul understood your emotions deeply—they created safe space for your feelings to flow.`
          : `Create calm, safe spaces for ${name}—their Water soul needs environments where emotions can flow freely.`);
        break;
    }
  }
  
  return advices[0] || (isPast 
    ? `The bond you shared with ${name} transcends ordinary understanding—their spirit remains with you.`
    : `Trust your bond with ${name}. Your connection transcends ordinary understanding.`);
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
  
  // Get occasion mode for tense-specific content
  const occasionMode = getOccasionMode(petData);
  const modeContent = occasionModeContent[occasionMode];
  const occasionKey = occasionMode === 'memorial' ? 'past' : occasionMode === 'birthday' ? 'birthday' : 'present';
  
  // Get species-specific content with occasion-appropriate tense
  const normalizedSpecies = species?.toLowerCase() || 'default';
  const speciesMissions = speciesSoulMissions[normalizedSpecies] || speciesSoulMissions.default;
  const soulMissions = speciesMissions[occasionKey] || speciesMissions.present;
  const speciesGifts = speciesHiddenGifts[normalizedSpecies] || speciesHiddenGifts.default;
  const hiddenGifts = speciesGifts[occasionKey] || speciesGifts.present;
  
  // Use name vibration and DOB to select unique content consistently
  const seed = nameVibration + (dateOfBirth?.getDate() || 1);
  const soulMissionIndex = seed % soulMissions.length;
  const hiddenGiftIndex = (seed + 1) % hiddenGifts.length;
  
  // Get breed-specific insight
  const breedInsight = getBreedInsight(breed || '', name, modeContent.verb);
  
  // Get owner-provided insight with correct tense
  const ownerInsight = getOwnerInsight(petData, modeContent.verb);
  
  // Get meme personality type based on inputs
  const personalityType = getPersonalityType(element, soulType || '', strangerReaction || '');
  
  return {
    sunSign,
    archetype,
    element,
    modality: getModality(dateOfBirth),
    nameVibration,
    coreEssence: getCoreEssence(petData, archetype, element, modeContent.verb),
    soulMission: soulMissions[soulMissionIndex],
    hiddenGift: hiddenGifts[hiddenGiftIndex],
    loveLanguage: getLoveLanguage(species, element, occasionMode),
    cosmicAdvice: getCosmicAdvice(petData, element, modeContent.verb),
    breedInsight,
    ownerInsight,
    personalityType,
    occasionMode,
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