/**
 * lib/supabase.ts
 * Server-side Supabase client (service key — bypasses RLS).
 * NEVER import this from a 'use client' component.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variable");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

// Database row types
export type TrackRow = {
  id: string;
  title: string;
  artist: string;
  preview_url: string | null;
  artwork_url: string | null;
  playable: boolean;
  mood: string | null;
  energy: number | null;
  context_fit: string[] | null;
  role: string | null;
  survival_rate_similar_users: number | null;
};

export type PersonaRow = {
  id: string;
  name: string;
  taste_vector: Record<string, number>;
  default_moment: string | null;
  default_time: string | null;
  default_context: Record<string, string | number> | null;
  default_reason_line: string | null;
  default_track_id: string | null;
};

export type SessionPersonaRow = {
  session_id: string;
  persona_id: string;
  taste_vector: Record<string, number>;
  throttle_multipliers: Record<string, number>;
  simulated_day: number;
  last_active_at: string;
};
