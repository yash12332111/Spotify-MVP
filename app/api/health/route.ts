// app/api/health/route.ts
// ─────────────────────────────────────────────────────────────
// PHASE 0 — bare Supabase REST ping.
//
// The tracks table does NOT exist yet (Phase 2 seed creates it).
// We use a direct fetch to the Supabase REST root, which triggers
// a real Postgres connection and resets the 7-day pause timer.
//
// PHASE 2 UPGRADE: after seed.ts runs, replace the fetch block
// with a real table query:
//
//   import { supabase } from "@/lib/supabase.server";
//   const { error } = await supabase
//     .from("tracks").select("id").limit(1).single();
//   if (error && error.code !== "PGRST116") { /* handle */ }
//
// and update the `phase` field in the response body.
// ─────────────────────────────────────────────────────────────
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10; // Vercel Hobby hard cap

export async function GET() {
  const ts = new Date().toISOString();

  // ── Env guard ────────────────────────────────────────────────
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      {
        status: "misconfigured",
        ts,
        error: "SUPABASE_URL or SUPABASE_SERVICE_KEY is not set in env",
      },
      { status: 500 }
    );
  }

  // ── Bare REST ping — real Postgres round-trip, no table needed ─
  // Hitting /rest/v1/ causes Supabase to introspect the DB schema,
  // which is genuine Postgres activity that resets the pause timer.
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      signal: AbortSignal.timeout(8000), // 8s budget, inside Vercel 10s limit
    });

    if (!res.ok && res.status !== 400) {
      // 400 from /rest/v1/ is normal (no resource specified) — still means DB is alive
      return NextResponse.json(
        {
          status: "db_unreachable",
          ts,
          httpStatus: res.status,
          note: "Supabase did not respond as expected — may be pausing",
        },
        { status: 503 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: "db_unreachable", ts, error: message },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "ok",
    ts,
    db: "reachable",
    phase: "0 — bare REST ping (tracks table not yet seeded)",
  });
}
