"use client";

import type { SiteSettings } from "@/config/site";
import { Backdrop } from "./Backdrop";
import { Logo } from "./Logo";
import { NowPlaying } from "./NowPlaying";
import { PlayerBar } from "./PlayerBar";
import { TrackList } from "./TrackList";
import { GitHubIcon, MailIcon } from "./Icons";
import { LibrarySheet } from "./LibrarySheet";
import { useRef, useState } from "react";
import { useSheetDrag } from "@/hooks/useSheetDrag";

export function Studio({ settings: site }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const frameRef = useRef<HTMLElement>(null);
  const swipe = useSheetDrag(frameRef, libraryOpen, setLibraryOpen);

  return (
    <div className="relative isolate h-dvh overflow-hidden lg:flex lg:items-center lg:justify-center lg:p-10">
      <div className="hidden lg:block">
        <Backdrop />
      </div>

      {/* the frame */}
      <main
        ref={frameRef}
        data-library={libraryOpen ? "open" : "closed"}
        className="group/frame flex h-full bg-ground [--lib-closed:calc(9rem+env(safe-area-inset-bottom))] [--lib-open:calc(24rem+env(safe-area-inset-bottom))]
          [--p:0] data-[library=open]:[--p:1] max-lg:grid max-lg:grid-rows-[minmax(0,1fr)_auto_calc(var(--lib-closed)+(var(--lib-open)-var(--lib-closed))*var(--p))]
          max-lg:transition-[grid-template-rows] max-lg:duration-300 max-lg:ease-out data-dragging:transition-none motion-reduce:transition-none lg:flex lg:flex-col
          lg:max-h-200 lg:w-full lg:max-w-330 lg:overflow-hidden lg:rounded-[20px] lg:shadow-[0_40px_120px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.25)]"
      >
        <div className="max-lg:contents lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-3 lg:p-3">
          {/* left panel */}
          <div
            {...swipe}
            className="relative order-1 mx-3 mt-3 flex min-h-0 flex-col overflow-hidden rounded-[20px] bg-panel lg:p-6 lg:m-0 lg:gap-4 max-lg:touch-pan-x max-lg:touch-pinch-zoom">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 max-lg:absolute max-lg:inset-x-0 max-lg:top-0 max-lg:z-10 max-lg:bg-linear-to-b max-lg:from-black/70 max-lg:to-transparent max-lg:px-4 max-lg:pt-3 max-lg:pb-8">
              <h1 className="inline-flex items-baseline gap-2.5">
                <Logo
                  name={site.name}
                  className="text-xs font-extrabold tracking-tight font-stretch-125% lg:text-2xl"
                />
                <span className="font-mono text-[9px] tracking-[0.16em] text-accent lg:text-xs">
                  BEATS
                </span>
              </h1>
              <p className="text-sm text-muted max-lg:hidden">{site.tagline}</p>
            </header>
            <NowPlaying />
          </div>

          {/* right panel */}
          <div
            {...swipe}
            className="order-3 mx-3 mb-3 flex min-h-0 flex-col rounded-[20px] bg-panel p-4 sm:p-6 overflow-hidden lg:m-0 max-lg:touch-pan-x max-lg:touch-pinch-zoom">
            <LibrarySheet open={libraryOpen} onToggle={() => setLibraryOpen((o) => !o)}>
              <TrackList />
            </LibrarySheet>
            <footer className="mt-3 flex items-center justify-between gap-3 border-t border-white/6 pt-2 text-xs text-faint max-lg:pb-[env(safe-area-inset-bottom)] lg:mt-4 lg:pt-3">
              <p className="min-w-0">
                © {year} {site.name} Beats: all rights reserved.
              </p>
              <div className="flex shrink-0 items-center gap-x-1 lg:gap-x-3">
                <a
                  href={`mailto:${site.contact.email}`}
                  aria-label={`Email ${site.contact.email}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted transition-colors hover:text-(--links) lg:min-w-0 lg:text-(--links) lg:hover:underline"
                >
                  <MailIcon className="h-5 w-5 fill-current lg:hidden" />
                  <span className="max-lg:hidden">{site.contact.email}</span>
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
        </div>

        <div className="order-2 my-3 border-y border-white/6 lg:order-0 lg:my-0 lg:border-b-0">
          <PlayerBar producer={site.name} />
        </div>
      </main>
    </div>
  );
}
