import { useState, useMemo, useCallback, useEffect } from "react";
import { Search as SearchIcon, Play, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SEED_TRACKS } from "@/lib/seedData";
import { usePlayer } from "@/lib/player";

type Track = typeof SEED_TRACKS[0];

// Genre tiles — each maps to a mood/context filter on SEED_TRACKS
const GENRES = [
const GENRES = [
  { label: "Hindi Pop",   color: "#7c3aed", filter: (t: Track) => t.artist.toLowerCase().includes("arijit") || t.artist.toLowerCase().includes("anuv") || t.artist.toLowerCase().includes("prateek") || t.artist.toLowerCase().includes("mithoon") },
  { label: "Indie Folk",  color: "#0891b2", filter: (t: Track) => t.mood === "dreamy" || t.mood === "melancholic" },
  { label: "R&B",         color: "#be185d", filter: (t: Track) => t.artist.toLowerCase().includes("clairo") || t.artist.toLowerCase().includes("dhruv") },
  { label: "Electronic",  color: "#b45309", filter: (t: Track) => t.energy >= 7 },
  { label: "Sad Hours",   color: "#1d4ed8", filter: (t: Track) => t.mood === "melancholic" || t.energy <= 3 },
  { label: "Morning Run", color: "#065f46", filter: (t: Track) => t.context_fit.includes("commute") || t.energy >= 6 },
  { label: "Focus",       color: "#4d7c0f", filter: (t: Track) => t.context_fit.includes("focus") || t.context_fit.includes("study") },
  { label: "Late Night",  color: "#6b21a8", filter: (t: Track) => t.context_fit.includes("wind_down") || t.context_fit.includes("lean_back") },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Track[]>(SEED_TRACKS); // fallback initially
  const { play, track: currentTrack, playing } = usePlayer();

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => {
        if (d.tracks && d.tracks.length > 0) setCatalog(d.tracks);
      })
      .catch(() => {});
  }, []);

  // Text search results
  const textResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalog.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q)
    );
  }, [query, catalog]);

  // Genre filter results
  const genreResults = useMemo(() => {
    if (!activeGenre) return [];
    const genre = GENRES.find((g) => g.label === activeGenre);
    if (!genre) return [];
    return catalog.filter(genre.filter);
  }, [activeGenre, catalog]);

  const handlePlay = useCallback(
    (id: string) => {
      const t = catalog.find((x) => x.id === id);
      if (t) play(t);
    },
    [play, catalog]
  );

  const handleGenreClick = useCallback(
    (label: string) => {
      setQuery(""); // clear text search when picking a genre
      if (activeGenre === label) {
        setActiveGenre(null); // toggle off
      } else {
        setActiveGenre(label);
        // Auto-play a random track in this genre
        const genre = GENRES.find((g) => g.label === label);
        if (genre) {
          const matches = catalog.filter(genre.filter);
          if (matches.length > 0) {
            const randomPick = matches[Math.floor(Math.random() * matches.length)];
            play(randomPick);
          }
        }
      }
    },
    [activeGenre, play, catalog]
  );

  // Which results to show
  const showText  = query.trim().length > 0;
  const showGenre = !showText && activeGenre !== null && genreResults.length > 0;

  const TrackList = ({ tracks }: { tracks: Track[] }) => (
    <div style={{ padding: "0 0 8px" }}>
      {tracks.map((t) => {
        const isActive = currentTrack?.id === t.id && playing;
        return (
          <button
            key={t.id}
            id={`search-result-${t.id}`}
            className="track-row"
            onClick={() => handlePlay(t.id)}
            style={{
              width: "100%",
              background: isActive ? "rgba(255,255,255,0.06)" : "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
            aria-label={`Play ${t.title} by ${t.artist}`}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Image
                src={t.artwork_url}
                alt={t.title}
                width={48}
                height={48}
                style={{ borderRadius: 4, display: "block" }}
                unoptimized
              />
              {isActive && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: 4,
                  background: "rgba(0,0,0,0.5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--green)">
                    <rect x="0" y="2" width="4" height="12" rx="1.5" />
                    <rect x="6" y="0" width="4" height="16" rx="1.5" />
                    <rect x="12" y="3" width="4" height="10" rx="1.5" />
                  </svg>
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <p className="text-base font-medium truncate" style={{ color: isActive ? "var(--green)" : "var(--text-primary)" }}>
                {t.title}
              </p>
              <p className="text-sm text-muted truncate">{t.artist}</p>
            </div>
            
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
              <Play size={16} style={{ color: "var(--text-muted)" }} />
              <Link 
                href={`/?state=a&trackId=${t.id}`}
                onClick={(e) => e.stopPropagation()} // don't trigger the row play()
                aria-label={`Open ${t.title} card`}
                style={{ display: "flex", color: "var(--text-muted)", padding: 4 }}
              >
                <ExternalLink size={16} />
              </Link>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ paddingTop: 52 }}>
      {/* Header */}
      <div style={{ padding: "0 16px 20px" }}>
        <h1 className="text-xl" style={{ marginBottom: 16 }}>Search</h1>
        <div className="search-input-wrap">
          <SearchIcon size={18} />
          <input
            id="search-input"
            className="search-input"
            type="search"
            placeholder="Artists, songs, or podcasts"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveGenre(null); }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Text search results */}
      {showText && (
        textResults.length > 0 ? (
          <>
            <p className="text-xs text-muted" style={{ padding: "0 16px", marginBottom: 8 }}>
              {textResults.length} result{textResults.length > 1 ? "s" : ""}
            </p>
            <TrackList tracks={textResults} />
          </>
        ) : (
          <p className="text-sm text-muted" style={{ padding: "0 16px" }}>No results for "{query}"</p>
        )
      )}

      {/* Genre filter results */}
      {showGenre && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p className="text-base font-bold">{activeGenre}</p>
            <button
              onClick={() => setActiveGenre(null)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 12 }}
            >
              Clear
            </button>
          </div>
          <TrackList tracks={genreResults} />
        </div>
      )}

      {/* Browse genres — always visible unless showing text results */}
      {!showText && (
        <div style={{ padding: "0 16px" }}>
          {!activeGenre && (
            <p className="text-base font-bold" style={{ marginBottom: 12 }}>Browse all</p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {GENRES.map((g) => {
              const isActive = activeGenre === g.label;
              // Count matching tracks for badge
              const count = SEED_TRACKS.filter(g.filter).length;
              return (
                <button
                  key={g.label}
                  id={`genre-${g.label.toLowerCase().replace(/\s/g, "-")}`}
                  className="genre-tile"
                  onClick={() => handleGenreClick(g.label)}
                  style={{
                    background: isActive ? g.color : g.color + "cc",
                    border: isActive ? "2px solid #fff" : "2px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    outline: "none",
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, color: "#fff" }}>
                    {g.label}
                  </span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 4, display: "block" }}>
                    {count} song{count !== 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}
