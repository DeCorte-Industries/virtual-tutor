import { getStore } from "@netlify/blobs";

// Public, read-only. Returns Henry's current verse and notes (any may be missing).
export default async () => {
  const content = (await getStore("site").get("content", { type: "json" })) || {};
  return new Response(JSON.stringify(content), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
};

export const config = { path: "/api/content" };
