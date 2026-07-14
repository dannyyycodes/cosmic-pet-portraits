/* The free reading deck: Danny-approved copy for the tap-advance card deck
   (2026-07-14). Every line here is VERBATIM from the approved copy deck; do
   not edit without a copy approval. Discovery L2 lines marked KEPT in the
   approval reference SIGN_LINES so the deck and the checkout excerpt can
   never drift. Memorial voice: past tense for the pet's behaviour, present
   tense for what stays true, zero instructions. */

import { SIGN_LINES } from "./signLines";

export const DECK_PLANETS = ["sun", "moon", "venus", "mercury", "mars"] as const;
export type DeckPlanet = (typeof DECK_PLANETS)[number];

export type Voiced = { d: string; m: string };
export type DeckSignEntry = { l2: Voiced; l3: Voiced };

/* L1 NAME IT frames. Fixed per planet, only the sign swaps. Identical in
   both voices: the chart does not change. */
export const DECK_L1: Record<DeckPlanet, (sign: string) => string> = {
  sun: (s) => `Their Sun is in ${s}. That is who they are underneath everything.`,
  moon: (s) => `Their Moon is in ${s}. The Moon is what settles them when the day has been too much.`,
  venus: (s) => `Their Venus is in ${s}. Venus is how they love you back.`,
  mercury: (s) => `Their Mercury is in ${s}. Mercury is how they talk to you.`,
  mars: (s) => `Their Mars is in ${s}. Mars is where the energy goes.`,
};

/* Sealed-depth footers, one per planet, both voices. */
export const DECK_SEALED: Record<DeckPlanet, Voiced> = {
  sun: {
    d: "Their Sun's exact degree, and the one job it gives them, stays sealed.",
    m: "The one thing their Sun sent them here to be for you stays sealed.",
  },
  moon: {
    d: "What they fear, and what steadies them, stays sealed in the full reading.",
    m: "What they feared, and what always steadied them, stays sealed in the full reading.",
  },
  venus: {
    d: "What their love asks for in return stays sealed in the full reading.",
    m: "How they knew you loved them back stays sealed in the full reading.",
  },
  mercury: {
    d: "The full reading holds the signal you keep missing, and how to answer it.",
    m: "The full reading holds what they were telling you all along, in their words.",
  },
  mars: {
    d: "The full reading holds what sets their temper off, and what settles it.",
    m: "The full reading holds what they were protecting, every time they stood firm.",
  },
};

const S = SIGN_LINES;

/* L2 (MEAN IT) + L3 (USE IT), all 12 signs x 5 planets, both voices. */
export const DECK_READS: Record<DeckPlanet, Record<string, DeckSignEntry>> = {
  sun: {
    Aries: {
      l2: { d: S.sun.Aries, m: "There was never a gap between wanting and doing. First through the door, first at the food, halfway into the thing before they had thought it through." },
      l3: { d: "Let them be first at the small things today. The door, the greeting, the food. Being first is how this one knows who they are.", m: "It is why they reached every door before you did. Rushing ahead was never bad manners. It was them being most fully themselves." },
    },
    Taurus: {
      l2: { d: S.sun.Taurus, m: "Slow, certain, and impossible to hurry. Comfort was a need, not a treat, and once they had picked their spot the rest of the world could wait." },
      l3: { d: "Let one thing today take as long as they want. Hurry them and you trade the sweetest hour of their day for two saved minutes.", m: "It is why they took their time with everything. The slowness was never stubbornness. It was them savouring a life they trusted completely." },
    },
    Gemini: {
      l2: { d: S.sun.Gemini, m: "Two thoughts running before they finished the first, curious about anything that moved. They took in the whole room at a glance, then needed something new to do with it." },
      l3: { d: "Change one small thing today and let them find it. For this one, a new puzzle is worth more than a full bowl.", m: "It is why they were into everything before you had even set it down. The curiosity was never mischief. It was a quick mind asking the world to keep up." },
    },
    Cancer: {
      l2: { d: S.sun.Cancer, m: "Their whole self was built around the ones they loved. Soft at the center, watchful of the door, happiest when everyone they belonged to was home." },
      l3: { d: "Come home the same way at the same time when you can. Your return is the ritual this one builds the whole day around.", m: "It is why they always knew when someone was missing. The watching at the door was never worry for nothing. It was love doing a headcount." },
    },
    Leo: {
      l2: { d: S.sun.Leo, m: "Made for the warm middle of the room, and they knew when their seat was taken. The affection was real and generous, and it wanted one pair of eyes on it. Yours." },
      l3: { d: "Once today, put everything down and just watch them. For this one, your full attention is the whole point of the performance.", m: "It is why they always found the middle of the room. Taking the spotlight was never vanity. It was them giving you the best seat." },
    },
    Virgo: {
      l2: { d: S.sun.Virgo, m: "Watchful and precise, quietly running a routine nobody assigned them. They noticed the thing you moved and the second you changed your mind, and they let you know they saw." },
      l3: { d: "Keep the small things where they were. The bowl, the bed, the order of the morning. This one relaxes when the details behave.", m: "It is why they noticed every little thing you moved. The fussing was never criticism. It was them keeping the house right for the people in it." },
    },
    Libra: {
      l2: { d: S.sun.Libra, m: "Only fully themselves when the room was calm and the bond felt even. They read your mood and handed it back a shade softer." },
      l3: { d: "Settle the room before you try to settle them. Lower your own voice first and they soften a beat behind you.", m: "It is why the house felt calmer with them in it. Handing your mood back a shade softer was never an accident. It was how they loved." },
    },
    Scorpio: {
      l2: { d: S.sun.Scorpio, m: "All in or not at all, and they were the one who decided which. What they gave, they gave completely, and they forgot nothing that passed between you." },
      l3: { d: "Do not trick them, even as a game. This one forgets nothing, so make sure what they remember is you keeping your word.", m: "It is why they chose you completely and never once wavered. The intensity was not a phase. It was a whole heart with only one setting." },
    },
    Sagittarius: {
      l2: { d: S.sun.Sagittarius, m: "Born mid-adventure with their nose already to the wind. The horizon was the whole point, a shut gate was a dare, and the world was theirs to go and read." },
      l3: { d: "Give them a new horizon today, even if it is just an open window or a room they rarely see. Small adventures still count as adventures.", m: "It is why no fence ever quite held them. The wandering was never running from you. It was them trusting the world you shared was safe to go and read." },
    },
    Capricorn: {
      l2: { d: S.sun.Capricorn, m: "Serious past their years, steady when everything else wobbled. They did not beg for their place, they earned it quietly, then held it like it was always theirs." },
      l3: { d: "Skip the fuss and keep the schedule. For this one, you being reliable is the love, not the extras.", m: "It is why they kept the same place in the house for years. The seriousness was never distance. It was them quietly holding the family steady." },
    },
    Aquarius: {
      l2: { d: S.sun.Aquarius, m: "Their own creature on their own odd clock, and coaxing never changed it. The loyalty was real, it just arrived sideways, on terms only they understood." },
      l3: { d: "Let them come to you today instead of calling them over. The loyalty runs on their clock, and it is worth the wait every time.", m: "It is why the affection arrived at odd hours, on their terms. The distance was never coldness. It was a private creature deciding you were the exception." },
    },
    Pisces: {
      l2: { d: S.sun.Pisces, m: "Soft to the edges and tuned to whatever the room was feeling. Yours before they were their own, waiting at the door and meaning every minute of it." },
      l3: { d: "On your heavy days, give them a quiet room and your company in it. This one carries whatever the house is feeling, so lighten the house first.", m: "It is why they appeared at your worst moments without being called. The timing was never coincidence. It was their soul, tuned to yours, doing the quiet work." },
    },
  },
  moon: {
    Aries: {
      l2: { d: S.moon.Aries, m: "They settled by burning it off, never by being asked to sit still. Once the energy was out, the calm arrived on its own, every time." },
      l3: { d: "On a hard day, movement comes first and softness second. Ten wild minutes buy you a whole calm evening.", m: "It is why the mad dashes always came before the deep sleeps. They were not being difficult. That was how they emptied the day out." },
    },
    Taurus: {
      l2: { d: S.moon.Taurus, m: "Safe meant warm, fed, and in the exact spot they always slept. Nothing in the house belonged to them more than that one place." },
      l3: { d: "On a hard day, put the ordinary back first. The usual meal in the usual spot settles them faster than any amount of fuss.", m: "It is why they kept returning to that one spot, year after year. Comfort was never boring to them. It was the whole point." },
    },
    Gemini: {
      l2: { d: S.moon.Gemini, m: "Calm came from something to watch and someone to answer. A quiet, empty room unsettled them, so they invented a game to fill it." },
      l3: { d: "So tire the mind, not the legs. A treat they must work for drains them faster than an hour of running ever will.", m: "It is why they made a game out of nothing at all. A busy mind was never restlessness. It was how they kept themselves company." },
    },
    Cancer: {
      l2: { d: S.moon.Cancer, m: "They felt safe only with you close and the day in its usual order. The sound of you coming home put the whole day right, every time." },
      l3: { d: "On a hard day, come back to them first, before the coat is even off. Two minutes of hello undoes an entire afternoon of waiting.", m: "It is why the greeting at the door mattered so much to them. You were the routine. Everything else was just the frame around you." },
    },
    Leo: {
      l2: { d: S.moon.Leo, m: "They felt safest the moment they were seen. A word of praise reset their whole day, and they placed themselves where yours could always find them." },
      l3: { d: "On a hard day, give the attention before they ask for it. Say their name like it is good news and watch the whole body loosen.", m: "It is why they always placed themselves where you could not miss them. Being seen was not vanity. It was how they knew they were safe." },
    },
    Virgo: {
      l2: { d: S.moon.Virgo, m: "They calmed when everything sat in its right place. The same bowl in the same corner, the routine kept, and that anxious edge finally went quiet." },
      l3: { d: "On a hard day, tidy the room before you tend to them. Put things back where they live and the worry runs out of jobs to do.", m: "It is why they noticed the smallest change before anyone else did. Keeping watch over the little things was their way of holding the house steady." },
    },
    Libra: {
      l2: { d: S.moon.Libra, m: "They steadied in company and frayed alone. Their calm was borrowed straight from yours, so a peaceful evening made a peaceful them." },
      l3: { d: "On a hard day, settle yourself first. Sit down, slow your voice, and they will match you breath for breath.", m: "It is why they always drifted to whoever was calmest in the room. They were not choosing favourites. They were finding their balance." },
    },
    Scorpio: {
      l2: { d: "Watches from a safe distance before they trust the room. Once they decide you are the one who stays, that trust is total and does not come undone.", m: "They watched from a safe distance before they trusted a room. Once they decided you were the one who stays, that trust was total and never came undone." },
      l3: { d: "On a hard day, do not coax them out of hiding. Stay where they can see you and let them close the distance themselves.", m: "It is why they kept that one lookout spot their whole life. They were not being distant. They were deciding, again and again, that you were safe." },
    },
    Sagittarius: {
      l2: { d: S.moon.Sagittarius, m: "They needed room and a horizon more than a soft place to lie. Open ground did more for them than any blanket ever could." },
      l3: { d: "On a hard day, open the space up before anything else. A change of scenery does what no amount of soothing can.", m: "It is why they always faced the widest view they could find. Being able to see far was their version of being held." },
    },
    Capricorn: {
      l2: { d: S.moon.Capricorn, m: "They steadied on a schedule they could count on. Surprises were no gift to this one, and a day that ran to plan was a day they could finally relax into." },
      l3: { d: "On a hard day, hold the timetable steady. Feed on time, quiet at the usual hour, and let the day itself do the reassuring.", m: "It is why the whole house ended up running on their clock. Order was how they took care of everyone, including themselves." },
    },
    Aquarius: {
      l2: { d: S.moon.Aquarius, m: "They were comforted by room to breathe, not by being held close. They came to you when they were ready, and it always meant more that way." },
      l3: { d: "On a hard day, give space first and comfort second. The cuddle lands, but only after the room opens up.", m: "It is why they settled one step away instead of pressed against you. Nearby was their whole heart. They just carried it at their own distance." },
    },
    Pisces: {
      l2: { d: S.moon.Pisces, m: "They were soothed by quiet and the plain fact of you nearby. They soaked up the whole mood of the house, and a loud day sent them somewhere small and safe to wait it out." },
      l3: { d: "On a hard day, quiet the house before you offer anything else. Your calm, in the same room, is the comfort itself.", m: "It is why they always knew when something was wrong before you said a word. They were not reading your face. They were feeling the room." },
    },
  },
  venus: {
    Aries: {
      l2: { d: "Loves head-on. Crashes into you first, then waits right there for the same back.", m: "Loved head-on. Crashed into you first, then waited right there for the same back." },
      l3: { d: "So greet them the way they greet you. Big, first thing, before the coat is even off. Held-back hellos read as no to this one.", m: "It is why every hello was a collision. Holding back was never in them. Each greeting was the whole heart, handed over all at once." },
    },
    Taurus: {
      l2: { d: S.venus.Taurus, m: "Showed love by leaning their whole weight on you and refusing to move." },
      l3: { d: "So lean back. Stay put an extra minute when they settle against you. To them, not moving is the whole conversation.", m: "It is why you remember the weight of them more than anything. Leaning in was how they said it. Staying put was the point." },
    },
    Gemini: {
      l2: { d: S.venus.Gemini, m: "Brought you things and talked the whole time. Attention was the love language." },
      l3: { d: "So answer the noise. Chat back, take the thing they bring, ask what it is. Being ignored is the only thing that stings.", m: "It is why they never once came to you quietly. Every offering, every odd little sound, was a question aimed at you. Your answer was the prize." },
    },
    Cancer: {
      l2: { d: S.venus.Cancer, m: "Loved by guarding. Followed you room to room and fretted when you left." },
      l3: { d: "So let them keep you in sight. Leave the door open while you get ready. Nearness is the reassurance, not the fuss.", m: "It is why they were always one room behind you, always in the doorway. Keeping you in sight was the love, and they never wanted a day off from it." },
    },
    Leo: {
      l2: { d: S.venus.Leo, m: "Loved out loud and expected it back with interest. Generous, and a little theatrical." },
      l3: { d: "So be their audience. Say their name warmly and make the fuss where others can see. Praise in front of company counts double.", m: "It is why every hello felt like a performance. The show was real. You were the audience they did it all for." },
    },
    Virgo: {
      l2: { d: S.venus.Virgo, m: "Showed love by staying close while you worked. Missing nothing, asking for nothing." },
      l3: { d: "So notice them back. A quiet word, a hand resting on them mid-task. Small and often beats grand and rare with this one.", m: "It is why they were always within reach and never in the way. Quiet company was the gift. They loved you in the small hours of ordinary days." },
    },
    Libra: {
      l2: { d: "Loves to be near and in tune. Gives the softness first, hoping you match it.", m: "Loved to be near and in tune. Gave the softness first, hoping you would match it." },
      l3: { d: "So meet them softly. Lower your voice, slow your hands. They love in matched moods, so give them a good one to match.", m: "It is why they seemed to feel what you felt a beat before you said it. Meeting you halfway was the love. The house sat gentler with them keeping the balance." },
    },
    Scorpio: {
      l2: { d: S.venus.Scorpio, m: "Picked one person and kept picking them. That was you, and it was for life." },
      l3: { d: "So keep your promises to them, even tiny ones. Come back when you said you would. Loyalty answered with loyalty is the only language they trust.", m: "It is why they were different with you than with anyone else. Not aloof. Chosen. They decided on you early and never once changed the answer." },
    },
    Sagittarius: {
      l2: { d: S.venus.Sagittarius, m: "Loved by including you in the fun. Every open door came with an invitation: come on, keep up." },
      l3: { d: "So say yes more than you say no. Join the game, even for five minutes. Being in it with them is worth more than any cuddle.", m: "It is why the best memories are the ones where you went along. The adventure was never the point. Having you in it was." },
    },
    Capricorn: {
      l2: { d: S.venus.Capricorn, m: "Undemonstrative and completely dependable. The love was in the showing up." },
      l3: { d: "So be dependable back. Same time, same ritual, kept without fail. A kept routine tells them more than a hundred cuddles.", m: "It is why the love never looked dramatic and never once wavered. They were there every single day, in the same quiet way. That was the whole vow." },
    },
    Aquarius: {
      l2: { d: S.venus.Aquarius, m: "Loved on a slant. Sat one cushion away, which from them was devotion." },
      l3: { d: "So let the cushion count. Do not pull them closer. Sit where they can see you and let them arrive on their own clock.", m: "It is why they were near you far more often than they were on you. Choosing the same room was the declaration. In their language, that small distance was closeness." },
    },
    Pisces: {
      l2: { d: S.venus.Pisces, m: "Loved by melting into you. There was no edge between their mood and yours." },
      l3: { d: "So bring them your softest hour. Sit down, slow your breathing, and let them settle into it. Your calm is the affection they read best.", m: "It is why they appeared on your hardest days without being called. Your feelings were their feelings. Loving you and knowing you were never two different things." },
    },
  },
  mercury: {
    Aries: {
      l2: { d: "They want it now and they tell you fast. One sharp sound, a stare, a nudge, and you are already moving for them.", m: "They wanted it now and they told you fast. One sharp sound, one stare, and you were already up before you knew why." },
      l3: { d: "Answer the first ask, even if the answer is no. Being heard fast matters more to this one than getting the yes.", m: "It is why they never learned to wait. They trusted you to answer, so they never had to. That was faith, not impatience." },
    },
    Taurus: {
      l2: { d: S.mercury.Taurus, m: "This one thought slow and meant it. Ask twice and you got the same calm answer, usually a look toward the food bowl." },
      l3: { d: "Say it once, then count to ten. The answer is already on its way, just on their clock. Asking again only resets it.", m: "It is why they never startled at your bad days. They decided about you slowly, once, and it held. Steady was their whole vocabulary." },
    },
    Gemini: {
      l2: { d: S.mercury.Gemini, m: "A chatterbox brain, always two thoughts ahead. They read your tone before your words and answered with their whole body." },
      l3: { d: "So talk to them in tone, not vocabulary. Warm the sound of your voice and watch the whole body answer before the sentence ends.", m: "It is why they knew you were leaving before you picked up the keys. They read the shift in you, not the routine. Nothing in you ever got past them." },
    },
    Cancer: {
      l2: { d: "They speak in moods. A small sound, a lean into you, and you know exactly how their day went.", m: "They spoke in moods. A small sound, a lean into you, and you knew exactly how their day went." },
      l3: { d: "Keep the hellos and goodbyes, even the rushed ones. To this one, the greeting is the whole conversation, and skipping one says more than you meant to.", m: "It is why your arrivals mattered so much to them. The greeting was the whole conversation, and they never once missed it. They kept count in love, not grudges." },
    },
    Leo: {
      l2: { d: S.mercury.Leo, m: "Everything they wanted came with flair. The dramatic sigh, the head turned just so, an audience expected and usually granted." },
      l3: { d: "Say what they are doing out loud, like it is news. An audience is the reward this one works for, and it costs you nothing.", m: "It is why the sighs got louder when you looked away. Being watched was their word for being loved, and you gave them a lifetime in the front row." },
    },
    Virgo: {
      l2: { d: S.mercury.Virgo, m: "A noticer. This one clocked the new bag, the rearranged shoes, the half-second you paused, and let you know they saw." },
      l3: { d: "When something in the house changes, show it to them on purpose. Once it has been inspected, the new thing stops being a problem.", m: "It is why nothing in that house changed without their inspection. Keeping track of your world was how they kept you. Every small check was a kind of care." },
    },
    Libra: {
      l2: { d: S.mercury.Libra, m: "They negotiated. A look at you, a look at the door, a polite pause until you both agreed on the plan." },
      l3: { d: "Give them the small yes out loud. They are not asking permission, they are asking for agreement, and agreement is the treat.", m: "It is why they always waited for your nod before the good part. They never wanted the thing as much as they wanted the two of you deciding it together." },
    },
    Scorpio: {
      l2: { d: S.mercury.Scorpio, m: "Quiet and watchful, this one said little and meant all of it. When they finally asked, you did not say no." },
      l3: { d: "Treat their rare ask as urgent. This one edits out every small want, so the one that reaches you has already passed a hundred tests.", m: "It is why the quiet never meant distance. They were saving their words for the things that counted, and every one of them was aimed at you." },
    },
    Sagittarius: {
      l2: { d: "Big loud opinions about everything outside. They announce the neighbor, the delivery, the change in the weather before you have looked up.", m: "Big loud opinions about everything outside. They announced the neighbor, the delivery, the whole world going by, in case you missed it." },
      l3: { d: "Go see what they are announcing. Two seconds of looking together turns the noise into a conversation, and the conversation is what they wanted.", m: "It is why they told you about everything, even the things you could plainly see. The news was never the point. Sharing the world with you was." },
    },
    Capricorn: {
      l2: { d: S.mercury.Capricorn, m: "A serious communicator. One firm look that meant business, and they held your eye until the message landed." },
      l3: { d: "When you get the long stare, stop and take inventory. Water, food, door, routine. This one only files a complaint once, and it is always about something real.", m: "It is why one look from them could stop you mid-sentence. They never asked twice, because they trusted you to hear it the first time. And you did." },
    },
    Aquarius: {
      l2: { d: "This one invents their own signals. An odd tap, a sound all their own, a routine only the two of you understand.", m: "This one invented their own signals. An odd tap, a sound all their own, a routine only the two of you understood." },
      l3: { d: "Answer the weird signal the same way every time. You are not training them, you are keeping up your half of a language they built for you.", m: "It is why nobody else could quite read them. The language was built for an audience of one, and it was you. It was never meant to translate." },
    },
    Pisces: {
      l2: { d: "They read the room before you do. A change in your voice and they are already beside you, asking nothing, offering everything.", m: "They read the room before you did. A change in your voice and they were already beside you, asking nothing, offering everything." },
      l3: { d: "You do not have to hide a hard day from this one. They already know, so let them sit close while you have it. Pretending is the only thing that confuses them.", m: "It is why they always appeared before the tears did. They felt the weather change in you first, and being near was the only answer they thought you needed. They were right." },
    },
  },
  mars: {
    Aries: {
      l2: { d: "First out the door, last to quit. This one plays rough, forgives fast, and treats anything that moves as a personal challenge.", m: "First out the door, last to quit. They played rough, forgave fast, and treated anything that moved as a personal challenge." },
      l3: { d: "So give the burst somewhere to land the moment it arrives. Ten flat-out minutes early buys you a calm afternoon.", m: "It is why they went from still to full speed with no warning. The energy arrived all at once and left the same way. None of it was ever held against you." },
    },
    Taurus: {
      l2: { d: S.mars.Taurus, m: "Slow to rile, impossible to budge once they were. They wanted what they wanted and leaned their whole weight into getting it." },
      l3: { d: "So never rush the energy out of them. One long, unhurried game at their pace does more than ten quick ones at yours.", m: "It is why pushing never worked and waiting always did. They moved when it made sense to them. That was the only clock they ever kept." },
    },
    Gemini: {
      l2: { d: "Energy comes in quick bursts and switches targets halfway there. This one would rather outsmart you than out-muscle you.", m: "Energy came in quick bursts and switched targets halfway there. They always chose outsmarting you over out-muscling you." },
      l3: { d: "So change the game before they get bored of it. Three short puzzles drain this one deeper than one long chase ever will.", m: "It is why no game lasted long, and no boredom did either. They were never being difficult. The target moved because their mind got there first." },
    },
    Cancer: {
      l2: { d: S.mars.Cancer, m: "Defended their people before themselves. Gentle until something they loved was threatened, then suddenly very brave." },
      l3: { d: "So let them keep watch without giving them a job. A spot beside you where they can see the door drains more out of them than any game.", m: "It is why they put themselves between you and anything strange. The bravery only ever showed up when you needed it. That was the whole design." },
    },
    Leo: {
      l2: { d: "Plays to an audience and fights for the spotlight. Bold, a little dramatic, and no win counts until you have seen it.", m: "Played to an audience and fought for the spotlight. Bold, a little dramatic, and no win counted until you had seen it." },
      l3: { d: "So watch them play, out loud. The same game with your eyes on it counts double, and praise empties the tank faster than effort does.", m: "It is why they saved their best moves for when you were looking. The showing off was never vanity. It was for you." },
    },
    Virgo: {
      l2: { d: S.mars.Virgo, m: "Went after what they wanted with quiet precision, not noise. They studied the problem, then solved it on the third try." },
      l3: { d: "So give them a problem, not a party. One tricky thing to work out, and let them fail twice before they crack it. That is the whole workout.", m: "It is why they studied a thing before they touched it. The pause was never hesitation. It was the plan being finished." },
    },
    Libra: {
      l2: { d: S.mars.Libra, m: "Hated a real fight, loved a fair game. They charmed their way to the treat long before they ever wrestled for it." },
      l3: { d: "So play with them, never at them. Take turns, keep it even, and stop while it is still friendly. A one-sided game stops being fun for this one at once.", m: "It is why they never fought for anything they could charm their way to. Peace was never weakness in them. It was the strategy, and it worked on you daily." },
    },
    Scorpio: {
      l2: { d: S.mars.Scorpio, m: "All or nothing, and they remembered. This one locked onto a goal with a focus that was a little intense." },
      l3: { d: "So give them one goal and do not interrupt it. Half-finished games leave the engine running. Let this one see it through to the end.", m: "It is why once they wanted a thing, the wanting did not stop. The focus you laughed about was the truest part of them. Nothing they aimed at was casual, including you." },
    },
    Sagittarius: {
      l2: { d: S.mars.Sagittarius, m: "Ran first, thought later, and the whole world was the playing field. Restless, fearless, happiest in full sprint." },
      l3: { d: "So make space the reward. Open ground, somewhere new, anywhere the edges sit further away. Distance drains this one, not repetition.", m: "It is why the far corner always beat the near one. They were built for open ground, and any open door was an offer they had to take." },
    },
    Capricorn: {
      l2: { d: S.mars.Capricorn, m: "Patient and relentless. They paced themselves, never wasted a move, and quietly won the long game." },
      l3: { d: "So do not expect the energy to come out in bursts. Give them one steady job to see through, start to finish. Effort with a point is the only effort they respect.", m: "It is why they never rushed and never gave up. What they wanted, they waited for. And what they waited for, they got." },
    },
    Aquarius: {
      l2: { d: S.mars.Aquarius, m: "Picked their own fights for their own reasons. Stubborn in odd moments, unbothered in the ones you expected to spook them." },
      l3: { d: "So offer the game, then step back. This one spends energy on their own schedule, and the fastest way to stall it is to insist.", m: "It is why they braved the strange things and dodged the easy ones. Their courage kept its own list. It never needed yours to make sense." },
    },
    Pisces: {
      l2: { d: "Goes soft and sideways rather than head-on. Their drive runs on feeling, so a sulk from this one hits harder than any fight would.", m: "Went soft and sideways rather than head-on. Their drive ran on feeling, so a sulk from them hit harder than any fight ever would." },
      l3: { d: "So check the mood before the game. On a soft day, gentle play close to you empties them out. Pushing for more just fills them back up.", m: "It is why they never met anything head-on. Their strength lived in the feeling of things, so the retreat was never fear. It was them answering the room." },
    },
  },
};

/* Element card. L1 is fixed and identical in both voices (the chart does not
   change); the verb goes singular when the count is one. */
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
  return `${COUNT_WORD[n]} of their five planets ${n === 1 ? "stands" : "stand"} in ${element}. ${ELEMENT_TAIL[element]}`;
}

export const ELEMENT_READS: Record<DeckElement, DeckSignEntry> = {
  Fire: {
    l2: { d: "Quick to light, quick to burn through it. Big bursts, then the deepest sleep in the house.", m: "Quick to light, quick to burn through it. Big bursts, then the deepest sleep in the house. That never changed." },
    l3: { d: "Give the fire somewhere to go before you need them calm. The burst is coming either way, so choose when it happens.", m: "Their days ran on bursts and deep rests, and both were exactly right. The sudden racing about, the heavy sleep after. That was the fire keeping its own time." },
  },
  Earth: {
    l2: { d: "Steady as furniture. They pick a place and the place becomes theirs.", m: "Steady as furniture. They picked a place and the place became theirs." },
    l3: { d: "Keep dinner at the same hour before anything else. The clockwork is the comfort. The fuss is extra.", m: "It is why the same spot mattered so much. The same hour, the same corner, the same small rituals. Their days were built to hold, and they held." },
  },
  Air: {
    l2: { d: "A busy head in a quiet body. Nothing that moves in the room gets past them.", m: "A busy head in a quiet body. Nothing that moved in the room ever got past them." },
    l3: { d: "Change one small thing each day. A moved toy, a new box, a different game. A fed mind is a quiet one.", m: "It is why they noticed everything. The long watching, the small experiments, the games they invented for themselves. Their days were spent thinking, and it showed." },
  },
  Water: {
    l2: { d: "Soft to the edges. No wall between the weather of the house and theirs.", m: "Soft to the edges. There was no wall between the weather of the house and theirs." },
    l3: { d: "Steady yourself before you comfort them. Your calm reaches them first, and it is the only comfort that fully works.", m: "It is why they always found you on the hard days. They felt the house before anyone said a word. Staying close was never an accident." },
  },
};

/* Synthesis: composed from the two clause pools for the ACTUAL chart. The
   Sun/Moon clauses stay present tense in both voices (the chart still wants
   and needs); only the close shifts. "not a habit. It is the chart." lives
   here and nowhere else. */
export const SYNTH_LEAD = "Now watch two of these work together.";

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
  d: "The spot they always pick is not a habit. It is the chart.",
  m: "The spot they always chose was never a habit. It was the chart.",
};

/* "A" becomes "An" before Aries and Aquarius. */
export function signArticle(sign: string): string {
  return sign === "Aries" || sign === "Aquarius" ? "An" : "A";
}

/* Tease + handoff card, both voices. */
export type TeaseCopy = {
  keep: string;
  deeper: string;
  ledger: { body: string; line: string }[];
  rising: string;
  bridge: string;
  cta: string;
};

export const TEASE: { d: TeaseCopy; m: TeaseCopy } = {
  d: {
    keep: "Five of thirteen, yours to keep. A chart does not change. These five hold for life.",
    deeper: "The eight still dark run deeper. What they fear. What they carry from before you. The job they came to do.",
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
    bridge: "The full reading opens all thirteen and reads them as one. The reason they pick the exact spot on you they always pick is in there.",
    cta: "Meet the rest of who they are",
  },
  m: {
    keep: "Five of thirteen, yours to keep. A chart does not change. These five held for the whole of their life.",
    deeper: "The eight still dark run deeper. What they feared. What they carried from before you. The job they came to do.",
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
    bridge: "The full reading opens all thirteen and reads them as one. The reason they picked the exact spot on you they always picked is in there.",
    cta: "Meet the rest of who they are",
  },
};

/* Connective microcopy (both voices). */
export const counterLabel = (n: number) => `${n} of 13 read`;
export const NUDGE_WORD = "turn";
