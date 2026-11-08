import { describe, expect, it } from "vitest";
import raw from "@/data/tracks.json";
import { catalogToState, parseCatalog } from "@/lib/catalog";

describe("parseCatalog (demo tracks.json)", () => {
  it("accepts the shipped demo catalog", () => {
    const c = parseCatalog(raw);
    expect(c.tracks.length).toBeGreaterThan(0);
    expect(c.tracks.every((t) => t.src.startsWith("/audio/placeholder-"))).toBe(true);
  });

  it("reports every problem at once", () => {
    expect(() =>
      parseCatalog({
        artist: "",
        tracks: [{ id: "a", title: "A", src: "/a.mp3" }, { id: "a", title: "", src: "" }],
        playlists: [{ id: "p", name: "P", trackIds: ["nope"] }],
      }),
    ).toThrowError(/artist[\s\S]*used twice[\s\S]*title[\s\S]*src[\s\S]*unknown track "nope"/);
  });

  it("converts to player state with library order preserved", () => {
    const state = catalogToState(parseCatalog(raw));
    expect(state.libraryOrder).toEqual(raw.tracks.map((t) => t.id));
    expect(state.tracks[raw.tracks[0].id].source).toBe("catalog");
  });
});
