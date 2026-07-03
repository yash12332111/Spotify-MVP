"use client";
// app/(shell)/page.tsx — Home
// ─────────────────────────────────────────────────────────────
// ?state=a  → One Song In card visible (default)
// ?state=c  → card in "added" state
// ?state=d  → silent (no card)
//
// Time-of-day greeting runs on client only to avoid hydration
// mismatch (E1-10). useSearchParams wrapped in Suspense by parent.
// ─────────────────────────────────────────────────────────────
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { RotateCcw } from "lucide-react";
import { QuickPickGrid } from "@/components/QuickPickGrid";
import { OneSongCard } from "@/components/OneSongCard";
import { RotationStrip } from "@/components/RotationStrip";
import { usePlayer } from "@/lib/player";
import {
  QUICK_PICKS,
  DISCOVERY_CARD_TRACK,
  SEED_ROTATION,
  SEED_PERSONAS,
  SEED_TRACKS,
} from "@/lib/seedData";

// ── Time-aware greeting ──────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── Persona switcher state ───────────────────────────────────
const _PERSONA_IDS = SEED_PERSONAS.map((p) => p.id); void _PERSONA_IDS;

// ── Inner component that reads searchParams ──────────────────
function HomeInner() {
  const searchParams = useSearchParams();
  const rawState = searchParams.get("state") ?? "a";
  const cardState = (["a", "c", "d"].includes(rawState) ? rawState : "a") as
    | "a"
    | "c"
    | "d";

  const [greeting_, setGreeting] = useState("");
  const [activeChip, setActiveChip] = useState<"all" | "music" | "podcasts">("all");
  const [personaIdx, setPersonaIdx] = useState(0);
  const { play } = usePlayer();

  // Client-only greeting to avoid hydration mismatch (E1-10)
  useEffect(() => {
    setGreeting(greeting());
  }, []);

  const persona = SEED_PERSONAS[personaIdx];

  const switchPersona = useCallback(() => {
    setPersonaIdx((i) => (i + 1) % SEED_PERSONAS.length);
  }, []);

  // "Made for you" shelf — 4 tracks not in quick-picks
  const madeForYou = SEED_TRACKS.slice(4, 8);

  return (
    <div>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(180deg, #1a3a2a 0%, var(--bg) 100%)",
          padding: "52px 16px 16px",
        }}
      >
        {/* Profile row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
          }}
        >
          {/* Avatar + greeting */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              id="avatar-persona-switch"
              onClick={switchPersona}
              aria-label="Switch persona"
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: persona.avatar_color,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 15,
                color: "#fff",
              }}
            >
              {persona.avatar_initial}
            </button>
            <div>
              <p className="text-xs text-muted">{greeting_}</p>
              <p className="text-sm font-bold">{persona.name}</p>
            </div>
          </div>

          {/* Refresh / advance-day glyph */}
          <button
            id="home-refresh-btn"
            aria-label="Advance day and get new pick"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-primary)",
              padding: 8,
            }}
          >
            <RotateCcw size={22} />
          </button>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }} className="h-scroll">
          {(["all", "music", "podcasts"] as const).map((chip) => (
            <button
              key={chip}
              id={`chip-${chip}`}
              className={`chip ${activeChip === chip ? "chip-active" : "chip-inactive"}`}
              onClick={() => setActiveChip(chip)}
            >
              {chip.charAt(0).toUpperCase() + chip.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── One Song In card ────────────────────────────────── */}
      <div style={{ padding: "16px 16px 0" }}>
        <OneSongCard
          track={DISCOVERY_CARD_TRACK}
          reasonLine="Sounds like Prateek Kuhad — calm tempo, indie feel, 9 PM vibe"
          initialState={cardState}
        />
      </div>

      {/* ── Quick-pick grid ──────────────────────────────────── */}
      <div style={{ padding: "20px 0 0" }}>
        <h2
          className="text-base font-bold"
          style={{ padding: "0 16px", marginBottom: 12 }}
        >
          Quick picks
        </h2>
        <QuickPickGrid tracks={QUICK_PICKS} />
      </div>

      {/* ── Rotation strip ───────────────────────────────────── */}
      <RotationStrip tracks={SEED_ROTATION} />

      {/* ── Made for you ─────────────────────────────────────── */}
      <div className="shelf">
        <div className="shelf-header">
          <h2 className="text-base font-bold">Made for you</h2>
          <span className="text-xs text-muted">Based on {persona.name}</span>
        </div>
        <div className="h-scroll">
          {madeForYou.map((t) => (
            <button
              key={t.id}
              id={`made-for-you-${t.id}`}
              onClick={() => play(t)}
              aria-label={`Play ${t.title} by ${t.artist}`}
              style={{
                flexShrink: 0,
                width: 140,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 6,
                  overflow: "hidden",
                  marginBottom: 8,
                  background: "var(--raised)",
                  position: "relative",
                }}
              >
                <Image
                  src={t.artwork_url}
                  alt={t.title}
                  width={140}
                  height={140}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  unoptimized
                />
              </div>
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.title}</p>
              <p className="text-xs text-muted truncate">{t.artist}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom padding */}
      <div style={{ height: 16 }} />

    </div>
  );
}

// ── Export with Suspense (required for useSearchParams in prod) ──
export default function HomePage() {
  return (
    <Suspense>
      <HomeInner />
    </Suspense>
  );
}
