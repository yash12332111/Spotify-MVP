// app/(shell)/layout.tsx
// ─────────────────────────────────────────────────────────────
// The phone-frame chrome wrapper for all shell pages.
// - 390px centered on desktop, full-width on mobile (< 640px)
// - BottomTabs + NowPlayingBar fixed at bottom inside the frame
// - page-scroll area above the bottom bar
// ─────────────────────────────────────────────────────────────
import { BottomTabs } from "@/components/BottomTabs";
import { NowPlayingBar } from "@/components/NowPlayingBar";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="phone-frame">
      {/* Scrollable page content */}
      <main className="page-scroll">{children}</main>

      {/* Fixed bottom bar: NowPlayingBar + BottomTabs */}
      <div className="bottom-bar">
        <NowPlayingBar />
        <BottomTabs />
      </div>
    </div>
  );
}
