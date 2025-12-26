export type OccasionMode = 'discover' | 'birthday' | 'memorial' | 'gift';

export interface ModeContent {
  // Tense
  tense: 'present' | 'past';
  
  // Verb forms for dynamic text
  verb: {
    is: string;      // is/was
    has: string;     // has/had
    does: string;    // does/did
    loves: string;   // loves/loved
    brings: string;  // brings/brought
    makes: string;   // makes/made
    feels: string;   // feels/felt
    shows: string;   // shows/showed
    reacts: string;  // reacts/reacted
    greets: string;  // greets/greeted
  };
  
  // Pronoun forms
  pronoun: {
    their: string;   // their/their (same, but for possessive context)
    them: string;    // them/them
    they: string;    // they/they
  };
  
  // Step 1: Name
  nameTitle: string;
  nameSubtitle: string;
  
  // Step 2: Species
  speciesTitle: (name: string) => string;
  speciesSubtitle: string;
  
  // Step 3: Breed
  breedTitle: (name: string) => string;
  breedSubtitle: string;
  
  // Step 4: Gender
  genderTitle: (name: string) => string;
  genderSubtitle: string;
  
  // Step 5: DOB
  dobTitle: (name: string) => string;
  dobSubtitle: string;
  
  // Step 6: Location
  locationTitle: (name: string) => string;
  locationSubtitle: string;
  
  // Step 7: Soul
  soulTitle: string;
  soulSubtitle: (name: string) => string;
  
  // Step 8: Superpower
  superpowerTitle: (name: string) => string;
  superpowerSubtitle: string;
  
  // Step 9: Strangers
  strangersTitle: (name: string) => string;
  strangersSubtitle: string;
  
  // Step 10: Photo
  photoTitle: (name: string) => string;
  photoSubtitle: string;
  photoPlaceholder: string;
  
  // Final Step: Email
  emailBadge: string;
  emailTitle: (name: string) => string;
  emailSubtitle: string;
  emailButton: string;
  
  // Report section headers
  reportIntro: (name: string) => string;
  sectionTitleSuffix: string; // "brings" vs "brought"
}

export const occasionModeContent: Record<OccasionMode, ModeContent> = {
  discover: {
    tense: 'present',
    
    verb: {
      is: 'is',
      has: 'has',
      does: 'does',
      loves: 'loves',
      brings: 'brings',
      makes: 'makes',
      feels: 'feels',
      shows: 'shows',
      reacts: 'reacts',
      greets: 'greets',
    },
    
    pronoun: {
      their: 'their',
      them: 'them',
      they: 'they',
    },
    
    nameTitle: "What is your beloved friend's name?",
    nameSubtitle: "Let's discover what makes them so special.",
    
    speciesTitle: (name) => `What kind of companion is ${name}?`,
    speciesSubtitle: "Every species has their own beautiful way of connecting.",
    
    breedTitle: (name) => `What breed is ${name}?`,
    breedSubtitle: "This helps us understand their unique personality.",
    
    genderTitle: (name) => `Is ${name} a boy or girl?`,
    genderSubtitle: "So we can personalize their reading just for them.",
    
    dobTitle: (name) => `When was ${name} born?`,
    dobSubtitle: "This unlocks their unique cosmic blueprint.",
    
    locationTitle: (name) => `Where does ${name} call home?`,
    locationSubtitle: "The place they've filled with love.",
    
    soulTitle: "When you look into their eyes, what do you see?",
    soulSubtitle: (name) => `Trust your heart — you know ${name} better than anyone.`,
    
    superpowerTitle: (name) => `What is ${name}'s greatest gift?`,
    superpowerSubtitle: "The special way they brighten your world.",
    
    strangersTitle: (name) => `How does ${name} greet new people?`,
    strangersSubtitle: "This tells us about their beautiful spirit.",
    
    photoTitle: (name) => `Share a photo of ${name}`,
    photoSubtitle: "Show us the face that lights up your life.",
    photoPlaceholder: "Drop your favorite photo here",
    
    emailBadge: "Report Ready",
    emailTitle: (name) => `${name}'s personality report is complete`,
    emailSubtitle: "Where should we send this heartfelt reading?",
    emailButton: "Send My Report →",
    
    reportIntro: (name) => `A loving portrait of ${name} — your irreplaceable companion.`,
    sectionTitleSuffix: 'Bring',
  },
  
  birthday: {
    tense: 'present',
    
    verb: {
      is: 'is',
      has: 'has',
      does: 'does',
      loves: 'loves',
      brings: 'brings',
      makes: 'makes',
      feels: 'feels',
      shows: 'shows',
      reacts: 'reacts',
      greets: 'greets',
    },
    
    pronoun: {
      their: 'their',
      them: 'them',
      they: 'they',
    },
    
    nameTitle: "Who's celebrating their special day? 🎂",
    nameSubtitle: "Another year of unconditional love.",
    
    speciesTitle: (name) => `What kind of companion is ${name}?`,
    speciesSubtitle: "Every birthday deserves to be celebrated.",
    
    breedTitle: (name) => `What breed is ${name}?`,
    breedSubtitle: "Adding personal touches to their birthday reading.",
    
    genderTitle: (name) => `Is ${name} a birthday boy or birthday girl?`,
    genderSubtitle: "Time to celebrate! 🎉",
    
    dobTitle: (name) => `When was ${name} born?`,
    dobSubtitle: "The day that changed everything.",
    
    locationTitle: (name) => `Where does ${name} celebrate?`,
    locationSubtitle: "Their home filled with love.",
    
    soulTitle: "What kind of soul lights up your life?",
    soulSubtitle: (name) => `Describe the joy ${name} brings every day.`,
    
    superpowerTitle: (name) => `What makes ${name} so special?`,
    superpowerSubtitle: "The gift they share with everyone they meet.",
    
    strangersTitle: (name) => `How does ${name} greet party guests?`,
    strangersSubtitle: "Their welcoming spirit.",
    
    photoTitle: (name) => `Share a photo of ${name}`,
    photoSubtitle: "Capture their birthday glow.",
    photoPlaceholder: "Drop a birthday photo here",
    
    emailBadge: "Birthday Reading Ready!",
    emailTitle: (name) => `${name}'s birthday tribute is complete`,
    emailSubtitle: "Where should we send this celebration?",
    emailButton: "Send Birthday Report →",
    
    reportIntro: (name) => `Celebrating another beautiful year with ${name} — a soul that brings endless joy.`,
    sectionTitleSuffix: 'Bring',
  },
  
  memorial: {
    tense: 'past',
    
    verb: {
      is: 'was',
      has: 'had',
      does: 'did',
      loves: 'loved',
      brings: 'brought',
      makes: 'made',
      feels: 'felt',
      shows: 'showed',
      reacts: 'reacted',
      greets: 'greeted',
    },
    
    pronoun: {
      their: 'their',
      them: 'them',
      they: 'they',
    },
    
    nameTitle: "Tell us their name ❤️",
    nameSubtitle: "Let's honor the beautiful soul who changed your life.",
    
    speciesTitle: (name) => `What kind of companion was ${name}?`,
    speciesSubtitle: "Their spirit lives on in every memory.",
    
    breedTitle: (name) => `What breed was ${name}?`,
    breedSubtitle: "Remembering everything that made them unique.",
    
    genderTitle: (name) => `Was ${name} a boy or girl?`,
    genderSubtitle: "The best friend you'll never forget.",
    
    dobTitle: (name) => `When did ${name} come into your life?`,
    dobSubtitle: "The day everything got better.",
    
    locationTitle: (name) => `Where did ${name} call home?`,
    locationSubtitle: "The place they made brighter just by being there.",
    
    soulTitle: "When you looked into their eyes, what did you see?",
    soulSubtitle: (name) => `Remember the love that ${name} carried.`,
    
    superpowerTitle: (name) => `What was ${name}'s greatest gift to you?`,
    superpowerSubtitle: "The special magic that's still with you.",
    
    strangersTitle: (name) => `How did ${name} greet new friends?`,
    strangersSubtitle: "The way they touched every heart.",
    
    photoTitle: (name) => `Share a treasured photo of ${name}`,
    photoSubtitle: "A memory to hold forever.",
    photoPlaceholder: "Drop a cherished photo here",
    
    emailBadge: "Memorial Ready",
    emailTitle: (name) => `${name}'s tribute is complete`,
    emailSubtitle: "Where should we send this love letter to their memory?",
    emailButton: "Send Memorial →",
    
    reportIntro: (name) => `For ${name}, whose love lives on in our hearts forever.`,
    sectionTitleSuffix: 'Brought',
  },
  
  gift: {
    tense: 'present',
    
    verb: {
      is: 'is',
      has: 'has',
      does: 'does',
      loves: 'loves',
      brings: 'brings',
      makes: 'makes',
      feels: 'feels',
      shows: 'shows',
      reacts: 'reacts',
      greets: 'greets',
    },
    
    pronoun: {
      their: 'their',
      them: 'them',
      they: 'they',
    },
    
    nameTitle: "What's the name of this special pet?",
    nameSubtitle: "You're creating a gift they'll treasure forever.",
    
    speciesTitle: (name) => `What kind of companion is ${name}?`,
    speciesSubtitle: "Every pet has their own beautiful story.",
    
    breedTitle: (name) => `What breed is ${name}?`,
    breedSubtitle: "Makes the gift even more personal.",
    
    genderTitle: (name) => `Is ${name} a boy or girl?`,
    genderSubtitle: "Personalizing every detail.",
    
    dobTitle: (name) => `When was ${name} born?`,
    dobSubtitle: "This makes their reading deeply personal.",
    
    locationTitle: (name) => `Where does ${name} live?`,
    locationSubtitle: "Adds a personal touch to their reading.",
    
    soulTitle: "What kind of soul does this pet have?",
    soulSubtitle: (name) => `Describe ${name}'s beautiful spirit.`,
    
    superpowerTitle: (name) => `What is ${name}'s special gift?`,
    superpowerSubtitle: "What makes them so lovable.",
    
    strangersTitle: (name) => `How does ${name} react to new people?`,
    strangersSubtitle: "This captures their personality perfectly.",
    
    photoTitle: (name) => `Share a photo of ${name}`,
    photoSubtitle: "The heart of this beautiful gift.",
    photoPlaceholder: "Drop a photo here",
    
    emailBadge: "Gift Ready!",
    emailTitle: (name) => `${name}'s gift is wrapped and ready`,
    emailSubtitle: "Where should we send this heartfelt surprise?",
    emailButton: "Send Gift →",
    
    reportIntro: (name) => `A gift of love — celebrating the beautiful bond with ${name}.`,
    sectionTitleSuffix: 'Bring',
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
