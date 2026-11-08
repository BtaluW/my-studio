"use client";

import { useEffect, useRef } from "react";
import type { PlaybackStatus, Track } from "@/lib/types";

interface Handlers {
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  seekBy: (d: number) => void;
}

/** Lock-screen / hardware media keys / OS media overlay integration. */
export function useMediaSession(
  track: Track | undefined,
  status: PlaybackStatus,
  duration: number,
  currentTime: number,
  rate: number,
  handlers: Handlers,
) {
  const h = useRef(handlers);
  h.current = handlers;

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const set = (action: MediaSessionAction, fn: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, fn);
      } catch {
        /* action unsupported in this browser */
      }
    };
    set("play", () => h.current.play());
    set("pause", () => h.current.pause());
    set("nexttrack", () => h.current.next());
    set("previoustrack", () => h.current.prev());
    set("seekforward", (d) => h.current.seekBy(d.seekOffset ?? 10));
    set("seekbackward", (d) => h.current.seekBy(-(d.seekOffset ?? 10)));
    set("seekto", (d) => d.seekTime !== undefined && h.current.seek(d.seekTime));
    return () => {
      for (const a of [
        "play",
        "pause",
        "nexttrack",
        "previoustrack",
        "seekforward",
        "seekbackward",
        "seekto",
      ] as MediaSessionAction[]) {
        set(a, null);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = track
      ? new MediaMetadata({ title: track.title, artist: track.artist, album: track.genre ?? "" })
      : null;
  }, [track?.id, track?.title, track?.artist]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState =
      status === "playing" || status === "buffering" ? "playing" : track ? "paused" : "none";
  }, [status, track]);

  // Position updates only on discrete changes, not every timeupdate tick.
  const whole = Math.floor(currentTime / 5);
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    if (!Number.isFinite(duration) || duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: rate,
        position: Math.min(currentTime, duration),
      });
    } catch {
      /* ignore invalid states during track switches */
    }
  }, [duration, rate, whole, status]); // eslint-disable-line react-hooks/exhaustive-deps
}
