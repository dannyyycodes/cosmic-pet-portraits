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
    
    nameTitle: "What is your pet's name?",
    nameSubtitle: "Let's begin their cosmic journey.",
    
    speciesTitle: (name) => `What kind of companion is ${name}?`,
    speciesSubtitle: "Each species has its own cosmic energy.",
    
    breedTitle: (name) => `What breed is ${name}?`,
    breedSubtitle: "Helps us understand their unique traits.",
    
    genderTitle: (name) => `Is ${name} a boy or girl?`,
    genderSubtitle: "This shapes their cosmic energy expression.",
    
    dobTitle: (name) => `When was ${name} born?`,
    dobSubtitle: "The stars remember the moment they arrived.",
    
    locationTitle: (name) => `Where does ${name} live?`,
    locationSubtitle: "Location influences their celestial connections.",
    
    soulTitle: "When you gaze into their eyes, what soul do you see?",
    soulSubtitle: (name) => `Trust your intuition about ${name}.`,
    
    superpowerTitle: (name) => `What is ${name}'s superpower?`,
    superpowerSubtitle: "Every pet has a special gift they share with the world.",
    
    strangersTitle: (name) => `How does ${name} react to strangers?`,
    strangersSubtitle: "This reveals their social cosmic energy.",
    
    photoTitle: (name) => `Share a photo of ${name}`,
    photoSubtitle: "Capture their essence for the cosmic portrait.",
    photoPlaceholder: "Drop a photo or click to upload",
    
    emailBadge: "Analysis Complete",
    emailTitle: (name) => `${name}'s cosmic profile is ready`,
    emailSubtitle: "Where should we send the results?",
    emailButton: "Reveal Cosmic Profile",
    
    reportIntro: (name) => `Discover the cosmic essence of ${name} - a soul written in the stars.`,
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
    
    nameTitle: "Who's celebrating their cosmic birthday?",
    nameSubtitle: "Let's honor another beautiful orbit around the sun.",
    
    speciesTitle: (name) => `What kind of birthday star is ${name}?`,
    speciesSubtitle: "Each species celebrates in their own cosmic way.",
    
    breedTitle: (name) => `What breed is the birthday star ${name}?`,
    breedSubtitle: "Their heritage adds to the celebration.",
    
    genderTitle: (name) => `Is ${name} a birthday boy or birthday girl?`,
    genderSubtitle: "Time to celebrate their cosmic journey!",
    
    dobTitle: (name) => `When did ${name} first grace this world?`,
    dobSubtitle: "The stars have been watching over them since that magical moment.",
    
    locationTitle: (name) => `Where does ${name} celebrate?`,
    locationSubtitle: "Their home under the stars.",
    
    soulTitle: "What kind of soul lights up your life?",
    soulSubtitle: (name) => `Describe the radiant energy ${name} brings.`,
    
    superpowerTitle: (name) => `What gift does ${name} share with the world?`,
    superpowerSubtitle: "Their special birthday magic.",
    
    strangersTitle: (name) => `How does ${name} greet party guests?`,
    strangersSubtitle: "Every birthday star has their hosting style.",
    
    photoTitle: (name) => `Share a birthday photo of ${name}`,
    photoSubtitle: "Capture their celebratory glow.",
    photoPlaceholder: "Drop a birthday photo or click to upload",
    
    emailBadge: "Birthday Portrait Ready",
    emailTitle: (name) => `${name}'s birthday cosmic portrait awaits`,
    emailSubtitle: "Where should we send this special celebration?",
    emailButton: "Reveal Birthday Portrait",
    
    reportIntro: (name) => `Celebrating another beautiful year with ${name} - a soul that brings endless joy.`,
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
    
    nameTitle: "What was your beloved companion's name?",
    nameSubtitle: "Let's honor the beautiful soul who touched your life.",
    
    speciesTitle: (name) => `What kind of companion was ${name}?`,
    speciesSubtitle: "Their spirit lives on in memory.",
    
    breedTitle: (name) => `What breed was ${name}?`,
    breedSubtitle: "Remembering their unique heritage.",
    
    genderTitle: (name) => `Was ${name} a boy or girl?`,
    genderSubtitle: "Honoring who they were.",
    
    dobTitle: (name) => `When did ${name} enter your life?`,
    dobSubtitle: "The stars remember every moment of their precious time with you.",
    
    locationTitle: (name) => `Where did ${name} call home?`,
    locationSubtitle: "The place they made brighter with their presence.",
    
    soulTitle: "When you gazed into their eyes, what soul did you see?",
    soulSubtitle: (name) => `Remember the light that ${name} carried.`,
    
    superpowerTitle: (name) => `What was ${name}'s greatest gift?`,
    superpowerSubtitle: "The special magic they shared with you.",
    
    strangersTitle: (name) => `How did ${name} greet new friends?`,
    strangersSubtitle: "Remembering their unique way of connecting.",
    
    photoTitle: (name) => `Share a treasured photo of ${name}`,
    photoSubtitle: "A memory to honor forever.",
    photoPlaceholder: "Drop a cherished photo or click to upload",
    
    emailBadge: "Memorial Tribute Ready",
    emailTitle: (name) => `${name}'s eternal soul portrait is complete`,
    emailSubtitle: "Where should we send this tribute to their beautiful spirit?",
    emailButton: "Receive Memorial Tribute",
    
    reportIntro: (name) => `A loving tribute to ${name} - a soul whose light continues to shine in our hearts.`,
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
    
    nameTitle: "What's the name of the lucky pet?",
    nameSubtitle: "You're creating something truly special for someone.",
    
    speciesTitle: (name) => `What kind of companion is ${name}?`,
    speciesSubtitle: "Each species brings unique cosmic energy.",
    
    breedTitle: (name) => `What breed is ${name}?`,
    breedSubtitle: "This will make the gift even more personal.",
    
    genderTitle: (name) => `Is ${name} a boy or girl?`,
    genderSubtitle: "Adding personal touches to their gift.",
    
    dobTitle: (name) => `When was ${name} born?`,
    dobSubtitle: "This cosmic knowledge will make their gift unforgettable.",
    
    locationTitle: (name) => `Where does ${name} live?`,
    locationSubtitle: "Helps personalize their cosmic reading.",
    
    soulTitle: "What kind of soul does this pet have?",
    soulSubtitle: (name) => `Describe ${name}'s unique spirit.`,
    
    superpowerTitle: (name) => `What is ${name}'s special gift?`,
    superpowerSubtitle: "Their unique magic to include in the reading.",
    
    strangersTitle: (name) => `How does ${name} react to new people?`,
    strangersSubtitle: "This adds personality to their cosmic profile.",
    
    photoTitle: (name) => `Share a photo of ${name}`,
    photoSubtitle: "Make their gift even more magical.",
    photoPlaceholder: "Drop a photo or click to upload",
    
    emailBadge: "Cosmic Gift Ready",
    emailTitle: (name) => `${name}'s cosmic gift is wrapped and ready`,
    emailSubtitle: "Where should we send this magical surprise?",
    emailButton: "Send Cosmic Gift",
    
    reportIntro: (name) => `A magical cosmic portrait of ${name} - created with love as a gift.`,
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
