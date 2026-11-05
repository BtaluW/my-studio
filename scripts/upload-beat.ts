/**
 * Upload a tagged preview to R2 and create (or update) a draft beat in Sanity.
 *
 *   npm run upload-beat -- ./exports/night-drive.mp3 "Night Drive"
 *   npm run upload-beat -- ./exports/night-drive.mp3 "Night Drive" --dry-run
 *
 * Runs on your machine only. Reads secrets from .env.local (never set these in Vercel):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET,
 *   SANITY_API_WRITE_TOKEN, NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET,
 *   NEXT_PUBLIC_AUDIO_BASE_URL
 * See docs/runbooks/add-a-beat.md.
 */
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@sanity/client";
import { parseBuffer } from "music-metadata";

const MAX_BYTES = 25 * 1024 * 1024;
const TYPES: Record<string, string> = { ".mp3": "audio/mpeg", ".m4a": "audio/mp4" };

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function env(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) fail(`${name} is not set. Add it to .env.local (see .env.example).`);
  return v;
}

export function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const [file, ...titleParts] = args.filter((a) => a !== "--dry-run");
  const title = titleParts.join(" ").trim();
  if (!file || !title) fail('Usage: npm run upload-beat -- <file.mp3> "Beat title" [--dry-run]');

  if (!dryRun) {
    const required = [
      "NEXT_PUBLIC_AUDIO_BASE_URL",
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
      "NEXT_PUBLIC_SANITY_PROJECT_ID",
      "SANITY_API_WRITE_TOKEN",
    ];
    const missing = required.filter((k) => !process.env[k]?.trim());
    if (missing.length) fail(`Missing in .env.local: ${missing.join(", ")} (see .env.example).`);
  }

  const ext = extname(file).toLowerCase();
  const contentType = TYPES[ext];
  if (!contentType) fail(`Unsupported file type "${ext}". Export a tagged MP3 (or M4A) preview.`);
  const size = (await stat(file).catch(() => fail(`File not found: ${file}`))).size;
  if (size > MAX_BYTES) fail(`${basename(file)} is ${(size / 1048576).toFixed(1)} MB; previews must be under 25 MB.`);

  const slug = slugify(title);
  if (!slug) fail("The title needs at least one letter or number.");

  const body = await readFile(file);
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 10);
  const key = `${slug}-${hash}${ext}`;
  const meta = await parseBuffer(body, { mimeType: contentType, size });
  const duration = meta.format.duration ? Math.round(meta.format.duration * 10) / 10 : undefined;

  const audioBase = env("NEXT_PUBLIC_AUDIO_BASE_URL").replace(/\/+$/, "");
  const url = `${audioBase}/${key}`;

  console.log(`\n${title}`);
  console.log(`  file      ${basename(file)} (${(size / 1048576).toFixed(1)} MB${duration ? `, ${duration}s` : ""})`);
  console.log(`  R2 key    ${key}`);
  console.log(`  public    ${url}`);

  if (dryRun) {
    console.log("\nDry run: nothing uploaded.\n");
    return;
  }

  // 1. R2 (S3-compatible API). Content-hashed keys are safe to cache forever.
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env("R2_ACCESS_KEY_ID"), secretAccessKey: env("R2_SECRET_ACCESS_KEY") },
  });
  await s3.send(
    new PutObjectCommand({
      Bucket: env("R2_BUCKET"),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  console.log("  ✓ uploaded to R2");

  // 2. Sanity: update the draft, keeping any fields you already filled in.
  const sanity = createClient({
    projectId: env("NEXT_PUBLIC_SANITY_PROJECT_ID"),
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-10-01",
    token: env("SANITY_API_WRITE_TOKEN"),
    useCdn: false,
    perspective: "raw",
  });
  const id = `beat-${slug}`;
  const [draft, published] = await Promise.all([
    sanity.getDocument(`drafts.${id}`),
    sanity.getDocument(id),
  ]);
  const existing = draft ?? published;
  await sanity.createOrReplace({
    ...(existing ?? {}),
    _id: `drafts.${id}`,
    _type: "beat",
    title: (existing?.title as string | undefined) ?? title,
    slug: (existing?.slug as { current: string } | undefined) ?? { _type: "slug", current: slug },
    audio: { url, key, ...(duration ? { duration } : {}) },
    ...(existing ? {} : { releasedAt: new Date().toISOString().slice(0, 10), hue: Math.floor(Math.random() * 360) }),
  });
  console.log(`  ✓ ${existing ? "updated" : "created"} draft in Sanity`);
  console.log("\nNext: open /studio → Beats → fill in genre, BPM, key and playlists → Publish.\n");
}

main().catch((err: unknown) => fail(err instanceof Error ? err.message : String(err)));
