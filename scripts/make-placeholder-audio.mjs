// Generates short placeholder beats for every track in src/data/tracks.json
// whose `src` points at /audio/placeholder-*.wav, so the site plays something
// before the real audio is ready. Output is git-ignored.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Real deploys use Sanity + R2; never build demo audio for them (docs/adr/0004).
if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.log("Sanity is configured: skipping placeholder audio.");
  process.exit(0);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(readFileSync(join(root, "src/data/tracks.json"), "utf8"));
const outDir = join(root, "public/audio");
mkdirSync(outDir, { recursive: true });

const RATE = 22050;
const SECONDS = 30;

function rng(seed) {
  let x = seed >>> 0 || 1;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function render({ bpm = 90, hue = 0 }) {
  const n = RATE * SECONDS;
  const out = new Float32Array(n);
  const beat = 60 / bpm;
  const rand = rng(hue * 7919 + bpm);
  const root = 110 * Math.pow(2, (hue % 12) / 12); // A2 shifted by hue
  const chords = [[0, 3, 7], [5, 8, 12], [3, 7, 10], [7, 10, 14]];
  for (let i = 0; i < n; i++) {
    const t = i / RATE;
    const pos = t / beat; // in beats
    const inBeat = (pos % 1) * beat;
    // kick on every beat
    const kick = Math.sin(2 * Math.PI * (50 + 90 * Math.exp(-inBeat * 30)) * inBeat) * Math.exp(-inBeat * 9);
    // hat on off-beats
    const half = ((pos + 0.5) % 1) * beat;
    const hat = (rand() * 2 - 1) * Math.exp(-half * 70) * 0.25;
    // pad: chord changes every 4 beats
    const chord = chords[Math.floor(pos / 4) % chords.length];
    let pad = 0;
    for (const semi of chord) pad += Math.sin(2 * Math.PI * root * 2 * Math.pow(2, semi / 12) * t);
    pad *= 0.06 * (0.6 + 0.4 * Math.sin(2 * Math.PI * t / (beat * 4)));
    const fade = Math.min(1, t / 0.5, (SECONDS - t) / 1.5);
    out[i] = (kick * 0.55 + hat + pad) * fade;
  }
  return out;
}

function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32000), 44 + i * 2));
  return buf;
}

let made = 0;
for (const track of catalog.tracks) {
  const m = /^\/audio\/(placeholder-[a-z0-9-]+\.wav)$/.exec(track.src);
  if (!m) continue;
  const file = join(outDir, m[1]);
  if (existsSync(file)) continue;
  writeFileSync(file, wav(render(track)));
  made++;
}
if (made) console.log(`Generated ${made} placeholder track(s) in public/audio/`);
