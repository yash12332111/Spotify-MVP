# One Song In — MVP Prototype

> A deployed, functional Spotify-mirror app demonstrating the One Song In solution end-to-end: no-intent open → AI-inferenced three-filter pick → confidence-gated card → keep/dismiss signal loop → rotation survival.

**Live demo:** _add your Vercel URL here after deploy_

---

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js 16 (App Router) on Vercel Hobby |
| DB | Supabase free tier (Postgres) |
| AI | Groq — llama-3.3-70b-versatile |
| Audio | iTunes Search API 30s previews |

---

## Environment variables

Set these in `.env.local` locally and in **Vercel → Settings → Environment Variables** before deploying:

| Variable | What it is |
|----------|-----------|
| `GROQ_API_KEY_PRIMARY` | Primary Groq API key |
| `GROQ_API_KEY_SECONDARY` | Secondary Groq API key — **must be from a separate Groq account** (same-account keys share one rate-limit pool) |
| `SUPABASE_URL` | Your Supabase project URL (`https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | Supabase service-role key (bypasses RLS — server-only, never expose to client) |

> **Never commit `.env.local`** — it is already in `.gitignore`.

---

## Running locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## Seed script (Phase 2)

Run once locally after Supabase is set up:

```bash
npx tsx scripts/seed.ts
```

This resolves iTunes preview URLs for all 62 tracks, verifies playability, and writes all seed data to Supabase. **Do not re-run against production** — it is idempotent by design but the iTunes rate limit makes repeated runs slow.

---

## Health check

```
GET /api/health
```

- **Phase 0:** pings the Supabase REST root (bare DB round-trip, no table needed)
- **Phase 2+:** queries `SELECT id FROM tracks LIMIT 1`

Used by the keep-alive GitHub Action (see below).

---

## Supabase keep-alive (important)

Supabase free projects pause after **7 consecutive days of no database activity**. The evaluation window is July 6–15 — a gap inside that window is enough to trigger a pause right before an evaluator opens the link.

**The fix:** `.github/workflows/keep-alive.yml` runs Mon/Wed/Fri between July 6–15, pinging both Supabase (real DB activity) and Vercel (function warm-up).

### GitHub secrets required for the Action

Add these in **GitHub → Settings → Secrets → Actions**:

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | Same as the env var |
| `SUPABASE_ANON_KEY` | The **anon/public** key (not the service key) |
| `VERCEL_PRODUCTION_URL` | Your production Vercel URL (e.g. `https://onesong.vercel.app`) |

> **Disable the Action after July 15** by deleting `.github/workflows/keep-alive.yml` or commenting out the `schedule` trigger.

---

## Cold tester

_Phase 4 requirement: name the person who performed the unnarrated mouse-only 90-second test here._

**Cold tester:** _TBD_  
**Result:** _TBD_

---

## Deployment URL

The production URL must be identical in three places:

- [ ] Slide 9 (deck prototype link)
- [ ] This README (`Live demo:` above)
- [ ] `/about` route in the app

---

## Build phases

| Phase | Status | What it delivers |
|-------|--------|-----------------|
| 0 — Scaffold | ✅ Done | Next.js on Vercel, health check, keep-alive Action |
| 1 — Spotify shell | ⬜ | Full chrome, audio, card states (bundled JSON) |
| 2 — AI engine | ⬜ | Supabase seeded, Groq live, `/api/pick` with trace |
| 3 — Signal loop | ⬜ | Keep/dismiss, taste mutation, rotation, survival |
| 4 — Evaluator layer | ⬜ | Coach marks, persona sheet, Why sheet, `/about` |

---

## What's simulated vs. what's real

| Real | Simulated |
|------|-----------|
| Groq AI inference (live on every pick) | Spotify accounts / OAuth |
| Supabase Postgres DB | Real listening history (replaced by seeded personas) |
| iTunes 30s audio previews | Production-scale signal data |
| Session state (per-evaluator isolation) | |

See `/about` in the app for the full honest scope statement.
