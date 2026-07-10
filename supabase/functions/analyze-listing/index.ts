import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenAI } from "npm:@google/genai@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const MODEL = "gemini-2.5-flash";

interface GeminiListingResponse {
  title?: string;
  description?: string;
  category?: string;
  brand?: string;
  condition?: string;
  color?: string;
  estimated_price?: string;
  keywords?: string[];
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function fetchImageAsInlineData(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status}): ${url}`);

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const mimeType = contentType.split(";")[0].trim();
  const data = uint8ToBase64(new Uint8Array(await res.arrayBuffer()));

  return { inlineData: { mimeType, data } };
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  if (fenceMatch) return fenceMatch[1].trim();
  return trimmed;
}

function parseEstimatedPrice(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return Math.max(1, value);
  if (typeof value === "string" && value.trim()) {
    const num = parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."));
    if (!Number.isNaN(num)) return Math.max(1, num);
  }
  return 10;
}

function mapToVisionAnalysisResult(parsed: GeminiListingResponse) {
  const suggested_price = parseEstimatedPrice(parsed.estimated_price);

  return {
    title: String(parsed.title ?? "Untitled Item"),
    description: String(parsed.description ?? "No description available."),
    category: String(parsed.category ?? "Unknown"),
    subcategory: "Unknown",
    condition: String(parsed.condition ?? "Good"),
    size: null,
    colors: parsed.color ? [String(parsed.color)] : [],
    materials: [],
    gender: "Unknown",
    brand: parsed.brand ? String(parsed.brand) : null,
    suggested_price,
    quick_sale_price: Math.max(1, Math.round(suggested_price * 0.75)),
    premium_price: Math.max(1, Math.round(suggested_price * 1.2)),
    confidence: 0.7,
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 12) : [],
    tags: Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 8) : [],
    attributes: {},
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  if (!GEMINI_API_KEY || !ai) {
    return new Response(
      JSON.stringify({ error: "AI analysis is not configured. Set GEMINI_API_KEY in your Supabase project secrets." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { image_urls, platform } = await req.json();
    if (!image_urls?.length) throw new Error("image_urls is required");

    const imageParts = await Promise.all(
      (image_urls as string[]).slice(0, 10).map((url: string) => fetchImageAsInlineData(url))
    );

    const systemPrompt = `You are an expert product listing writer specializing in secondhand marketplaces.
Analyze the provided marketplace product photo(s) and return ONLY valid JSON — no markdown, no explanation.
The JSON must exactly match this structure:
{
  "title": "",
  "description": "",
  "category": "",
  "brand": "",
  "condition": "",
  "color": "",
  "estimated_price": "",
  "keywords": []
}

Field guidance:
- title: compelling marketplace title, max 80 characters
- description: 2-3 paragraphs, engaging, honest, optimized for ${platform ?? "marketplace"} listings
- category: primary product category
- brand: brand name or empty string if unknown
- condition: one of New with tags, Like new, Very good, Good, Acceptable
- color: primary visible color
- estimated_price: realistic EUR market value as a string (e.g. "25" or "25.00")
- keywords: 8-12 SEO keywords as a string array

Always return valid JSON.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            { text: "Analyze these product photos and generate a complete listing." },
            ...imageParts,
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            brand: { type: "string" },
            condition: { type: "string" },
            color: { type: "string" },
            estimated_price: { type: "string" },
            keywords: { type: "array", items: { type: "string" } },
          },
          required: [
            "title",
            "description",
            "category",
            "brand",
            "condition",
            "color",
            "estimated_price",
            "keywords",
          ],
        },
      },
    });

    const content = response.text;
    if (!content) throw new Error("No content returned from Gemini");

    const parsed = JSON.parse(extractJson(content)) as GeminiListingResponse;
    const sanitized = mapToVisionAnalysisResult(parsed);

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
