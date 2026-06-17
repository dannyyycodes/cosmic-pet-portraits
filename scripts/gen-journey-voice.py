#!/usr/bin/env python3
"""Generate the free reading journey narration with Kokoro (free, local, high quality).
Writes public/readings/voice/*.mp3. Re-run to change voice/quality.
  py scripts/gen-journey-voice.py [voice] [speed]
Kokoro voices: af_heart (most natural, default), af_bella, af_nicole, bf_emma,
bf_isabella (British female), bm_george (male). Model at ~/.cache/kokoro/.
"""
import os, sys, subprocess, tempfile, soundfile as sf
from kokoro_onnx import Kokoro

MODEL = os.path.expanduser(r"~/.cache/kokoro/kokoro-v1.0.onnx")
VOICES = os.path.expanduser(r"~/.cache/kokoro/voices-v1.0.bin")
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "readings", "voice")
OUT = os.path.abspath(OUT)
VOICE = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 0.92
LANG = "en-us" if VOICE.startswith("a") else "en-gb"

SUN = {"aries":"First through every door, last to back down. The want is loud and immediate, and they expect you to keep up.","taurus":"Slow to move, impossible to rush. Comfort is a need, not a treat, and the loyalty settles in like weight on the bed.","gemini":"Two moods before breakfast, curious about everything. They read the room, then change it.","cancer":"Tender at the core, ruled by whoever feels like home. Their whole world is the people in it.","leo":"Built for the best seat in the house, and they let you know when it is taken. The warmth is real, and it wants an audience of one. You.","virgo":"Watchful and particular, quietly in charge of the routine. They notice the thing you moved.","libra":"Happiest when the room is calm and the bond is even. They mirror your mood back, softer.","scorpio":"All or nothing, and they decide which. What they give, they give completely, and they remember everything.","sagittarius":"Born mid-adventure, nose to the wind. Fences are suggestions and the world is theirs to sniff.","capricorn":"Serious for their age, steady under pressure. They earn their place, then hold it.","aquarius":"Their own creature on their own clock. Affection on their terms, and odd, better terms than yours.","pisces":"Soft-edged and tuned to feeling, yours before they are their own. They wait at the door and mean it."}
MOON = {"aries":"Settles by doing, not sitting. Burn the energy off and the calm follows.","taurus":"Safe means warm, fed, and exactly where they always sleep. Move the bed and you will hear about it.","gemini":"Needs something to watch and someone to chatter at. Boredom is their only real fear.","cancer":"Wants you close and the routine kept. A small sulk over a skipped cuddle is not unusual.","leo":"Feels safest when seen. A little praise resets their whole day.","virgo":"Calms when the order is right. A clean bowl in the same spot, and the world is fine.","libra":"Settles in pairs, unsettles alone. They borrow their calm from yours.","scorpio":"Watches from somewhere high, then decides you are safe. Once it decides, it does not change its mind.","sagittarius":"Needs room and a horizon. A long walk does more than any blanket.","capricorn":"Steadies on a schedule they can trust. Surprises are not a gift to them.","aquarius":"Comforted by space, not smothering. They come to you, and that is the rule.","pisces":"Soothed by quiet and your nearness. Loud days send them under the bed."}
VENUS = {"aries":"Loves head-on. Crashes into you, then waits, tail going, for the same back.","taurus":"Shows love by leaning their whole weight on you and refusing to move.","gemini":"Brings you things and talks the whole time. Attention is the love language.","cancer":"Loves by guarding. Follows you room to room and frets when you leave.","leo":"Loves out loud and expects it back with interest. Generous, and a little theatrical.","virgo":"Shows love by staying close while you work. Missing nothing, asking for nothing.","libra":"Loves to be near and in tune. Gives back the softness it wants.","scorpio":"Picks one person and keeps picking them. That is you, and it is for life.","sagittarius":"Loves by including you in the fun. The door is open, come on, keep up.","capricorn":"Undemonstrative and completely dependable. The love is in the showing up.","aquarius":"Loves on a slant. Sits one cushion away, which from them is devotion.","pisces":"Loves by melting into you. No edge between their mood and yours."}
AUDIO = {
 "s1a":"This is the sky the night they arrived.","s1b":"Real positions. The actual sky, read for them.",
 "s2a":"Thirteen places in the sky. Each one says something true about who they are.","s2b":"We read three with you now. Quietly, one at a time.",
 "s3a":"First, the Sun. This is who they are at the centre, before the world asks anything of them.","s3c":"You have watched this in them since the first day, even if you never had a word for it.",
 "s4a":"Now the Moon. This is their inner weather. How they feel safe, and how they ask for comfort.","s4c":"When they come to you at night, this is the part of them doing the choosing.",
 "s5a":"And Venus. This is how they love, and the kind of love they reach for back.","s5c":"The way they love you was never random. It was written up there before you met.",
 "s6a":"Three placements in, and a pattern is already showing.",
 "s6b-fire":"They are a fire-led soul.","s6b-earth":"They are an earth-led soul.","s6b-water":"They are a water-led soul.","s6b-air":"They are an air-led soul.",
 "el-fire":"Fire runs hot and quick. They live out loud, and they warm whatever room they are in.","el-earth":"Earth is steady and real. They trust what they can touch, and once they settle they stay.","el-water":"Water feels everything. They read you through their heart, and they remember how it felt.","el-air":"Air lives in the mind. Curious, social, always half a thought ahead of you.",
 "s7a":"That is three. There are ten more.","s7b":"Mars, where their courage lives. Saturn, what they carry, and what steadies them.","s7c":"Mercury, how they read a room. Chiron, the tender place they came in carrying.","s7d":"And the rest. The parts of them you feel every day and have never had named.","s7e":"We measured all of them. Right now, you are seeing three.",
 "s8a":"The lines between them are how all of it talks to each other.","s8b":"The full reading is where they stop being thirteen facts and start being one whole creature.","s8c":"And the face they show the world, once you can tell us the hour they were born.",
 "s9a":"You came here to find out who they really are.","s9b":"These three say it is real. The other ten say how deep it goes.","s9c":"You have met three of them tonight. The rest are right here, when you are ready.",
}
for s, t in SUN.items(): AUDIO[f"sun-{s}"] = t
for s, t in MOON.items(): AUDIO[f"moon-{s}"] = t
for s, t in VENUS.items(): AUDIO[f"venus-{s}"] = t

os.makedirs(OUT, exist_ok=True)
k = Kokoro(MODEL, VOICES)
tmp = tempfile.gettempdir()
n = 0
for slug, text in AUDIO.items():
    samples, sr = k.create(text, voice=VOICE, speed=SPEED, lang=LANG)
    wav = os.path.join(tmp, f"k_{slug}.wav"); sf.write(wav, samples, sr)
    mp3 = os.path.join(OUT, f"{slug}.mp3")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-ar", "44100", "-b:a", "96k", mp3], check=True)
    os.remove(wav); n += 1
print(f"DONE {n} clips voice={VOICE} speed={SPEED} -> {OUT}")
