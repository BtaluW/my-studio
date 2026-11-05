import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { handleRevalidate } from "@/lib/revalidateHandler";
import { SANITY_TAG } from "@/sanity/client";

/** Called by the Sanity webhook on publish (docs/runbooks/setup-sanity.md, step 6). */
export function POST(req: NextRequest) {
  return handleRevalidate(req, {
    secret: process.env.SANITY_REVALIDATE_SECRET,
    // expire: 0 → the next request regenerates the page instead of serving stale.
    expire: () => revalidateTag(SANITY_TAG, { expire: 0 }),
  });
}
