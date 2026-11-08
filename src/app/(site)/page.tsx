import type { Metadata } from "next";
import { Studio } from "@/components/Studio";
import { PlayerProvider } from "@/context/PlayerContext";
import { getSiteContent } from "@/lib/getSiteContent";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteContent();
  return { title: `${settings.name} Beats`, description: settings.tagline };
}

export default async function Home() {
  const { catalog, settings } = await getSiteContent();
  return (
    <PlayerProvider catalog={catalog}>
      <Studio settings={settings} />
    </PlayerProvider>
  );
} 
