/**
 * lib/snapshot.ts
 * Static snapshot of Ishita's default state for instant first paint (2F).
 *
 * This is updated ONCE after the seed script runs with the real Supabase IDs.
 * The reason_line here is a placeholder — it will be overwritten once the
 * seed script outputs the cached Groq reason line.
 *
 * The UI renders this immediately (SSR-safe), then swaps in the live
 * /api/pick result when it arrives (useEffect, never SSR — E2-14).
 */

export type SnapshotTrack = {
  id: string;
  title: string;
  artist: string;
  artwork_url: string;
  preview_url: string;
  mood: string;
  energy: number;
  context_fit: string[];
  role: string;
  survival_rate_similar_users: number;
};

export type Snapshot = {
  persona_id: string;      // Ishita's Supabase UUID — updated after seed
  track: SnapshotTrack;
  reason_line: string;     // Pre-computed by Groq at seed time
  decision: "card";
};

/**
 * IMPORTANT: After running `npx tsx scripts/seed.ts`, copy the printed
 * persona_id and default_track_id into this object.
 *
 * Until seed runs, this uses seedData values so the UI still works.
 */
export const ISHITA_SNAPSHOT: Snapshot = {
  // Replace with real Supabase UUIDs after seed:
  persona_id: "REPLACE_AFTER_SEED",

  track: {
    id: "REPLACE_AFTER_SEED",
    title: "Kasoor",
    artist: "Prateek Kuhad",
    artwork_url:
      "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/60/d3/e9/60d3e9b3-4991-16bd-1468-ce522245c9e2/cover.jpg/600x600bb.jpg",
    preview_url:
      "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c6/34/7f/c6347fe4-d2a8-bf5e-2ca5-7438cce63f93/mzaf_585381111877766094.plus.aac.p.m4a",
    mood: "romantic",
    energy: 3,
    context_fit: ["wind_down", "lean_back"],
    role: "familiar_ishita",
    survival_rate_similar_users: 0.72,
  },

  // Updated after seed script outputs the Groq-generated reason line:
  reason_line: "Kasoor fits your wind-down perfectly",
  decision: "card",
};
