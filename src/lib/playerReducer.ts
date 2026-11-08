import type {
  PlaybackStatus,
  PlayerState,
  Playlist,
  RepeatMode,
  SleepTimer,
  Track,
  View,
} from "./types";

export const MAX_EVENTS = 80;

export const initialState: PlayerState = {
  hydrated: false,
  tracks: {},
  libraryOrder: [],
  playlists: [],
  view: { kind: "library" },
  contextIds: [],
  queue: [],
  queueIndex: -1,
  loadSeq: 0,
  intent: "pause",
  status: "idle",
  currentTime: 0,
  duration: 0,
  bufferedEnd: 0,
  error: null,
  volume: 0.8,
  muted: false,
  rate: 1,
  repeat: "off",
  shuffle: false,
  sleep: { mode: "off" },
  resume: {},
  events: [],
  eventSeq: 0,
};

export type PlayerAction =
  // persistence
  | { type: "APPLY_SETTINGS"; payload: Partial<Pick<PlayerState, "volume" | "muted" | "repeat" | "resume">> }
  // library
  | { type: "ADD_TRACKS"; tracks: Track[]; playlistId?: string }
  | { type: "UPDATE_TRACK"; id: string; patch: Partial<Track> }
  | { type: "REMOVE_TRACK"; id: string }
  // playlists
  | { type: "CREATE_PLAYLIST"; playlist: Playlist }
  | { type: "RENAME_PLAYLIST"; id: string; name: string }
  | { type: "DELETE_PLAYLIST"; id: string }
  | { type: "ADD_TO_PLAYLIST"; playlistId: string; trackId: string }
  | { type: "REMOVE_FROM_PLAYLIST"; playlistId: string; index: number }
  | { type: "MOVE_IN_PLAYLIST"; playlistId: string; from: number; to: number }
  | { type: "SET_VIEW"; view: View }
  // transport (user intent)
  | { type: "PLAY_TRACK"; trackId: string; contextIds: string[]; queue: string[]; shuffle?: boolean }
  | { type: "SET_INTENT"; intent: "play" | "pause"; reason?: string }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "SET_VOLUME"; volume: number }
  | { type: "TOGGLE_MUTE" }
  | { type: "SET_RATE"; rate: number }
  | { type: "CYCLE_REPEAT" }
  | { type: "SET_SHUFFLE"; shuffle: boolean; queue: string[] }
  | { type: "SET_SLEEP"; sleep: SleepTimer }
  | { type: "SLEEP_FIRED" }
  // media element events
  | { type: "MEDIA_STATUS"; status: PlaybackStatus }
  | { type: "MEDIA_CANPLAY"; paused: boolean }
  | { type: "MEDIA_DURATION"; duration: number }
  | { type: "MEDIA_TIME"; currentTime: number }
  | { type: "MEDIA_BUFFERED"; end: number }
  | { type: "MEDIA_ENDED" }
  | { type: "MEDIA_ERROR"; message: string }
  // event log
  | { type: "LOG"; event: string; detail?: string; at: number }
  | { type: "CLEAR_LOG" };

export const currentTrackId = (s: PlayerState): string | null =>
  s.queueIndex >= 0 ? s.queue[s.queueIndex] ?? null : null;

const REPEAT_ORDER: RepeatMode[] = ["off", "all", "one"];

function updatePlaylist(
  playlists: Playlist[],
  id: string,
  fn: (p: Playlist) => Playlist,
): Playlist[] {
  return playlists.map((p) => (p.id === id ? fn(p) : p));
}

/** Move to a new queue position and reset per-track media state. */
function goTo(state: PlayerState, index: number): PlayerState {
  return {
    ...state,
    queueIndex: index,
    loadSeq: state.loadSeq + 1,
    currentTime: 0,
    duration: 0,
    bufferedEnd: 0,
    error: null,
    status: "loading",
  };
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "APPLY_SETTINGS":
      return { ...state, ...action.payload, hydrated: true };

    case "ADD_TRACKS": {
      const tracks = { ...state.tracks };
      const newIds: string[] = [];
      for (const t of action.tracks) {
        tracks[t.id] = t;
        newIds.push(t.id);
      }
      let playlists = state.playlists;
      if (action.playlistId) {
        playlists = updatePlaylist(playlists, action.playlistId, (p) => ({
          ...p,
          trackIds: [...p.trackIds, ...newIds],
        }));
      }
      return { ...state, tracks, libraryOrder: [...state.libraryOrder, ...newIds], playlists };
    }

    case "UPDATE_TRACK": {
      const t = state.tracks[action.id];
      if (!t) return state;
      return { ...state, tracks: { ...state.tracks, [action.id]: { ...t, ...action.patch } } };
    }

    case "REMOVE_TRACK": {
      const { [action.id]: _removed, ...tracks } = state.tracks;
      const current = currentTrackId(state);
      const queue = state.queue.filter((id) => id !== action.id);
      const removingCurrent = current === action.id;
      const { [action.id]: _r, ...resume } = state.resume;
      return {
        ...state,
        tracks,
        resume,
        libraryOrder: state.libraryOrder.filter((id) => id !== action.id),
        playlists: state.playlists.map((p) => ({
          ...p,
          trackIds: p.trackIds.filter((id) => id !== action.id),
        })),
        contextIds: state.contextIds.filter((id) => id !== action.id),
        queue,
        queueIndex: removingCurrent ? -1 : current ? queue.indexOf(current) : -1,
        ...(removingCurrent
          ? { intent: "pause" as const, status: "idle" as const, currentTime: 0, duration: 0 }
          : {}),
      };
    }

    case "CREATE_PLAYLIST":
      return {
        ...state,
        playlists: [...state.playlists, action.playlist],
        view: { kind: "playlist", id: action.playlist.id },
      };

    case "RENAME_PLAYLIST":
      return {
        ...state,
        playlists: updatePlaylist(state.playlists, action.id, (p) => ({
          ...p,
          name: action.name.trim() || p.name,
        })),
      };

    case "DELETE_PLAYLIST":
      return {
        ...state,
        playlists: state.playlists.filter((p) => p.id !== action.id),
        view:
          state.view.kind === "playlist" && state.view.id === action.id
            ? { kind: "library" }
            : state.view,
      };

    case "ADD_TO_PLAYLIST":
      return {
        ...state,
        playlists: updatePlaylist(state.playlists, action.playlistId, (p) =>
          p.trackIds.includes(action.trackId)
            ? p
            : { ...p, trackIds: [...p.trackIds, action.trackId] },
        ),
      };

    case "REMOVE_FROM_PLAYLIST":
      return {
        ...state,
        playlists: updatePlaylist(state.playlists, action.playlistId, (p) => ({
          ...p,
          trackIds: p.trackIds.filter((_, i) => i !== action.index),
        })),
      };

    case "MOVE_IN_PLAYLIST":
      return {
        ...state,
        playlists: updatePlaylist(state.playlists, action.playlistId, (p) => {
          const ids = p.trackIds.slice();
          const to = Math.max(0, Math.min(ids.length - 1, action.to));
          const [moved] = ids.splice(action.from, 1);
          if (moved === undefined) return p;
          ids.splice(to, 0, moved);
          return { ...p, trackIds: ids };
        }),
      };

    case "SET_VIEW":
      return { ...state, view: action.view };

    case "PLAY_TRACK": {
      const index = action.queue.indexOf(action.trackId);
      if (index < 0) return state;
      return {
        ...goTo(state, index),
        contextIds: action.contextIds,
        queue: action.queue,
        shuffle: action.shuffle ?? state.shuffle,
        intent: "play",
      };
    }

    case "SET_INTENT":
      if (currentTrackId(state) === null) return state;
      return { ...state, intent: action.intent };

    case "NEXT": {
      if (state.queue.length === 0) return state;
      const atEnd = state.queueIndex >= state.queue.length - 1;
      if (atEnd && state.repeat !== "all") return state;
      return goTo(state, atEnd ? 0 : state.queueIndex + 1);
    }

    case "PREV": {
      if (state.queue.length === 0) return state;
      const atStart = state.queueIndex <= 0;
      if (atStart && state.repeat !== "all") return state;
      return goTo(state, atStart ? state.queue.length - 1 : state.queueIndex - 1);
    }

    case "SET_VOLUME": {
      const volume = Math.max(0, Math.min(1, action.volume));
      return { ...state, volume, muted: volume === 0 ? true : false };
    }

    case "TOGGLE_MUTE":
      return { ...state, muted: !state.muted, volume: state.muted && state.volume === 0 ? 0.5 : state.volume };

    case "SET_RATE":
      return { ...state, rate: action.rate };

    case "CYCLE_REPEAT":
      return {
        ...state,
        repeat: REPEAT_ORDER[(REPEAT_ORDER.indexOf(state.repeat) + 1) % REPEAT_ORDER.length],
      };

    case "SET_SHUFFLE": {
      const current = currentTrackId(state);
      return {
        ...state,
        shuffle: action.shuffle,
        queue: action.queue,
        queueIndex: current ? action.queue.indexOf(current) : -1,
      };
    }

    case "SET_SLEEP":
      return { ...state, sleep: action.sleep };

    case "SLEEP_FIRED":
      return { ...state, sleep: { mode: "off" }, intent: "pause" };

    // ---- media element → state ----
    case "MEDIA_STATUS":
      return { ...state, status: action.status };

    case "MEDIA_CANPLAY":
      // Only settle out of "loading"; playing/buffering are driven by their own events.
      if (state.status !== "loading") return state;
      return { ...state, status: action.paused ? "paused" : "buffering" };

    case "MEDIA_DURATION":
      return { ...state, duration: action.duration };

    case "MEDIA_TIME": {
      const id = currentTrackId(state);
      return {
        ...state,
        currentTime: action.currentTime,
        resume: id ? { ...state.resume, [id]: action.currentTime } : state.resume,
      };
    }

    case "MEDIA_BUFFERED":
      return { ...state, bufferedEnd: action.end };

    case "MEDIA_ENDED": {
      const id = currentTrackId(state);
      const { [id ?? ""]: _done, ...resume } = state.resume;
      const base = { ...state, resume };
      if (state.sleep.mode === "endOfTrack") {
        return { ...base, status: "ended", intent: "pause", sleep: { mode: "off" } };
      }
      const atEnd = state.queueIndex >= state.queue.length - 1;
      if (atEnd && state.repeat === "off") {
        return { ...base, status: "ended", intent: "pause" };
      }
      return goTo(base, atEnd ? 0 : state.queueIndex + 1);
    }

    case "MEDIA_ERROR":
      return { ...state, status: "error", error: action.message, intent: "pause" };

    // ---- event log ----
    case "LOG": {
      const last = state.events[0];
      if (last && last.type === action.event && last.detail === action.detail) {
        const merged = { ...last, count: last.count + 1, at: action.at };
        return { ...state, events: [merged, ...state.events.slice(1)] };
      }
      const entry = {
        id: state.eventSeq + 1,
        type: action.event,
        detail: action.detail,
        at: action.at,
        count: 1,
      };
      return {
        ...state,
        eventSeq: entry.id,
        events: [entry, ...state.events].slice(0, MAX_EVENTS),
      };
    }

    case "CLEAR_LOG":
      return { ...state, events: [] };

    default:
      return state;
  }
}
