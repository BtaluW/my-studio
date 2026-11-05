import { parseBody } from "next-sanity/webhook";
import type { NextRequest } from "next/server";

/** Document types whose changes affect the page. Must match the Sanity webhook filter. */
export const REVALIDATING_TYPES = new Set(["beat", "playlist", "siteSettings"]);

export interface RevalidateDeps {
  secret: string | undefined;
  /** Expires the page's cache tag. Injected so tests don't need Next's cache. */
  expire: () => void;
  /** Sanity's read-after-write delay; tests turn it off. */
  waitForConsistency?: boolean;
}

/**
 * Signed Sanity webhook to expire the "sanity" cache tag.
 * Only a signature that verifies as `true` is accepted: parseBody returns
 * `null` for a missing signature header, which must be treated as invalid.
 */
export async function handleRevalidate(req: NextRequest, deps: RevalidateDeps): Promise<Response> {
  if (!deps.secret) {
    return Response.json({ message: "Revalidation is not configured" }, { status: 500 });
  }
  let parsed: Awaited<ReturnType<typeof parseBody<{ _type?: string }>>>;
  try {
    parsed = await parseBody<{ _type?: string }>(req, deps.secret, deps.waitForConsistency ?? true);
  } catch {
    return Response.json({ message: "Malformed body" }, { status: 400 });
  }
  if (parsed.isValidSignature !== true) {
    return Response.json({ message: "Invalid signature" }, { status: 401 });
  }
  const type = parsed.body?._type;
  if (!type || !REVALIDATING_TYPES.has(type)) {
    return Response.json({ message: "Ignored document type" }, { status: 400 });
  }
  deps.expire();
  return Response.json({ revalidated: true, type });
}
