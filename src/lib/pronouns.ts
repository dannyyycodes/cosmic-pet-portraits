// Utility for gender-based pronouns
export type PetGender = 'boy' | 'girl' | '';

export function getPronoun(gender: PetGender, type: 'possessive' | 'subject' | 'object' = 'possessive'): string {
  // NOTE: gender is collected in intake, so we always use gendered pronouns (never "their").
  const pronouns = {
    boy: { possessive: 'his', subject: 'he', object: 'him' },
    girl: { possessive: 'her', subject: 'she', object: 'her' },
    '': { possessive: 'her', subject: 'she', object: 'her' },
  };
  
  return pronouns[gender]?.[type] || pronouns[''][type];
}

export function getPossessive(gender: PetGender): string {
  return getPronoun(gender, 'possessive');
}
