"use client";
// app/(shell)/search/page.tsx
import { useState, useMemo, useCallback } from "react";
import { Search as SearchIcon } from "lucide-react";
import Image from "next/image";
import { SEED_TRACKS } from "@/lib/seedData";
import { usePlayer } from "@/lib/player";

const GENRES = [
  { label: "Hindi Pop",    color: "#7c3aed" },
  { label: "Indie Folk",   color: "#0891b2" },
  { label: "R&B",          color: "#be185d" },
  { label: "Electronic",   color: "#b45309" },
  { label: "Sad Hours",    color: "#1d4ed8" },
  { label: "Morning Run",  color: "#065f46" },
  { label: "Focus",        color: "#4d7c0f" },
  { label: "Late Night",   color: "#6b21a8" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { play } = usePlayer();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEED_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q)
    );
  }, [query]);

  const handlePlay = useCallback(
    (id: string) => {
      const t = SEED_TRACKS.find((x) => x.id === id);
      if (t) play(t);
    },
    [play]
  );

  return (
    <div style={{ paddingTop: 52 }}>
      {/* Header */}
      <div style={{ padding: "0 16px 20px" }}>
        <h1 className="text-xl" style={{ marginBottom: 16 }}>
          Search
        </h1>
        <div className="search-input-wrap">
          <SearchIcon size={18} />
          <input
            id="search-input"
            className="search-input"
            type="search"
            placeholder="Artists, songs, or podcasts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Results */}
      {results.length > 0 ? (
        <div style={{ padding: "0 0 8px" }}>
          <p className="text-xs text-muted" style={{ padding: "0 16px", marginBottom: 8 }}>
            {results.length} result{results.length > 1 ? "s" : ""}
          </p>
          {results.map((t) => (
            <button
              key={t.id}
              id={`search-result-${t.id}`}
              className="track-row"
              onClick={() => handlePlay(t.id)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
              aria-label={`Play ${t.title} by ${t.artist}`}
            >
              <Image
                src={t.artwork_url}
                alt={t.title}
                width={48}
                height={48}
                style={{ borderRadius: 4, flexShrink: 0 }}
                unoptimized
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="text-base font-medium truncate">{t.title}</p>
                <p className="text-sm text-muted truncate">{t.artist}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* Browse genres */
        <div style={{ padding: "0 16px" }}>
          <p className="text-base font-bold" style={{ marginBottom: 12 }}>
            Browse all
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {GENRES.map((g) => (
              <div
                key={g.label}
                className="genre-tile"
                style={{ background: g.color }}
                id={`genre-${g.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <span>{g.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
