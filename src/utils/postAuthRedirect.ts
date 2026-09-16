/**
 * Safe post-login destination. Only same-origin relative paths are allowed.
 */
export function getPostAuthRedirect(
  from?: { pathname?: string; search?: string } | null,
  search = ''
): string {
  const pathname = from?.pathname;
  if (isSafeInternalPath(pathname) && pathname !== '/login') {
    const extra = from?.search && from.search.startsWith('?') ? from.search : '';
    return `${pathname}${extra}`;
  }

  const next = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('next');
  if (isSafeInternalPath(next) && next !== '/login') {
    return next;
  }

  return '/';
}

function isSafeInternalPath(path: string | null | undefined): path is string {
  if (!path) return false;
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\');
}
