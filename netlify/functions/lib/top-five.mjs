// "The Top Five" (issue #13): up to five worked problems per subject, edited by
// Henry at /admin/ and shown on the home page.
//
// Stored in Netlify Blobs (store "site", key "topFive"), apart from the
// verse/notes "content" key, so saving one editor never overwrites the other.
// Everything here is pure or takes the blob store as an argument, so it can be
// tested without the Netlify runtime.

export const TOP_FIVE_KEY = "topFive";

export const TOP_FIVE_LIMITS = Object.freeze({
  subjects: 12,
  problemsPerSubject: 5,
  stepsPerProblem: 25,
  subjectName: 60,
  intro: 400,
  title: 120,
  problem: 2000,
  step: 800,
  answer: 400,
});

// What visitors and the editor see before Henry saves anything.
export function defaultTopFive() {
  return { subjects: [{ id: "algebra-1", name: "Algebra 1", intro: "", problems: [] }], updatedAt: null };
}

// "Algebra 1" -> "algebra-1". Used as the subject's stable id and link anchor.
export function slugify(name) {
  const slug = String(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "subject";
}

// Same trimming and length cap as the verse/notes editor, plus Windows line endings.
const text = (value, max) =>
  typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim().slice(0, max) : "";

// Steps arrive as an array, or as one block of text with one step per line.
function steps(value) {
  let list = [];
  if (Array.isArray(value)) list = value;
  else if (typeof value === "string") list = value.split(/\r\n?|\n/);
  return list.map((step) => text(step, TOP_FIVE_LIMITS.step)).filter(Boolean);
}

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function normalizeProblem(raw) {
  const source = isObject(raw) ? raw : {};
  return {
    title: text(source.title, TOP_FIVE_LIMITS.title),
    problem: text(source.problem, TOP_FIVE_LIMITS.problem),
    steps: steps(source.steps),
    answer: text(source.answer, TOP_FIVE_LIMITS.answer),
  };
}

const problemIsBlank = (p) => !p.title && !p.problem && p.steps.length === 0 && !p.answer;

// Validates and cleans what the admin sends. Blank rows are dropped, text is
// trimmed and capped, and anything that would publish a confusing page is
// rejected with a message Henry can act on.
// Returns { ok: true, value: { subjects } } or { ok: false, errors: [string] }.
export function normalizeTopFive(input) {
  if (!isObject(input) || !Array.isArray(input.subjects)) {
    return { ok: false, errors: ["The Top Five data is missing its list of subjects."] };
  }

  const errors = [];
  const subjects = [];
  const seen = new Map();

  input.subjects.forEach((rawSubject, index) => {
    const source = isObject(rawSubject) ? rawSubject : {};
    const name = text(source.name, TOP_FIVE_LIMITS.subjectName);
    const intro = text(source.intro, TOP_FIVE_LIMITS.intro);
    const problems = (Array.isArray(source.problems) ? source.problems : [])
      .map(normalizeProblem)
      .filter((p) => !problemIsBlank(p));

    if (!name && !intro && problems.length === 0) return; // an empty, unnamed row
    const label = name || `Subject ${index + 1}`;

    if (!name) errors.push(`${label} needs a name.`);
    if (problems.length > TOP_FIVE_LIMITS.problemsPerSubject) {
      errors.push(
        `${label} has ${problems.length} problems. The Top Five holds up to ${TOP_FIVE_LIMITS.problemsPerSubject}.`,
      );
    }
    problems.forEach((p, i) => {
      if (!p.problem) errors.push(`${label}, problem ${i + 1} needs the problem itself.`);
      if (p.steps.length > TOP_FIVE_LIMITS.stepsPerProblem) {
        errors.push(
          `${label}, problem ${i + 1} has ${p.steps.length} steps. The limit is ${TOP_FIVE_LIMITS.stepsPerProblem}.`,
        );
      }
    });

    const id = slugify(name);
    if (name && seen.has(id)) {
      errors.push(`There are two subjects named "${seen.get(id)}". Give each subject its own name.`);
    }
    if (name) seen.set(id, name);

    subjects.push({ id, name, intro, problems });
  });

  if (subjects.length > TOP_FIVE_LIMITS.subjects) {
    errors.push(`There are ${subjects.length} subjects. The limit is ${TOP_FIVE_LIMITS.subjects}.`);
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: { subjects } };
}

// Reads the saved Top Five, or the Algebra 1 starter if nothing is saved yet.
export async function loadTopFive(store) {
  const saved = await store.get(TOP_FIVE_KEY, { type: "json" });
  if (!isObject(saved)) return defaultTopFive();
  const result = normalizeTopFive(saved);
  // Saved data always passed validation; if it somehow doesn't now, return it
  // untouched rather than hide (and later overwrite) Henry's work.
  const subjects = result.ok ? result.value.subjects : Array.isArray(saved.subjects) ? saved.subjects : [];
  return { subjects, updatedAt: typeof saved.updatedAt === "string" ? saved.updatedAt : null };
}

export async function saveTopFive(store, input, now = new Date()) {
  const result = normalizeTopFive(input);
  if (!result.ok) return result;
  const value = { subjects: result.value.subjects, updatedAt: now.toISOString() };
  await store.setJSON(TOP_FIVE_KEY, value);
  return { ok: true, value };
}

// ---------- Hook for /api/admin (netlify/functions/admin.mjs) ----------
// admin.mjs checks the password first, then hands these actions here:
//   { action: "topFiveLoad" }                  -> { ok, topFive }
//   { action: "topFiveSave", topFive: {...} }  -> { ok, topFive } or 400 { error, errors }

const ACTIONS = new Set(["topFiveLoad", "topFiveSave"]);

export const isTopFiveAction = (action) => ACTIONS.has(action);

export async function handleTopFiveAction(store, body, now = new Date()) {
  if (body.action === "topFiveLoad") {
    return { status: 200, body: { ok: true, topFive: await loadTopFive(store) } };
  }
  if (body.action === "topFiveSave") {
    const result = await saveTopFive(store, body.topFive, now);
    if (!result.ok) return { status: 400, body: { error: result.errors.join(" "), errors: result.errors } };
    return { status: 200, body: { ok: true, topFive: result.value } };
  }
  return { status: 400, body: { error: "Unknown action" } };
}
