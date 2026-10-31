// Writes public/version.json during the Netlify build so anyone can check
// which commit and deploy is live: https://mathwithhenry.com/version.json
// No dependencies. Runs locally too (missing Netlify vars become null).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const DEFAULT_OUTPUT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "version.json",
);

// Netlify build env var -> version.json field.
const ENV_FIELDS = {
  commit: "COMMIT_REF",
  branch: "BRANCH",
  context: "CONTEXT",
  deploy_id: "DEPLOY_ID",
};

// Pure: builds the stamp from an env object and a Date.
export function buildVersion(env = {}, now = new Date()) {
  const version = {};
  for (const [field, name] of Object.entries(ENV_FIELDS)) {
    const value = env[name];
    version[field] = typeof value === "string" && value.trim() !== "" ? value.trim() : null;
  }
  version.built_at = now.toISOString();
  return version;
}

// Writes the stamp as JSON to outputPath, creating the directory if needed.
export async function writeVersion(outputPath = DEFAULT_OUTPUT_PATH, env = process.env, now = new Date()) {
  const version = buildVersion(env, now);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(version, null, 2) + "\n", "utf8");
  return version;
}

const runDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (runDirectly) {
  const version = await writeVersion();
  console.log(`Wrote ${DEFAULT_OUTPUT_PATH}: ${JSON.stringify(version)}`);
}
