// "The Top Five" editor (issue #13). Loaded by /admin/ next to the verse and
// notes editor. It waits for that page's sign-in, then loads and saves through
// /api/admin with the actions "topFiveLoad" and "topFiveSave". The server
// (netlify/functions/lib/top-five.mjs) validates everything again.
(() => {
  const root = document.getElementById("topFiveEditor");
  if (!root) return;

  const MAX_PROBLEMS = 5;
  const MAX_SUBJECTS = 12;
  const SYMBOLS = [
    "²",
    "³",
    "√",
    "π",
    "±",
    "×",
    "÷",
    "−",
    "≤",
    "≥",
    "≠",
    "≈",
    "½",
    "⅓",
    "¼",
    "→",
    "∞",
    "°",
    "θ",
  ];

  const list = document.getElementById("tfSubjects");
  const addSubjectBtn = document.getElementById("tfAddSubject");
  const saveBtn = document.getElementById("tfSave");
  const msg = document.getElementById("tfMsg");

  let password = null;
  let subjects = [];
  let openIndex = 0;
  let dirty = false;
  let lastField = null;

  async function api(payload) {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ password }, payload)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || "Something went wrong"), { status: res.status });
    return data;
  }

  function setMsg(kind, text) {
    msg.className = kind ? `msg ${kind}` : "msg";
    msg.textContent = text;
  }

  function markDirty() {
    dirty = true;
    setMsg("", "You have unsaved changes.");
  }

  const blankProblem = () => ({ title: "", problem: "", steps: [], answer: "" });

  function make(tag, attrs, text) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (key === "className") el.className = value;
      else el.setAttribute(key, value);
    }
    if (text) el.textContent = text;
    return el;
  }

  function field(id, labelText, value, max, onInput, multiline, hint) {
    const wrap = make("div", { className: "tf-field" });
    wrap.append(make("label", { for: id }, labelText));
    if (hint) wrap.append(make("p", { className: "hint" }, hint));
    const input = make(multiline ? "textarea" : "input", { id, maxlength: String(max) });
    if (multiline) input.rows = multiline;
    input.value = value;
    input.addEventListener("input", () => {
      onInput(input.value);
      markDirty();
    });
    input.addEventListener("focus", () => {
      lastField = input;
    });
    wrap.append(input);
    return wrap;
  }

  function smallButton(text, onClick, disabled) {
    const btn = make("button", { type: "button", className: "tf-small" }, text);
    btn.disabled = Boolean(disabled);
    btn.addEventListener("click", onClick);
    return btn;
  }

  function move(array, from, to) {
    const [item] = array.splice(from, 1);
    array.splice(to, 0, item);
  }

  function renderProblem(subject, s, p) {
    const problem = subject.problems[p];
    const box = make("fieldset", { className: "tf-problem" });
    box.append(make("legend", {}, `Problem ${p + 1}`));
    const id = `tf-${s}-${p}`;
    box.append(
      field(`${id}-title`, "Short title (optional)", problem.title, 120, (v) => {
        problem.title = v;
      }),
    );
    box.append(
      field(
        `${id}-problem`,
        "The problem",
        problem.problem,
        2000,
        (v) => {
          problem.problem = v;
        },
        3,
      ),
    );
    box.append(
      field(
        `${id}-steps`,
        "Worked solution, one step per line",
        problem.steps.join("\n"),
        20000,
        (v) => {
          problem.steps = v.split("\n");
        },
        7,
        "Each line becomes a numbered step. Students open the solution when they're ready.",
      ),
    );
    box.append(
      field(`${id}-answer`, "Final answer (optional)", problem.answer, 400, (v) => {
        problem.answer = v;
      }),
    );

    const row = make("div", { className: "tf-row" });
    row.append(
      smallButton(
        "Move up",
        () => {
          move(subject.problems, p, p - 1);
          markDirty();
          render();
        },
        p === 0,
      ),
      smallButton(
        "Move down",
        () => {
          move(subject.problems, p, p + 1);
          markDirty();
          render();
        },
        p === subject.problems.length - 1,
      ),
      smallButton("Remove problem", () => {
        const hasText = problem.problem || problem.steps.join("").trim();
        if (hasText && !window.confirm(`Remove problem ${p + 1}? This can't be undone after you save.`))
          return;
        subject.problems.splice(p, 1);
        markDirty();
        render();
      }),
    );
    box.append(row);
    return box;
  }

  function renderSubject(subject, s) {
    const details = make("details", { className: "tf-subject" });
    details.open = s === openIndex;
    details.addEventListener("toggle", () => {
      if (details.open) openIndex = s;
    });
    const count = subject.problems.length;
    details.append(
      make("summary", {}, `${subject.name || "New subject"} (${count} of ${MAX_PROBLEMS} problems)`),
    );

    details.append(
      field(`tf-${s}-name`, "Subject name", subject.name, 60, (v) => {
        subject.name = v;
      }),
    );
    details.append(
      field(
        `tf-${s}-intro`,
        "Short intro (optional)",
        subject.intro,
        400,
        (v) => {
          subject.intro = v;
        },
        2,
        "One or two lines shown above this subject's problems.",
      ),
    );

    subject.problems.forEach((_, p) => {
      details.append(renderProblem(subject, s, p));
    });

    const row = make("div", { className: "tf-row" });
    row.append(
      smallButton(
        count >= MAX_PROBLEMS
          ? "This subject has all 5 problems"
          : `Add problem ${count + 1} of ${MAX_PROBLEMS}`,
        () => {
          subject.problems.push(blankProblem());
          markDirty();
          render();
          document.getElementById(`tf-${s}-${count}-problem`)?.focus();
        },
        count >= MAX_PROBLEMS,
      ),
      smallButton(
        "Move subject up",
        () => {
          move(subjects, s, s - 1);
          openIndex = s - 1;
          markDirty();
          render();
        },
        s === 0,
      ),
      smallButton(
        "Move subject down",
        () => {
          move(subjects, s, s + 1);
          openIndex = s + 1;
          markDirty();
          render();
        },
        s === subjects.length - 1,
      ),
      smallButton("Remove subject", () => {
        const label = subject.name || "this subject";
        if (!window.confirm(`Remove ${label} and all of its problems? This can't be undone after you save.`))
          return;
        subjects.splice(s, 1);
        openIndex = 0;
        markDirty();
        render();
      }),
    );
    details.append(row);
    return details;
  }

  function render() {
    list.replaceChildren(...subjects.map(renderSubject));
    addSubjectBtn.disabled = subjects.length >= MAX_SUBJECTS;
  }

  function load(topFive) {
    subjects = (topFive.subjects || []).map((s) => ({
      name: s.name || "",
      intro: s.intro || "",
      problems: (s.problems || []).map((p) => ({
        title: p.title || "",
        problem: p.problem || "",
        steps: Array.isArray(p.steps) ? p.steps.slice() : [],
        answer: p.answer || "",
      })),
    }));
    dirty = false;
    render();
  }

  function payload() {
    return {
      subjects: subjects.map((s) => ({
        name: s.name,
        intro: s.intro,
        problems: s.problems.map((p) => ({
          title: p.title,
          problem: p.problem,
          steps: p.steps,
          answer: p.answer,
        })),
      })),
    };
  }

  function signedOut() {
    password = null;
    root.hidden = true;
  }

  function expired() {
    signedOut();
    document.dispatchEvent(new CustomEvent("admin:expired"));
  }

  function signedIn(pw) {
    password = pw;
    root.hidden = false;
    setMsg("", "Loading…");
    api({ action: "topFiveLoad" })
      .then((data) => {
        load(data.topFive);
        setMsg("", "");
      })
      .catch((err) => {
        if (err.status === 401) return expired();
        setMsg("err", `Could not load the Top Five: ${err.message}`);
      });
  }
  // Checks for a sign-in that already happened and listens for later ones (see top-five-session.js).
  window.tfConnectSession(window, document, signedIn, signedOut);

  // Signing out drops unsaved Top Five edits, so ask first. Listening on document in the capture phase
  // runs this before the page's own sign-out handler on the button, so cancelling stops it.
  document.addEventListener(
    "click",
    (e) => {
      if (!e.target.closest?.("#signOut") || !dirty || !password) return;
      if (!window.confirm("Sign out and lose your unsaved Top Five changes?")) e.stopPropagation();
    },
    { capture: true },
  );

  addSubjectBtn.addEventListener("click", () => {
    subjects.push({ name: "", intro: "", problems: [] });
    openIndex = subjects.length - 1;
    markDirty();
    render();
    document.getElementById(`tf-${openIndex}-name`)?.focus();
  });

  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    setMsg("", "Saving…");
    try {
      const data = await api({ action: "topFiveSave", topFive: payload() });
      load(data.topFive);
      setMsg("ok", "Saved. The Top Five is live.");
    } catch (err) {
      if (err.status === 401) return expired();
      setMsg("err", `Not saved. ${err.message}`);
    } finally {
      saveBtn.disabled = false;
    }
  });

  // Symbol buttons type into whichever Top Five box was used last.
  const bar = document.getElementById("tfSymbols");
  for (const symbol of SYMBOLS) {
    const btn = make(
      "button",
      { type: "button", className: "tf-symbol", "aria-label": `Insert ${symbol}` },
      symbol,
    );
    btn.addEventListener("mousedown", (e) => e.preventDefault()); // keep focus in the text box
    btn.addEventListener("click", () => {
      if (!lastField?.isConnected) return;
      lastField.focus();
      lastField.setRangeText(symbol, lastField.selectionStart, lastField.selectionEnd, "end");
      lastField.dispatchEvent(new Event("input"));
    });
    bar.append(btn);
  }

  window.addEventListener("beforeunload", (e) => {
    if (dirty && password) e.preventDefault();
  });
})();
