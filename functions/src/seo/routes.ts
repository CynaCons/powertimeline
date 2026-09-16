export interface PublicTimelineRoute {
  username: string;
  timelineId: string;
  isEmbed: boolean;
}

const PUBLIC_TIMELINE_PATH =
  /^\/([^/]+)\/timeline\/([^/]+)(?:\/(embed))?\/?$/;

const RESERVED_USERNAMES = new Set([
  "browse",
  "login",
  "settings",
  "admin",
  "editor",
  "api",
  "user",
  "assets",
  "src",
]);

/**
 * Parse /:username/timeline/:timelineId and /embed variants.
 * Returns null for anything else (including reserved first segments).
 */
export function parsePublicTimelinePath(
  path: string
): PublicTimelineRoute | null {
  const normalized = path.split("?")[0].replace(/\/+$/, "") || "/";
  const match = normalized.match(PUBLIC_TIMELINE_PATH);
  if (!match) return null;

  const username = match[1];
  const timelineId = match[2];
  if (!username || !timelineId) return null;
  if (RESERVED_USERNAMES.has(username.toLowerCase())) return null;

  return {
    username,
    timelineId,
    isEmbed: match[3] === "embed",
  };
}

export function requestPath(req: {
  originalUrl?: string;
  url?: string;
  path?: string;
  headers?: Record<string, unknown>;
}): string {
  const forwarded =
    headerValue(req.headers, "x-forwarded-uri") ||
    headerValue(req.headers, "x-original-url");
  const raw = forwarded || req.originalUrl || req.url || req.path || "";
  return raw.split("?")[0] || "/";
}

function headerValue(
  headers: Record<string, unknown> | undefined,
  name: string
): string | undefined {
  if (!headers) return undefined;
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (typeof value === "string" && value) return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}
