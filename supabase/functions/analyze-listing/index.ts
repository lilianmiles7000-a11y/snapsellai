import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const VISION_MODEL = "gpt-4o";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  // Guard: OpenAI key is required for this function.
  if (!OPENAI_KEY) {
    return new Response(
      JSON.stringify({ error: "AI analysis is not configured. Set OPENAI_API_KEY in your Supabase project secrets." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { image_urls, platform } = await req.json();
    if (!image_urls?.length) throw new Error("image_urls is required");

    const imageMessages = (image_urls as string[]).slice(0, 10).map((url: string) => ({
      type: "image_url",
      image_url: { url, detail: "high" },
    }));

    const systemPrompt = `You are an expert product listing writer specializing in secondhand marketplaces.
Analyze the provided product photos and return ONLY valid JSON — no markdown, no explanation.
The JSON must exactly match this schema:
{
  "title": string (compelling marketplace title, max 80 chars),
  "description": string (2-3 paragraphs, engaging, honest, platform-optimized for ${platform}),
  "category": string,
  "subcategory": string,
  "condition": string (one of: New with tags, Like new, Very good, Good, Acceptable),
  "size": string | null,
  "colors": string[] (max 3),
  "materials": string[] (max 4),
  "gender": string (one of: Unisex, Men, Women, Boys, Girls, Unknown),
  "brand": string | null,
  "suggested_price": number (EUR, realistic market value),
  "quick_sale_price": number (EUR, 20-30% below suggested),
  "premium_price": number (EUR, 20% above suggested),
  "confidence": number (0.0-1.0),
  "keywords": string[] (8-12 SEO keywords),
  "tags": string[] (5-8 hashtag-style tags without #),
  "attributes": {}
}
If you cannot detect a field, use null for nullable fields or "Unknown" for strings.
Always return valid JSON.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 2000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [{ type: "text", text: "Analyze these product photos and generate a complete listing." }, ...imageMessages] },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content returned from OpenAI");

    const parsed = JSON.parse(content);
    const sanitized = {
      title: String(parsed.title ?? "Untitled Item"),
      description: String(parsed.description ?? "No description available."),
      category: String(parsed.category ?? "Unknown"),
      subcategory: String(parsed.subcategory ?? "Unknown"),
      condition: String(parsed.condition ?? "Good"),
      size: parsed.size ? String(parsed.size) : null,
      colors: Array.isArray(parsed.colors) ? parsed.colors.map(String).slice(0, 3) : [],
      materials: Array.isArray(parsed.materials) ? parsed.materials.map(String).slice(0, 4) : [],
      gender: String(parsed.gender ?? "Unknown"),
      brand: parsed.brand ? String(parsed.brand) : null,
      suggested_price: Math.max(1, Number(parsed.suggested_price) || 10),
      quick_sale_price: Math.max(1, Number(parsed.quick_sale_price) || 8),
      premium_price: Math.max(1, Number(parsed.premium_price) || 12),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7)),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 12) : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 8) : [],
      attributes: typeof parsed.attributes === "object" && parsed.attributes !== null ? parsed.attributes : {},
    };

    return new Response(JSON.stringify(sanitized), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
