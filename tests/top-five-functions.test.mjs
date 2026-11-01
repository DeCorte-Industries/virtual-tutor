// End-to-end tests for the Top Five through the real Netlify Functions
// (/api/admin and /api/top-five), backed by @netlify/blobs' local server.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { BlobsServer } from "@netlify/blobs/server";

const PASSWORD = "test-password";
const TOKEN = "test-token";
let server;
let dir;
let admin;
let topFive;

before(async () => {
  dir = await mkdtemp(join(tmpdir(), "top-five-blobs-"));
  server = new BlobsServer({ directory: dir, token: TOKEN });
  const { port } = await server.start();
  const context = { siteID: "test-site", token: TOKEN, edgeURL: `http://localhost:${port}` };
  const env = new Map([
    ["ADMIN_PASSWORD", PASSWORD],
    ["NETLIFY_BLOBS_CONTEXT", Buffer.from(JSON.stringify(context)).toString("base64")],
  ]);
  globalThis.Netlify = { env: { get: (key) => env.get(key), has: (key) => env.has(key) } };
  admin = (await import("../netlify/functions/admin.mjs")).default;
  topFive = (await import("../netlify/functions/top-five.mjs")).default;
});

after(async () => {
  await server.stop();
  await rm(dir, { recursive: true, force: true });
  delete globalThis.Netlify;
});

const post = (body) =>
  admin(new Request("http://localhost/api/admin", { method: "POST", body: JSON.stringify(body) }));

const algebra = {
  subjects: [
    {
      name: "Algebra 1",
      intro: "Linear equations first.",
      problems: [
        {
          title: "Two steps",
          problem: "2x + 3 = 11",
          steps: ["Subtract 3.", "Divide by 2."],
          answer: "x = 4",
        },
      ],
    },
  ],
};

test("public /api/top-five shows the Algebra 1 starter before anything is saved", async () => {
  const res = await topFive(new Request("http://localhost/api/top-five"));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Content-Type"), "application/json");
  assert.deepEqual(await res.json(), {
    subjects: [{ id: "algebra-1", name: "Algebra 1", intro: "", problems: [] }],
    updatedAt: null,
  });
});

test("Top Five admin actions need the admin password", async () => {
  for (const password of [undefined, "wrong"]) {
    const res = await post({ password, action: "topFiveSave", topFive: algebra });
    assert.equal(res.status, 401);
  }
  const res = await topFive(new Request("http://localhost/api/top-five"));
  assert.deepEqual((await res.json()).subjects[0].problems, []);
});

test("Henry saves through /api/admin and visitors see it at /api/top-five", async () => {
  const saved = await post({ password: PASSWORD, action: "topFiveSave", topFive: algebra });
  assert.equal(saved.status, 200);
  const savedBody = await saved.json();
  assert.equal(savedBody.ok, true);
  assert.equal(savedBody.topFive.subjects[0].id, "algebra-1");

  const loaded = await post({ password: PASSWORD, action: "topFiveLoad" });
  assert.deepEqual((await loaded.json()).topFive, savedBody.topFive);

  const pub = await (await topFive(new Request("http://localhost/api/top-five"))).json();
  assert.deepEqual(pub, savedBody.topFive);
});

test("invalid Top Five saves return 400 with Henry-readable errors and change nothing", async () => {
  const six = Array.from({ length: 6 }, (_, i) => ({ problem: `${i} + 1`, steps: ["add"] }));
  const res = await post({
    password: PASSWORD,
    action: "topFiveSave",
    topFive: { subjects: [{ name: "Algebra 1", problems: six }] },
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, "Algebra 1 has 6 problems. The Top Five holds up to 5.");
  const pub = await (await topFive(new Request("http://localhost/api/top-five"))).json();
  assert.equal(pub.subjects[0].problems.length, 1);
});

test("saving the verse and notes does not touch the Top Five, and vice versa", async () => {
  const notes = await post({
    password: PASSWORD,
    action: "save",
    verseText: "",
    mathNote: "Quiz Friday",
    otherNote: "",
  });
  assert.equal(notes.status, 200);
  const pub = await (await topFive(new Request("http://localhost/api/top-five"))).json();
  assert.equal(pub.subjects[0].problems[0].answer, "x = 4");

  await post({ password: PASSWORD, action: "topFiveSave", topFive: algebra });
  const content = await (await post({ password: PASSWORD, action: "load" })).json();
  assert.equal(content.content.mathNote, "Quiz Friday");
  assert.equal(content.content.topFive, undefined);
});

test("unknown admin actions are still rejected", async () => {
  const res = await post({ password: PASSWORD, action: "topFiveDelete" });
  assert.equal(res.status, 400);
});
