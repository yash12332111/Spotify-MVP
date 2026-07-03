// app/(shell)/layout.tsx
// ─────────────────────────────────────────────────────────────
// The chrome wrapper for all shell pages (Home, Search, Library).
// Phase 0: empty shell — just renders children.
// Phase 1: add phone frame, BottomTabs, NowPlayingBar.
// ─────────────────────────────────────────────────────────────
export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
