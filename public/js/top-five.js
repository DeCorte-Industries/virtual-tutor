// "Pick 5" (issue #18; was "The Top Five", #13): worked problems by subject on
// the home page, each with Henry's YouTube video or a "coming soon" placeholder
// (see pick5Video below). Content comes from /api/top-five and is
// edited by Henry at /admin/. All of Henry's text is inserted with textContent,
// never as HTML.

// ---------- Pick 5 video slot (issue #18) ----------
// The video slot shown with each worked problem.
// A saved video becomes a click-to-load facade: a lazy-loaded thumbnail and a
// play button. The YouTube player (youtube-nocookie.com) only loads when the
// visitor clicks, so the home page never pays for an iframe up front. With no
// video yet, the slot is a "coming soon" placeholder of the same 16:9 size.
// Only 11-character YouTube IDs are used, and every URL is built here.
// Kept in this file (not its own script) so the home page makes no extra request;
// tests run it on its own through globalThis.pick5Video.
globalThis.pick5Video = (() => {
  const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
  const isId = (value) => typeof value === "string" && YOUTUBE_ID.test(value);

  function el(doc, tag, className, text) {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function player(doc, id, title) {
    const iframe = el(doc, "iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    iframe.title = title;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    return iframe;
  }

  function slot(doc, id, title, soonText) {
    const label = title || "Henry's worked problem";
    if (!isId(id)) {
      const box = el(doc, "div", "tf-video tf-video-soon");
      box.append(
        el(doc, "p", "tf-video-soon-text", soonText || "Henry's video for this one is coming soon."),
      );
      return box;
    }

    const box = el(doc, "div", "tf-video");
    const thumb = el(doc, "img");
    thumb.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    thumb.alt = "";
    thumb.loading = "lazy";
    thumb.decoding = "async";
    thumb.width = 480;
    thumb.height = 360;

    const play = el(doc, "button", "tf-video-play");
    play.type = "button";
    play.setAttribute("aria-label", `Play video: ${label}`);
    play.append(el(doc, "span", "tf-video-play-icon"));
    play.addEventListener("click", () => {
      const frame = player(doc, id, label);
      box.replaceChildren(frame);
      frame.focus?.(); // keep keyboard focus on the video, not lost with the removed button
    });

    box.append(thumb, play);
    return box;
  }

  return { isId, slot };
})();

(() => {
  const section = document.getElementById("pick-5");
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
          // Set explicitly so a change in KaTeX's defaults can't loosen them. trust: false blocks
          // \href, \url, \includegraphics and \html* commands. strict: "ignore" lets KaTeX accept
          // harmless non-standard input (Unicode like ² or − inside math) quietly instead of logging
          // warnings in visitors' consoles. It only affects LaTeX-compatibility checks, not security.
          trust: false,
          strict: "ignore",
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
    const title = problem.title || `Problem ${index + 1}`;
    card.append(globalThis.pick5Video.slot(document, problem.video, title));
    const body = make("div", "tf-body");
    card.append(body);
    const head = make("p", "tf-label");
    head.append(make("span", "tf-num", String(index + 1)));
    head.append(make("span", "tf-title", title));
    body.append(head);
    if (problem.problem) body.append(make("p", "tf-statement", problem.problem));

    const steps = Array.isArray(problem.steps) ? problem.steps : [];
    if (steps.length === 0 && !problem.answer) {
      // A video on its own is the whole solution; only typed problems promise more.
      if (!problem.video) body.append(make("p", "tf-soon", "Henry's worked solution is coming soon."));
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
    body.append(details);
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
      const soon = make("div", "tf-empty-videos");
      soon.append(
        globalThis.pick5Video.slot(document, "", "", `Henry's ${subject.name} videos are coming soon.`),
      );
      panel.append(soon);
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
      tab.id = `pick-5-tab-${subject.id || i}`;
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

    // A link like mathwithhenry.com/#pick-5-algebra-1 opens that subject. The
    // old #top-five-algebra-1 form still works.
    const openFromHash = () => {
      const hash = window.location.hash;
      const index = subjects.findIndex((s) => hash === `#pick-5-${s.id}` || hash === `#top-five-${s.id}`);
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
