// Zodiac Compatibility Calculation System
// Calculates compatibility between pets and owners based on zodiac elements, signs, and personality traits

import { getZodiacSign, getZodiacElement } from './zodiac';

export interface CompatibilityResult {
  score: number; // 0-100
  level: 'Cosmic Soulmates' | 'Destined Partners' | 'Harmonious Bond' | 'Growing Together' | 'Opposites Attract';
  emoji: string;
  summary: string;
  strengths: string[];
  challenges: string[];
  advice: string;
  elementMatch: {
    element1: string;
    element2: string;
    harmony: 'Perfect' | 'Complementary' | 'Neutral' | 'Challenging';
  };
}

// Element compatibility matrix (higher = better match)
const elementCompatibility: Record<string, Record<string, number>> = {
  Fire: { Fire: 85, Earth: 50, Air: 95, Water: 40 },
  Earth: { Fire: 50, Earth: 90, Air: 45, Water: 95 },
  Air: { Fire: 95, Earth: 45, Air: 85, Water: 55 },
  Water: { Fire: 40, Earth: 95, Air: 55, Water: 90 },
};

// Sign-specific compatibility bonuses
const signCompatibilityBonus: Record<string, string[]> = {
  Aries: ['Leo', 'Sagittarius', 'Gemini', 'Aquarius'],
  Taurus: ['Virgo', 'Capricorn', 'Cancer', 'Pisces'],
  Gemini: ['Libra', 'Aquarius', 'Aries', 'Leo'],
  Cancer: ['Scorpio', 'Pisces', 'Taurus', 'Virgo'],
  Leo: ['Aries', 'Sagittarius', 'Gemini', 'Libra'],
  Virgo: ['Taurus', 'Capricorn', 'Cancer', 'Scorpio'],
  Libra: ['Gemini', 'Aquarius', 'Leo', 'Sagittarius'],
  Scorpio: ['Cancer', 'Pisces', 'Virgo', 'Capricorn'],
  Sagittarius: ['Aries', 'Leo', 'Libra', 'Aquarius'],
  Capricorn: ['Taurus', 'Virgo', 'Scorpio', 'Pisces'],
  Aquarius: ['Gemini', 'Libra', 'Aries', 'Sagittarius'],
  Pisces: ['Cancer', 'Scorpio', 'Taurus', 'Capricorn'],
};

// Fun personality trait combos for compatibility insights
const elementPairInsights: Record<string, { strengths: string[]; challenges: string[]; advice: string }> = {
  'Fire-Fire': {
    strengths: ['Endless energy together', 'Mutual excitement and adventure', 'Natural playmates'],
    challenges: ['Both want to be the boss', 'Can be too intense sometimes'],
    advice: 'Channel that fiery energy into playtime adventures!'
  },
  'Fire-Earth': {
    strengths: ['Balance of excitement and calm', 'Grounding influence'],
    challenges: ['Different energy levels', 'Patience may be tested'],
    advice: 'Find activities that satisfy both adventure and comfort needs.'
  },
  'Fire-Air': {
    strengths: ['Creative and spontaneous together', 'Endless entertainment', 'Feed each other\'s curiosity'],
    challenges: ['May forget practical matters', 'Can get over-excited'],
    advice: 'Your bond is electric! Just remember to rest sometimes.'
  },
  'Fire-Water': {
    strengths: ['Emotional depth meets passion', 'Learning from differences'],
    challenges: ['Communication styles differ', 'Energy mismatches'],
    advice: 'Patience and understanding will deepen your unique bond.'
  },
  'Earth-Earth': {
    strengths: ['Reliable and steady companionship', 'Mutual love of comfort', 'Trust builds naturally'],
    challenges: ['May get stuck in routines', 'Change can be hard'],
    advice: 'Your stable bond is beautiful. Add small adventures for spice!'
  },
  'Earth-Air': {
    strengths: ['Dreamer meets doer', 'Balance of ideas and action'],
    challenges: ['Different priorities', 'May misunderstand each other'],
    advice: 'Learn to appreciate your different worldviews.'
  },
  'Earth-Water': {
    strengths: ['Deep emotional security', 'Nurturing bond', 'Intuitive understanding'],
    challenges: ['Can be too comfortable', 'May avoid needed changes'],
    advice: 'Your bond is deeply healing. Create cozy rituals together!'
  },
  'Air-Air': {
    strengths: ['Intellectual connection', 'Fun and playful', 'Always something new'],
    challenges: ['May lack grounding', 'Can be scattered'],
    advice: 'Your mental connection is amazing. Remember the basics too!'
  },
  'Air-Water': {
    strengths: ['Head and heart balance', 'Creative emotional expression'],
    challenges: ['Logic vs feelings conflicts', 'Different communication styles'],
    advice: 'Bridge your differences through patience and curiosity.'
  },
  'Water-Water': {
    strengths: ['Profound emotional bond', 'Intuitive understanding', 'Deep empathy'],
    challenges: ['May amplify moods', 'Can be too sensitive together'],
    advice: 'Your emotional connection is magical. Stay grounded together!'
  },
};

function getElementPairKey(element1: string, element2: string): string {
  const sorted = [element1, element2].sort();
  return `${sorted[0]}-${sorted[1]}`;
}

function getElementHarmony(score: number): 'Perfect' | 'Complementary' | 'Neutral' | 'Challenging' {
  if (score >= 90) return 'Perfect';
  if (score >= 70) return 'Complementary';
  if (score >= 50) return 'Neutral';
  return 'Challenging';
}

function getCompatibilityLevel(score: number): CompatibilityResult['level'] {
  if (score >= 90) return 'Cosmic Soulmates';
  if (score >= 75) return 'Destined Partners';
  if (score >= 60) return 'Harmonious Bond';
  if (score >= 45) return 'Growing Together';
  return 'Opposites Attract';
}

function getCompatibilityEmoji(score: number): string {
  if (score >= 90) return '💫✨';
  if (score >= 75) return '🌟💕';
  if (score >= 60) return '💜🤝';
  if (score >= 45) return '🌱💪';
  return '🔥❄️';
}

export function calculateCompatibility(
  birthDate1: string | Date,
  birthDate2: string | Date,
  name1: string,
  name2: string,
  isPetToOwner: boolean = false
): CompatibilityResult {
  const date1 = new Date(birthDate1);
  const date2 = new Date(birthDate2);
  
  const sign1 = getZodiacSign(date1);
  const sign2 = getZodiacSign(date2);
  const element1 = getZodiacElement(sign1);
  const element2 = getZodiacElement(sign2);
  
  // Base score from element compatibility
  let score = elementCompatibility[element1]?.[element2] || 60;
  
  // Bonus for compatible signs
  if (signCompatibilityBonus[sign1]?.includes(sign2)) {
    score += 8;
  }
  
  // Same sign bonus
  if (sign1 === sign2) {
    score += 5;
  }
  
  // Add some variance based on actual dates for uniqueness
  const dayDiff = Math.abs(date1.getDate() - date2.getDate());
  score += (dayDiff % 7) - 3; // -3 to +3 variance
  
  // Clamp score
  score = Math.min(100, Math.max(20, score));
  
  const pairKey = getElementPairKey(element1, element2);
  const insights = elementPairInsights[pairKey] || elementPairInsights['Fire-Earth'];
  
  // Generate personalized summary
  const level = getCompatibilityLevel(score);
  const relationshipType = isPetToOwner ? 'human-pet bond' : 'fur-sibling connection';
  
  let summary = '';
  if (score >= 90) {
    summary = `${name1} and ${name2} share a once-in-a-lifetime ${relationshipType}! Their ${element1}-${element2} connection creates cosmic magic.`;
  } else if (score >= 75) {
    summary = `${name1} and ${name2} were destined to find each other. Their ${sign1}-${sign2} pairing brings out the best in both.`;
  } else if (score >= 60) {
    summary = `${name1} and ${name2} complement each other beautifully. The ${element1} and ${element2} energies create harmony.`;
  } else if (score >= 45) {
    summary = `${name1} and ${name2} are learning and growing together. Their differences make them stronger!`;
  } else {
    summary = `${name1} and ${name2} prove that opposites attract! Their unique bond transcends the stars.`;
  }
  
  return {
    score,
    level,
    emoji: getCompatibilityEmoji(score),
    summary,
    strengths: insights.strengths,
    challenges: insights.challenges,
    advice: insights.advice,
    elementMatch: {
      element1,
      element2,
      harmony: getElementHarmony(elementCompatibility[element1]?.[element2] || 60),
    },
  };
}

// Calculate compatibility for multi-pet households
export function calculateMultiPetCompatibility(
  pets: Array<{ name: string; birthDate: string | Date }>
): Array<{ pet1: string; pet2: string; result: CompatibilityResult }> {
  const results: Array<{ pet1: string; pet2: string; result: CompatibilityResult }> = [];
  
  for (let i = 0; i < pets.length; i++) {
    for (let j = i + 1; j < pets.length; j++) {
      const result = calculateCompatibility(
        pets[i].birthDate,
        pets[j].birthDate,
        pets[i].name,
        pets[j].name,
        false
      );
      results.push({
        pet1: pets[i].name,
        pet2: pets[j].name,
        result,
      });
    }
  }
  
  return results;
}

// Get overall household harmony score for multi-pet
export function getHouseholdHarmonyScore(
  compatibilities: Array<{ result: CompatibilityResult }>
): { score: number; level: string; description: string } {
  if (compatibilities.length === 0) {
    return { score: 0, level: 'N/A', description: 'Add more pets to see household harmony!' };
  }
  
  const avgScore = Math.round(
    compatibilities.reduce((sum, c) => sum + c.result.score, 0) / compatibilities.length
  );
  
  let level = '';
  let description = '';
  
  if (avgScore >= 85) {
    level = 'Cosmic Dream Team';
    description = 'Your pets are a perfectly balanced cosmic family!';
  } else if (avgScore >= 70) {
    level = 'Stellar Squad';
    description = 'Your pets have strong cosmic connections with great energy flow.';
  } else if (avgScore >= 55) {
    level = 'Growing Galaxy';
    description = 'Your pets are learning to harmonize their different energies.';
  } else {
    level = 'Dynamic Universe';
    description = 'Your pets bring exciting variety and contrast to the household!';
  }
  
  return { score: avgScore, level, description };
}
