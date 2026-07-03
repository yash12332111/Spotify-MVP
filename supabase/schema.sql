-- ============================================================
-- One Song In — Supabase schema
-- Run this ONCE in Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- ── Seed tables (immutable after seed) ─────────────────────

CREATE TABLE IF NOT EXISTS tracks (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                    text NOT NULL,
  artist                   text NOT NULL,
  preview_url              text,
  artwork_url              text,
  playable                 boolean NOT NULL DEFAULT false,
  mood                     text,
  energy                   int,
  context_fit              text[],
  role                     text,   -- familiar_ishita | familiar_vaishnavi | familiar_haripriya | discovery
  survival_rate_similar_users float
);

CREATE TABLE IF NOT EXISTS personas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  taste_vector        jsonb NOT NULL DEFAULT '{}',
  default_moment      text,        -- wind_down | lean_back | commute
  default_time        text,        -- e.g. "21:00 Tue"
  default_context     jsonb,       -- { time_of_day, day_of_week, previous_session_type, gap_minutes, device }
  default_reason_line text,        -- cached at seed time via Groq
  default_track_id    uuid REFERENCES tracks(id)
);

CREATE TABLE IF NOT EXISTS persona_history (
  persona_id  uuid REFERENCES personas(id) ON DELETE CASCADE,
  track_id    uuid REFERENCES tracks(id)   ON DELETE CASCADE,
  play_count  int NOT NULL DEFAULT 0,
  PRIMARY KEY (persona_id, track_id)
);

CREATE TABLE IF NOT EXISTS track_survival_stats (
  track_id      uuid PRIMARY KEY REFERENCES tracks(id) ON DELETE CASCADE,
  survival_rate float NOT NULL DEFAULT 0.5
);

-- ── Session tables (mutable per evaluator) ──────────────────

CREATE TABLE IF NOT EXISTS session_personas (
  session_id           uuid NOT NULL,
  persona_id           uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  taste_vector         jsonb NOT NULL DEFAULT '{}',
  throttle_multipliers jsonb NOT NULL DEFAULT '{"wind_down":1.0,"lean_back":1.0,"commute":1.0,"focus":1.0}',
  simulated_day        int  NOT NULL DEFAULT 0,
  last_active_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, persona_id)
);

CREATE TABLE IF NOT EXISTS session_signals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL,
  persona_id  uuid NOT NULL REFERENCES personas(id),
  track_id    uuid NOT NULL REFERENCES tracks(id),
  action      text NOT NULL CHECK (action IN ('keep','dismiss','ignore')),
  moment_label text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_rotation (
  session_id       uuid NOT NULL,
  persona_id       uuid NOT NULL REFERENCES personas(id),
  track_id         uuid NOT NULL REFERENCES tracks(id),
  exposure_count   int  NOT NULL DEFAULT 0,
  survived         boolean NOT NULL DEFAULT false,
  last_exposed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, persona_id, track_id)
);

-- ── Indexes for hot query paths ─────────────────────────────

CREATE INDEX IF NOT EXISTS idx_session_personas_session ON session_personas(session_id);
CREATE INDEX IF NOT EXISTS idx_session_signals_session_persona ON session_signals(session_id, persona_id);
CREATE INDEX IF NOT EXISTS idx_session_rotation_session_persona ON session_rotation(session_id, persona_id);
CREATE INDEX IF NOT EXISTS idx_tracks_playable_role ON tracks(playable, role);
