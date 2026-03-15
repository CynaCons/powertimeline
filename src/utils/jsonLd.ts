/**
 * JSON-LD structured data builders for SEO
 */

import { BASE_URL, OG_IMAGE_URL, browseUrl, timelineUrl, userProfileUrl } from './urls';
import type { Timeline, User } from '../types';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PowerTimeline',
    url: BASE_URL,
    logo: OG_IMAGE_URL,
    description: 'Where events become understanding. Create, explore, and visualize timelines.',
  };
}

export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PowerTimeline',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${browseUrl()}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function timelineArticleSchema(timeline: Timeline, user: User) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: timeline.title,
    description: timeline.description || `Timeline with ${timeline.events?.length || 0} events`,
    url: timelineUrl(user.username, timeline.id),
    author: {
      '@type': 'Person',
      name: user.username,
      url: userProfileUrl(user.username),
    },
    dateCreated: timeline.createdAt || undefined,
    dateModified: timeline.updatedAt || undefined,
    image: OG_IMAGE_URL,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/ViewAction',
      userInteractionCount: timeline.viewCount || 0,
    },
  };
}

export function profilePageSchema(user: User) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `@${user.username}'s Timelines`,
    url: userProfileUrl(user.username),
    mainEntity: {
      '@type': 'Person',
      name: user.username,
      url: userProfileUrl(user.username),
    },
  };
}

export function breadcrumbSchema(items: { name: string; url?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}
