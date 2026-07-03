import Link from "next/link";

export default function AboutPage() {
  return (
    <div style={{ padding: "52px 16px 32px", color: "var(--text-primary)" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", marginRight: 16 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold">About One Song In</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 64 }}>
        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--green)", marginBottom: 8, textTransform: "uppercase" }}>The Problem</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
            Traditional recommenders optimize for immediate engagement ("keep them listening now"). They don't know the difference between a Tuesday night study session and a Friday morning commute — a play is a play. This leads to safe, repetitive recommendations that rarely push boundaries or truly expand a listener's rotation.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--green)", marginBottom: 8, textTransform: "uppercase" }}>The Architecture</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
            This prototype demonstrates a new approach using three filters:
          </p>
          <ul className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.5, paddingLeft: 16, marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>
              <strong>1. Taste:</strong> A basic dot-product matrix matching tracks to a listener's historical mood/energy preferences.
            </li>
            <li>
              <strong>2. Moment (The AI Layer):</strong> We use a live LLM (Llama 3.3 via Groq) to infer the listener's exact physical and emotional context at this exact moment. If the moment requires focus or sleep, the system stays silent.
            </li>
            <li>
              <strong>3. Proven:</strong> We rank surviving tracks by their long-term survival rate among similar listeners, not short-term engagement.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--green)", marginBottom: 8, textTransform: "uppercase" }}>Asymmetric Learning</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
            When you dismiss a track, we only slightly penalize that context. But when you keep a track, we massively shift your taste vector toward its acoustic properties. We learn heavily from what you accept, and lightly from what you reject.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--green)", marginBottom: 8, textTransform: "uppercase" }}>Scope & Simulation</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
            This is a functional prototype built for demonstration (Live at <a href="https://spotify-mvp-chi.vercel.app/" style={{ color: "var(--green)" }}>https://spotify-mvp-chi.vercel.app/</a>). The "catalog" is limited to ~60 tracks. The "moment" is simulated based on the chosen persona (Ishita, Vaishnavi, Haripriya) rather than your actual device sensors. The AI inference, however, is real and runs live on every pick.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-bold" style={{ color: "var(--green)", marginBottom: 8, textTransform: "uppercase" }}>North Star</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.5 }}>
            Our success metric isn't plays. It's <strong>"New songs added to long-term rotation."</strong> A song only counts if you keep it and then organically listen to it three more times on different days.
          </p>
        </section>
      </div>
    </div>
  );
}
