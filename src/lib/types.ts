/** `catalog` = a track from src/data/tracks.json. */
export type TrackSource = "catalog" | "local" | "stream";

export interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  source: TrackSource;
  /** Seconds. `Infinity` for live streams, `undefined` until probed. */
  duration?: number;
  isLive?: boolean;
  fileName?: string;
  genre?: string;
  bpm?: number;
  musicalKey?: string;
  /** 0–360: colour of the record label and cover tile. */
  hue?: number;
  /** Cover art URL. Optional. */
  cover?: string;
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

/** What the <audio> element is actually doing (reported by media events). */
export type PlaybackStatus =
  | "idle"
  | "loading"
  | "buffering"
  | "playing"
  | "paused"
  | "ended"
  | "error";

/** What the user asked for. Kept separate from status so the UI can show
 *  "wants to play, but buffering" or "play was blocked by the browser". */
export type PlaybackIntent = "play" | "pause";

export type RepeatMode = "off" | "all" | "one";

export type SleepTimer =
  | { mode: "off" }
  | { mode: "at"; endsAt: number; minutes: number }
  | { mode: "endOfTrack" };

export type View =
  | { kind: "library" }
  | { kind: "playlist"; id: string }
  | { kind: "genre"; genre: string };

export interface AudioEventEntry {
  id: number;
  type: string;
  detail?: string;
  at: number;
  /** Consecutive identical events are coalesced into one row. */
  count: number;
}

export interface PlayerState {
  hydrated: boolean;
  tracks: Record<string, Track>;
  libraryOrder: string[];
  playlists: Playlist[];
  view: View;

  /** The list the current track was started from (unshuffled). */
  contextIds: string[];
  /** Actual play order (shuffled when shuffle is on). */
  queue: string[];
  queueIndex: number;
  /** Bumps on every track (re)load so the engine can restart the same track. */
  loadSeq: number;

  intent: PlaybackIntent;
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  error: string | null;

  volume: number;
  muted: boolean;
  rate: number;
  repeat: RepeatMode;
  shuffle: boolean;
  sleep: SleepTimer;

  /** Last position per track id, used to resume long tracks. */
  resume: Record<string, number>;

  events: AudioEventEntry[];
  eventSeq: number;
}
