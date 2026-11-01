// Everyday math videos (#12): validation, storage shape, and the admin actions.
// Pure helpers with no Netlify imports, so tests can use them directly.
// Videos live in their own blob key so saving the verse and notes can never
// overwrite them, and saving videos can never overwrite the verse and notes.

export const VIDEOS_BLOB_KEY = "everyday-videos";
export const VIDEO_LIMITS = { maxVideos: 24, title: 120, caption: 300, url: 300 };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const NOCOOKIE_HOSTS = new Set(["youtube-nocookie.com", "www.youtube-nocookie.com"]);
const ID_PATH_PREFIXES = new Set(["embed", "shorts", "live", "v"]);

export const isYouTubeId = (value) => typeof value === "string" && YOUTUBE_ID.test(value);

// Returns the 11-character video ID from a YouTube link or bare ID, or null.
// Only youtube.com, youtu.be and youtube-nocookie.com links are accepted.
export function parseYouTubeId(input) {
  if (typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw || raw.length > VIDEO_LIMITS.url) return null;
  if (isYouTubeId(raw)) return raw;

  let url;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password || url.port) return null;

  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  let candidate = null;
  if (host === "youtu.be") {
    candidate = parts[0];
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (parts[0] === "watch") candidate = url.searchParams.get("v");
    else if (ID_PATH_PREFIXES.has(parts[0])) candidate = parts[1];
  } else if (NOCOOKIE_HOSTS.has(host) && parts[0] === "embed") {
    candidate = parts[1];
  }
  return isYouTubeId(candidate) ? candidate : null;
}

export const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
export const embedUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}`;

const oneLine = (value, max) =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
const multiLine = (value, max) =>
  typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
        .slice(0, max)
    : "";

// Validates what the admin page sends: [{ title, url, caption }, ...].
// Rows left completely blank are skipped. Returns { videos, errors }; save only
// when errors is empty. Stored videos are { id, title, caption }.
export function normalizeVideos(input) {
  if (!Array.isArray(input)) return { videos: [], errors: ["Videos must be a list."] };
  const videos = [];
  const errors = [];
  input.forEach((item, index) => {
    const row = item && typeof item === "object" ? item : {};
    const label = `Video ${index + 1}`;
    const title = oneLine(row.title, VIDEO_LIMITS.title);
    const caption = multiLine(row.caption, VIDEO_LIMITS.caption);
    const link = typeof row.url === "string" ? row.url.trim() : "";
    if (!title && !link && !caption) return;
    const id = parseYouTubeId(link);
    if (!title) errors.push(`${label}: add a title.`);
    if (!link) errors.push(`${label}: paste a YouTube link.`);
    else if (!id) errors.push(`${label}: that link isn't a YouTube video (use youtube.com or youtu.be).`);
    if (title && id) videos.push({ id, title, caption });
  });
  if (videos.length > VIDEO_LIMITS.maxVideos) {
    errors.push(`You can show up to ${VIDEO_LIMITS.maxVideos} videos. Remove a few and save again.`);
  }
  return { videos: errors.length ? [] : videos, errors };
}

// Shapes whatever is in the blob store into the public response. Anything that
// doesn't pass validation is dropped, so a bad stored value can't reach the page.
export function toPublicVideos(stored) {
  const list = stored && Array.isArray(stored.videos) ? stored.videos : [];
  const videos = list
    .filter((v) => v && isYouTubeId(v.id))
    .map((v) => ({
      id: v.id,
      title: oneLine(v.title, VIDEO_LIMITS.title),
      caption: multiLine(v.caption, VIDEO_LIMITS.caption),
    }))
    .filter((v) => v.title)
    .slice(0, VIDEO_LIMITS.maxVideos);
  const updatedAt = stored && typeof stored.updatedAt === "string" ? stored.updatedAt : null;
  return { videos, updatedAt };
}

export async function loadVideos(store) {
  return toPublicVideos(await store.get(VIDEOS_BLOB_KEY, { type: "json" }));
}

// Handles the admin actions "loadVideos" and "saveVideos" (the caller has
// already checked the password). Returns { status, body }, or null for any
// other action so the caller can carry on.
export async function handleVideosAction(store, body, now = new Date()) {
  const action = body?.action;
  if (action === "loadVideos") {
    return { status: 200, body: { ok: true, ...(await loadVideos(store)) } };
  }
  if (action === "saveVideos") {
    const { videos, errors } = normalizeVideos(body.videos);
    if (errors.length) {
      return { status: 400, body: { error: "Please fix the videos marked below.", errors } };
    }
    const saved = { videos, updatedAt: now.toISOString() };
    await store.setJSON(VIDEOS_BLOB_KEY, saved);
    return { status: 200, body: { ok: true, ...saved } };
  }
  return null;
}
