export type OccasionMode = 'discover' | 'birthday' | 'memorial' | 'gift';

export interface ModeContent {
  // Step 1: Name
  nameTitle: string;
  nameSubtitle: string;
  
  // Step 5: DOB
  dobTitle: (name: string) => string;
  dobSubtitle: string;
  
  // Step 7: Soul
  soulTitle: string;
  soulSubtitle: (name: string) => string;
  
  // Final Step: Email
  emailBadge: string;
  emailTitle: (name: string) => string;
  emailSubtitle: string;
  emailButton: string;
  
  // General
  tense: 'present' | 'past';
}

export const occasionModeContent: Record<OccasionMode, ModeContent> = {
  discover: {
    nameTitle: "What is your pet's name?",
    nameSubtitle: "Let's begin their cosmic journey.",
    
    dobTitle: (name) => `When was ${name} born?`,
    dobSubtitle: "The stars remember the moment they arrived.",
    
    soulTitle: "When you gaze into their eyes, what soul do you see?",
    soulSubtitle: (name) => `Trust your intuition about ${name}.`,
    
    emailBadge: "Analysis Complete",
    emailTitle: (name) => `${name}'s cosmic profile is ready`,
    emailSubtitle: "Where should we send the results?",
    emailButton: "Reveal Cosmic Profile",
    
    tense: 'present',
  },
  
  birthday: {
    nameTitle: "Who's celebrating their cosmic birthday?",
    nameSubtitle: "Let's honor another beautiful orbit around the sun.",
    
    dobTitle: (name) => `When did ${name} first grace this world?`,
    dobSubtitle: "The stars have been watching over them since that magical moment.",
    
    soulTitle: "What kind of soul lights up your life?",
    soulSubtitle: (name) => `Describe the radiant energy ${name} brings.`,
    
    emailBadge: "Birthday Portrait Ready",
    emailTitle: (name) => `${name}'s birthday cosmic portrait awaits`,
    emailSubtitle: "Where should we send this special celebration?",
    emailButton: "Reveal Birthday Portrait",
    
    tense: 'present',
  },
  
  memorial: {
    nameTitle: "What was your beloved companion's name?",
    nameSubtitle: "Let's honor the beautiful soul who touched your life.",
    
    dobTitle: (name) => `When did ${name} enter your life?`,
    dobSubtitle: "The stars remember every moment of their precious time with you.",
    
    soulTitle: "When you gazed into their eyes, what soul did you see?",
    soulSubtitle: (name) => `Remember the light that ${name} carried.`,
    
    emailBadge: "Memorial Tribute Ready",
    emailTitle: (name) => `${name}'s eternal soul portrait is complete`,
    emailSubtitle: "Where should we send this tribute to their beautiful spirit?",
    emailButton: "Receive Memorial Tribute",
    
    tense: 'past',
  },
  
  gift: {
    nameTitle: "What's the name of the lucky pet?",
    nameSubtitle: "You're creating something truly special for someone.",
    
    dobTitle: (name) => `When was ${name} born?`,
    dobSubtitle: "This cosmic knowledge will make their gift unforgettable.",
    
    soulTitle: "What kind of soul does this pet have?",
    soulSubtitle: (name) => `Describe ${name}'s unique spirit.`,
    
    emailBadge: "Cosmic Gift Ready",
    emailTitle: (name) => `${name}'s cosmic gift is wrapped and ready`,
    emailSubtitle: "Where should we send this magical surprise?",
    emailButton: "Send Cosmic Gift",
    
    tense: 'present',
  },
};

export function getModeFromUrl(): OccasionMode {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (mode && ['discover', 'birthday', 'memorial', 'gift'].includes(mode)) {
    return mode as OccasionMode;
  }
  return 'discover';
}
