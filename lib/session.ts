/**
 * lib/session.ts
 * Server-side session bootstrap logic (2C).
 *
 * - If session_id missing OR last_active_at > 24h → bootstrap fresh session
 * - Every call updates last_active_at = now()
 * - Mid-journey seed state (Phase 3 spec 3F): on fresh bootstrap, insert
 *   one survived=true row and one exposure_count=2 row into session_rotation
 */

import { supabase } from "./supabase";

const SESSION_TTL_HOURS = 24;

export type BootstrapResult = {
  session_id: string;
  persona_ids: string[];
  is_fresh: boolean;
};

/**
 * Ensure a valid session exists. Call this at the start of every API request.
 * Returns the canonical session_id (may be a new one if expired).
 */
export async function ensureSession(
  session_id: string | null | undefined
): Promise<BootstrapResult> {
  // Fetch all personas
  const { data: personas } = await supabase
    .from("personas")
    .select("id")
    .order("name");

  const personaIds = (personas ?? []).map((p: { id: string }) => p.id);

  if (!session_id) {
    return bootstrapFreshSession(personaIds);
  }

  // Check if session exists and is fresh
  const { data: rows } = await supabase
    .from("session_personas")
    .select("last_active_at")
    .eq("session_id", session_id)
    .limit(1);

  if (!rows || rows.length === 0) {
    return bootstrapFreshSession(personaIds, session_id);
  }

  const lastActive = new Date(rows[0].last_active_at as string);
  const hoursSince = (Date.now() - lastActive.getTime()) / 3_600_000;

  if (hoursSince > SESSION_TTL_HOURS) {
    return bootstrapFreshSession(personaIds, session_id);
  }

  // Touch last_active_at for all persona rows in this session
  await supabase
    .from("session_personas")
    .update({ last_active_at: new Date().toISOString() })
    .eq("session_id", session_id);

  return { session_id, persona_ids: personaIds, is_fresh: false };
}

async function bootstrapFreshSession(
  personaIds: string[],
  session_id?: string
): Promise<BootstrapResult> {
  const sid = session_id ?? crypto.randomUUID();

  // Copy persona defaults into session_personas
  const { data: personaRows } = await supabase
    .from("personas")
    .select("id, taste_vector");

  // 1. Batch upsert all personas into session_personas
  if (personaRows && personaRows.length > 0) {
    const sessionPersonasToUpsert = personaRows.map(p => ({
      session_id: sid,
      persona_id: p.id,
      taste_vector: p.taste_vector,
      throttle_multipliers: { wind_down: 1.0, lean_back: 1.0, commute: 1.0, focus: 1.0 },
      simulated_day: 0,
      last_active_at: new Date().toISOString(),
    }));
    await supabase.from("session_personas").upsert(sessionPersonasToUpsert);
  }

  // 2. Fetch all discovery tracks once
  const { data: discoveryTracks } = await supabase
    .from("tracks")
    .select("id")
    .eq("role", "discovery")
    .eq("playable", true)
    .order("survival_rate_similar_users", { ascending: false })
    .limit(10);

  // 3. Batch upsert session_rotation
  if (discoveryTracks && discoveryTracks.length >= 2) {
    const rotationUpserts = [];
    for (const personaId of personaIds) {
      rotationUpserts.push({
        session_id: sid,
        persona_id: personaId,
        track_id: discoveryTracks[0].id,
        exposure_count: 3,
        survived: true,
        last_exposed_at: new Date().toISOString(),
      });
      rotationUpserts.push({
        session_id: sid,
        persona_id: personaId,
        track_id: discoveryTracks[1].id,
        exposure_count: 2,
        survived: false,
        last_exposed_at: new Date().toISOString(),
      });
    }
    if (rotationUpserts.length > 0) {
      await supabase.from("session_rotation").upsert(rotationUpserts);
    }
  }

  return { session_id: sid, persona_ids: personaIds, is_fresh: true };
}
