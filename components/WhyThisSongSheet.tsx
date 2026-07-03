"use client";
// components/WhyThisSongSheet.tsx
import { useEffect, useState } from "react";
import Link from "next/link";

type TraceData = {
  moment?: {
    label?: string;
    confidence?: number;
    reasoning?: string;
    source?: string;
  };
  hard_rules?: {
    fired?: string | null;
  };
  pick_or_silence_cause?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  trace?: TraceData;
  survivalRate?: number;
};

export function WhyThisSongSheet({ isOpen, onClose, trace, survivalRate = 75 }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isSilence = !!trace?.hard_rules?.fired || trace?.pick_or_silence_cause === "throttle" || trace?.pick_or_silence_cause === "no tracks survived all filters";

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "var(--surface)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: "24px 16px 32px",
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
          zIndex: 1000,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 className="text-xl font-bold">{isSilence ? "Why nothing new?" : "Why this song?"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Taste Match */}
          {!isSilence && (
            <div>
              <p className="text-sm font-bold text-green-500" style={{ color: "var(--green)", marginBottom: 4 }}>1. TASTE MATCH</p>
              <p className="text-base text-primary">Matched your taste profile.</p>
              <p className="text-xs text-muted mt-1">This is what any traditional recommender does.</p>
            </div>
          )}

          {/* Moment Inference */}
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--green)", marginBottom: 4 }}>{isSilence ? "1. MOMENT INFERENCE" : "2. MOMENT INFERENCE"}</p>
            {trace?.moment?.reasoning ? (
              <>
                <div style={{ background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 8, marginBottom: 8 }}>
                  <p className="text-sm text-primary italic">"{trace.moment.reasoning}"</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span className="text-xs text-muted uppercase">Live Llama 3.3 Inference</span>
                  <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${(trace.moment.confidence ?? 0) * 100}%`, height: "100%", background: "var(--green)" }} />
                  </div>
                  <span className="text-xs font-bold">{(trace.moment.confidence ?? 0) * 100}%</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-primary">Determined current context.</p>
            )}
          </div>

          {/* Proven / Hard rules */}
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--green)", marginBottom: 4 }}>{isSilence ? "2. HARD RULES" : "3. PROVEN"}</p>
            {isSilence ? (
              <p className="text-base text-primary">{trace?.pick_or_silence_cause || "System suppressed recommendations for this context."}</p>
            ) : (
              <p className="text-base text-primary">{Math.round(survivalRate * 100)}% of similar listeners kept it.</p>
            )}
          </div>
        </div>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-sm font-semibold" style={{ marginBottom: 8 }}>
            A traditional recommender has no representation of this moment — every play looks the same to it.
          </p>
          <Link href="/about" onClick={onClose} style={{ color: "var(--green)", fontSize: 14, textDecoration: "none", fontWeight: "bold" }}>
            Read how this prototype works →
          </Link>
        </div>
      </div>
    </>
  );
}
