import "server-only";
import raw from "@/data/tracks.json";
import { site } from "@/config/site";
import { parseCatalog } from "@/lib/catalog";
import { readClient, SANITY_TAG } from "@/sanity/client";
import { sanityConfigured } from "@/sanity/env";
import { mapCatalog, type SiteContent } from "@/sanity/mapCatalog";
import { CATALOG_QUERY } from "@/sanity/queries";
import type { CATALOG_QUERY_RESULT } from "@/sanity/sanity.types";

export async function getSiteContent(): Promise<SiteContent> {
  if (sanityConfigured()) {
    // Typed by TypeGen (src/sanity/sanity.types.ts). Passing it to mapCatalog is the
    // compile-time check that the query and the mapper agree.
    const result: CATALOG_QUERY_RESULT = await readClient().fetch(
      CATALOG_QUERY,
      {},
      { cache: process.env.NODE_ENV === "development" ? "no-store" : "force-cache", next: { tags: [SANITY_TAG] } },
    );
    return mapCatalog(result, site);
  }

  if (process.env.VERCEL_ENV === "production" && process.env.ALLOW_DEMO_CONTENT !== "true") {
    throw new Error(
      "Production deploy without Sanity: set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET and SANITY_API_READ_TOKEN in Vercel " +
        "(or ALLOW_DEMO_CONTENT=true to ship the demo beats on purpose).",
    );
  }

  const catalog = parseCatalog(raw);
  return { catalog, settings: { ...site, name: catalog.artist || site.name } };
}
