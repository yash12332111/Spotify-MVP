import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  // E2-13: enforced in SQL — WHERE playable = true, never application code
  const { data, error } = await supabase
    .from("tracks")
    .select("id, title, artist, preview_url, artwork_url, mood, energy, context_fit, role, survival_rate_similar_users")
    .eq("playable", true)
    .order("survival_rate_similar_users", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tracks: data ?? [] });
}
