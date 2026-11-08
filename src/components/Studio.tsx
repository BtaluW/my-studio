"use client";

import type { SiteSettings } from "@/config/site";
import { Backdrop } from "./Backdrop";
import { Logo } from "./Logo";
import { NowPlaying } from "./NowPlaying";
import { PlayerBar } from "./PlayerBar";
import { TrackList } from "./TrackList";
import { GitHubIcon } from "./Icons";

export function Studio({ settings: site }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <div className="relative isolate min-h-dvh lg:flex lg:h-dvh lg:items-center lg:justify-center lg:p-10">
      <div className="hidden lg:block">
        <Backdrop />
      </div>

      {/* the frame */}
      <div className="flex min-h-dvh flex-col bg-ground lg:h-full lg:max-h-200 lg:min-h-0 lg:w-full lg:max-w-330 lg:overflow-hidden lg:rounded-[20px] lg:shadow-[0_40px_120px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.25)]">
        <main className="grid flex-1 grid-cols-[minmax(0,1fr)] gap-3 p-3 lg:min-h-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* left panel */}
          <div className="flex min-h-0 flex-col gap-4 rounded-[20px] bg-panel p-4 sm:p-6">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h1 className="inline-flex items-baseline gap-2.5">
                <Logo
                  name={site.name}
                  className="text-2xl font-extrabold tracking-tight font-stretch-125%"
                />
                <span className="font-mono text-xs tracking-[0.16em] text-accent">
                  BEATS
                </span>
              </h1>
              <p className="text-sm text-muted">{site.tagline}</p>
            </header>
            <NowPlaying />
          </div>

          {/* right panel */}
          <div className="flex min-h-130 flex-col rounded-[20px] bg-panel p-4 sm:p-6 lg:min-h-0">
            <TrackList />
            <footer className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-white/6 pt-3 text-xs text-faint">
              <p>
                © {year} {site.name} Beats: all rights reserved.
              </p>
              <div className="flex flex-wrap items-center gap-x-3">
                <a
                  href={`mailto:${site.contact.email}`}
                  className="inline-flex min-h-11 items-center text-(--links) hover:underline"
                >
                  {site.contact.email}
                </a>
                {site.contact.links.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    className="inline-flex min-h-11 items-center hover:text-fg"
                  >
                    {l.label}
                  </a>
                ))}
                <a
                  href={site.repoUrl}
                  aria-label="Github repo"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted transition-colors hover:text-(--links) focus-visible:text-(--links)"
                >
                  <GitHubIcon className="h-5 w-5 flex-none fill-current" />
                </a>
              </div>
            </footer>
          </div>
        </main>

        <div className="sticky bottom-0 z-10 border-t border-white/6 bg-ground/90 backdrop-blur-md lg:static">
          <PlayerBar producer={site.name} />
        </div>
      </div>
    </div>
  );
}
