import { describe, expect, it } from "vitest";
import { currentTrackId, initialState, playerReducer, type PlayerAction } from "@/lib/playerReducer";
import type { PlayerState } from "@/lib/types";

const ids = ["a", "b", "c"];
const base: PlayerState = { ...initialState, libraryOrder: ids };
const run = (s: PlayerState, ...actions: PlayerAction[]) => actions.reduce(playerReducer, s);
const play = (id: string): PlayerAction => ({ type: "PLAY_TRACK", trackId: id, contextIds: ids, queue: ids });

describe("playerReducer", () => {
  it("separates intent from element status", () => {
    const s = run(base, play("b"));
    expect(currentTrackId(s)).toBe("b");
    expect(s.intent).toBe("play");
    expect(s.status).toBe("loading");
    const playing = run(s, { type: "MEDIA_STATUS", status: "playing" });
    expect(playing.status).toBe("playing");
  });

  it("bumps loadSeq on every (re)load so the engine can restart the same track", () => {
    const s1 = run(base, play("a"));
    const s2 = run({ ...s1, repeat: "all", queue: ["a"], queueIndex: 0 }, { type: "MEDIA_ENDED" });
    expect(currentTrackId(s2)).toBe("a");
    expect(s2.loadSeq).toBe(s1.loadSeq + 1);
  });

  it("advances on ended, and stops at the end when repeat is off", () => {
    const s = run(base, play("c"), { type: "MEDIA_ENDED" });
    expect(s.status).toBe("ended");
    expect(s.intent).toBe("pause");
    const next = run(base, play("a"), { type: "MEDIA_ENDED" });
    expect(currentTrackId(next)).toBe("b");
  });

  it("pauses instead of advancing when the sleep timer is set to end of track", () => {
    const s = run(base, play("a"), { type: "SET_SLEEP", sleep: { mode: "endOfTrack" } }, { type: "MEDIA_ENDED" });
    expect(currentTrackId(s)).toBe("a");
    expect(s.intent).toBe("pause");
    expect(s.sleep.mode).toBe("off");
  });

  it("keeps the current track when shuffle reorders the queue", () => {
    const s = run(base, play("b"), { type: "SET_SHUFFLE", shuffle: true, queue: ["b", "c", "a"] });
    expect(currentTrackId(s)).toBe("b");
    expect(s.queueIndex).toBe(0);
  });

  it("is pure: the input state is not mutated", () => {
    const before = structuredClone(base);
    run(base, play("a"), { type: "MEDIA_TIME", currentTime: 12 });
    expect(base).toEqual(before);
  });
});
