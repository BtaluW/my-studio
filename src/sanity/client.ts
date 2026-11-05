import "server-only";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

/**
 * Read-only client for the private dataset. Server-only: the token must never
 * reach the browser (see docs/architecture/integration-design.md).
 */
export function readClient() {
  const token = process.env.SANITY_API_READ_TOKEN;
  if (!token) {
    throw new Error(
      "SANITY_API_READ_TOKEN is missing. The dataset is private, so the site can't read it without a Viewer token.",
    );
  }
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false, // builds and revalidation need fresh data
    perspective: "published",
  });
}

/** Cache tag shared by every Sanity fetch; the webhook expires it. */
export const SANITY_TAG = "sanity";
