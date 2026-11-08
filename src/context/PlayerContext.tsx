"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useMediaSession } from "@/hooks/useMediaSession";
import { catalogToState, type Catalog } from "@/lib/catalog";
import { currentTrackId, initialState, playerReducer } from "@/lib/playerReducer";
import { genreFilters } from "@/lib/genres";
import { loadSettings, saveSettings } from "@/lib/storage";
import type { PlayerState, Track } from "@/lib/types";
import { shuffled } from "@/lib/utils";

export interface PlayerControls {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  playTrack: (trackId: string, contextIds: string[]) => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  seekBy: (d: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  showLibrary: () => void;
  showPlaylist: (id: string) => void;
  showGenre: (genre: string) => void;
}

interface PlayerContextValue {
  state: PlayerState;
  artist: string;
  currentTrack: Track | undefined;
  /** Track ids for the list on screen ("All beats" or the selected genre). */
  visibleIds: string[];
  /** Genre filters to offer: only genres that at least one beat has (src/lib/genres.ts). */
  genres: string[];
  controls: PlayerControls;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

/** Read a file's duration without touching the main audio element. */
function probeDuration(src: string, onDone: (d: number) => void) {
  const a = new Audio();
  a.preload = "metadata";
  const finish = () => {
    a.removeAttribute("src");
    a.load();
  };
  a.addEventListener(
    "loadedmetadata",
    () => {
      onDone(a.duration);
      finish();
    },
    { once: true },
  );
  a.addEventListener("error", finish, { once: true });
  a.src = src;
}

const fromCatalog = (catalog: Catalog): PlayerState => ({ ...initialState, ...catalogToState(catalog) });

export function PlayerProvider({ catalog, children }: { catalog: Catalog; children: ReactNode }) {
  // The catalog seeds state on the server too, so the tracklist is in the HTML.
  const [state, dispatch] = useReducer(playerReducer, catalog, fromCatalog);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---- saved listener settings ----
  useEffect(() => {
    dispatch({ type: "APPLY_SETTINGS", payload: loadSettings() });
  }, []);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!state.hydrated || saveTimer.current) return;
    // Throttled: playback updates `resume` several times a second.
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      saveSettings(stateRef.current);
    }, 2000);
  }, [state.hydrated, state.volume, state.muted, state.repeat, state.resume]);
  useEffect(() => {
    const flush = () => stateRef.current.hydrated && saveSettings(stateRef.current);
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  // ---- fill in durations tracks.json leaves out ----
  useEffect(() => {
    for (const t of Object.values(stateRef.current.tracks)) {
      if (t.duration !== undefined) continue;
      probeDuration(t.src, (d) =>
        dispatch({ type: "UPDATE_TRACK", id: t.id, patch: { duration: d, isLive: !Number.isFinite(d) } }),
      );
    }
  }, []);

  useAudioEngine(audioRef, state, dispatch);

  const listFor = useCallback((s: PlayerState) => {
    if (s.view.kind === "playlist") {
      const id = s.view.id;
      return s.playlists.find((p) => p.id === id)?.trackIds ?? [];
    }
    if (s.view.kind === "genre") {
      const genre = s.view.genre;
      return s.libraryOrder.filter((id) => s.tracks[id]?.genre?.trim() === genre);
    }
    return s.libraryOrder;
  }, []);

  const controls = useMemo<PlayerControls>(() => {
    const seek = (t: number) => {
      const audio = audioRef.current;
      if (!audio || !Number.isFinite(audio.duration)) return;
      const clamped = Math.max(0, Math.min(audio.duration, t));
      audio.currentTime = clamped;
      dispatch({ type: "MEDIA_TIME", currentTime: clamped });
    };
    const queueFor = (trackId: string, ids: string[], shuffle: boolean) =>
      shuffle ? [trackId, ...shuffled(ids.filter((id) => id !== trackId))] : ids;
    const start = (trackId: string, ids: string[]) => {
      const s = stateRef.current;
      dispatch({ type: "PLAY_TRACK", trackId, contextIds: ids, queue: queueFor(trackId, ids, s.shuffle) });
    };

    return {
      play: () => dispatch({ type: "SET_INTENT", intent: "play" }),
      pause: () => dispatch({ type: "SET_INTENT", intent: "pause" }),
      toggle: () => {
        const s = stateRef.current;
        if (currentTrackId(s) === null) {
          const ids = listFor(s);
          const first = s.shuffle ? shuffled(ids)[0] : ids[0];
          if (first) start(first, ids);
          return;
        }
        dispatch({ type: "SET_INTENT", intent: s.intent === "play" ? "pause" : "play" });
      },
      playTrack: (trackId, ids) => {
        const s = stateRef.current;
        if (currentTrackId(s) === trackId) {
          dispatch({ type: "SET_INTENT", intent: s.intent === "play" ? "pause" : "play" });
          return;
        }
        start(trackId, ids);
      },
      next: () => dispatch({ type: "NEXT" }),
      prev: () => {
        const s = stateRef.current;
        // First press restarts the track, a second press goes back.
        if (s.currentTime > 3 || (s.queueIndex <= 0 && s.repeat !== "all")) seek(0);
        else dispatch({ type: "PREV" });
      },
      seek,
      seekBy: (delta) => seek((audioRef.current?.currentTime ?? 0) + delta),
      setVolume: (v) => dispatch({ type: "SET_VOLUME", volume: v }),
      toggleMute: () => dispatch({ type: "TOGGLE_MUTE" }),
      cycleRepeat: () => dispatch({ type: "CYCLE_REPEAT" }),
      toggleShuffle: () => {
        const s = stateRef.current;
        const on = !s.shuffle;
        const cur = currentTrackId(s);
        const queue = on ? (cur ? queueFor(cur, s.contextIds, true) : shuffled(s.contextIds)) : s.contextIds;
        dispatch({ type: "SET_SHUFFLE", shuffle: on, queue });
      },
      showLibrary: () => dispatch({ type: "SET_VIEW", view: { kind: "library" } }),
      showPlaylist: (id) => dispatch({ type: "SET_VIEW", view: { kind: "playlist", id } }),
      showGenre: (genre) => dispatch({ type: "SET_VIEW", view: { kind: "genre", genre } }),
    };
  }, [listFor]);

  const id = currentTrackId(state);
  const currentTrack = id ? state.tracks[id] : undefined;

  useMediaSession(currentTrack, state.status, state.duration, state.currentTime, state.rate, {
    play: controls.play,
    pause: controls.pause,
    next: controls.next,
    prev: controls.prev,
    seek: controls.seek,
    seekBy: controls.seekBy,
  });

  useKeyboardShortcuts({
    toggle: controls.toggle,
    seekBy: controls.seekBy,
    next: controls.next,
    prev: controls.prev,
    volumeBy: (delta) => controls.setVolume(stateRef.current.volume + delta),
    toggleMute: controls.toggleMute,
    toggleShuffle: controls.toggleShuffle,
    cycleRepeat: controls.cycleRepeat,
  });

  const visibleIds = useMemo(() => listFor(state), [listFor, state]);
  const genres = useMemo(
    () => genreFilters(state.libraryOrder.map((id) => state.tracks[id]?.genre)),
    [state.libraryOrder, state.tracks],
  );

  const value = useMemo(
    () => ({ state, artist: catalog.artist, currentTrack, visibleIds, genres, controls }),
    [state, catalog.artist, currentTrack, visibleIds, genres, controls],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
