export interface ChartPlacement {
  sign: string;
  degree: number;
  symbol: string;
}

export interface SectionContent {
  title: string;
  content: string;
  whyThisMatters?: string;
  practicalTip?: string;
  funFact?: string;
  interactiveChallenge?: string;
  loveLanguageType?: string;
  energyLevel?: string;
  firstImpressionPrediction?: string;
  southNode?: string;
  pastLifeHint?: string;
  growthOpportunity?: string;
  healingGift?: string;
  vulnerabilityNote?: string;
  secretDesire?: string;
  dominantElement?: string;
  balance?: Record<string, number>;
  temperamentInsight?: string;
  elementalAdvice?: string;
  harmoniousAspect?: string;
  growthAspect?: string;
  uniquePattern?: string;
  breedAstrologyBlend?: string;
  physicalPrediction?: string;
  primaryColor?: string;
  secondaryColor?: string;
  auraMeaning?: string;
  howToSense?: string;
  crystalName?: string;
  crystalColor?: string;
  crystalMeaning?: string;
  howToUse?: string;
  placement?: string;
  archetypeName?: string;
  archetypeDescription?: string;
  archetypeStory?: string;
  archetypeLesson?: string;
  mirrorQuality?: string;
  soulContract?: string;
  dailyRitual?: string;
  affirmation?: string;
}

export interface ReportContent {
  chartPlacements: Record<string, ChartPlacement>;
  elementalBalance: Record<string, number>;
  dominantElement: string;
  crystal: { name: string; meaning: string; color: string };
  aura: { primary: string; secondary: string; meaning: string };
  archetype: { name: string; description: string };
  prologue: string;
  solarSoulprint: SectionContent;
  lunarHeart: SectionContent;
  cosmicCuriosity: SectionContent;
  harmonyHeartbeats: SectionContent;
  spiritOfMotion: SectionContent;
  starlitGaze: SectionContent;
  destinyCompass: SectionContent;
  gentleHealer: SectionContent;
  wildSpirit: SectionContent;
  elementalNature: SectionContent;
  celestialChoreography: SectionContent;
  earthlyExpression: SectionContent;
  luminousField: SectionContent;
  celestialGem: SectionContent;
  eternalArchetype: SectionContent;
  keepersBond: SectionContent;
  epilogue: string;
  compatibilityNotes: {
    bestPlaymates: string[];
    challengingEnergies: string[];
    humanCompatibility: string;
  };
  luckyElements: {
    luckyNumber: string;
    luckyDay: string;
    luckyColor: string;
    powerTime: string;
  };
  nameMeaning?: {
    title: string;
    origin: string;
    cosmicSignificance: string;
    nameVibration: number;
    numerologyMeaning: string;
    funFact: string;
  };
  basedOnYourAnswers?: {
    title: string;
    intro: string;
    mappings: Array<{
      question: string;
      yourAnswer: string;
      usedFor: string;
    }>;
    accuracyNote: string;
  };
  cosmicNickname?: {
    nickname: string;
    explanation: string;
  };
  firstMeeting?: {
    title: string;
    paragraph: string;
  };
  memePersonality?: {
    title: string;
    type: string;
    description: string;
    signature: string;
  };
  topFiveCrimes?: {
    title: string;
    crimes: string[];
  };
  datingProfile?: {
    title: string;
    headline: string;
    bio: string;
    lookingFor: string;
  };
  dreamJob?: {
    title: string;
    job: string;
    description: string;
    salary: string;
  };
  // New fun sections
  googleSearches?: string[];
  textMessages?: {
    morning: { pet: string[]; human: string[] };
    afternoon: { pet: string[]; human: string[] };
    night: { pet: string[]; human: string[] };
  };
  humanProfile?: Record<string, string>;
  cosmicRecipe?: {
    name: string;
    emoji: string;
    description: string;
    why: string;
    ingredients: string[];
    steps: string[];
  };
  playlist?: Array<{
    title: string;
    artist: string;
    vibe: string;
  }>;
  // Legacy support
  sunSign?: string;
  element?: string;
  modality?: string;
  nameVibration?: number;
  coreEssence?: string;
  soulMission?: string;
  hiddenGift?: string;
  loveLanguage?: string;
  cosmicAdvice?: string;
}

export interface ReportData {
  petName: string;
  report: ReportContent;
  reportId: string;
}
