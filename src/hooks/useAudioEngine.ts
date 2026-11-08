"use client";

import { useEffect, useRef, type Dispatch, type RefObject } from "react";
import { currentTrackId, type PlayerAction } from "@/lib/playerReducer";
import type { PlayerState } from "@/lib/types";
import { formatTime, MEDIA_ERROR_MESSAGES } from "@/lib/utils";

/** Tracks at least this long resume where you left off (podcasts, mixes). */
export const RESUME_MIN_DURATION = 300;

export function useAudioEngine(
  audioRef: RefObject<HTMLAudioElement | null>,
  state: PlayerState,
  dispatch: Dispatch<PlayerAction>,
) {
  const stateRef = useRef(state);
  stateRef.current = state;
  const pendingResume = useRef<number | null>(null);
  const skipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackId = currentTrackId(state);
  const track = trackId ? state.tracks[trackId] : undefined;

  // 1. Create the element and subscribe to its events once.
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const log = (event: string, detail?: string) =>
      dispatch({ type: "LOG", event, detail, at: Date.now() });

    const handlers: Record<string, (e: Event) => void> = {
      loadstart: () => {
        dispatch({ type: "MEDIA_STATUS", status: "loading" });
        log("loadstart");
      },
      loadedmetadata: () => {
        const d = audio.duration;
        dispatch({ type: "MEDIA_DURATION", duration: d });
        const id = audio.dataset.trackId;
        if (id) {
          dispatch({
            type: "UPDATE_TRACK",
            id,
            patch: { duration: d, isLive: !Number.isFinite(d) },
          });
        }
        const resumeAt = pendingResume.current;
        pendingResume.current = null;
        if (
          resumeAt !== null &&
          Number.isFinite(d) &&
          d >= RESUME_MIN_DURATION &&
          resumeAt > 10 &&
          resumeAt < d - 10
        ) {
          audio.currentTime = resumeAt;
          log("resume", `picked up at ${formatTime(resumeAt)}`);
        }
        log("loadedmetadata", Number.isFinite(d) ? formatTime(d) : "live stream");
      },
      canplay: () => {
        dispatch({ type: "MEDIA_CANPLAY", paused: audio.paused });
        log("canplay");
      },
      play: () => log("play"),
      playing: () => {
        dispatch({ type: "MEDIA_STATUS", status: "playing" });
        log("playing");
      },
      pause: () => {
        if (!audio.ended && stateRef.current.status !== "error") {
          dispatch({ type: "MEDIA_STATUS", status: "paused" });
        }
        log("pause");
      },
      waiting: () => {
        dispatch({ type: "MEDIA_STATUS", status: "buffering" });
        log("waiting", "buffer underrun");
      },
      stalled: () => log("stalled", "no data arriving"),
      seeking: () => log("seeking", formatTime(audio.currentTime)),
      seeked: () => log("seeked", formatTime(audio.currentTime)),
      timeupdate: () => dispatch({ type: "MEDIA_TIME", currentTime: audio.currentTime }),
      progress: () => {
        const b = audio.buffered;
        if (b.length > 0) dispatch({ type: "MEDIA_BUFFERED", end: b.end(b.length - 1) });
      },
      ratechange: () => log("ratechange", `${audio.playbackRate}×`),
      volumechange: () =>
        log("volumechange", audio.muted ? "muted" : `${Math.round(audio.volume * 100)}%`),
      ended: () => {
        log("ended");
        const s = stateRef.current;
        // Repeat-one restarts in place without touching the queue.
        if (s.repeat === "one" && s.sleep.mode !== "endOfTrack") {
          audio.currentTime = 0;
          void audio.play().catch(() => undefined);
          return;
        }
        dispatch({ type: "MEDIA_ENDED" });
      },
      error: () => {
        const code = audio.error?.code ?? 0;
        // An empty src after "stop" also raises error 4; ignore that.
        if (!audio.getAttribute("src")) return;
        const message = MEDIA_ERROR_MESSAGES[code] ?? "Unknown playback error.";
        dispatch({ type: "MEDIA_ERROR", message });
        log("error", message);

        // Smart skip: if there is more in the queue, move on after a beat.
        const s = stateRef.current;
        const hasNext = s.queueIndex < s.queue.length - 1 || s.repeat === "all";
        if (hasNext && s.queue.length > 1) {
          if (skipTimer.current) clearTimeout(skipTimer.current);
          skipTimer.current = setTimeout(() => {
            log("autoskip", "skipping unplayable track");
            dispatch({ type: "NEXT" });
            dispatch({ type: "SET_INTENT", intent: "play" });
          }, 2000);
        }
      },
    };

    for (const [name, fn] of Object.entries(handlers)) audio.addEventListener(name, fn);
    return () => {
      for (const [name, fn] of Object.entries(handlers)) audio.removeEventListener(name, fn);
      if (skipTimer.current) clearTimeout(skipTimer.current);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, [audioRef, dispatch]);

  // 2. Swap the source when the current track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (skipTimer.current) {
      clearTimeout(skipTimer.current);
      skipTimer.current = null;
    }
    if (!track) {
      if (audio.getAttribute("src")) {
        audio.pause();
        audio.removeAttribute("src");
        delete audio.dataset.trackId;
        audio.load();
      }
      return;
    }
    if (audio.dataset.trackId === track.id && audio.getAttribute("src") === track.src) {
      // Same track re-loaded (e.g. repeat-all wrapped a one-track queue): restart in place.
      audio.currentTime = 0;
      dispatch({ type: "MEDIA_STATUS", status: audio.paused ? "paused" : "playing" });
      return;
    }
    pendingResume.current = stateRef.current.resume[track.id] ?? null;
    audio.dataset.trackId = track.id;
    audio.src = track.src;
    audio.load();
  }, [audioRef, dispatch, track?.id, track?.src, state.loadSeq]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Apply play/pause intent. Re-run when the track changes so a new
  //    source starts automatically when the user wants playback.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.getAttribute("src")) return;
    if (state.intent === "play") {
      if (audio.ended) audio.currentTime = 0;
      audio.play().catch((err: DOMException) => {
        if (err.name === "AbortError") return; // interrupted by a new load()
        dispatch({ type: "SET_INTENT", intent: "pause" });
        dispatch({
          type: "LOG",
          event: "play-rejected",
          detail: err.name === "NotAllowedError" ? "blocked by autoplay policy" : err.message,
          at: Date.now(),
        });
      });
    } else if (!audio.paused) {
      audio.pause();
    }
  }, [audioRef, dispatch, state.intent, track?.id, state.loadSeq]);

  // 4. Output settings.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = state.volume;
    audio.muted = state.muted;
  }, [audioRef, state.volume, state.muted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = state.rate;
  }, [audioRef, state.rate, track?.id]);
}
