// Guards the homepage fixes for mobile LCP and layout shift (#16): self-hosted, preloaded fonts with
// font-display: swap and metric-matched fallbacks, and reserved space for content that loads late.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const publicDir = new URL("../public/", import.meta.url);
const html = readFileSync(new URL("index.html", publicDir), "utf8");
const css = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
const fontFaces = css.match(/@font-face\{[^}]*\}/g) ?? [];
const preloads = html.match(/<link rel="preload"[^>]*>/g) ?? [];

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}(?:="([^"]*)")?[\\s>/]`));
  return match ? (match[1] ?? "") : null;
}

function descriptor(face, name) {
  const match = face.match(new RegExp(`[{;]${name}:([^;}]*)`));
  return match ? match[1].trim() : null;
}

test("the homepage loads no fonts from Google Fonts", () => {
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
});

test("every web font is self-hosted, swaps in, and exists in public/fonts", () => {
  const webFonts = fontFaces.filter((face) => face.includes("url("));
  assert.ok(webFonts.length >= 2, "expected @font-face rules for Bevan and Source Serif 4");
  for (const face of webFonts) {
    assert.equal(descriptor(face, "font-display"), "swap", face);
    const url = face.match(/url\(([^)]+)\)/)[1];
    assert.match(url, /^\/fonts\/[a-z0-9-]+\.woff2$/, face);
    assert.ok(existsSync(new URL(`.${url}`, publicDir)), `${url} is missing`);
  }
});

test("the above-the-fold fonts are preloaded correctly", () => {
  const hrefs = preloads.map((tag) => attr(tag, "href"));
  assert.ok(hrefs.includes("/fonts/bevan-latin.woff2"), "the hero heading font (LCP) must be preloaded");
  for (const tag of preloads) {
    const href = attr(tag, "href");
    assert.equal(attr(tag, "as"), "font", tag);
    assert.equal(attr(tag, "type"), "font/woff2", tag);
    assert.notEqual(attr(tag, "crossorigin"), null, `${tag} needs crossorigin or the preload is wasted`);
    assert.ok(
      fontFaces.some((face) => face.includes(`url(${href})`)),
      `${href} is preloaded but no @font-face uses it`,
    );
  }
});

test("font stacks fall back to size-adjusted local fonts before the generic ones", () => {
  for (const [variable, family] of [
    ["--display", "Bevan"],
    ["--text", "Source Serif 4"],
  ]) {
    const stack = css.match(new RegExp(`${variable}:([^;]+);`))[1];
    assert.ok(stack.startsWith(`'${family}','${family} Fallback',`), `${variable}: ${stack}`);
    const fallbacks = fontFaces.filter((face) => face.includes(`font-family:'${family} Fallback'`));
    assert.ok(fallbacks.length > 0, `no @font-face for '${family} Fallback'`);
    for (const face of fallbacks) {
      assert.match(descriptor(face, "src"), /^local\(/, face);
      assert.match(descriptor(face, "size-adjust"), /^\d+(\.\d+)?%$/, face);
    }
  }
});

test("the hero diagram has an intrinsic size so its space is reserved", () => {
  const svg = html.match(/<figure class="proof">\s*(<svg[^>]*>)/)[1];
  const [, , viewWidth, viewHeight] = attr(svg, "viewBox").split(" ").map(Number);
  const width = Number(attr(svg, "width"));
  const height = Number(attr(svg, "height"));
  assert.ok(width > 0 && height > 0, `hero svg needs width and height: ${svg}`);
  assert.equal(width / height, viewWidth / viewHeight);
  assert.match(css, /\.proof svg\{[^}]*aspect-ratio:1 \/ 1;/);
});

test("every image on the homepage has width and height", () => {
  for (const img of html.match(/<img\b[^>]*>/g) ?? []) {
    assert.match(attr(img, "width") ?? "", /^\d+$/, img);
    assert.match(attr(img, "height") ?? "", /^\d+$/, img);
  }
});

test("the verse banner reserves its height before the verse loads", () => {
  assert.match(css, /\.verse-banner-inner\{[^}]*min-height:[\d.]+rem;/);
});

test("self-hosted fonts are cached long-term", () => {
  const toml = readFileSync(new URL("../netlify.toml", import.meta.url), "utf8");
  assert.match(
    toml,
    /for = "\/fonts\/\*"\s+\[headers\.values\]\s+Cache-Control = "public, max-age=31536000, immutable"/,
  );
});
