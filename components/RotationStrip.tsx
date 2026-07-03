"use client";
// components/RotationStrip.tsx
import Image from "next/image";
import { usePlayer } from "@/lib/player";
import { useCallback } from "react";
import type { Track } from "@/lib/seedData";

export function RotationStrip({ tracks }: { tracks: Track[] }) {
  const { play, track: currentTrack, playing } = usePlayer();

  const handleTap = useCallback(
    (t: Track) => {
      play(t);
    },
    [play]
  );

  if (tracks.length === 0) return null;

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
        {tracks.map((t) => {
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
                {/* "New to your rotation" tag */}
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
                    letterSpacing: 0,
                    textTransform: "uppercase",
                  }}
                >
                  Rotation
                </span>
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
