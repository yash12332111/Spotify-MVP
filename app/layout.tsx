import type { Metadata } from "next";
import "./globals.css";
import { PlayerProvider } from "@/lib/player";

export const metadata: Metadata = {
  title: "One Song In",
  description:
    "A Spotify-mirror MVP demonstrating AI-inferenced music discovery with signal-loop rotation survival.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Figtree from Google Fonts — loaded via CSS @import in globals.css */}
      </head>
      <body>
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}
