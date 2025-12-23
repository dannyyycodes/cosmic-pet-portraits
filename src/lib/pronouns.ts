// Utility for gender-based pronouns
export type PetGender = 'boy' | 'girl' | '';

export function getPronoun(gender: PetGender, type: 'possessive' | 'subject' | 'object' = 'possessive'): string {
  const pronouns = {
    boy: { possessive: 'his', subject: 'he', object: 'him' },
    girl: { possessive: 'her', subject: 'she', object: 'her' },
    '': { possessive: 'their', subject: 'they', object: 'them' },
  };
  
  return pronouns[gender]?.[type] || pronouns[''][type];
}

export function getPossessive(gender: PetGender): string {
  return getPronoun(gender, 'possessive');
}
