import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, niche } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlApiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Searching for influencers with query:", query);

    // Search for pet influencers
    const searchResponse = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        limit: 10,
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true,
        },
      }),
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error("Firecrawl search error:", searchData);
      return new Response(
        JSON.stringify({ success: false, error: searchData.error || "Search failed" }),
        { status: searchResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Search returned", searchData.data?.length || 0, "results");

    // Process results to extract influencer info
    const prospects = (searchData.data || []).map((result: any, index: number) => {
      // Extract potential email from content
      const emailMatch = result.markdown?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      
      // Extract social links
      const instagramMatch = result.markdown?.match(/instagram\.com\/([a-zA-Z0-9._]+)/i) || 
                            result.url?.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
      const tiktokMatch = result.markdown?.match(/tiktok\.com\/@?([a-zA-Z0-9._]+)/i);
      const youtubeMatch = result.markdown?.match(/youtube\.com\/(channel\/[a-zA-Z0-9_-]+|@[a-zA-Z0-9._]+|c\/[a-zA-Z0-9._]+)/i);

      return {
        name: result.title || `Prospect ${index + 1}`,
        email: emailMatch ? emailMatch[0] : null,
        website: result.url,
        instagram: instagramMatch ? instagramMatch[1] : null,
        tiktok: tiktokMatch ? tiktokMatch[1] : null,
        youtube: youtubeMatch ? youtubeMatch[1] : null,
        niche: niche || "general",
        content_summary: result.description || result.markdown?.substring(0, 500),
        source: "firecrawl",
        follower_estimate: "unknown",
      };
    });

    return new Response(
      JSON.stringify({ success: true, prospects }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in search-influencers:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
