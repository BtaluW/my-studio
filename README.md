# W.I.L.L.I.A.M.S Beats

A one-page music site built around a turntable. Your tracklist sits on the open, transparent dust cover. Picking a track drops the needle: the record spins and the tonearm follows the playback position.

Built with Next.js 16, React 19, TypeScript, Tailwind CSS v4 and Sanity, with audio on Cloudflare R2.

**Runs out of the box with demo beats.** Add Sanity credentials (see `.env.example` and `docs/runbooks/setup-sanity.md`) to use your own.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

In demo mode, `npm run dev` and `npm run build` first generate 30-second placeholder beats in `public/audio/` (git-ignored). With Sanity configured they're skipped.

| Command | What it does |
|---|---|
| `npm test` | Unit tests (reducer, catalog, Sanity mapping, webhook) |
| `npm run typecheck` | TypeScript, including the generated Sanity query types |
| `npm run typegen` | Regenerate Sanity types after a schema or query change |
| `npm run upload-beat -- file.mp3 "Title"` | Upload a preview to R2 and create a draft beat (local only) |
| `npm run check:secrets` | After a build, confirm no tokens leaked into the browser bundle |

## Adding your music

**With Sanity (the live site):** see [`docs/runbooks/add-a-beat.md`](docs/runbooks/add-a-beat.md). Upload with `npm run upload-beat`, then fill in the details and publish at `/studio`.

**Demo mode** (no Sanity configured): the site plays **`src/data/tracks.json`**:

```json
{
  "artist": "Your Name",
  "tracks": [
    { "id": "night-drive", "title": "Night Drive", "genre": "Trap", "bpm": 140, "key": "F# min", "hue": 262, "src": "/audio/night-drive.mp3" }
  ],
  "playlists": [
    { "id": "late-night", "name": "Late night", "trackIds": ["night-drive"] }
  ]
}
```

1. Export a tagged preview (MP3 at about 256 kbps) and put it in `public/audio/`, or upload it to R2 and use its full URL.
2. Add an entry to `tracks`. `id`, `title` and `src` are required. `genre`, `bpm`, `key` and `duration` are optional; if you leave `duration` out, it's read from the file. `hue` (0–360) sets the record label colour.
3. Optionally add the track's `id` to a playlist. Playlists show as tabs on the cover, next to **All beats**.

The build checks `tracks.json` and stops with a clear message if something is wrong, such as a duplicate id or a playlist pointing at a track that doesn't exist.

Site text (name, tagline, about, contact, mailing address) lives in **`src/config/site.ts`**.

## Docs

- [`CLAUDE.md`](CLAUDE.md): conventions and rules for contributors and AI agents
- [`docs/`](docs/README.md): architecture, decision records (ADRs) and runbooks
- [Integration design: Sanity, R2, Vercel](docs/architecture/integration-design.md) (proposed)

## How it works

```
src/
  app/
    layout.tsx              bare root layout (shared with Studio)
    (site)/page.tsx         the only page: getSiteContent() → <Turntable/>
    studio/[[...tool]]/     embedded Sanity Studio
    api/revalidate/         signed Sanity webhook → refresh the page
  sanity/                   schemas, GROQ query, read client, mapper, generated types
  data/tracks.json          demo catalog (used when Sanity isn't configured)
  config/site.ts            SiteSettings type + fallback page copy
  lib/
    getSiteContent.ts       chooses Sanity or the demo catalog
    catalog.ts              Catalog type, tracks.json validation, conversion to player state
    playerReducer.ts        pure reducer: every playback state transition
    revalidateHandler.ts    webhook signature check (tested)
    status.ts · storage.ts · utils.ts · types.ts
  hooks/                    useAudioEngine, useMediaSession, useKeyboardShortcuts
  context/PlayerContext.tsx reducer + engine + controls (usePlayer())
  components/               Turntable, DustCover, Platter, ControlStrip, SeekBar, Logo, NewsletterForm …
scripts/                    placeholder audio, upload-beat, bundle secret check
tests/                      vitest suites
docs/                       architecture, ADRs, runbooks (see CLAUDE.md for agents)
```

The play/pause state is two values. *Intent* is what the listener asked for; *status* is what the audio element reports (loading, buffering, playing, paused, ended, error). The record only spins while the status is `playing`. The play button shows a spinner while the listener wants playback but the audio is still buffering.

Keyboard: Space play/pause · ←/→ seek · Shift+←/→ previous/next · ↑/↓ volume · M mute · S shuffle · R repeat.

## Not wired up yet

- **Newsletter**: the form validates the email and the consent box, but doesn't send anywhere yet. Connect it to an `/api/subscribe` route that uses your email provider with double opt-in.
- **Licensing**: Shopify checkout comes in a later phase.

## License

The site's code is under MIT. The beats, artwork, name and brand are **not** covered by that license: all rights reserved.
