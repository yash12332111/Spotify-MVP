/**
 * POST /api/pick
 * Body: { persona_id: string, session_id: string | null }
 *
 * The core AI decision engine — three filters:
 *   1. Taste (dot-product math)
 *   2. Moment (Groq, 3-tier)
 *   3. Proven (survival ranking)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase, TrackRow, PersonaRow, SessionPersonaRow } from "@/lib/supabase";
import { ensureSession } from "@/lib/session";
import { classifyMoment, generateReasonLine, SILENCE_MOMENT_LABELS } from "@/lib/groq";

export const dynamic = "force-dynamic";
export const maxDuration = 10; // Vercel Hobby limit (E0-3)

const BodySchema = z.object({
  persona_id: z.string().uuid(),
  session_id: z.string().nullable().optional(),
});

// Taste dimension keys and their track field mappings
const MOOD_WEIGHTS: Record<string, Record<string, number>> = {
  calm:        { romantic: 0.9, dreamy: 0.8, melancholic: 0.6, upbeat: 0.2, energetic: 0.0, joyful: 0.3 },
  mellow:      { romantic: 0.7, dreamy: 0.9, melancholic: 0.8, upbeat: 0.3, energetic: 0.0, joyful: 0.4 },
  romantic:    { romantic: 1.0, dreamy: 0.6, melancholic: 0.4, upbeat: 0.4, energetic: 0.1, joyful: 0.5 },
  melancholic: { romantic: 0.4, dreamy: 0.6, melancholic: 1.0, upbeat: 0.1, energetic: 0.0, joyful: 0.1 },
  energetic:   { romantic: 0.2, dreamy: 0.1, melancholic: 0.1, upbeat: 0.9, energetic: 1.0, joyful: 0.8 },
};

function overlapScore(
  track: TrackRow,
  tasteVector: Record<string, number>
): number {
  const mood = track.mood ?? "dreamy";
  const energy = (track.energy ?? 5) / 10; // normalise to 0-1

  let score = 0;
  let weight = 0;

  for (const [dim, dimWeight] of Object.entries(tasteVector)) {
    const moodMap = MOOD_WEIGHTS[dim];
    if (moodMap) {
      score += dimWeight * (moodMap[mood] ?? 0.3);
      weight += dimWeight;
    }
  }

  // Add energy alignment bonus
  const energyAlign = tasteVector.energetic ?? 0.5;
  score += Math.abs(energyAlign - energy) < 0.3 ? 0.1 : 0;

  return weight > 0 ? score / weight : 0;
}

export async function POST(req: NextRequest) {
  const tStart = performance.now();
  let tBootstrap = 0, tTaste = 0, tGroqMoment = 0, tHardRule = 0, tSurvival = 0, tReasonLine = 0, tOtherDB = 0;

  // Parse body
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body", detail: String(e) }, { status: 400 });
  }

  const { persona_id, session_id } = body;

  const t0 = performance.now();
  // Ensure session is valid (bootstrap if needed — 2C)
  const { session_id: sid, is_fresh } = await ensureSession(session_id);
  tBootstrap = performance.now() - t0;

  const t1 = performance.now();

  // ── Fetch persona ─────────────────────────────────────────────────────────
  const { data: personaData, error: personaErr } = await supabase
    .from("personas")
    .select("*")
    .eq("id", persona_id)
    .single();

  if (personaErr || !personaData) {
    return NextResponse.json({ error: "Persona not found" }, { status: 404 });
  }
  const persona = personaData as PersonaRow;

  // Fetch session_persona (mutated taste vector)
  const { data: sessionPersonaData } = await supabase
    .from("session_personas")
    .select("*")
    .eq("session_id", sid)
    .eq("persona_id", persona_id)
    .single();

  const sessionPersona = sessionPersonaData as SessionPersonaRow | null;
  const tasteVector = sessionPersona?.taste_vector ?? persona.taste_vector;
  tOtherDB += performance.now() - t1;

  const t2 = performance.now();
  // ── Filter 1: Taste ───────────────────────────────────────────────────────
  const { data: allDiscovery } = await supabase
    .from("tracks")
    .select("*")
    .eq("playable", true)
    .eq("role", "discovery");

  const candidates: TrackRow[] = allDiscovery ?? [];
  const TASTE_THRESHOLD = 0.4;

  const tastePassed: (TrackRow & { _score: number })[] = [];
  const tasteFailed: TrackRow[] = [];

  for (const track of candidates) {
    const score = overlapScore(track, tasteVector);
    if (score >= TASTE_THRESHOLD) {
      tastePassed.push({ ...track, _score: score });
    } else {
      tasteFailed.push(track);
    }
  }
  tTaste = performance.now() - t2;

  const t3 = performance.now();
  // ── Filter 2: Moment (Groq, 3-tier) ──────────────────────────────────────
  const personaContext = persona.default_context ?? {};
  const momentResult = await classifyMoment(personaContext, persona.name);
  tGroqMoment = performance.now() - t3;
  
  const t4 = performance.now();
  const { moment_label, confidence, reasoning, source } = momentResult;

  // Hard rules — applied in CODE, never by model (spec 2D)
  const silenceByLabel = SILENCE_MOMENT_LABELS.has(moment_label);
  const silenceByConfidence = confidence < 0.0;

  let hardRuleFired: string | null = null;
  if (silenceByLabel) hardRuleFired = `moment_label="${moment_label}" → silence`;
  else if (silenceByConfidence) hardRuleFired = `confidence=${confidence.toFixed(2)} < 0.0 → silence`;

  if (hardRuleFired) {
    tHardRule = performance.now() - t4;
    console.log(`[Timing] Bootstrap=${tBootstrap.toFixed(1)}ms | Taste=${tTaste.toFixed(1)}ms | GroqMoment=${tGroqMoment.toFixed(1)}ms | HardRule=${tHardRule.toFixed(1)}ms | Survival=${tSurvival.toFixed(1)}ms | ReasonLine=${tReasonLine.toFixed(1)}ms | OtherDB=${tOtherDB.toFixed(1)}ms | Total=${(performance.now() - tStart).toFixed(1)}ms`);
    return NextResponse.json({
      decision: "silence",
      trace: {
        candidates_in: candidates.length,
        taste: { passed: tastePassed.length, failed: tasteFailed.length },
        moment: { label: moment_label, confidence, reasoning, source },
        hard_rules: { fired: hardRuleFired },
        survival_ranking: [],
        pick_or_silence_cause: hardRuleFired,
        session_id: sid,
        timing: { tBootstrap, tTaste, tGroqMoment, tHardRule, tSurvival, tReasonLine, tOtherDB, tTotal: performance.now() - tStart },
      },
    });
  }

  // Filter moment — remove tracks that don't fit the classified moment
  const momentFit = tastePassed.filter((t) => {
    const fit = t.context_fit ?? [];
    return fit.includes(moment_label) || fit.includes("lean_back");
  });

  const finalPool = momentFit.length > 0 ? momentFit : tastePassed;

  if (finalPool.length === 0) {
    tHardRule = performance.now() - t4;
    console.log(`[Timing] Bootstrap=${tBootstrap.toFixed(1)}ms | Taste=${tTaste.toFixed(1)}ms | GroqMoment=${tGroqMoment.toFixed(1)}ms | HardRule=${tHardRule.toFixed(1)}ms | Survival=${tSurvival.toFixed(1)}ms | ReasonLine=${tReasonLine.toFixed(1)}ms | OtherDB=${tOtherDB.toFixed(1)}ms | Total=${(performance.now() - tStart).toFixed(1)}ms`);
    return NextResponse.json({
      decision: "silence",
      trace: {
        candidates_in: candidates.length,
        taste: { passed: tastePassed.length, failed: tasteFailed.length },
        moment: { label: moment_label, confidence, reasoning, source },
        hard_rules: { fired: null },
        survival_ranking: [],
        pick_or_silence_cause: "no tracks survived all filters",
        session_id: sid,
        timing: { tBootstrap, tTaste, tGroqMoment, tHardRule, tSurvival, tReasonLine, tOtherDB, tTotal: performance.now() - tStart },
      },
    });
  }
  tHardRule = performance.now() - t4;

  const t5 = performance.now();
  // ── Filter 3: Proven (survival ranking) ──────────────────────────────────
  // Fetch survival stats for candidates
  const poolIds = finalPool.map((t) => t.id);
  const { data: survivalRows } = await supabase
    .from("track_survival_stats")
    .select("track_id, survival_rate")
    .in("track_id", poolIds);

  const survivalMap: Record<string, number> = {};
  for (const row of survivalRows ?? []) {
    survivalMap[(row as { track_id: string; survival_rate: number }).track_id] =
      (row as { track_id: string; survival_rate: number }).survival_rate;
  }

  // Rank by genuine survival rate first
  const withRates = finalPool.map((t) => {
    const baseRate = survivalMap[t.id] ?? t.survival_rate_similar_users ?? 0.5;
    return { ...t, _baseRate: baseRate };
  }).sort((a, b) => b._baseRate - a._baseRate);

  // Fix: Constrain jitter to ONLY shuffle among tracks within a top-N cluster
  // of near-tied survival_rate values (e.g. within 0.05 of the top score).
  const topRate = withRates[0]?._baseRate ?? 0;
  const topCluster = withRates.filter(t => (topRate - t._baseRate) <= 0.05);
  const remaining = withRates.filter(t => (topRate - t._baseRate) > 0.05);

  // Shuffle only the top cluster
  const shuffledTop = topCluster
    .map((t) => ({ ...t, _rate: t._baseRate + (Math.random() * 0.001) }))
    .sort((a, b) => b._rate - a._rate);

  const ranked = [...shuffledTop, ...remaining.map((t) => ({ ...t, _rate: t._baseRate }))];

  const pick = ranked[0];
  const survivalRanking = ranked.slice(0, 5).map((t) => ({ track_id: t.id, title: t.title, rate: t._rate }));
  tSurvival = performance.now() - t5;

  // ── Reason line ───────────────────────────────────────────────────────────
  const t6 = performance.now();
  let reasonLine: string;
  const isDefaultPick = pick.id === persona.default_track_id;

  if (isDefaultPick && is_fresh && persona.default_reason_line) {
    // Zero Groq calls on critical path for fresh session with default pick
    reasonLine = persona.default_reason_line;
  } else {
    reasonLine = await generateReasonLine(
      { title: pick.title, artist: pick.artist },
      persona.name,
      moment_label
    );
  }

  // Strip internal fields before returning
  const { _score: _s, _rate: _r, ...trackOut } = pick as typeof pick & { _score?: number; _rate?: number };
  void _s; void _r;

  tReasonLine = performance.now() - t6;
  console.log(`[Timing] Bootstrap=${tBootstrap.toFixed(1)}ms | Taste=${tTaste.toFixed(1)}ms | GroqMoment=${tGroqMoment.toFixed(1)}ms | HardRule=${tHardRule.toFixed(1)}ms | Survival=${tSurvival.toFixed(1)}ms | ReasonLine=${tReasonLine.toFixed(1)}ms | OtherDB=${tOtherDB.toFixed(1)}ms | Total=${(performance.now() - tStart).toFixed(1)}ms`);

  return NextResponse.json({
    decision: "card",
    track: trackOut,
    reason_line: reasonLine,
    trace: {
      candidates_in: candidates.length,
      taste: { passed: tastePassed.length, failed: tasteFailed.length },
      moment: { label: moment_label, confidence, reasoning, source },
      hard_rules: { fired: null },
      survival_ranking: survivalRanking,
      pick_or_silence_cause: "top survival rank after moment filter",
      session_id: sid,
      timing: { tBootstrap, tTaste, tGroqMoment, tHardRule, tSurvival, tReasonLine, tOtherDB, tTotal: performance.now() - tStart },
    },
  });
}
