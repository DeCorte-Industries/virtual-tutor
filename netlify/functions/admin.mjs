import { timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";

const LIMITS = { verseText: 600, verseRef: 80, note: 1500 };

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function passwordOk(supplied) {
  const expected = Netlify.env.get("ADMIN_PASSWORD");
  if (!expected || typeof supplied !== "string") return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const clean = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

// POST /api/admin  { password, action: "login" | "load" | "save", ...fields }
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  if (!passwordOk(body.password)) {
    // Small delay slows down password guessing.
    await new Promise((r) => setTimeout(r, 800));
    return json({ error: "Incorrect password" }, 401);
  }

  const store = getStore("site");

  if (body.action === "login" || body.action === "load") {
    return json({ ok: true, content: (await store.get("content", { type: "json" })) || {} });
  }

  if (body.action === "save") {
    const verseText = clean(body.verseText, LIMITS.verseText);
    const verseRef = clean(body.verseRef, LIMITS.verseRef);
    const content = {
      verse: verseText ? { text: verseText, ref: verseRef } : null,
      mathNote: clean(body.mathNote, LIMITS.note),
      otherNote: clean(body.otherNote, LIMITS.note),
      updatedAt: new Date().toISOString(),
    };
    await store.setJSON("content", content);
    return json({ ok: true, content });
  }

  return json({ error: "Unknown action" }, 400);
};

export const config = { path: "/api/admin" };
