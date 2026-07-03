/**
 * POST /api/signal
 * Body: { session_id, persona_id, track_id, action: "keep" | "dismiss" | "ignore" }
 * Response: { ok: true }
 *
 * Phase 3 — 3A: Signal loop
 * - Logs signal to session_signals
 * - Asymmetrically mutates session_personas.taste_vector
 * - Updates dismiss throttle multipliers
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase, SessionPersonaRow, TrackRow } from "@/lib/supabase";
import { ensureSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

const BodySchema = z.object({
  session_id: z.string().nullable().optional(),
  persona_id: z.string().uuid(),
  track_id: z.string().uuid(),
  action: z.enum(["keep", "dismiss", "ignore"]),
  moment_label: z.string().optional(), // for throttle key
});

// Dimension-to-mood affinity map (mirrors pick route)
const MOOD_DIMS: Record<string, string[]> = {
  calm:        ["dreamy", "melancholic"],
  mellow:      ["dreamy", "melancholic", "romantic"],
  romantic:    ["romantic"],
  melancholic: ["melancholic"],
  energetic:   ["energetic", "upbeat", "joyful"],
};

function clamp(v: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

function shiftVector(
  vec: Record<string, number>,
  trackMood: string,
  delta: number
): Record<string, number> {
  const updated = { ...vec };
  for (const [dim, moods] of Object.entries(MOOD_DIMS)) {
    if (moods.includes(trackMood)) {
      updated[dim] = clamp((updated[dim] ?? 0.5) + delta);
    }
  }
  return updated;
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid body", detail: String(e) }, { status: 400 });
  }

  const { persona_id, track_id, action, moment_label } = body;

  // Validate session
  const { session_id: sid } = await ensureSession(body.session_id);

  // 1. Log the signal
  await supabase.from("session_signals").insert({
    session_id: sid,
    persona_id,
    track_id,
    action,
    created_at: new Date().toISOString(),
  });

  // ignore = log only, no vector mutation
  if (action === "ignore") {
    return NextResponse.json({ ok: true, session_id: sid, action });
  }

  // 2. Fetch the track's mood for vector shift
  const { data: trackData } = await supabase
    .from("tracks")
    .select("mood")
    .eq("id", track_id)
    .single();

  const trackMood = (trackData as TrackRow | null)?.mood ?? "dreamy";

  // 3. Fetch current session_persona
  const { data: spData } = await supabase
    .from("session_personas")
    .select("*")
    .eq("session_id", sid)
    .eq("persona_id", persona_id)
    .single();

  const sp = spData as SessionPersonaRow | null;
  if (!sp) {
    return NextResponse.json({ ok: true, session_id: sid, note: "no session_persona row" });
  }

  // 4. Asymmetric weight update
  const delta = action === "keep" ? +0.15 : -0.05;
  const newVector = shiftVector(sp.taste_vector, trackMood, delta);

  // 5. Dismiss throttle (3B)
  let newThrottle = { ...(sp.throttle_multipliers ?? {}) };

  if (action === "keep" && moment_label) {
    // keep → restore throttle toward 1.0
    const current = newThrottle[moment_label] ?? 1.0;
    newThrottle[moment_label] = clamp(current * 1.2, 0, 1.0);
  }

  if (action === "dismiss" && moment_label) {
    // Count consecutive dismisses in this moment_label
    const { data: recentSignals } = await supabase
      .from("session_signals")
      .select("action")
      .eq("session_id", sid)
      .eq("persona_id", persona_id)
      .eq("action", "dismiss")
      .order("created_at", { ascending: false })
      .limit(5);

    // Count consecutive dismisses (includes this one just inserted)
    const consecutiveDismisses = (recentSignals ?? []).length;

    if (consecutiveDismisses >= 2) {
      const current = newThrottle[moment_label] ?? 1.0;
      newThrottle[moment_label] = clamp(current * 0.5, 0, 1.0);
    }
  }

  // 6. Upsert session_persona with updated vectors
  await supabase.from("session_personas").update({
    taste_vector: newVector,
    throttle_multipliers: newThrottle,
    last_active_at: new Date().toISOString(),
  }).eq("session_id", sid).eq("persona_id", persona_id);

  // 7. If keep: upsert into session_rotation
  if (action === "keep") {
    await supabase.from("session_rotation").upsert({
      session_id: sid,
      persona_id,
      track_id,
      exposure_count: 1,
      survived: false,
      last_exposed_at: new Date().toISOString(),
    }, { onConflict: "session_id,persona_id,track_id", ignoreDuplicates: false });
  }

  return NextResponse.json({
    ok: true,
    session_id: sid,
    action,
    vector_updated: newVector,
    throttle_updated: newThrottle,
  });
}
