/**
 * Centralized URL builders for PowerTimeline
 * Reads from VITE_BASE_URL env var, defaults to https://powertimeline.com
 */

export const BASE_URL = import.meta.env.VITE_BASE_URL || 'https://powertimeline.com';

export const OG_IMAGE_URL = `${BASE_URL}/assets/images/PowerTimeline_banner.png`;

export function landingUrl(): string {
  return BASE_URL;
}

export function browseUrl(): string {
  return `${BASE_URL}/browse`;
}

export function timelineUrl(username: string, timelineId: string): string {
  return `${BASE_URL}/${username}/timeline/${timelineId}`;
}

export function userProfileUrl(username: string): string {
  return `${BASE_URL}/${username}`;
}

export function embedUrl(username: string, timelineId: string): string {
  return `${BASE_URL}/${username}/timeline/${timelineId}/embed`;
}
