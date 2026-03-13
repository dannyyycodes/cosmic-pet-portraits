import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { calculateAllPositions } from "./ephemeris.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Personality templates per zodiac sign ────────────────────────────────────

const SUN_PROFILES: Record<string, { title: string; traits: string; love: string; quirk: string }> = {
  Aries: {
    title: "The Fearless Trailblazer",
    traits: "Bold, impulsive, endlessly brave. First to investigate every noise, first through every door.",
    love: "Shows love through fierce loyalty and protective instincts. Will put themselves between you and anything that scares them.",
    quirk: "Has zero patience for waiting. If dinner is one minute late, the whole house knows about it.",
  },
  Taurus: {
    title: "The Gentle Sensualist",
    traits: "Steady, comfort-loving, deeply loyal. Finds their spot and claims it forever.",
    love: "Shows love through physical closeness. Needs to touch you, lean on you, sleep pressed against you.",
    quirk: "Extremely food-motivated. Will perform any trick, endure any indignity, for the right treat.",
  },
  Gemini: {
    title: "The Curious Chatterbox",
    traits: "Quick, alert, endlessly curious. Always watching, always processing, always one step ahead.",
    love: "Shows love through communication. Talks to you, responds to your voice, mirrors your energy.",
    quirk: "Gets bored easily. Needs constant mental stimulation or they'll create their own entertainment (usually at your expense).",
  },
  Cancer: {
    title: "The Tender Guardian",
    traits: "Nurturing, intuitive, emotionally wise. Feels everything you feel before you feel it.",
    love: "Shows love through deep emotional attunement. Knows when you're sad before you do and comes to comfort you.",
    quirk: "Homebody to the core. Leaving the house is a negotiation. Coming home is a full celebration.",
  },
  Leo: {
    title: "The Radiant Star",
    traits: "Confident, warm, magnificently dramatic. Born to be adored and they know it.",
    love: "Shows love by making you feel like the most important person alive. Their whole world revolves around you.",
    quirk: "Absolutely cannot stand being ignored. Will escalate until acknowledged. Every. Single. Time.",
  },
  Virgo: {
    title: "The Thoughtful Observer",
    traits: "Precise, attentive, quietly brilliant. Notices everything. Judges some of it.",
    love: "Shows love through acts of service. Brings you things, follows routines, keeps watch over the household.",
    quirk: "Has very specific preferences about everything. The wrong bowl, the wrong spot, the wrong texture? Refused.",
  },
  Libra: {
    title: "The Graceful Peacemaker",
    traits: "Harmonious, charming, socially gifted. Everyone they meet falls instantly in love.",
    love: "Shows love through togetherness. Wants to be wherever you are, doing whatever you're doing, always.",
    quirk: "Cannot make decisions. Two treats? Paralysed. Two toys? Frozen. Needs you to choose for them.",
  },
  Scorpio: {
    title: "The Intense Soul",
    traits: "Deeply feeling, mysteriously perceptive, fiercely private. Still waters run impossibly deep.",
    love: "Shows love with an intensity that borders on obsession. Once bonded, they're yours forever.",
    quirk: "Holds grudges. Remembers that one time you went to the vet three years ago. Has not forgiven you.",
  },
  Sagittarius: {
    title: "The Joyful Adventurer",
    traits: "Free-spirited, optimistic, endlessly enthusiastic. Every walk is an expedition. Every day is the best day.",
    love: "Shows love through shared adventures. Wants to experience everything with you by their side.",
    quirk: "Has absolutely no concept of personal space or boundaries. Where you go, they go. No exceptions.",
  },
  Capricorn: {
    title: "The Wise Old Soul",
    traits: "Dignified, disciplined, surprisingly playful beneath the serious exterior. An old soul in a young body.",
    love: "Shows love through steadfast presence. Quiet, dependable, always there. The rock you didn't know you needed.",
    quirk: "Takes training extremely seriously. Learns commands once and remembers them forever. Slightly smug about it.",
  },
  Aquarius: {
    title: "The Eccentric Visionary",
    traits: "Independent, quirky, delightfully weird. Marches to the beat of a drum only they can hear.",
    love: "Shows love on their own terms. It's unconventional but unmistakable. When they choose you, you know.",
    quirk: "Does things no other animal does. Has invented behaviours that don't exist in any breed guide.",
  },
  Pisces: {
    title: "The Dreamy Empath",
    traits: "Gentle, deeply intuitive, ethereally sensitive. Seems to exist half in this world, half in another.",
    love: "Shows love through emotional absorption. Feels what you feel. Cries when you cry. Heals what you can't.",
    quirk: "Stares at walls, empty corners, and spots where nothing is happening. Sees things you can't see.",
  },
};

const MOON_MOODS: Record<string, string> = {
  Aries: "Emotionally brave. Feels everything at full volume and recovers just as fast.",
  Taurus: "Emotionally grounded. A calm, warm presence that steadies everyone around them.",
  Gemini: "Emotionally mercurial. Moods shift like weather, but always interesting.",
  Cancer: "Emotionally deep. Absorbs the feelings of the whole household like a cosmic sponge.",
  Leo: "Emotionally expressive. When they're happy, the whole room lights up. When they're sad, it's devastation.",
  Virgo: "Emotionally careful. Processes feelings quietly, then responds with precision.",
  Libra: "Emotionally harmonious. Upset by conflict, restored by beauty and calm.",
  Scorpio: "Emotionally intense. Feels with a depth that's almost human. Never forgets how you made them feel.",
  Sagittarius: "Emotionally buoyant. Bounces back from everything. Joy is their default setting.",
  Capricorn: "Emotionally reserved. Keeps feelings close, but when they show you — it's everything.",
  Aquarius: "Emotionally independent. Doesn't need constant reassurance, but loves in a way that's entirely unique.",
  Pisces: "Emotionally transcendent. Connected to something beyond the visible world. A true healer.",
};

// ── Main handler ────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { petName, species, dateOfBirth, email } = await req.json();

    if (!petName || !dateOfBirth || !email) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate positions
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return new Response(JSON.stringify({ error: "Invalid date of birth" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const positions = calculateAllPositions(dob);
    const sunSign = positions.sun.sign;
    const moonSign = positions.moon.sign;
    const sunDegree = positions.sun.degree;
    const moonDegree = positions.moon.degree;

    const sunProfile = SUN_PROFILES[sunSign] || SUN_PROFILES.Aries;
    const moonMood = MOON_MOODS[moonSign] || MOON_MOODS.Aries;

    // Determine dominant element
    const elementMap: Record<string, string> = {
      Aries: "Fire", Taurus: "Earth", Gemini: "Air", Cancer: "Water",
      Leo: "Fire", Virgo: "Earth", Libra: "Air", Scorpio: "Water",
      Sagittarius: "Fire", Capricorn: "Earth", Aquarius: "Air", Pisces: "Water",
    };
    const sunElement = elementMap[sunSign] || "Fire";
    const moonElement = elementMap[moonSign] || "Water";

    // Save email to subscriber list
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Upsert to email_subscribers (don't fail if already exists)
    await supabase
      .from("email_subscribers")
      .upsert({
        email,
        pet_name: petName,
        species: species || "pet",
        source: "free_snapshot",
        journey_stage: "new_lead",
        is_subscribed: true,
        created_at: new Date().toISOString(),
      }, { onConflict: "email", ignoreDuplicates: true });

    console.log("[FREE-SNAPSHOT] Generated for:", petName, sunSign, moonSign, "email:", email);

    return new Response(JSON.stringify({
      petName,
      sunSign,
      sunDegree,
      moonSign,
      moonDegree,
      sunElement,
      moonElement,
      sunTitle: sunProfile.title,
      sunTraits: sunProfile.traits,
      sunLove: sunProfile.love,
      sunQuirk: sunProfile.quirk,
      moonMood,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[FREE-SNAPSHOT] Error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
