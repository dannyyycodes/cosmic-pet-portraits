// THE LOCKED DOOR pools: beat 4 of the approved four-beat card. One device
// per planet, per the approved draft, so no two cards tease the same way:
//   Sun     = the one life job with your name on it
//   Moon    = what restores them is written one layer deeper
//   Venus   = what they ask in return, measured only in the full reading
//   Mercury = the one signal you have been misreading
//   Mars    = the steadier: the off switch belongs to a sealed body
// A beat marked linked:true names the REAL sealed body the card planet
// aspects (injected as {SEALED} by the composer, only when that aspect
// exists in the chart); linked:false beats make no body claim and are the
// always-safe pick. No em-dashes, no "report", no sell-words.

import type { Voiced } from "../freeDeck";
import type { DeckPlanet } from "../freeDeck";

export type PlanetSealBeat = {
  /** true = the beat names {SEALED}, a sealed body genuinely aspecting the card planet */
  linked: boolean;
  text: Voiced;
};

export const PLANET_SEALS: Record<DeckPlanet, PlanetSealBeat[]> = {
  sun: [
    {
      linked: false,
      text: {
        d: "There is one job a Sun placed like this gives a soul for life. {Their} job has your name on it. The full reading names it back.",
        m: "There is one job a Sun placed like this gives a soul for life. {Their} job had your name on it from the first day. The full reading names it back.",
      },
    },
    {
      linked: false,
      text: {
        d: "Every Sun sets one lifelong assignment. {Their} assignment is about you. What it is, word for word, stays sealed.",
        m: "Every Sun sets one lifelong assignment. {Their} assignment was about you, start to finish. What it was, word for word, stays sealed.",
      },
    },
    {
      linked: false,
      text: {
        d: "The Sun hands every chart one post to hold. Where {name} stands guard, and why that post was chosen, stays sealed.",
        m: "The Sun hands every chart one post to hold. Where {name} stood guard, and why that post was chosen, stays sealed.",
      },
    },
  ],
  moon: [
    {
      linked: true,
      text: {
        d: "What actually restores {name} after a hard day is written one layer deeper, where the Moon strikes its bargain with {SEALED}. That bargain, and how to answer it, stays sealed.",
        m: "What actually restored {name} after a hard day is written one layer deeper, where the Moon strikes its bargain with {SEALED}. That bargain, and how you answered it without knowing, stays sealed.",
      },
    },
    {
      linked: false,
      text: {
        d: "What actually restores {name} after a hard day sits one layer under this card. That layer, and how to reach it, stays sealed.",
        m: "What actually restored {name} after a hard day sits one layer under this card. That layer, and how often you reached it without knowing, stays sealed.",
      },
    },
    {
      linked: false,
      text: {
        d: "The Moon keeps one need it never shows in daylight. {Their} version of it, and what answers it, stays sealed.",
        m: "The Moon keeps one need it never shows in daylight. {Their} version of it, and how you answered it, stays sealed.",
      },
    },
  ],
  venus: [
    {
      linked: false,
      text: {
        d: "What {name} is asking for in return, the one thing that makes the affection double, is measured in the full reading and nowhere else.",
        m: "What {name} was asking for in return, the one thing that made the affection double, is measured in the full reading and nowhere else.",
      },
    },
    {
      linked: false,
      text: {
        d: "Venus never gives without asking one thing back. {Their} one thing stays sealed.",
        m: "Venus never gives without asking one thing back. {Their} one thing, and how faithfully you paid it, stays sealed.",
      },
    },
    {
      linked: false,
      text: {
        d: "There is a price on {their} affection, small and exact and never spoken. The full reading reads it out.",
        m: "There was a price on {their} affection, small and exact and never spoken. The full reading reads it out.",
      },
    },
  ],
  mercury: [
    {
      linked: false,
      text: {
        d: "There is one signal {name} sends that you have been reading as something else. Which one, and what it actually says, stays sealed.",
        m: "There is one signal {name} sent that you read as something else the whole time. Which one, and what it actually said, stays sealed.",
      },
    },
    {
      linked: false,
      text: {
        d: "One line of {their} language has been translated wrong in this house for years. The correction stays sealed.",
        m: "One line of {their} language was translated wrong for years, and it is not too late to know. The correction stays sealed.",
      },
    },
    {
      linked: false,
      text: {
        d: "Of everything {name} says without words, one message keeps going over your head. The full reading catches it.",
        m: "Of everything {name} said without words, one message went over your head every time. The full reading catches it.",
      },
    },
  ],
  mars: [
    {
      linked: true,
      text: {
        d: "What steadies {name} when you are not there to be found is {SEALED}'s answer to give. {SEALED} stays sealed.",
        m: "What steadied {name} when you were not there to be found was {SEALED}'s answer to give. {SEALED} stays sealed.",
      },
    },
    {
      linked: true,
      text: {
        d: "Where the fire goes when it has nowhere to go is written at the other end of this line, at {SEALED}. {SEALED} stays sealed.",
        m: "Where the fire went when it had nowhere to go is written at the other end of this line, at {SEALED}. {SEALED} stays sealed.",
      },
    },
    {
      linked: false,
      text: {
        d: "What sets the engine off is on this card. What shuts it down gently, the switch you have been looking for, stays sealed.",
        m: "What set the engine off is on this card. What shut it down gently, the switch you found without ever being told, stays sealed.",
      },
    },
  ],
};
