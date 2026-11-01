import assert from "node:assert/strict";
import { test } from "node:test";

import {
  defaultTopFive,
  handleTopFiveAction,
  isTopFiveAction,
  loadTopFive,
  normalizeTopFive,
  saveTopFive,
  slugify,
  TOP_FIVE_KEY,
  TOP_FIVE_LIMITS,
} from "../netlify/functions/lib/top-five.mjs";

const NOW = new Date("2026-11-01T21:00:00.000Z");

// In-memory stand-in for a Netlify Blobs store (get with type "json", setJSON).
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

const problem = (n) => ({
  title: `Problem title ${n}`,
  problem: `Solve 2x + ${n} = 11`,
  steps: [`Subtract ${n} from both sides.`, "Divide both sides by 2."],
  answer: `x = ${(11 - n) / 2}`,
});

test("slugify makes stable ids from subject names", () => {
  assert.equal(slugify("Algebra 1"), "algebra-1");
  assert.equal(slugify("  Pre-Calculus & Trig!  "), "pre-calculus-trig");
  assert.equal(slugify("Álgebra"), "algebra");
  assert.equal(slugify("???"), "subject");
});

test("default content is an empty Algebra 1 subject", () => {
  assert.deepEqual(defaultTopFive(), {
    subjects: [{ id: "algebra-1", name: "Algebra 1", intro: "", problems: [] }],
    updatedAt: null,
  });
  // Each call returns a fresh copy.
  defaultTopFive().subjects.push({});
  assert.equal(defaultTopFive().subjects.length, 1);
});

test("normalize trims text, splits steps, drops blank rows, and assigns ids", () => {
  const result = normalizeTopFive({
    subjects: [
      {
        name: "  Algebra 1 ",
        intro: " Start here. ",
        problems: [
          {
            title: " Two-step equation ",
            problem: " 2x + 3 = 11 ",
            steps: "Subtract 3.\r\n\r\nDivide by 2.\n",
            answer: "x = 4",
          },
          { title: "", problem: "   ", steps: ["", "  "], answer: "" },
        ],
      },
      { name: "", intro: "", problems: [] },
      { name: "Geometry", problems: [] },
    ],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, {
    subjects: [
      {
        id: "algebra-1",
        name: "Algebra 1",
        intro: "Start here.",
        problems: [
          {
            title: "Two-step equation",
            problem: "2x + 3 = 11",
            steps: ["Subtract 3.", "Divide by 2."],
            answer: "x = 4",
          },
        ],
      },
      { id: "geometry", name: "Geometry", intro: "", problems: [] },
    ],
  });
});

test("normalize keeps math notation and line breaks inside a problem", () => {
  const text = "Solve for x:\n\\(\\frac{1}{2}x + 3 = 7\\)\nand check x² − 4 ≥ 0";
  const result = normalizeTopFive({
    subjects: [{ name: "Algebra 1", problems: [{ problem: text, steps: ["$$x = 8$$"] }] }],
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.subjects[0].problems[0].problem, text);
  assert.deepEqual(result.value.subjects[0].problems[0].steps, ["$$x = 8$$"]);
});

test("normalize caps text lengths like the verse and notes editor", () => {
  const long = "x".repeat(5000);
  const result = normalizeTopFive({
    subjects: [
      { name: long, intro: long, problems: [{ title: long, problem: long, steps: [long], answer: long }] },
    ],
  });
  assert.equal(result.ok, true);
  const [subject] = result.value.subjects;
  assert.equal(subject.name.length, TOP_FIVE_LIMITS.subjectName);
  assert.equal(subject.intro.length, TOP_FIVE_LIMITS.intro);
  const [p] = subject.problems;
  assert.equal(p.title.length, TOP_FIVE_LIMITS.title);
  assert.equal(p.problem.length, TOP_FIVE_LIMITS.problem);
  assert.equal(p.steps[0].length, TOP_FIVE_LIMITS.step);
  assert.equal(p.answer.length, TOP_FIVE_LIMITS.answer);
});

test("normalize allows exactly five problems and rejects a sixth", () => {
  const five = normalizeTopFive({
    subjects: [{ name: "Algebra 1", problems: [1, 2, 3, 4, 5].map(problem) }],
  });
  assert.equal(five.ok, true);
  assert.equal(five.value.subjects[0].problems.length, 5);

  const six = normalizeTopFive({
    subjects: [{ name: "Algebra 1", problems: [1, 2, 3, 4, 5, 6].map(problem) }],
  });
  assert.equal(six.ok, false);
  assert.deepEqual(six.errors, ["Algebra 1 has 6 problems. The Top Five holds up to 5."]);
});

test("normalize rejects missing names, missing problem text, too many steps, and duplicate subjects", () => {
  const result = normalizeTopFive({
    subjects: [
      { name: "", problems: [problem(1)] },
      { name: "Algebra 1", problems: [{ title: "Only a title", steps: ["a step"] }] },
      {
        name: "Geometry",
        problems: [{ problem: "p", steps: Array.from({ length: 26 }, (_, i) => `step ${i}`) }],
      },
      { name: "algebra 1", problems: [] },
    ],
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, [
    "Subject 1 needs a name.",
    "Algebra 1, problem 1 needs the problem itself.",
    "Geometry, problem 1 has 26 steps. The limit is 25.",
    'There are two subjects named "Algebra 1". Give each subject its own name.',
  ]);
});

test("normalize rejects bad shapes and too many subjects", () => {
  for (const bad of [null, "text", [], {}, { subjects: "Algebra 1" }]) {
    assert.deepEqual(normalizeTopFive(bad), {
      ok: false,
      errors: ["The Top Five data is missing its list of subjects."],
    });
  }
  const many = { subjects: Array.from({ length: 13 }, (_, i) => ({ name: `Subject ${i}` })) };
  assert.deepEqual(normalizeTopFive(many).errors, ["There are 13 subjects. The limit is 12."]);
  // Non-object rows and problems are ignored rather than crashing.
  assert.deepEqual(normalizeTopFive({ subjects: [42, { name: "Algebra 1", problems: [null, "x"] }] }), {
    ok: true,
    value: { subjects: [{ id: "algebra-1", name: "Algebra 1", intro: "", problems: [] }] },
  });
});

test("normalize allows an empty subject list (section shows its placeholder)", () => {
  assert.deepEqual(normalizeTopFive({ subjects: [] }), { ok: true, value: { subjects: [] } });
});

test("loadTopFive returns the Algebra 1 starter when nothing is saved", async () => {
  assert.deepEqual(await loadTopFive(memoryStore()), defaultTopFive());
});

test("saveTopFive stores under its own key and loadTopFive reads it back", async () => {
  const store = memoryStore({ content: { mathNote: "keep me" } });
  const saved = await saveTopFive(store, { subjects: [{ name: "Algebra 1", problems: [problem(3)] }] }, NOW);
  assert.equal(saved.ok, true);
  assert.equal(saved.value.updatedAt, "2026-11-01T21:00:00.000Z");

  assert.deepEqual(JSON.parse(store.data.get("content")), { mathNote: "keep me" });
  assert.equal(TOP_FIVE_KEY, "topFive");
  assert.deepEqual(await loadTopFive(store), saved.value);
});

test("saveTopFive does not write when validation fails", async () => {
  const store = memoryStore();
  const result = await saveTopFive(store, {
    subjects: [{ name: "Algebra 1", problems: [1, 2, 3, 4, 5, 6].map(problem) }],
  });
  assert.equal(result.ok, false);
  assert.equal(store.data.has(TOP_FIVE_KEY), false);
});

test("loadTopFive returns stored data untouched if it no longer validates", async () => {
  // Two subjects with the same name would fail today's validation.
  const stored = {
    subjects: [
      { id: "algebra-1", name: "Algebra 1", intro: "", problems: [] },
      { id: "algebra-1", name: "algebra 1", intro: "", problems: [] },
    ],
    updatedAt: "2026-11-01T00:00:00.000Z",
  };
  assert.equal(normalizeTopFive(stored).ok, false);
  assert.deepEqual(await loadTopFive(memoryStore({ [TOP_FIVE_KEY]: stored })), stored);
});

test("isTopFiveAction only claims the Top Five actions", () => {
  assert.equal(isTopFiveAction("topFiveLoad"), true);
  assert.equal(isTopFiveAction("topFiveSave"), true);
  for (const other of ["login", "load", "save", "", undefined, "topfivesave"])
    assert.equal(isTopFiveAction(other), false);
});

test("handleTopFiveAction loads, saves, and reports validation errors", async () => {
  const store = memoryStore();
  const loaded = await handleTopFiveAction(store, { action: "topFiveLoad" });
  assert.deepEqual(loaded, { status: 200, body: { ok: true, topFive: defaultTopFive() } });

  const saved = await handleTopFiveAction(
    store,
    { action: "topFiveSave", topFive: { subjects: [{ name: "Algebra 1", problems: [problem(1)] }] } },
    NOW,
  );
  assert.equal(saved.status, 200);
  assert.equal(saved.body.topFive.subjects[0].problems[0].answer, "x = 5");
  assert.equal(saved.body.topFive.updatedAt, NOW.toISOString());

  const bad = await handleTopFiveAction(store, {
    action: "topFiveSave",
    topFive: { subjects: [{ problems: [problem(1)] }] },
  });
  assert.deepEqual(bad, {
    status: 400,
    body: { error: "Subject 1 needs a name.", errors: ["Subject 1 needs a name."] },
  });

  const missing = await handleTopFiveAction(store, { action: "topFiveSave" });
  assert.equal(missing.status, 400);

  // The failed saves left the good save in place.
  assert.equal((await loadTopFive(store)).subjects[0].problems.length, 1);
});
