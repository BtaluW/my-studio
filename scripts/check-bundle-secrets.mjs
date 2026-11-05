// Fails if anything that looks like a secret ended up in the browser bundle.
// Run after `npm run build` (CI does). See docs/architecture/integration-design.md §8.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Each folder with the file types browsers actually receive from it.
const TARGETS = [
  { dir: ".next/static", ext: /\.(js|css|json|txt|map)$/ },
  { dir: ".next/server/app", ext: /\.(html|rsc|body)$/ }, // server-only .js here never reaches browsers
];
const DIRS = TARGETS.map((t) => t.dir);
const SECRET_ENV = [
  "SANITY_API_READ_TOKEN",
  "SANITY_API_WRITE_TOKEN",
  "SANITY_REVALIDATE_SECRET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
];
// Sanity API tokens start with "sk" followed by a long run of letters and digits.
const PATTERNS = [/\bsk[A-Za-z0-9]{60,}\b/];

function* files(dir, ext) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p, ext);
    else if (ext.test(name)) yield p;
  }
}

for (const dir of DIRS) {
  try {
    statSync(dir);
  } catch {
    console.error(`${dir} not found. Run \`npm run build\` first.`);
    process.exit(1);
  }
}

const values = SECRET_ENV.map((k) => [k, process.env[k]?.trim()]).filter(([, v]) => v && v.length >= 8);
const hits = [];
let scanned = 0;
for (const file of TARGETS.flatMap((t) => [...files(t.dir, t.ext)])) {
  scanned++;
  const text = readFileSync(file, "utf8");
  for (const re of PATTERNS) if (re.test(text)) hits.push(`${file}: matches ${re}`);
  for (const [k, v] of values) if (text.includes(v)) hits.push(`${file}: contains the value of ${k}`);
}

if (hits.length) {
  console.error(`✗ Possible secrets in the browser bundle:\n- ${hits.join("\n- ")}`);
  process.exit(1);
}
console.log(`✓ No secrets found in ${scanned} files under ${DIRS.join(", ")} (${values.length} env values checked).`);
