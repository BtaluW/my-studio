/**
 * Public Sanity settings. Safe for the browser: none of these are secrets.
 * Secrets (tokens) are read only in server-only modules.
 */
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
/** Pinned so Sanity API behaviour can't change under us. Bump deliberately. */
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-10-01";
/** Where public audio previews are served from, e.g. https://audio.btalu.ca */
export const audioBaseUrl = (process.env.NEXT_PUBLIC_AUDIO_BASE_URL ?? "").replace(/\/+$/, "");

/** True when a real Sanity project is configured (live site, previews, your machine). */
export function sanityConfigured(): boolean {
  return /^[a-z0-9][a-z0-9-]{1,63}$/.test(projectId);
}
