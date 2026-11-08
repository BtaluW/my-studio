import type { PlayerState } from "./types";

export type Tone = "accent" | "ok" | "muted" | "danger";

/**
 * Combines what the user asked for (intent) with what the element reports
 * (status) into one human label. This is the "custom play/pause state".
 */
export function describePlayback(s: PlayerState): { label: string; hint: string; tone: Tone } {
  const wants = s.intent === "play";
  switch (s.status) {
    case "idle":
      return { label: "Ready", hint: "Pick a track to start.", tone: "muted" };
    case "loading":
      return wants
        ? { label: "Loading", hint: "Fetching audio…", tone: "accent" }
        : { label: "Loaded", hint: "Press play when you're ready.", tone: "muted" };
    case "buffering":
      return wants
        ? { label: "Buffering", hint: "Waiting for enough data to keep playing.", tone: "accent" }
        : { label: "Paused", hint: "Buffered and waiting.", tone: "muted" };
    case "playing":
      return { label: "Playing", hint: s.rate !== 1 ? `At ${s.rate}× speed.` : "", tone: "ok" };
    case "paused":
      return { label: "Paused", hint: "", tone: "muted" };
    case "ended":
      return { label: "Finished", hint: "End of the queue.", tone: "muted" };
    case "error":
      return { label: "Can't play", hint: s.error ?? "", tone: "danger" };
  }
}

export const toneClass: Record<Tone, string> = {
  accent: "text-accent border-accent/40",
  ok: "text-ok border-ok/40",
  muted: "text-muted border-line",
  danger: "text-danger border-danger/50",
};
