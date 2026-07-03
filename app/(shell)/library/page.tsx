"use client";
// app/(shell)/library/page.tsx
import { useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, Play } from "lucide-react";
import { SEED_PLAYLISTS, SEED_TRACKS } from "@/lib/seedData";
import { usePlayer } from "@/lib/player";

export default function LibraryPage() {
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(null);
  const { play } = usePlayer();

  const openPlaylist = useCallback((id: string) => {
    setOpenPlaylistId(id);
  }, []);

  const closePlaylist = useCallback(() => {
    setOpenPlaylistId(null);
  }, []);

  const handlePlayTrack = useCallback(
    (trackId: string) => {
      const t = SEED_TRACKS.find((x) => x.id === trackId);
      if (t) play(t);
    },
    [play]
  );

  const playlist = openPlaylistId
    ? SEED_PLAYLISTS.find((p) => p.id === openPlaylistId)
    : null;

  // ── Playlist tracklist view ──────────────────────────────
  if (playlist) {
    const tracks = playlist.track_ids
      .map((id) => SEED_TRACKS.find((t) => t.id === id))
      .filter(Boolean) as typeof SEED_TRACKS;

    return (
      <div style={{ paddingTop: 52 }}>
        {/* Header */}
        <div
          style={{
            padding: "0 16px 20px",
            background: `linear-gradient(180deg, #1a2a3a 0%, var(--bg) 100%)`,
          }}
        >
          <button
            id="library-back-btn"
            onClick={closePlaylist}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginBottom: 20,
              padding: "4px 0",
            }}
            aria-label="Back to library"
          >
            <ChevronLeft size={20} />
            <span className="text-sm">Your Library</span>
          </button>

          {/* Playlist art + info */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            {playlist.artwork_url && (
              <Image
                src={playlist.artwork_url}
                alt={playlist.name}
                width={96}
                height={96}
                style={{ borderRadius: 6, flexShrink: 0 }}
                unoptimized
              />
            )}
            <div style={{ minWidth: 0 }}>
              <p className="text-xs text-muted" style={{ marginBottom: 4 }}>PLAYLIST</p>
              <h1 className="text-xl">{playlist.name}</h1>
              <p className="text-xs text-muted" style={{ marginTop: 4 }}>
                {playlist.description}
              </p>
            </div>
          </div>
        </div>

        {/* Play all */}
        <div style={{ padding: "16px 16px 8px", display: "flex", justifyContent: "flex-end" }}>
          <button
            id="playlist-play-all"
            onClick={() => tracks[0] && handlePlayTrack(tracks[0].id)}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--green)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Play all"
          >
            <Play size={24} fill="#000" color="#000" />
          </button>
        </div>

        {/* Track list */}
        {tracks.map((t, i) => (
          <button
            key={t.id}
            id={`track-row-${t.id}`}
            className="track-row"
            onClick={() => handlePlayTrack(t.id)}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
            aria-label={`Play ${t.title} by ${t.artist}`}
          >
            <span className="text-sm text-muted" style={{ width: 20, textAlign: "right", flexShrink: 0 }}>
              {i + 1}
            </span>
            <Image
              src={t.artwork_url}
              alt={t.title}
              width={44}
              height={44}
              style={{ borderRadius: 4, flexShrink: 0 }}
              unoptimized
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="text-base font-medium truncate">{t.title}</p>
              <p className="text-sm text-muted truncate">{t.artist}</p>
            </div>
          </button>
        ))}
        <div style={{ height: 16 }} />
      </div>
    );
  }

  // ── Library list view ────────────────────────────────────
  return (
    <div style={{ paddingTop: 52 }}>
      <div style={{ padding: "0 16px 20px" }}>
        <h1 className="text-xl">Your Library</h1>
      </div>

      {SEED_PLAYLISTS.map((p) => (
        <button
          key={p.id}
          id={`playlist-row-${p.id}`}
          className="playlist-row"
          onClick={() => openPlaylist(p.id)}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
          aria-label={`Open ${p.name}`}
        >
          {p.artwork_url ? (
            <Image
              src={p.artwork_url}
              alt={p.name}
              width={56}
              height={56}
              style={{ borderRadius: 6, flexShrink: 0 }}
              unoptimized
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 6,
                background: "var(--raised)",
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <p className="text-base font-medium truncate">{p.name}</p>
            <p className="text-sm text-muted truncate">
              Playlist · {p.track_ids.length} songs
            </p>
          </div>
        </button>
      ))}
      <div style={{ height: 16 }} />
    </div>
  );
}
