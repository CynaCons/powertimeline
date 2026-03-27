/**
 * XPostEmbed — Renders an X/Twitter post as an embedded card using Twitter's oEmbed.
 *
 * Loads the tweet via Twitter's widgets.js, which renders a rich card with
 * author info, tweet text, media, and engagement metrics.
 */

import { useState, useEffect, useRef } from 'react';

interface XPostEmbedProps {
  url: string;
}

// Track if widgets.js is loaded globally
let widgetsLoaded = false;
let widgetsLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadTwitterWidgets(): Promise<void> {
  if (widgetsLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    if (widgetsLoading) {
      loadCallbacks.push(resolve);
      return;
    }

    widgetsLoading = true;
    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.onload = () => {
      widgetsLoaded = true;
      widgetsLoading = false;
      resolve();
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };
    script.onerror = () => {
      widgetsLoading = false;
      resolve(); // resolve anyway, embed will show fallback
    };
    document.head.appendChild(script);
  });
}

/**
 * Extract tweet ID from an X/Twitter URL.
 * Supports: x.com/user/status/ID, twitter.com/user/status/ID
 */
export function extractTweetId(url: string): string | null {
  const match = url.match(/(?:x\.com|twitter\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Check if a URL is an X/Twitter post URL.
 */
export function isXPostUrl(url: string): boolean {
  return extractTweetId(url) !== null;
}

export function XPostEmbed({ url }: XPostEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const tweetId = extractTweetId(url);
    if (!tweetId || !containerRef.current) return;

    let cancelled = false;

    loadTwitterWidgets().then(() => {
      if (cancelled || !containerRef.current) return;

      const twttr = (window as unknown as Record<string, unknown>).twttr as {
        widgets: {
          createTweet: (id: string, el: HTMLElement, opts: Record<string, unknown>) => Promise<HTMLElement | null>;
        };
      } | undefined;

      if (!twttr?.widgets) {
        setError(true);
        return;
      }

      // Clear container before rendering
      containerRef.current.innerHTML = '';

      twttr.widgets.createTweet(tweetId, containerRef.current, {
        theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light',
        dnt: true, // Do Not Track
        width: 400,
      }).then((el) => {
        if (cancelled) return;
        if (el) {
          setLoaded(true);
        } else {
          setError(true);
        }
      }).catch(() => {
        if (!cancelled) setError(true);
      });
    });

    return () => { cancelled = true; };
  }, [url]);

  if (error) {
    // Fallback: render as a styled link
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm truncate block hover:underline"
        style={{ color: 'var(--page-accent)' }}
      >
        {url}
      </a>
    );
  }

  return (
    <div className="x-post-embed" style={{ minHeight: loaded ? 'auto' : '100px' }}>
      {!loaded && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--page-bg)',
            border: '1px solid var(--page-border)',
            color: 'var(--page-text-secondary)',
          }}
        >
          <span className="material-symbols-rounded text-sm">hourglass_empty</span>
          Loading post...
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
