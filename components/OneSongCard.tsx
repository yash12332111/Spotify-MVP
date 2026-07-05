"use client";
// components/OneSongCard.tsx
// ─────────────────────────────────────────────────────────────
// Four states:
//   a      — Card: art, track, artist, reason, [Add it in] / [Not now]
//   c      — Kept: rich rotation-explanation panel (user dismisses)
//   d-msg  — Dismissed: "No problem" message (auto-fades after 3.5s)
//   gone   — Completely gone (parent can render next pick)
//
// Phase 3: buttons fire /api/signal (keep | dismiss | ignore)
// ─────────────────────────────────────────────────────────────
import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { usePlayer } from "@/lib/player";
import type { Track } from "@/lib/seedData";

type CardState = "a" | "c" | "d-msg" | "gone";

type Props = {
  track: Track;
  reasonLine?: string;
  initialState?: "a" | "c" | "d-msg" | "gone";
  // Phase 3 signal props
  sessionId?: string;
  personaId?: string;
  momentLabel?: string;
  onKeep?: () => void;    // called when user closes the "c" panel
  onDismiss?: () => void; // called when "d-msg" auto-fades out
  // Phase 4 props
  onReasonClick?: () => void;
};

async function fireSignal(opts: {
  sessionId: string;
  personaId: string;
  trackId: string;
  action: "keep" | "dismiss" | "ignore";
  momentLabel?: string;
}) {
  try {
    await fetch("/api/signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: opts.sessionId,
        persona_id: opts.personaId,
        track_id: opts.trackId,
        action: opts.action,
        moment_label: opts.momentLabel,
      }),
    });
  } catch {
    // Fire-and-forget — never block UI on signal failure
  }
}

export function OneSongCard({
  track,
  reasonLine = "Based on your wind-down listening this week",
  initialState = "a",
  sessionId,
  personaId,
  momentLabel,
  onKeep,
  onDismiss,
  onReasonClick,
}: Props) {
  const [state, setState] = useState<CardState>(initialState as CardState);
  const [melting, setMelting] = useState(false);
  const [addDisabled, setAddDisabled] = useState(false);
  const [dismissDisabled, setDismissDisabled] = useState(false);
  const [showCoachMark, setShowCoachMark] = useState(false);
  const [highlightInfo, setHighlightInfo] = useState(true);
  const [dMsgVisible, setDMsgVisible] = useState(false);
  const onDismissRef = useRef(onDismiss);
  const onKeepRef = useRef(onKeep);
  const { play } = usePlayer();

  // Keep refs current without stale closures
  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);
  useEffect(() => { onKeepRef.current = onKeep; }, [onKeep]);

  useEffect(() => {
    const timer = setTimeout(() => setHighlightInfo(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initialState === "a" && !localStorage.getItem("coach_mark_1_done")) {
      setShowCoachMark(true);
    }
  }, [initialState]);

  // Auto-fade "d-msg" state after 3.5 s, then call onDismiss to load next pick
  useEffect(() => {
    if (state !== "d-msg") return;
    // Animate in
    requestAnimationFrame(() => setDMsgVisible(true));
    const t = setTimeout(() => {
      setDMsgVisible(false);
      setTimeout(() => {
        setState("gone");
        onDismissRef.current?.();
      }, 400);
    }, 3500);
    return () => clearTimeout(t);
  }, [state]);

  const dismissCoachMark = useCallback(() => {
    if (showCoachMark) {
      localStorage.setItem("coach_mark_1_done", "true");
      setShowCoachMark(false);
    }
  }, [showCoachMark]);

  const handleAdd = useCallback(() => {
    if (addDisabled) return;
    setAddDisabled(true);
    dismissCoachMark();

    play(track);

    // Fire signal — onKeep deferred to when user closes the "c" panel
    if (sessionId && personaId) {
      fireSignal({ sessionId, personaId, trackId: track.id, action: "keep", momentLabel });
    }

    setMelting(true);
    setTimeout(() => setState("c"), 400);
  }, [addDisabled, play, track, sessionId, personaId, momentLabel, dismissCoachMark]);

  const handleDismiss = useCallback(() => {
    if (dismissDisabled) return;
    setDismissDisabled(true);
    dismissCoachMark();

    // Signal fires immediately, but UI waits for the message to fade
    if (sessionId && personaId) {
      fireSignal({ sessionId, personaId, trackId: track.id, action: "dismiss", momentLabel });
    }

    setMelting(true);
    setTimeout(() => setState("d-msg"), 400);
  }, [dismissDisabled, track, sessionId, personaId, momentLabel, dismissCoachMark]);

  // ── State: completely gone ───────────────────────────────────
  if (state === "gone") return null;

  // ── State C — "Add it in" rich explanation ───────────────────
  if (state === "c") {
    return (
      <div className="shelf fade-in" style={{ paddingTop: 0 }}>
        <div
          style={{
            background: "linear-gradient(160deg, #0d2818 0%, #162d1f 100%)",
            borderRadius: "var(--radius-card)",
            border: "1px solid rgba(29,185,84,0.2)",
            padding: "18px 16px 16px",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "var(--green)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 0 16px rgba(29,185,84,0.4)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9l4.5 4.5 7.5-9" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#fff" }}>
                  It&apos;s in your rotation now.
                </p>
                <p className="text-xs text-muted">{track.title}</p>
              </div>
            </div>
          </div>

          {/* Body copy */}
          <p
            style={{
              fontSize: 12.5,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.62)",
              marginBottom: 14,
            }}
          >
            Playing today — and it&apos;ll come back around on{" "}
            <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>day 3</span> and{" "}
            <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>day 6</span>, because
            liking a new song usually takes a few listens, not one. If it earns a third play within
            two weeks, it officially becomes part of your rotation. No extra steps from you — just
            keep listening like you normally would.
          </p>

          {/* Got it button */}
          <button
            id="card-kept-close-btn"
            onClick={() => {
              setState("gone");
              onKeepRef.current?.();
            }}
            style={{
              width: "100%",
              background: "rgba(29,185,84,0.12)",
              color: "var(--green)",
              border: "1px solid rgba(29,185,84,0.25)",
              borderRadius: 20,
              padding: "9px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(29,185,84,0.2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(29,185,84,0.12)"; }}
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  // ── State D-MSG — "Not now" brief message (auto-fades) ───────
  if (state === "d-msg") {
    return (
      <div
        className="shelf"
        style={{
          paddingTop: 0,
          transition: "opacity 400ms ease",
          opacity: dMsgVisible ? 1 : 0,
        }}
      >
        <div
          style={{
            background: "var(--raised)",
            borderRadius: "var(--radius-card)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "16px",
          }}
        >
          <p className="text-sm font-semibold" style={{ marginBottom: 6 }}>
            No problem — nothing else changes.
          </p>
          <p
            style={{
              fontSize: 12.5,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            Your regular mix is still right where you left it. We&apos;ll just wait for a better
            moment to try again. If this keeps happening in the same kind of moment, we&apos;ll show
            up less often here — you&apos;re training this as much as we are.
          </p>
        </div>
      </div>
    );
  }

  // ── State A — the card ───────────────────────────────────────
  return (
    <div
      className={`shelf${melting ? " card-melt" : " fade-in"}`}
      style={{ paddingTop: 0 }}
    >
      <div className="song-card">
        {/* Header */}
        <div style={{ padding: "14px 16px 0" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--green)", marginBottom: 2 }}>
            ONE SONG IN
          </p>
          <p className="text-xs text-muted">Your next rotation candidate</p>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", gap: 14, padding: "12px 16px" }}>
          {/* Artwork — tappable to play preview */}
          <button
            id="card-artwork-play"
            onClick={() => play(track)}
            aria-label={`Play preview of ${track.title}`}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              flexShrink: 0,
              borderRadius: 8,
              overflow: "hidden",
              width: 90,
              height: 90,
              position: "relative",
            }}
          >
            <Image
              src={track.artwork_url}
              alt={track.title}
              width={90}
              height={90}
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
              unoptimized
            />
            {/* Play overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="white">
                <circle cx="14" cy="14" r="14" fill="rgba(0,0,0,0.4)" />
                <path d="M11 9.5l9 4.5-9 4.5V9.5z" fill="white" />
              </svg>
            </div>
          </button>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <p className="text-base font-bold truncate">{track.title}</p>
            <p className="text-sm text-muted truncate" style={{ marginBottom: 6 }}>
              {track.artist}
            </p>
            <button
              onClick={onReasonClick}
              style={{
                background: highlightInfo ? "rgba(255, 255, 255, 0.15)" : "none",
                border: "none",
                padding: highlightInfo ? "4px 8px" : "4px 0",
                margin: highlightInfo ? "0 -8px" : "0",
                borderRadius: 6,
                textAlign: "left",
                cursor: "pointer",
                width: highlightInfo ? "calc(100% + 16px)" : "100%",
                transition: "all 0.5s ease",
              }}
            >
              <p className="text-xs" style={{ color: highlightInfo ? "#FFFFFF" : "#B3B3B3", lineHeight: 1.5, display: "inline", transition: "color 0.5s ease" }}>
                {reasonLine}{" "}
                <span style={{ opacity: highlightInfo ? 1 : 0.5, fontSize: 10, transition: "opacity 0.5s ease", display: "inline-block", transform: highlightInfo ? "scale(1.2)" : "scale(1)" }}>ⓘ</span>
              </p>
            </button>
          </div>
        </div>

        {/* Coach Mark Beat 1 */}
        {showCoachMark && (
          <div
            style={{
              position: "absolute",
              top: -48,
              left: 16,
              background: "var(--green)",
              color: "#000",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              animation: "bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Spotify eased one new song in. Keep it or wave it off.</span>
            <button onClick={(e) => { e.stopPropagation(); dismissCoachMark(); }} style={{ background: "none", border: "none", padding: 4, cursor: "pointer", color: "#000" }}>✕</button>
            <div style={{ position: "absolute", bottom: -6, left: 16, width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid var(--green)" }} />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, padding: "0 16px 16px" }}>
          <button
            id="card-add-btn"
            className="btn-green"
            onClick={handleAdd}
            disabled={addDisabled}
            style={{ flex: 1, opacity: addDisabled ? 0.5 : 1 }}
          >
            Add it in
          </button>
          <button
            id="card-dismiss-btn"
            className="btn-ghost"
            onClick={handleDismiss}
            disabled={dismissDisabled}
            style={{ flex: 1, opacity: dismissDisabled ? 0.5 : 1 }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
