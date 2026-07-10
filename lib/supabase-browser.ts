import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      if (typeof window === 'undefined') {
        // During SSR/build with missing env vars — return a dummy that won't crash
        // The actual client will be created client-side when env vars are present
        return null as unknown as ReturnType<typeof createBrowserClient>;
      }
      throw new Error(
        "Supabase URL and anon key are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    client = createBrowserClient(url, key);
  }
  return client;
}
