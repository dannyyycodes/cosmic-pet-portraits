import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { checkRateLimit, getClientIp } from "../_shared/rate-limit.ts";

const ALLOWED_ORIGINS = ["https://littlesouls.app", "https://www.littlesouls.app"];

// Hard cap to stop pathological calls from burning our ElevenLabs credit.
// Longest legitimate caller (VSL narration) is well under this.
const MAX_TEXT_LENGTH = 2000;

// Per-IP allowance for TTS requests. Tight enough to defeat abuse scripts
// while generous for the VSL which plays a handful of clips per visit.
const RATE_LIMIT_COUNT = 20;
const RATE_LIMIT_WINDOW_SECONDS = 60;

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) })
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const ip = getClientIp(req);
    const rl = await checkRateLimit(supabase, "elevenlabs-tts", ip, RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_SECONDS);
    if (!rl.ok) {
      return new Response(
        JSON.stringify({ error: "Too many requests, please slow down." }),
        { status: 429, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfterSeconds) } },
      );
    }

    const { text, voiceId } = await req.json()
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured')
    }

    if (!text || typeof text !== 'string') {
      throw new Error('Text is required')
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } },
      );
    }

    // voiceId must be a bare alphanumeric ElevenLabs id — reject anything else
    // to stop path-injection into the ElevenLabs URL.
    const safeVoiceId = (typeof voiceId === 'string' && /^[A-Za-z0-9]{10,40}$/.test(voiceId))
      ? voiceId
      : 'EXAVITQu4vr4xnSDxMaL';

    console.log('Generating TTS for text length:', text.length)

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${safeVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, errorText)
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()
    console.log('Audio generated, size:', audioBuffer.byteLength)

    return new Response(audioBuffer, {
      headers: {
        ...getCorsHeaders(req),
        'Content-Type': 'audio/mpeg',
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
      }
    )
  }
})
