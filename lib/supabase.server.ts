// lib/supabase.server.ts
// ─────────────────────────────────────────────────────────────
// Server-only Supabase client — uses the SERVICE ROLE key.
// NEVER import this file from any 'use client' component.
// The service-role key bypasses RLS; all queries must explicitly
// filter by session_id to prevent cross-session data access.
// ─────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // In Phase 0 the keys may be empty — warn but don't crash the dev server.
  // In Phase 2+ the health check and pick routes will surface the missing-key
  // error clearly rather than throwing here at import time.
  console.warn(
    "[supabase.server] SUPABASE_URL or SUPABASE_SERVICE_KEY is not set. " +
      "Fill in .env.local before running Phase 2 routes."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseServiceKey ?? "placeholder-key",
  {
    auth: {
      // No browser session — this is a server-side client only
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
