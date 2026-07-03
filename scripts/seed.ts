#!/usr/bin/env tsx
/**
 * scripts/seed.ts — run ONCE locally: npx tsx scripts/seed.ts
 *
 * 1. For each of the 62 tracks, query iTunes Search API → get previewUrl + artworkUrl
 * 2. HEAD-verify previewUrl (mark playable=false if bad)
 * 3. INSERT into tracks table
 * 4. INSERT personas, persona_history, track_survival_stats
 * 5. Groq call per persona → cache default_reason_line
 */

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import * as dotenv from "fs";
import * as path from "path";

// ── Load .env.local manually (tsx doesn't load it automatically) ──────────────
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = dotenv.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const [key, ...rest] = trimmed.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const GROQ_KEY_PRIMARY = process.env.GROQ_API_KEY_PRIMARY!;
const GROQ_KEY_SECONDARY = process.env.GROQ_API_KEY_SECONDARY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function queryiTunes(
  title: string,
  artist: string
): Promise<{ previewUrl: string | null; artworkUrl: string | null }> {
  const term = encodeURIComponent(`${title} ${artist}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=1&country=IN&media=music`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { resultCount: number; results: { previewUrl?: string; artworkUrl100?: string }[] };
    if (data.resultCount === 0) return { previewUrl: null, artworkUrl: null };
    const r = data.results[0];
    const rawPreview = r.previewUrl ?? null;
    const preview = rawPreview ? rawPreview.replace(/^http:\/\//, "https://") : null;
    const artwork = r.artworkUrl100
      ? r.artworkUrl100.replace("100x100bb", "600x600bb")
      : null;
    return { previewUrl: preview, artworkUrl: artwork };
  } catch {
    return { previewUrl: null, artworkUrl: null };
  }
}

async function verifyPlayable(url: string | null): Promise<boolean> {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    const ct = res.headers.get("content-type") ?? "";
    return res.ok && ct.startsWith("audio");
  } catch {
    return false;
  }
}

async function groqCall(prompt: string, keys: string[]): Promise<string | null> {
  for (const key of keys) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { choices: { message: { content: string } }[] };
      return data.choices?.[0]?.message?.content ?? null;
    } catch {
      continue;
    }
  }
  return null;
}

// ── Track catalogue (Appendix A) ──────────────────────────────────────────────

type TrackInput = {
  title: string;
  artist: string;
  mood: string;
  energy: number;
  context_fit: string[];
  role: "familiar_ishita" | "familiar_vaishnavi" | "familiar_haripriya" | "discovery";
  survival_rate: number;
};

const TRACKS: TrackInput[] = [
  // Ishita's familiar tracks (wind-down, calm, indie)
  { title: "Kasoor", artist: "Prateek Kuhad", mood: "romantic", energy: 3, context_fit: ["wind_down", "lean_back"], role: "familiar_ishita", survival_rate: 0.72 },
  { title: "cold/mess", artist: "Prateek Kuhad", mood: "melancholic", energy: 2, context_fit: ["wind_down", "focus"], role: "familiar_ishita", survival_rate: 0.68 },
  { title: "Kho Gaye Hum Kahan", artist: "Prateek Kuhad", mood: "dreamy", energy: 3, context_fit: ["wind_down", "focus"], role: "familiar_ishita", survival_rate: 0.65 },
  { title: "Baarishein", artist: "Anuv Jain", mood: "melancholic", energy: 3, context_fit: ["wind_down", "lean_back"], role: "familiar_ishita", survival_rate: 0.71 },
  { title: "MISHRI", artist: "Anuv Jain", mood: "dreamy", energy: 4, context_fit: ["wind_down", "lean_back"], role: "familiar_ishita", survival_rate: 0.63 },
  { title: "ceilings", artist: "Lizzy McAlpine", mood: "dreamy", energy: 3, context_fit: ["focus", "wind_down"], role: "familiar_ishita", survival_rate: 0.55 },
  { title: "Apocalypse", artist: "Cigarettes After Sex", mood: "melancholic", energy: 2, context_fit: ["lean_back", "wind_down"], role: "familiar_ishita", survival_rate: 0.48 },
  { title: "Lovers Rock", artist: "TV Girl", mood: "dreamy", energy: 5, context_fit: ["commute", "wind_down"], role: "familiar_ishita", survival_rate: 0.60 },
  { title: "Sweater Weather", artist: "The Neighbourhood", mood: "melancholic", energy: 6, context_fit: ["commute", "lean_back"], role: "familiar_ishita", survival_rate: 0.77 },

  // Vaishnavi's familiar tracks (commute, upbeat, pop)
  { title: "Blinding Lights", artist: "The Weeknd", mood: "energetic", energy: 9, context_fit: ["commute", "workout"], role: "familiar_vaishnavi", survival_rate: 0.74 },
  { title: "Starboy", artist: "The Weeknd", mood: "energetic", energy: 8, context_fit: ["workout", "commute"], role: "familiar_vaishnavi", survival_rate: 0.72 },
  { title: "Levitating", artist: "Dua Lipa", mood: "joyful", energy: 9, context_fit: ["workout", "party"], role: "familiar_vaishnavi", survival_rate: 0.81 },
  { title: "As It Was", artist: "Harry Styles", mood: "upbeat", energy: 7, context_fit: ["commute", "lean_back"], role: "familiar_vaishnavi", survival_rate: 0.69 },
  { title: "Watermelon Sugar", artist: "Harry Styles", mood: "joyful", energy: 7, context_fit: ["workout", "party"], role: "familiar_vaishnavi", survival_rate: 0.74 },
  { title: "Midnight City", artist: "M83", mood: "energetic", energy: 8, context_fit: ["commute", "workout"], role: "familiar_vaishnavi", survival_rate: 0.66 },
  { title: "Nightcall", artist: "Kavinsky", mood: "dreamy", energy: 7, context_fit: ["commute", "lean_back"], role: "familiar_vaishnavi", survival_rate: 0.68 },
  { title: "Alag Aasmaan", artist: "Anuv Jain", mood: "melancholic", energy: 4, context_fit: ["commute", "lean_back"], role: "familiar_vaishnavi", survival_rate: 0.70 },
  { title: "Channa Mereya", artist: "Arijit Singh", mood: "sad", energy: 5, context_fit: ["lean_back"], role: "familiar_vaishnavi", survival_rate: 0.85 },

  // Haripriya's familiar tracks (lean-back, weekend)
  { title: "Sofia", artist: "Clairo", mood: "dreamy", energy: 4, context_fit: ["lean_back", "wind_down"], role: "familiar_haripriya", survival_rate: 0.53 },
  { title: "Bags", artist: "Clairo", mood: "upbeat", energy: 6, context_fit: ["commute", "workout"], role: "familiar_haripriya", survival_rate: 0.50 },
  { title: "Riptide", artist: "Vance Joy", mood: "joyful", energy: 6, context_fit: ["lean_back", "commute"], role: "familiar_haripriya", survival_rate: 0.62 },
  { title: "Fix You", artist: "Coldplay", mood: "melancholic", energy: 4, context_fit: ["lean_back", "focus"], role: "familiar_haripriya", survival_rate: 0.82 },
  { title: "Someone Like You", artist: "Adele", mood: "melancholic", energy: 3, context_fit: ["wind_down", "lean_back"], role: "familiar_haripriya", survival_rate: 0.78 },
  { title: "The Night We Met", artist: "Lord Huron", mood: "melancholic", energy: 3, context_fit: ["lean_back", "wind_down"], role: "familiar_haripriya", survival_rate: 0.67 },
  { title: "Yellow", artist: "Coldplay", mood: "joyful", energy: 5, context_fit: ["lean_back", "focus"], role: "familiar_haripriya", survival_rate: 0.80 },
  { title: "Fast Car", artist: "Tracy Chapman", mood: "dreamy", energy: 5, context_fit: ["commute", "lean_back"], role: "familiar_haripriya", survival_rate: 0.73 },
  { title: "Mr. Brightside", artist: "The Killers", mood: "energetic", energy: 8, context_fit: ["commute", "workout"], role: "familiar_haripriya", survival_rate: 0.76 },

  // Discovery tracks (shown in card / rotation)
  { title: "double take", artist: "dhruv", mood: "dreamy", energy: 4, context_fit: ["wind_down", "focus"], role: "discovery", survival_rate: 0.61 },
  { title: "Vanilla", artist: "dhruv", mood: "joyful", energy: 5, context_fit: ["lean_back", "commute"], role: "discovery", survival_rate: 0.58 },
  { title: "Glimpse of Us", artist: "Joji", mood: "melancholic", energy: 2, context_fit: ["wind_down", "lean_back"], role: "discovery", survival_rate: 0.64 },
  { title: "Sanctuary", artist: "Joji", mood: "melancholic", energy: 3, context_fit: ["wind_down", "lean_back"], role: "discovery", survival_rate: 0.59 },
  { title: "Before Us", artist: "Prateek Kuhad", mood: "romantic", energy: 3, context_fit: ["wind_down", "lean_back"], role: "discovery", survival_rate: 0.66 },
  { title: "Tum Jaoge Toh", artist: "Prateek Kuhad", mood: "melancholic", energy: 3, context_fit: ["wind_down", "focus"], role: "discovery", survival_rate: 0.62 },
  { title: "Golden Hour", artist: "JVKE", mood: "joyful", energy: 6, context_fit: ["lean_back", "commute"], role: "discovery", survival_rate: 0.70 },
  { title: "Dandelions", artist: "Ruth B.", mood: "dreamy", energy: 4, context_fit: ["wind_down", "lean_back"], role: "discovery", survival_rate: 0.57 },
  { title: "Death Bed", artist: "Powfu", mood: "dreamy", energy: 2, context_fit: ["wind_down", "focus"], role: "discovery", survival_rate: 0.53 },
  { title: "Let Her Go", artist: "Passenger", mood: "melancholic", energy: 4, context_fit: ["lean_back", "commute"], role: "discovery", survival_rate: 0.69 },
  { title: "Photograph", artist: "Ed Sheeran", mood: "romantic", energy: 4, context_fit: ["lean_back", "wind_down"], role: "discovery", survival_rate: 0.74 },
  { title: "Perfect", artist: "Ed Sheeran", mood: "romantic", energy: 5, context_fit: ["lean_back"], role: "discovery", survival_rate: 0.76 },
  { title: "Thinking Out Loud", artist: "Ed Sheeran", mood: "romantic", energy: 5, context_fit: ["lean_back"], role: "discovery", survival_rate: 0.73 },
  { title: "Heather", artist: "Conan Gray", mood: "melancholic", energy: 3, context_fit: ["wind_down", "focus"], role: "discovery", survival_rate: 0.67 },
  { title: "Astronomy", artist: "Conan Gray", mood: "melancholic", energy: 5, context_fit: ["lean_back", "commute"], role: "discovery", survival_rate: 0.61 },
  { title: "Lofi chill", artist: "lofi", mood: "dreamy", energy: 2, context_fit: ["focus", "study"], role: "discovery", survival_rate: 0.55 },
  { title: "Retrograde", artist: "James Blake", mood: "melancholic", energy: 3, context_fit: ["wind_down", "focus"], role: "discovery", survival_rate: 0.50 },
  { title: "Parachute", artist: "Cheryl Cole", mood: "romantic", energy: 5, context_fit: ["lean_back"], role: "discovery", survival_rate: 0.48 },
  { title: "Iris", artist: "Goo Goo Dolls", mood: "melancholic", energy: 6, context_fit: ["lean_back", "commute"], role: "discovery", survival_rate: 0.72 },
  { title: "Chasing Cars", artist: "Snow Patrol", mood: "melancholic", energy: 5, context_fit: ["lean_back", "wind_down"], role: "discovery", survival_rate: 0.70 },
  { title: "All of Me", artist: "John Legend", mood: "romantic", energy: 5, context_fit: ["lean_back"], role: "discovery", survival_rate: 0.75 },
  { title: "Say You Won't Let Go", artist: "James Arthur", mood: "romantic", energy: 5, context_fit: ["lean_back", "commute"], role: "discovery", survival_rate: 0.71 },
  { title: "Counting Stars", artist: "OneRepublic", mood: "upbeat", energy: 7, context_fit: ["commute", "workout"], role: "discovery", survival_rate: 0.65 },
  { title: "Demons", artist: "Imagine Dragons", mood: "melancholic", energy: 6, context_fit: ["lean_back", "commute"], role: "discovery", survival_rate: 0.68 },
  { title: "Radioactive", artist: "Imagine Dragons", mood: "energetic", energy: 8, context_fit: ["workout", "commute"], role: "discovery", survival_rate: 0.63 },
  { title: "Believer", artist: "Imagine Dragons", mood: "energetic", energy: 8, context_fit: ["workout", "commute"], role: "discovery", survival_rate: 0.66 },
  { title: "Shape of You", artist: "Ed Sheeran", mood: "upbeat", energy: 7, context_fit: ["commute", "workout"], role: "discovery", survival_rate: 0.79 },
  { title: "Señorita", artist: "Shawn Mendes", mood: "romantic", energy: 6, context_fit: ["lean_back", "commute"], role: "discovery", survival_rate: 0.72 },
  { title: "Treat You Better", artist: "Shawn Mendes", mood: "upbeat", energy: 7, context_fit: ["commute", "workout"], role: "discovery", survival_rate: 0.67 },
  { title: "Closer", artist: "The Chainsmokers", mood: "upbeat", energy: 7, context_fit: ["commute", "party"], role: "discovery", survival_rate: 0.69 },
  { title: "Something Just Like This", artist: "The Chainsmokers", mood: "upbeat", energy: 7, context_fit: ["commute", "lean_back"], role: "discovery", survival_rate: 0.68 },
];

// ── Persona definitions ────────────────────────────────────────────────────────

const PERSONAS = [
  {
    name: "Ishita",
    default_moment: "wind_down",
    default_time: "21:00 Tue",
    default_context: {
      time_of_day: "21:00",
      day_of_week: "Tue",
      previous_session_type: "focus",
      gap_minutes: 4,
      device: "phone",
    },
    taste_vector: { calm: 0.8, mellow: 0.6, romantic: 0.5, melancholic: 0.7, energetic: 0.1 },
    familiar_role: "familiar_ishita" as const,
    default_track_title: "Kasoor",
  },
  {
    name: "Vaishnavi",
    default_moment: "commute",
    default_time: "08:30 weekday",
    default_context: {
      time_of_day: "08:30",
      day_of_week: "weekday",
      previous_session_type: "commute",
      gap_minutes: 0,
      device: "car",
    },
    taste_vector: { calm: 0.2, mellow: 0.3, romantic: 0.3, melancholic: 0.4, energetic: 0.9 },
    familiar_role: "familiar_vaishnavi" as const,
    default_track_title: "Blinding Lights",
  },
  {
    name: "Haripriya",
    default_moment: "lean_back",
    default_time: "11:00 Sat",
    default_context: {
      time_of_day: "11:00",
      day_of_week: "Sat",
      previous_session_type: "lean_back",
      gap_minutes: 30,
      device: "phone",
    },
    taste_vector: { calm: 0.5, mellow: 0.7, romantic: 0.6, melancholic: 0.6, energetic: 0.4 },
    familiar_role: "familiar_haripriya" as const,
    default_track_title: "Sofia",
  },
];

// ── Main seed function ─────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...\n");

  // 1. Seed tracks
  const trackIdMap: Record<string, string> = {}; // title → uuid
  let playableCount = 0;
  let failCount = 0;

  for (const t of TRACKS) {
    await sleep(300); // E2-1: rate limit guard
    console.log(`🎵 [${TRACKS.indexOf(t) + 1}/${TRACKS.length}] ${t.title} — ${t.artist}`);

    const { previewUrl, artworkUrl } = await queryiTunes(t.title, t.artist);
    const playable = await verifyPlayable(previewUrl);

    if (!playable) {
      console.warn(`  ⚠️  Not playable — marking playable=false`);
      failCount++;
    } else {
      playableCount++;
    }

    const { data, error } = await supabase
      .from("tracks")
      .insert({
        title: t.title,
        artist: t.artist,
        preview_url: previewUrl ?? null,
        artwork_url: artworkUrl ?? null,
        playable,
        mood: t.mood,
        energy: t.energy,
        context_fit: t.context_fit,
        role: t.role,
        survival_rate_similar_users: t.survival_rate,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  ❌ DB error: ${error.message}`);
      continue;
    }
    trackIdMap[t.title] = data.id;
    console.log(`  ✅ Inserted (${playable ? "playable" : "NOT playable"})`);
  }

  console.log(`\n📊 Tracks: ${playableCount}/${TRACKS.length} playable\n`);
  if (playableCount < 55) {
    console.warn(`⚠️  Below acceptance threshold of 55 — check iTunes API and retry`);
  }

  // 2. Seed track_survival_stats
  for (const t of TRACKS) {
    const id = trackIdMap[t.title];
    if (!id) continue;
    await supabase.from("track_survival_stats").insert({ track_id: id, survival_rate: t.survival_rate });
  }
  console.log("✅ track_survival_stats seeded\n");

  // 3. Seed personas
  const personaIdMap: Record<string, string> = {};
  const groqKeys = [GROQ_KEY_PRIMARY, GROQ_KEY_SECONDARY].filter(Boolean);

  for (const p of PERSONAS) {
    const defaultTrackId = trackIdMap[p.default_track_title] ?? null;

    // Groq call for default_reason_line (E2-10: validate title+artist in response)
    let defaultReasonLine: string | null = null;
    const defaultTrack = TRACKS.find((t) => t.title === p.default_track_title);
    if (defaultTrackId && defaultTrack && groqKeys.length > 0) {
      console.log(`🤖 Groq → reason line for ${p.name} (${p.default_track_title})...`);
      const prompt = `You are a music intelligence assistant. Write a single short reason line (max 12 words) explaining why Spotify surfaced "${defaultTrack.title}" by "${defaultTrack.artist}" for a listener named ${p.name} in this moment: ${JSON.stringify(p.default_context)}. The reason must reference the track name or artist name. Return ONLY JSON: { "reason_line": "..." }`;
      const raw = await groqCall(prompt, groqKeys);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const reasonLine = z.object({ reason_line: z.string() }).parse(parsed).reason_line;
          // Validate it mentions the track or artist (E2-10)
          const lower = reasonLine.toLowerCase();
          if (
            lower.includes(defaultTrack.title.toLowerCase()) ||
            lower.includes(defaultTrack.artist.toLowerCase().split(" ")[0])
          ) {
            defaultReasonLine = reasonLine;
            console.log(`  ✅ Reason line: "${reasonLine}"`);
          } else {
            console.warn(`  ⚠️  Reason line validation failed — using fallback template`);
            defaultReasonLine = `Because "${defaultTrack.title}" matches your ${p.default_moment.replace("_", " ")} mood`;
          }
        } catch {
          defaultReasonLine = `Because "${defaultTrack.title}" matches your ${p.default_moment.replace("_", " ")} mood`;
        }
      } else {
        defaultReasonLine = `Because "${defaultTrack.title}" matches your ${p.default_moment.replace("_", " ")} mood`;
        console.warn(`  ⚠️  Groq failed — using fallback reason line`);
      }
    } else {
      defaultReasonLine = `Because "${defaultTrack?.title ?? p.default_track_title}" matches your ${p.default_moment.replace("_", " ")} mood`;
    }

    const { data, error } = await supabase
      .from("personas")
      .insert({
        name: p.name,
        taste_vector: p.taste_vector,
        default_moment: p.default_moment,
        default_time: p.default_time,
        default_context: p.default_context,
        default_reason_line: defaultReasonLine,
        default_track_id: defaultTrackId,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  ❌ Persona insert error: ${error.message}`);
      continue;
    }
    personaIdMap[p.name] = data.id;
    console.log(`✅ Persona ${p.name} inserted (id: ${data.id})\n`);
  }

  // 4. Seed persona_history (familiar tracks)
  for (const p of PERSONAS) {
    const personaId = personaIdMap[p.name];
    if (!personaId) continue;
    const familiarTracks = TRACKS.filter((t) => t.role === p.familiar_role);
    for (const t of familiarTracks) {
      const trackId = trackIdMap[t.title];
      if (!trackId) continue;
      await supabase.from("persona_history").insert({ persona_id: personaId, track_id: trackId, play_count: Math.floor(Math.random() * 80) + 20 });
    }
    console.log(`✅ persona_history for ${p.name} (${familiarTracks.length} tracks)`);
  }

  // 5. Print persona IDs for snapshot.ts
  console.log("\n\n======= COPY INTO lib/snapshot.ts =======");
  for (const [name, id] of Object.entries(personaIdMap)) {
    const persona = PERSONAS.find((p) => p.name === name)!;
    const defaultTrackId = trackIdMap[persona.default_track_title] ?? "UNKNOWN";
    console.log(`${name}: persona_id="${id}"  default_track_id="${defaultTrackId}"`);
  }
  console.log("=========================================\n");

  console.log("🎉 Seed complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
