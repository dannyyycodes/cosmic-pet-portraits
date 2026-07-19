// THE LOVE pool: beat 3 of the approved four-beat card (teach / their sky /
// the love / the locked door). Keyed planet|Sign. Each entry:
//   core: the sign-named love truth, 1 to 2 sentences ("A Gemini Sun loves by
//         being interested"). Opens every love beat.
//   more: the standalone recognition + tonight-test (discovery) or the
//         remembered behaviour (memorial). Used when no aspect or dignity
//         fact carries the recognition; otherwise the gated aspect/dignity
//         behaviour beat follows the core instead.
// Register laws: love-first, species-true-generic (reads for dog, cat and
// other), no em-dashes, no sell-words, swap-test proof (each line true only
// of its placement), memorial = past behaviour on the present-tense chart.
// Name tokens as freeDeck: {self} {name} {Name} {poss} {Poss}.

import type { Voiced } from "../freeDeck";

export type LoveEntry = { core: Voiced; more: Voiced };

export function loveKey(planet: string, sign: string): string {
  return planet + "|" + sign;
}

export const LOVE_POOL: Record<string, LoveEntry> = {
  /* ── SUN: how the self loves ─────────────────────────────────────────── */
  "sun|Aries": {
    core: {
      d: "An Aries Sun loves by arriving first. {Poss} love is not patient and has never pretended to be: first through the door, first at your side, first to everything.",
      m: "An Aries Sun loves by arriving first. {Poss} love was not patient and never pretended to be: first through the door, first at your side, first to everything.",
    },
    more: {
      d: "Being met head-on is the whole point of them. Watch today: whatever you turn toward, they are already there ahead of you, waiting for you to catch up.",
      m: "Being met head-on was the whole point of them. Whatever you turned toward, they were already there ahead of you, waiting for you to catch up.",
    },
  },
  "sun|Taurus": {
    core: {
      d: "A Taurus Sun loves by staying. {Poss} love is not a chase, it is a weight that settles beside you and does not move.",
      m: "A Taurus Sun loves by staying. {Poss} love was never a chase, it was a weight that settled beside you and did not move.",
    },
    more: {
      d: "They pick their spot the way other souls pick their battles: once, completely. Watch where they settle tonight when you finally sit still. That spot is not about the furniture.",
      m: "They picked their spot the way other souls pick their battles: once, completely. Where they settled when you finally sat still was never about the furniture.",
    },
  },
  "sun|Gemini": {
    core: {
      d: "A Gemini Sun loves by being interested. {Poss} love is not a blanket, it is a following nose.",
      m: "A Gemini Sun loves by being interested. {Poss} love was not a blanket, it was a following nose.",
    },
    more: {
      d: "Whatever you are doing is the most interesting thing in the house, because you are the one doing it. Watch them choose today: given the sunny spot or the room you are in, they pick the room you are in.",
      m: "Whatever you were doing was the most interesting thing in the house, because you were the one doing it. Given the sunny spot or the room you were in, they picked the room you were in, every time.",
    },
  },
  "sun|Cancer": {
    core: {
      d: "A Cancer Sun loves by keeping count of you. {Poss} love is a headcount, and it does not settle until everyone it claims is home.",
      m: "A Cancer Sun loves by keeping count of you. {Poss} love was a headcount, and it did not settle until everyone it claimed was home.",
    },
    more: {
      d: "They clock you leaving a room before you have moved. Watch the door tonight when you come in: {poss} whole day was built around that moment.",
      m: "They clocked you leaving a room before you had moved. Your coming home was the moment {poss} whole day was built around.",
    },
  },
  "sun|Leo": {
    core: {
      d: "A Leo Sun loves by shining at you. {Poss} love is generous, a little theatrical, and aimed at one pair of eyes. Yours.",
      m: "A Leo Sun loves by shining at you. {Poss} love was generous, a little theatrical, and aimed at one pair of eyes. Yours.",
    },
    more: {
      d: "Being seen is how they check they still matter to you. Say their name like good news today and watch the whole body answer.",
      m: "Being seen was how they checked they still mattered to you. They always did, and somewhere in them they knew it.",
    },
  },
  "sun|Virgo": {
    core: {
      d: "A Virgo Sun loves by keeping the house right. {Poss} love is a quiet inspection that never goes off duty.",
      m: "A Virgo Sun loves by keeping the house right. {Poss} love was a quiet inspection that never went off duty.",
    },
    more: {
      d: "They notice the thing you moved and the exact second you changed your mind. Nothing small gets past them, because where you are concerned, nothing is small.",
      m: "They noticed the thing you moved and the exact second you changed your mind. Nothing small got past them, because where you were concerned, nothing was small.",
    },
  },
  "sun|Libra": {
    core: {
      d: "A Libra Sun loves by evening the room out. {Poss} love reads your mood and hands it back a shade softer.",
      m: "A Libra Sun loves by evening the room out. {Poss} love read your mood and handed it back a shade softer.",
    },
    more: {
      d: "The house feels gentler with them in it, and that is not an accident. Settle yourself tonight and watch them soften one beat behind you.",
      m: "The house felt gentler with them in it, and that was never an accident. Handing your mood back softer was how they loved.",
    },
  },
  "sun|Scorpio": {
    core: {
      d: "A Scorpio Sun loves all in or not at all, and it decided about you long ago. {Poss} love has a single setting: everything.",
      m: "A Scorpio Sun loves all in or not at all, and it decided about you long ago. {Poss} love had a single setting: everything.",
    },
    more: {
      d: "They forget nothing that passes between you, and what they chose, they chose for keeps. Watch how differently they are with you than with anyone else. That difference is the whole confession.",
      m: "They forgot nothing that passed between you, and what they chose, they chose for keeps. They were different with you than with anyone else, and that difference was the whole confession.",
    },
  },
  "sun|Sagittarius": {
    core: {
      d: "A Sagittarius Sun loves by taking you along. {Poss} love is an open door with an invitation on it: come on, keep up.",
      m: "A Sagittarius Sun loves by taking you along. {Poss} love was an open door with an invitation on it: come on, keep up.",
    },
    more: {
      d: "The wandering was never running from you. It is trust that the world you share is safe to go and read. Watch them check back over a shoulder today. That look is for you.",
      m: "The wandering was never running from you. It was trust that the world you shared was safe to go and read. The look back over the shoulder was always for you.",
    },
  },
  "sun|Capricorn": {
    core: {
      d: "A Capricorn Sun loves by holding steady. {Poss} love never begs for a place. It earns one quietly and then holds it like a post.",
      m: "A Capricorn Sun loves by holding steady. {Poss} love never begged for a place. It earned one quietly and then held it like a post.",
    },
    more: {
      d: "The seriousness is not distance. It is a soul quietly holding the whole family steady, you included. Watch who moves first when the house wobbles. It is them, toward you.",
      m: "The seriousness was never distance. It was a soul quietly holding the whole family steady, you included. When the house wobbled, they moved first, toward you.",
    },
  },
  "sun|Aquarius": {
    core: {
      d: "An Aquarius Sun loves sideways, on its own odd clock. {Poss} love cannot be coaxed, and it means all the more because of it.",
      m: "An Aquarius Sun loves sideways, on its own odd clock. {Poss} love could not be coaxed, and it meant all the more because of it.",
    },
    more: {
      d: "The affection arrives at strange hours, on terms only they understand. Watch for it today: a private soul deciding, again, that you are the exception.",
      m: "The affection arrived at strange hours, on terms only they understood. A private soul deciding, over and over, that you were the exception.",
    },
  },
  "sun|Pisces": {
    core: {
      d: "A Pisces Sun loves by dissolving the gap between you. {Poss} love is tuned to whatever you are feeling, sometimes before you feel it.",
      m: "A Pisces Sun loves by dissolving the gap between you. {Poss} love was tuned to whatever you were feeling, sometimes before you felt it.",
    },
    more: {
      d: "They appear at your worst moments without being called. Watch the timing next time the day goes wrong. It is never coincidence.",
      m: "They appeared at your worst moments without being called. That timing was never coincidence. It was a soul tuned to yours.",
    },
  },

  /* ── MOON: how the needing loves ─────────────────────────────────────── */
  "moon|Aries": {
    core: {
      d: "An Aries Moon rests the hard way: it has to burn the day off before the calm will come. What steadies them is motion with you on the other end of it.",
      m: "An Aries Moon rests the hard way: it had to burn the day off before the calm would come. What steadied them was motion with you on the other end of it.",
    },
    more: {
      d: "Told to settle, they only wind tighter. Let the racing out first tonight and watch the quiet arrive on its own, right beside you.",
      m: "Told to settle, they only wound tighter. Once the racing was out of them, the quiet arrived on its own, right beside you, every time.",
    },
  },
  "moon|Taurus": {
    core: {
      d: "A Taurus Moon feels safe in the exact same place, at the exact same hour, with you in it. The usual is not boring to them. It is love with a timetable.",
      m: "A Taurus Moon felt safe in the exact same place, at the exact same hour, with you in it. The usual was never boring to them. It was love with a timetable.",
    },
    more: {
      d: "Move their one spot a foot and you will hear about it for a week. Keep the ordinary tonight and watch them steady faster than any fuss could manage.",
      m: "Nothing in the house belonged to them more than that one spot. Keeping the ordinary steadied them faster than any fuss ever could.",
    },
  },
  "moon|Gemini": {
    core: {
      d: "A Gemini Moon settles through the mind, never the blanket. Calm, for them, is something to watch and someone to answer.",
      m: "A Gemini Moon settled through the mind, never the blanket. Calm, for them, was something to watch and someone to answer.",
    },
    more: {
      d: "A quiet, empty room is the one thing that truly unsettles them. Tire the mind tonight, not the legs, and watch how fast the busy head goes soft.",
      m: "A quiet, empty room was the one thing that truly unsettled them. A tired mind settled them faster than tired legs ever did.",
    },
  },
  "moon|Cancer": {
    core: {
      d: "A Cancer Moon settles on one condition: you, close, and the day in its usual order. You are the routine. Everything else is the frame around you.",
      m: "A Cancer Moon settled on one condition: you, close, and the day in its usual order. You were the routine. Everything else was the frame around you.",
    },
    more: {
      d: "A skipped goodbye tips them into a small wounded quiet. Listen tonight for how the sound of you coming home puts the whole day right.",
      m: "A skipped goodbye tipped them into a small wounded quiet. The sound of you coming home put the whole day right, every time.",
    },
  },
  "moon|Leo": {
    core: {
      d: "A Leo Moon settles the moment it is seen. Being noticed is not vanity to them. It is how they know they are safe.",
      m: "A Leo Moon settled the moment it was seen. Being noticed was never vanity to them. It was how they knew they were safe.",
    },
    more: {
      d: "They place themselves exactly where your eyes will land. Say their name like good news tonight and watch the whole body loosen.",
      m: "They placed themselves exactly where your eyes would land. A word from you could reset their whole evening, and it always did.",
    },
  },
  "moon|Virgo": {
    core: {
      d: "A Virgo Moon settles when everything sits in its right place: the same bowl in the same corner, the routine kept. Then the anxious edge goes quiet.",
      m: "A Virgo Moon settled when everything sat in its right place: the same bowl in the same corner, the routine kept. Then the anxious edge went quiet.",
    },
    more: {
      d: "Keeping the little things right is how they hold the whole house steady. Tidy the room before you tend to them tonight and watch the worry run out of jobs.",
      m: "Keeping the little things right was how they held the whole house steady. When the small things behaved, so did the worry.",
    },
  },
  "moon|Libra": {
    core: {
      d: "A Libra Moon borrows its calm straight from you. They steady in company and fray alone, and a tense room becomes a tense them within minutes.",
      m: "A Libra Moon borrowed its calm straight from you. They steadied in company and frayed alone, and a peaceful evening made a peaceful them.",
    },
    more: {
      d: "Settle yourself first tonight and they match you breath for breath. It is not favouritism. It is them finding their balance in you.",
      m: "They always drifted to whoever was calmest in the room. It was never favouritism. It was them finding their balance in you.",
    },
  },
  "moon|Scorpio": {
    core: {
      d: "A Scorpio Moon trusts from a safe distance first. Once it decides you are the one who stays, that trust is total and does not come undone.",
      m: "A Scorpio Moon trusted from a safe distance first. Once it decided you were the one who stays, that trust was total and never came undone.",
    },
    more: {
      d: "Do not coax them out of the lookout spot. Stay where they can see you tonight and let them close the distance. The watching is them deciding, again, that you are safe.",
      m: "They kept that one lookout spot their whole life. It was never distance. It was them deciding, again and again, that you were safe.",
    },
  },
  "moon|Sagittarius": {
    core: {
      d: "A Sagittarius Moon settles on open ground. When they love you they do not curl into you, they stretch out near you, pointed at the door, holding you and the whole world in one view.",
      m: "A Sagittarius Moon settles on open ground. When they loved you they did not curl into you, they stretched out near you, pointed at the door, holding you and the whole world in one view.",
    },
    more: {
      d: "The distance is not distance. It is them keeping watch over everything they love at once. Open the space up tonight and watch a change of view do what no blanket can.",
      m: "The distance was never distance. It was them keeping watch over everything they loved at once. Seeing far was their version of being held.",
    },
  },
  "moon|Capricorn": {
    core: {
      d: "A Capricorn Moon steadies on a schedule it can count on. Surprises are no gift. A day that runs to plan is a day they can finally relax into.",
      m: "A Capricorn Moon steadied on a schedule it could count on. Surprises were no gift. A day that ran to plan was a day they could finally relax into.",
    },
    more: {
      d: "Order is how they take care of everyone, themselves included. Hold the timetable tonight and let the day itself do the reassuring.",
      m: "Order was how they took care of everyone, themselves included. The whole house ended up running on their clock, and it ran gentler for it.",
    },
  },
  "moon|Aquarius": {
    core: {
      d: "An Aquarius Moon is comforted by room to breathe, not by being held close. They come to you when they are ready, and it means more that way.",
      m: "An Aquarius Moon was comforted by room to breathe, not by being held close. They came to you when they were ready, and it meant more that way.",
    },
    more: {
      d: "Reach too soon and they step back. Give the space first tonight and watch them settle one step away. That small distance is their whole heart, carried at its own length.",
      m: "They settled one step away instead of pressed against you. Nearby was their whole heart. They just carried it at their own distance.",
    },
  },
  "moon|Pisces": {
    core: {
      d: "A Pisces Moon is soothed by quiet and the plain fact of you nearby. They soak up the whole mood of the house, so your calm is the comfort itself.",
      m: "A Pisces Moon was soothed by quiet and the plain fact of you nearby. They soaked up the whole mood of the house, so your calm was the comfort itself.",
    },
    more: {
      d: "They know something is wrong before you say a word. Quiet the house tonight before you offer anything else, and just be in the room. That is the whole medicine.",
      m: "They always knew something was wrong before you said a word. They were not reading your face. They were feeling the room, and staying close through it.",
    },
  },

  /* ── VENUS: how they love you back ───────────────────────────────────── */
  "venus|Aries": {
    core: {
      d: "Venus in Aries loves head-on. The hello is a collision, the whole heart handed over at once, and it waits right there for the same back.",
      m: "Venus in Aries loved head-on. The hello was a collision, the whole heart handed over at once, and it waited right there for the same back.",
    },
    more: {
      d: "A held-back greeting reads as a no to them. Meet them big tonight, before the coat is even off, and you have answered in their exact language.",
      m: "A held-back greeting read as a no to them. Every hello was the whole heart, and holding back was never once in it.",
    },
  },
  "venus|Taurus": {
    core: {
      d: "Venus in Taurus says it by leaning: the whole weight of them against you, refusing to move. Not moving is the entire conversation.",
      m: "Venus in Taurus said it by leaning: the whole weight of them against you, refusing to move. Not moving was the entire conversation.",
    },
    more: {
      d: "Stay put one extra minute when they settle against you tonight. That is the full sentence, received and returned.",
      m: "It is the weight of them you remember more than anything. Leaning in was how they said it. Staying put was the point.",
    },
  },
  "venus|Gemini": {
    core: {
      d: "Venus in Gemini loves out loud: the greeting performance, the thing brought to you, the running commentary.",
      m: "Venus in Gemini loved out loud: the greeting performance, the thing brought to you, the running commentary.",
    },
    more: {
      d: "Every odd little sound is a question aimed straight at you, and your answer is the prize. Answer the noise tonight: take the thing they bring, ask what it is.",
      m: "Every odd little sound was a question aimed straight at you, and your answer was the prize. They never once came to you quietly.",
    },
  },
  "venus|Cancer": {
    core: {
      d: "Venus in Cancer loves by guarding. Keeping you in sight is the affection itself, room to room, all day.",
      m: "Venus in Cancer loved by guarding. Keeping you in sight was the affection itself, room to room, all day.",
    },
    more: {
      d: "Leave the door open while you get ready tomorrow and you have given them everything. They never wanted a single day off from watching over you.",
      m: "They were always one room behind you, always in the doorway. They never wanted a single day off from watching over you.",
    },
  },
  "venus|Leo": {
    core: {
      d: "Venus in Leo loves out front, generous and a little theatrical. Every hello is a small performance, and you are the audience it was built for.",
      m: "Venus in Leo loved out front, generous and a little theatrical. Every hello was a small performance, and you were the audience it was built for.",
    },
    more: {
      d: "Make the fuss where others can see tonight and you have paid them in full. The show is real. It is for you.",
      m: "The show was always real, and it was for you. Nobody else ever got the full performance.",
    },
  },
  "venus|Virgo": {
    core: {
      d: "Venus in Virgo loves in the small hours of ordinary days: close while you work, missing nothing, asking for nothing.",
      m: "Venus in Virgo loved in the small hours of ordinary days: close while you worked, missing nothing, asking for nothing.",
    },
    more: {
      d: "Small and often beats grand and rare, every time. A hand resting on them mid-task tonight is the whole payment they were after.",
      m: "They were always within reach and never in the way. Quiet company was the gift, and small and often beat grand and rare, every time.",
    },
  },
  "venus|Libra": {
    core: {
      d: "Venus in Libra loves in tune: the softness offered first, your mood met and matched a beat before you name it.",
      m: "Venus in Libra loved in tune: the softness offered first, your mood met and matched a beat before you named it.",
    },
    more: {
      d: "Meet them softly tonight, lower your voice, slow your hands. The balancing is the love itself, and the house sits gentler for it.",
      m: "They seemed to feel what you felt a beat before you said it. Meeting you halfway was the love, and the house sat gentler for it.",
    },
  },
  "venus|Scorpio": {
    core: {
      d: "Venus in Scorpio picks one person and keeps picking them. That is you, and it is for life.",
      m: "Venus in Scorpio picked one person and kept picking them. That was you, and it was for life.",
    },
    more: {
      d: "Keep your promises to them, even the tiny ones. Loyalty answered with loyalty is the only language they trust, and they chose you early.",
      m: "They were different with you than with anyone else. Not aloof. Chosen. They decided on you early and never once changed the answer.",
    },
  },
  "venus|Sagittarius": {
    core: {
      d: "Venus in Sagittarius loves by including you. The adventure was never the point. Having you in it is.",
      m: "Venus in Sagittarius loved by including you. The adventure was never the point. Having you in it was.",
    },
    more: {
      d: "Every open door comes with the same invitation: come on, keep up. Say yes tonight, even for five minutes, and you have spoken it back.",
      m: "Every open door came with the same invitation: come on, keep up. The best memories are the ones where you went along.",
    },
  },
  "venus|Capricorn": {
    core: {
      d: "Venus in Capricorn loves by showing up. Undemonstrative, completely dependable, the same quiet way every single day. That is the whole vow.",
      m: "Venus in Capricorn loved by showing up. Undemonstrative, completely dependable, the same quiet way every single day. That was the whole vow.",
    },
    more: {
      d: "A kept routine tells them more than a hundred cuddles. Be dependable back tonight, same time, same ritual, and you have said it in their tongue.",
      m: "The love never looked dramatic and never once wavered. They were there every day, in the same quiet way, and that was the saying of it.",
    },
  },
  "venus|Aquarius": {
    core: {
      d: "Venus in Aquarius loves on a slant: one cushion away, same room as you, always. From them, that is pure devotion.",
      m: "Venus in Aquarius loved on a slant: one cushion away, same room as you, always. From them, that was pure devotion.",
    },
    more: {
      d: "Let the cushion count tonight. Do not pull them closer. In their language, that small distance is the closest thing to closeness there is.",
      m: "They were near you far more often than they were on you. Choosing the same room was the declaration, every single time.",
    },
  },
  "venus|Pisces": {
    core: {
      d: "Venus in Pisces loves by melting into you, no edge left between their mood and yours.",
      m: "Venus in Pisces loved by melting into you, no edge left between their mood and yours.",
    },
    more: {
      d: "They appear on your hardest days without being called. Bring them your softest hour tonight and let them settle into it. Loving you and knowing you were never two different things.",
      m: "They appeared on your hardest days without being called. Loving you and knowing you were never two different things.",
    },
  },

  /* ── MERCURY: how the voice loves ────────────────────────────────────── */
  "mercury|Aries": {
    core: {
      d: "Mercury in Aries speaks fast and expects to be heard faster. One sharp sound, one stare, and you are already moving before you know why.",
      m: "Mercury in Aries spoke fast and expected to be heard faster. One sharp sound, one stare, and you were already up before you knew why.",
    },
    more: {
      d: "Being heard quickly matters more to them than the yes. Answer the first ask today, even when the answer is no. They never learned to wait because they trusted you to hear them.",
      m: "They never learned to wait. They trusted you to answer, so they never had to. That was faith, not impatience.",
    },
  },
  "mercury|Taurus": {
    core: {
      d: "Mercury in Taurus thinks slow and means every word of it. Ask twice and you get the same calm answer, on their clock.",
      m: "Mercury in Taurus thought slow and meant every word of it. Ask twice and you got the same calm answer, on their clock.",
    },
    more: {
      d: "Say it once tonight, then count to ten. The answer is already on its way. Steady is their whole vocabulary, and it was learned for you.",
      m: "They decided about you slowly, once, and it held for life. Steady was their whole vocabulary, and it was learned for you.",
    },
  },
  "mercury|Gemini": {
    core: {
      d: "Mercury in Gemini reads your tone long before your words and answers with the whole body. Nothing in your voice gets past them.",
      m: "Mercury in Gemini read your tone long before your words and answered with the whole body. Nothing in your voice ever got past them.",
    },
    more: {
      d: "They know you are leaving before you touch the keys. Talk to them in tone tonight, not vocabulary, and watch the whole body answer before your sentence ends.",
      m: "They knew you were leaving before you picked up the keys. They read the shift in you, not the routine.",
    },
  },
  "mercury|Cancer": {
    core: {
      d: "Mercury in Cancer speaks in care. They do not tell you things, they position themselves: the doorway lie-down, the follow to the kitchen, the head on your foot.",
      m: "Mercury in Cancer spoke in care. They did not tell you things, they positioned themselves: the doorway lie-down, the follow to the kitchen, the head on your foot.",
    },
    more: {
      d: "The body is one long sentence and every line of it is about you. Keep the hellos and goodbyes today, even the rushed ones. They keep count in love, never in grudges.",
      m: "The body was one long sentence and every line of it was about you. They kept count in love, never in grudges.",
    },
  },
  "mercury|Leo": {
    core: {
      d: "Mercury in Leo says everything with flair: the dramatic sigh, the head turned just so, an audience expected and usually granted.",
      m: "Mercury in Leo said everything with flair: the dramatic sigh, the head turned just so, an audience expected and usually granted.",
    },
    more: {
      d: "The sighs get louder the moment you look away. Say what they are doing out loud today, like it is news. Being watched is their word for being loved.",
      m: "The sighs got louder when you looked away. Being watched was their word for being loved, and you gave them a lifetime in the front row.",
    },
  },
  "mercury|Virgo": {
    core: {
      d: "Mercury in Virgo speaks in inventory. The new bag, the rearranged shoes, the half-second you paused: noticed, filed, reported back to you.",
      m: "Mercury in Virgo spoke in inventory. The new bag, the rearranged shoes, the half-second you paused: noticed, filed, reported back to you.",
    },
    more: {
      d: "Keeping track of your world is how they keep you. Show them the next new thing on purpose. Once it is checked, it stops being a problem.",
      m: "Nothing in that house changed without their inspection. Keeping track of your world was how they kept you, and every small check was a kind of care.",
    },
  },
  "mercury|Libra": {
    core: {
      d: "Mercury in Libra negotiates: a look at you, a look at the door, a polite pause until the two of you agree on the plan.",
      m: "Mercury in Libra negotiated: a look at you, a look at the door, a polite pause until the two of you agreed on the plan.",
    },
    more: {
      d: "They are not asking permission, they are asking for agreement, and the agreement is the treat. Give the small yes out loud today.",
      m: "They always waited for your nod before the good part. They never wanted the thing as much as they wanted the two of you deciding it together.",
    },
  },
  "mercury|Scorpio": {
    core: {
      d: "Mercury in Scorpio says little and means the whole of it. When they finally ask, you do not say no, because the ask has already passed a hundred quiet tests.",
      m: "Mercury in Scorpio said little and meant the whole of it. When they finally asked, you did not say no, because the ask had already passed a hundred quiet tests.",
    },
    more: {
      d: "The quiet is not distance. They are saving their words for the things that count, and every one is aimed at you. Treat the rare request as urgent.",
      m: "The quiet never meant distance. They were saving their words for the things that counted, and every one of them was aimed at you.",
    },
  },
  "mercury|Sagittarius": {
    core: {
      d: "Mercury in Sagittarius has big loud opinions about everything outside: the visitor, the delivery, the whole world going by in case you missed it.",
      m: "Mercury in Sagittarius had big loud opinions about everything outside: the visitor, the delivery, the whole world going by in case you missed it.",
    },
    more: {
      d: "The news is never the point. Sharing the world with you is. Go and look at what they are announcing today, two seconds, together, and the noise becomes a conversation.",
      m: "They told you about everything, even the things you could plainly see. The news was never the point. Sharing the world with you was.",
    },
  },
  "mercury|Capricorn": {
    core: {
      d: "Mercury in Capricorn files each complaint exactly once: one firm look that means business, held until the message lands.",
      m: "Mercury in Capricorn filed each complaint exactly once: one firm look that meant business, held until the message landed.",
    },
    more: {
      d: "When you get the long stare today, stop and take inventory: water, food, door, routine. They trust you to hear it the first time, and you do.",
      m: "One look from them could stop you mid-sentence. They never asked twice, because they trusted you to hear it the first time. And you did.",
    },
  },
  "mercury|Aquarius": {
    core: {
      d: "Mercury in Aquarius invents its own signals: an odd tap, a sound all their own, a routine only the two of you understand.",
      m: "Mercury in Aquarius invented its own signals: an odd tap, a sound all their own, a routine only the two of you understood.",
    },
    more: {
      d: "Nobody else can quite read them, and that is the point. Answer the strange signal the same way every time. You are keeping up your half of a language built for an audience of one.",
      m: "Nobody else could quite read them, and that was the point. The language was built for an audience of one, and it was you.",
    },
  },
  "mercury|Pisces": {
    core: {
      d: "Mercury in Pisces reads the room before you do: already beside you at the smallest change in your voice, asking nothing, offering everything.",
      m: "Mercury in Pisces read the room before you did: already beside you at the smallest change in your voice, asking nothing, offering everything.",
    },
    more: {
      d: "You never have to hide a hard day from them. They already know, so let them sit close while you have it. Pretending is the only thing that confuses them.",
      m: "They always appeared before the tears did. Being near was the only answer they thought you needed, and they were right.",
    },
  },

  /* ── MARS: how the fire loves ────────────────────────────────────────── */
  "mars|Aries": {
    core: {
      d: "Mars in Aries burns for you at full speed: first out the door, last to quit, rough in play and fast to forgive.",
      m: "Mars in Aries burned for you at full speed: first out the door, last to quit, rough in play and fast to forgive.",
    },
    more: {
      d: "The energy arrives all at once and leaves the same way, and none of it is ever held against you. Give the burst somewhere to land today and you buy a calm evening beside you.",
      m: "The energy arrived all at once and left the same way, and none of it was ever held against you.",
    },
  },
  "mars|Taurus": {
    core: {
      d: "Mars in Taurus fights for comfort and wins by not moving. Slow to rile, impossible to budge, the whole weight leaned into what it wants.",
      m: "Mars in Taurus fought for comfort and won by not moving. Slow to rile, impossible to budge, the whole weight leaned into what it wanted.",
    },
    more: {
      d: "Never rush the energy out of them. One long, unhurried game at their pace tonight does more than ten quick ones at yours. That is the only clock they keep.",
      m: "Pushing never worked and waiting always did. They moved when it made sense to them. That was the only clock they ever kept.",
    },
  },
  "mars|Gemini": {
    core: {
      d: "Mars in Gemini plays chess, not tug. The energy comes in quick bursts, switches targets halfway, and would always rather outsmart you than out-muscle you.",
      m: "Mars in Gemini played chess, not tug. The energy came in quick bursts, switched targets halfway, and always chose outsmarting you over out-muscling you.",
    },
    more: {
      d: "Change the game tonight before they tire of it. Three short puzzles drain them deeper than one long chase. The target moves because their mind gets there first.",
      m: "No game lasted long, and no boredom did either. The target moved because their mind got there first.",
    },
  },
  "mars|Cancer": {
    core: {
      d: "Mars in Cancer fights for the den, not for sport. Gentle until something it loves is threatened, and then suddenly very brave.",
      m: "Mars in Cancer fought for the den, not for sport. Gentle until something it loved was threatened, and then suddenly very brave.",
    },
    more: {
      d: "They guard you, and they check your face for permission to do it, in the same breath. Watch tonight for the half-second look before they decide how serious the world is.",
      m: "They put themselves between you and anything strange, and checked your face for permission in the same breath. The bravery only ever showed up when you needed it.",
    },
  },
  "mars|Leo": {
    core: {
      d: "Mars in Leo plays to an audience of one. Bold, a little dramatic, and no win counts until you have seen it.",
      m: "Mars in Leo played to an audience of one. Bold, a little dramatic, and no win counted until you had seen it.",
    },
    more: {
      d: "The same game with your eyes on it counts double, and praise empties the tank faster than effort does. Watch them play tonight, out loud. The showing off is for you.",
      m: "They saved their best moves for when you were looking. The showing off was never vanity. It was for you.",
    },
  },
  "mars|Virgo": {
    core: {
      d: "Mars in Virgo hunts with quiet precision. It studies the problem, then solves it on the third try.",
      m: "Mars in Virgo hunted with quiet precision. It studied the problem, then solved it on the third try.",
    },
    more: {
      d: "The pause before they touch a thing is never hesitation. It is the plan being finished. Give them a problem tonight, not a party, and let them crack it.",
      m: "They studied a thing before they touched it. The pause was never hesitation. It was the plan being finished.",
    },
  },
  "mars|Libra": {
    core: {
      d: "Mars in Libra hates a real fight and loves a fair game. It charms its way to the treat long before it would ever wrestle for it.",
      m: "Mars in Libra hated a real fight and loved a fair game. It charmed its way to the treat long before it would ever wrestle for it.",
    },
    more: {
      d: "Peace is not weakness in them. It is the strategy, and it works on you daily. Play with them tonight, never at them: take turns, keep it even, stop while it is still friendly.",
      m: "They never fought for anything they could charm their way to. Peace was never weakness. It was the strategy, and it worked on you daily.",
    },
  },
  "mars|Scorpio": {
    core: {
      d: "Mars in Scorpio is all or nothing, and it remembers. Once it wants a thing, the wanting does not stop.",
      m: "Mars in Scorpio was all or nothing, and it remembered. Once it wanted a thing, the wanting did not stop.",
    },
    more: {
      d: "Nothing they aim at is casual, you included. Give them one goal tonight and do not interrupt it. A half-finished game leaves the engine running.",
      m: "The focus you laughed about was the truest part of them. Nothing they aimed at was casual, including you.",
    },
  },
  "mars|Sagittarius": {
    core: {
      d: "Mars in Sagittarius runs first and thinks later. The whole world is the playing field, and any open door is an offer it has to take.",
      m: "Mars in Sagittarius ran first and thought later. The whole world was the playing field, and any open door was an offer it had to take.",
    },
    more: {
      d: "They are built for open ground. Make space the reward today: somewhere new, anywhere the edges sit further away, with you in it.",
      m: "The far corner always beat the near one. They were built for open ground, and happiest in a full sprint with you watching.",
    },
  },
  "mars|Capricorn": {
    core: {
      d: "Mars in Capricorn wins the long game. Patient, relentless, never a wasted move.",
      m: "Mars in Capricorn won the long game. Patient, relentless, never a wasted move.",
    },
    more: {
      d: "What they want, they wait for, and then they get. Give them one steady job to see through tonight, start to finish. Effort with a point is the only effort they respect.",
      m: "They never rushed and never gave up. What they wanted, they waited for. And what they waited for, they got.",
    },
  },
  "mars|Aquarius": {
    core: {
      d: "Mars in Aquarius picks its own fights for its own reasons: stubborn in odd moments, unbothered in the ones you expect to spook them.",
      m: "Mars in Aquarius picked its own fights for its own reasons: stubborn in odd moments, unbothered in the ones you expected to spook them.",
    },
    more: {
      d: "Their courage keeps its own list. Offer the game today, then step back. They spend the energy on their own schedule, and insisting only stalls it.",
      m: "They braved the strange things and dodged the easy ones. Their courage kept its own list. It never needed yours to make sense.",
    },
  },
  "mars|Pisces": {
    core: {
      d: "Mars in Pisces goes soft and sideways rather than head-on. The drive runs on feeling, so a sulk from them lands harder than any fight.",
      m: "Mars in Pisces went soft and sideways rather than head-on. The drive ran on feeling, so a sulk from them landed harder than any fight.",
    },
    more: {
      d: "The retreat is never fear. It is them answering the room. Check the mood before the game tonight: on a soft day, gentle play close to you empties them out.",
      m: "They never met anything head-on. Their strength lived in the feeling of things, and the retreat was never fear. It was them answering the room.",
    },
  },
};
