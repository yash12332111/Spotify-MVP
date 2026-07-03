// app/api/health/route.ts — Phase 2 upgrade
// Now queries the tracks table directly (E0-2: Phase 2 upgrade)
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET() {
  const ts = new Date().toISOString();

  try {
    const { error } = await supabase
      .from("tracks")
      .select("id")
      .limit(1)
      .single();

    // PGRST116 = "no rows" — that means the table exists but is empty → still healthy
    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { status: "db_unreachable", ts, error: error.message },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "ok",
      ts,
      db: "reachable",
      phase: "2 — live tracks table query",
    });
  } catch (err) {
    return NextResponse.json(
      { status: "db_unreachable", ts, error: String(err) },
      { status: 503 }
    );
  }
}
