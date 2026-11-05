import type { SiteSettings } from "@/config/site";
import type { Catalog } from "@/lib/catalog";

/**
 * Shape returned by CATALOG_QUERY. Written by hand to match the query; when
 * TypeGen runs (`npm run typegen`) its generated type should be assignable to this.
 * Every field may be null: Sanity returns null for anything unset.
 */
export interface CatalogQueryResult {
  settings: {
    artistName?: string | null;
    tagline?: string | null;
    about?: (string | null)[] | null;
    contactEmail?: string | null;
    links?: { label?: string | null; url?: string | null }[] | null;
    mailingAddress?: string | null;
  } | null;
  beats: {
    id?: string | null;
    title?: string | null;
    genre?: string | null;
    bpm?: number | null;
    key?: string | null;
    hue?: number | null;
    src?: string | null;
    duration?: number | null;
    cover?: string | null;
  }[] | null;
  playlists: { id?: string | null; name?: string | null; trackIds?: (string | null)[] | null }[] | null;
}

export interface SiteContent {
  catalog: Catalog;
  settings: SiteSettings;
}

const text = (v: string | null | undefined) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const num = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const isHttps = (v: string) => {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
};

/** Sanity CDN image → a 1200px-wide WebP/AVIF; anything not https is dropped. */
const coverUrl = (v: string | null | undefined) => {
  const url = text(v);
  return url && isHttps(url) ? `${url}?w=1200&fit=max&auto=format&q=80` : undefined;
};

/**
 * Sanity → the UI's Catalog + SiteSettings. The only place that knows Sanity's shape.
 * Drops anything the player can't use instead of failing the page:
 * beats without an id, title or https audio URL; duplicate ids; playlist entries
 * pointing at unpublished or missing beats; empty playlists.
 */
export function mapCatalog(result: CatalogQueryResult, fallback: SiteSettings): SiteContent {
  const s = result.settings ?? {};
  const settings: SiteSettings = {
    name: text(s.artistName) ?? fallback.name,
    tagline: text(s.tagline) ?? fallback.tagline,
    about: (s.about ?? []).map((p) => text(p)).filter((p): p is string => !!p),
    contact: {
      email: text(s.contactEmail) ?? fallback.contact.email,
      links: (s.links ?? [])
        .map((l) => ({ label: text(l.label), href: text(l.url) }))
        .filter((l): l is { label: string; href: string } => !!l.label && !!l.href && isHttps(l.href)),
    },
    mailingAddress: text(s.mailingAddress) ?? fallback.mailingAddress,
    repoUrl: fallback.repoUrl,
  };
  if (settings.about.length === 0) settings.about = fallback.about;
  if (settings.contact.links.length === 0) settings.contact.links = fallback.contact.links;

  const seen = new Set<string>();
  const tracks: Catalog["tracks"] = [];
  for (const b of result.beats ?? []) {
    const id = text(b.id);
    const title = text(b.title);
    const src = text(b.src);
    if (!id || !title || !src || !isHttps(src) || seen.has(id)) continue;
    seen.add(id);
    const hue = num(b.hue);
    tracks.push({
      id,
      title,
      src,
      genre: text(b.genre),
      bpm: num(b.bpm),
      key: text(b.key),
      duration: num(b.duration),
      cover: coverUrl(b.cover),
      hue: hue === undefined ? undefined : Math.min(360, Math.max(0, hue)),
    });
  }

  const playlists: Catalog["playlists"] = [];
  for (const p of result.playlists ?? []) {
    const id = text(p.id);
    const name = text(p.name);
    if (!id || !name) continue;
    const trackIds = [...new Set((p.trackIds ?? []).map((t) => text(t)).filter((t): t is string => !!t && seen.has(t)))];
    if (trackIds.length) playlists.push({ id, name, trackIds });
  }

  return { catalog: { artist: settings.name, tracks, playlists }, settings };
}
