import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateBlogRequest {
  topic: string;
  species?: string;
  category?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, species = "dog", category = "behavior" }: GenerateBlogRequest = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating blog post for topic:", topic);

    // Generate SEO-optimized blog content with pet report CTA
    const systemPrompt = `You are an expert pet behavior writer and SEO specialist for Little Souls, a cosmic pet personality reading service. 

Your task is to write engaging, helpful blog posts that:
1. Answer the user's question about pet behavior thoroughly
2. Include a cosmic/astrological angle that ties into pet personality
3. Always end with a compelling CTA to get a personalized pet report

CRITICAL: Every article must naturally lead to the solution: understanding your pet through their cosmic personality profile.

Write in a warm, friendly tone. Use short paragraphs. Include practical tips.`;

    const userPrompt = `Write a complete SEO-optimized blog post about: "${topic}"

Species focus: ${species}
Category: ${category}

Return a JSON object with these exact fields:
{
  "title": "SEO-optimized title with the main keyword (50-60 chars)",
  "metaDescription": "Compelling meta description with keyword (150-160 chars)",
  "slug": "url-friendly-slug-with-keyword",
  "excerpt": "2-3 sentence preview for blog listing",
  "content": "Full markdown article (600-800 words) with:
    - H2 headings using ##
    - Bullet points where appropriate
    - A section connecting the behavior to pet personality/zodiac
    - Final section: '## Discover Your ${species === 'cat' ? 'Cat' : 'Dog'}'s Cosmic Personality' with CTA paragraph ending with a link to get their personalized reading
  ",
  "targetKeyword": "main SEO keyword phrase",
  "secondaryKeywords": ["keyword1", "keyword2", "keyword3"],
  "readingTimeMinutes": estimated reading time as number
}

Make the CTA feel natural and helpful, not salesy. Frame the pet report as the ultimate way to understand their pet's unique personality and behaviors.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const contentText = aiResponse.choices?.[0]?.message?.content;

    if (!contentText) {
      throw new Error("No content returned from AI");
    }

    // Parse JSON from response (handle markdown code blocks)
    let blogData;
    try {
      const jsonMatch = contentText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        contentText.match(/```\n?([\s\S]*?)\n?```/) ||
                        [null, contentText];
      const jsonStr = jsonMatch[1] || contentText;
      blogData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", contentText);
      throw new Error("Failed to parse blog content from AI");
    }

    // Add the intake link to the content
    const contentWithCTA = blogData.content.replace(
      /\[get their personalized reading\]|\[personalized reading\]|\[cosmic reading\]|\[pet report\]/gi,
      "[Get Your Pet's Free Cosmic Reading →](/intake)"
    );

    // If no link was replaced, append a CTA
    const finalContent = contentWithCTA.includes("/intake") 
      ? contentWithCTA 
      : contentWithCTA + `\n\n---\n\n**Ready to understand your ${species} on a deeper level?** [Discover their unique cosmic personality →](/intake)`;

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: post, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        slug: blogData.slug,
        title: blogData.title,
        meta_description: blogData.metaDescription,
        content: finalContent,
        excerpt: blogData.excerpt,
        target_keyword: blogData.targetKeyword,
        secondary_keywords: blogData.secondaryKeywords,
        species,
        category,
        reading_time_minutes: blogData.readingTimeMinutes || 5,
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Check for duplicate slug
      if (insertError.code === "23505") {
        console.log("Post with this slug already exists");
        return new Response(
          JSON.stringify({ error: "A post with this topic already exists", code: "DUPLICATE" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Database insert error:", insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log("Blog post created successfully:", post.slug);

    return new Response(
      JSON.stringify({ success: true, post }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating blog post:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate blog post" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
