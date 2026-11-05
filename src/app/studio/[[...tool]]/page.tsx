import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";
import { sanityConfigured } from "@/sanity/env";

export const dynamic = "force-static";
export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  if (!sanityConfigured()) {
    return (
      <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 560, margin: "15vh auto", padding: 24, lineHeight: 1.5 }}>
        <h1 style={{ fontSize: 22 }}>Sanity isn&apos;t configured</h1>
        <p>
          Set <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and <code>NEXT_PUBLIC_SANITY_DATASET</code> in{" "}
          <code>.env.local</code> (or in Vercel), then restart. See <code>docs/runbooks/setup-sanity.md</code>.
        </p>
      </main>
    );
  }
  return <NextStudio config={config} />;
}
