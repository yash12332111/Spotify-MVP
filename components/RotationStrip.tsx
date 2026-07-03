"use client";
// components/RotationStrip.tsx
// Phase 3: fetches live data from GET /api/rotation
import Image from "next/image";
import { usePlayer } from "@/lib/player";
import { useCallback, useEffect, useState } from "react";
import type { Track } from "@/lib/seedData";

type RotationTrack = Track & {
  exposure_count?: number;
  survived?: boolean;
  tag?: string | null;
};

type Props = {
  // Phase 3: live data fetching
  sessionId?: string;
  personaId?: string;
  // Phase 1 fallback: static tracks
  tracks?: Track[];
  // Trigger a re-fetch from outside (increment to reload)
  refreshKey?: number;
};

export function RotationStrip({ sessionId, personaId, tracks: staticTracks = [], refreshKey = 0 }: Props) {
  const { play, track: currentTrack, playing } = usePlayer();
  const [liveTrack, setLiveTracks] = useState<RotationTrack[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId || !personaId) return;
    setLoading(true);
    fetch(`/api/rotation?session_id=${sessionId}&persona_id=${personaId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.tracks) setLiveTracks(d.tracks);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId, personaId, refreshKey]);

  const handleTap = useCallback(
    (t: Track) => {
      play(t);
    },
    [play]
  );

  // Use live data if available, otherwise fall back to static
  const tracks: RotationTrack[] = liveTrack ?? (staticTracks as RotationTrack[]);

  // Empty state (3E)
  if (!loading && tracks.length === 0) {
    return (
      <div className="shelf">
        <div className="shelf-header">
          <h2 className="text-base font-bold">Your rotation</h2>
        </div>
        <p className="text-xs text-muted" style={{ padding: "0 16px 16px" }}>
          Keep a song to start building your rotation
        </p>
      </div>
    );
  }

  return (
    <div className="shelf">
      <div className="shelf-header">
        <h2 className="text-base font-bold">Your rotation</h2>
        <button
          id="rotation-see-all"
          className="text-xs font-semibold"
          style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
        >
          See all
        </button>
      </div>

      <div className="h-scroll">
        {loading && tracks.length === 0
          ? // Skeleton shimmer while loading
            [1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  flexShrink: 0,
                  width: 140,
                  height: 140,
                  borderRadius: 6,
                  background: "linear-gradient(90deg, var(--raised) 25%, var(--surface) 50%, var(--raised) 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.4s infinite",
                }}
              />
            ))
          : tracks.map((t) => {
              const isActive = currentTrack?.id === t.id && playing;
              return (
                <button
                  key={t.id}
                  id={`rotation-${t.id}`}
                  onClick={() => handleTap(t)}
                  aria-label={`Play ${t.title} by ${t.artist}`}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    flexShrink: 0,
                    width: 140,
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
                      position: "relative",
                      outline: isActive ? "2px solid var(--green)" : "none",
                      outlineOffset: 2,
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
                    {/* Tag badge */}
                    {t.tag && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 6,
                          left: 6,
                          background: "var(--green)",
                          color: "#000",
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                        }}
                      >
                        {t.tag}
                      </span>
                    )}
                    {/* Survived badge */}
                    {t.survived && !t.tag && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 6,
                          left: 6,
                          background: "rgba(0,0,0,0.6)",
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          textTransform: "uppercase",
                        }}
                      >
                        In rotation ✓
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted truncate">{t.artist}</p>
                </button>
              );
            })}
      </div>
    </div>
  );
}
