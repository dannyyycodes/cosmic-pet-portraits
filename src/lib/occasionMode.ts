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
    
    nameTitle: "First things first — what do you call your little weirdo?",
    nameSubtitle: "The name they definitely respond to. Sometimes. When there's food.",
    
    speciesTitle: (name) => `What kind of creature is ${name}?`,
    speciesSubtitle: "Don't worry, we love them all equally. (That's a lie, we have favorites.)",
    
    breedTitle: (name) => `And ${name} is a...?`,
    breedSubtitle: "Purebred, mystery mutt, or 'the shelter said maybe Lab mix' — all good.",
    
    genderTitle: (name) => `Is ${name} a good boy or a good girl?`,
    genderSubtitle: "This helps us get the pronouns right. Very important for their ego.",
    
    dobTitle: (name) => `When did ${name} grace this planet with their presence?`,
    dobSubtitle: "Approximate is fine. They certainly don't remember.",
    
    locationTitle: (name) => `Where does ${name} rule their kingdom?`,
    locationSubtitle: "City, country, or wherever they've claimed as their throne.",
    
    soulTitle: "You know that look in their eyes? What's behind it?",
    soulSubtitle: (name) => `Trust your gut — what kind of soul lives inside ${name}?`,
    
    superpowerTitle: (name) => `If ${name} had one superpower, what would it be?`,
    superpowerSubtitle: "Besides making you late for work, obviously.",
    
    strangersTitle: (name) => `A stranger approaches. ${name}'s reaction?`,
    strangersSubtitle: "Are we talking new best friend or suspicious until proven otherwise?",
    
    photoTitle: (name) => `Let's see that face! Show us ${name}`,
    photoSubtitle: "Pick one where they look majestic. Or unhinged. Dealer's choice.",
    photoPlaceholder: "Drop your favorite photo here",
    
    emailBadge: "Report Brewing...",
    emailTitle: (name) => `We're crafting ${name}'s personality report`,
    emailSubtitle: "Where should we send this masterpiece?",
    emailButton: "Send My Report →",
    
    reportIntro: (name) => `Everything you suspected about ${name} is probably true — and then some.`,
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
    
    nameTitle: "Who's the birthday star?! 🎂",
    nameSubtitle: "Another trip around the sun for this little legend.",
    
    speciesTitle: (name) => `What species is birthday royalty ${name}?`,
    speciesSubtitle: "Each creature celebrates in their own chaotic way.",
    
    breedTitle: (name) => `What breed is the birthday superstar ${name}?`,
    breedSubtitle: "Adds extra flair to their big day reading.",
    
    genderTitle: (name) => `Is ${name} a birthday boy or birthday girl?`,
    genderSubtitle: "Time to party! 🎉",
    
    dobTitle: (name) => `The big question — exactly when was ${name} born?`,
    dobSubtitle: "The universe aligned perfectly for this moment.",
    
    locationTitle: (name) => `Where will ${name} be smashing their birthday cake?`,
    locationSubtitle: "Their home turf for the celebration.",
    
    soulTitle: "What kind of party animal are we dealing with?",
    soulSubtitle: (name) => `Describe ${name}'s celebratory spirit.`,
    
    superpowerTitle: (name) => `What makes ${name} the life of the party?`,
    superpowerSubtitle: "Their birthday magic power.",
    
    strangersTitle: (name) => `Party guests arriving — how does ${name} react?`,
    strangersSubtitle: "Social butterfly or supervising from a distance?",
    
    photoTitle: (name) => `Show us ${name} in all their birthday glory!`,
    photoSubtitle: "With or without the party hat. We're not picky.",
    photoPlaceholder: "Drop a birthday photo here",
    
    emailBadge: "Birthday Reading Ready!",
    emailTitle: (name) => `${name}'s birthday cosmic portrait is wrapped and ready`,
    emailSubtitle: "Where should we deliver this celebration?",
    emailButton: "Send Birthday Report →",
    
    reportIntro: (name) => `Another year older, another year weirder — happy birthday, ${name}!`,
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
    
    genderTitle: (name) => `Was ${name} a good boy or a good girl?`,
    genderSubtitle: "The best. We already know.",
    
    dobTitle: (name) => `When did ${name} come into your life?`,
    dobSubtitle: "The day everything got better.",
    
    locationTitle: (name) => `Where did ${name} call home?`,
    locationSubtitle: "The place they made brighter just by being there.",
    
    soulTitle: "When you looked into their eyes, what did you see?",
    soulSubtitle: (name) => `Remember the light that ${name} carried.`,
    
    superpowerTitle: (name) => `What was ${name}'s greatest gift to you?`,
    superpowerSubtitle: "The special magic that's still with you.",
    
    strangersTitle: (name) => `How did ${name} greet new friends?`,
    strangersSubtitle: "Every soul has their own way of connecting.",
    
    photoTitle: (name) => `Share a photo of ${name}`,
    photoSubtitle: "A memory to treasure forever.",
    photoPlaceholder: "Drop a cherished photo here",
    
    emailBadge: "Memorial Ready",
    emailTitle: (name) => `${name}'s tribute is complete`,
    emailSubtitle: "Where should we send this love letter to their memory?",
    emailButton: "Send Memorial →",
    
    reportIntro: (name) => `For ${name}, who taught us that love doesn't need words — and never truly leaves.`,
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
    
    nameTitle: "Who's the lucky pet getting this gift?",
    nameSubtitle: "You're about to make someone's day. And their human's too.",
    
    speciesTitle: (name) => `What type of creature is ${name}?`,
    speciesSubtitle: "Each species gets their own cosmic treatment.",
    
    breedTitle: (name) => `What breed is ${name}?`,
    breedSubtitle: "Makes the gift even more personal.",
    
    genderTitle: (name) => `Is ${name} a boy or girl?`,
    genderSubtitle: "Getting the details right for maximum impact.",
    
    dobTitle: (name) => `When was ${name} born?`,
    dobSubtitle: "This makes the reading scarily accurate.",
    
    locationTitle: (name) => `Where does ${name} live?`,
    locationSubtitle: "Adds local flavor to their reading.",
    
    soulTitle: "What kind of soul does this pet have?",
    soulSubtitle: (name) => `Describe ${name}'s vibe.`,
    
    superpowerTitle: (name) => `What's ${name}'s superpower?`,
    superpowerSubtitle: "The thing that makes their human melt.",
    
    strangersTitle: (name) => `How does ${name} react to new people?`,
    strangersSubtitle: "Helps us nail their personality.",
    
    photoTitle: (name) => `Share a photo of ${name}`,
    photoSubtitle: "The cuter, the better.",
    photoPlaceholder: "Drop a photo here",
    
    emailBadge: "Gift Ready!",
    emailTitle: (name) => `${name}'s surprise is wrapped and ready`,
    emailSubtitle: "Where should we send this magical gift?",
    emailButton: "Send Gift →",
    
    reportIntro: (name) => `A gift so good, ${name}'s human might cry. (In a good way.)`,
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
