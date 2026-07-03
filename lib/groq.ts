/**
 * lib/groq.ts
 * 3-tier Groq caller with AbortController timeouts (E2-5).
 * Tier 1: GROQ_API_KEY_PRIMARY  (2.5s timeout)
 * Tier 2: GROQ_API_KEY_SECONDARY (2.5s timeout)
 * Tier 3: deterministic fallback (returns null — caller handles it)
 */

import { z } from "zod";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const TIER_TIMEOUT_MS = 2500;

export type GroqSource = "model_primary" | "model_secondary" | "fallback";

export type MomentResult = {
  moment_label: string;
  confidence: number;
  reasoning: string;
  source: GroqSource;
};

const MomentSchema = z.object({
  moment_label: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

// Enable forced silence for contexts where recommendations shouldn't interrupt
export const SILENCE_MOMENT_LABELS = new Set<string>(["commute", "focus", "sleep", "workout"]);

async function callGroqTier(
  key: string,
  messages: { role: "system" | "user"; content: string }[],
  timeoutMs: number
): Promise<{ ok: true; content: string } | { ok: false }> {
  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        response_format: { type: "json_object" }, // E2-4
        messages,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { ok: false };
    return { ok: true, content };
  } catch {
    return { ok: false }; // timeout or network error
  }
}

/**
 * Classify the listener's moment using Groq.
 * Returns a MomentResult with source indicating which tier responded.
 */
export async function classifyMoment(
  personaContext: Record<string, string | number>,
  personaName: string
): Promise<MomentResult> {
  const systemPrompt = `You are a music moment classifier. Given a listener's context, classify their current listening moment and return ONLY valid JSON with keys: moment_label (string: one of wind_down, lean_back, commute, focus, sleep, workout, party), confidence (float 0-1), reasoning (string, 1-2 sentences in plain English).`;

  const userPrompt = `Listener: ${personaName}
Context: ${JSON.stringify(personaContext)}
Return JSON only.`;

  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const primaryKey = process.env.GROQ_API_KEY_PRIMARY ?? "";
  const secondaryKey = process.env.GROQ_API_KEY_SECONDARY ?? "";

  // Tier 1
  if (primaryKey) {
    const result = await callGroqTier(primaryKey, messages, TIER_TIMEOUT_MS);
    if (result.ok) {
      const parsed = safeParse(result.content);
      if (parsed) return { ...parsed, source: "model_primary" };
    }
  }

  // Tier 2
  if (secondaryKey && secondaryKey !== primaryKey) {
    const result = await callGroqTier(secondaryKey, messages, TIER_TIMEOUT_MS);
    if (result.ok) {
      const parsed = safeParse(result.content);
      if (parsed) return { ...parsed, source: "model_secondary" };
    }
  }

  // Tier 3 — deterministic fallback (E2-3, E2-11)
  return deterministicFallback(personaContext);
}

function safeParse(content: string): Omit<MomentResult, "source"> | null {
  try {
    const data = JSON.parse(content);
    return MomentSchema.parse(data);
  } catch {
    return null;
  }
}

function deterministicFallback(
  ctx: Record<string, string | number>
): MomentResult {
  const hour = parseInt(String(ctx.time_of_day ?? "12").split(":")[0], 10);
  const dayStr = String(ctx.day_of_week ?? "").toLowerCase();
  const isWeekend = dayStr.includes("sat") || dayStr.includes("sun");
  const sessionType = String(ctx.previous_session_type ?? "");

  let moment_label = "lean_back";
  let reasoning = "Default lean-back fallback — unable to reach AI model.";

  if (sessionType === "commute" || ctx.device === "car") {
    moment_label = "commute";
    reasoning = "Previous session was a commute — treating as commute context.";
  } else if (hour >= 22 || hour < 6) {
    moment_label = "sleep";
    reasoning = "Late night hours suggest a wind-down or sleep context.";
  } else if (hour >= 18 || (hour >= 20 && !isWeekend)) {
    moment_label = "wind_down";
    reasoning = "Evening hours after likely work or study — wind-down context.";
  } else if (sessionType === "focus") {
    moment_label = "focus";
    reasoning = "Previous session was focus — continuing focus context.";
  } else if (isWeekend && hour >= 10 && hour <= 16) {
    moment_label = "lean_back";
    reasoning = "Weekend afternoon — relaxed lean-back listening context.";
  }

  return {
    moment_label,
    confidence: 0.7, // default fallback confidence (E2-11: always >= threshold if moment is a card moment)
    reasoning,
    source: "fallback",
  };
}

/**
 * Generate a reason line for a picked track.
 * Falls back to a template on failure.
 */
export async function generateReasonLine(
  track: { title: string; artist: string },
  personaName: string,
  momentLabel: string
): Promise<string> {
  const primaryKey = process.env.GROQ_API_KEY_PRIMARY ?? "";
  const secondaryKey = process.env.GROQ_API_KEY_SECONDARY ?? "";

  const prompt = `Write a single short reason line (max 12 words, no quotes) explaining why Spotify surfaced "${track.title}" by "${track.artist}" for ${personaName} in a ${momentLabel.replace("_", " ")} moment. Must reference the track title OR the artist name. Return ONLY JSON: { "reason_line": "..." }`;

  const messages: { role: "system" | "user"; content: string }[] = [
    { role: "user", content: prompt },
  ];

  for (const key of [primaryKey, secondaryKey].filter(Boolean)) {
    const result = await callGroqTier(key, messages, TIER_TIMEOUT_MS);
    if (result.ok) {
      try {
        const data = JSON.parse(result.content);
        const reasonLine = z.object({ reason_line: z.string() }).parse(data).reason_line;
        // Validate it references track or artist (E2-10)
        const lower = reasonLine.toLowerCase();
        if (
          lower.includes(track.title.toLowerCase().split(" ")[0]) ||
          lower.includes(track.artist.toLowerCase().split(" ")[0])
        ) {
          return reasonLine;
        }
      } catch {
        continue;
      }
    }
  }

  // Template fallback
  return `"${track.title}" fits your ${momentLabel.replace("_", " ")} perfectly`;
}
