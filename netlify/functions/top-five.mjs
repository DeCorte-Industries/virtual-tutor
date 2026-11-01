import { getStore } from "@netlify/blobs";
import { loadTopFive } from "./lib/top-five.mjs";

// Public, read-only. Returns Henry's Top Five worked problems by subject
// (edited at /admin/; see netlify/functions/lib/top-five.mjs).
export default async () => {
  const topFive = await loadTopFive(getStore("site"));
  return new Response(JSON.stringify(topFive), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
};

export const config = { path: "/api/top-five" };
