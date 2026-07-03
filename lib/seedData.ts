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
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/60/d3/e9/60d3e9b3-4991-16bd-1468-ce522245c9e2/cover.jpg/600x600bb.jpg",
    mood: "romantic",
    energy: 4,
    context_fit: ["wind_down", "lean_back"],
    role: "familiar_ishita",
    survival_rate_similar_users: 0.68,
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
  {
    id: "t11",
    title: "Kho Gaye Hum Kahan",
    artist: "Prateek Kuhad",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/22/e9/56/22e95688-b15a-cd1d-8469-9451231ec849/mzaf_11658240031865818317.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/14/b8/58/14b85883-40a4-0a2e-de65-130f55726ee6/840780180390.png/600x600bb.jpg",
    mood: "dreamy",
    energy: 3,
    context_fit: ["wind_down", "focus"],
    role: "discovery",
    survival_rate_similar_users: 0.65,
  },
  {
    id: "t12",
    title: "Alag Aasmaan",
    artist: "Anuv Jain",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e1/49/50/e1495025-5284-a4a8-ad1c-69a1b7f14e44/mzaf_12862430826759059478.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/fe/3e/8b/fe3e8be2-dc7d-92e0-827c-dda09361f21d/23UM1IM18353.rgb.jpg/600x600bb.jpg",
    mood: "melancholic",
    energy: 4,
    context_fit: ["commute", "lean_back"],
    role: "discovery",
    survival_rate_similar_users: 0.70,
  },
  {
    id: "t13",
    title: "Channa Mereya",
    artist: "Arijit Singh",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/d5/f9/98/d5f998a7-0090-ee2d-03f8-557ad6c5bf65/mzaf_14251357991592637728.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bc/6e/4d/bc6e4d0c-adec-b431-7b60-16f5689f9664/886446201597.jpg/600x600bb.jpg",
    mood: "sad",
    energy: 5,
    context_fit: ["lean_back"],
    role: "discovery",
    survival_rate_similar_users: 0.85,
  },
  {
    id: "t14",
    title: "Bags",
    artist: "Clairo",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/67/b9/3d/67b93d4e-07cb-cd11-7d64-88762c42a230/mzaf_15744728589488284514.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f2/47/06/f24706bc-a90c-f730-bd8a-586ddde8af3e/829299184631.jpg/600x600bb.jpg",
    mood: "upbeat",
    energy: 6,
    context_fit: ["commute", "workout"],
    role: "discovery",
    survival_rate_similar_users: 0.50,
  },
  {
    id: "t15",
    title: "Starboy",
    artist: "The Weeknd",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3f/a0/ba/3fa0ba5b-088d-bcf2-e4bd-355a5d505617/mzaf_3355567893400963384.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg",
    mood: "energetic",
    energy: 8,
    context_fit: ["workout", "commute"],
    role: "discovery",
    survival_rate_similar_users: 0.72,
  },
  {
    id: "t16",
    title: "Levitating",
    artist: "Dua Lipa",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/62/94/9b/62949b03-9781-6390-b92b-cc0b1028d4aa/mzaf_12215438708882988206.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/25/cd/d4/25cdd423-4a23-1913-04ed-921a58cccb7d/190295000639.jpg/600x600bb.jpg",
    mood: "joyful",
    energy: 9,
    context_fit: ["workout", "party"],
    role: "discovery",
    survival_rate_similar_users: 0.81,
  },
  {
    id: "t17",
    title: "Someone Like You",
    artist: "Adele",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/02/95/51/0295517b-1007-d266-4cee-2cabe9c416fd/mzaf_10614083181149885552.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/f8/df/0a/f8df0ac9-ae76-9dae-86d3-4e913fc54fb1/634904152062.png/600x600bb.jpg",
    mood: "melancholic",
    energy: 3,
    context_fit: ["wind_down", "lean_back"],
    role: "discovery",
    survival_rate_similar_users: 0.78,
  },
  {
    id: "t18",
    title: "Fix You",
    artist: "Coldplay",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e5/42/e3/e542e340-a45c-695e-e0b8-6155e222ebc0/mzaf_14955746616030397665.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/0c/82/48/0c8248a8-4a5b-d30d-8056-f32d650d2fc9/190295978068.jpg/600x600bb.jpg",
    mood: "melancholic",
    energy: 4,
    context_fit: ["lean_back", "focus"],
    role: "discovery",
    survival_rate_similar_users: 0.82,
  },
  {
    id: "t19",
    title: "Lovers Rock",
    artist: "TV Girl",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/b3/b5/f8/b3b5f8a3-6bae-fc72-70c9-3ab54e5fa281/mzaf_5828376612481938129.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/3d/09/0c/3d090c87-f02b-3c3c-cedf-603cc900082f/888174780955_cover.jpg/600x600bb.jpg",
    mood: "dreamy",
    energy: 5,
    context_fit: ["commute", "wind_down"],
    role: "discovery",
    survival_rate_similar_users: 0.60,
  },
  {
    id: "t20",
    title: "Sweater Weather",
    artist: "The Neighbourhood",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8c/37/20/8c372047-2727-8054-9411-0e4867643dd8/mzaf_10169659262182214119.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/28/71/00/287100fb-5c31-0195-5343-e6b3625886d0/886443969834.jpg/600x600bb.jpg",
    mood: "melancholic",
    energy: 6,
    context_fit: ["commute", "lean_back"],
    role: "discovery",
    survival_rate_similar_users: 0.77,
  },
  {
    id: "t21",
    title: "Midnight City",
    artist: "M83",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/55/88/0d/55880d99-1994-1bc7-9bd6-54e9c7d4c9dc/mzaf_6149147725312271683.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/5b/f3/4b/5bf34b53-c1f5-bf0e-1492-59c4e2dae012/cover.jpg/600x600bb.jpg",
    mood: "energetic",
    energy: 8,
    context_fit: ["commute", "workout"],
    role: "discovery",
    survival_rate_similar_users: 0.66,
  },
  {
    id: "t22",
    title: "Lofi chill",
    artist: "lofi",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/f1/eb/27/f1eb27e3-8abb-cd84-126d-cb2ac204c593/mzaf_15578638438573847692.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/77/e7/62/77e76204-b898-91fc-b1ae-6a5104787ff4/4550757550731_cover.png/600x600bb.jpg",
    mood: "dreamy",
    energy: 2,
    context_fit: ["focus", "study"],
    role: "discovery",
    survival_rate_similar_users: 0.55,
  },
  {
    id: "t23",
    title: "Nightcall",
    artist: "Kavinsky",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/0a/de/fd/0adefd5b-145a-1cc9-f3b5-be89fd0232b9/mzaf_4322553693875273982.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/c1/2d/fe/c12dfe8f-cdf6-e179-d69a-8ec35f760266/00602537248681.rgb.jpg/600x600bb.jpg",
    mood: "dreamy",
    energy: 7,
    context_fit: ["commute", "lean_back"],
    role: "discovery",
    survival_rate_similar_users: 0.68,
  },
  {
    id: "t24",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    preview_url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/16/86/f5/1686f50d-8b77-7e32-85f7-5f0e804d68fe/mzaf_14195633304344507287.plus.aac.p.m4a",
    artwork_url: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2b/c4/c9/2bc4c9d4-3bc6-ab13-3f71-df0b89b173de/886448022213.jpg/600x600bb.jpg",
    mood: "joyful",
    energy: 7,
    context_fit: ["workout", "party"],
    role: "discovery",
    survival_rate_similar_users: 0.74,
  }
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
