import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get request body for optional count override
    let postsToGenerate = 3; // Default: generate 3 posts per run
    try {
      const body = await req.json();
      if (body.count && typeof body.count === "number" && body.count > 0 && body.count <= 10) {
        postsToGenerate = body.count;
      }
    } catch {
      // No body or invalid JSON, use default
    }

    console.log(`Starting automated blog generation: ${postsToGenerate} posts`);

    // Fetch unused topics from queue (highest priority first)
    const { data: topics, error: topicsError } = await supabase
      .from("blog_topics")
      .select("*")
      .eq("is_used", false)
      .order("priority", { ascending: false })
      .limit(postsToGenerate);

    if (topicsError) {
      console.error("Error fetching topics:", topicsError);
      throw new Error("Failed to fetch topics from queue");
    }

    if (!topics || topics.length === 0) {
      console.log("No unused topics remaining in queue");
      return new Response(
        JSON.stringify({ success: true, message: "No topics remaining", postsGenerated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${topics.length} topics to process`);

    const results = [];

    for (const topic of topics) {
      try {
        console.log(`Generating post for: ${topic.topic}`);

        // Generate blog content using AI
        const systemPrompt = `You are an expert pet behavior writer and SEO specialist for AstroPets, a cosmic pet personality reading service. 

Your task is to write engaging, helpful blog posts that:
1. Answer the user's question about pet behavior thoroughly
2. Include a cosmic/astrological angle that ties into pet personality
3. Always end with a compelling CTA to get a personalized pet report

CRITICAL: Every article must naturally lead to the solution: understanding your pet through their cosmic personality profile.

Write in a warm, friendly tone. Use short paragraphs. Include practical tips.`;

        const userPrompt = `Write a complete SEO-optimized blog post about: "${topic.topic}"

Species focus: ${topic.species}
Category: ${topic.category}

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
    - Final section: '## Discover Your ${topic.species === 'cat' ? 'Cat' : 'Dog'}'s Cosmic Personality' with CTA paragraph ending with a link to get their personalized reading
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
          console.error(`AI error for topic "${topic.topic}":`, response.status, errorText);
          
          if (response.status === 429 || response.status === 402) {
            // Rate limited or out of credits - stop processing
            console.log("Rate limited or out of credits, stopping batch");
            break;
          }
          
          results.push({ topic: topic.topic, success: false, error: `AI error: ${response.status}` });
          continue;
        }

        const aiResponse = await response.json();
        const contentText = aiResponse.choices?.[0]?.message?.content;

        if (!contentText) {
          results.push({ topic: topic.topic, success: false, error: "No content from AI" });
          continue;
        }

        // Parse JSON from response
        let blogData;
        try {
          // Try to extract JSON from markdown code block or raw JSON
          let jsonStr = contentText;
          
          // Handle markdown code blocks
          const jsonMatch = contentText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1];
          }
          
          // Clean up any leading/trailing whitespace
          jsonStr = jsonStr.trim();
          
          // Try to parse
          blogData = JSON.parse(jsonStr);
        } catch (parseError) {
          console.error(`Failed to parse AI response for "${topic.topic}":`, contentText.substring(0, 300));
          results.push({ topic: topic.topic, success: false, error: "Failed to parse AI response" });
          continue;
        }

        // Validate required fields and provide fallbacks
        if (!blogData.title || !blogData.content || !blogData.slug) {
          console.error(`Missing required fields for "${topic.topic}"`);
          results.push({ topic: topic.topic, success: false, error: "Missing required fields in AI response" });
          continue;
        }

        // Add the intake link to the content
        let finalContent = blogData.content;
        if (!finalContent.includes("/intake")) {
          finalContent += `\n\n---\n\n**Ready to understand your ${topic.species} on a deeper level?** [Discover their unique cosmic personality →](/intake)`;
        }

        // Fallback for target_keyword if not provided
        const targetKeyword = blogData.targetKeyword || topic.topic;

        // Save to database
        const { data: post, error: insertError } = await supabase
          .from("blog_posts")
          .insert({
            slug: blogData.slug,
            title: blogData.title,
            meta_description: blogData.metaDescription || `Learn about ${topic.topic} and discover your pet's cosmic personality.`,
            content: finalContent,
            excerpt: blogData.excerpt || blogData.content.substring(0, 200) + "...",
            target_keyword: targetKeyword,
            secondary_keywords: blogData.secondaryKeywords || [],
            species: topic.species,
            category: topic.category,
            reading_time_minutes: blogData.readingTimeMinutes || 5,
            is_published: true,
            published_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            console.log(`Duplicate slug for "${topic.topic}", marking as used`);
          } else {
            console.error(`Database error for "${topic.topic}":`, insertError);
          }
          results.push({ topic: topic.topic, success: false, error: insertError.message });
        } else {
          console.log(`Successfully created post: ${post.slug}`);
          results.push({ topic: topic.topic, success: true, slug: post.slug });
        }

        // Mark topic as used regardless of outcome
        await supabase
          .from("blog_topics")
          .update({ is_used: true, used_at: new Date().toISOString() })
          .eq("id", topic.id);

        // Small delay between generations to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (topicError) {
        console.error(`Error processing topic "${topic.topic}":`, topicError);
        results.push({ topic: topic.topic, success: false, error: String(topicError) });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Batch complete: ${successCount}/${results.length} posts generated`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        postsGenerated: successCount,
        totalProcessed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in auto-generate-blogs:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate blogs" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
