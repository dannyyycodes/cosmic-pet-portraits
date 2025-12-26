export interface ZodiacSign {
  name: string;
  archetype: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  elementIcon: string;
  coreDescription: string;
  icon: string;
}

export const zodiacSigns: Record<string, ZodiacSign> = {
  aries: {
    name: 'Aries',
    archetype: 'The Fearless Pioneer',
    element: 'Fire',
    elementIcon: '🔥',
    icon: '♈',
    coreDescription: 'Your Aries charges through life with unstoppable courage. They thrive on adventure and challenge. When you understand their need to lead, the bond deepens beyond measure.'
  },
  taurus: {
    name: 'Taurus',
    archetype: 'The Loyal Ground',
    element: 'Earth',
    elementIcon: '🌍',
    icon: '♉',
    coreDescription: 'Your Taurus finds peace in routine and comfort. They are steadfast companions who love deeply and loyally. Understanding their need for stability transforms your connection.'
  },
  gemini: {
    name: 'Gemini',
    archetype: 'The Cosmic Jester',
    element: 'Air',
    elementIcon: '💨',
    icon: '♊',
    coreDescription: 'Your Gemini is endlessly curious and playful. They need mental stimulation and variety. When you engage their mind, you unlock their truest affection.'
  },
  cancer: {
    name: 'Cancer',
    archetype: 'The Moonchild Protector',
    element: 'Water',
    elementIcon: '💧',
    icon: '♋',
    coreDescription: 'Your Cancer feels everything deeply. They are intuitive protectors who sense your emotions. Nurturing their sensitivity creates an unbreakable bond.'
  },
  leo: {
    name: 'Leo',
    archetype: 'The Radiant Guardian',
    element: 'Fire',
    elementIcon: '🔥',
    icon: '♌',
    coreDescription: 'Your Leo lives with their heart wide open. Praise feeds their soul; silence dims it. When you understand this rhythm, the entire relationship changes.'
  },
  virgo: {
    name: 'Virgo',
    archetype: 'The Devoted Healer',
    element: 'Earth',
    elementIcon: '🌍',
    icon: '♍',
    coreDescription: 'Your Virgo serves through acts of quiet devotion. They notice every detail and care deeply about your wellbeing. Recognizing their service language deepens your bond.'
  },
  libra: {
    name: 'Libra',
    archetype: 'The Harmonizer',
    element: 'Air',
    elementIcon: '💨',
    icon: '♎',
    coreDescription: 'Your Libra seeks balance and beauty in all things. They are natural peacemakers who thrive in harmony. Creating a peaceful environment unlocks their true nature.'
  },
  scorpio: {
    name: 'Scorpio',
    archetype: 'The Soul Watcher',
    element: 'Water',
    elementIcon: '💧',
    icon: '♏',
    coreDescription: 'Your Scorpio possesses profound emotional depth. They form intense, transformative bonds. When you earn their trust, you gain a guardian for life.'
  },
  sagittarius: {
    name: 'Sagittarius',
    archetype: 'The Joyful Wanderer',
    element: 'Fire',
    elementIcon: '🔥',
    icon: '♐',
    coreDescription: 'Your Sagittarius lives for freedom and adventure. They bring joy and optimism everywhere. Supporting their exploratory spirit strengthens your connection.'
  },
  capricorn: {
    name: 'Capricorn',
    archetype: 'The Noble Steward',
    element: 'Earth',
    elementIcon: '🌍',
    icon: '♑',
    coreDescription: 'Your Capricorn is dignified and determined. They take responsibilities seriously and offer unwavering loyalty. Respecting their wisdom creates lasting trust.'
  },
  aquarius: {
    name: 'Aquarius',
    archetype: 'The Rebel Spirit',
    element: 'Air',
    elementIcon: '💨',
    icon: '♒',
    coreDescription: 'Your Aquarius marches to their own beat. They are independent thinkers with unique perspectives. Embracing their individuality reveals their deepest affection.'
  },
  pisces: {
    name: 'Pisces',
    archetype: 'The Dream Weaver',
    element: 'Water',
    elementIcon: '💧',
    icon: '♓',
    coreDescription: 'Your Pisces swims in oceans of emotion and intuition. They are deeply empathic souls who sense the unseen. Honoring their sensitivity creates magical connection.'
  }
};

export function getSunSign(month: number, day: number): string {
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius';
  return 'pisces';
}

// Get zodiac sign from a Date object
export function getZodiacSign(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const signKey = getSunSign(month, day);
  return zodiacSigns[signKey]?.name || 'Aries';
}

// Get element from sign name
export function getZodiacElement(signName: string): string {
  const signKey = signName.toLowerCase();
  return zodiacSigns[signKey]?.element || 'Fire';
}
