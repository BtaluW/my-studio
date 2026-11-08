import type { Playlist, Track } from "./types";

/** Shape of `src/data/tracks.json`. */
export interface CatalogTrack {
  id: string;
  title: string;
  src: string;
  genre?: string;
  bpm?: number;
  key?: string;
  /** Seconds. Optional: read from the file's metadata when missing. */
  duration?: number;
  /** 0–360. Colour of the record label and cover tile. */
  hue?: number;
  /** Cover art URL (or /path). Optional: without it the card shows the grey backdrop. */
  cover?: string;
}

export interface CatalogPlaylist {
  id: string;
  name: string;
  trackIds: string[];
}

export interface Catalog {
  artist: string;
  tracks: CatalogTrack[];
  playlists: CatalogPlaylist[];
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const isStr = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const optNum = (v: unknown) => v === undefined || (typeof v === "number" && Number.isFinite(v));

/**
 * Validates the catalog at build time so a typo in tracks.json fails the
 * build with a clear message instead of breaking the page.
 */
export function parseCatalog(raw: unknown): Catalog {
  const problems: string[] = [];
  if (!isObj(raw)) throw new Error("tracks.json: expected an object");
  if (!isStr(raw.artist)) problems.push("artist: required text");
  const tracks = Array.isArray(raw.tracks) ? raw.tracks : [];
  if (!Array.isArray(raw.tracks)) problems.push("tracks: required list");

  const ids = new Set<string>();
  tracks.forEach((t, i) => {
    const at = `tracks[${i}]`;
    if (!isObj(t)) return problems.push(`${at}: expected an object`);
    if (!isStr(t.id)) problems.push(`${at}.id: required text`);
    else if (ids.has(t.id)) problems.push(`${at}.id: "${t.id}" is used twice`);
    else ids.add(t.id);
    if (!isStr(t.title)) problems.push(`${at}.title: required text`);
    if (!isStr(t.src)) problems.push(`${at}.src: required path or URL`);
    if (t.cover !== undefined && !isStr(t.cover)) problems.push(`${at}.cover: must be a path or URL`);
    for (const k of ["bpm", "duration", "hue"] as const) {
      if (!optNum(t[k])) problems.push(`${at}.${k}: must be a number`);
    }
  });

  const playlists = Array.isArray(raw.playlists) ? raw.playlists : [];
  playlists.forEach((p, i) => {
    const at = `playlists[${i}]`;
    if (!isObj(p)) return problems.push(`${at}: expected an object`);
    if (!isStr(p.id)) problems.push(`${at}.id: required text`);
    if (!isStr(p.name)) problems.push(`${at}.name: required text`);
    if (!Array.isArray(p.trackIds)) problems.push(`${at}.trackIds: required list`);
    else
      p.trackIds.forEach((id) => {
        if (typeof id !== "string" || !ids.has(id)) problems.push(`${at}.trackIds: unknown track "${String(id)}"`);
      });
  });

  if (problems.length) {
    throw new Error(`tracks.json has ${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
  }
  return raw as unknown as Catalog;
}

/** Converts the catalog into the player's state shape. */
export function catalogToState(c: Catalog): {
  tracks: Record<string, Track>;
  libraryOrder: string[];
  playlists: Playlist[];
} {
  const tracks: Record<string, Track> = {};
  for (const t of c.tracks) {
    tracks[t.id] = {
      id: t.id,
      title: t.title,
      artist: c.artist,
      src: t.src,
      source: "catalog",
      duration: t.duration,
      genre: t.genre,
      bpm: t.bpm,
      musicalKey: t.key,
      hue: t.hue,
      cover: t.cover,
      addedAt: 0,
    };
  }
  return {
    tracks,
    libraryOrder: c.tracks.map((t) => t.id),
    playlists: c.playlists.map((p) => ({ id: p.id, name: p.name, trackIds: p.trackIds, createdAt: 0 })),
  };
}
