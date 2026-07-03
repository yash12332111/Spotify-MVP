"use client";
// components/PersonaSheet.tsx
import { useEffect, useState } from "react";
import Image from "next/image";

type LivePersona = {
  id: string;
  name: string;
  default_moment: string;
  default_time: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  personas: LivePersona[];
  activePersonaId?: string;
  onSelect: (personaId: string) => void;
};

export function PersonaSheet({ isOpen, onClose, personas, activePersonaId, onSelect }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

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
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 className="text-xl font-bold">Switch listener</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 8 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {personas.map((p) => {
            const isActive = p.id === activePersonaId;
            return (
              <button
                key={p.id}
                onClick={() => {
                  onSelect(p.id);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: "none",
                  border: "none",
                  padding: "8px 0",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: p.name === "Ishita" ? "#b91d54" : p.name === "Vaishnavi" ? "#1db954" : "#1d4ed8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: 20,
                    outline: isActive ? "2px solid var(--green)" : "none",
                    outlineOffset: 2,
                  }}
                >
                  {p.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <p className="text-base font-bold" style={{ color: isActive ? "var(--green)" : "var(--text-primary)" }}>
                    {p.name}
                  </p>
                  <p className="text-sm text-muted">
                    {p.name === "Ishita" && "Post-study wind-down, Tuesday 9 PM"}
                    {p.name === "Vaishnavi" && "Weekday morning commute"}
                    {p.name === "Haripriya" && "Saturday lean-back afternoon"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <p className="text-xs text-muted" style={{ opacity: 0.6 }}>
            Each listener demonstrates a different system state
          </p>
        </div>
      </div>
    </>
  );
}
