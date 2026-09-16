import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, expect, it, vi } from 'vitest';
import { ToolIntentPage } from './ToolIntentPage';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, userProfile: null, loading: false }),
}));

function renderPage(slug: 'timeline-maker' | 'timelinejs-alternative' | 'frise-chronologique') {
  return render(
    <HelmetProvider>
      <MemoryRouter>
        <ToolIntentPage slug={slug} />
      </MemoryRouter>
    </HelmetProvider>
  );
}

describe('ToolIntentPage', () => {
  it('renders timeline-maker outline, create CTA, and iPhone demo', () => {
    renderPage('timeline-maker');
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Free timeline maker for timelines people can explore',
      })
    ).toBeTruthy();
    expect(screen.getByTestId('tool-intent-cta-create')).toBeTruthy();
    expect(screen.getByTestId('tool-intent-demo-link').getAttribute('href')).toBe(
      'https://powertimeline.com/cynacons/timeline/iphone-milestones'
    );
    expect(screen.getByText(/TODO: product truth — auth/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'TimelineJS alternative' })).toBeTruthy();
  });

  it('renders TimelineJS compare table and React demo', () => {
    renderPage('timelinejs-alternative');
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'A TimelineJS alternative built for denser, living timelines',
      })
    ).toBeTruthy();
    expect(screen.getByRole('table', { name: /TimelineJS vs PowerTimeline/i })).toBeTruthy();
    expect(screen.getByTestId('tool-intent-demo-link').getAttribute('href')).toBe(
      'https://powertimeline.com/cynacons/timeline/react-versions'
    );
  });

  it('renders French page with WC2022 demo and no FIFA marks', () => {
    renderPage('frise-chronologique');
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Frise chronologique en ligne/,
      })
    ).toBeTruthy();
    expect(screen.getByTestId('tool-intent-demo-link').getAttribute('href')).toBe(
      'https://powertimeline.com/cynacons/timeline/world-cup-2022'
    );
    expect(document.body.textContent?.toLowerCase()).not.toContain('fifa');
  });
});
