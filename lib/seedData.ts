// lib/seedData.ts
// ─────────────────────────────────────────────────────────────
// Static seed — 10 tracks with VERIFIED live iTunes preview URLs.
// Phase 2 seed script will resolve all 62 Appendix A tracks and
// write them to Supabase. This file drives Phase 1 visuals only.
//
// iTunes artwork URL trick: replace `100x100bb` → `600x600bb`
// for high-res art (iTunes CDN serves it at any size).
// ─────────────────────────────────────────────────────────────

export type Track = {
  id: string;
  title: string;
  artist: string;
  preview_url: string;
  artwork_url: string;
  mood: string;
  energy: number; // 1–10
  context_fit: string[];
  role: "familiar_ishita" | "familiar_vaishnavi" | "familiar_haripriya" | "discovery";
  survival_rate_similar_users: number; // 0–1
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
  artwork_url: string;
  track_ids: string[];
};

export type Persona = {
  id: string;
  name: string;
  avatar_initial: string;
  avatar_color: string;
  default_moment: string;
  default_time: string;
  taste_description: string;
  playlist_ids: string[];
};

// ── 10 tracks with live preview URLs ─────────────────────────
const RAW_TRACKS: Track[] = [
  {
    id: "t1",
    title: "Kasoor",
    artist: "Prateek Kuhad",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c6/34/7f/c6347fe4-d2a8-bf5e-2ca5-7438cce63f93/mzaf_585381111877766094.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/29/ea/60/29ea6006-3c44-0fce-4b3b-f58a8c0e31c0/source/600x600bb.jpg",
    mood: "romantic",
    energy: 3,
    context_fit: ["wind_down", "study"],
    role: "familiar_ishita",
    survival_rate_similar_users: 0.72,
  },
  {
    id: "t2",
    title: "Baarishein",
    artist: "Anuv Jain",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/31/bd/c0/31bdc0d7-2ee6-74bc-b78c-a8be8723763c/mzaf_8072615351443966717.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/81/d1/2e/81d12e71-c993-272a-d559-5a1411f8d8ed/23UM1IM11036.rgb.jpg/600x600bb.jpg",
    mood: "melancholic",
    energy: 2,
    context_fit: ["wind_down", "rain"],
    role: "familiar_ishita",
    survival_rate_similar_users: 0.65,
  },
  {
    id: "t3",
    title: "Tum Hi Ho",
    artist: "Mithoon & Arijit Singh",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/38/de/b9/38deb942-d44a-f2bb-205c-ddf05be84693/mzaf_9747647124859107103.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/600x600bb.jpg",
    mood: "romantic",
    energy: 4,
    context_fit: ["wind_down", "commute"],
    role: "familiar_ishita",
    survival_rate_similar_users: 0.58,
  },
  {
    id: "t4",
    title: "double take",
    artist: "dhruv",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/ca/bb/49/cabb4939-5cc4-ccda-2619-b437ab7a1eae/mzaf_9177919611802198515.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/5f/ea/71/5fea71a9-7dbd-9a0c-fb8a-9f151f506f52/5056271652788.jpg/600x600bb.jpg",
    mood: "dreamy",
    energy: 4,
    context_fit: ["wind_down", "focus"],
    role: "discovery",
    survival_rate_similar_users: 0.61,
  },
  {
    id: "t5",
    title: "ceilings",
    artist: "Lizzy McAlpine",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/7b/52/b7/7b52b754-157a-6946-1a7f-3885d0d4b45f/mzaf_11031506980503485356.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/11/6a/64/116a64ee-0db3-4e59-bd86-f44008e47f85/5056167170006.jpg/600x600bb.jpg",
    mood: "dreamy",
    energy: 3,
    context_fit: ["focus", "wind_down"],
    role: "discovery",
    survival_rate_similar_users: 0.55,
  },
  {
    id: "t6",
    title: "Blinding Lights",
    artist: "The Weeknd",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/17/b4/8f/17b48f9a-0b93-6bb8-fe1d-3a16623c2cfb/mzaf_9560252727299052414.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/a6/6e/bf/a66ebf79-5008-8948-b352-a790fc87446b/19UM1IM04638.rgb.jpg/600x600bb.jpg",
    mood: "energetic",
    energy: 9,
    context_fit: ["commute", "workout"],
    role: "familiar_vaishnavi",
    survival_rate_similar_users: 0.74,
  },
  {
    id: "t7",
    title: "As It Was",
    artist: "Harry Styles",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/67/10/16/67101606-3869-ca44-6c03-e13d6322cb51/mzaf_1135399237022217274.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/600x600bb.jpg",
    mood: "upbeat",
    energy: 7,
    context_fit: ["commute", "lean_back"],
    role: "familiar_vaishnavi",
    survival_rate_similar_users: 0.69,
  },
  {
    id: "t8",
    title: "Apocalypse",
    artist: "Cigarettes After Sex",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/b1/43/b0/b143b0ee-863a-8f7c-3c56-a67110ef1591/mzaf_10438092015459317290.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/b3/5e/0f/b35e0fbe-2370-fc48-0f0c-977525e93bf2/720841214601_Cover.jpg/600x600bb.jpg",
    mood: "melancholic",
    energy: 2,
    context_fit: ["lean_back", "wind_down"],
    role: "familiar_haripriya",
    survival_rate_similar_users: 0.48,
  },
  {
    id: "t9",
    title: "Riptide",
    artist: "Vance Joy",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/1e/de/ea/1edeea50-c0f4-9d95-f0b8-b23a1af561db/mzaf_6343110017276582270.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7a/1c/65/7a1c6571-34e9-bb77-32be-90c72ba003c0/075679920355.jpg/600x600bb.jpg",
    mood: "joyful",
    energy: 6,
    context_fit: ["lean_back", "commute"],
    role: "familiar_haripriya",
    survival_rate_similar_users: 0.62,
  },
  {
    id: "t10",
    title: "Sofia",
    artist: "Clairo",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ab/07/c3/ab07c302-c230-3ea4-1b42-5106ac1fa63e/mzaf_10931443449617694693.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f2/47/06/f24706bc-a90c-f730-bd8a-586ddde8af3e/829299184631.jpg/600x600bb.jpg",
    mood: "dreamy",
    energy: 4,
    context_fit: ["lean_back", "wind_down"],
    role: "familiar_haripriya",
    survival_rate_similar_users: 0.53,
  },
];

// Guard: filter out any track with a falsy preview_url (E1-4)
export const SEED_TRACKS: Track[] = RAW_TRACKS.filter(
  (t) => !!t.preview_url && !!t.artwork_url
);

// ── Playlists ────────────────────────────────────────────────
export const SEED_PLAYLISTS: Playlist[] = [
  {
    id: "p1",
    name: "Liked Songs",
    description: "Songs you've liked",
    artwork_url: "https://misc.scdn.co/liked-songs/liked-songs-640.png",
    track_ids: ["t1", "t2", "t6", "t7"],
  },
  {
    id: "p2",
    name: "Late Night Drive",
    description: "For when the city's asleep",
    artwork_url: SEED_TRACKS.find(t => t.id === "t8")?.artwork_url ?? "",
    track_ids: ["t8", "t5", "t2", "t4"],
  },
  {
    id: "p3",
    name: "Morning Commute",
    description: "Get you moving",
    artwork_url: SEED_TRACKS.find(t => t.id === "t6")?.artwork_url ?? "",
    track_ids: ["t6", "t7", "t9"],
  },
  {
    id: "p4",
    name: "Focus Flow",
    description: "Deep work sessions",
    artwork_url: SEED_TRACKS.find(t => t.id === "t5")?.artwork_url ?? "",
    track_ids: ["t5", "t4", "t1"],
  },
];

// ── Personas ─────────────────────────────────────────────────
export const SEED_PERSONAS: Persona[] = [
  {
    id: "persona_ishita",
    name: "Ishita",
    avatar_initial: "I",
    avatar_color: "#7c3aed",
    default_moment: "wind_down",
    default_time: "9 PM Tue",
    taste_description: "Calm, mellow indie. Wind-down listener.",
    playlist_ids: ["p1", "p4"],
  },
  {
    id: "persona_vaishnavi",
    name: "Vaishnavi",
    avatar_initial: "V",
    avatar_color: "#0891b2",
    default_moment: "commute",
    default_time: "8:30 AM weekday",
    taste_description: "High-energy pop. Morning commuter.",
    playlist_ids: ["p3", "p1"],
  },
  {
    id: "persona_haripriya",
    name: "Haripriya",
    avatar_initial: "H",
    avatar_color: "#be185d",
    default_moment: "lean_back",
    default_time: "11 AM Sat",
    taste_description: "Eclectic lean-back listener. Weekend explorer.",
    playlist_ids: ["p2", "p4"],
  },
];

// ── Discovery track for the One Song In card (Phase 1 static) ─
// This is what the card shows in state A before Phase 2 goes live.
export const DISCOVERY_CARD_TRACK: Track =
  SEED_TRACKS.find((t) => t.id === "t4") ?? SEED_TRACKS[0];

// ── Quick-pick grid (6 tiles) ──────────────────────────────
export const QUICK_PICKS: Track[] = SEED_TRACKS.slice(0, 6);

// ── Rotation (initially empty, filled as user keeps tracks) ──
// Phase 1: static placeholder — 2 tracks already in rotation
export const SEED_ROTATION: Track[] = [
  SEED_TRACKS.find((t) => t.id === "t1")!,
  SEED_TRACKS.find((t) => t.id === "t3")!,
];
