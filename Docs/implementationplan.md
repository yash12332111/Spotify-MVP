# One Song In — Phase-wise Implementation Plan

> Derived from `architectureMVP.md` (v3). Each phase ends **deployable to Vercel**. Build in order; do not skip ahead.

---

## 🗺️ Bird's-eye view

| Phase | Name | Core Deliverable | Gate to move on |
|-------|------|-----------------|-----------------|
| **0** | Project scaffold & env | Next.js repo on Vercel, env vars wired, CI green | `GET /` returns 200 on the deployed URL |
| **1** | Spotify shell | Full chrome, audio player, card states — bundled JSON only | Two-second look-alike test; audio plays on 3 platforms |
| **2** | AI decision engine | Supabase seeded, Groq live, `/api/pick` returns real traces | All fallback tiers verified; session isolation confirmed |
| **3** | Signal loop | Keep/dismiss logged, picks change, survival visible | Entire loop mouse-operable on deployed URL |
| **4** | Blind-evaluator layer | Self-guiding, AI inspectable, zero demo chrome | Named cold tester passes 90-second test |

---

## Phase 0 — Project scaffold & environment

### What to build
- `npx create-next-app@latest ./` with TypeScript + Tailwind, App Router, `src/` off
- Folder skeleton: `app/`, `components/`, `lib/`, `scripts/`, `public/`, `Docs/`
- `.env.local` with all four secrets (dummy values locally, real values on Vercel):
  ```
  GROQ_API_KEY_PRIMARY=
  GROQ_API_KEY_SECONDARY=
  SUPABASE_URL=
  SUPABASE_SERVICE_KEY=
  ```
- `app/(shell)/layout.tsx` — empty shell wrapper
- `GET /api/health` → `{ status: "ok", ts: <ISO> }` (**must hit Supabase with a real query**, not just return JSON — otherwise it won't reset the 7-day pause timer)
- `.github/workflows/keep-alive.yml` — scheduled 2–3×/week July 6–15, calls both Supabase REST + `/api/health`
- Vercel project linked; env vars set in Vercel dashboard

### Edge cases & gotchas
| # | Risk | Mitigation |
|---|------|-----------|
| E0-1 | `SUPABASE_SERVICE_KEY` exposed in client bundle | Only import `@supabase/supabase-js` inside `lib/supabase.server.ts`; never `import` it from a `'use client'` file. Use `NEXT_PUBLIC_` prefix only for truly public values |
| E0-2 | Health check only hits Vercel edge, never Postgres | In Phase 0, `/api/health` must run a bare `SELECT 1` against Supabase — the `tracks` table does not exist until Phase 2's seed script runs. A bare `SELECT 1` is still real Postgres activity and still resets Supabase's 7-day pause timer. After Phase 2 seeds the `tracks` table, upgrade the query to `SELECT 1 FROM tracks LIMIT 1`. Document both forms in the README |
| E0-3 | Vercel free tier function timeout | All API routes must complete < 10s (Vercel Hobby limit). Set `export const maxDuration = 10` if needed |
| E0-4 | `SUPABASE_SERVICE_KEY` vs anon key confusion | Service key = bypass RLS (use in API routes only). Anon key = for the keep-alive GitHub Action's Supabase ping |
| E0-5 | Cold-start on first evaluator click | Keep-alive pings `/api/health` — this warms the Vercel function before evaluators arrive |

### Acceptance criteria
- [ ] `vercel --prod` deploys without errors
- [ ] `GET /api/health` on deployed URL → `200 { status: "ok" }` AND triggers a bare `SELECT 1` Postgres query (verify via Supabase dashboard logs; note: `tracks` table does not exist yet — do not query it here)
- [ ] No env secrets in `git log` or client bundle (`next build` → check `.next/static/`)

---

## Phase 1 — The Spotify shell

### What to build

#### 1A — App chrome
- **Phone frame:** `app/(shell)/layout.tsx` — centered `390px` container on desktop with dark backdrop; full-width on `< 640px`
- **Bottom tabs:** `components/BottomTabs.tsx` — Home / Search / Your Library with Lucide icons
- **Now-playing bar:** `components/NowPlayingBar.tsx` — docked above tabs; art thumbnail, title/artist, play/pause toggle, thin progress line. Pre-loaded with Ishita's "last played" (paused) from `lib/seedData.ts`
- **Top bar on Home:** profile avatar (left) + time-of-day greeting + filter chips (All / Music / Podcasts — visual only in Phase 1)

#### 1B — Home page (`app/page.tsx`)
- Time-aware gradient header (tint → `#121212`, ~240px)
- **Quick-pick 2×3 grid** — `components/QuickPickGrid.tsx` — `#2A2A2A` tiles, art left, label right
- **One Song In card slot** — above the fold, never displaces quick-picks
- **Three card states** (toggled via `?state=a|c|d` dev param, removed Phase 4):
  - **A — Card:** art, track, artist, reason line, [Add it in] / [Not now]
  - **C — Added:** micro-confirmation → card melts into rotation strip
  - **D — Silent:** no card; Home is pixel-normal
- **Rotation strip** — `components/RotationStrip.tsx` — horizontal scroll, "Your recent rotation"
- **"Made for you" shelf** — visual (static)

#### 1C — Other pages
- **Search (`app/search/page.tsx`):** text input + browse-genre color tile grid; input filters against `seedData` (title/artist match)
- **Library (`app/library/page.tsx`):** persona's playlists; tapping opens `PlaylistView` tracklist

#### 1D — Audio player
- `lib/player.tsx` — React context; single global `<audio>` element
- `play(track)` → stops current → sets src → calls `audio.play()` **in the same sync call stack as the tap** (no `await` before `.play()`)
- Auto-stop at clip end (listen to `onEnded`)
- Progress: `currentTime / duration` → width of thin bar

#### 1E — Seed data (`lib/seedData.ts`)
- Static TS object matching the Appendix A catalog schema but with real iTunes URLs for ~10 tracks (enough for Phase 1 visual fidelity). Full 62-track resolution happens in Phase 2 seed script.
- Include `preview_url`, `artwork_url`, `mood`, `energy`, `context_fit`, `role`

### Visual tokens (hard-coded — no improvisation)
```css
--bg:          #121212;
--surface:     #181818;
--raised:      #282828;
--tile:        #2A2A2A;
--green:       #1DB954;
--text-primary:#FFFFFF;
--text-muted:  #B3B3B3;
/* Font: Figtree (Google Fonts) or DM Sans — letter-spacing: -0.2px */
/* Radii: 8px cards, 4px tiles, 9999px buttons/avatar */
/* Bottom bar: #121212 @ 92% opacity + backdrop-blur */
```

### Edge cases & gotchas
| # | Risk | Mitigation |
|---|------|-----------|
| E1-1 | `audio.play()` returns a Promise; unhandled rejection crashes quietly | Always `.catch(err => showToast("Couldn't play this one"))` |
| E1-2 | iOS Safari blocks autoplay — even a delayed `.play()` after a user tap fails if there's any `await` in between | Call `audio.play()` synchronously in the tap handler. Preview URLs must be in state **before** the tap fires. No `fetch(previewUrl)` inside the tap |
| E1-3 | iOS first-tap audio unlock | On the user's very first tap anywhere in the app, do a muted `play()` + immediate `pause()` to unlock the audio context |
| E1-4 | Missing `preview_url` in seed data | Guard at `lib/seedData.ts`: filter out any track where `preview_url` is falsy before exposing it to any component |
| E1-5 | Two tracks overlap (user taps fast) | `lib/player.tsx` sets `audio.src = newUrl` — this implicitly stops the prior track. No extra stop call needed, but `audio.pause()` before `audio.src =` avoids the "interrupted" DOMException on some browsers |
| E1-6 | Progress bar NaN on load (duration not yet known) | Guard: `if (!isNaN(audio.duration) && audio.duration > 0)` before computing progress ratio |
| E1-7 | Phone frame breaks on 320px screens | Use `min-width: 320px` on the frame; let it go full-bleed below 390px rather than cut off |
| E1-8 | `?state=` dev param leaks to users in Phase 4 | Remove it cleanly in Phase 4; don't bake it into routing logic |
| E1-9 | Card "melts" into rotation strip animation causes layout shift | Animate with `opacity` + `max-height` transition, not `height` (avoids reflow). Or use `Framer Motion` `AnimatePresence` |
| E1-10 | Time-of-day greeting depends on client timezone | Use `new Date()` on the client (not server); hydration mismatch if rendered on server. Wrap in `useEffect` or mark the component `'use client'` |

### Acceptance criteria
- [ ] Deployed; phone frame at 390px; full-screen on mobile
- [ ] Screenshot passes "looks like Spotify" test at a glance
- [ ] All tabs navigate; Search filters by title/artist; Library playlists open
- [ ] Audio plays on desktop Chrome, Android Chrome, AND iOS Safari (deployed URL)
- [ ] No autoplay; second track stops first; missing-URL tracks never render; failures toast
- [ ] All three card states reachable via `?state=`; silent state = normal Home
- [ ] Fully mouse-operable on desktop
- [ ] Zero console errors; zero dead-end taps

---

## Phase 2 — The AI decision engine

### What to build

#### 2A — Seed script (`scripts/seed.ts`, run locally once)
For each of the 62 tracks in Appendix A:
1. Query iTunes Search API: `term="{track} {artist}"&media=music&limit=1&country=IN`
2. Cache `previewUrl` + `artworkUrl100` (upscale: replace `100x100bb` → `600x600bb` in URL)
3. **Verify**: `HEAD {previewUrl}` → 200 + `Content-Type: audio/*`. If fail → `playable=false`, log skip, continue
4. Write to `tracks` table. Acceptance: ≥55/62 playable
5. Seed `personas`, `persona_history`, `track_survival_stats`
6. For each persona's default pick: **one Groq call** → cache `default_reason_line` in `personas` table

#### 2B — Database schema (Supabase / Postgres)

**Seed tables (immutable after seed):**
```sql
tracks (
  id uuid PK,
  title text, artist text,
  preview_url text, artwork_url text,
  playable boolean,
  mood text, energy int, context_fit text[],
  role text,   -- familiar_ishita | familiar_vaishnavi | familiar_haripriya | discovery
  survival_rate_similar_users float
)

personas (
  id uuid PK,
  name text,
  taste_vector jsonb,          -- { calm:0.8, mellow:0.6, ... }
  default_moment text,         -- wind_down | lean_back | commute
  default_time text,           -- "21:00 Tue"
  default_reason_line text,    -- seed-time Groq cached
  default_track_id uuid FK tracks
)

persona_history (
  persona_id uuid FK,
  track_id uuid FK,
  play_count int
)

track_survival_stats (
  track_id uuid FK,
  survival_rate float          -- 0.15–0.75
)
```

**Session tables (mutable per evaluator):**
```sql
session_personas (
  session_id uuid,
  persona_id uuid FK,
  taste_vector jsonb,           -- copy of personas.taste_vector, mutated by signals
  throttle_multipliers jsonb,   -- { wind_down: 1.0, commute: 0.7, ... }
  last_active_at timestamptz
  PRIMARY KEY (session_id, persona_id)
)

session_signals (
  id uuid PK,
  session_id uuid,
  persona_id uuid FK,
  track_id uuid FK,
  action text,                  -- keep | dismiss | ignore
  created_at timestamptz
)

session_rotation (
  session_id uuid,
  persona_id uuid FK,
  track_id uuid FK,
  exposure_count int,
  survived boolean,
  last_exposed_at timestamptz
  PRIMARY KEY (session_id, persona_id, track_id)
)
```

#### 2C — Session bootstrap (`lib/session.ts`)
- Client generates `session_id = crypto.randomUUID()` on first load, stores in `localStorage`
- Sends `session_id` on every API call
- Server: if `session_id` missing OR `last_active_at > 24h` → bootstrap fresh session (copy persona defaults into session tables), return new `session_id`
- Every API call updates `last_active_at = now()`

#### 2D — `/api/pick` route
```
POST /api/pick
Body: { persona_id, session_id }
Response: {
  decision: "card" | "silence",
  track?: TrackRow,
  reason_line?: string,
  trace: {
    candidates_in: number,
    taste: { passed: number, failed: number },
    moment: { label, confidence, reasoning, source },
    hard_rules: { fired: string | null },
    survival_ranking: { track_id, rate }[],
    pick_or_silence_cause: string
  }
}
```

**Filter 1 — Taste (rules/math):**
- Fetch all `playable=true` `discovery` tracks
- Overlap score = dot product of `track.mood/energy weights` vs `session.taste_vector`
- Cut below threshold (e.g. 0.4)
- Label in trace: "overlap score" — narrate that this is what recommenders already do

**Filter 2 — Moment (Groq, always live):**
- Build context from the **persona's stored default context** (columns in the `personas` table) — never from the real client device. The evaluator's actual browser/device never enters the pick logic:
  - Ishita → `{ time_of_day: "21:00", day_of_week: "Tue", previous_session_type: "focus", gap_minutes: 4, device: "phone" }`
  - Vaishnavi → `{ time_of_day: "08:30", day_of_week: "weekday", previous_session_type: "commute", gap_minutes: 0, device: "car" }`
  - Haripriya → `{ time_of_day: "11:00", day_of_week: "Sat", previous_session_type: "lean_back", gap_minutes: 30, device: "phone" }`
- Prompt: strict JSON, temperature 0, `llama-3.3-70b-versatile`
- Response: `{ moment_label, confidence, reasoning }`
- **Three-tier resilience:**
  1. Try `GROQ_API_KEY_PRIMARY` with 2.5s timeout
  2. On 429/5xx/timeout → try `GROQ_API_KEY_SECONDARY`
  3. Both fail or total > 3s → deterministic fallback (time-of-day rules)
- Record `source: model_primary | model_secondary | fallback`
- **Hard rules (applied in code, never by the model):**
  - `moment_label ∈ { commute, focus, sleep, workout }` → silence
  - `confidence < 0.6` → silence

**Filter 3 — Proven:**
- Rank survivors by `track_survival_stats.survival_rate`
- Top track = pick

**Reason line:**
- If pick === `personas.default_track_id` AND session is freshly bootstrapped → serve `personas.default_reason_line` (zero Groq calls on critical path)
- Else → live Groq call (same key rotation); template fallback on failure
- Validate: reason line must reference the actual track/artist (not a hallucinated one)

#### 2E — Other API routes
- `GET /api/health` — real Postgres query (see Phase 0)
- `GET /api/personas` — return all 3 personas (id, name, default_moment, default_time)
- `GET /api/catalog` — return all `playable=true` tracks (for Home/Search/Library)

#### 2F — Frontend changes
- Replace `lib/seedData.ts` static JSON with `GET /api/catalog` on mount
- Home: `POST /api/pick` on mount → show skeleton shimmer → swap in live result
- **Instant first paint:** bundle static snapshot of Ishita's default state (the pre-computed `default_reason_line` + default track) in `lib/snapshot.ts`; render immediately, swap when live result arrives
- Cold-start guard: if `/api/pick` > 3s → keep showing snapshot; silent background retry; swap when it resolves

### Edge cases & gotchas
| # | Risk | Mitigation |
|---|------|-----------|
| E2-1 | iTunes rate limits during seed | Add `sleep(300ms)` between calls in seed script; run script once, never re-run against production |
| E2-2 | iTunes `previewUrl` is `http://` (not `https://`) | Upgrade all URLs to `https://` before storing; mixed-content blocks playback in browsers |
| E2-3 | Groq returns malformed JSON | Wrap parse in `try/catch`; validate with `zod`; fall back to deterministic on parse failure |
| E2-4 | Groq `temperature=0` still occasionally varies output | Use `response_format: { type: "json_object" }` in the Groq call to force JSON mode |
| E2-5 | Model exceeds 3s timeout — `fetch` doesn't honour `AbortController` by default | Use `AbortController` with `signal` on the fetch; catch `AbortError` explicitly to trigger the next tier |
| E2-6 | Both Groq keys are from the same account | Rate limit pool is shared — they add no real headroom. Must be **separate accounts**. Document this clearly |
| E2-7 | `session_id` in localStorage is cleared by Safari ITP | 24h TTL is already short enough that most evaluator sessions won't be affected; document as known limitation |
| E2-8 | Two parallel browser tabs share `session_id` (same browser) | Acceptable for evaluators (they're on one device). Document in README |
| E2-9 | Supabase pauses mid-evaluation | The keep-alive GH Action prevents this. But if it happens: first query takes ~30s to wake. The cold-start guard (show snapshot) covers this — evaluator never sees a hang |
| E2-10 | `default_reason_line` cached at seed time references wrong track | Validate at seed time: the Groq prompt must include `title` and `artist`, and the response must reference them. Log + manual fix if mismatch |
| E2-11 | Confidence threshold accidentally applied to the fallback tier | The `confidence < 0.6` hard rule must also apply to the fallback engine's confidence output (even if it's always 0.7 by default — document the default) |
| E2-12 | RLS on Supabase session tables allows cross-session reads | Disable RLS for service-key routes (they bypass it), but ensure the API routes always filter `WHERE session_id = $1` — never fetch all sessions |
| E2-13 | `/api/catalog` includes `preview_url` — never return unverified URLs | Query: `WHERE playable = true` — enforced in SQL, not application code |
| E2-14 | Hydration mismatch on snapshot → live swap | Use `useEffect` + `useState` for the live result; the snapshot is the SSR/initial render. Never SSR the live pick |

### Acceptance criteria
- [ ] Ishita → card with wind-down reason; trace shows `source: model_primary`
- [ ] Kill primary key → secondary serves; trace shows `source: model_secondary`
- [ ] Kill both keys → fallback serves; trace shows `source: fallback`; no UI breakage
- [ ] Vaishnavi → silence; trace shows `commute` classification + hard rule
- [ ] Weakened confidence (< 0.6) → silence, not card
- [ ] `/api/catalog` returns only `playable=true` tracks
- [ ] Two browsers → independent sessions; one dismiss never affects the other
- [ ] Forced commute + high confidence → still silence (hard rules in code, not model)
- [ ] First fresh session: zero Groq calls on critical path (verify via Supabase logs + network tab)
- [ ] Session with `last_active_at > 24h` → re-bootstraps at mid-journey state
- [ ] Slow 3G simulation: pick > 3s → snapshot holds, silent swap on resolution

---

## Phase 3 — The signal loop

### What to build

#### 3A — `POST /api/signal`
```
Body: { session_id, persona_id, track_id, action: "keep" | "dismiss" | "ignore" }
Response: { ok: true }
```
- Insert into `session_signals`
- **Asymmetric weight update** on `session_personas.taste_vector`:
  - `keep` → high weight shift toward kept track's mood/energy profile (e.g. `+0.15`)
  - `ignore` / passive → `+0.0` (no shift)
  - `dismiss` → mild negative (`-0.05`) on that moment-type frequency
- Both weights appear in trace on next `/api/pick` call

#### 3B — Dismiss throttling
- `session_personas.throttle_multipliers`: `{ wind_down: 1.0, commute: 0.7, ... }`
- 2 consecutive dismisses in same `moment_label` → multiply that slot's frequency by 0.5
- A keep → restore multiplier toward 1.0 (e.g. `* 1.2`, capped at 1.0)
- Throttle multiplier appears in trace
- Throttled silence: `decision: "silence"`, cause `"throttle"` in trace → frontend shows "Nothing new right now — why?" line

#### 3C — `POST /api/advance-day`
```
Body: { session_id, persona_id }
Response: { new_simulated_day: string }
```
- Increments simulated day counter in session
- Re-runs `/api/pick` logic internally (or client calls both in sequence)
- Updates `session_rotation.exposure_count` for the previously kept track

#### 3D — Rotation & survival (`GET /api/rotation`)
```
Query: ?session_id=&persona_id=
Response: { tracks: [{ ...TrackRow, exposure_count, survived, tag }] }
```
- `tag: "New to your rotation"` while `exposure_count < 3 && !survived`
- Tag drops once `survived = true`
- `survived = true` when `exposure_count >= 3` (no other path — there is no save action in the UI or signal API)

#### 3E — North Star stat
- `GET /api/rotation` → count of `survived = true` rows for this session/persona
- Shown on profile sheet: "N new songs joined your rotation this month"

#### 3F — Mid-journey seed state
- On **every fresh session bootstrap** (Phase 2's session logic), insert into `session_rotation`:
  - 1 track with `survived = true` (Ishita's rotation already has one survivor)
  - 1 track with `exposure_count = 2` (one advance-day away from surviving)
- This makes the payoff visible immediately — evaluator is not at t=0

#### 3G — Frontend changes
- `[Add it in]` → fires `POST /api/signal { action: "keep" }` → pushes track into now-playing bar + starts playback + triggers add animation → card melts into rotation strip
- `[Not now]` → fires `POST /api/signal { action: "dismiss" }` → card disappears → auto-fetches next pick
- **Header refresh glyph** (⟳ icon, always visible in Home header inside phone frame) → if a card is currently displayed and unacted, fire `POST /api/signal { action: "ignore" }` for that card's track first → then `POST /api/advance-day` → `POST /api/pick`
- Pull-to-refresh on touch → same sequence (ignore signal fires before advance-day if card is unacted)
- **Persona switch while card is displayed and unacted** → fire `POST /api/signal { action: "ignore" }` for the current card's track before fetching the new persona's pick. This ensures the zero-weight ignore row appears in traces and the asymmetric learning claim is demonstrable
- `RotationStrip` live: fetches `GET /api/rotation`, shows "New to your rotation" tag
- Silence "why?" line: if `decision: "silence"` → small text + tap opens trace sheet

### Edge cases & gotchas
| # | Risk | Mitigation |
|---|------|-----------|
| E3-1 | Double-tap on [Add it in] sends two signals | Disable button immediately on first tap; re-enable only on error |
| E3-2 | `audio.play()` after "Add it in" — same iOS unlock requirement | The tap handler that calls `POST /api/signal` must ALSO call `player.play(track)` synchronously. Don't `await` the signal call before playing |
| E3-3 | Taste vector drift — repeated keeps could push it to 1.0 | Cap each dimension at 1.0; floor at 0.0. Never allow NaN (guard division) |
| E3-4 | Consecutive dismiss count resets across sessions | `session_signals` is per-session — query last N signals for same `persona_id + moment_label` to compute consecutive count |
| E3-5 | Advance-day with no prior keep — rotation strip is empty | Show empty state: "Keep a song to start building your rotation" — never show a blank strip with no explanation |
| E3-6 | Parallel sessions both advance-day independently | Correct behavior — each session has its own rotation. Confirm this works (covered by E2-12 isolation check) |
| E3-7 | Pre-seeded `exposure_count = 2` track is the same as the current pick | Seed these as different tracks in the discovery pool; validate at seed time |
| E3-8 | "Nothing new right now — why?" line on throttled silence looks like a bug | Make the copy clearly sympathetic: "You've skipped a few recommendations — giving you a moment before suggesting more." Include ⓘ icon |
| E3-9 | Advance-day fires pick immediately, Groq call races with UI update | Show skeleton shimmer during the pick; disable the refresh glyph while loading |
| E3-10 | North Star goes to 0 if session is re-bootstrapped | North Star always reflects current session state — a fresh session starts at 1 (from the seeded survivor). This is correct and expected behavior |

### Acceptance criteria
- [ ] Keep → Advance-day → track re-surfaces in rotation strip
- [ ] Pre-seeded 2-exposure track → first advance → `survived = true` → North Star increments
- [ ] 2 wind-down dismisses → next wind-down open → silence → "why?" line present
- [ ] Keep → next pick measurably different (shifted weights visible in trace)
- [ ] Ignore → vector unchanged (verify in trace)
- [ ] Entire loop completable with mouse only on deployed URL
- [ ] Entire loop completable on mobile (touch) on deployed URL
- [ ] Parallel sessions: one evaluator's throttle never silences another's card

---

## Phase 4 — The blind-evaluator layer

### What to build

#### 4A — Landing state
- Remove `?state=` dev param entirely
- App always lands as Ishita with card live (bundled snapshot → live swap)
- No splash screen, no tutorial modal, no instructions

#### 4B — Two-beat coach mark (one-time, dismissible)
- **Beat 1:** on first card render → subtle pulsing tooltip on the card → "Spotify eased one new song in. Keep it or wave it off."
  - Dismiss: tap anywhere outside or the ✕ on the tooltip
  - Store dismissed state in `localStorage` (`coach_mark_1_done`)
- **Beat 2:** after first card interaction (keep OR dismiss) → subtle pulse on profile avatar → tooltip: "See how it behaves for other listeners."
  - Store dismissed state (`coach_mark_2_done`)
- Coach marks use `position: fixed` or CSS anchor positioning; never shift layout

#### 4C — Persona switcher (avatar → bottom sheet)
- Tap profile avatar → bottom sheet slides up
- Three rows: avatar, name, one-line context:
  - Ishita · "Post-study wind-down, Tuesday 9 PM"
  - Vaishnavi · "Weekday morning commute"
  - Haripriya · "Saturday lean-back afternoon"
- Footer: "Each listener demonstrates a different system state"
- Switching persona: update `persona_id` in state → `POST /api/pick` → update card
- **No page reload** — persona switch is in-session

#### 4D — "Why this song?" sheet
- Tapping the reason line (or a "Why this?" label below it) → bottom sheet
- Content (in plain words):
  1. **Taste match** — "Matched your taste profile" (what any recommender does)
  2. **Moment inference** — the model's verbatim `reasoning` from the trace, labeled: "Live Llama 3.3 inference · confidence: X%"
  3. Confidence bar (visual)
  4. **Proven with listeners** — `survival_rate_similar_users`% of similar listeners kept it
  5. For silence: which hard rule fired
  6. Closing: "A traditional recommender has no representation of this moment — every play looks the same to it."
- Style: Spotify's "About the artist" sheet aesthetic

#### 4E — `/about` route
Content (concise, honest):
- Problem in 3 sentences
- The 3 filters (taste / moment / proven)
- Why traditional recommenders are structurally insufficient (equal-play evidence, no moment model, wrong objective)
- What the AI does here (live moment inference, asymmetric intent learning, survival objective)
- What's simulated vs. what production would use
- Platform scope decision statement
- North Star metric
- Small changelog (iteration evidence)

#### 4F — Final fidelity pass
- Card entrance: `ease-in` animation, ~250ms
- Bottom sheet: spring physics (CSS `spring()` or Framer Motion)
- Tab transitions: cross-fade or slide
- Remove ALL `console.log` statements (search and delete)
- Remove `?state=` param
- Full responsive check: 320px / 390px / 428px / 768px / 1280px

#### 4G — README & operational docs
- Env var table
- Seed script instructions
- Cold test: name the tester; record result
- GitHub Action keep-alive: confirm it's scheduled and active

### Edge cases & gotchas
| # | Risk | Mitigation |
|---|------|-----------|
| E4-1 | Coach mark covers the card action buttons | Position tooltip above or below the card, never over the buttons. Test at 320px |
| E4-2 | Coach mark `localStorage` key conflicts between sessions | Key: `onesong_coach_1` / `onesong_coach_2` (namespaced) — cleared with session only if user explicitly resets |
| E4-3 | "Why this song?" sheet shows stale trace after a new pick | Store trace alongside the pick result in React state; sheet always reads from the current pick's trace |
| E4-4 | Persona switch while pick is loading → race condition | Cancel the in-flight `/api/pick` on persona switch (`AbortController`); start a new one |
| E4-5 | `/about` route is hard to discover | Link from the "Why this song?" sheet footer; also accessible via bottom tab or avatar sheet |
| E4-6 | Cold test tester uses a phone, not a laptop | The spec says laptop + mouse. Confirm the tester uses a laptop/desktop. If they struggle on mobile, that's a separate finding |
| E4-7 | Silence state is never discovered by cold tester | Coach mark Beat 2 (avatar pulse after first interaction) is the designed path. Verify it fires reliably |
| E4-8 | Both Groq keys removed → app should degrade silently | Test: remove both keys from Vercel env → fallback serves → `source: fallback` in trace → no visible breakage (reason line shows template, not empty) |
| E4-9 | "Why this song?" sheet model reasoning is too technical | Use plain English framing. Label the Groq output as "What the model noticed" not "JSON inference output" |
| E4-10 | Bottom sheet on desktop (mouse) has no swipe-to-dismiss | Add a close button (✕) AND click-outside-to-dismiss; swipe optional |
| E4-11 | Vercel preview URLs in the README are different from prod URL | README must link to production URL only (`onesong.vercel.app` or custom domain) |

### Acceptance criteria
- [ ] Named cold tester: mouse-only, deployed URL, states what the product does within 90s
- [ ] Silence state discoverable via coach mark Beat 2 → avatar → Vaishnavi
- [ ] "Why this song?" sheet renders live model reasoning, labeled as such
- [ ] Zero visible demo chrome (no `?state=` param, no debug overlays, no console logs)
- [ ] Both Groq keys removed → app degrades silently; trace shows `source: fallback`
- [ ] Clean screenshots usable for slides straight from the deployed app
- [ ] `/about` route accessible; content is accurate and honest about simulation scope
- [ ] Keep-alive GH Action is live and scheduled through July 15
- [ ] Deployed URL verified identical across Slide 9 (deck prototype link), README, and `/about`

---

## Cross-cutting concerns (apply to all phases)

### Reasoning trace — always a first-class output
Every `/api/pick` response carries:
```json
{
  "trace": {
    "candidates_in": 14,
    "taste": { "passed": 8, "failed": 6 },
    "moment": {
      "label": "wind_down",
      "confidence": 0.82,
      "reasoning": "Late Tuesday evening after a study session — low arousal, introspective...",
      "source": "model_primary"
    },
    "hard_rules": { "fired": null },
    "survival_ranking": [
      { "track_id": "...", "title": "Baarishein", "rate": 0.71 },
      { "track_id": "...", "title": "Apocalypse", "rate": 0.64 }
    ],
    "pick_or_silence_cause": "top survival rank after moment filter"
  }
}
```
This trace is surfaced in "Why this song?" and the `/about` page.

### Performance guardrails
- **First paint < 1s:** bundled snapshot in `lib/snapshot.ts` — static import, no network
- **Pick API < 3s P95:** cold-start guard on frontend (keep snapshot, silent swap)
- **No layout shift on swap:** snapshot and live result have identical DOM structure
- **Skeleton shimmer:** shown for the pick slot only during live fetch — not for the whole Home

### Security
- Service key NEVER in client bundle
- `session_id` is a random UUID — no session fixation possible
- All session queries filter `WHERE session_id = $1` — no cross-session data access
- No user auth — no PII collected, no GDPR surface

### Testing strategy per phase
| Phase | Minimum tests |
|-------|-------------|
| 1 | Visual diff (screenshot) + manual audio test on 3 browsers |
| 2 | API tests: all 3 Groq tiers + hard rules + session isolation (two browser tabs) |
| 3 | Signal loop test: keep → advance → re-surface; dismiss throttle; isolation |
| 4 | Cold test (named tester) + Groq key removal test + screenshot capture |

---

## Build order summary

```
Phase 0: Scaffold → Vercel deploy → health check with real Postgres query
  ↓
Phase 1: Spotify shell → bundled JSON → audio plays on 3 platforms
  ↓
Phase 2: Supabase seed → Groq live → /api/pick with full trace → all fallback tiers
  ↓
Phase 3: /api/signal → taste mutation → throttle → rotation → survival
  ↓
Phase 4: Coach marks → persona sheet → Why sheet → /about → cold test → submit
```

**Do not start Phase 2 until Phase 1's audio acceptance test passes on iOS Safari.**  
**Do not start Phase 4 until Phase 3's mouse-only loop is verified on the deployed URL.**

---

## Open questions (resolve before or during Phase 2)

> [!IMPORTANT]
> **Q1 — Groq secondary account:** Do you have a second separate Groq account for `GROQ_API_KEY_SECONDARY`? If not, create one before Phase 2 begins. Same-account keys share one rate limit pool.

> [!IMPORTANT]
> **Q2 — Supabase project:** Is the Supabase project already created? If yes, share the URL and confirm the service key is in Vercel env vars. If not, create it before Phase 2.

> [!NOTE]
> **Q3 — Custom domain:** Will you use a Vercel-generated URL (`*.vercel.app`) or a custom domain? This affects the README and any hardcoded URLs in `/about`.

> [!NOTE]
> **Q4 — Cold tester:** Who is the named cold tester for the Phase 4 acceptance criterion? Name them in the README once confirmed.

> [!NOTE]
> **Q5 — Submission deadline:** July 6 is the stated deadline. Phases 1–3 need to be complete by ~July 4–5 to leave buffer for Phase 4 polish and the cold test.
