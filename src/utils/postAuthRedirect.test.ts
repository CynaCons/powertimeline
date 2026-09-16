import { describe, expect, it } from 'vitest';
import { getPostAuthRedirect } from './postAuthRedirect';

describe('getPostAuthRedirect', () => {
  it('preserves browse?create=1 from location state', () => {
    expect(
      getPostAuthRedirect({ pathname: '/browse', search: '?create=1' })
    ).toBe('/browse?create=1');
  });

  it('rejects open redirects', () => {
    expect(getPostAuthRedirect({ pathname: 'https://evil.example' })).toBe('/');
    expect(getPostAuthRedirect({ pathname: '//evil.example' })).toBe('/');
    expect(getPostAuthRedirect(null, '?next=https://evil.example')).toBe('/');
  });

  it('accepts a relative next query param', () => {
    expect(getPostAuthRedirect(null, '?next=/browse?create=1')).toBe('/browse?create=1');
  });
});
