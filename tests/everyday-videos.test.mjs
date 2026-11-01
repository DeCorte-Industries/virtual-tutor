import assert from "node:assert/strict";
import { test } from "node:test";

import {
  embedUrl,
  handleVideosAction,
  loadVideos,
  normalizeVideos,
  parseYouTubeId,
  toPublicVideos,
  VIDEO_LIMITS,
  VIDEOS_BLOB_KEY,
  watchUrl,
} from "../netlify/functions/lib/everyday-videos.mjs";

const ID = "abcDEF12345";
const NOW = new Date("2026-11-01T20:00:00.000Z");

// In-memory stand-in for a Netlify Blobs store (get with type json, setJSON).
function fakeStore(initial = {}) {
  const data = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    data,
    async get(key, opts) {
      assert.equal(opts?.type, "json");
      return data.has(key) ? JSON.parse(data.get(key)) : null;
    },
    async setJSON(key, value) {
      data.set(key, JSON.stringify(value));
    },
  };
}

test("parseYouTubeId accepts the usual YouTube link shapes and bare IDs", () => {
  const accepted = [
    ID,
    `  ${ID}  `,
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=42s&list=PL123`,
    `http://m.youtube.com/watch?feature=share&v=${ID}`,
    `www.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=sharetoken`,
    `youtu.be/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}?feature=share`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `HTTPS://WWW.YOUTUBE.COM/watch?v=${ID}`,
  ];
  for (const input of accepted) assert.equal(parseYouTubeId(input), ID, input);
});

test("parseYouTubeId rejects anything that isn't a YouTube video", () => {
  const rejected = [
    undefined,
    null,
    42,
    "",
    "   ",
    "abc",
    `${ID}x`,
    `https://example.com/watch?v=${ID}`,
    `https://youtube.com.example.com/watch?v=${ID}`,
    `https://notyoutube.com/watch?v=${ID}`,
    `https://vimeo.com/${ID}`,
    `javascript:alert(1)//youtu.be/${ID}`,
    `data:text/html,${ID}`,
    `ftp://youtu.be/${ID}`,
    `https://user:pw@youtu.be/${ID}`,
    `https://youtu.be:8443/${ID}`,
    "https://www.youtube.com/watch?v=short",
    `https://www.youtube.com/watch?v=${ID}"><script>`,
    `https://www.youtube.com/channel/${ID}`,
    "https://www.youtube.com/@somechannel",
    `https://youtu.be/${"a".repeat(400)}`,
  ];
  for (const input of rejected) assert.equal(parseYouTubeId(input), null, String(input));
});

test("watch and embed URLs are built from the ID", () => {
  assert.equal(watchUrl(ID), `https://www.youtube.com/watch?v=${ID}`);
  assert.equal(embedUrl(ID), `https://www.youtube-nocookie.com/embed/${ID}`);
});

test("normalizeVideos keeps valid rows, trims text and skips blank rows", () => {
  const { videos, errors } = normalizeVideos([
    {
      title: "  Measuring   a room  ",
      url: `https://youtu.be/${ID}`,
      caption: "  Area in real life. \r\n\r\n\r\nTry it.  ",
    },
    { title: "", url: "  ", caption: "" },
    { title: "Fractions in the kitchen", url: "XyZ_-123456" },
  ]);
  assert.deepEqual(errors, []);
  assert.deepEqual(videos, [
    { id: ID, title: "Measuring a room", caption: "Area in real life.\n\nTry it." },
    { id: "XyZ_-123456", title: "Fractions in the kitchen", caption: "" },
  ]);
});

test("normalizeVideos caps title and caption length", () => {
  const { videos } = normalizeVideos([{ title: "t".repeat(500), url: ID, caption: "c".repeat(1000) }]);
  assert.equal(videos[0].title.length, VIDEO_LIMITS.title);
  assert.equal(videos[0].caption.length, VIDEO_LIMITS.caption);
});

test("normalizeVideos reports every problem with its row number and saves nothing", () => {
  const { videos, errors } = normalizeVideos([
    { title: "Good one", url: ID },
    { title: "", url: ID },
    { title: "No link", url: "" },
    { title: "Wrong site", url: "https://example.com/video" },
    "not an object",
  ]);
  assert.deepEqual(videos, []);
  assert.deepEqual(errors, [
    "Video 2: add a title.",
    "Video 3: paste a YouTube link.",
    "Video 4: that link isn't a YouTube video (use youtube.com or youtu.be).",
  ]);
});

test("normalizeVideos rejects a non-list and too many videos", () => {
  assert.deepEqual(normalizeVideos("nope"), { videos: [], errors: ["Videos must be a list."] });
  const many = Array.from({ length: VIDEO_LIMITS.maxVideos + 1 }, (_, i) => ({ title: `V${i}`, url: ID }));
  const { videos, errors } = normalizeVideos(many);
  assert.deepEqual(videos, []);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /up to 24 videos/);
  assert.deepEqual(normalizeVideos([]), { videos: [], errors: [] });
});

test("toPublicVideos defaults to an empty list and drops bad stored entries", () => {
  assert.deepEqual(toPublicVideos(null), { videos: [], updatedAt: null });
  assert.deepEqual(toPublicVideos({ videos: "x" }), { videos: [], updatedAt: null });
  assert.deepEqual(
    toPublicVideos({
      videos: [
        { id: ID, title: "Keep", caption: "ok", extra: "dropped" },
        { id: "<script>", title: "Bad id" },
        { id: ID, title: "" },
        null,
      ],
      updatedAt: "2026-11-01T20:00:00.000Z",
    }),
    { videos: [{ id: ID, title: "Keep", caption: "ok" }], updatedAt: "2026-11-01T20:00:00.000Z" },
  );
});

test("loadVideos returns an empty list when nothing is saved", async () => {
  assert.deepEqual(await loadVideos(fakeStore()), { videos: [], updatedAt: null });
});

test("saveVideos stores videos under their own key and loadVideos reads them back", async () => {
  const content = { verse: { text: "Sample verse", ref: "Sample 1:1" }, mathNote: "Sample note" };
  const store = fakeStore({ content });
  const saved = await handleVideosAction(
    store,
    { action: "saveVideos", videos: [{ title: "Sample video", url: `https://youtu.be/${ID}`, caption: "" }] },
    NOW,
  );
  assert.deepEqual(saved, {
    status: 200,
    body: {
      ok: true,
      videos: [{ id: ID, title: "Sample video", caption: "" }],
      updatedAt: "2026-11-01T20:00:00.000Z",
    },
  });
  assert.ok(store.data.has(VIDEOS_BLOB_KEY));
  assert.deepEqual(await store.get("content", { type: "json" }), content, "verse and notes untouched");

  const loaded = await handleVideosAction(store, { action: "loadVideos" });
  assert.deepEqual(loaded.body, saved.body);
  assert.deepEqual(await loadVideos(store), {
    videos: [{ id: ID, title: "Sample video", caption: "" }],
    updatedAt: "2026-11-01T20:00:00.000Z",
  });
});

test("saveVideos with an empty list clears the section", async () => {
  const store = fakeStore({ [VIDEOS_BLOB_KEY]: { videos: [{ id: ID, title: "Old", caption: "" }] } });
  const res = await handleVideosAction(store, { action: "saveVideos", videos: [] }, NOW);
  assert.equal(res.status, 200);
  assert.deepEqual((await loadVideos(store)).videos, []);
});

test("saveVideos with invalid rows returns 400 and leaves saved videos alone", async () => {
  const before = {
    videos: [{ id: ID, title: "Keep me", caption: "" }],
    updatedAt: "2026-10-01T00:00:00.000Z",
  };
  const store = fakeStore({ [VIDEOS_BLOB_KEY]: before });
  const res = await handleVideosAction(
    store,
    { action: "saveVideos", videos: [{ title: "Bad", url: "https://example.com" }] },
    NOW,
  );
  assert.equal(res.status, 400);
  assert.equal(res.body.errors.length, 1);
  assert.deepEqual(await store.get(VIDEOS_BLOB_KEY, { type: "json" }), before);
});

test("handleVideosAction ignores other actions so admin.mjs handles them", async () => {
  const store = fakeStore();
  for (const action of ["login", "load", "save", "unknown", undefined]) {
    assert.equal(await handleVideosAction(store, { action }), null);
  }
  assert.equal(await handleVideosAction(store, null), null);
  assert.equal(store.data.size, 0);
});
