# One Song In — MVP Prototype Architecture (v3)

**Purpose:** A deployed, functional Spotify-mirror app demonstrating the One Song In solution end-to-end: the no-intent open, the AI-inferenced three-filter pick, the confidence-gated card (including the silent state), the keep-vs-dismiss signal loop, and rotation survival.

**The bar this is built against (brief + evaluator feedback):**
1. **"Looks like the real thing."** Reads as Spotify within two seconds — full app chrome, real songs that audibly play.
2. **Blind evaluation.** Three mentors open the link cold, alone, likely **on laptops**. The prototype must be self-explanatory in 90 seconds with a mouse — no narration, no phone required.
3. **AI-native, demonstrably.** The brief requires showing why traditional recommendation systems are insufficient and what AI unlocks. The AI must be *visible in the prototype* — a live model inference the evaluator can inspect — not only claimed in the deck.
4. **Deployed to production with real infrastructure:** public URL, real database connection, session handling.

**What this is:** Demo-fidelity data (simulated personas and histories) running **real logic and real AI inference** server-side. **What it is NOT:** real Spotify accounts, OAuth, or live listening history — `/about` states this honestly, alongside what the production version would use.

---

## Stack (v3 — single deployment, no Render)

**Free-tier feasibility, checked directly (not assumed):** every layer runs on its free tier at this project's scale. Vercel Hobby (free forever, no card, non-commercial use — a grad project qualifies) — function duration limits sit well above the ~3s this app ever needs. Supabase Free (500MB, 7-day-inactivity pause, handled via the keep-alive workflow). Groq Free (~1,000 requests/day on llama-3.3-70b-versatile) — comfortable for a handful of evaluators across the ~9-day window. iTunes Search API — free, keyless. No paid tier is required anywhere in this architecture.

| Layer | Choice | Why |
|---|---|---|
| App | **One Next.js app on Vercel** — frontend + API routes (the backend, deployed to production) | No second host, one deploy. Note: Vercel functions still cold-start (shorter than Render, not zero) — mitigated below, not eliminated |
| Database | **Supabase free tier (Postgres)** | Real persistent DB — seeded data survives forever (no ephemeral-disk problem); demonstrates a genuine database connection, which is explicitly credited in evaluation |
| AI | **Groq — llama-3.3-70b-versatile (never downgrade)** for (1) moment classification, always live, and (2) reason-line generation, **split by risk** — cached at seed time for each persona's default pick (zero runtime dependency on first load), generated live only for picks the evaluator causes through interaction (keep → next pick, persona switch to a new track). **Two-key fallback from SEPARATE Groq accounts** (see note below) before dropping to the deterministic fallback; trace records `source: model_primary | model_secondary | fallback` | The brief's "AI-native" requirement, live and inspectable, without putting two LLM calls on the critical first-impression path |
| Audio | **iTunes Search API 30-second previews of real songs**, played through our own native HTML5 player | Real recognizable tracks that genuinely play; keyless, free |
| Sessions | **Per-evaluator session state** — `session_id` in localStorage; all mutable state (taste vectors, throttles, signals, rotation) is copied per-session on first visit. Shared seed tables are immutable. **24h TTL:** `last_active_at` on session rows; if >24h since last activity, the client drops its local `session_id` and bootstraps fresh on next request — same mid-journey hero state re-seeded, no manual cleanup job needed at this scale | Three blind mentors never contaminate each other's experience; a returning evaluator (e.g. during the July 12–15 results window) never walks into their own earlier dismiss-throttle mess — they land on the same hero state as a first-time visitor; also demonstrates session thinking |
| Form factor | Mobile-first phone screen; on desktop, centered in a phone frame on a dark backdrop — **with all interactions mouse-operable** | Evaluators use laptops |
| Env vars | `GROQ_API_KEY_PRIMARY`, `GROQ_API_KEY_SECONDARY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — four secrets, all on Vercel. **Important:** Groq rate limits apply at the organization/account level, not per key — the secondary key must come from a genuinely separate Groq account to add any real headroom. With ~1,000 requests/day on the free tier and a handful of evaluators over ~9 days, quota exhaustion is unlikely regardless; the two-key setup mainly protects against a transient outage or a bad/revoked key, not rate-limit pressure | Minimal surface, honestly-scoped resilience |

**Personas:** 3 seeded listeners — **Ishita** (Tue 9 PM post-study → card fires), **Vaishnavi** (weekday commute → silence), **Haripriya** (Sat lean-back → card fires, different mood). Evaluator lands as Ishita. Persona switching hides inside the **profile avatar** (native pattern, not demo chrome).

**Operational notes (documented in README):**
- **Supabase pause — exact mechanics:** free projects pause after **7 consecutive days of no database activity**. Critically, this means real queries reaching Postgres — NOT dashboard visits, NOT cached API responses, and NOT traffic that only touches Vercel. A frontend view alone does not reset the timer. Data is preserved on pause (not deleted); on the next real query the project takes ~30s to resume — an unacceptable hang if it happens to land on an evaluator's first click.
- **Why this matters for us specifically:** submission is July 6, results July 12–15 — a 6–9 day window of unpredictable, sparse evaluator traffic. One quiet stretch inside that window is enough to trigger a pause right before someone opens the link.
- **Fix — a scheduled GitHub Action, not a Vercel-side ping:** a small cron workflow (`.github/workflows/keep-alive.yml`) that calls (1) the Supabase REST endpoint directly (e.g. `GET {SUPABASE_URL}/rest/v1/tracks?limit=1` with the anon key) AND (2) the deployed Vercel `/api/health` route, 2–3x/week from July 6 through July 15. (1) is a genuine database query, so it actually resets Supabase's pause timer — a health check that only hits Vercel does not, since that route can respond without ever touching Postgres. (2) keeps the Vercel function warm, reducing (not eliminating) cold-start latency for the first evaluator of the day. Costs nothing, ~10 minutes to set up, disable after results are out.
- **Cold-start timeout guard (client-side):** if the live `/api/pick` call exceeds ~3s (a cold Vercel function stacked with a cold Groq call), the frontend does NOT spin — it keeps showing the bundled snapshot and silently retries once in the background, swapping in the live result when it lands. The evaluator never sees a stall, worst case the demo pick is a beat "stale" before invisibly refreshing.
- **No backups on the free plan.** Take one manual export (`Table Editor → Export` or `supabase db dump`) the night before submission, purely as insurance.
- Groq latency (~0.5–1.5s) is the only "slow" step: the card slot shows a Spotify-authentic skeleton shimmer during the pick, and the rest of Home renders instantly.
- **Instant first paint:** the frontend bundles a static snapshot of Ishita's default state (catalog slice + one pre-computed pick + reason line) so the app is fully visual immediately; it swaps to the live API result when it arrives. The evaluator never waits to see the product.

**Carried through every phase:** the reasoning trace is a first-class API output — candidates in, per-filter results, the model's moment reasoning verbatim, confidence, hard-rule checks, pick or silence cause, and `source: model_primary|model_secondary|fallback`. Surfaced in-product as **"Why this song?"**.

---

## Phase 1 — The Spotify shell (a real-feeling app, deployable Day 1)

### Objective
A phone-frame Spotify mirror an evaluator would momentarily mistake for the real app: full chrome, working navigation, working audio player, all card states. Runs on bundled seed JSON — no DB or AI yet.

### Features to implement
- **App chrome (the frame is the identity):**
  - Bottom tab bar: Home / Search / Your Library
  - **Now-playing bar** docked above the tabs: art thumbnail, title/artist, play/pause, thin progress line. Present from first load (seeded "last played," paused)
  - Top bar: profile avatar (left), time-of-day greeting, filter chips (All / Music / Podcasts — visual)
  - Time-aware gradient header (tint fading to #121212)
- **Home:** Spotify's actual **quick-pick 2×3 grid** (art left, label right, #2A2A2A tiles) — the familiar surface the card sits above; One Song In card slot above the fold, never displacing quick-picks; "Your recent rotation" strip; "Made for you" shelf (visual)
- **Search:** input + browse-genre color-tile grid; input functional against the local catalog (title/artist match)
- **Library:** persona's playlists (art, name, "Playlist · Ishita"); tapping opens a tracklist view
- **Audio player (core to "functional"):** one global HTML5 audio via React context. Tapping ANY track — quick-pick, playlist row, search result, card — loads its 30s preview into the now-playing bar and plays. Auto-stop at clip end (progress bar completes naturally)
- **Audio reliability rules (hard requirements — violations are bugs):**
  1. **Never autoplay.** Audio starts ONLY inside a user tap handler — never on load, route change, persona switch, or card render. The `audio.play()` call runs in the same synchronous call stack as the tap (an `await` between tap and play voids the gesture — preview URLs must already be in client state before the tap)
  2. **No track without a URL.** Missing/empty `preview_url` → the track is excluded from rendering entirely; guard at the data layer
  3. **Failure is visible, never silent.** Always `.catch()` the play promise; on failure show a brief toast ("Couldn't play this one"), never a `playing` UI with no sound
  4. **One audio element** owned by the player context — starting a track stops the previous; no overlaps
  5. **iOS unlock:** prime the audio element (muted play+pause) on the user's first tap anywhere
- **One Song In card — three states** (dev param `?state=a|c|d`, removed in Phase 4):
  - A **Card:** art, track, artist, reason line, [Add it in] / [Not now] — tapping the art plays the preview through the now-playing bar
  - C **Added:** confirmation micro-state → card melts into the rotation strip
  - D **Silent:** no card; Home is pixel-normal — visibly boring, by design
  - *(The former "expanded card" state is cut: the collapsed card + now-playing bar already tell the story; scope without payoff.)*

### Visual token spec (so Antigravity can't improvise generic)
- Background #121212 · surface #181818 · raised #282828 · quick-pick tile #2A2A2A
- Green #1DB954, sparingly (accents/active states only)
- Text #FFFFFF primary, #B3B3B3 secondary · Font: Figtree or DM Sans, letter-spacing −0.2px (Circular stand-in)
- Radii: 8px cards, 4px quick-pick tiles, full-round buttons/avatar
- Gradient header ~240px · Bottom bar #121212 @ 92% + backdrop blur

### Components
`app/(shell)/layout.tsx` (chrome + phone frame) · `app/page.tsx` · `app/search/page.tsx` · `app/library/page.tsx` · `NowPlayingBar` · `BottomTabs` · `QuickPickGrid` · `OneSongCard` · `RotationStrip` · `PlaylistView` · `lib/player.tsx` · `lib/seedData.ts`

### Backend / DB / AI
None yet (bundled JSON).

### Dependencies
`next`, `tailwindcss`.

### Acceptance criteria
- [ ] Deployed on Vercel; phone app at 390px, framed on desktop, native full-screen on mobile
- [ ] Two-second test: a screenshot could pass for Spotify at a glance
- [ ] All tabs navigate; Search filters; Library playlists open and play
- [ ] **Audible-on-devices test:** real sound from a tap on desktop Chrome, Android Chrome, AND iOS Safari — on the deployed URL, not localhost
- [ ] Nothing attempts play without a tap; second track stops the first; broken-URL tracks never render; failures toast, never fake-play
- [ ] All card states reachable; silent state = pixel-normal Home; card never displaces familiar content
- [ ] **Everything mouse-operable on desktop** — no touch-only interactions
- [ ] No console errors; no dead-end taps

---

## Phase 2 — The AI decision engine (Supabase + Groq live)

### Objective
API routes running the genuine three-filter engine with a **real model inference at its center**: given persona + session, return one pick with a full reasoning trace, or an explicit silence decision. Frontend switches from bundled JSON to the API (keeping the bundled snapshot for instant first paint).

### Features to implement
- **One-time seed script** (`scripts/seed.ts`, run locally, writes to Supabase): catalog from Appendix A — resolves iTunes preview URLs + artwork (`country=IN`), **verifies every preview URL with a HEAD/range request (200 + audio content-type) before marking `playable=true`**; unplayable tracks are excluded from the catalog and all pick pools, and listed in the seed log (log-and-skip, never invent a URL; acceptance ≥55/62). Also seeds: personas, listening-history taste profiles, time-slot patterns, per-track `survival_rate_similar_users` (0.15–0.75, 2–3 clear leaders per pool), **and a one-time Groq call per persona generating and caching their default reason line** (`personas.default_reason_line`) — so the first-impression pick never depends on a runtime Groq call
- **Session bootstrap + TTL:** first request with no/expired `session_id` → copy mutable persona state (taste vectors, throttle multipliers, rotation, signal log) into fresh session-scoped rows, `last_active_at = now()`. Every subsequent request updates `last_active_at`. If a request arrives with a `session_id` whose `last_active_at` is >24h old, treat it as expired: bootstrap a new session (same mid-journey seed state) rather than resuming stale throttle/dismiss history. Seed tables are never mutated
- **Filter 1 — Taste (rules/math, and labeled as such):** overlap score between persona taste vector and each track; cut below threshold. *Deliberately conventional — the trace narrates that this part is what recommenders already do*
- **Filter 2 — Moment (the AI inference, always live):** context `{time_of_day, day_of_week, previous_session_type, gap_minutes, device}` → **Groq llama-3.3-70b-versatile** returns `{moment_label, confidence, reasoning}` (strict JSON, temperature 0). **Three-tier resilience:** try `GROQ_API_KEY_PRIMARY` → on error (429/5xx/timeout) retry once immediately on `GROQ_API_KEY_SECONDARY` (a **separate Groq account** — same-account keys share one rate-limit pool and add no real headroom) → only if both fail or total time exceeds 3s, fall back to the deterministic rules engine. Trace records `source: model_primary | model_secondary | fallback` so which tier served the request is always visible, not just whether AI was used at all. In practice, at this project's traffic volume the free tier's ~1,000 requests/day makes quota exhaustion unlikely — this mainly guards against a transient outage or one bad key
  - Hard rules applied **after** classification, in code (never delegated to the model, on any tier): moment ∈ {commute, focus, sleep, workout} → silence; confidence < 0.6 → silence
- **Filter 3 — Proven:** rank survivors by `survival_rate_similar_users`; top pick wins
- **Reason line — split by risk:** the persona's **default** pick (first load, any freshly-bootstrapped session) serves the seed-time cached `default_reason_line` — zero runtime Groq dependency on the highest-risk moment. A **live** Groq call (same trace-constrained prompt, same primary→secondary key rotation as Filter 2) generates a new reason line only when the pick itself is new because of evaluator interaction — after a keep/advance-day cycle, or a persona switch landing on a track not already cached. Template fallback on failure either way. Data-true is non-negotiable
- **Deterministic contexts:** each persona carries a default "now" (Ishita → Tue 9 PM post-focus; Vaishnavi → weekday 8:30 AM car); persona switch = context switch. Client time may nudge the greeting only
- **Trace in every response:** candidates in → taste pass/fail counts → moment label + confidence + model reasoning + source → hard-rule checks → survival ranking → pick or silence cause

### Frontend changes
- Home consumes `POST /api/pick`; card slot shows skeleton shimmer during the Groq call; bundled snapshot renders instantly and swaps when live result arrives
- Catalog/playlists/search from `GET /api/catalog` (only `playable=true` rows)

### API routes
`GET /api/health` · `GET /api/personas` · `GET /api/catalog` · `POST /api/pick` `{persona_id, session_id}` → `{decision, track?, reason_line?, trace}`

### Database (Supabase)
Seed tables: `tracks`, `personas` (incl. `default_reason_line`, seed-time cached), `persona_history`, `track_survival_stats`. Session tables: `session_personas` (taste vector, per-moment throttle, `last_active_at`), `session_signals`, `session_rotation`.

### External integrations
iTunes Search API (seed-time only, local script) · Groq API (request-time: moment classification + reason line).

### Dependencies
`@supabase/supabase-js`, `groq-sdk` (or plain fetch), `zod` (validate model JSON).

### Acceptance criteria
- [ ] Ishita → calm pick, wind-down reason line, trace shows the model's actual reasoning with `source: model_primary` (or `model_secondary` if primary was rate-limited)
- [ ] Kill BOTH Groq keys → everything still works on fallback; trace shows `source: fallback`; no user-visible breakage
- [ ] Kill only the primary key → requests succeed via secondary; trace shows `source: model_secondary`, confirming rotation actually works and isn't just specified
- [ ] Vaishnavi → silence; trace shows commute classification + which hard rule fired
- [ ] Confidence threshold demonstrably real (weakened pattern flips pick → silence)
- [ ] `/api/catalog` returns only verified-playable tracks; seed log lists exclusions
- [ ] Two parallel sessions (two browsers) never affect each other's picks or state
- [ ] Model never bypasses hard rules: a forced "commute + high confidence" context still returns silence
- [ ] First load of a fresh session serves the default pick with zero Groq calls in the critical path (verify via network tab / server logs); a live Groq call only fires after evaluator interaction
- [ ] A session with `last_active_at` >24h old is treated as expired: next request bootstraps a new session at the same mid-journey hero state, not the old throttled/dismissed state
- [ ] Slow-network simulation (throttle to Slow 3G): pick call exceeding 3s never shows a stalled/spinning card — bundled snapshot holds, then silently swaps

---

## Phase 3 — The signal loop (the part that proves the root cause gets fixed)

### Objective
Keeps and dismisses are logged per-session, the next pick demonstrably changes, dismiss-throttling works, and added songs re-surface and survive into rotation — all reachable by a mouse-only evaluator within one short session.

### Features to implement
- **Signals:** `POST /api/signal` `{session_id, persona_id, track_id, action: keep|dismiss|ignore}`
- **Asymmetric learning (the thesis, as a visible number):** `keep` shifts the session taste vector toward the kept track with high weight; `ignore`/passive ≈ zero. Both weights appear in the trace
- **Dismiss throttling:** 2 consecutive dismisses in a moment-type → that moment's frequency multiplier drops (future opens more likely silent); a keep raises it. Multiplier in trace
- **Re-surfacing & survival:** kept tracks reappear in the rotation strip across simulated days; 3+ exposures or a save → `survived`; survived-count per persona = the live North Star
- **Advancing the day — dual affordance (mouse-first):** pull-to-refresh on touch, AND an always-visible **refresh glyph in the Home header** ("Next open") inside the phone frame for desktop. Each advance = a new no-intent open on a new simulated day
- **Mid-journey seeded state (so the payoff is visible immediately):** Ishita's session starts with 1 song already survived (visible in rotation + North Star = 1) and 1 kept song at 2 exposures — one advance-day away from surviving. The evaluator lands inside a *working* system, not at t=0 of an empty one
- "Add it in" also pushes the track into the now-playing bar and starts playback (the accept must feel like a play, not a form submit)
- **Silence is always explained:** any silent Home — hard-rule silence (Vaishnavi) or throttle-induced silence — carries the quiet "Nothing new right now — why?" line opening the trace sheet. Throttled silence must never look like a bug

### Frontend changes
- Card actions wired to `/api/signal`; header refresh + pull-to-refresh wired to advance-day + fresh pick
- `RotationStrip` live: re-surfacing tracks tagged "New to your rotation"; tag drops on survival
- Profile sheet stat: "N new songs joined your rotation this month" (the North Star, worn as product)

### API routes
`POST /api/signal` · `POST /api/advance-day` · `GET /api/rotation?session_id&persona_id`

### Database
Session tables gain: `session_rotation` (exposure_count, survived), `session_signals`, per-moment throttle columns.

### Acceptance criteria
- [ ] Keep → "Next open" → track re-surfaces; the pre-seeded 2-exposure track survives on first advance → North Star increments in front of the evaluator
- [ ] Two wind-down dismisses → next wind-down open silent, with the "why?" line present and accurate
- [ ] A keep measurably changes the next pick (shifted weights in trace); ignore leaves the vector unchanged
- [ ] Entire loop completable with mouse only, on the deployed URL, AND on a phone on mobile data
- [ ] Parallel sessions: one evaluator's dismissal-throttle never silences another evaluator's card

---

## Phase 4 — The blind-evaluator layer (self-explanatory without narration)

### Objective
An evaluator who opens the link cold, alone, on a laptop, understands the solution — including the AI — inside 90 seconds, with every affordance disguised as product.

### Features to implement
- **Land as Ishita, card live** (bundled snapshot instantly, live pick swaps in). No splash, no instructions
- **Two-beat coach mark (one-time, dismissible):** beat 1 on the card — "Spotify eased one new song in. Keep it or wave it off." Beat 2, after first card interaction, a subtle pulse + tooltip on the avatar — "See how it behaves for other listeners." This is the discovery path to the silence state; it cannot be left to luck
- **Persona switch via avatar:** bottom sheet, three listeners with one-line contexts ("Vaishnavi · weekday morning, driving"). Footer, one quiet line: "Each listener demonstrates a different system state"
- **"Why this song?" sheet (the AI, inspectable):** under the reason line → bottom sheet rendering the trace in plain words: taste match ("what any recommender does") → **the model's moment reasoning, verbatim, labeled as a live Llama 3.3 inference** with its confidence bar → proven-with-similar-listeners stat → for silence, which hard rule fired. One closing line of framing: "A traditional recommender has no representation of this moment — every play looks the same to it." Styled like Spotify's own "about this recommendation" patterns
- **`/about` route** (linked from the sheet footer): the problem in three sentences; the three filters; why traditional recommenders are structurally insufficient (equal-play evidence, no moment, wrong objective) and what the AI does here (live moment inference, asymmetric intent learning, survival objective); what's simulated vs. what production would use (honest scope); **platform scope, stated as a decision, not a gap** — "Built mobile-first: the no-intent open this solves for is overwhelmingly a phone moment. A production version would extend to desktop/web for cross-device continuity."; North Star; small changelog (the "evidence of iteration" check, satisfied in-product)
- Remove `?state=` dev switcher; final fidelity pass (card entrance ease-in, sheet spring, tab transitions); README: env vars, seed instructions, and the GitHub Action keep-alive workflow set up and scheduled to run through the results window (July 6–15)
- **Named cold test:** one person who has never seen the project (name them in the README) uses the deployed link, mouse-only, and must state what the product does within 90 seconds. If they can't, fix discovery before submission — do not skip this

### API routes
None new — Phase 4 is presentation.

### Database changes
None.

### Dependencies
None new.

### Acceptance criteria
- [ ] Cold, unnarrated, mouse-only walkthrough passed by the named tester
- [ ] Silence state is discoverable (coach-mark beat 2 → avatar) and always explained
- [ ] The AI is *visible*: an evaluator can read the model's live reasoning and the traditional-recommender contrast without leaving the app
- [ ] Zero visible demo chrome — every control reads as product
- [ ] Both Groq keys removed → app degrades silently to fallback with no visible breakage
- [ ] Clean screenshots for Canva Slides 8–9 straight from the deployed app

---

## Build order summary

| Phase | Deliverable | Demonstrates |
|---|---|---|
| 1 | Full Spotify shell, everything plays, card states | Looks and feels like the real thing |
| 2 | AI decision engine (Groq moment inference + reason lines) on Supabase, session-scoped | The mechanism is real — and demonstrably AI |
| 3 | Keep/dismiss loop, throttle, re-surfacing, survival — mouse-reachable, mid-journey seeded | The root cause actually gets fixed, visibly |
| 4 | Self-guiding blind-evaluator experience | The whole argument, discoverable alone in 90s |

Each phase ends deployable. Phase 2 is the minimum bar for "the logic is real and AI-native," Phase 3 for "the loop reverses," Phase 4 is what gets evaluated.

---

## Appendix A — Seed catalog (~60 real tracks)

**How the seed script uses this:** for each row, query the iTunes Search API (`term = "{track} {artist}"`, `media=music`, `limit=1`, `country=IN`), cache `previewUrl` + `artworkUrl100` (upscaled to 600×600 by URL substitution) in Supabase. **Verify every preview URL with a HEAD/range request (200 + audio content-type) before marking `playable=true`.** If a lookup or verification fails, **log and skip — never invent a URL**. Acceptance: ≥55 of 62 resolve; failures listed in the seed log.

**Tagging schema:**
- `mood`: calm · mellow · upbeat · energetic
- `energy`: 1–5
- `context_fit`: wind_down · lean_back · commute · workout · focus_adjacent
- `role`: `familiar_<persona>` (that persona's history — quick-picks and playlists) or `discovery` (the pool One Song In picks from)

Catalog skews Indian + global pop deliberately — the personas are Indian Premium users, and an India-authentic Home (Arijit next to The Weeknd) is part of the looks-real bar.

### Familiar — Ishita (post-study, calm/acoustic taste) — her quick-picks & playlists
| # | Track | Artist | Mood | Energy | Context fit |
|---|---|---|---|---|---|
| 1 | Kasoor | Prateek Kuhad | calm | 2 | wind_down, focus_adjacent |
| 2 | Tum Hi Ho | Arijit Singh | calm | 2 | wind_down |
| 3 | Channa Mereya | Arijit Singh | mellow | 2 | wind_down |
| 4 | Perfect | Ed Sheeran | calm | 2 | wind_down |
| 5 | Glimpse of Us | Joji | calm | 1 | wind_down, focus_adjacent |
| 6 | like i need u | keshi | mellow | 2 | wind_down |
| 7 | River Flows in You | Yiruma | calm | 1 | focus_adjacent |
| 8 | Nuvole Bianche | Ludovico Einaudi | calm | 1 | focus_adjacent |
| 9 | death bed (coffee for your head) | Powfu | mellow | 2 | focus_adjacent |
| 10 | Yellow | Coldplay | mellow | 2 | wind_down, lean_back |

### Familiar — Vaishnavi (commute pop, punchy)
| # | Track | Artist | Mood | Energy | Context fit |
|---|---|---|---|---|---|
| 11 | Blinding Lights | The Weeknd | energetic | 4 | commute |
| 12 | Believer | Imagine Dragons | energetic | 4 | commute, workout |
| 13 | Counting Stars | OneRepublic | upbeat | 3 | commute |
| 14 | As It Was | Harry Styles | upbeat | 3 | commute, lean_back |
| 15 | Circles | Post Malone | mellow | 3 | commute, lean_back |
| 16 | Sugar | Maroon 5 | upbeat | 3 | commute |
| 17 | Kesariya | Arijit Singh, Pritam | mellow | 3 | commute, lean_back |
| 18 | Levitating | Dua Lipa | upbeat | 4 | commute, workout |

### Familiar — Haripriya (weekend lean-back, indie pop)
| # | Track | Artist | Mood | Energy | Context fit |
|---|---|---|---|---|---|
| 19 | Riptide | Vance Joy | upbeat | 3 | lean_back |
| 20 | Best Friend | Rex Orange County | upbeat | 3 | lean_back |
| 21 | Bloom | The Paper Kites | calm | 2 | lean_back, wind_down |
| 22 | Everytime | boy pablo | mellow | 3 | lean_back |
| 23 | Chamber of Reflection | Mac DeMarco | mellow | 2 | lean_back |
| 24 | Talking to the Moon | Bruno Mars | mellow | 2 | lean_back, wind_down |
| 25 | Viva La Vida | Coldplay | upbeat | 3 | lean_back, commute |
| 26 | Easy On Me | Adele | mellow | 2 | lean_back, wind_down |

### Discovery pool — wind-down (Ishita's likely picks)
| # | Track | Artist | Mood | Energy | Context fit |
|---|---|---|---|---|---|
| 27 | Baarishein | Anuv Jain | calm | 2 | wind_down |
| 28 | Alag Aasmaan | Anuv Jain | calm | 2 | wind_down |
| 29 | cold/mess | Prateek Kuhad | calm | 2 | wind_down |
| 30 | Co2 | Prateek Kuhad | calm | 2 | wind_down, focus_adjacent |
| 31 | Khoj (Passing By) | When Chai Met Toast | mellow | 2 | wind_down, lean_back |
| 32 | Apocalypse | Cigarettes After Sex | calm | 1 | wind_down |
| 33 | Anchor | Novo Amor | calm | 1 | wind_down |
| 34 | Holocene | Bon Iver | calm | 1 | wind_down |
| 35 | Only Love | Ben Howard | calm | 2 | wind_down |
| 36 | double take | dhruv | calm | 2 | wind_down |
| 37 | ceilings | Lizzy McAlpine | calm | 2 | wind_down |
| 38 | Here With Me | d4vd | calm | 2 | wind_down |
| 39 | Cherry Wine (Live) | Hozier | calm | 1 | wind_down |
| 40 | Jo Tum Mere Ho | Anuv Jain | calm | 2 | wind_down |

### Discovery pool — lean-back (Haripriya's likely picks)
| # | Track | Artist | Mood | Energy | Context fit |
|---|---|---|---|---|---|
| 41 | Show Me How | Men I Trust | mellow | 2 | lean_back, wind_down |
| 42 | Alrighty Aphrodite | Peach Pit | mellow | 3 | lean_back |
| 43 | Goodie Bag | Still Woozy | mellow | 3 | lean_back |
| 44 | Time (You and I) | Khruangbin | mellow | 2 | lean_back |
| 45 | Kingston | Faye Webster | mellow | 2 | lean_back |
| 46 | Sofia | Clairo | mellow | 3 | lean_back |
| 47 | Falling Behind | Laufey | calm | 2 | lean_back, wind_down |
| 48 | Heat Waves | Glass Animals | mellow | 3 | lean_back, commute |
| 49 | Sunflower | Post Malone, Swae Lee | upbeat | 3 | lean_back, commute |
| 50 | Put Your Records On | Ritt Momney | mellow | 2 | lean_back |

### Discovery pool — upbeat/energetic (commute/workout adjacency + variety)
| # | Track | Artist | Mood | Energy | Context fit |
|---|---|---|---|---|---|
| 51 | Udd Gaye | Ritviz | energetic | 4 | commute, workout |
| 52 | Liggi | Ritviz | upbeat | 4 | commute |
| 53 | Brown Munde | AP Dhillon | energetic | 4 | commute, workout |
| 54 | Born to Shine | Diljit Dosanjh | energetic | 4 | commute, workout |
| 55 | Say So | Doja Cat | upbeat | 4 | commute |
| 56 | Feels | Calvin Harris | upbeat | 4 | commute, lean_back |
| 57 | The Less I Know the Better | Tame Impala | upbeat | 3 | lean_back, commute |
| 58 | Husn | Anuv Jain | mellow | 2 | wind_down, lean_back |
| 59 | Paris in the Rain | Lauv | mellow | 3 | lean_back, wind_down |
| 60 | Maand | Bayaan, Hasan Raheem, Rovalio | mellow | 2 | wind_down, lean_back |
| 61 | Choo Lo | The Local Train | mellow | 3 | lean_back, wind_down |
| 62 | Sang Rahiyo | Jasleen Royal | calm | 2 | wind_down |

**Why the discovery pools are shaped this way:** the demo's hero moment is Ishita's wind-down open, so that pool is deepest (14 tracks) — repeated keep → next-day → new-pick runs never repeat a song. The upbeat pool exists partly to prove the moment filter *excludes* things: the trace should show energetic candidates passing taste but failing moment for a 9 PM post-focus open.

**Survival stats seeding:** `survival_rate_similar_users` between 0.15–0.75 per discovery track, with 2–3 clear leaders per pool — makes Filter 3's ranking visible and deterministic in the trace.
