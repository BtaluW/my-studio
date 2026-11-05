import { describe, expect, it } from "vitest";
import { site } from "@/config/site";
import { mapCatalog, type CatalogQueryResult } from "@/sanity/mapCatalog";

const AUDIO = "https://audio.btalu.ca";

const beat = (id: string, extra: Partial<NonNullable<CatalogQueryResult["beats"]>[number]> = {}) => ({
  id,
  title: id.toUpperCase(),
  src: `${AUDIO}/${id}.mp3`,
  genre: "Trap",
  bpm: 140,
  key: "F# min",
  hue: 262,
  duration: 168,
  ...extra,
});

describe("mapCatalog", () => {
  it("maps beats and playlists into the Catalog shape", () => {
    const { catalog } = mapCatalog(
      { settings: null, beats: [beat("a"), beat("b")], playlists: [{ id: "p", name: "Late night", trackIds: ["b", "a"] }] },
      site,
    );
    expect(catalog.tracks.map((t) => t.id)).toEqual(["a", "b"]);
    expect(catalog.tracks[0]).toMatchObject({ title: "A", src: `${AUDIO}/a.mp3`, bpm: 140, key: "F# min", duration: 168 });
    expect(catalog.playlists).toEqual([{ id: "p", name: "Late night", trackIds: ["b", "a"] }]);
  });

  it("drops beats the player can't use", () => {
    const { catalog } = mapCatalog(
      {
        settings: null,
        beats: [
          beat("ok"),
          beat("no-src", { src: null }),
          beat("http", { src: "http://insecure.example/x.mp3" }),
          beat("bad-url", { src: "not a url" }),
          { ...beat("x"), id: null },
          beat("ok"), // duplicate id
        ],
        playlists: [],
      },
      site,
    );
    expect(catalog.tracks.map((t) => t.id)).toEqual(["ok"]);
  });

  it("removes playlist entries for missing beats, dedupes, and drops empty playlists", () => {
    const ids = Array.from({ length: 10 }, (_, i) => `t${i}`);
    const { catalog } = mapCatalog(
      {
        settings: null,
        beats: ids.map((i) => beat(i)),
        playlists: [
          { id: "big", name: "Big", trackIds: [...ids, "t0", "missing", null] },
          { id: "empty", name: "Empty", trackIds: ["missing"] },
        ],
      },
      site,
    );
    expect(catalog.playlists).toHaveLength(1);
    expect(catalog.playlists[0].trackIds).toEqual(ids);
  });

  it("clamps hue and ignores non-numeric values", () => {
    const { catalog } = mapCatalog(
      { settings: null, beats: [beat("h1", { hue: 999 }), beat("h2", { hue: null, bpm: null })], playlists: [] },
      site,
    );
    expect(catalog.tracks[0].hue).toBe(360);
    expect(catalog.tracks[1].hue).toBeUndefined();
    expect(catalog.tracks[1].bpm).toBeUndefined();
  });

  it("uses Sanity settings where filled in and falls back field by field", () => {
    const { settings, catalog } = mapCatalog(
      {
        settings: {
          artistName: "W.I.L.L.I.A.M.S",
          tagline: "  ",
          about: ["First line", null, ""],
          contactEmail: null,
          links: [
            { label: "Instagram", url: "https://instagram.com/x" },
            { label: "Bad", url: "javascript:alert(1)" },
          ],
          mailingAddress: "PO Box 1",
        },
        beats: [],
        playlists: [],
      },
      site,
    );
    expect(settings.name).toBe("W.I.L.L.I.A.M.S");
    expect(catalog.artist).toBe("W.I.L.L.I.A.M.S");
    expect(settings.tagline).toBe(site.tagline);
    expect(settings.about).toEqual(["First line"]);
    expect(settings.contact.email).toBe(site.contact.email);
    expect(settings.contact.links).toEqual([{ label: "Instagram", href: "https://instagram.com/x" }]);
    expect(settings.mailingAddress).toBe("PO Box 1");
    expect(settings.repoUrl).toBe(site.repoUrl);
  });

  it("handles a completely empty dataset", () => {
    const { catalog, settings } = mapCatalog({ settings: null, beats: null, playlists: null }, site);
    expect(catalog).toEqual({ artist: site.name, tracks: [], playlists: [] });
    expect(settings).toEqual(site);
  });
});
