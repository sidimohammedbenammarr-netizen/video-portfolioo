import { createBrowserClient } from "@supabase/ssr";

// Client used in Client Components ("use client"). Safe to call from the
// browser — it only ever uses the public anon key, which is meant to be
// public and is restricted by the Row Level Security policies in
// supabase/schema.sql.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
