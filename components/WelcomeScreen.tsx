"use client";
// components/WelcomeScreen.tsx
// ─────────────────────────────────────────────────────────────
// Opening splash shown on first visit.
// Dismissed via "Start Exploring" → stored in localStorage so
// it never appears again in the same browser session.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

interface WelcomeScreenProps {
  onDismiss: () => void;
}

const HOW_TO_TEST: { emoji: string; text: string }[] = [
  {
    emoji: "🎵",
    text: "One song, hand-picked by AI — just for this moment.",
  },
  {
    emoji: "👤",
    text: "Tap the avatar (top-left) to switch between listener personas.",
  },
  {
    emoji: "✅",
    text: "Keep or dismiss the card — every signal trains the rotation.",
  },
  {
    emoji: "🔄",
    text: "Hit the refresh icon to advance the day and get a fresh pick.",
  },
  {
    emoji: "💡",
    text: "Tap \"Why this song?\" on the card to see the AI's reasoning.",
  },
];

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Animate in after mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function handleStart() {
    setLeaving(true);
    setTimeout(onDismiss, 480);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        transition: "opacity 480ms ease",
        opacity: leaving ? 0 : visible ? 1 : 0,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "min(360px, calc(100vw - 32px))",
          maxHeight: "calc(100dvh - 48px)",
          overflowY: "auto",
          scrollbarWidth: "none",
          background:
            "linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(29,185,84,0.15)",
          padding: "36px 28px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          transition: "transform 480ms cubic-bezier(0.22,1,0.36,1), opacity 480ms ease",
          transform: leaving
            ? "scale(0.92) translateY(16px)"
            : visible
            ? "scale(1) translateY(0)"
            : "scale(0.88) translateY(24px)",
        }}
      >
        {/* Logo badge */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #1DB954 0%, #17a349 100%)",
              boxShadow: "0 0 32px rgba(29,185,84,0.4)",
              marginBottom: 16,
              fontSize: 28,
            }}
          >
            🎧
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#fff",
              marginBottom: 10,
              lineHeight: 1.2,
            }}
          >
            Welcome to{" "}
            <span style={{ color: "#1DB954" }}>One Song In</span>
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.65)",
              maxWidth: 280,
              margin: "0 auto",
            }}
          >
            An AI-powered music discovery MVP — each session surfaces{" "}
            <strong style={{ color: "rgba(255,255,255,0.85)" }}>
              exactly one song
            </strong>{" "}
            chosen for the right listener, in the right moment. Signals from
            every keep or dismiss feed back into the rotation algorithm in
            real time.
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "rgba(255,255,255,0.07)",
            margin: "4px 0 20px",
          }}
        />

        {/* How to test */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "18px 16px",
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              color: "#1DB954",
              marginBottom: 14,
            }}
          >
            How to test the MVP
          </p>

          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 11 }}>
            {HOW_TO_TEST.map(({ emoji, text }, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.78)",
                  animation: `welcomeItem 350ms ease ${100 + i * 60}ms both`,
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {emoji}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <button
          id="welcome-start-btn"
          onClick={handleStart}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #1DB954 0%, #17a349 100%)",
            color: "#000",
            fontWeight: 800,
            fontSize: 15,
            letterSpacing: "0.2px",
            padding: "14px 24px",
            borderRadius: 50,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(29,185,84,0.35)",
            transition: "transform 80ms ease, box-shadow 200ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(29,185,84,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(29,185,84,0.35)";
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)";
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.02)";
          }}
        >
          <span>Start Exploring</span>
          <span style={{ fontSize: 18 }}>→</span>
        </button>

        {/* Fine print */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "rgba(255,255,255,0.28)",
            marginTop: 14,
          }}
        >
          Spotify MVP · AI-inferenced rotation survival
        </p>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes welcomeItem {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
