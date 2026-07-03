"use client";
// components/NowPlayingBar.tsx
import { usePlayer } from "@/lib/player";
import { Play, Pause } from "lucide-react";
import Image from "next/image";
import { ISHITA_SNAPSHOT } from "@/lib/snapshot";

export function NowPlayingBar() {
  const { track, playing, progress, toggle } = usePlayer();

  // If nothing has been played yet, show Ishita's default (Kasoor)
  const display = track ?? ISHITA_SNAPSHOT.track;

  return (
    <div className="npb" role="region" aria-label="Now playing">
      {/* Artwork */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 4,
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--raised)",
        }}
      >
        {display.artwork_url ? (
          <Image
            src={display.artwork_url}
            alt={display.title}
            width={44}
            height={44}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
            unoptimized
          />
        ) : (
          <div style={{ width: 44, height: 44, background: "var(--raised)" }} />
        )}
      </div>

      {/* Title + artist */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="text-sm font-medium truncate">{display.title}</p>
        <p className="text-xs text-muted truncate">{display.artist}</p>
      </div>

      {/* Play / pause */}
      <button
        id="npb-play-pause"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          padding: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {playing ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" />}
      </button>

      {/* Thin progress line at bottom */}
      <div className="npb-progress">
        <div
          className="npb-progress-fill"
          style={{ width: `${progress * 100}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
