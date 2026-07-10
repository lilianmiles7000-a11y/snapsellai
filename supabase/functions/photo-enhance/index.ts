import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Action =
  | "enhance_colors" | "improve_brightness" | "sharpen" | "reduce_noise"
  | "auto_crop" | "remove_background" | "white_background"
  | "marketplace_background" | "transparent_background";

// Provider keys — all optional.
const CLOUDINARY_CLOUD = Deno.env.get("CLOUDINARY_CLOUD_NAME") ?? "";
const CLOUDINARY_KEY   = Deno.env.get("CLOUDINARY_API_KEY") ?? "";
const CLOUDINARY_SEC   = Deno.env.get("CLOUDINARY_API_SECRET") ?? "";
const REMOVEBG_KEY     = Deno.env.get("REMOVEBG_API_KEY") ?? "";
const REPLICATE_TOKEN  = Deno.env.get("REPLICATE_API_TOKEN") ?? "";
const FAL_KEY          = Deno.env.get("FAL_KEY") ?? "";

const isCloudinaryReady = () => Boolean(CLOUDINARY_CLOUD && CLOUDINARY_KEY && CLOUDINARY_SEC);
const isRemoveBgReady   = () => Boolean(REMOVEBG_KEY);
const isReplicateReady  = () => Boolean(REPLICATE_TOKEN);
const isFalReady        = () => Boolean(FAL_KEY);

/** Return a 503 with a friendly error when a required provider is not configured. */
function providerUnconfigured(provider: string, keyNames: string[]): Response {
  return new Response(
    JSON.stringify({
      error: `${provider} is not configured. Add ${keyNames.join(", ")} to your Supabase project secrets.`,
      provider_missing: provider.toLowerCase(),
    }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { image_url, action } = await req.json() as { image_url: string; action: Action };
    if (!image_url || !action) throw new Error("image_url and action are required");

    let result: { enhanced_url: string; provider: string; metadata?: Record<string, unknown> };

    switch (action) {
      case "remove_background":
      case "white_background":
      case "transparent_background":
        if (!isRemoveBgReady()) return providerUnconfigured("Remove.bg", ["REMOVEBG_API_KEY"]);
        result = await handleRemoveBg(image_url, action);
        break;

      case "reduce_noise":
        if (!isReplicateReady()) return providerUnconfigured("Replicate", ["REPLICATE_API_TOKEN"]);
        result = await handleReplicate(image_url);
        break;

      case "marketplace_background":
        if (!isFalReady()) return providerUnconfigured("Fal.ai", ["FAL_KEY"]);
        result = await handleFal(image_url);
        break;

      case "enhance_colors":
      case "improve_brightness":
      case "sharpen":
      case "auto_crop":
      default:
        if (!isCloudinaryReady()) return providerUnconfigured("Cloudinary", ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]);
        result = await handleCloudinary(image_url, action);
    }

    return new Response(JSON.stringify(result), {
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

// ─── Provider handlers ────────────────────────────────────────────────────────

async function handleCloudinary(
  imageUrl: string,
  action: Action
): Promise<{ enhanced_url: string; provider: string }> {
  const transformations: Record<string, string> = {
    enhance_colors:   "e_vibrance:70,e_auto_color",
    improve_brightness: "e_auto_brightness,e_improve:50",
    sharpen:          "e_sharpen:200",
    auto_crop:        "c_auto,g_auto,ar_1:1",
  };
  const transformation = transformations[action] ?? "e_improve";
  const timestamp = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest(
    "SHA-1",
    enc.encode(`timestamp=${timestamp}${CLOUDINARY_SEC}`)
  );
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const formData = new FormData();
  formData.append("file", imageUrl);
  formData.append("timestamp", String(timestamp));
  formData.append("api_key", CLOUDINARY_KEY);
  formData.append("signature", signature);
  formData.append("transformation", transformation);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!res.ok) throw new Error(`Cloudinary upload failed: ${await res.text()}`);
  const data = await res.json();
  return { enhanced_url: data.secure_url, provider: "cloudinary" };
}

async function handleRemoveBg(
  imageUrl: string,
  action: Action
): Promise<{ enhanced_url: string; provider: string; metadata: Record<string, unknown> }> {
  const formData = new FormData();
  formData.append("image_url", imageUrl);
  formData.append("size", "auto");
  if (action === "white_background") formData.append("bg_color", "ffffff");
  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": REMOVEBG_KEY },
    body: formData,
  });
  if (!res.ok) throw new Error(`Remove.bg failed (${res.status})`);
  const buf = await res.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return {
    enhanced_url: `data:image/png;base64,${b64}`,
    provider: "removebg",
    metadata: { action, credits_charged: res.headers.get("X-Credits-Charged") ?? "unknown" },
  };
}

async function handleReplicate(
  imageUrl: string
): Promise<{ enhanced_url: string; provider: string; metadata: Record<string, unknown> }> {
  const model = "sczhou/codeformer:7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56";
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: { Authorization: `Token ${REPLICATE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ version: model, input: { image: imageUrl, codeformer_fidelity: 0.7, background_enhance: true } }),
  });
  if (!createRes.ok) throw new Error(`Replicate create failed (${createRes.status})`);
  const prediction = await createRes.json();
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await (await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Token ${REPLICATE_TOKEN}` },
    })).json();
    if (poll.status === "succeeded") {
      const url = Array.isArray(poll.output) ? poll.output[0] : poll.output;
      return { enhanced_url: url, provider: "replicate", metadata: { model } };
    }
    if (poll.status === "failed" || poll.status === "canceled") {
      throw new Error(`Replicate prediction ${poll.status}: ${poll.error}`);
    }
  }
  throw new Error("Replicate timed out");
}

async function handleFal(
  imageUrl: string
): Promise<{ enhanced_url: string; provider: string; metadata: Record<string, unknown> }> {
  const res = await fetch("https://fal.run/fal-ai/background-generation", {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      prompt: "clean neutral studio background, soft gradient, professional product photography",
    }),
  });
  if (!res.ok) throw new Error(`Fal.ai failed (${res.status})`);
  const data = await res.json();
  const url = data.image?.url ?? data.images?.[0]?.url ?? data.output_url;
  if (!url) throw new Error("Fal.ai returned no output URL");
  return { enhanced_url: url, provider: "fal", metadata: {} };
}
