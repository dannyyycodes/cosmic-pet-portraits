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
  soulSignature?: string;
  shadowShimmer?: string;
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
  cosmicExpansion: SectionContent;
  cosmicLessons: SectionContent;
  epilogue: string;
  compatibilityNotes: {
    bestPlaymates: string[];
    challengingEnergies: string[];
    humanCompatibility: string;
    /** New (added 2026-04-17): one-line gift this pet brings into any close bond. */
    relationshipGift?: string;
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
    greenFlags?: string[];
    redFlags?: string[];
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
  petMonologue?: {
    monologue: string;
    postScript: string;
  };
  /** The three-line shareable pullquote from the pet to the owner. */
  directMessage?: {
    title?: string;
    preamble?: string;
    message: string;
    signoff?: string;
  };
  /** Chiron/Saturn synthesis — the wound they came to heal. */
  shadowSelf?: {
    title?: string;
    preamble?: string;
    petShadow: string;
    mirrorInYou: string;
    healingPath: string;
  };
  /** Chart-grounded friction + repair ritual between pet and owner. */
  petOwnerFriction?: {
    title?: string;
    preamble?: string;
    clashPattern: string;
    whyItHappens: string;
    repairRitual: string;
    reframe?: string;
  };
  villainOriginStory?: {
    trigger: string;
    dramaticResponse: string;
    secretMotivation: string;
    redemptionArc: string;
  };
  quirkDecoder?: {
    quirk1: {
      behavior: string;
      cosmicExplanation: string;
      whatItReallyMeans: string;
    };
    quirk2: {
      behavior: string;
      cosmicExplanation: string;
      whatItReallyMeans: string;
    };
  };
  accuracyMoments?: {
    predictions: string[];
    callToAction: string;
  };
  shareableCard?: {
    cosmicNickname: string;
    sixKeyTraits: string[];
    signatureLine: string;
  };
  petParentSoulBond?: {
    title: string;
    intro: string;
    elementalHarmony: {
      title: string;
      petElement: string;
      ownerElement: string;
      harmony: string;
      compatibilityScore: string;
    };
    sunMoonDance: {
      title: string;
      content: string;
      crossAspect: string;
    };
    venusConnection: {
      title: string;
      petVenus: string;
      ownerVenus: string;
      content: string;
      loveLanguageMatch: string;
    };
    marsEnergy: {
      title: string;
      petMars: string;
      ownerMars: string;
      content: string;
      activityMatch: string;
    };
    soulContract: {
      title: string;
      content: string;
      lessonForOwner: string;
      lessonForPet: string;
    };
    cosmicRating: {
      overallScore: string;
      verdict: string;
      strengthAreas: string[];
      growthAreas: string[];
    };
  };
  // Creative extras
  yelpReviews?: Array<{
    place: string;
    rating: number;
    review: string;
  }>;
  ifICouldTalk?: Array<{
    situation: string;
    quote: string;
  }>;
  cosmicAwards?: Array<{
    award: string;
    reason: string;
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

// ─── Memorial Report schema (separate product) ──────────────────────────────

export interface MemorialReportContent {
  chartPlacements: Record<string, ChartPlacement>;
  elementalBalance: Record<string, number>;
  dominantElement: string;
  aura: { primary: string; secondary: string; meaning: string };
  archetype: { name: string; description: string };

  prologue: string;

  nameMeaning?: {
    origin: string;
    cosmicSignificance: string;
    nameVibration: number;
    numerologyMeaning: string;
    memorialNote: string;
  };

  whoTheyWere: {
    title?: string;
    threeTruths: string;
    goldenThread: string;
  };

  giftsTheyBrought: {
    title?: string;
    gifts: string[];
    quietestGift: string;
  };

  theBridge: {
    title?: string;
    lessons: string[];
    quotableLine: string;
  };

  soulStillSpeaks: {
    title?: string;
    content: string;
    signatureYouCarry: string;
    smallSigns: string[];
  };

  theirVoiceNow: {
    title?: string;
    letter: string;
    signoff?: string;
  };

  griefCompass: {
    title?: string;
    content: string;
    youAreNotDoingThisWrong?: string;
  };

  ritualsForRemembering: {
    title?: string;
    rituals: string[];
    anchorObject: string;
  };

  threePermissionSlips: {
    title?: string;
    slips: string[];
  };

  anniversaryGuide: {
    title?: string;
    birthday: string;
    passingDay: string;
    hardRandomDays?: string;
  };

  whenAnotherArrives?: {
    title?: string;
    content: string;
    signToWatchFor?: string;
  };

  aTreatForTheirMemory?: {
    title?: string;
    description: string;
    ingredients: string[];
    steps: string[];
    whenToMake?: string;
  };

  keepersOath: {
    title?: string;
    oath: string;
  };

  epilogue: string;

  /** Set by worker if guards couldn't fully satisfy schema — view still renders. */
  _needsReview?: boolean;
  _needsReviewReason?: string;
}

export interface ReportData {
  petName: string;
  report: ReportContent;
  reportId: string;
  /** Buyer email — present when the viewer sourced this from PaymentSuccess. */
  email?: string;
  /** Optional user-uploaded pet photo; used by the multi-pet selector + compatibility offer. */
  petPhotoUrl?: string;
  /** Optional generated portrait image; premium tier. */
  portraitUrl?: string;
  /** discover / birthday / memorial / gift — used to filter memorial pets out of compatibility picker etc. */
  occasionMode?: string;
}
