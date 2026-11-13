// Pick 5 (issue #18): "The Top Five" renamed, plus one optional YouTube video per
// worked problem. Covers the stored data, the page markup, and the video slot
// the home page builds (a click-to-load facade, or a placeholder).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

import { handleTopFiveAction, loadTopFive, normalizeTopFive } from "../netlify/functions/lib/top-five.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const ID = "dQw4w9WgXcQ";

function memoryStore(initial = {}) {
  const data = new Map(Object.entries(initial).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    data,
    async get(key, options) {
      if (!data.has(key)) return null;
      return options?.type === "json" ? JSON.parse(data.get(key)) : data.get(key);
    },
    async setJSON(key, value) {
      data.set(key, JSON.stringify(value));
    },
  };
}

const withVideo = (video, extra = {}) =>
  normalizeTopFive({ subjects: [{ name: "Algebra 1", problems: [{ problem: "2x = 8", video, ...extra }] }] });

// ---------- Stored data ----------

test("a pasted YouTube link is stored as just the 11-character video ID", () => {
  for (const link of [
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `https://m.youtube.com/watch?v=${ID}&t=30s`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `youtube.com/watch?v=${ID}`,
    `  ${ID}  `,
  ]) {
    const result = withVideo(link);
    assert.equal(result.ok, true, link);
    assert.equal(result.value.subjects[0].problems[0].video, ID, link);
  }
});

test("a problem with no video link stores an empty video", () => {
  for (const video of [undefined, "", "   ", null]) {
    const result = withVideo(video);
    assert.equal(result.ok, true);
    assert.equal(result.value.subjects[0].problems[0].video, "");
  }
});

test("links that aren't YouTube videos are rejected with a message Henry can act on", () => {
  for (const link of [
    "https://vimeo.com/12345",
    `https://youtube.com.evil.example/watch?v=${ID}`,
    `javascript:alert(1)//${ID}`,
    `"><script>alert(1)</script>`,
    `https://www.youtube.com/@mathwithhenry`,
    `https://www.youtube.com/watch?v=${ID}x`,
    42,
  ]) {
    const result = withVideo(link);
    assert.equal(result.ok, false, String(link));
    assert.deepEqual(result.errors, [
      "Algebra 1, problem 1: that video link isn't a YouTube video. Paste a youtube.com or youtu.be link.",
    ]);
  }
});

test("a video can replace the typed problem, but a problem needs one or the other", () => {
  const videoOnly = normalizeTopFive({
    subjects: [{ name: "Algebra 1", problems: [{ title: "Two steps", video: `https://youtu.be/${ID}` }] }],
  });
  assert.equal(videoOnly.ok, true);
  assert.deepEqual(videoOnly.value.subjects[0].problems[0], {
    title: "Two steps",
    problem: "",
    steps: [],
    answer: "",
    video: ID,
  });

  const neither = normalizeTopFive({
    subjects: [{ name: "Algebra 1", problems: [{ title: "Two steps", steps: ["a step"] }] }],
  });
  assert.deepEqual(neither.errors, ["Algebra 1, problem 1 needs the problem itself or a YouTube link."]);
});

test("a row with only a video link is not dropped as blank", () => {
  const result = normalizeTopFive({ subjects: [{ name: "Algebra 1", problems: [{ video: ID }, {}] }] });
  assert.equal(result.ok, true);
  assert.equal(result.value.subjects[0].problems.length, 1);
});

test("data saved before Pick 5 (no video field) still loads, with empty videos", async () => {
  const store = memoryStore({
    topFive: {
      subjects: [
        {
          id: "algebra-1",
          name: "Algebra 1",
          intro: "",
          problems: [{ title: "", problem: "2x = 8", steps: [], answer: "" }],
        },
      ],
      updatedAt: "2026-11-02T00:00:00.000Z",
    },
  });
  const loaded = await loadTopFive(store);
  assert.equal(loaded.subjects[0].problems[0].video, "");
  assert.equal(loaded.subjects[0].problems[0].problem, "2x = 8");
});

test("the admin save action stores the video ID and the load action returns it", async () => {
  const store = memoryStore();
  const saved = await handleTopFiveAction(store, {
    action: "topFiveSave",
    topFive: {
      subjects: [{ name: "Algebra 1", problems: [{ problem: "2x = 8", video: `https://youtu.be/${ID}` }] }],
    },
  });
  assert.equal(saved.status, 200);
  assert.equal(JSON.parse(store.data.get("topFive")).subjects[0].problems[0].video, ID);
  const loaded = await handleTopFiveAction(store, { action: "topFiveLoad" });
  assert.equal(loaded.body.topFive.subjects[0].problems[0].video, ID);

  const bad = await handleTopFiveAction(store, {
    action: "topFiveSave",
    topFive: {
      subjects: [{ name: "Algebra 1", problems: [{ problem: "2x = 8", video: "https://vimeo.com/1" }] }],
    },
  });
  assert.equal(bad.status, 400);
  // The failed save left the stored video alone.
  assert.equal(JSON.parse(store.data.get("topFive")).subjects[0].problems[0].video, ID);
});

test("user-facing messages say Pick 5!, not The Top Five", () => {
  const six = normalizeTopFive({
    subjects: [{ name: "Algebra 1", problems: [1, 2, 3, 4, 5, 6].map((n) => ({ problem: `p${n}` })) }],
  });
  assert.deepEqual(six.errors, ["Algebra 1 has 6 problems. Pick 5! holds up to 5."]);
  assert.deepEqual(normalizeTopFive(null).errors, ["The Pick 5! data is missing its list of subjects."]);
});

// ---------- Page markup ----------

const home = read("public/index.html");
const adminPage = read("public/admin/index.html");

test("the section is headed Pick 5! and has the #pick-5 anchor", () => {
  assert.match(home, /<section id="pick-5"[^>]*aria-labelledby="topFiveHeading"/);
  assert.match(home, /<h2 id="topFiveHeading">Pick 5!<\/h2>/);
  assert.doesNotMatch(home, /The Top Five\./);
});

test("old #top-five links still land on the section", () => {
  // A zero-height alias right before the section, so it lands at the section's top edge.
  assert.match(
    home,
    /<span id="top-five" class="anchor-alias" aria-hidden="true"><\/span>\s*<section id="pick-5"/,
  );
  assert.equal(home.match(/id="top-five"/g).length, 1);
  // The alias sits below the sticky nav like every section heading does.
  assert.match(home, /\.anchor-alias\{[^}]*scroll-margin-top:72px/);
  // Subject links work under both names: #pick-5-algebra-1 and #top-five-algebra-1.
  const js = read("public/js/top-five.js");
  assert.match(js, /#pick-5-\$\{s\.id\}/);
  assert.match(js, /#top-five-\$\{s\.id\}/);
});

test("the admin says Pick 5! and links to #pick-5", () => {
  assert.match(adminPage, /<h2>Pick 5!<\/h2>/);
  assert.match(adminPage, /<button type="button" id="tfSave">Save Pick 5!<\/button>/);
  assert.match(adminPage, /shown in "Pick 5!" on the home page/);
  assert.match(adminPage, /href="\/#pick-5"/);
  assert.doesNotMatch(adminPage, /The Top Five|the Top Five/);
  assert.doesNotMatch(
    read("public/admin/top-five-admin.js"),
    /Top Five changes|the Top Five:|Top Five is live/,
  );
});

test("every user-facing Pick 5 has its exclamation point, with no doubled punctuation", () => {
  const adminJs = read("public/admin/top-five-admin.js");
  const lib = read("netlify/functions/lib/top-five.mjs");
  // Strip comments so code notes and internal names don't count; only shown text does.
  const shown = [home, adminPage]
    .map((html) => html.replace(/<!--[\s\S]*?-->/g, ""))
    .concat([adminJs, lib].map((js) => js.replace(/\/\/.*$/gm, "")))
    .join("\n");
  assert.doesNotMatch(shown, /Pick 5(?!!)/, "a user-facing Pick 5 without the !");
  assert.doesNotMatch(shown, /Pick 5![.!?:,;]/, "doubled punctuation after Pick 5!");
  assert.match(adminJs, /"Saved\. Pick 5! is live\."/);
  assert.match(adminJs, /"Sign out and lose your unsaved Pick 5! changes\?"/);
  assert.match(adminJs, /`Pick 5! didn't load: \$\{err\.message\}`/);
});

test("Pick 5 videos add no script request to the home page", () => {
  assert.equal((home.match(/<script src="\/js\/[^"]+"/g) || []).length, 1);
  assert.match(home, /<script src="\/js\/top-five\.js" defer><\/script>/);
});

test("video slots and placeholders reserve a 16:9 box so nothing shifts", () => {
  const css = read("public/css/top-five.css");
  assert.match(css, /\.tf-video\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css, /\.tf-video img,\s*\.tf-video iframe,\s*\.tf-video-play\s*\{[^}]*position:\s*absolute/);
});

test("no Pick 5 script writes HTML strings into the page", () => {
  for (const file of ["public/js/top-five.js", "public/admin/top-five-admin.js"]) {
    assert.doesNotMatch(read(file), /innerHTML|outerHTML|insertAdjacentHTML|document\.write/, file);
  }
});

// ---------- The video slot (pick5Video in public/js/top-five.js) ----------

// A tiny DOM stand-in: enough for createElement, attributes, children and click.
class FakeElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.className = "";
    this.textContent = "";
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
  getAttribute(name) {
    return this.attributes[name] ?? null;
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  replaceChildren(...nodes) {
    this.children = nodes;
  }
  addEventListener(type, fn) {
    this.listeners[type] = fn;
  }
  click() {
    this.listeners.click?.({ preventDefault() {} });
  }
  find(predicate) {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const found = child.find?.(predicate);
      if (found) return found;
    }
    return null;
  }
}

function loadHelper() {
  // With no #pick-5 element the section code stops at once; only the helper runs.
  const context = { document: { getElementById: () => null } };
  vm.runInNewContext(read("public/js/top-five.js"), context);
  const doc = { createElement: (tag) => new FakeElement(tag) };
  return { helper: context.pick5Video, doc };
}

test("with no video, the slot is a labelled placeholder with no iframe or image", () => {
  const { helper, doc } = loadHelper();
  for (const video of ["", undefined, null, "not-an-id", `"><img src=x onerror=alert(1)>`]) {
    const slot = helper.slot(doc, video, "Two steps");
    assert.match(slot.className, /\btf-video\b/);
    assert.match(slot.className, /\btf-video-soon\b/);
    assert.equal(
      slot.find((el) => el.tagName === "IFRAME" || el.tagName === "IMG"),
      null,
    );
    assert.equal(
      slot.find((el) => /coming soon/i.test(el.textContent))?.textContent,
      "Henry's video for this one is coming soon.",
    );
  }
});

test("an empty subject's placeholder can carry its own text", () => {
  const { helper, doc } = loadHelper();
  const slot = helper.slot(doc, "", "", "Henry's Geometry videos are coming soon.");
  assert.equal(slot.children[0].textContent, "Henry's Geometry videos are coming soon.");
});

test("with a video, the slot is a click-to-load facade and builds the nocookie URL itself", () => {
  const { helper, doc } = loadHelper();
  const slot = helper.slot(doc, ID, "Two steps");
  assert.match(slot.className, /\btf-video\b/);
  assert.equal(
    slot.find((el) => el.tagName === "IFRAME"),
    null,
    "no iframe until it's clicked",
  );

  const img = slot.find((el) => el.tagName === "IMG");
  assert.equal(img.src, `https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
  assert.equal(img.loading, "lazy");
  assert.equal(img.alt, "");

  const button = slot.find((el) => el.tagName === "BUTTON");
  assert.equal(button.getAttribute("aria-label"), "Play video: Two steps");
  button.click();

  const iframe = slot.find((el) => el.tagName === "IFRAME");
  assert.equal(iframe.src, `https://www.youtube-nocookie.com/embed/${ID}?autoplay=1`);
  assert.equal(iframe.title, "Two steps");
  assert.equal(
    slot.find((el) => el.tagName === "BUTTON"),
    null,
    "the facade is replaced by the player",
  );
});

test("the video ID check only accepts 11 YouTube ID characters", () => {
  const { helper } = loadHelper();
  assert.equal(helper.isId(ID), true);
  for (const bad of ["", "short", `${ID}a`, "dQw4w9WgXc/", "dQw4w9Wg<cQ", null, 12345678901]) {
    assert.equal(helper.isId(bad), false, String(bad));
  }
});
