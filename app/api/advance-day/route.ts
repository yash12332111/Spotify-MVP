/**
 * POST /api/advance-day
 * Body: { session_id, persona_id }
 * Response: { new_simulated_day: number }
 *
 * Phase 3 — 3C: Advance simulated day
 * - Increments simulated_day on session_persona
 * - Promotes rotation tracks: exposure_count++ for un-survived tracks
 * - Sets survived=true when exposure_count >= 3
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase, SessionPersonaRow } from "@/lib/supabase";
import { ensureSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const BodySchema = z.object({
  session_id: z.string().nullable().optional(),
  persona_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", detail: String(e) }, { status: 400 });
  }

  const { persona_id } = body;
  const { session_id: sid } = await ensureSession(body.session_id);

  // 1. Fetch session_persona to get current simulated_day
  const { data: spData } = await supabase
    .from("session_personas")
    .select("simulated_day")
    .eq("session_id", sid)
    .eq("persona_id", persona_id)
    .single();

  const sp = spData as Pick<SessionPersonaRow, "simulated_day"> | null;
  const newDay = (sp?.simulated_day ?? 0) + 1;

  // 2. Increment simulated_day
  await supabase
    .from("session_personas")
    .update({
      simulated_day: newDay,
      last_active_at: new Date().toISOString(),
    })
    .eq("session_id", sid)
    .eq("persona_id", persona_id);

  // 3. Increment exposure_count for all un-survived rotation tracks
  // (Supabase doesn't support SQL UPDATE with arithmetic directly via the JS client,
  //  so we fetch then update individually — fine for the small rotation pool)
  const { data: rotationRows } = await supabase
    .from("session_rotation")
    .select("track_id, exposure_count, survived")
    .eq("session_id", sid)
    .eq("persona_id", persona_id)
    .eq("survived", false);

  for (const row of rotationRows ?? []) {
    const r = row as { track_id: string; exposure_count: number; survived: boolean };
    const newCount = r.exposure_count + 1;
    const nowSurvived = newCount >= 3;

    await supabase
      .from("session_rotation")
      .update({
        exposure_count: newCount,
        survived: nowSurvived,
        last_exposed_at: new Date().toISOString(),
      })
      .eq("session_id", sid)
      .eq("persona_id", persona_id)
      .eq("track_id", r.track_id);
  }

  // 4. Count survived tracks (North Star stat)
  const { count: survivedCount } = await supabase
    .from("session_rotation")
    .select("track_id", { count: "exact", head: true })
    .eq("session_id", sid)
    .eq("persona_id", persona_id)
    .eq("survived", true);

  return NextResponse.json({
    ok: true,
    new_simulated_day: newDay,
    session_id: sid,
    tracks_advanced: (rotationRows ?? []).length,
    north_star: survivedCount ?? 0,
  });
}
