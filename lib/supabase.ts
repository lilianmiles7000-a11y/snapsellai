/**
 * lib/supabase.ts — legacy shim.
 *
 * All new code should import from lib/supabase-browser or lib/supabase-server.
 * This file exists only so any historical imports of '@/lib/supabase' don't
 * break. It no longer accesses process.env directly.
 */
export { getSupabaseBrowserClient as getClient } from "@/lib/supabase-browser";
