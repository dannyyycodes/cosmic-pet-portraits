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
    nameSubtitle: "Names carry vibrational energy that influences personality traits.",
    
    speciesTitle: (name) => `What kind of companion is ${name}?`,
    speciesSubtitle: "Different species have unique archetypal energies in cosmic readings.",
    
    breedTitle: (name) => `What breed is ${name}?`,
    breedSubtitle: "Breed traits blend with astrological influences for deeper accuracy.",
    
    genderTitle: (name) => `Is ${name} a boy or girl?`,
    genderSubtitle: "Gender affects how planetary energies express in the birth chart.",
    
    dobTitle: (name) => `When was ${name} born?`,
    dobSubtitle: "Birth date reveals Sun sign, Moon phase & planetary positions.",
    
    locationTitle: (name) => `Where does ${name} call home?`,
    locationSubtitle: "Location sets the Ascendant & house positions in the birth chart.",
    
    soulTitle: "When you look into their eyes, what do you see?",
    soulSubtitle: (name) => `Your insight helps calibrate ${name}'s Neptune & 12th house themes.`,
    
    superpowerTitle: (name) => `What is ${name}'s greatest gift?`,
    superpowerSubtitle: "This reveals dominant planetary strengths in the chart.",
    
    strangersTitle: (name) => `How does ${name} greet new people?`,
    strangersSubtitle: "Social response maps to Mars, Venus & Ascendant placements.",
    
    photoTitle: (name) => `Share a photo of ${name}`,
    photoSubtitle: "We use AI to capture their unique aura for the report.",
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
    nameSubtitle: "Names carry vibrational energy that influences personality traits.",
    
    speciesTitle: (name) => `What kind of companion is ${name}?`,
    speciesSubtitle: "Different species have unique archetypal energies in cosmic readings.",
    
    breedTitle: (name) => `What breed is ${name}?`,
    breedSubtitle: "Breed traits blend with astrological influences for deeper accuracy.",
    
    genderTitle: (name) => `Is ${name} a birthday boy or birthday girl?`,
    genderSubtitle: "Gender affects how planetary energies express in the chart.",
    
    dobTitle: (name) => `When was ${name} born?`,
    dobSubtitle: "Birth date reveals Sun sign, Moon phase & planetary positions.",
    
    locationTitle: (name) => `Where does ${name} celebrate?`,
    locationSubtitle: "Location sets the Ascendant & house positions in the birth chart.",
    
    soulTitle: "What kind of soul lights up your life?",
    soulSubtitle: (name) => `Your insight helps calibrate ${name}'s Neptune & 12th house themes.`,
    
    superpowerTitle: (name) => `What makes ${name} so special?`,
    superpowerSubtitle: "This reveals dominant planetary strengths in the chart.",
    
    strangersTitle: (name) => `How does ${name} greet party guests?`,
    strangersSubtitle: "Social response maps to Mars, Venus & Ascendant placements.",
    
    photoTitle: (name) => `Share a photo of ${name}`,
    photoSubtitle: "We use AI to capture their unique aura for the report.",
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
    nameSubtitle: "Names carry vibrational energy that shaped who they were.",
    
    speciesTitle: (name) => `What kind of companion was ${name}?`,
    speciesSubtitle: "Different species have unique archetypal energies in cosmic readings.",
    
    breedTitle: (name) => `What breed was ${name}?`,
    breedSubtitle: "Breed traits blend with astrological influences for deeper accuracy.",
    
    genderTitle: (name) => `Was ${name} a boy or girl?`,
    genderSubtitle: "Gender affected how planetary energies expressed in the chart.",
    
    dobTitle: (name) => `When did ${name} come into your life?`,
    dobSubtitle: "Birth date reveals Sun sign, Moon phase & planetary positions.",
    
    locationTitle: (name) => `Where did ${name} call home?`,
    locationSubtitle: "Location set the Ascendant & house positions in the birth chart.",
    
    soulTitle: "When you looked into their eyes, what did you see?",
    soulSubtitle: (name) => `Your memory helps calibrate ${name}'s Neptune & 12th house themes.`,
    
    superpowerTitle: (name) => `What was ${name}'s greatest gift to you?`,
    superpowerSubtitle: "This reveals dominant planetary strengths in the chart.",
    
    strangersTitle: (name) => `How did ${name} greet new friends?`,
    strangersSubtitle: "Social response maps to Mars, Venus & Ascendant placements.",
    
    photoTitle: (name) => `Share a treasured photo of ${name}`,
    photoSubtitle: "We use AI to capture their eternal aura for the memorial.",
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
    nameSubtitle: "Names carry vibrational energy that influences personality traits.",
    
    speciesTitle: (name) => `What kind of companion is ${name}?`,
    speciesSubtitle: "Different species have unique archetypal energies in cosmic readings.",
    
    breedTitle: (name) => `What breed is ${name}?`,
    breedSubtitle: "Breed traits blend with astrological influences for deeper accuracy.",
    
    genderTitle: (name) => `Is ${name} a boy or girl?`,
    genderSubtitle: "Gender affects how planetary energies express in the chart.",
    
    dobTitle: (name) => `When was ${name} born?`,
    dobSubtitle: "Birth date reveals Sun sign, Moon phase & planetary positions.",
    
    locationTitle: (name) => `Where does ${name} live?`,
    locationSubtitle: "Location sets the Ascendant & house positions in the birth chart.",
    
    soulTitle: "What kind of soul does this pet have?",
    soulSubtitle: (name) => `Your insight helps calibrate ${name}'s Neptune & 12th house themes.`,
    
    superpowerTitle: (name) => `What is ${name}'s special gift?`,
    superpowerSubtitle: "This reveals dominant planetary strengths in the chart.",
    
    strangersTitle: (name) => `How does ${name} react to new people?`,
    strangersSubtitle: "Social response maps to Mars, Venus & Ascendant placements.",
    
    photoTitle: (name) => `Share a photo of ${name}`,
    photoSubtitle: "We use AI to capture their unique aura for the gift.",
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
