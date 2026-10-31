// Runs `node --check` on every .mjs file in the code folders so a syntax
// error fails `npm run check` before deploy. Cross-platform, no dependencies.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const DIRS = ["netlify/functions", "scripts", "tests"];

function findMjs(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return findMjs(path);
    return entry.isFile() && entry.name.endsWith(".mjs") ? [path] : [];
  });
}

const files = DIRS.flatMap((dir) => findMjs(join(ROOT, dir))).sort();
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) failed++;
}

console.log(`node --check: ${files.length - failed}/${files.length} files OK`);
for (const file of files) console.log(`  ${relative(ROOT, file)}`);
if (failed > 0) process.exit(1);
