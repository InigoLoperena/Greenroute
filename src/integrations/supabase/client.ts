import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function requireEnv(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(
      `Missing ${name}. Configure it in .env.local for development and in Vercel Environment Variables for deployments.`,
    );
  }
  return normalized;
}

const SUPABASE_URL = requireEnv("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL);
const SUPABASE_PUBLISHABLE_KEY = requireEnv(
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
