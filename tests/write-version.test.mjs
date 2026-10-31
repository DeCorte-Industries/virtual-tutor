import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildVersion, writeVersion } from "../scripts/write-version.mjs";

const NOW = new Date("2026-10-31T15:30:00.000Z");

test("maps Netlify env vars to version fields", () => {
  const env = {
    COMMIT_REF: "478ee28abc",
    BRANCH: "master",
    CONTEXT: "production",
    DEPLOY_ID: "65f0c0ffee",
  };
  assert.deepEqual(buildVersion(env, NOW), {
    commit: "478ee28abc",
    branch: "master",
    context: "production",
    deploy_id: "65f0c0ffee",
    built_at: "2026-10-31T15:30:00.000Z",
  });
});

test("falls back to null when env vars are missing or empty", () => {
  assert.deepEqual(buildVersion({ BRANCH: "", CONTEXT: "   " }, NOW), {
    commit: null,
    branch: null,
    context: null,
    deploy_id: null,
    built_at: "2026-10-31T15:30:00.000Z",
  });
});

test("built_at defaults to the current time as an ISO timestamp", () => {
  const before = Date.now();
  const { built_at } = buildVersion({});
  const after = Date.now();
  assert.equal(new Date(built_at).toISOString(), built_at);
  const t = Date.parse(built_at);
  assert.ok(t >= before && t <= after);
});

test("writes valid JSON to the given path, creating missing dirs", async (t) => {
  const dir = await mkdtemp(join(tmpdir(), "write-version-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const outputPath = join(dir, "nested", "public", "version.json");

  const returned = await writeVersion(outputPath, { COMMIT_REF: "abc123", CONTEXT: "deploy-preview" }, NOW);

  const written = JSON.parse(await readFile(outputPath, "utf8"));
  assert.deepEqual(written, returned);
  assert.deepEqual(written, {
    commit: "abc123",
    branch: null,
    context: "deploy-preview",
    deploy_id: null,
    built_at: "2026-10-31T15:30:00.000Z",
  });
});
