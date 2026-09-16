/**
 * Timeline visibility helpers.
 *
 * Firestore rules treat a missing `visibility` field as public (backwards
 * compatibility). Sitemap and prerender must do the same.
 */

export type TimelineVisibility = "public" | "unlisted" | "private";

export function normalizeVisibility(value: unknown): TimelineVisibility {
  if (value === "unlisted" || value === "private" || value === "public") {
    return value;
  }
  return "public";
}

/** Listed in discovery feeds and sitemap. */
export function isPubliclyListed(value: unknown): boolean {
  return normalizeVisibility(value) === "public";
}

/** Shareable via URL (public or unlisted). Private must never leak content. */
export function isShareVisible(value: unknown): boolean {
  const visibility = normalizeVisibility(value);
  return visibility === "public" || visibility === "unlisted";
}
