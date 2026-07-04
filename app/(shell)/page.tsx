"use client";
// app/(shell)/page.tsx — Home
// ─────────────────────────────────────────────────────────────
// Phase 4: blind-evaluator layer
// - Coach Marks (Beat 1 on card, Beat 2 on avatar)
// - PersonaSheet for context switching
// - WhyThisSongSheet for explanation
// ─────────────────────────────────────────────────────────────
import { Suspense, useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { RotateCcw } from "lucide-react";
import { QuickPickGrid } from "@/components/QuickPickGrid";
import { OneSongCard } from "@/components/OneSongCard";
import { RotationStrip } from "@/components/RotationStrip";
import { PersonaSheet } from "@/components/PersonaSheet";
import { WhyThisSongSheet } from "@/components/WhyThisSongSheet";
import { usePlayer } from "@/lib/player";
import { ISHITA_SNAPSHOT } from "@/lib/snapshot";
import { SEED_TRACKS } from "@/lib/seedData";

// ── Time-aware greeting ──────────────────────────────────────
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

type PickResult = {
  decision: "card" | "silence";
  track?: typeof ISHITA_SNAPSHOT.track;
  reason_line?: string;
  trace?: Record<string, unknown>;
};

type LivePersona = {
  id: string;
  name: string;
  default_moment: string;
  default_time: string;
};

const PICK_TIMEOUT_MS = 9000; // cold-start guard (2F)

// ── Session ID (localStorage, 24h managed by server) ─────────
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem("onesong_session_id");
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem("onesong_session_id", id);
  return id;
}

// ── Inner component that reads searchParams ──────────────────
function HomeInner() {
  const searchParams = useSearchParams();

  const [greeting_, setGreeting] = useState("");
  const [activeChip, setActiveChip] = useState<"all" | "music" | "podcasts">("all");
  const [catalog, setCatalog] = useState<typeof SEED_TRACKS>([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const { play } = usePlayer();

  // Live personas from API (falls back to snapshot persona name)
  const [personas, setPersonas] = useState<LivePersona[]>([]);
  const [personaIdx, setPersonaIdx] = useState(0);

  // Pick state: start from snapshot (instant paint), swap to live
  const [pickResult, setPickResult] = useState<PickResult>({
    decision: "card",
    track: ISHITA_SNAPSHOT.track as typeof ISHITA_SNAPSHOT.track,
    reason_line: ISHITA_SNAPSHOT.reason_line,
  });
  const [pickLoading, setPickLoading] = useState(false);
  const pickControllerRef = useRef<AbortController | null>(null);

  // Session ID ref (stable, no re-render)
  const sessionIdRef = useRef<string>("");

  // Rotation strip refresh key — increment to trigger re-fetch
  const [rotationRefreshKey, setRotationRefreshKey] = useState(0);

  // Phase 4 sheets & coach marks
  const [isPersonaSheetOpen, setIsPersonaSheetOpen] = useState(false);
  const [isWhySheetOpen, setIsWhySheetOpen] = useState(false);
  const [showCoachMark2, setShowCoachMark2] = useState(false);

  // ── Initialise on mount ──────────────────────────────────────
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();
    setGreeting(greeting());
    setRotationRefreshKey(1); // initial fetch

    if (!localStorage.getItem("hide_persona_tooltip")) {
      setShowTooltip(true);
    }

    // Load live personas
    fetch("/api/personas")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.personas) && d.personas.length > 0) {
          setPersonas(d.personas);
        }
      })
      .catch(() => {/* silently ignore */});

    // Load catalog
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => {
        if (d.tracks && d.tracks.length > 0) {
          setCatalog(d.tracks);
        } else {
          setCatalog(SEED_TRACKS); // fallback
        }
      })
      .catch(() => setCatalog(SEED_TRACKS));
  }, []);

  // ── Fetch live pick ──────────────────────────────────────────
  const fetchPick = useCallback(async (personaId: string) => {
    // Cancel in-flight request (E4-4)
    if (pickControllerRef.current) pickControllerRef.current.abort();
    const ctrl = new AbortController();
    pickControllerRef.current = ctrl;

    setPickLoading(true);

    // Cold-start guard: if >9s, keep snapshot, swap when resolved
    const timeoutId = setTimeout(() => {
      setPickLoading(false); // show snapshot, fetch continues in background
    }, PICK_TIMEOUT_MS);

    try {
      const res = await fetch("/api/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          persona_id: personaId,
          session_id: sessionIdRef.current || null,
        }),
        signal: ctrl.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`pick failed: ${res.status}`);
      const data = (await res.json()) as PickResult & { trace?: { session_id?: string } };

      // Update session_id if server issued a new one
      if (data.trace?.session_id) {
        const sid = data.trace.session_id as string;
        sessionIdRef.current = sid;
        localStorage.setItem("onesong_session_id", sid);
      }

      setPickResult(data);
    } catch (err) {
      clearTimeout(timeoutId);
      // AbortError = intentional cancel, not an error
      if (err instanceof Error && err.name !== "AbortError") {
        // Keep showing snapshot on error — never blank
      }
    } finally {
      if (pickControllerRef.current === ctrl) {
        setPickLoading(false);
      }
    }
  }, []);

  // ── Fetch pick whenever persona changes ──────────────────────
  useEffect(() => {
    if (personas.length === 0) return;
    const persona = personas[personaIdx];
    if (persona) fetchPick(persona.id);
  }, [personas, personaIdx, fetchPick]);

  // ── Persona displayed ────────────────────────────────────────
  const currentPersona = personas[personaIdx];
  const personaName = currentPersona?.name ?? "Ishita";

  // Fire ignore signal for current unacted card (3G spec)
  const fireIgnoreSignal = useCallback(async (trackId: string, personaId: string) => {
    try {
      await fetch("/api/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdRef.current || null,
          persona_id: personaId,
          track_id: trackId,
          action: "ignore",
        }),
      });
    } catch { /* fire-and-forget */ }
  }, []);

  const switchPersona = useCallback(async (newPersonaId: string) => {
    // If card is currently shown (state a), fire ignore signal first (3G)
    const currentPersona = personas[personaIdx];
    if (currentPersona && pickResult.decision === "card" && pickResult.track) {
      await fireIgnoreSignal(pickResult.track.id, currentPersona.id);
    }
    const newIdx = personas.findIndex((p) => p.id === newPersonaId);
    if (newIdx !== -1) setPersonaIdx(newIdx);
  }, [personas, personaIdx, pickResult, fireIgnoreSignal]);

  const triggerCoachMark2Check = useCallback(() => {
    if (!localStorage.getItem("coach_mark_2_done")) {
      setShowCoachMark2(true);
    }
  }, []);

  // Track shown in the card (from live pick or URL param override)
  const trackIdParam = searchParams.get("trackId");
  const cardTrack = (() => {
    if (trackIdParam) {
      const found = SEED_TRACKS.find((t) => t.id === trackIdParam);
      if (found) return found;
    }
    return pickResult.decision === "card" && pickResult.track
      ? pickResult.track
      : ISHITA_SNAPSHOT.track;
  })();

  const reasonLine = pickResult.reason_line ?? ISHITA_SNAPSHOT.reason_line;
  const showCard = pickResult.decision !== "silence" || !!trackIdParam;

  // Deterministically shuffle catalog based on personaName so lists change per persona
  const shuffledCatalog = useMemo(() => {
    if (catalog.length === 0) return [];
    let hash = 0;
    for (let i = 0; i < personaName.length; i++) {
      hash = personaName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);
    const copy = [...catalog];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = (seed + i) % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [catalog, personaName]);

  // "Quick picks" — first 6
  const quickPicks = shuffledCatalog.slice(0, 6);
  // "Made for you" shelf — next 4
  const madeForYou = shuffledCatalog.slice(6, 10);

  const dismissTooltip = () => {
    localStorage.setItem("hide_persona_tooltip", "true");
    setShowTooltip(false);
  };

  return (
    <div style={{ paddingTop: 52 }}>
      {/* ── Top bar ───────────────────────────────────────────── */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          {/* Avatar / persona switcher */}
          <div style={{ position: "relative" }}>
            <button
              id="home-avatar-btn"
              onClick={() => {
                if (showCoachMark2) {
                  localStorage.setItem("coach_mark_2_done", "true");
                  setShowCoachMark2(false);
                }
                setShowTooltip(false);
                localStorage.setItem("hide_persona_tooltip", "true");
                setIsPersonaSheetOpen(true);
              }}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: personaName === "Ishita" ? "#b91d54" : personaName === "Vaishnavi" ? "#1db954" : "#1d4ed8",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: "bold", fontSize: 16,
                border: "none", cursor: "pointer",
              }}
            >
              {personaName.charAt(0)}
            </button>

            {/* Coach Mark Beat 2 */}
            {showCoachMark2 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  marginTop: 12,
                  left: 0,
                  background: "var(--green)",
                  color: "#000",
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  animation: "bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  zIndex: 50,
                  width: 200,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>See how it behaves for other listeners.</span>
                <button onClick={(e) => { e.stopPropagation(); localStorage.setItem("coach_mark_2_done", "true"); setShowCoachMark2(false); }} style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "#000" }}>✕</button>
                <div style={{ position: "absolute", top: -6, left: 12, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid var(--green)" }} />
              </div>
            )}
            
            {showTooltip && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: -8,
                  marginTop: 14,
                  background: "var(--green)",
                  color: "#000",
                  padding: "16px",
                  borderRadius: 12,
                  width: 260,
                  zIndex: 9999,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
                  animation: "bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
                  transformOrigin: "top left",
                }}
              >
                {/* Arrow pointing up */}
                <div style={{
                  position: "absolute", 
                  top: -8, 
                  left: 18,
                  width: 0, 
                  height: 0,
                  borderLeft: "8px solid transparent",
                  borderRight: "8px solid transparent",
                  borderBottom: "8px solid var(--green)",
                }} />
                
                <h3 className="text-base font-bold mb-1" style={{ color: "#000" }}>Change the persona!</h3>
                <p className="text-sm mb-4" style={{ color: "rgba(0,0,0,0.8)", lineHeight: 1.4 }}>
                  Tap here to switch users and see how the AI instantly adapts the entire app's recommendations.
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissTooltip();
                  }}
                  style={{
                    background: "rgba(0,0,0,0.15)",
                    color: "#000",
                    border: "none",
                    borderRadius: 20,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    width: "100%",
                    transition: "background 0.2s",
                  }}
                >
                  Got it
                </button>
              </div>
            )}
          </div>
          <span className="text-base font-bold">{greeting_}</span>
          <button
            id="home-refresh-btn"
            aria-label="Advance day and get new pick"
            disabled={pickLoading}
            onClick={async () => {
              if (!currentPersona) return;
              // Fire ignore signal for current unacted card first (3G)
              if (pickResult.decision === "card" && pickResult.track) {
                await fireIgnoreSignal(pickResult.track.id, currentPersona.id);
              }
              // Advance the simulated day
              try {
                await fetch("/api/advance-day", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    session_id: sessionIdRef.current || null,
                    persona_id: currentPersona.id,
                  }),
                });
              } catch { /* ignore advance-day errors */ }
              // Refresh rotation strip
              setRotationRefreshKey((k) => k + 1);
              // Fetch new pick
              fetchPick(currentPersona.id);
            }}
            style={{
              background: pickLoading ? "rgba(255,255,255,0.08)" : "none",
              border: "none", cursor: pickLoading ? "not-allowed" : "pointer",
              color: "var(--text-primary)", padding: 8, borderRadius: 6,
              transition: "background 0.2s",
            }}
          >
            <RotateCcw size={22} style={{ animation: pickLoading ? "spin 1s linear infinite" : "none" }} />
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

      {/* ── One Song In card ─────────────────────────────────── */}
      <div style={{ padding: "16px 16px 0" }}>
        {pickLoading ? (
          /* Skeleton shimmer while live pick loads */
          <div
            id="pick-skeleton"
            style={{
              height: 200, borderRadius: 12,
              background: "linear-gradient(90deg, var(--raised) 25%, var(--surface) 50%, var(--raised) 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s infinite",
            }}
          />
        ) : showCard ? (
          <OneSongCard
            track={cardTrack as Parameters<typeof OneSongCard>[0]["track"]}
            reasonLine={reasonLine}
            initialState="a"
            sessionId={sessionIdRef.current || undefined}
            personaId={currentPersona?.id}
            momentLabel={currentPersona?.default_moment}
            onKeep={() => {
              setRotationRefreshKey((k) => k + 1);
              triggerCoachMark2Check();
            }}
            onDismiss={() => {
              if (currentPersona) fetchPick(currentPersona.id);
              triggerCoachMark2Check();
            }}
            onReasonClick={() => setIsWhySheetOpen(true)}
          />
        ) : (
          /* Silence state */
          <div
            style={{
              padding: "24px 16px", borderRadius: 12,
              background: "var(--raised)", textAlign: "center",
            }}
          >
            <p className="text-sm text-muted">
              Nothing new right now
            </p>
            {pickResult.trace && (
              <button
                onClick={() => setIsWhySheetOpen(true)}
                className="text-xs text-muted"
                style={{ marginTop: 8, background: "none", border: "none", padding: "4px 8px", cursor: "pointer", textDecoration: "underline", opacity: 0.8 }}
              >
                Why?
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Quick-pick grid ───────────────────────────────────── */}
      <div style={{ padding: "20px 0 0" }}>
        <h2 className="text-base font-bold" style={{ padding: "0 16px", marginBottom: 12 }}>
          Quick picks
        </h2>
        <QuickPickGrid tracks={quickPicks.length > 0 ? quickPicks : SEED_TRACKS.slice(0,6)} />
      </div>

      {/* ── Rotation strip ────────────────────────────────────── */}
      <RotationStrip
        sessionId={sessionIdRef.current || undefined}
        personaId={currentPersona?.id}
        refreshKey={rotationRefreshKey}
      />

      {/* ── Made for you ─────────────────────────────────────── */}
      <div className="shelf">
        <div className="shelf-header">
          <h2 className="text-base font-bold">Made for you</h2>
          <span className="text-xs text-muted">Based on {personaName}</span>
        </div>
        <div className="h-scroll">
          {madeForYou.map((t) => (
            <button
              key={t.id}
              id={`made-for-you-${t.id}`}
              onClick={() => play(t)}
              aria-label={`Play ${t.title} by ${t.artist}`}
              style={{
                flexShrink: 0, width: 140,
                background: "none", border: "none",
                cursor: "pointer", padding: 0, textAlign: "left",
              }}
            >
              <div style={{
                width: 140, height: 140, borderRadius: 6,
                overflow: "hidden", marginBottom: 8,
                background: "var(--raised)", position: "relative",
              }}>
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

      <div style={{ height: 16 }} />

      <PersonaSheet
        isOpen={isPersonaSheetOpen}
        onClose={() => setIsPersonaSheetOpen(false)}
        personas={personas}
        activePersonaId={currentPersona?.id}
        onSelect={switchPersona}
      />

      <WhyThisSongSheet
        isOpen={isWhySheetOpen}
        onClose={() => setIsWhySheetOpen(false)}
        trace={pickResult.trace as any}
        survivalRate={(cardTrack as any)?._rate ?? 0.75}
      />

      {/* shimmer and bounce keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
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
