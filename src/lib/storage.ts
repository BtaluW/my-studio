import type { PlayerState } from "./types";

const KEY = "beats-site:settings:v1";

export type Settings = Partial<Pick<PlayerState, "volume" | "muted" | "repeat" | "resume">>;

/** Only listener preferences are stored; the catalog comes from tracks.json. */
export function saveSettings(state: PlayerState): void {
  try {
    const resume: Record<string, number> = {};
    for (const [id, pos] of Object.entries(state.resume)) resume[id] = Math.floor(pos);
    const data: Settings = { volume: state.volume, muted: state.muted, repeat: state.repeat, resume };
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage blocked (private mode) or full: the player still works.
  }
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const d = JSON.parse(raw) as Settings;
    const out: Settings = {};
    if (typeof d.volume === "number" && d.volume >= 0 && d.volume <= 1) out.volume = d.volume;
    if (typeof d.muted === "boolean") out.muted = d.muted;
    if (d.repeat === "off" || d.repeat === "all" || d.repeat === "one") out.repeat = d.repeat;
    if (d.resume && typeof d.resume === "object") out.resume = d.resume;
    return out;
  } catch {
    return {};
  }
}
