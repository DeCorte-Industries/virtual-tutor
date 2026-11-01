// "The Top Five" (issue #13): worked problems by subject on the home page.
// Content comes from /api/top-five and is edited by Henry at /admin/.
// All of Henry's text is inserted with textContent, never as HTML.
(() => {
  const section = document.getElementById("top-five");
  if (!section) return;

  const tabList = document.getElementById("topFiveTabs");
  const panel = document.getElementById("topFivePanel");
  const ctaText = document.getElementById("topFiveCtaText");
  const FALLBACK = { subjects: [{ id: "algebra-1", name: "Algebra 1", intro: "", problems: [] }] };

  // KaTeX is only fetched when Henry's text uses LaTeX delimiters: \( \), \[ \] or $$ $$.
  // A single $ is not a delimiter, so prices like "$50" are never treated as math.
  const KATEX = "https://cdn.jsdelivr.net/npm/katex@0.19.1/dist/";
  const KATEX_FILES = {
    css: ["katex.min.css", "sha384-WwGtaC6ywCHxA5cstpj/3+xIZvTez8dq2IcBQaXRkenHZ7FVVq1ZROtURwfbtTlG"],
    js: ["katex.min.js", "sha384-a1WQdjRj162i159OYq041X6I4K8NenkrI09LlPmiHg0YOb7CR+wJOraXwK9abpnE"],
    auto: [
      "contrib/auto-render.min.js",
      "sha384-bjyGPfbij8/NDKJhSGZNP/khQVgtHUE5exjm4Ydllo42FwIgYsdLO2lXGmRBf5Mz",
    ],
  };
  const MATH_PATTERN = /\\\(|\\\[|\$\$/;
  let katexLoading = null;

  function loadAsset(tag, [file, integrity]) {
    return new Promise((resolve, reject) => {
      const el = document.createElement(tag);
      if (tag === "link") {
        el.rel = "stylesheet";
        el.href = KATEX + file;
      } else {
        el.src = KATEX + file;
      }
      el.integrity = integrity;
      el.crossOrigin = "anonymous";
      el.onload = resolve;
      el.onerror = reject;
      document.head.appendChild(el);
    });
  }

  function loadKatex() {
    if (!katexLoading) {
      katexLoading = Promise.all([
        loadAsset("link", KATEX_FILES.css),
        loadAsset("script", KATEX_FILES.js),
      ]).then(() => loadAsset("script", KATEX_FILES.auto));
    }
    return katexLoading;
  }

  // If KaTeX can't load, the LaTeX source stays visible as plain text.
  function typeset(el) {
    if (!MATH_PATTERN.test(el.textContent)) return;
    loadKatex()
      .then(() => {
        window.renderMathInElement(el, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false },
          ],
          throwOnError: false,
        });
      })
      .catch(() => {});
  }

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function renderProblem(problem, index) {
    const card = make("li", "tf-problem");
    const head = make("p", "tf-label");
    head.append(make("span", "tf-num", String(index + 1)));
    head.append(make("span", "tf-title", problem.title || `Problem ${index + 1}`));
    card.append(head);
    card.append(make("p", "tf-statement", problem.problem));

    const steps = Array.isArray(problem.steps) ? problem.steps : [];
    if (steps.length === 0 && !problem.answer) {
      card.append(make("p", "tf-soon", "Henry's worked solution is coming soon."));
      return card;
    }

    const details = make("details", "tf-solution");
    details.append(make("summary", "", "Show the worked solution"));
    if (steps.length > 0) {
      const list = make("ol", "tf-steps");
      for (const step of steps) list.append(make("li", "", step));
      details.append(list);
    }
    if (problem.answer) {
      const answer = make("p", "tf-answer");
      answer.append(make("strong", "", "Answer: "));
      answer.append(document.createTextNode(problem.answer));
      details.append(answer);
    }
    card.append(details);
    return card;
  }

  function renderSubject(subject) {
    panel.replaceChildren();
    panel.append(make("h3", "tf-subject", subject.name));
    if (subject.intro) panel.append(make("p", "tf-intro", subject.intro));

    const problems = Array.isArray(subject.problems) ? subject.problems : [];
    if (problems.length === 0) {
      panel.append(
        make(
          "p",
          "tf-empty",
          `Henry is working out the first ${subject.name} problems now. Check back soon, or book a lesson hour and work through yours live.`,
        ),
      );
    } else {
      const list = make("ol", "tf-problems");
      problems.forEach((p, i) => {
        list.append(renderProblem(p, i));
      });
      panel.append(list);
    }

    ctaText.textContent = `Want more ${subject.name} worked out with you? Book a lesson hour with Henry.`;
    typeset(panel);
  }

  function selectTab(subjects, index, focus) {
    tabList.querySelectorAll("[role=tab]").forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) {
        panel.setAttribute("aria-labelledby", tab.id);
        if (focus) tab.focus();
      }
    });
    renderSubject(subjects[index]);
  }

  function render(data) {
    const subjects = (data && Array.isArray(data.subjects) ? data.subjects : []).filter((s) => s?.name);
    if (subjects.length === 0) {
      panel.replaceChildren(make("p", "tf-empty", "Henry's worked problems are coming soon."));
      return;
    }

    tabList.replaceChildren();
    tabList.hidden = subjects.length < 2;
    subjects.forEach((subject, i) => {
      const tab = make("button", "tf-tab", subject.name);
      tab.type = "button";
      tab.id = `top-five-tab-${subject.id || i}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", "topFivePanel");
      tab.addEventListener("click", () => selectTab(subjects, i, false));
      tabList.append(tab);
    });
    tabList.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const tabs = [...tabList.querySelectorAll("[role=tab]")];
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      const next = (current + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      selectTab(subjects, next, true);
    });

    // A link like mathwithhenry.com/#top-five-algebra-1 opens that subject.
    const openFromHash = () => {
      const index = subjects.findIndex((s) => `#top-five-${s.id}` === window.location.hash);
      if (index >= 0) {
        selectTab(subjects, index, false);
        section.scrollIntoView();
      }
      return index;
    };
    if (openFromHash() < 0) selectTab(subjects, 0, false);
    window.addEventListener("hashchange", openFromHash);
  }

  fetch("/api/top-five", { headers: { Accept: "application/json" } })
    .then((res) => (res.ok ? res.json() : FALLBACK))
    .catch(() => FALLBACK)
    .then(render);
})();
