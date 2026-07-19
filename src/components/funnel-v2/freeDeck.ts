/* The free reading deck: Danny-approved "strangely accurate" voice (2026-07-15).
   Every card names the pet and fuses ONE real placement fact with two or three
   uncannily-true cold-reading observations, then a warm true-of-any-pet tell.
   The name is woven in through tokens ({self} {name} {Name} {poss} {Poss}); a
   pet with no name falls back gracefully to "your dog" / "your cat" / "them".
   Grammar rule that keeps every case correct: the name only ever appears in an
   appositive ({self} = "a Monty" / "a side of your dog") or possessive slot,
   never as a bare verb-subject. The uncanny verbs hang off "the one who ..."
   (always singular) and follow-on clauses use singular-they. So "Monty",
   "your dog" and "them" all read grammatically.
   Memorial voice: past tense for the pet's behaviour, present tense for what
   stays true, zero care instructions, no grief tropes. No em-dashes anywhere,
   no sell-words, honour the astrology. */

export const DECK_PLANETS = ["sun", "moon", "venus", "mercury", "mars"] as const;
export type DeckPlanet = (typeof DECK_PLANETS)[number];

export type Voiced = { d: string; m: string };
/* Each planet-in-sign card: the uncanny beats (the hero) + the warm tell. */
export type DeckSignEntry = { beats: Voiced; tell: Voiced };

/* ── The subject resolver ──────────────────────────────────────────────────
   Turns the pet's name + species into every grammatical form the copy needs,
   then fill() splices them into the token strings. */
export type Subject = {
  self: string; // appositive: "a Monty" | "a side of your dog" | "a side of them"
  name: string; // mid-sentence object: "Monty" | "your dog" | "them"
  Name: string; // sentence-start (non-verb) object: "Monty" | "Your dog" | "They"
  poss: string; // mid-sentence possessive: "Monty's" | "your dog's" | "their"
  Poss: string; // sentence-start possessive: "Monty's" | "Your dog's" | "Their"
};

/** Display form for an owner-typed pet name: first character uppercased, the
 *  rest left untouched, so "monty" reads "Monty" while "DJ" and "McFly"
 *  survive. Display only — the stored name is never overwritten. */
export function capName(raw?: string | null): string {
  const n = (raw || "").trim();
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : n;
}

export function makeSubject(name?: string | null, species?: string | null): Subject {
  const n = (name || "").trim();
  if (n) {
    // display form: first letter up (owners type "monty"; the reading says
    // "Monty"). Only the first char is touched so "DJ" and "McFly" survive.
    const d = n.charAt(0).toUpperCase() + n.slice(1);
    return { self: `a ${d}`, name: d, Name: d, poss: `${d}'s`, Poss: `${d}'s` };
  }
  if (species === "dog") {
    return { self: "a side of your dog", name: "your dog", Name: "Your dog", poss: "your dog's", Poss: "Your dog's" };
  }
  if (species === "cat") {
    return { self: "a side of your cat", name: "your cat", Name: "Your cat", poss: "your cat's", Poss: "Your cat's" };
  }
  return { self: "a side of them", name: "them", Name: "They", poss: "their", Poss: "Their" };
}

export function fill(t: string, S: Subject): string {
  return t
    .replace(/\{self\}/g, S.self)
    .replace(/\{Name\}/g, S.Name)
    .replace(/\{name\}/g, S.name)
    .replace(/\{Poss\}/g, S.Poss)
    .replace(/\{poss\}/g, S.poss);
}

/* L1 NAME IT: the placement fact hook. Name + real sign + what the planet
   governs. Identical shape in both voices (the chart does not change). */
export const DECK_L1: Record<DeckPlanet, (sign: string) => string> = {
  sun: (s) => `{Poss} Sun sits in ${s}, the self under everything.`,
  moon: (s) => `{Poss} Moon sits in ${s}, what settles them when the day has been too much.`,
  venus: (s) => `{Poss} Venus sits in ${s}, how they love you back.`,
  mercury: (s) => `{Poss} Mercury sits in ${s}, how they reach for you.`,
  mars: (s) => `{Poss} Mars sits in ${s}, where all that energy goes.`,
};

/* Sealed-depth footers, one per planet, both voices. */
export const DECK_SEALED: Record<DeckPlanet, Voiced> = {
  sun: {
    d: "{Poss} exact degree, and the single job their Sun hands them, stays sealed.",
    m: "The one thing their Sun sent them here to be for you stays sealed.",
  },
  moon: {
    d: "What they fear, and what steadies them against it, stays sealed.",
    m: "What they feared, and what always steadied them, stays sealed.",
  },
  venus: {
    d: "What {poss} love asks for in return stays sealed in the full reading.",
    m: "How they knew you loved them back stays sealed in the full reading.",
  },
  mercury: {
    d: "The one signal you keep missing, and how to answer it, stays sealed.",
    m: "What they were telling you all along, in their own words, stays sealed.",
  },
  mars: {
    d: "What sets them off, and what settles it again, stays sealed.",
    m: "What they were protecting, every time they stood firm, stays sealed.",
  },
};

/* L2 (MEAN IT: the uncanny beats) + L3 (the warm tell), all 12 signs x 5
   planets, both voices, name-woven with tokens. Discovery may carry one gentle
   noticing in the tell; memorial carries only remembrance, never instruction. */
export const DECK_READS: Record<DeckPlanet, Record<string, DeckSignEntry>> = {
  sun: {
    Aries: {
      beats: {
        d: "There's {self} only you see, the one already moving before the thought has finished, first through the door, first at the food. Waiting is the one thing that has never once come naturally to them.",
        m: "There was {self} only you saw, the one already moving before the thought had finished, first through the door, first at the food. Waiting was the one thing that never once came naturally to them.",
      },
      tell: {
        d: "Under all that go is a soul that only ever wanted to be met head-on. Arriving at everything first is {poss} whole way of loving you.",
        m: "Under all that go was a soul that only ever wanted to be met head-on. Arriving at everything first was {poss} whole way of loving you.",
      },
    },
    Taurus: {
      beats: {
        d: "There's {self} only you see, the one who cannot be hurried and has never tried to be, who picks a single spot and makes the whole rest of the world wait for it. Rushing them only ever slows them down.",
        m: "There was {self} only you saw, the one who could not be hurried and never tried to be, who picked a single spot and made the whole rest of the world wait for it. Rushing them only ever slowed them down.",
      },
      tell: {
        d: "That steadiness is not stubbornness. It is a soul that trusts {poss} life completely and wants to take its sweet time inside it.",
        m: "That steadiness was never stubbornness. It was a soul that trusted {poss} life completely and took its sweet time inside it.",
      },
    },
    Gemini: {
      beats: {
        d: "There's {self} only you see, the one with two thoughts running before the first is finished, into everything before you have set it down. A quiet, empty room is the one thing that truly unsettles them.",
        m: "There was {self} only you saw, the one with two thoughts running before the first was finished, into everything before you had set it down. A quiet, empty room was the one thing that truly unsettled them.",
      },
      tell: {
        d: "All that busy is a mind asking the world to keep up. For {name}, a new thing to puzzle over is worth more than a full bowl.",
        m: "All that busy was a mind asking the world to keep up. A new thing to puzzle over was always worth more to them than a full bowl.",
      },
    },
    Cancer: {
      beats: {
        d: "There's {self} only you see, the one who clocks you leaving a room before you have moved, who doesn't settle until everyone they count as theirs is home.",
        m: "There was {self} only you saw, the one who clocked you leaving a room before you had moved, who did not settle until everyone they counted as theirs was home.",
      },
      tell: {
        d: "There is a quiet worry in them about being left, even when they seem sure of you. Your coming home is the moment {poss} whole day is built around.",
        m: "There was a quiet worry in them about being left, even when they seemed sure of you. Your coming home was the moment {poss} whole day was built around.",
      },
    },
    Leo: {
      beats: {
        d: "There's {self} only you see, the one who finds the warm middle of the room and knows the exact second their seat is taken. The affection is real and generous, and it wants one pair of eyes on it. Yours.",
        m: "There was {self} only you saw, the one who found the warm middle of the room and knew the exact second their seat was taken. The affection was real and generous, and it wanted one pair of eyes on it. Yours.",
      },
      tell: {
        d: "Being seen is not vanity in them. It is how they check, over and over, that they still matter to you. They always will.",
        m: "Being seen was never vanity in them. It was how they checked, over and over, that they still mattered to you. They always did.",
      },
    },
    Virgo: {
      beats: {
        d: "There's {self} only you see, the one running a routine nobody ever assigned, who notices the thing you moved and the exact second you changed your mind. Nothing small gets past them.",
        m: "There was {self} only you saw, the one running a routine nobody ever assigned, who noticed the thing you moved and the exact second you changed your mind. Nothing small got past them.",
      },
      tell: {
        d: "All that noticing is love keeping the house right for you. When the small things behave, so does the worry.",
        m: "All that noticing was love keeping the house right for you. When the small things behaved, so did the worry.",
      },
    },
    Libra: {
      beats: {
        d: "There's {self} only you see, the one who is only fully themselves when the room is calm and the bond feels even, who reads your mood and hands it back a shade softer. A tense house becomes a tense them within minutes.",
        m: "There was {self} only you saw, the one who was only fully themselves when the room was calm and the bond felt even, who read your mood and handed it back a shade softer.",
      },
      tell: {
        d: "That is why the room feels gentler with them in it. Settle yourself first and watch them soften a beat behind you.",
        m: "That is why the house felt gentler with them in it. Handing your mood back softer was never an accident. It was how they loved.",
      },
    },
    Scorpio: {
      beats: {
        d: "There's {self} only you see, the one who is all in or not at all and decides which, who gives everything completely and forgets nothing that passes between you. What they chose, they chose for keeps.",
        m: "There was {self} only you saw, the one who was all in or not at all and decided which, who gave everything completely and forgot nothing that passed between you. What they chose, they chose for keeps.",
      },
      tell: {
        d: "That intensity is not a phase. It is a whole heart with a single setting, and it settled on you a long time ago.",
        m: "That intensity was never a phase. It was a whole heart with a single setting, and it never once wavered from you.",
      },
    },
    Sagittarius: {
      beats: {
        d: "There's {self} only you see, the one born mid-adventure with their nose to the wind, who reads a shut gate as a dare and the horizon as the whole point. No fence has ever quite held them.",
        m: "There was {self} only you saw, the one born mid-adventure with their nose to the wind, who read a shut gate as a dare and the horizon as the whole point. No fence ever quite held them.",
      },
      tell: {
        d: "The wandering was never running from you. It is a soul that trusts the world you share is safe to go and read.",
        m: "The wandering was never running from you. It was a soul that trusted the world you shared was safe to go and read.",
      },
    },
    Capricorn: {
      beats: {
        d: "There's {self} only you see, the one serious past their years, steady when everything else wobbles, who never begs for a place but earns it quietly and holds it like it was always theirs.",
        m: "There was {self} only you saw, the one serious past their years, steady when everything else wobbled, who never begged for a place but earned it quietly and held it like it was always theirs.",
      },
      tell: {
        d: "The seriousness was never distance. It is a soul quietly holding the whole family steady, you included.",
        m: "The seriousness was never distance. It was a soul quietly holding the whole family steady, you included.",
      },
    },
    Aquarius: {
      beats: {
        d: "There's {self} only you see, their own creature on their own odd clock, who cannot be coaxed and arrives at loyalty sideways, on terms only they understand. The affection comes at strange hours and means all the more for it.",
        m: "There was {self} only you saw, their own creature on their own odd clock, who could not be coaxed and arrived at loyalty sideways, on terms only they understood.",
      },
      tell: {
        d: "That small distance is not coldness. It is a private soul deciding, again and again, that you are the exception.",
        m: "That small distance was never coldness. It was a private soul deciding, again and again, that you were the exception.",
      },
    },
    Pisces: {
      beats: {
        d: "There's {self} only you see, the one soft to the edges and tuned to whatever the room is feeling, yours before they were their own. They appear at your worst moments without being called.",
        m: "There was {self} only you saw, the one soft to the edges and tuned to whatever the room was feeling, yours before they were their own. They appeared at your worst moments without being called.",
      },
      tell: {
        d: "That timing is never coincidence. It is a soul tuned to yours, carrying whatever the house is feeling and staying close through it.",
        m: "That timing was never coincidence. It was a soul tuned to yours, carrying whatever the house was feeling and staying close through it.",
      },
    },
  },
  moon: {
    Aries: {
      beats: {
        d: "There's {self} the hard days bring out, the one who cannot be soothed into stillness and never could, who has to burn the day off before the calm will come. Told to settle, they only wind tighter.",
        m: "There was {self} the hard days brought out, the one who could not be soothed into stillness, who had to burn the day off before the calm would come. Told to settle, they only wound tighter.",
      },
      tell: {
        d: "Once the racing is out of them, the quiet arrives on its own, every time. Movement first, softness second, is the whole secret of them.",
        m: "Once the racing was out of them, the quiet arrived on its own, every time. The mad dashes always came before the deepest sleeps.",
      },
    },
    Taurus: {
      beats: {
        d: "There's {self} the hard days bring out, the one for whom safe means warm, fed, and in the exact spot they always sleep. Move that one place a foot and you will hear about it for a week.",
        m: "There was {self} the hard days brought out, the one for whom safe meant warm, fed, and in the exact spot they always slept. Nothing in the house belonged to them more than that one place.",
      },
      tell: {
        d: "Put the ordinary back and they steady faster than any fuss could manage. For {name}, the usual is not boring. It is the whole point.",
        m: "Putting the ordinary back steadied them faster than any fuss could. The usual was never boring to them. It was the whole point.",
      },
    },
    Gemini: {
      beats: {
        d: "There's {self} the hard days bring out, the one who cannot settle in a quiet, empty room and invents a game to fill it. Calm comes from something to watch and someone to answer, never from nothing.",
        m: "There was {self} the hard days brought out, the one who could not settle in a quiet, empty room and invented a game to fill it. Calm came from something to watch and someone to answer.",
      },
      tell: {
        d: "Tire the mind, not the legs, and they go quiet. A busy head was never restlessness in them. It is how they keep themselves company.",
        m: "A tired mind settled them faster than tired legs ever did. The busy head was never restlessness. It was how they kept themselves company.",
      },
    },
    Cancer: {
      beats: {
        d: "There's {self} the hard days bring out, the one who feels safe only with you close and the day in its usual order, tipped into a small wounded quiet by a skipped goodbye. The sound of you coming home puts the whole day right.",
        m: "There was {self} the hard days brought out, the one who felt safe only with you close and the day in its usual order. The sound of you coming home put the whole day right, every time.",
      },
      tell: {
        d: "You are the routine. Everything else is only the frame around you, and they have always known it.",
        m: "You were the routine. Everything else was only the frame around you, and they always knew it.",
      },
    },
    Leo: {
      beats: {
        d: "There's {self} the hard days bring out, the one who feels safest the moment they are seen, whom a word of praise resets and being overlooked stings far more than they let on. They place themselves exactly where your eyes will land.",
        m: "There was {self} the hard days brought out, the one who felt safest the moment they were seen, whom a word of praise reset and being overlooked stung far more than they let on.",
      },
      tell: {
        d: "Being seen is not vanity in them. It is how they know they are safe. Say their name like good news and watch the whole body loosen.",
        m: "Being seen was never vanity in them. It was how they knew they were safe. They placed themselves where you could never miss them.",
      },
    },
    Virgo: {
      beats: {
        d: "There's {self} the hard days bring out, the one who cannot settle until everything sits in its right place, the same bowl in the same corner, the routine kept. Then the anxious edge finally goes quiet.",
        m: "There was {self} the hard days brought out, the one who could not settle until everything sat in its right place. The same bowl in the same corner, the routine kept, and the anxious edge finally went quiet.",
      },
      tell: {
        d: "Tidy the room before you tend to them and the worry runs out of jobs to do. Keeping the little things right is how they hold the whole house steady.",
        m: "Putting things back where they lived ran the worry out of jobs to do. Keeping the little things right was how they held the whole house steady.",
      },
    },
    Libra: {
      beats: {
        d: "There's {self} the hard days bring out, the one who steadies in company and frays alone, who borrows their calm straight from you. A tense room becomes a tense them within minutes.",
        m: "There was {self} the hard days brought out, the one who steadied in company and frayed alone, who borrowed their calm straight from you. A peaceful evening made a peaceful them.",
      },
      tell: {
        d: "Settle yourself first and they match you breath for breath. They were never choosing favourites. They were finding their balance in you.",
        m: "They always drifted to whoever was calmest in the room. It was never favouritism. It was them finding their balance.",
      },
    },
    Scorpio: {
      beats: {
        d: "There's {self} the hard days bring out, the one who watches from a safe distance before trusting a room. Once they decide you are the one who stays, that trust is total and does not come undone.",
        m: "There was {self} the hard days brought out, the one who watched from a safe distance before trusting a room. Once they decided you were the one who stays, that trust was total and never came undone.",
      },
      tell: {
        d: "Do not coax them out of hiding. Stay where they can see you and let them close the distance. That lookout spot is them deciding, again and again, that you are safe.",
        m: "They kept that one lookout spot their whole life. It was never distance. It was them deciding, again and again, that you were safe.",
      },
    },
    Sagittarius: {
      beats: {
        d: "There's {self} the hard days bring out, the one who needs room and a horizon more than a soft place to lie. Open ground does more for them than any blanket could.",
        m: "There was {self} the hard days brought out, the one who needed room and a horizon more than a soft place to lie. Open ground did more for them than any blanket ever could.",
      },
      tell: {
        d: "Open the space up before anything else and watch a change of scenery do what no soothing can. Seeing far was always their version of being held.",
        m: "They always faced the widest view they could find. Being able to see far was their version of being held.",
      },
    },
    Capricorn: {
      beats: {
        d: "There's {self} the hard days bring out, the one who steadies on a schedule they can count on, for whom surprises are no gift. A day that runs to plan is a day they can finally relax into.",
        m: "There was {self} the hard days brought out, the one who steadied on a schedule they could count on. A day that ran to plan was a day they could finally relax into.",
      },
      tell: {
        d: "Hold the timetable and let the day itself do the reassuring. Order was how they took care of everyone, themselves included.",
        m: "The whole house ended up running on their clock. Order was how they took care of everyone, themselves included.",
      },
    },
    Aquarius: {
      beats: {
        d: "There's {self} the hard days bring out, the one comforted by room to breathe rather than being held close, who comes to you when they are ready and means it more that way. Reach too soon and they step back.",
        m: "There was {self} the hard days brought out, the one comforted by room to breathe rather than being held close, who came to you when they were ready and meant it more that way.",
      },
      tell: {
        d: "Give the space first and the closeness second. They settle one step away, and that small distance is their whole heart, carried at its own length.",
        m: "They settled one step away instead of pressed against you. Nearby was their whole heart. They just carried it at their own distance.",
      },
    },
    Pisces: {
      beats: {
        d: "There's {self} the hard days bring out, the one soothed by quiet and the plain fact of you nearby, who soaks up the whole mood of the house. A loud day sends them somewhere small and safe to wait it out.",
        m: "There was {self} the hard days brought out, the one soothed by quiet and the plain fact of you nearby, who soaked up the whole mood of the house. A loud day sent them somewhere small and safe to wait it out.",
      },
      tell: {
        d: "Quiet the house before you offer anything else. Your calm, in the same room, is the comfort itself. They always know something is wrong before you say a word.",
        m: "They always knew something was wrong before you said a word. They were not reading your face. They were feeling the room.",
      },
    },
  },
  venus: {
    Aries: {
      beats: {
        d: "There's {self} in how they love you, the one who comes at it head-on, who crashes into you first and waits right there for the same back. A held-back hello reads as a no to them.",
        m: "There was {self} in how they loved you, the one who came at it head-on, who crashed into you first and waited right there for the same back.",
      },
      tell: {
        d: "Every greeting is the whole heart handed over at once. Meet them big, before the coat is even off, and you speak their exact language.",
        m: "Every hello was a collision. Holding back was never in them. Each greeting was the whole heart, handed over all at once.",
      },
    },
    Taurus: {
      beats: {
        d: "There's {self} in how they love you, the one who says it by leaning their whole weight on you and refusing to move. To them, not moving is the entire conversation.",
        m: "There was {self} in how they loved you, the one who said it by leaning their whole weight on you and refusing to move.",
      },
      tell: {
        d: "Stay put an extra minute when they settle against you and you have answered them completely. It is the weight of them you will always remember.",
        m: "It is the weight of them you remember more than anything. Leaning in was how they said it. Staying put was the point.",
      },
    },
    Gemini: {
      beats: {
        d: "There's {self} in how they love you, the one who brings you things and keeps up a running commentary while they do it. Attention is the love language, and being ignored is the only thing that stings.",
        m: "There was {self} in how they loved you, the one who brought you things and kept up a running commentary while they did it. Attention was the love language.",
      },
      tell: {
        d: "Answer the noise. Take the thing they bring, ask what it is. Every odd little sound is a question aimed straight at you.",
        m: "They never once came to you quietly. Every offering, every odd little sound, was a question aimed at you. Your answer was the prize.",
      },
    },
    Cancer: {
      beats: {
        d: "There's {self} in how they love you, the one who loves by guarding, who follows you room to room and frets the moment you leave. Keeping you in sight is the whole reassurance.",
        m: "There was {self} in how they loved you, the one who loved by guarding, who followed you room to room and fretted the moment you left.",
      },
      tell: {
        d: "Leave the door open while you get ready and you have given them everything. They never wanted a single day off from watching over you.",
        m: "They were always one room behind you, always in the doorway. Keeping you in sight was the love, and they never wanted a day off from it.",
      },
    },
    Leo: {
      beats: {
        d: "There's {self} in how they love you, the one who loves out loud and expects it back with interest, generous and a little theatrical. Every hello is a small performance, and you are the audience.",
        m: "There was {self} in how they loved you, the one who loved out loud and expected it back with interest, generous and a little theatrical.",
      },
      tell: {
        d: "Say their name warmly, make the fuss where others can see, and you have paid them in full. The show was always real. It was for you.",
        m: "Every hello felt like a performance. The show was real. You were the audience they did it all for.",
      },
    },
    Virgo: {
      beats: {
        d: "There's {self} in how they love you, the one who shows it by staying close while you work, missing nothing and asking for nothing. Small and often beats grand and rare, every time.",
        m: "There was {self} in how they loved you, the one who showed it by staying close while you worked, missing nothing and asking for nothing.",
      },
      tell: {
        d: "A quiet word, a hand resting on them mid-task, is all they were ever after. They love you in the small hours of ordinary days.",
        m: "They were always within reach and never in the way. Quiet company was the gift. They loved you in the small hours of ordinary days.",
      },
    },
    Libra: {
      beats: {
        d: "There's {self} in how they love you, the one who loves to be near and in tune, who gives the softness first and hopes you match it. They seem to feel what you feel a beat before you say it.",
        m: "There was {self} in how they loved you, the one who loved to be near and in tune, who gave the softness first and hoped you would match it.",
      },
      tell: {
        d: "Meet them softly, lower your voice, slow your hands. The house sits gentler with them keeping the balance, and that balancing is the love itself.",
        m: "They seemed to feel what you felt a beat before you said it. Meeting you halfway was the love. The house sat gentler with them keeping the balance.",
      },
    },
    Scorpio: {
      beats: {
        d: "There's {self} in how they love you, the one who picks a single person and keeps picking them. That is you, and it is for life. They are different with you than with anyone else.",
        m: "There was {self} in how they loved you, the one who picked a single person and kept picking them. That was you, and it was for life.",
      },
      tell: {
        d: "Keep your promises to them, even the tiny ones. Loyalty answered with loyalty is the only language they trust, and they chose you early.",
        m: "They were different with you than with anyone else. Not aloof. Chosen. They decided on you early and never once changed the answer.",
      },
    },
    Sagittarius: {
      beats: {
        d: "There's {self} in how they love you, the one who loves by including you, whose every open door comes with the same invitation: come on, keep up. Being in it with them beats any cuddle.",
        m: "There was {self} in how they loved you, the one who loved by including you, whose every open door came with the same invitation: come on, keep up.",
      },
      tell: {
        d: "Say yes more than you say no, and join the game even for five minutes. The adventure was never the point. Having you in it was.",
        m: "The best memories are the ones where you went along. The adventure was never the point. Having you in it was.",
      },
    },
    Capricorn: {
      beats: {
        d: "There's {self} in how they love you, the one who is undemonstrative and completely dependable, whose love is in the showing up. A kept routine tells them more than a hundred cuddles.",
        m: "There was {self} in how they loved you, the one who was undemonstrative and completely dependable, whose love was in the showing up.",
      },
      tell: {
        d: "Be dependable back, same time, same ritual, kept without fail. The love never looks dramatic and never once wavers. That is the whole vow.",
        m: "The love never looked dramatic and never once wavered. They were there every single day, in the same quiet way. That was the whole vow.",
      },
    },
    Aquarius: {
      beats: {
        d: "There's {self} in how they love you, the one who loves on a slant and sits one cushion away, which from them is pure devotion. Choosing the same room as you is the declaration.",
        m: "There was {self} in how they loved you, the one who loved on a slant and sat one cushion away, which from them was pure devotion.",
      },
      tell: {
        d: "Let the cushion count. Do not pull them closer. In their language, that small distance is the closest thing to closeness there is.",
        m: "They were near you far more often than they were on you. Choosing the same room was the declaration. In their language, that small distance was closeness.",
      },
    },
    Pisces: {
      beats: {
        d: "There's {self} in how they love you, the one who loves by melting into you, with no edge between their mood and yours. They appear on your hardest days without being called.",
        m: "There was {self} in how they loved you, the one who loved by melting into you, with no edge between their mood and yours.",
      },
      tell: {
        d: "Bring them your softest hour and let them settle into it. Your calm is the affection they read best. Loving you and knowing you were never two different things.",
        m: "They appeared on your hardest days without being called. Your feelings were their feelings. Loving you and knowing you were never two different things.",
      },
    },
  },
  mercury: {
    Aries: {
      beats: {
        d: "There's {self} in the way they talk to you, the one who wants it now and tells you fast, one sharp sound and a stare and you are already moving before you know why. Being heard quickly matters more than the yes.",
        m: "There was {self} in the way they talked to you, the one who wanted it now and told you fast, one sharp sound and a stare and you were already up before you knew why.",
      },
      tell: {
        d: "Answer the first ask, even when the answer is no. They never learned to wait because they trusted you to hear them. That was faith, not impatience.",
        m: "They never learned to wait. They trusted you to answer, so they never had to. That was faith, not impatience.",
      },
    },
    Taurus: {
      beats: {
        d: "There's {self} in the way they talk to you, the one who thinks slow and means every word of it. Ask twice and you get the same calm answer, usually a long look toward the food.",
        m: "There was {self} in the way they talked to you, the one who thought slow and meant every word of it. Ask twice and you got the same calm answer.",
      },
      tell: {
        d: "Say it once, then count to ten. The answer is already on its way, just on their clock. Steady was always their whole vocabulary.",
        m: "They never startled at your bad days. They decided about you slowly, once, and it held. Steady was their whole vocabulary.",
      },
    },
    Gemini: {
      beats: {
        d: "There's {self} in the way they talk to you, the one two thoughts ahead, who reads your tone long before your words and answers with the whole body. Nothing in your voice ever gets past them.",
        m: "There was {self} in the way they talked to you, the one two thoughts ahead, who read your tone long before your words and answered with the whole body.",
      },
      tell: {
        d: "Talk to them in tone, not vocabulary. Warm the sound of it and the whole body answers before your sentence ends. They knew you were leaving before you touched the keys.",
        m: "They knew you were leaving before you picked up the keys. They read the shift in you, not the routine. Nothing in you ever got past them.",
      },
    },
    Cancer: {
      beats: {
        d: "There's {self} in the way they talk to you, the one who speaks in moods, a small sound and a lean into you telling you exactly how the day went. The greeting is the whole conversation.",
        m: "There was {self} in the way they talked to you, the one who spoke in moods, a small sound and a lean into you telling you exactly how the day went.",
      },
      tell: {
        d: "Keep the hellos and goodbyes, even the rushed ones. Skipping one says more than you mean it to. They kept count in love, never in grudges.",
        m: "Your arrivals mattered so much to them. The greeting was the whole conversation, and they never once missed it. They kept count in love, not grudges.",
      },
    },
    Leo: {
      beats: {
        d: "There's {self} in the way they talk to you, the one who does everything with flair, the dramatic sigh, the head turned just so, an audience expected and usually granted. The sighs get louder the moment you look away.",
        m: "There was {self} in the way they talked to you, the one who did everything with flair, the dramatic sigh, the head turned just so, an audience expected and usually granted.",
      },
      tell: {
        d: "Say what they are doing out loud, like it is news. Being watched is their word for being loved, and it costs you nothing to give.",
        m: "The sighs got louder when you looked away. Being watched was their word for being loved, and you gave them a lifetime in the front row.",
      },
    },
    Virgo: {
      beats: {
        d: "There's {self} in the way they talk to you, the one who notices the new bag, the rearranged shoes, the half-second you paused, and lets you know they saw. Nothing changes in the house without their inspection.",
        m: "There was {self} in the way they talked to you, the one who noticed the new bag, the rearranged shoes, the half-second you paused, and let you know they saw.",
      },
      tell: {
        d: "When something changes, show it to them on purpose. Once it has been checked, the new thing stops being a problem. Every small inspection is a kind of care.",
        m: "Nothing in that house changed without their inspection. Keeping track of your world was how they kept you. Every small check was a kind of care.",
      },
    },
    Libra: {
      beats: {
        d: "There's {self} in the way they talk to you, the one who negotiates, a look at you, a look at the door, a polite pause until you both agree on the plan. They wait for your nod before the good part.",
        m: "There was {self} in the way they talked to you, the one who negotiated, a look at you, a look at the door, a polite pause until you both agreed on the plan.",
      },
      tell: {
        d: "Give them the small yes out loud. They are not asking permission, they are asking for agreement, and the agreement is the treat.",
        m: "They always waited for your nod before the good part. They never wanted the thing as much as they wanted the two of you deciding it together.",
      },
    },
    Scorpio: {
      beats: {
        d: "There's {self} in the way they talk to you, the one who says little and means the whole of it. When they finally ask, you do not say no, because the ask has already passed a hundred quiet tests.",
        m: "There was {self} in the way they talked to you, the one who said little and meant the whole of it. When they finally asked, you did not say no.",
      },
      tell: {
        d: "Treat their rare request as urgent. The quiet was never distance. They were saving their words for the things that counted, and every one was aimed at you.",
        m: "The quiet never meant distance. They were saving their words for the things that counted, and every one of them was aimed at you.",
      },
    },
    Sagittarius: {
      beats: {
        d: "There's {self} in the way they talk to you, the one with big loud opinions about everything outside, announcing the visitor, the delivery, the whole world going by in case you missed it.",
        m: "There was {self} in the way they talked to you, the one with big loud opinions about everything outside, announcing the visitor, the delivery, the whole world going by in case you missed it.",
      },
      tell: {
        d: "Go and see what they are announcing. Two seconds of looking together turns the noise into a conversation, and the conversation was what they wanted all along.",
        m: "They told you about everything, even the things you could plainly see. The news was never the point. Sharing the world with you was.",
      },
    },
    Capricorn: {
      beats: {
        d: "There's {self} in the way they talk to you, the one who communicates in one firm look that means business and holds your eye until the message lands. They only ever file a complaint once.",
        m: "There was {self} in the way they talked to you, the one who communicated in one firm look that meant business and held your eye until the message landed.",
      },
      tell: {
        d: "When you get the long stare, stop and take inventory: water, food, door, routine. They trusted you to hear it the first time, and you did.",
        m: "One look from them could stop you mid-sentence. They never asked twice, because they trusted you to hear it the first time. And you did.",
      },
    },
    Aquarius: {
      beats: {
        d: "There's {self} in the way they talk to you, the one who invents their own signals, an odd tap, a sound all their own, a routine only the two of you understand. Nobody else can quite read them.",
        m: "There was {self} in the way they talked to you, the one who invented their own signals, an odd tap, a sound all their own, a routine only the two of you understood.",
      },
      tell: {
        d: "Answer the strange signal the same way every time. You are not training them, you are keeping up your half of a language built for an audience of one. You.",
        m: "Nobody else could quite read them. The language was built for an audience of one, and it was you. It was never meant to translate.",
      },
    },
    Pisces: {
      beats: {
        d: "There's {self} in the way they talk to you, the one who reads the room before you do, already beside you at the smallest change in your voice, asking nothing and offering everything.",
        m: "There was {self} in the way they talked to you, the one who read the room before you did, already beside you at the smallest change in your voice, asking nothing and offering everything.",
      },
      tell: {
        d: "You never have to hide a hard day from them. They already know, so let them sit close while you have it. Pretending is the only thing that ever confuses them.",
        m: "They always appeared before the tears did. They felt the weather change in you first, and being near was the only answer they thought you needed. They were right.",
      },
    },
  },
  mars: {
    Aries: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one first out the door and last to quit, who plays rough, forgives fast, and treats anything that moves as a personal challenge.",
        m: "There was {self} the moment the energy took over, the one first out the door and last to quit, who played rough, forgave fast, and treated anything that moved as a personal challenge.",
      },
      tell: {
        d: "Give the burst somewhere to land the moment it arrives and you buy a calm afternoon. The energy came all at once and left the same way, and none of it was ever held against you.",
        m: "They went from still to full speed with no warning. The energy arrived all at once and left the same way. None of it was ever held against you.",
      },
    },
    Taurus: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one slow to rile and impossible to budge once they are, who wants what they want and leans their whole weight into getting it.",
        m: "There was {self} the moment the energy took over, the one slow to rile and impossible to budge once they were, who wanted what they wanted and leaned their whole weight into getting it.",
      },
      tell: {
        d: "Never rush the energy out of them. One long, unhurried game at their pace does more than ten quick ones at yours. That was the only clock they ever kept.",
        m: "Pushing never worked and waiting always did. They moved when it made sense to them. That was the only clock they ever kept.",
      },
    },
    Gemini: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one whose energy comes in quick bursts and switches targets halfway there, who would always rather outsmart you than out-muscle you.",
        m: "There was {self} the moment the energy took over, the one whose energy came in quick bursts and switched targets halfway there, who always chose outsmarting you over out-muscling you.",
      },
      tell: {
        d: "Change the game before they tire of it. Three short puzzles drain them deeper than one long chase. The target moved because their mind got there first.",
        m: "No game lasted long, and no boredom did either. They were never being difficult. The target moved because their mind got there first.",
      },
    },
    Cancer: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one who defends their people before themselves, gentle until something they love is threatened and then suddenly very brave.",
        m: "There was {self} the moment the energy took over, the one who defended their people before themselves, gentle until something they loved was threatened and then suddenly very brave.",
      },
      tell: {
        d: "Let them keep watch without giving them a job. A spot beside you where they can see the door drains more from them than any game. The bravery only ever showed up when you needed it.",
        m: "They put themselves between you and anything strange. The bravery only ever showed up when you needed it. That was the whole design.",
      },
    },
    Leo: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one who plays to an audience and fights for the spotlight, bold and a little dramatic, for whom no win counts until you have seen it.",
        m: "There was {self} the moment the energy took over, the one who played to an audience and fought for the spotlight, bold and a little dramatic, for whom no win counted until you had seen it.",
      },
      tell: {
        d: "Watch them play, out loud. The same game with your eyes on it counts double, and praise empties the tank faster than effort does. The showing off was always for you.",
        m: "They saved their best moves for when you were looking. The showing off was never vanity. It was for you.",
      },
    },
    Virgo: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one who goes after what they want with quiet precision instead of noise, who studies the problem and then solves it on the third try.",
        m: "There was {self} the moment the energy took over, the one who went after what they wanted with quiet precision instead of noise, who studied the problem and then solved it on the third try.",
      },
      tell: {
        d: "Give them a problem, not a party, and let them fail twice before they crack it. The pause before they touch a thing was never hesitation. It was the plan being finished.",
        m: "They studied a thing before they touched it. The pause was never hesitation. It was the plan being finished.",
      },
    },
    Libra: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one who hates a real fight and loves a fair game, who will charm their way to the treat long before they ever wrestle for it.",
        m: "There was {self} the moment the energy took over, the one who hated a real fight and loved a fair game, who charmed their way to the treat long before they ever wrestled for it.",
      },
      tell: {
        d: "Play with them, never at them. Take turns, keep it even, stop while it is still friendly. Peace was never weakness in them. It was the strategy, and it worked on you daily.",
        m: "They never fought for anything they could charm their way to. Peace was never weakness in them. It was the strategy, and it worked on you daily.",
      },
    },
    Scorpio: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one who is all or nothing and remembers, who locks onto a goal with a focus that runs a little intense. Once they want a thing, the wanting does not stop.",
        m: "There was {self} the moment the energy took over, the one who was all or nothing and remembered, who locked onto a goal with a focus that ran a little intense.",
      },
      tell: {
        d: "Give them one goal and do not interrupt it. A half-finished game leaves the engine running. Nothing they aimed at was ever casual, you included.",
        m: "Once they wanted a thing, the wanting did not stop. The focus you laughed about was the truest part of them. Nothing they aimed at was casual, including you.",
      },
    },
    Sagittarius: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one who runs first and thinks later, for whom the whole world is the playing field. Restless, fearless, happiest in a full sprint.",
        m: "There was {self} the moment the energy took over, the one who ran first and thought later, for whom the whole world was the playing field. Restless, fearless, happiest in a full sprint.",
      },
      tell: {
        d: "Make space the reward: open ground, somewhere new, anywhere the edges sit further away. They were built for open ground, and any open door was an offer they had to take.",
        m: "The far corner always beat the near one. They were built for open ground, and any open door was an offer they had to take.",
      },
    },
    Capricorn: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one patient and relentless, who paces themselves, never wastes a move, and quietly wins the long game.",
        m: "There was {self} the moment the energy took over, the one patient and relentless, who paced themselves, never wasted a move, and quietly won the long game.",
      },
      tell: {
        d: "Give them one steady job to see through, start to finish. Effort with a point is the only effort they respect. What they wanted, they waited for, and then they got.",
        m: "They never rushed and never gave up. What they wanted, they waited for. And what they waited for, they got.",
      },
    },
    Aquarius: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one who picks their own fights for their own reasons, stubborn in odd moments and unbothered in the ones you expect to spook them.",
        m: "There was {self} the moment the energy took over, the one who picked their own fights for their own reasons, stubborn in odd moments and unbothered in the ones you expected to spook them.",
      },
      tell: {
        d: "Offer the game, then step back. They spend energy on their own schedule, and insisting only stalls it. Their courage always kept its own list.",
        m: "They braved the strange things and dodged the easy ones. Their courage kept its own list. It never needed yours to make sense.",
      },
    },
    Pisces: {
      beats: {
        d: "There's {self} the moment the energy takes over, the one who goes soft and sideways rather than head-on, whose drive runs on feeling, so a sulk from them lands harder than any fight.",
        m: "There was {self} the moment the energy took over, the one who went soft and sideways rather than head-on, whose drive ran on feeling, so a sulk from them landed harder than any fight.",
      },
      tell: {
        d: "Check the mood before the game. On a soft day, gentle play close to you empties them out, while pushing for more just fills them back up. The retreat was never fear. It was them answering the room.",
        m: "They never met anything head-on. Their strength lived in the feeling of things, so the retreat was never fear. It was them answering the room.",
      },
    },
  },
};

/* Element card. L1 is fixed and identical in both voices (the chart does not
   change); the verb goes singular when the count is one. Name woven via {poss}. */
export type DeckElement = "Fire" | "Earth" | "Air" | "Water";

export const ELEMENT_TAIL: Record<DeckElement, string> = {
  Fire: "Fire is the spark. Where the energy starts.",
  Earth: "Earth is the body. Food, warmth, the ground under them.",
  Air: "Air is the mind. The watching and the working out.",
  Water: "Water is feeling. The mood of the house runs through them.",
};

const COUNT_WORD = ["", "One", "Two", "Three", "Four", "Five"] as const;

export function elementL1(count: number, element: DeckElement): string {
  const n = Math.max(1, Math.min(5, count));
  return `${COUNT_WORD[n]} of {poss} five planets ${n === 1 ? "stands" : "stand"} in ${element}. ${ELEMENT_TAIL[element]}`;
}

export const ELEMENT_READS: Record<DeckElement, DeckSignEntry> = {
  Fire: {
    beats: {
      d: "This is the part of {name} that runs hot: quick to light, quick to burn through it, big bursts and then the deepest sleep in the house.",
      m: "This was the part of {name} that ran hot: quick to light, quick to burn through it, big bursts and then the deepest sleep in the house. That never changed.",
    },
    tell: {
      d: "The burst is coming either way, so the kindest thing is to give it somewhere to go before you need them calm.",
      m: "Their days ran on bursts and deep rests, and both were exactly right. The sudden racing about, the heavy sleep after. That was the fire keeping its own time.",
    },
  },
  Earth: {
    beats: {
      d: "This is the part of {name} that stays put: steady as furniture, the one who picks a place and makes the place theirs.",
      m: "This was the part of {name} that stayed put: steady as furniture, the one who picked a place and made the place theirs.",
    },
    tell: {
      d: "Keep dinner at the same hour before anything else. The clockwork is the comfort. The fuss is only ever extra.",
      m: "It is why the same spot mattered so much. The same hour, the same corner, the same small rituals. Their days were built to hold, and they held.",
    },
  },
  Air: {
    beats: {
      d: "This is the part of {name} that never stops thinking: a busy head in a quiet body, where nothing that moves in the room gets past them.",
      m: "This was the part of {name} that never stopped thinking: a busy head in a quiet body, where nothing that moved in the room ever got past them.",
    },
    tell: {
      d: "Change one small thing each day, a moved toy, a new box, a different game. A fed mind is a quiet one.",
      m: "It is why they noticed everything. The long watching, the small experiments, the games they invented for themselves. Their days were spent thinking, and it showed.",
    },
  },
  Water: {
    beats: {
      d: "This is the part of {name} that feels everything: soft to the edges, with no wall between the weather of the house and their own.",
      m: "This was the part of {name} that felt everything: soft to the edges, with no wall between the weather of the house and their own.",
    },
    tell: {
      d: "Steady yourself before you comfort them. Your calm reaches them first, and it is the only comfort that fully works.",
      m: "It is why they always found you on the hard days. They felt the house before anyone said a word. Staying close was never an accident.",
    },
  },
};

/* Synthesis: composed from the two clause pools for the ACTUAL chart. The
   Sun/Moon clauses stay present tense in both voices (the chart still wants
   and needs); only the close shifts. "not a habit. It is the chart." lives
   here and nowhere else. */
export const SYNTH_LEAD = "Now watch two of these work as one.";

export const SUN_WANTS: Record<string, string> = {
  Aries: "to be first, always",
  Taurus: "comfort they can count on",
  Gemini: "something new to figure out",
  Cancer: "everyone they love within reach",
  Leo: "your eyes on them",
  Virgo: "everything in its right place",
  Libra: "a calm and even room",
  Scorpio: "one person, completely",
  Sagittarius: "the next open door",
  Capricorn: "a place they have earned",
  Aquarius: "their own terms, always",
  Pisces: "to feel what you feel",
};

export const MOON_NEEDS: Record<string, string> = {
  Aries: "to burn it off first",
  Taurus: "the same spot every time",
  Gemini: "something to watch and answer",
  Cancer: "you nearby and nothing skipped",
  Leo: "to be seen to settle",
  Virgo: "the routine kept exactly",
  Libra: "your calm to borrow",
  Scorpio: "a safe place to watch from",
  Sagittarius: "open ground more than softness",
  Capricorn: "a day that runs to plan",
  Aquarius: "room to come to you",
  Pisces: "quiet, and you nearby",
};

export const SYNTH_CLOSE: Voiced = {
  d: "The place {poss} whole self keeps returning to is not a habit. It is the chart.",
  m: "The place {poss} whole self kept returning to was never a habit. It was the chart.",
};

/* "A" becomes "An" before Aries and Aquarius. */
export function signArticle(sign: string): string {
  return sign === "Aries" || sign === "Aquarius" ? "An" : "A";
}

/* Tease + handoff card, both voices, in the approved four-beat anatomy:
   keep = teach (the ledger truth), deeper = their sky (the eight inside
   ones), love = the recognition, bridge + cta = the open door. */
export type TeaseCopy = {
  keep: string;
  deeper: string;
  ledger: { body: string; line: string }[];
  rising: string;
  love: string;
  bridge: string;
  cta: string;
};

export const TEASE: { d: TeaseCopy; m: TeaseCopy } = {
  d: {
    keep: "You have read five of {poss} thirteen. The five anyone can see from the outside.",
    deeper: "The eight still sealed are the inside ones. What they fear. What they carry from before you. The job they came to do.",
    ledger: [
      { body: "Saturn", line: "What they fear, and what steadies them." },
      { body: "Chiron", line: "What they carry from before you." },
      { body: "Jupiter", line: "Where their joy lives." },
      { body: "Pluto", line: "Who they never quite forgive." },
      { body: "North Node", line: "The job they came to do." },
      { body: "Uranus", line: "The strange streak." },
      { body: "Neptune", line: "The dreaming." },
      { body: "Lilith", line: "The wild streak." },
    ],
    rising: "And the rising. It turns on the exact minute they arrived.",
    love: "Everything you just recognised came from one date and five lights. The rest of who they are has been waiting a whole life to be read.",
    bridge: "The full reading opens all thirteen and reads them as one. The reason for the exact spot on you they always pick is in there.",
    cta: "Open the rest of who they are",
  },
  m: {
    keep: "You have read five of {poss} thirteen. The five anyone can see from the outside.",
    deeper: "The eight still sealed are the inside ones. What they feared. What they carried from before you. The job they came to do.",
    ledger: [
      { body: "Saturn", line: "What they feared, and what steadied them." },
      { body: "Chiron", line: "What they carried from before you." },
      { body: "Jupiter", line: "Where their joy lived." },
      { body: "Pluto", line: "Who they never quite forgave." },
      { body: "North Node", line: "The job they came to do." },
      { body: "Uranus", line: "The strange streak." },
      { body: "Neptune", line: "The dreaming." },
      { body: "Lilith", line: "The wild streak." },
    ],
    rising: "And the rising. It turns on the exact minute they arrived.",
    love: "Everything you just recognised came from one date and five lights. The rest of who they were is still written in the sky, waiting to be read.",
    bridge: "The full reading opens all thirteen and reads them as one. The reason for the exact spot on you they always picked is in there.",
    cta: "Open the rest of who they are",
  },
};

/* Connective microcopy (both voices). */
export const counterLabel = (n: number) => `${n} of 13 read`;
export const NUDGE_WORD = "turn";
