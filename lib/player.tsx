"use client";
// lib/player.tsx
// ─────────────────────────────────────────────────────────────
// Global audio player context.
// Rules:
//  - ONE <audio> element for the entire app lifetime
//  - play(track) must be called synchronously inside a user tap
//    handler (no await before it) — iOS Safari requirement (E1-2)
//  - iOS first-tap unlock: muted play()+pause() on first interaction
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
  unlock: () => void; // call on first user tap anywhere
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
    audio.preload = "none"; // don't preload — preview URLs are always ready
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
    };
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
  const play = useCallback((newTrack: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    unlock();

    // pause before changing src to avoid DOMException (E1-5)
    audio.pause();

    if (track?.id !== newTrack.id) {
      audio.src = newTrack.preview_url;
      audio.currentTime = 0;
      setTrack(newTrack);
      setProgress(0);
    }

    // synchronous .play() call — no await here (E1-2)
    audio.play().catch((err: Error) => {
      console.warn("[player] play() failed:", err.message);
      setPlaying(false);
      // Toast would go here in a later phase
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
