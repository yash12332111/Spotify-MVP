"use client";
// components/WelcomeScreen.tsx
// ─────────────────────────────────────────────────────────────
// Opening splash shown on first visit. No scrolling — fits in
// one screen. Dismissed via "Start Exploring" button.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

interface WelcomeScreenProps {
  onDismiss: () => void;
}

const HOW_TO_TEST: { emoji: string; text: string }[] = [
  {
    emoji: "🎵",
    text: "Each session surfaces one AI-picked song — curated for this listener, right now.",
  },
  {
    emoji: "👤",
    text: "Tap the avatar (top-left) to switch personas and watch the AI adapt instantly.",
  },
  {
    emoji: "✅",
    text: "Keep or dismiss the card — each action feeds back into the rotation algorithm.",
  },
  {
    emoji: "ⓘ",
    text: "Tap the ⓘ icon on the card to see exactly why the AI chose this song.",
  },
];

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

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
        padding: "16px",
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        transition: "opacity 480ms ease",
        opacity: leaving ? 0 : visible ? 1 : 0,
        pointerEvents: leaving ? "none" : "auto",
      }}
    >
      {/* Card — no overflow, no scroll */}
      <div
        style={{
          width: "min(360px, 100%)",
          background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(29,185,84,0.15)",
          padding: "24px 24px 20px",
          display: "flex",
          flexDirection: "column",
          transition: "transform 480ms cubic-bezier(0.22,1,0.36,1), opacity 480ms ease",
          transform: leaving
            ? "scale(0.92) translateY(16px)"
            : visible
            ? "scale(1) translateY(0)"
            : "scale(0.88) translateY(24px)",
        }}
      >
        {/* Header row: badge + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
          <div
            style={{
              flexShrink: 0,
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1DB954 0%, #17a349 100%)",
              boxShadow: "0 0 24px rgba(29,185,84,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            🎧
          </div>
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.4px",
                color: "#fff",
                lineHeight: 1.2,
                marginBottom: 2,
              }}
            >
              Welcome to{" "}
              <span style={{ color: "#1DB954" }}>One Song In</span>
            </h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.3 }}>
              AI-powered music discovery MVP
            </p>
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.6)",
            marginBottom: 14,
          }}
        >
          Every session, the AI picks{" "}
          <strong style={{ color: "rgba(255,255,255,0.88)" }}>exactly one song</strong>{" "}
          for the right listener at the right moment. Keeps and dismisses shape the rotation in real time.
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 14 }} />

        {/* How to test */}
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.9px",
            textTransform: "uppercase",
            color: "#1DB954",
            marginBottom: 10,
          }}
        >
          How to test the MVP
        </p>

        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
          {HOW_TO_TEST.map(({ emoji, text }, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.75)",
                animation: `welcomeItem 320ms ease ${80 + i * 55}ms both`,
              }}
            >
              <span style={{ fontSize: 15, flexShrink: 0, marginTop: 0 }}>{emoji}</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          id="welcome-start-btn"
          onClick={handleStart}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #1DB954 0%, #17a349 100%)",
            color: "#000",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: "0.1px",
            padding: "13px 24px",
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
          <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>

      <style>{`
        @keyframes welcomeItem {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
