# Project Journey: Building "One Song In"

This document outlines the entire development journey of the "One Song In" prototype over the course of today's sessions. It details the prompts provided, the architectural decisions made, and the features built, phase by phase.

---

## Phase 2: The AI Decision Engine

**Prompt:**
> *"Lets start phase 2 using @Docs/implementationplan.md"*

**What we built:**
The goal of Phase 2 was to bring the AI brain to life. We implemented the core decision engine that decides *if* and *what* to recommend to the user right now.

1. **The `/api/pick` Endpoint:** We built the main API route that receives the current persona and session ID, and uses the **Groq Llama 3.3 model** to infer the user's exact context (e.g., "winding down after studying" vs "working hard"). 
2. **Contextual Silence:** If the AI determines the user is doing something where they shouldn't be interrupted (like Haripriya in deep focus), it returns a "silence" state.
3. **Resiliency:** We implemented a 3-tier fallback system. If the primary AI call fails or takes too long, it falls back to a faster model, and eventually to a deterministic JSON fallback, ensuring the app never breaks for the user.
4. **Instant First Paint:** We wired `page.tsx` to instantly show a cached track on load, and then concurrently swap it out with the live AI pick if it arrives in under 3 seconds.

---

## Phase 2.5: UI Polish & Demo Adjustments

**Prompts:**
> *"The hover box for the personas i have asked for is showing very cheaply, change the design and make it visible properly"*
> *"When I change personas quickyly, the one song in doesnt change or it shows no suggestions at the moment, why that is happening, and we dont want that to happen right"*
> *"dude it is suggesting the same song for all the 3 users!!! keep it changing for the demo purpose atleast"*

**What we built:**
A prototype needs to demo well. Based on these prompts, we tightened the experience:
1. **Premium Tooltip:** We built a highly visible, bouncing green tooltip that points at the avatar to ensure users know they can switch personas.
2. **Demo Jitter:** In a real production system, the same song might be recommended multiple times if it's the mathematical best fit. For a demo, that looks broken. We introduced mathematical "jitter" (randomness) into the ranking algorithm in `/api/pick` so that rapidly switching between personas reliably serves up fresh tracks.
3. **Race Condition Fixes:** We fixed issues where mashing the persona switcher caused overlapping API calls that resulted in blank screens.

---

## Phase 3: The Signal Loop (Asymmetric Learning)

**Prompt:**
> *"Lets start with phase 3 using @Docs/implementationplan.md"*

**What we built:**
Phase 3 was about making the app learn. When a user interacts with the app, we need to track that intent.

1. **New API Routes:** We created `/api/signal` to record user actions (Keep, Dismiss, Ignore), `/api/advance-day` to simulate time passing, and `/api/rotation` to fetch the user's current long-term rotation.
2. **Interactive Cards:** We rewired the `OneSongCard.tsx` component. When a user taps "Add it in", it plays the track synchronously (getting around iOS audio restrictions), visually melts into an "Added" state, and fires a `keep` signal to the database. Tapping "Not now" fires a `dismiss` signal and auto-loads the next song.
3. **The Refresh Button (⟳):** We wired the refresh button to simulate a day advancing. It fires an `advance-day` command to the backend, aging the user's interactions and promoting songs they kept into their long-term rotation.
4. **Live Rotation Strip:** We updated the `RotationStrip.tsx` component to stop showing hardcoded seed data, and instead dynamically fetch and render tracks that have successfully survived in the database.

---

## Phase 4: The Blind-Evaluator Layer

**Prompt:**
> *"Lets start phase 4 from @Docs/implementationplan.md"*

**What we built:**
Phase 4 wrapped the entire prototype in a consumer-friendly shell so that someone opening the link blind would understand what the app does without a presentation.

1. **Coach Marks:** We added a two-beat tooltip system. Beat 1 introduces the core mechanic ("Spotify eased one new song in..."). Once they interact, Beat 2 points them to the avatar to switch personas.
2. **Persona Context Sheet:** Instead of the avatar instantly swapping the UI without warning, we built a sleek `PersonaSheet` bottom sheet that explains *who* the personas are and what their context is (e.g., "Vaishnavi · Weekday morning commute").
3. **"Why this song?" Sheet:** We made the subtext under the song tappable. It opens a sheet that pulls back the curtain, showing the exact AI trace, the Llama 3.3 confidence score, the survival rate of the track, and an explanation of why the track was chosen (or why the system decided to stay silent).
4. **The `/about` Page:** We added a static page explaining the philosophy of the app: The problem with traditional recommenders, the 3-filter architecture, asymmetric learning, and the North Star metric.

---

## Final Polish

**Prompt:**
> *"I stil want to see the hover box which shows click here to see the different personas"*

**What we built:**
During Phase 4, the initial plan called for replacing the large green tooltip with the smaller "Beat 2" coach mark. To accommodate this request, we restored the large, highly visible green bouncing tooltip, ensuring maximum visibility for the persona-switching feature while maintaining all the new Phase 4 architecture.

---

## Miscellaneous Bug Fixes & Hotfixes

Throughout the session, we also tackled several critical operational fixes to ensure the Vercel deployment was stable and presentation-ready:

**Prompts / Issues:**
> *"21:40:54.579 Running build in Washington, D.C... Type error: Cannot find name 'useMemo'."*
> *"not working as expected, check the code and let me know what is going wrong"* (Regarding broken image links)

**What we built / fixed:**
1. **Build Failures:** The initial deployment to Vercel crashed due to missing React hooks (like `useMemo` and `useEffect`) in `page.tsx` and `OneSongCard.tsx`. We tracked down all Type mismatches and missing imports, ran `npx tsc --noEmit` locally, and resolved all errors to achieve a green build.
2. **Broken Spotify Images:** The initial prototype hardcoded image URLs directly from Spotify (`i.scdn.co`). These URLs expire frequently, which led to broken image icons in the Rotation Strip and the Now Playing Bar. We fixed this by updating the fallback states to use verified, persistent image URLs (from our `ISHITA_SNAPSHOT` payload) ensuring the UI always looks polished.
3. **Double-Tap Protection:** We added state-locks (`addDisabled`, `dismissDisabled`) to the card buttons so that impatient clicking during demos wouldn't fire duplicate database requests or crash the component state.

---

### Conclusion
Over a single day, this prototype went from a static frontend shell to a fully dynamic, AI-powered system complete with live inference, database state management, learning loops, and consumer-grade UX polish.
