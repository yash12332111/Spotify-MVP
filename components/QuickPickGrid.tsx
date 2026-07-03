"use client";
// components/QuickPickGrid.tsx
import Image from "next/image";
import { usePlayer } from "@/lib/player";
import { useCallback } from "react";
import type { Track } from "@/lib/seedData";

export function QuickPickGrid({ tracks }: { tracks: Track[] }) {
  const { play, track: currentTrack, playing } = usePlayer();

  const handleTap = useCallback(
    (t: Track) => {
      // synchronous — no await before play() (E1-2)
      play(t);
    },
    [play]
  );

  // 6 tiles, 2 columns
  const tiles = tracks.slice(0, 6);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        padding: "0 16px",
        marginBottom: 28,
      }}
    >
      {tiles.map((t) => {
        const isActive = currentTrack?.id === t.id && playing;
        return (
          <button
            key={t.id}
            id={`qp-tile-${t.id}`}
            className="qp-tile"
            onClick={() => handleTap(t)}
            aria-label={`Play ${t.title} by ${t.artist}`}
            style={{
              outline: isActive ? "1px solid var(--green)" : "none",
            }}
          >
            {/* Artwork */}
            <div style={{ width: 56, height: 56, flexShrink: 0 }}>
              <Image
                src={t.artwork_url}
                alt={t.title}
                width={56}
                height={56}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
                unoptimized
              />
            </div>

            {/* Label */}
            <span
              className="text-sm font-semibold truncate"
              style={{ padding: "0 10px", flex: 1, textAlign: "left" }}
            >
              {t.title}
            </span>

            {/* Playing indicator */}
            {isActive && (
              <span style={{ paddingRight: 10 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--green)">
                  <rect x="0" y="2" width="3" height="8" rx="1" />
                  <rect x="4.5" y="0" width="3" height="12" rx="1" />
                  <rect x="9" y="3" width="3" height="6" rx="1" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
