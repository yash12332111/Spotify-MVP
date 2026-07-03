/**
 * GET /api/rotation
 * Query: ?session_id=&persona_id=
 * Response: { tracks: [{ ...TrackRow, exposure_count, survived, tag }] }
 *
 * Phase 3 — 3D: Live rotation strip data
 * - Returns all session_rotation rows for this session/persona
 * - Joins with tracks for full track data
 * - Adds "New to your rotation" tag for exposure_count < 3 && !survived
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase, TrackRow } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");
  const persona_id = searchParams.get("persona_id");

  if (!session_id || !persona_id) {
    return NextResponse.json({ error: "session_id and persona_id required" }, { status: 400 });
  }

  // Fetch rotation rows for this session/persona
  const { data: rotationRows, error } = await supabase
    .from("session_rotation")
    .select("track_id, exposure_count, survived")
    .eq("session_id", session_id)
    .eq("persona_id", persona_id)
    .order("last_exposed_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rotationRows || rotationRows.length === 0) {
    return NextResponse.json({ tracks: [], north_star: 0 });
  }

  // Fetch full track data for all rotation track IDs
  const trackIds = rotationRows.map((r: { track_id: string }) => r.track_id);
  const { data: tracksData } = await supabase
    .from("tracks")
    .select("*")
    .in("id", trackIds);

  const trackMap: Record<string, TrackRow> = {};
  for (const t of tracksData ?? []) {
    trackMap[(t as TrackRow).id] = t as TrackRow;
  }

  // Merge rotation metadata with track data
  const tracks = rotationRows
    .map((row: { track_id: string; exposure_count: number; survived: boolean }) => {
      const track = trackMap[row.track_id];
      if (!track) return null;
      return {
        ...track,
        exposure_count: row.exposure_count,
        survived: row.survived,
        tag: !row.survived && row.exposure_count > 0 ? "New to your rotation" : null,
      };
    })
    .filter(Boolean);

  // North Star: how many have survived
  const northStar = rotationRows.filter((r: { survived: boolean }) => r.survived).length;

  return NextResponse.json({ tracks, north_star: northStar });
}
