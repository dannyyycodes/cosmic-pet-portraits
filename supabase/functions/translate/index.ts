import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANGUAGE_NAMES: Record<string, string> = {
  es: 'Spanish',
  pt: 'Portuguese', 
  fr: 'French',
  ar: 'Arabic',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, targetLanguage } = await req.json();
    
    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing texts array or targetLanguage' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip translation for English
    if (targetLanguage === 'en') {
      const result: Record<string, string> = {};
      texts.forEach((t: string) => result[t] = t);
      return new Response(JSON.stringify({ translations: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check cache first
    const { data: cached } = await supabase
      .from('translation_cache')
      .select('source_text, translated_text')
      .eq('target_language', targetLanguage)
      .in('source_text', texts);

    const cachedMap: Record<string, string> = {};
    (cached || []).forEach((c: any) => {
      cachedMap[c.source_text] = c.translated_text;
    });

    // Find texts that need translation
    const needsTranslation = texts.filter((t: string) => !cachedMap[t]);
    
    console.log(`Cache hit: ${texts.length - needsTranslation.length}/${texts.length}, translating ${needsTranslation.length} texts to ${targetLanguage}`);

    if (needsTranslation.length > 0) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      const languageName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
      
      // Batch translate with AI
      const prompt = `Translate the following texts from English to ${languageName}. 
Return ONLY a JSON object where keys are the original English texts and values are the translations.
Keep the tone natural and appropriate for a pet astrology website.
Do not add any explanation, just return the JSON.

Texts to translate:
${JSON.stringify(needsTranslation, null, 2)}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a professional translator. Return only valid JSON, no markdown or explanation.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI translation error:', response.status, errorText);
        throw new Error(`AI translation failed: ${response.status}`);
      }

      const aiResult = await response.json();
      let translatedContent = aiResult.choices?.[0]?.message?.content || '{}';
      
      // Clean up response (remove markdown code blocks if present)
      translatedContent = translatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let newTranslations: Record<string, string> = {};
      try {
        newTranslations = JSON.parse(translatedContent);
      } catch (e) {
        console.error('Failed to parse AI response:', translatedContent);
        // Fallback: return original texts
        needsTranslation.forEach((t: string) => newTranslations[t] = t);
      }

      // Cache new translations
      const toInsert = Object.entries(newTranslations).map(([source, translated]) => ({
        source_text: source,
        target_language: targetLanguage,
        translated_text: translated as string,
      }));

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('translation_cache')
          .upsert(toInsert, { onConflict: 'source_text,target_language' });
        
        if (insertError) {
          console.error('Cache insert error:', insertError);
        }
      }

      // Merge with cached
      Object.assign(cachedMap, newTranslations);
    }

    return new Response(JSON.stringify({ translations: cachedMap }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
