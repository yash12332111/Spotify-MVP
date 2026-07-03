"use client";
// lib/player.tsx
// ─────────────────────────────────────────────────────────────
// Global audio player context.
// Rules:
//  - ONE <audio> element for the entire app lifetime
//  - play(track) must be called synchronously inside a user tap
//    handler (no await before it) — iOS Safari requirement (E1-2)
//  - iOS first-tap unlock: muted play()+pause() on first interaction
//  - On CDN expiry, auto-retry via /api/itunes-preview
//  - Always .catch() the play() promise (E1-1)
//  - Guard NaN duration before computing progress (E1-6)
//  - pause() before changing src to avoid DOMException (E1-5)
// ─────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Track } from "./seedData";

type PlayerState = {
  track: Track | null;
  playing: boolean;
  progress: number; // 0–1
  play: (track: Track) => void;
  pause: () => void;
  toggle: () => void;
  unlock: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const unlockedRef = useRef(false);

  // Create the single global audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const onEnded = () => { setPlaying(false); setProgress(0); };
    const onPause = () => setPlaying(false);
    const onPlay  = () => setPlaying(true);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("play", onPlay);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("play", onPlay);
      audio.pause();
    };
  }, []);

  // iOS first-tap audio context unlock (E1-3)
  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = true;
    audio.play().then(() => {
      audio.pause();
      audio.muted = false;
      audio.currentTime = 0;
    }).catch(() => {
      audio.muted = false;
    });
  }, []);

  // play — MUST be called synchronously in a tap handler (E1-2)
  // Auto-retries with a fresh iTunes URL if the CDN link has expired.
  const play = useCallback((newTrack: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    unlock();
    audio.pause();

    if (track?.id !== newTrack.id) {
      audio.src = newTrack.preview_url;
      audio.currentTime = 0;
      setTrack(newTrack);
      setProgress(0);
    }

    // Synchronous .play() — no await before this (E1-2)
    audio.play().catch(async (err: Error) => {
      console.warn("[player] play() failed, trying iTunes fallback:", err.message);

      // NotAllowedError = genuine autoplay block, don't retry
      if (err.name === "NotAllowedError") {
        console.warn("[player] Autoplay blocked — needs user gesture");
        return;
      }

      // Any other error: CDN expiry, network glitch — fetch fresh URL
      try {
        const res = await fetch(
          `/api/itunes-preview?title=${encodeURIComponent(newTrack.title)}&artist=${encodeURIComponent(newTrack.artist)}`
        );
        if (!res.ok) throw new Error(`itunes-preview returned ${res.status}`);
        const data = (await res.json()) as { previewUrl: string };
        if (!data.previewUrl) throw new Error("no previewUrl in response");

        // Retry with fresh URL. The audio context is already unlocked
        // by the initial tap, so this async retry will work on iOS too.
        audio.pause();
        audio.src = data.previewUrl;
        audio.currentTime = 0;
        audio.play().catch((retryErr: Error) => {
          console.warn("[player] Retry also failed:", retryErr.message);
          setPlaying(false);
        });
      } catch (fetchErr) {
        console.warn("[player] iTunes fallback fetch failed:", fetchErr);
        setPlaying(false);
      }
    });
  }, [track, unlock]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch((err: Error) => {
        console.warn("[player] toggle play() failed:", err.message);
      });
    }
  }, [playing, track]);

  return (
    <PlayerContext.Provider value={{ track, playing, progress, play, pause, toggle, unlock }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerState {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within <PlayerProvider>");
  return ctx;
}
