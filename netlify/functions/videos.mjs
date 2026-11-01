import { getStore } from "@netlify/blobs";

import { loadVideos } from "./lib/everyday-videos.mjs";

// Public, read-only. Returns Henry's everyday math videos: { videos: [{ id, title, caption }], updatedAt }.
export default async () => {
  const content = await loadVideos(getStore("site"));
  return new Response(JSON.stringify(content), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
};

export const config = { path: "/api/videos" };
